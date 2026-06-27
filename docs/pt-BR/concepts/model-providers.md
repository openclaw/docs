---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de integração inicial da CLI para provedores de modelo
sidebarTitle: Model providers
summary: Visão geral do provedor de modelos com configurações de exemplo + fluxos da CLI
title: Provedores de modelos
x-i18n:
    generated_at: "2026-06-27T17:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Referência para **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelo, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Referências de modelo e auxiliares da CLI">
    - Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` atua como uma lista de permissões quando definido.
    - Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` definem padrões no nível do provedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` os substituem por modelo.
    - Regras de fallback, sondagens de cooldown e persistência de substituição de sessão: [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>
  <Accordion title="Adicionar autenticação de provedor não muda seu modelo primário">
    `openclaw configure` preserva um `agents.defaults.model.primary` existente quando você adiciona ou reautentica um provedor. `openclaw models auth login` faz o mesmo, a menos que você passe `--set-default`. Plugins de provedor ainda podem retornar um modelo padrão recomendado no patch de configuração de autenticação, mas o OpenClaw trata isso como "disponibilizar este modelo" quando já existe um modelo primário, não como "substituir o modelo primário atual".

    Para trocar intencionalmente o modelo padrão, use `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Divisão entre provedor/runtime da OpenAI">
    Rotas da família OpenAI são específicas por prefixo:

    - `openai/<model>` usa o harness nativo do servidor de app Codex para turnos de agente por padrão. Esta é a configuração usual de assinatura ChatGPT/Codex.
    - referências de modelo Codex legadas são configuração legada que o doctor reescreve para `openai/<model>`.
    - `openai/<model>` mais `agentRuntime.id: "openclaw"` de provedor/modelo usa o runtime integrado do OpenClaw para rotas explícitas de chave de API ou compatibilidade.

    Consulte [OpenAI](/pt-BR/providers/openai) e [harness Codex](/pt-BR/plugins/codex-harness). Se a divisão provedor/runtime estiver confusa, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) primeiro.

    A ativação automática de Plugin segue o mesmo limite: refs de agente `openai/*` habilitam o plugin Codex para a rota padrão, e `agentRuntime.id: "codex"` explícito de provedor/modelo ou refs legadas `codex/<model>` também exigem isso.

    GPT-5.5 está disponível por meio do harness nativo do servidor de app Codex por padrão em `openai/gpt-5.5`, e por meio do runtime OpenClaw quando a política de runtime de provedor/modelo seleciona explicitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtimes de CLI">
    Runtimes de CLI usam a mesma divisão: escolha refs de modelo canônicas, como `anthropic/claude-*` ou `google/gemini-*`, e então defina a política de runtime de provedor/modelo para `claude-cli` ou `google-gemini-cli` quando quiser um backend de CLI local.

    Refs legadas `claude-cli/*` e `google-gemini-cli/*` migram de volta para refs de provedor canônicas com o runtime registrado separadamente. Refs legadas `codex-cli/*` migram para `openai/*` e usam a rota do servidor de app Codex; o OpenClaw não mantém mais um backend de CLI Codex integrado.

  </Accordion>
</AccordionGroup>

## Comportamento de provedor pertencente ao Plugin

A maior parte da lógica específica de provedor vive em plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop de inferência genérico. Plugins são responsáveis por onboarding, catálogos de modelos, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de esquema de ferramentas, classificação de failover, atualização de OAuth, relatórios de uso, perfis de thinking/reasoning e mais.

A lista completa de hooks do SDK de provedor e exemplos de plugins integrados fica em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precisa de um executor de requisições totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
O comportamento de runner pertencente ao provedor vive em hooks explícitos de provedor, como política de replay, normalização de esquema de ferramentas, encapsulamento de stream e auxiliares de transporte/requisição. O bag estático legado `ProviderPlugin.capabilities` é apenas compatibilidade e não é mais lido pela lógica compartilhada do runner.
</Note>

## Rotação de chave de API

<AccordionGroup>
  <Accordion title="Fontes de chave e prioridade">
    Configure várias chaves via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
    - `<PROVIDER>_API_KEY` (chave primária)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo, `<PROVIDER>_API_KEY_1`)

    Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback. A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.

  </Accordion>
  <Accordion title="Quando a rotação entra em ação">
    - Requisições são tentadas novamente com a próxima chave apenas em respostas de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não são de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
    - Quando todas as chaves candidatas falham, o erro final é retornado da última tentativa.

  </Accordion>
