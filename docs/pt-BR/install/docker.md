---
read_when:
    - Você quer um gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração opcionais baseadas em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o somente se quiser um gateway em contêiner ou validar o fluxo do Docker.

## Docker é adequado para mim?

- **Sim**: você quer um ambiente de gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e quer apenas o ciclo de desenvolvimento mais rápido. Use o fluxo normal de instalação.
- **Observação sobre sandboxing**: o backend padrão de sandbox usa Docker quando o sandboxing está habilitado, mas o sandboxing fica desativado por padrão e **não** exige que o gateway completo seja executado no Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a construção da imagem (`pnpm install` pode ser encerrado por falta de memória em hosts com 1 GB, com saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Endurecimento de segurança para exposição de rede](/pt-BR/gateway/security),
  especialmente a política de firewall Docker `DOCKER-USER`.

## Gateway em contêiner

<Steps>
  <Step title="Construir a imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso cria a imagem do gateway localmente. Para usar uma imagem pré-construída:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imagens pré-construídas são publicadas primeiro no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    O GHCR é o registro principal para automação de releases, implantações fixadas
    e verificações de proveniência. O mesmo fluxo de release também publica um espelho oficial
    no Docker Hub em `openclaw/openclaw` para hosts que preferem Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Use `ghcr.io/openclaw/openclaw` ou `openclaw/openclaw`. Evite espelhos comunitários
    no Docker Hub porque o OpenClaw não controla o cronograma de release,
    reconstruções nem a política de retenção deles. Tags oficiais comuns: `main`, `latest`,
    `<version>` (por exemplo, `2026.2.26`) e versões beta como
    `2026.2.26-beta.1`. Tags beta não movem `latest` nem `main`.

  </Step>

  <Step title="Reexecutar sem internet">
    Em hosts offline, transfira e carregue a imagem primeiro:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica se `OPENCLAW_IMAGE` já existe localmente, desativa
    pulls e builds implícitos do Compose, depois executa o fluxo normal de configuração, como
    sincronização de `.env`, correções de permissões, onboarding, sincronização de configuração do gateway
    e inicialização do Compose.

    Se `OPENCLAW_SANDBOX=1`, a configuração offline também verifica as imagens de sandbox padrão configurada
    e ativa por agente no daemon por trás de
    `OPENCLAW_DOCKER_SOCKET`. Imagens de navegador com backend Docker também devem carregar o
    rótulo atual do contrato de navegador do OpenClaw. Quando uma imagem obrigatória está ausente ou
    incompatível, a configuração sai sem alterar a configuração de sandbox, em vez de
    relatar sucesso com um sandbox inutilizável.

  </Step>

  <Step title="Concluir o onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API dos provedores
    - gerar um token de gateway e gravá-lo em `.env`
    - criar o diretório da chave secreta do perfil de autenticação
    - iniciar o gateway via Docker Compose

    Durante a configuração, o onboarding antes da inicialização e as gravações de configuração passam
    diretamente por `openclaw-gateway`. `openclaw-cli` é para comandos que você executa depois
    que o contêiner do gateway já existe.

  </Step>

  <Step title="Abrir a Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado configurado
    nas Configurações. O script de configuração grava um token em `.env` por
    padrão; se você mudar a configuração do contêiner para autenticação por senha, use essa
    senha.

    Precisa da URL de novo?

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
inclua-o depois de qualquer arquivo de substituição padrão, por exemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quando ambos os arquivos de substituição existirem.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração em tempo de configuração por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                            |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar uma imagem remota em vez de construir localmente                 |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Instalar pacotes apt extras durante o build (separados por espaço)    |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Instalar pacotes Python extras durante o build (separados por espaço) |
| `OPENCLAW_EXTENSIONS`                      | Pré-instalar dependências de Plugins no momento do build (nomes separados por espaço) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montagens bind extras do host (separadas por vírgula `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` em um volume Docker nomeado                    |
| `OPENCLAW_SANDBOX`                         | Optar pelo bootstrap de sandbox (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                 | Pular a etapa interativa de onboarding (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescrever o caminho do socket Docker                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desativar anúncio Bonjour/mDNS (padrão `1` para Docker)               |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desativar sobreposições de bind-mount de código-fonte de Plugins empacotados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartilhado do coletor OTLP/HTTP para exportação OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos de sinal para traces, métricas ou logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescrita do protocolo OTLP. Somente `http/protobuf` é compatível hoje |
| `OTEL_SERVICE_NAME`                        | Nome do serviço usado para recursos do OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar pelos atributos semânticos experimentais GenAI mais recentes    |
| `OPENCLAW_OTEL_PRELOADED`                  | Pular a inicialização de um segundo SDK OpenTelemetry quando um já estiver pré-carregado |

A imagem oficial do Docker não inclui Homebrew. Durante o onboarding, o OpenClaw
oculta instaladores de dependências de skill exclusivos do brew quando está sendo executado em um contêiner
Linux sem `brew`; essas dependências devem ser fornecidas por uma imagem personalizada
ou instaladas manualmente. Para dependências disponíveis em pacotes Debian, use
`OPENCLAW_IMAGE_APT_PACKAGES` durante o build da imagem. O nome legado
`OPENCLAW_DOCKER_APT_PACKAGES` ainda é aceito.
Para dependências Python, use `OPENCLAW_IMAGE_PIP_PACKAGES`. Isso executa
`python3 -m pip install --break-system-packages` durante o build da imagem, então fixe
as versões dos pacotes e use somente índices de pacotes em que você confia.

Mantenedores podem testar o código-fonte de Plugin empacotado contra uma imagem empacotada montando
um diretório de código-fonte de Plugin sobre seu caminho de código-fonte empacotado, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o pacote compilado correspondente
`/app/dist/extensions/synology-chat` para o mesmo id de Plugin.

### Observabilidade

A exportação OpenTelemetry sai do contêiner do Gateway para o seu coletor OTLP.
Ela não exige uma porta Docker publicada. Se você construir a imagem
localmente e quiser que o exportador OpenTelemetry empacotado esteja disponível dentro da imagem,
inclua suas dependências de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instale o Plugin oficial `@openclaw/diagnostics-otel` do ClawHub em
instalações Docker empacotadas antes de habilitar a exportação. Imagens personalizadas construídas a partir do código-fonte ainda podem
incluir o código-fonte do Plugin local com
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar a exportação, permita e habilite o
Plugin `diagnostics-otel` na configuração, depois defina
`diagnostics.otel.enabled=true` ou use o exemplo de configuração em [Exportação
OpenTelemetry](/pt-BR/gateway/opentelemetry). Cabeçalhos de autenticação do coletor são configurados por meio de
`diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

Métricas Prometheus usam a porta do Gateway já publicada. Instale
`clawhub:@openclaw/diagnostics-prometheus`, habilite o Plugin
`diagnostics-prometheus` e então colete:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta pública
`/metrics` separada nem um caminho de proxy reverso sem autenticação. Consulte
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

Snapshot de integridade profundo autenticado:

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

### Provedores locais do host

Quando o OpenClaw é executado no Docker, `127.0.0.1` dentro do contêiner é o próprio contêiner,
não sua máquina host. Use `host.docker.internal` para provedores de IA que
rodam no host:

| Provedor  | URL padrão do host       | URL de configuração do Docker       |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

A configuração Docker incluída usa essas URLs de host como padrões de onboarding
do LM Studio e do Ollama, e `docker-compose.yml` mapeia `host.docker.internal`
para o gateway de host do Docker no Docker Engine para Linux. O Docker Desktop já
fornece o mesmo nome de host no macOS e no Windows.

Os serviços do host também precisam escutar em um endereço acessível pelo Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o
mesmo mapeamento de host por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI no Docker

A imagem Docker oficial do OpenClaw não vem com Claude Code pré-instalado.
Instale e faça login no Claude Code dentro do usuário do contêiner que executa o
OpenClaw; depois, persista o home desse contêiner para que upgrades de imagem não
apaguem o binário nem o estado de autenticação do Claude.

Para novas instalações Docker, habilite um volume persistente em `/home/node`
antes de executar a configuração:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para uma instalação Docker existente, primeiro pare a stack e recarregue os
valores atuais do `.env` do Docker antes de executar a configuração novamente. O
script de configuração não lê `.env` por conta própria; ele reescreve `.env` a
partir do shell atual e dos padrões. Para o `.env` gerado, execute:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se seu `.env` contém valores que seu shell não consegue carregar com source,
reexporte manualmente primeiro os valores existentes dos quais você depende, como
`OPENCLAW_IMAGE`, portas, modo de bind, caminhos personalizados,
`OPENCLAW_EXTRA_MOUNTS`, sandbox e configurações de pular onboarding. O overlay
gerado monta o volume home tanto para `openclaw-gateway` quanto para
`openclaw-cli`.

Execute os comandos restantes com o overlay Compose gerado para que ambos os
serviços montem o home persistido. Se sua configuração também usa
`docker-compose.override.yml`, inclua-o antes de `docker-compose.extra.yml`.

Instale o Claude Code nesse home persistido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

O instalador nativo grava o binário `claude` em
`/home/node/.local/bin/claude`. Informe ao OpenClaw para usar esse caminho do
contêiner:

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
`/home/node/.local/bin` e `/home/node/.local/share/claude`, além das
configurações e do estado de autenticação do Claude Code em `/home/node/.claude`
e `/home/node/.claude.json`. Persistir apenas `/home/node/.openclaw` não é
suficiente para reutilizar a Claude CLI. Se você usar `OPENCLAW_EXTRA_MOUNTS` em
vez de um volume home, monte todos esses caminhos do Claude em ambos os serviços
Docker.

<Note>
Para automação de produção compartilhada ou cobrança previsível da Anthropic,
prefira o caminho por chave de API da Anthropic. A reutilização da Claude CLI
segue a versão instalada do Claude Code, o login da conta, a cobrança e o
comportamento de atualização.
</Note>

### Bonjour / mDNS

A rede bridge do Docker geralmente não encaminha multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Por isso, a configuração Compose
incluída usa `OPENCLAW_DISABLE_BONJOUR=1` por padrão para que o Gateway não entre
em loop de falha nem reinicie repetidamente a divulgação quando a bridge descarta
tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts
Docker. Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede do host,
macvlan ou outra rede em que se sabe que o multicast mDNS funciona.

Para armadilhas e solução de problemas, consulte [descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose monta por bind `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace` e
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` em `/home/node/.config/openclaw`, para que
esses caminhos sobrevivam à substituição do contêiner. Quando alguma variável
não é definida, o `docker-compose.yml` incluído usa como fallback um caminho em
`${HOME}`, ou `/tmp` quando o próprio `HOME` também está ausente. Isso impede que
`docker compose up` emita uma especificação de volume com origem vazia em
ambientes básicos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedor armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

O diretório de chaves secretas de perfil de autenticação armazena a chave de
criptografia local usada para material de token de perfil de autenticação baseado
em OAuth. Mantenha-o com o estado do seu host Docker, mas separado de
`OPENCLAW_CONFIG_DIR`.

Plugins baixáveis instalados armazenam o estado do pacote sob o home montado do
OpenClaw, então registros de instalação de plugins e raízes de pacote sobrevivem
à substituição do contêiner. A inicialização do Gateway não gera árvores de
dependências de plugins incluídos.

Para detalhes completos de persistência em implantações de VM, consulte
[Runtime de VM Docker - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão,
o banco de dados de estado SQLite compartilhado, raízes de pacote de plugins
instalados e logs em arquivo com rotação em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock pelo caminho raw antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo dos auxiliares.

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

    O script monta `docker.sock` somente depois que os pré-requisitos do sandbox
    passam. Se a configuração do sandbox não puder ser concluída, o script
    redefine `agents.defaults.sandbox.mode` para `off`. Turnos em modo de código
    do Codex ainda ficam restritos ao `workspace-write` do Codex enquanto o
    sandbox do OpenClaw está ativo; não monte o socket Docker do host em
    contêineres de sandbox de agente.

  </Accordion>

  <Accordion title="Automação / CI (não interativo)">
    Desabilite a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de segurança de rede compartilhada">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que
    comandos da CLI possam alcançar o Gateway por `127.0.0.1`. Trate isso como
    um limite de confiança compartilhado. A configuração compose remove
    `NET_RAW`/`NET_ADMIN` e habilita `no-new-privileges` tanto em
    `openclaw-gateway` quanto em `openclaw-cli`.
  </Accordion>

  <Accordion title="Falhas de DNS do Docker Desktop no openclaw-cli">
    Algumas configurações do Docker Desktop falham em consultas DNS a partir do
    sidecar `openclaw-cli` de rede compartilhada depois que `NET_RAW` é removido,
    o que aparece como `EAI_AGAIN` durante comandos apoiados por npm, como
    `openclaw plugins install`. Mantenha o arquivo compose endurecido padrão para
    a operação normal do Gateway. O override local abaixo afrouxa a postura de
    segurança do contêiner da CLI ao restaurar as capacidades padrão do Docker,
    então use-o somente para o comando CLI pontual que precisa de acesso ao
    registro de pacotes, não como sua invocação Compose padrão:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se você já criou um contêiner `openclaw-cli` de longa duração, recrie-o com
    o mesmo override. `docker compose exec` e `docker exec` não conseguem alterar
    capacidades Linux em um contêiner já criado.

  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, garanta que seus bind mounts do host pertençam ao uid
    1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    A mesma incompatibilidade pode aparecer como um aviso de plugin, como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguido por `plugin present but blocked`. Isso significa que o uid do
    processo e o proprietário do diretório de plugin montado divergem. Prefira
    executar o contêiner como o uid 1000 padrão e corrigir a propriedade do bind
    mount. Só execute chown em `/path/to/openclaw-config/npm` para `root:root` se
    você pretender executar o OpenClaw como root em longo prazo.

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que as camadas de dependência sejam armazenadas em
    cache. Isso evita executar novamente `pnpm install`, a menos que lockfiles
    mudem:

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
    A imagem padrão prioriza segurança e executa como `node` não root. Para um
    contêiner com mais recursos:

    1. **Persista `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorpore dependências do sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incorpore dependências do Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incorpore o Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Ou instale os navegadores do Playwright em um volume persistido**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persista os downloads do navegador**: use `OPENCLAW_HOME_VOLUME` ou
       `OPENCLAW_EXTRA_MOUNTS`. O OpenClaw detecta automaticamente o Chromium
       gerenciado pelo Playwright da imagem Docker no Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sem interface gráfica)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abrirá uma URL no navegador. Em
    Docker ou configurações sem interface gráfica, copie a URL de redirecionamento completa em que você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem principal de runtime do Docker usa `node:24-bookworm-slim` e inclui `tini` como o processo init de ponto de entrada (PID 1) para garantir que processos zumbis sejam coletados e sinais sejam tratados corretamente em contêineres de longa duração. Ela publica anotações OCI da imagem base, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs de imagem base Docker do Dependabot; builds de lançamento não executam
    uma camada de atualização da distribuição. Consulte
    [anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em uma VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo incorporação de binários, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está habilitado com o backend Docker, o Gateway
executa ferramentas de agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker
isolados enquanto o próprio Gateway permanece no host. Isso cria uma barreira rígida
ao redor de sessões de agente não confiáveis ou multi-tenant sem conteinerizar todo o
Gateway.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres de
navegador.

Para configuração completa, imagens, notas de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo ao shell em contêineres de sandbox
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
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Crie a imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou o comando `docker build` inline de [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação npm),
    ou defina `agents.defaults.sandbox.docker.image` como sua imagem personalizada.
    Contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do workspace montado,
    ou altere o proprietário da pasta do workspace com chown.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante o build da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento necessário na Control UI">
    Obtenha um novo link do painel e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Painel](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou erros de pareamento pela CLI Docker">
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
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária com Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
