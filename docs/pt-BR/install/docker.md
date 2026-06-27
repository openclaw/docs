---
read_when:
    - Você quer um gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração opcionais baseadas em Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:37:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o apenas se você quiser um gateway em contêiner ou validar o fluxo do Docker.

## Docker é adequado para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e quer apenas o ciclo de desenvolvimento mais rápido. Use o fluxo normal de instalação.
- **Observação sobre sandboxing**: o backend de sandbox padrão usa Docker quando sandboxing está habilitado, mas sandboxing fica desativado por padrão e **não** exige que o gateway completo seja executado no Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a criação da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB e código de saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Reforço de segurança para exposição de rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em contêiner

<Steps>
  <Step title="Criar a imagem">
    Na raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso cria a imagem do gateway localmente. Para usar uma imagem pré-criada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-criadas são publicadas no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags comuns: `main`, `latest`, `<version>` (por exemplo, `2026.2.26`).

  </Step>

  <Step title="Reexecução airgapped">
    Em hosts offline, transfira e carregue a imagem primeiro:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica se `OPENCLAW_IMAGE` já existe localmente, desabilita
    pulls e builds implícitos do Compose e então executa o fluxo normal de configuração, como
    sincronização de `.env`, correções de permissões, onboarding, sincronização da configuração do gateway
    e inicialização do Compose.

    Se `OPENCLAW_SANDBOX=1`, a configuração offline também verifica as imagens de sandbox padrão configuradas
    e ativas por agente no daemon por trás de
    `OPENCLAW_DOCKER_SOCKET`. Imagens de navegador com backend Docker também devem conter o
    rótulo atual de contrato do navegador do OpenClaw. Quando uma imagem obrigatória está ausente ou
    incompatível, a configuração sai sem alterar a configuração de sandbox, em vez de
    relatar sucesso com um sandbox inutilizável.

  </Step>

  <Step title="Concluir onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API do provedor
    - gerar um token de gateway e gravá-lo em `.env`
    - criar o diretório da chave secreta do perfil de autenticação
    - iniciar o gateway via Docker Compose

    Durante a configuração, o onboarding pré-inicialização e as gravações de configuração são executados por meio de
    `openclaw-gateway` diretamente. `openclaw-cli` é para comandos que você executa depois que
    o contêiner do gateway já existe.

  </Step>

  <Step title="Abrir a UI de Controle">
    Abra `http://127.0.0.1:18789/` no seu navegador e cole o segredo compartilhado
    configurado em Configurações. O script de configuração grava um token em `.env` por
    padrão; se você trocar a configuração do contêiner para autenticação por senha, use essa
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
Execute `docker compose` a partir da raiz do repo. Se você habilitou `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o depois de qualquer arquivo de substituição padrão, por exemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quando ambos os arquivos de substituição existirem.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede do `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração de tempo de setup por meio do `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                            |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar uma imagem remota em vez de compilar localmente                  |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Instalar pacotes apt extras durante a compilação (separados por espaço) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Instalar pacotes Python extras durante a compilação (separados por espaço) |
| `OPENCLAW_EXTENSIONS`                      | Pré-instalar dependências de plugins no tempo de compilação (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montagens bind extras do host (`source:target[:opts]` separadas por vírgula) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` em um volume Docker nomeado                    |
| `OPENCLAW_SANDBOX`                         | Habilitar bootstrap de sandbox (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                 | Ignorar a etapa interativa de onboarding (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_DOCKER_SOCKET`                   | Substituir o caminho do socket do Docker                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desabilitar anúncio Bonjour/mDNS (o padrão é `1` para Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desabilitar sobreposições de montagem bind de código-fonte de plugins empacotados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartilhado de coletor OTLP/HTTP para exportação do OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos de sinal para traces, métricas ou logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Substituição de protocolo OTLP. Somente `http/protobuf` é compatível hoje |
| `OTEL_SERVICE_NAME`                        | Nome de serviço usado para recursos do OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Habilitar os atributos semânticos GenAI experimentais mais recentes   |
| `OPENCLAW_OTEL_PRELOADED`                  | Ignorar a inicialização de um segundo SDK OpenTelemetry quando um já estiver pré-carregado |

A imagem Docker oficial não inclui Homebrew. Durante o onboarding, o OpenClaw
oculta instaladores de dependências de Skills exclusivos do brew quando está em execução em um
contêiner Linux sem `brew`; essas dependências precisam ser fornecidas por uma imagem personalizada
ou instaladas manualmente. Para dependências disponíveis em pacotes Debian, use
`OPENCLAW_IMAGE_APT_PACKAGES` durante a compilação da imagem. O nome legado
`OPENCLAW_DOCKER_APT_PACKAGES` ainda é aceito.
Para dependências Python, use `OPENCLAW_IMAGE_PIP_PACKAGES`. Isso executa
`python3 -m pip install --break-system-packages` durante a compilação da imagem; portanto, fixe
as versões dos pacotes e use apenas índices de pacotes em que você confia.

Mantenedores podem testar o código-fonte de Plugin empacotado em uma imagem empacotada montando
um diretório de código-fonte de Plugin sobre o caminho do código-fonte empacotado dele, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o pacote compilado correspondente
`/app/dist/extensions/synology-chat` para o mesmo id de Plugin.

### Observabilidade

A exportação do OpenTelemetry sai do contêiner do Gateway para o seu coletor
OTLP. Ela não exige uma porta Docker publicada. Se você compilar a imagem
localmente e quiser que o exportador OpenTelemetry empacotado esteja disponível dentro da imagem,
inclua suas dependências de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instale o Plugin oficial `@openclaw/diagnostics-otel` do ClawHub em
instalações Docker empacotadas antes de habilitar a exportação. Imagens personalizadas compiladas a partir do código-fonte
ainda podem incluir o código-fonte local do Plugin com
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar a exportação, permita e habilite o
Plugin `diagnostics-otel` na configuração e, em seguida, defina
`diagnostics.otel.enabled=true` ou use o exemplo de configuração em [exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry). Cabeçalhos de autenticação do coletor são configurados por meio de
`diagnostics.otel.headers`, não por variáveis de ambiente Docker.

Métricas do Prometheus usam a porta do Gateway já publicada. Instale
`clawhub:@openclaw/diagnostics-prometheus`, habilite o Plugin
`diagnostics-prometheus` e então faça o scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta
`/metrics` pública separada nem um caminho de proxy reverso não autenticado. Consulte
[métricas do Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de probe do contêiner (sem autenticação exigida):

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

### LAN vs loopback

`scripts/docker/setup.sh` define `OPENCLAW_GATEWAY_BIND=lan` por padrão para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de portas do Docker.

- `lan` (padrão): o navegador do host e a CLI do host conseguem acessar a porta publicada do gateway.
- `loopback`: apenas processos dentro do namespace de rede do contêiner conseguem acessar
  o gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais do host

Quando o OpenClaw roda no Docker, `127.0.0.1` dentro do contêiner é o próprio
contêiner, não a máquina host. Use `host.docker.internal` para provedores de IA que
rodam no host:

| Provedor  | URL padrão do host       | URL de setup do Docker              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

O setup Docker empacotado usa essas URLs de host como padrões de onboarding do LM Studio e do Ollama,
e `docker-compose.yml` mapeia `host.docker.internal` para
o gateway de host do Docker para Linux Docker Engine. O Docker Desktop já fornece
o mesmo nome de host no macOS e no Windows.

Serviços do host também precisam escutar em um endereço acessível a partir do Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o mesmo
mapeamento de host por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend da Claude CLI no Docker

A imagem oficial do Docker do OpenClaw não vem com Claude Code pré-instalado. Instale e
faça login no Claude Code dentro do usuário do contêiner que executa o OpenClaw, depois persista
esse home do contêiner para que atualizações da imagem não apaguem o binário nem o estado
de autenticação do Claude.

Para novas instalações Docker, habilite um volume `/home/node` persistente antes de executar
a configuração:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para uma instalação Docker existente, primeiro pare a stack e recarregue os valores atuais
do `.env` do Docker antes de executar a configuração novamente. O script de configuração não lê
`.env` por conta própria; ele reescreve `.env` a partir do shell atual e dos padrões. Para
o `.env` gerado, execute:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se seu `.env` contiver valores que seu shell não consegue carregar com source, reexporte manualmente
primeiro os valores existentes dos quais você depende, como `OPENCLAW_IMAGE`, portas, modo de bind,
caminhos personalizados, `OPENCLAW_EXTRA_MOUNTS`, sandbox e configurações para pular o onboarding.
A sobreposição gerada monta o volume home tanto para `openclaw-gateway` quanto para
`openclaw-cli`.

Execute os comandos restantes com a sobreposição Compose gerada para que ambos os serviços
montem o home persistido. Se sua configuração também usar `docker-compose.override.yml`,
inclua-o antes de `docker-compose.extra.yml`.

Instale o Claude Code nesse home persistido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

O instalador nativo grava o binário `claude` em
`/home/node/.local/bin/claude`. Diga ao OpenClaw para usar esse caminho do contêiner:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Faça login e verifique de dentro do mesmo home persistido do contêiner:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Depois disso, você pode usar o backend `claude-cli` incluído:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` persiste a instalação nativa do Claude Code em
`/home/node/.local/bin` e `/home/node/.local/share/claude`, além das configurações
e do estado de autenticação do Claude Code em `/home/node/.claude` e `/home/node/.claude.json`.
Persistir apenas `/home/node/.openclaw` não é suficiente para reutilizar a Claude CLI. Se
você usar `OPENCLAW_EXTRA_MOUNTS` em vez de um volume home, monte todos esses
caminhos do Claude em ambos os serviços Docker.

<Note>
Para automação de produção compartilhada ou cobrança previsível da Anthropic, prefira o
caminho com chave de API da Anthropic. A reutilização da Claude CLI segue o comportamento
da versão instalada, login da conta, cobrança e atualização do Claude Code.
</Note>

### Bonjour / mDNS

A rede bridge do Docker geralmente não encaminha multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Por isso, a configuração Compose incluída define por padrão
`OPENCLAW_DISABLE_BONJOUR=1` para que o Gateway não entre em crash loop nem reinicie
repetidamente a divulgação quando a bridge descarta tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede host, macvlan
ou outra rede em que se saiba que multicast mDNS funciona.

Para pegadinhas e solução de problemas, consulte [descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose monta via bind `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace` e
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` em `/home/node/.config/openclaw`, para que esses
caminhos sobrevivam à substituição do contêiner. Quando qualquer variável não está definida, o
`docker-compose.yml` incluído usa como fallback caminhos sob `${HOME}`, ou `/tmp` quando o próprio
`HOME` também está ausente. Isso evita que `docker compose up` emita uma especificação de volume
com origem vazia em ambientes mínimos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedores armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

O diretório da chave secreta de perfis de autenticação armazena a chave de criptografia local usada para
material de token de perfil de autenticação baseado em OAuth. Mantenha-o junto do estado do seu host Docker,
mas separado de `OPENCLAW_CONFIG_DIR`.

Plugins baixáveis instalados armazenam o estado do pacote sob o home montado do
OpenClaw, então registros de instalação de plugins e raízes de pacote sobrevivem à
substituição do contêiner. A inicialização do Gateway não gera árvores de dependência de plugins incluídos.

Para detalhes completos de persistência em implantações de VM, consulte
[Runtime de VM Docker - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão, o banco de dados
SQLite de estado compartilhado, raízes de pacotes de plugins instalados e logs de arquivo rotativos
em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock pelo caminho raw antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo de auxiliares.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para Gateway Docker">
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
    para `off`. Turnos em modo de código do Codex ainda ficam restritos a
    `workspace-write` do Codex enquanto o sandbox do OpenClaw está ativo; não monte o
    socket Docker do host em contêineres de sandbox de agente.

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
    possam alcançar o gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A configuração compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` tanto em `openclaw-gateway` quanto em `openclaw-cli`.
  </Accordion>

  <Accordion title="Falhas de DNS do Docker Desktop em openclaw-cli">
    Algumas configurações do Docker Desktop falham em consultas DNS a partir do sidecar
    `openclaw-cli` de rede compartilhada após `NET_RAW` ser removido, o que aparece como
    `EAI_AGAIN` durante comandos baseados em npm, como `openclaw plugins install`.
    Mantenha o arquivo compose endurecido padrão para a operação normal do gateway. A
    sobreposição local abaixo relaxa a postura de segurança do contêiner da CLI ao
    restaurar as capacidades padrão do Docker, então use-a somente para o comando CLI pontual
    que precisa de acesso ao registro de pacotes, não como sua invocação Compose padrão:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se você já criou um contêiner `openclaw-cli` de longa duração, recrie-o
    com a mesma sobreposição. `docker compose exec` e `docker exec` não conseguem
    alterar capacidades do Linux em um contêiner já criado.

  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, garanta que seus bind mounts do host pertençam ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    A mesma incompatibilidade pode aparecer como um aviso de plugin, como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguido de `plugin present but blocked`. Isso significa que o uid do processo e o
    proprietário do diretório de plugin montado divergem. Prefira executar o contêiner como o
    uid 1000 padrão e corrigir a propriedade do bind mount. Use chown em
    `/path/to/openclaw-config/npm` para `root:root` somente se você executar intencionalmente o
    OpenClaw como root no longo prazo.

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que camadas de dependência sejam armazenadas em cache. Isso evita executar novamente
    `pnpm install` a menos que lockfiles mudem:

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
    A imagem padrão prioriza segurança e executa como `node` não root. Para um contêiner mais
    completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependências do sistema na imagem**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incluir dependências Python na imagem**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incluir Playwright Chromium na imagem**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Ou instalar navegadores Playwright em um volume persistido**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persistir downloads de navegador**: use `OPENCLAW_HOME_VOLUME` ou
       `OPENCLAW_EXTRA_MOUNTS`. O OpenClaw detecta automaticamente o Chromium gerenciado pelo
       Playwright da imagem Docker no Linux.

  </Accordion>

  <Accordion title="OAuth do OpenAI Codex (Docker headless)">
    Se você escolher OAuth do OpenAI Codex no assistente, ele abre uma URL no navegador. Em
    Docker ou configurações headless, copie a URL completa de redirecionamento em que você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Base image metadata">
    A imagem principal de runtime do Docker usa `node:24-bookworm-slim` e inclui `tini` como o processo init de entrypoint (PID 1) para garantir que processos zumbis sejam coletados e sinais sejam tratados corretamente em contêineres de longa duração. Ela publica anotações OCI de imagem base, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs do Dependabot para imagem base Docker; builds de release não executam
    uma camada de atualização da distro. Consulte
    [anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em um VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo preparo do binário, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está habilitado com o backend Docker, o Gateway
executa a execução de ferramentas do agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker
isolados, enquanto o próprio Gateway permanece no host. Isso oferece uma barreira rígida
ao redor de sessões de agente não confiáveis ou multi-inquilino sem conteinerizar todo o
Gateway.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres de
navegador.

Para configuração completa, imagens, notas de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo ao shell de contêineres de sandbox
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

Para instalações npm sem um checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` inline.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Crie a imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou o comando `docker build` inline de [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação npm),
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do seu workspace montado,
    ou execute chown na pasta do workspace.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir o PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Busque um novo link do painel e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Painel](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
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
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária do Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
