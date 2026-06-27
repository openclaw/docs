---
read_when:
    - Executando testes de fumaça da matriz de modelos ao vivo / backend da CLI / ACP / media-provider
    - Depuração da resolução de credenciais de teste ao vivo
    - Adicionando um novo teste ao vivo específico de provedor
sidebarTitle: Live tests
summary: 'Testes ao vivo (com acesso à rede): matriz de modelos, backends da CLI, ACP, provedores de mídia, credenciais'
title: 'Teste: suítes ao vivo'
x-i18n:
    generated_at: "2026-06-27T17:36:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Para início rápido, executores de QA, suítes unitárias/de integração e fluxos do Docker, consulte
[Testes](/pt-BR/help/testing). Esta página cobre as suítes de teste **ao vivo** (com acesso à rede):
matriz de modelos, backends de CLI, ACP e testes ao vivo de provedores de mídia, além do
tratamento de credenciais.

## Ao vivo: comandos locais de teste de fumaça

Exporte a chave de provedor necessária no ambiente do processo antes de verificações ao vivo
ad hoc.

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

`voicecall smoke` é uma execução simulada, a menos que `--yes` também esteja presente. Use `--yes` somente
quando você quiser intencionalmente fazer uma chamada de notificação real. Para Twilio, Telnyx e
Plivo, uma verificação de prontidão bem-sucedida requer uma URL pública de Webhook; fallbacks de
loopback local/private-only são rejeitados por design.

## Ao vivo: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos anunciados atualmente** por um nó Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação comando por comando de `node.invoke` do Gateway para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado e pareado ao Gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Ao vivo: teste de fumaça de modelos (chaves de perfil)

Os testes ao vivo são divididos em duas camadas para podermos isolar falhas:

- "Modelo direto" informa se o provedor/modelo consegue responder com a chave fornecida.
- "Teste de fumaça do Gateway" informa se o pipeline completo Gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern`, `small` ou `all` (alias para modern) para executar esta suíte de fato; caso contrário, ela é ignorada para manter `pnpm test:live` focado no teste de fumaça do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a lista de permissão moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` para executar a lista de permissão restrita de modelos pequenos (rotas Qwen 8B/9B compatíveis localmente, Ollama Gemma, OpenRouter Qwen/GLM e Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a lista de permissão moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista de permissão separada por vírgulas)
  - Execuções locais de modelos pequenos do Ollama usam `http://127.0.0.1:11434` por padrão; defina `OPENCLAW_LIVE_OLLAMA_BASE_URL` somente para endpoints LAN, personalizados ou Ollama Cloud.
  - Varreduras modern/all e small usam seus limites selecionados por padrão; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura exaustiva dos perfis selecionados ou um número positivo para um limite menor.
  - Varreduras exaustivas usam `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para o timeout de todo o teste de modelo direto. Padrão: 60 minutos.
  - Sondas de modelo direto executam com paralelismo de 20 vias por padrão; defina `OPENCLAW_LIVE_MODEL_CONCURRENCY` para substituir.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permissão separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir apenas o **armazenamento de perfis**
- Por que isso existe:
  - Separa "a API do provedor está quebrada / a chave é inválida" de "o pipeline do agente do Gateway está quebrado"
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio de OpenAI Responses/Codex Responses + fluxos de chamadas de ferramenta)

### Camada 2: teste de fumaça de Gateway + agente de desenvolvimento (o que "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um Gateway em processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos com chaves e validar:
    - resposta "significativa" (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas extras opcionais de ferramenta (sonda exec+read)
    - caminhos de regressão da OpenAI (somente chamada de ferramenta → acompanhamento) continuam funcionando
- Detalhes das sondas (para você explicar falhas rapidamente):
  - Sonda `read`: o teste grava um arquivo com nonce no workspace e pede ao agente para dar `read` nele e ecoar o nonce de volta.
  - Sonda `exec+read`: o teste pede ao agente para gravar com `exec` um nonce em um arquivo temporário e depois dar `read` nele de volta.
  - Sonda de imagem: o teste anexa um PNG gerado (cat + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `test/helpers/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: lista de permissão moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` para executar a mesma lista de permissão restrita de modelos pequenos pelo pipeline completo Gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a lista de permissão moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all e small do Gateway usam seus limites selecionados por padrão; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura exaustiva selecionada ou um número positivo para um limite menor.
- Como selecionar provedores (evite "tudo do OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permissão separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ativadas neste teste ao vivo:
  - Sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - A sonda de imagem executa quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG pequeno com "CAT" + código aleatório (`test/helpers/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal de usuário ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

