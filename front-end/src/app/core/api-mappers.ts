import { Item } from '../models/item';
import { Pedido, PedidoItem, StatusPedido } from '../models/pedido';
import { Funcionario } from '../models/funcionario';
import { Endereco, Pessoa } from '../models/pessoa';
import { EntradaProduto } from '../models/entrada-produto';

const STATUS_POR_CODIGO: Record<string, StatusPedido> = {
  A: 'Aberto',
  P: 'Em processamento',
  C: 'Concluído',
  X: 'Cancelado',
};

const CODIGO_POR_STATUS: Record<StatusPedido, string> = {
  Aberto: 'A',
  'Em processamento': 'P',
  Concluído: 'C',
  Cancelado: 'X',
};

export function statusFromCode(code: string | null | undefined): StatusPedido {
  return STATUS_POR_CODIGO[String(code ?? '').toUpperCase()] ?? 'Aberto';
}

export function statusToCode(status: StatusPedido): string {
  return CODIGO_POR_STATUS[status] ?? 'A';
}

export function onlyDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function cpfToString(value: unknown): string {
  return onlyDigits(value).padStart(11, '0');
}

// Mesma regra da função fn_calc_preco_venda do MySQL.
export function calcularPrecoVenda(custo: number, codigoPreco?: number): number {
  const fator = codigoPreco === 1 ? 0.04 : codigoPreco === 2 ? 0.08 : codigoPreco === 3 ? 0.10 : 0;
  return Math.round((custo + custo * fator) * 100) / 100;
}

export function mapEndereco(raw: any): Endereco {
  return {
    idendereco: raw?.idEndereco ?? raw?.idendereco,
    cep: onlyDigits(raw?.cep),
    logradouro: raw?.logradouro ?? '',
    numero: raw?.numero ?? '',
    complemento: raw?.complemento ?? '',
    bairro: raw?.bairro ?? '',
    cidade: raw?.cidade ?? '',
    uf: String(raw?.uf ?? '').toUpperCase(),
  };
}

export function mapPessoa(raw: any): Pessoa {
  return {
    idpessoa: raw?.idPessoa ?? raw?.idpessoa,
    nome: raw?.nome ?? '',
    cpf: cpfToString(raw?.cpf),
    dataNascimento: raw?.dataNascimento ?? '',
    sexo: raw?.sexo ?? '',
    email: raw?.email ?? '',
    telefone: onlyDigits(raw?.telefone),
    ativo: (raw?.ativoPessoa ?? 'S') === 'S',
    enderecos: Array.isArray(raw?.enderecos) ? raw.enderecos.map(mapEndereco) : [],
  };
}

export function mapFuncionario(raw: any): Funcionario {
  return {
    idpessoa: raw?.idPessoa ?? raw?.idpessoa,
    nome: raw?.nome ?? '',
    cpf: cpfToString(raw?.cpf),
    dataNascimento: raw?.dataNascimento ?? '',
    sexo: raw?.sexo ?? '',
    email: raw?.email ?? '',
    telefone: onlyDigits(raw?.telefone),
    cargo: raw?.cargo ?? '',
    dataAdmissao: raw?.dataAdmissao ?? '',
    ativo: (raw?.ativoPessoa ?? 'S') === 'S',
    enderecos: Array.isArray(raw?.enderecos) ? raw.enderecos.map(mapEndereco) : [],
  };
}

export function mapItem(raw: any): Item {
  const tipoItem = raw?.tipoItem ?? 'P';
  const custo = Number(raw?.preco ?? 0);
  const venda = raw?.precoVenda != null ? Number(raw.precoVenda) : custo;

  return {
    iditem: raw?.iditem ?? raw?.idItem ?? 0,
    item: raw?.item ?? '',
    descricaoItem: raw?.descricaoItem ?? '',
    preco: tipoItem === 'P' ? venda : custo,
    precoCusto: tipoItem === 'P' ? custo : undefined,
    precoVenda: raw?.precoVenda != null ? Number(raw.precoVenda) : undefined,
    tipoItem,
    ativoProdutoServico: raw?.ativoProdutoServico ?? 'S',
    idcategoria: raw?.idcategoria ?? raw?.idCategoria ?? 0,
    categoria: raw?.categoria ?? undefined,
    quantidadeEstoque: raw?.quantidadeEstoque ?? undefined,
    codigoPreco: raw?.codigoPreco ?? undefined,
    unidade: raw?.unidade ?? undefined,
  };
}

export function mapPedido(raw: any): Pedido {
  const itens: PedidoItem[] = Array.isArray(raw?.itens)
    ? raw.itens.map((i: any) => ({
        iditem: i?.idItem ?? i?.iditem ?? 0,
        item: i?.item ?? '',
        tipoItem: i?.tipoItem ?? 'P',
        quantidade: Number(i?.quantidade ?? 0),
        valorUnitario: Number(i?.valorUnitario ?? 0),
        funcionario: i?.nomeFuncionario
          ? { nome: i.nomeFuncionario, cargo: i.cargo ?? '' }
          : i?.funcionario,
      }))
    : [];

  return {
    idatendimento: raw?.idAtendimento ?? raw?.idatendimento ?? 0,
    idpessoa: raw?.idPessoa ?? raw?.idpessoa ?? 0,
    nomePessoa: raw?.nomePessoa ?? undefined,
    dataAtendimento: raw?.dataAtendimento ?? '',
    status: statusFromCode(raw?.statusAtendimento ?? raw?.status),
    itens,
    total: itens.reduce((soma, i) => soma + i.valorUnitario * i.quantidade, 0),
  };
}

export function mapEntrada(raw: any): EntradaProduto {
  return {
    identradaProduto: raw?.identradaProduto ?? 0,
    iditem: raw?.iditem ?? 0,
    item: raw?.item ?? '',
    dataEntrada: raw?.dataEntradaProduto ?? raw?.dataEntrada ?? '',
    quantidadeEntrada: Number(raw?.quantidadeEntrada ?? 0),
    unidade: raw?.unidade ?? '',
    valorUnitarioEntrada: Number(raw?.valorUnitarioEntrada ?? 0),
  };
}
