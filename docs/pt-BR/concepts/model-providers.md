---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de onboarding da CLI para provedores de modelo
sidebarTitle: Model providers
summary: Visão geral de provedores de modelo com configurações de exemplo + fluxos de CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-26T11:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

Referência para **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelos, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Refs de modelo e helpers da CLI">
    - Refs de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` atua como uma lista de permissões quando definido.
    - Helpers da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow` é metadado nativo do modelo; `contextTokens` é o limite efetivo do runtime.
    - Regras de fallback, probes de cooldown e persistência de substituição por sessão: [Failover de modelo](/pt-BR/concepts/model-failover).
  </Accordion>
  <Accordion title="Divisão entre provedor/runtime do OpenAI">
    Rotas da família OpenAI são específicas por prefixo:

    - `openai/<model>` usa o provedor direto de chave de API da OpenAI no Pi.
    - `openai-codex/<model>` usa OAuth do Codex no Pi.
    - `openai/<model>` mais `agents.defaults.agentRuntime.id: "codex"` usa o harness nativo do servidor de app Codex.

    Consulte [OpenAI](/pt-BR/providers/openai) e [Harness do Codex](/pt-BR/plugins/codex-harness). Se a divisão entre provedor/runtime for confusa, leia primeiro [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

    A ativação automática de Plugin segue o mesmo limite: `openai-codex/<model>` pertence ao Plugin OpenAI, enquanto o Plugin Codex é ativado por `agentRuntime.id: "codex"` ou refs legados `codex/<model>`.

    O GPT-5.5 está disponível por meio de `openai/gpt-5.5` para tráfego direto com chave de API, `openai-codex/gpt-5.5` no Pi para OAuth do Codex e no harness nativo do servidor de app Codex quando `agentRuntime.id: "codex"` está definido.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Runtimes de CLI usam a mesma divisão: escolha refs canônicas de modelo como `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, depois defina `agents.defaults.agentRuntime.id` como `claude-cli`, `google-gemini-cli` ou `codex-cli` quando quiser um backend local de CLI.

    Refs legados `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migram de volta para refs canônicas de provedor, com o runtime registrado separadamente.

  </Accordion>
</AccordionGroup>

## Comportamento de provedor controlado por Plugin

A maior parte da lógica específica do provedor vive em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Os Plugins controlam onboarding, catálogos de modelos, mapeamento de auth por variável de ambiente, normalização de transporte/configuração, limpeza de schema de ferramentas, classificação de failover, renovação de OAuth, relatório de uso, perfis de thinking/reasoning e mais.

A lista completa de hooks do SDK de provedor e exemplos de Plugins incluídos está em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precise de um executor de requisição totalmente personalizado usa uma superfície de extensão separada e mais profunda.

<Note>
`capabilities` do runtime do provedor é metadado compartilhado do executor (família de provedor, particularidades de transcript/tooling, dicas de transporte/cache). Não é a mesma coisa que o [modelo público de capability](/pt-BR/plugins/architecture#public-capability-model), que descreve o que um Plugin registra (inferência de texto, fala etc.).
</Note>

## Rotação de chave de API

<AccordionGroup>
  <Accordion title="Origens de chave e prioridade">
    Configure várias chaves por meio de:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, maior prioridade)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
    - `<PROVIDER>_API_KEY` (chave primária)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)

    Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback. A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.

  </Accordion>
  <Accordion title="Quando a rotação entra em ação">
    - Requisições são repetidas com a próxima chave apenas em respostas de rate limit (por exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não sejam de rate limit falham imediatamente; nenhuma rotação de chave é tentada.
    - Quando todas as chaves candidatas falham, o erro final retornado vem da última tentativa.
  </Accordion>
</AccordionGroup>

## Provedores incluídos (catálogo pi-ai)

O OpenClaw inclui o catálogo pi-ai. Esses provedores **não** exigem configuração em `models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Auth: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifique disponibilidade de conta/modelo com `openclaw models list --provider openai` se uma instalação específica ou chave de API se comportar de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O aquecimento do WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas `openai/*` Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um nível explícito em vez do toggle compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam apenas ao tráfego OpenAI nativo para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas OpenAI também preservam `store` do Responses, dicas de cache de prompt e modelagem de payload compatível com reasoning da OpenAI; rotas por proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque requisições live da API OpenAI o rejeitam e o catálogo atual do Codex não o expõe

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições públicas diretas da Anthropic oferecem suporte ao toggle compartilhado `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- A configuração preferida do Claude CLI mantém a ref de modelo canônica e seleciona o backend
  de CLI separadamente: `anthropic/claude-opus-4-7` com
  `agents.defaults.agentRuntime.id: "claude-cli"`. Refs legados
  `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade.

<Note>
A equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que a Anthropic publique uma nova política. O token de configuração da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provedor: `openai-codex`
- Auth: OAuth (ChatGPT)
- Ref de modelo no Pi: `openai-codex/gpt-5.5`
- Ref do harness nativo do servidor de app Codex: `openai/gpt-5.5` com `agents.defaults.agentRuntime.id: "codex"`
- Documentação do harness nativo do servidor de app Codex: [Harness do Codex](/pt-BR/plugins/codex-harness)
- Refs legados de modelo: `codex/gpt-*`
- Limite do Plugin: `openai-codex/*` carrega o Plugin OpenAI; o Plugin nativo do servidor de app Codex é selecionado apenas pelo runtime do harness Codex ou por refs legados `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo no Pi via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados apenas ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo toggle `/fast` e configuração `params.fastMode` que `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` usa o catálogo nativo do Codex com `contextWindow = 400000` e runtime padrão `contextTokens = 272000`; substitua o limite do runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: OpenAI Codex OAuth é explicitamente compatível para ferramentas/fluxos externos como o OpenClaw.
- Use `openai-codex/gpt-5.5` quando quiser a rota de OAuth/assinatura do Codex; use `openai/gpt-5.5` quando sua configuração com chave de API e catálogo local expuserem a rota da API pública.

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

<CardGroup cols={3}>
  <Card title="Modelos GLM" href="/pt-BR/providers/glm">
    Plano Coding da Z.AI ou endpoints gerais de API.
  </Card>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    OAuth do plano Coding do MiniMax ou acesso por chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Superfície de provedor do Qwen Cloud, além de mapeamento de endpoint do Alibaba DashScope e do Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor do runtime Zen: `opencode`
- Provedor do runtime Go: `opencode-go`
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
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa thinking dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou legado `cached_content`) para encaminhar um identificador nativo do provedor `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth

<Warning>
OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições na conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se decidir prosseguir.
</Warning>

O OAuth do Gemini CLI é distribuído como parte do Plugin `google` incluído.

<Steps>
  <Step title="Instalar o Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Ativar o Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Fazer login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um client id nem um secret em `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do Gateway.

  </Step>
  <Step title="Definir projeto (se necessário)">
    Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway.
  </Step>
</Steps>

Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a `stats`, com `stats.cached` normalizado para `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Auth: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint correspondente da Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo de runtime.
- O roteamento exato upstream por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway, não codificado no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros Plugins de provedor incluídos

| Provedor                | Id                               | Variável de auth                                               | Modelo de exemplo                               |
| ----------------------- | -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                             | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                             | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                                | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                             | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`           | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                                 | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                          | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                             | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                           | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                      | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                              | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                             | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                               | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                           | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                              | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY`   | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                              | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                             | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                               | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                           | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                       | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                  | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                               | `xiaomi/mimo-v2-flash`                          |

#### Particularidades que valem a pena conhecer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de app e marcadores `cache_control` da Anthropic apenas em rotas verificadas de `openrouter.ai`. Refs DeepSeek, Moonshot e ZAI são elegíveis para TTL de cache no cache de prompt gerenciado pelo OpenRouter, mas não recebem marcadores de cache da Anthropic. Como é um caminho em estilo proxy compatível com OpenAI, ele ignora a modelagem exclusiva do OpenAI nativo (`serviceTier`, `store` do Responses, dicas de cache de prompt, compatibilidade com reasoning da OpenAI). Refs com backend Gemini mantêm apenas a sanitização de assinatura de pensamento do Gemini via proxy.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Refs com backend Gemini seguem o mesmo caminho de sanitização do Gemini via proxy; `kilocode/kilo/auto` e outras refs sem suporte a reasoning via proxy ignoram a injeção de reasoning por proxy.
  </Accordion>
  <Accordion title="MiniMax">
    O onboarding com chave de API grava definições explícitas de modelo de chat M2.7 somente texto; o entendimento de imagem continua no provedor de mídia `MiniMax-VL-01` controlado pelo Plugin.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho xAI Responses. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` vem ativado por padrão; desative via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Modelos GLM usam `zai-glm-4.7` / `zai-glm-4.6`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar **provedores personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos Plugins de provedor incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

Moonshot é fornecido como um Plugin de provedor incluído. Use o provedor interno por padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Auth: `MOONSHOT_API_KEY`
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

O legado `kimi/k2p5` continua aceito como ID de modelo por compatibilidade.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

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

O onboarding usa por padrão a superfície coding, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo do onboarding/configure, a opção de auth Volcengine prefere linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw faz fallback para o catálogo sem filtro em vez de mostrar um seletor vazio restrito ao provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Modelos coding (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

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

O onboarding usa por padrão a superfície coding, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo do onboarding/configure, a opção de auth BytePlus prefere linhas `byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw faz fallback para o catálogo sem filtro em vez de mostrar um seletor vazio restrito ao provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)
  </Tab>
  <Tab title="Modelos coding (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic fornece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

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

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chave de API MiniMax (Global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

<Note>
No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o thinking por padrão a menos que você o defina explicitamente, e `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capability controlada por Plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- O entendimento de imagem é o `MiniMax-VL-01` controlado pelo Plugin em ambos os caminhos de autenticação do MiniMax
- A pesquisa web permanece no id de provedor `minimax`

### LM Studio

O LM Studio é fornecido como um Plugin de provedor incluído que usa a API nativa:

- Provedor: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Depois, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa os endpoints nativos do LM Studio `/api/v1/models` e `/api/v1/models/load` para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é fornecido como um Plugin de provedor incluído e usa a API nativa do Ollama:

- Provedor: `ollama`
- Auth: Nenhuma exigida (servidor local)
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

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você faz opt-in com `OLLAMA_API_KEY`, e o Plugin de provedor incluído adiciona o Ollama diretamente ao `openclaw onboard` e ao seletor de modelo. Consulte [/providers/ollama](/pt-BR/providers/ollama) para onboarding, modo local/nuvem e configuração personalizada.

### vLLM

O vLLM é fornecido como um Plugin de provedor incluído para servidores locais/autohospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Auth: Opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para fazer opt-in da descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir auth):

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

O SGLang é fornecido como um Plugin de provedor incluído para servidores rápidos autohospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Auth: Opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para fazer opt-in da descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir auth):

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
            name: "Modelo local",
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

<AccordionGroup>
  <Accordion title="Campos opcionais padrão">
    Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais. Quando omitidos, o OpenClaw usa por padrão:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendação: defina valores explícitos que correspondam aos limites do seu proxy/modelo.

  </Accordion>
  <Accordion title="Regras de modelagem de rota por proxy">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor por roles `developer` sem suporte.
    - Rotas em estilo proxy compatíveis com OpenAI também ignoram a modelagem exclusiva do OpenAI nativo: sem `service_tier`, sem `store` do Responses, sem `store` do Completions, sem dicas de cache de prompt, sem modelagem de payload compatível com reasoning da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies Completions compatíveis com OpenAI que precisem de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra no corpo da requisição de saída.
    - Para controles de chat template do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O OpenClaw envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de thinking da sessão está desativado.
    - Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão do OpenAI (que resolve para `api.openai.com`).
    - Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints `openai-completions` não nativos.
  </Accordion>
</AccordionGroup>

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [Configuração](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de repetição
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Providers](/pt-BR/providers) — guias de configuração por provedor
