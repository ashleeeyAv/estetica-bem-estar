using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    // Lista unificada de produtos e serviços usada pelo catálogo e pelo admin
    [Route("api/[controller]")]
    [ApiController]
    public class ItemController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public ItemController(BdAulaBackendContext context)
        {
            _context = context;
        }

        private IQueryable<ItemDTO> Produtos() =>
            _context.Produtos.AsNoTracking().Select(p => new ItemDTO
            {
                IdItem = p.Iditem,
                IdCategoria = p.IditemNavigation.Idcategoria,
                Item = p.IditemNavigation.Item1,
                DescricaoItem = p.IditemNavigation.DescricaoItem,
                Preco = p.IditemNavigation.Preco,
                TipoItem = p.IditemNavigation.TipoItem,
                AtivoProdutoServico = p.IditemNavigation.AtivoProdutoServico,
                Categoria = p.IditemNavigation.IdcategoriaNavigation.Categoria,
                QuantidadeEstoque = p.Estoque != null ? p.Estoque.QuantidadeEstoque : 0,
                CodigoPreco = p.CodigoPreco,
                PrecoVenda = p.PrecoVenda,
                Unidade = p.Unidade
            });

        private IQueryable<ItemDTO> Servicos() =>
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

        private async Task<List<ItemDTO>> Todos()
        {
            var produtos = await Produtos().ToListAsync();
            var servicos = await Servicos().ToListAsync();

            return produtos
                .Concat(servicos)
                .OrderBy(i => i.IdItem)
                .ToList();
        }

        // GET: api/Item
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemDTO>>> GetAll()
        {
            return Ok(await Todos());
        }

        // GET: api/Item/21
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ItemDTO>> GetPorId(int id)
        {
            var item = (await Todos()).FirstOrDefault(i => i.IdItem == id);

            if (item == null)
            {
                return NotFound(new { mensagem = "Item não encontrado." });
            }

            return Ok(item);
        }

        // PATCH: api/Item/21/situacao
        [HttpPatch("{id:int}/situacao")]
        public async Task<IActionResult> AlterarSituacao(int id, SituacaoDTO dto)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Iditem == id);

            if (item == null)
            {
                return NotFound(new { mensagem = "Item não encontrado." });
            }

            item.AtivoProdutoServico = dto.Ativo ? "S" : "N";
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
