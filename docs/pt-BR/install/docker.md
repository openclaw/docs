---
read_when:
    - Você quer um Gateway em contêiner em vez de instalações locais
    - Você está validando o fluxo do Docker
summary: Configuração e integração opcionais do OpenClaw com base em Docker
title: Docker
x-i18n:
    generated_at: "2026-07-12T15:20:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker é **opcional**. Use-o para um ambiente de Gateway isolado e descartável ou em um host sem instalações locais. Se você já desenvolve em sua própria máquina, use o fluxo de instalação normal.

O backend de sandbox padrão usa Docker quando `agents.defaults.sandbox` está habilitado, mas o sandboxing vem desativado por padrão e não exige que o próprio Gateway seja executado no Docker. Os backends de sandbox SSH e OpenShell também estão disponíveis; consulte [Sandboxing](/pt-BR/gateway/sandboxing).

Hospeda vários usuários? Consulte [Hospedagem multilocatário](/pt-BR/gateway/multi-tenant-hosting) para conhecer o modelo de uma célula por locatário.

## Pré-requisitos

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Pelo menos 2 GB de RAM para compilar a imagem (`pnpm install` pode ser encerrado por OOM em hosts com 1 GB, com código de saída 137)
- Espaço em disco suficiente para imagens e logs
- Em um VPS/host público, consulte [Reforço de segurança para exposição de rede](/pt-BR/gateway/security), especialmente a cadeia de firewall `DOCKER-USER` do Docker

## Gateway em contêiner

<Steps>
  <Step title="Compile a imagem">
    Na raiz do repositório:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Isso compila localmente a imagem do Gateway como `openclaw:local`. Para usar uma imagem pré-compilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    As imagens pré-compiladas são publicadas primeiro no [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). O GHCR é o registro principal para automação de lançamentos, implantações com versão fixada e verificações de proveniência. O mesmo lançamento publica um espelho no Docker Hub em `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Use `ghcr.io/openclaw/openclaw` ou `openclaw/openclaw` e evite espelhos não oficiais, que não compartilham o cronograma de lançamentos nem a política de retenção do OpenClaw. Tags oficiais: `main`, `latest`, `<version>` (por exemplo, `2026.2.26`) e tags beta como `2026.2.26-beta.1` (versões beta nunca alteram `latest`/`main`). A imagem padrão `main`/`latest`/`<version>` inclui os plugins `codex` e `diagnostics-otel`. Uma variante `-browser` (por exemplo, `latest-browser`) também é distribuída com o Chromium integrado, sendo útil para a ferramenta de [navegador em sandbox](/pt-BR/gateway/sandboxing#sandboxed-browser) sem uma instalação do Playwright na primeira execução.

  </Step>

  <Step title="Execute novamente em ambiente isolado da rede">
    Em hosts offline, primeiro transfira e carregue a imagem:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica se `OPENCLAW_IMAGE` já existe localmente, desabilita pulls/compilações implícitos do Compose e, em seguida, executa o fluxo normal: sincronização do `.env`, correções de permissões, integração inicial, sincronização da configuração do Gateway e inicialização do Compose.

    Se `OPENCLAW_SANDBOX=1`, a configuração offline também verifica as imagens de sandbox padrão configuradas e as específicas de cada agente no daemon associado a `OPENCLAW_DOCKER_SOCKET`, incluindo o rótulo do contrato de navegador nas imagens de navegador baseadas em Docker. Se uma imagem obrigatória estiver ausente ou desatualizada, a configuração será encerrada sem alterar a configuração do sandbox, em vez de informar um sucesso incorreto.

  </Step>

  <Step title="Conclua a integração inicial">
    O script de configuração executa automaticamente a integração inicial:

    - solicita as chaves de API do provedor
    - gera um token do Gateway e o grava em `.env`
    - cria o diretório da chave secreta do perfil de autenticação
    - inicia o Gateway por meio do Docker Compose

    A integração inicial e as gravações de configuração anteriores à inicialização são executadas diretamente por meio de `openclaw-gateway` (com `--no-deps --entrypoint node`), pois `openclaw-cli` compartilha o namespace de rede do Gateway e só funciona depois que o contêiner do Gateway existe.

  </Step>

  <Step title="Abra a interface de controle">
    Abra `http://127.0.0.1:18789/` e cole em Settings o token gravado em `.env`. Se você alterou o contêiner para autenticação por senha, use essa senha.

    Precisa da URL novamente?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure os canais (opcional)">
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

