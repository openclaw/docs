---
read_when:
    - Você precisa de uma referência de configuração de modelos para cada provedor
    - Você quer configurações de exemplo ou comandos de integração da CLI para provedores de modelos
sidebarTitle: Model providers
summary: Visão geral dos provedores de modelos com exemplos de configuração e fluxos da CLI
title: Provedores de modelos
x-i18n:
    generated_at: "2026-07-12T15:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referência para **provedores de LLM/modelos** (não canais de chat como WhatsApp/Telegram). Para conhecer as regras de seleção de modelos, consulte [Modelos](/pt-BR/concepts/models).

## Regras rápidas

<AccordionGroup>
  <Accordion title="Referências de modelos e auxiliares da CLI">
    - As referências de modelos usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` funciona como uma lista de permissões quando definido.
    - Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` definem padrões no nível do provedor; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` os substituem por modelo.
    - Regras de fallback, sondagens durante o período de espera e persistência de substituições da sessão: [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>
  <Accordion title="Adicionar autenticação de provedor não altera seu modelo principal">
    `openclaw configure` preserva um `agents.defaults.model.primary` existente quando você adiciona ou autentica novamente um provedor. `openclaw models auth login` faz o mesmo, a menos que você passe `--set-default`. Os plugins de provedor ainda podem retornar um modelo padrão recomendado no patch de configuração de autenticação, mas, quando já existe um modelo principal, o OpenClaw interpreta isso como "disponibilizar este modelo", não como "substituir o modelo principal atual".

    Para trocar intencionalmente o modelo padrão, use `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separação entre provedor e runtime da OpenAI">
    As referências de modelos da OpenAI e os runtimes de agente são separados:

    - `openai/<model>` seleciona o provedor e o modelo canônicos da OpenAI. O prefixo sozinho nunca seleciona o Codex.
    - Quando a política de runtime do provedor/modelo não está definida ou é `auto`, a OpenAI pode selecionar o Codex implicitamente apenas para uma rota oficial HTTPS exata de Platform Responses ou ChatGPT Responses, sem substituição de solicitação definida pelo usuário.
    - Adaptadores de Completions definidos pelo usuário, endpoints personalizados e rotas com comportamento de solicitação definido pelo usuário permanecem no OpenClaw. Endpoints HTTP oficiais sem criptografia são rejeitados.
    - Referências legadas de modelos do Codex são configurações legadas que o doctor reescreve como `openai/<model>`.
    - `agentRuntime.id: "openclaw"` no provedor/modelo mantém explicitamente no OpenClaw uma rota que, de outra forma, seria elegível. `agentRuntime.id: "codex"` exige o Codex e falha de forma fechada quando a rota efetiva não é compatível com o Codex.

    Consulte [Runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime) e [Harness do Codex](/pt-BR/plugins/codex-harness). Se a separação entre provedor e runtime parecer confusa, leia primeiro [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

    A ativação automática de Plugin segue o mesmo limite: uma rota efetiva implicitamente compatível com o Codex pode ativar o Plugin do Codex, enquanto `agentRuntime.id: "codex"` explícito no provedor/modelo ou referências legadas `codex/<model>` exigem esse Plugin. Um prefixo `openai/*` por si só não o faz.

    Uma nova configuração da OpenAI usa uma referência do GPT-5.6 específica para a rota: a configuração com chave de API seleciona
    `openai/gpt-5.6` (o id simples da API direta é resolvido como Sol), enquanto
    o OAuth do ChatGPT/Codex seleciona exatamente `openai/gpt-5.6-sol` para o catálogo
    nativo do Codex. Modelos principais explícitos existentes, incluindo `openai/gpt-5.5`, são
    preservados quando a autenticação da OpenAI é adicionada ou atualizada. O GPT-5.5 continua disponível
    por qualquer um dos runtimes como uma opção explícita de recuperação para contas sem
    acesso ao GPT-5.6.

  </Accordion>
  <Accordion title="Runtimes da CLI">
    Os runtimes da CLI usam a mesma separação: escolha referências canônicas de modelos, como `anthropic/claude-*` ou `google/gemini-*`, e depois defina a política de runtime do provedor/modelo como `claude-cli` ou `google-gemini-cli` quando quiser um backend de CLI local.

    Referências legadas `claude-cli/*` e `google-gemini-cli/*` são migradas de volta para referências canônicas de provedores, com o runtime registrado separadamente. Referências legadas `codex-cli/*` são migradas para `openai/*` e usam a rota do servidor de aplicativo do Codex; o OpenClaw não mantém mais um backend de CLI do Codex integrado.

  </Accordion>
</AccordionGroup>

## Comportamento do provedor controlado pelo Plugin

A maior parte da lógica específica de cada provedor fica nos plugins de provedor (`registerProvider(...)`), enquanto o OpenClaw mantém o loop genérico de inferência. Os plugins controlam a integração inicial, os catálogos de modelos, o mapeamento de variáveis de ambiente de autenticação, a normalização de transporte/configuração, a limpeza de esquemas de ferramentas, a classificação de failover, a atualização de OAuth, os relatórios de uso, os perfis de pensamento/raciocínio e muito mais.

A lista completa de hooks do SDK de provedores e exemplos de plugins integrados está em [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins). Um provedor que precise de um executor de solicitações totalmente personalizado constitui uma superfície de extensão separada e mais profunda.

<Note>
O comportamento do executor controlado pelo provedor reside em hooks explícitos do provedor, como política de repetição, normalização de esquemas de ferramentas, encapsulamento de fluxos e auxiliares de transporte/solicitação. O conjunto estático legado `ProviderPlugin.capabilities` existe apenas para compatibilidade e não é mais lido pela lógica compartilhada do executor.
</Note>

## Rotação de chaves de API

<AccordionGroup>
  <Accordion title="Fontes e prioridade das chaves">
    Configure várias chaves por meio de:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única em produção, prioridade mais alta)
    - `<PROVIDER>_API_KEYS` (lista separada por vírgulas ou ponto e vírgulas)
    - `<PROVIDER>_API_KEY` (chave principal)
    - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo, `<PROVIDER>_API_KEY_1`)

    Para provedores do Google, `GOOGLE_API_KEY` também é incluída como fallback. A ordem de seleção das chaves preserva a prioridade e elimina valores duplicados.

  </Accordion>
  <Accordion title="Quando a rotação é acionada">
    - As solicitações são repetidas com a próxima chave apenas em respostas de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
    - Falhas que não sejam de limite de taxa encerram o processo imediatamente; nenhuma rotação de chaves é tentada.
    - Quando todas as chaves candidatas falham, o erro final da última tentativa é retornado.

  </Accordion>
