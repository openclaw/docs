---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer exemplos de configurações ou comandos de integração da CLI para provedores de modelo
sidebarTitle: Model providers
summary: Visão geral do provedor de modelos com configurações de exemplo + fluxos da CLI
title: Provedores de modelos
x-i18n:
    generated_at: "2026-05-06T09:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

Referência para **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelos, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Refs de modelo e auxiliares da CLI">
    - Refs de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` atua como uma allowlist quando definido.
    - Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` definem padrões no nível do provedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` os substituem por modelo.
    - Regras de fallback, probes de cooldown e persistência de substituição de sessão: [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>
  <Accordion title="Adicionar autenticação de provedor não altera seu modelo primário">
    `openclaw configure` preserva um `agents.defaults.model.primary` existente quando você adiciona ou reautentica um provedor. Plugins de provedor ainda podem retornar um modelo padrão recomendado no patch de configuração de autenticação, mas configure trata isso como "tornar este modelo disponível" quando um modelo primário já existe, não como "substituir o modelo primário atual".

    Para trocar intencionalmente o modelo padrão, use `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Divisão entre provedor e runtime da OpenAI">
    Rotas da família OpenAI são específicas por prefixo:

    - `openai/<model>` mais `agents.defaults.agentRuntime.id: "codex"` usa o harness nativo do servidor de aplicativo Codex. Essa é a configuração usual de assinatura ChatGPT/Codex.
    - `openai-codex/<model>` usa OAuth do Codex no PI.
    - `openai/<model>` sem uma substituição de runtime do Codex usa o provedor direto por chave de API da OpenAI no PI.

    Consulte [OpenAI](/pt-BR/providers/openai) e [Harness do Codex](/pt-BR/plugins/codex-harness). Se a divisão entre provedor e runtime estiver confusa, leia primeiro [Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

    A ativação automática de Plugin segue o mesmo limite: `openai-codex/<model>` pertence ao Plugin da OpenAI, enquanto o Plugin do Codex é ativado por `agentRuntime.id: "codex"` ou refs legadas `codex/<model>`.

    GPT-5.5 está disponível pelo harness nativo do servidor de aplicativo Codex quando `agentRuntime.id: "codex"` está definido, por `openai-codex/gpt-5.5` no PI para OAuth do Codex, e por `openai/gpt-5.5` no PI para tráfego direto por chave de API quando sua conta o expõe.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Runtimes de CLI usam a mesma divisão: escolha refs canônicas de modelo como `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, depois defina `agents.defaults.agentRuntime.id` como `claude-cli`, `google-gemini-cli` ou `codex-cli` quando quiser um backend de CLI local.

    Refs legadas `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migram de volta para refs canônicas de provedor com o runtime registrado separadamente.

  </Accordion>
</AccordionGroup>

## Comportamento de provedor pertencente ao Plugin

A maior parte da lógica específica de provedor vive em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Plugins são donos de onboarding, catálogos de modelos, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de schema de ferramentas, classificação de failover, refresh de OAuth, relatórios de uso, perfis de pensamento/raciocínio e mais.

A lista completa de hooks do SDK de provedor e exemplos de Plugins incluídos fica em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precisa de um executor de requisição totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
O comportamento de runner pertencente ao provedor vive em hooks explícitos de provedor, como política de replay, normalização de schema de ferramentas, encapsulamento de stream e auxiliares de transporte/requisição. O conjunto estático legado `ProviderPlugin.capabilities` existe apenas para compatibilidade e não é mais lido pela lógica compartilhada do runner.
</Note>

## Rotação de chaves de API

<AccordionGroup>
  <Accordion title="Fontes e prioridade de chaves">
    Configure várias chaves via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
    - `<PROVIDER>_API_KEY` (chave primária)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo, `<PROVIDER>_API_KEY_1`)

    Para provedores Google, `GOOGLE_API_KEY` também é incluído como fallback. A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.

  </Accordion>
  <Accordion title="Quando a rotação é acionada">
    - As requisições são tentadas novamente com a próxima chave apenas em respostas de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não são de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
    - Quando todas as chaves candidatas falham, o erro final é retornado a partir da última tentativa.

  </Accordion>
