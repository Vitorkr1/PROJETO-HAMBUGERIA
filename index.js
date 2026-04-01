const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// NOVO BANCO V4 - Com coluna de telefone
const db = new sqlite3.Database('./hunger_v4.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, cliente TEXT, pedido TEXT, valor REAL, status TEXT, data TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY, chavePix TEXT, telefone TEXT
    )`);
    db.run(`INSERT OR IGNORE INTO config (id, chavePix, telefone) VALUES (1, '', '')`);
});

function gerarCrc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc = crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
function formatLength(str) { return str.length.toString().padStart(2, '0'); }

function buildPixPayload(chave, nome, cidade, valor) {
    const valStr = Number(valor).toFixed(2);
    const pixData = `0014br.gov.bcb.pix01${formatLength(chave)}${chave}`;
    let payload = `00020126${formatLength(pixData)}${pixData}52040000530398654${formatLength(valStr)}${valStr}5802BR59${formatLength(nome)}${nome}60${formatLength(cidade)}${cidade}62070503***6304`;
    return payload + gerarCrc16(payload);
}

// Configuração Salvar e Buscar (Pix + Telefone)
app.post('/config/pix', (req, res) => {
    db.run(`UPDATE config SET chavePix = ?, telefone = ? WHERE id = 1`, [req.body.chavePix, req.body.telefone], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/config/pix', (req, res) => {
    db.get(`SELECT chavePix, telefone FROM config WHERE id = 1`, (err, row) => {
        res.json(row || { chavePix: '', telefone: '' });
    });
});

app.post('/order', (req, res) => {
    const { cliente, pedido, valor } = req.body;
    const id = uuidv4();
    const status = 'NOVO';
    const data = new Date().toISOString(); 
    
    db.run(`INSERT INTO orders (id, cliente, pedido, valor, status, data) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, cliente, pedido, valor, status, data], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, cliente, pedido, valor, status, data });
        });
});

app.get('/order', (req, res) => {
    db.all(`SELECT * FROM orders`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const ordem = { 'NOVO': 1, 'PREPARANDO': 2, 'PRONTO': 3, 'FINALIZADO': 4 };
        rows.sort((a, b) => (ordem[a.status] || 5) - (ordem[b.status] || 5));
        res.json(rows);
    });
});

app.get('/order/:id', (req, res) => {
    db.get(`SELECT * FROM orders WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Pedido não encontrado" });
        res.json(row);
    });
});

app.patch('/order/:id/status', (req, res) => {
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [req.body.status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: req.params.id, status: req.body.status });
    });
});

app.delete('/order/:id', (req, res) => {
    db.run(`DELETE FROM orders WHERE id = ?`, req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(204).send();
    });
});

app.get('/metrics', (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    const mes = hoje.substring(0, 7);
    db.all(`SELECT valor, data FROM orders WHERE status = 'FINALIZADO'`, [], (err, rows) => {
        let vendasHoje = 0, vendasMes = 0;
        rows.forEach(r => {
            if (r.data.startsWith(hoje)) vendasHoje += r.valor;
            if (r.data.startsWith(mes)) vendasMes += r.valor;
        });
        res.json({ vendasHoje, vendasMes });
    });
});

app.post('/pix', async (req, res) => {
    try {
        const payload = buildPixPayload(req.body.chave, "Hunger Delivery", "Brasil", req.body.valor);
        const qrCodeImage = await QRCode.toDataURL(payload, { color: { dark: '#000000', light: '#FFFFFF' }, width: 250, margin: 2 });
        res.json({ payload, qrCodeImage });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Hunger V4 rodando na porta ${PORT}`));