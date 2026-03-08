const database = require("../models");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "172.26.2.26",
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function diasParaEvento() {
  const hoje = new Date();
  const dataEvento = new Date("2026-03-13");

  const diff = dataEvento.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function enviarEmail(destinatario, participante) {
  try {
    const dataInscricao = formatarData(participante.createdAt);
    const diasRestantes = diasParaEvento();

    const info = await transporter.sendMail({
      from: "sdes@sde.ce.gov.br",
      to: destinatario,
      subject: "Lembrete - Seminário Brasileiro de Inspeção de Produtos de Origem Animal",
      html: `
      <p>Olá, <strong>${participante.nome}</strong>,</p>

      <p>
      De acordo com a sua inscrição realizada no dia <strong>${dataInscricao}</strong>,
      viemos lembrar que o seminário irá ocorrer no dia <strong>13/03/2026</strong>
      no <strong>Hotel Sonata de Iracema</strong>.
      </p>

      <p>
      Endereço: Av. Beira Mar, 848 - Praia de Iracema, Fortaleza - CE.
      </p>

      <p>
      Faltam <strong>${diasRestantes} dias</strong> para o evento.
      Esperamos você lá!
      </p>

      <br>
      <p>Secretaria do Desenvolvimento Econômico - SDE</p>
      `,
    });

    console.log(`E-mail enviado para ${destinatario}:`, info.messageId);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${destinatario}:`, error);
  }
}

async function enviarEmailParticipante() {
  while (true) {
    try {
      const hoje = new Date().getDay();

      // 1 = segunda | 4 = quinta
      if (hoje === 1 || hoje === 4) {

        console.log("Hoje é dia de envio de lembretes.");

        const participantes = await database.Cadastro.findAll({
          attributes: ["id", "inscricao", "nome", "email", "createdAt"],
        });

        await Promise.all(
          participantes.map(async (participante) => {
            if (participante?.email) {
              await enviarEmail(participante.email, participante);
            }
          })
        );

        console.log(`Emails enviados para ${participantes.length} participantes`);
      } else {
        console.log("Hoje não é dia de envio de lembretes.");
      }

    } catch (error) {
      console.error("Erro ao monitorar participantes:", error);
    }

    // verifica novamente em 24 horas
    await new Promise((resolve) =>
      setTimeout(resolve, 24 * 60 * 60 * 1000)
    );
  }
}

module.exports = {
  enviarEmailParticipante,
};