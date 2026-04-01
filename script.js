const api = window.location.origin;
const lista = document.getElementById('lista');
const form = document.getElementById('form');

window.onload = async () => {
    const resConfig = await fetch(`${api}/config/pix`);
    const dataConfig = await resConfig.json();
    if (dataConfig.chavePix) document.getElementById("chavePix").value = dataConfig.chavePix;
    if (dataConfig.telefone) document.getElementById("telefoneConfig").value = dataConfig.telefone;
    
    buscarPedidos();
    buscarMetricas();
};

async function salvarConfig() {
    const chave = document.getElementById("chavePix").value;
    const tel = document.getElementById("telefoneConfig").value;
    
    if (!chave || !tel) return alert("Preencha a Chave PIX e o Telefone com DDD!");
    
    await fetch(`${api}/config/pix`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chavePix: chave, telefone: tel })
    });
    alert("Configurações da loja salvas com sucesso!");
}

async function buscarMetricas() {
    const res = await fetch(`${api}/metrics`);
    const data = await res.json();
    document.getElementById("vendasHoje").innerText = `R$ ${data.vendasHoje.toFixed(2)}`;
    document.getElementById("vendasMes").innerText = `R$ ${data.vendasMes.toFixed(2)}`;
}

async function buscarPedidos() {
    const res = await fetch(`${api}/order`);
    const dados = await res.json();
    lista.innerHTML = "";

    dados.forEach(item => {
        // Oculta os pedidos finalizados do painel principal para não poluir
        if (item.status === "FINALIZADO") return;

        const div = document.createElement("div");
        div.className = "card";
        
        let botaoAcao = "";
        if (item.status === "NOVO") {
            botaoAcao = `<button class="btn btn-outline" onclick="atualizarStatus('${item.id}', 'PREPARANDO')">Começar Preparo</button>`;
        } else if (item.status === "PREPARANDO") {
            botaoAcao = `<button class="btn btn-outline" onclick="atualizarStatus('${item.id}', 'PRONTO')">Marcar como Pronto</button>`;
        } else if (item.status === "PRONTO") {
            botaoAcao = `<button class="btn btn-success" onclick="atualizarStatus('${item.id}', 'FINALIZADO')">✅ Confirmar Pagamento</button>`;
        }

        const linkCliente = `${window.location.origin}/cliente.html?id=${item.id}`;

        div.innerHTML = `
            <div class="card-header">
                <h3>${item.cliente}</h3>
                <span class="badge status-${item.status}">${item.status}</span>
            </div>
            <div class="card-body">
                <p><strong>Pedido:</strong> ${item.pedido}</p>
                <div class="card-price">R$ ${Number(item.valor).toFixed(2)}</div>
            </div>
            <div class="card-actions">
                ${botaoAcao}
                <button class="btn btn-primary" onclick="copiarLink('${linkCliente}')">🔗 Copiar Link do Cliente</button>
                <button class="btn btn-danger" onclick="deletar('${item.id}')">Excluir Pedido</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await fetch(`${api}/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
            cliente: document.getElementById("cliente").value, 
            pedido: document.getElementById("pedido").value, 
            valor: Number(document.getElementById("valor").value) 
        })
    });
    form.reset();
    document.getElementById("cliente").focus();
    buscarPedidos();
});

async function atualizarStatus(id, novoStatus) {
    await fetch(`${api}/order/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
    });
    buscarPedidos();
    buscarMetricas(); // Atualiza o saldo se o status for FINALIZADO
}

async function deletar(id) {
    if(confirm("Excluir este pedido?")) {
        await fetch(`${api}/order/${id}`, { method: "DELETE" });
        buscarPedidos();
        buscarMetricas();
    }
}

function copiarLink(link) {
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
}