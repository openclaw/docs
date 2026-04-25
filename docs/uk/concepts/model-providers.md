---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного provider окремо
    - Вам потрібні приклади конфігурацій або команд початкового налаштування CLI для provider-ів моделей
summary: Огляд provider-ів моделей із прикладами конфігурацій і потоками CLI
title: Provider-и моделей
x-i18n:
    generated_at: "2026-04-25T05:55:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdab460823e3138377a7e2b183b31caa64bb2eef4c9e77ebd8db0aacc97493bb
    source_path: concepts/model-providers.md
    workflow: 15
---

Довідник для **provider-ів LLM/моделей** (а не каналів чату, як-от WhatsApp/Telegram). Правила вибору моделей див. у [Моделі](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- `agents.defaults.models` працює як allowlist, якщо його задано.
- Helper-и CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі; `contextTokens` — це фактичне обмеження під час виконання.
- Правила fallback, cooldown probes і збереження session-override: [Перемикання моделей при збоях](/uk/concepts/model-failover).
- Маршрути родини OpenAI залежать від префікса: `openai/<model>` використовує прямий provider API key OpenAI у PI, `openai-codex/<model>` використовує Codex OAuth у PI, а `openai/<model>` плюс `agents.defaults.embeddedHarness.runtime: "codex"` використовує нативний harness app-server Codex. Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо поділ між provider і runtime заплутує, спершу прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes).
- Автоувімкнення Plugin дотримується тієї самої межі: `openai-codex/<model>` належить Plugin OpenAI, тоді як Plugin Codex вмикається через `embeddedHarness.runtime: "codex"` або застарілі посилання `codex/<model>`.
- Середовища CLI використовують той самий поділ: вибирайте канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задавайте `agents.defaults.embeddedHarness.runtime` як `claude-cli`, `google-gemini-cli` або `codex-cli`, якщо хочете локальний backend CLI. Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань provider, а runtime записується окремо.
- GPT-5.5 зараз доступна через маршрути subscription/OAuth: `openai-codex/gpt-5.5` у PI або `openai/gpt-5.5` із harness app-server Codex. Прямий маршрут API key для `openai/gpt-5.5` підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу для конфігурацій `OPENAI_API_KEY` використовуйте моделі з доступним API, наприклад `openai/gpt-5.4`.

## Поведінка provider-ів, що належить Plugin

