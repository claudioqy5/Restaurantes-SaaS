# Sistema POS & Gestión Gastronómica Multi-Tenant (SaaS)

Plataforma integral para gestión de cadenas y restaurantes con arquitectura Multi-Tenant, facturación electrónica integrada con APIs Perú (SUNAT), sincronización de mesas y comandas en tiempo real vía WebSockets (SignalR) y control estricto de roles por sucursales.

---

## 1. Arquitectura del Sistema

* **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, SQL Server 2022, SignalR Hubs.
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React (iconografía SVG), Zustand, TanStack Query.
* **Seguridad:** Aislamiento de datos por `InquilinoId` con Global Query Filters automáticos, JWT Bearer y control de acceso basado en roles (SuperAdmin, Administrador, Cajero, Mozo, Cocinero).
* **Facturación Electrónica:** APIs Perú (UBL 2.1 SUNAT) con descarga directa de XML, CDR y PDF.
* **Despliegue:** Contenedores Docker orquestados con Docker Compose y proxy inverso Nginx.

---

## 2. Despliegue con Docker Compose

### Requisitos previos
* Docker Engine 24+ y Docker Compose v2+.

### Pasos de inicialización
1. Clonar el repositorio y ubicarse en la raíz del proyecto:
   ```bash
   cd Resto
   ```

2. (Opcional) Configurar variables de entorno copiando el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

3. Construir e iniciar los tres contenedores (Base de datos, Backend y Frontend):
   ```bash
   docker compose up -d --build
   ```

4. Verificar que todos los servicios estén en ejecución saludable:
   ```bash
   docker compose ps
   ```

5. Abrir el navegador en:
   * **Frontend:** `http://localhost` (o el puerto configurado en `FRONTEND_PORT`).
   * **API Swagger / Endpoints:** `http://localhost:5000/swagger`.

La base de datos se inicializa y autoseedea de forma automática en el primer arranque mediante `EnsureCreatedAsync` y el `InicializadorBaseDatos`.

---

## 3. Credenciales de Demostración Iniciales

El sistema incluye botones de acceso directo en la pantalla de inicio de sesión para pruebas rápidas:

| Rol | Correo | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@saasresto.com` | `Admin123!` | Crea inquilinos (restaurantes), gestiona suscripciones, estados de cuenta y cortes por mora. |
| **Dueño / Administrador** | `carlos@casonagourmet.pe` | `Admin123!` | Gestiona sucursales de su restaurante, cartas, recetas, inventario y crea usuarios asignados a sus sedes. |
| **Cajero** | `lucia@casonagourmet.pe` | `Cajero123!` | Apertura/cierre de turnos de caja (Z/X), cobro de comandas y emisión de boletas/facturas electrónicas SUNAT. |
| **Mozo** | `jorge@casonagourmet.pe` | `Mozo123!` | Vista de plano de mesas por zonas, apertura y adición de comandas en tiempo real. |
| **Cocinero** | `mario@casonagourmet.pe` | `Cocina123!` | Pantalla de cocina (KDS) con estados EN_ESPERA, EN_PREPARACION, LISTO y descarga automática de stock de insumos por receta. |

---

## 4. Estructura de Directorios

```text
Resto/
├── backend/
│   ├── Controladores/       # Endpoints REST (SuperAdmin, Sucursales, POS, KDS, Caja, etc.)
│   ├── Datos/               # DbContext, Filtros Globales Inquilino, Inicializador (Seed)
│   ├── Dtos/                # Objetos de transferencia de datos
│   ├── Hubs/                # MesasHub y CocinaHub (SignalR WebSockets)
│   ├── Modelos/             # Entidades de dominio en español
│   ├── Servicios/           # Tokens JWT, Kardex/Recetas, APIs Perú (Facturación)
│   ├── Dockerfile           # Multi-stage build .NET 8 SDK -> ASP.NET Runtime
│   └── Restaurante.csproj
├── frontend/
│   ├── src/
│   │   ├── componentes/     # Layouts, Navegación, Modales
│   │   ├── estado/          # Stores Zustand (Auth)
│   │   ├── features/        # Módulos: SuperAdmin, Sucursales, POS, KDS, Caja, Inventario
│   │   ├── servicios/       # Axios API client y SignalR listener
│   │   └── tipos/           # Definiciones TypeScript de entidades y DTOs
│   ├── nginx.conf           # Proxy inverso SPA + API + WebSockets
│   ├── Dockerfile           # Multi-stage build Node 20 -> Nginx Alpine
│   └── package.json
├── docker-compose.yml       # Orquestador maestro (SQL Server + API + Nginx)
├── .env.example             # Plantilla de variables de entorno
└── README.md
```
