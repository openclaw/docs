---
read_when:
    - Вам потрібен довідник із налаштування моделей за постачальниками
    - Вам потрібні приклади конфігурацій або команди CLI для початкового налаштування постачальників моделей
sidebarTitle: Model providers
summary: Огляд провайдерів моделей із прикладами конфігурацій + сценаріями CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-05-11T20:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Довідка для **постачальників LLM/моделей** (не каналів чату, як-от WhatsApp/Telegram). Правила вибору моделей див. у [Моделі](/uk/concepts/models).

## Короткі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та помічники CLI">
    - Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` діє як allowlist, коли задано.
    - Помічники CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають типові значення на рівні постачальника; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для окремої моделі.
    - Правила резервного перемикання, перевірки cooldown і збереження перевизначень сеансу: [Резервне перемикання моделей](/uk/concepts/model-failover).

  </Accordion>
  <Accordion title="Додавання автентифікації постачальника не змінює вашу основну модель">
    `openclaw configure` зберігає наявне `agents.defaults.model.primary`, коли ви додаєте або повторно автентифікуєте постачальника. `openclaw models auth login` робить те саме, якщо не передати `--set-default`. Plugin постачальника все ще може повернути рекомендовану типову модель у своєму патчі конфігурації автентифікації, але OpenClaw трактує це як «зробити цю модель доступною», коли основна модель уже існує, а не як «замінити поточну основну модель».

    Щоб навмисно перемкнути типову модель, використайте `openclaw models set <provider/model>` або `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Розділення постачальника й runtime OpenAI">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` типово використовує нативний harness сервера застосунку Codex для кроків агента. Це звичайне налаштування підписки ChatGPT/Codex.
    - `openai-codex/<model>` — це застаріла конфігурація, яку doctor переписує на `openai/<model>`.
    - `openai/<model>` плюс provider/model `agentRuntime.id: "pi"` використовує PI для явних маршрутів API-ключа або сумісності.

    Див. [OpenAI](/uk/providers/openai) і [harness Codex](/uk/plugins/codex-harness). Якщо розділення постачальника й runtime незрозуміле, спершу прочитайте [Runtime агентів](/uk/concepts/agent-runtimes).

    Автоматичне ввімкнення Plugin дотримується тієї самої межі: посилання агентів `openai/*` вмикають Plugin Codex для типового маршруту, а явні provider/model `agentRuntime.id: "codex"` або застарілі посилання `codex/<model>` також потребують його.

    GPT-5.5 типово доступна через нативний harness сервера застосунку Codex на `openai/gpt-5.5`, а через PI лише тоді, коли політика runtime provider/model явно вибирає `pi`.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI використовують те саме розділення: виберіть канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задайте політику runtime provider/model як `claude-cli`, `google-gemini-cli` або `codex-cli`, коли потрібен локальний бекенд CLI.

    Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань постачальника з runtime, записаним окремо.

  </Accordion>
</AccordionGroup>

## Поведінка постачальника, якою володіє Plugin

