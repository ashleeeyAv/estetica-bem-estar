import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Categoria } from '../models/categoria';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Categorium`;

  listar(): Observable<Categoria[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(lista => lista.map(c => ({
        idcategoria: c.idcategoria ?? c.idCategoria ?? 0,
        categoria: c.categoria ?? '',
      })))
    );
  }

  buscarPorId(id: number): Observable<Categoria> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map(c => ({
        idcategoria: c.idcategoria ?? c.idCategoria ?? id,
        categoria: c.categoria ?? '',
      }))
    );
  }

  criar(nome: string): Observable<Categoria> {
    return this.http.post<any>(this.base, { categoria: nome }).pipe(
      map(c => ({
        idcategoria: c.idcategoria ?? c.idCategoria ?? 0,
        categoria: c.categoria ?? nome,
      }))
    );
  }

  atualizar(id: number, nome: string): Observable<Categoria> {
    return this.http.put<void>(`${this.base}/${id}`, { idcategoria: id, categoria: nome }).pipe(
      map(() => ({ idcategoria: id, categoria: nome }))
    );
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
