---
read_when:
    - Você quer um Gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração inicial opcionais baseadas em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o somente se você quiser um Gateway em contêiner ou validar o fluxo do Docker.

## Docker é adequado para mim?

- **Sim**: você quer um ambiente de Gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e quer apenas o loop de desenvolvimento mais rápido. Use o fluxo de instalação normal.
- **Nota sobre sandboxing**: o backend de sandbox padrão usa Docker quando o sandboxing está habilitado, mas o sandboxing vem desativado por padrão e **não** exige que o Gateway inteiro execute no Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a criação da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB e saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Endurecimento de segurança para exposição de rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em contêiner

<Steps>
  <Step title="Crie a imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso cria a imagem do Gateway localmente. Para usar uma imagem pré-criada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-criadas são publicadas no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags comuns: `main`, `latest`, `<version>` (por exemplo, `2026.2.26`).

  </Step>

  <Step title="Conclua o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele vai:

    - solicitar chaves de API do provedor
    - gerar um token de Gateway e gravá-lo em `.env`
    - iniciar o Gateway via Docker Compose

    Durante a configuração, o onboarding antes da inicialização e as gravações de configuração passam
    diretamente pelo `openclaw-gateway`. `openclaw-cli` é para comandos que você executa depois que
    o contêiner do Gateway já existe.

  </Step>

  <Step title="Abra a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado
    configurado em Settings. O script de configuração grava um token em `.env` por
    padrão; se você trocar a configuração do contêiner para autenticação por senha, use essa
    senha.

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

