using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    //CRUD de serviços (itens com tipo_item = 'S')
    [Route("api/[controller]")]
    [ApiController]
    public class ServicoController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public ServicoController(BdAulaBackendContext context)
        {
            _context = context;
        }

        private IQueryable<ItemDTO> Consulta() =>
            _context.Items.AsNoTracking()
                .Where(i => i.TipoItem == "S")
                .Select(i => new ItemDTO
                {
                    IdItem = i.Iditem,
                    IdCategoria = i.Idcategoria,
                    Item = i.Item1,
                    DescricaoItem = i.DescricaoItem,
                    Preco = i.Preco,
                    TipoItem = i.TipoItem,
                    AtivoProdutoServico = i.AtivoProdutoServico,
                    Categoria = i.IdcategoriaNavigation.Categoria,
                    QuantidadeEstoque = null,
                    CodigoPreco = null,
                    PrecoVenda = null,
                    Unidade = null
                });

        // GET: api/Servico
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemDTO>>> GetAll()
        {
            return Ok(await Consulta().OrderBy(i => i.IdItem).ToListAsync());
        }

        // GET: api/Servico/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ItemDTO>> GetPorId(int id)
        {
            var servico = await Consulta().FirstOrDefaultAsync(i => i.IdItem == id);

            if (servico == null)
            {
                return NotFound(new { mensagem = "Serviço não encontrado." });
            }

            return Ok(servico);
        }

        // POST: api/Servico
        [HttpPost]
        public async Task<ActionResult<ItemDTO>> Post(ProdutoDTO dto)
        {
            var item = new Item
            {
                Idcategoria = dto.IdCategoria,
                Item1 = dto.Item ?? string.Empty,
                DescricaoItem = dto.DescricaoItem ?? string.Empty,
                Preco = dto.Preco ?? 0,
                TipoItem = "S",
                AtivoProdutoServico = string.IsNullOrWhiteSpace(dto.AtivoProdutoServico)
                    ? "S"
                    : dto.AtivoProdutoServico
            };

            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            var resposta = await Consulta().FirstOrDefaultAsync(i => i.IdItem == item.Iditem);

            return CreatedAtAction(nameof(GetPorId), new { id = item.Iditem }, resposta);
        }

        // PUT: api/Servico/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Put(int id, ProdutoDTO dto)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Iditem == id);

            if (item == null)
            {
                return NotFound(new { mensagem = "Serviço não encontrado." });
            }

            if (item.TipoItem != "S")
            {
                return BadRequest(new { mensagem = "O item informado não é um serviço." });
            }

            item.Idcategoria = dto.IdCategoria;
            item.Item1 = dto.Item ?? string.Empty;
            item.DescricaoItem = dto.DescricaoItem ?? string.Empty;
            item.Preco = dto.Preco ?? 0;
            item.AtivoProdutoServico = string.IsNullOrWhiteSpace(dto.AtivoProdutoServico)
                ? item.AtivoProdutoServico
                : dto.AtivoProdutoServico;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Servico/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Iditem == id);

            if (item == null)
            {
                return NotFound(new { mensagem = "Serviço não encontrado." });
            }

            if (item.TipoItem != "S")
            {
                return BadRequest(new { mensagem = "O item informado não é um serviço." });
            }

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
