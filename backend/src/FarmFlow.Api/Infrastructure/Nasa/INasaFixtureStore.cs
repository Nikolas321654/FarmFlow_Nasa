using FarmFlow.Api.Infrastructure.Nasa.NasaModels;

namespace FarmFlow.Api.Infrastructure.Nasa;

public interface INasaFixtureStore
{
    NasaFixtureData GetFixture(string scenarioKey);
}
