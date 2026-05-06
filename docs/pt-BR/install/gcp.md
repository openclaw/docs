---
read_when:
    - Você quer executar o OpenClaw 24/7 no GCP
    - Você quer um Gateway de nível de produção, sempre ativo, em sua própria VM
    - Você quer controle total sobre a persistência, os binários e o comportamento de reinicialização
summary: Execute o OpenClaw Gateway 24/7 em uma VM do GCP Compute Engine (Docker) com estado durável
title: GCP
x-i18n:
    generated_at: "2026-05-06T06:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Execute um OpenClaw Gateway persistente em uma VM do GCP Compute Engine usando Docker, com estado durável, binários embutidos e comportamento seguro de reinicialização.

Se você quer "OpenClaw 24/7 por ~$5-12/mês", esta é uma configuração confiável no Google Cloud.
O preço varia por tipo de máquina e região; escolha a menor VM que atenda à sua carga de trabalho e aumente a escala se encontrar OOMs.

## O que estamos fazendo (em termos simples)?

- Criar um projeto do GCP e habilitar o faturamento
- Criar uma VM do Compute Engine
- Instalar o Docker (runtime de aplicativo isolado)
- Iniciar o OpenClaw Gateway no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Control UI do seu laptop por meio de um túnel SSH

Esse estado `~/.openclaw` montado inclui `openclaw.json`, por agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

O Gateway pode ser acessado por:

- Encaminhamento de porta SSH a partir do seu laptop
- Exposição direta de porta se você gerenciar firewalling e tokens por conta própria

Este guia usa Debian no GCP Compute Engine.
Ubuntu também funciona; mapeie os pacotes conforme necessário.
Para o fluxo genérico do Docker, consulte [Docker](/pt-BR/install/docker).

---

## Caminho rápido (operadores experientes)

1. Criar projeto do GCP + habilitar a API Compute Engine
2. Criar VM do Compute Engine (e2-small, Debian 12, 20GB)
3. Fazer SSH na VM
4. Instalar o Docker
5. Clonar o repositório do OpenClaw
6. Criar diretórios persistentes no host
7. Configurar `.env` e `docker-compose.yml`
8. Embutir os binários necessários, compilar e iniciar

---

## O que você precisa

- Conta do GCP (elegível ao nível gratuito para e2-micro)
- gcloud CLI instalada (ou use o Cloud Console)
- Acesso SSH a partir do seu laptop
- Familiaridade básica com SSH + copiar/colar
- ~20-30 minutos
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedor
  - QR do WhatsApp
  - Token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Instale a gcloud CLI (ou use o Console)">
    **Opção A: gcloud CLI** (recomendado para automação)

    Instale a partir de [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inicialize e autentique:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opção B: Cloud Console**

    Todas as etapas podem ser feitas pela UI web em [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Crie um projeto do GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Habilite o faturamento em [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (necessário para o Compute Engine).

    Habilite a API Compute Engine:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vá para IAM & Admin > Create Project
    2. Dê um nome e crie
    3. Habilite o faturamento para o projeto
    4. Navegue até APIs & Services > Enable APIs > pesquise "Compute Engine API" > Enable

  </Step>

  <Step title="Crie a VM">
    **Tipos de máquina:**

    | Tipo      | Especificações           | Custo              | Observações                                  |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mês           | Mais confiável para builds locais do Docker  |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mês           | Mínimo recomendado para build do Docker      |
    | e2-micro  | 2 vCPU (compartilhada), 1GB RAM | Elegível ao nível gratuito | Frequentemente falha com OOM no build do Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Vá para Compute Engine > VM instances > Create instance
    2. Nome: `openclaw-gateway`
    3. Região: `us-central1`, Zona: `us-central1-a`
    4. Tipo de máquina: `e2-small`
    5. Disco de inicialização: Debian 12, 20GB
    6. Crie

  </Step>

  <Step title="Faça SSH na VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Clique no botão "SSH" ao lado da sua VM no painel do Compute Engine.

    Observação: a propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Se a conexão for recusada, aguarde e tente novamente.

  </Step>

  <Step title="Instale o Docker (na VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Saia e entre novamente para que a alteração de grupo entre em vigor:

    ```bash
    exit
    ```

    Em seguida, faça SSH novamente:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifique:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone o repositório do OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia pressupõe que você criará uma imagem personalizada para garantir a persistência dos binários.

  </Step>

  <Step title="Crie diretórios persistentes no host">
    Contêineres Docker são efêmeros.
    Todo estado de longa duração deve viver no host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Deixe `OPENCLAW_GATEWAY_TOKEN` em branco, a menos que você queira explicitamente
    gerenciá-lo por meio de `.env`; o OpenClaw grava um token de Gateway aleatório na
    configuração na primeira inicialização. Gere uma senha de keyring e cole-a em
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit deste arquivo.**

    Este arquivo `.env` é para env de contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação OAuth/chave de API armazenada do provedor fica no arquivo montado
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configuração do Docker Compose">
    Crie ou atualize `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` é apenas para conveniência de bootstrap; não é um substituto para uma configuração adequada de Gateway. Ainda assim, configure autenticação (`gateway.auth.token` ou senha) e use configurações de bind seguras para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime de VM Docker">
    Use o guia de runtime compartilhado para o fluxo comum de host Docker:

    - [Embutir os binários necessários na imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar e iniciar](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Observações de inicialização específicas do GCP">
    No GCP, se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use `e2-small` no mínimo, ou `e2-medium` para primeiros builds mais confiáveis.

    Ao fazer bind na LAN (`OPENCLAW_GATEWAY_BIND=lan`), configure uma origem de navegador confiável antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Se você alterou a porta do Gateway, substitua `18789` pela porta configurada.

  </Step>

  <Step title="Acesse a partir do seu laptop">
    Crie um túnel SSH para encaminhar a porta do Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Abra no seu navegador:

    `http://127.0.0.1:18789/`

    Imprima novamente um link limpo do painel:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Se a UI solicitar autenticação por segredo compartilhado, cole o token ou
    a senha configurada nas configurações da Control UI. Este fluxo Docker grava um token por
    padrão; se você mudar a configuração do contêiner para autenticação por senha, use essa
    senha em vez disso.

    Se a Control UI mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Precisa novamente da referência de persistência compartilhada e atualização?
    Consulte [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime#what-persists-where) e [atualizações do Runtime de VM Docker](/pt-BR/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Solução de problemas

**Conexão SSH recusada**

A propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com OS Login**

Verifique seu perfil do OS Login:

```bash
gcloud compute os-login describe-profile
```

Garanta que sua conta tenha as permissões IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Sem memória (OOM)**

Se o build do Docker falhar com `Killed` e `exit code 137`, a VM foi encerrada por OOM. Faça upgrade para e2-small (mínimo) ou e2-medium (recomendado para builds locais confiáveis):

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Contas de serviço (prática recomendada de segurança)

Para uso pessoal, sua conta de usuário padrão funciona bem.

Para automação ou pipelines de CI/CD, crie uma conta de serviço dedicada com permissões mínimas:

1. Crie uma conta de serviço:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Conceda a função Compute Instance Admin (ou uma função personalizada mais restrita):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Evite usar a função Owner para automação. Use o princípio do menor privilégio.

Consulte [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) para detalhes sobre funções IAM.

---

## Próximas etapas

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Emparelhe dispositivos locais como nós: [Nós](/pt-BR/nodes)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Azure](/pt-BR/install/azure)
- [Hospedagem VPS](/pt-BR/vps)