O contexto do Docker exclui `.git`. Passe a identidade do código-fonte como argumentos de compilação,
conforme mostrado acima, para que a tela Sobre da imagem informe o commit obtido no checkout e
um carimbo de data e hora da compilação. `scripts/docker/setup.sh` resolve e transmite os dois valores
automaticamente.

<Note>
Execute `docker compose` na raiz do repositório. Se você habilitou `OPENCLAW_EXTRA_MOUNTS` ou `OPENCLAW_HOME_VOLUME`, o script de configuração grava `docker-compose.extra.yml`; inclua-o depois de qualquer `docker-compose.override.yml` mantido por você, por exemplo, `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Atualização de imagens de contêiner

Quando você substitui a imagem do OpenClaw, mas mantém o mesmo estado/configuração montado, o
novo Gateway executa migrações de atualização seguras para a inicialização e a convergência de plugins antes
de ficar pronto. Atualizações rotineiras da imagem não devem exigir uma execução separada de
`openclaw doctor --fix`.

Se a inicialização não conseguir concluir esses reparos com segurança, o Gateway será encerrado em vez de
ser informado como íntegro. Com uma política de reinicialização, Docker, Podman ou Kubernetes podem mostrar
o contêiner do Gateway sendo reiniciado. Mantenha o volume de estado montado e, em seguida, execute a
mesma imagem uma vez com `openclaw doctor --fix` como comando do contêiner, usando as
mesmas montagens de estado/configuração utilizadas pelo Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Depois que o doctor terminar, reinicie o contêiner do Gateway com seu comando padrão.
No Kubernetes, execute o mesmo comando em um Job avulso ou pod de depuração montado no
mesmo PVC e, em seguida, reinicie o Deployment ou StatefulSet.

### Variáveis de ambiente

Variáveis opcionais aceitas por `scripts/docker/setup.sh` (e, para o contêiner do Gateway, diretamente por `docker-compose.yml`):

| Variável                                        | Finalidade                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Usar uma imagem remota em vez de compilá-la localmente                                                                             |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalar pacotes apt adicionais durante a compilação (separados por espaços). Alias legado: `OPENCLAW_DOCKER_APT_PACKAGES`         |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalar pacotes Python adicionais durante a compilação (separados por espaços)                                                    |
| `OPENCLAW_EXTENSIONS`                           | Compilar/empacotar os plugins compatíveis selecionados e instalar suas dependências de runtime (IDs separados por vírgulas ou espaços) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Substituir as opções do Node para compilação local a partir do código-fonte (padrão `--max-old-space-size=8192`)                    |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Substituir o heap do tsdown, em MB, para compilação local a partir do código-fonte                                                  |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Ignorar a saída de declarações durante compilações locais de imagens somente para runtime (padrão `1`)                              |
| `OPENCLAW_INSTALL_BROWSER`                      | Integrar Chromium + Xvfb à imagem durante a compilação                                                                             |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montagens bind adicionais do host (valores `source:target[:opts]` separados por vírgulas)                                          |
| `OPENCLAW_HOME_VOLUME`                          | Persistir `/home/node` em um volume Docker nomeado                                                                                 |
| `OPENCLAW_SANDBOX`                              | Habilitar explicitamente a inicialização do sandbox (`1`, `true`, `yes`, `on`)                                                     |
| `OPENCLAW_SKIP_ONBOARDING`                      | Ignorar a etapa interativa de integração inicial (`1`, `true`, `yes`, `on`)                                                        |
| `OPENCLAW_DOCKER_SOCKET`                        | Substituir o caminho do socket do Docker                                                                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forçar a divulgação via Bonjour/mDNS como ativada (`0`) ou desativada (`1`); consulte [Bonjour/mDNS](#bonjour--mdns)                |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Desabilitar as sobreposições de montagem bind do código-fonte dos plugins incluídos                                                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartilhado do coletor OTLP/HTTP para exportação do OpenTelemetry                                                       |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de sinal para rastreamentos, métricas ou logs                                                           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Substituição do protocolo OTLP. Atualmente, somente `http/protobuf` é compatível                                                    |
| `OTEL_SERVICE_NAME`                             | Nome do serviço usado para recursos do OpenTelemetry                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Habilitar explicitamente os atributos semânticos experimentais mais recentes de GenAI                                              |
| `OPENCLAW_OTEL_PRELOADED`                       | Não iniciar um segundo SDK do OpenTelemetry quando um já estiver pré-carregado                                                      |

A imagem oficial não inclui Homebrew. Durante a integração inicial, o OpenClaw oculta instaladores de dependências de Skills exclusivos do brew em um contêiner Linux sem `brew`; forneça essas dependências por meio de uma imagem personalizada ou instale-as manualmente. Use `OPENCLAW_IMAGE_APT_PACKAGES` para dependências empacotadas para Debian e `OPENCLAW_IMAGE_PIP_PACKAGES` para dependências Python (executa `python3 -m pip install --break-system-packages` durante a compilação; portanto, fixe as versões e use somente índices nos quais você confia).

Se o Docker informar `ResourceExhausted`, `cannot allocate memory` ou for interrompido durante `tsdown`, aumente o limite de memória do compilador do Docker ou tente novamente com heaps explícitos menores:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Imagens compiladas a partir do código-fonte com plugins selecionados

`OPENCLAW_EXTENSIONS` seleciona ids de manifestos de plugins no checkout do código-fonte;
nomes de diretórios de origem existentes também são aceitos quando são diferentes. A
compilação do Docker resolve a seleção para diretórios de origem uma única vez, instala
dependências de produção e, quando um plugin selecionado é publicado separadamente com
`openclaw.build.bundledDist: false`, compila seu runtime na distribuição agrupada
raiz. Esse empacotamento exclusivo do Docker não altera o contrato do artefato npm ou
ClawHub do plugin. IDs desconhecidos, inválidos ou ambíguos fazem a compilação da imagem
falhar. IDs conhecidos somente de dependência/código-fonte mantêm seu preparo existente
de código-fonte e dependências sem ganhar uma entrada compilada na distribuição raiz.
Um plugin selecionado com entradas de compilação unificadas deve ser compilado com
sucesso; o código-fonte e a saída de runtime de plugins externos não selecionados são
removidos.

Por exemplo, estes comandos compilam imagens de Gateway autônomas, separadas e
multiarquitetura da FakeCo para ClickClack, Slack e Microsoft Teams. O ClawRouter já faz
parte do runtime raiz do OpenClaw, portanto a imagem do ClickClack seleciona somente
`clickclack`. O argumento de navegador explicitamente vazio mantém a imagem padrão sem
Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Use `--platform linux/arm64 --load` ou `--platform linux/amd64 --load` para uma
única compilação local nativa. A saída multiplataforma e o SBOM/proveniência anexados
exigem um registro ou outra saída do Buildx que preserve atestações. Após o envio,
inspecione o manifesto e implante o digest imutável em vez da tag mutável do SHA do
código-fonte:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Implantar: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Essas imagens destinam-se a gateways autônomos baseados em OCI e usuários genéricos do
Docker. Gateways gerenciados pelo Crabhelm não as consomem: esse caminho de entrega
compila um arquivo de appliance x86_64 separado contendo um tarball npm do OpenClaw e
fixa os digests do Node, do arquivo e do manifesto. Compile esse appliance
independentemente a partir do mesmo código-fonte integrado do OpenClaw.

Para testar o código-fonte de um plugin agrupado em uma imagem empacotada, monte um diretório de código-fonte do plugin sobre seu caminho de código-fonte empacotado, por exemplo, `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Isso substitui o pacote compilado correspondente em `/app/dist/extensions/synology-chat` para o mesmo id de plugin.