Більшість специфічної для постачальника логіки живе в Plugin постачальника (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл інференсу. Plugin володіють onboarding, каталогами моделей, зіставленням env-var автентифікації, нормалізацією транспорту/конфігурації, очищенням tool-schema, класифікацією failover, оновленням OAuth, звітуванням про використання, профілями thinking/reasoning тощо.

Повний список хуків provider-SDK і приклади вбудованих Plugin наведено в [Plugin постачальників](/uk/plugins/sdk-provider-plugins). Постачальник, якому потрібен повністю власний виконавець запитів, є окремою, глибшою поверхнею розширення.

<Note>
Поведінка runner, якою володіє постачальник, живе на явних хуках постачальника, як-от політика replay, нормалізація tool-schema, обгортання stream і помічники транспорту/запитів. Застарілий статичний набір `ProviderPlugin.capabilities` призначений лише для сумісності й більше не читається спільною логікою runner.
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, напр. `<PROVIDER>_API_KEY_1`)

    Для постачальників Google `GOOGLE_API_KEY` також включено як fallback. Порядок вибору ключів зберігає пріоритет і усуває дублікати значень.

  </Accordion>
  <Accordion title="Коли спрацьовує ротація">
    - Запити повторюються з наступним ключем лише на відповідях про rate-limit (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
    - Збої, не пов’язані з rate-limit, одразу завершуються помилкою; ротація ключів не виконується.
    - Коли всі ключі-кандидати зазнають невдачі, фінальна помилка повертається з останньої спроби.

  </Accordion>
</AccordionGroup>

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi-ai. Ці постачальники **не** потребують конфігурації `models.providers`; просто задайте автентифікацію та виберіть модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Опціональна ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевірте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`, якщо конкретне встановлення або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto`; OpenClaw передає вибір транспорту до pi-ai.
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, коли потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки prompt-cache і формування payload для сумісності з reasoning OpenAI; маршрути проксі — ні
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити OpenAI API відхиляють його, а поточний каталог Codex не експонує його

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Опціональна ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим API-ключем і OAuth, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Бажана конфігурація Claude CLI зберігає посилання на модель канонічним і вибирає CLI
  бекенд окремо: `anthropic/claude-opus-4-7` з
  model-scoped `agentRuntime.id: "claude-cli"`. Застарілі
  посилання `claude-cli/claude-opus-4-7` усе ще працюють для сумісності.

<Note>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому OpenClaw трактує повторне використання Claude CLI та використання `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику. setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI та `claude -p`, коли вони доступні.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Постачальник: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Застаріле посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання нативного harness сервера застосунку Codex: `openai/gpt-5.5`
- Документація нативного harness сервера застосунку Codex: [harness Codex](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin сервера застосунку Codex вибирається лише runtime harness Codex або застарілими посиланнями `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий транспорт — `auto` (спочатку WebSocket, SSE як fallback)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex до `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує ту саму конфігурацію перемикача `/fast` і `params.fastMode`, що й прямі `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативні для каталогу Codex `contextWindow = 400000` і типовий runtime `contextTokens = 272000`; перевизначте обмеження runtime за допомогою `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.
- Для поширеного маршруту з підпискою плюс нативним runtime Codex увійдіть з автентифікацією `openai-codex`, але налаштуйте `openai/gpt-5.5`; кроки агента OpenAI типово вибирають Codex.
- Використовуйте provider/model `agentRuntime.id: "pi"` лише тоді, коли потрібен маршрут сумісності через PI; інакше залишайте `openai/gpt-5.5` на типовому harness Codex.
- Старіші посилання `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` і `openai-codex/gpt-5.3*` приховано, оскільки облікові записи ChatGPT/Codex OAuth відхиляють їх; натомість використовуйте `openai-codex/gpt-5.5` або нативний маршрут runtime Codex.

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

### Інші розміщені варіанти в стилі підписки

<CardGroup cols={3}>
  <Card title="Моделі GLM" href="/uk/providers/glm">
    Z.AI Coding Plan або загальні API-ендпоїнти.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    MiniMax Coding Plan OAuth або доступ за API-ключем.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня постачальника Qwen Cloud плюс зіставлення ендпоїнтів Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник runtime Zen: `opencode`
- Постачальник runtime Go: `opencode-go`
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
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одинарне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw, що використовує `google/gemini-3.1-flash-preview`, нормалізується до `google/gemini-3-flash-preview`
- Псевдонім: `google/gemini-3.1-pro` приймається й нормалізується до live ID API Gemini від Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Мислення: `/think adaptive` використовує динамічне мислення Google. Gemini 3/3.1 не вказують фіксований `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застарілий `cached_content`), щоб передати нативний для провайдера дескриптор `cachedContents/...`; влучання кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує свій потік OAuth

<Warning>
Gemini CLI OAuth в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
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

    Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`. Ви **не** вставляєте ідентифікатор клієнта чи секрет у `openclaw.json`. Потік входу CLI зберігає токени в профілях автентифікації на хості Gateway.

  </Step>
  <Step title="Налаштуйте проєкт (за потреби)">
    Якщо запити не виконуються після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  </Step>
</Steps>

Відповіді Gemini CLI JSON аналізуються з `response`; використання повертається до `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

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
- Базова URL-адреса: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачає `kilocode/kilo/auto`; live-виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог часу виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не жорстко закодована в OpenClaw.

