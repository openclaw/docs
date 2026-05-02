---
read_when:
    - Executando testes de fumaça da matriz de modelos ao vivo / back-end de CLI / ACP / provedor de mídia
    - Depuração da resolução de credenciais de testes ao vivo
    - Adicionando um novo teste ao vivo específico de provedor
sidebarTitle: Live tests
summary: 'Testes ao vivo (com acesso à rede): matriz de modelos, backends da CLI, ACP, provedores de mídia, credenciais'
title: 'Testes: suítes ao vivo'
x-i18n:
    generated_at: "2026-05-02T20:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Para início rápido, executores de QA, suítes unitárias/de integração e fluxos Docker, consulte
[Testes](/pt-BR/help/testing). Esta página cobre as suítes de teste **ao vivo** (com acesso à rede):
matriz de modelos, backends de CLI, ACP e testes ao vivo de provedores de mídia, além do
tratamento de credenciais.

## Ao vivo: comandos de teste de fumaça de perfil local

Execute `source ~/.profile` antes de verificações ao vivo ad hoc para que chaves de provedores e caminhos
de ferramentas locais correspondam ao seu shell:

```bash
source ~/.profile
```

Teste de fumaça seguro de mídia:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Teste de fumaça seguro de prontidão de chamada de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` é uma simulação, a menos que `--yes` também esteja presente. Use `--yes` somente
quando você quiser intencionalmente fazer uma chamada real de notificação. Para Twilio, Telnyx e
Plivo, uma verificação de prontidão bem-sucedida exige uma URL pública de webhook; alternativas
locais apenas de loopback/privadas são rejeitadas por design.

## Ao vivo: varredura de capacidade de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos anunciados atualmente** por um Node Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Configuração manual/com pré-condições (a suíte não instala/executa/pareia o aplicativo).
  - Validação `node.invoke` do Gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - Aplicativo Android já conectado + pareado ao Gateway.
  - Aplicativo mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [Aplicativo Android](/pt-BR/platforms/android)

## Ao vivo: teste de fumaça de modelo (chaves de perfil)

Testes ao vivo são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave fornecida.
- “Teste de fumaça do Gateway” nos diz se o pipeline completo Gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no teste de fumaça do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a lista permitida moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista permitida separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o tempo limite de todo o teste de modelo direto. Padrão: 60 minutos.
  - Sondagens de modelo direto executam com paralelismo de 20 vias por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista permitida separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfil e alternativas de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor somente **armazenamento de perfil**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline de agente do Gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: fluxos de repetição de raciocínio + chamada de ferramenta do OpenAI Responses/Codex Responses)

### Camada 2: teste de fumaça do Gateway + agente de dev (o que "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Inicializar um Gateway em processo
  - Criar/corrigir uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar por modelos com chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sondagem de leitura)
    - sondagens opcionais extras de ferramenta (sondagem exec+leitura)
    - caminhos de regressão da OpenAI (somente chamada de ferramenta → acompanhamento) continuam funcionando
- Detalhes da sondagem (para que você possa explicar falhas rapidamente):
  - Sondagem `read`: o teste grava um arquivo nonce no espaço de trabalho e pede ao agente para `read` ele e repetir o nonce.
  - Sondagem `exec+read`: o teste pede ao agente para gravar via `exec` um nonce em um arquivo temporário e então `read` ele de volta.
  - Sondagem de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: lista permitida moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a lista permitida moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do Gateway usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “tudo do OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista permitida separada por vírgulas)
- Sondagens de ferramenta + imagem estão sempre ativadas neste teste ao vivo:
  - Sondagem `read` + sondagem `exec+read` (estresse de ferramenta)
  - sondagem de imagem executa quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (em alto nível):
    - O teste gera um PNG pequeno com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente incorporado encaminha uma mensagem multimodal de usuário ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros permitidos)

<Tip>
Para ver o que você pode testar na sua máquina (e os ids `provider/model` exatos), execute:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Ao vivo: teste de fumaça de backend de CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Os padrões de teste de fumaça específicos do backend ficam na definição `cli-backend.ts` do Plugin proprietário.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do Plugin de backend de CLI proprietário.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (caminhos são injetados no prompt). Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivos de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar pela sondagem de continuidade na mesma sessão Claude Sonnet -> Opus quando o modelo selecionado oferece suporte a um destino de troca. Receitas Docker deixam isso desativado por padrão para confiabilidade agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar pela sondagem de MCP/ferramenta em loopback. Receitas Docker deixam isso desativado por padrão, a menos que solicitado explicitamente.

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Teste de fumaça barato de configuração MCP do Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Isso não pede ao Gemini para gerar uma resposta. Ele grava as mesmas configurações
do sistema que a OpenClaw fornece ao Gemini e então executa `gemini --debug mcp list` para provar que um
servidor `transport: "streamable-http"` salvo é normalizado para o formato MCP HTTP do Gemini
e consegue se conectar a um servidor MCP streamable-HTTP local.

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
- Ele executa o teste de fumaça ao vivo de backend de CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados de teste de fumaça de CLI a partir do Plugin proprietário e então instala o pacote de CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele comprova `claude -p` direto no Docker e então executa dois turnos de backend de CLI do Gateway sem preservar variáveis de env de chave de API da Anthropic. Esta faixa de assinatura desabilita por padrão as sondagens MCP/ferramenta e imagem do Claude, porque atualmente o Claude roteia o uso de aplicativos de terceiros por cobrança de uso extra em vez de limites normais do plano de assinatura.
- O teste de fumaça ao vivo de backend de CLI agora exercita o mesmo fluxo de ponta a ponta para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e então chamada da ferramenta MCP `cron` verificada por meio da CLI do Gateway.
- O teste de fumaça padrão do Claude também corrige a sessão de Sonnet para Opus e verifica se a sessão retomada ainda lembra uma anotação anterior.

## Ao vivo: teste de fumaça de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de vinculação de conversa ACP com um agente ACP ao vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no local uma conversa sintética de canal de mensagens
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar que o acompanhamento chega à transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Sobrescritas:
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
  - Esta faixa usa a superfície `chat.send` do Gateway com campos de rota de origem sintética somente para administradores, para que os testes possam anexar contexto de canal de mensagens sem simular uma entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes integrado do Plugin `acpx` embutido para o agente do ambiente ACP selecionado.
  - A criação de MCP de Cron da sessão vinculada é de melhor esforço por padrão porque ambientes ACP externos podem cancelar chamadas MCP depois que a prova de vinculação/imagem passou; defina `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para tornar essa sondagem Cron pós-vinculação estrita.

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

