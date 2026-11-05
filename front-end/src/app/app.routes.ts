import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Catalogo } from './pages/catalogo/catalogo';
import { Carrinho } from './pages/carrinho/carrinho';
import { Cadastro } from './pages/cadastro/cadastro';
import { MeusPedidos } from './pages/meus-pedidos/meus-pedidos';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { AdminInicio } from './pages/admin/admin-inicio/admin-inicio';
import { AdminItens } from './pages/admin/admin-itens/admin-itens';
import { AdminPedidos } from './pages/admin/admin-pedidos/admin-pedidos';
import { AdminEntradaProdutos } from './pages/admin/admin-entrada-produtos/admin-entrada-produtos';
import { AdminEstoque } from './pages/admin/admin-estoque/admin-estoque';
import { AdminCategorias } from './pages/admin/admin-categorias/admin-categorias';
import { AdminClientes } from './pages/admin/admin-clientes/admin-clientes';
import { AdminFuncionarios } from './pages/admin/admin-funcionarios/admin-funcionarios';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogo', component: Catalogo },
  { path: 'carrinho', component: Carrinho },
  { path: 'cadastro', component: Cadastro },
  { path: 'meus-pedidos', component: MeusPedidos },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', component: AdminInicio },
      { path: 'clientes', component: AdminClientes },
      { path: 'funcionarios', component: AdminFuncionarios },
      { path: 'categorias', component: AdminCategorias },
      { path: 'produtos', component: AdminItens, data: { tipo: 'P' } },
      { path: 'servicos', component: AdminItens, data: { tipo: 'S' } },
      { path: 'pedidos', component: AdminPedidos },
      { path: 'entrada-produtos', component: AdminEntradaProdutos },
      { path: 'estoque', component: AdminEstoque },
      { path: '**', redirectTo: '' }
    ]
  },
  { path: '**', redirectTo: '' }
];