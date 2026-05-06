---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного провайдера
    - Вам потрібні приклади конфігурацій або команди CLI для початкового налаштування постачальників моделей
sidebarTitle: Model providers
summary: Огляд постачальників моделей із прикладами конфігурацій + сценаріями CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-05-06T08:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

Довідник для **провайдерів LLM/моделей** (не каналів чату на кшталт WhatsApp/Telegram). Правила вибору моделей див. у [Моделі](/uk/concepts/models).

## Короткі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та помічники CLI">
    - Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` діє як список дозволених, коли його задано.
    - Помічники CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають типові значення на рівні провайдера; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для окремої моделі.
    - Правила резервного перемикання, перевірки cooldown і збереження перевизначень сеансу: [Відмовостійке перемикання моделей](/uk/concepts/model-failover).

  </Accordion>
  <Accordion title="Додавання автентифікації провайдера не змінює вашу основну модель">
    `openclaw configure` зберігає наявне `agents.defaults.model.primary`, коли ви додаєте або повторно автентифікуєте провайдера. Provider plugins усе ще можуть повертати рекомендовану типову модель у своєму патчі конфігурації автентифікації, але configure трактує це як «зробити цю модель доступною», якщо основна модель уже існує, а не як «замінити поточну основну модель».

    Щоб навмисно перемкнути типову модель, використовуйте `openclaw models set <provider/model>` або `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Поділ провайдера OpenAI і runtime">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` плюс `agents.defaults.agentRuntime.id: "codex"` використовує нативний app-server harness Codex. Це звичайне налаштування підписки ChatGPT/Codex.
    - `openai-codex/<model>` використовує Codex OAuth у PI.
    - `openai/<model>` без перевизначення runtime Codex використовує прямий провайдер OpenAI з API-ключем у PI.

    Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо поділ провайдера/runtime незрозумілий, спочатку прочитайте [Runtime агентів](/uk/concepts/agent-runtimes).

    Автоматичне вмикання Plugin дотримується тієї самої межі: `openai-codex/<model>` належить до OpenAI plugin, тоді як Codex plugin вмикається через `agentRuntime.id: "codex"` або застарілі посилання `codex/<model>`.

    GPT-5.5 доступна через нативний app-server harness Codex, коли задано `agentRuntime.id: "codex"`, через `openai-codex/gpt-5.5` у PI для Codex OAuth і через `openai/gpt-5.5` у PI для прямого трафіку з API-ключем, якщо ваш обліковий запис це надає.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI використовують той самий поділ: виберіть канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задайте `agents.defaults.agentRuntime.id` як `claude-cli`, `google-gemini-cli` або `codex-cli`, коли потрібен локальний бекенд CLI.

    Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань провайдерів із runtime, записаним окремо.

  </Accordion>
</AccordionGroup>

## Поведінка провайдера, якою володіє Plugin

Більшість специфічної для провайдера логіки живе в provider plugins (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл inference. Plugins володіють onboarding, каталогами моделей, зіставленням env-var автентифікації, нормалізацією transport/config, очищенням tool-schema, класифікацією failover, оновленням OAuth, звітуванням про використання, профілями thinking/reasoning тощо.

Повний список хуків provider-SDK і прикладів bundled-plugin наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Провайдер, якому потрібен повністю власний виконавець запитів, є окремою, глибшою поверхнею розширення.

<Note>
Поведінка runner, якою володіє провайдер, живе на явних хуках провайдера, як-от політика replay, нормалізація tool-schema, обгортання потоку та помічники transport/request. Застарілий статичний пакет `ProviderPlugin.capabilities` призначений лише для сумісності й більше не читається спільною логікою runner.
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)

    Для провайдерів Google `GOOGLE_API_KEY` також включено як fallback. Порядок вибору ключів зберігає пріоритет і усуває дублікати значень.

  </Accordion>
  <Accordion title="Коли вмикається ротація">
    - Запити повторюються з наступним ключем лише для відповідей rate-limit (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичних повідомлень про ліміт використання).
    - Помилки, не пов’язані з rate-limit, одразу завершуються невдачею; ротація ключів не виконується.
    - Коли всі ключі-кандидати зазнають невдачі, повертається фінальна помилка з останньої спроби.

  </Accordion>
