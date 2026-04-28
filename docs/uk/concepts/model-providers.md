---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд онбордингу CLI для постачальників моделей
sidebarTitle: Model providers
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-28T00:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fc7c5ba37f321906ec06733fb9c20ea346014279563db5dc6b723dc3c0cdd23
    source_path: concepts/model-providers.md
    workflow: 15
---

Довідник для **постачальників LLM/моделей** (а не чат-каналів на кшталт WhatsApp/Telegram). Правила вибору моделей див. у [Models](/uk/concepts/models).

## Швидкі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та допоміжні команди CLI">
    - Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` працює як список дозволених значень, якщо його задано.
    - Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають типові значення на рівні постачальника; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для окремої моделі.
    - Правила резервного перемикання, cooldown-проби та збереження перевизначень сесії див. у [Model failover](/uk/concepts/model-failover).
  </Accordion>
  <Accordion title="Поділ постачальника/середовища виконання OpenAI">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` використовує прямого постачальника API-ключів OpenAI у PI.
    - `openai-codex/<model>` використовує Codex OAuth у PI.
    - `openai/<model>` разом із `agents.defaults.agentRuntime.id: "codex"` використовує нативний app-server harness Codex.

    Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо поділ постачальника/середовища виконання заплутує, спочатку прочитайте [Agent runtimes](/uk/concepts/agent-runtimes).

    Автоматичне ввімкнення Plugin дотримується тієї самої межі: `openai-codex/<model>` належить Plugin OpenAI, тоді як Plugin Codex вмикається через `agentRuntime.id: "codex"` або застарілі посилання `codex/<model>`.

    GPT-5.5 доступна через `openai/gpt-5.5` для прямого трафіку з API-ключем, `openai-codex/gpt-5.5` у PI для Codex OAuth, а також через нативний app-server harness Codex, коли задано `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="Середовища виконання CLI">
    Середовища виконання CLI використовують той самий поділ: вибирайте канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задайте `agents.defaults.agentRuntime.id` як `claude-cli`, `google-gemini-cli` або `codex-cli`, якщо вам потрібен локальний бекенд CLI.

    Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань постачальників, а середовище виконання записується окремо.

  </Accordion>
</AccordionGroup>

## Поведінка постачальників, якою володіє Plugin

Більшість логіки, специфічної для постачальників, живе в Plugin постачальників (`registerProvider(...)`), тоді як OpenClaw зберігає узагальнений цикл інференсу. Plugins відповідають за онбординг, каталоги моделей, зіставлення auth env-var, нормалізацію транспорту/конфігурації, очищення схем інструментів, класифікацію резервного перемикання, оновлення OAuth, звітування про використання, профілі thinking/reasoning тощо.

Повний список хуків SDK постачальників і прикладів вбудованих Plugins наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Постачальник, якому потрібен повністю кастомний виконавець запитів, використовує окрему, глибшу поверхню розширення.

<Note>
`capabilities` середовища виконання постачальника — це спільні метадані раннера (сімейство постачальника, особливості transcript/tooling, підказки для transport/cache). Це не те саме, що [public capability model](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий інференс, мовлення тощо).
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список, розділений комами або крапками з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)

    Для постачальників Google також як резервне значення використовується `GOOGLE_API_KEY`. Порядок вибору ключів зберігає пріоритет і усуває дублікати значень.

  </Accordion>
  <Accordion title="Коли вмикається ротація">
    - Запити повторюються з наступним ключем лише у відповідь на rate-limit (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
    - Збої, не пов’язані з rate-limit, завершуються одразу; ротація ключів не виконується.
    - Коли всі можливі ключі завершуються помилкою, повертається фінальна помилка з останньої спроби.
  </Accordion>
</AccordionGroup>

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна** конфігурація `models.providers`; просто налаштуйте auth і виберіть модель.

### OpenAI

- Постачальник: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевіряйте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`, якщо конкретне встановлення або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, із резервним переходом на SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму зіставляють запити Responses `openai/*` з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до загальних OpenAI-сумісних proxy
- Нативні маршрути OpenAI також зберігають `store` із Responses, підказки prompt-cache і формування payload для сумісності з OpenAI reasoning; proxy-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити до OpenAI API його відхиляють, а поточний каталог Codex його не показує

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком з API-ключем та OAuth-автентифікацією, що надсилається на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Рекомендована конфігурація Claude CLI зберігає канонічне посилання на модель і окремо вибирає CLI-бекенд: `anthropic/claude-opus-4-7` з `agents.defaults.agentRuntime.id: "claude-cli"`. Застарілі посилання `claude-cli/claude-opus-4-7` усе ще працюють для сумісності.

