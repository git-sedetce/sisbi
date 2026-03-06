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
      const numeroPedido = `SISBI-${String(novoParticipante.id).padStart(6, "0")}`;

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
    try {
      const getParticpante = await database.Cadastro.findAll({
        attributes: [
          "id",
          "inscricao",
          "nome",
          "email",
          "telefone",
          "cpf",
          "cargo",
          "status",
          "createdAt",
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

        order: [
          [
            { model: database.Cidade, as: "ass_cadastro_cidade" },
            "nome_municipio",
            "ASC",
          ],
          ["nome", "ASC"],
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
          "email",
          "telefone",
          "cpf",
          "cargo",
          "status",
          "createdAt",
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
      await database.Cadastro.destroy({
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

  static async totalPalestrantes(req, res) {
    try {
      const totalInscritos = await database.Cadastro.count({
        // where: { status_farmer: true },
      });

      return res.status(200).json({
        total: totalInscritos,
      });
    } catch (error) {
      console.error("Erro ao contar inscritos:", error);
      return res.status(500).json({
        message: "Erro ao contar inscritos",
      });
    }
  }

  static async totalInscritosPorRegiao(req, res) {
    try {
      const resultado = await database.Cadastro.findAll({
        attributes: [
          [
            database.Sequelize.col(
              "ass_cadastro_cidade.ass_municipio_regiao.nome",
            ),
            "regiao",
          ],

          [
            database.Sequelize.fn(
              "SUM",
              database.Sequelize.literal(`
              CASE 
                WHEN status = 'Inscricao_realizada' 
                THEN 1 
                ELSE 0 
              END
            `),
            ),
            "inscricao_realizada",
          ],

          [
            database.Sequelize.fn(
              "SUM",
              database.Sequelize.literal(`
              CASE 
                WHEN status = 'Pendente' 
                THEN 1 
                ELSE 0 
              END
            `),
            ),
            "pendente",
          ],

          [
            database.Sequelize.fn(
              "COUNT",
              database.Sequelize.col("Cadastro.id"),
            ),
            "total",
          ],
        ],

        include: [
          {
            association: "ass_cadastro_cidade",
            attributes: [],
            include: [
              {
                association: "ass_municipio_regiao",
                attributes: [],
              },
            ],
          },
        ],

        group: ["ass_cadastro_cidade.ass_municipio_regiao.nome"],

        order: [
          [
            database.Sequelize.col(
              "ass_cadastro_cidade.ass_municipio_regiao.nome",
            ),
            "ASC",
          ],
        ],

        raw: true,
      });

      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Erro ao contar inscritos por região:", error);
      return res.status(500).json({
        message: "Erro ao contar inscritos por região",
      });
    }
  }

  static async totalInscritosPorStatus(req, res) {
    try {
      const resultado = await database.Cadastro.findAll({
        attributes: [
          "status",
          [
            database.Sequelize.fn("COUNT", database.Sequelize.col("id")),
            "total",
          ],
        ],
        group: ["status"],
        raw: true,
      });

      // Estruturando retorno padronizado
      let response = {
        inscricao_realizada: 0,
        pendente: 0,
      };

      resultado.forEach((item) => {
        if (item.status === "Inscricao_realizada") {
          response.inscricao_realizada = parseInt(item.total);
        }

        if (item.status === "Pendente") {
          response.pendente = parseInt(item.total);
        }
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Erro ao contar inscritos:", error);
      return res.status(500).json({
        message: "Erro ao contar inscritos",
      });
    }
  }

  static async dadosMapa(req, res) {
    try {
      const resultado = await database.Cadastro.findAll({
        attributes: [
          [
            database.Sequelize.col("ass_cadastro_cidade.nome_municipio"),
            "nome_municipio",
          ],

          [
            database.Sequelize.fn(
              "SUM",
              database.Sequelize.literal(`
              CASE 
                WHEN status = 'Inscricao_realizada' 
                THEN 1 
                ELSE 0 
              END
            `),
            ),
            "total_inscricao_realizada",
          ],

          [
            database.Sequelize.fn(
              "SUM",
              database.Sequelize.literal(`
              CASE 
                WHEN status = 'Pendente' 
                THEN 1 
                ELSE 0 
              END
            `),
            ),
            "total_inscricao_pendente",
          ],

          [
            database.Sequelize.fn("COUNT", database.Sequelize.col("inscricao")),
            "total_inscritos",
          ],
        ],

        include: [
          {
            association: "ass_cadastro_cidade",
            attributes: [],
          },
        ],

        group: ["ass_cadastro_cidade.nome_municipio"],
        order: [
          [database.Sequelize.col("ass_cadastro_cidade.nome_municipio"), "ASC"],
        ],
      });

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CadastroControllers;
