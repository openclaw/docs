---
read_when:
    - Você quer um gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e onboarding opcionais com Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-23T14:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcional)

Docker é **opcional**. Use-o apenas se quiser um gateway em contêiner ou validar o fluxo do Docker.

## O Docker é adequado para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o loop de desenvolvimento mais rápido. Use o fluxo normal de instalação.
- **Observação sobre sandboxing**: o backend de sandbox padrão usa Docker quando sandboxing está ativado, mas sandboxing vem desativado por padrão e **não** exige que o gateway completo seja executado em Docker. Os backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a build da imagem (`pnpm install` pode ser encerrado por OOM em hosts de 1 GB com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Reforço de segurança para exposição à rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em contêiner

<Steps>
  <Step title="Construa a imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso constrói a imagem do gateway localmente. Para usar uma imagem pré-construída em vez disso:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-construídas são publicadas no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags comuns: `main`, `latest`, `<version>` (por exemplo `2026.2.26`).

  </Step>

  <Step title="Conclua o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API de provider
    - gerar um token de gateway e gravá-lo em `.env`
    - iniciar o gateway via Docker Compose

    Durante a configuração, o onboarding pré-inicialização e as gravações de config são executados por
    `openclaw-gateway` diretamente. `openclaw-cli` é para comandos que você executa depois
    que o contêiner do gateway já existe.

  </Step>

  <Step title="Abra a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado configurado em Settings. O script de configuração grava um token em `.env` por
    padrão; se você trocar a config do contêiner para autenticação por senha, use essa
    senha em vez disso.

    Precisa da URL novamente?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure canais (opcional)">
    Use o contêiner da CLI para adicionar canais de mensagens:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Docs: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord)

  </Step>
</Steps>

### Fluxo manual

Se você preferir executar cada etapa por conta própria em vez de usar o script de configuração:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Execute `docker compose` a partir da raiz do repositório. Se você ativou `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o com `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta de pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute onboarding
e gravações de config de tempo de configuração por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                      | Objetivo                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usar uma imagem remota em vez de construir localmente           |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instalar pacotes apt extras durante a build (nomes separados por espaço) |
| `OPENCLAW_EXTENSIONS`         | Pré-instalar dependências de Plugin no momento da build (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mounts extras do host (separados por vírgula em `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Persistir `/home/node` em um volume nomeado do Docker           |
| `OPENCLAW_SANDBOX`            | Opt-in para bootstrap de sandbox (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`      | Sobrescrever o caminho do socket do Docker                      |

### Verificações de integridade

Endpoints de probe do contêiner (sem autenticação necessária):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` embutido que consulta `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot autenticado de integridade profunda:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de portas do Docker.

- `lan` (padrão): navegador do host e CLI do host podem alcançar a porta publicada do gateway.
- `loopback`: apenas processos dentro do namespace de rede do contêiner podem alcançar
  o gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Armazenamento e persistência

O Docker Compose faz bind-mount de `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
de `OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, então esses caminhos
sobrevivem à substituição do contêiner.

Esse diretório de config montado é onde o OpenClaw mantém:

- `openclaw.json` para config de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provider armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Para detalhes completos de persistência em implantações de VM, consulte
[Docker VM Runtime - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos quentes de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão, `cron/runs/*.jsonl`,
e logs rotativos de arquivo em `/tmp/openclaw/`.

### Helpers de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale o `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho raw antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo helper local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo do helper.

<AccordionGroup>
  <Accordion title="Ativar sandbox de agente para o gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Caminho de socket personalizado (por exemplo Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    O script monta `docker.sock` somente depois que os pré-requisitos da sandbox são aprovados. Se
    a configuração da sandbox não puder ser concluída, o script redefine `agents.defaults.sandbox.mode`
    para `off`.

  </Accordion>

  <Accordion title="Automação / CI (não interativo)">
    Desative a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Observação de segurança de rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos da CLI
    possam alcançar o gateway via `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A config do compose remove `NET_RAW`/`NET_ADMIN` e ativa
    `no-new-privileges` em `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem é executada como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, certifique-se de que os bind mounts do host pertencem ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Organize seu Dockerfile para que as camadas de dependência sejam mantidas em cache. Isso evita executar novamente
    `pnpm install` a menos que os lockfiles mudem:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Opções de contêiner para usuários avançados">
    A imagem padrão prioriza segurança e é executada como `node` sem root. Para um
    contêiner mais completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependências de sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores do Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads de navegador**: defina
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e use
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth do OpenAI Codex (Docker headless)">
    Se você escolher OAuth do OpenAI Codex no assistente, ele abrirá uma URL no navegador. Em
    configurações Docker ou headless, copie a URL completa de redirecionamento em que você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem Docker principal usa `node:24-bookworm` e publica anotações OCI da imagem base
    incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. Consulte
    [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em um VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Docker VM Runtime](/pt-BR/install/docker-vm-runtime) para etapas compartilhadas de implantação em VM
incluindo incorporação de binários, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está ativado com o backend Docker, o gateway
executa a execução de ferramentas do agente (shell, leitura/gravação de arquivo etc.) dentro de contêineres Docker
isolados enquanto o próprio gateway permanece no host. Isso fornece uma barreira rígida
em torno de sessões de agente não confiáveis ou multi-tenant sem colocar todo o
gateway em contêiner.

O escopo da sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permitir/negar ferramentas, isolamento de rede, limites de recursos e contêineres de navegador.

Para configuração completa, imagens, observações de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso de shell interativo a contêineres de sandbox
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente

### Ativação rápida

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Construa a imagem de sandbox padrão:

```bash
scripts/sandbox-setup.sh
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Construa a imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Os contêineres são criados automaticamente por sessão, sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão na sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do seu workspace montado,
    ou faça chown da pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas na sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizados ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante a build da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento necessário na Control UI">
    Obtenha um link novo do dashboard e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Devices](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou erros de pareamento na CLI do Docker">
    Redefina o modo e o bind do gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa ao Docker com Podman
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária com Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do gateway após a instalação
