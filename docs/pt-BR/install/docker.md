---
read_when:
    - Você quer um gateway em container em vez de instalações locais
    - Você está validando o fluxo com Docker
summary: Configuração e onboarding opcionais baseados em Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:31:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker é **opcional**. Use-o apenas se você quiser um gateway em container ou validar o fluxo com Docker.

## O Docker é adequado para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou quer executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o loop de desenvolvimento mais rápido. Use o fluxo normal de instalação.
- **Observação sobre sandboxing**: o backend padrão de sandbox usa Docker quando o sandboxing está ativado, mas o sandboxing fica desativado por padrão e **não** exige que o gateway completo seja executado em Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Veja [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para build da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB, com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Endurecimento de segurança para exposição em rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em container

<Steps>
  <Step title="Construa a imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso constrói a imagem do gateway localmente. Para usar uma imagem pré-construída:

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

    Durante a configuração, onboarding antes da inicialização e gravações de config são executados por
    `openclaw-gateway` diretamente. `openclaw-cli` é para comandos que você executa depois
    que o container do gateway já existe.

  </Step>

  <Step title="Abra a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo
    compartilhado configurado em Settings. O script de configuração grava um token em `.env` por
    padrão; se você mudar a configuração do container para auth por senha, use essa
    senha no lugar.

    Precisa da URL novamente?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure canais (opcional)">
    Use o container da CLI para adicionar canais de mensagens:

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
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute onboarding
e gravações de config de tempo de configuração por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                    |
| ------------------------------------------ | ------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usa uma imagem remota em vez de construir localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instala pacotes apt extras durante o build (nomes separados por espaço) |
| `OPENCLAW_EXTENSIONS`                      | Pré-instala dependências de plugin no tempo de build (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mounts extras do host (separados por vírgula `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persiste `/home/node` em um volume Docker nomeado             |
| `OPENCLAW_SANDBOX`                         | Ativa o bootstrap de sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | Substitui o caminho do socket Docker                          |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desativa publicação Bonjour/mDNS (o padrão é `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desativa overlays de bind mount de código-fonte de plugin incluído |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartilhado do coletor OTLP/HTTP para exportação OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos por sinal para traces, métricas ou logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Substituição do protocolo OTLP. Apenas `http/protobuf` é compatível hoje |
| `OTEL_SERVICE_NAME`                        | Nome de serviço usado para recursos OpenTelemetry             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Ativa os atributos semânticos experimentais GenAI mais recentes |
| `OPENCLAW_OTEL_PRELOADED`                  | Ignora a inicialização de um segundo SDK OpenTelemetry quando já houver um pré-carregado |

Mantenedores podem testar código-fonte de plugin incluído em relação a uma imagem empacotada montando
um diretório de código-fonte de plugin sobre o caminho de código-fonte empacotado, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o bundle compilado correspondente em
`/app/dist/extensions/synology-chat` para o mesmo id de plugin.

### Observabilidade

A exportação OpenTelemetry é de saída a partir do container do Gateway para o seu coletor OTLP.
Ela não exige uma porta Docker publicada. Se você construir a imagem
localmente e quiser que o exportador OpenTelemetry incluído esteja disponível dentro da imagem,
inclua suas dependências de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

A imagem oficial de release Docker do OpenClaw inclui o código-fonte do plugin
`diagnostics-otel` incluído. Dependendo da imagem e do estado do cache, o
Gateway ainda pode preparar dependências locais de runtime do OpenTelemetry do plugin na
primeira vez em que o plugin for ativado, então permita que essa primeira inicialização alcance o registro
de pacotes ou pré-aqueça a imagem no seu fluxo de release. Para ativar a exportação, permita e
ative o plugin `diagnostics-otel` na config e depois defina
`diagnostics.otel.enabled=true` ou use o exemplo de config em
[Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry). Headers de auth do coletor são
configurados por `diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

Métricas Prometheus usam a porta do Gateway já publicada. Ative o
plugin `diagnostics-prometheus` e depois faça scrape de:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta pública
separada `/metrics` nem um caminho de proxy reverso sem autenticação. Veja
[Métricas Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de probe do container (sem auth obrigatória):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` integrado que faz ping em `/healthz`.
Se as verificações continuarem falhando, o Docker marca o container como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot profundo de integridade autenticado:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa por padrão `OPENCLAW_GATEWAY_BIND=lan` para que o acesso do host a
`http://127.0.0.1:18789` funcione com publicação de porta do Docker.

- `lan` (padrão): navegador do host e CLI do host podem alcançar a porta publicada do gateway.
- `loopback`: apenas processos dentro do namespace de rede do container podem alcançar
  o gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Bonjour / mDNS

A rede bridge do Docker geralmente não encaminha multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. A configuração Compose incluída, portanto, usa por padrão
`OPENCLAW_DISABLE_BONJOUR=1` para que o Gateway não entre em crash-loop nem reinicie
repetidamente a publicação quando a bridge descartar tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` apenas ao executar com rede host, macvlan
ou outra rede em que o multicast mDNS funcione comprovadamente.

Para armadilhas e solução de problemas, veja [Descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose faz bind mount de `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
de `OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, para que esses caminhos
sobrevivam à substituição do container.

Esse diretório de config montado é onde o OpenClaw mantém:

- `openclaw.json` para config de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para auth armazenada de provider por OAuth/chave de API
- `.env` para segredos de runtime baseados em env como `OPENCLAW_GATEWAY_TOKEN`

Para detalhes completos de persistência em implantações em VM, veja
[Docker VM Runtime - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento em disco:** monitore `media/`, arquivos JSONL de sessão, `cron/runs/*.jsonl`
e logs rotativos em arquivo sob `/tmp/openclaw/`.

### Helpers de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho bruto antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo helper local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Veja [ClawDock](/pt-BR/install/clawdock) para o guia completo dos helpers.

<AccordionGroup>
  <Accordion title="Ativar sandbox de agente para gateway Docker">
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

    O script monta `docker.sock` apenas depois que os pré-requisitos de sandbox forem aprovados. Se
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

  <Accordion title="Observação de segurança de rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos da CLI
    possam alcançar o gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A config do Compose remove `NET_RAW`/`NET_ADMIN` e ativa
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
    Organize seu Dockerfile para que camadas de dependência sejam armazenadas em cache. Isso evita reexecutar
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

  <Accordion title="Opções de container para usuários avançados">
    A imagem padrão prioriza segurança e é executada como `node` sem privilégios de root. Para um
    container com mais recursos:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependências de sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores do Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads do navegador**: defina
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e use
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se você escolher OAuth OpenAI Codex no assistente, ele abrirá uma URL no navegador. Em
    Docker ou configurações headless, copie a URL completa de redirecionamento onde você chegar e cole
    de volta no assistente para concluir a auth.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem Docker principal usa `node:24-bookworm` e publica anotações OCI da imagem base
    incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. Veja
    [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em um VPS?

Veja [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Docker VM Runtime](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada
incluindo incorporação de binário, persistência e atualizações.

## Sandbox de agente

Quando `agents.defaults.sandbox` está ativado com o backend Docker, o gateway
executa a execução de ferramentas do agente (shell, leitura/gravação de arquivo etc.) dentro de containers Docker
isolados, enquanto o próprio gateway permanece no host. Isso oferece uma barreira rígida
em torno de sessões de agente não confiáveis ou multi-inquilino sem colocar o gateway inteiro em
container.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas allow/deny de ferramentas, isolamento de rede, limites de recursos e containers
de navegador.

Para configuração completa, imagens, observações de segurança e perfis Multi-Agent, veja:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso shell interativo a containers de sandbox
- [Sandbox e ferramentas Multi-Agent](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente

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

Construa a imagem padrão do sandbox:

```bash
scripts/sandbox-setup.sh
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou container de sandbox não inicia">
    Construa a imagem do sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Containers são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` para um UID:GID que corresponda à propriedade do seu workspace montado,
    ou faça chown da pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir o PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizadas ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante o build da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Unauthorized ou pareamento obrigatório na Control UI">
    Busque um link novo do dashboard e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Devices](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O alvo do gateway mostra ws://172.x.x.x ou erros de pareamento na CLI do Docker">
    Redefina o modo e o bind do gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa ao Docker com Podman
- [ClawDock](/pt-BR/install/clawdock) — configuração da comunidade com Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do gateway após a instalação