### Observabilidade

A exportação do OpenTelemetry é feita de saída do contêiner do Gateway para seu coletor OTLP; ela não precisa de uma porta Docker publicada. Para incluir o exportador agrupado em uma imagem compilada localmente:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

As imagens oficiais pré-compiladas já incluem `diagnostics-otel`; instale `clawhub:@openclaw/diagnostics-otel` por conta própria somente se você o tiver removido. Para habilitar a exportação, permita e habilite o plugin `diagnostics-otel` na configuração e defina `diagnostics.otel.enabled=true` (consulte o exemplo completo em [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry)). Os cabeçalhos de autenticação do coletor são configurados por meio de `diagnostics.otel.headers`, não por variáveis de ambiente do Docker.

As métricas do Prometheus reutilizam a porta do Gateway já publicada. Instale `clawhub:@openclaw/diagnostics-prometheus`, habilite o plugin `diagnostics-prometheus` e faça a coleta em:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

A rota é protegida pela autenticação do Gateway; não exponha uma porta pública `/metrics` separada nem um caminho de proxy reverso sem autenticação. Consulte [Métricas do Prometheus](/pt-BR/gateway/prometheus).

### Verificações de integridade

Endpoints de sondagem do contêiner (sem exigência de autenticação):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # atividade
curl -fsS http://127.0.0.1:18789/readyz     # prontidão
```

O `HEALTHCHECK` integrado da imagem consulta `/healthz`; falhas repetidas marcam o contêiner como `unhealthy` para que os orquestradores possam reiniciá-lo ou substituí-lo.

Instantâneo detalhado e autenticado da integridade:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN versus loopback

Por padrão, `scripts/docker/setup.sh` define `OPENCLAW_GATEWAY_BIND=lan` para que `http://127.0.0.1:18789` no host funcione com a publicação de portas do Docker.

