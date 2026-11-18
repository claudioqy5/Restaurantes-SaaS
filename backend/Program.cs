using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Restaurante.Api.Datos;
using Restaurante.Api.Hubs;
using Restaurante.Api.Servicios;

var builder = WebApplication.CreateBuilder(args);

// 1. Controladores con serialización de Enums en texto
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 2. Base de Datos SQL Server
var cadenaConexion = builder.Configuration.GetConnectionString("CadenaConexion")
    ?? "Server=localhost\\SQLEXPRESS;Database=RestauranteSaaS_Db;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

builder.Services.AddDbContext<RestauranteDbContext>(options =>
{
    options.UseSqlServer(cadenaConexion);
});

// 3. Inyección de Dependencias
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IInquilinoProveedor, InquilinoProveedor>();
builder.Services.AddScoped<IServicioToken, ServicioToken>();
builder.Services.AddScoped<IServicioInventario, ServicioInventario>();
builder.Services.AddHttpClient<IServicioApisPeru, ServicioApisPeru>();

// 4. SignalR en Tiempo Real
builder.Services.AddSignalR();

// 5. Configuración de Autenticación JWT
var claveSecreta = builder.Configuration["Jwt:ClaveSecreta"] ?? "SuperClaveSecretaUltraSeguraRestauranteSaaS2026!#$GastronomiaTotal";
var issuer = builder.Configuration["Jwt:Issuer"] ?? "RestauranteSaaS";
var audience = builder.Configuration["Jwt:Audience"] ?? "RestauranteSaaSClientes";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveSecreta)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ClockSkew = TimeSpan.Zero
    };

    // Soporte para autenticación en SignalR vía query string "access_token"
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 6. Configuración de CORS para Frontend (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsRestaurante", politica =>
    {
        politica.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 7. Swagger con soporte Bearer JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "POS Gastronómico SaaS API",
        Version = "v1",
        Description = "API REST Multi-tenant para gestión integral de restaurantes con soporte SignalR y KDS."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header utilizando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 8. Inicialización de Base de Datos y Datos Semilla
using (var scope = app.Services.CreateScope())
{
    var servicios = scope.ServiceProvider;
    try
    {
        var db = servicios.GetRequiredService<RestauranteDbContext>();
        await InicializadorBaseDatos.InicializarAsync(db);
    }
    catch (Exception ex)
    {
        var logger = servicios.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al migrar o sembrar la base de datos.");
    }
}

// 9. Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "POS Gastronómico SaaS v1");
    });
}

app.UseCors("CorsRestaurante");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Mapeo de Hubs SignalR
app.MapHub<MesasHub>("/hubs/mesas");
app.MapHub<CocinaHub>("/hubs/cocina");

app.Run();