</AccordionGroup>

## Plugins oficiais de provedores

Os plugins oficiais de provedores publicam suas próprias entradas no catálogo de modelos. Esses provedores **não** exigem entradas de modelo em `models.providers`; ative o Plugin do provedor, defina a autenticação e escolha um modelo. Use `models.providers` apenas para provedores personalizados explícitos ou configurações específicas de solicitação, como tempos limite.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, além de `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Padrão da configuração inicial: `openai/gpt-5.6`; na API direta, o id simples é resolvido como Sol.
- Exemplos de modelos: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Verifique a disponibilidade da conta/do modelo com `openclaw models list --provider openai` caso uma instalação ou chave de API específica se comporte de maneira diferente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto`; o OpenClaw repassa a escolha do transporte ao runtime compartilhado de modelos.
- Substitua por modelo por meio de `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O processamento prioritário da OpenAI pode ser ativado por meio de `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam solicitações Responses diretas de `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um nível explícito em vez do controle compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são aplicados apenas ao tráfego nativo da OpenAI para `api.openai.com`, não a proxies genéricos compatíveis com a OpenAI
- As rotas nativas da OpenAI também preservam `store` do Responses, dicas de cache de prompts e a formatação da carga útil para compatibilidade com o raciocínio da OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` está disponível apenas pelo OAuth do ChatGPT/Codex; rotas diretas com chave de API da OpenAI e com chave de API do Azure o rejeitam

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Se a organização da API não disponibilizar o GPT-5.6, defina
`openai/gpt-5.5` explicitamente. A integração inicial e a reautenticação normais preservam um
modelo principal explícito existente; `models auth login --set-default` e
`models set` são os caminhos para substituição intencional.

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, além de `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Exemplo de modelo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Solicitações públicas diretas à Anthropic oferecem suporte ao controle compartilhado `/fast` e a `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado a `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` em comparação com `standard_only`)
- A configuração preferencial da CLI do Claude mantém a referência do modelo canônica e seleciona o backend
  da CLI separadamente: `anthropic/claude-opus-4-8` com
  `agentRuntime.id: "claude-cli"` no escopo do modelo. Referências legadas
  `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade.

<Note>
A reutilização da CLI do Claude (`claude -p`) é um caminho de integração autorizado do OpenClaw. A autenticação por token de configuração da Anthropic continua sendo compatível, mas o OpenClaw prefere reutilizar a CLI do Claude quando ela está disponível.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth do OpenAI ChatGPT/Codex

- Provedor: `openai`
- Autenticação: OAuth (ChatGPT)
- Referência inicial do harness nativo do servidor de aplicativo do Codex: `openai/gpt-5.6-sol`
- Documentação do harness nativo do servidor de aplicativo do Codex: [Harness do Codex](/pt-BR/plugins/codex-harness)
- Referências legadas de modelos: `codex/gpt-*`
- Limite do Plugin: `openai/*` carrega o Plugin da OpenAI; a política explícita de runtime ou a rota efetiva controlada pelo provedor determina se o Plugin nativo do servidor de aplicativo do Codex é selecionado.
- CLI: `openclaw onboard --auth-choice openai` ou `openclaw models auth login --provider openai`
- O transporte integrado de ChatGPT Responses do OpenClaw usa `auto` como padrão (WebSocket primeiro, SSE como fallback).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` e `params.fastMode` são configurações de solicitação integrada definidas pelo usuário. Elas mantêm a seleção implícita de runtime no OpenClaw; o Codex nativo controla o transporte e o nível de serviço de seu servidor de aplicativo.
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) são anexados apenas ao tráfego nativo do Codex para `chatgpt.com/backend-api`, não a proxies genéricos compatíveis com a OpenAI
- O controle compartilhado `/fast` continua disponível como controle de runtime; ele é diferente dos parâmetros de modelo definidos pelo usuário.
- O catálogo nativo do Codex pode disponibilizar as referências exatas `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` e `openai/gpt-5.6-luna` de acordo com o acesso da conta. Ele não aplica no cliente o alias simples `gpt-5.6` da API direta.
- `openai/gpt-5.5` usa o `contextWindow = 400000` nativo do catálogo do Codex e o padrão de runtime `contextTokens = 272000`; substitua o limite do runtime com `models.providers.openai.models[].contextTokens`
- Entre com a autenticação `openai` e use `openai/gpt-5.6-sol` para uma nova configuração baseada em assinatura. Se esse espaço de trabalho do Codex não disponibilizar o GPT-5.6, selecione `openai/gpt-5.5` explicitamente.
- Use `agentRuntime.id: "openclaw"` no provedor/modelo para manter no runtime integrado uma rota que, de outra forma, seria elegível. Quando o runtime não está definido ou é `auto`, apenas uma rota oficial HTTPS exata compatível com Responses/ChatGPT e sem substituição de solicitação definida pelo usuário pode selecionar o Codex implicitamente.
- Referências legadas do GPT do Codex são estado legado, não uma rota ativa de provedor. Use referências canônicas `openai/*` para novas configurações de agente e execute `openclaw doctor --fix` para migrar referências antigas e legadas de modelos do Codex sem atualizar uma seleção explícita existente de `openai/gpt-5.5`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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

### Outras opções hospedadas no estilo de assinatura

<CardGroup cols={3}>
  <Card title="MiniMax" href="/pt-BR/providers/minimax">
    Acesso ao MiniMax Coding Plan por OAuth ou chave de API.
  </Card>
  <Card title="Qwen Cloud" href="/pt-BR/providers/qwen">
    Interface do provedor Qwen Cloud, além do mapeamento de endpoints do Alibaba DashScope e do Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/pt-BR/providers/zai">
    Coding Plan da Z.AI ou endpoints gerais da API.
  </Card>
</CardGroup>

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor do runtime Zen: `opencode`
- Provedor do runtime Go: `opencode-go`
- Exemplos de modelos: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Exemplos de modelos: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Compatibilidade: configurações legadas do OpenClaw que usam `google/gemini-3.1-flash-preview` são normalizadas para `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` é aceito e normalizado para o ID ativo da API Gemini do Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Raciocínio: `/think adaptive` usa o raciocínio dinâmico do Google. Gemini 3/3.1 omitem um `thinkingLevel` fixo; Gemini 2.5 envia `thinkingBudget: -1`.
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent` (ou o legado `cached_content`) para encaminhar um identificador `cachedContents/...` nativo do provedor; acertos no cache do Gemini são apresentados como `cacheRead` do OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: o Vertex usa o ADC do gcloud; o Gemini CLI usa seu fluxo OAuth

<Warning>
O OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições em contas do Google após usarem clientes de terceiros. Consulte os termos do Google e use uma conta não crítica caso decida prosseguir.
</Warning>

O OAuth do Gemini CLI é fornecido como parte do plugin `google` incluído.

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
  <Step title="Ativar o plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Fazer login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`. Você **não** cola um ID nem um segredo de cliente em `openclaw.json`. O fluxo de login da CLI armazena os tokens em perfis de autenticação no host do Gateway.

  </Step>
  <Step title="Definir o projeto (se necessário)">
    Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway.
  </Step>
</Steps>

O Gemini CLI usa `stream-json` por padrão. O OpenClaw lê as mensagens do fluxo
do assistente e normaliza `stats.cached` para `cacheRead`; substituições legadas de
`--output-format json` ainda leem o texto da resposta em `response`.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Exemplo de modelo: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - As referências de modelos usam o ID de provedor canônico `zai/*`.
  - `zai-api-key` detecta automaticamente o endpoint correspondente da Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma interface específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Exemplos de modelos: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Outros plugins de provedores incluídos

| Provedor                                | ID                               | Variável de ambiente de autenticação                 | Exemplo de modelo                                          |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` ou `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` ou `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/pt-BR/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OAuth do OpenRouter ou `OPENROUTER_API_KEY`          | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [OAuth do Qwen](/pt-BR/providers/qwen-oauth)  | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth do SuperGrok/X Premium ou `XAI_API_KEY`        | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularidades que vale a pena conhecer

<AccordionGroup>
  <Accordion title="OpenRouter">
    Aplica seus cabeçalhos de atribuição de aplicativo e marcadores `cache_control` da Anthropic somente em rotas `openrouter.ai` verificadas. Referências do DeepSeek, Moonshot e ZAI são elegíveis a TTL de cache para o cache de prompts gerenciado pelo OpenRouter, mas não recebem marcadores de cache da Anthropic. Como um caminho compatível com OpenAI no estilo proxy, ele ignora ajustes exclusivos do OpenAI nativo (`serviceTier`, `store` da Responses, dicas de cache de prompts e compatibilidade de raciocínio da OpenAI). Referências baseadas no Gemini mantêm somente a sanitização de assinatura de pensamento do Gemini via proxy.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referências baseadas no Gemini seguem o mesmo caminho de sanitização do Gemini via proxy; `kilocode/kilo/auto` e outras referências sem suporte a raciocínio via proxy ignoram a injeção de raciocínio via proxy.
  </Accordion>
  <Accordion title="MiniMax">
    A integração com chave de API grava definições explícitas dos modelos de chat M3 e M2.7; a compreensão de imagens permanece no provedor de mídia `MiniMax-VL-01`, pertencente ao plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Os IDs de modelo usam um namespace `nvidia/<vendor>/<model>` (por exemplo, `nvidia/nvidia/nemotron-...` junto com `nvidia/moonshotai/kimi-k2.5`); os seletores preservam a composição literal `<provider>/<model-id>`, enquanto a chave canônica enviada à API permanece com um único prefixo.
  </Accordion>
  <Accordion title="xAI">
    Usa o caminho Responses da xAI. O caminho recomendado é OAuth do SuperGrok/X Premium; as chaves de API ainda funcionam por meio de `XAI_API_KEY` ou da configuração do plugin, e o `web_search` do Grok reutiliza o mesmo perfil de autenticação antes de recorrer à chave de API. O Grok 4.5 pode ser selecionado para chat, programação e trabalho agêntico onde estiver disponível; `grok-4.3` continua sendo o padrão incluído seguro para regiões. Configurações antigas de `/fast` e `params.fastMode: true` ainda são resolvidas pelos redirecionamentos de compatibilidade do Grok 4.3 da xAI, mas novas configurações devem selecionar diretamente um modelo atual. `tool_stream` fica ativado por padrão; desative por meio de `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provedores por meio de `models.providers` (URL personalizada/base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor incluídos abaixo já publicam um catálogo padrão. Use entradas explícitas de `models.providers.<id>` somente quando quiser substituir a URL base, os cabeçalhos ou a lista de modelos padrão.

As verificações de capacidade de modelo do Gateway também leem os metadados explícitos de `models.providers.<id>.models[]`. Se um modelo personalizado ou via proxy aceitar imagens, defina `input: ["text", "image"]` nesse modelo para que o WebChat e os caminhos de anexos originados em nodes transmitam imagens como entradas nativas do modelo, em vez de referências de mídia somente de texto.

`agents.defaults.models["provider/model"]` controla apenas a visibilidade dos modelos, aliases e metadados por modelo para os agentes. Ele não registra sozinho um novo modelo de runtime. Para modelos de provedores personalizados, adicione também `models.providers.<provider>.models[]` com pelo menos o `id` correspondente.

### Moonshot AI (Kimi)

Instale `@openclaw/moonshot-provider` antes da integração. Adicione uma entrada explícita de `models.providers.moonshot` somente quando precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
- Exemplo de modelo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo do Kimi K2:

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

Consulte [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot) para obter o guia completo de configuração.

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

- Provedor: `kimi`
- Autenticação: `KIMI_API_KEY`
- Exemplo de modelo: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Os modelos legados `kimi/kimi-code` e `kimi/k2p5` continuam sendo aceitos como IDs de modelo de compatibilidade e são normalizados para o ID de modelo estável da API do Kimi.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

- Provedor: `volcengine` (programação: `volcengine-plan`)
- Autenticação: `VOLCANO_ENGINE_API_KEY`
- Exemplo de modelo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

A integração usa por padrão a superfície de programação, mas o catálogo geral `volcengine/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a opção de autenticação da Volcengine prioriza tanto as linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo sem filtro, em vez de exibir um seletor vazio com escopo restrito ao provedor.

<Tabs>
  <Tab title="Modelos padrão">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Modelos de programação (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (internacional)

O BytePlus ARK fornece aos usuários internacionais acesso aos mesmos modelos que o Volcano Engine.

- Provedor: `byteplus` (programação: `byteplus-plan`)
- Autenticação: `BYTEPLUS_API_KEY`
- Exemplo de modelo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

A integração usa por padrão a superfície de programação, mas o catálogo geral `byteplus/*` é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a opção de autenticação da BytePlus prioriza tanto as linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo sem filtro, em vez de exibir um seletor vazio com escopo restrito ao provedor.

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

A Synthetic fornece modelos compatíveis com Anthropic por meio do provedor `synthetic`:

- Provedor: `synthetic`
- Autenticação: `SYNTHETIC_API_KEY`
- Exemplo de modelo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

O MiniMax é configurado por meio de `models.providers` porque usa endpoints personalizados:

- OAuth do MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth do MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Chave de API do MiniMax (global): `--auth-choice minimax-global-api`
- Chave de API do MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para obter detalhes de configuração, opções de modelos e trechos de configuração.

<Note>
No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o raciocínio por padrão para a família M2.x, a menos que você o defina explicitamente; o MiniMax-M3 (e M3.x) permanece por padrão no caminho de raciocínio omitido/adaptativo do provedor. `/fast on` reescreve `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
</Note>

Divisão de capacidades pertencentes ao plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M3`
- A geração de imagens é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagens pertence ao plugin `MiniMax-VL-01` em ambos os caminhos de autenticação do MiniMax
- A pesquisa na web permanece no ID de provedor `minimax`

### LM Studio

O LM Studio é fornecido como um plugin de provedor incluído que usa a API nativa:

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

O OpenClaw usa os endpoints nativos `/api/v1/models` e `/api/v1/models/load` do LM Studio para descoberta e carregamento automático, com `/v1/chat/completions` para inferência por padrão. Se quiser que o carregamento JIT, o TTL e a remoção automática do LM Studio controlem o ciclo de vida do modelo, defina `models.providers.lmstudio.params.preload: false`. Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para obter instruções de configuração e solução de problemas.

### Ollama

O Ollama é fornecido como um plugin de provedor incluído e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma necessária (servidor local)
- Exemplo de modelo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e, em seguida, baixe um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você adere por meio de `OLLAMA_API_KEY`, e o plugin de provedor incluído adiciona o Ollama diretamente ao `openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama) para obter informações sobre integração, modo em nuvem/local e configuração personalizada.

### vLLM

O vLLM é fornecido como um plugin de provedor incluído para servidores locais/auto-hospedados compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para aderir à descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

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

Consulte [/providers/vllm](/pt-BR/providers/vllm) para obter detalhes.

### SGLang

O SGLang é fornecido como um plugin de provedor incluído para servidores rápidos e auto-hospedados compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para aderir à descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

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

Consulte [/providers/sglang](/pt-BR/providers/sglang) para obter detalhes.

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

    Recomendação: defina valores explícitos que correspondam aos limites do seu proxy/modelo.

  </Accordion>
  <Accordion title="Regras de formatação de rotas de proxy">
    - Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor devido a funções `developer` sem suporte.
    - Rotas compatíveis com OpenAI no estilo proxy também ignoram a formatação de solicitações exclusiva da OpenAI nativa: sem `service_tier`, sem `store` de Responses, sem `store` de Completions, sem dicas de cache de prompts, sem formatação de payload de compatibilidade de raciocínio da OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
    - Para proxies de Completions compatíveis com OpenAI que precisam de campos específicos do fornecedor, defina `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) para mesclar JSON adicional ao corpo da solicitação de saída.
    - Para controles de modelo de chat do vLLM, defina `agents.defaults.models["provider/model"].params.chat_template_kwargs`. O plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true` para `vllm/nemotron-3-*` quando o nível de raciocínio da sessão está desativado.
    - Para modelos locais lentos ou hosts remotos de LAN/tailnet, defina `models.providers.<id>.timeoutSeconds`. Isso estende o processamento de solicitações HTTP do modelo pelo provedor, incluindo conexão, cabeçalhos, streaming do corpo e o cancelamento total da busca protegida, sem aumentar o tempo limite de toda a execução do agente. Se `agents.defaults.timeoutSeconds` ou um tempo limite específico da execução for menor, aumente também esse limite máximo; os tempos limite do provedor não podem estender toda a execução.
    - As chamadas HTTP ao provedor do modelo permitem respostas DNS de IP falso do Surge, Clash e sing-box em `198.18.0.0/15` e `fc00::/7` somente para o nome de host do `baseUrl` configurado do provedor. Endpoints de provedores personalizados/locais também confiam na origem exata `scheme://host:port` configurada para solicitações protegidas ao modelo, incluindo hosts de loopback, LAN e tailnet. Esta não é uma nova opção de configuração; o `baseUrl` configurado estende a política de solicitações somente para essa origem. A permissão de nomes de host com IP falso e a confiança na origem exata são mecanismos independentes. Outros destinos privados, de loopback, link-local e de metadados, além de portas diferentes, ainda exigem a ativação explícita de `models.providers.<id>.request.allowPrivateNetwork: true`. Defina `models.providers.<id>.request.allowPrivateNetwork: false` para desativar a confiança na origem exata.
    - Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
    - Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints `openai-completions` não nativos.
    - Para `api: "anthropic-messages"` em endpoints não diretos (qualquer provedor que não seja o `anthropic` canônico ou um `models.providers.anthropic.baseUrl` personalizado cujo host não seja um endpoint público de `api.anthropic.com`), o OpenClaw suprime cabeçalhos beta implícitos da Anthropic, como `claude-code-20250219`, `interleaved-thinking-2025-05-14` e marcadores OAuth, para que proxies personalizados compatíveis com a Anthropic não rejeitem sinalizadores beta sem suporte. Defina `models.providers.<id>.headers["anthropic-beta"]` explicitamente se o seu proxy precisar de recursos beta específicos.

  </Accordion>
</AccordionGroup>

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [Configuração](/pt-BR/gateway/configuration) para ver exemplos completos de configuração.

## Relacionados

- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - chaves de configuração do modelo
- [Failover de modelos](/pt-BR/concepts/model-failover) - cadeias de fallback e comportamento de novas tentativas
- [Modelos](/pt-BR/concepts/models) - configuração e aliases de modelos
- [Provedores](/pt-BR/providers) - guias de configuração por provedor
