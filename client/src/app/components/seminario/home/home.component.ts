import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  bloqueadoPorData: boolean = false;

  ngOnInit(): void {
    const agora = new Date();
    const dataLimite = new Date(2026, 2, 12, 15, 0, 0); // 12/03/2026 15:00
    // mês começa em 0 -> 2 = março

    this.bloqueadoPorData = agora >= dataLimite;
  }

}
