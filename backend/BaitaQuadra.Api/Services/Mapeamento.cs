using System.Globalization;
using BaitaQuadra.Api.Dtos;
using BaitaQuadra.Api.Models;

namespace BaitaQuadra.Api.Services;

/// <summary>Converte entidades para o formato JSON consumido pelo front Angular.</summary>
public static class Mapeamento
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public static string Iniciais(string? nome)
    {
        var partes = (nome ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length == 0) return "?";
        if (partes.Length == 1) return partes[0][..1].ToUpperInvariant();
        return $"{partes[0][0]}{partes[^1][0]}".ToUpperInvariant();
    }

    // "mar. 2023" -> "Mar 2023"
    public static string MesAno(DateOnly data)
    {
        var mes = data.ToString("MMM", PtBr).TrimEnd('.');
        return $"{char.ToUpper(mes[0])}{mes[1..]} {data.Year}";
    }

    // "24 Out"
    public static string DiaMes(DateOnly data)
    {
        var mes = data.ToString("MMM", PtBr).TrimEnd('.');
        return $"{data.Day} {char.ToUpper(mes[0])}{mes[1..]}";
    }

    // "Seg" para a semana, "24/10" para o mês
    public static string RotuloDia(DateOnly data, bool mensal)
    {
        if (mensal) return data.ToString("dd/MM", PtBr);
        var dia = data.ToString("ddd", PtBr).TrimEnd('.');
        return $"{char.ToUpper(dia[0])}{dia[1..]}";
    }

    public static string DataRelativa(DateOnly? data)
    {
        if (data is null) return "—";
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        if (data == hoje) return "Hoje";
        if (data == hoje.AddDays(-1)) return "Ontem";
        return data.Value.ToString("dd/MM/yyyy", PtBr);
    }

    public static ClienteDto ToDto(this Cliente c) => new(
        c.Id, c.Nome, Iniciais(c.Nome), MesAno(c.MembroDesde), c.Contato,
        c.Nivel, DataRelativa(c.UltimaVisita), c.Saldo);

    public static QuadraDto ToDto(this Quadra q) => new(
        q.Id, q.Nome, q.Tipo, q.Esporte, q.Iluminacao, q.Dimensoes, q.Status, q.ValorHora);

    /// <summary>Reservas confirmadas cujo horário está em curso aparecem como "EM ANDAMENTO".</summary>
    public static string StatusEfetivo(Reserva r, DateTime agora) =>
        r.Status == StatusReserva.Confirmado && agora >= r.Inicio && agora < r.Fim
            ? StatusReserva.EmAndamento
            : r.Status;

    public static ReservaDto ToDto(this Reserva r, DateTime? agora = null)
    {
        var momento = agora ?? DateTime.Now;
        var nome = r.Cliente?.Nome ?? r.Titulo ?? "Cliente";
        var horario = $"{r.Inicio:HH:mm} - {r.Fim:HH:mm}";
        var quadraNome = r.Quadra?.Nome ?? "Quadra";
        var dia = r.Inicio.Date == DateTime.Today ? "" : $"{r.Inicio:dd/MM} ";
        return new ReservaDto(
            r.Id, StatusEfetivo(r, momento), nome, Iniciais(nome), $"{quadraNome} • {dia}{horario}",
            r.QuadraId, quadraNome, r.ClienteId, r.Tipo, r.Titulo, r.Descricao,
            r.Inicio, r.Fim, horario, r.Valor, r.Pago);
    }
}
