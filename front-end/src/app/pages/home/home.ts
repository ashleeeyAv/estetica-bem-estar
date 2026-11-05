import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  destaques = [
    { icone: '💆', titulo: 'Massagens', texto: 'Relaxe o corpo e a mente com nossas técnicas exclusivas.' },
    { icone: '✨', titulo: 'Tratamentos Faciais', texto: 'Cuidados que renovam e iluminam a pele.' },
    { icone: '🧴', titulo: 'Produtos', texto: 'Linha selecionada de cuidados pessoais para o dia a dia.' },
  ];
}