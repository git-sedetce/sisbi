import { Component, OnInit, ViewChild } from '@angular/core';
import { UserServiceService } from '../../../service/user-service.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-reset-senha',
  standalone: false,
  templateUrl: './reset-senha.component.html',
  styleUrl: './reset-senha.component.css'
})
export class ResetSenhaComponent implements OnInit {
  @ViewChild("formResetPassword") formResetPassword!: NgForm;
  resetSenha!: User;

  constructor(
    private serviceUser: UserServiceService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.resetSenha = new User()
  }

  reset(): void {
    this.resetSenha.user_password = this.serviceUser.CriptografarMD5(this.resetSenha.user_password);
    this.serviceUser.reset_password(this.resetSenha).subscribe({
      next:(res:any) => {
        this.toastr.success('Senha alterada com sucesso!!!')
        this.router.navigate(['/login'])
      },error: (e) => {
        console.error(e)
        this.toastr.error(e.error.message)
        this.formResetPassword.reset()
      }
    })
  }

}
