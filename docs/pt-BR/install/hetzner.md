---
read_when:
    - Você quer o OpenClaw funcionando 24 horas por dia, 7 dias por semana, em um VPS na nuvem (não no seu laptop)
    - Você quer um Gateway de nível de produção, sempre ativo, em seu próprio VPS
    - Você quer controle total sobre persistência, binários e comportamento de reinicialização
    - Você está executando o OpenClaw no Docker, na Hetzner ou em um provedor semelhante
summary: Execute o Gateway do OpenClaw 24 horas por dia, 7 dias por semana, em um VPS econômico da Hetzner (Docker), com estado persistente e binários integrados
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T00:02:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw em um VPS da Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Os preços da Hetzner mudam; escolha o menor VPS Debian/Ubuntu que atenda às necessidades e aumente sua capacidade se ocorrerem erros de falta de memória (OOM).

O Gateway pode ser acessado por meio de encaminhamento de porta SSH a partir do seu laptop ou pela exposição direta da porta, caso você mesmo gerencie o firewall e os tokens.

Lembrete sobre o modelo de segurança:

- Agentes compartilhados pela empresa são adequados quando todos estão no mesmo limite de confiança e o ambiente de execução é usado exclusivamente para fins empresariais.
- Mantenha uma separação rigorosa: VPS/ambiente de execução dedicados + contas dedicadas; não use perfis pessoais da Apple, do Google, do navegador ou do gerenciador de senhas nesse host.
- Se os usuários forem adversários entre si, separe-os por Gateway/host/usuário do sistema operacional.

Consulte [Segurança](/pt-BR/gateway/security) e [Hospedagem em VPS](/pt-BR/vps).

Este guia pressupõe o uso do Ubuntu ou Debian na Hetzner. Em outro VPS Linux, adapte os pacotes conforme necessário. Para o fluxo genérico do Docker, consulte [Docker](/pt-BR/install/docker).

## O que você precisa

- VPS da Hetzner com acesso root
- Acesso SSH a partir do seu laptop
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedores (QR do WhatsApp, token de bot do Telegram, OAuth do Gmail)
- Cerca de 20 minutos

## Caminho rápido

1. Provisionar o VPS da Hetzner
2. Instalar o Docker
3. Clonar o repositório do OpenClaw
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Incorporar os binários necessários à imagem
7. Executar `docker compose up -d`
8. Verificar a persistência e o acesso ao Gateway

<Steps>
  <Step title="Provisionar o VPS">
    Crie um VPS Ubuntu ou Debian na Hetzner e conecte-se como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Trate o VPS como uma infraestrutura com estado, não como uma infraestrutura descartável.

  </Step>

  <Step title="Instalar o Docker (no VPS)">
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

  <Step title="Clonar o repositório do OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Este guia cria uma imagem personalizada para que todos os binários incorporados a ela sobrevivam às reinicializações.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Os contêineres Docker são efêmeros; todo estado de longa duração deve residir no host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar as variáveis de ambiente">
    Crie `.env` na raiz do repositório:

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

    Defina `OPENCLAW_GATEWAY_TOKEN` para gerenciar o token estável do Gateway por meio do
    `.env`; caso contrário, configure `gateway.auth.token` antes de depender de clientes
    entre reinicializações. Se nenhum dos dois estiver definido, o OpenClaw usará, nessa
    inicialização, um token válido somente durante o ambiente de execução. Gere uma senha
    para o chaveiro em `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não confirme este arquivo no repositório.** Ele contém variáveis de ambiente do
    contêiner/ambiente de execução, como `OPENCLAW_GATEWAY_TOKEN`. A autenticação OAuth/por
    chave de API armazenada dos provedores reside no arquivo montado
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` serve apenas para facilitar a inicialização, não como substituto para uma configuração real do Gateway. Ainda é necessário configurar a autenticação (`gateway.auth.token` ou senha) e um modo de vinculação seguro para sua implantação.

  </Step>

  <Step title="Etapas compartilhadas do ambiente de execução da VM Docker">
    Siga o guia compartilhado do ambiente de execução para o fluxo comum do host Docker:

    - [Incorporar os binários necessários à imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Criar e iniciar](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste e onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acesso específico da Hetzner">
    Após as etapas compartilhadas de criação e inicialização, abra o túnel.

    **Pré-requisito:** certifique-se de que a configuração do sshd no VPS permita o encaminhamento TCP. Se você
    reforçou a segurança da configuração SSH, verifique `/etc/ssh/sshd_config` e defina:

    ```text
    AllowTcpForwarding local
    ```

    `local` permite encaminhamentos locais com `ssh -L` a partir do seu laptop e, ao mesmo tempo, bloqueia
    encaminhamentos remotos originados no servidor. Defini-lo como `no` faz o túnel falhar com:
    `channel 3: open failed: administratively prohibited: open failed`

    Após confirmar que o encaminhamento TCP está habilitado, reinicie o serviço SSH
    (`systemctl restart ssh`) e execute o túnel a partir do seu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abra `http://127.0.0.1:18789/` e cole o segredo compartilhado configurado.
    Este guia usa o token do Gateway por padrão; use sua senha configurada
    caso tenha mudado para autenticação por senha.

  </Step>
</Steps>

O mapa de persistência compartilhado está em [Ambiente de execução da VM Docker](/pt-BR/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração do Terraform mantida pela comunidade oferece:

- Configuração modular do Terraform com gerenciamento remoto de estado
- Provisionamento automatizado por meio do cloud-init
- Scripts de implantação (inicialização, implantação, backup/restauração)
- Reforço de segurança (firewall, UFW, acesso somente por SSH)
- Configuração de túnel SSH para acesso ao Gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuração do Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Essa abordagem complementa a configuração do Docker apresentada acima com implantações reproduzíveis, infraestrutura controlada por versão e recuperação automatizada de desastres.

<Note>
Mantido pela comunidade. Para relatar problemas ou contribuir, consulte os links dos repositórios acima.
</Note>

## Próximas etapas

- Configurar canais de mensagens: [Canais](/pt-BR/channels)
- Configurar o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Manter o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Conteúdo relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Fly.io](/pt-BR/install/fly)
- [Docker](/pt-BR/install/docker)
- [Hospedagem em VPS](/pt-BR/vps)
