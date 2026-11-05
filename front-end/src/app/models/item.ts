export interface Item {
  iditem: number;
  item: string;
  descricaoItem: string;
  preco: number;             // preço exibido: venda (produto) ou valor (serviço)
  precoCusto?: number;       // só produto: custo vindo de item.preco
  precoVenda?: number;       // só produto: preço de venda calculado pelo banco
  tipoItem: string;          // 'P' = produto, 'S' = serviço
  ativoProdutoServico: string; // 'S' = ativo, 'N' = inativo
  idcategoria: number;
  categoria?: string;
  quantidadeEstoque?: number;
  codigoPreco?: number;      // só produto
  unidade?: string;          // só produto
}

export interface CarrinhoItem {
  item: Item;
  quantidade: number;
}
