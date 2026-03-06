const database = require("../models");
const { Op, Sequelize, where } = require("sequelize");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

class CadastroControllers {
  static async cadastroParticipante(req, res) {
    const newRegister = req.body;

    try {
      if (!newRegister.nome || !newRegister.email || !newRegister.cidade_id) {
        return res.status(400).json({ message: "Dados obrigatórios ausentes" });
      }

      const statusInscricao = "inscricao_realizada";

      // const cadastroExistente = await database.Cadastro.findOne({
      //   where: { cidade_id: newRegister.cidade_id },
      // });

      // const statusInscricao = cadastroExistente
      //   ? "pendente"
      //   : "inscricao_realizada";

      const novoParticipante = await database.Cadastro.create({
        ...newRegister,
        status: statusInscricao,
      });

      const numeroPedido = `SISBI-${String(novoParticipante.id).padStart(6, "0")}`;

      await novoParticipante.update({
        inscricao: numeroPedido,
      });

      novoParticipante.inscricao = numeroPedido;

      // 🔹 envia email em background
      enviarEmailConfirmacao({
        nome: novoParticipante.nome,
        email: newRegister.email,
        inscricao: novoParticipante.inscricao,
        status: novoParticipante.status,
      });

      // 🔹 responde imediatamente ao frontend
      return res.status(200).json(novoParticipante);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao realizar cadastro" });
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

    try {
      // 1️⃣ busca registro atual
      const participanteAtual = await database.Cadastro.findOne({
        where: { id: Number(id) },
      });

      if (!participanteAtual) {
        return res.status(404).json({ message: "Participante não encontrado" });
      }

      const statusAnterior = participanteAtual.status;

      // 2️⃣ atualiza dados
      await database.Cadastro.update(produtor, {
        where: { id: Number(id) },
      });

      // 3️⃣ busca registro atualizado
      const participanteAtualizado = await database.Cadastro.findOne({
        where: { id: Number(id) },
      });

      const novoStatus = participanteAtualizado.status;

      // 4️⃣ verifica mudança de status
      if (
        statusAnterior !== "inscricao_realizada" &&
        novoStatus === "inscricao_realizada"
      ) {
        // envio em background
        enviarEmailConfirmacao({
          nome: participanteAtualizado.nome,
          email: participanteAtualizado.email,
          inscricao: participanteAtualizado.inscricao,
          status: participanteAtualizado.status,
        });
      }

      return res.status(200).json(participanteAtualizado);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar participante" });
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

async function enviarEmailConfirmacao(participante) {
  try {
    const transporter = nodemailer.createTransport({
      host: "172.26.2.26",
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: "sdes@sde.ce.gov.br",
      to: participante.email,
      subject:
        "Confirmação da Inscrição - Seminário Brasileiro de Inspeção de Produtos de Origem Animal",
      html: `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#f4f6f8; padding:30px;">
  
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="background:#0d6efd; color:white; padding:20px; text-align:center;">
      <h2 style="margin:0;">Confirmação de Inscrição</h2>
    </div>

    <div style="padding:30px; color:#333;">
      
      <h3 style="margin-top:0;">Olá, ${participante.nome}</h3>

      <p>
        Sua inscrição para o <strong>Seminário Brasileiro de Inspeção de Produtos de Origem Animal</strong>
        foi registrada com sucesso.
      </p>

      <div style="background:#f8f9fa; border-left:4px solid #0d6efd; padding:15px; margin:20px 0;">
        <p><strong>Número da inscrição:</strong> ${participante.inscricao}</p>
        <p><strong>Status:</strong> ${participante.status}</p>
      </div>

      <p>
        Caso sua inscrição esteja <strong>pendente</strong>, aguarde o contato da equipe organizadora.
      </p>

      <p style="margin-top:30px;">
        Secretaria do Desenvolvimento Econômico - SDE
      </p>

    </div>

  </div>

</div>
`,
    });

    console.log("Email enviado para:", participante.email);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

module.exports = CadastroControllers;
