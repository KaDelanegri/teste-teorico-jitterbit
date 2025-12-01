const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// --- CONFIGURAÇÕES ---
const PORT = 3000;
const SECRET_KEY = "minha_senha_teste"; // Chave para assinar o JWT

// Banco de dados em memória
let ordersParams = []; 

// Carregar documentação Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- MIDDLEWARE DE SEGURANÇA ---
// Essa função verifica se a pessoa tem o Token antes de deixar acessar a API
function verificarToken(req, res, next) {
    // Rota de login pública
    if (req.path === '/login') return next();

    const tokenHeader = req.headers['authorization'];
    
    if (!tokenHeader) {
        return res.status(403).send({ auth: false, message: 'Nenhum token fornecido.' });
    }

    // O token "Bearer xyz...", pegamos só a parte do token mesmo "xyz..."
    const token = tokenHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).send({ auth: false, message: 'Falha ao autenticar token.' });
        
        // Se tudo der certo, salva o ID do usuário e prossegue
        req.userId = decoded.id;
        next();
    });
}

// Ativa a segurança em todas as rotas (menos login e documentação)
app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs') || req.path === '/login') {
        return next();
    }
    return verificarToken(req, res, next);
});

// --- FUNÇÃO DE TRANSFORMAÇÃO (MAPPING) ---
const mapOrderToDB = (inputJson) => {
    return {
        orderId: inputJson.numeroPedido,
        value: inputJson.valorTotal,
        creationDate: inputJson.dataCriacao,
        items: inputJson.items.map(item => ({
            productId: parseInt(item.idItem),
            quantity: item.quantidadeItem,
            price: item.valorItem
        }))
    };
};

// --- ROTAS (ENDPOINTS) ---

// 1. LOGIN (Para pegar o Token)
app.post('/login', (req, res) => {
    // Aqui, qualquer request gera um token válido para teste.
    const token = jwt.sign({ id: 1 }, SECRET_KEY, { expiresIn: 3600 }); // expira em 1 hora
    res.status(200).send({ auth: true, token: token });
});

// 2. CRIAR PEDIDO
app.post('/order', (req, res) => {
    try {
        const inputData = req.body;
        // Transformação
        const newOrder = mapOrderToDB(inputData);
        ordersParams.push(newOrder);
        res.status(201).send({ message: "Pedido criado", data: newOrder });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// 3. BUSCAR PEDIDO
app.get('/order/:id', (req, res) => {
    const order = ordersParams.find(o => o.orderId === req.params.id);
    if (order) res.status(200).send(order);
    else res.status(404).send({ message: "Pedido não encontrado" });
});

// 4. LISTAR TODOS
app.get('/order/list', (req, res) => {
    res.status(200).send(ordersParams); // Rota extra
});

// 5. DELETAR
app.delete('/order/:id', (req, res) => {
    const initialLength = ordersParams.length;
    ordersParams = ordersParams.filter(o => o.orderId !== req.params.id);
    if (ordersParams.length < initialLength) res.status(200).send({ message: "Deletado" });
    else res.status(404).send({ message: "Não encontrado" });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    console.log(`Documentação Swagger: http://localhost:3000/api-docs`);
});