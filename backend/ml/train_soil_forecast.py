"""Trains a PyTorch 1D-CNN + GRU 7-day soil moisture & ESI forecaster and exports soil_forecast.onnx."""

from pathlib import Path
import numpy as np
import onnxruntime as ort
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "soil_sequences.npz"
OUTPUT_PATH = ML_DIR.parent / "src" / "FarmFlow.Api" / "Infrastructure" / "Ml" / "Models" / "soil_forecast.onnx"


class SoilForecastNet(nn.Module):
    def __init__(self, input_mean: torch.Tensor, input_std: torch.Tensor) -> None:
        super().__init__()
        self.register_buffer("input_mean", input_mean)
        self.register_buffer("input_std", input_std)

        self.conv = nn.Sequential(
            nn.Conv1d(in_channels=4, out_channels=24, kernel_size=3, padding=1),
            nn.ReLU(),
        )
        self.gru = nn.GRU(input_size=24, hidden_size=32, num_layers=1, batch_first=True)
        self.head = nn.Sequential(
            nn.Linear(32, 32),
            nn.ReLU(),
            nn.Linear(32, 7 * 2),
            nn.Sigmoid(),
        )

    def forward(self, sequence_input: torch.Tensor) -> torch.Tensor:
        normalized = (sequence_input - self.input_mean) / self.input_std
        conv_out = self.conv(normalized.transpose(1, 2)).transpose(1, 2)
        _, hidden = self.gru(conv_out)
        flat = self.head(hidden[-1])
        return flat.view(-1, 7, 2)


def main() -> None:
    torch.manual_seed(42)
    npz = np.load(DATA_PATH)
    x_all = npz["inputs"].astype(np.float32)
    y_all = npz["targets"].astype(np.float32)

    split = int(0.8 * len(x_all))
    x_train, x_val = torch.from_numpy(x_all[:split]), torch.from_numpy(x_all[split:])
    y_train, y_val = torch.from_numpy(y_all[:split]), torch.from_numpy(y_all[split:])

    mean = x_train.mean(dim=(0, 1), keepdim=True)
    std = x_train.std(dim=(0, 1), keepdim=True).clamp(min=1e-5)

    model = SoilForecastNet(mean, std)
    optimizer = torch.optim.Adam(model.parameters(), lr=3e-3)
    loss_fn = nn.MSELoss()

    loader = DataLoader(TensorDataset(x_train, y_train), batch_size=64, shuffle=True)
    for epoch in range(25):
        model.train()
        for bx, by in loader:
            optimizer.zero_grad()
            pred = model(bx)
            loss = loss_fn(pred, by)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        val_pred = model(x_val)
        val_mae = float(torch.mean(torch.abs(val_pred - y_val)))
    print(f"Soil Forecast validation MAE (sm_rootzone & esi): {val_mae:.4f}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    dummy_input = torch.from_numpy(x_all[:1])
    torch.onnx.export(
        model,
        dummy_input,
        str(OUTPUT_PATH),
        input_names=["sequence_input"],
        output_names=["forecast_output"],
        dynamic_axes={
            "sequence_input": {0: "batch"},
            "forecast_output": {0: "batch"},
        },
        opset_version=17,
        dynamo=False,
    )

    session = ort.InferenceSession(str(OUTPUT_PATH), providers=["CPUExecutionProvider"])
    ort_out = session.run(["forecast_output"], {"sequence_input": x_all[:1]})[0]
    with torch.no_grad():
        torch_out = model(dummy_input).numpy()
    max_diff = float(np.max(np.abs(ort_out - torch_out)))
    print(f"Exported {OUTPUT_PATH} | ORT output shape={ort_out.shape}, max_diff={max_diff:.6f}")


if __name__ == "__main__":
    main()
