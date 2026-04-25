---
read_when:
    - Você precisa de uma referência de configuração de modelo provedor por provedor
    - Você quer configurações de exemplo ou comandos de onboarding da CLI para provedores de modelo
summary: Visão geral dos provedores de modelo com configurações de exemplo + fluxos de CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-25T13:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Referência para **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelo, consulte [Models](/pt-BR/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- `agents.defaults.models` atua como lista de permissões quando definido.
- Helpers da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` são metadados nativos do modelo; `contextTokens` é o limite efetivo de runtime.
- Regras de fallback, probes de cooldown e persistência de substituição por sessão: [Model failover](/pt-BR/concepts/model-failover).
- Rotas da família OpenAI são específicas por prefixo: `openai/<model>` usa o provedor direto com chave de API da OpenAI no PI, `openai-codex/<model>` usa OAuth do Codex no PI, e `openai/<model>` mais `agents.defaults.embeddedHarness.runtime: "codex"` usa o harness nativo app-server do Codex. Consulte [OpenAI](/pt-BR/providers/openai)
  e [Codex harness](/pt-BR/plugins/codex-harness). Se a divisão entre provedor/runtime
  estiver confusa, leia primeiro [Agent runtimes](/pt-BR/concepts/agent-runtimes).
- A ativação automática de Plugin segue esse mesmo limite: `openai-codex/<model>` pertence
  ao plugin OpenAI, enquanto o plugin Codex é ativado por
  `embeddedHarness.runtime: "codex"` ou refs legadas `codex/<model>`.
- Runtimes de CLI usam a mesma divisão: escolha refs canônicas de modelo como
  `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, depois defina
  `agents.defaults.embeddedHarness.runtime` como `claude-cli`,
  `google-gemini-cli` ou `codex-cli` quando quiser um backend de CLI local.
  Refs legadas `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migram
  de volta para refs canônicas de provedor com o runtime registrado separadamente.
- GPT-5.5 está disponível por meio de `openai-codex/gpt-5.5` no PI, no
  harness nativo app-server do Codex e na API pública da OpenAI quando o catálogo PI
  incluído expõe `openai/gpt-5.5` para a sua instalação.

## Comportamento do provedor pertencente ao plugin

A maior parte da lógica específica de provedor fica em plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Os plugins controlam onboarding, catálogos de modelo, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de schema de ferramenta, classificação de failover, renovação de OAuth, relatório de uso, perfis de thinking/raciocínio e muito mais.

A lista completa de hooks do SDK de provedor e exemplos de plugins incluídos está em [Provider plugins](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precise de um executor de requisições totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
`capabilities` de runtime do provedor são metadados compartilhados do runner (família do provedor, particularidades de transcrição/ferramentas, dicas de transporte/cache). Isso não é a mesma coisa que o [modelo público de capability](/pt-BR/plugins/architecture#public-capability-model), que descreve o que um plugin registra (inferência de texto, fala etc.).
</Note>

## Rotação de chave de API

- Oferece suporte à rotação genérica de provedor para provedores selecionados.
- Configure várias chaves por meio de:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são tentadas novamente com a próxima chave somente em respostas de limite de taxa (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não sejam de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final retornado vem da última tentativa.

## Provedores integrados (catálogo pi-ai)

O OpenClaw vem com o catálogo pi‑ai. Esses provedores **não**
exigem configuração `models.providers`; basta definir a autenticação e escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, além de `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- O suporte direto da API ao GPT-5.5 depende da versão do catálogo PI incluído na
  sua instalação; verifique com `openclaw models list --provider openai` antes de
  usar `openai/gpt-5.5` sem o runtime app-server do Codex.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O warm-up de WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas `openai/*` Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser uma camada explícita em vez do toggle compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas da OpenAI também preservam `store` do Responses, dicas de prompt-cache e
  formatação de payload compatível com raciocínio da OpenAI; rotas proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente ocultado no OpenClaw porque requisições live à API da OpenAI o rejeitam e o catálogo atual do Codex não o expõe

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, além de `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições públicas diretas à Anthropic oferecem suporte ao toggle compartilhado `/fast` e a `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para Anthropic `service_tier` (`auto` vs `standard_only`)
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw está novamente permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
- O token de configuração da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Ref de modelo PI: `openai-codex/gpt-5.5`
- Ref do harness nativo app-server do Codex: `openai/gpt-5.5` com `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentação do harness nativo app-server do Codex: [Codex harness](/pt-BR/plugins/codex-harness)
- Refs legadas de modelo: `codex/gpt-*`
- Limite de Plugin: `openai-codex/*` carrega o plugin OpenAI; o plugin nativo app-server do Codex
  é selecionado somente pelo runtime Codex harness ou por refs
  legadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas do Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas no tráfego nativo do Codex para
  `chatgpt.com/backend-api`, não em proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo toggle `/fast` e a mesma configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` usa o `contextWindow = 400000` nativo do catálogo Codex e o padrão de runtime `contextTokens = 272000`; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: o OpenAI Codex OAuth é explicitamente compatível para ferramentas/workflows externos como o OpenClaw.
- Use `openai-codex/gpt-5.5` quando quiser a rota Codex OAuth/assinatura; use `openai/gpt-5.5` quando sua configuração com chave de API e catálogo local expuserem a rota da API pública.

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
- [MiniMax](/pt-BR/providers/minimax): acesso via OAuth ou chave de API do MiniMax Coding Plan
- [GLM models](/pt-BR/providers/glm): endpoints Z.AI Coding Plan ou API geral

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw que usa `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa thinking dinâmico do Google. Gemini 3/3.1 omitem um
  `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou o legado `cached_content`) para encaminhar um identificador nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por continuar.
- O OAuth do Gemini CLI é distribuído como parte do plugin `google` incluído.
  - Instale primeiro o Gemini CLI:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Ative: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola client id nem secret no `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso faz fallback para
    `stats`, com `stats.cached` normalizado para OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

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
  não codificado rigidamente no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedor incluídos

| Provedor                | Id                               | Env de autenticação                                          | Modelo de exemplo                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                  |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                           |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                                |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                     |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                                |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                                |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`            |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                             |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                 |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                           |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                   |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                             |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`  |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                                |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                          |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                              |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                         |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                  |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                                |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`    |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`                |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                     |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                           |

Particularidades importantes:

- **OpenRouter** aplica seus cabeçalhos de atribuição do app e marcadores `cache_control` da Anthropic apenas em rotas verificadas `openrouter.ai`. Refs DeepSeek, Moonshot e ZAI são elegíveis ao TTL de cache para prompt caching gerenciado pelo OpenRouter, mas não recebem marcadores de cache da Anthropic. Como é um caminho no estilo proxy compatível com OpenAI, ele ignora a formatação exclusiva da OpenAI nativa (`serviceTier`, `store` do Responses, dicas de prompt-cache, compatibilidade de raciocínio da OpenAI). Refs com backend Gemini mantêm apenas a higienização de assinatura de thinking do proxy-Gemini.
- **Kilo Gateway** com refs baseadas em Gemini segue o mesmo caminho de higienização de proxy-Gemini; `kilocode/kilo/auto` e outras refs sem suporte a raciocínio via proxy ignoram a injeção de raciocínio de proxy.
- **MiniMax** no onboarding por chave de API grava definições explícitas de modelo de chat M2.7 apenas de texto; o entendimento de imagem continua no provedor de mídia `MiniMax-VL-01`, pertencente ao plugin.
- **xAI** usa o caminho xAI Responses. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` vem ativado por padrão; desative com `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** usa os modelos GLM `zai-glm-4.7` / `zai-glm-4.6`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar **provedores**
personalizados ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor incluídos abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` somente quando quiser substituir a
URL base, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é distribuído como plugin de provedor incluído. Use o provedor integrado por
padrão e adicione uma entrada explícita `models.providers.moonshot` somente quando
precisar substituir a URL base ou os metadados do modelo:

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

O Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

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

O legado `kimi/k2p5` continua aceito como id de modelo de compatibilidade.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

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

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação do Volcengine prioriza tanto
linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw volta para o catálogo sem filtro em vez de mostrar um seletor vazio
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

O BytePlus ARK fornece acesso aos mesmos modelos do Volcano Engine para usuários internacionais.

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

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação do BytePlus prioriza tanto
linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw volta para o catálogo sem filtro em vez de mostrar um seletor vazio
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

- OAuth do MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth do MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Chave de API do MiniMax (global): `--auth-choice minimax-global-api`
- Chave de API do MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capability pertencente ao plugin:

- Padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- O entendimento de imagem é `MiniMax-VL-01`, pertencente ao plugin, em ambos os caminhos de autenticação do MiniMax
- A busca na web permanece no id de provedor `minimax`

### LM Studio

O LM Studio é distribuído como um plugin de provedor incluído que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Depois, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativos do LM Studio
para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão.
Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é distribuído como um plugin de provedor incluído e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma necessária (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você ativa
`OLLAMA_API_KEY`, e o plugin de provedor incluído adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelo. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para onboarding, modo nuvem/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um plugin de provedor incluído para servidores
locais/auto-hospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para aderir à descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como um plugin de provedor incluído para servidores
auto-hospedados rápidos compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para aderir à descoberta automática localmente (qualquer valor funciona se o seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

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

Notas:

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa como padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazia cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor por funções `developer` não compatíveis.
- Rotas no estilo proxy compatíveis com OpenAI também ignoram a formatação
  exclusiva da OpenAI nativa: sem `service_tier`, sem `store` de Responses, sem `store` de Completions, sem
  dicas de prompt-cache, sem formatação de payload compatível com raciocínio da OpenAI e sem cabeçalhos
  ocultos de atribuição do OpenClaw.
- Para proxies Completions compatíveis com OpenAI que precisam de campos específicos do fornecedor,
  defina `agents.defaults.models["provider/model"].params.extra_body` (ou
  `extraBody`) para mesclar JSON extra ao corpo da requisição enviada.
- Se `baseUrl` estiver vazia/omitida, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints `openai-completions` não nativos.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [Configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Model failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de nova tentativa
- [Configuration reference](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
