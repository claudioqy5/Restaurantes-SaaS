using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Datos;

public class RestauranteDbContext : DbContext
{
    private readonly IInquilinoProveedor _inquilinoProveedor;

    public Guid InquilinoActualId => _inquilinoProveedor.ObtenerInquilinoId() ?? Guid.Empty;
    public bool EsSuperAdmin => _inquilinoProveedor.EsSuperAdmin();

    public RestauranteDbContext(
        DbContextOptions<RestauranteDbContext> options,
        IInquilinoProveedor inquilinoProveedor) : base(options)
    {
        _inquilinoProveedor = inquilinoProveedor;
    }

    public DbSet<Inquilino> Inquilinos => Set<Inquilino>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Mesa> Mesas => Set<Mesa>();
    public DbSet<UnidadMedida> UnidadesMedida => Set<UnidadMedida>();
    public DbSet<Insumo> Insumos => Set<Insumo>();
    public DbSet<CategoriaPlato> CategoriasPlatos => Set<CategoriaPlato>();
    public DbSet<Plato> Platos => Set<Plato>();
    public DbSet<Receta> Recetas => Set<Receta>();
    public DbSet<DetalleReceta> DetallesRecetas => Set<DetalleReceta>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<Comanda> Comandas => Set<Comanda>();
    public DbSet<DetalleComanda> DetallesComandas => Set<DetalleComanda>();
    public DbSet<Caja> Cajas => Set<Caja>();
    public DbSet<TurnoCaja> TurnosCajas => Set<TurnoCaja>();
    public DbSet<ComprobantePago> ComprobantesPago => Set<ComprobantePago>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Configuración de Filtros Globales Multi-Tenant
        foreach (var tipoEntidad in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IEntidadInquilino).IsAssignableFrom(tipoEntidad.ClrType))
            {
                var metodoFiltro = typeof(RestauranteDbContext)
                    .GetMethod(nameof(ConfigurarFiltroInquilino), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.MakeGenericMethod(tipoEntidad.ClrType);

                metodoFiltro?.Invoke(this, new object[] { modelBuilder });
            }
        }

        // Filtro específico para Usuario (los SuperAdmins no tienen InquilinoId)
        modelBuilder.Entity<Usuario>().HasQueryFilter(u => 
            u.Activo && (EsSuperAdmin || u.InquilinoId == InquilinoActualId));

        // 2. Relaciones y Llaves Foráneas con Restricción de Borrado para evitar ciclos en SQL Server
        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.CreadoPorUsuario)
            .WithMany()
            .HasForeignKey(u => u.CreadoPorUsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comanda>()
            .HasOne(c => c.Usuario)
            .WithMany(u => u.ComandasAtendidas)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ComprobantePago>()
            .HasOne(cp => cp.Usuario)
            .WithMany(u => u.ComprobantesEmitidos)
            .HasForeignKey(cp => cp.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TurnoCaja>()
            .HasOne(t => t.Usuario)
            .WithMany(u => u.TurnosOperados)
            .HasForeignKey(t => t.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Plato>()
            .HasOne(p => p.Receta)
            .WithOne(r => r.Plato)
            .HasForeignKey<Receta>(r => r.PlatoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comanda>()
            .HasOne(c => c.ComprobantePago)
            .WithOne(cp => cp.Comanda)
            .HasForeignKey<ComprobantePago>(cp => cp.ComandaId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Precisiones Decimales
        modelBuilder.Entity<Plato>().Property(p => p.PrecioVenta).HasPrecision(12, 2);
        modelBuilder.Entity<Plato>().Property(p => p.CostoEstimado).HasPrecision(12, 2);
        modelBuilder.Entity<Insumo>().Property(i => i.StockActual).HasPrecision(14, 4);
        modelBuilder.Entity<Insumo>().Property(i => i.StockMinimo).HasPrecision(14, 4);
        modelBuilder.Entity<Insumo>().Property(i => i.CostoPromedioUnitario).HasPrecision(14, 4);
        modelBuilder.Entity<DetalleReceta>().Property(d => d.CantidadNecesaria).HasPrecision(14, 4);
        modelBuilder.Entity<MovimientoInventario>().Property(m => m.Cantidad).HasPrecision(14, 4);
        modelBuilder.Entity<MovimientoInventario>().Property(m => m.CostoUnitario).HasPrecision(14, 4);
        modelBuilder.Entity<Comanda>().Property(c => c.Total).HasPrecision(12, 2);
        modelBuilder.Entity<DetalleComanda>().Property(d => d.PrecioUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<DetalleComanda>().Property(d => d.Subtotal).HasPrecision(12, 2);
        modelBuilder.Entity<TurnoCaja>().Property(t => t.MontoApertura).HasPrecision(12, 2);
        modelBuilder.Entity<TurnoCaja>().Property(t => t.MontoCierreDeclarado).HasPrecision(12, 2);
        modelBuilder.Entity<TurnoCaja>().Property(t => t.MontoCierreSistema).HasPrecision(12, 2);
        modelBuilder.Entity<TurnoCaja>().Property(t => t.Diferencia).HasPrecision(12, 2);
        modelBuilder.Entity<ComprobantePago>().Property(c => c.Total).HasPrecision(12, 2);
        modelBuilder.Entity<ComprobantePago>().Property(c => c.Gravadas).HasPrecision(12, 2);
        modelBuilder.Entity<ComprobantePago>().Property(c => c.Igv).HasPrecision(12, 2);

        // 4. Índices para alto desempeño
        modelBuilder.Entity<Inquilino>().HasIndex(i => i.Subdominio).IsUnique();
        modelBuilder.Entity<Inquilino>().HasIndex(i => i.Ruc);
        modelBuilder.Entity<Usuario>().HasIndex(u => u.Correo).IsUnique();
        modelBuilder.Entity<Mesa>().HasIndex(m => new { m.InquilinoId, m.CodigoMesa });
        modelBuilder.Entity<Insumo>().HasIndex(i => new { i.InquilinoId, i.CodigoInterno });
        modelBuilder.Entity<Plato>().HasIndex(p => new { p.InquilinoId, p.Codigo });
    }

    private void ConfigurarFiltroInquilino<T>(ModelBuilder modelBuilder) where T : class, IEntidadInquilino
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => 
            ((EntidadBase)(object)e).Activo && (EsSuperAdmin || e.InquilinoId == InquilinoActualId));
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IEntidadInquilino>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.InquilinoId == Guid.Empty && InquilinoActualId != Guid.Empty)
                {
                    entry.Entity.InquilinoId = InquilinoActualId;
                }
            }
        }

        foreach (var entry in ChangeTracker.Entries<EntidadBase>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.FechaCreacion = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.FechaModificacion = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
