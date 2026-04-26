---
read_when:
    - Executando smokes live de matriz de modelos / backend de CLI / ACP / provedor de mídia
    - Depurando a resolução de credenciais de testes live
    - Adicionando um novo teste live específico de provedor
sidebarTitle: Live tests
summary: 'Testes live (com toque de rede): matriz de modelos, backends de CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes live'
x-i18n:
    generated_at: "2026-04-26T11:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Para início rápido, runners de QA, suítes unit/integration e fluxos Docker, consulte
[Testes](/pt-BR/help/testing). Esta página cobre as suítes de teste **live** (com toque de rede):
matriz de modelos, backends de CLI, ACP e testes live de provedores de mídia, além
do tratamento de credenciais.

## Live: comandos de smoke de perfil local

Faça `source` de `~/.profile` antes de verificações live ad hoc para que chaves de provedor e caminhos de ferramentas locais
correspondam ao seu shell:

```bash
source ~/.profile
```

Smoke seguro de mídia:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke seguro de prontidão para chamada de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` é uma simulação, a menos que `--yes` também esteja presente. Use `--yes` apenas
quando você quiser intencionalmente fazer uma chamada real de notificação. Para Twilio, Telnyx e
Plivo, uma verificação de prontidão bem-sucedida exige uma URL pública de Webhook; fallbacks apenas
loopback/local/privado são rejeitados por design.

## Live: varredura de capabilities de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um Node Android conectado e validar o comportamento do contrato do comando.
- Escopo:
  - Configuração manual/com pré-condições (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do Gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao Gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capabilities que você espera aprovar.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave fornecida.
- “Smoke do Gateway” nos diz se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a lista de permissões modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a lista de permissões modern
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (lista de permissões separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura modern exaustiva ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o timeout de todo o teste de modelo direto. Padrão: 60 minutos.
  - Probes de modelo direto são executados com paralelismo 20 por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permissões separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfil e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas** o armazenamento de perfil
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline de agente do Gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de reasoning + fluxos de chamada de ferramenta em OpenAI Responses/Codex Responses)

### Camada 2: smoke do Gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um Gateway in-process
  - Criar/patch uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos-com-chave e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (probe de leitura)
    - probes opcionais extras de ferramenta (probe de exec+read)
    - caminhos de regressão da OpenAI (somente chamada de ferramenta → acompanhamento) continuam funcionando
- Detalhes do probe (para que você consiga explicar falhas rapidamente):
  - probe de `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e devolver o nonce.
  - probe de `exec+read`: o teste pede ao agente para gravar um nonce com `exec` em um arquivo temporário e depois fazer `read` dele.
  - probe de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar Vitest diretamente)
- Como selecionar modelos:
  - Padrão: lista de permissões modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a lista de permissões modern
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do Gateway usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura modern exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “OpenRouter em tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permissões separada por vírgulas)
- Probes de ferramenta + imagem estão sempre ativados neste teste live:
  - probe de `read` + probe de `exec+read` (stress de ferramenta)
  - o probe de imagem é executado quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um pequeno PNG com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend de CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline do Gateway + agente usando um backend local de CLI, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos do backend ficam com a definição `cli-backend.ts` da extensão proprietária.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do Plugin proprietário do backend de CLI.
- Substituições (opcional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt). Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para fazer opt-in do probe de continuidade na mesma sessão Claude Sonnet -> Opus quando o modelo selecionado oferece suporte a um alvo de troca. Receitas Docker deixam isso desativado por padrão para maior confiabilidade agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para fazer opt-in do probe de loopback MCP/ferramenta. Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke barato de configuração MCP do Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Isso não pede ao Gemini para gerar uma resposta. Ele grava as mesmas
configurações de sistema que o OpenClaw fornece ao Gemini e depois executa `gemini --debug mcp list` para provar que um servidor salvo com `transport: "streamable-http"` é normalizado para o formato MCP HTTP do Gemini e pode se conectar a um servidor MCP local streamable-HTTP.

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live de backend de CLI dentro da imagem Docker do repo como o usuário não root `node`.
- Ele resolve metadados de smoke da CLI a partir da extensão proprietária e depois instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker, depois executa dois turnos do backend de CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Essa trilha de assinatura desativa por padrão os probes de ferramenta/MCP e imagem do Claude porque o Claude atualmente encaminha o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live do backend de CLI agora exercita o mesmo fluxo ponta a ponta para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada de ferramenta MCP `cron` verificada pela CLI do Gateway.
- O smoke padrão do Claude também faz patch da sessão de Sonnet para Opus e valida se a sessão retomada ainda se lembra de uma observação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no local uma conversa sintética de canal de mensagens
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar se o acompanhamento chega ao transcript da sessão ACP vinculada
- Ativar:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Observações:
  - Esta trilha usa a superfície `chat.send` do Gateway com campos de rota de origem sintética somente admin para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes interno do Plugin `acpx` embutido para o agente de harness ACP selecionado.

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

