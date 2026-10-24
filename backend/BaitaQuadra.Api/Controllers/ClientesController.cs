using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientesController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista clientes. Filtros: busca (nome ou telefone), nivel, ordem=nome|ultimaVisita.</summary>
    [HttpGet]
    public async Task<IEnumerable<ClienteDto>> Listar([FromQuery] string? busca, [FromQuery] string? nivel, [FromQuery] string? ordem)
    {
        var query = db.Clientes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = $"%{busca.Trim()}%";
            query = query.Where(c => EF.Functions.ILike(c.Nome, termo) || EF.Functions.ILike(c.Contato, termo));
        }
        if (!string.IsNullOrWhiteSpace(nivel))
            query = query.Where(c => c.Nivel == nivel);

        query = ordem == "ultimaVisita"
            ? query.OrderByDescending(c => c.UltimaVisita)
            : query.OrderBy(c => c.Nome);

        return (await query.ToListAsync()).Select(c => c.ToDto());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClienteDto>> Obter(Guid id)
    {
        var c = await db.Clientes.FindAsync(id);
        return c is null ? NotFound() : c.ToDto();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Criar(ClienteInput input)
    {
        if (Validar(input) is { } erro) return erro;
        var c = new Cliente();
        Aplicar(c, input);
        db.Clientes.Add(c);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = c.Id }, c.ToDto());
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClienteDto>> Atualizar(Guid id, ClienteInput input)
    {
        if (Validar(input) is { } erro) return erro;
        var c = await db.Clientes.FindAsync(id);
        if (c is null) return NotFound();
        Aplicar(c, input);
        await db.SaveChangesAsync();
        return c.ToDto();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var c = await db.Clientes.FindAsync(id);
        if (c is null) return NotFound();
        db.Clientes.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private ActionResult? Validar(ClienteInput input) =>
        input.Nivel is not null && !NivelCliente.Todos.Contains(input.Nivel)
            ? ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
                { ["nivel"] = [$"Valores aceitos: {string.Join(", ", NivelCliente.Todos)}"] }))
            : null;

    private static void Aplicar(Cliente c, ClienteInput input)
    {
        c.Nome = input.Nome.Trim();
        c.Contato = input.Contato?.Trim() ?? "";
        c.Nivel = input.Nivel ?? c.Nivel;
        c.MembroDesde = input.MembroDesde ?? c.MembroDesde;
        c.UltimaVisita = input.UltimaVisita ?? c.UltimaVisita;
        c.Saldo = input.Saldo ?? c.Saldo;
    }
}
