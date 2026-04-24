---
read_when:
    - Executando smokes live de matriz de modelos / backend de CLI / ACP / provedor de mídia
    - Depurando resolução de credenciais em testes live
    - Adicionando um novo teste live específico de provedor
sidebarTitle: Live tests
summary: 'Testes live (com acesso à rede): matriz de modelos, backends de CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes live'
x-i18n:
    generated_at: "2026-04-24T05:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

Para início rápido, runners de QA, suítes unit/integration e fluxos Docker, consulte
[Testing](/pt-BR/help/testing). Esta página cobre as suítes de teste **live** (com acesso à rede):
matriz de modelos, backends de CLI, ACP e testes live de provedores de mídia, além do
tratamento de credenciais.

## Live: varredura de capacidades do Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos atualmente anunciados** por um Node Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Configuração prévia/manual (a suíte não instala/executa/faz pairing do app).
  - Validação comando por comando de `node.invoke` do gateway para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera aprovar.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos da configuração do Android: [Android App](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos informa se o provedor/modelo consegue responder com a chave fornecida.
- “Gateway smoke” nos informa se o pipeline completo de gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado em gateway smoke
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o timeout total do teste de modelo direto. Padrão: 60 minutos.
  - Probes de modelo direto executam com paralelismo 20 por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **somente armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: fluxos de replay de raciocínio + chamada de ferramenta do OpenAI Responses/Codex Responses)

### Camada 2: Gateway + smoke do agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um gateway em processo
  - Criar/corrigir uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos-com-chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (probe de read)
    - probes opcionais extras de ferramenta (probe de exec+read)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → continuação) continuam funcionando
- Detalhes das probes (para que você possa explicar falhas rapidamente):
  - probe de `read`: o teste grava um arquivo nonce no workspace e pede ao agente para fazer `read` dele e devolver o nonce.
  - probe de `exec+read`: o teste pede ao agente para usar `exec` para gravar um nonce em um arquivo temporário e depois fazer `read` dele.
  - probe de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras de gateway modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “OpenRouter para tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Probes de ferramenta + imagem estão sempre ativadas neste teste live:
  - probe de `read` + probe de `exec+read` (estresse de ferramenta)
  - a probe de imagem é executada quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário ao modelo
    - Asserção: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os IDs exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend de CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos de backend ficam com a definição `cli-backend.ts` da extensão proprietária.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do Plugin de backend de CLI proprietário.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desativar a probe padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina `1` para forçá-la quando o modelo selecionado oferecer suporte a um destino de troca).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

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
- Ele executa o smoke live de backend de CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve os metadados de smoke da CLI a partir da extensão proprietária correspondente e então instala o pacote Linux de CLI correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code via `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Ele primeiro comprova `claude -p` direto no Docker e depois executa dois turnos do backend de CLI do Gateway sem preservar variáveis de ambiente de chave de API do Anthropic. Essa trilha de assinatura desativa por padrão as probes de Claude MCP/tool e imagem porque o Claude atualmente roteia o uso por apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live de backend de CLI agora exercita o mesmo fluxo ponta a ponta para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada da ferramenta MCP `cron` validada pela CLI do gateway.
- O smoke padrão do Claude também corrige a sessão de Sonnet para Opus e valida que a sessão retomada ainda lembra uma observação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular em tempo real uma conversa sintética de canal de mensagem
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar se o acompanhamento chega à transcrição da sessão ACP vinculada
- Ativar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Observações:
  - Esta trilha usa a superfície `chat.send` do gateway com campos administrativos de rota de origem sintética para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do Plugin `acpx` para o agente de harness ACP selecionado.

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
pnpm test:docker:live-acp-bind:gemini
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP em sequência contra todos os agentes de CLI live compatíveis: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de autenticação da CLI correspondente no container, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI-filha do harness as variáveis de ambiente do provedor vindas do perfil carregado.

## Live: smoke de harness app-server do Codex

- Objetivo: validar o harness Codex controlado pelo Plugin pelo método normal
  `agent` do gateway:
  - carregar o Plugin `codex` incluído
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno do agente do gateway para `openai/gpt-5.2` com o harness Codex forçado
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a
    thread do app-server consegue retomar
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do gateway
  - opcionalmente executar duas probes de shell escaladas revisadas pelo Guardian: um
    comando benigno que deve ser aprovado e um upload falso de segredo que deve ser
    negado para que o agente peça confirmação
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Ativar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.2`
- Probe opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe opcional de MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe opcional de Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não passe ao recorrer silenciosamente a Pi.
- Autenticação: autenticação do app-server Codex a partir do login local de assinatura do Codex. Smokes em Docker
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
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de
  autenticação da CLI do Codex quando presentes, instala `@openai/codex` em um prefixo npm
  gravável montado, prepara a árvore de código-fonte e então executa apenas o teste live do harness Codex.
- O Docker ativa por padrão as probes de imagem, MCP/tool e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução de
  depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, correspondendo à configuração
  do teste live para que aliases legados ou fallback para Pi não escondam uma
  regressão do harness Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + particularidades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (autenticação por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local; ele tem autenticação própria e pode se comportar de forma diferente (streaming/suporte a ferramentas/descompasso de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute gateway smoke com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de ferramentas que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar a probe de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves ativadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é tudo o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca commitar)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “no creds”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “profile keys” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home temporário live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções locais live copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios compatíveis de autenticação de CLI externa para um home temporário de teste; homes live preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as probes fiquem fora do seu workspace real do host.

Se quiser depender de chaves de env (por exemplo exportadas no seu `~/.profile`), execute testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no container).

## Live do Deepgram (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live do plano de coding do BytePlus

- Teste: `extensions/byteplus/live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos integrados de imagem, vídeo e `music_generate` do Comfy
  - Ignora cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do Comfy, polling, downloads ou registro do Plugin

## Live de geração de imagem

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todo Plugin de provedor de geração de imagem registrado
  - Carrega variáveis de ambiente ausentes do provedor a partir do seu shell de login (`~/.profile`) antes da probe
  - Usa por padrão chaves live/env de API antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem pela capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores integrados atualmente cobertos:
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
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de env

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado integrado de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes da probe
  - Usa por padrão chaves live/env de API antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente por prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da trilha compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de env

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado integrado de provedor de geração de vídeo
  - Usa por padrão o caminho smoke seguro para release: provedores sem FAL, uma solicitação text-to-video por provedor, prompt de lagosta de um segundo e um limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila do lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes da probe
  - Usa por padrão chaves live/env de API antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local com buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local com buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` integrado é somente texto e o `kling` integrado exige uma URL remota de imagem
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma trilha `kling` que usa por padrão um fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - somente `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs remotas de referência `http(s)` / MP4
    - `google` porque a trilha compartilhada atual de Gemini/Veo usa entrada local com buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a trilha compartilhada atual não garante acesso específico por organização a video inpaint/remix
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todo provedor na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes a partir de `~/.profile`
  - Restringe automaticamente cada suíte, por padrão, aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testing](/pt-BR/help/testing) — suítes unit, integration, QA e Docker
