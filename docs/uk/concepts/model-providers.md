---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команд CLI для онбордингу провайдерів моделей
sidebarTitle: Model providers
summary: Огляд провайдера моделей із прикладами конфігурацій + потоками CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-27T07:07:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65d4d7cfdac9a641c9746077b3352597faefe342e1d55bd9faf5f0fab5b36d3a
    source_path: concepts/model-providers.md
    workflow: 15
---

Довідник для **LLM/провайдерів моделей** (а не чат-каналів на кшталт WhatsApp/Telegram). Правила вибору моделей див. у [Models](/uk/concepts/models).

## Короткі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та допоміжні команди CLI">
    - Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` працює як allowlist, якщо його задано.
    - Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають значення за замовчуванням на рівні провайдера; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для кожної моделі окремо.
    - Правила резервного перемикання, перевірки cooldown і збереження перевизначень сесії: [Model failover](/uk/concepts/model-failover).
  </Accordion>
  <Accordion title="Розділення провайдера/середовища виконання OpenAI">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` використовує прямий провайдер API-ключа OpenAI у Pi.
    - `openai-codex/<model>` використовує Codex OAuth у Pi.
    - `openai/<model>` разом із `agents.defaults.agentRuntime.id: "codex"` використовує нативну обв’язку app-server Codex.

    Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо розділення провайдера/середовища виконання незрозуміле, спочатку прочитайте [Agent runtimes](/uk/concepts/agent-runtimes).

    Автоматичне ввімкнення Plugin дотримується тієї самої межі: `openai-codex/<model>` належить до Plugin OpenAI, тоді як Plugin Codex вмикається через `agentRuntime.id: "codex"` або застарілі посилання `codex/<model>`.

    GPT-5.5 доступна через `openai/gpt-5.5` для прямого трафіку з API-ключем, `openai-codex/gpt-5.5` у Pi для Codex OAuth, а також через нативну обв’язку app-server Codex, коли задано `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="Середовища виконання CLI">
    Середовища виконання CLI використовують те саме розділення: вибирайте канонічні посилання на моделі, такі як `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задавайте `agents.defaults.agentRuntime.id` як `claude-cli`, `google-gemini-cli` або `codex-cli`, якщо вам потрібен локальний бекенд CLI.

    Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань провайдерів, а середовище виконання записується окремо.

  </Accordion>
</AccordionGroup>

## Поведінка провайдера, якою керує Plugin

