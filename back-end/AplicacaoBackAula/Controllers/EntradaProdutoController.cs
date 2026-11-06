using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EntradaProdutoController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public EntradaProdutoController(BdAulaBackendContext context)
        {
            _context = context;
        }

        private static EntradaProdutoDTO ParaDTO(EntradaProduto e, string? nome, int? qtdAtual = null) => new()
        {
            IdentradaProduto = e.IdentradaProduto,
            Iditem = e.Iditem,
            Item = nome,
            DataEntradaProduto = e.DataEntradaProduto,
            QuantidadeEntrada = e.QuantidadeEntrada,
            Unidade = e.Unidade,
            ValorUnitarioEntrada = e.ValorUnitarioEntrada,
            QuantidadeEstoqueAtual = qtdAtual
        };

        // GET: api/EntradaProduto
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EntradaProdutoDTO>>> GetAll()
        {
            var lista = await _context.EntradaProdutos.AsNoTracking()
                .OrderByDescending(e => e.IdentradaProduto).ToListAsync();

            var ids = lista.Select(e => e.Iditem).Distinct().ToList();
            var nomes = await _context.Items.AsNoTracking()
                .Where(i => ids.Contains(i.Iditem))
                .ToDictionaryAsync(i => i.Iditem, i => i.Item1);

            return Ok(lista.Select(e => ParaDTO(e, nomes.GetValueOrDefault(e.Iditem))));
        }

        // GET: api/EntradaProduto/3
        [HttpGet("{id}")]
        public async Task<ActionResult<EntradaProdutoDTO>> GetPorId(int id)
        {
            var e = await _context.EntradaProdutos.AsNoTracking()
                .FirstOrDefaultAsync(x => x.IdentradaProduto == id);
            if (e == null)
                return NotFound(new { message = $"Entrada {id} não encontrada." });

            var nome = await _context.Items.AsNoTracking()
                .Where(i => i.Iditem == e.Iditem).Select(i => i.Item1).FirstOrDefaultAsync();
            return Ok(ParaDTO(e, nome));
        }

        // POST: api/EntradaProduto
        [HttpPost]
        public async Task<ActionResult<EntradaProdutoDTO>> Post(EntradaProdutoAddDTO dto)
        {
            if (dto.DataEntradaProduto > DateOnly.FromDateTime(DateTime.Today))
                return BadRequest(new { message = "A data de entrada não pode ser futura." });

            var produto = await _context.Produtos.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Iditem == dto.Iditem);
            if (produto == null)
                return NotFound(new { message = $"Produto {dto.Iditem} não encontrado." });

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // a FK de entrada_produto aponta para estoque: garante que a linha exista
                var temEstoque = await _context.Estoques.AnyAsync(e => e.Iditem == dto.Iditem);
                if (!temEstoque)
                {
                    _context.Estoques.Add(new Estoque { Iditem = dto.Iditem, QuantidadeEstoque = 0 });
                    await _context.SaveChangesAsync();
                }

                var entrada = new EntradaProduto
                {
                    Iditem = dto.Iditem,
                    DataEntradaProduto = dto.DataEntradaProduto,
                    QuantidadeEntrada = dto.QuantidadeEntrada,
                    Unidade = dto.Unidade.Trim(),
                    ValorUnitarioEntrada = dto.ValorUnitarioEntrada
                };
                _context.EntradaProdutos.Add(entrada);

                // o TRIGGER do banco atualiza o estoque e o valor do produto neste INSERT
                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                var nome = await _context.Items.AsNoTracking()
                    .Where(i => i.Iditem == dto.Iditem).Select(i => i.Item1).FirstOrDefaultAsync();
                int? qtdAtual = await _context.Estoques.AsNoTracking()
                    .Where(e => e.Iditem == dto.Iditem).Select(e => e.QuantidadeEstoque).FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetPorId), new { id = entrada.IdentradaProduto },
                    ParaDTO(entrada, nome, qtdAtual));
            }
            catch (DbUpdateException ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}