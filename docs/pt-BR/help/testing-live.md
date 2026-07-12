---
read_when:
    - Executando testes de fumaça com matriz de modelos ao vivo / backend da CLI / ACP / provedor de mídia
    - Depuração da resolução de credenciais de testes em ambiente real
    - Adicionando um novo teste em tempo real específico do provedor
sidebarTitle: Live tests
summary: 'Testes em ambiente real (com acesso à rede): matriz de modelos, backends da CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes em ambiente real'
x-i18n:
    generated_at: "2026-07-12T00:02:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Para início rápido, executores de QA, suítes unitárias/de integração e fluxos do Docker, consulte
[Testes](/pt-BR/help/testing). Esta página aborda testes **ao vivo** (que acessam a rede):
matriz de modelos, backends de CLI, ACP, provedores de mídia e gerenciamento de credenciais.

## Ao vivo: comandos locais de smoke test

Exporte a chave necessária do provedor no ambiente do processo antes de realizar verificações
ao vivo ad hoc.

Smoke test seguro de mídia:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke test seguro de prontidão para chamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` é uma simulação, a menos que `--yes` também esteja presente; use `--yes` somente
quando pretender realizar uma chamada real. Para Twilio, Telnyx e Plivo, uma
verificação de prontidão bem-sucedida exige uma URL pública de webhook — URLs de
local loopback/privadas são rejeitadas porque esses provedores não conseguem acessá-las.

## Ao vivo: varredura de recursos do Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos anunciados atualmente** por um Node Android conectado e validar o comportamento do contrato de cada comando.
- Escopo:
  - Configuração prévia/manual (a suíte não instala, executa nem emparelha o aplicativo).
  - Validação comando a comando de `node.invoke` no Gateway para o Node Android selecionado.
- Configuração prévia obrigatória:
  - Aplicativo Android já conectado e emparelhado ao Gateway.
  - Aplicativo mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para os recursos que você espera que sejam aprovados.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos da configuração do Android: [Aplicativo Android](/pt-BR/platforms/android)

## Ao vivo: smoke test de modelos (chaves de perfil)

Os testes de modelos ao vivo são divididos em duas camadas para isolar as falhas:

- "Modelo direto" informa se o provedor/modelo consegue responder com a chave fornecida.
- "Smoke test do Gateway" informa se o pipeline completo de Gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

As listas selecionadas de modelos abaixo ficam em `src/agents/live-model-filter.ts` e
mudam ao longo do tempo; considere os arrays nesse arquivo como a fonte da verdade, não esta
página.

O MiniMax M3 usa `minimax/MiniMax-M3` como referência padrão de provedor/modelo.

### Camada 1: conclusão direta do modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar os modelos descobertos
  - Usar `getApiKeyForModel` para selecionar os modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - Defina `OPENCLAW_LIVE_MODELS=modern`, `small` ou `all` (alias de `modern`) para realmente executar esta suíte; caso contrário, ela será ignorada, para que `pnpm test:live` isoladamente permaneça focado no smoke test do Gateway.
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` executa a lista de prioridades selecionada com alto valor de sinal (consulte [Ao vivo: matriz de modelos](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` executa a lista de prioridades selecionada de modelos pequenos
  - `OPENCLAW_LIVE_MODELS=all` é um alias de `modern`
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (lista de permissões separada por vírgulas)
  - As execuções locais de modelos pequenos do Ollama usam `http://127.0.0.1:11434` por padrão; defina `OPENCLAW_LIVE_OLLAMA_BASE_URL` somente para endpoints de LAN, personalizados ou do Ollama Cloud.
  - As varreduras modern/all e small usam por padrão o tamanho da respectiva lista selecionada como limite; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura completa dos perfis selecionados ou um número positivo para um limite menor.
  - As varreduras completas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` como tempo limite de todo o teste direto de modelos. Padrão: 60 minutos.
  - As sondagens diretas de modelos são executadas com paralelismo de 20 por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituí-lo.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permissões separada por vírgulas)
- Origem das chaves:
  - Por padrão: armazenamento de perfis e fallbacks de variáveis de ambiente
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **somente o armazenamento de perfis**
- Por que isso existe:
  - Separa "a API do provedor está com falha/a chave é inválida" de "o pipeline de agentes do Gateway está com falha"
  - Contém regressões pequenas e isoladas (exemplo: reprodução de raciocínio do OpenAI Responses/Codex Responses + fluxos de chamadas de ferramentas)

### Camada 2: smoke test do Gateway + agente de desenvolvimento (o que "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Inicializar um Gateway no processo
  - Criar/atualizar uma sessão `agent:dev:*` (substituição do modelo por execução)
  - Percorrer modelos com chaves e validar:
    - resposta "significativa" (sem ferramentas)
    - funcionamento de uma invocação real de ferramenta (sondagem de leitura)
    - sondagens adicionais opcionais de ferramentas (sondagem de execução+leitura)
    - continuidade do funcionamento dos caminhos de regressão da OpenAI (somente chamada de ferramenta -> acompanhamento)
- Detalhes das sondagens (para que você possa explicar rapidamente as falhas):
  - Sondagem `read`: o teste grava um arquivo com nonce no espaço de trabalho e solicita que o agente use `read` para lê-lo e devolver o nonce.
  - Sondagem `exec+read`: o teste solicita que o agente use `exec` para gravar um nonce em um arquivo temporário e depois use `read` para lê-lo.
  - Sondagem de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência da implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `test/helpers/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: a lista de prioridades selecionada com alto valor de sinal (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` executa a lista selecionada de modelos pequenos por todo o pipeline de Gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias de `modern`
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou uma lista separada por vírgulas) para restringir
  - As varreduras modern/all e small do Gateway usam por padrão o tamanho da respectiva lista selecionada como limite; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura completa da seleção ou um número positivo para um limite menor.
- Como selecionar provedores (evite "tudo pelo OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permissões separada por vírgulas)
- As sondagens de ferramentas + imagem estão sempre habilitadas neste teste ao vivo:
  - Sondagem `read` + sondagem `exec+read` (estresse de ferramentas)
  - A sondagem de imagem é executada quando o modelo anuncia suporte à entrada de imagens
  - Fluxo (em alto nível):
    - O teste gera um PNG minúsculo com "CAT" + código aleatório (`test/helpers/live-image-probe.ts`)
    - Envia-o por meio de `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa os anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente incorporado encaminha uma mensagem multimodal do usuário ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

<Tip>
Para ver o que você pode testar em sua máquina (e os IDs exatos de `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Ao vivo: smoke test de backend de CLI (Claude, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline de Gateway + agente usando um backend de CLI local, sem alterar sua configuração padrão.
- Os padrões de smoke test específicos de cada backend ficam na definição `cli-backend.ts` do Plugin proprietário.
- Habilitação:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - O comportamento de comandos/argumentos/imagens vem dos metadados do Plugin proprietário do backend de CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt). Desabilitado por padrão nas receitas do Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar os caminhos dos arquivos de imagem como argumentos da CLI em vez de injetá-los no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os argumentos de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para habilitar explicitamente a sondagem de continuidade na mesma sessão de Claude Sonnet -> Opus quando o modelo selecionado oferece suporte a um destino de troca. Desabilitado por padrão, inclusive nas receitas do Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para habilitar explicitamente a sondagem de MCP/ferramenta em local loopback. Desabilitado por padrão nas receitas do Docker.

Exemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke test econômico da configuração MCP do Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Isso não solicita que o Gemini gere uma resposta. Ele grava as mesmas configurações de
sistema que o OpenClaw fornece ao Gemini e depois executa `gemini --debug mcp list` para comprovar que um
servidor salvo com `transport: "streamable-http"` é normalizado para o formato MCP HTTP
do Gemini e consegue se conectar a um servidor MCP HTTP transmissível local.

Receita do Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas do Docker para um único provedor:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O executor do Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke test ao vivo do backend de CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve os metadados de smoke test da CLI no Plugin proprietário e depois instala o pacote correspondente da CLI para Linux (`@anthropic-ai/claude-code` ou `@google/gemini-cli`) em um prefixo gravável com cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` não é mais um backend de CLI incluído; em vez disso, use `openai/*` com o runtime de servidor de aplicativo do Codex (consulte [Ao vivo: smoke test do harness do servidor de aplicativo do Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou de `CLAUDE_CODE_OAUTH_TOKEN` proveniente de `claude setup-token`. Primeiro, ele comprova o funcionamento direto de `claude -p` no Docker e depois executa dois turnos do backend de CLI do Gateway sem preservar as variáveis de ambiente da chave de API da Anthropic. Essa trilha de assinatura desabilita por padrão as sondagens de MCP/ferramenta e imagem do Claude porque consome os limites de uso da assinatura autenticada, e a Anthropic pode alterar o comportamento de cobrança e limitação de taxa do Claude Agent SDK / `claude -p` sem uma versão do OpenClaw.
- Claude e Gemini oferecem suporte ao mesmo conjunto de sondagens (turno de texto, classificação de imagem, chamada da ferramenta `cron` por MCP, continuidade na troca de modelo) por meio das flags acima, mas nenhuma dessas sondagens é executada por padrão — habilite-as explicitamente por flag conforme necessário.

## Ao vivo: acessibilidade do proxy HTTP/2 do APNs

- Teste: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: criar um túnel por meio de um proxy HTTP CONNECT local até o endpoint de sandbox do APNs da Apple, enviar a solicitação de validação HTTP/2 do APNs e validar que a resposta real `403 InvalidProviderToken` da Apple retorna pelo caminho do proxy.
- Habilitação:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Tempo limite opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Ao vivo: smoke test de vinculação ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de vinculação de conversa ACP com um agente ACP ativo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no local uma conversa sintética de canal de mensagens
  - enviar uma continuação normal nessa mesma conversa
  - verificar se a continuação aparece na transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo de mensagem direta do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (ou `on`/`true`/`yes`) para forçar a ativação da sondagem de imagem; qualquer outro valor força sua desativação. É executada por padrão para todos os agentes, exceto `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Observações:
  - Esta faixa usa a superfície `chat.send` do Gateway com campos sintéticos de rota de origem exclusivos para administradores, permitindo que os testes anexem o contexto do canal de mensagens sem simular uma entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes integrado do Plugin `acpx` incorporado para o agente selecionado do ambiente de teste ACP.
  - Por padrão, a criação de MCP Cron da sessão vinculada usa o melhor esforço, pois ambientes de teste ACP externos podem cancelar chamadas MCP depois que a comprovação da vinculação/imagem já tiver passado; defina `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para tornar rigorosa essa sondagem Cron posterior à vinculação.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Procedimento do Docker:

```bash
pnpm test:docker:live-acp-bind
```

Procedimentos do Docker para um único agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Observações sobre o Docker:

- O executor do Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa sequencialmente o teste de fumaça de vinculação ACP com os agentes agregados ativos da CLI: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para restringir a matriz.
- Ele prepara no contêiner o material de autenticação correspondente da CLI e, em seguida, instala a CLI ativa solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid por meio de `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`), caso esteja ausente. O próprio backend ACP é o pacote incorporado `acpx/runtime` do Plugin oficial `acpx`.
- A variante Droid do Docker prepara `~/.factory` para as configurações, encaminha `FACTORY_API_KEY` e exige essa chave de API porque a autenticação local por OAuth/chaveiro do Factory não pode ser transferida para o contêiner. Ela usa a entrada integrada `droid exec --output-format acp` do registro do ACPX.
- A variante OpenCode do Docker é uma faixa rigorosa de regressão para um único agente. Ela grava um modelo padrão temporário em `OPENCODE_CONFIG_CONTENT` com base em `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão: `opencode/kimi-k2.6`).
- Chamadas diretas à CLI `acpx` são apenas um caminho manual/alternativo para comparar o comportamento fora do Gateway. O teste de fumaça de vinculação ACP no Docker exercita o backend de runtime `acpx` incorporado do OpenClaw.

## Ativo: teste de fumaça do ambiente de teste do app-server do Codex

- Objetivo: validar o ambiente de teste do Codex pertencente ao Plugin por meio do método normal
  `agent` do Gateway:
  - carregar o Plugin `codex` incluído
  - selecionar um modelo OpenAI por meio de `/model <ref> --runtime codex`
  - enviar uma primeira interação do agente pelo Gateway com o nível de raciocínio solicitado
  - enviar uma segunda interação para a mesma sessão do OpenClaw e verificar se a thread do app-server
    pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comandos do Gateway
  - opcionalmente, executar duas sondagens de shell escaladas e revisadas pelo Guardian: um comando
    benigno que deve ser aprovado e um envio de segredo falso que deve ser
    negado, fazendo o agente solicitar uma confirmação
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo de referência do ambiente de teste: `openai/gpt-5.6-luna`
- Padrão para nova seleção com chave de API da OpenAI: `openai/gpt-5.6`
- Raciocínio padrão: `low`
- Substituição do modelo: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Substituição do raciocínio: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Substituição da matriz: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Modo de autenticação: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (padrão) usa o
  login copiado do Codex; `api-key` usa `OPENAI_API_KEY` por meio do app-server do Codex.
- Sondagem opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondagem opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondagem opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O teste de fumaça força `agentRuntime.id: "codex"` no provedor/modelo para que um ambiente de teste
  do Codex com defeito não passe recorrendo silenciosamente ao OpenClaw.
- Autenticação: autenticação do app-server do Codex pelo login da assinatura local do Codex ou
  `OPENAI_API_KEY` quando `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. O Docker pode
  copiar `~/.codex/auth.json` e `~/.codex/config.toml` para execuções com assinatura.

Procedimento local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Procedimento do Docker:

```bash
pnpm test:docker:live-codex-harness
```

Matriz nativa do Codex para GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Padrão para nova chave de API da OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Essa comprovação deixa `OPENCLAW_LIVE_GATEWAY_MODELS` sem definição, resolve o modelo por meio
da camada de seleção por inferência da nova integração, confirma `openai/gpt-5.6` e depois
executa uma interação real pelo Gateway com o modelo resolvido.

Matriz incorporada do OpenClaw para GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Observações sobre o Docker:

- O executor do Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele repassa `OPENAI_API_KEY`, copia os arquivos de autenticação da CLI do Codex quando presentes, instala
  `@openai/codex` em um prefixo npm montado com permissão de gravação,
  prepara a árvore de código-fonte e executa apenas o teste ativo do ambiente de teste do Codex.
- O Docker habilita por padrão as sondagens de imagem, MCP/ferramenta e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução de depuração
  mais restrita.
- O Docker usa a mesma configuração explícita de runtime do Codex; portanto, aliases legados ou o recurso
  ao OpenClaw não podem ocultar uma regressão no ambiente de teste do Codex.
- Os alvos da matriz são executados sequencialmente em um único contêiner. O script do Docker dimensiona seu
  tempo limite padrão de 35 minutos de acordo com a quantidade de alvos; qualquer tempo limite externo do shell ou da CI deve
  permitir o mesmo total. A CI canônica mantém cada alvo GPT-5.6 em um fragmento separado.

### Procedimentos ativos recomendados

Listas de permissões restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil direto de modelos pequenos:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de modelos pequenos pelo Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça da API do Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Modelo único, teste de fumaça pelo Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamadas de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça direto do GLM-5.2 do Z.AI Coding Plan:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Foco no Google (chave de API do Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça do raciocínio adaptativo do Google (`qa manual` da CLI privada de controle de qualidade — exige `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` e um checkout do código-fonte; consulte a [visão geral de controle de qualidade](/pt-BR/concepts/qa-e2e-automation)):
  - Padrão dinâmico do Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico do Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API do Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth do Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI local do Gemini em sua máquina (autenticação separada e particularidades de ferramentas).
- API do Gemini versus CLI do Gemini:
  - API: o OpenClaw chama a API hospedada do Gemini do Google por HTTP (chave de API/autenticação de perfil); é isso que a maioria dos usuários quer dizer com "Gemini".
  - CLI: o OpenClaw executa um binário local `gemini` por meio do shell; ele tem autenticação própria e pode se comportar de maneira diferente (streaming/suporte a ferramentas/divergência de versões).

## Ativo: matriz de modelos (o que cobrimos)

Os testes ativos são opcionais, portanto não há uma "lista de modelos da CI" fixa. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (e seu alias `all`) executam a lista selecionada de prioridades de `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` em `src/agents/live-model-filter.ts`, nesta ordem de prioridade:

| Provedor/modelo                              | Observações |
| --------------------------------------------- | ----------- |
| `anthropic/claude-opus-4-8`                   |             |
| `anthropic/claude-sonnet-5`                   |             |
| `anthropic/claude-sonnet-4-6`                 |             |
| `anthropic/claude-opus-4-7`                   |             |
| `google/gemini-3.1-pro-preview`               | API Gemini  |
| `google/gemini-3.5-flash`                     | API Gemini  |
| `cohere/command-a-plus-05-2026`               |             |
| `moonshot/kimi-k2.7-code`                     |             |
| `anthropic/claude-opus-4-6`                   |             |
| `deepseek/deepseek-v4-flash`                  |             |
| `deepseek/deepseek-v4-pro`                    |             |
| `minimax/MiniMax-M3`                          |             |
| `openai/gpt-5.5`                              |             |
| `openrouter/openai/gpt-5.2-chat`              |             |
| `openrouter/minimax/minimax-m2.7`             |             |
| `opencode-go/glm-5`                           |             |
| `openrouter/ai21/jamba-large-1.7`             |             |
| `xai/grok-4.5`                                |             |
| `xai/grok-4.20-0309-reasoning`                |             |
| `zai/glm-5.1`                                 |             |
| `fireworks/accounts/fireworks/models/glm-5p1` |             |
| `minimax-portal/minimax-m3`                   |             |

A lista selecionada de **modelos pequenos** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), proveniente de `SMALL_LIVE_MODEL_PRIORITY`:

| Provedor/modelo              |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Observações sobre a lista moderna:

- Os provedores `codex` e `codex-cli` são excluídos da varredura moderna padrão (eles abrangem o comportamento de backend da CLI/ACP, testado separadamente acima). O próprio `openai/gpt-5.5` é encaminhado pelo conjunto de testes do servidor de aplicativo do Codex por padrão; consulte [Ao vivo: teste de fumaça do conjunto do servidor de aplicativo do Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` e `xai` executam apenas os IDs de modelo explicitamente selecionados na varredura moderna (sem expansão automática de "todos os modelos deste provedor").
- Inclua pelo menos um modelo com suporte a imagens (variantes de visão das famílias Claude/Gemini/OpenAI etc.) em `OPENCLAW_LIVE_GATEWAY_MODELS` para executar a sondagem de imagens.

Execute o teste de fumaça do Gateway com ferramentas + imagem em um conjunto selecionado de vários provedores:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cobertura adicional opcional fora das listas selecionadas (é desejável; escolha um modelo com suporte a "ferramentas" que você tenha habilitado):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (se você tiver acesso)
- LM Studio: `lmstudio/...` (local; a chamada de ferramentas depende do modo da API)

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também poderá testar por meio de:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramentas + imagens)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação por meio de `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Outros provedores que você pode incluir na matriz ao vivo (se tiver credenciais/configuração):

- Integrados: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Por meio de `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

<Tip>
Não codifique rigidamente "todos os modelos" na documentação. A lista oficial é aquela retornada por `discoverModels(...)` em sua máquina, além das chaves disponíveis.
</Tip>

## Credenciais (nunca faça commit)

Os testes ao vivo descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes ao vivo devem encontrar as mesmas chaves.
- Se um teste ao vivo informar "sem credenciais", depure da mesma forma que depuraria `openclaw models list` / a seleção de modelos.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que "chaves de perfil" significa nos testes ao vivo)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório OAuth legado: `~/.openclaw/credentials/` (copiado para o diretório inicial temporário do teste ao vivo quando presente, mas não é o armazenamento principal de chaves de perfil)
- As execuções locais ao vivo copiam a configuração ativa (com as substituições `agents.*.workspace` / `agentDir` removidas) e o `auth-profiles.json` de cada agente — não o restante do diretório desse agente, portanto os dados de `workspace/` e `sandboxes/` nunca chegam ao diretório inicial temporário —, além do diretório legado `credentials/` e dos arquivos/diretórios de autenticação compatíveis de CLIs externas (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) para um diretório inicial temporário de teste.

Se quiser depender de chaves de ambiente, exporte-as antes dos testes locais ou use os
executores Docker abaixo com um `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram ao vivo (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plano de programação BytePlus ao vivo

- Teste: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Mídia de fluxo de trabalho do ComfyUI ao vivo

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Executa os caminhos integrados do comfy para imagem, vídeo e `music_generate`
  - Ignora cada recurso, a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar o envio de fluxos de trabalho do comfy, a consulta periódica, os downloads ou o registro do Plugin

## Geração de imagens ao vivo

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Conjunto de testes: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedores de geração de imagens registrados
  - Usa as variáveis de ambiente dos provedores já exportadas antes da sondagem
  - Usa por padrão as chaves de API ao vivo/do ambiente antes dos perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa cada provedor configurado por meio do runtime compartilhado de geração de imagens:
    - `<provider>:generate`
    - `<provider>:edit` quando o provedor declara suporte à edição
- Provedores integrados abrangidos atualmente:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar a autenticação pelo armazenamento de perfis e ignorar substituições apenas por ambiente

Para o caminho distribuído da CLI, adicione um teste de fumaça de `infer` depois que o teste ao vivo
do provedor/runtime passar:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Imagem de teste plana e minimalista: um quadrado azul sobre um fundo branco, sem texto." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Isso abrange a análise dos argumentos da CLI, a resolução da configuração/do agente padrão, a
ativação de plugins integrados, o runtime compartilhado de geração de imagens e a solicitação
ao provedor ao vivo. Espera-se que as dependências do Plugin estejam presentes antes do carregamento do runtime.

## Geração de música ao vivo

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Conjunto de testes: `pnpm test:live:media music`
- Escopo:
  - Executa o caminho compartilhado dos provedores integrados de geração de música
  - Abrange atualmente `fal`, `google`, `minimax` e `openrouter`
  - Usa as variáveis de ambiente dos provedores já exportadas antes da sondagem
  - Usa por padrão as chaves de API ao vivo/do ambiente antes dos perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa os dois modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - `comfy` tem seu próprio arquivo ao vivo separado e não faz parte desta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar a autenticação pelo armazenamento de perfis e ignorar substituições apenas por ambiente

## Geração de vídeo ao vivo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado dos provedores integrados de geração de vídeo em `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Por padrão, usa o caminho de verificação rápida seguro para a versão: uma solicitação de texto para vídeo por provedor, um prompt de lagosta de um segundo e um limite de operação por provedor definido por `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora a FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo de lançamento; passe `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (ou limpe a lista de exclusão) para executá-la explicitamente
  - Usa as variáveis de ambiente dos provedores já exportadas antes de realizar sondagens
  - Por padrão, usa chaves de API do ambiente/em tempo real antes dos perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação, perfil ou modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar os modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local baseada em buffer na varredura compartilhada
  - Provedor `imageToVideo` atualmente declarado, mas ignorado, na varredura compartilhada:
    - `vydra` (a entrada de imagem local baseada em buffer não é compatível com esta via)
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Esse arquivo executa texto para vídeo com `veo3`, além de uma via de imagem para vídeo com `kling` que usa por padrão um dispositivo de teste com URL de imagem remota (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` para substituir).
  - Cobertura específica do provedor xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - O caso clássico gera primeiro um quadro PNG local quadrado, omite a geometria, solicita um clipe de imagem para vídeo de um segundo, consulta o progresso até a conclusão e verifica o buffer baixado.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - O caso 1.5 gera primeiro um quadro PNG local, solicita um clipe de imagem para vídeo de um segundo em 1080P, consulta o progresso até a conclusão e verifica o buffer baixado.
  - Cobertura em tempo real atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é resolvido como `gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, porque esses caminhos atualmente exigem URLs de referência `http(s)` remotas em vez de entrada local baseada em buffer
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo a FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de cada operação do provedor em uma execução agressiva de verificação rápida
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar a autenticação pelo armazenamento de perfis e ignorar substituições exclusivas do ambiente

## Harness de mídia em tempo real

- Comando: `pnpm test:live:media`
- Ponto de entrada: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, que executa `pnpm test:live -- <suite-test-file>` para cada suíte selecionada, de modo que os comportamentos de Heartbeat e do modo silencioso permaneçam consistentes com outras execuções de `pnpm test:live`.
- Finalidade:
  - Executa as suítes compartilhadas de imagem, música e vídeo em tempo real por meio de um único ponto de entrada nativo do repositório
  - Carrega automaticamente de `~/.profile` as variáveis de ambiente ausentes dos provedores
  - Por padrão, restringe automaticamente cada suíte aos provedores que atualmente têm autenticação utilizável
- Opções:
  - `--providers <csv>` filtro global de provedores; `--image-providers` / `--music-providers` / `--video-providers` restringem um filtro a uma suíte
  - `--all-providers` ignora o filtro automático baseado em autenticação
  - `--allow-empty` encerra com `0` quando a filtragem não deixa nenhum provedor executável
  - `--quiet` / `--no-quiet` repassadas para `test:live`
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) - suítes unitárias, de integração, de QA e do Docker
