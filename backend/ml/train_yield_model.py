"""Trains the tabular crop yield regressor and exports yield_model.onnx."""

from pathlib import Path
import numpy as np
import onnxruntime as ort
import pandas as pd
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "yield_training.csv"
OUTPUT_PATH = ML_DIR.parent / "src" / "FarmFlow.Api" / "Infrastructure" / "Ml" / "Models" / "yield_model.onnx"

FEATURE_COLUMNS = [
    "crop_type_id",
    "accumulated_precip_mm",
    "avg_rootzone_moisture",
    "peak_ndvi",
    "stress_days_count",
]


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    x = df[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    y = df["yield_tons_per_ha"].to_numpy(dtype=np.float32)

    x_train, x_val, y_train, y_val = train_test_split(x, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(x_train, y_train)

    val_preds = model.predict(x_val)
    mae = mean_absolute_error(y_val, val_preds)
    r2 = r2_score(y_val, val_preds)
    print(f"Yield Regressor validation MAE: {mae:.3f} t/ha, R^2: {r2:.3f}")

    onnx_model = convert_sklearn(
        model,
        initial_types=[("input", FloatTensorType([None, 5]))],
        target_opset=17,
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_bytes(onnx_model.SerializeToString())

    session = ort.InferenceSession(str(OUTPUT_PATH), providers=["CPUExecutionProvider"])
    sample = x_val[:1]
    ort_pred = session.run(["variable"], {"input": sample})[0]
    sk_pred = model.predict(sample).reshape(1, 1)
    max_diff = float(np.max(np.abs(ort_pred - sk_pred)))
    print(f"Exported {OUTPUT_PATH} | ORT output shape={ort_pred.shape}, max_diff={max_diff:.6f}")


if __name__ == "__main__":
    main()
