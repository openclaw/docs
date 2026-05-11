---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de configuração inicial da CLI para provedores de modelos
sidebarTitle: Model providers
summary: Visão geral de provedores de modelos com exemplos de configurações + fluxos de CLI
title: Provedores de modelos
x-i18n:
    generated_at: "2026-05-11T20:27:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Referência para **provedores de LLM/modelos** (não canais de chat como WhatsApp/Telegram). Para regras de seleção de modelo, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - As referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` atua como uma lista de permissões quando definido.
    - Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` definem padrões em nível de provedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` os substituem por modelo.
    - Regras de fallback, sondagens de cooldown e persistência de substituição de sessão: [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` preserva um `agents.defaults.model.primary` existente quando você adiciona ou reautentica um provedor. `openclaw models auth login` faz o mesmo, a menos que você passe `--set-default`. Plugins de provedor ainda podem retornar um modelo padrão recomendado em seu patch de configuração de autenticação, mas o OpenClaw trata isso como "tornar este modelo disponível" quando já existe um modelo primário, não como "substituir o modelo primário atual".

    Para trocar intencionalmente o modelo padrão, use `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    Rotas da família OpenAI são específicas por prefixo:

    - `openai/<model>` usa o harness nativo do servidor de aplicativo Codex para turnos de agente por padrão. Esta é a configuração usual de assinatura ChatGPT/Codex.
    - `openai-codex/<model>` é configuração legada que o doctor reescreve para `openai/<model>`.
    - `openai/<model>` mais `agentRuntime.id: "pi"` de provedor/modelo usa PI para rotas explícitas de chave de API ou compatibilidade.

    Consulte [OpenAI](/pt-BR/providers/openai) e [harness Codex](/pt-BR/plugins/codex-harness). Se a divisão provedor/runtime estiver confusa, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) primeiro.

    A ativação automática de Plugin segue o mesmo limite: referências de agente `openai/*` ativam o Plugin Codex para a rota padrão, e `agentRuntime.id: "codex"` explícito de provedor/modelo ou referências legadas `codex/<model>` também o exigem.

    GPT-5.5 está disponível por meio do harness nativo do servidor de aplicativo Codex por padrão em `openai/gpt-5.5`, e por meio do PI somente quando a política de runtime de provedor/modelo seleciona explicitamente `pi`.

  </Accordion>
  <Accordion title="CLI runtimes">
    Runtimes de CLI usam a mesma divisão: escolha referências de modelo canônicas como `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, depois defina a política de runtime de provedor/modelo como `claude-cli`, `google-gemini-cli` ou `codex-cli` quando quiser um backend de CLI local.

    Referências legadas `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migram de volta para referências canônicas de provedor, com o runtime registrado separadamente.

  </Accordion>
</AccordionGroup>

## Comportamento de provedor pertencente ao Plugin

A maior parte da lógica específica de provedor fica em Plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Plugins controlam onboarding, catálogos de modelo, mapeamento de variáveis de ambiente de autenticação, normalização de transporte/configuração, limpeza de esquema de ferramenta, classificação de failover, atualização de OAuth, relatório de uso, perfis de pensamento/raciocínio e mais.

A lista completa de hooks de SDK de provedor e exemplos de Plugins incluídos fica em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precisa de um executor de requisição totalmente personalizado é uma superfície de extensão separada e mais profunda.

<Note>
O comportamento do runner pertencente ao provedor fica em hooks explícitos de provedor, como política de repetição, normalização de esquema de ferramenta, encapsulamento de stream e auxiliares de transporte/requisição. O pacote estático legado `ProviderPlugin.capabilities` é apenas de compatibilidade e não é mais lido pela lógica compartilhada do runner.
</Note>

## Rotação de chaves de API

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Configure várias chaves via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
    - `<PROVIDER>_API_KEY` (chave primária)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo, `<PROVIDER>_API_KEY_1`)

    Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback. A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - As requisições são repetidas com a próxima chave somente em respostas de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não sejam de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
    - Quando todas as chaves candidatas falham, o erro final é retornado a partir da última tentativa.

  </Accordion>
</AccordionGroup>

## Provedores integrados (catálogo pi-ai)

