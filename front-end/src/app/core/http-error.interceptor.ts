import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

// Normaliza os erros da API no formato { status, message } usado pelas páginas.
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Falha de comunicação com o servidor.';

      if (err.status === 0) {
        message = 'Não foi possível conectar ao servidor. Verifique se a API está em execução.';
      } else {
        const body = err.error;

        if (typeof body === 'string' && body.trim()) {
          message = body;
        } else if (body && typeof body === 'object') {
          message = body.mensagem ?? body.message ?? body.erro ?? body.title ?? message;
        } else if (err.message) {
          message = err.message;
        }
      }

      return throwError(() => ({ status: err.status, message }));
    })
  );
