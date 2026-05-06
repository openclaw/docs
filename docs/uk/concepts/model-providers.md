---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного провайдера
    - Вам потрібні приклади конфігурацій або команди CLI для первинного налаштування постачальників моделей
sidebarTitle: Model providers
summary: Огляд постачальників моделей із прикладами конфігурацій + сценаріями CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-05-06T04:01:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 304f20e10cbcd4465b7b843e398452b1b93a19cfaefd9f4d4edc213d7e003542
    source_path: concepts/model-providers.md
    workflow: 16
---

Довідка для **провайдерів LLM/моделей** (не каналів чату, як-от WhatsApp/Telegram). Правила вибору моделі див. у [Моделі](/uk/concepts/models).

## Швидкі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та помічники CLI">
    - Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` працює як список дозволених моделей, коли його задано.
    - Помічники CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають типові значення на рівні провайдера; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для окремої моделі.
    - Правила резервного перемикання, перевірки після паузи й збереження перевизначення сеансу: [Відмовостійке перемикання моделей](/uk/concepts/model-failover).

  </Accordion>
  <Accordion title="Додавання автентифікації провайдера не змінює вашу основну модель">
    `openclaw configure` зберігає наявний `agents.defaults.model.primary`, коли ви додаєте або повторно автентифікуєте провайдера. Провайдерські Plugin-и все ще можуть повертати рекомендовану типову модель у своєму патчі конфігурації автентифікації, але configure трактує це як «зробити цю модель доступною», коли основна модель уже існує, а не як «замінити поточну основну модель».

    Щоб навмисно змінити типову модель, використайте `openclaw models set <provider/model>` або `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Розділення провайдера й runtime OpenAI">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` разом із `agents.defaults.agentRuntime.id: "codex"` використовує нативний app-server harness Codex. Це звичайне налаштування підписки ChatGPT/Codex.
    - `openai-codex/<model>` використовує Codex OAuth у PI.
    - `openai/<model>` без перевизначення runtime Codex використовує прямий провайдер OpenAI з API-ключем у PI.

    Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо розділення провайдера й runtime незрозуміле, спершу прочитайте [Runtime-и агентів](/uk/concepts/agent-runtimes).

    Автоматичне ввімкнення Plugin дотримується тієї самої межі: `openai-codex/<model>` належить Plugin OpenAI, тоді як Plugin Codex вмикається через `agentRuntime.id: "codex"` або застарілі посилання `codex/<model>`.

    GPT-5.5 доступна через нативний app-server harness Codex, коли задано `agentRuntime.id: "codex"`, через `openai-codex/gpt-5.5` у PI для Codex OAuth і через `openai/gpt-5.5` у PI для прямого трафіку з API-ключем, якщо ваш обліковий запис її відкриває.

  </Accordion>
  <Accordion title="CLI runtime-и">
    CLI runtime-и використовують те саме розділення: виберіть канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задайте `agents.defaults.agentRuntime.id` як `claude-cli`, `google-gemini-cli` або `codex-cli`, коли вам потрібен локальний CLI backend.

    Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань провайдера з runtime, записаним окремо.

  </Accordion>
</AccordionGroup>

## Поведінка провайдера, що належить Plugin

Більшість логіки, специфічної для провайдера, живе в провайдерських Plugin-ах (`registerProvider(...)`), тоді як OpenClaw зберігає універсальний цикл інференсу. Plugin-и відповідають за onboarding, каталоги моделей, відображення env-змінних автентифікації, нормалізацію транспорту/конфігурації, очищення схем інструментів, класифікацію відмовостійкого перемикання, оновлення OAuth, звітність про використання, профілі thinking/reasoning тощо.

Повний список хуків provider-SDK і прикладів вбудованих Plugin-ів наведено в [Провайдерські Plugin-и](/uk/plugins/sdk-provider-plugins). Провайдер, якому потрібен повністю кастомний виконавець запитів, є окремою, глибшою поверхнею розширення.

