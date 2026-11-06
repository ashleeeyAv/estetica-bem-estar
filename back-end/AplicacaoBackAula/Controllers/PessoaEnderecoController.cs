using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    //ANOTAÇÕES DE IDENTIFICAÇÃO DE CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaEnderecoController : ControllerBase
    {
        //DECLARAÇÃO DO ATRIBUTO DE CONTEXTO
        private readonly BdAulaBackendContext _context;

        //DECLARAÇÃO DO MÉTODO CONSTRUTOR
        public PessoaEnderecoController(BdAulaBackendContext context)
        {
            //INSTANCIA DO ATRIBUTO CONSTRUTOR
            _context = context;
        }

        //CONVERTE O MODELO Pessoa (COM ENDEREÇOS) PARA O DTO DE RESPOSTA
        private static PessoaDTO ParaDTO(Pessoa p) => new()
        {
            IdPessoa = p.Idpessoa,
            Nome = p.Nome,
            CPF = p.Cpf,
            DataNascimento = p.DataNascimento,
            sexo = p.Sexo,
            email = p.Email,
            telefone = p.Telefone,
            AtivoPessoa = p.AtivoPessoa,

            Enderecos = p.Enderecos.Select(e => new EnderecoDTO
            {
                IdEndereco = e.Idendereco,
                IdPessoa = e.Idpessoa,
                Logradouro = e.Logradouro,
                Bairro = e.Bairro,
                Cidade = e.Cidade,
                UF = e.Uf,
                CEP = e.Cep,
                Numero = e.Numero,
                Complemento = e.Complemento
            }).ToList()
        };

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODAS AS PESSOAS E SEUS ENDEREÇOS
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaDTO>>> GetAll()
        {
            var pessoas = await _context.Pessoas
                .AsNoTracking()
                .Include(p => p.Enderecos)
                .OrderBy(p => p.Idpessoa)
                .ToListAsync();

            return Ok(pessoas.Select(ParaDTO));
        }//FIM MÉTODO GetAll

        //LISTA APENAS CLIENTES (PESSOAS QUE NÃO SÃO FUNCIONÁRIAS)
        [HttpGet("clientes")]
        public async Task<ActionResult<IEnumerable<PessoaDTO>>> GetClientes()
        {
            var idsFuncionarios = await _context.Funcionarios
                .AsNoTracking()
                .Select(f => f.Idpessoa)
                .ToListAsync();

            var pessoas = await _context.Pessoas
                .AsNoTracking()
                .Include(p => p.Enderecos)
                .Where(p => !idsFuncionarios.Contains(p.Idpessoa))
                .OrderBy(p => p.Idpessoa)
                .ToListAsync();

            return Ok(pessoas.Select(ParaDTO));
        }

        //BUSCA UMA PESSOA PELO CPF (USADO NA IDENTIFICAÇÃO DO CLIENTE)
        [HttpGet("por-cpf/{cpf}")]
        public async Task<ActionResult<PessoaDTO>> GetPorCpf(string cpf)
        {
            var digitos = new string(cpf.Where(char.IsDigit).ToArray());

            if (!long.TryParse(digitos, out var documento))
            {
                return BadRequest(new { mensagem = "CPF inválido." });
            }

            //A IDENTIFICAÇÃO É FEITA NO FLUXO DO CLIENTE:
            //IGNORA FUNCIONÁRIOS E, EM CASO DE CPF REPETIDO NO BANCO,
            //PREFERE O CADASTRO MAIS RECENTE (MAIOR ID).
            var idsFuncionarios = await _context.Funcionarios
                .AsNoTracking()
                .Select(f => f.Idpessoa)
                .ToListAsync();

            var pessoa = await _context.Pessoas
                .AsNoTracking()
                .Include(p => p.Enderecos)
                .Where(p => p.Cpf == documento && !idsFuncionarios.Contains(p.Idpessoa))
                .OrderByDescending(p => p.Idpessoa)
                .FirstOrDefaultAsync();

            if (pessoa == null)
            {
                return NotFound(new
                {
                    mensagem = "Cliente não encontrado. Faça seu cadastro."
                });
            }

            return Ok(ParaDTO(pessoa));
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR UMA A PESSOA E SEUS ENDEREÇOS
        [HttpGet("{id:int}")]
        public async Task<ActionResult<PessoaDTO>> GetPessoa(int id)
        {
            var pessoa = await _context.Pessoas
                .AsNoTracking()
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            if (pessoa == null)
            {
                return NotFound(new { mensagem = "Pessoa não encontrada." });
            }

            return Ok(ParaDTO(pessoa));
        }//FIM MÉTODO GetPessoa

        //MÉTODO PARA CADASTRAR UMA PESSOA
        [HttpPost]
        public async Task<ActionResult<PessoaDTO>> Post(PessoaDTO dto)
        {
            //UM CPF SÓ PODE PERTENCER A UMA PESSOA;
            //SE JÁ EXISTE, O CLIENTE DEVE SE IDENTIFICAR EM "MEUS PEDIDOS".
            var cpfJaCadastrado = await _context.Pessoas
                .AsNoTracking()
                .AnyAsync(p => p.Cpf == dto.CPF);

            if (cpfJaCadastrado)
            {
                return Conflict(new
                {
                    mensagem = "Este CPF já está cadastrado. Identifique-se por CPF em \"Meus pedidos\"."
                });
            }

            var pessoa = new Pessoa
            {
                Nome = dto.Nome,
                Cpf = dto.CPF,
                DataNascimento = dto.DataNascimento,
                Sexo = dto.sexo,
                Email = dto.email,
                Telefone = dto.telefone,
                AtivoPessoa = string.IsNullOrWhiteSpace(dto.AtivoPessoa) ? "S" : dto.AtivoPessoa,

                Enderecos = dto.Enderecos.Select(e => new Endereco
                {
                    Logradouro = e.Logradouro,
                    Bairro = e.Bairro,
                    Cidade = e.Cidade,
                    Uf = e.UF,
                    Cep = e.CEP ?? string.Empty,
                    Numero = e.Numero ?? string.Empty,
                    Complemento = e.Complemento ?? string.Empty
                }).ToList()
            };

            _context.Pessoas.Add(pessoa);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPessoa),
                new { id = pessoa.Idpessoa },
                ParaDTO(pessoa));

        }//FIM MÉTODO Post


        //MÉTODO PARA ALTERAR UMA PESSOA
        [HttpPut("{id:int}")]
        public async Task<ActionResult<ActionResult<Pessoa>>> Put(int id, PessoaDTO dto)
        {
            //BUSCA A PESSOA E SEUS ENDEREÇOS E ATRIBUI A VARIÁVEL PESSOA
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            //VERIFICA SE A PESSOA EXISTE
            if (pessoa == null)
            {
                return NotFound();
            }

            //PROJETA OS DADOS DO PessoaDTO PARA O MODELO Pessoa ORIUNDA DO BANCO DE DADOS
            pessoa.Nome = dto.Nome;
            pessoa.Cpf = dto.CPF;
            pessoa.DataNascimento = dto.DataNascimento;
            pessoa.Sexo = dto.sexo;
            pessoa.Email = dto.email;
            pessoa.Telefone = dto.telefone;
            pessoa.AtivoPessoa = string.IsNullOrWhiteSpace(dto.AtivoPessoa) ? pessoa.AtivoPessoa : dto.AtivoPessoa;

            // Guarda os IDs dos endereços recebidos
            var idsRecebidos = dto.Enderecos
                .Where(e => e.IdEndereco.HasValue)
                .Select(e => e.IdEndereco!.Value)
                .ToHashSet();

            // Identifica os endereços existentes que devem ser removidos
            var enderecosRemover = pessoa.Enderecos
                .Where(e => !idsRecebidos.Contains(e.Idendereco))
                .ToList();

            // Remove apenas os endereços que já existiam no banco
            _context.Enderecos.RemoveRange(enderecosRemover);

            //PERCORRE OS ENDEREÇOS DA PESSOA
            foreach (var endPessoa in dto.Enderecos)
            {
                //VERIFICA SE O ID EXISTE COM A PESSOA
                if (endPessoa.IdEndereco != null)
                {
                    //BUSCA O ENDERECO DA PESSOA, NO ATRIBUTO DO MODELO Pessoa.
                    var endereco = pessoa.Enderecos
                        .FirstOrDefault(e => e.Idendereco == endPessoa.IdEndereco);

                    //CASO NÃO ENCONTRE EMITE UMA MENSAGEM DE QUE O ENDEREÇO NÃO PERTECE A ESSA PESSOA.
                    if (endereco == null)
                    {
                        return BadRequest($"O endereço não pertece a essa pessoa");
                    }

                    //AO LOCALIZAR PROJETA NO MODELO Endereco OS DADOS VINDO DO ATRIBUTO Endereços
                    //DO MODELO O PESSOA QUE VENHO DO PessoaDto
                    AtualizarEndereco(endereco, endPessoa);
                }
                else
                {
                    //CASO O ID NÃO SEJA MAIOR QUE 0(ZERO) É UM NOVO ENDEREÇO A SER ADICIONADO A PESSOA
                    pessoa.Enderecos.Add(NovoEndereco(endPessoa));
                }
            }

            //SALVA NO BANCO DE DAOS
            await _context.SaveChangesAsync();

            return NoContent();
        }

        //MÉTODO PARA EXCLUIR UMA PESSOA
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Pessoa>> Delete(int id)
        {
            //BUSCA A PESSOA E SEUS ENDEREÇOS E ATRIBUI A VARIÁVEL PESSOA
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            //VERIFICA SE A PESSOA EXISTE
            if (pessoa == null)
            {
                return NotFound();
            }

            //REMOVE OS ENDEREÇOS ANTES DA PESSOA (RELAÇÃO OBRIGATÓRIA)
            _context.Enderecos.RemoveRange(pessoa.Enderecos);

            //PREPARA A INSTRUÇÃO PARA EXECUTAR NO BANCO DE DADOS
            _context.Pessoas.Remove(pessoa);

            //SALVA NO BANCO DE DAOS
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static void AtualizarEndereco(Endereco endereco, EnderecoDTO dto)
        {
            endereco.Logradouro = dto.Logradouro;
            endereco.Bairro = dto.Bairro;
            endereco.Cidade = dto.Cidade;
            endereco.Uf = dto.UF;
            endereco.Cep = dto.CEP ?? string.Empty;
            endereco.Numero = dto.Numero ?? string.Empty;
            endereco.Complemento = dto.Complemento ?? string.Empty;
        }

        private static Endereco NovoEndereco(EnderecoDTO dto) => new()
        {
            Logradouro = dto.Logradouro,
            Bairro = dto.Bairro,
            Cidade = dto.Cidade,
            Uf = dto.UF,
            Cep = dto.CEP ?? string.Empty,
            Numero = dto.Numero ?? string.Empty,
            Complemento = dto.Complemento ?? string.Empty
        };

    }//FIM DA CLASSE CONTROLLER PessoaEnderecoContoller
}//FIM DO NAMESPACE