O OpenClaw é fornecido com o catálogo pi-ai. Estes provedores não exigem **nenhuma** configuração `models.providers`; basta definir autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifique a disponibilidade da conta/modelo com `openclaw models list --provider openai` se uma instalação ou chave de API específica se comportar de forma diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto`; o OpenClaw passa a escolha de transporte para pi-ai.
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas de Responses `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser uma camada explícita em vez do alternador compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) se aplicam somente ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com OpenAI
- Rotas nativas da OpenAI também mantêm `store` de Responses, dicas de cache de prompt e modelagem de payload de compatibilidade de raciocínio da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque requisições live da API OpenAI o rejeitam e o catálogo Codex atual não o expõe

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
- A configuração preferencial da Claude CLI mantém a referência de modelo canônica e seleciona o backend de CLI
  separadamente: `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` no escopo do modelo. Referências legadas
  `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade.

<Note>
A equipe da Anthropic nos informou que o uso da Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. O token de configuração da Anthropic continua disponível como um caminho de token com suporte no OpenClaw, mas o OpenClaw agora prefere a reutilização da Claude CLI e `claude -p` quando disponíveis.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Referência de modelo PI legada: `openai-codex/gpt-5.5`
- Referência do harness nativo do servidor de aplicativo Codex: `openai/gpt-5.5`
- Documentação do harness nativo do servidor de aplicativo Codex: [harness Codex](/pt-BR/plugins/codex-harness)
- Referências de modelo legadas: `codex/gpt-*`
- Limite de Plugin: `openai-codex/*` carrega o Plugin OpenAI; o Plugin nativo do servidor de aplicativo Codex é selecionado somente pelo runtime do harness Codex ou por referências legadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback SSE)
- Substitua por modelo PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas de Responses do Codex (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados somente ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e a configuração `params.fastMode` que `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.5` usa o `contextWindow = 400000` nativo do catálogo Codex e o runtime padrão `contextTokens = 272000`; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: OpenAI Codex OAuth é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.
- Para a rota comum de assinatura mais runtime nativo Codex, entre com autenticação `openai-codex`, mas configure `openai/gpt-5.5`; turnos de agente OpenAI selecionam Codex por padrão.
- Use `agentRuntime.id: "pi"` de provedor/modelo somente quando quiser uma rota de compatibilidade por meio do PI; caso contrário, mantenha `openai/gpt-5.5` no harness Codex padrão.
- Referências antigas `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` e `openai-codex/gpt-5.3*` são suprimidas porque contas ChatGPT/Codex OAuth as rejeitam; use `openai-codex/gpt-5.5` ou a rota nativa de runtime Codex em vez disso.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Outras opções hospedadas em estilo de assinatura

<CardGroup cols={3}>
  <Card title="GLM models" href="/pt-BR/providers/glm">
    Plano de Codificação Z.AI ou endpoints gerais de API.
  </Card>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    OAuth do Plano de Codificação MiniMax ou acesso por chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Superfície de provedor Qwen Cloud mais Alibaba DashScope e mapeamento de endpoint do Plano de Codificação.
  </Card>
</CardGroup>

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
- Compatibilidade: a configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- Apelido: `google/gemini-3.1-pro` é aceito e normalizado para o id da API Gemini ativa do Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Raciocínio: `/think adaptive` usa o raciocínio dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um identificador `cachedContents/...` nativo do provedor; acertos de cache do Gemini aparecem como `cacheRead` do OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa ADC do gcloud; Gemini CLI usa seu fluxo OAuth

<Warning>
OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições de conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por prosseguir.
</Warning>

OAuth do Gemini CLI é enviado como parte do Plugin `google` incluído.

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
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um id de cliente ou segredo em `openclaw.json`. O fluxo de login da CLI armazena tokens em perfis de autenticação no host do Gateway.

  </Step>
  <Step title="Definir projeto (se necessário)">
    Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway.
  </Step>
</Steps>

As respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a `stats`, com `stats.cached` normalizado para `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Apelidos: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
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
- O catálogo de fallback estático inclui `kilocode/kilo/auto`; a descoberta ativa em `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo em runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é propriedade do Kilo Gateway, não codificado diretamente no OpenClaw.

Veja [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros Plugins de provedor incluídos

| Provedor                | ID                               | Env. de autenticação                                         | Modelo de exemplo                              |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Particularidades úteis de saber

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de app e marcadores `cache_control` da Anthropic apenas em rotas `openrouter.ai` verificadas. Referências DeepSeek, Moonshot e ZAI são elegíveis a cache-TTL para cache de prompts gerenciado pelo OpenRouter, mas não recebem marcadores de cache da Anthropic. Como um caminho compatível com OpenAI no estilo de proxy, ele ignora a formatação apenas nativa da OpenAI (`serviceTier`, `store` de Responses, dicas de cache de prompts, compatibilidade de raciocínio da OpenAI). Referências baseadas em Gemini mantêm apenas a sanitização de assinatura de pensamento proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referências baseadas em Gemini seguem o mesmo caminho de sanitização proxy-Gemini; `kilocode/kilo/auto` e outras referências de proxy sem suporte a raciocínio ignoram a injeção de raciocínio de proxy.
  </Accordion>
  <Accordion title="MiniMax">
    A integração por chave de API grava definições explícitas de modelos de chat M2.7 apenas de texto; a compreensão de imagens permanece no provedor de mídia `MiniMax-VL-01`, pertencente ao plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    IDs de modelo usam um namespace `nvidia/<vendor>/<model>` (por exemplo, `nvidia/nvidia/nemotron-...` junto com `nvidia/moonshotai/kimi-k2.5`); seletores preservam a composição literal `<provider>/<model-id>`, enquanto a chave canônica enviada à API permanece com um único prefixo.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho Responses da xAI. `grok-4.3` é o modelo de chat padrão incluído. `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` para suas variantes `*-fast`. `tool_stream` é ativado por padrão; desative via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    É distribuído como o plugin de provedor `cerebras` incluído. GLM usa `zai-glm-4.7`; a URL base compatível com OpenAI é `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provedores via `models.providers` (URL personalizada/base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

As verificações de capacidade de modelo do Gateway também leem metadados explícitos de `models.providers.<id>.models[]`. Se um modelo personalizado ou de proxy aceitar imagens, defina `input: ["text", "image"]` nesse modelo para que o WebChat e os caminhos de anexos originados em nós passem imagens como entradas nativas do modelo, em vez de referências de mídia apenas de texto.

`agents.defaults.models["provider/model"]` controla apenas a visibilidade do modelo, aliases e metadados por modelo para agentes. Ele não registra um novo modelo de runtime por si só. Para modelos de provedor personalizados, adicione também `models.providers.<provider>.models[]` com pelo menos o `id` correspondente.

### Moonshot AI (Kimi)

Moonshot é distribuído como um plugin de provedor incluído. Use o provedor integrado por padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando precisar substituir a URL base ou os metadados do modelo:

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

### Kimi coding

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

Os legados `kimi/kimi-code` e `kimi/k2p5` continuam aceitos como ids de modelo de compatibilidade e são normalizados para o id de modelo estável da API da Kimi.

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

A integração inicial usa a superfície de codificação por padrão, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração inicial/configuração, a opção de autenticação Volcengine prefere tanto as linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio com escopo de provedor.

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

Nos seletores de modelo de integração inicial/configuração, a opção de autenticação BytePlus prefere tanto as linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não tiverem sido carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio com escopo de provedor.

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
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

<Note>
No caminho de streaming compatível com Anthropic da MiniMax, o OpenClaw desativa o raciocínio por padrão, a menos que você o defina explicitamente, e `/fast on` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capacidades de propriedade do Plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagens é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagens é de propriedade do Plugin `MiniMax-VL-01` em ambos os caminhos de autenticação MiniMax
- A busca na Web permanece no id de provedor `minimax`

### LM Studio

LM Studio é fornecido como um Plugin de provedor incluído que usa a API nativa:

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

O OpenClaw usa os endpoints nativos `/api/v1/models` e `/api/v1/models/load` do LM Studio para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão. Se você quiser que o carregamento JIT, o TTL e a remoção automática do LM Studio controlem o ciclo de vida do modelo, defina `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

Ollama é fornecido como um Plugin de provedor incluído e usa a API nativa do Ollama:

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

Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por usá-lo com `OLLAMA_API_KEY`, e o Plugin de provedor incluído adiciona Ollama diretamente ao `openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama) para integração inicial, modo em nuvem/local e configuração personalizada.

### vLLM

vLLM é fornecido como um Plugin de provedor incluído para servidores locais/auto-hospedados compatíveis com OpenAI:

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

SGLang é fornecido como um Plugin de provedor incluído para servidores rápidos auto-hospedados compatíveis com OpenAI:

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
  <Accordion title="Regras de formatação de rotas de proxy">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor por funções `developer` sem suporte.
    - Rotas compatíveis com OpenAI no estilo proxy também ignoram a formatação de requisição nativa exclusiva da OpenAI: sem `service_tier`, sem Responses `store`, sem Completions `store`, sem dicas de cache de prompt, sem formatação de payload de compatibilidade de raciocínio da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies de Completions compatíveis com OpenAI que precisam de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON extra ao corpo da requisição de saída.
    - Para controles de modelo de chat do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O Plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de pensamento da sessão está desativado.
    - Para modelos locais lentos ou hosts remotos em LAN/tailnet, defina `models.providers.<id>.timeoutSeconds`. Isso estende o tratamento de requisições HTTP do modelo do provedor, incluindo conexão, cabeçalhos, streaming do corpo e a interrupção total do fetch protegido, sem aumentar o timeout de todo o runtime do agente.
    - Chamadas HTTP de provedor de modelo permitem respostas DNS fake-IP do Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` somente para o hostname `baseUrl` do provedor configurado. Outros destinos privados, de loopback, link-local e de metadados ainda exigem uma opção explícita `models.providers.<id>.request.allowPrivateNetwork: true`.
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
- [Modelos](/pt-BR/concepts/models) - configuração e aliases de modelo
- [Provedores](/pt-BR/providers) - guias de configuração por provedor
