import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Cadastro } from '../../../models/cadastro.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CadastroServiceService } from '../../../service/cadastro-service.service';

@Component({
  selector: 'app-cadastro',
  standalone: false,
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.css',
})
export class CadastroComponent implements OnInit {
  @ViewChild('formParticipante') formParticipante!: NgForm;
  participante!: Cadastro;
  city_list!: any[];
  statusInscricao: 'sucesso' | 'pendente' | null = null;
  mostrarResultado = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService,
    private cadastroService: CadastroServiceService,
  ) {}

  ngOnInit(): void {
    this.participante = new Cadastro();
    this.getCity();
  }

  getCity() {
    this.cadastroService.getCitys('takecitys').subscribe(
      (cityBr: any[]) => {
        // console.log('cityBr', cityBr)
        this.city_list = cityBr;
      },
      (erro: any) => console.error('erro', erro),
    );
  }

  consultaCPF(epf: any, form: any) {
    this.cadastroService.consultarCPF(epf).subscribe((res: any) => {
      if (res.mensagem === 'CPF/CNPJ já cadastrado!') {
        this.toastr.error(res.mensagem);
        this.formParticipante.reset();
      }
    });
  }

  cadastrarParticipante() {
  this.cadastroService.cadastrarParticipante(this.participante).subscribe({
    next: (response: any) => {

      if (response.status === 'Inscricao_realizada') {
        this.statusInscricao = 'sucesso';
      }
      else if (response.status === 'Pendente') {
        this.statusInscricao = 'pendente';
      }

      this.mostrarResultado = true;

      this.formParticipante.reset();
    },

    error: (e) => {
      this.toastr.error(e.error.message || 'Erro ao realizar cadastro.');
    },
  });
}
}
