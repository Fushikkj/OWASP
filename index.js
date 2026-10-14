javascript
const express = require('express');
const app = express();

app.use(express.json());

// Banco de dados em memoria
let tarefas = [
    { id: 1, titulo: 'Aprender Express', concluida: false },
    { id: 2, titulo: 'Criar minha primeira API', concluida: false }
];

let proximoId = 3;

// Validar o titulo da tarefa
function validarTitulo(titulo) {
    if (typeof titulo !== 'string') {
        return 'O titulo deve ser um texto';
    }

    if (!titulo.trim()) {
        return 'O titulo nao pode ser vazio';
    }

    if (titulo.trim().length > 100) {
        return 'O titulo deve ter no maximo 100 caracteres';
    }

    return null;
}

// Validar o ID da tarefa
function validarId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Listar tarefas com filtro opcional por status
app.get('/tarefas', (req, res) => {
    const { concluida } = req.query;
    let resultado = tarefas;

    if (concluida !== undefined) {
        if (concluida !== 'true' && concluida !== 'false') {
            return res.status(400).json({
                erro: 'O filtro concluida deve ser true ou false'
            });
        }

        resultado = tarefas.filter(
            tarefa => tarefa.concluida === (concluida === 'true')
        );
    }

    res.json(resultado);
});

// Buscar uma tarefa pelo ID
app.get('/tarefas/:id', (req, res) => {
    const id = req.params.id;

    if (!validarId(id)) {
        return res.status(400).json({ erro: 'ID invalido' });
    }

    const tarefa = tarefas.find(
        tarefa => tarefa.id === Number(id)
    );

    if (!tarefa) {
        return res.status(404).json({
            erro: 'Tarefa nao encontrada'
        });
    }

    res.json(tarefa);
});

// Criar uma nova tarefa
app.post('/tarefas', (req, res) => {
    const { titulo } = req.body;

    const erro = validarTitulo(titulo);

    if (erro) {
        return res.status(400).json({ erro });
    }

    const tituloFormatado = titulo.trim();

    const tarefaExistente = tarefas.find(
        tarefa => tarefa.titulo.toLowerCase() === tituloFormatado.toLowerCase()
    );

    if (tarefaExistente) {
        return res.status(400).json({
            erro: 'Essa tarefa ja existe'
        });
    }

    const novaTarefa = {
        id: proximoId++,
        titulo: tituloFormatado,
        concluida: false
    };

    tarefas.push(novaTarefa);

    res.status(201).json(novaTarefa);
});

// Atualizar uma tarefa pelo ID
app.put('/tarefas/:id', (req, res) => {
    const id = req.params.id;

    if (!validarId(id)) {
        return res.status(400).json({ erro: 'ID invalido' });
    }

    const tarefa = tarefas.find(
        tarefa => tarefa.id === Number(id)
    );

    if (!tarefa) {
        return res.status(404).json({
            erro: 'Tarefa nao encontrada'
        });
    }

    const { titulo, concluida } = req.body;

    if (titulo !== undefined) {
        const erro = validarTitulo(titulo);

        if (erro) {
            return res.status(400).json({ erro });
        }

        const tituloFormatado = titulo.trim();

        const tarefaExistente = tarefas.find(
            outraTarefa =>
                outraTarefa.id !== Number(id) &&
                outraTarefa.titulo.toLowerCase() === tituloFormatado.toLowerCase()
        );

        if (tarefaExistente) {
            return res.status(400).json({
                erro: 'Essa tarefa ja existe'
            });
        }

        tarefa.titulo = tituloFormatado;
    }

    if (concluida !== undefined) {
        if (typeof concluida !== 'boolean') {
            return res.status(400).json({
                erro: 'O campo concluida deve ser true ou false'
            });
        }

        tarefa.concluida = concluida;
    }

    res.json(tarefa);
});

// Excluir todas as tarefas concluidas
app.delete('/tarefas', (req, res) => {
    tarefas = tarefas.filter(
        tarefa => !tarefa.concluida
    );

    res.status(204).send();
});

// Excluir uma tarefa pelo ID
app.delete('/tarefas/:id', (req, res) => {
    const id = req.params.id;

    if (!validarId(id)) {
        return res.status(400).json({ erro: 'ID invalido' });
    }

    const indice = tarefas.findIndex(
        tarefa => tarefa.id === Number(id)
    );

    if (indice === -1) {
        return res.status(404).json({
            erro: 'Tarefa nao encontrada'
        });
    }

    tarefas.splice(indice, 1);

    res.status(204).send();
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('API de tarefas rodando na porta 3000');
});