- O executor Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de vinculação ACP contra os agentes CLI ao vivo agregados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de autenticação CLI correspondente no contêiner e, em seguida, instala a CLI ao vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) se estiver ausente. O backend ACP em si é o pacote `acpx/runtime` embutido do Plugin oficial `acpx`.
- A variante Docker do Droid prepara `~/.factory` para configurações, encaminha `FACTORY_API_KEY` e exige essa chave de API porque a autenticação OAuth/keyring local da Factory não é portátil para dentro do contêiner. Ela usa a entrada de registro integrada `droid exec --output-format acp` do ACPX.
- A variante Docker do OpenCode é uma faixa estrita de regressão de agente único. Ela escreve um modelo padrão temporário `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão `opencode/kimi-k2.6`) depois de carregar `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` exige uma transcrição de assistente vinculada em vez de aceitar o salto genérico pós-vinculação.
- Chamadas diretas à CLI `acpx` são apenas um caminho manual/de contorno para comparar comportamento fora do Gateway. O smoke Docker de vinculação ACP exercita o backend de runtime `acpx` embutido do OpenClaw.

## Ao vivo: smoke do ambiente de teste do servidor de aplicativos Codex

- Objetivo: validar o ambiente de teste Codex pertencente ao Plugin por meio do método normal
  `agent` do Gateway:
  - carregar o Plugin `codex` incluído
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar uma primeira vez de agente do Gateway para `openai/gpt-5.5` com o ambiente Codex forçado
  - enviar uma segunda vez para a mesma sessão OpenClaw e verificar que a thread do servidor de aplicativos
    consegue retomar
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do Gateway
  - opcionalmente executar duas sondagens de shell escaladas revisadas pelo Guardian: um comando benigno
    que deve ser aprovado e um envio de segredo falso que deve ser
    negado para que o agente pergunte de volta
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.5`
- Sondagem de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondagem MCP/ferramenta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondagem Guardian opcional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um ambiente Codex
  quebrado não consiga passar ao recorrer silenciosamente ao PI.
