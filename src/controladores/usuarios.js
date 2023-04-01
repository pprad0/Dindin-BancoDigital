const pool = require('../conexao');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt');

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Informe o nome, email e senha." })
    }

    try {
        const emailExiste = await pool.query('select * from usuarios where email = $1', [email])

        if (emailExiste.rowCount > 0) {
            return res.status(400).json({ mensagem: "Já existe usuário cadastrado com o e-mail informado." })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const { rows } = await pool.query(
            'insert into usuarios (nome, email, senha) values ($1, $2, $3) returning *',
            [nome, email, senhaCriptografada]
        )

        const { senha: _, ...usuario } = rows[0]

        return res.status(200).json(usuario)

    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" })
    }
}

const login = async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ mensagem: "Informe o email e senha." })
    }
    try {
        const usuario = await pool.query('select * from usuarios where email = $1', [email])

        if (usuario.rowCount === 0) {
            return res.status(400).json({ mensagem: "Email ou senha inválidos." })
        }

        const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha)

        if (!senhaValida) {
            return res.status(400).json({ mensagem: "Email ou senha inválidos" })
        }

        const token = jwt.sign({ id: usuario.rows[0].id }, senhaJwt, { expiresIn: '1d' })

        const { senha: _, ...usuarioLogado } = usuario.rows[0]

        return res.status(200).json({ usuario: usuarioLogado, token })

    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" })
    }
}

const detalharUsuario = async (req, res) => {
    try {
        const acharUsuario = await pool.query('SELECT * FROM usuarios WHERE id = $1', [tokenUsuario.id]);

        const { id, nome, email, } = acharUsuario.rows[0]

        return res.status(200).json({
            id,
            nome,
            email
        });

    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" })
    }
}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Informe o nome, email e senha." })
    }

    try {

        const validarEmail = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);

        const acharUsuario = await pool.query('SELECT * FROM usuarios WHERE id = $1', [tokenUsuario.id]);

        if (validarEmail.rowCount == 0 || email == acharUsuario.rows[0].email) {
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            const atualizarDados = await pool.query('UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4', [nome, email, senhaCriptografada, tokenUsuario.id]);

            return res.status(201).json()
        } else {
            return res.status(400).json({ mensagem: "O e-mail informado já está sendo utilizado por outro usuário." });
        }
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" });
    }
}



module.exports = {
    cadastrarUsuario,
    login,
    detalharUsuario,
    atualizarUsuario,
}