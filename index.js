javascript
const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

// Listar tarefas com filtros e paginacao
app.get('/tarefas', async (req, res) => {
    try {
        const { concluida, prioridade } = req.query;

        const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
        const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 100);
        const deslocamento = (pagina - 1) * limite;

        let query = 'SELECT * FROM tarefas WHERE 1=1';
        let parametros = [];

        if (concluida !== undefined) {
            if (concluida !== 'true' && concluida !== 'false') {
                return res.status(400).json({
                    erro: 'O filtro concluida deve ser true ou false'
                });
            }

            parametros.push(concluida === 'true');
            query += ` AND concluida = $${parametros.length}`;
        }

        if (prioridade !== undefined) {
            if (!['baixa', 'media', 'alta'].includes(prioridade)) {
                return res.status(400).json({
                    erro: 'Prioridade invalida'
                });
            }

            parametros.push(prioridade);
            query += ` AND prioridade = $${parametros.length}`;
        }

        parametros.push(limite);
        query += ` ORDER BY id LIMIT $${parametros.length}`;

        parametros.push(deslocamento);
        query += ` OFFSET $${parametros.length}`;

        const resultado = await pool.query(query, parametros);

        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar tarefas' });
    }
});

// Resumo das tarefas
app.get('/tarefas/resumo', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT concluida, COUNT(*) AS quantidade
            FROM tarefas
            GROUP BY concluida
        `);

        let concluidas = 0;
        let pendentes = 0;

        resultado.rows.forEach(tarefa => {
            if (tarefa.concluida) {
                concluidas = Number(tarefa.quantidade);
            } else {
                pendentes = Number(tarefa.quantidade);
            }
        });

        res.json({ concluidas, pendentes });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: 'Erro ao buscar resumo das tarefas'
        });
    }
});

// Buscar uma tarefa pelo ID
app.get('/tarefas/:id', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM tarefas WHERE id = $1',
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Tarefa nao encontrada'
            });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar tarefa' });
    }
});

// Criar uma nova tarefa
app.post('/tarefas', async (req, res) => {
    try {
        const { titulo, prioridade } = req.body;

        if (typeof titulo !== 'string' || !titulo.trim()) {
            return res.status(400).json({
                erro: 'O titulo e obrigatorio'
            });
        }

        const tituloFormatado = titulo.trim();

        const tarefaExistente = await pool.query(
            'SELECT * FROM tarefas WHERE LOWER(titulo) = LOWER($1)',
            [tituloFormatado]
        );

        if (tarefaExistente.rows.length > 0) {
            return res.status(400).json({
                erro: 'Essa tarefa ja existe'
            });
        }

        if (!['baixa', 'media', 'alta'].includes(prioridade)) {
            return res.status(400).json({
                erro: 'Prioridade invalida'
            });
        }

        const resultado = await pool.query(
            'INSERT INTO tarefas (titulo, prioridade) VALUES ($1, $2) RETURNING *',
            [tituloFormatado, prioridade]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar tarefa' });
    }
});

// Atualizar uma tarefa pelo ID
app.put('/tarefas/:id', async (req, res) => {
    try {
        const { titulo, concluida, prioridade } = req.body;

        const tarefaAtual = await pool.query(
            'SELECT * FROM tarefas WHERE id = $1',
            [req.params.id]
        );

        if (tarefaAtual.rows.length === 0) {
            return res.status(404).json({
                erro: 'Tarefa nao encontrada'
            });
        }

        const tarefa = tarefaAtual.rows[0];

        const novoTitulo = titulo !== undefined
            ? titulo
            : tarefa.titulo;

        const novaConcluida = concluida !== undefined
            ? concluida
            : tarefa.concluida;

        const novaPrioridade = prioridade !== undefined
            ? prioridade
            : tarefa.prioridade;

        if (typeof novoTitulo !== 'string' || !novoTitulo.trim()) {
            return res.status(400).json({
                erro: 'O titulo e obrigatorio'
            });
        }

        if (typeof novaConcluida !== 'boolean') {
            return res.status(400).json({
                erro: 'O campo concluida deve ser true ou false'
            });
        }

        if (!['baixa', 'media', 'alta'].includes(novaPrioridade)) {
            return res.status(400).json({
                erro: 'Prioridade invalida'
            });
        }

        const tarefaExistente = await pool.query(
            'SELECT * FROM tarefas WHERE LOWER(titulo) = LOWER($1) AND id != $2',
            [novoTitulo.trim(), req.params.id]
        );

        if (tarefaExistente.rows.length > 0) {
            return res.status(400).json({
                erro: 'Essa tarefa ja existe'
            });
        }

        const resultado = await pool.query(
            `UPDATE tarefas
             SET titulo = $1, concluida = $2, prioridade = $3
             WHERE id = $4
             RETURNING *`,
            [
                novoTitulo.trim(),
                novaConcluida,
                novaPrioridade,
                req.params.id
            ]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
    }
});

// Excluir todas as tarefas concluidas
app.delete('/tarefas', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM tarefas WHERE concluida = true'
        );

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: 'Erro ao excluir tarefas concluidas'
        });
    }
});

// Excluir uma tarefa pelo ID
app.delete('/tarefas/:id', async (req, res) => {
    try {
        const resultado = await pool.query(
            'DELETE FROM tarefas WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Tarefa nao encontrada'
            });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir tarefa' });
    }
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('API de tarefas rodando na porta 3000');
});
