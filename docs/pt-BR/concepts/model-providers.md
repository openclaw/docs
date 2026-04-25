---
read_when:
    - Você precisa de uma referência de configuração de modelo por provedor
    - Você quer exemplos de configurações ou comandos de onboarding da CLI para provedores de modelos
summary: Visão geral do provedor de modelos com exemplos de configurações + fluxos da CLI
title: Provedores de modelos
x-i18n:
    generated_at: "2026-04-25T18:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0991f256bfeda9086eaa2911cc8056561dce84ee8cb9c16e99602eb396bbee83
    source_path: concepts/model-providers.md
    workflow: 15
---

Referência para **provedores de LLM/modelos** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelo, veja [Models](/pt-BR/concepts/models).

## Regras rápidas

- As referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- `agents.defaults.models` atua como uma lista de permissão quando definido.
- Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` é o metadado nativo do modelo; `contextTokens` é o limite efetivo em tempo de execução.
- Regras de fallback, sondas de cooldown e persistência de substituição por sessão: [Model failover](/pt-BR/concepts/model-failover).
- Rotas da família OpenAI são específicas por prefixo: `openai/<model>` usa o provedor direto por chave de API da OpenAI no PI, `openai-codex/<model>` usa OAuth do Codex no PI, e `openai/<model>` mais `agents.defaults.embeddedHarness.runtime: "codex"` usa o harness nativo do app-server do Codex. Veja [OpenAI](/pt-BR/providers/openai) e [Codex harness](/pt-BR/plugins/codex-harness). Se a divisão entre provedor/runtime estiver confusa, leia [Agent runtimes](/pt-BR/concepts/agent-runtimes) primeiro.
- A ativação automática de Plugin segue esse mesmo limite: `openai-codex/<model>` pertence ao Plugin OpenAI, enquanto o Plugin Codex é ativado por `embeddedHarness.runtime: "codex"` ou referências legadas `codex/<model>`.
- Os runtimes da CLI usam a mesma divisão: escolha referências canônicas de modelo como `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, depois defina `agents.defaults.embeddedHarness.runtime` como `claude-cli`, `google-gemini-cli` ou `codex-cli` quando quiser um backend local da CLI.
  Referências legadas `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migram de volta para referências canônicas de provedor, com o runtime registrado separadamente.
- GPT-5.5 está disponível por meio de `openai/gpt-5.5` para tráfego direto com chave de API, `openai-codex/gpt-5.5` no PI para OAuth do Codex e o harness nativo do app-server do Codex quando `embeddedHarness.runtime: "codex"` estiver definido.

## Comportamento de provedor controlado por Plugin

A maior parte da lógica específica de provedor vive em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Os Plugins controlam onboarding, catálogos de modelos, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de schema de ferramentas, classificação de failover, renovação de OAuth, relatório de uso, perfis de thinking/reasoning e muito mais.

A lista completa de hooks do SDK de provedor e exemplos de Plugins empacotados está em [Provider plugins](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precise de um executor de requisição totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
`capabilities` do runtime do provedor são metadados compartilhados do executor (família do provedor, particularidades de transcript/ferramentas, dicas de transporte/cache). Isso não é o mesmo que o [public capability model](/pt-BR/plugins/architecture#public-capability-model), que descreve o que um Plugin registra (inferência de texto, fala etc.).
</Note>

## Rotação de chaves de API

- Suporta rotação genérica de provedor para provedores selecionados.
- Configure várias chaves via:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são repetidas com a próxima chave apenas em respostas de rate limit (por exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não são de rate limit falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final é retornado a partir da última tentativa.

## Provedores integrados (catálogo pi-ai)

O OpenClaw vem com o catálogo pi‑ai. Esses provedores não exigem configuração em `models.providers`; basta definir a autenticação e escolher um modelo.

### OpenAI

- Provedor: `openai`
- Auth: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, além de `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifique a disponibilidade da conta/modelo com `openclaw models list --provider openai` se uma instalação específica ou chave de API se comportar de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O aquecimento de WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas `openai/*` de Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um nível explícito em vez do alternador compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam apenas ao tráfego OpenAI nativo para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas OpenAI nativas também mantêm `store` de Responses, dicas de cache de prompt e modelagem de payload compatível com reasoning da OpenAI; rotas por proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque requisições live da API OpenAI o rejeitam e o catálogo atual do Codex não o expõe

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, além de `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições públicas diretas à Anthropic suportam o alternador compartilhado `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- Observação da Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como aprovados para essa integração, a menos que a Anthropic publique uma nova política.
- O token de configuração da Anthropic continua disponível como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth do OpenAI Codex

