'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cidade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Cidade.belongsTo(models.Regiao, { foreignKey: 'regiao_id', as: 'ass_municipio_regiao' })
      Cidade.hasMany(models.Cadastro, { foreignKey: 'cidade_id', as: 'ass_cidades_cadastro' })
    }
  }
  Cidade.init({
    nome_municipio: DataTypes.STRING,
    cod_ibge: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Cidade',
  });
  return Cidade;
};