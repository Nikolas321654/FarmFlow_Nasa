using Xunit;

namespace FarmFlow.Api.Tests.Integration;

[CollectionDefinition(Name)]
public sealed class PostgresIntegrationCollection : ICollectionFixture<FarmFlowWebFactory>
{
    public const string Name = "PostgresIntegration";
}
