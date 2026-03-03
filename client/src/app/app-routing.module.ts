import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/seminario/home/home.component';
import { CadastroComponent } from './components/seminario/cadastro/cadastro.component';
import { ComoChegarComponent } from './components/seminario/como-chegar/como-chegar.component';
import { PalestrantesComponent } from './components/seminario/palestrantes/palestrantes.component';
import { RegisterComponent } from './components/admin/register/register.component';
import { LoginComponent } from './components/admin/login/login.component';
import { ResetSenhaComponent } from './components/admin/reset-senha/reset-senha.component';
import { ListaUsersComponent } from './components/admin/lista-users/lista-users.component';
import { HomeAdminComponent } from './components/admin/home-admin/home-admin.component';
import { CrachaComponent } from './components/admin/cracha/cracha.component';

const routes: Routes = [

  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'cadastroseminario', component: CadastroComponent },
  { path: 'como-chegar', component: ComoChegarComponent },
  { path: 'palestrantes', component: PalestrantesComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'resetSenha', component: ResetSenhaComponent },
  { path: 'listusers', component: ListaUsersComponent },
  { path: 'admin', component: HomeAdminComponent },
  { path: 'cracha', component: CrachaComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
