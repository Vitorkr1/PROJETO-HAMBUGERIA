const api = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');

// Trava de segurança para não gerar o PIX e o botão várias vezes
let pixGerado = false; 

window.onload = async () => {
    if (!orderId) {
        document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:50px;'>Pedido não encontrado.</h2>";
        return;
    }
    carregarPedido();
    // Atualiza a tela a cada 5 segundos
    setInterval(carregarPedido, 5000); 
};

async function carregarPedido() {
    try {
        const res = await fetch(`${api}/order/${orderId}`);
        if (!res.ok) return;
        const pedido = await res.json();

        if (pedido.status === "FINALIZADO") {
            document.querySelector(".client-container").innerHTML = `
                <h1 style="color: #10B981; font-size: 3rem; margin-bottom: 20px;">✅</h1>
                <h2 style="color: white;">Pagamento Confirmado!</h2>
                <p style="color: #94A3B8; margin-top: 10px;">Seu pedido já está com você ou a caminho. Bom apetite!</p>
            `;
            return;
        }

        document.getElementById("cliNome").innerText = `Olá, ${pedido.cliente}`;
        document.getElementById("cliPedido").innerText = pedido.pedido;
        document.getElementById("cliValor").innerText = `R$ ${Number(pedido.valor).toFixed(2)}`;

        document.getElementById("stepNovo").className = "step";
        document.getElementById("stepPreparando").className = "step";
        document.getElementById("stepPronto").className = "step";

        if (pedido.status === "NOVO") {
            document.getElementById("stepNovo").classList.add("active");
            document.getElementById("paymentArea").style.display = "none";
        } 
        else if (pedido.status === "PREPARANDO") {
            document.getElementById("stepPreparando").classList.add("active");
            document.getElementById("paymentArea").style.display = "none";
        } 
        else if (pedido.status === "PRONTO") {
            document.getElementById("stepPronto").classList.add("active");
            gerarPixPagamento(pedido.valor, pedido.cliente);
        }
    } catch (error) {}
}

async function gerarPixPagamento(valor, clienteNome) {
    // Se o PIX já foi gerado na tela, o código para aqui e não duplica nada!
    if (pixGerado) return; 
    pixGerado = true; 

    document.getElementById("paymentArea").style.display = "block";

    const resPix = await fetch(`${api}/config/pix`);
    const dataConfig = await resPix.json();

    if (!dataConfig.chavePix) {
        document.getElementById("cliPixCode").value = "Loja não configurou a chave PIX.";
        return;
    }

    const res = await fetch(`${api}/pix`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chave: dataConfig.chavePix, valor: valor })
    });
    const data = await res.json();

    document.getElementById("cliQrCode").src = data.qrCodeImage;
    document.getElementById("cliPixCode").value = data.payload;

    // Cria o botão do WhatsApp de forma inteligente (sem quebrar o HTML)
    if (dataConfig.telefone && !document.getElementById("btnComprovante")) {
        const mensagem = `Olá! Acabei de pagar o pedido de *${clienteNome}* no valor de *R$ ${valor.toFixed(2)}*. Segue o meu comprovante! 🍔`;
        const linkWhats = `https://wa.me/${dataConfig.telefone}?text=${encodeURIComponent(mensagem)}`;
        
        const btn = document.createElement("a");
        btn.id = "btnComprovante";
        btn.href = linkWhats;
        btn.target = "_blank";
        btn.className = "btn btn-success";
        btn.style.cssText = "display:block; text-decoration:none; margin-top: 15px; font-weight: bold;";
        btn.innerText = "📲 Enviar Comprovante";
        
        document.getElementById("paymentArea").appendChild(btn);
    }
}

function copiarPixCliente() {
    const input = document.getElementById("cliPixCode");
    input.select();
    document.execCommand("copy");
    alert("Código copiado! Abra o app do seu banco para pagar.");
}