---
read_when:
    - Você quer um Gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração opcionais baseadas em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:51:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o apenas se você quiser um Gateway em contêiner ou validar o fluxo do Docker.

## Docker é adequado para mim?

- **Sim**: você quer um ambiente de Gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e só quer o ciclo de desenvolvimento mais rápido. Use o fluxo de instalação normal.
- **Observação sobre sandbox**: o backend de sandbox padrão usa Docker quando o sandbox está habilitado, mas o sandbox vem desativado por padrão e **não** exige que todo o Gateway seja executado no Docker. Backends de sandbox SSH e OpenShell também estão disponíveis. Consulte [Sandbox](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para a criação da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB e saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Endurecimento de segurança para exposição à rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway em contêiner

<Steps>
  <Step title="Build the image">
    Na raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso cria a imagem do Gateway localmente. Para usar uma imagem pré-criada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    As imagens pré-criadas são publicadas primeiro no
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    O GHCR é o registro principal para automação de releases, implantações fixadas
    e verificações de proveniência. O mesmo fluxo de release também publica um espelho
    oficial no Docker Hub em `openclaw/openclaw` para hosts que preferem o Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Use `ghcr.io/openclaw/openclaw` ou `openclaw/openclaw`. Evite espelhos da comunidade
    no Docker Hub porque o OpenClaw não controla o cronograma de release,
    recriações nem política de retenção deles. Tags oficiais comuns: `main`, `latest`,
    `<version>` (por exemplo, `2026.2.26`) e versões beta como
    `2026.2.26-beta.1`. Tags beta não movem `latest` nem `main`.

  </Step>

  <Step title="Airgapped rerun">
    Em hosts offline, transfira e carregue a imagem primeiro:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` já existe localmente, desativa
    pulls e builds implícitos do Compose e então executa o fluxo normal de configuração, como
    sincronização de `.env`, correções de permissões, onboarding, sincronização da configuração do Gateway
    e inicialização do Compose.

    Se `OPENCLAW_SANDBOX=1`, a configuração offline também verifica as imagens de sandbox padrão configuradas
    e as imagens de sandbox ativas por agente no daemon por trás de
    `OPENCLAW_DOCKER_SOCKET`. Imagens de navegador com backend Docker também devem carregar o
    rótulo atual de contrato de navegador do OpenClaw. Quando uma imagem obrigatória está ausente ou
    incompatível, a configuração sai sem alterar a configuração de sandbox, em vez de
    relatar sucesso com um sandbox inutilizável.

  </Step>

  <Step title="Complete onboarding">
    O script de configuração executa o onboarding automaticamente. Ele irá:

    - solicitar chaves de API do provedor
    - gerar um token do Gateway e gravá-lo em `.env`
    - criar o diretório de chave secreta do perfil de autenticação
    - iniciar o Gateway via Docker Compose

    Durante a configuração, o onboarding antes da inicialização e as gravações de configuração passam
    diretamente por `openclaw-gateway`. `openclaw-cli` é para comandos que você executa depois
    que o contêiner do Gateway já existe.

  </Step>

  <Step title="Open the Control UI">
    Abra `http://127.0.0.1:18789/` no navegador e cole o segredo compartilhado
    configurado em Settings. O script de configuração grava um token em `.env` por
    padrão; se você trocar a configuração do contêiner para autenticação por senha, use essa
    senha.

    Precisa da URL de novo?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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
Execute `docker compose` a partir da raiz do repositório. Se você habilitou `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`;
inclua-o após qualquer arquivo de substituição padrão, por exemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quando ambos os arquivos de substituição existirem.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede do `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração em tempo de setup por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                        | Finalidade                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Usa uma imagem remota em vez de criar localmente                      |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instala pacotes apt extras durante o build (separados por espaços)    |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instala pacotes Python extras durante o build (separados por espaços) |
| `OPENCLAW_EXTENSIONS`                           | Pré-instala dependências de Plugin no momento do build (nomes separados por espaços) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sobrescreve as opções de Node do build local a partir do código-fonte  |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sobrescreve o heap do tsdown do build local a partir do código-fonte em MB |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Ignora a saída de declarações durante builds locais de imagem apenas de runtime |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montagens bind extras do host (separadas por vírgula: `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                          | Persiste `/home/node` em um volume Docker nomeado                     |
| `OPENCLAW_SANDBOX`                              | Opta pelo bootstrap de sandbox (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                      | Ignora a etapa interativa de onboarding (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                        | Sobrescreve o caminho do socket Docker                                |
| `OPENCLAW_DISABLE_BONJOUR`                      | Desativa o anúncio Bonjour/mDNS (padrão é `1` para Docker)            |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Desativa sobreposições bind-mount de código-fonte de Plugins empacotados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartilhado do coletor OTLP/HTTP para exportação OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de sinal para traces, métricas ou logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sobrescrita do protocolo OTLP. Apenas `http/protobuf` é suportado hoje |
| `OTEL_SERVICE_NAME`                             | Nome do serviço usado para recursos do OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Opta pelos atributos semânticos experimentais GenAI mais recentes     |
| `OPENCLAW_OTEL_PRELOADED`                       | Ignora a inicialização de um segundo SDK OpenTelemetry quando um já está pré-carregado |

A imagem Docker oficial não inclui Homebrew. Durante o onboarding, o OpenClaw
oculta instaladores de dependências de Skills exclusivos do brew quando está em execução em um contêiner
Linux sem `brew`; essas dependências devem ser fornecidas por uma imagem personalizada
ou instaladas manualmente. Para dependências disponíveis em pacotes Debian, use
`OPENCLAW_IMAGE_APT_PACKAGES` durante o build da imagem. O nome legado
`OPENCLAW_DOCKER_APT_PACKAGES` ainda é aceito.
Para dependências Python, use `OPENCLAW_IMAGE_PIP_PACKAGES`. Isso executa
`python3 -m pip install --break-system-packages` durante o build da imagem, então fixe
as versões dos pacotes e use apenas índices de pacotes em que você confia.
Builds a partir do código-fonte definem `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` como
`--max-old-space-size=8192` por padrão e deixam
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` indefinido para que o wrapper do tsdown possa
respeitar os limites de memória do contêiner. Eles também definem
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` por padrão porque imagens de runtime removem arquivos
de declaração após o build. Se o Docker relatar `ResourceExhausted`, `cannot allocate
memory` ou abortar durante `tsdown`, aumente o limite de memória do builder Docker ou
tente novamente com heaps explícitos menores, por exemplo
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Mantenedores podem testar o código-fonte de Plugins empacotados contra uma imagem empacotada montando
um diretório de código-fonte de Plugin sobre o caminho do código-fonte empacotado dele, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o bundle compilado correspondente em
`/app/dist/extensions/synology-chat` para o mesmo id de Plugin.

### Observabilidade

A exportação OpenTelemetry sai do contêiner do Gateway para o seu coletor OTLP.
Ela não exige uma porta Docker publicada. Se você criar a imagem
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
Plugin `diagnostics-prometheus` e então colete:

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
os sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot autenticado de integridade profunda:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` define por padrão `OPENCLAW_GATEWAY_BIND=lan` para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de portas do Docker.

- `lan` (padrão): o navegador do host e a CLI do host conseguem acessar a porta publicada do gateway.
- `loopback`: somente processos dentro do namespace de rede do contêiner conseguem acessar
  o gateway diretamente.

<Note>
Use valores de modo de vinculação em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais do host

Quando o OpenClaw roda no Docker, `127.0.0.1` dentro do contêiner é o próprio
contêiner, não sua máquina host. Use `host.docker.internal` para provedores de IA que
rodam no host:

| Provedor  | URL padrão do host       | URL de configuração do Docker       |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

A configuração Docker incluída usa essas URLs de host como os padrões de onboarding do
LM Studio e Ollama, e `docker-compose.yml` mapeia `host.docker.internal` para
o gateway do host do Docker para o Docker Engine no Linux. O Docker Desktop já fornece
o mesmo nome de host no macOS e Windows.

Os serviços do host também precisam escutar em um endereço acessível pelo Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o mesmo
mapeamento de host por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI no Docker

A imagem Docker oficial do OpenClaw não pré-instala o Claude Code. Instale e
faça login no Claude Code dentro do usuário do contêiner que executa o OpenClaw, depois persista
esse home do contêiner para que upgrades de imagem não apaguem o binário ou o estado de autenticação
do Claude.

Para novas instalações Docker, habilite um volume persistente em `/home/node` antes de executar
a configuração:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para uma instalação Docker existente, pare a stack primeiro e recarregue os valores atuais do
Docker `.env` antes de executar novamente a configuração. O script de configuração não lê
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
primeiro os valores existentes dos quais você depende, como `OPENCLAW_IMAGE`, portas, modo de vinculação,
caminhos personalizados, `OPENCLAW_EXTRA_MOUNTS`, sandbox e configurações de pular onboarding.
O overlay gerado monta o volume home para `openclaw-gateway` e
`openclaw-cli`.

Execute os comandos restantes com o overlay Compose gerado para que ambos os serviços
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

Faça login e verifique de dentro do mesmo home de contêiner persistido:

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
`/home/node/.local/bin` e `/home/node/.local/share/claude`, além das configurações e do estado de autenticação
do Claude Code em `/home/node/.claude` e `/home/node/.claude.json`.
Persistir apenas `/home/node/.openclaw` não é suficiente para reutilizar o Claude CLI. Se
você usar `OPENCLAW_EXTRA_MOUNTS` em vez de um volume home, monte todos esses
caminhos do Claude em ambos os serviços Docker.

<Note>
Para automação de produção compartilhada ou cobrança previsível da Anthropic, prefira o
caminho de chave de API da Anthropic. A reutilização do Claude CLI segue o comportamento de
versão instalada, login da conta, cobrança e atualização do Claude Code.
</Note>

### Bonjour / mDNS

Redes bridge do Docker geralmente não encaminham multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Portanto, a configuração Compose incluída define por padrão
`OPENCLAW_DISABLE_BONJOUR=1` para que o Gateway não entre em crash-loop nem reinicie repetidamente
a publicidade quando a bridge descartar o tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede do host, macvlan
ou outra rede em que se sabe que o multicast mDNS funciona.

Para pegadinhas e solução de problemas, consulte [descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose monta por bind `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace` e
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` em `/home/node/.config/openclaw`, para que esses
caminhos sobrevivam à substituição do contêiner. Quando qualquer variável não estiver definida, o
`docker-compose.yml` incluído recua para `${HOME}`, ou `/tmp` quando o próprio `HOME`
também estiver ausente. Isso impede que `docker compose up` emita uma especificação de volume
com origem vazia em ambientes básicos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedor armazenada
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

O diretório de chave secreta do perfil de autenticação armazena a chave de criptografia local usada para
material de token de perfil de autenticação baseado em OAuth. Mantenha-o com o estado do seu host Docker,
mas separado de `OPENCLAW_CONFIG_DIR`.

Plugins instalados por download armazenam seu estado de pacote no home montado do
OpenClaw, então registros de instalação de plugins e raízes de pacotes sobrevivem à substituição do
contêiner. A inicialização do Gateway não gera árvores de dependência de plugins incluídos.

Para detalhes completos de persistência em implantações de VM, consulte
[Runtime de VM Docker - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão, o banco de dados de estado
SQLite compartilhado, raízes de pacotes de plugins instalados e logs de arquivo rotativos
em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento cotidiano do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho bruto mais antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe a nova localização.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo do auxiliar.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para o gateway Docker">
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
    para `off`. Turnos do modo de código Codex ainda ficam restritos ao
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
    possam acessar o gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A configuração compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` em `openclaw-gateway` e `openclaw-cli`.
  </Accordion>

  <Accordion title="Falhas de DNS do Docker Desktop no openclaw-cli">
    Algumas configurações do Docker Desktop falham em consultas DNS a partir do sidecar
    `openclaw-cli` de rede compartilhada depois que `NET_RAW` é removido, o que aparece como
    `EAI_AGAIN` durante comandos baseados em npm, como `openclaw plugins install`.
    Mantenha o arquivo compose endurecido padrão para a operação normal do gateway. O
    override local abaixo afrouxa a postura de segurança do contêiner CLI ao
    restaurar os capabilities padrão do Docker, então use-o apenas para o comando CLI pontual
    que precisa de acesso ao registro de pacotes, não como sua invocação Compose
    padrão:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se você já criou um contêiner `openclaw-cli` de longa duração, recrie-o
    com o mesmo override. `docker compose exec` e `docker exec` não conseguem
    alterar capabilities do Linux em um contêiner já criado.

  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem roda como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, certifique-se de que seus bind mounts do host sejam propriedade do uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    A mesma incompatibilidade pode aparecer como um aviso de plugin, como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguido de `plugin present but blocked`. Isso significa que o uid do processo e o
    proprietário do diretório de plugin montado discordam. Prefira executar o contêiner como o
    uid 1000 padrão e corrigir a propriedade do bind mount. Use chown somente em
    `/path/to/openclaw-config/npm` para `root:root` se você executar intencionalmente o
    OpenClaw como root no longo prazo.

  </Accordion>

  <Accordion title="Rebuilds mais rápidos">
    Ordene seu Dockerfile para que as camadas de dependências sejam armazenadas em cache. Isso evita reexecutar
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
    A imagem padrão prioriza a segurança e roda como `node` sem privilégios de root. Para um contêiner
    com mais recursos:

    1. **Persista `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Inclua dependências do sistema na imagem**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Inclua dependências Python na imagem**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Inclua o Playwright Chromium na imagem**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Ou instale navegadores do Playwright em um volume persistido**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persista downloads do navegador**: use `OPENCLAW_HOME_VOLUME` ou
       `OPENCLAW_EXTRA_MOUNTS`. O OpenClaw detecta automaticamente o Chromium gerenciado pelo Playwright
       da imagem Docker no Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sem interface gráfica)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abrirá uma URL no navegador. Em
    Docker ou configurações sem interface gráfica, copie a URL completa de redirecionamento em que você cair e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem principal de runtime do Docker usa `node:24-bookworm-slim` e inclui `tini` como processo init de entrypoint (PID 1) para garantir que processos zumbis sejam coletados e sinais sejam tratados corretamente em contêineres de longa duração. Ela publica anotações OCI de imagem base, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs do Dependabot para imagem base Docker; builds de release não executam
    uma camada de upgrade da distro. Consulte
    [anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Rodando em um VPS?

Consulte [Hetzner (Docker VPS)](/pt-BR/install/hetzner) e
[Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo inclusão de binários na imagem, persistência e atualizações.

## Sandbox de agente

Quando `agents.defaults.sandbox` está habilitado com o backend Docker, o Gateway
executa ferramentas de agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker
isolados, enquanto o próprio Gateway permanece no host. Isso cria uma barreira rígida
em torno de sessões de agente não confiáveis ou multi-tenant sem conteinerizar todo o
Gateway.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/negação de ferramentas, isolamento de rede, limites de recursos e contêineres
de navegador.

Para configuração completa, imagens, observações de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso a shell interativo em contêineres sandbox
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

Crie a imagem padrão de sandbox (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh
```

Para instalações via npm sem um checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` inline.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Crie a imagem de sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou o comando `docker build` inline em [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação via npm),
    ou defina `agents.defaults.sandbox.docker.image` como sua imagem personalizada.
    Os contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do seu workspace montado,
    ou execute chown na pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que lê
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante a criação da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento necessário na Control UI">
    Busque um novo link do painel e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou erros de pareamento da Docker CLI">
    Redefina o modo e a vinculação do gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa Podman ao Docker
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária com Docker Compose
- [Atualização](/pt-BR/install/updating) — como manter o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
