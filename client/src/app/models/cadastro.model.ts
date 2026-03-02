export class Cadastro {
  constructor(
    public id?: number,
    public inscricao?: string,
    public nome?: string,
    public email?: string,
    public telefone?: string,
    public cpf?: string,
    public empresa?: string,
    public cargo?: string,
    public cidade_id?: string,
    public confirma_informacao?: boolean,
    public uso_dados: boolean = false,
  ) {}
}