<Tip>
Para ver o que você pode testar na sua máquina (e os IDs exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Ao vivo: teste de fumaça de backend de CLI (Claude, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Os padrões de teste de fumaça específicos de backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do Plugin de backend de CLI proprietário.
- Substituições (opcional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt). As receitas do Docker deixam isso desativado por padrão, a menos que seja solicitado explicitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivos de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para optar pela sonda de continuidade na mesma sessão Claude Sonnet -> Opus quando o modelo selecionado oferece suporte a um destino de troca. As receitas do Docker deixam isso desativado por padrão para confiabilidade agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para optar pela sonda de loopback de MCP/ferramenta. As receitas do Docker deixam isso desativado por padrão, a menos que seja solicitado explicitamente.

Exemplo:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Teste de fumaça barato da configuração MCP do Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Isso não pede ao Gemini para gerar uma resposta. Ele grava as mesmas configurações de sistema
que o OpenClaw fornece ao Gemini e depois executa `gemini --debug mcp list` para provar que um
servidor salvo com `transport: "streamable-http"` é normalizado para o formato HTTP MCP do Gemini
e consegue se conectar a um servidor MCP streamable-HTTP local.

Receita do Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas do Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O executor do Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o teste de fumaça ao vivo de backend de CLI dentro da imagem Docker do repo como o usuário não root `node`.
- Ele resolve metadados de teste de fumaça de CLI a partir da extensão proprietária e depois instala o pacote de CLI Linux correspondente (`@anthropic-ai/claude-code` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Ele primeiro prova `claude -p` direto no Docker e depois executa dois turnos de backend de CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Esta rota de assinatura desativa por padrão as sondas MCP/ferramenta e imagem do Claude porque atualmente o Claude encaminha o uso de app de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O teste de fumaça ao vivo de backend de CLI agora exercita o mesmo fluxo de ponta a ponta para Claude e Gemini: turno de texto, turno de classificação de imagem e depois chamada da ferramenta MCP `cron` verificada por meio da CLI do Gateway.
- O teste de fumaça padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica que a sessão retomada ainda lembra uma nota anterior.

## Ao vivo: alcançabilidade do proxy HTTP/2 APNs

- Teste: `src/infra/push-apns-http2.live.test.ts`
- Objetivo: tunelar por um proxy HTTP CONNECT local até o endpoint APNs de sandbox da Apple, enviar a solicitação de validação HTTP/2 de APNs e validar que a resposta real `403 InvalidProviderToken` da Apple volta pelo caminho do proxy.
- Habilitar:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opcional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Ao vivo: teste de fumaça de bind do ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de vinculação de conversa ACP com um agente ACP ao vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular uma conversa sintética de canal de mensagens no local
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
  - Esta faixa usa a superfície `chat.send` do Gateway com campos de rota de origem sintéticos somente para administradores, para que os testes possam anexar contexto de canal de mensagens sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes integrado do Plugin `acpx` embutido para o agente de harness ACP selecionado.
  - A criação de MCP Cron da sessão vinculada é de melhor esforço por padrão porque harnesses ACP externos podem cancelar chamadas MCP depois que a prova de vinculação/imagem passou; defina `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` para tornar essa sondagem Cron pós-vinculação estrita.

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
- Ele prepara o material de autenticação CLI correspondente no contêiner e depois instala a CLI ao vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) se estiver ausente. O backend ACP em si é o pacote `acpx/runtime` embutido do Plugin oficial `acpx`.
- A variante Docker do Droid prepara `~/.factory` para configurações, encaminha `FACTORY_API_KEY` e exige essa chave de API porque a autenticação local OAuth/keyring do Factory não é portátil para o contêiner. Ela usa a entrada de registro integrada do ACPX `droid exec --output-format acp`.
- A variante Docker do OpenCode é uma faixa estrita de regressão de agente único. Ela escreve um modelo padrão temporário em `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (padrão `opencode/kimi-k2.6`), e `pnpm test:docker:live-acp-bind:opencode` exige uma transcrição de assistente vinculada em vez de aceitar o salto pós-vinculação genérico.
- Chamadas diretas à CLI `acpx` são apenas um caminho manual/de contorno para comparar comportamento fora do Gateway. O smoke Docker de vinculação ACP exercita o backend de runtime `acpx` embutido do OpenClaw.

## Ao vivo: smoke do harness de servidor de app do Codex

- Objetivo: validar o harness Codex de propriedade do Plugin por meio do método
  `agent` normal do Gateway:
  - carregar o Plugin `codex` empacotado
  - selecionar `openai/gpt-5.5`, que roteia turnos de agente OpenAI por meio do Codex por padrão
  - enviar um primeiro turno de agente do Gateway para `openai/gpt-5.5` com o harness Codex selecionado
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread do servidor de app
    pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do Gateway
  - opcionalmente executar duas sondagens de shell escaladas revisadas pelo Guardian: um comando
    benigno que deve ser aprovado e um upload de segredo falso que deve ser
    negado para que o agente responda perguntando
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `openai/gpt-5.5`
- Sondagem opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondagem opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondagem opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke força provider/model `agentRuntime.id: "codex"` para que um harness Codex
  quebrado não possa passar ao recorrer silenciosamente ao OpenClaw.
- Autenticação: autenticação do servidor de app Codex a partir do login local da assinatura Codex. Smokes Docker
  também podem fornecer `OPENAI_API_KEY` para sondagens não Codex quando aplicável,
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
  `@openai/codex` em um prefixo npm montado gravável,
  prepara a árvore de origem e depois executa apenas o teste ao vivo do harness Codex.
- O Docker habilita as sondagens de imagem, MCP/ferramenta e Guardian por padrão. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando você precisar de uma execução de depuração mais restrita.
- O Docker usa a mesma configuração explícita de runtime Codex, então aliases legados ou fallback do OpenClaw
  não podem ocultar uma regressão do harness Codex.

### Receitas ao vivo recomendadas

Listas de permissão estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil direto de modelo pequeno:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Perfil de Gateway de modelo pequeno:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke da API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Modelo único, teste de sanidade do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas entre vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste direto de sanidade do Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Foco no Google (chave da API Gemini + Antigravity):
  - Gemini (chave da API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Teste de sanidade de pensamento adaptativo do Google:
  - Padrão dinâmico do Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Orçamento dinâmico do Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Observações:

- `google/...` usa a API Gemini (chave da API).
- `google-antigravity/...` usa a ponte OAuth do Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI local do Gemini na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (chave da API / autenticação de perfil); é isso que a maioria dos usuários quer dizer com "Gemini".
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria autenticação e pode se comportar de modo diferente (suporte a streaming/ferramentas/diferença de versões).

## Ao vivo: matriz de modelos (o que cobrimos)

Não há uma "lista de modelos de CI" fixa (ao vivo é opcional), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de testes de sanidade (chamada de ferramentas + imagem)

Esta é a execução dos "modelos comuns" que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API geral) ou `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Execute o teste de sanidade do Gateway com ferramentas + imagem:
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

- xAI: `xai/grok-4.3` (ou a versão mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo compatível com "tools" que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo compatível com imagens em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatíveis com visão do Claude/Gemini/OpenAI etc.) para exercitar a sondagem de imagem.

### Agregadores / Gateways alternativos

Se você tiver chaves habilitadas, também damos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos compatíveis com ferramentas+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz ao vivo (se tiver credenciais/configuração):

- Integrados: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

<Tip>
Não codifique "todos os modelos" de forma fixa na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina, além das chaves disponíveis.
</Tip>

## Credenciais (nunca faça commit)

Os testes ao vivo descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes ao vivo devem encontrar as mesmas chaves.
- Se um teste ao vivo diz "sem credenciais", depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (isso é o que "chaves de perfil" significa nos testes ao vivo)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home ao vivo preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções locais ao vivo copiam a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação de CLI externa compatíveis para uma home de teste temporária por padrão; homes ao vivo preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondagens fiquem fora do workspace real do seu host.

Se quiser depender de chaves de ambiente, exporte-as antes dos testes locais ou use os
executores Docker abaixo com um `OPENCLAW_PROFILE_FILE` explícito.

## Deepgram ao vivo (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plano de codificação BytePlus ao vivo

- Teste: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Mídia de workflow ComfyUI ao vivo

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos integrados do comfy para imagem, vídeo e `music_generate`
  - Ignora cada capacidade, a menos que `plugins.entries.comfy.config.<capability>` esteja configurado
  - Útil após alterar envio de workflow comfy, polling, downloads ou registro de plugin

## Geração de imagens ao vivo

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins provedores de geração de imagens registrados
  - Usa variáveis de ambiente de provedor já exportadas antes da sondagem
  - Usa chaves de API ao vivo/de ambiente antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
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
- Comportamento de autenticação opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por ambiente

Para o caminho enviado da CLI, adicione um smoke de `infer` depois que o teste ao
vivo de provedor/runtime passar:

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
requisição ao provedor ao vivo. Espera-se que as dependências do Plugin estejam presentes antes do carregamento do runtime.

## Geração de música ao vivo

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado de provedor integrado de geração de música
  - Atualmente cobre Google e MiniMax
  - Usa variáveis de ambiente de provedor já exportadas antes da sondagem
  - Usa chaves de API ao vivo/de ambiente antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo ao vivo Comfy separado, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento de autenticação opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por ambiente

## Geração de vídeo ao vivo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado de provedor integrado de geração de vídeo
  - O padrão é o caminho de smoke seguro para release: provedores não FAL, uma requisição de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Usa variáveis de ambiente de provedor já exportadas antes da sondagem
  - Usa chaves de API ao vivo/de ambiente antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa somente `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local baseada em buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` integrado é somente texto e o `kling` integrado exige uma URL de imagem remota
  - Cobertura Vydra específica do provedor:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa texto para vídeo com `veo3`, além de uma faixa `kling` que usa uma fixture de URL de imagem remota por padrão
  - Cobertura ao vivo atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a faixa compartilhada atual Gemini/Veo usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não tem garantias de acesso a edição de vídeo específicas da organização
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução de smoke agressiva
- Comportamento de autenticação opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por ambiente

## Harness de mídia ao vivo

- Comando: `pnpm test:live:media`
- Objetivo:
  - Executa as suítes ao vivo compartilhadas de imagem, música e vídeo por meio de um único ponto de entrada nativo do repo
  - Usa variáveis de ambiente de provedor já exportadas
  - Restringe automaticamente cada suíte a provedores que atualmente têm autenticação utilizável por padrão
  - Reutiliza `scripts/test-live.mjs`, então o comportamento de Heartbeat e de modo silencioso permanece consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Testes](/pt-BR/help/testing) - suítes unitárias, de integração, QA e Docker
