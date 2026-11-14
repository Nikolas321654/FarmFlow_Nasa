"""Fetches historical NASA POWER observations for Ukrainian agro regions and prepares ML/DL datasets.

Usage:
    uv run prepare_dataset.py --start 20200101 --end 20261110
    uv run prepare_dataset.py --start 20260101 --end 20261110   # 2026-only observations
"""

import argparse
import io
import json
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen
import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "data"
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
OWID_BASE_URL = "https://ourworldindata.org/grapher"
MISSING_SENTINEL = -999.0

# Representative Ukrainian agricultural regions (lat, lon)
UKRAINE_REGIONS = [
    ("Cherkasy", 49.44, 32.06),
    ("Poltava", 49.59, 34.55),
    ("Vinnytsia", 49.23, 28.46),
    ("Mykolaiv", 47.05, 31.96),
    ("Odesa", 46.62, 30.73),
    ("Kharkiv", 49.99, 36.23),
    ("Dnipro", 48.46, 35.04),
    ("Kyiv", 50.25, 30.52),
]

# FAOSTAT-sourced crop yield series via Our World in Data (tonnes/ha, Ukraine)
OWID_CROP_SLUGS = {
    0: ("Wheat", "wheat-yields"),
    1: ("Corn", "maize-yields"),
    2: ("Sunflower", "sunflower-seed-yield"),
    3: ("Soy", "soybean-yields"),
}

# Target rootzone moisture & seasonal precip optima; base_yield is populated dynamically from OWID/FAOSTAT
CROP_SPECS = {
    0: {"name": "Wheat", "base_yield": 4.30, "target_sm": 0.45, "precip_opt": 65.0},
    1: {"name": "Corn", "base_yield": 6.81, "target_sm": 0.55, "precip_opt": 90.0},
    2: {"name": "Sunflower", "base_yield": 2.26, "target_sm": 0.40, "precip_opt": 50.0},
    3: {"name": "Soy", "base_yield": 2.40, "target_sm": 0.50, "precip_opt": 75.0},
}


def fetch_ukraine_yields_owid(min_year: int = 2020) -> tuple[dict[int, dict[int, float]], dict[int, float]]:
    """Fetch real annual Ukraine crop yields (t/ha) from Our World in Data (FAOSTAT)."""
    yearly_by_crop: dict[int, dict[int, float]] = {}
    mean_by_crop: dict[int, float] = {}

    for crop_id, (crop_name, slug) in OWID_CROP_SLUGS.items():
        url = f"{OWID_BASE_URL}/{slug}.csv?v=1&csvType=full&useColumnShortNames=true"
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 FarmFlow-ML/1.0"})
        with urlopen(req, timeout=20) as resp:  # noqa: S310
            df = pd.read_csv(io.BytesIO(resp.read()))

        ukr = df[(df["code"] == "UKR") & (df["year"] >= min_year)]
        value_col = [c for c in ukr.columns if c not in ("entity", "code", "year")][0]
        year_map = {int(row["year"]): float(row[value_col]) for _, row in ukr.iterrows()}
        yearly_by_crop[crop_id] = year_map
        mean_val = round(float(np.mean(list(year_map.values()))), 2)
        mean_by_crop[crop_id] = mean_val
        print(f"Fetched OWID/FAOSTAT {crop_name} yields for UKR ({min(year_map)}..{max(year_map)}), mean={mean_val:.2f} t/ha")

    return yearly_by_crop, mean_by_crop


def fetch_region_nasa_power(name: str, lat: float, lon: float, start: str, end: str) -> pd.DataFrame:
    url = (
        f"{NASA_POWER_URL}?parameters=PRECTOTCORR,GWETTOP,GWETROOT,ALLSKY_SFC_SW_DWN"
        f"&community=AG&longitude={lon}&latitude={lat}&start={start}&end={end}&format=JSON"
    )
    with urlopen(url, timeout=20) as resp:  # noqa: S310
        payload = json.loads(resp.read().decode("utf-8"))

    params = payload["properties"]["parameter"]
    dates = sorted(params["PRECTOTCORR"].keys())
    rows = []
    for d in dates:
        precip = float(params["PRECTOTCORR"][d])
        sm_top = float(params["GWETTOP"][d])
        sm_root = float(params["GWETROOT"][d])
        solar = float(params["ALLSKY_SFC_SW_DWN"][d])
        if min(precip, sm_top, sm_root, solar) <= MISSING_SENTINEL + 1.0:
            continue
        rows.append(
            {
                "region": name,
                "date": d,
                "precip": max(0.0, precip),
                "sm_top": float(np.clip(sm_top, 0.01, 0.99)),
                "sm_root": float(np.clip(sm_root, 0.01, 0.99)),
                "solar": max(0.5, solar),
            }
        )

    return pd.DataFrame(rows)


