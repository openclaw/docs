---
read_when:
    - Executando testes de fumaça da matriz de modelos ao vivo / backend da CLI / ACP / media-provider
    - Depuração da resolução de credenciais de teste ao vivo
    - Adicionando um novo teste live específico de provedor
sidebarTitle: Live tests
summary: 'Testes live (que acessam a rede): matriz de modelos, backends da CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes ao vivo'
x-i18n:
    generated_at: "2026-06-28T20:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

Para início rápido, executores de QA, suítes unitárias/de integração e fluxos Docker, consulte
[Testes](/pt-BR/help/testing). Esta página aborda as suítes de teste **live** (que acessam a rede):
matriz de modelos, backends de CLI, ACP e testes live de provedores de mídia, além do
tratamento de credenciais.

## Live: comandos locais de smoke

Exporte a chave do provedor necessária no ambiente do processo antes de verificações live
ad hoc.

Smoke seguro de mídia:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke seguro de prontidão para chamadas de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` é uma execução de simulação, a menos que `--yes` também esteja presente. Use `--yes` somente
quando você quiser intencionalmente fazer uma chamada real de notificação. Para Twilio, Telnyx e
Plivo, uma verificação de prontidão bem-sucedida exige uma URL pública de Webhook; fallbacks
somente locais de loopback/privados são rejeitados por design.

## Live: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos anunciados atualmente** por um nó Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Configuração pré-condicionada/manual (a suíte não instala/executa/pareia o app).
  - Validação comando por comando via Gateway `node.invoke` para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao Gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para podermos isolar falhas:

- "Modelo direto" nos informa se o provedor/modelo consegue responder com a chave fornecida.
- "Smoke do Gateway" nos informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern`, `small` ou `all` (alias de modern) para de fato executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a lista de permissão moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` para executar a lista de permissão restrita de modelos pequenos (rotas Qwen 8B/9B compatíveis com local, Ollama Gemma, OpenRouter Qwen/GLM e Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` é um alias da lista de permissão moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista de permissão separada por vírgulas)
  - Execuções locais de modelos pequenos Ollama usam `http://127.0.0.1:11434` por padrão; defina `OPENCLAW_LIVE_OLLAMA_BASE_URL` somente para endpoints LAN, personalizados ou Ollama Cloud.
  - Varreduras modern/all e small usam seus limites selecionados por padrão; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura exaustiva dos perfis selecionados ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o timeout de todo o teste de modelo direto. Padrão: 60 minutos.
  - Probes de modelo direto executam com paralelismo de 20 vias por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permissão separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor somente **armazenamento de perfis**
- Por que isso existe:
  - Separa "a API do provedor está quebrada / a chave é inválida" de "o pipeline do agente Gateway está quebrado"
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio de OpenAI Responses/Codex Responses + fluxos de chamadas de ferramenta)

### Camada 2: smoke de Gateway + agente dev (o que "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um Gateway em processo
  - Criar/corrigir uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos com chaves e validar:
    - resposta "significativa" (sem ferramentas)
    - uma invocação real de ferramenta funciona (probe de leitura)
    - probes opcionais extras de ferramenta (probe exec+leitura)
    - caminhos de regressão da OpenAI (somente chamada de ferramenta → acompanhamento) continuam funcionando
- Detalhes dos probes (para você explicar falhas rapidamente):
  - probe `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e ecoar o nonce de volta.
  - probe `exec+read`: o teste pede ao agente para gravar um nonce com `exec` em um arquivo temporário e depois `read` esse arquivo de volta.
  - probe de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `test/helpers/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: lista de permissão moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` para executar a mesma lista de permissão restrita de modelos pequenos pelo pipeline completo gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias da lista de permissão moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras de Gateway modern/all e small usam seus limites selecionados por padrão; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura exaustiva selecionada ou um número positivo para um limite menor.
- Como selecionar provedores (evite "tudo via OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permissão separada por vírgulas)
- Probes de ferramenta + imagem estão sempre ativos neste teste live:
  - probe `read` + probe `exec+read` (estresse de ferramentas)
  - probe de imagem executa quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG pequeno com "CAT" + código aleatório (`test/helpers/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Asserção: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros permitidos)

