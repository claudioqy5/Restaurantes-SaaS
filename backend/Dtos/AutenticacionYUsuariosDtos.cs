using Restaurante.Api.Modelos;

namespace Restaurante.Api.Dtos;

public record LoginPeticionDto(string Correo, string Clave);

public record LoginRespuestaDto(
    string Token,
    Guid UsuarioId,
    string Nombres,
    string Apellidos,
    string Correo,
    RolUsuario Rol,
    Guid? InquilinoId,
    string? NombreRestaurante,
    string? Subdominio,
    Guid? SucursalId,
    string? NombreSucursal
);

public record CrearInquilinoDto(
    string RazonSocial,
    string NombreComercial,
    string Ruc,
    string Subdominio,
    string? DireccionFiscal,
    string? Telefono,
    string? CorreoContacto,
    string? NombreSucursalPrincipal,
    string NombresAdmin,
    string ApellidosAdmin,
    string CorreoAdmin,
    string ClaveAdmin,
    int? LimiteSucursales = 1,
    int? LimiteUsuarios = 5
);

public record InquilinoResumenDto(
    Guid Id,
    string RazonSocial,
    string NombreComercial,
    string Ruc,
    string Subdominio,
    string? DireccionFiscal,
    string? Telefono,
    string? CorreoContacto,
    bool BloqueadoPorMora,
    bool Activo,
    int TotalSucursales,
    int TotalUsuarios,
    int? LimiteSucursales,
    int? LimiteUsuarios,
    DateTime FechaCreacion
);

public record ActualizarInquilinoDto(
    string RazonSocial,
    string NombreComercial,
    string Ruc,
    string Subdominio,
    string? DireccionFiscal,
    string? Telefono,
    string? CorreoContacto,
    int? LimiteSucursales,
    int? LimiteUsuarios,
    string? NuevaClaveAdmin = null
);

public record ResetearClaveDto(string NuevaClave);

public record ActualizarLimitesPlanDto(
    int? LimiteSucursales,
    int? LimiteUsuarios
);

public record EstadoPlanInquilinoDto(
    int SucursalesActuales,
    int? LimiteSucursales,
    bool LimiteSucursalesAlcanzado,
    int UsuariosActuales,
    int? LimiteUsuarios,
    bool LimiteUsuariosAlcanzado
);

public record CrearSucursalDto(
    string Codigo,
    string Nombre,
    string? Direccion,
    string? Telefono
);

public record SucursalResumenDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Direccion,
    string? Telefono,
    bool EsPrincipal,
    int TotalZonas,
    int TotalMesas,
    int TotalTrabajadores,
    bool Activo
);

public record CrearUsuarioEmpleadoDto(
    string Nombres,
    string Apellidos,
    string Correo,
    string Clave,
    string? Telefono,
    RolUsuario Rol,
    Guid? SucursalId // Asignación obligatoria a la sucursal donde labora el trabajador
);

public record UsuarioResumenDto(
    Guid Id,
    string Nombres,
    string Apellidos,
    string Correo,
    string? Telefono,
    RolUsuario Rol,
    Guid? SucursalId,
    string? NombreSucursal,
    bool Activo,
    DateTime FechaCreacion,
    string? CreadoPor,
    int ComandasAtendidas,
    int VentasCobradas,
    decimal TotalVendido
);