def derive_ndvi_and_esi(df: pd.DataFrame) -> pd.DataFrame:
    """Derive consistent vegetation (NDVI) and evaporative stress (ESI) aligned with FarmFlow formulas."""
    df = df.copy()
    month = pd.to_datetime(df["date"], format="%Y%m%d").dt.month
    seasonal = np.clip(np.sin(np.pi * (month - 3) / 7.0), 0.15, 1.0)
    df["ndvi"] = np.clip(0.22 + 0.45 * seasonal + 0.25 * df["sm_root"], 0.18, 0.92)
    df["esi"] = np.clip(0.25 + 0.80 * df["sm_root"] - 0.005 * np.maximum(0.0, df["solar"] - 18.0), 0.15, 0.96)
    return df


def build_datasets_from_nasa(
    region_frames: list[pd.DataFrame],
    yearly_yields: dict[int, dict[int, float]],
    mean_yields: dict[int, float],
    rng: np.random.Generator,
) -> tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    seq_inputs = []
    seq_targets = []
    yield_rows = []

    for raw_df in region_frames:
        if len(raw_df) < 35:
            continue
        df = derive_ndvi_and_esi(raw_df).reset_index(drop=True)
        arr_x = df[["precip", "sm_top", "sm_root", "solar"]].to_numpy(dtype=np.float32)
        arr_y = df[["sm_root", "esi"]].to_numpy(dtype=np.float32)

        # Sliding 21-day windows (14 input -> 7 target)
        for i in range(0, len(df) - 21 + 1, 2):
            seq_inputs.append(arr_x[i : i + 14])
            seq_targets.append(arr_y[i + 14 : i + 21])

        # Growing-season 30-day windows anchored to real annual Ukraine FAOSTAT/OWID yields
        for i in range(0, len(df) - 30 + 1, 7):
            win = df.iloc[i : i + 30]
            win_year = int(str(win.iloc[-1]["date"])[:4])
            acc_precip = float(win["precip"].sum())
            avg_root = float(win["sm_root"].mean())
            peak_ndvi = float(win["ndvi"].max())
            wdi = 1.0 - (0.6 * win["sm_root"] + 0.4 * win["esi"])
            stress_days = int((wdi > 0.65).sum())

            for crop_id, spec in CROP_SPECS.items():
                annual_anchor = yearly_yields.get(crop_id, {}).get(
                    win_year,
                    mean_yields.get(crop_id, spec["base_yield"]),
                )
                moisture_deficit = max(0.0, spec["target_sm"] - avg_root)
                sm_factor = 1.0 - 1.35 * (avg_root - spec["target_sm"]) ** 2 - 0.45 * moisture_deficit
                ndvi_factor = 0.72 + 0.42 * peak_ndvi
                precip_factor = 1.0 - 0.00004 * (acc_precip - spec["precip_opt"]) ** 2
                stress_penalty = max(0.55, 1.0 - 0.018 * stress_days)
                yield_t_ha = annual_anchor * sm_factor * ndvi_factor * precip_factor * stress_penalty
                yield_t_ha = float(np.clip(yield_t_ha + rng.normal(0.0, 0.18), 0.8, 12.5))

                yield_rows.append(
                    {
                        "crop_type_id": crop_id,
                        "accumulated_precip_mm": round(acc_precip, 2),
                        "avg_rootzone_moisture": round(avg_root, 4),
                        "peak_ndvi": round(peak_ndvi, 4),
                        "stress_days_count": stress_days,
                        "yield_tons_per_ha": round(yield_t_ha, 3),
                    }
                )

    return pd.DataFrame(yield_rows), np.asarray(seq_inputs, dtype=np.float32), np.asarray(seq_targets, dtype=np.float32)


