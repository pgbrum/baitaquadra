using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/reservas")]
public class ReservasController(AppDbContext db) : ControllerBase
{
    private IQueryable<Reserva> ComRelacoes() =>
        db.Reservas.AsNoTracking().Include(r => r.Quadra).Include(r => r.Cliente);

    /// <summary>Lista reservas. Filtros opcionais: data (yyyy-MM-dd), quadraId, clienteId, status.</summary>
    [HttpGet]
    public async Task<IEnumerable<ReservaDto>> Listar(
        [FromQuery] DateOnly? data, [FromQuery] Guid? quadraId, [FromQuery] Guid? clienteId, [FromQuery] string? status)
    {
        var query = ComRelacoes();
        if (data is { } d)
        {
            var ini = d.ToDateTime(TimeOnly.MinValue);
            var fim = ini.AddDays(1);
            query = query.Where(r => r.Inicio < fim && r.Fim > ini);
        }
        if (quadraId is not null) query = query.Where(r => r.QuadraId == quadraId);
        if (clienteId is not null) query = query.Where(r => r.ClienteId == clienteId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);

        var agora = DateTime.Now;
        return (await query.OrderBy(r => r.Inicio).ToListAsync()).Select(r => r.ToDto(agora));
    }

    /// <summary>Card "Próximos Jogos" do dashboard: reservas em curso ou futuras, não canceladas.</summary>
    [HttpGet("proximos")]
    public async Task<IEnumerable<ReservaDto>> Proximos([FromQuery] int limite = 10)
    {
        var agora = DateTime.Now;
        var lista = await ComRelacoes()
            .Where(r => r.Fim > agora && r.Status != StatusReserva.Cancelado)
            .OrderBy(r => r.Inicio)
            .Take(Math.Clamp(limite, 1, 50))
            .ToListAsync();
        return lista.Select(r => r.ToDto(agora));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReservaDto>> Obter(Guid id)
    {
        var r = await ComRelacoes().FirstOrDefaultAsync(x => x.Id == id);
        return r is null ? NotFound() : r.ToDto();
    }

    /// <summary>Botões "Nova Reserva" / "Reservar".</summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReservaDto>> Criar(ReservaInput input)
    {
        var r = new Reserva();
        if (await Aplicar(r, input) is { } erro) return erro;
        db.Reservas.Add(r);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obter), new { id = r.Id }, (await ComRelacoes().FirstAsync(x => x.Id == r.Id)).ToDto());
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReservaDto>> Atualizar(Guid id, ReservaInput input)
    {
        var r = await db.Reservas.FindAsync(id);
        if (r is null) return NotFound();
        if (await Aplicar(r, input) is { } erro) return erro;
        await db.SaveChangesAsync();
        return (await ComRelacoes().FirstAsync(x => x.Id == id)).ToDto();
    }

    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ReservaDto>> AlterarStatus(Guid id, StatusInput input)
    {
        if (!StatusReserva.Todos.Contains(input.Status))
            return Erro("status", $"Valores aceitos: {string.Join(", ", StatusReserva.Todos)}");
        var r = await db.Reservas.FindAsync(id);
        if (r is null) return NotFound();
        r.Status = input.Status;
        await db.SaveChangesAsync();
        return (await ComRelacoes().FirstAsync(x => x.Id == id)).ToDto();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var r = await db.Reservas.FindAsync(id);
        if (r is null) return NotFound();
        db.Reservas.Remove(r);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> Aplicar(Reserva r, ReservaInput input)
    {
        if (input.Fim <= input.Inicio) return Erro("fim", "O horário final deve ser maior que o inicial.");

        var tipo = input.Tipo ?? r.Tipo;
        if (!TipoReserva.Todos.Contains(tipo)) return Erro("tipo", $"Valores aceitos: {string.Join(", ", TipoReserva.Todos)}");

        var status = input.Status ?? r.Status;
        if (!StatusReserva.Todos.Contains(status)) return Erro("status", $"Valores aceitos: {string.Join(", ", StatusReserva.Todos)}");

        var quadra = await db.Quadras.FindAsync(input.QuadraId);
        if (quadra is null) return Erro("quadraId", "Quadra não encontrada.");
        if (quadra.Status == StatusQuadra.Manutencao) return Erro("quadraId", "A quadra está em manutenção.");

        if (input.ClienteId is { } clienteId && !await db.Clientes.AnyAsync(c => c.Id == clienteId))
            return Erro("clienteId", "Cliente não encontrado.");
        if (input.ClienteId is null && tipo == TipoReserva.Locacao)
            return Erro("clienteId", "Locações precisam de um cliente.");

        var conflito = await db.Reservas.AnyAsync(x =>
            x.Id != r.Id && x.QuadraId == input.QuadraId && x.Status != StatusReserva.Cancelado &&
            x.Inicio < input.Fim && x.Fim > input.Inicio);
        if (conflito && status != StatusReserva.Cancelado)
            return Conflict(new ProblemDetails { Title = "Já existe uma reserva nesse horário para esta quadra.", Status = 409 });

        r.QuadraId = input.QuadraId;
        r.ClienteId = input.ClienteId;
        r.Tipo = tipo;
        r.Titulo = input.Titulo;
        r.Descricao = input.Descricao;
        r.Inicio = input.Inicio;
        r.Fim = input.Fim;
        r.Status = status;
        r.Pago = input.Pago ?? r.Pago;
        // Sem valor informado, calcula pelo valor/hora da quadra
        r.Valor = input.Valor ?? Math.Round(quadra.ValorHora * (decimal)(input.Fim - input.Inicio).TotalHours, 2);
        return null;
    }

    private ActionResult Erro(string campo, string mensagem) =>
        ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]> { [campo] = [mensagem] }));
}
