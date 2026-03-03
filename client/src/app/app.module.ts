import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/estrutura/header/header.component';
import { FooterComponent } from './components/estrutura/footer/footer.component';
import { HomeComponent } from './components/seminario/home/home.component';
import { CadastroComponent } from './components/seminario/cadastro/cadastro.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxApexchartsModule } from 'ngx-apexcharts';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AuthInterceptor } from './service/interceptor/auth.interceptor';
import { ComoChegarComponent } from './components/seminario/como-chegar/como-chegar.component';
import { PalestrantesComponent } from './components/seminario/palestrantes/palestrantes.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    CadastroComponent,
    ComoChegarComponent,
    PalestrantesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    NgxMaskModule.forRoot(),
    NgxPaginationModule,
    FormsModule,
    NgxApexchartsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    provideClientHydration(),
    DatePipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
