---
read_when:
    - Você quer o OpenClaw em execução 24 horas por dia, 7 dias por semana, no GCP
    - Você quer um Gateway de nível de produção, sempre ativo, em sua própria VM
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
summary: Execute o Gateway do OpenClaw 24 horas por dia, 7 dias por semana, em uma VM do GCP Compute Engine (Docker) com estado persistente
title: GCP
x-i18n:
    generated_at: "2026-07-12T15:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw em uma VM do GCP Compute Engine usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Os preços variam conforme o tipo de máquina e a região; escolha a menor VM adequada à sua carga de trabalho e aumente a capacidade se ocorrerem erros de falta de memória (OOM).

O Gateway pode ser acessado por encaminhamento de porta SSH a partir do seu laptop ou pela exposição direta da porta, caso você mesmo gerencie o firewall e os tokens.

Este guia usa Debian no GCP Compute Engine. O Ubuntu também funciona; adapte os pacotes conforme necessário. Para o fluxo genérico do Docker, consulte [Docker](/pt-BR/install/docker).

## O que você precisa

- Conta do GCP (`e2-micro` é qualificada para o nível gratuito)
- CLI `gcloud` ou o [Cloud Console](https://console.cloud.google.com)
- Acesso SSH pelo seu laptop
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedores (QR do WhatsApp, token de bot do Telegram, OAuth do Gmail)
- Cerca de 20-30 minutos

## Caminho rápido

1. Crie um projeto do GCP e ative o faturamento e a API do Compute Engine
2. Crie uma VM do Compute Engine (`e2-small`, Debian 12, 20GB)
3. Conecte-se à VM por SSH e instale o Docker
4. Clone o repositório do OpenClaw
5. Crie diretórios persistentes no host
6. Configure `.env` e `docker-compose.yml`
7. Incorpore os binários necessários, compile e inicie

<Steps>
  <Step title="Instalar a CLI gcloud (ou usar o Console)">
    Instale seguindo as instruções em [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) e execute:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Como alternativa, execute todas as etapas abaixo pela interface web do [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Criar um projeto do GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Ative o faturamento em [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obrigatório para o Compute Engine).

    Equivalente no Console: IAM & Admin > Create Project, ative o faturamento e acesse APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Criar a VM">
    | Tipo      | Especificações            | Custo                       | Observações                                          |
    | --------- | ------------------------- | --------------------------- | ---------------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM           | Cerca de US$ 25/mês         | Mais confiável para compilações locais do Docker     |
    | e2-small  | 2 vCPU, 2GB RAM           | Cerca de US$ 12/mês         | Mínimo recomendado para uma compilação do Docker     |
    | e2-micro  | 2 vCPU (compartilhadas), 1GB RAM | Qualificada para o nível gratuito | Frequentemente falha por OOM na compilação do Docker (saída 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Conectar-se à VM por SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: clique em "SSH" ao lado da VM no painel do Compute Engine.

    A propagação da chave SSH pode levar 1-2 minutos após a criação da VM; aguarde e tente novamente se a conexão for recusada.

  </Step>

  <Step title="Instalar o Docker (na VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Encerre a sessão e entre novamente para que a alteração do grupo entre em vigor. Depois, reconecte-se por SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifique:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clonar o repositório do OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia cria uma imagem personalizada para que os binários incorporados permaneçam disponíveis após reinicializações.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Os contêineres do Docker são efêmeros; todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurar variáveis de ambiente">
    Crie `.env` na raiz do repositório:

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

    Defina `OPENCLAW_GATEWAY_TOKEN` para gerenciar o token estável do gateway por meio do
    `.env`; caso contrário, configure `gateway.auth.token` antes de depender de clientes
    após reinicializações. Se nenhum deles estiver definido, o OpenClaw usará, nessa
    inicialização, um token válido somente durante a execução. Gere uma senha para o chaveiro em `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit deste arquivo.** Ele contém variáveis de ambiente do contêiner e da execução, como
    `OPENCLAW_GATEWAY_TOKEN`. A autenticação armazenada por OAuth/chave de API dos provedores fica no
    arquivo montado `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configuração do Docker Compose">
    Crie ou atualize `docker-compose.yml`:

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
          # Recomendado: mantenha o Gateway somente na interface de loopback da VM; acesse-o por um túnel SSH.
          # Para expô-lo publicamente, remova o prefixo `127.0.0.1:` e configure o firewall de forma adequada.
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

    `--allow-unconfigured` serve apenas para facilitar a inicialização, não substitui uma configuração real do gateway. Ainda é necessário definir a autenticação (`gateway.auth.token` ou senha) e um modo de vinculação seguro para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de execução em VM com Docker">
    Siga o guia de execução compartilhado para o fluxo comum de host Docker:

    - [Incorporar os binários necessários à imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar e iniciar](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Observações específicas do GCP para a inicialização">
    Se a compilação falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use no mínimo `e2-small` ou `e2-medium` para compilações iniciais mais confiáveis.

    Ao vincular à LAN (`OPENCLAW_GATEWAY_BIND=lan`), configure uma origem de navegador confiável antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Substitua `18789` pela porta configurada caso você a tenha alterado.

  </Step>

  <Step title="Acessar pelo seu laptop">
    Crie um túnel SSH para encaminhar a porta do Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Abra `http://127.0.0.1:18789/` no navegador.

    Exiba novamente um link limpo para o painel:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Se a interface solicitar autenticação por segredo compartilhado, cole o token ou a
    senha configurada nas configurações da Control UI (esse fluxo do Docker grava um token
    por padrão; se você tiver mudado para autenticação por senha, use a senha configurada).

    Se a Control UI mostrar `unauthorized` ou `disconnected (1008): pairing required`, aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Consulte [Execução em VM com Docker](/pt-BR/install/docker-vm-runtime#what-persists-where) para ver o mapa de persistência compartilhada e o [fluxo de atualização](/pt-BR/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Solução de problemas

**Conexão SSH recusada**

A propagação da chave SSH pode levar 1-2 minutos após a criação da VM. Aguarde e tente novamente.

**Problemas com o OS Login**

Verifique seu perfil do OS Login:

```bash
gcloud compute os-login describe-profile
```

Confira se sua conta tem as permissões de IAM necessárias (Compute OS Login ou Compute OS Admin Login).

**Falta de memória (OOM)**

Se a compilação do Docker falhar com `Killed` e `exit code 137`, o processo da VM foi encerrado por falta de memória:

```bash
# Primeiro, pare a VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Altere o tipo de máquina
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Inicie a VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Contas de serviço (prática recomendada de segurança)

Para uso pessoal, sua conta de usuário padrão funciona normalmente. Para automação ou CI/CD, crie uma conta de serviço dedicada com o mínimo de permissões:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Evite a função Owner para automação; use a função mais restrita que funcione. Consulte [Como entender as funções](https://cloud.google.com/iam/docs/understanding-roles).

## Próximas etapas

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Emparelhe dispositivos locais como nós: [Nós](/pt-BR/nodes)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Azure](/pt-BR/install/azure)
- [Hospedagem em VPS](/pt-BR/vps)
