using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BaitaQuadra.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BaitaQuadra.Api.Services;

public class JwtOptions
{
    public string Chave { get; set; } = "";
    public string Emissor { get; set; } = "BaitaQuadra.Api";
    public string Audiencia { get; set; } = "BaitaQuadra.Front";
    public int ExpiracaoHoras { get; set; } = 8;
}

public class TokenService(JwtOptions opcoes)
{
    public (string Token, DateTime ExpiraEm) Gerar(Usuario usuario, bool lembrar = false)
    {
        var expira = DateTime.UtcNow.AddHours(lembrar ? opcoes.ExpiracaoHoras * 21 : opcoes.ExpiracaoHoras);
        var credenciais = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opcoes.Chave)), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: opcoes.Emissor,
            audience: opcoes.Audiencia,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                new Claim(ClaimTypes.Name, usuario.Nome),
            ],
            expires: expira,
            signingCredentials: credenciais);

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}