- Autenticação: autenticação do servidor de aplicativos Codex a partir do login local de assinatura do Codex. Smokes
  Docker também podem fornecer `OPENAI_API_KEY` para sondagens não Codex quando aplicável,
  além de `~/.codex/auth.json` e `~/.codex/config.toml` opcionais copiados.

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI Codex
  quando presentes, instala `@openai/codex` em um prefixo npm montado gravável,
  prepara a árvore de código-fonte e então executa apenas o teste ao vivo do ambiente Codex.
- O Docker habilita as sondagens de imagem, MCP/ferramenta e Guardian por padrão. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução de depuração mais estreita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, correspondendo à configuração do teste
  ao vivo para que aliases legados ou fallback para PI não escondam uma regressão do ambiente Codex.

### Receitas ao vivo recomendadas

Listas de permissão estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco no Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de pensamento adaptativo do Google:
  - Se as chaves locais estiverem no perfil de shell: `source ~/.profile`
  - Padrão dinâmico do Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico do Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth do Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google via HTTP (chave de API/autenticação de perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local por shell; ele tem sua própria autenticação e pode se comportar de forma diferente (suporte a streaming/ferramentas/diferença de versão).

## Ao vivo: matriz de modelos (o que cobrimos)

Não há uma “lista de modelos de CI” fixa (ao vivo é opcional), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto de smoke moderno (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do Gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedores:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4.3` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo compatível com “ferramentas” que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo compatível com imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatíveis com visão de Claude/Gemini/OpenAI etc.) para exercitar a sondagem de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos compatíveis com ferramentas+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz ao vivo (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

<Tip>
Não codifique "todos os modelos" na documentação. A lista autoritativa é o que `discoverModels(...)` retornar na sua máquina, mais as chaves que estiverem disponíveis.
</Tip>

## Credenciais (nunca commite)

Testes ao vivo descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funcionar, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem creds”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam a configuração ativa, os arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação de CLI externa compatíveis para uma home temporária de teste por padrão; homes live preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondagens fiquem fora do seu workspace real no host.

Se você quiser depender de chaves de ambiente (por exemplo, exportadas no seu `~/.profile`), execute os testes locais depois de `source ~/.profile`, ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram live (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plano de codificação BytePlus live

- Teste: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Mídia de workflow ComfyUI live

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos incluídos de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade, a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar envio de workflow comfy, polling, downloads ou registro de Plugin

## Geração de imagens live

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todo Plugin registrado de provedor de geração de imagens
  - Carrega variáveis de ambiente ausentes do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa cada provedor configurado pelo runtime compartilhado de geração de imagens:
    - `<provider>:generate`
    - `<provider>:edit` quando o provedor declara suporte a edição
- Provedores incluídos atualmente cobertos:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de ambiente

Para o caminho da CLI entregue, adicione um smoke `infer` depois que o teste live de provedor/runtime passar:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Isso cobre análise de argumentos da CLI, resolução de configuração/agente padrão, ativação de Plugin incluído, o runtime compartilhado de geração de imagens e a requisição live do provedor. Espera-se que as dependências do Plugin estejam presentes antes do carregamento em runtime.

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da pista compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live Comfy separado, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de ambiente

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado incluído de provedor de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores não FAL, uma requisição de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API live/ambiente antes de perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa somente `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local baseada em buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` incluído é somente texto e o `kling` incluído exige uma URL remota de imagem
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` de texto para vídeo mais uma pista `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a pista compartilhada atual Gemini/Veo usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a pista compartilhada atual não tem garantias de acesso a inpaint/remix de vídeo específicas da organização
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de ambiente

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por meio de um único ponto de entrada nativo do repo
  - Carrega automaticamente variáveis de ambiente ausentes do provedor a partir de `~/.profile`
  - Restringe automaticamente cada suíte a provedores que atualmente têm autenticação utilizável por padrão
  - Reutiliza `scripts/test-live.mjs`, então o comportamento de Heartbeat e modo silencioso permanece consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) — suítes unitárias, de integração, QA e Docker
