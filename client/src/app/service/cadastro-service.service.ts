import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CadastroServiceService {

  constructor(private http: HttpClient) {}

  cadastrarParticipante(data: any): Observable<any> {
    return this.http.post(environment.apiUrl + 'registerParticipante', data);
  }

  getCitys(metodo: string): Observable<any> {
    return this.http.get(environment.apiUrl + metodo);
  }

  getRegiaos(metodo: string): Observable<any> {
    return this.http.get(environment.apiUrl + metodo);
  }

  consultarCPF(cpf: string): Observable<any> {
    return this.http.get(environment.apiUrl + 'checkcpf/' + cpf);
  }

  participanteRural(data: any): Observable<any> {
    return this.http.get(environment.apiUrl + 'participantes', { params: { status: data } });
  }

  participanteById(id: number): Observable<any> {
    return this.http.get(environment.apiUrl + 'participante/' + id)
  }

  pegarCidade(city: any): Observable<any> {
    return this.http.get(environment.apiUrl + 'takeCity/' + city)
  }

  atualizarParticipante(data: any, id: number) {
    return this.http
      .put<any>(environment.apiUrl + 'atualizaParticipante/' + id, data)
      .pipe(
        map((res: any) => {
          return res;
        }),
      );
  }

  deleteParticipante(id: number) {
    return this.http.delete<any>(environment.apiUrl + 'deletarParticipante/' + id).pipe(
      map((res: any) => {
        return res;
      }),
    );
  }
}