- `lan` (padrão): o navegador e a CLI do host podem acessar a porta publicada do Gateway.
- `loopback`: somente processos dentro do namespace de rede do contêiner podem acessar o Gateway diretamente.

<Note>
Use valores de modo de vinculação em `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), não aliases de host como `0.0.0.0` ou `127.0.0.1`.
</Note>

### Provedores locais do host

Dentro do contêiner, `127.0.0.1` é o próprio contêiner, não o host. Use `host.docker.internal` para provedores em execução no host:

| Provedor  | URL padrão do host       | URL de configuração do Docker       |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

A configuração agrupada usa essas URLs como padrões de integração inicial do LM Studio/Ollama, e `docker-compose.yml` mapeia `host.docker.internal` para o Gateway do host no Docker Engine para Linux (o Docker Desktop fornece o mesmo alias no macOS/Windows). Os serviços do host devem escutar em um endereço que o Docker consiga acessar:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Está usando seu próprio arquivo do Compose ou `docker run`? Adicione o mesmo mapeamento por conta própria, por exemplo, `--add-host=host.docker.internal:host-gateway`.

### Backend da CLI do Claude no Docker

A imagem oficial não pré-instala o Claude Code. Instale-o e faça login dentro do usuário `node` do contêiner e, em seguida, persista o diretório pessoal desse contêiner para que atualizações da imagem não apaguem o binário nem o estado de autenticação.

Para uma nova instalação, habilite um volume persistente em `/home/node` antes de executar a configuração:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para uma instalação existente, interrompa a pilha e recarregue primeiro os valores atuais de `.env` — o script de configuração sempre reescreve `.env` usando o shell e os padrões atuais; ele não lê o arquivo por conta própria:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se `.env` contiver valores que seu shell não consegue carregar, reexporte primeiro e manualmente aquilo de que você depende (`OPENCLAW_IMAGE`, portas, modo de vinculação, caminhos personalizados, `OPENCLAW_EXTRA_MOUNTS`, sandbox, ignorar integração inicial). A sobreposição gerada monta o volume do diretório pessoal para `openclaw-gateway` e `openclaw-cli`; execute os comandos restantes com essa sobreposição (e `docker-compose.override.yml` primeiro, caso você use um):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

O instalador nativo grava `claude` em `/home/node/.local/bin/claude`. Direcione o OpenClaw para esse caminho:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Faça login e verifique usando o mesmo diretório pessoal persistido:

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

Em seguida, use o backend `claude-cli` agrupado:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Diga olá a partir da CLI do Claude no Docker"
```

