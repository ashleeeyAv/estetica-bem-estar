import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Item } from '../models/item';
import { environment } from '../../environments/environment';
import { calcularPrecoVenda, mapItem } from '../core/api-mappers';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  listar(): Observable<Item[]> {
    return this.http
      .get<any[]>(`${this.base}/Item`)
      .pipe(map(lista => lista.map(mapItem)));
  }

  buscarPorId(id: number): Observable<Item> {
    return this.http
      .get<any>(`${this.base}/Item/${id}`)
      .pipe(map(mapItem));
  }

  criar(dados: Omit<Item, 'iditem'>): Observable<void> {
    const corpo = this.paraProdutoDTO(dados);
    const url = dados.tipoItem === 'S'
      ? `${this.base}/Servico`
      : `${this.base}/ProdutoItem`;

    return this.http.post<void>(url, corpo);
  }

  atualizar(item: Item): Observable<void> {
    const corpo = this.paraProdutoDTO(item);
    const url = item.tipoItem === 'S'
      ? `${this.base}/Servico/${item.iditem}`
      : `${this.base}/ProdutoItem/${item.iditem}`;

    return this.http.put<void>(url, corpo);
  }

  // desativar em vez de apagar: o item pode já ter pedidos/movimentações
  alterarSituacao(id: number, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.base}/Item/${id}/situacao`, { ativo });
  }

  // Converte o modelo da tela para o DTO esperado pelo backend.
  private paraProdutoDTO(item: Omit<Item, 'iditem'> | Item) {
    const ehProduto = item.tipoItem === 'P';
    const custo = item.precoCusto ?? item.preco;

    return {
      idCategoria: item.idcategoria,
      item: item.item,
      descricaoItem: item.descricaoItem,
      // No banco, item.preco guarda o CUSTO do produto (ou o valor do serviço).
      preco: ehProduto ? custo : item.preco,
      tipoItem: item.tipoItem,
      ativoProdutoServico: item.ativoProdutoServico ?? 'S',
      codigoPreco: ehProduto ? (item.codigoPreco ?? 1) : 0,
      precoVenda: ehProduto ? calcularPrecoVenda(custo, item.codigoPreco) : undefined,
      unidade: ehProduto ? (item.unidade ?? 'UN') : undefined,
    };
  }
}
