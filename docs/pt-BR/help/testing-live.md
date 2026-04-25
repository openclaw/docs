---
read_when:
    - Executando matrizes ativas de modelos / backends de CLI / ACP / sondagens de provedores de mídia
    - Depurando a resolução de credenciais de teste ativo
    - Adicionando um novo teste ativo específico de provedor
sidebarTitle: Live tests
summary: 'Testes ativos (com acesso à rede): matriz de modelos, backends de CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes ativas'
x-i18n:
    generated_at: "2026-04-25T13:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

Para início rápido, executores de QA, suítes unitárias/de integração e fluxos com Docker, consulte
[Testes](/pt-BR/help/testing). Esta página cobre as suítes de testes **ativas** (com acesso à rede):
matriz de modelos, backends de CLI, ACP e testes ativos de provedores de mídia, além do
tratamento de credenciais.

## Ativo: comandos de smoke com perfil local

Carregue `~/.profile` antes de verificações ativas ad hoc para que chaves de provedores e caminhos de ferramentas locais
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

`voicecall smoke` é uma execução a seco, a menos que `--yes` também esteja presente. Use `--yes` somente
quando você quiser intencionalmente fazer uma chamada real de notificação. Para Twilio, Telnyx e
Plivo, uma verificação de prontidão bem-sucedida exige uma URL pública de Webhook; fallbacks apenas locais
de loopback/privados são rejeitados por design.

## Ativo: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um nó Android conectado e validar o comportamento contratual do comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação comando por comando de `node.invoke` do gateway para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado com o gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Ativo: smoke de modelo (chaves de perfil)

Os testes ativos são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos informa se o provedor/modelo consegue responder de fato com a chave fornecida.
- “Smoke do gateway” nos informa se o pipeline completo de gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a lista de permissões moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a lista de permissões moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (lista de permissões separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o timeout total do teste de modelo direto. Padrão: 60 minutos.
  - Sondagens de modelo direto executam com paralelismo de 20 vias por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permissões separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **somente** o armazenamento de perfis
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente no gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio do OpenAI Responses/Codex Responses + fluxos de tool-call)

### Camada 2: smoke do Gateway + agente dev (o que o "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um gateway em processo
  - Criar/ajustar uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar por modelos-com-chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sondagem de leitura)
    - sondagens extras opcionais de ferramenta (sondagem de exec+read)
    - caminhos de regressão do OpenAI (somente tool-call → acompanhamento) continuam funcionando
- Detalhes das sondagens (para que você possa explicar falhas rapidamente):
  - sondagem `read`: o teste grava um arquivo com nonce no workspace e pede ao agente para `read` e devolver o nonce.
  - sondagem `exec+read`: o teste pede ao agente para gravar via `exec` um nonce em um arquivo temporário e depois `read` de volta.
  - sondagem de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: lista de permissões moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a lista de permissões moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras de gateway modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permissões separada por vírgulas)
- Sondagens de ferramenta + imagem estão sempre ativas neste teste ao vivo:
  - sondagem `read` + sondagem `exec+read` (estresse de ferramenta)
  - a sondagem de imagem é executada quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG pequeno com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia por `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente incorporado encaminha uma mensagem multimodal do usuário para o modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Ativo: smoke de backend de CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Padrões de smoke específicos de backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do Plugin proprietário do backend de CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (caminhos são injetados no prompt). Receitas Docker deixam isso desativado por padrão, salvo solicitação explícita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para fazer opt-in à sondagem de continuidade na mesma sessão Claude Sonnet -> Opus quando o modelo selecionado oferece suporte a um alvo de troca. Receitas Docker deixam isso desativado por padrão para confiabilidade agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para fazer opt-in à sondagem de ferramenta/loopback MCP. Receitas Docker deixam isso desativado por padrão, salvo solicitação explícita.

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

- O executor Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke ativo de backend de CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados de smoke de CLI a partir da extensão proprietária e depois instala o pacote de CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker e depois executa dois turnos de backend de CLI do Gateway sem preservar variáveis env de chave de API da Anthropic. Essa trilha de assinatura desabilita por padrão as sondagens MCP/ferramenta e imagem do Claude porque atualmente o Claude encaminha o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke ativo de backend de CLI agora exercita o mesmo fluxo ponta a ponta para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e, em seguida, chamada da ferramenta MCP `cron` verificada via CLI do gateway.
- O smoke padrão do Claude também ajusta a sessão de Sonnet para Opus e verifica se a sessão retomada ainda se lembra de uma observação anterior.

## Ativo: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP ativo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular em tempo real uma conversa sintética de canal de mensagem
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar se o acompanhamento chega à transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP em Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Observações:
  - Esta trilha usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem somente para admin para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes integrado do Plugin `acpx` incorporado para o agente harness ACP selecionado.

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
pnpm test:docker:live-acp-bind:opencode
```

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra os agentes de CLI ativos agregados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de autenticação da CLI correspondente no contêiner e depois instala a CLI ativa solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` ou `opencode-ai`) se estiver ausente. O próprio backend ACP é o pacote incluído incorporado `acpx/runtime` do Plugin `acpx`.
- A variante Docker do OpenCode é uma trilha estrita de regressão de agente único. Ela grava um modelo padrão temporário em `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão `opencode/kimi-k2.6`) após carregar `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` exige uma transcrição de assistente vinculada em vez de aceitar o skip genérico pós-bind.
- Chamadas diretas à CLI `acpx` são apenas um caminho manual/de contorno para comparar comportamento fora do Gateway. O smoke Docker de bind ACP exercita o backend de runtime `acpx` incorporado do OpenClaw.