</AccordionGroup>

## Plugins de provedor oficiais

Plugins de provedor oficiais publicam suas próprias linhas de catálogo de modelos. Esses provedores **não** exigem entradas de modelo em `models.providers`; habilite o plugin de provedor, defina a autenticação e escolha um modelo. Use `models.providers` apenas para provedores personalizados explícitos ou configurações estreitas de requisição, como timeouts.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifique a disponibilidade de conta/modelo com `openclaw models list --provider openai` se uma instalação específica ou chave de API se comportar de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto`; o OpenClaw passa a escolha de transporte para o runtime de modelo compartilhado.
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O processamento prioritário da OpenAI pode ser habilitado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições Responses diretas `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um tier explícito em vez do alternador compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam apenas ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas da OpenAI também mantêm `store` de Responses, dicas de cache de prompt e modelagem de payload compatível com reasoning da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` está disponível por autenticação de assinatura OAuth ChatGPT/Codex quando sua conta conectada o expõe; o OpenClaw ainda suprime rotas diretas por chave de API da OpenAI e chave de API da Azure para este modelo porque esses transportes o rejeitam

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
- Requisições públicas diretas da Anthropic oferecem suporte ao alternador compartilhado `/fast` e a `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- A configuração preferencial da Claude CLI mantém a ref de modelo canônica e seleciona o backend de CLI separadamente: `anthropic/claude-opus-4-8` com `agentRuntime.id: "claude-cli"` no escopo do modelo. Refs legadas `claude-cli/claude-opus-4-7` ainda funcionam para compatibilidade.

<Note>
A equipe da Anthropic nos informou que o uso da Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. O token de configuração da Anthropic permanece disponível como um caminho de token compatível com o OpenClaw, mas o OpenClaw agora prefere a reutilização da Claude CLI e `claude -p` quando disponíveis.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth ChatGPT/Codex da OpenAI

- Provedor: `openai`
- Autenticação: OAuth (ChatGPT)
- Ref de modelo OpenAI Codex legada: `openai/gpt-5.5`
- Ref do harness nativo do servidor de app Codex: `openai/gpt-5.5`
- Docs do harness nativo do servidor de app Codex: [harness Codex](/pt-BR/plugins/codex-harness)
- Refs de modelo legadas: `codex/gpt-*`
- Limite do Plugin: `openai/*` carrega o plugin OpenAI; o plugin nativo do servidor de app Codex é selecionado pelo runtime do harness Codex.
- CLI: `openclaw onboard --auth-choice openai` ou `openclaw models auth login --provider openai`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo OpenAI Codex via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições Responses nativas do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados apenas ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e a configuração `params.fastMode` que `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai/gpt-5.5` usa o `contextWindow = 400000` nativo do catálogo Codex e o runtime padrão `contextTokens = 272000`; substitua o limite de runtime com `models.providers.openai.models[].contextTokens`
- Nota de política: OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.
- Para a rota comum de assinatura mais runtime nativo Codex, faça login com autenticação `openai` e configure `openai/gpt-5.5`; turnos de agente OpenAI selecionam Codex por padrão.
- Use `agentRuntime.id: "openclaw"` de provedor/modelo apenas quando quiser a rota integrada do OpenClaw; caso contrário, mantenha `openai/gpt-5.5` no harness Codex padrão.
- refs GPT Codex legadas são estado legado, não uma rota de provedor live. Use `openai/gpt-5.5` no runtime Codex nativo para nova configuração de agente, e execute `openclaw doctor --fix` para migrar refs de modelo Codex legadas antigas para refs canônicas `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Outras opções hospedadas em estilo de assinatura

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/pt-BR/providers/zai">
    Plano de codificação Z.AI ou endpoints gerais de API.
  </Card>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    OAuth do Plano de codificação MiniMax ou acesso por chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Superfície de provedor Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Plano de codificação.
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
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: a configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` é aceito e normalizado para o ID da API Gemini ativa do Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Raciocínio: `/think adaptive` usa o raciocínio dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um handle nativo do provedor `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` do OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth

<Warning>
O OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas Google depois de usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por prosseguir.
</Warning>

O OAuth do Gemini CLI é distribuído como parte do plugin `google` incluído.

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um client id nem um secret em `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do gateway.

  </Step>
  <Step title="Set project (if needed)">
    Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` por padrão. O OpenClaw lê mensagens de stream do assistente
