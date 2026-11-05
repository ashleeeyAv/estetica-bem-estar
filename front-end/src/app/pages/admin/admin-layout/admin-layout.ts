import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  menu = [
    { link: '/admin', icone: '📊', nome: 'Início' },
    { link: '/admin/clientes', icone: '👥', nome: 'Clientes' },
    { link: '/admin/funcionarios', icone: '🧑‍⚕️', nome: 'Funcionários' },
    { link: '/admin/categorias', icone: '🏷️', nome: 'Categorias' },
    { link: '/admin/produtos', icone: '🧴', nome: 'Produtos' },
    { link: '/admin/servicos', icone: '💆', nome: 'Serviços' },
    { link: '/admin/pedidos', icone: '📋', nome: 'Pedidos' },
    { link: '/admin/entrada-produtos', icone: '📦', nome: 'Entrada de produtos' },
    { link: '/admin/estoque', icone: '🗃️', nome: 'Estoque' },
  ];
}