---
read_when:
    - Você quer um Gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração opcionais baseadas em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o somente se quiser um Gateway conteinerizado ou validar o fluxo do Docker.

## O Docker é adequado para mim?

- **Sim**: você quer um ambiente de Gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e quer apenas o ciclo de desenvolvimento mais rápido. Use o fluxo de instalação normal.
- **Observação sobre sandbox**: o backend de sandbox padrão usa Docker quando o sandbox está habilitado, mas o sandbox vem desativado por padrão e **não** exige que o Gateway completo seja executado no Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandbox](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a criação da imagem (`pnpm install` pode ser encerrado por falta de memória em hosts com 1 GB, com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Reforço de segurança para exposição de rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway conteinerizado

<Steps>
  <Step title="Criar a imagem">
    Na raiz do repositório, execute o script de configuração:

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

  <Step title="Concluir o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele vai:

    - solicitar chaves de API do provedor
    - gerar um token do Gateway e gravá-lo em `.env`
    - iniciar o Gateway via Docker Compose

    Durante a configuração, o onboarding antes da inicialização e as gravações de configuração passam
    diretamente por `openclaw-gateway`. `openclaw-cli` é para comandos executados depois que
    o contêiner do Gateway já existe.

  </Step>

  <Step title="Abrir a interface de controle">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado
    configurado em Configurações. Por padrão, o script de configuração grava um token em `.env`;
    se você trocar a configuração do contêiner para autenticação por senha, use essa
    senha.

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
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração do momento de configuração por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                     |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar uma imagem remota em vez de criar localmente              |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalar pacotes apt extras durante a criação (separados por espaço) |
| `OPENCLAW_EXTENSIONS`                      | Incluir helpers de Plugins empacotados selecionados no momento da criação |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montagens bind extras do host (separadas por vírgula, `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` em um volume nomeado do Docker          |
| `OPENCLAW_SANDBOX`                         | Optar pelo bootstrap de sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pular a etapa interativa de onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescrever o caminho do socket do Docker                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desabilitar a divulgação Bonjour/mDNS (padrão `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desabilitar sobreposições de montagem bind do código-fonte de Plugins empacotados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartilhado do coletor OTLP/HTTP para exportação OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos do sinal para rastros, métricas ou logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescrita do protocolo OTLP. Hoje, somente `http/protobuf` é compatível |
| `OTEL_SERVICE_NAME`                        | Nome do serviço usado para recursos OpenTelemetry              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar pelos atributos semânticos experimentais mais recentes de GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Pular o início de um segundo SDK OpenTelemetry quando um já estiver pré-carregado |

Mantenedores podem testar o código-fonte de Plugins empacotados contra uma imagem empacotada montando
um diretório de código-fonte de Plugin sobre seu caminho de código-fonte empacotado, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o pacote compilado correspondente
`/app/dist/extensions/synology-chat` para o mesmo ID de Plugin.

### Observabilidade

A exportação OpenTelemetry é de saída do contêiner do Gateway para o seu coletor
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
`diagnostics.otel.enabled=true` ou use o exemplo de configuração em [Exportação
OpenTelemetry](/pt-BR/gateway/opentelemetry). Cabeçalhos de autenticação do coletor são configurados por meio de
`diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

Métricas Prometheus usam a porta do Gateway já publicada. Instale
`clawhub:@openclaw/diagnostics-prometheus`, habilite o
Plugin `diagnostics-prometheus` e então faça a coleta:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta
pública `/metrics` separada nem um caminho de proxy reverso não autenticado. Consulte
[Métricas Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de sondagem do contêiner (sem autenticação necessária):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` integrado que envia ping para `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot profundo de integridade autenticado:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` define `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de porta do Docker.

- `lan` (padrão): o navegador do host e a CLI do host conseguem acessar a porta publicada do Gateway.
- `loopback`: somente processos dentro do namespace de rede do contêiner conseguem acessar
  o Gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais do host

Quando o OpenClaw é executado no Docker, `127.0.0.1` dentro do contêiner é o próprio
contêiner, não sua máquina host. Use `host.docker.internal` para provedores de IA que
executam no host:

| Provedor  | URL padrão do host        | URL de configuração no Docker        |
| --------- | ------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434`  |

A configuração Docker empacotada usa essas URLs de host como padrões de onboarding do
LM Studio e do Ollama, e `docker-compose.yml` mapeia `host.docker.internal` para
o Gateway de host do Docker para Docker Engine no Linux. O Docker Desktop já fornece
o mesmo nome de host no macOS e no Windows.

Serviços do host também devem escutar em um endereço acessível pelo Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o mesmo
mapeamento de host por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

A rede bridge do Docker geralmente não encaminha multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Portanto, a configuração Compose empacotada define por padrão
`OPENCLAW_DISABLE_BONJOUR=1` para que o Gateway não entre em ciclo de falhas nem
reinicie repetidamente a divulgação quando a bridge descartar tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede de host, macvlan
ou outra rede em que o multicast mDNS seja conhecido por funcionar.

Para pegadinhas e solução de problemas, consulte [Descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose monta por bind `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, para que esses caminhos
sobrevivam à substituição do contêiner. Quando uma das variáveis não está definida, o
`docker-compose.yml` empacotado recorre a `${HOME}/.openclaw` (e
`${HOME}/.openclaw/workspace` para a montagem do workspace), ou `/tmp/.openclaw`
quando o próprio `HOME` também está ausente. Isso impede que `docker compose up`
emita uma especificação de volume com origem vazia em ambientes mínimos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedor armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Plugins baixáveis instalados armazenam seu estado de pacote sob o diretório home
montado do OpenClaw, para que registros de instalação de Plugins e raízes de pacote sobrevivam à
substituição do contêiner. A inicialização do Gateway não gera árvores de dependências de Plugins empacotados.

Para detalhes completos de persistência em implantações de VM, consulte
[Runtime de VM Docker - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão,
`cron/runs/*.jsonl`, raízes de pacotes de plugin instalados e logs de arquivo rotativos
em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock pelo caminho bruto antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo dos auxiliares.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Caminho de socket personalizado (por exemplo, Docker sem root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    O script monta `docker.sock` somente depois que os pré-requisitos de sandbox passam. Se
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que comandos da CLI
    possam acessar o Gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A configuração do Compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` tanto em `openclaw-gateway` quanto em `openclaw-cli`.
  </Accordion>

  <Accordion title="Falhas de DNS do Docker Desktop em openclaw-cli">
    Algumas configurações do Docker Desktop falham em consultas DNS a partir do sidecar
    `openclaw-cli` em rede compartilhada depois que `NET_RAW` é removido, o que aparece como
    `EAI_AGAIN` durante comandos baseados em npm, como `openclaw plugins install`.
    Mantenha o arquivo Compose reforçado padrão para a operação normal do Gateway. A
    substituição local abaixo afrouxa a postura de segurança do contêiner da CLI ao
    restaurar os recursos padrão do Docker, então use-a somente para o comando pontual da CLI
    que precisa de acesso ao registro de pacotes, não como sua invocação padrão do Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se você já criou um contêiner `openclaw-cli` de longa duração, recrie-o
    com a mesma substituição. `docker compose exec` e `docker exec` não conseguem
    alterar recursos do Linux em um contêiner já criado.

  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, garanta que seus bind mounts do host pertençam ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    A mesma incompatibilidade pode aparecer como um aviso de plugin, como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguido por `plugin present but blocked`. Isso significa que o uid do processo e o
    proprietário do diretório de plugin montado divergem. Prefira executar o contêiner como o
    uid 1000 padrão e corrigir a propriedade do bind mount. Só aplique chown em
    `/path/to/openclaw-config/npm` para `root:root` se você pretende executar o
    OpenClaw como root a longo prazo.

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que as camadas de dependências sejam armazenadas em cache. Isso evita executar novamente
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
    A imagem padrão prioriza segurança e executa como `node` sem root. Para um contêiner mais
    completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependências do sistema na imagem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores do Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir downloads de navegador**: use `OPENCLAW_HOME_VOLUME` ou
       `OPENCLAW_EXTRA_MOUNTS`. O OpenClaw detecta automaticamente o Chromium gerenciado pelo Playwright
       da imagem Docker no Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sem interface gráfica)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abre uma URL no navegador. Em
    Docker ou configurações sem interface gráfica, copie a URL de redirecionamento completa em que você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem principal de runtime Docker usa `node:24-bookworm-slim` e inclui `tini` como processo init de entrypoint (PID 1) para garantir que processos zumbis sejam coletados e sinais sejam tratados corretamente em contêineres de longa duração. Ela publica anotações de imagem base OCI, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs de imagem base Docker do Dependabot; builds de lançamento não executam
    uma camada de upgrade da distro. Consulte
    [anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em uma VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo incorporação de binários, persistência e atualizações.

## Sandbox de agente

Quando `agents.defaults.sandbox` é habilitado com o backend Docker, o Gateway
executa ferramentas de agente (shell, leitura/gravação de arquivos, etc.) dentro de contêineres Docker
isolados enquanto o próprio Gateway permanece no host. Isso cria uma barreira rígida
ao redor de sessões de agente não confiáveis ou multi-tenant sem conteinerizar todo o
Gateway.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres de
navegador.

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

Crie a imagem de sandbox padrão (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh
```

Para instalações npm sem checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` inline.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Crie a imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou o comando `docker build` inline de [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação npm),
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do workspace montado,
    ou aplique chown na pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para antepor seus
    caminhos de ferramentas personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante o build da imagem (exit 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento obrigatório na UI de controle">
    Busque um link de dashboard novo e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="Alvo do Gateway mostra ws://172.x.x.x ou erros de pareamento da CLI Docker">
    Redefina o modo e o bind do Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa ao Docker com Podman
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária do Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
