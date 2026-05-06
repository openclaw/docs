---
read_when:
    - Você quer o OpenClaw rodando 24/7 em um VPS na nuvem (não no seu notebook)
    - Você quer um Gateway sempre ativo e pronto para produção no seu próprio VPS
    - Você quer ter controle total sobre a persistência, os binários e o comportamento de reinício
    - Você está executando o OpenClaw no Docker na Hetzner ou em um provedor semelhante
summary: Execute o OpenClaw Gateway 24/7 em uma VPS barata da Hetzner (Docker) com estado durável e binários incorporados
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T06:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw na Hetzner (Docker, guia de VPS de produção)

## Objetivo

Executar um Gateway OpenClaw persistente em uma VPS da Hetzner usando Docker, com estado durável, binários incorporados e comportamento seguro de reinicialização.

Se você quer "OpenClaw 24/7 por ~$5", esta é a configuração confiável mais simples.
Os preços da Hetzner mudam; escolha a menor VPS Debian/Ubuntu e aumente a escala se encontrar OOMs.

Lembrete do modelo de segurança:

- Agentes compartilhados pela empresa são aceitáveis quando todos estão dentro do mesmo limite de confiança e o runtime é apenas comercial.
- Mantenha separação rigorosa: VPS/runtime dedicados + contas dedicadas; nenhum perfil pessoal da Apple/Google/navegador/gerenciador de senhas nesse host.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário do SO.

Consulte [Segurança](/pt-BR/gateway/security) e [Hospedagem VPS](/pt-BR/vps).

## O que estamos fazendo (em termos simples)?

- Alugar um pequeno servidor Linux (VPS da Hetzner)
- Instalar o Docker (runtime de aplicativo isolado)
- Iniciar o Gateway OpenClaw no Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` no host (sobrevive a reinicializações/rebuilds)
- Acessar a Interface de Controle do seu laptop por meio de um túnel SSH

Esse estado montado em `~/.openclaw` inclui `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` por agente e `.env`.

O Gateway pode ser acessado via:

- Encaminhamento de porta SSH do seu laptop
- Exposição direta de porta se você gerenciar firewall e tokens por conta própria

Este guia pressupõe Ubuntu ou Debian na Hetzner.  
Se você estiver em outra VPS Linux, mapeie os pacotes conforme necessário.
Para o fluxo Docker genérico, consulte [Docker](/pt-BR/install/docker).

---

## Caminho rápido (operadores experientes)

1. Provisionar a VPS da Hetzner
2. Instalar o Docker
3. Clonar o repositório OpenClaw
4. Criar diretórios persistentes no host
5. Configurar `.env` e `docker-compose.yml`
6. Incorporar os binários necessários na imagem
7. `docker compose up -d`
8. Verificar a persistência e o acesso ao Gateway

---

## O que você precisa

- VPS da Hetzner com acesso root
- Acesso SSH do seu laptop
- Conforto básico com SSH + copiar/colar
- ~20 minutos
- Docker e Docker Compose
- Credenciais de autenticação do modelo
- Credenciais opcionais de provedor
  - QR do WhatsApp
  - Token de bot do Telegram
  - OAuth do Gmail

---

<Steps>
  <Step title="Provisionar a VPS">
    Crie uma VPS Ubuntu ou Debian na Hetzner.

    Conecte-se como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Este guia pressupõe que a VPS é stateful.
    Não a trate como infraestrutura descartável.

  </Step>

  <Step title="Instalar o Docker (na VPS)">
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

    Este guia pressupõe que você criará uma imagem personalizada para garantir a persistência dos binários.

  </Step>

  <Step title="Criar diretórios persistentes no host">
    Contêineres Docker são efêmeros.
    Todo estado de longa duração deve ficar no host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
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
    gerenciá-lo por meio de `.env`; o OpenClaw grava um token de gateway aleatório na
    configuração na primeira inicialização. Gere uma senha para o keyring e cole-a em
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Não faça commit deste arquivo.**

    Este arquivo `.env` é para variáveis de ambiente de contêiner/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    Autenticação OAuth/chave de API de provedores armazenada fica no
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montado.

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

    `--allow-unconfigured` serve apenas para conveniência de bootstrap; não é um substituto para uma configuração de gateway adequada. Ainda assim, configure autenticação (`gateway.auth.token` ou senha) e use configurações de bind seguras para sua implantação.

  </Step>

  <Step title="Etapas de runtime de VM Docker compartilhada">
    Use o guia de runtime compartilhado para o fluxo comum de host Docker:

    - [Incorporar os binários necessários na imagem](/pt-BR/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Criar e iniciar](/pt-BR/install/docker-vm-runtime#build-and-launch)
    - [O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where)
    - [Atualizações](/pt-BR/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acesso específico da Hetzner">
    Após as etapas compartilhadas de build e inicialização, conclua a configuração a seguir para abrir o túnel:

    **Pré-requisito:** Certifique-se de que a configuração sshd da sua VPS permite encaminhamento TCP. Se você
    reforçou sua configuração SSH, verifique `/etc/ssh/sshd_config` e defina:

    ```
    AllowTcpForwarding local
    ```

    `local` permite encaminhamentos locais `ssh -L` do seu laptop, enquanto bloqueia
    encaminhamentos remotos do servidor. Defini-lo como `no` fará o túnel falhar
    com:
    `channel 3: open failed: administratively prohibited: open failed`

    Depois de confirmar que o encaminhamento TCP está habilitado, reinicie o serviço SSH
    (`systemctl restart ssh`) e execute o túnel do seu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abra:

    `http://127.0.0.1:18789/`

    Cole o segredo compartilhado configurado. Este guia usa o token de gateway por
    padrão; se você mudou para autenticação por senha, use essa senha em vez disso.

  </Step>
</Steps>

O mapa de persistência compartilhada fica em [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime#what-persists-where).

## Infraestrutura como Código (Terraform)

Para equipes que preferem fluxos de trabalho de infraestrutura como código, uma configuração Terraform mantida pela comunidade fornece:

- Configuração Terraform modular com gerenciamento de estado remoto
- Provisionamento automatizado via cloud-init
- Scripts de implantação (bootstrap, deploy, backup/restauração)
- Reforço de segurança (firewall, UFW, acesso somente por SSH)
- Configuração de túnel SSH para acesso ao gateway

**Repositórios:**

- Infraestrutura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuração Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Essa abordagem complementa a configuração Docker acima com implantações reproduzíveis, infraestrutura versionada e recuperação de desastre automatizada.

<Note>
Mantido pela comunidade. Para problemas ou contribuições, consulte os links de repositório acima.
</Note>

## Próximas etapas

- Configurar canais de mensagens: [Canais](/pt-BR/channels)
- Configurar o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Manter o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Fly.io](/pt-BR/install/fly)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
