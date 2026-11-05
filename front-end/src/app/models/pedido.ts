export type StatusPedido = 'Aberto' | 'Em processamento' | 'Concluído' | 'Cancelado';

export interface FuncionarioResumo {
  nome: string;
  cargo: string;
}

export interface PedidoItem {
  iditem: number;
  item: string;
  tipoItem: string;
  quantidade: number;
  valorUnitario: number;   // preço registrado no momento da compra
  funcionario?: FuncionarioResumo;
}

export interface Pedido {
  idatendimento: number;
  idpessoa: number;
  nomePessoa?: string;
  dataAtendimento: string;
  status: StatusPedido;
  itens: PedidoItem[];
  total: number;
}

// regra de negócio: transições permitidas (o backend deve validar o mesmo)
export const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  'Aberto': ['Em processamento', 'Cancelado'],
  'Em processamento': ['Concluído', 'Cancelado'],
  'Concluído': [],
  'Cancelado': [],
};