export interface Endereco {
  idendereco?: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Pessoa {
  idpessoa?: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;          // 'M' ou 'F'
  email: string;
  telefone: string;
  ativo?: boolean;
  enderecos: Endereco[];
}
