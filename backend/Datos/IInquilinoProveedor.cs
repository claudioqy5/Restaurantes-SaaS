namespace Restaurante.Api.Datos;

public interface IInquilinoProveedor
{
    Guid? ObtenerInquilinoId();
    Guid? ObtenerSucursalId();
    Guid? ObtenerUsuarioId();
    string? ObtenerRol();
    bool EsSuperAdmin();
    void EstablecerInquilinoId(Guid inquilinoId);
    void EstablecerSucursalId(Guid sucursalId);
}
