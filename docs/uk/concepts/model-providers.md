---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-25T00:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c02aff44b00748bdcb5e4dc02c1725ae4c5d4b9fe3a9da523053a7e95a03f16
    source_path: concepts/model-providers.md
    workflow: 15
---

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- `agents.defaults.models` працює як список дозволених значень, якщо його задано.
- Допоміжні CLI-команди: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` — це вбудовані метадані моделі; `contextTokens` — це фактичне обмеження під час виконання.
- Правила резервного перемикання, cooldown-перевірки та збереження перевизначень сеансу див. у [Model failover](/uk/concepts/model-failover).
- Маршрути сімейства OpenAI залежать від префікса: `openai/<model>` використовує прямого постачальника API-ключа OpenAI у PI, `openai-codex/<model>` використовує Codex OAuth у PI, а `openai/<model>` разом із `agents.defaults.embeddedHarness.runtime: "codex"` використовує нативний harness сервера застосунку Codex. Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness).
- Автоматичне ввімкнення Plugin дотримується тієї ж межі: `openai-codex/<model>` належить Plugin OpenAI, тоді як Plugin Codex вмикається через `embeddedHarness.runtime: "codex"` або застарілі посилання `codex/<model>`.
- CLI-середовища виконання використовують той самий поділ: вибирайте канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задавайте `agents.defaults.embeddedHarness.runtime` як `claude-cli`, `google-gemini-cli` або `codex-cli`, якщо хочете локальний бекенд CLI.
  Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань постачальників, а середовище виконання записується окремо.
- GPT-5.5 наразі доступна через маршрути підписки/OAuth:
  `openai-codex/gpt-5.5` у PI або `openai/gpt-5.5` із harness сервера застосунку Codex. Прямий маршрут API-ключа для `openai/gpt-5.5` підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте моделі з доступом через API, наприклад `openai/gpt-5.4`, для налаштувань `OPENAI_API_KEY`.

## Поведінка постачальника, що належить Plugin

Більшість специфічної для постачальника логіки живе в Plugin постачальників (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл inference. Plugins відповідають за онбординг, каталоги моделей, зіставлення auth env-var, нормалізацію транспорту/конфігурації, очищення схем інструментів, класифікацію failover, оновлення OAuth, звітування про використання, профілі thinking/reasoning тощо.

Повний список хуків SDK постачальників і прикладів вбудованих Plugin наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Постачальник, якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

<Note>
`capabilities` середовища виконання постачальника — це спільні метадані раннера (сімейство постачальника, особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що [public capability model](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
</Note>

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на повідомлення про обмеження швидкості (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з обмеженням швидкості, одразу завершуються з помилкою; ротація ключів не виконується.
- Якщо всі можливі ключі завершуються помилкою, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Ці постачальники **не**
потребують конфігурації `models.providers`; достатньо налаштувати auth і вибрати модель.

### OpenAI

- Постачальник: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Пряма підтримка API для GPT-5.5 тут підготовлена на майбутнє, щойно OpenAI відкриє GPT-5.5 в API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів OpenAI Responses WebSocket типово ввімкнений через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму зіставляють запити `openai/*` Responses із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки кешу prompt і формування payload для сумісності reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live-запити OpenAI API його відхиляють, а поточний каталог Codex його не надає

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
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком з API-ключем і OAuth-автентифікацією, надісланим на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли вони доступні.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Постачальник: `openai-codex`
- Auth: OAuth (ChatGPT)
- Посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання на нативний harness сервера застосунку Codex: `openai/gpt-5.5` з `agents.defaults.embeddedHarness.runtime: "codex"`
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin сервера застосунку Codex вибирається лише через середовище виконання harness Codex або застарілі посилання `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` зберігає нативні `contextWindow = 1000000` і типове runtime-значення `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, таких як OpenClaw.
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

### Інші хостовані варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud, а також зіставлення кінцевих точок Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ до MiniMax Coding Plan через OAuth або API-ключ
- [GLM Models](/uk/providers/glm): кінцеві точки Z.AI Coding Plan або загального API

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник середовища виконання Zen: `opencode`
- Постачальник середовища виконання Go: `opencode-go`
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
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне live-перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw із `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання нативного
  дескриптора постачальника `cachedContents/...`; попадання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI — свій потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret в `openclaw.json`. Потік входу CLI зберігає токени в auth-профілях на хості gateway.
  - Якщо після входу запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться зі `stats`, а `stats.cached` нормалізується до OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
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
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через
  `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  середовища виконання.
- Точна маршрутизація вгору за потоком для `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugin постачальників

| Постачальник            | Id                               | Auth env                                                     | Приклад моделі                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
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

Варто знати такі особливості:

- **OpenRouter** застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Як проксі-подібний OpenAI-сумісний шлях, він пропускає формування, доступне лише для нативного OpenAI (`serviceTier`, Responses `store`, підказки кешу prompt, сумісність reasoning OpenAI). Посилання з бекендом Gemini зберігають лише санітизацію thought-signature для проксі-Gemini.
- **Kilo Gateway** для посилань із бекендом Gemini дотримується того самого шляху санітизації проксі-Gemini; `kilocode/kilo/auto` та інші посилання, що не підтримують proxy reasoning, пропускають ін’єкцію proxy reasoning.
- **MiniMax** онбординг через API-ключ записує явні визначення моделей M2.7 з `input: ["text", "image"]`; вбудований каталог зберігає chat-посилання лише текстовими, доки ця конфігурація не буде матеріалізована.
- **xAI** використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` типово ввімкнено; вимкнення через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-сумісний базовий URL — `https://api.cerebras.ai/v1`.

## Постачальники через `models.providers` (власний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** постачальників або
OpenAI/Anthropic‑сумісні проксі.

Багато з наведених нижче вбудованих Plugin постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin постачальника. Типово використовуйте
вбудованого постачальника, а явний запис `models.providers.moonshot` додавайте лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
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

Застарілий `kimi/k2p5` як і раніше приймається як id моделі для сумісності.

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

У засобах вибору моделей onboarding/configure варіант auth для Volcengine надає перевагу рядкам
`volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу, а не показує порожній
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

### BytePlus (Міжнародний)

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

У засобах вибору моделей onboarding/configure варіант auth для BytePlus надає перевагу рядкам
`byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу, а не показує порожній
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
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

У Anthropic-сумісному потоковому шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розділення можливостей, що належить Plugin:

- Типові значення text/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить Plugin, на обох шляхах auth MiniMax
- Вебпошук залишається на id постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, який використовує нативний API:

- Постачальник: `lmstudio`
- Auth: `LM_API_TOKEN`
- Типовий базовий URL inference: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, повернутих `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні для LM Studio `/api/v1/models` і `/api/v1/models/load`
для виявлення й автозавантаження, а `/v1/chat/completions` типово — для inference.
Деталі налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через
`OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/self-hosted OpenAI-сумісних
серверів:

- Постачальник: `vllm`
- Auth: необов’язковий (залежить від вашого сервера)
- Типовий базовий URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з id, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких self-hosted
OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Auth: необов’язковий (залежить від вашого сервера)
- Типовий базовий URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не
вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з id, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

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

- Для власних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх не задано, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних кінцевих точках (будь-який непорожній `baseUrl`, чий host не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникати помилок постачальника 400 для непідтримуваних ролей `developer`.
- Проксі-подібні OpenAI-сумісні маршрути також пропускають формування запитів, доступне лише для нативного OpenAI: без `service_tier`, без Responses `store`, без підказок кешу prompt, без формування payload для сумісності reasoning OpenAI та без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не заданий, OpenClaw зберігає типову поведінку OpenAI (яка веде до `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних кінцевих точках `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і аліаси
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — інструкції з налаштування для кожного постачальника