Більшість специфічної для провайдера логіки живе в Plugin провайдера (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл інференсу. Plugin керують онбордингом, каталогами моделей, зіставленням env vars для автентифікації, нормалізацією транспорту/конфігурації, очищенням схем інструментів, класифікацією резервного перемикання, оновленням OAuth, звітністю про використання, профілями thinking/reasoning тощо.

Повний список хуків provider-SDK і приклади вбудованих Plugin наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Провайдер, якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

<Note>
`capabilities` середовища виконання провайдера — це спільні метадані раннера (сімейство провайдера, особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що [public capability model](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий інференс, мовлення тощо).
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (єдине live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)

    Для провайдерів Google `GOOGLE_API_KEY` також включається як запасний варіант. Порядок вибору ключів зберігає пріоритет і дедуплікує значення.

  </Accordion>
  <Accordion title="Коли спрацьовує ротація">
    - Запити повторюються з наступним ключем лише у відповідь на rate-limit помилки (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
    - Збої, не пов’язані з rate-limit, завершуються негайно; ротація ключів не виконується.
    - Коли всі можливі ключі завершуються помилкою, повертається фінальна помилка з останньої спроби.
  </Accordion>
</AccordionGroup>

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих провайдерів **не потрібна** конфігурація `models.providers`; достатньо налаштувати автентифікацію й вибрати модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевіряйте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`, якщо конкретна інсталяція або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім SSE)
- Перевизначення для кожної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів OpenAI Responses WebSocket за замовчуванням увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму зіставляють запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають `store` у Responses, підказки кешу prompt і формування payload, сумісного з OpenAI reasoning; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити OpenAI API його відхиляють, а поточний каталог Codex його не показує

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема трафік з API-ключем і OAuth-автентифікацією, надісланий до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Бажана конфігурація Claude CLI зберігає посилання на модель канонічним і вибирає CLI-бекенд окремо: `anthropic/claude-opus-4-7` разом із `agents.defaults.agentRuntime.id: "claude-cli"`. Застарілі посилання `claude-cli/claude-opus-4-7` і далі працюють для сумісності.

<Note>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику. Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Провайдер: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Посилання на модель у PI: `openai-codex/gpt-5.5`
- Посилання нативної обв’язки app-server Codex: `openai/gpt-5.5` разом із `agents.defaults.agentRuntime.id: "codex"`
- Документація нативної обв’язки app-server Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex вибирається лише через середовище виконання Codex harness або застарілі посилання `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім SSE)
- Перевизначення для кожної моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex на `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий спільний перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативні для каталогу Codex `contextWindow = 400000` і `contextTokens = 272000` для середовища виконання за замовчуванням; перевизначайте межу середовища виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth офіційно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.
- Використовуйте `openai-codex/gpt-5.5`, якщо вам потрібен маршрут через Codex OAuth/підписку; використовуйте `openai/gpt-5.5`, якщо ваша конфігурація з API-ключем і локальний каталог відкривають маршрут через публічний API.

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

<CardGroup cols={3}>
  <Card title="Моделі GLM" href="/uk/providers/glm">
    Z.AI Coding Plan або загальні API-ендпоїнти.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    OAuth MiniMax Coding Plan або доступ за API-ключем.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня провайдера Qwen Cloud, а також зіставлення ендпоїнтів Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер середовища виконання Zen: `opencode`
- Провайдер середовища виконання Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw із `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` використовує динамічне thinking Google. Gemini 3/3.1 не мають фіксованого `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застаріле `cached_content`) для передавання нативного дескриптора провайдера `cachedContents/...`; потрапляння в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth

<Warning>
Gemini CLI OAuth в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
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

    Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`. Вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає токени в профілях автентифікації на хості Gateway.

  </Step>
  <Step title="Укажіть проєкт (за потреби)">
    Якщо після входу запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  </Step>
</Steps>

JSON-відповіді Gemini CLI розбираються з `response`; дані про використання беруться з резервного поля `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний ендпоїнт Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Провайдер: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Базовий URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог середовища виконання.
- Точна вхідна маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не жорстко задана в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugin провайдерів

| Провайдер               | Id                               | Auth env                                                     | Приклад моделі                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` або `KIMICODE_API_KEY`                        | `kimi/kimi-code`                                |
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

#### Варто знати про особливості

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для TTL-кешування prompt, яким керує OpenRouter, але не отримують маркерів кешу Anthropic. Як проксі-подібний OpenAI-сумісний шлях, він пропускає формування, доступне лише для нативного OpenAI (`serviceTier`, Responses `store`, підказки кешу prompt, сумісність OpenAI reasoning). Посилання на базі Gemini зберігають лише санітизацію thought-signature для проксі Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Посилання на базі Gemini проходять тим самим шляхом санітизації проксі Gemini; `kilocode/kilo/auto` та інші посилання, де reasoning проксі не підтримується, пропускають ін’єкцію reasoning для проксі.
  </Accordion>
  <Accordion title="MiniMax">
    Онбординг через API-ключ записує явні текстові визначення моделей чату M2.7; розуміння зображень залишається на медіапровайдері `MiniMax-VL-01`, яким керує Plugin.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкнути можна через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-сумісний базовий URL — `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Провайдери через `models.providers` (кастомний/base URL)

Використовуйте `models.providers` (або `models.json`) для додавання **кастомних** провайдерів або OpenAI/Anthropic-сумісних проксі.

Багато з наведених нижче вбудованих Plugin провайдерів уже публікують каталог за замовчуванням. Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити базовий URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin провайдера. За замовчуванням використовуйте вбудований провайдер і додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базовий URL або метадані моделі:

- Провайдер: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
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

Kimi Coding використовує Anthropic-сумісний ендпоїнт Moonshot AI:

- Провайдер: `kimi`
- Автентифікація: `KIMI_API_KEY`
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

- Провайдер: `volcengine` (для coding: `volcengine-plan`)
- Автентифікація: `VOLCANO_ENGINE_API_KEY`
- Приклад моделі: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Онбординг за замовчуванням використовує поверхню coding, але загальний каталог `volcengine/*` реєструється одночасно.

У селекторах моделей під час онбордингу/налаштування моделі варіант автентифікації Volcengine віддає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього селектора в межах провайдера.

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

- Провайдер: `byteplus` (для coding: `byteplus-plan`)
- Автентифікація: `BYTEPLUS_API_KEY`
- Приклад моделі: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Онбординг за замовчуванням використовує поверхню coding, але загальний каталог `byteplus/*` реєструється одночасно.

У селекторах моделей під час онбордингу/налаштування моделі варіант автентифікації BytePlus віддає перевагу рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього селектора в межах провайдера.

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

Synthetic надає Anthropic-сумісні моделі через провайдер `synthetic`:

- Провайдер: `synthetic`
- Автентифікація: `SYNTHETIC_API_KEY`
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

MiniMax налаштовується через `models.providers`, оскільки використовує кастомні ендпоїнти:

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальний): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

