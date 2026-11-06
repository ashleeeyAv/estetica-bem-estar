using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstoqueController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public EstoqueController(BdAulaBackendContext context)
        {
            _context = context;
        }

        // parte de Produtos (e não de Estoques) para listar também produto sem linha em estoque
        private IQueryable<EstoqueDTO> Consulta() =>
            _context.Produtos.AsNoTracking().Select(p => new EstoqueDTO
            {
                Iditem = p.Iditem,
                Item = p.IditemNavigation.Item1,
                DescricaoItem = p.IditemNavigation.DescricaoItem,
                Preco = p.IditemNavigation.Preco,
                PrecoVenda = p.PrecoVenda,
                Unidade = p.Unidade,
                Categoria = p.IditemNavigation.IdcategoriaNavigation.Categoria,
                AtivoProdutoServico = p.IditemNavigation.AtivoProdutoServico,
                QuantidadeEstoque = p.Estoque != null ? p.Estoque.QuantidadeEstoque : 0
            });

        // GET: api/Estoque
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EstoqueDTO>>> GetAll()
        {
            return Ok(await Consulta().OrderBy(e => e.Iditem).ToListAsync());
        }

        // GET: api/Estoque/5
        [HttpGet("{iditem}")]
        public async Task<ActionResult<EstoqueDTO>> GetPorId(int iditem)
        {
            var dto = await Consulta().FirstOrDefaultAsync(e => e.Iditem == iditem);
            if (dto == null)
                return NotFound(new { message = $"Produto {iditem} não encontrado no estoque." });
            return Ok(dto);
        }
    }
}