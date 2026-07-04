---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer exemplos de configurações ou comandos de integração da CLI para provedores de modelos
sidebarTitle: Model providers
summary: Visão geral do provedor de modelos com exemplos de configurações + fluxos de CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-07-04T03:39:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referência para **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelo, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Refs de modelo e auxiliares da CLI">
    - Refs de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` atua como uma lista de permissões quando definido.
    - Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` definem padrões no nível do provedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` os substituem por modelo.
    - Regras de fallback, verificações de cooldown e persistência de substituição de sessão: [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>
  <Accordion title="Adicionar autenticação de provedor não altera seu modelo primário">
    `openclaw configure` preserva um `agents.defaults.model.primary` existente quando você adiciona ou autentica novamente um provedor. `openclaw models auth login` faz o mesmo, a menos que você passe `--set-default`. Plugins de provedor ainda podem retornar um modelo padrão recomendado no patch de configuração de autenticação, mas o OpenClaw trata isso como "disponibilizar este modelo" quando um modelo primário já existe, não como "substituir o modelo primário atual".

    Para alternar intencionalmente o modelo padrão, use `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Divisão entre provedor/runtime da OpenAI">
    Rotas da família OpenAI são específicas por prefixo:

    - `openai/<model>` usa por padrão o harness app-server nativo do Codex para turnos de agente. Esta é a configuração usual de assinatura ChatGPT/Codex.
    - refs de modelo Codex legadas são configuração legada que o doctor reescreve para `openai/<model>`.
    - `openai/<model>` mais `agentRuntime.id: "openclaw"` de provedor/modelo usa o runtime integrado do OpenClaw para rotas explícitas de chave de API ou compatibilidade.

    Consulte [OpenAI](/pt-BR/providers/openai) e [Harness do Codex](/pt-BR/plugins/codex-harness). Se a divisão entre provedor/runtime for confusa, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) primeiro.

    A ativação automática de Plugin segue a mesma fronteira: refs de agente `openai/*` habilitam o Plugin Codex para a rota padrão, e `agentRuntime.id: "codex"` explícito de provedor/modelo ou refs legadas `codex/<model>` também exigem isso.

    GPT-5.5 está disponível por padrão por meio do harness app-server nativo do Codex em `openai/gpt-5.5`, e pelo runtime do OpenClaw quando a política de runtime de provedor/modelo seleciona explicitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtimes da CLI">
    Runtimes da CLI usam a mesma divisão: escolha refs de modelo canônicas como `anthropic/claude-*` ou `google/gemini-*` e depois defina a política de runtime de provedor/modelo como `claude-cli` ou `google-gemini-cli` quando quiser um backend de CLI local.

    Refs legadas `claude-cli/*` e `google-gemini-cli/*` migram de volta para refs de provedor canônicas com o runtime registrado separadamente. Refs legadas `codex-cli/*` migram para `openai/*` e usam a rota app-server do Codex; o OpenClaw não mantém mais um backend de CLI Codex empacotado.

  </Accordion>
</AccordionGroup>

## Comportamento de provedor pertencente ao Plugin

A maior parte da lógica específica de provedor vive em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop de inferência genérico. Plugins são responsáveis por onboarding, catálogos de modelos, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de esquema de ferramentas, classificação de failover, atualização de OAuth, relatório de uso, perfis de pensamento/raciocínio e mais.

A lista completa de hooks do SDK de provedor e exemplos de Plugins empacotados fica em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precisa de um executor de requisições totalmente customizado é uma superfície de extensão separada e mais profunda.

<Note>
O comportamento de runner pertencente ao provedor vive em hooks explícitos de provedor, como política de replay, normalização de esquema de ferramentas, encapsulamento de stream e auxiliares de transporte/requisição. O pacote estático legado `ProviderPlugin.capabilities` é apenas para compatibilidade e não é mais lido pela lógica de runner compartilhada.
</Note>

## Rotação de chaves de API

<AccordionGroup>
  <Accordion title="Fontes de chaves e prioridade">
    Configure várias chaves via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, maior prioridade)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
    - `<PROVIDER>_API_KEY` (chave primária)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo, `<PROVIDER>_API_KEY_1`)

    Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback. A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.

  </Accordion>
  <Accordion title="Quando a rotação entra em ação">
    - Requisições são tentadas novamente com a próxima chave somente em respostas de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não são de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
    - Quando todas as chaves candidatas falham, o erro final é retornado da última tentativa.

  </Accordion>
