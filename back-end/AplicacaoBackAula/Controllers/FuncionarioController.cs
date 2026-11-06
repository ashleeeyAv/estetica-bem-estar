using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    //ANOTAÇÕES DE IDENTIFICAÇÃO DE CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class FuncionarioController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public FuncionarioController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //LISTAR TODOS OS FUNCIONÁRIOS (com pessoa e endereços)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FuncionarioDTO>>> GetAll()
        {
            var funcionarios = await _context.Funcionarios
                .Select(f => new FuncionarioDTO
                {
                    IdPessoa = f.Idpessoa,
                    Nome = f.IdpessoaNavigation.Nome,
                    CPF = (long)f.IdpessoaNavigation.Cpf,
                    DataNascimento = f.IdpessoaNavigation.DataNascimento,
                    sexo = f.IdpessoaNavigation.Sexo,
                    email = f.IdpessoaNavigation.Email,
                    telefone = (long)f.IdpessoaNavigation.Telefone,
                    AtivoPessoa = f.IdpessoaNavigation.AtivoPessoa,
                    Cargo = f.Cargo,
                    DataAdmissao = f.DataAdmissao,

                    Enderecos = f.IdpessoaNavigation.Enderecos.Select(e => new EnderecoDTO
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
                }).ToListAsync();

            return Ok(funcionarios);
        }

        //BUSCAR UM FUNCIONÁRIO PELO ID
        [HttpGet("{id}")]
        public async Task<ActionResult<FuncionarioDTO>> GetFuncionario(int id)
        {
            var funcionario = await _context.Funcionarios
                .Where(f => f.Idpessoa == id)
                .Select(f => new FuncionarioDTO
                {
                    IdPessoa = f.Idpessoa,
                    Nome = f.IdpessoaNavigation.Nome,
                    CPF = (long)f.IdpessoaNavigation.Cpf,
                    DataNascimento = f.IdpessoaNavigation.DataNascimento,
                    sexo = f.IdpessoaNavigation.Sexo,
                    email = f.IdpessoaNavigation.Email,
                    telefone = (long)f.IdpessoaNavigation.Telefone,
                    AtivoPessoa = f.IdpessoaNavigation.AtivoPessoa,
                    Cargo = f.Cargo,
                    DataAdmissao = f.DataAdmissao,

                    Enderecos = f.IdpessoaNavigation.Enderecos.Select(e => new EnderecoDTO
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
                }).FirstOrDefaultAsync();

            if (funcionario == null)
            {
                return NotFound(new { mensagem = "Funcionário não encontrado." });
            }

            return Ok(funcionario);
        }

        //CADASTRAR FUNCIONÁRIO (tabelas pessoa, funcionario e endereco)
        [HttpPost]
        public async Task<ActionResult<FuncionarioDTO>> Post(FuncionarioDTO dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                //DADOS PESSOA + ENDEREÇOS
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

                //DADOS FUNCIONÁRIO (usa o id gerado da pessoa)
                var funcionario = new Funcionario
                {
                    Idpessoa = pessoa.Idpessoa,
                    Cargo = dto.Cargo,
                    DataAdmissao = dto.DataAdmissao
                };

                _context.Funcionarios.Add(funcionario);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                dto.IdPessoa = pessoa.Idpessoa;
                foreach (var e in pessoa.Enderecos)
                {
                    var end = dto.Enderecos[pessoa.Enderecos.ToList().IndexOf(e)];
                    end.IdEndereco = e.Idendereco;
                    end.IdPessoa = pessoa.Idpessoa;
                }

                return CreatedAtAction(nameof(GetFuncionario), new { id = pessoa.Idpessoa }, dto);
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException my && my.Number == 1062)
            {
                await transaction.RollbackAsync();
                return Conflict(new { mensagem = "Já existe cadastro com esses dados (CPF ou e-mail)." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    mensagem = "ERRO NO CADASTRO",
                    erro = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        //ALTERAR FUNCIONÁRIO (pessoa, cargo e endereços)
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, FuncionarioDTO dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var funcionario = await _context.Funcionarios
                    .Include(f => f.IdpessoaNavigation)
                        .ThenInclude(p => p.Enderecos)
                    .FirstOrDefaultAsync(f => f.Idpessoa == id);

                if (funcionario == null)
                {
                    return NotFound(new { mensagem = "Funcionário não encontrado." });
                }

                var pessoa = funcionario.IdpessoaNavigation;

                //DADOS PESSOA
                pessoa.Nome = dto.Nome;
                pessoa.Cpf = dto.CPF;
                pessoa.DataNascimento = dto.DataNascimento;
                pessoa.Sexo = dto.sexo;
                pessoa.Email = dto.email;
                pessoa.Telefone = dto.telefone;
                pessoa.AtivoPessoa = string.IsNullOrWhiteSpace(dto.AtivoPessoa) ? pessoa.AtivoPessoa : dto.AtivoPessoa;

                //DADOS FUNCIONÁRIO
                funcionario.Cargo = dto.Cargo;
                funcionario.DataAdmissao = dto.DataAdmissao;

                //ENDEREÇOS: remove os que não vieram, atualiza os existentes e adiciona os novos
                var idsRecebidos = dto.Enderecos
                    .Where(e => e.IdEndereco.HasValue)
                    .Select(e => e.IdEndereco!.Value)
                    .ToHashSet();

                var enderecosRemover = pessoa.Enderecos
                    .Where(e => !idsRecebidos.Contains(e.Idendereco))
                    .ToList();

                _context.Enderecos.RemoveRange(enderecosRemover);

                foreach (var endDto in dto.Enderecos)
                {
                    if (endDto.IdEndereco != null)
                    {
                        var endereco = pessoa.Enderecos
                            .FirstOrDefault(e => e.Idendereco == endDto.IdEndereco);

                        if (endereco == null)
                        {
                            return BadRequest(new { mensagem = "O endereço não pertence a esse funcionário." });
                        }

                        endereco.Logradouro = endDto.Logradouro;
                        endereco.Bairro = endDto.Bairro;
                        endereco.Cidade = endDto.Cidade;
                        endereco.Uf = endDto.UF;
                        endereco.Numero = endDto.Numero ?? string.Empty;
                        endereco.Cep = endDto.CEP ?? string.Empty;
                        endereco.Complemento = endDto.Complemento ?? string.Empty;
                    }
                    else
                    {
                        pessoa.Enderecos.Add(new Endereco
                        {
                            Logradouro = endDto.Logradouro,
                            Bairro = endDto.Bairro,
                            Cidade = endDto.Cidade,
                            Uf = endDto.UF,
                            Numero = endDto.Numero ?? string.Empty,
                            Cep = endDto.CEP ?? string.Empty,
                            Complemento = endDto.Complemento ?? string.Empty
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException my && my.Number == 1062)
            {
                await transaction.RollbackAsync();
                return Conflict(new { mensagem = "Já existe cadastro com esses dados (CPF ou e-mail)." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    mensagem = "ERRO NO ALTERAR",
                    erro = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        //ATIVA/DESATIVA O FUNCIONÁRIO SEM ALTERAR OS DEMAIS DADOS
        [HttpPatch("{id:int}/situacao")]
        public async Task<IActionResult> AlterarSituacao(int id, SituacaoDTO dto)
        {
            var funcionario = await _context.Funcionarios
                .Include(f => f.IdpessoaNavigation)
                .FirstOrDefaultAsync(f => f.Idpessoa == id);

            if (funcionario == null)
            {
                return NotFound(new { mensagem = "Funcionário não encontrado." });
            }

            funcionario.IdpessoaNavigation.AtivoPessoa = dto.Ativo ? "S" : "N";
            await _context.SaveChangesAsync();

            return NoContent();
        }

        //EXCLUIR FUNCIONÁRIO (endereços, funcionario e pessoa)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var funcionario = await _context.Funcionarios
                    .Include(f => f.IdpessoaNavigation)
                        .ThenInclude(p => p.Enderecos)
                    .FirstOrDefaultAsync(f => f.Idpessoa == id);

                if (funcionario == null)
                {
                    return NotFound(new { mensagem = "Funcionário não encontrado." });
                }

                var pessoa = funcionario.IdpessoaNavigation;

                _context.Enderecos.RemoveRange(pessoa.Enderecos);
                _context.Funcionarios.Remove(funcionario);
                _context.Pessoas.Remove(pessoa);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException my && my.Number == 1451)
            {
                //FUNCIONÁRIO JÁ ATUOU EM ATENDIMENTOS (restrição de integridade)
                await transaction.RollbackAsync();
                return Conflict(new
                {
                    mensagem = "O funcionário possui atendimentos vinculados e não pode ser excluído."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    mensagem = "Erro ao excluir funcionário.",
                    erro = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

    }//FIM CLASSE
}//FIM NAMESPACE