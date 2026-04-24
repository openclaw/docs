---
read_when:
    - Você precisa de uma referência de configuração de modelo por provedor
    - Você quer exemplos de configuração ou comandos de onboarding pela CLI para provedores de modelo
summary: Visão geral dos provedores de modelo com exemplos de configuração + fluxos de CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-24T05:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce2fc2b932ddc5d5b6066b70c4b0090868ad450e193f48d89daee9e65ceb9200
    source_path: concepts/model-providers.md
    workflow: 15
---

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelo, consulte [/concepts/models](/pt-BR/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- `agents.defaults.models` atua como uma allowlist quando definido.
- Helpers de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` é metadado nativo do modelo; `contextTokens` é o limite efetivo de runtime.
- Regras de fallback, probes de cooldown e persistência de sobrescrita de sessão: [Failover de modelo](/pt-BR/concepts/model-failover).
- Rotas da família OpenAI são específicas por prefixo: `openai/<model>` usa o provedor direto com chave de API OpenAI em Pi, `openai-codex/<model>` usa OAuth do Codex em Pi, e `openai/<model>` mais `agents.defaults.embeddedHarness.runtime: "codex"` usa o harness nativo app-server do Codex. Consulte [OpenAI](/pt-BR/providers/openai) e [Harness Codex](/pt-BR/plugins/codex-harness).
- O GPT-5.5 está atualmente disponível por rotas de assinatura/OAuth:
  `openai-codex/gpt-5.5` em Pi ou `openai/gpt-5.5` com o harness app-server do Codex. A rota direta com chave de API para `openai/gpt-5.5` será compatível quando
  a OpenAI ativar o GPT-5.5 na API pública; até lá, use modelos compatíveis com API
  como `openai/gpt-5.4` para configurações com `OPENAI_API_KEY`.

## Comportamento de provedor controlado por Plugin

A maior parte da lógica específica do provedor vive em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Os Plugins controlam onboarding, catálogos de modelos, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de schema de ferramentas, classificação de failover, renovação de OAuth, relatórios de uso, perfis de pensamento/raciocínio e mais.

A lista completa de hooks do SDK de provedor e exemplos de Plugins empacotados está em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precise de um executor de requisição totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
`capabilities` do runtime do provedor é metadado compartilhado do executor (família do provedor, peculiaridades de transcrição/ferramentas, dicas de transporte/cache). Isso não é o mesmo que o [modelo público de capacidade](/pt-BR/plugins/architecture#public-capability-model), que descreve o que um Plugin registra (inferência de texto, fala etc.).
</Note>

## Rotação de chave de API

- Oferece suporte a rotação genérica de provedor para provedores selecionados.
- Configure várias chaves via:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescrita live única, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores do Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove duplicatas.
- As requisições são repetidas com a próxima chave apenas em respostas de limite de taxa (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, ou mensagens periódicas de limite de uso).
- Falhas que não sejam de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final da última tentativa é retornado.

## Provedores internos (catálogo pi-ai)

O OpenClaw inclui o catálogo pi‑ai. Esses provedores não exigem
configuração em `models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (sobrescrita única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- O suporte direto à API do GPT-5.5 já está preparado aqui para quando a OpenAI expuser o GPT-5.5 na API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Sobrescreva por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O warm-up de WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas de Responses `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser uma tier explícita em vez da chave compartilhada `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas ao tráfego nativo OpenAI para `api.openai.com`, não
  a proxies genéricos compatíveis com OpenAI
- Rotas nativas OpenAI também mantêm `store` de Responses, dicas de prompt-cache e
  formatação de payload compatível com raciocínio da OpenAI; rotas proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente ocultado no OpenClaw porque requisições live da API OpenAI o rejeitam e o catálogo atual do Codex não o expõe

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (sobrescrita única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições diretas públicas da Anthropic oferecem suporte à chave compartilhada `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw é novamente permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
- O setup-token da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Referência de modelo Pi: `openai-codex/gpt-5.5`
- Referência nativa do harness app-server Codex: `openai/gpt-5.5` com `agents.defaults.embeddedHarness.runtime: "codex"`
- Referências legadas de modelo: `codex/gpt-*`
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Sobrescreva por modelo Pi via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas ao tráfego nativo Codex para
  `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha a mesma chave `/fast` e a mesma configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` mantém o valor nativo `contextWindow = 1000000` e um `contextTokens = 272000` de runtime padrão; sobrescreva o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: OpenAI Codex OAuth tem suporte explícito para ferramentas/fluxos de trabalho externos como o OpenClaw.
- O acesso atual ao GPT-5.5 usa esta rota de OAuth/assinatura até que a OpenAI ative o GPT-5.5 na API pública.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Outras opções hospedadas no estilo assinatura

- [Qwen Cloud](/pt-BR/providers/qwen): superfície de provedor Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): acesso MiniMax Coding Plan por OAuth ou chave de API
- [GLM Models](/pt-BR/providers/glm): endpoints Z.AI Coding Plan ou endpoints gerais de API

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (sobrescrita única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou legado `cached_content`) para encaminhar um identificador nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições na conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se decidir prosseguir.
- O OAuth do Gemini CLI é distribuído como parte do Plugin `google` empacotado.
  - Instale o Gemini CLI primeiro:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Ative: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola um client id nem secret em `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recua para
    `stats`, com `stats.cached` normalizado em `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint correspondente da Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticação: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  de runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway,
  não codificado de forma fixa no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros Plugins de provedor empacotados

| Provedor                | ID                               | Env de autenticação                                         | Modelo de exemplo                              |
| ----------------------- | -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                          | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                          | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                             | —                                              |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`        | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                              | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                          | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                        | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                   | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                           | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                          | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                            | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                        | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                           | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                           | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                          | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                            | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                        | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                    | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                               | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                            | `xiaomi/mimo-v2-flash`                         |

Peculiaridades que valem conhecer:

- **OpenRouter** aplica seus cabeçalhos de atribuição de app e marcadores Anthropic `cache_control` apenas em rotas verificadas `openrouter.ai`. Como é um caminho no estilo proxy compatível com OpenAI, ele ignora a formatação exclusiva do OpenAI nativo (`serviceTier`, `store` de Responses, dicas de prompt-cache, compatibilidade de raciocínio da OpenAI). Referências com suporte de Gemini mantêm apenas a sanitização de assinatura de pensamento do Gemini em proxy.
- **Kilo Gateway** referências com suporte de Gemini seguem o mesmo caminho de sanitização de Gemini em proxy; `kilocode/kilo/auto` e outras referências em proxy sem suporte a raciocínio ignoram a injeção de raciocínio em proxy.
- **MiniMax** o onboarding por chave de API grava definições explícitas de modelo M2.7 com `input: ["text", "image"]`; o catálogo empacotado mantém referências de chat apenas com texto até que essa configuração seja materializada.
- **xAI** usa o caminho xAI Responses. `/fast` ou `params.fastMode: true` reescrevem `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` vem ativado por padrão; desative com `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** modelos GLM usam `zai-glm-4.7` / `zai-glm-4.6`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar **provedores**
personalizados ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos Plugins de provedor empacotados abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` apenas quando quiser sobrescrever a
URL base, cabeçalhos ou lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é distribuído como um Plugin de provedor empacotado. Use o provedor interno por
padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando
precisar sobrescrever a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic do Moonshot AI:

- Provedor: `kimi`
- Autenticação: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como ID de modelo de compatibilidade.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) oferece acesso ao Doubao e a outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Autenticação: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `volcengine/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configure, a escolha de autenticação Volcengine prefere tanto
linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recua para o catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provedor.

Modelos disponíveis:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internacional)

O BytePlus ARK oferece acesso aos mesmos modelos do Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (coding: `byteplus-plan`)
- Autenticação: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `byteplus/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configure, a escolha de autenticação BytePlus prefere tanto
linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recua para o catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provedor.

Modelos disponíveis:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

O Synthetic fornece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

- Provedor: `synthetic`
- Autenticação: `SYNTHETIC_API_KEY`
- Modelo de exemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

O MiniMax é configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chave de API MiniMax (global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidade controlada por Plugin:

- Padrões de texto/chat ficam em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- O entendimento de imagem é `MiniMax-VL-01`, controlado por Plugin, em ambos os caminhos de autenticação MiniMax
- A busca na web permanece no ID de provedor `minimax`

### LM Studio

O LM Studio é distribuído como um Plugin de provedor empacotado que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Depois defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativos do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão.
Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é distribuído como um Plugin de provedor empacotado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma necessária (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e depois faça pull de um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por isso com
`OLLAMA_API_KEY`, e o Plugin de provedor empacotado adiciona o Ollama diretamente a
`openclaw onboard` e ao seletor de modelo. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para onboarding, modo cloud/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um Plugin de provedor empacotado para servidores
compatíveis com OpenAI locais/hospedados por você:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como um Plugin de provedor empacotado para servidores
compatíveis com OpenAI rápidos e hospedados por você:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulte [/providers/sglang](/pt-BR/providers/sglang) para detalhes.

### Proxies locais (LM Studio, vLLM, LiteLLM etc.)

Exemplo (compatível com OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Observações:

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa por padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` não compatíveis.
- Rotas no estilo proxy compatíveis com OpenAI também ignoram a formatação de requisição exclusiva do OpenAI nativo:
  sem `service_tier`, sem `store` de Responses, sem dicas de prompt-cache, sem
  formatação de payload compatível com raciocínio da OpenAI e sem cabeçalhos
  ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão do OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints `openai-completions` não nativos.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [/gateway/configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de repetição
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
