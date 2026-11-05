export interface EntradaProduto {
  identradaProduto: number;
  iditem: number;
  item: string;                 // nome do produto (para exibir)
  dataEntrada: string;          // yyyy-MM-dd
  quantidadeEntrada: number;
  unidade: string;
  valorUnitarioEntrada: number;
}