`OPENCLAW_HOME_VOLUME` persiste a instalação nativa em `/home/node/.local/bin` e `/home/node/.local/share/claude`, além das configurações/autenticação do Claude Code em `/home/node/.claude` e `/home/node/.claude.json`. Persistir somente `/home/node/.openclaw` não é suficiente; se você usar `OPENCLAW_EXTRA_MOUNTS` em vez de um volume de diretório pessoal, monte todos esses caminhos do Claude nos dois serviços.

<Note>
Para automação compartilhada em produção ou faturamento previsível da Anthropic, prefira o caminho de chave de API da Anthropic. A reutilização da CLI do Claude segue a versão instalada, o login da conta, o faturamento e o comportamento de atualização do Claude Code.
</Note>

### Bonjour / mDNS

A rede de ponte do Docker normalmente não encaminha multicast Bonjour/mDNS (`224.0.0.251:5353`) de forma confiável. Quando `OPENCLAW_DISABLE_BONJOUR` não está definido, o plugin Bonjour agrupado desabilita automaticamente a divulgação na LAN assim que detecta que está sendo executado em um contêiner, evitando entrar em um ciclo de falhas ao tentar novamente o multicast descartado pela ponte. Defina `OPENCLAW_DISABLE_BONJOUR=1` para forçar a desativação independentemente da detecção ou `0` para forçar a ativação (somente em rede de host, macvlan ou outra rede na qual se saiba que o multicast mDNS funciona).

Caso contrário, use a URL publicada do Gateway, o Tailscale ou DNS-SD de longa distância para hosts Docker. Consulte [Descoberta Bonjour](/pt-BR/gateway/bonjour) para ver ressalvas e solução de problemas.

### Armazenamento e persistência

O Docker Compose monta por vinculação `OPENCLAW_CONFIG_DIR` em `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` em `/home/node/.openclaw/workspace` e `OPENCLAW_AUTH_PROFILE_SECRET_DIR` em `/home/node/.config/openclaw`, para que esses caminhos sobrevivam à substituição do contêiner. Quando uma variável não está definida, `docker-compose.yml` usa um caminho alternativo em `${HOME}`, ou `/tmp` se o próprio `HOME` estiver ausente, de modo que `docker compose up` nunca emita uma especificação de volume com origem vazia em ambientes básicos.

Esse diretório de configuração montado contém:

- `openclaw.json` para configuração de comportamento
- `agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/chave de API de provedores armazenada
- `.env` para segredos de runtime provenientes do ambiente, como `OPENCLAW_GATEWAY_TOKEN`

O diretório de segredos dos perfis de autenticação armazena a chave de criptografia local para o material de token dos perfis de autenticação baseados em OAuth. Mantenha-o com o estado do host Docker, mas separado de `OPENCLAW_CONFIG_DIR`.

Plugins baixáveis instalados armazenam o estado dos pacotes no diretório pessoal montado do OpenClaw, portanto os registros de instalação e as raízes dos pacotes sobrevivem à substituição do contêiner; a inicialização do Gateway não regenera as árvores de dependências de plugins agrupados.

Para obter detalhes completos sobre persistência de VM, consulte [Runtime de VM do Docker — o que persiste onde](/pt-BR/install/docker-vm-runtime#what-persists-where).

**Pontos críticos de crescimento do disco:** `media/`, bancos de dados SQLite por agente, transcrições JSONL de sessões legadas, banco de dados de estado SQLite compartilhado, raízes de pacotes de plugins instalados e logs rotativos de arquivos em `/tmp/openclaw/`.

### Auxiliares de shell (opcional)

Para comandos cotidianos mais curtos, instale o [ClawDock](/pt-BR/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou pelo caminho antigo `scripts/shell-helpers/clawdock-helpers.sh`, execute novamente o comando acima para que seu auxiliar local acompanhe o local atual. Em seguida, use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` etc. (execute `clawdock-help` para ver a lista completa).

