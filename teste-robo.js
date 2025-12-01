// Configuração
const API_URL = "http://localhost:3000";

// Cores para o terminal ficar bonito
const VERDE = "\x1b[32m";
const VERMELHO = "\x1b[31m";
const RESET = "\x1b[0m";

async function rodarTeste() {
    console.log("🤖 INICIANDO ROBÔ DE TESTES...\n");

    // --- 1. TENTAR FAZER LOGIN ---
    console.log("1️⃣  Tentando fazer Login...");
    const loginResponse = await fetch(`${API_URL}/login`, { method: "POST" });
    const loginData = await loginResponse.json();

    if (loginData.auth && loginData.token) {
        console.log(`${VERDE}✔ Sucesso! Token recebido.${RESET}`);
    } else {
        console.log(`${VERMELHO}❌ Falha no login.${RESET}`);
        return; // Para o teste se falhar
    }

    const MEU_TOKEN = loginData.token;

    // --- 2. TENTAR CRIAR UM PEDIDO ---
    console.log("\n2️⃣  Enviando pedido (JSON em Português)...");
    
    const pedidoExemplo = {
        "numeroPedido": "TESTE-123",
        "valorTotal": 500,
        "dataCriacao": "2023-08-01",
        "items": [
            { "idItem": "99", "quantidadeItem": 2, "valorItem": 250 }
        ]
    };

    const createResponse = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${MEU_TOKEN}` // Aqui enviamos a "Senha Especial"
        },
        body: JSON.stringify(pedidoExemplo)
    });

    const createData = await createResponse.json();

    if (createResponse.status === 201) {
        console.log(`${VERDE}✔ Pedido Criado!${RESET}`);
        console.log("   Resposta do servidor (Mapeada para Inglês):", createData.data);
    } else {
        console.log(`${VERMELHO}❌ Falha ao criar pedido.${RESET}`, createData);
    }

    // --- 3. VERIFICAR SE O PEDIDO EXISTE MESMO ---
    console.log("\n3️⃣  Consultando o pedido criado para confirmar...");
    
    const getResponse = await fetch(`${API_URL}/order/TESTE-123`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${MEU_TOKEN}`
        }
    });
    
    const getData = await getResponse.json();

    if (getData.orderId === "TESTE-123") {
        console.log(`${VERDE}✔ SUCESSO TOTAL! O pedido foi encontrado no banco de dados.${RESET}`);
    } else {
        console.log(`${VERMELHO}❌ Erro: O pedido não foi encontrado.${RESET}`);
    }

    console.log("\n🤖 Teste finalizado.");
}

rodarTeste();