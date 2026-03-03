import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/seminario/home/home.component';
import { CadastroComponent } from './components/seminario/cadastro/cadastro.component';
import { ComoChegarComponent } from './components/seminario/como-chegar/como-chegar.component';
import { PalestrantesComponent } from './components/seminario/palestrantes/palestrantes.component';

const routes: Routes = [

  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'cadastroseminario', component: CadastroComponent },
  { path: 'como-chegar', component: ComoChegarComponent },
  { path: 'palestrantes', component: PalestrantesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
