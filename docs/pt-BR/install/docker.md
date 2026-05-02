---
read_when:
    - Você quer um Gateway conteinerizado em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração inicial opcionais baseadas em Docker para o OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T05:50:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2647caae7debfe0647842249a3a6000bfa73b191b1aa1d7ced1e9c0eb22228db
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o somente se quiser um Gateway conteinerizado ou validar o fluxo do Docker.

## Docker é adequado para mim?

- **Sim**: você quer um ambiente de Gateway isolado e descartável ou executar o OpenClaw em um host sem instalações locais.
- **Não**: você está executando na sua própria máquina e quer apenas o loop de desenvolvimento mais rápido. Use o fluxo normal de instalação em vez disso.
- **Observação sobre sandboxing**: o backend de sandbox padrão usa Docker quando o sandboxing está habilitado, mas o sandboxing vem desativado por padrão e **não** exige que o Gateway inteiro seja executado no Docker. Backends de sandbox via SSH e OpenShell também estão disponíveis. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para build da imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB com código de saída 137)
- Espaço em disco suficiente para imagens e logs
- Se estiver executando em um VPS/host público, revise
  [Reforço de segurança para exposição à rede](/pt-BR/gateway/security),
  especialmente a política de firewall `DOCKER-USER` do Docker.

## Gateway conteinerizado

<Steps>
  <Step title="Criar a imagem">
    A partir da raiz do repositório, execute o script de configuração:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso cria a imagem do Gateway localmente. Para usar uma imagem pré-criada em vez disso:

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

    - solicitar chaves de API de provedores
    - gerar um token do Gateway e gravá-lo em `.env`
    - iniciar o Gateway via Docker Compose

    Durante a configuração, o onboarding pré-inicialização e as gravações de configuração são executados diretamente por meio de
    `openclaw-gateway`. `openclaw-cli` é para comandos que você executa depois que
    o contêiner do Gateway já existe.

  </Step>

  <Step title="Abrir a Control UI">
    Abra `http://127.0.0.1:18789/` no seu navegador e cole o segredo compartilhado
    configurado em Settings. Por padrão, o script de configuração grava um token em `.env`;
    se você trocar a configuração do contêiner para autenticação por senha, use essa
    senha em vez disso.

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
inclua-o com `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` compartilha o namespace de rede de `openclaw-gateway`, ele é uma
ferramenta pós-inicialização. Antes de `docker compose up -d openclaw-gateway`, execute o onboarding
e as gravações de configuração durante a configuração por meio de `openclaw-gateway` com
`--no-deps --entrypoint node`.
</Note>

### Variáveis de ambiente

O script de configuração aceita estas variáveis de ambiente opcionais:

