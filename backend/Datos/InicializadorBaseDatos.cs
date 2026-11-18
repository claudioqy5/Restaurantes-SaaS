using Microsoft.EntityFrameworkCore;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Datos;

public static class InicializadorBaseDatos
{
    public static async Task InicializarAsync(RestauranteDbContext db)
    {
        // Aseguramos que la base de datos esté creada
        await db.Database.EnsureCreatedAsync();

        // 1. Crear SuperAdmin si no existe
        if (!await db.Usuarios.IgnoreQueryFilters().AnyAsync(u => u.Rol == RolUsuario.SuperAdmin))
        {
            var superAdmin = new Usuario
            {
                Id = Guid.NewGuid(),
                Nombres = "Super",
                Apellidos = "Administrador SaaS",
                Correo = "admin@saasresto.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Rol = RolUsuario.SuperAdmin,
                InquilinoId = null,
                SucursalId = null,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.Usuarios.Add(superAdmin);
            await db.SaveChangesAsync();
        }

        // 2. Crear Inquilino Demo si no existe
        var inquilinoDemo = await db.Inquilinos.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Subdominio == "demo");
        if (inquilinoDemo == null)
        {
            inquilinoDemo = new Inquilino
            {
                Id = Guid.NewGuid(),
                RazonSocial = "GASTRONOMIA DEMO S.A.C.",
                NombreComercial = "Restaurante Gourmet La Casona",
                Ruc = "20601234567",
                Subdominio = "demo",
                DireccionFiscal = "Av. La Marina 1234, Lima",
                Telefono = "+51 987654321",
                CorreoContacto = "contacto@restodemo.com",
                LimiteSucursales = 5,
                LimiteUsuarios = 15,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.Inquilinos.Add(inquilinoDemo);
            await db.SaveChangesAsync();

            // 3. Crear Sucursales para el Inquilino Demo
            var sucursalMiraflores = new Sucursal
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                Codigo = "SUC-01",
                Nombre = "Sede Miraflores (Principal)",
                Direccion = "Av. Larco 742, Miraflores",
                Telefono = "+51 987654321",
                EsPrincipal = true,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            var sucursalSanIsidro = new Sucursal
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                Codigo = "SUC-02",
                Nombre = "Sede San Isidro",
                Direccion = "Av. Conquistadores 450, San Isidro",
                Telefono = "+51 987654322",
                EsPrincipal = false,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.Sucursales.AddRange(sucursalMiraflores, sucursalSanIsidro);

            // 4. Crear Administrador y Trabajadores asignados por Sucursal
            var adminRestaurante = new Usuario
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id, // Supervisión con sede base
                Nombres = "Carlos",
                Apellidos = "Mendoza (Dueño / Gerente)",
                Correo = "gerente@demo.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Rol = RolUsuario.AdminRestaurante,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            // Trabajadores de Sede Miraflores
            var meseroMiraflores = new Usuario
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id, // Asignado a Miraflores
                Nombres = "Juan",
                Apellidos = "Pérez (Mesero Miraflores)",
                Correo = "mesero@demo.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Rol = RolUsuario.Mesero,
                CreadoPorUsuarioId = adminRestaurante.Id,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            var cajeroMiraflores = new Usuario
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id, // Asignado a Miraflores
                Nombres = "Lucía",
                Apellidos = "Gómez (Cajera Miraflores)",
                Correo = "cajero@demo.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Rol = RolUsuario.Cajero,
                CreadoPorUsuarioId = adminRestaurante.Id,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            var cocineroMiraflores = new Usuario
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id, // Asignado a Miraflores
                Nombres = "Mario",
                Apellidos = "Chef (Cocina Miraflores)",
                Correo = "cocina@demo.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Rol = RolUsuario.Cocinero,
                CreadoPorUsuarioId = adminRestaurante.Id,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            // Trabajador de Sede San Isidro
            var meseroSanIsidro = new Usuario
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalSanIsidro.Id, // Asignado a San Isidro
                Nombres = "Pedro",
                Apellidos = "Ramírez (Mesero San Isidro)",
                Correo = "mesero.si@demo.com",
                ClaveHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
                Rol = RolUsuario.Mesero,
                CreadoPorUsuarioId = adminRestaurante.Id,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.Usuarios.AddRange(adminRestaurante, meseroMiraflores, cajeroMiraflores, cocineroMiraflores, meseroSanIsidro);

            // 5. Crear Zonas y Mesas por Sucursal
            var zonaPrincipalMiraflores = new Zona
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id,
                Nombre = "Salón Principal Miraflores",
                Activo = true
            };
            var zonaTerrazaMiraflores = new Zona
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id,
                Nombre = "Terraza Miraflores",
                Activo = true
            };

            var zonaSalonSanIsidro = new Zona
            {
                Id = Guid.NewGuid(),
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalSanIsidro.Id,
                Nombre = "Salón San Isidro",
                Activo = true
            };
            db.Zonas.AddRange(zonaPrincipalMiraflores, zonaTerrazaMiraflores, zonaSalonSanIsidro);

            // Mesas Miraflores
            db.Mesas.AddRange(
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaPrincipalMiraflores.Id, CodigoMesa = "M-01", CapacidadComensales = 4, Estado = EstadoMesa.Libre, PosicionX = 60, PosicionY = 60 },
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaPrincipalMiraflores.Id, CodigoMesa = "M-02", CapacidadComensales = 4, Estado = EstadoMesa.Ocupada, PosicionX = 220, PosicionY = 60 },
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaPrincipalMiraflores.Id, CodigoMesa = "M-03", CapacidadComensales = 6, Estado = EstadoMesa.EsperandoCuenta, PosicionX = 380, PosicionY = 60 },
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaTerrazaMiraflores.Id, CodigoMesa = "T-01", CapacidadComensales = 2, Estado = EstadoMesa.Libre, PosicionX = 80, PosicionY = 80 }
            );

            // Mesas San Isidro
            db.Mesas.AddRange(
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaSalonSanIsidro.Id, CodigoMesa = "SI-01", CapacidadComensales = 4, Estado = EstadoMesa.Libre, PosicionX = 70, PosicionY = 70 },
                new Mesa { InquilinoId = inquilinoDemo.Id, ZonaId = zonaSalonSanIsidro.Id, CodigoMesa = "SI-02", CapacidadComensales = 6, Estado = EstadoMesa.Libre, PosicionX = 240, PosicionY = 70 }
            );

            // 6. Unidades de Medida e Insumos
            var kg = new UnidadMedida { InquilinoId = inquilinoDemo.Id, Codigo = "KG", Nombre = "Kilogramos", FactorAUnidadBase = 1 };
            var gr = new UnidadMedida { InquilinoId = inquilinoDemo.Id, Codigo = "GR", Nombre = "Gramos", FactorAUnidadBase = 0.001m };
            var und = new UnidadMedida { InquilinoId = inquilinoDemo.Id, Codigo = "UND", Nombre = "Unidades", FactorAUnidadBase = 1 };
            var lt = new UnidadMedida { InquilinoId = inquilinoDemo.Id, Codigo = "LT", Nombre = "Litros", FactorAUnidadBase = 1 };
            db.UnidadesMedida.AddRange(kg, gr, und, lt);

            var lomoFino = new Insumo { InquilinoId = inquilinoDemo.Id, CodigoInterno = "INS-001", Nombre = "Lomo Fino de Res", UnidadMedidaId = kg.Id, StockActual = 25.5m, StockMinimo = 5m, CostoPromedioUnitario = 38.00m };
            var papaAmarilla = new Insumo { InquilinoId = inquilinoDemo.Id, CodigoInterno = "INS-002", Nombre = "Papa Amarilla", UnidadMedidaId = kg.Id, StockActual = 60m, StockMinimo = 10m, CostoPromedioUnitario = 3.50m };
            var cebollaRoja = new Insumo { InquilinoId = inquilinoDemo.Id, CodigoInterno = "INS-003", Nombre = "Cebolla Roja", UnidadMedidaId = kg.Id, StockActual = 30m, StockMinimo = 5m, CostoPromedioUnitario = 2.80m };
            db.Insumos.AddRange(lomoFino, papaAmarilla, cebollaRoja);

            // 7. Categorías y Platos
            var catFondos = new CategoriaPlato { InquilinoId = inquilinoDemo.Id, Nombre = "Platos de Fondo", Icono = "Utensils", OrdenVisual = 1 };
            db.CategoriasPlatos.Add(catFondos);

            var lomoSaltado = new Plato
            {
                InquilinoId = inquilinoDemo.Id,
                CategoriaPlatoId = catFondos.Id,
                Codigo = "PLT-001",
                Nombre = "Lomo Saltado Criollo",
                Descripcion = "Trozos de lomo fino salteados al wok con cebolla, tomate y ají amarillo, servido con papas fritas y arroz.",
                PrecioVenta = 48.00m,
                CostoEstimado = 14.50m,
                EstaDisponible = true
            };
            db.Platos.Add(lomoSaltado);

            // Receta para Lomo Saltado
            var recetaLomo = new Receta
            {
                InquilinoId = inquilinoDemo.Id,
                PlatoId = lomoSaltado.Id,
                RendimientoPorciones = 1,
                IndicacionesPreparacion = "Saltear a fuego vivo en wok con llama alta."
            };
            db.Recetas.Add(recetaLomo);

            db.DetallesRecetas.AddRange(
                new DetalleReceta { InquilinoId = inquilinoDemo.Id, RecetaId = recetaLomo.Id, InsumoId = lomoFino.Id, CantidadNecesaria = 0.220m, UnidadMedidaId = kg.Id },
                new DetalleReceta { InquilinoId = inquilinoDemo.Id, RecetaId = recetaLomo.Id, InsumoId = cebollaRoja.Id, CantidadNecesaria = 0.120m, UnidadMedidaId = kg.Id },
                new DetalleReceta { InquilinoId = inquilinoDemo.Id, RecetaId = recetaLomo.Id, InsumoId = papaAmarilla.Id, CantidadNecesaria = 0.200m, UnidadMedidaId = kg.Id }
            );

            // 8. Cajas por Sucursal
            var cajaMiraflores = new Caja
            {
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalMiraflores.Id,
                Nombre = "Caja Principal Miraflores",
                Activo = true
            };
            var cajaSanIsidro = new Caja
            {
                InquilinoId = inquilinoDemo.Id,
                SucursalId = sucursalSanIsidro.Id,
                Nombre = "Caja Principal San Isidro",
                Activo = true
            };
            db.Cajas.AddRange(cajaMiraflores, cajaSanIsidro);

            await db.SaveChangesAsync();
        }
    }
}