<Note>
На Anthropic-сумісному потоковому шляху MiniMax OpenClaw за замовчуванням вимикає thinking, якщо ви явно його не задасте, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Розділення можливостей, яким керує Plugin:

- Текст/чат за замовчуванням залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01` на обох шляхах автентифікації MiniMax, яким керує Plugin
- Вебпошук залишається на id провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin провайдера, який використовує нативний API:

- Провайдер: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Базовий URL інференсу за замовчуванням: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні для LM Studio `/api/v1/models` і `/api/v1/models/load` для виявлення й автозавантаження, а `/v1/chat/completions` — для інференсу за замовчуванням. Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування та усунення несправностей.

### Ollama

Ollama постачається як вбудований Plugin провайдера і використовує нативний API Ollama:

- Провайдер: `ollama`
- Автентифікація: не потрібна (локальний сервер)
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через `OLLAMA_API_KEY`, а вбудований Plugin провайдера додає Ollama безпосередньо в `openclaw onboard` і селектор моделей. Див. [/providers/ollama](/uk/providers/ollama) щодо онбордингу, хмарного/локального режиму та кастомної конфігурації.

### vLLM

vLLM постачається як вбудований Plugin провайдера для локальних/self-hosted OpenAI-сумісних серверів:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути автознайдення локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

SGLang постачається як вбудований Plugin провайдера для швидких self-hosted OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути автознайдення локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI-сумісний):

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
  <Accordion title="Необов’язкові поля за замовчуванням">
    Для кастомних провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими. Якщо їх пропущено, OpenClaw використовує такі значення за замовчуванням:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендація: задавайте явні значення, що відповідають лімітам вашого проксі/моделі.

  </Accordion>
  <Accordion title="Правила формування проксі-маршрутів">
    - Для `api: "openai-completions"` на ненативних ендпоїнтах (будь-який непорожній `baseUrl`, чий хост не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок провайдера 400 для непідтримуваних ролей `developer`.
    - Проксі-подібні OpenAI-сумісні маршрути також пропускають формування запитів, доступне лише нативному OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без підказок кешу prompt, без формування payload для сумісності з OpenAI reasoning і без прихованих заголовків атрибуції OpenClaw.
    - Для OpenAI-сумісних проксі Completions, яким потрібні специфічні для вендора поля, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об’єднати додатковий JSON у вихідне тіло запиту.
    - Для керування chat-template у vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. OpenClaw автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень thinking у сесії вимкнено.
    - Для повільних локальних моделей або віддалених хостів LAN/tailnet задайте `models.providers.<id>.timeoutSeconds`. Це розширює обробку HTTP-запитів моделі провайдера, включно з підключенням, заголовками, потоковим передаванням тіла та загальним перериванням guarded-fetch, не збільшуючи тайм-аут усього середовища виконання агента.
    - Якщо `baseUrl` порожній або відсутній, OpenClaw зберігає поведінку OpenAI за замовчуванням (яка зводиться до `api.openai.com`).
    - З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних ендпоїнтах `openai-completions`.
  </Accordion>
</AccordionGroup>

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язані матеріали

- [Configuration reference](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделей
- [Model failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Models](/uk/concepts/models) — конфігурація моделей і аліаси
- [Providers](/uk/providers) — посібники з налаштування для кожного провайдера