Receitas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra os agentes live agregados de CLI em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para restringir a matriz.
- Ele faz `source` de `~/.profile`, prepara o material de auth da CLI correspondente no container e depois instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) se estiver ausente. O próprio backend ACP é o pacote `acpx/runtime` embutido incluído no Plugin `acpx`.
- A variante Docker do Droid prepara `~/.factory` para configurações, encaminha `FACTORY_API_KEY` e exige essa chave de API porque a auth local do Factory via OAuth/keyring não é portátil para o container. Ela usa a entrada de registro interna do ACPX `droid exec --output-format acp`.
- A variante Docker do OpenCode é uma trilha estrita de regressão com agente único. Ela grava um modelo padrão temporário em `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão `opencode/kimi-k2.6`) após fazer `source` de `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` exige um transcript de assistente vinculado em vez de aceitar o skip genérico pós-bind.
- Chamadas diretas da CLI `acpx` são apenas um caminho manual/de contorno para comparar comportamento fora do Gateway. O smoke Docker de bind ACP exercita o backend de runtime `acpx` embutido do OpenClaw.

## Live: smoke do harness de servidor de app Codex

- Objetivo: validar o harness Codex controlado por Plugin por meio do método normal
  `agent` do Gateway:
  - carregar o Plugin `codex` incluído
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do Gateway para `openai/gpt-5.2` com o harness Codex forçado
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread do servidor de app
    consegue ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do Gateway
  - opcionalmente executar dois probes de shell escalados revisados pelo Guardian: um comando benigno
    que deve ser aprovado e um upload falso de segredo que deve ser negado para que o agente pergunte de volta
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Ativar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.2`
- Probe opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não consiga passar por fallback silencioso para Pi.
- Auth: auth do servidor de app Codex a partir do login local de assinatura do Codex. Smokes em Docker
  também podem fornecer `OPENAI_API_KEY` para probes não Codex quando aplicável,
  além de cópias opcionais de `~/.codex/auth.json` e `~/.codex/config.toml`.

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele faz `source` de `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de
  auth da CLI Codex quando presentes, instala `@openai/codex` em um prefixo npm
  montado e gravável, prepara a árvore de código-fonte e depois executa apenas o teste live do harness Codex.
- O Docker ativa por padrão os probes de imagem, MCP/ferramenta e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução
  de debug mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, correspondendo à configuração do
  teste live, para que aliases legados ou fallback para Pi não possam ocultar uma
  regressão do harness Codex.

### Receitas live recomendadas

Listas de permissões restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de thinking adaptativo do Google:
  - Se as chaves locais estiverem no perfil do shell: `source ~/.profile`
  - Padrão dinâmico do Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico do Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local da sua máquina (auth separada + particularidades de tooling).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google por HTTP (auth por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria auth e pode se comportar de forma diferente (streaming/suporte a ferramenta/desalinhamento de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os **modelos recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto de smoke moderno (chamada de ferramenta + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute smoke do Gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramenta (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a versão mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capability de ferramentas que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; chamada de ferramenta depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo compatível com imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatíveis com visão do Claude/Gemini/OpenAI etc.) para exercitar o probe de imagem.

### Agregadores / Gateways alternativos

Se você tiver chaves ativadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos compatíveis com ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Incluídos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente codificar “todos os modelos” na documentação. A lista autoritativa é tudo o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de auth por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios externos compatíveis de auth de CLI para um home temporário de teste; homes live preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que os probes fiquem longe do seu workspace real no host.

Se você quiser depender de chaves de env (por exemplo, exportadas em `~/.profile`), execute testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no container).

## Live: Deepgram (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live: plano coding do BytePlus

- Teste: `extensions/byteplus/live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos incluídos de imagem, vídeo e `music_generate` do Comfy
  - Ignora cada capability, a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar envio de workflow do Comfy, polling, downloads ou registro do Plugin

## Live: geração de imagem

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todo Plugin de provedor de geração de imagem registrado
  - Carrega variáveis de env de provedor ausentes a partir do seu shell de login (`~/.profile`) antes de executar probes
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa cada provedor configurado pelo runtime compartilhado de geração de imagem:
    - `<provider>:generate`
    - `<provider>:edit` quando o provedor declara suporte a edição
- Provedores incluídos atuais cobertos:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfil e ignorar substituições somente de env

Para o caminho de CLI distribuído, adicione um smoke `infer` após o teste live
de provedor/runtime passar:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Isso cobre parsing de argumentos da CLI, resolução de configuração/agente padrão, ativação
de Plugin incluído, reparo sob demanda de dependências de runtime incluídas, o runtime compartilhado
de geração de imagem e a requisição live ao provedor.

## Live: geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedores de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de env de provedor a partir do seu shell de login (`~/.profile`) antes de executar probes
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da trilha compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live do Comfy separado, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfil e ignorar substituições somente de env

## Live: geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedores de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores sem FAL, uma requisição de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila do lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de env de provedor a partir do seu shell de login (`~/.profile`) antes de executar probes
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de imagem com buffer no sweep compartilhado
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de vídeo com buffer no sweep compartilhado
  - Provedores atuais `imageToVideo` declarados, mas ignorados, no sweep compartilhado:
    - `vydra` porque o `veo3` incluído é apenas texto e o `kling` incluído exige URL remota de imagem
  - Cobertura específica de provedor do Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` texto para vídeo mais uma trilha `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` apenas quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atuais `videoToVideo` declarados, mas ignorados, no sweep compartilhado:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a trilha compartilhada atual Gemini/Veo usa entrada local com buffer e esse caminho não é aceito no sweep compartilhado
    - `openai` porque a trilha compartilhada atual não tem garantias de acesso específico da organização para video inpaint/remix
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todo provedor no sweep padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução de smoke agressiva
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfil e ignorar substituições somente de env

## Harness de mídia live

- Comando: `pnpm test:live:media`
- Objetivo:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repo
  - Carrega automaticamente variáveis de env ausentes de provedor a partir de `~/.profile`
  - Restringe automaticamente cada suíte, por padrão, aos provedores que atualmente têm auth utilizável
  - Reutiliza `scripts/test-live.mjs`, para que Heartbeat e comportamento de modo silencioso permaneçam consistentes
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) — suítes unit, integration, QA e Docker
