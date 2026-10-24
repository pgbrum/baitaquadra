using System.Security.Claims;
using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens) : ControllerBase
{
    private static readonly PasswordHasher<Usuario> Hasher = new();

    /// <summary>Login da tela /login (e-mail + senha). Retorna um JWT Bearer.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req, [FromQuery] bool lembrar = false)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        if (usuario is null || Hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, req.Senha) == PasswordVerificationResult.Failed)
            return Unauthorized(new ProblemDetails { Title = "E-mail ou senha inválidos.", Status = 401 });

        var (token, expira) = tokens.Gerar(usuario, lembrar);
        return new LoginResponse(token, expira, new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UsuarioDto>> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(id, out var guid)) return Unauthorized();
        var u = await db.Usuarios.FindAsync(guid);
        return u is null ? Unauthorized() : new UsuarioDto(u.Id, u.Nome, u.Email);
    }
}
