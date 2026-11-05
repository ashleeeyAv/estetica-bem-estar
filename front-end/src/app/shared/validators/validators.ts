import { AbstractControl, ValidationErrors } from '@angular/forms';

export function cpfValido(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '').replace(/\D/g, '');
  if (!v) return null;
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return { cpf: true };
  const digito = (base: number) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(v[i]) * (base + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(v[9]) && digito(10) === Number(v[10]) ? null : { cpf: true };
}

export function dataNaoFutura(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  const hoje = new Date().toLocaleDateString('en-CA'); // yyyy-MM-dd
  return c.value > hoje ? { futura: true } : null;
}