| Variável                                   | Finalidade                                                      |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar uma imagem remota em vez de criar localmente               |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalar pacotes apt extras durante o build (separados por espaço) |
| `OPENCLAW_EXTENSIONS`                      | Incluir auxiliares de plugins empacotados selecionados no momento do build |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montagens bind extras do host (separadas por vírgula `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` em um volume Docker nomeado              |
| `OPENCLAW_SANDBOX`                         | Optar pelo bootstrap de sandbox (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_SKIP_ONBOARDING`                 | Ignorar a etapa interativa de onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Substituir o caminho do socket do Docker                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | Desativar anúncios Bonjour/mDNS (o padrão é `1` para Docker)    |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Desativar overlays de bind mount de código-fonte de plugins empacotados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartilhado do coletor OTLP/HTTP para exportação OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos por sinal para traces, métricas ou logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Substituição do protocolo OTLP. Apenas `http/protobuf` é compatível hoje |
| `OTEL_SERVICE_NAME`                        | Nome do serviço usado para recursos OpenTelemetry               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar pelos atributos semânticos experimentais mais recentes de GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Ignorar a inicialização de um segundo SDK OpenTelemetry quando um já estiver pré-carregado |

Mantenedores podem testar o código-fonte de plugins empacotados contra uma imagem empacotada montando
um diretório de código-fonte de plugin sobre seu caminho de código-fonte empacotado, por exemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Esse diretório de código-fonte montado substitui o pacote compilado correspondente em
`/app/dist/extensions/synology-chat` para o mesmo id de plugin.

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

A imagem oficial de release Docker do OpenClaw inclui o código-fonte do plugin
`diagnostics-otel` empacotado. Para habilitar a exportação, permita e habilite o
plugin `diagnostics-otel` na configuração, depois defina
`diagnostics.otel.enabled=true` ou use o exemplo de configuração em
[Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry). Cabeçalhos de autenticação do coletor são
configurados por meio de `diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

Métricas Prometheus usam a porta do Gateway já publicada. Habilite o
plugin `diagnostics-prometheus` e então faça scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway. Não exponha uma porta
pública `/metrics` separada nem um caminho de proxy reverso não autenticado. Consulte
[Métricas Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de probe do contêiner (sem autenticação necessária):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

A imagem Docker inclui um `HEALTHCHECK` integrado que consulta `/healthz`.
Se as verificações continuarem falhando, o Docker marca o contêiner como `unhealthy` e
sistemas de orquestração podem reiniciá-lo ou substituí-lo.

Snapshot autenticado de integridade profunda:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` define por padrão `OPENCLAW_GATEWAY_BIND=lan` para que o acesso do host a
`http://127.0.0.1:18789` funcione com a publicação de portas do Docker.

- `lan` (padrão): o navegador do host e a CLI do host conseguem acessar a porta publicada do Gateway.
- `loopback`: apenas processos dentro do namespace de rede do contêiner conseguem acessar
  o Gateway diretamente.

<Note>
Use valores de modo de bind em `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais do host

Quando o OpenClaw é executado no Docker, `127.0.0.1` dentro do contêiner é o próprio
contêiner, não a máquina host. Use `host.docker.internal` para provedores de IA que
rodam no host:

| Provedor  | URL padrão do host       | URL de configuração Docker          |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

A configuração Docker empacotada usa essas URLs do host como padrões de onboarding do LM Studio e Ollama,
e `docker-compose.yml` mapeia `host.docker.internal` para
o Gateway do host do Docker no Linux Docker Engine. O Docker Desktop já fornece
o mesmo hostname no macOS e Windows.

Serviços do host também devem escutar em um endereço acessível a partir do Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se você usar seu próprio arquivo Compose ou comando `docker run`, adicione o mesmo mapeamento de host
por conta própria, por exemplo
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

A rede bridge do Docker geralmente não encaminha multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma confiável. Portanto, a configuração Compose empacotada define por padrão
`OPENCLAW_DISABLE_BONJOUR=1` para que o Gateway não entre em loop de falhas nem reinicie
repetidamente os anúncios quando a bridge descartar tráfego multicast.

Use a URL publicada do Gateway, Tailscale ou DNS-SD de área ampla para hosts Docker.
Defina `OPENCLAW_DISABLE_BONJOUR=0` somente ao executar com rede do host, macvlan
ou outra rede em que se sabe que multicast mDNS funciona.

Para pegadinhas e solução de problemas, consulte [Descoberta Bonjour](/pt-BR/gateway/bonjour).

### Armazenamento e persistência

O Docker Compose faz bind mount de `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace`, então esses caminhos
sobrevivem à substituição do contêiner. Quando qualquer uma das variáveis não está definida, o
`docker-compose.yml` empacotado volta para `${HOME}/.openclaw` (e
`${HOME}/.openclaw/workspace` para a montagem do workspace), ou `/tmp/.openclaw`
quando o próprio `HOME` também está ausente. Isso evita que `docker compose up`
emita uma especificação de volume com origem vazia em ambientes básicos.

Esse diretório de configuração montado é onde o OpenClaw mantém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API armazenada de provedores
- `.env` para segredos de runtime baseados em env, como `OPENCLAW_GATEWAY_TOKEN`

Plugins baixáveis instalados armazenam seu estado de pacote sob o home do
OpenClaw montado, então registros de instalação de plugins e raízes de pacote sobrevivem à
substituição do contêiner. A inicialização do Gateway não gera árvores de dependências de plugins empacotados.

Para detalhes completos de persistência em implantações de VM, consulte
[Docker VM Runtime - O que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos de crescimento de disco:** monitore `media/`, arquivos JSONL de sessão,
`cron/runs/*.jsonl`, raízes de pacote de plugins instalados e logs rotativos em arquivo
sob `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para facilitar o gerenciamento diário do Docker, instale `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock a partir do caminho bruto antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando de instalação acima para que seu arquivo auxiliar local acompanhe o novo local.

Depois use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. Execute
`clawdock-help` para ver todos os comandos.
Consulte [ClawDock](/pt-BR/install/clawdock) para o guia completo do auxiliar.

<AccordionGroup>
  <Accordion title="Habilitar sandbox do agente para o Gateway Docker">
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que os comandos da CLI
    possam acessar o Gateway por `127.0.0.1`. Trate isso como um limite de confiança
    compartilhado. A configuração do Compose remove `NET_RAW`/`NET_ADMIN` e habilita
    `no-new-privileges` em `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem executa como `node` (uid 1000). Se você vir erros de permissão em
    `/home/node/.openclaw`, garanta que os bind mounts do host pertençam ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Recompilações mais rápidas">
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
    A imagem padrão prioriza segurança e executa como `node` sem root. Para um contêiner com
    mais recursos:

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

  <Accordion title="OpenAI Codex OAuth (Docker sem interface gráfica)">
    Se você escolher OpenAI Codex OAuth no assistente, ele abre uma URL no navegador. Em
    configurações Docker ou sem interface gráfica, copie a URL completa de redirecionamento em que você chegar e cole-a
    de volta no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem principal de runtime do Docker usa `node:24-bookworm-slim` e publica anotações OCI
    de imagem base, incluindo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e outras. O digest base do Node é
    atualizado por meio de PRs de imagem base Docker do Dependabot; as compilações de release não executam
    uma camada de upgrade da distribuição. Consulte
    [anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em uma VPS?

Consulte [Hetzner (VPS Docker)](/pt-BR/install/hetzner) e
[Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para etapas de implantação em VM compartilhada,
incluindo incorporação de binários, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está habilitado com o backend Docker, o Gateway
executa ferramentas de agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker
isolados, enquanto o próprio Gateway permanece no host. Isso fornece uma barreira rígida
em torno de sessões de agente não confiáveis ou multilocatário sem colocar todo o
Gateway em contêiner.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado. Cada escopo
recebe seu próprio workspace montado em `/workspace`. Você também pode configurar
políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres de
navegador.

Para a configuração completa, imagens, notas de segurança e perfis multiagente, consulte:

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo ao shell para contêineres do sandbox
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
  <Accordion title="Imagem ausente ou contêiner do sandbox não inicia">
    Crie a imagem do sandbox com
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout do código-fonte) ou com o comando `docker build` inline de [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação npm),
    ou defina `agents.defaults.sandbox.docker.image` para sua imagem personalizada.
    Os contêineres são criados automaticamente por sessão sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda ao proprietário do workspace montado,
    ou aplique chown à pasta do workspace.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega
    `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para prefixar seus
    caminhos de ferramentas personalizadas, ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Encerrado por OOM durante a criação da imagem (código de saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou emparelhamento exigido na Control UI">
    Busque um novo link do painel e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Dashboard](/pt-BR/web/dashboard), [Devices](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou erros de emparelhamento a partir da CLI Docker">
    Redefina o modo e o bind do Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa Podman ao Docker
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária do Docker Compose
- [Atualização](/pt-BR/install/updating) — mantendo o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
