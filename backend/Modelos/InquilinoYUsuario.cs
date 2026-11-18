namespace Restaurante.Api.Modelos;

public class Inquilino : EntidadBase
{
    public string RazonSocial { get; set; } = string.Empty;
    public string NombreComercial { get; set; } = string.Empty;
    public string Ruc { get; set; } = string.Empty;
    public string Subdominio { get; set; } = string.Empty; // ej: "donluigi" -> donluigi.posresto.com
    public string? DireccionFiscal { get; set; }
    public string? Telefono { get; set; }
    public string? CorreoContacto { get; set; }
    public string? LogoUrl { get; set; }
    public bool BloqueadoPorMora { get; set; } = false;

    // Facturación Electrónica SUNAT con APIs Perú
    public bool EmisionElectronicaActiva { get; set; } = false;
    public string? ApisPeruToken { get; set; }
    public string? Ubigeo { get; set; } = "150101";
    public string? Departamento { get; set; } = "LIMA";
    public string? Provincia { get; set; } = "LIMA";
    public string? Distrito { get; set; } = "LIMA";

    // Restricciones de Plan SaaS configuradas por SuperAdmin (null o 0 = Ilimitado)
    public int? LimiteSucursales { get; set; } = 1; // Por defecto 1 sede
    public int? LimiteUsuarios { get; set; } = 5; // Por defecto 5 empleados

    // Relaciones Multi-Sucursal y Usuarios
    public ICollection<Sucursal> Sucursales { get; set; } = new List<Sucursal>();
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

public class Sucursal : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Inquilino Inquilino { get; set; } = null!;

    public string Codigo { get; set; } = string.Empty; // ej: "SUC-01", "SUC-02"
    public string Nombre { get; set; } = string.Empty; // ej: "Sede Principal - Miraflores", "Sede San Isidro"
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public bool EsPrincipal { get; set; } = false;

    // Código de local anexo registrado ante SUNAT (0000 para matriz principal)
    public string CodigoLocalSunat { get; set; } = "0000";

    // Relaciones por Sucursal
    public ICollection<Usuario> UsuariosAsignados { get; set; } = new List<Usuario>();
    public ICollection<Zona> Zonas { get; set; } = new List<Zona>();
    public ICollection<Caja> Cajas { get; set; } = new List<Caja>();
    public ICollection<Comanda> Comandas { get; set; } = new List<Comanda>();
}

public class Usuario : EntidadBase
{
    // Nulable para SuperAdmin
    public Guid? InquilinoId { get; set; }
    public Inquilino? Inquilino { get; set; }

    // Sucursal a la que está asignado el empleado (Cajero, Mesero, Cocinero).
    public Guid? SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }

    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string ClaveHash { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public RolUsuario Rol { get; set; }

    // Auditoría y Trazabilidad de creación
    public Guid? CreadoPorUsuarioId { get; set; }
    public Usuario? CreadoPorUsuario { get; set; }

    // Ventas y Operaciones registradas por este usuario
    public ICollection<Comanda> ComandasAtendidas { get; set; } = new List<Comanda>();
    public ICollection<ComprobantePago> ComprobantesEmitidos { get; set; } = new List<ComprobantePago>();
    public ICollection<TurnoCaja> TurnosOperados { get; set; } = new List<TurnoCaja>();
}