Див. [/providers/kilocode](/uk/providers/kilocode), щоб отримати деталі налаштування.

### Інші вбудовані Plugin провайдерів

| Постачальник           | ID                               | Змінна середовища автентифікації                             | Приклад моделі                                |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
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

#### Особливості, які варто знати

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для cache-TTL у кешуванні підказок, керованому OpenRouter, але не отримують маркерів кешу Anthropic. Як проксі-подібний OpenAI-сумісний шлях, він пропускає формування, призначене лише для нативного OpenAI (`serviceTier`, Responses `store`, підказки кешу підказок, сумісність міркування OpenAI). Посилання на базі Gemini зберігають лише санітизацію сигнатур думок proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Посилання на базі Gemini проходять тим самим шляхом санітизації proxy-Gemini; `kilocode/kilo/auto` та інші посилання, що не підтримують проксі-міркування, пропускають інʼєкцію проксі-міркування.
  </Accordion>
  <Accordion title="MiniMax">
    Налаштування з API-ключем записує явні текстові визначення чат-моделей M2.7; розуміння зображень залишається на медіапостачальнику `MiniMax-VL-01`, яким володіє плагін.
  </Accordion>
  <Accordion title="NVIDIA">
    ID моделей використовують простір імен `nvidia/<vendor>/<model>` (наприклад, `nvidia/nvidia/nemotron-...` поряд із `nvidia/moonshotai/kimi-k2.5`); засоби вибору зберігають буквальну композицію `<provider>/<model-id>`, тоді як канонічний ключ, надісланий до API, залишається з одним префіксом.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. `grok-4.3` є вбудованою стандартною чат-моделлю. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Постачається як вбудований плагін постачальника `cerebras`. GLM використовує `zai-glm-4.7`; OpenAI-сумісна базова URL-адреса: `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Постачальники через `models.providers` (власна/базова URL-адреса)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** постачальників або OpenAI/Anthropic-сумісні проксі.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують стандартний каталог. Використовуйте явні записи `models.providers.<id>` лише тоді, коли потрібно перевизначити стандартну базову URL-адресу, заголовки або список моделей.

Перевірки можливостей моделей Gateway також читають явні метадані `models.providers.<id>.models[]`. Якщо власна або проксі-модель приймає зображення, задайте `input: ["text", "image"]` для цієї моделі, щоб WebChat і шляхи вкладень, що походять із вузла, передавали зображення як нативні вхідні дані моделі, а не як текстові медіапосилання.

`agents.defaults.models["provider/model"]` керує лише видимістю моделей, псевдонімами та метаданими окремих моделей для агентів. Він сам собою не реєструє нову runtime-модель. Для моделей власного постачальника також додайте `models.providers.<provider>.models[]` принаймні з відповідним `id`.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. За замовчуванням використовуйте вбудованого постачальника й додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базову URL-адресу або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` or `openclaw onboard --auth-choice moonshot-api-key-cn`

ID моделей Kimi K2:

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

Kimi Coding використовує сумісну з Anthropic кінцеву точку Moonshot AI:

- Постачальник: `kimi`
- Автентифікація: `KIMI_API_KEY`
- Приклад моделі: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Застарілі `kimi/kimi-code` і `kimi/k2p5` досі приймаються як ідентифікатори моделей для сумісності й нормалізуються до стабільного ідентифікатора моделі API Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Постачальник: `volcengine` (для кодування: `volcengine-plan`)
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

Під час онбордингу за замовчуванням використовується поверхня для кодування, але загальний каталог `volcengine/*` реєструється одночасно.

У засобах вибору моделей для онбордингу/налаштування варіант автентифікації Volcengine надає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого постачальником.

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

### BytePlus (International)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Постачальник: `byteplus` (для кодування: `byteplus-plan`)
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

Під час онбордингу за замовчуванням використовується поверхня для кодування, але загальний каталог `byteplus/*` реєструється одночасно.

У засобах вибору моделей для онбордингу/налаштування варіант автентифікації BytePlus надає перевагу рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого постачальником.

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

Synthetic надає сумісні з Anthropic моделі через постачальника `synthetic`:

- Постачальник: `synthetic`
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

MiniMax налаштовується через `models.providers`, оскільки використовує власні кінцеві точки:

