const database = require("../models");
const { Op, Sequelize, where } = require("sequelize");
const fs = require("fs");
const path = require("path");

class CadastroControllers {
  static async cadastroParticipante(req, res) {
    const newRegister = req.body;

    try {
      // 1️⃣ Verifica se já existe cadastro para a cidade
      const cadastroExistente = await database.Cadastro.findOne({
        where: { cidade_id: newRegister.cidade_id },
      });

      // 2️⃣ Define o status conforme regra
      const statusInscricao = cadastroExistente
        ? "pendente"
        : "inscricao_realizada";

      // 3️⃣ Cria o registro já com o status
      const novoParticipante = await database.Cadastro.create({
        ...newRegister,
        status: statusInscricao,
      });

      // 4️⃣ Gera número do pedido
      const numeroPedido = `PED-${String(novoParticipante.id).padStart(6, "0")}`;

      await novoParticipante.update({
        inscricao: numeroPedido,
      });

      return res.status(200).json(novoParticipante);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async pegaCidades(req, res) {
    try {
      const cidadesFiltradas = await database.Cidade.findAll({
        order: [["nome_municipio", "ASC"]],
        attributes: ["id", "nome_municipio"],
      });

      return res.status(200).json(cidadesFiltradas);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async pegaRegiao(req, res) {
    try {
      const regioesFiltradas = await database.regiao.findAll({
        order: [["nome", "ASC"]],
        attributes: ["id", "nome"],
      });

      return res.status(200).json(regioesFiltradas);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async consultarCPF(req, res) {
    const { cpf } = req.params;
    try {
      const verificaCPF = await database.Cadastro.findOne({
        where: { cpf_cnpj: cpf },
        attributes: ["nome", "cpf"],
      });
      if (verificaCPF === null) {
        return res
          .status(200)
          .json({ mensagem: `CPF autorizado para cadastro` });
      } else {
        return res.status(200).json({ mensagem: `CPF já cadastrado!` });
      }
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async verParticipantes(req, res) {
    // const { status } = req.query;
    try {
      const getParticpante = await database.Cadastro.findAll({
        // where: { status_farmer: status },
        order: [["nome", "ASC"]],
        attributes: [
          "id",
          "inscricao",
          "nome",
          "telefone",
          "cpf",
          "email",
          "cidade_id",
          "empresa",
          "orgão",
          "status",
        ],
        include: [
          {
            association: "ass_cadastro_cidade",
            attributes: ["id", "nome_municipio"],
            include: [
              {
                association: "ass_municipio_regiao",
                attributes: ["id", "nome"],
              },
            ],
          },
        ],
      });

      return res.status(200).json(getParticpante);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao buscar os participantes" });
    }
  }

  static async participante(req, res) {
    const { id } = req.params;
    // const { status } = req.query;
    try {
      const getParticpante = await database.Cadastro.findAll({
        // where: { status_farmer: status },
        where: { id: Number(id) },
        attributes: [
          "id",
          "inscricao",
          "nome",
          "telefone",
          "cpf",
          "email",
          "cidade_id",
          "empresa",
          "orgão",
          "status",
        ],
        include: [
          {
            association: "ass_cadastro_cidade",
            attributes: ["id", "nome_municipio"],
            include: [
              {
                association: "ass_municipio_regiao",
                attributes: ["id", "nome"],
              },
            ],
          },
        ],
      });

      return res.status(200).json(getParticpante);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao buscar os participantes" });
    }
  }

  static async atualiza(req, res) {
    const { id } = req.params;
    const produtor = req.body;
    // console.log('user', user)
    try {
      await database.Cadastro.update(produtor, {
        where: { id: Number(id) },
      });
      const updateParticipante = await database.Cadastro.findOne({
        where: { id: Number(id) },
      });
      return res.status(200).json(updateParticipante);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async deleta(req, res) {
    const { id } = req.params;

    try {
      const participante = await database.Cadastro.findOne({
        where: { id: Number(id) },
        attributes: ["id", "nome"],
      });

      if (!participante) {
        return res.status(404).json({ error: "Participante não encontrado" });
      }

      // 🔹 Remove o produtor
      await database.Cadstro.destroy({
        where: { id: participante.id },
      });

      return res.status(200).json({
        mensagem: `O Participante ${participante.nome} foi excluído com sucesso!!`,
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ error: erro.message });
    }
  }
}

module.exports = CadastroControllers;
