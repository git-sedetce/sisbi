import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { CadastroServiceService } from '../../../service/cadastro-service.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserServiceService } from '../../../service/user-service.service';
import { AuditService } from '../../../service/audit.service';
import { ToastrService } from 'ngx-toastr';
import { Audit } from '../../../models/audit.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Cadastro } from '../../../models/cadastro.model';

declare var bootstrap: any;

@Component({
  selector: 'app-home-admin',
  standalone: false,
  templateUrl: './home-admin.component.html',
  styleUrl: './home-admin.component.css',
})
export class HomeAdminComponent implements OnInit {
  //====Variáveis do MAPA=====//
  totalInscritos = 0;
  totalInscritosRegiao = 0;
  totalInscritosConfirmados = 0;
  totalInscritosPendentes = 0;
  municipioSelecionado = '';
  municipios: any[] = [];
  private map!: L.Map;
  mapaFullscreen = false;

  //====Variáveis de acesso=====//
  registro!: Audit;
  profile_id!: any;
  user_name!: any;
  filterPeople: boolean = false;

  //====Variáveis da Tabela=====//
  peopleObj: Cadastro = new Cadastro();
  lista_inscritos: any[] = [];
  lista_cidade: any[] = [];
  lista_filtrada: any[] = [];
  formFiltro!: FormGroup;
  formPeople!: FormGroup;
  filtroPeople!: FormGroup;
  searchPeople: string = '';
  searchCidade: string = '';
  searchStatus: string = '';
  numeroInscricao: number | '' = '';

  page: number = 1; // Página atual
  itemsPerPage: number = 10; // Itens por página

  constructor(
    private cadastroService: CadastroServiceService,
    private serviceUser: UserServiceService,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private auditService: AuditService,
  ) {}

  ngOnInit(): void {
    this.formPeople = this.formBuilder.group({
      id: [''],
      nome: [''],
      telefone: [''],
      cpf: [''],
      email: [''],
      cargo: [''],
      status: [''],
      cidade_id: [''],
    });

    this.formFiltro = this.formBuilder.group({
      nome: [''],
      cidade: [''],
      status: [''], // ⚠️ nome correto do control
      dataInicio: [''],
      dataFim: [''],
    });

    this.registro = new Audit();
    this.getInscritos();
    this.carregarDados();
    this.loadUserData();
    this.pegarCidades();
  }

  loadUserData() {
    const user = this.serviceUser.getUser();
    if (!user) return;
    this.profile_id = user._profile_id;
    this.registro.user_id = user._id;
    this.user_name = user._user_name;
  }

  carregarDados() {
    this.cadastroService.contarInscritos().subscribe((res) => {
      this.totalInscritos = res.total;
    });

    this.cadastroService.contarInscritosStatus().subscribe((res) => {
      this.totalInscritosConfirmados = res.inscricao_realizada;
      this.totalInscritosPendentes = res.pendente;
    });

    // 🔴 IMPORTANTE: inncritos por município + mapa
    this.cadastroService.dadosMapa().subscribe((res) => {
      this.municipios = res;
      this.initMapa();
    });
  }

