using System.Globalization;
using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/agenda")]
public class AgendaController(AppDbContext db, IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Grade da tela Agenda: horários de funcionamento + cada quadra com suas reservas do dia.
    /// Use reserva.inicio/fim para posicionar os cards (1h = h-24 no front).
    /// </summary>
    [HttpGet]
    public async Task<AgendaDto> Obter([FromQuery] DateOnly? data)
    {
        var dia = data ?? DateOnly.FromDateTime(DateTime.Today);
        var ini = dia.ToDateTime(TimeOnly.MinValue);
        var fim = ini.AddDays(1);

        var abertura = config.GetValue("Funcionamento:Abertura", 8);
        var fechamento = config.GetValue("Funcionamento:Fechamento", 22);
        var horas = Enumerable.Range(abertura, Math.Max(fechamento - abertura, 1)).Select(h => $"{h:00}:00").ToList();

        var quadras = await db.Quadras.AsNoTracking().OrderBy(q => q.Nome).ToListAsync();
        var reservas = await db.Reservas.AsNoTracking()
            .Include(r => r.Quadra).Include(r => r.Cliente)
            .Where(r => r.Inicio < fim && r.Fim > ini && r.Status != StatusReserva.Cancelado)
            .OrderBy(r => r.Inicio)
            .ToListAsync();

        var agora = DateTime.Now;
        var colunas = quadras.Select(q => new AgendaQuadraDto(
            q.Id, q.Nome,
            // O cabeçalho da agenda mostra "MANUTENÇÃO" no lugar do tipo de piso
            q.Status == StatusQuadra.Manutencao ? "MANUTENÇÃO" : q.Tipo.ToUpper(new CultureInfo("pt-BR")),
            q.Status,
            reservas.Where(r => r.QuadraId == q.Id).Select(r => r.ToDto(agora)).ToList())).ToList();

        var titulo = dia == DateOnly.FromDateTime(DateTime.Today)
            ? $"Agenda de Hoje, {Mapeamento.DiaMes(dia)}"
            : $"Agenda de {Mapeamento.DiaMes(dia)}";

        return new AgendaDto(dia, titulo, horas, colunas);
    }
}
