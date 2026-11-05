import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EntradaProduto } from '../models/entrada-produto';
import { environment } from '../../environments/environment';
import { mapEntrada } from '../core/api-mappers';

@Injectable({ providedIn: 'root' })
export class EntradaProdutoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/EntradaProduto`;

  listar(): Observable<EntradaProduto[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(lista => lista.map(mapEntrada))
    );
  }

  criar(d: Omit<EntradaProduto, 'identradaProduto' | 'item'>): Observable<EntradaProduto> {
    // O trigger do banco atualiza estoque, custo e preço de venda na mesma transação.
    const corpo = {
      iditem: d.iditem,
      dataEntradaProduto: d.dataEntrada,
      quantidadeEntrada: d.quantidadeEntrada,
      unidade: d.unidade,
      valorUnitarioEntrada: d.valorUnitarioEntrada,
    };

    return this.http.post<any>(this.base, corpo).pipe(map(mapEntrada));
  }
}
