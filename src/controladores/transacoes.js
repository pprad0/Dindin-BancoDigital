const pool = require('../conexao');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt');

const listarCategorias = async (req, res) => {
    try {
        const categorias = await pool.query('SELECT * FROM categorias')
        return res.status(200).json(categorias.rows)

    } catch (error) {
        return res.status(400).json({ mensagem: "Erro interno do servidor" })
    }
}

const listarTransacoes = async (req, res) => {
    const { filtro } = req.query;
    try {
        if (typeof filtro == 'object') {
            const retornoFiltrado = [];

            for (let objeto of filtro) {
                const transacoesUsuario = await pool.query(`SELECT t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome 
                    FROM transacoes t JOIN categorias c ON t.categoria_id = c.id  
                    WHERE t.usuario_id = $1 AND c.descricao ILIKE $2;`, [tokenUsuario.id, objeto]
                );
                retornoFiltrado.push(...transacoesUsuario.rows);
            }
            return res.status(200).json(retornoFiltrado);

        } else if (typeof filtro == 'string') {
            const transacoesUsuario = await pool.query(`SELECT t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome 
                FROM transacoes t JOIN categorias c ON t.categoria_id = c.id  
                WHERE t.usuario_id = $1 AND c.descricao ILIKE $2;`, [tokenUsuario.id, filtro]
            );
            return res.status(200).json(transacoesUsuario.rows);

        } else if (!filtro) {
            const transacoesUsuario = await pool.query(`SELECT t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome 
                FROM transacoes t JOIN categorias c ON t.categoria_id = c.id  WHERE t.usuario_id = $1;`, [tokenUsuario.id]
            );

            return res.status(200).json(transacoesUsuario.rows);
        }
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" });
    }
}

const cadastarTransacao = async (req, res) => {

    const { descricao, valor, data, categoria_id, tipo } = req.body

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ "mensagem": "Todos os campos obrigatórios devem ser informados." })
    }

    if (tipo !== "entrada" && tipo !== "saida") {
        res.status(400).json({ mensagem: "Informe o tipo de transação (entrada ou saida)." })
    }

    try {
        const categoriaExiste = await pool.query('SELECT * FROM categorias where id = $1', [categoria_id])

        if (categoriaExiste.rowCount === 0) {
            return res.status(400).json({ mensagem: "A categoria informada não existe, informe outra categoria." })
        }

        const inserirTransacao = await pool.query(`INSERT INTO transacoes (tipo, descricao, valor, data, usuario_id, categoria_id) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [tipo, descricao, valor, data, tokenUsuario.id, categoria_id]
        )

        const categoria = await pool.query('SELECT descricao from categorias where id = $1', [categoria_id])

        inserirTransacao.rows[0].categoria_nome = categoria.rows[0].descricao

        return res.status(201).json(inserirTransacao.rows[0])

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const atualizarTransacao = async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    try {
        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ mensagem: "Todos os campos obrigatórios devem ser informados." })
        }

        const validarIdTransacao = await pool.query('SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, tokenUsuario.id]);

        if (validarIdTransacao.rowCount == 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada" });
        }

        const validarCategoria = await pool.query('SELECT * FROM categorias WHERE id = $1', [categoria_id]);

        if (!validarCategoria.rows[0]) {
            return res.status(404).json({ mensagem: "Categoria informada não existe" });
        }

        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(400).json({ mensagem: "Tipo inválido" });
        }

        const alteracao = await pool.query(`
            UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 
            WHERE id = $6 AND usuario_id = $7`, [descricao, valor, data, categoria_id, tipo, id, tokenUsuario.id]
        );

        return res.status(200).json();
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
}

const detalharTransacao = async (req, res) => {
    const { id } = req.params

    try {
        const encontrarTransacoes = await pool.query('select * from transacoes where id = $1 AND usuario_id = $2', [id, tokenUsuario.id])

        if (encontrarTransacoes.rowCount === 0) {
            return res.status(400).json({ "mensagem": "Transação não encontrada." })
        }

        const categoria = await pool.query('SELECT descricao from categorias where id = $1', [id])
        encontrarTransacoes.rows[0].categoria_nome = categoria.rows[0].descricao

        return res.status(200).json(encontrarTransacoes.rows[0])

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const obterExtrato = async (req, res) => {
    try {
        const somarSaida = await pool.query('select tipo, valor from transacoes where usuario_id = $1', [tokenUsuario.id])

        let saida = 0
        let entrada = 0
        for (let i of somarSaida.rows) {
            if (i.tipo === 'saida') {
                saida += i.valor

            } else if (i.tipo === 'entrada') {
                entrada += i.valor
            }
        }

        return res.status(200).json({ entrada: entrada, saida: saida })

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const excluirTransacao = async (req, res) => {
    const { id } = req.params;
    try {
        const validarId = await pool.query('SELECT id FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, tokenUsuario.id]);

        if (validarId.rowCount == 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada." });
        }

        const deletarTransacao = await pool.query('DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, tokenUsuario.id]);

        return res.status(200).json();
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
}

module.exports = {
    listarCategorias,
    cadastarTransacao,
    listarTransacoes,
    atualizarTransacao,
    detalharTransacao,
    excluirTransacao,
    obterExtrato
}