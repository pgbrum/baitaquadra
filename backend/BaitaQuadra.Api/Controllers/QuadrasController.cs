using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/quadras")]
public class QuadrasController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista quadras ordenadas por nome (mesmo comportamento do front: order('nome')).</summary>
    [HttpGet]
    public async Task<IEnumerable<QuadraDto>> Listar([FromQuery] string? status)
    {
        var query = db.Quadras.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(q => q.Status == status);
        return (await query.OrderBy(q => q.Nome).ToListAsync()).Select(q => q.ToDto());
    }

    /// <summary>Contadores dos cards da tela Quadras.</summary>
    [HttpGet("resumo")]
    public async Task<QuadrasResumoDto> Resumo()
    {
        var status = await db.Quadras.Select(q => q.Status).ToListAsync();
        return new QuadrasResumoDto(
            status.Count,
            status.Count(s => s == StatusQuadra.Disponivel),
            status.Count(s => s == StatusQuadra.Ocupada),
            status.Count(s => s == StatusQuadra.Manutencao));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuadraDto>> Obter(Guid id)
    {
        var q = await db.Quadras.FindAsync(id);
        return q is null ? NotFound() : q.ToDto();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<QuadraDto>> Criar(QuadraInput input)
    {
        if (ValidarStatus(input.Status) is { } erro) return erro;
        var q = new Quadra();
        Aplicar(q, input);
        db.Quadras.Add(q);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = q.Id }, q.ToDto());
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<QuadraDto>> Atualizar(Guid id, QuadraInput input)
    {
        if (ValidarStatus(input.Status) is { } erro) return erro;
        var q = await db.Quadras.FindAsync(id);
        if (q is null) return NotFound();
        Aplicar(q, input);
        await db.SaveChangesAsync();
        return q.ToDto();
    }

    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<QuadraDto>> AlterarStatus(Guid id, StatusInput input)
    {
        if (ValidarStatus(input.Status) is { } erro) return erro;
        var q = await db.Quadras.FindAsync(id);
        if (q is null) return NotFound();
        q.Status = input.Status;
        await db.SaveChangesAsync();
        return q.ToDto();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var q = await db.Quadras.FindAsync(id);
        if (q is null) return NotFound();
        db.Quadras.Remove(q);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private ActionResult? ValidarStatus(string? status) =>
        status is not null && !StatusQuadra.Todos.Contains(status)
            ? ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
                { ["status"] = [$"Valores aceitos: {string.Join(", ", StatusQuadra.Todos)}"] }))
            : null;

    private static void Aplicar(Quadra q, QuadraInput input)
    {
        q.Nome = input.Nome.Trim();
        q.Tipo = input.Tipo ?? q.Tipo;
        q.Esporte = input.Esporte ?? q.Esporte;
        q.Iluminacao = input.Iluminacao ?? q.Iluminacao;
        q.Dimensoes = input.Dimensoes ?? q.Dimensoes;
        q.Status = input.Status ?? q.Status;
        q.ValorHora = input.ValorHora ?? q.ValorHora;
    }
}
