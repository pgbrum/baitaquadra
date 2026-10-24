using BaitaQuadra.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BaitaQuadra.Api.Data;

/// <summary>
/// Mapeia para as tabelas do Supabase (Postgres) definidas em Database/schema.sql.
/// Tabelas e colunas em snake_case, seguindo o padrão do Supabase.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Quadra> Quadras => Set<Quadra>();
    public DbSet<Reserva> Reservas => Set<Reserva>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Usuario>(e =>
        {
            e.ToTable("usuarios");
            e.HasIndex(u => u.Email).IsUnique();
        });

        b.Entity<Cliente>(e =>
        {
            e.ToTable("clientes");
            e.Property(c => c.Saldo).HasColumnType("numeric(12,2)");
        });

        b.Entity<Quadra>(e =>
        {
            e.ToTable("quadras");
            e.Property(q => q.ValorHora).HasColumnType("numeric(12,2)");
        });

        b.Entity<Reserva>(e =>
        {
            e.ToTable("reservas");
            e.Property(r => r.Valor).HasColumnType("numeric(12,2)");
            // Horários locais da quadra, sem fuso
            e.Property(r => r.Inicio).HasColumnType("timestamp without time zone");
            e.Property(r => r.Fim).HasColumnType("timestamp without time zone");
            e.Property(r => r.CriadoEm).HasColumnType("timestamp without time zone");
            e.HasOne(r => r.Quadra).WithMany(q => q.Reservas).HasForeignKey(r => r.QuadraId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Cliente).WithMany(c => c.Reservas).HasForeignKey(r => r.ClienteId).OnDelete(DeleteBehavior.SetNull);
        });

        // PascalCase -> snake_case (ValorHora -> valor_hora)
        foreach (var entidade in b.Model.GetEntityTypes())
            foreach (var prop in entidade.GetProperties())
                prop.SetColumnName(SnakeCase(prop.Name));
    }

    private static string SnakeCase(string nome) =>
        string.Concat(nome.Select((ch, i) => i > 0 && char.IsUpper(ch) ? "_" + char.ToLowerInvariant(ch) : char.ToLowerInvariant(ch).ToString()));
}