</AccordionGroup>

## Provedores integrados (catálogo pi-ai)

O OpenClaw é distribuído com o catálogo pi-ai. Estes provedores **não** exigem configuração de `models.providers`; basta definir a autenticação e escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifique a disponibilidade da conta/modelo com `openclaw models list --provider openai` se uma instalação ou chave de API específica se comportar de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O aquecimento de WebSocket de Responses da OpenAI vem habilitado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser habilitado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas de Responses `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um tier explícito em vez do toggle compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam apenas ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas da OpenAI também mantêm `store` de Responses, dicas de cache de prompt e formatação de payload compatível com raciocínio da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` é suprimido intencionalmente no OpenClaw porque requisições live da API da OpenAI o rejeitam e o catálogo atual do Codex não o expõe

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições públicas diretas da Anthropic aceitam o toggle compartilhado `/fast` e `params.fastMode`, incluindo tráfego por chave de API e autenticado por OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- A configuração preferida da Claude CLI mantém a ref de modelo canônica e seleciona o
  backend de CLI separadamente: `anthropic/claude-opus-4-7` com
  `agents.defaults.agentRuntime.id: "claude-cli"`. Refs legadas
  `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade.

<Note>
A equipe da Anthropic nos informou que o uso da Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. O setup-token da Anthropic continua disponível como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere a reutilização da Claude CLI e `claude -p` quando disponíveis.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth do OpenAI Codex

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Ref de modelo do PI: `openai-codex/gpt-5.5`
- Ref do harness nativo do servidor de aplicativo Codex: `openai/gpt-5.5` com `agents.defaults.agentRuntime.id: "codex"`
- Documentação do harness nativo do servidor de aplicativo Codex: [Harness do Codex](/pt-BR/plugins/codex-harness)
- Refs de modelo legadas: `codex/gpt-*`
- Limite do Plugin: `openai-codex/*` carrega o Plugin da OpenAI; o Plugin nativo do servidor de aplicativo Codex é selecionado apenas pelo runtime do harness do Codex ou por refs legadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo do PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas de Responses do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados apenas ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo toggle `/fast` e a configuração `params.fastMode` que `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` usa `contextWindow = 400000` nativo do catálogo do Codex e o runtime padrão `contextTokens = 272000`; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.
- Para a rota comum de assinatura mais runtime nativo do Codex, entre com autenticação `openai-codex`, mas configure `openai/gpt-5.5` mais `agents.defaults.agentRuntime.id: "codex"`.
- Use `openai-codex/gpt-5.5` apenas quando quiser a rota OAuth/assinatura do Codex pelo PI; use `openai/gpt-5.5` sem a substituição de runtime do Codex quando sua configuração por chave de API e catálogo local expuserem a rota de API pública.
- Refs mais antigas `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` e `openai-codex/gpt-5.3*` são suprimidas porque contas OAuth do ChatGPT/Codex as rejeitam; use `openai-codex/gpt-5.5` ou a rota de runtime nativo do Codex em vez disso.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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

### Outras opções hospedadas no estilo de assinatura

<CardGroup cols={3}>
  <Card title="Modelos GLM" href="/pt-BR/providers/glm">
    Z.AI Coding Plan ou endpoints gerais de API.
  </Card>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    OAuth do MiniMax Coding Plan ou acesso por chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Superfície do provedor Qwen Cloud mais mapeamento de endpoints do Alibaba DashScope e Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
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
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: fallback de `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: a configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` é aceito e normalizado para o id ativo da API Gemini do Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Pensamento: `/think adaptive` usa o pensamento dinâmico do Google. Gemini 3/3.1 omite um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um identificador nativo do provedor `cachedContents/...`; acertos de cache do Gemini aparecem como OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth

<Warning>
O OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas do Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se escolher prosseguir.
</Warning>

O OAuth do Gemini CLI é distribuído como parte do plugin `google` incluído no pacote.

<Steps>
  <Step title="Instalar Gemini CLI">
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
  <Step title="Habilitar plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um id de cliente ou segredo em `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do gateway.

  </Step>
  <Step title="Definir projeto (se necessário)">
    Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  </Step>
</Steps>

As respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a `stats`, com `stats.cached` normalizado para OpenClaw `cacheRead`.

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
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticação: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo de fallback estático inclui `kilocode/kilo/auto`; a descoberta ativa em `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo em tempo de execução.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é de responsabilidade do Kilo Gateway, não codificado diretamente no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedores incluídos no pacote

| Provedor                | Id                               | Env de autenticação                                          | Modelo de exemplo                            |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`              |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                       |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                            |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`        |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                 |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                            |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                            |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`        |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                         |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                             |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                       |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`               |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                         |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`   |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                            |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                      |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                          |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                     |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`              |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                            |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`            |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                               |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                       |

#### Particularidades que vale conhecer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de aplicativo e marcadores Anthropic `cache_control` somente em rotas `openrouter.ai` verificadas. Referências DeepSeek, Moonshot e ZAI são elegíveis para TTL de cache no cache de prompts gerenciado pelo OpenRouter, mas não recebem marcadores de cache Anthropic. Como um caminho em estilo proxy compatível com OpenAI, ele ignora a modelagem exclusiva da OpenAI nativa (`serviceTier`, Responses `store`, dicas de cache de prompt, compatibilidade de raciocínio da OpenAI). Referências baseadas em Gemini mantêm somente a higienização de assinatura de pensamento proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referências baseadas em Gemini seguem o mesmo caminho de higienização proxy-Gemini; `kilocode/kilo/auto` e outras referências sem suporte a raciocínio via proxy ignoram a injeção de raciocínio via proxy.
  </Accordion>
  <Accordion title="MiniMax">
    A integração com chave de API grava definições explícitas de modelo de chat M2.7 somente texto; a compreensão de imagem permanece no provedor de mídia `MiniMax-VL-01` pertencente ao Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    IDs de modelo usam um namespace `nvidia/<vendor>/<model>` (por exemplo, `nvidia/nvidia/nemotron-...` junto com `nvidia/moonshotai/kimi-k2.5`); seletores preservam a composição literal `<provider>/<model-id>`, enquanto a chave canônica enviada à API permanece com prefixo único.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho xAI Responses. `grok-4.3` é o modelo de chat padrão incluído. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` vem ativado por padrão; desative via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    É distribuído como o Plugin provedor `cerebras` incluído. GLM usa `zai-glm-4.7`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provedores via `models.providers` (URL personalizada/base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos Plugins provedores incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas `models.providers.<id>` somente quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

As verificações de capacidade de modelo do Gateway também leem metadados explícitos de `models.providers.<id>.models[]`. Se um modelo personalizado ou de proxy aceita imagens, defina `input: ["text", "image"]` nesse modelo para que o WebChat e os caminhos de anexo originados em nó passem imagens como entradas nativas do modelo em vez de referências de mídia somente texto.

### Moonshot AI (Kimi)

Moonshot é distribuído como um Plugin provedor incluído. Use o provedor integrado por padrão e adicione uma entrada explícita `models.providers.moonshot` somente quando precisar substituir a URL base ou os metadados do modelo:

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

### Codificação com Kimi

Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

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

O `kimi/k2p5` legado continua aceito como um ID de modelo de compatibilidade.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornece acesso ao Doubao e outros modelos na China.

- Provedor: `volcengine` (codificação: `volcengine-plan`)
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

A integração inicial usa a superfície de codificação por padrão, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração inicial/configuração, a opção de autenticação Volcengine prefere linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio limitado ao provedor.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internacional)

BytePlus ARK fornece acesso aos mesmos modelos do Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (codificação: `byteplus-plan`)
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

A integração inicial usa a superfície de codificação por padrão, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração inicial/configuração, a opção de autenticação BytePlus prefere linhas `byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio limitado ao provedor.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
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

MiniMax é configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chave de API MiniMax (global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

<Note>
No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o pensamento por padrão, a menos que você o defina explicitamente, e `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capacidades pertencente ao Plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagens é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagens pertence ao Plugin `MiniMax-VL-01` em ambos os caminhos de autenticação MiniMax
- A busca na Web permanece no ID de provedor `minimax`

### LM Studio

LM Studio é distribuído como um Plugin de provedor incluído que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base de inferência padrão: `http://localhost:1234/v1`

Em seguida, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa os endpoints nativos `/api/v1/models` e `/api/v1/models/load` do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão. Se você quiser que o carregamento JIT, TTL e despejo automático do LM Studio controlem o ciclo de vida do modelo, defina `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

Ollama é distribuído como um Plugin de provedor incluído e usa a API nativa do Ollama:

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

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você aceita usar `OLLAMA_API_KEY`, e o Plugin de provedor incluído adiciona o Ollama diretamente ao `openclaw onboard` e ao seletor de modelo. Consulte [/providers/ollama](/pt-BR/providers/ollama) para integração inicial, modo em nuvem/local e configuração personalizada.

### vLLM

vLLM é distribuído como um Plugin de provedor incluído para servidores locais/auto-hospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para aceitar a descoberta automática localmente (qualquer valor funciona se o servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Em seguida, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

SGLang é distribuído como um Plugin de provedor incluído para servidores rápidos auto-hospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para aceitar a descoberta automática localmente (qualquer valor funciona se o servidor não exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Em seguida, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

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
        timeoutSeconds: 300,
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

<AccordionGroup>
  <Accordion title="Default optional fields">
    Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais. Quando omitidos, o OpenClaw usa por padrão:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` sem suporte.
    - Rotas compatíveis com OpenAI no estilo proxy também ignoram a modelagem de requisições nativas exclusivas da OpenAI: sem `service_tier`, sem Responses `store`, sem Completions `store`, sem dicas de cache de prompt, sem modelagem de carga de compatibilidade de raciocínio da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies Completions compatíveis com OpenAI que precisam de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra ao corpo da requisição de saída.
    - Para controles de template de chat do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O Plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de pensamento da sessão está desativado.
    - Para modelos locais lentos ou hosts remotos de LAN/tailnet, defina `models.providers.<id>.timeoutSeconds`. Isso estende o tratamento de requisições HTTP do modelo do provedor, incluindo conexão, cabeçalhos, streaming do corpo e o abortamento total de busca protegida, sem aumentar o tempo limite de execução inteiro do agente.
    - Chamadas HTTP de provedor de modelo permitem respostas de DNS fake-IP do Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` apenas para o hostname `baseUrl` do provedor configurado. Outros destinos privados, de loopback, link-local e de metadados ainda exigem aceite explícito com `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
    - Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints `openai-completions` não nativos.
    - Para `api: "anthropic-messages"` em endpoints não diretos (qualquer provedor que não seja o `anthropic` canônico, ou um `models.providers.anthropic.baseUrl` personalizado cujo host não seja um endpoint público `api.anthropic.com`), o OpenClaw suprime cabeçalhos beta implícitos da Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` e marcadores OAuth, para que proxies personalizados compatíveis com Anthropic não rejeitem flags beta sem suporte. Defina `models.providers.<id>.headers["anthropic-beta"]` explicitamente se o seu proxy precisar de recursos beta específicos.

  </Accordion>
</AccordionGroup>

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Veja também: [Configuração](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionados

- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - chaves de configuração de modelo
- [Failover de modelo](/pt-BR/concepts/model-failover) - cadeias de fallback e comportamento de repetição
- [Modelos](/pt-BR/concepts/models) - configuração de modelo e aliases
- [Provedores](/pt-BR/providers) - guias de configuração por provedor