</AccordionGroup>

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi-ai. Ці провайдери **не** потребують конфігурації `models.providers`; просто задайте автентифікацію й виберіть модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевірте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`, якщо конкретне встановлення або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначайте для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, коли потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки prompt-cache і формування payload для сумісності з reasoning OpenAI; маршрути проксі — ні
- `openai/gpt-5.3-codex-spark` навмисно придушено в OpenClaw, бо live-запити OpenAI API його відхиляють, а поточний каталог Codex його не надає

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
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком з API-ключем і OAuth-автентифікацією, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Бажана конфігурація Claude CLI зберігає канонічне посилання на модель і вибирає бекенд CLI
  окремо: `anthropic/claude-opus-4-7` з
  `agents.defaults.agentRuntime.id: "claude-cli"`. Застарілі посилання
  `claude-cli/claude-opus-4-7` усе ще працюють для сумісності.

<Note>
Працівники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw трактує повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику. Anthropic setup-token залишається доступним як підтримуваний шлях токена OpenClaw, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
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
- Посилання на нативний app-server harness Codex: `openai/gpt-5.5` з `agents.defaults.agentRuntime.id: "codex"`
- Документація нативного app-server harness Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує OpenAI plugin; нативний app-server plugin Codex вибирається лише через runtime Codex harness або застарілі посилання `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий transport — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначайте для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex до `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Спільно використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямі `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативний для каталогу Codex `contextWindow = 400000` і типовий runtime `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.
- Для поширеного маршруту з підпискою плюс нативним runtime Codex увійдіть за допомогою автентифікації `openai-codex`, але налаштуйте `openai/gpt-5.5` плюс `agents.defaults.agentRuntime.id: "codex"`.
- Використовуйте `openai-codex/gpt-5.5` лише тоді, коли потрібен маршрут Codex OAuth/підписки через PI; використовуйте `openai/gpt-5.5` без перевизначення runtime Codex, коли ваше налаштування API-ключа й локальний каталог надають публічний API-маршрут.
- Старіші посилання `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` і `openai-codex/gpt-5.3*` придушено, бо облікові записи ChatGPT/Codex OAuth їх відхиляють; натомість використовуйте `openai-codex/gpt-5.5` або нативний маршрут runtime Codex.

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

### Інші hosted-варіанти в стилі підписки

<CardGroup cols={3}>
  <Card title="Моделі GLM" href="/uk/providers/glm">
    Z.AI Coding Plan або загальні API endpoints.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    MiniMax Coding Plan OAuth або доступ за API-ключем.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня провайдера Qwen Cloud плюс зіставлення endpoint Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер Zen runtime: `opencode`
- Провайдер Go runtime: `opencode-go`
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
- Необов’язкова ротація: резервні `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одноразове перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- Псевдонім: `google/gemini-3.1-pro` приймається й нормалізується до живого ідентифікатора Gemini API від Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Мислення: `/think adaptive` використовує динамічне мислення Google. Gemini 3/3.1 пропускають фіксований `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застарілий `cached_content`), щоб передати провайдерний дескриптор `cachedContents/...`; влучання в кеш Gemini відображаються як `cacheRead` OpenClaw

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує свій потік OAuth

<Warning>
Gemini CLI OAuth в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
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

    Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`. Ви **не** вставляєте ідентифікатор клієнта чи секрет у `openclaw.json`. Потік входу CLI зберігає токени в профілях автентифікації на хості gateway.

  </Step>
  <Step title="Установіть проєкт (за потреби)">
    Якщо запити не виконуються після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway.
  </Step>
</Steps>

