namespace AplicacaoBackAula.DTO
{
    public class FuncionarioDTO
    {
        //DADOS DA TABELA PESSOA
        public int IdPessoa { get; set; }
        public string? Nome { get; set; }
        public long CPF { get; set; }
        public DateOnly DataNascimento { get; set; }
        public string sexo { get; set; }
        public string email { get; set; }
        public long telefone { get; set; }
        public string AtivoPessoa { get; set; }

        //DADOS DA TABELA FUNCIONARIO
        public string Cargo { get; set; }
        public DateOnly DataAdmissao { get; set; }

        //DADOS DA TABELA ENDERECO
        public List<EnderecoDTO> Enderecos { get; set; } = new();
    }
}