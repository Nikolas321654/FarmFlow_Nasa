using FarmFlow.Api.Infrastructure.Database.Entities;
using FarmFlow.Api.Infrastructure.Nasa.NasaModels;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace FarmFlow.Api.Infrastructure.Ml;

public sealed class OnnxModelRegistry : IDisposable
{
    public const string YieldModelFileName = "yield_model.onnx";
    public const string SoilForecastModelFileName = "soil_forecast.onnx";
    public const int SoilSequenceLength = 14;
    public const int SoilForecastDays = 7;

    private readonly InferenceSession _yieldSession;
    private readonly InferenceSession _soilSession;

    public OnnxModelRegistry()
    {
        var modelsDirectory = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Ml", "Models");
        var yieldPath = Path.Combine(modelsDirectory, YieldModelFileName);
        var soilPath = Path.Combine(modelsDirectory, SoilForecastModelFileName);

        if (!File.Exists(yieldPath))
        {
            throw new FileNotFoundException($"Missing ONNX yield model at '{yieldPath}'.", yieldPath);
        }

        if (!File.Exists(soilPath))
        {
            throw new FileNotFoundException($"Missing ONNX soil forecast model at '{soilPath}'.", soilPath);
        }

        _yieldSession = new InferenceSession(yieldPath);
        _soilSession = new InferenceSession(soilPath);
    }

    public double PredictYield(
        CropType cropType,
        double accumulatedPrecipMm30d,
        double avgRootzoneMoisture30d,
        double peakNdvi30d,
        int stressDaysCount30d)
    {
        float[] buffer =
        [
            (float)cropType,
            (float)accumulatedPrecipMm30d,
            (float)avgRootzoneMoisture30d,
            (float)peakNdvi30d,
            stressDaysCount30d
        ];
        var input = new DenseTensor<float>(buffer, [1, 5]);

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input", input)
        };

        using var results = _yieldSession.Run(inputs);
        var rawOutput = results[0].AsTensor<float>();
        return Math.Round(Math.Clamp(rawOutput[0], 0.1f, 20.0f), 2);
    }

    public IReadOnlyList<(double RootzoneMoisture, double Esi)> ForecastSoil7Days(
        IReadOnlyList<NasaDailyMetric> sequence14Days)
    {
        if (sequence14Days.Count != SoilSequenceLength)
        {
            throw new ArgumentException(
                $"Soil forecast requires exactly {SoilSequenceLength} daily observations.",
                nameof(sequence14Days));
        }

        var buffer = new float[SoilSequenceLength * 4];
        for (var i = 0; i < SoilSequenceLength; i++)
        {
            var day = sequence14Days[i];
            var offset = i * 4;
            buffer[offset] = (float)day.PrecipitationMm;
            buffer[offset + 1] = (float)day.SurfaceMoisture;
            buffer[offset + 2] = (float)day.RootzoneMoisture;
            buffer[offset + 3] = (float)day.SolarRadiation;
        }

        var input = new DenseTensor<float>(buffer, [1, SoilSequenceLength, 4]);
        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("sequence_input", input)
        };

        using var results = _soilSession.Run(inputs);
        var output = results[0].AsTensor<float>();

        var forecast = new List<(double RootzoneMoisture, double Esi)>(SoilForecastDays);
        for (var dayIndex = 0; dayIndex < SoilForecastDays; dayIndex++)
        {
            var smRoot = Math.Round(Math.Clamp(output[0, dayIndex, 0], 0.05, 0.95), 3);
            var esi = Math.Round(Math.Clamp(output[0, dayIndex, 1], 0.05, 0.98), 3);
            forecast.Add((smRoot, esi));
        }

        return forecast;
    }

    public void Dispose()
    {
        _yieldSession.Dispose();
        _soilSession.Dispose();
    }
}