</AccordionGroup>

## Plugins de provedor oficiais

Plugins de provedor oficiais publicam suas próprias linhas de catálogo de modelos. Estes provedores **não** exigem entradas de modelo em `models.providers`; habilite o Plugin de provedor, configure a autenticação e escolha um modelo. Use `models.providers` apenas para provedores customizados explícitos ou configurações de requisição restritas, como timeouts.

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
- Use `params.serviceTier` quando quiser um nível explícito em vez do alternador compartilhado `/fast`
- Cabeçalhos de atribuição ocultos do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam somente ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas da OpenAI também mantêm `store` de Responses, dicas de cache de prompt e formatação de payload compatível com raciocínio da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` está disponível por autenticação de assinatura OAuth ChatGPT/Codex quando sua conta conectada o expõe; o OpenClaw ainda suprime rotas diretas de chave de API da OpenAI e de chave de API do Azure para este modelo porque esses transportes o rejeitam

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
- Requisições públicas diretas da Anthropic dão suporte ao alternador compartilhado `/fast` e a `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- A configuração preferida da CLI Claude mantém a ref de modelo canônica e seleciona o backend da CLI
  separadamente: `anthropic/claude-opus-4-8` com
  `agentRuntime.id: "claude-cli"` com escopo de modelo. Refs legadas
  `claude-cli/claude-opus-4-7` ainda funcionam para compatibilidade.

<Note>
A equipe da Anthropic nos disse que o uso da Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. O token de configuração da Anthropic continua disponível como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere a reutilização da Claude CLI e `claude -p` quando disponíveis.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth do OpenAI ChatGPT/Codex

- Provedor: `openai`
- Autenticação: OAuth (ChatGPT)
- Ref de modelo legada OpenAI Codex: `openai/gpt-5.5`
- Ref do harness app-server nativo do Codex: `openai/gpt-5.5`
- Documentação do harness app-server nativo do Codex: [Harness do Codex](/pt-BR/plugins/codex-harness)
- Refs de modelo legadas: `codex/gpt-*`
- Fronteira de Plugin: `openai/*` carrega o Plugin OpenAI; o Plugin app-server nativo do Codex é selecionado pelo runtime do harness Codex.
- CLI: `openclaw onboard --auth-choice openai` ou `openclaw models auth login --provider openai`
- O transporte padrão é `auto` (WebSocket primeiro, SSE como fallback)
- Substitua por modelo OpenAI Codex via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições Responses nativas do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos de atribuição ocultos do OpenClaw (`originator`, `version`, `User-Agent`) são anexados somente ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e a configuração `params.fastMode` que `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai/gpt-5.5` usa `contextWindow = 400000` nativo do catálogo Codex e runtime padrão `contextTokens = 272000`; substitua o limite do runtime com `models.providers.openai.models[].contextTokens`
- Nota de política: o OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.
- Para a rota comum de assinatura mais runtime nativo do Codex, entre com autenticação `openai` e configure `openai/gpt-5.5`; turnos de agente OpenAI selecionam Codex por padrão.
- Use `agentRuntime.id: "openclaw"` de provedor/modelo somente quando quiser a rota integrada do OpenClaw; caso contrário, mantenha `openai/gpt-5.5` no harness Codex padrão.
- refs GPT legadas do Codex são estado legado, não uma rota de provedor live. Use `openai/gpt-5.5` no runtime nativo do Codex para novas configurações de agente e execute `openclaw doctor --fix` para migrar refs de modelo Codex legadas antigas para refs canônicas `openai/*`.

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

### Outras opções hospedadas no estilo assinatura

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/pt-BR/providers/zai">
    Plano de Codificação Z.AI ou endpoints gerais de API.
  </Card>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    OAuth do Plano de Codificação MiniMax ou acesso por chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Superfície de provedor Qwen Cloud mais mapeamento de endpoints Alibaba DashScope e Plano de Codificação.
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
- Alias: `google/gemini-3.1-pro` é aceito e normalizado para o id da API Gemini ao vivo do Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Raciocínio: `/think adaptive` usa o raciocínio dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um identificador `cachedContents/...` nativo do provedor; acertos no cache do Gemini aparecem como `cacheRead` do OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa ADC do gcloud; Gemini CLI usa seu fluxo OAuth

