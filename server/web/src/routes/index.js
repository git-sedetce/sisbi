const express = require('express')
const cadastro = require('./cadastroRoutes')
const user = require('./userRoutes')
const audit = require('./auditRoutes')


module.exports = app => {
    app.use(express.json(),
            express.urlencoded({ extended: false }),
            cadastro,
            user,
            audit,
            )
}