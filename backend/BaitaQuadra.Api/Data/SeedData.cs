using BaitaQuadra.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace BaitaQuadra.Api.Data;

public static class SeedData
{
    public static void Popular(AppDbContext db, IConfiguration config)
    {
        if (!db.Usuarios.Any())
        {
            var admin = new Usuario
            {
                Nome = "Administrador",
                Email = config["Seed:AdminEmail"] ?? "admin@baitaquadra.com",
            };
            admin.SenhaHash = new PasswordHasher<Usuario>().HashPassword(admin, config["Seed:AdminSenha"] ?? "admin123");
            db.Usuarios.Add(admin);
        }

        if (db.Quadras.Any()) { db.SaveChanges(); return; }

        // Dados de exemplo equivalentes aos que aparecem fixos nas telas do front
        var hoje = DateTime.Today;
        var q1 = new Quadra { Nome = "Quadra 1", Tipo = "Areia Fina", Esporte = "Beach Tennis", Iluminacao = "Iluminação LED", Dimensoes = "16m x 8m", Status = StatusQuadra.Disponivel, ValorHora = 120 };
        var q2 = new Quadra { Nome = "Quadra 2", Tipo = "Areia Fina", Esporte = "Futevôlei", Iluminacao = "Iluminação LED", Dimensoes = "18m x 9m", Status = StatusQuadra.Ocupada, ValorHora = 120 };
        var q3 = new Quadra { Nome = "Quadra 3", Tipo = "Areia Grossa", Esporte = "Vôlei de Praia", Iluminacao = "Iluminação Halógena", Dimensoes = "16m x 8m", Status = StatusQuadra.Disponivel, ValorHora = 100 };
        var q4 = new Quadra { Nome = "Quadra 4", Tipo = "Areia Fina", Esporte = "Beach Tennis", Iluminacao = "Sem iluminação", Dimensoes = "16m x 8m", Status = StatusQuadra.Manutencao, ValorHora = 90 };
        db.Quadras.AddRange(q1, q2, q3, q4);

        var carlos = new Cliente { Nome = "Carlos Silva", Contato = "(51) 99812-3344", Nivel = NivelCliente.Intermedio, MembroDesde = new DateOnly(2023, 3, 1), UltimaVisita = DateOnly.FromDateTime(hoje.AddDays(-1)), Saldo = 150 };
        var ana = new Cliente { Nome = "Ana Souza", Contato = "(51) 98123-4567", Nivel = NivelCliente.Avancado, MembroDesde = new DateOnly(2022, 8, 1), UltimaVisita = DateOnly.FromDateTime(hoje.AddDays(-3)), Saldo = -40 };
        var marcos = new Cliente { Nome = "Marcos Lima", Contato = "(51) 99654-7788", Nivel = NivelCliente.Iniciante, MembroDesde = new DateOnly(2024, 1, 1), UltimaVisita = DateOnly.FromDateTime(hoje.AddDays(-10)), Saldo = 0 };
        var julia = new Cliente { Nome = "Júlia Ferreira", Contato = "(51) 98877-1122", Nivel = NivelCliente.Intermedio, MembroDesde = DateOnly.FromDateTime(hoje.AddDays(-5)), UltimaVisita = DateOnly.FromDateTime(hoje), Saldo = 80 };
        db.Clientes.AddRange(carlos, ana, marcos, julia);

        db.Reservas.AddRange(
            new Reserva { Quadra = q1, Tipo = TipoReserva.Aula, Titulo = "Iniciante - Prof. João", Descricao = "4 alunos", Inicio = hoje.AddHours(8), Fim = hoje.AddHours(9.5), Valor = 160, Pago = true },
            new Reserva { Quadra = q2, Cliente = carlos, Tipo = TipoReserva.Locacao, Inicio = hoje.AddHours(9), Fim = hoje.AddHours(10.5), Valor = 180, Pago = true },
            new Reserva { Quadra = q3, Tipo = TipoReserva.Torneio, Titulo = "Copa Outono", Descricao = "Fase de Grupos - Chave A", Inicio = hoje.AddHours(8), Fim = hoje.AddHours(12), Valor = 400, Pago = true },
            new Reserva { Quadra = q1, Cliente = ana, Tipo = TipoReserva.Locacao, Inicio = hoje.AddHours(18), Fim = hoje.AddHours(19.5), Valor = 180 },
            new Reserva { Quadra = q2, Cliente = marcos, Tipo = TipoReserva.Locacao, Inicio = hoje.AddHours(19), Fim = hoje.AddHours(20), Valor = 120, Status = StatusReserva.Atrasado },
            new Reserva { Quadra = q3, Cliente = julia, Tipo = TipoReserva.Locacao, Inicio = hoje.AddDays(1).AddHours(10), Fim = hoje.AddDays(1).AddHours(11), Valor = 100 }
        );

        db.SaveChanges();
    }
}