Se preferir executar cada etapa por conta própria em vez de usar o script de configuração:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Execute `docker compose` a partir da raiz do repositório. Se você habilitou `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o com `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede do `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração em tempo de configuração pelo `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar uma imagem remota em vez de criar localmente                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalar pacotes apt extras durante a criação (separados por espaço)       |
| `OPENCLAW_EXTENSIONS`                      | Incluir auxiliares de Plugin empacotados selecionados em tempo de criação           |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montagens bind extras do host (separadas por vírgula `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` em um volume nomeado do Docker                   |
| `OPENCLAW_SANDBOX`                         | Ativar o bootstrap de sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Ignorar a etapa interativa de onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Substituir o caminho do socket do Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desabilitar anúncio Bonjour/mDNS (padrão `1` para Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desabilitar sobreposições bind-mount de origem de Plugin empacotado               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint coletor OTLP/HTTP compartilhado para exportação do OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos de sinal para rastreamentos, métricas ou logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Substituição do protocolo OTLP. Somente `http/protobuf` é compatível hoje |
| `OTEL_SERVICE_NAME`                        | Nome do serviço usado para recursos do OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Ativar os atributos semânticos GenAI experimentais mais recentes         |
| `OPENCLAW_OTEL_PRELOADED`                  | Ignorar a inicialização de um segundo SDK do OpenTelemetry quando já houver um pré-carregado  |

Mantenedores podem testar o código-fonte de Plugin empacotado contra uma imagem empacotada montando
um diretório de código-fonte de Plugin sobre seu caminho de origem empacotado, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de origem montado substitui o bundle compilado correspondente
`/app/dist/extensions/synology-chat` para o mesmo ID de Plugin.

### Observabilidade

A exportação do OpenTelemetry sai do contêiner do Gateway para o seu coletor
OTLP. Ela não exige uma porta Docker publicada. Se você criar a imagem
localmente e quiser que o exportador OpenTelemetry empacotado esteja disponível dentro da imagem,
inclua suas dependências de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instale o Plugin oficial `@openclaw/diagnostics-otel` do ClawHub em
instalações Docker empacotadas antes de habilitar a exportação. Imagens personalizadas criadas a partir do código-fonte
ainda podem incluir o código-fonte local do Plugin com
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar a exportação, permita e habilite o
Plugin `diagnostics-otel` na configuração e então defina
`diagnostics.otel.enabled=true` ou use o exemplo de configuração em [Exportação do OpenTelemetry
](/pt-BR/gateway/opentelemetry). Cabeçalhos de autenticação do coletor são configurados por meio de
`diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

Métricas Prometheus usam a porta do Gateway já publicada. Instale
`clawhub:@openclaw/diagnostics-prometheus`, habilite o
Plugin `diagnostics-prometheus` e então faça o scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta `/metrics`
pública separada nem um caminho de proxy reverso sem autenticação. Consulte
[Métricas Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de probe do contêiner (sem autenticação necessária):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` integrado que faz ping em `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot profundo de integridade autenticado:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` usa `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de porta do Docker.

- `lan` (padrão): o navegador do host e a CLI do host conseguem acessar a porta publicada do Gateway.
- `loopback`: apenas processos dentro do namespace de rede do contêiner conseguem acessar
  o Gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais no host

Quando o OpenClaw executa no Docker, `127.0.0.1` dentro do contêiner é o próprio
contêiner, não sua máquina host. Use `host.docker.internal` para provedores de IA que
executam no host:

| Provedor  | URL padrão do host         | URL de configuração do Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

A configuração Docker empacotada usa essas URLs de host como padrões de onboarding
do LM Studio e do Ollama, e `docker-compose.yml` mapeia `host.docker.internal` para
o Gateway de host do Docker para Docker Engine no Linux. O Docker Desktop já fornece
o mesmo nome de host no macOS e no Windows.

Serviços do host também precisam escutar em um endereço acessível pelo Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o mesmo
mapeamento de host por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Redes bridge do Docker normalmente não encaminham multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Por isso, a configuração Compose empacotada define
`OPENCLAW_DISABLE_BONJOUR=1` por padrão para que o Gateway não entre em crash-loop nem reinicie
repetidamente a publicidade quando a bridge descartar tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede host, macvlan
ou outra rede em que se sabe que o multicast mDNS funciona.

Para pegadinhas e solução de problemas, consulte [Descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose monta `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, de modo que esses caminhos
sobrevivam à substituição do contêiner. Quando qualquer uma das variáveis não estiver definida, o
`docker-compose.yml` empacotado recorre a `${HOME}/.openclaw` (e
`${HOME}/.openclaw/workspace` para a montagem do workspace), ou `/tmp/.openclaw`
quando o próprio `HOME` também estiver ausente. Isso impede que `docker compose up`
emita uma especificação de volume com origem vazia em ambientes básicos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedor armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Plugins baixáveis instalados armazenam o estado do pacote sob o home montado do
OpenClaw, então registros de instalação de Plugin e raízes de pacote sobrevivem à
substituição do contêiner. A inicialização do Gateway não gera árvores de dependência de Plugins empacotados.

Para detalhes completos de persistência em implantações de VM, consulte
[Runtime de VM Docker - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento do disco:** monitore `media/`, arquivos JSONL de sessão,
`cron/runs/*.jsonl`, raízes de pacotes de plugins instalados e logs de arquivo rotativos
em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock pelo caminho bruto antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe o novo local.

Em seguida, use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo de auxiliares.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para o Gateway Docker">
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
    Desabilite a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de segurança de rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos
    da CLI possam acessar o Gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A configuração do Compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` tanto em `openclaw-gateway` quanto em `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, garanta que seus bind mounts do host sejam propriedade do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que as camadas de dependências sejam armazenadas em cache. Isso evita reexecutar
    `pnpm install`, a menos que os lockfiles mudem:

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
    A imagem padrão prioriza segurança e executa como `node` não root. Para um contêiner
    com mais recursos:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependências do sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores do Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads de navegadores**: defina
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e use
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abrirá uma URL no navegador. Em
    configurações Docker ou headless, copie a URL de redirecionamento completa na qual você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem principal de runtime Docker usa `node:24-bookworm-slim` e publica anotações OCI
    de imagem base, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs de imagem base Docker do Dependabot; builds de lançamento não executam
    uma camada de atualização da distro. Consulte
    [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em um VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Runtime Docker VM](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo inclusão de binários, persistência e atualizações.

## Sandbox de agente

Quando `agents.defaults.sandbox` é habilitado com o backend Docker, o Gateway
executa ferramentas do agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker
isolados enquanto o próprio Gateway permanece no host. Isso oferece uma barreira rígida
em torno de sessões de agente não confiáveis ou multi-tenant sem conteinerizar todo o
Gateway.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres
de navegador.

Para configuração completa, imagens, notas de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo de shell a contêineres de sandbox
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente

### Habilitação rápida

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

Crie a imagem padrão do sandbox (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh
```

Para instalações npm sem um checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` inline.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Crie a imagem do sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou com o comando `docker build` inline de [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação npm),
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do seu workspace montado,
    ou execute chown na pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (login shell), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizados, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante o build da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento exigido na Control UI">
    Obtenha um link novo do dashboard e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou erros de pareamento pela Docker CLI">
    Redefina o modo e o bind do Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa Podman ao Docker
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária com Docker Compose
- [Atualização](/pt-BR/install/updating) — manter o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