## Ativo: smoke do harness do servidor de app Codex

- Objetivo: validar o harness Codex controlado pelo Plugin por meio do método normal
  `agent` do gateway:
  - carregar o Plugin incluído `codex`
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do gateway para `openai/gpt-5.2` com o harness Codex forçado
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread do servidor de app
    consegue retomar
  - executar `/codex status` e `/codex models` pelo mesmo caminho de
    comando do gateway
  - opcionalmente executar duas sondagens de shell escaladas revisadas pelo Guardian: um comando benigno
    que deve ser aprovado e um upload falso de segredo que deve ser
    negado para que o agente pergunte de volta
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.2`
- Sondagem de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondagem MCP/ferramenta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondagem Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não passe ao recorrer silenciosamente ao Pi.
- Autenticação: autenticação do servidor de app Codex a partir do login local de assinatura do Codex. Smokes em Docker
  também podem fornecer `OPENAI_API_KEY` para sondagens não Codex quando aplicável,
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

- O executor Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de
  autenticação do Codex CLI quando presentes, instala `@openai/codex` em um prefixo npm
  montado e gravável, prepara a árvore de código-fonte e então executa apenas o teste ativo do harness Codex.
- O Docker habilita por padrão as sondagens de imagem, MCP/ferramenta e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução
  de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, correspondendo à configuração do
  teste ativo, para que aliases legados ou fallback para Pi não possam esconder uma regressão do
  harness Codex.

### Receitas ativas recomendadas

Listas de permissões restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de adaptive thinking do Google:
  - Se as chaves locais estiverem no perfil do shell: `source ~/.profile`
  - Padrão dinâmico do Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico do Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa o Gemini CLI local na sua máquina (autenticação separada + particularidades de ferramentas).
- API Gemini vs Gemini CLI:
  - API: o OpenClaw chama a API hospedada do Gemini do Google por HTTP (chave de API / autenticação por perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria autenticação e pode se comportar de modo diferente (suporte a streaming/ferramentas/diferenças de versão).

## Ativo: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (ativo é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de smoke (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.2`
- OAuth do OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke de gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de ferramentas que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI com visão etc.) para exercitar a sondagem de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz ativa (se tiver credenciais/configuração):

- Incluídos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é tudo o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes ativos descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes ativos devem encontrar as mesmas chaves.
- Se um teste ativo disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “profile keys” significa nos testes ativos)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o diretório home temporário do teste ativo quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções ativas locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios externos compatíveis de autenticação de CLI para um diretório home temporário de teste; diretórios home ativos preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondagens não toquem seu workspace real no host.

Se quiser depender de chaves em env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile`, ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram ativo (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan ativo

- Teste: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media ativo

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos incluídos de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro do plugin

## Geração de imagem ativa

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis env de provedores ausentes a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API ativas/em env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa cada provedor configurado por meio do runtime compartilhado de geração de imagem:
    - `<provider>:generate`
    - `<provider>:edit` quando o provedor declara suporte a edição
- Provedores incluídos atualmente cobertos:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por env

Para o caminho de CLI distribuído, adicione um smoke de `infer` depois que o teste ativo do provedor/runtime
passar:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Imagem de teste plana e minimalista: um quadrado azul sobre um fundo branco, sem texto." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Isso cobre análise de argumentos da CLI, resolução de configuração/agente padrão, ativação de
plugin incluído, reparo sob demanda de dependência de runtime incluída, o runtime
compartilhado de geração de imagem e a solicitação ativa ao provedor.

## Geração de música ativa

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis env de provedores a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API ativas/em env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da trilha compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo ativo separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por env

## Geração de vídeo ativa

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedor de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores não FAL, uma solicitação text-to-video por provedor, prompt de lagosta de um segundo e um limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência de fila do lado do provedor pode dominar o tempo da release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis env de provedores a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa por padrão chaves de API ativas/em env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de imagem com buffer no sweep compartilhado
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de vídeo com buffer no sweep compartilhado
  - Provedores atuais com `imageToVideo` declarado, mas ignorado, no sweep compartilhado:
    - `vydra` porque o `veo3` incluído é somente texto e o `kling` incluído exige uma URL remota de imagem
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma trilha `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura ativa atual de `videoToVideo`:
    - somente `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atuais com `videoToVideo` declarado, mas ignorado, no sweep compartilhado:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a trilha compartilhada atual Gemini/Veo usa entrada local com buffer e esse caminho não é aceito no sweep compartilhado
    - `openai` porque a trilha compartilhada atual não tem garantias de acesso específico da organização para inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores no sweep padrão, inclusive FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução de smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar substituições somente por env

## Harness ativo de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes ativas compartilhadas de imagem, música e vídeo por meio de um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis env de provedores ausentes a partir de `~/.profile`
  - Restringe automaticamente cada suíte por padrão aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que Heartbeat e comportamento de modo silencioso permaneçam consistentes
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) — suítes unitárias, de integração, QA e Docker