- Provedor: `openai-codex`
- Auth: OAuth (ChatGPT)
- Referência de modelo no PI: `openai-codex/gpt-5.5`
- Referência do harness nativo do app-server do Codex: `openai/gpt-5.5` com `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentação do harness nativo do app-server do Codex: [Codex harness](/pt-BR/plugins/codex-harness)
- Referências legadas de modelo: `codex/gpt-*`
- Limite do Plugin: `openai-codex/*` carrega o Plugin OpenAI; o Plugin nativo do app-server do Codex é selecionado apenas pelo runtime do Codex harness ou por referências legadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo no PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas de Responses do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados apenas ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e a mesma configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` usa o catálogo nativo do Codex com `contextWindow = 400000` e o padrão de runtime `contextTokens = 272000`; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.
- Use `openai-codex/gpt-5.5` quando quiser a rota de OAuth/assinatura do Codex; use `openai/gpt-5.5` quando sua configuração de chave de API e catálogo local expuserem a rota da API pública.

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

- [Qwen Cloud](/pt-BR/providers/qwen): superfície do provedor Qwen Cloud mais mapeamento de endpoints Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): acesso por OAuth ou chave de API ao MiniMax Coding Plan
- [GLM models](/pt-BR/providers/glm): endpoints do Z.AI Coding Plan ou de API geral

### OpenCode

- Auth: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
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
- Auth: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa thinking dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um identificador nativo do provedor `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa ADC do gcloud; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por continuar.
- O OAuth do Gemini CLI é distribuído como parte do Plugin `google` empacotado.
  - Instale o Gemini CLI primeiro:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Ative: `openclaw plugins enable google`
  - Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola um client id nem um secret no `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do gateway.
  - Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a `stats`, com `stats.cached` normalizado para `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Auth: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo de runtime.
- O roteamento exato upstream por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway, não codificado diretamente no OpenClaw.

Veja [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros Plugins de provedor empacotados

| Provedor                | Id                               | Variável de ambiente de Auth                                 | Modelo de exemplo                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Particularidades importantes:

- **OpenRouter** aplica seus cabeçalhos de atribuição do app e marcadores Anthropic `cache_control` apenas em rotas verificadas `openrouter.ai`. Referências DeepSeek, Moonshot e ZAI são elegíveis ao TTL de cache para prompt caching gerenciado pelo OpenRouter, mas não recebem marcadores de cache da Anthropic. Como é um caminho no estilo proxy compatível com OpenAI, ele ignora modelagem exclusiva do OpenAI nativo (`serviceTier`, `store` de Responses, dicas de cache de prompt, compatibilidade de reasoning da OpenAI). Referências baseadas em Gemini mantêm apenas a sanitização de assinatura de pensamento do Gemini por proxy.
- **Kilo Gateway** referências baseadas em Gemini seguem o mesmo caminho de sanitização de Gemini por proxy; `kilocode/kilo/auto` e outras referências por proxy sem suporte a reasoning ignoram a injeção de reasoning por proxy.
- **MiniMax** o onboarding por chave de API grava definições explícitas de modelos de chat apenas para texto da linha M2.7; a compreensão de imagem permanece no provedor de mídia `MiniMax-VL-01`, controlado pelo Plugin.
- **xAI** usa o caminho de Responses da xAI. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` vem ativado por padrão; desative com `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** modelos GLM usam `zai-glm-4.7` / `zai-glm-4.6`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos Plugins de provedor empacotados abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é distribuído como um Plugin de provedor empacotado. Use o provedor integrado por padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo do Kimi K2:

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

Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

- Provedor: `kimi`
- Auth: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como id de modelo para compatibilidade.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do Volcengine prioriza linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo não filtrado em vez de mostrar um seletor vazio com escopo de provedor.

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
- Auth: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do BytePlus prioriza linhas `byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo não filtrado em vez de mostrar um seletor vazio com escopo de provedor.

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
- Auth: `SYNTHETIC_API_KEY`
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
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Veja [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por padrão, a menos que você o defina explicitamente, e `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidades controlada por Plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagem é `MiniMax-VL-01`, controlado pelo Plugin, em ambos os caminhos de autenticação do MiniMax
- A busca na web permanece no id de provedor `minimax`

### LM Studio

O LM Studio é distribuído como um Plugin de provedor empacotado que usa a API nativa:

- Provedor: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL base padrão para inferência: `http://localhost:1234/v1`

Depois defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativos do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão.
Veja [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é distribuído como um Plugin de provedor empacotado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Auth: nenhuma obrigatória (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e depois baixe um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você ativa essa opção com `OLLAMA_API_KEY`, e o Plugin de provedor empacotado adiciona o Ollama diretamente ao `openclaw onboard` e ao seletor de modelos. Veja [/providers/ollama](/pt-BR/providers/ollama) para onboarding, modo cloud/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um Plugin de provedor empacotado para servidores locais/autohospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Auth: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para ativar a descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

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

Veja [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como um Plugin de provedor empacotado para servidores rápidos autohospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Auth: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para ativar a descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

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

Veja [/providers/sglang](/pt-BR/providers/sglang) para detalhes.

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
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazia cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor por papéis `developer` sem suporte.
- Rotas no estilo proxy compatíveis com OpenAI também ignoram a modelagem de requisição exclusiva do OpenAI nativo: sem `service_tier`, sem `store` de Responses, sem `store` de Completions, sem dicas de cache de prompt, sem modelagem de payload compatível com reasoning da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
- Para proxies de Completions compatíveis com OpenAI que precisem de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra ao corpo da requisição de saída.
- Se `baseUrl` estiver vazia/omitida, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints não nativos `openai-completions`.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Veja também: [Configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Model failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de repetição
- [Configuration reference](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
