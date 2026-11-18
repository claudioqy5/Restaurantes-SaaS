using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Restaurante.Api.Modelos;

namespace Restaurante.Api.Servicios;

public interface IServicioToken
{
    string GenerarToken(Usuario usuario, Inquilino? inquilino);
}

public class ServicioToken : IServicioToken
{
    private readonly IConfiguration _configuracion;

    public ServicioToken(IConfiguration configuracion)
    {
        _configuracion = configuracion;
    }

    public string GenerarToken(Usuario usuario, Inquilino? inquilino)
    {
        var claveSecreta = _configuracion["Jwt:ClaveSecreta"] ?? "ClaveSecretaSuperSeguraParaRestauranteSaaS2026!#$";
        var issuer = _configuracion["Jwt:Issuer"] ?? "RestauranteSaaS";
        var audience = _configuracion["Jwt:Audience"] ?? "RestauranteSaaSClientes";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}"),
            new(ClaimTypes.Email, usuario.Correo),
            new(ClaimTypes.Role, usuario.Rol.ToString())
        };

        if (usuario.InquilinoId.HasValue)
        {
            claims.Add(new Claim("InquilinoId", usuario.InquilinoId.Value.ToString()));
        }

        if (usuario.SucursalId.HasValue)
        {
            claims.Add(new Claim("SucursalId", usuario.SucursalId.Value.ToString()));
        }

        if (inquilino != null)
        {
            claims.Add(new Claim("Subdominio", inquilino.Subdominio));
            claims.Add(new Claim("NombreRestaurante", inquilino.NombreComercial));
        }

        if (usuario.Sucursal != null)
        {
            claims.Add(new Claim("NombreSucursal", usuario.Sucursal.Nombre));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveSecreta));
        var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credenciales
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
