const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt')

const verificarUsuarioLogado = async (req, res, next) => {
    const { authorization } = req.headers

    if(!authorization) {
        return res.status(401).json({mensagem: 'Não autorizado'})
    }

    const token = authorization.split(" ")[1]

    try {
        tokenUsuario = jwt.verify(token, senhaJwt)

    } catch (error) {
        return res.status(500).json({mensagem: 'Não autorizado'})
    }
    next();
}

module.exports = verificarUsuarioLogado