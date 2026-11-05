import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, switchMap, map } from 'rxjs';
import { CarrinhoItem } from '../models/item';
import { Pedido, StatusPedido } from '../models/pedido';
import { environment } from '../../environments/environment';
import { mapPedido, statusToCode } from '../core/api-mappers';
import { FuncionarioService } from './funcionario.service';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private funcionarioService = inject(FuncionarioService);
  private base = `${environment.apiUrl}/Atendimento`;

  private hoje(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  criar(idpessoa: number, itens: CarrinhoItem[]): Observable<Pedido> {
    if (itens.length === 0) {
      return throwError(() => ({ status: 400, message: 'O carrinho está vazio.' }));
    }

    // Regra do projeto: todo item do pedido usa o primeiro funcionário ativo.
    return this.funcionarioService.listar().pipe(
      switchMap(funcionarios => {
        const funcionario = funcionarios.find(f => f.ativo);

        if (!funcionario) {
          return throwError(() => ({
            status: 409,
            message: 'Nenhum funcionário ativo disponível para registrar o pedido.',
          }));
        }

        const corpo = {
          idPessoa: idpessoa,
          dataAtendimento: this.hoje(),
          statusAtendimento: 'A',
          itens: itens.map(c => ({
            idItem: c.item.iditem,
            idFuncionario: funcionario.idpessoa,
            quantidade: c.quantidade,
            // item.preco já é o preço de venda para produtos e o valor para serviços.
            valorUnitario: c.item.preco,
          })),
        };

        return this.http.post<any>(this.base, corpo).pipe(
          map(resposta => resposta?.idAtendimento ?? resposta?.idatendimento),
          switchMap(id => {
            if (!id) {
              return throwError(() => ({
                status: 500,
                message: 'Não foi possível confirmar o pedido criado.',
              }));
            }
            return this.buscarPorId(id);
          })
        );
      })
    );
  }

  listar(): Observable<Pedido[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(lista => lista.map(mapPedido))
    );
  }

  listarPorPessoa(idpessoa: number): Observable<Pedido[]> {
    return this.http.get<any[]>(`${this.base}/pessoa/${idpessoa}`).pipe(
      map(lista => lista.map(mapPedido))
    );
  }

  buscarPorId(id: number): Observable<Pedido> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(mapPedido));
  }

  atualizarStatus(id: number, novo: StatusPedido): Observable<Pedido> {
    return this.http
      .patch<void>(`${this.base}/${id}/status`, { statusAtendimento: statusToCode(novo) })
      .pipe(switchMap(() => this.buscarPorId(id)));
  }
}
