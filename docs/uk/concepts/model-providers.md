---
read_when:
    - Потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команди онбордингу CLI для постачальників моделей
summary: Огляд постачальника моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-24T05:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Ця сторінка охоплює **постачальників LLM/моделей** (а не чат-канали на кшталт WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- `agents.defaults.models` працює як allowlist, коли його задано.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі; `contextTokens` — це фактичне обмеження середовища виконання.
- Правила резервного перемикання, перевірки cooldown і збереження перевизначень сеансу: [Відмовостійкість моделей](/uk/concepts/model-failover).
- Маршрути сімейства OpenAI залежать від префікса: `openai/<model>` використовує прямого постачальника API-ключа OpenAI у PI, `openai-codex/<model>` використовує OAuth Codex у PI, а `openai/<model>` разом із `agents.defaults.embeddedHarness.runtime: "codex"` використовує нативний harness app-server Codex. Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness).
- Автоматичне ввімкнення Plugin дотримується цієї ж межі: `openai-codex/<model>` належить до Plugin OpenAI, тоді як Plugin Codex вмикається через `embeddedHarness.runtime: "codex"` або застарілі посилання `codex/<model>`.
- GPT-5.5 наразі доступна через маршрути підписки/OAuth: `openai-codex/gpt-5.5` у PI або `openai/gpt-5.5` з harness app-server Codex. Прямий маршрут API-ключа для `openai/gpt-5.5` підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте моделі з доступом через API, як-от `openai/gpt-5.4`, для конфігурацій `OPENAI_API_KEY`.

## Поведінка постачальників, що належить Plugin