<Note>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` дозволеними для цієї інтеграції, якщо Anthropic не опублікує нову політику. Токен налаштування Anthropic і далі доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Постачальник: `openai-codex`
- Auth: OAuth (ChatGPT)
- Посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання на нативний app-server harness Codex: `openai/gpt-5.5` з `agents.defaults.agentRuntime.id: "codex"`
- Документація нативного app-server harness Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex вибирається лише середовищем виконання Codex harness або застарілими посиланнями `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий transport — `auto` (спочатку WebSocket, із резервним переходом на SSE)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex на `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних proxy
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативні значення каталогу Codex `contextWindow = 400000` і типове для середовища виконання `contextTokens = 272000`; перевизначайте ліміт середовища виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, таких як OpenClaw.
- Використовуйте `openai-codex/gpt-5.5`, коли вам потрібен маршрут Codex OAuth/підписки; використовуйте `openai/gpt-5.5`, коли ваше налаштування API-ключа та локальний каталог відкривають публічний маршрут API.

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

### Інші розміщені варіанти в стилі підписки

<CardGroup cols={3}>
  <Card title="Моделі GLM" href="/uk/providers/glm">
    План Z.AI Coding або загальні кінцеві точки API.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    OAuth плану MiniMax Coding або доступ за API-ключем.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня постачальника Qwen Cloud, а також зіставлення кінцевих точок Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник середовища виконання Zen: `opencode`
- Постачальник середовища виконання Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Постачальник: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервне значення `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застарілу конфігурацію OpenClaw з `google/gemini-3.1-flash-preview` нормалізовано до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` використовує динамічне thinking Google. Gemini 3/3.1 не мають фіксованого `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застарілий `cached_content`) для передавання нативного дескриптора постачальника `cachedContents/...`; потрапляння в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує свій потік OAuth

<Warning>
Gemini CLI OAuth в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
</Warning>

Gemini CLI OAuth постачається як частина вбудованого Plugin `google`.

<Steps>
  <Step title="Встановіть Gemini CLI">
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
  <Step title="Увімкніть plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Увійдіть">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Типова модель: `google-gemini-cli/gemini-3-flash-preview`. Ви **не** вставляєте client id або secret у `openclaw.json`. Потік входу CLI зберігає токени в auth profiles на хості gateway.

  </Step>
  <Step title="Задайте проєкт (за потреби)">
    Якщо після входу запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway.
  </Step>
</Steps>

JSON-відповіді Gemini CLI розбираються з `response`; дані про використання резервно беруться з `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Базова URL-адреса: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог середовища виконання.
- Точна маршрутизація вгору за течією для `kilocode/kilo/auto` належить Kilo Gateway, а не жорстко закодована в OpenClaw.

Докладні відомості про налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugins постачальників

| Постачальник            | Id                               | Auth env                                                     | Приклад моделі                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`          |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` або `KIMICODE_API_KEY`                        | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

#### Особливості, які варто знати

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI мають право на cache-TTL для prompt caching, яким керує OpenRouter, але не отримують маркери кешу Anthropic. Як OpenAI-сумісний шлях у стилі proxy, він пропускає формування, доступне лише для нативного OpenAI (`serviceTier`, `store` у Responses, підказки prompt-cache, сумісність із OpenAI reasoning). Посилання на базі Gemini зберігають лише очищення thought-signature для proxy Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Посилання на базі Gemini дотримуються того самого шляху очищення для proxy Gemini; `kilocode/kilo/auto` та інші посилання, які не підтримують reasoning через proxy, пропускають ін’єкцію reasoning для proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Онбординг за API-ключем записує явні визначення chat-моделей M2.7 лише для тексту; розуміння зображень залишається на медіа-постачальнику `MiniMax-VL-01`, яким володіє Plugin.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписують `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` типово ввімкнено; вимкнення через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Постачається як вбудований Plugin постачальника `cerebras`. GLM використовує `zai-glm-4.7`; OpenAI-сумісна базова URL-адреса — `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **custom** постачальників або OpenAI/Anthropic‑сумісні proxy.

Багато з наведених нижче вбудованих Plugins постачальників уже публікують типовий каталог. Явні записи `models.providers.<id>` використовуйте лише тоді, коли хочете перевизначити типову base URL, headers або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin постачальника. Типово використовуйте вбудованого постачальника і додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базову URL-адресу або метадані моделі:

- Постачальник: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Ідентифікатори моделей Kimi K2:

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

Kimi Coding використовує Anthropic-сумісну кінцеву точку Moonshot AI:

- Постачальник: `kimi`
- Auth: `KIMI_API_KEY`
- Приклад моделі: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Застарілий `kimi/k2p5` і далі приймається як ідентифікатор моделі для сумісності.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Постачальник: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Приклад моделі: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Онбординг типово використовує поверхню coding, але загальний каталог `volcengine/*` реєструється одночасно.

