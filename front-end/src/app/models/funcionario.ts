import { Endereco } from './pessoa';

export interface Funcionario {
  idpessoa: number;
  nome: string;
  cpf: string;
  dataNascimento: string;   // yyyy-MM-dd
  sexo: string;             // 'F' ou 'M'
  email: string;
  telefone: string;
  cargo: string;            // até 20 caracteres
  dataAdmissao: string;     // yyyy-MM-dd
  ativo: boolean;
  enderecos?: Endereco[];   // preservados do cadastro original
}
