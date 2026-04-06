---
read_when:
    - Você quer um gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e onboarding opcionais baseados em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-06T03:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6aa0453340d7683b4954316274ba6dd1aa7c0ce2483e9bd8ae137ff4efd4c3c
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcional)

Docker é **opcional**. Use-o somente se você quiser um gateway em contêiner ou validar o fluxo do Docker.

## O Docker é adequado para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o loop de desenvolvimento mais rápido. Use o fluxo de instalação normal.
- **Observação sobre sandbox**: o sandbox de agente também usa Docker, mas **não** exige que o gateway completo seja executado em Docker. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para o build da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Endurecimento de segurança para exposição de rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em contêiner

<Steps>
  <Step title="Build da imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso faz o build local da imagem do gateway. Para usar uma imagem pré-construída em vez disso:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-construídas são publicadas no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags comuns: `main`, `latest`, `<version>` (por exemplo, `2026.2.26`).

  </Step>

  <Step title="Concluir o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API de provedores
    - gerar um token de gateway e gravá-lo em `.env`
    - iniciar o gateway via Docker Compose

    Durante a configuração, o onboarding antes da inicialização e as gravações de config em tempo de setup são executados por meio de
    `openclaw-gateway` diretamente. `openclaw-cli` é para comandos que você executa depois
    que o contêiner do gateway já existe.

  </Step>

  <Step title="Abrir a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o secret compartilhado
    configurado em Settings. O script de configuração grava um token em `.env` por
    padrão; se você mudar a config do contêiner para auth por senha, use essa
    senha no lugar.

    Precisa da URL novamente?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurar canais (opcional)">
    Use o contêiner da CLI para adicionar canais de mensagens:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentação: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord)

  </Step>
</Steps>

### Fluxo manual

Se você preferir executar cada etapa manualmente em vez de usar o script de configuração:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Execute `docker compose` a partir da raiz do repositório. Se você tiver ativado `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o com `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta de pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de config em tempo de setup por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                      | Finalidade                                                      |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usar uma imagem remota em vez de fazer build localmente         |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instalar pacotes apt extras durante o build (nomes separados por espaço) |
| `OPENCLAW_EXTENSIONS`         | Pré-instalar dependências de extensões no build (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mounts extras do host (separados por vírgula em `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Persistir `/home/node` em um volume nomeado do Docker           |
| `OPENCLAW_SANDBOX`            | Opt-in para bootstrap de sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`      | Substituir o caminho do socket do Docker                        |

### Health checks

Endpoints de sondagem do contêiner (não exigem auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` integrado que faz ping em `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot autenticado de health profundo:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` define `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de portas do Docker.

- `lan` (padrão): o navegador do host e a CLI do host podem alcançar a porta publicada do gateway.
- `loopback`: somente processos dentro do namespace de rede do contêiner podem alcançar
  o gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Armazenamento e persistência

O Docker Compose monta por bind `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, portanto esses caminhos
sobrevivem à substituição do contêiner.

Esse diretório de config montado é onde o OpenClaw mantém:

- `openclaw.json` para a config de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para auth OAuth/chave de API de provedores armazenada
- `.env` para secrets de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Para detalhes completos de persistência em implantações em VM, consulte
[Docker VM Runtime - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos quentes de crescimento em disco:** monitore `media/`, arquivos JSONL de sessão, `cron/runs/*.jsonl`
e logs de arquivo rotativos em `/tmp/openclaw/`.

### Helpers de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale o `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho raw antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo local de helper acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo do helper.

<AccordionGroup>
  <Accordion title="Ativar o sandbox de agente para o gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Caminho de socket personalizado (por exemplo, Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    O script monta `docker.sock` somente depois que os pré-requisitos do sandbox passam. Se
    a configuração do sandbox não puder ser concluída, o script redefine `agents.defaults.sandbox.mode`
    para `off`.

  </Accordion>

  <Accordion title="Automação / CI (não interativo)">
    Desative a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Observação de segurança sobre rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos da CLI
    possam alcançar o gateway por `127.0.0.1`. Trate isso como um limite de
    confiança compartilhado. A config do Compose remove `NET_RAW`/`NET_ADMIN` e ativa
    `no-new-privileges` em `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem é executada como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, verifique se seus bind mounts do host pertencem ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que as camadas de dependência sejam armazenadas em cache. Isso evita executar novamente
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
    A imagem padrão prioriza segurança e é executada como `node` sem privilégios de root. Para um
    contêiner mais completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependências do sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores do Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads do navegador**: defina
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e use
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth do OpenAI Codex (Docker headless)">
    Se você escolher OAuth do OpenAI Codex no assistente, ele abrirá uma URL no navegador. Em
    configurações Docker ou headless, copie a URL completa de redirecionamento em que você cair e cole-a
    de volta no assistente para concluir a auth.
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
[Docker VM Runtime](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo incorporação de binários, persistência e atualizações.

## Sandbox de agente

Quando `agents.defaults.sandbox` está ativado, o gateway executa a execução de tools do agente
(shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker isolados, enquanto o
próprio gateway permanece no host. Isso oferece uma barreira rígida em torno de sessões de agente
não confiáveis ou multi-tenant sem colocar todo o gateway em contêiner.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de allow/deny de tools, isolamento de rede, limites de recursos e contêineres de navegador.

Para configuração completa, imagens, observações de segurança e perfis multi-agent, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo de shell aos contêineres de sandbox
- [Sandbox e Tools de Multi-Agent](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente

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

Faça o build da imagem padrão de sandbox:

```bash
scripts/sandbox-setup.sh
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Faça o build da imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou defina `agents.defaults.sandbox.docker.image` como sua imagem personalizada.
    Os contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do workspace montado,
    ou execute chown na pasta do workspace.
  </Accordion>

  <Accordion title="Tools personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir o PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de tools personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante o build da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Unauthorized ou pairing required na Control UI">
    Busque um link novo do dashboard e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="O alvo do gateway mostra ws://172.x.x.x ou erros de pairing da CLI Docker">
    Redefina o modo e o bind do gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral de instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa ao Docker com Podman
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária com Docker Compose
- [Updating](/pt-BR/install/updating) — como manter o OpenClaw atualizado
- [Configuration](/pt-BR/gateway/configuration) — configuração do gateway após a instalação
