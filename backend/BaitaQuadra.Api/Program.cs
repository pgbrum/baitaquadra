using System.Text;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using BaitaQuadra.Api.Data;
using BaitaQuadra.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Banco de dados (Supabase / PostgreSQL) ----------
var conexao = builder.Configuration.GetConnectionString("Supabase");
if (string.IsNullOrWhiteSpace(conexao))
    throw new InvalidOperationException(
        "Configure 'ConnectionStrings:Supabase' (user-secrets ou variável de ambiente ConnectionStrings__Supabase).");
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(conexao));

// ---------- JWT ----------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (Encoding.UTF8.GetByteCount(jwt.Chave) < 32)
    throw new InvalidOperationException("Configure 'Jwt:Chave' com pelo menos 32 caracteres.");
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<TokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwt.Emissor,
        ValidateAudience = true,
        ValidAudience = jwt.Audiencia,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Chave)),
        ClockSkew = TimeSpan.FromMinutes(1),
    });
// Todas as rotas exigem login, exceto as marcadas com [AllowAnonymous]/AllowAnonymous()
builder.Services.AddAuthorization(o => o.FallbackPolicy =
    new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

// ---------- CORS para o Angular (ng serve em :4200 e deploy na Vercel) ----------
var origens = builder.Configuration.GetSection("Cors:Origens").Get<string[]>() ?? ["http://localhost:4200"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origens).AllowAnyHeader().AllowAnyMethod()));

// ---------- Controllers / JSON em camelCase com acentos legíveis ----------
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Encoder = JavaScriptEncoder.Create(UnicodeRanges.All));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // O schema pode ser aplicado pelo SQL Editor do Supabase ou automaticamente aqui (script idempotente)
    if (app.Configuration.GetValue<bool>("Database:AplicarSchema"))
        db.Database.ExecuteSqlRaw(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Database", "schema.sql")));
    if (app.Configuration.GetValue<bool>("Database:Seed"))
        SeedData.Popular(db, app.Configuration);
}

if (app.Environment.IsDevelopment())
    app.MapOpenApi().AllowAnonymous(); // /openapi/v1.json

app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapControllers();

app.Run();
