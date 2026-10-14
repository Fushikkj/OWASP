javascript
const express = require('express');
const app = express();

app.use(express.json()); // Permite receber dados em JSON nas requisicoes

// Banco de dados em memoria
let tarefas = [
    { id: 1, titulo: 'Aprender Express', concluida: false, prioridade: 'alta' },
    { id: 2, titulo: 'Criar minha primeira API', concluida: false, prioridade: 'media' }
];

let proximoId = 3;

// Listar todas as tarefas, com filtro opcional por status
app.get('/tarefas', (req, res) => {
    const { concluida } = req.query;
    let resultado = tarefas;

    if (concluida !== undefined) {
        resultado = tarefas.filter(tarefa =>
            tarefa.concluida === (concluida === 'true')
        );
    }

    res.json(resultado);
});

// retorna a quantidade de tarefas concluídas e pendentes
app.get('/tarefas/resumo', (req, res) => {
    const concluidas = tarefas.filter(tarefa => tarefa.concluida).length;
    const pendentes = tarefas.filter(tarefa => !tarefa.concluida).length;

    res.json({
        concluidas,
        pendentes
    });
});

// Buscar uma tarefa pelo ID
app.get('/tarefas/:id', (req, res) => {
    const tarefa = tarefas.find(tarefa =>
        tarefa.id === parseInt(req.params.id)
    );

    if (!tarefa) {
        return res.status(404).json({ erro: 'Tarefa nao encontrada' });
    }

    res.json(tarefa);
});

// Cadastrar uma nova tarefa
app.post('/tarefas', (req, res) => {

   const { titulo, prioridade } = req.body;
   if (!titulo || !titulo.trim()) {
    return res.status(400).json({ erro: 'O titulo e obrigatorio' });
}

const tarefaExistente = tarefas.find(
    tarefa => tarefa.titulo.toLowerCase() === titulo.trim().toLowerCase()
);

if (tarefaExistente) {
    return res.status(400).json({ erro: 'Essa tarefa ja existe' });
}

if (!titulo) {
    return res.status(400).json({ erro: 'O campo "titulo" e obrigatorio' });
}

if (!['baixa', 'media', 'alta'].includes(prioridade)) {
    return res.status(400).json({ erro: 'Prioridade invalida' });
}

const novaTarefa = {
    id: proximoId++,
    titulo,
    concluida: false,
    prioridade
};

tarefas.push(novaTarefa);
res.status(201).json(novaTarefa);
});

// Atualizar os dados de uma tarefa
app.put('/tarefas/:id', (req, res) => {
    const tarefa = tarefas.find(tarefa =>
        tarefa.id === parseInt(req.params.id)
    );

    if (!tarefa) {
        return res.status(404).json({ erro: 'Tarefa nao encontrada' });
    }

    const { titulo, concluida } = req.body;

    if (titulo !== undefined) tarefa.titulo = titulo;
    if (concluida !== undefined) tarefa.concluida = concluida;

    res.json(tarefa);
});

//Essa rota apaga todas as tarefas concluídas de uma vez
app.delete('/tarefas', (req, res) => {
    tarefas = tarefas.filter(tarefa => !tarefa.concluida);

    res.status(204).send();
});

// Excluir uma tarefa pelo ID
app.delete('/tarefas/:id', (req, res) => {
    const indice = tarefas.findIndex(tarefa =>
        tarefa.id === parseInt(req.params.id)
    );

    if (indice === -1) {
        return res.status(404).json({ erro: 'Tarefa nao encontrada' });
    }

    tarefas.splice(indice, 1);

    res.status(204).send();
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('API de tarefas rodando na porta 3000');
});
