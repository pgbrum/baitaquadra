namespace BaitaQuadra.Api.Models;

// Os valores textuais abaixo são exatamente os que o front (baita-quadra.models.ts) espera.
public static class NivelCliente
{
    public const string Iniciante = "Iniciante";
    public const string Intermedio = "Intermédio";
    public const string Avancado = "Avançado";
    public static readonly string[] Todos = [Iniciante, Intermedio, Avancado];
}

public static class StatusQuadra
{
    public const string Disponivel = "Disponível";
    public const string Ocupada = "Ocupada";
    public const string Manutencao = "Manutenção";
    public static readonly string[] Todos = [Disponivel, Ocupada, Manutencao];
}

public static class StatusReserva
{
    public const string Confirmado = "CONFIRMADO";
    public const string Atrasado = "ATRASADO";
    public const string EmAndamento = "EM ANDAMENTO";
    public const string Cancelado = "CANCELADO";
    public static readonly string[] Todos = [Confirmado, Atrasado, EmAndamento, Cancelado];
}

public static class TipoReserva
{
    public const string Locacao = "LOCAÇÃO";
    public const string Aula = "AULA";
    public const string Torneio = "TORNEIO";
    public static readonly string[] Todos = [Locacao, Aula, Torneio];
}

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string SenhaHash { get; set; } = "";
}

public class Cliente
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = "";
    public string Contato { get; set; } = "";
    public string Nivel { get; set; } = NivelCliente.Iniciante;
    public DateOnly MembroDesde { get; set; } = DateOnly.FromDateTime(DateTime.Today);
    public DateOnly? UltimaVisita { get; set; }
    public decimal Saldo { get; set; }
    public List<Reserva> Reservas { get; set; } = [];
}

public class Quadra
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = "";
    public string Tipo { get; set; } = "";
    public string Esporte { get; set; } = "";
    public string Iluminacao { get; set; } = "";
    public string Dimensoes { get; set; } = "";
    public string Status { get; set; } = StatusQuadra.Disponivel;
    public decimal ValorHora { get; set; }
    public List<Reserva> Reservas { get; set; } = [];
}

public class Reserva
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuadraId { get; set; }
    public Quadra? Quadra { get; set; }
    // Aulas e torneios podem não ter um cliente associado
    public Guid? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public string Tipo { get; set; } = TipoReserva.Locacao;
    public string? Titulo { get; set; }
    public string? Descricao { get; set; }
    public DateTime Inicio { get; set; }
    public DateTime Fim { get; set; }
    public string Status { get; set; } = StatusReserva.Confirmado;
    public decimal Valor { get; set; }
    public bool Pago { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.Now;
}
