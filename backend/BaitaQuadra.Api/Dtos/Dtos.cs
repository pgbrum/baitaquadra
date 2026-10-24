using System.ComponentModel.DataAnnotations;

namespace BaitaQuadra.Api.Dtos;

// ---------- Auth ----------
public record LoginRequest([Required, EmailAddress] string Email, [Required] string Senha);
public record UsuarioDto(Guid Id, string Nome, string Email);
public record LoginResponse(string Token, DateTime ExpiraEm, UsuarioDto Usuario);

// ---------- Clientes (mesmo formato da interface Cliente do front) ----------
public record ClienteDto(
    Guid Id, string Nome, string Iniciais, string MembroDesde, string Contato,
    string Nivel, string UltimaVisita, decimal Saldo);

public record ClienteInput(
    [Required, StringLength(120)] string Nome,
    [StringLength(60)] string? Contato,
    string? Nivel,
    DateOnly? MembroDesde,
    DateOnly? UltimaVisita,
    decimal? Saldo);

// ---------- Quadras (mesmo formato da interface Quadra do front) ----------
public record QuadraDto(
    Guid Id, string Nome, string Tipo, string Esporte, string Iluminacao,
    string Dimensoes, string Status, decimal ValorHora);

public record QuadraInput(
    [Required, StringLength(80)] string Nome,
    string? Tipo, string? Esporte, string? Iluminacao, string? Dimensoes,
    string? Status, decimal? ValorHora);

public record StatusInput([Required] string Status);

public record QuadrasResumoDto(int Total, int Disponiveis, int Ocupadas, int Manutencao);

// ---------- Reservas (compatível com a interface Reserva do front) ----------
public record ReservaDto(
    Guid Id, string Status, string ClienteNome, string ClienteIniciais, string QuadraInfo,
    Guid QuadraId, string QuadraNome, Guid? ClienteId, string Tipo, string? Titulo, string? Descricao,
    DateTime Inicio, DateTime Fim, string Horario, decimal Valor, bool Pago);

public record ReservaInput(
    [Required] Guid QuadraId,
    Guid? ClienteId,
    string? Tipo,
    string? Titulo,
    string? Descricao,
    [Required] DateTime Inicio,
    [Required] DateTime Fim,
    decimal? Valor,
    bool? Pago,
    string? Status);

// ---------- Agenda ----------
public record AgendaQuadraDto(Guid Id, string Nome, string Tipo, string Status, List<ReservaDto> Reservas);
public record AgendaDto(DateOnly Data, string Titulo, List<string> Horas, List<AgendaQuadraDto> Quadras);

// ---------- Dashboard ----------
public record DashboardResumoDto(int ReservasHoje, int QuadrasOcupadas, int NovosClientes, decimal ReceitaPrevista);
public record OcupacaoDiaDto(DateOnly Data, string Rotulo, int Reservas, double HorasReservadas, double PercentualOcupacao);
