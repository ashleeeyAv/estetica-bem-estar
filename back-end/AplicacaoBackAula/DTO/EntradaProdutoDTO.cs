using System.ComponentModel.DataAnnotations;

namespace AplicacaoBackAula.DTO
{
    // corpo do POST
    public class EntradaProdutoAddDTO
    {
        [Range(1, int.MaxValue, ErrorMessage = "Informe o produto.")]
        public int Iditem { get; set; }

        public DateOnly DataEntradaProduto { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public int QuantidadeEntrada { get; set; }

        [Required, StringLength(10)]
        public string Unidade { get; set; } = null!;

        [Range(0.01, 99999999, ErrorMessage = "O valor unitário deve ser maior que zero.")]
        public decimal ValorUnitarioEntrada { get; set; }
    }

    // resposta do GET/POST
    public class EntradaProdutoDTO
    {
        public int IdentradaProduto { get; set; }
        public int Iditem { get; set; }
        public string? Item { get; set; }
        public DateOnly? DataEntradaProduto { get; set; }
        public int? QuantidadeEntrada { get; set; }
        public string? Unidade { get; set; }
        public decimal? ValorUnitarioEntrada { get; set; }
        public int? QuantidadeEstoqueAtual { get; set; }
    }
}