JSON-відповіді Gemini CLI аналізуються з `response`; використання резервно береться зі `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

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
- Статичний резервний каталог постачає `kilocode/kilo/auto`; живе виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог часу виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway, а не жорстко закодована в OpenClaw.

Докладні відомості про налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugin провайдерів

| Провайдер               | Id                               | Env автентифікації                                         | Приклад моделі                                |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                         | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                         | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                            | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                        | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                         | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`       | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                             | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`                     | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                         | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` або `KIMICODE_API_KEY`                      | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                  | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                          | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                         | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                           | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                       | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                          | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                         |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                          | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                         | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                           | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                       | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                   | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                              | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                           | `xiaomi/mimo-v2-flash`                        |

#### Особливості, які варто знати

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Рефи DeepSeek, Moonshot і ZAI придатні для cache-TTL у керованому OpenRouter кешуванні промптів, але не отримують маркери кешу Anthropic. Як проксі-шлях, сумісний з OpenAI, він пропускає формування, призначене лише для нативного OpenAI (`serviceTier`, Responses `store`, підказки кешу промптів, OpenAI reasoning-compat). Рефи на основі Gemini зберігають лише санітизацію thought-signature для proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Рефи на основі Gemini використовують той самий шлях санітизації proxy-Gemini; `kilocode/kilo/auto` та інші рефи без підтримки proxy-reasoning пропускають ін’єкцію proxy reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    Налаштування з API-ключем записує явні визначення текстових чат-моделей M2.7; розуміння зображень залишається на належному Plugin медіапровайдері `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    ID моделей використовують простір імен `nvidia/<vendor>/<model>` (наприклад, `nvidia/nvidia/nemotron-...` поруч із `nvidia/moonshotai/kimi-k2.5`); селектори зберігають буквальну композицію `<provider>/<model-id>`, тоді як канонічний ключ, надісланий до API, лишається з одним префіксом.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. `grok-4.3` є стандартною комплектною чат-моделлю. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Постачається як комплектний Plugin провайдера `cerebras`. GLM використовує `zai-glm-4.7`; базовий URL, сумісний з OpenAI, — `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Провайдери через `models.providers` (власний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** провайдерів або проксі, сумісні з OpenAI/Anthropic.

Багато з наведених нижче комплектних Plugin провайдерів уже публікують стандартний каталог. Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити стандартний базовий URL, заголовки або список моделей.

Перевірки можливостей моделей Gateway також читають явні метадані `models.providers.<id>.models[]`. Якщо власна або проксі-модель приймає зображення, задайте `input: ["text", "image"]` для цієї моделі, щоб WebChat і шляхи вкладень із node-джерела передавали зображення як нативні вхідні дані моделі, а не як текстові медіа-рефи.

### Moonshot AI (Kimi)

Moonshot постачається як комплектний Plugin провайдера. За замовчуванням використовуйте вбудованого провайдера й додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базовий URL або метадані моделі:

- Провайдер: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

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

### Кодування Kimi

Kimi Coding використовує Anthropic-сумісну кінцеву точку Moonshot AI:

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

Застарілий `kimi/k2p5` досі приймається як сумісний id моделі.

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

Onboarding за замовчуванням використовує поверхню для кодування, але загальний каталог `volcengine/*` реєструється одночасно.

У засобах вибору моделі під час onboarding/configure вибір автентифікації Volcengine надає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого провайдером.

<Tabs>
  <Tab title="Стандартні моделі">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Моделі для кодування (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (міжнародний)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

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

Onboarding за замовчуванням використовує поверхню для кодування, але загальний каталог `byteplus/*` реєструється одночасно.

У засобах вибору моделі під час onboarding/configure вибір автентифікації BytePlus надає перевагу рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого провайдером.

<Tabs>
  <Tab title="Стандартні моделі">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Моделі для кодування (byteplus-plan)">
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

MiniMax налаштовується через `models.providers`, оскільки використовує власні кінцеві точки:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Ключ API MiniMax (Global): `--auth-choice minimax-global-api`
- Ключ API MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax) для подробиць налаштування, варіантів моделей і фрагментів конфігурації.

<Note>
На Anthropic-сумісному потоковому шляху MiniMax OpenClaw за замовчуванням вимикає thinking, якщо ви явно його не задасте, а `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Розподіл можливостей, якими володіє Plugin:

- Текстові/чатові значення за замовчуванням залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень належить Plugin: `MiniMax-VL-01` на обох шляхах автентифікації MiniMax
- Вебпошук залишається на id провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin провайдера, що використовує нативний API:

- Провайдер: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Базовий URL інференсу за замовчуванням: `http://localhost:1234/v1`

Потім задайте модель (замініть одним з ID, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio для виявлення та автозавантаження, а `/v1/chat/completions` для інференсу за замовчуванням. Якщо ви хочете, щоб JIT-завантаження, TTL і автоматичне витіснення LM Studio керували життєвим циклом моделі, задайте `models.providers.lmstudio.params.preload: false`. Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування й усунення несправностей.

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через `OLLAMA_API_KEY`, а вбудований Plugin провайдера додає Ollama безпосередньо до `openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama) для onboarding, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований Plugin провайдера для локальних/самостійно розгорнутих OpenAI-сумісних серверів:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автовиявлення (будь-яке значення працює, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть одним з ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Див. [/providers/vllm](/uk/providers/vllm) для подробиць.

### SGLang

SGLang постачається як вбудований Plugin провайдера для швидких самостійно розгорнутих OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автовиявлення (будь-яке значення працює, якщо ваш сервер не вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть одним з ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Див. [/providers/sglang](/uk/providers/sglang) для подробиць.

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
    Для власних провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими. Якщо їх опущено, OpenClaw використовує такі значення за замовчуванням:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендовано: задайте явні значення, які відповідають обмеженням вашого проксі/моделі.

  </Accordion>
  <Accordion title="Правила формування проксі-маршрутів">
    - Для `api: "openai-completions"` на ненативних кінцевих точках (будь-який непорожній `baseUrl`, хост якого не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від провайдера для непідтримуваних ролей `developer`.
    - Проксі-стиль OpenAI-сумісних маршрутів також пропускає нативне формування запитів, специфічне лише для OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без підказок prompt-cache, без формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
    - Для OpenAI-сумісних проксі Completions, яким потрібні поля, специфічні для постачальника, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об’єднати додатковий JSON у вихідне тіло запиту.
    - Для керування chat-template vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень thinking у сесії вимкнений.
    - Для повільних локальних моделей або віддалених LAN/tailnet-хостів задайте `models.providers.<id>.timeoutSeconds`. Це розширює обробку HTTP-запитів до моделі провайдера, включно з підключенням, заголовками, потоковою передачею тіла та загальним перериванням guarded-fetch, не збільшуючи таймаут усього runtime агента.
    - HTTP-виклики провайдера моделі дозволяють fake-IP DNS-відповіді Surge, Clash і sing-box у `198.18.0.0/15` та `fc00::/7` лише для налаштованого імені хоста `baseUrl` провайдера. Інші приватні, loopback, link-local і metadata призначення все одно потребують явного ввімкнення `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Якщо `baseUrl` порожній/опущений, OpenClaw зберігає стандартну поведінку OpenAI (яка резолвиться до `api.openai.com`).
    - З міркувань безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних кінцевих точках `openai-completions`.
    - Для `api: "anthropic-messages"` на непрямих кінцевих точках (будь-який провайдер, крім канонічного `anthropic`, або власний `models.providers.anthropic.baseUrl`, хост якого не є публічною кінцевою точкою `api.anthropic.com`) OpenClaw пригнічує неявні бета-заголовки Anthropic, як-от `claude-code-20250219`, `interleaved-thinking-2025-05-14` і маркери OAuth, щоб власні Anthropic-сумісні проксі не відхиляли непідтримувані beta-прапорці. Явно задайте `models.providers.<id>.headers["anthropic-beta"]`, якщо вашому проксі потрібні конкретні beta-можливості.

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

- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) - ключі конфігурації моделі
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover) - ланцюжки fallback і поведінка повторних спроб
- [Моделі](/uk/concepts/models) - конфігурація моделей і псевдоніми
- [Провайдери](/uk/providers) - посібники з налаштування для кожного провайдера
