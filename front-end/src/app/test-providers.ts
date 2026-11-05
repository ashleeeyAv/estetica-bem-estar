import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';

// Providers globais dos testes: evita chamadas HTTP reais e configura o roteador.
export default [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
] as (Provider | EnvironmentProviders)[];