Більшість provider-специфічної логіки знаходиться в provider Plugin (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл inference. Plugin-и відповідають за onboarding, каталоги моделей, зіставлення auth env-var, нормалізацію transport/config, очищення схем інструментів, класифікацію failover, оновлення OAuth, звітування про використання, профілі thinking/reasoning тощо.

Повний список хуків provider-SDK і прикладів bundled Plugin наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Provider, якому потрібен повністю власний виконавець запитів, — це окрема, глибша поверхня розширення.

<Note>
`capabilities` runtime provider-а — це спільні метадані runner-а (родина provider-а, особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що [публічна модель capability](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (text inference, speech тощо).
</Note>

## Ротація API key

- Підтримується загальна ротація provider-ів для вибраних provider-ів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (один live override, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для provider-ів Google також використовується `GOOGLE_API_KEY` як fallback.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідях rate-limit (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміти використання).
- Збої, не пов’язані з rate-limit, одразу завершуються помилкою; ротація ключів не виконується.
- Коли всі можливі ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Вбудовані provider-и (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих provider-ів **не потрібна** конфігурація `models.providers`; достатньо задати auth і вибрати модель.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (один override)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Пряма підтримка GPT-5.5 через API тут буде готова в майбутньому, щойно OpenAI відкриє GPT-5.5 у API
- Перевіряйте доступність прямого API через `openclaw models list --provider openai` перед використанням `openai/gpt-5.5` без runtime app-server Codex
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Стандартний transport — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для конкретної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket за замовчуванням увімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до загальних OpenAI-сумісних proxy
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки prompt-cache і формування payload для сумісності reasoning OpenAI; proxy-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, тому що live-запити OpenAI API його відхиляють, а поточний каталог Codex його не надає

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (один override)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема трафік з автентифікацією API key і OAuth, надісланий до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і `claude -p` як санкціонований варіант для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання для нативного harness app-server Codex: `openai/gpt-5.5` із `agents.defaults.embeddedHarness.runtime: "codex"`
- Документація для нативного harness app-server Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex вибирається лише через runtime Codex harness або застарілі посилання `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Стандартний transport — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для конкретної моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex на `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних proxy
- Використовує той самий спільний перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` зберігає нативні `contextWindow = 1000000` і стандартні runtime `contextTokens = 272000`; перевизначайте обмеження runtime через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth офіційно підтримується для зовнішніх інструментів/workflow, таких як OpenClaw.
- Поточний доступ до GPT-5.5 використовує цей маршрут OAuth/subscription, доки OpenAI не ввімкне GPT-5.5 у публічному API.

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

### Інші розміщені варіанти в стилі subscription

- [Qwen Cloud](/uk/providers/qwen): поверхня provider-а Qwen Cloud плюс зіставлення endpoint-ів Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ до MiniMax Coding Plan через OAuth або API key
- [GLM models](/uk/providers/glm): endpoint-и Z.AI Coding Plan або загального API

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (один override)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` використовує динамічне thinking Google. Gemini 3/3.1 не мають фіксованого `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застаріле `cached_content`) для передавання нативного дескриптора provider-а `cachedContents/...`; cache hit-и Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Provider-и: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: Gemini CLI OAuth в OpenClaw — неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- Gemini CLI OAuth постачається як частина bundled Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Стандартна модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає токени в auth profiles на host Gateway.
  - Якщо після входу запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на host Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; дані про використання беруться з fallback на `stats`, де `stats.cached` нормалізується до OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний fallback-каталог постачається з `kilocode/kilo/auto`; live
  виявлення через `https://api.kilo.ai/api/gateway/models` може додатково
  розширити каталог runtime.
- Точна маршрутизація upstream за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші bundled provider Plugin

| Provider                | Id                               | Auth env                                                     | Приклад моделі                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                               |
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

Особливості, які варто знати:

- **OpenRouter** застосовує свої заголовки атрибуції застосунку й маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для cache-TTL у prompt caching під керуванням OpenRouter, але не отримують маркери кешу Anthropic. Як proxy-стиль OpenAI-сумісного шляху, він пропускає формування, доступне лише для нативного OpenAI (`serviceTier`, `store` у Responses, підказки prompt-cache, сумісність reasoning OpenAI). Посилання на базі Gemini зберігають лише санітизацію thought-signature для proxy-Gemini.
- **Kilo Gateway** для посилань на базі Gemini дотримується того самого шляху санітизації proxy-Gemini; `kilocode/kilo/auto` та інші посилання, що не підтримують proxy reasoning, пропускають ін’єкцію proxy reasoning.
- **MiniMax** onboarding через API key записує явні текстові визначення chat-моделей M2.7; розуміння зображень залишається в media provider `MiniMax-VL-01`, що належить Plugin.
- **xAI** використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-сумісний Base URL — `https://api.cerebras.ai/v1`.

## Provider-и через `models.providers` (custom/Base URL)

Використовуйте `models.providers` (або `models.json`), щоб додавати **custom** provider-и або OpenAI/Anthropic‑сумісні proxy.

Багато з bundled provider Plugin нижче вже публікують стандартний каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
стандартний base URL, headers або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як bundled provider Plugin. Використовуйте вбудований provider
за замовчуванням і додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Id моделей Kimi K2:

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

Kimi Coding використовує Anthropic-сумісний endpoint Moonshot AI:

- Provider: `kimi`
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

- Provider: `volcengine` (для кодування: `volcengine-plan`)
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

Початкове налаштування за замовчуванням використовує поверхню кодування, але загальний каталог `volcengine/*` реєструється одночасно.

У вибирачах моделей onboarding/configure для варіанта auth Volcengine пріоритет надається рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього вибирача в межах provider-а.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Моделі кодування (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (міжнародний)

BytePlus ARK надає доступ до тих самих моделей, що й Volcano Engine, для міжнародних користувачів.

- Provider: `byteplus` (для кодування: `byteplus-plan`)
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

Початкове налаштування за замовчуванням використовує поверхню кодування, але загальний каталог `byteplus/*` реєструється одночасно.

У вибирачах моделей onboarding/configure для варіанта auth BytePlus пріоритет надається рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього вибирача в межах provider-а.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Моделі кодування (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic надає Anthropic-сумісні моделі через provider `synthetic`:

- Provider: `synthetic`
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

MiniMax налаштовується через `models.providers`, оскільки використовує custom endpoint-и:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному streaming-шляху MiniMax OpenClaw за замовчуванням вимикає thinking, якщо ви явно його не задасте, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ capability, що належить Plugin:

- Стандартні text/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить Plugin, для обох шляхів auth MiniMax
- Вебпошук залишається на id provider-а `minimax`

### LM Studio

LM Studio постачається як bundled provider Plugin, який використовує нативний API:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Стандартний base URL для inference: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `LM Studio` `/api/v1/models` і `/api/v1/models/load` для виявлення й auto-load, а `/v1/chat/completions` — для inference за замовчуванням.
Деталі налаштування й усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як bundled provider Plugin і використовує нативний API Ollama:

- Provider: `ollama`
- Auth: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Встановлення: [https://ollama.com/download](https://ollama.com/download)

```bash
# Встановіть Ollama, потім завантажте модель:
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
`OLLAMA_API_KEY`, а bundled provider Plugin додає Ollama безпосередньо до
`openclaw onboard` і вибирача моделей. Див. [/providers/ollama](/uk/providers/ollama)
для onboarding, cloud/local mode і custom-конфігурації.

### vLLM

vLLM постачається як bundled provider Plugin для локальних/self-hosted OpenAI-сумісних
серверів:

- Provider: `vllm`
- Auth: необов’язкова (залежить від вашого сервера)
- Стандартний base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути auto-discovery локально (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

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

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як bundled provider Plugin для швидких self-hosted
OpenAI-сумісних серверів:

- Provider: `sglang`
- Auth: необов’язкова (залежить від вашого сервера)
- Стандартний base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути auto-discovery локально (підійде будь-яке значення, якщо ваш сервер не
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

Деталі див. у [/providers/sglang](/uk/providers/sglang).

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

- Для custom provider-ів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх не вказано, OpenClaw використовує такі значення за замовчуванням:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого proxy/моделі.
- Для `api: "openai-completions"` на не нативних endpoint-ах (будь-який непорожній `baseUrl`, чий host не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникати помилок provider 400 для непідтримуваних ролей `developer`.
- Маршрути OpenAI-сумісного proxy-стилю також пропускають формування запитів, доступне лише для нативного OpenAI: без `service_tier`, без `store` у Responses, без `store` у Completions, без підказок prompt-cache, без формування payload для сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Для OpenAI-сумісних Completions proxy, яким потрібні vendor-специфічні поля,
  задайте `agents.defaults.models["provider/model"].params.extra_body` (або
  `extraBody`), щоб об’єднати додатковий JSON у вихідне тіло запиту.
- Якщо `baseUrl` порожній або не вказаний, OpenClaw зберігає стандартну поведінку OpenAI (яка вказує на `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` однаково перевизначається на не нативних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Конфігурація](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Моделі](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model failover](/uk/concepts/model-failover) — ланцюжки fallback і поведінка повторних спроб
- [Довідник із конфігурації](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Provider-и](/uk/providers) — окремі інструкції з налаштування для кожного provider-а