<Warning>
O OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas do Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por prosseguir.
</Warning>

O OAuth do Gemini CLI é enviado como parte do Plugin `google` integrado.

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
  <Step title="Habilitar Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Fazer login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um id de cliente ou segredo em `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do Gateway.

  </Step>
  <Step title="Definir projeto (se necessário)">
    Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` por padrão. OpenClaw lê mensagens de fluxo do assistente
e normaliza `stats.cached` para `cacheRead`; substituições legadas de
`--output-format json` ainda leem o texto da resposta de `response`.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Referências de modelo usam o ID de provedor canônico `zai/*`.
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Outros Plugins de provedor integrados

| Provedor                                | Id                               | Env de autenticação                                  | Modelo de exemplo                                         |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/pt-BR/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth ou `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/pt-BR/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth do SuperGrok/X Premium ou `XAI_API_KEY`        | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Peculiaridades que vale conhecer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de app e marcadores Anthropic `cache_control` somente em rotas `openrouter.ai` verificadas. Referências DeepSeek, Moonshot e ZAI são elegíveis a TTL de cache para cache de prompts gerenciado pelo OpenRouter, mas não recebem marcadores de cache Anthropic. Como um caminho compatível com OpenAI no estilo proxy, ele ignora formatação exclusiva da OpenAI nativa (`serviceTier`, `store` de Responses, dicas de cache de prompt, compatibilidade de raciocínio da OpenAI). Referências baseadas em Gemini mantêm apenas a sanitização de assinatura de pensamento de proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referências baseadas em Gemini seguem o mesmo caminho de sanitização de proxy-Gemini; `kilocode/kilo/auto` e outras referências de proxy sem suporte a raciocínio ignoram a injeção de raciocínio de proxy.
  </Accordion>
  <Accordion title="MiniMax">
    A integração por chave de API grava definições explícitas de modelos de chat M3 e M2.7; o entendimento de imagens permanece no provedor de mídia `MiniMax-VL-01` pertencente ao Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    IDs de modelo usam um namespace `nvidia/<vendor>/<model>` (por exemplo, `nvidia/nvidia/nemotron-...` junto com `nvidia/moonshotai/kimi-k2.5`); seletores preservam a composição literal `<provider>/<model-id>`, enquanto a chave canônica enviada à API permanece com um único prefixo.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho Responses da xAI. O caminho recomendado é OAuth do SuperGrok/X Premium; chaves de API ainda funcionam via `XAI_API_KEY` ou configuração do Plugin, e `web_search` do Grok reutiliza o mesmo perfil de autenticação antes do fallback de chave de API. `grok-4.3` é o modelo de chat padrão integrado, e `grok-build-0.1` pode ser selecionado para trabalho focado em build/codificação. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` fica ativado por padrão; desative via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provedores via `models.providers` (URL personalizada/base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedores incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas de `models.providers.<id>` somente quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

As verificações de capacidade de modelo do Gateway também leem metadados explícitos de `models.providers.<id>.models[]`. Se um modelo personalizado ou proxy aceita imagens, defina `input: ["text", "image"]` nesse modelo para que os caminhos de anexos originados no WebChat e em nós passem imagens como entradas nativas do modelo, em vez de referências de mídia somente texto.

`agents.defaults.models["provider/model"]` controla apenas a visibilidade do modelo, aliases e metadados por modelo para agentes. Ele não registra um novo modelo de runtime por si só. Para modelos de provedores personalizados, adicione também `models.providers.<provider>.models[]` com pelo menos o `id` correspondente.

### Moonshot AI (Kimi)

Instale `@openclaw/moonshot-provider` antes da integração. Adicione uma entrada explícita de `models.providers.moonshot` somente quando precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
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

- Provedor: `kimi`
- Autenticação: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Os `kimi/kimi-code` e `kimi/k2p5` legados continuam sendo aceitos como ids de modelo de compatibilidade e são normalizados para o id de modelo da API estável da Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

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

A integração usa a superfície de codificação por padrão, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a opção de autenticação Volcengine prioriza tanto as linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio com escopo de provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modelos de codificação (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internacional)

BytePlus ARK fornece acesso aos mesmos modelos que o Volcano Engine para usuários internacionais.

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

A integração usa a superfície de codificação por padrão, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a opção de autenticação BytePlus prioriza tanto as linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio com escopo de provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelos de codificação (byteplus-plan)">
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

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chave de API MiniMax (Global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

<Note>
No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o pensamento por padrão para a família M2.x, a menos que você o defina explicitamente; MiniMax-M3 (e M3.x) permanece por padrão no caminho de pensamento omitido/adaptativo do provedor. `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capacidades de propriedade do Plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M3`
- A geração de imagens é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagens é `MiniMax-VL-01`, de propriedade do Plugin, em ambos os caminhos de autenticação MiniMax
- A pesquisa na Web permanece no ID de provedor `minimax`

### LM Studio

LM Studio é distribuído como um Plugin de provedor integrado que usa a API nativa:

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

O OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativos do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão. Se você quiser que o carregamento JIT, TTL e despejo automático do LM Studio sejam responsáveis pelo ciclo de vida do modelo, defina `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

Ollama é distribuído como um Plugin de provedor integrado e usa a API nativa do Ollama:

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

Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por usá-lo com `OLLAMA_API_KEY`, e o Plugin de provedor integrado adiciona Ollama diretamente ao `openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama) para integração, modo em nuvem/local e configuração personalizada.

### vLLM

vLLM é distribuído como um Plugin de provedor integrado para servidores locais/auto-hospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se o seu servidor não impuser autenticação):

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

SGLang é distribuído como um Plugin de provedor integrado para servidores rápidos auto-hospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se o seu servidor não impuser autenticação):

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
  <Accordion title="Regras de modelagem de rotas de proxy">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor em funções `developer` incompatíveis.
    - Rotas compatíveis com OpenAI no estilo proxy também ignoram a modelagem de requisição exclusiva da OpenAI nativa: sem `service_tier`, sem `store` de Responses, sem `store` de Completions, sem dicas de cache de prompt, sem modelagem de payload de compatibilidade de raciocínio da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies de Completions compatíveis com OpenAI que precisam de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra ao corpo da requisição enviada.
    - Para controles de modelo de chat do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O Plugin vLLM integrado envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de pensamento da sessão está desligado.
    - Para modelos locais lentos ou hosts remotos em LAN/tailnet, defina `models.providers.<id>.timeoutSeconds`. Isso estende o tratamento de requisições HTTP do modelo do provedor, incluindo conexão, cabeçalhos, streaming de corpo e o abort total de busca protegida, sem aumentar o tempo limite de execução do agente inteiro. Se `agents.defaults.timeoutSeconds` ou um tempo limite específico da execução for menor, aumente esse teto também; os tempos limite do provedor não podem estender a execução inteira.
    - Chamadas HTTP de provedor de modelo permitem respostas DNS fake-IP de Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` apenas para o nome de host `baseUrl` configurado do provedor. Endpoints de provedor personalizados/locais também confiam nessa origem exata configurada como `scheme://host:port` para requisições de modelo protegidas, incluindo hosts de loopback, LAN e tailnet. Isso não é uma nova opção de configuração; o `baseUrl` que você configura estende a política de requisição apenas para essa origem. A permissão de nome de host fake-IP e a confiança na origem exata são mecanismos independentes. Outros destinos privados, de loopback, link-local, metadados e portas diferentes ainda exigem adesão explícita com `models.providers.<id>.request.allowPrivateNetwork: true`. Defina `models.providers.<id>.request.allowPrivateNetwork: false` para sair da confiança de origem exata.
    - Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
    - Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints `openai-completions` não nativos.
    - Para `api: "anthropic-messages"` em endpoints não diretos (qualquer provedor que não seja o `anthropic` canônico, ou um `models.providers.anthropic.baseUrl` personalizado cujo host não seja um endpoint público `api.anthropic.com`), o OpenClaw suprime cabeçalhos beta implícitos da Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` e marcadores OAuth, para que proxies personalizados compatíveis com Anthropic não rejeitem flags beta incompatíveis. Defina `models.providers.<id>.headers["anthropic-beta"]` explicitamente se o seu proxy precisar de recursos beta específicos.

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
- [Failover de modelo](/pt-BR/concepts/model-failover) - cadeias de fallback e comportamento de nova tentativa
- [Modelos](/pt-BR/concepts/models) - configuração e aliases de modelos
- [Provedores](/pt-BR/providers) - guias de configuração por provedor