У вибірниках моделей для онбордингу/налаштування вибору auth Volcengine надає перевагу рядкам і `volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу, а не показує порожній вибірник у межах постачальника.

<Tabs>
  <Tab title="Стандартні моделі">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Моделі для coding (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus (міжнародний)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Постачальник: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Приклад моделі: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Онбординг типово використовує поверхню coding, але загальний каталог `byteplus/*` реєструється одночасно.

У вибірниках моделей для онбордингу/налаштування вибір auth BytePlus надає перевагу рядкам і `byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу, а не показує порожній вибірник у межах постачальника.

<Tabs>
  <Tab title="Стандартні моделі">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)
  </Tab>
  <Tab title="Моделі для coding (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic надає Anthropic-сумісні моделі через постачальника `synthetic`:

- Постачальник: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Приклад моделі: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax налаштовується через `models.providers`, оскільки використовує custom-кінцеві точки:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-ключ (Global): `--auth-choice minimax-global-api`
- MiniMax API-ключ (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Докладні відомості про налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

<Note>
На Anthropic-сумісному шляху потокової передачі MiniMax OpenClaw типово вимикає thinking, якщо ви не задали його явно, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Розподіл можливостей, яким володіє Plugin:

- Типові значення для тексту/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, яким володіє Plugin, на обох шляхах auth MiniMax
- Вебпошук залишається на id постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, який використовує нативний API:

- Постачальник: `lmstudio`
- Auth: `LM_API_TOKEN`
- Типова базова URL-адреса для інференсу: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, повернених `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні для LM Studio `/api/v1/models` і `/api/v1/models/load` для виявлення й автозавантаження, а `/v1/chat/completions` — типово для інференсу. Докладні відомості про налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований Plugin постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
- Auth: не потрібен (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Встановлення: [https://ollama.com/download](https://ollama.com/download)

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, якщо ви виконаєте opt-in через `OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до `openclaw onboard` і до вибірника моделей. Докладні відомості про онбординг, хмарний/локальний режим і custom-конфігурацію див. у [/providers/ollama](/uk/providers/ollama).

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/self-hosted OpenAI-сумісних серверів:

- Постачальник: `vllm`
- Auth: необов’язковий (залежить від вашого сервера)
- Типова base URL: `http://127.0.0.1:8000/v1`

Щоб локально виконати opt-in для автовиявлення (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з id, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Докладні відомості див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких self-hosted OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Auth: необов’язковий (залежить від вашого сервера)
- Типова base URL: `http://127.0.0.1:30000/v1`

Щоб локально виконати opt-in для автовиявлення (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з id, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Докладні відомості див. у [/providers/sglang](/uk/providers/sglang).

### Локальні proxy (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI‑сумісний):

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
  <Accordion title="Типові необов’язкові поля">
    Для custom-постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими. Якщо їх пропущено, OpenClaw типово використовує:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендація: задавайте явні значення, що відповідають обмеженням вашого proxy/моделі.

  </Accordion>
  <Accordion title="Правила формування маршрутів proxy">
    - Для `api: "openai-completions"` на ненативних кінцевих точках (будь-який непорожній `baseUrl`, у якого host не `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від постачальника для непідтримуваних ролей `developer`.
    - Маршрути OpenAI-сумісних proxy у стилі proxy також пропускають формування запитів, доступне лише для нативного OpenAI: без `service_tier`, без `store` у Responses, без `store` у Completions, без підказок prompt-cache, без формування payload для сумісності з OpenAI reasoning і без прихованих заголовків атрибуції OpenClaw.
    - Для OpenAI-сумісних proxy Completions, яким потрібні поля, специфічні для постачальника, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об’єднати додатковий JSON у вихідне тіло запиту.
    - Для керування `chat_template` у vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень thinking у сесії вимкнено.
    - Для повільних локальних моделей або віддалених хостів у LAN/tailnet задайте `models.providers.<id>.timeoutSeconds`. Це подовжує обробку HTTP-запитів моделі постачальника, включно з підключенням, заголовками, потоковою передачею тіла та загальним guarded-fetch abort, не збільшуючи при цьому timeout усього середовища виконання агента.
    - Якщо `baseUrl` порожній або не заданий, OpenClaw зберігає типову поведінку OpenAI (яка вказує на `api.openai.com`).
    - З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних кінцевих точках `openai-completions`.
  </Accordion>
</AccordionGroup>

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Configuration reference](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Model failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Models](/uk/concepts/models) — конфігурація моделей і аліаси
- [Providers](/uk/providers) — посібники з налаштування для кожного постачальника окремо
