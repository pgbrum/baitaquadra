using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(AppDbContext db, IConfiguration config) : ControllerBase
{
    /// <summary>Cards do topo do dashboard: Reservas Hoje, Quadras Ocupadas, Novos Clientes (mês), Receita Prevista (hoje).</summary>
    [HttpGet("resumo")]
    public async Task<DashboardResumoDto> Resumo()
    {
        var hoje = DateTime.Today;
        var amanha = hoje.AddDays(1);
        var inicioMes = new DateOnly(hoje.Year, hoje.Month, 1);

        var reservasHoje = await db.Reservas.AsNoTracking()
            .Where(r => r.Inicio >= hoje && r.Inicio < amanha && r.Status != StatusReserva.Cancelado)
            .Select(r => r.Valor)
            .ToListAsync();

        var ocupadas = await db.Quadras.CountAsync(q => q.Status == StatusQuadra.Ocupada);
        var novos = await db.Clientes.CountAsync(c => c.MembroDesde >= inicioMes);

        return new DashboardResumoDto(reservasHoje.Count, ocupadas, novos, reservasHoje.Sum());
    }

    /// <summary>Dados do gráfico "Visão Geral de Ocupação". periodo = semana | mes.</summary>
    [HttpGet("ocupacao")]
    public async Task<IEnumerable<OcupacaoDiaDto>> Ocupacao([FromQuery] string periodo = "semana")
    {
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        DateOnly inicio, fim;
        if (periodo == "mes")
        {
            inicio = new DateOnly(hoje.Year, hoje.Month, 1);
            fim = inicio.AddMonths(1);
        }
        else
        {
            // Semana de segunda a domingo
            var desloc = ((int)hoje.DayOfWeek + 6) % 7;
            inicio = hoje.AddDays(-desloc);
            fim = inicio.AddDays(7);
        }

        var ini = inicio.ToDateTime(TimeOnly.MinValue);
        var fimDt = fim.ToDateTime(TimeOnly.MinValue);
        var reservas = await db.Reservas.AsNoTracking()
            .Where(r => r.Inicio >= ini && r.Inicio < fimDt && r.Status != StatusReserva.Cancelado)
            .Select(r => new { r.Inicio, r.Fim })
            .ToListAsync();

        var quadrasAtivas = await db.Quadras.CountAsync(q => q.Status != StatusQuadra.Manutencao);
        var horasDia = config.GetValue("Funcionamento:Fechamento", 22) - config.GetValue("Funcionamento:Abertura", 8);
        var capacidade = Math.Max(quadrasAtivas * horasDia, 1);

        var dias = new List<OcupacaoDiaDto>();
        for (var d = inicio; d < fim; d = d.AddDays(1))
        {
            var doDia = reservas.Where(r => DateOnly.FromDateTime(r.Inicio) == d).ToList();
            var horas = doDia.Sum(r => (r.Fim - r.Inicio).TotalHours);
            dias.Add(new OcupacaoDiaDto(d, Mapeamento.RotuloDia(d, periodo == "mes"), doDia.Count, horas,
                Math.Round(horas / capacidade * 100, 1)));
        }
        return dias;
    }
}
