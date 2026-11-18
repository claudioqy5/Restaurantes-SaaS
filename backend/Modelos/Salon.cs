namespace Restaurante.Api.Modelos;

public class Zona : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    
    // Cada zona pertenece a una Sucursal física específica
    public Guid SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty; // ej: "Salón Principal", "Terraza", "VIP", "Bar"
    public ICollection<Mesa> Mesas { get; set; } = new List<Mesa>();
}

public class Mesa : EntidadBase, IEntidadInquilino
{
    public Guid InquilinoId { get; set; }
    public Guid ZonaId { get; set; }
    public Zona Zona { get; set; } = null!;

    public string CodigoMesa { get; set; } = string.Empty; // ej: "M-01", "T-04"
    public int CapacidadComensales { get; set; } = 4;
    public EstadoMesa Estado { get; set; } = EstadoMesa.Libre;

    // Coordenadas relativas para el plano gráfico e interactivo del salón
    public double PosicionX { get; set; } = 50;
    public double PosicionY { get; set; } = 50;

    public ICollection<Comanda> Comandas { get; set; } = new List<Comanda>();
}
