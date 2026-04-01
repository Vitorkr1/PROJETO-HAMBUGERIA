🍔 Projeto Hamburgueria

Sistema completo de hamburgueria com Front-end + Back-end, permitindo criar, visualizar e gerenciar pedidos.

🚀 Funcionalidades
🔙 Back-end (API)
Criar pedidos
Listar pedidos
Atualizar pedidos
Deletar pedidos
🎨 Front-end
Interface para cadastrar pedidos
Visualização dos pedidos
Integração com a API
🛠️ Tecnologias utilizadas
Back-end:
Node.js
Express
UUID
Nodemon
Front-end:
HTML
CSS
JavaScript
📦 Como instalar o projeto
1. Clonar o repositório
git clone https://github.com/Vitorkr1/PROJETO-HAMBUGERIA.git
2. Entrar na pasta
cd PROJETO-HAMBUGERIA
3. Instalar dependências (node_modules)
npm install
▶️ Como rodar o projeto
🔥 Iniciar o servidor (Back-end)
npm run dev

ou

node index.js
🌐 Rodar o Front-end

Você pode abrir o arquivo HTML diretamente:

index.html

Ou usar extensão tipo Live Server no VS Code.

🔥 Instalando o Nodemon (caso necessário)
npm install -g nodemon

ou

npm install nodemon --save-dev
📡 Rotas da API
➤ Criar pedido
POST /order
{
  "order": "X-Burguer",
  "nomeCliente": "Vitor",
  "valor": 25,
  "status": "em preparo"
}
➤ Listar pedidos
GET /order
➤ Atualizar pedido
PUT /order/:id
➤ Deletar pedido
DELETE /order/:id
🔗 Integração Front + Back

O front-end consome a API através de requisições fetch para:

http://localhost:3000/order

⚠️ O back-end precisa estar rodando para o front funcionar corretamente.

📁 Estrutura do projeto
PROJETO-HAMBUGERIA
│-- index.js
│-- package.json
│-- node_modules
│-- front/
│   │-- index.html
│   │-- style.css
│   │-- script.js
⚠️ Observações
Os dados são armazenados em memória (não usa banco de dados)
Ao reiniciar o servidor, os pedidos são apagados
💡 Melhorias futuras
Banco de dados (MongoDB)
Deploy (colocar online)
Sistema de login
Melhorar UI
👨‍💻 Autor

Desenvolvido por Vitor 🚀
