const { Router } = require('express')
const CadastroControllers = require('../controllers/CadastroControllers')
var auth = require('../service/AutenticaService')
var checkRole = require('../service/checkRole')


const router = Router()
router.post('/registerParticipante', CadastroControllers.cadastroParticipante);
router.get('/takecitys', CadastroControllers.pegaCidades)
router.get('/participantes', auth.authenticatedUser, checkRole.checkRole([1]), CadastroControllers.verParticipantes)
router.get('/participante/:id', auth.authenticatedUser, checkRole.checkRole([1]),CadastroControllers.participante)
router.get('/checkcpf/:cpf', CadastroControllers.consultarCPF)
router.put('/atualizaParticipante/:id', auth.authenticatedUser, checkRole.checkRole([1]), CadastroControllers.atualiza)
router.delete('/deletarParticipante/:id', auth.authenticatedUser, checkRole.checkRole([1]), CadastroControllers.deleta)
router.get('/totalPalestrantes', auth.authenticatedUser, checkRole.checkRole([1,2,3,4]), CadastroControllers.totalPalestrantes);
router.get('/totalInscritosRegiao', auth.authenticatedUser, checkRole.checkRole([1,2,3,4]), CadastroControllers.totalInscritosPorRegiao);
router.get('/totalInscritosStatus', auth.authenticatedUser, checkRole.checkRole([1,2,3,4]), CadastroControllers.totalInscritosPorStatus);
router.get('/mapa', auth.authenticatedUser, checkRole.checkRole([1,2,3,4]), CadastroControllers.dadosMapa);

module.exports = router