Більшість специфічної для постачальника логіки живе в Plugin постачальників (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл інференсу. Plugin відповідають за онбординг, каталоги моделей, зіставлення auth env-var, нормалізацію транспорту/конфігурації, очищення схем інструментів, класифікацію failover, оновлення OAuth, звітування про використання, профілі thinking/reasoning тощо.

Повний список хуків provider-SDK і приклади вбудованих Plugin наведено в [Plugin постачальників](/uk/plugins/sdk-provider-plugins). Постачальник, якому потрібен повністю власний виконавець запитів, є окремою, глибшою поверхнею розширення.

<Note>
Runtime `capabilities` постачальника — це спільні метадані раннера (сімейство постачальника, особливості transcript/tooling, підказки для транспорту/кешу). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий інференс, мовлення тощо).
</Note>

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google як fallback також включається `GOOGLE_API_KEY`.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit помилки (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з rate-limit, завершуються негайно; ротація ключів не виконується.
- Коли всі доступні ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна**
конфігурація `models.providers`; достатньо налаштувати auth і вибрати модель.

### OpenAI

- Постачальник: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Пряма підтримка API для GPT-5.5 тут готова заздалегідь, щойно OpenAI відкриє GPT-5.5 в API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Попередній прогрів OpenAI Responses WebSocket типово ввімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму зіставляють запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки кешу prompt і формування payload для сумісності з OpenAI reasoning; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити OpenAI API його відхиляють, а поточний каталог Codex його не надає

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим через API-ключ і OAuth, що надсилається на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Постачальник: `openai-codex`
- Auth: OAuth (ChatGPT)
- Посилання на модель у PI: `openai-codex/gpt-5.5`
- Посилання нативного harness app-server Codex: `openai/gpt-5.5` з `agents.defaults.embeddedHarness.runtime: "codex"`
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex вибирається лише рантаймом Codex harness або застарілими посиланнями `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий транспорт — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` зберігає нативні `contextWindow = 1000000` і типове runtime-обмеження `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/процесів на кшталт OpenClaw.
- Поточний доступ до GPT-5.5 використовує цей маршрут OAuth/підписки, доки OpenAI не ввімкне GPT-5.5 у публічному API.

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

### Інші розміщені варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud, а також зіставлення кінцевих точок Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): OAuth або доступ за API-ключем MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): кінцеві точки Z.AI Coding Plan або загального API

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник runtime Zen: `opencode`
- Постачальник runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Постачальник: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання нативного
  дескриптора `cachedContents/...`; попадання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження Google-акаунтів після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний акаунт, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає токени в auth profiles на хості Gateway.
  - Якщо після входу запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; дані про використання беруться з `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Базовий URL: `https://api.kilo.ai/api/gateway/`
- Статичний fallback-каталог постачається з `kilocode/kilo/auto`; live-виявлення через
  `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог runtime.
- Точна маршрутизація апстриму за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugin постачальників

| Постачальник            | Id                               | Auth env                                                     | Приклад моделі                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
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

Варто знати такі особливості:

- **OpenRouter** застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Як проксі-стиль OpenAI-сумісного шляху, він пропускає формування, притаманне лише нативному OpenAI (`serviceTier`, Responses `store`, підказки кешу prompt, сумісність reasoning OpenAI). Посилання на основі Gemini зберігають лише очищення thought-signature для проксі Gemini.
- **Kilo Gateway** для посилань на основі Gemini дотримується того самого шляху очищення проксі Gemini; `kilocode/kilo/auto` та інші посилання, де reasoning через проксі не підтримується, пропускають ін’єкцію reasoning через проксі.
- **MiniMax** онбординг за API-ключем записує явні визначення моделей M2.7 з `input: ["text", "image"]`; вбудований каталог зберігає chat-посилання лише текстовими, доки цю конфігурацію не буде матеріалізовано.
- **xAI** використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` типово ввімкнено; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; базовий URL, сумісний з OpenAI, — `https://api.cerebras.ai/v1`.

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** постачальників або
OpenAI/Anthropic-сумісні проксі.

Багато вбудованих нижче Plugin постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin постачальника. Типово використовуйте
вбудованого постачальника і додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

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

### Kimi Coding

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

Застарілий `kimi/k2p5` і далі приймається як сумісний id моделі.

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

Онбординг типово використовує поверхню coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У засобах вибору моделі під час онбордингу/налаштування вибір auth для Volcengine надає перевагу рядкам
`volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
засіб вибору в межах постачальника.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Моделі coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

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

Онбординг типово використовує поверхню coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У засобах вибору моделі під час онбордингу/налаштування вибір auth для BytePlus надає перевагу обом
рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
засіб вибору в межах постачальника.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Моделі coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

MiniMax налаштовується через `models.providers`, оскільки використовує власні кінцеві точки:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (Global): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному потоковому шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розділення можливостей, що належить Plugin:

- Типові значення text/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це керований Plugin `MiniMax-VL-01` на обох шляхах auth MiniMax
- Вебпошук залишається на id постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, який використовує нативний API:

- Постачальник: `lmstudio`
- Auth: `LM_API_TOKEN`
- Типовий base URL інференсу: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio
для виявлення й автозавантаження, а `/v1/chat/completions` типово — для інференсу.
Інструкції з налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований Plugin постачальника і використовує нативний API Ollama:

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте це через
`OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/self-hosted OpenAI-сумісних
серверів:

- Постачальник: `vllm`
- Auth: необов’язковий (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з id, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Подробиці див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких self-hosted
OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Auth: необов’язковий (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не
вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з id, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Подробиці див. у [/providers/sglang](/uk/providers/sglang).

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

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

Примітки:

- Для власних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх пропущено, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних кінцевих точках (будь-який непорожній `baseUrl`, у якого host не `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від постачальника через непідтримувані ролі `developer`.
- OpenAI-сумісні маршрути у стилі проксі також пропускають формування запитів, притаманне лише нативному OpenAI: без `service_tier`, без Responses `store`, без підказок кешу prompt, без формування payload для сумісності з OpenAI reasoning і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає типову поведінку OpenAI (яка веде до `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних кінцевих точках `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язані сторінки

- [Моделі](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Відмовостійкість моделей](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Постачальники](/uk/providers) — інструкції з налаштування для кожного постачальника
