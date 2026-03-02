'use strict';
const {
  Model
} = require('sequelize');

const formatarTextPtBr = require('../utils/formatarTextoPtBr')
module.exports = (sequelize, DataTypes) => {
  class Cadastro extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Cadastro.belongsTo(models.Cidade, { foreignKey: 'cidade_id', as: 'ass_cadastro_cidade' })
    }
  }
  Cadastro.init({
    inscricao: DataTypes.STRING,
    nome: DataTypes.STRING,
    email: DataTypes.STRING,
    telefone: DataTypes.STRING,
    cpf: DataTypes.STRING,
    empresa: DataTypes.STRING,
    cargo: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Cadastro',
    // ✅ HOOKS NO LUGAR CERTO
      hooks: {
        beforeCreate: (instance) => {
          formatarCamposString(instance);
        },
        beforeUpdate: (instance) => {
          formatarCamposString(instance);
        }
      }
  });
  return Cadastro;
};

const CAMPOS_EXCLUIDOS = [
  'inscricao'
];

// 🔹 Função genérica: percorre TODOS os campos STRING
function formatarCamposString(instance) {
  Object.keys(instance.dataValues).forEach((campo) => {

    // ⛔ pula campos excluídos
    if (CAMPOS_EXCLUIDOS.includes(campo)) return;

    const valor = instance.dataValues[campo];

    if (typeof valor === 'string') {
      instance.dataValues[campo] = formatarTextoPtBr(valor.trim());
    }
  });
}