def generate_offline_fallback(rng: np.random.Generator) -> tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    """Deterministic physical fallback when NASA POWER is unreachable offline."""
    seq_inputs = np.zeros((1600, 14, 4), dtype=np.float32)
    seq_targets = np.zeros((1600, 7, 2), dtype=np.float32)
    for idx in range(1600):
        sm_top = float(rng.uniform(0.18, 0.55))
        sm_root = float(rng.uniform(0.20, 0.60))
        rain_prob = float(rng.uniform(0.05, 0.35))
        base_rad = float(rng.uniform(11.0, 22.0))
        history = np.zeros((21, 4), dtype=np.float32)
        esi_series = np.zeros(21, dtype=np.float32)
        for day in range(21):
            precip = float(np.clip(rng.exponential(8.0) if rng.random() < rain_prob else 0.0, 0.0, 45.0))
            solar = float(np.clip(base_rad * (0.55 if precip > 3.0 else 1.0) + rng.normal(0.0, 2.0), 4.0, 28.0))
            et_loss = 0.0011 * solar * (0.4 + 0.6 * sm_root)
            sm_top = float(np.clip(sm_top + 0.015 * precip - 1.6 * et_loss + rng.normal(0.0, 0.008), 0.10, 0.72))
            sm_root = float(np.clip(sm_root + 0.12 * max(0.0, sm_top - sm_root) - 0.85 * et_loss + rng.normal(0.0, 0.004), 0.12, 0.70))
            esi = float(np.clip(0.25 + 0.85 * sm_root - 0.006 * max(0.0, solar - 18.0) + rng.normal(0.0, 0.015), 0.15, 0.96))
            history[day] = [precip, sm_top, sm_root, solar]
            esi_series[day] = esi
        seq_inputs[idx] = history[:14]
        seq_targets[idx, :, 0] = history[14:, 2]
        seq_targets[idx, :, 1] = esi_series[14:]

    yield_rows = []
    for _ in range(2400):
        crop_id = int(rng.integers(0, 4))
        spec = CROP_SPECS[crop_id]
        acc_precip = float(np.clip(rng.normal(spec["precip_opt"], 30.0), 5.0, 180.0))
        avg_root = float(np.clip(rng.normal(spec["target_sm"] - 0.03, 0.11), 0.14, 0.78))
        peak_ndvi = float(np.clip(0.35 + 0.55 * avg_root + rng.normal(0.0, 0.06), 0.25, 0.92))
        stress_days = int(np.clip(round(max(0.0, spec["target_sm"] - avg_root) * 55.0 + rng.normal(0.0, 2.0)), 0, 28))
        sm_factor = 1.0 - 1.35 * (avg_root - spec["target_sm"]) ** 2 - 0.45 * max(0.0, spec["target_sm"] - avg_root)
        yield_t_ha = spec["base_yield"] * sm_factor * (0.72 + 0.42 * peak_ndvi) * (1.0 - 0.00004 * (acc_precip - spec["precip_opt"]) ** 2) * max(0.55, 1.0 - 0.018 * stress_days)
        yield_rows.append(
            {
                "crop_type_id": crop_id,
                "accumulated_precip_mm": round(acc_precip, 2),
                "avg_rootzone_moisture": round(avg_root, 4),
                "peak_ndvi": round(peak_ndvi, 4),
                "stress_days_count": stress_days,
                "yield_tons_per_ha": round(float(np.clip(yield_t_ha + rng.normal(0.0, 0.22), 0.8, 12.5)), 3),
            }
        )
    return pd.DataFrame(yield_rows), seq_inputs, seq_targets


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare FarmFlow ML datasets from NASA POWER.")
    parser.add_argument("--start", default="20200101", help="Start date YYYYMMDD (e.g. 20260101 for 2026-only)")
    parser.add_argument("--end", default="20261110", help="End date YYYYMMDD")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)

    region_frames: list[pd.DataFrame] = []
    try:
        yearly_yields, mean_yields = fetch_ukraine_yields_owid(min_year=2020)
        for name, lat, lon in UKRAINE_REGIONS:
            df_region = fetch_region_nasa_power(name, lat, lon, args.start, args.end)
            print(f"Fetched {len(df_region)} valid NASA POWER days for {name} ({args.start}..{args.end})")
            region_frames.append(df_region)
        yield_df, seq_x, seq_y = build_datasets_from_nasa(region_frames, yearly_yields, mean_yields, rng)
        source_label = f"NASA POWER + OWID/FAOSTAT ({args.start}..{args.end})"
    except (URLError, TimeoutError, KeyError, ValueError) as exc:
        print(f"NASA POWER fetch unavailable ({exc}); falling back to calibrated offline generator.")
        yield_df, seq_x, seq_y = generate_offline_fallback(rng)
        source_label = "Offline Fallback"

    yield_path = DATA_DIR / "yield_training.csv"
    seq_path = DATA_DIR / "soil_sequences.npz"
    yield_df.to_csv(yield_path, index=False)
    np.savez_compressed(seq_path, inputs=seq_x, targets=seq_y)

    print(f"[{source_label}] Saved {len(yield_df)} yield rows -> {yield_path}")
    print(f"[{source_label}] Saved {len(seq_x)} soil sequences {seq_x.shape} -> {seq_y.shape} -> {seq_path}")


if __name__ == "__main__":
    main()
