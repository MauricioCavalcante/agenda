# ⚔️ LevelUp Routine (Agenda Gamificada)

Bem-vindo ao **LevelUp Routine**, uma agenda open-source gamificada (estilo RPG) com integração direta à Inteligência Artificial (OpenAI, Gemini, Ollama) projetada para rodar **localmente** na sua máquina.

Este projeto foi construído para ajudar desenvolvedores e entusiastas de produtividade a gerenciarem suas vidas (Esferas: Profissional, Pessoal, Financeira, Física, Educacional e Social) ganhando XP e subindo de nível como em um jogo.

## ✨ Principais Funcionalidades

- **🧠 Inteligência Artificial Embutida:** A IA organiza sua rotina automaticamente, intercalando estudos e tarefas livres dentro dos seus horários fixos. Também atua como Personal Trainer e Assessor Financeiro.
- **🎮 Gamificação RPG:** Conclua tarefas, leia livros e bata metas financeiras para ganhar XP nas Esferas da Vida e evoluir o seu Nível Geral de Personagem.
- **🔒 Focado em Privacidade (Self-Hosted):** Sem sistema de login. Tudo roda na sua máquina. Suas chaves de API da IA e seu banco de dados ficam apenas sob o seu controle.
- **🗄️ Banco de Dados Flexível:** Vem com **SQLite local** nativo e persistente via Docker. Possui um painel avançado para migração fácil (One-Click) para um **PostgreSQL** remoto, caso você prefira gerenciar seus dados na nuvem.

## 🚀 Como rodar localmente (Recomendado)

O jeito mais fácil e seguro de rodar a aplicação é utilizando o **Docker**.

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados na sua máquina.

### Passos de Instalação

1. Faça o clone do repositório:
```bash
git clone https://github.com/seu-usuario/levelup-routine.git
cd levelup-routine
```

2. Suba os containers com o Docker Compose:
```bash
docker-compose up -d --build
```

3. Acesse a aplicação no seu navegador:
- **Frontend (Painel Gráfico):** [http://localhost:3000](http://localhost:3000)
- **Backend (API Interna):** [http://localhost:3050](http://localhost:3050)

> O banco de dados local (`agenda.db`) será criado automaticamente na pasta `data/` na raiz do projeto, mantendo seus dados salvos mesmo se você reiniciar o computador ou o Docker.

## ⚙️ Configuração Inicial (Primeiro Acesso)

Assim que abrir o app no navegador, siga os passos:
1. Vá na aba de **Configurações de IA** (Ícone de Cérebro/Engrenagem).
2. Selecione o provedor (ex: OpenAI ou Gemini) e cole a sua **API Key**. 
   - *Nota: Se for usar o Ollama rodando localmente, basta colocar o endpoint local sem necessidade de API Key.*
3. Defina suas **Metas Recorrentes** e **Preferências (Treino/Finanças)** nas esferas.
4. Comece a agendar tarefas e deixe a IA reorganizar o seu dia!

## ⚠️ Alerta de Segurança e Deploy na Nuvem

Este projeto foi intencionalmente construído **sem um sistema de autenticação (Login)** para ser executado localmente de forma simples.

**Não recomendamos fazer o deploy desta aplicação em URLs públicas (ex: Render, Heroku, Vercel) sem proteção prévia.**
Se você o fizer, qualquer pessoa na internet poderá acessar a sua URL, visualizar suas tarefas, consumir o seu saldo da OpenAI e ter acesso às suas chaves de API salvas no painel.

Se deseja hospedar na nuvem para uso pessoal:
- Proteja o acesso usando ferramentas como [Cloudflare Access](https://www.cloudflare.com/zero-trust/products/access/), Authelia, ou proteções HTTP Basic Auth no Nginx/Traefik.
- Utilize um banco de dados PostgreSQL (conectando-o pela aba "Database Config"), pois serviços gratuitos em nuvem costumam apagar arquivos locais (SQLite) a cada reinicialização.

## 🤝 Como Colaborar

Sinta-se livre para abrir **Issues** relatando bugs ou sugerindo novas Esferas da vida para o jogo, e crie **Pull Requests** com melhorias.

Toda a arquitetura (Backend Node.js e Frontend Vite/React) está amplamente documentada via blocos JSDoc nos arquivos principais.

---
*Transforme sua rotina em um jogo e suba de nível na vida real!* 🚀