- MiniMax OAuth (глобально): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобально): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax) для подробиць налаштування, варіантів моделей і фрагментів конфігурації.

<Note>
На сумісному з Anthropic потоковому шляху MiniMax OpenClaw вимикає thinking за замовчуванням, якщо ви явно його не задасте, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Розподіл можливостей, якими володіє Plugin:

- Типові налаштування тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень належить Plugin: `MiniMax-VL-01` на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, що використовує нативний API:

- Постачальник: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Типова базова URL-адреса інференсу: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з ідентифікаторів, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio для виявлення та автоматичного завантаження, а для інференсу за замовчуванням — `/v1/chat/completions`. Якщо ви хочете, щоб JIT-завантаження, TTL і автоматичне витіснення LM Studio керували життєвим циклом моделі, задайте `models.providers.lmstudio.params.preload: false`. Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування та усунення несправностей.

### Ollama

Ollama постачається як вбудований Plugin постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через `OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до `openclaw onboard` і засобу вибору моделей. Див. [/providers/ollama](/uk/providers/ollama) для онбордингу, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/самостійно розміщених сумісних з OpenAI серверів:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автоматичне виявлення (працює будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Див. [/providers/vllm](/uk/providers/vllm) для подробиць.

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких самостійно розміщених сумісних з OpenAI серверів:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автоматичне виявлення (працює будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Див. [/providers/sglang](/uk/providers/sglang) для подробиць.

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (сумісний з OpenAI):

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
    Для власних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими. Якщо їх пропущено, OpenClaw за замовчуванням використовує:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендовано: задайте явні значення, що відповідають обмеженням вашого проксі/моделі.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Для `api: "openai-completions"` на ненативних кінцевих точках (будь-яка непорожня `baseUrl`, хост якої не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 для непідтримуваних ролей `developer`.
    - Маршрути сумісних з OpenAI проксі також пропускають нативне формування запитів, специфічне лише для OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без підказок prompt-cache, без формування payload для сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
    - Для сумісних з OpenAI проксі Completions, яким потрібні специфічні для постачальника поля, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об’єднати додатковий JSON із вихідним тілом запиту.
    - Для елементів керування chat-template vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень thinking сеансу вимкнено.
    - Для повільних локальних моделей або віддалених LAN/tailnet-хостів задайте `models.providers.<id>.timeoutSeconds`. Це розширює обробку HTTP-запитів до моделей постачальника, включно з підключенням, заголовками, потоковою передачею тіла та загальним перериванням guarded-fetch, не збільшуючи загальний тайм-аут виконання агента.
    - HTTP-виклики постачальника моделей дозволяють fake-IP DNS-відповіді Surge, Clash і sing-box у `198.18.0.0/15` і `fc00::/7` лише для налаштованого імені хоста `baseUrl` постачальника. Інші приватні, loopback, link-local і metadata-призначення все одно потребують явного ввімкнення `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Якщо `baseUrl` порожній або пропущений, OpenClaw зберігає типову поведінку OpenAI (яка розв’язується до `api.openai.com`).
    - Для безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних кінцевих точках `openai-completions`.
    - Для `api: "anthropic-messages"` на непрямих кінцевих точках (будь-який постачальник, окрім канонічного `anthropic`, або власний `models.providers.anthropic.baseUrl`, хост якого не є публічною кінцевою точкою `api.anthropic.com`) OpenClaw приглушує неявні beta-заголовки Anthropic, такі як `claude-code-20250219`, `interleaved-thinking-2025-05-14` і OAuth-маркери, щоб власні сумісні з Anthropic проксі не відхиляли непідтримувані beta-прапорці. Явно задайте `models.providers.<id>.headers["anthropic-beta"]`, якщо вашому проксі потрібні конкретні beta-функції.

  </Accordion>
</AccordionGroup>

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Конфігурація](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) - ключі конфігурації моделей
- [Відмовостійкість моделей](/uk/concepts/model-failover) - fallback-ланцюги та поведінка повторних спроб
- [Моделі](/uk/concepts/models) - конфігурація моделей і псевдоніми
- [Постачальники](/uk/providers) - посібники з налаштування для кожного постачальника