<Note>
Поведінка runner, що належить провайдеру, живе в явних хуках провайдера, як-от політика replay, нормалізація схем інструментів, обгортання stream і помічники транспорту/запитів. Застарілий статичний контейнер `ProviderPlugin.capabilities` призначений лише для сумісності й більше не читається спільною логікою runner.
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)

    Для провайдерів Google `GOOGLE_API_KEY` також включено як резервний варіант. Порядок вибору ключів зберігає пріоритет і усуває дублікати значень.

  </Accordion>
  <Accordion title="Коли запускається ротація">
    - Запити повторюються з наступним ключем лише для відповідей про обмеження частоти (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
    - Помилки, не пов’язані з обмеженням частоти, завершуються одразу; ротація ключів не виконується.
    - Коли всі кандидатні ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

  </Accordion>
</AccordionGroup>

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi-ai. Ці провайдери **не** потребують конфігурації `models.providers`; просто задайте автентифікацію та виберіть модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевірте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`, якщо конкретне встановлення або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спершу WebSocket, резервний SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів WebSocket для OpenAI Responses типово ввімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` відображають прямі запити OpenAI Responses `openai/*` у `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, коли потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки prompt cache і формування payload для сумісності з reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити OpenAI API його відхиляють, а поточний каталог Codex його не відкриває

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема трафік з API-ключем і OAuth-автентифікацією, що надсилається до `api.anthropic.com`; OpenClaw відображає це в Anthropic `service_tier` (`auto` або `standard_only`)
- Бажана конфігурація Claude CLI зберігає посилання на модель канонічним і вибирає CLI
  backend окремо: `anthropic/claude-opus-4-7` з
  `agents.defaults.agentRuntime.id: "claude-cli"`. Застарілі посилання
  `claude-cli/claude-opus-4-7` усе ще працюють для сумісності.

<Note>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику. Anthropic setup-token залишається доступним як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI та `claude -p`, коли вони доступні.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Провайдер: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання нативного app-server harness Codex: `openai/gpt-5.5` з `agents.defaults.agentRuntime.id: "codex"`
- Документація нативного app-server harness Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний app-server Plugin Codex вибирається лише runtime Codex harness або застарілими посиланнями `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий транспорт — `auto` (спершу WebSocket, резервний SSE)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативні запити Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex на `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує ту саму конфігурацію спільного перемикача `/fast` і `params.fastMode`, що й прямий `openai/*`; OpenClaw відображає це в `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативне `contextWindow = 400000` каталогу Codex і типовий runtime `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.
- Для поширеного маршруту з підпискою та нативним runtime Codex увійдіть через автентифікацію `openai-codex`, але налаштуйте `openai/gpt-5.5` плюс `agents.defaults.agentRuntime.id: "codex"`.
- Використовуйте `openai-codex/gpt-5.5` лише тоді, коли потрібен маршрут Codex OAuth/підписки через PI; використовуйте `openai/gpt-5.5` без перевизначення runtime Codex, коли ваше налаштування API-ключа й локальний каталог відкривають маршрут публічного API.

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

### Інші розміщені варіанти в стилі підписки

<CardGroup cols={3}>
  <Card title="Моделі GLM" href="/uk/providers/glm">
    Z.AI Coding Plan або загальні кінцеві точки API.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    MiniMax Coding Plan OAuth або доступ за API-ключем.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня провайдера Qwen Cloud плюс відображення кінцевих точок Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер runtime Zen: `opencode`
- Провайдер runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: резервні `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одноразове перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw, що використовує `google/gemini-3.1-flash-preview`, нормалізується до `google/gemini-3-flash-preview`
- Псевдонім: `google/gemini-3.1-pro` приймається й нормалізується до живого ідентифікатора Gemini API від Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Мислення: `/think adaptive` використовує динамічне мислення Google. Gemini 3/3.1 не вказують фіксований `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застарілий `cached_content`), щоб передати власний для постачальника дескриптор `cachedContents/...`; влучання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує свій потік OAuth

<Warning>
Gemini CLI OAuth в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
</Warning>

Gemini CLI OAuth постачається як частина вбудованого Plugin `google`.

<Steps>
  <Step title="Установіть Gemini CLI">
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
  <Step title="Увімкніть Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Увійдіть">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Типова модель: `google-gemini-cli/gemini-3-flash-preview`. Ви **не** вставляєте ідентифікатор клієнта або секрет у `openclaw.json`. Потік входу CLI зберігає токени в профілях автентифікації на хості Gateway.

  </Step>
  <Step title="Укажіть проєкт (за потреби)">
    Якщо запити не виконуються після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  </Step>
</Steps>

JSON-відповіді Gemini CLI аналізуються з `response`; використання береться резервно зі `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Базова URL-адреса: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачає `kilocode/kilo/auto`; живе виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог середовища виконання.
- Точна маршрутизація upstream за `kilocode/kilo/auto` належить Kilo Gateway, а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugins постачальників

| Постачальник            | Ідентифікатор                   | Змінна середовища автентифікації                            | Приклад моделі                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
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

#### Варто знати про особливості

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для cache-TTL у керованому OpenRouter кешуванні підказок, але не отримують маркери кешу Anthropic. Як проксі-подібний OpenAI-сумісний шлях, він пропускає формування, властиве лише нативному OpenAI (`serviceTier`, Responses `store`, підказки prompt-cache, сумісність OpenAI reasoning). Посилання на базі Gemini зберігають лише проксі-Gemini очищення thought-signature.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Посилання на базі Gemini проходять тим самим шляхом проксі-Gemini очищення; `kilocode/kilo/auto` та інші посилання, що не підтримують proxy-reasoning, пропускають ін’єкцію proxy reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    Онбординг через API-ключ записує явні текстові визначення чат-моделей M2.7; розуміння зображень залишається у медіапостачальнику `MiniMax-VL-01`, що належить plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Ідентифікатори моделей використовують простір імен `nvidia/<vendor>/<model>` (наприклад, `nvidia/nvidia/nemotron-...` поряд із `nvidia/moonshotai/kimi-k2.5`); селектори зберігають буквальну композицію `<provider>/<model-id>`, тоді як канонічний ключ, надісланий до API, залишається з одним префіксом.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. `grok-4.3` є вбудованою типовою чат-моделлю. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Постачається як вбудований plugin постачальника `cerebras`. GLM використовує `zai-glm-4.7`; OpenAI-сумісний базовий URL — `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Постачальники через `models.providers` (власний/базовий URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** постачальників або OpenAI/Anthropic-сумісні проксі.

Багато з наведених нижче вбудованих plugin постачальників уже публікують типовий каталог. Використовуйте явні записи `models.providers.<id>` лише тоді, коли потрібно перевизначити типовий базовий URL, заголовки або список моделей.

Перевірки можливостей моделей Gateway також читають явні метадані `models.providers.<id>.models[]`. Якщо власна або проксі-модель приймає зображення, задайте `input: ["text", "image"]` для цієї моделі, щоб WebChat і шляхи вкладень із вузла передавали зображення як нативні вхідні дані моделі, а не як текстові медіапосилання.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований plugin постачальника. За замовчуванням використовуйте вбудованого постачальника та додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базовий URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
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

Legacy `kimi/k2p5` надалі приймається як ідентифікатор моделі сумісності.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Провайдер: `volcengine` (кодування: `volcengine-plan`)
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

Onboarding за замовчуванням використовує поверхню кодування, але загальний каталог `volcengine/*` реєструється одночасно.

У засобах вибору моделі під час onboarding/налаштування варіант автентифікації Volcengine надає перевагу рядкам як `volcengine/*`, так і `volcengine-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній засіб вибору, обмежений провайдером.

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

### BytePlus (міжнародний)

BytePlus ARK надає доступ до тих самих моделей, що й Volcano Engine, для міжнародних користувачів.

- Провайдер: `byteplus` (кодування: `byteplus-plan`)
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

Onboarding за замовчуванням використовує поверхню кодування, але загальний каталог `byteplus/*` реєструється одночасно.

У засобах вибору моделі під час onboarding/налаштування варіант автентифікації BytePlus надає перевагу рядкам як `byteplus/*`, так і `byteplus-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній засіб вибору, обмежений провайдером.

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

Synthetic надає Anthropic-сумісні моделі через провайдера `synthetic`:

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

MiniMax налаштовується через `models.providers`, оскільки використовує користувацькі кінцеві точки:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax) для деталей налаштування, варіантів моделей і фрагментів конфігурації.

<Note>
На Anthropic-сумісному streaming-шляху MiniMax OpenClaw за замовчуванням вимикає мислення, якщо ви не задасте його явно, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Розподіл можливостей, якими володіє Plugin:

- Типові налаштування тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень належить Plugin і використовує `MiniMax-VL-01` на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin провайдера, що використовує нативний API:

- Провайдер: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Типова базова URL-адреса inference: `http://localhost:1234/v1`

Потім задайте модель (замініть одним з ідентифікаторів, повернених `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio для виявлення та автозавантаження, а `/v1/chat/completions` для inference за замовчуванням. Якщо ви хочете, щоб JIT-завантаження, TTL і автоматичне витіснення LM Studio керували життєвим циклом моделі, задайте `models.providers.lmstudio.params.preload: false`. Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування й усунення несправностей.

### Ollama

Ollama постачається як вбудований Plugin провайдера та використовує нативний API Ollama:

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через `OLLAMA_API_KEY`, а вбудований Plugin провайдера додає Ollama безпосередньо до `openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama) для onboarding, хмарного/локального режиму та користувацької конфігурації.

### vLLM

vLLM постачається як вбудований Plugin провайдера для локальних/самостійно розгорнутих OpenAI-сумісних серверів:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:8000/v1`

Щоб локально ввімкнути автовиявлення (працює будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть одним з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Див. [/providers/vllm](/uk/providers/vllm) для деталей.

### SGLang

SGLang постачається як вбудований Plugin провайдера для швидких самостійно розгорнутих OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:30000/v1`

Щоб локально ввімкнути автовиявлення (працює будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть одним з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Див. [/providers/sglang](/uk/providers/sglang) для деталей.

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
  <Accordion title="Default optional fields">
    Для користувацьких провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими. Якщо їх пропущено, OpenClaw за замовчуванням використовує:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Для `api: "openai-completions"` на ненативних кінцевих точках (будь-який непорожній `baseUrl`, хост якого не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 провайдера для непідтримуваних ролей `developer`.
    - Маршрути проксі в стилі OpenAI-сумісності також пропускають нативне формування запитів, специфічне лише для OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без підказок prompt-cache, без формування payload для OpenAI reasoning-compat і без прихованих заголовків атрибуції OpenClaw.
    - Для OpenAI-сумісних проксі Completions, яким потрібні специфічні для постачальника поля, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об’єднати додатковий JSON з вихідним тілом запиту.
    - Для елементів керування chat-template vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень мислення сесії вимкнено.
    - Для повільних локальних моделей або віддалених хостів LAN/tailnet задайте `models.providers.<id>.timeoutSeconds`. Це розширює обробку HTTP-запитів моделі провайдера, включно з підключенням, заголовками, streaming тіла та загальним перериванням guarded-fetch, не збільшуючи загальний тайм-аут runtime агента.
    - HTTP-виклики провайдера моделі дозволяють DNS-відповіді fake-IP від Surge, Clash і sing-box у `198.18.0.0/15` та `fc00::/7` лише для налаштованого імені хоста `baseUrl` провайдера. Інші приватні, loopback, link-local і metadata-призначення все одно потребують явного ввімкнення `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Якщо `baseUrl` порожній/пропущений, OpenClaw зберігає типову поведінку OpenAI (яка розв’язується в `api.openai.com`).
    - З міркувань безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних кінцевих точках `openai-completions`.
    - Для `api: "anthropic-messages"` на непрямих кінцевих точках (будь-який провайдер, окрім канонічного `anthropic`, або користувацький `models.providers.anthropic.baseUrl`, хост якого не є публічною кінцевою точкою `api.anthropic.com`) OpenClaw пригнічує неявні Anthropic beta-заголовки, як-от `claude-code-20250219`, `interleaved-thinking-2025-05-14` і OAuth markers, щоб користувацькі Anthropic-сумісні проксі не відхиляли непідтримувані beta-прапорці. Задайте `models.providers.<id>.headers["anthropic-beta"]` явно, якщо вашому проксі потрібні конкретні beta-можливості.

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

- [Configuration reference](/uk/gateway/config-agents#agent-defaults) - ключі конфігурації моделі
- [Model failover](/uk/concepts/model-failover) - ланцюжки fallback і поведінка повторних спроб
- [Models](/uk/concepts/models) - конфігурація моделей і псевдоніми
- [Providers](/uk/providers) - посібники з налаштування для кожного провайдера
