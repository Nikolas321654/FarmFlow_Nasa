namespace FarmFlow.Api.Features.Fields;

public static class FieldsEndpoints
{
    public static IEndpointRouteBuilder MapFieldsEndpoints(this IEndpointRouteBuilder app)
    {
        CreateField.MapEndpoint(app);
        GetFields.MapEndpoint(app);
        GetFieldById.MapEndpoint(app);
        DeleteField.MapEndpoint(app);
        return app;
    }
}