  toggleFullscreen() {
    this.mapaFullscreen = !this.mapaFullscreen;

    // Aguarda o DOM atualizar antes de recalcular o mapa
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  // ================= MAPA =================
  initMapa() {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('mapa-ceara').setView([-5.2, -39.5], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    fetch('assets/geojson/geojs-mun.json')
      .then((res) => res.json())
      .then((geoJson) => {
        // 🔹 Municípios (polígonos)
        L.geoJSON(geoJson, {
          style: (feature: any) => this.estiloMunicipio(feature),
          onEachFeature: (
            feature: { properties: { name: any } },
            layer: { bindPopup: (arg0: string) => void },
          ) => {
            const nome = feature.properties.name;
            const dados = this.getDadosMunicipio(nome);

            layer.bindPopup(`
            <strong>${nome}</strong><br>
            🧾 Total de inscritos: <strong>${dados.total_inscritos}</strong><br>
            ✅ Inscrições Aprovadas: <strong>${dados.total_inscricao_realizada}</strong><br>
            ⏳ Inscrições Pendentes: <strong>${dados.total_inscricao_pendente}</strong>
          `);
          },
        }).addTo(this.map);
      });
  }

  normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  getDadosMunicipio(nomeMunicipio: string) {
    const municipio = this.municipios.find(
      (m) => this.normalize(m.nome_municipio) === this.normalize(nomeMunicipio),
    );

    if (!municipio) {
      return {
        total_inscritos: 0,
        total_inscricao_realizada: 0,
        total_inscricao_pendente: 0,
      };
    }

    return {
      total_inscritos: Number(municipio.total_inscritos) || 0,
      total_inscricao_realizada:
        Number(municipio.total_inscricao_realizada) || 0,
      total_inscricao_pendente: Number(municipio.total_inscricao_pendente) || 0,
    };
  }

  estiloMunicipio(feature: any) {
    const dados = this.getDadosMunicipio(feature.properties.name);
    return {
      fillColor: this.getCor(dados.total_inscritos, this.totalInscritos),
      weight: 1,
      color: '#555',
      fillOpacity: 0.75,
    };
  }

  getCor(qtd: number, max: number): string {
    if (qtd < 1) return '#FFEDA0';

    const escala = [
      '#E5F5E0',
      '#C7E9C0',
      '#A1D99B',
      '#74C476',
      '#41AB5D',
      '#238B45',
      '#1B7A3A',
      '#166534',
      '#145A32',
      '#0B3D1E',
    ];

    const indice = Math.min(
      escala.length - 1,
      Math.floor((qtd / max) * escala.length),
    );

    return escala[indice];
  }

  //==================Edição de Tabelas==================//

  getInscritos() {
    this.cadastroService.participante(true).subscribe(
      (usr: any[]) => {
        this.lista_inscritos = usr;
        this.lista_filtrada = usr; // inicia filtrada
      },
      (erro: any) => console.error(erro),
    );
  }

  filtrarUsuarios(): void {
    const { nome, cidade, status, dataInicio, dataFim } = this.formFiltro.value;

    const termo = this.normalize(nome || '');

    this.lista_filtrada = this.lista_inscritos.filter((people) => {
      const matchNome = !nome || this.normalize(people.nome).includes(termo);

      const matchCidade =
        !cidade || people?.ass_cadastro_cidade?.nome_municipio === cidade;

      const matchStatus = !status || people?.status === status;

      const dataCadastro = new Date(people.createdAt);

      const matchDataInicio =
        !dataInicio || dataCadastro >= new Date(dataInicio);

      const matchDataFim =
        !dataFim || dataCadastro <= new Date(`${dataFim}T23:59:59`);

      return (
        matchNome &&
        matchCidade &&
        matchStatus &&
        matchDataInicio &&
        matchDataFim
      );
    });

    this.page = 1;
  }

  limparFiltros(): void {
    this.formFiltro.reset({
      nome: '',
      cidade: '',
      status: '',
      dataInicio: '',
      dataFim: '',
    });

    this.lista_filtrada = [...this.lista_inscritos];
    this.page = 1;
  }

  exibirTodos(): void {
    this.searchPeople = '';
    this.searchCidade = '';
    this.searchStatus = '';

    this.lista_filtrada = [...this.lista_inscritos];
    this.page = 1;
  }

  pegarCidades() {
    this.cadastroService.getCitys('takecitys').subscribe(
      (cityCE: any[]) => {
        // console.log('CIDADES RECEBIDAS:', cityCE);
        this.lista_cidade = cityCE;
      },
      (erro: any) => console.error('erro', erro),
    );
  }

  exportarPlanilha(tipo: 'todos' | 'filtrados'): void {
    const dados = tipo === 'todos' ? this.lista_inscritos : this.lista_filtrada;

    if (!dados || dados.length === 0) {
      this.toastr.warning('Nenhum dado para exportar');
      return;
    }

    const planilha = dados.map((people) => ({
      Inscrição: people.inscricao,
      Nome: people.nome,
      Telefone: people.telefone,
      CPF: people.cpf,
      Email: people.email,
      Cargo: people.cargo,
      Município: people.ass_cadastro_cidade?.nome_municipio ?? '',
      Região: people.ass_cadastro_cidade?.ass_municipio_regiao?.nome ?? '',
      Status: people.nome_propriedade,
      Data_Cadastro: people.createdAt,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(planilha);
    const workbook: XLSX.WorkBook = {
      Sheets: { Agricultores: worksheet },
      SheetNames: ['Agricultores'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const nomeArquivo =
      tipo === 'todos'
        ? 'agricultores_todos.xlsx'
        : 'agricultores_filtrados.xlsx';

    saveAs(blob, nomeArquivo);

    this.saveAudit('Exportação de planilha');
  }

  onEdit(people: any) {
    this.peopleObj.id = people.id;
    this.numeroInscricao = people.inscricao;
    this.formPeople.controls['nome'].setValue(people.nome);
    this.formPeople.controls['email'].setValue(people.email);
    this.formPeople.controls['telefone'].setValue(people.telefone);
    this.formPeople.controls['cpf'].setValue(people.cpf);
    this.formPeople.controls['cargo'].setValue(people.cargo);
    this.formPeople.controls['status'].setValue(people.status);
    this.formPeople.controls['cidade_id'].setValue(
      people.ass_cadastro_cidade.id,
    );
  }

  updatePeople() {
    this.peopleObj.nome = this.formPeople.value.nome;
    this.peopleObj.email = this.formPeople.value.email;
    this.peopleObj.telefone = this.formPeople.value.telefone;
    this.peopleObj.cpf = this.formPeople.value.cpf;
    this.peopleObj.cargo = this.formPeople.value.cargo;
    this.peopleObj.status = this.formPeople.value.status;
    this.peopleObj.cidade_id = this.formPeople.value.cidade_id;

    this.cadastroService
      .atualizarParticipante(this.peopleObj, Number(this.peopleObj.id))
      .subscribe((res) => {
        this.toastr.success('Atualiação realizada com sucesso!!!');
        this.formPeople.reset();
        this.getInscritos();

        // 🔥 Fechar modal
        const modalEl = document.getElementById('modalEdit');
        if (modalEl) {
          const modal =
            bootstrap.Modal.getInstance(modalEl) ||
            new bootstrap.Modal(modalEl);
          modal.hide();
        }
      });

    this.saveRegister(this.peopleObj.nome, 'Alteração de dados do agricultor');
  }

  cracha(id: number) {}

  deletar(people: any) {
    this.cadastroService.deleteParticipante(people.id).subscribe((res) => {
      this.toastr.success(res.mensagem);
      this.getInscritos();
    });

    this.saveRegister(people.nome, 'Exclusão de Inscrito rural');
  }

  saveRegister(name: any, tipo: any): void {
    this.registro.tipo_acao = tipo;
    this.registro.acao = `O usuário ${this.user_name} alterou os dados do inscrito ${name}`;
    this.auditService.cadastrarRegistros(this.registro).subscribe({
      next: (res: any) => {
        // console.log('registro', res)
      },
      error: (e) => console.error('erro ao salvar registro', e),
    });
  }

  saveAudit(tipo: any): void {
    this.registro.tipo_acao = tipo;
    this.registro.acao = `O usuário ${this.user_name} Exportou uma planilha dos inscritos`;
    this.auditService.cadastrarRegistros(this.registro).subscribe({
      next: (res: any) => {
        // console.log('registro', res)
      },
      error: (e) => console.error('erro ao salvar registro', e),
    });
  }
}