<AccordionGroup>
  <Accordion title="Ativar o sandbox do agente para o Gateway Docker">
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

    O script monta `docker.sock` somente depois que os pré-requisitos do sandbox são atendidos. Se a configuração do sandbox não puder ser concluída, ele redefine `agents.defaults.sandbox.mode` como `off`. O modo de código do Codex fica desativado nas interações em que o sandbox do OpenClaw está ativo (consulte [Sandbox § Backend Docker](/pt-BR/gateway/sandboxing#docker-backend)); nunca monte o socket Docker do host nos contêineres de sandbox dos agentes.

  </Accordion>

  <Accordion title="Automação/CI (não interativa)">
    Desative a alocação de pseudo-TTY do Compose com `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Observação de segurança sobre a rede compartilhada">
    O `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que os comandos da CLI possam acessar o Gateway por `127.0.0.1`. Trate isso como um limite de confiança compartilhado. A configuração do Compose remove `NET_RAW`/`NET_ADMIN` e ativa `no-new-privileges` tanto no `openclaw-gateway` quanto no `openclaw-cli`.
  </Accordion>

  <Accordion title="Falhas de DNS do Docker Desktop no openclaw-cli">
    Algumas configurações do Docker Desktop apresentam falhas nas consultas DNS do contêiner auxiliar `openclaw-cli` de rede compartilhada depois que `NET_RAW` é removido, manifestando-se como `EAI_AGAIN` durante comandos baseados em npm, como `openclaw plugins install`. Mantenha o arquivo padrão reforçado do Compose para a operação normal. A substituição abaixo restaura os recursos padrão somente para o contêiner `openclaw-cli` — use-a para o comando pontual que precisa acessar o registro, não como sua invocação padrão:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se você já criou um contêiner `openclaw-cli` de longa duração, recrie-o com a mesma substituição — `docker compose exec`/`docker exec` não consegue alterar os recursos do Linux em um contêiner já criado.

  </Accordion>

  <Accordion title="Permissões e EACCES">
    A imagem é executada como `node` (uid 1000). Se você encontrar erros de permissão em `/home/node/.openclaw`, verifique se as montagens vinculadas do host pertencem ao uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    A mesma incompatibilidade pode aparecer como `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, seguida por `plugin present but blocked` — o uid do processo e o proprietário do diretório montado do Plugin não correspondem. Prefira executar com o uid padrão 1000 e corrigir a propriedade da montagem vinculada. Altere a propriedade de `/path/to/openclaw-config/npm` para `root:root` somente se você executar intencionalmente o OpenClaw como root no longo prazo.

  </Accordion>

  <Accordion title="Recompilações mais rápidas">
    Organize seu Dockerfile para que as camadas de dependências sejam armazenadas em cache, evitando executar novamente `pnpm install`, a menos que os arquivos de bloqueio sejam alterados:

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
    A imagem padrão prioriza a segurança e é executada como o usuário não root `node`. Para um contêiner com mais recursos:

    1. **Persista `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Inclua dependências do sistema na imagem**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Inclua dependências do Python na imagem**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Inclua o Chromium do Playwright na imagem**: `export OPENCLAW_INSTALL_BROWSER=1` ou use a tag de imagem oficial `-browser`
    5. **Ou instale os navegadores do Playwright em um volume persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persista os downloads do navegador**: use `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`. O OpenClaw detecta automaticamente no Linux o Chromium gerenciado pelo Playwright presente na imagem.

  </Accordion>

  <Accordion title="OAuth do OpenAI Codex (Docker sem interface gráfica)">
    Se você escolher o OAuth do OpenAI Codex no assistente, ele abrirá uma URL no navegador. Em configurações Docker ou sem interface gráfica, copie a URL de redirecionamento completa na qual você chegar e cole-a novamente no assistente para concluir a autenticação.
  </Accordion>

  <Accordion title="Metadados da imagem base">
    A imagem de runtime usa `node:24-bookworm-slim` e executa `tini` como PID 1, para que processos zumbis sejam eliminados e sinais sejam tratados corretamente em contêineres de longa duração. Ela publica anotações OCI da imagem base, incluindo `org.opencontainers.image.base.name` e `org.opencontainers.image.source`. O Dependabot atualiza o digest fixado da imagem base do Node; as compilações de lançamento não executam uma camada separada de atualização da distribuição. Consulte [Anotações de imagem OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Executando em um VPS?

Consulte [Hetzner (VPS Docker)](/pt-BR/install/hetzner) e [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime) para ver as etapas de implantação em VM compartilhada, incluindo a inclusão de binários na imagem, persistência e atualizações.

## Sandbox do agente

Quando `agents.defaults.sandbox` está ativado com o backend Docker, o Gateway executa as ferramentas do agente (shell, leitura/gravação de arquivos etc.) dentro de contêineres Docker isolados, enquanto o próprio Gateway permanece no host — uma barreira rígida em torno de sessões de agente não confiáveis ou multilocatário, sem colocar todo o Gateway em um contêiner.

O escopo do sandbox pode ser por agente (padrão), por sessão ou compartilhado; cada escopo recebe seu próprio espaço de trabalho montado em `/workspace`. Você também pode configurar políticas de permissão/bloqueio de ferramentas, isolamento de rede, limites de recursos e contêineres de navegador.

Para ver a configuração completa, as imagens, as observações de segurança e os perfis de múltiplos agentes:

- [Sandbox](/pt-BR/gateway/sandboxing) -- referência completa do sandbox
- [OpenShell](/pt-BR/gateway/openshell) -- acesso interativo ao shell dos contêineres de sandbox
- [Sandbox e ferramentas para múltiplos agentes](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente

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

Compile a imagem padrão do sandbox (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh
```

Para instalações via npm sem um checkout do código-fonte, consulte [Sandbox § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para obter comandos `docker build` embutidos.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Imagem ausente ou contêiner de sandbox não inicia">
    Compile a imagem do sandbox com [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (checkout do código-fonte) ou com o comando `docker build` embutido de [Sandbox § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) (instalação via npm), ou defina `agents.defaults.sandbox.docker.image` como sua imagem personalizada. Os contêineres são criados automaticamente por sessão, sob demanda.
  </Accordion>

  <Accordion title="Erros de permissão no sandbox">
    Defina `docker.user` como um UID:GID que corresponda à propriedade do espaço de trabalho montado ou altere a propriedade da pasta do espaço de trabalho.
  </Accordion>

  <Accordion title="Ferramentas personalizadas não encontradas no sandbox">
    O OpenClaw executa comandos com `sh -lc` (shell de login), que carrega `/etc/profile` e pode redefinir PATH. Defina `docker.env.PATH` para antepor os caminhos das suas ferramentas personalizadas ou adicione um script em `/etc/profile.d/` no seu Dockerfile.
  </Accordion>

  <Accordion title="Processo encerrado por OOM durante a compilação da imagem (saída 137)">
    A VM precisa de pelo menos 2 GB de RAM. Use uma classe de máquina maior e tente novamente.
  </Accordion>

  <Accordion title="Não autorizado ou pareamento necessário na interface de controle">
    Obtenha um link atualizado do painel e aprove o dispositivo do navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mais detalhes: [Painel](/pt-BR/web/dashboard), [Dispositivos](/pt-BR/cli/devices).

  </Accordion>

  <Accordion title="O destino do Gateway mostra ws://172.x.x.x ou há erros de pareamento na CLI Docker">
    Redefina o modo e a vinculação do Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install) — todos os métodos de instalação
- [Podman](/pt-BR/install/podman) — alternativa ao Docker
- [ClawDock](/pt-BR/install/clawdock) — configuração comunitária do Docker Compose
- [Atualização](/pt-BR/install/updating) — como manter o OpenClaw atualizado
- [Configuração](/pt-BR/gateway/configuration) — configuração do Gateway após a instalação