<Tip>
Para ver o que você pode testar na sua máquina (e os IDs exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke de backend de CLI (Claude, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos do backend ficam com a definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - O comportamento de comando/args/imagem vem dos metadados do Plugin de backend de CLI proprietário.
- Substituições (opcional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (caminhos são injetados no prompt). Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivos de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar pelo probe de continuidade Claude Sonnet -> Opus na mesma sessão quando o modelo selecionado oferece suporte a um destino de troca. Receitas Docker deixam isso desativado por padrão para confiabilidade agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar pelo probe de loopback MCP/ferramenta. Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.

Exemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke barato de configuração MCP do Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Isso não pede ao Gemini para gerar uma resposta. Ele grava as mesmas configurações de sistema
que o OpenClaw fornece ao Gemini, então executa `gemini --debug mcp list` para provar que um
servidor `transport: "streamable-http"` salvo é normalizado para o formato HTTP MCP do Gemini
e consegue se conectar a um servidor MCP streamable-HTTP local.

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O executor Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live de backend de CLI dentro da imagem Docker do repositório como o usuário `node` não root.
- Ele resolve metadados de smoke de CLI a partir da extensão proprietária, então instala o pacote de CLI Linux correspondente (`@anthropic-ai/claude-code` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil da assinatura Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro, ele comprova `claude -p` direto no Docker, depois executa dois turnos de backend de CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Esta faixa de assinatura desativa por padrão os probes de MCP/ferramenta e imagem do Claude porque consome os limites de uso da assinatura conectada, e a Anthropic pode mudar o comportamento de cobrança e limite de taxa do Claude Agent SDK / `claude -p` sem uma versão do OpenClaw.
- O smoke live de backend de CLI agora exercita o mesmo fluxo ponta a ponta para Claude e Gemini: turno de texto, turno de classificação de imagem, depois chamada à ferramenta MCP `cron` verificada por meio da CLI do Gateway.
- O smoke padrão do Claude também corrige a sessão de Sonnet para Opus e verifica se a sessão retomada ainda lembra uma nota anterior.

## Live: acessibilidade do proxy HTTP/2 APNs

- Teste: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: tunelar por meio de um proxy HTTP CONNECT local até o endpoint APNs sandbox da Apple, enviar a solicitação de validação HTTP/2 do APNs e validar que a resposta real `403 InvalidProviderToken` da Apple retorna pelo caminho do proxy.
- Habilitar:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de vinculação de conversa ACP com um agente ACP ao vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular uma conversa sintética de canal de mensagem no local
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar se o acompanhamento chega à transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Observações:
  - Este caminho usa a superfície `chat.send` do Gateway com campos sintéticos de rota de origem somente para administradores, para que os testes possam anexar contexto de canal de mensagem sem fingir entregar externamente.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes integrado do Plugin `acpx` incorporado para o agente de harness ACP selecionado.
  - A criação de MCP de Cron de sessão vinculada é de melhor esforço por padrão, porque harnesses ACP externos podem cancelar chamadas MCP depois que a prova de vinculação/imagem passou; defina `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para tornar essa sondagem de Cron pós-vinculação estrita.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receitas Docker para agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o teste de fumaça de vinculação ACP contra os agentes CLI ao vivo agregados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para restringir a matriz.
- Ele prepara o material de autenticação da CLI correspondente dentro do contêiner e depois instala a CLI ao vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) se estiver ausente. O backend ACP em si é o pacote `acpx/runtime` incorporado do Plugin oficial `acpx`.
- A variante Docker do Droid prepara `~/.factory` para configurações, encaminha `FACTORY_API_KEY` e exige essa chave de API porque a autenticação OAuth/keyring local da Factory não é portátil para dentro do contêiner. Ela usa a entrada de registro integrada do ACPX `droid exec --output-format acp`.
- A variante Docker do OpenCode é um caminho de regressão estrito de agente único. Ela grava um modelo padrão temporário de `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão `opencode/kimi-k2.6`), e `pnpm test:docker:live-acp-bind:opencode` exige uma transcrição de assistente vinculada em vez de aceitar o salto genérico pós-vinculação.
- Chamadas diretas da CLI `acpx` são apenas um caminho manual/de contorno para comparar comportamento fora do Gateway. O teste de fumaça Docker de vinculação ACP exercita o backend de runtime `acpx` incorporado do OpenClaw.

## Ao vivo: teste de fumaça do harness do servidor de aplicativo Codex

- Objetivo: validar o harness Codex pertencente ao Plugin por meio do método normal
  `agent` do Gateway:
  - carregar o Plugin `codex` incluído
  - selecionar `openai/gpt-5.5`, que roteia turnos de agente OpenAI pelo Codex por padrão
  - enviar um primeiro turno de agente do Gateway para `openai/gpt-5.5` com o harness Codex selecionado
  - enviar um segundo turno para a mesma sessão do OpenClaw e verificar se a thread do servidor de aplicativo
    consegue retomar
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do Gateway
  - opcionalmente executar duas sondagens de shell escaladas revisadas pelo Guardian: um comando benigno
    que deve ser aprovado e um upload de segredo falso que deve ser
    negado, para que o agente pergunte de volta
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.5`
- Sondagem de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondagem opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondagem opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O teste de fumaça força provedor/modelo `agentRuntime.id: "codex"` para que um harness Codex quebrado não consiga passar ao recorrer silenciosamente ao OpenClaw.
- Autenticação: autenticação do servidor de aplicativo Codex a partir do login de assinatura local do Codex. Testes de fumaça Docker também podem fornecer `OPENAI_API_KEY` para sondagens não Codex quando aplicável,
  além de `~/.codex/auth.json` e `~/.codex/config.toml` copiados opcionalmente.

Receita local:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI Codex quando presentes, instala
  `@openai/codex` em um prefixo npm montado e gravável, prepara a árvore de código-fonte e então executa apenas o teste ao vivo do harness Codex.
- O Docker habilita as sondagens de imagem, MCP/ferramenta e Guardian por padrão. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando você precisar de uma execução de depuração mais restrita.
- O Docker usa a mesma configuração explícita de runtime Codex, então aliases legados ou fallback do OpenClaw não conseguem ocultar uma regressão do harness Codex.

### Receitas ao vivo recomendadas

Allowlists restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil direto de modelo pequeno:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil Gateway de modelo pequeno:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça da API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Modelo único, teste de fumaça do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça direto do Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de fumaça de pensamento adaptativo Google:
  - Padrão dinâmico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth do Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (chave de API / autenticação de perfil); isto é o que a maioria dos usuários quer dizer com "Gemini".
  - CLI: o OpenClaw invoca um binário `gemini` local por shell; ele tem sua própria autenticação e pode se comportar de forma diferente (streaming/suporte a ferramentas/desalinhamento de versão).

## Ao vivo: matriz de modelos (o que cobrimos)

Não há uma "lista de modelos de CI" fixa (ao vivo é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de teste de fumaça (chamada de ferramentas + imagem)

Esta é a execução de "modelos comuns" que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API geral) ou `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Execute o teste de fumaça do Gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedores:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API geral) ou `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4.3` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo capaz de "ferramentas" que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo capaz de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar a sondagem de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também damos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos capazes de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz ao vivo (se tiver credenciais/configuração):

- Integrados: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

<Tip>
Não codifique "todos os modelos" de forma fixa na documentação. A lista autoritativa é o que `discoverModels(...)` retornar na sua máquina, além das chaves disponíveis.
</Tip>

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funcionar, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser "no creds", depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que "profile keys" significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam a configuração ativa, os arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação de CLIs externas compatíveis para uma home temporária de teste por padrão; homes live preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondagens fiquem fora do workspace real do seu host.

Se quiser depender de chaves de ambiente, exporte-as antes dos testes locais ou use os
executores Docker abaixo com um `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram live (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plano de codificação BytePlus live

- Teste: `extensions/byteplus/live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Mídia de fluxo de trabalho ComfyUI live

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos integrados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar envio de fluxo de trabalho comfy, polling, downloads ou registro de Plugin

## Geração de imagens live

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os Plugins provedores de geração de imagens registrados
  - Usa variáveis de ambiente de provedor já exportadas antes de sondar
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa cada provedor configurado pelo runtime compartilhado de geração de imagens:
    - `<provider>:generate`
    - `<provider>:edit` quando o provedor declara suporte a edição
- Provedores integrados atuais cobertos:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por ambiente

Para o caminho da CLI distribuído, adicione um smoke `infer` depois que o teste
live de provedor/runtime passar:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Isso cobre análise de argumentos da CLI, resolução de configuração/agente padrão,
ativação de Plugin integrado, o runtime compartilhado de geração de imagens e a
requisição live ao provedor. Espera-se que as dependências do Plugin estejam
presentes antes do carregamento do runtime.

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado de provedor integrado de geração de música
  - Atualmente cobre Google e MiniMax
  - Usa variáveis de ambiente de provedor já exportadas antes de sondar
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa os dois modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por ambiente

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado de provedor integrado de geração de vídeo
  - Usa por padrão o caminho smoke seguro para release: provedores que não sejam FAL, uma requisição de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Usa variáveis de ambiente de provedor já exportadas antes de sondar
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local baseada em buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` integrado é somente texto e o `kling` integrado exige uma URL de imagem remota
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` texto para vídeo mais uma faixa `kling` que usa por padrão uma fixture de URL de imagem remota
  - Cobertura live atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs remotas de referência `http(s)` / MP4
    - `google` porque a faixa compartilhada atual Gemini/Veo usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não tem garantias de acesso a edição de vídeo específicas da organização
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por ambiente

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por meio de um único ponto de entrada nativo do repo
  - Usa variáveis de ambiente de provedor já exportadas
  - Restringe automaticamente cada suíte aos provedores que atualmente têm autenticação utilizável por padrão
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) - suítes unitárias, de integração, QA e Docker