e normaliza `stats.cached` para `cacheRead`; substituições legadas de
`--output-format json` ainda leem o texto da resposta de `response`.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Refs de modelo usam o ID de provedor canônico `zai/*`.
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Outros plugins de provedores incluídos

| Provedor                                | ID                               | Env de autenticação                                  | Modelo de exemplo                                         |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                           |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/pt-BR/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OAuth do OpenRouter ou `OPENROUTER_API_KEY`          | `openrouter/auto`                                         |
| [Qwen OAuth](/pt-BR/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | OAuth do SuperGrok/X Premium ou `XAI_API_KEY`        | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularidades que vale conhecer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de app e marcadores Anthropic `cache_control` apenas em rotas verificadas `openrouter.ai`. Refs DeepSeek, Moonshot e ZAI são elegíveis a cache-TTL para cache de prompts gerenciado pelo OpenRouter, mas não recebem marcadores de cache Anthropic. Como um caminho compatível com OpenAI no estilo proxy, ele ignora modelagem exclusiva da OpenAI nativa (`serviceTier`, `store` de Responses, dicas de cache de prompt, compatibilidade de raciocínio da OpenAI). Refs baseadas em Gemini mantêm apenas a sanitização de assinatura de pensamento do proxy Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Refs baseadas em Gemini seguem o mesmo caminho de sanitização do proxy Gemini; `kilocode/kilo/auto` e outras refs de proxy sem suporte a raciocínio ignoram a injeção de raciocínio do proxy.
  </Accordion>
  <Accordion title="MiniMax">
    O onboarding por chave de API grava definições explícitas de modelos de chat M3 e M2.7; entendimento de imagem permanece no provedor de mídia `MiniMax-VL-01` pertencente ao plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    IDs de modelo usam um namespace `nvidia/<vendor>/<model>` (por exemplo, `nvidia/nvidia/nemotron-...` junto de `nvidia/moonshotai/kimi-k2.5`); seletores preservam a composição literal `<provider>/<model-id>`, enquanto a chave canônica enviada à API permanece com um único prefixo.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho xAI Responses. O caminho recomendado é OAuth do SuperGrok/X Premium; chaves de API ainda funcionam via `XAI_API_KEY` ou configuração do plugin, e o `web_search` do Grok reutiliza o mesmo perfil de autenticação antes do fallback por chave de API. `grok-4.3` é o modelo de chat padrão incluído, e `grok-build-0.1` pode ser selecionado para trabalho focado em build/código. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` fica ativo por padrão; desative via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provedores via `models.providers` (URL customizada/base)

Use `models.providers` (ou `models.json`) para adicionar provedores **customizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedores incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas `models.providers.<id>` somente quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

As verificações de capacidade de modelo do Gateway também leem metadados explícitos de `models.providers.<id>.models[]`. Se um modelo personalizado ou de proxy aceitar imagens, defina `input: ["text", "image"]` nesse modelo para que o WebChat e os caminhos de anexos originados no nó passem imagens como entradas nativas do modelo, em vez de refs de mídia somente texto.

`agents.defaults.models["provider/model"]` controla apenas a visibilidade do modelo, aliases e metadados por modelo para agentes. Ele não registra um novo modelo de runtime por si só. Para modelos de provider personalizados, também adicione `models.providers.<provider>.models[]` com pelo menos o `id` correspondente.

### Moonshot AI (Kimi)

Instale `@openclaw/moonshot-provider` antes do onboarding. Adicione uma entrada explícita de `models.providers.moonshot` somente quando precisar substituir a URL base ou os metadados do modelo:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Os modelos legados `kimi/kimi-code` e `kimi/k2p5` continuam aceitos como IDs de modelo de compatibilidade e são normalizados para o ID de modelo da API estável da Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

- Provider: `volcengine` (codificação: `volcengine-plan`)
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

O onboarding usa como padrão a superfície de codificação, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação da Volcengine prefere tanto as linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw volta para o catálogo não filtrado em vez de mostrar um seletor vazio com escopo de provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modelos de programação (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internacional)

BytePlus ARK fornece acesso aos mesmos modelos que o Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (programação: `byteplus-plan`)
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

O onboarding usa como padrão a superfície de programação, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a escolha de autenticação da BytePlus prefere tanto as linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw volta para o catálogo não filtrado em vez de mostrar um seletor vazio com escopo de provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelos de programação (byteplus-plan)">
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

O MiniMax é configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chave de API MiniMax (Global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

<Note>
No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o thinking por padrão para a família M2.x, a menos que você o defina explicitamente; MiniMax-M3 (e M3.x) permanece no caminho de thinking omitido/adaptativo do provedor por padrão. `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capacidades pertencente ao plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M3`
- A geração de imagens é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagens é `MiniMax-VL-01`, pertencente ao plugin, em ambos os caminhos de autenticação MiniMax
- A busca na Web permanece no ID de provedor `minimax`

### LM Studio

O LM Studio é fornecido como um plugin de provedor integrado que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Em seguida, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa os endpoints nativos `/api/v1/models` e `/api/v1/models/load` do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão. Se você quiser que o carregamento JIT, TTL e despejo automático do LM Studio sejam responsáveis pelo ciclo de vida do modelo, defina `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é fornecido como um plugin de provedor integrado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma exigida (servidor local)
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

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por usá-lo com `OLLAMA_API_KEY`, e o plugin de provedor integrado adiciona o Ollama diretamente ao `openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama) para onboarding, modo nuvem/local e configuração personalizada.

### vLLM

O vLLM é fornecido como um plugin de provedor integrado para servidores locais/auto-hospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

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

O SGLang é fornecido como um plugin de provedor integrado para servidores rápidos auto-hospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

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
  <Accordion title="Campos opcionais padrão">
    Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais. Quando omitidos, o OpenClaw usa como padrão:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.

  </Accordion>
  <Accordion title="Regras de modelagem de rota de proxy">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` sem suporte.
    - Rotas compatíveis com OpenAI em estilo proxy também ignoram a modelagem de solicitação exclusiva da OpenAI nativa: sem `service_tier`, sem `store` de Responses, sem `store` de Completions, sem dicas de cache de prompt, sem modelagem de payload de compatibilidade de reasoning da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies de Completions compatíveis com OpenAI que precisam de campos específicos de fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra ao corpo da solicitação de saída.
    - Para controles de chat-template do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O plugin vLLM integrado envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de thinking da sessão está desativado.
    - Para modelos locais lentos ou hosts remotos de LAN/tailnet, defina `models.providers.<id>.timeoutSeconds`. Isso estende o tratamento de solicitações HTTP do modelo do provedor, incluindo conexão, cabeçalhos, streaming do corpo e a interrupção total de guarded-fetch, sem aumentar o timeout de todo o runtime do agente. Se `agents.defaults.timeoutSeconds` ou um timeout específico de execução for menor, aumente esse limite também; timeouts de provedor não podem estender toda a execução.
    - Chamadas HTTP de provedores de modelo permitem respostas DNS fake-IP do Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` apenas para o hostname `baseUrl` do provedor configurado. Endpoints personalizados/locais de provedor também confiam naquela origem exata `scheme://host:port` configurada para solicitações de modelo protegidas, incluindo hosts de loopback, LAN e tailnet. Esta não é uma nova opção de configuração; o `baseUrl` que você configura estende a política de solicitação apenas para essa origem. A permissão de hostname fake-IP e a confiança em origem exata são mecanismos independentes. Outros destinos privados, de loopback, link-local, de metadados e portas diferentes ainda exigem uma opção explícita `models.providers.<id>.request.allowPrivateNetwork: true`. Defina `models.providers.<id>.request.allowPrivateNetwork: false` para deixar de confiar na origem exata.
    - Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
    - Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints `openai-completions` não nativos.
    - Para `api: "anthropic-messages"` em endpoints não diretos (qualquer provedor diferente do `anthropic` canônico, ou um `models.providers.anthropic.baseUrl` personalizado cujo host não seja um endpoint público `api.anthropic.com`), o OpenClaw suprime cabeçalhos beta implícitos da Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` e marcadores OAuth, para que proxies personalizados compatíveis com Anthropic não rejeitem flags beta sem suporte. Defina `models.providers.<id>.headers["anthropic-beta"]` explicitamente se o seu proxy precisar de recursos beta específicos.

  </Accordion>
</AccordionGroup>

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Veja também: [Configuração](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - chaves de configuração de modelo
- [Failover de modelo](/pt-BR/concepts/model-failover) - cadeias de fallback e comportamento de repetição
- [Modelos](/pt-BR/concepts/models) - configuração de modelos e aliases
- [Provedores](/pt-BR/providers) - guias de configuração por provedor
