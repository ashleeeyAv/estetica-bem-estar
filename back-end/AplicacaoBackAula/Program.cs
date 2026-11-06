//using AplicacaoBackAula.Models;
//using Microsoft.EntityFrameworkCore;

//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.

//builder.Services.AddControllers();
//// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

//builder.Services.AddDbContext<BdAulaBackendContext>(options =>
//    options.UseMySql(
//        builder.Configuration.GetConnectionString("connection"),
//        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("connection"))
//    )
//);

//builder.Services.AddControllers()
//    .AddJsonOptions(options =>
//    {
//        options.JsonSerializerOptions.ReferenceHandler =
//            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
//    });

//var app = builder.Build();
//app.UseCors(o => o.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

//// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

//app.UseHttpsRedirection();

//app.UseAuthorization();

//app.MapControllers();

//app.Run();



using AplicacaoBackAula.Models;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var cs = builder.Configuration.GetConnectionString("connection");
builder.Services.AddDbContext<BdAulaBackendContext>(o =>
    o.UseMySql(cs, ServerVersion.AutoDetect(cs)));

builder.Services.AddCors(o => o.AddPolicy("Angular", p =>
    p.WithOrigins("http://localhost:4200").AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors("Angular");

// Converte erros do MySQL (triggers, duplicidade, FK) em respostas HTTP claras
app.Use(async (ctx, next) =>
{
    try { await next(); }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Erro não tratado");

        Exception? e = ex;
        while (e != null && e is not MySqlException) e = e.InnerException;
        var my = e as MySqlException;

        var (status, msg) = my?.Number switch
        {
            1644 => (409, my?.Message ?? "Conflito."),   // SIGNAL das triggers
            1062 => (409, "Registro duplicado (CPF ou e-mail já cadastrado)."),
            1451 => (409, "O registro possui vínculos e não pode ser excluído."),
            3819 => (400, "Dados inválidos."),
            _ => (500, "Erro interno no servidor.")
        };

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new { mensagem = msg });
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();  // desligado: o redirect quebra o preflight do CORS vindo do Angular
app.UseAuthorization();
app.MapControllers();
app.Run();