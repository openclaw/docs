---
read_when:
    - Você quer o OpenClaw em execução 24/7 em um VPS na nuvem (não no seu laptop)
    - Você quer um Gateway sempre ativo, de nível de produção, no seu próprio VPS
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
    - Você está executando o OpenClaw em Docker na Hetzner ou em um provedor similar
summary: Executar o Gateway OpenClaw 24/7 em um VPS barato da Hetzner (Docker) com estado durável e binários incorporados
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T05:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetzner (Docker, guia de VPS para produção)

## Objetivo

Executar um Gateway OpenClaw persistente em um VPS da Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer “OpenClaw 24/7 por ~$5”, esta é a configuração confiável mais simples.
Os preços da Hetzner mudam; escolha o menor VPS Debian/Ubuntu e aumente se começar a ter OOM.

Lembrete sobre o modelo de segurança:

- Agentes compartilhados pela empresa funcionam bem quando todos estão no mesmo limite de confiança e o runtime é apenas corporativo.
- Mantenha separação estrita: VPS/runtime dedicado + contas dedicadas; nada de perfis pessoais de Apple/Google/browser/gerenciador de senhas nesse host.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário do SO.

Consulte [Segurança](/pt-BR/gateway/security) e [Hospedagem VPS](/pt-BR/vps).

## O que estamos fazendo (em termos simples)?

- Alugar um pequeno servidor Linux (VPS da Hetzner)
- Instalar Docker (runtime isolado do app)
- Iniciar o Gateway OpenClaw no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a UI de Controle do seu laptop via um tunnel SSH

Esse estado montado em `~/.openclaw` inclui `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
por agente e `.env`.

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH a partir do seu laptop
- Exposição direta de porta, se você gerenciar firewall e tokens por conta própria

Este guia assume Ubuntu ou Debian na Hetzner.  
Se você estiver em outro VPS Linux, adapte os pacotes conforme necessário.
Para o fluxo genérico de Docker, consulte [Docker](/pt-BR/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisionar VPS da Hetzner
2. Instalar Docker
3. Clonar o repositório OpenClaw
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Incorporar binários necessários à imagem
7. `docker compose up -d`
8. Verificar persistência e acesso ao Gateway

---

## O que você precisa

- VPS da Hetzner com acesso root
- Acesso SSH a partir do seu laptop
- Conforto básico com SSH + copiar/colar
- ~20 minutos
- Docker e Docker Compose
- Credenciais de autenticação de modelo
- Credenciais opcionais de provedor
  - QR do WhatsApp
  - token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Provisionar o VPS">
    Crie um VPS Ubuntu ou Debian na Hetzner.

    Conecte-se como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Este guia assume que o VPS é stateful.
    Não o trate como infraestrutura descartável.

  </Step>

  <Step title="Instalar Docker (no VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifique:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clonar o repositório OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia assume que você vai fazer build de uma imagem personalizada para garantir persistência dos binários.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Containers Docker são efêmeros.
    Todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Definir propriedade para o usuário do container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar variáveis de ambiente">
    Crie `.env` na raiz do repositório.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Deixe `OPENCLAW_GATEWAY_TOKEN` em branco, a menos que você queira explicitamente
    gerenciá-lo pelo `.env`; o OpenClaw grava um token aleatório do gateway na
    configuração na primeira inicialização. Gere uma senha de keyring e cole em
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não versione este arquivo.**

    Este arquivo `.env` é para env de container/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    A autenticação armazenada de OAuth/chave de API do provedor fica em
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
          # Recomendado: mantenha o Gateway apenas em loopback no VPS; acesse via tunnel SSH.
          # Para expô-lo publicamente, remova o prefixo `127.0.0.1:` e configure o firewall adequadamente.
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

    `--allow-unconfigured` serve apenas para conveniência no bootstrap, não substitui uma configuração adequada do gateway. Ainda assim, defina autenticação (`gateway.auth.token` ou password) e use configurações seguras de bind para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas de runtime de VM Docker">
    Use o guia compartilhado de runtime para o fluxo comum de host Docker:

    - [Incorporar binários necessários à imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e inicialização](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acesso específico da Hetzner">
    Após as etapas compartilhadas de build e inicialização, crie um tunnel a partir do seu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abra:

    `http://127.0.0.1:18789/`

    Cole o segredo compartilhado configurado. Este guia usa o token do gateway por
    padrão; se você mudou para autenticação por senha, use essa senha.

  </Step>
</Steps>

O mapa compartilhado de persistência está em [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade oferece:

- Configuração modular do Terraform com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restore)
- Endurecimento de segurança (firewall, UFW, acesso apenas por SSH)
- Configuração de tunnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuração Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Essa abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação automatizada de desastre.

> **Observação:** mantido pela comunidade. Para issues ou contribuições, consulte os links dos repositórios acima.

## Próximos passos

- Configurar canais de mensagens: [Canais](/pt-BR/channels)
- Configurar o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Manter o OpenClaw atualizado: [Atualizando](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Fly.io](/pt-BR/install/fly)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
