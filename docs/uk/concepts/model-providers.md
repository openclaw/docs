---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного провайдера
    - Вам потрібні приклади конфігурацій або команди CLI для початкового налаштування постачальників моделей
sidebarTitle: Model providers
summary: Огляд постачальника моделей із прикладами конфігурацій і потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-07-04T04:06:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Довідник для **постачальників LLM/моделей** (не каналів чату, як-от WhatsApp/Telegram). Правила вибору моделей див. у [Моделях](/uk/concepts/models).

## Швидкі правила

<AccordionGroup>
  <Accordion title="Посилання на моделі та CLI-помічники">
    - Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` працює як список дозволених моделей, якщо задано.
    - CLI-помічники: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` задають типові значення на рівні постачальника; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` перевизначають їх для окремої моделі.
    - Правила резервного перемикання, перевірки cooldown і збереження перевизначень сесії: [Відмовостійке перемикання моделей](/uk/concepts/model-failover).

  </Accordion>
  <Accordion title="Додавання автентифікації постачальника не змінює вашу основну модель">
    `openclaw configure` зберігає наявний `agents.defaults.model.primary`, коли ви додаєте або повторно автентифікуєте постачальника. `openclaw models auth login` робить те саме, якщо не передати `--set-default`. Плагіни постачальників усе ще можуть повертати рекомендовану типову модель у своєму патчі конфігурації автентифікації, але OpenClaw трактує це як "зробити цю модель доступною", якщо основна модель уже існує, а не як "замінити поточну основну модель".

    Щоб навмисно перемкнути типову модель, використовуйте `openclaw models set <provider/model>` або `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Поділ постачальника/середовища виконання OpenAI">
    Маршрути сімейства OpenAI залежать від префікса:

    - `openai/<model>` типово використовує нативну обв’язку app-server Codex для ходів агента. Це звичайне налаштування підписки ChatGPT/Codex.
    - застарілі посилання на моделі Codex є застарілою конфігурацією, яку doctor переписує на `openai/<model>`.
    - `openai/<model>` плюс `agentRuntime.id: "openclaw"` на рівні постачальник/модель використовує вбудоване середовище виконання OpenClaw для явних маршрутів API-ключа або сумісності.

    Див. [OpenAI](/uk/providers/openai) і [обв’язку Codex](/uk/plugins/codex-harness). Якщо поділ постачальника/середовища виконання незрозумілий, спочатку прочитайте [середовища виконання агентів](/uk/concepts/agent-runtimes).

    Автоматичне ввімкнення плагіна дотримується тієї самої межі: посилання агентів `openai/*` вмикають плагін Codex для типового маршруту, а явні `agentRuntime.id: "codex"` на рівні постачальник/модель або застарілі посилання `codex/<model>` також потребують його.

    GPT-5.5 типово доступна через нативну обв’язку app-server Codex на `openai/gpt-5.5`, а через середовище виконання OpenClaw тоді, коли політика середовища виконання постачальник/модель явно вибирає `openclaw`.

  </Accordion>
  <Accordion title="CLI-середовища виконання">
    CLI-середовища виконання використовують той самий поділ: виберіть канонічні посилання на моделі, як-от `anthropic/claude-*` або `google/gemini-*`, а потім задайте політику середовища виконання постачальник/модель як `claude-cli` або `google-gemini-cli`, коли потрібен локальний CLI-бекенд.

    Застарілі посилання `claude-cli/*` і `google-gemini-cli/*` мігрують назад до канонічних посилань постачальників, а середовище виконання записується окремо. Застарілі посилання `codex-cli/*` мігрують до `openai/*` і використовують маршрут app-server Codex; OpenClaw більше не тримає вбудований CLI-бекенд Codex.

  </Accordion>
</AccordionGroup>

## Поведінка постачальника, якою володіє Plugin

Більшість логіки, специфічної для постачальника, живе в плагінах постачальників (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл інференсу. Плагіни відповідають за онбординг, каталоги моделей, зіставлення змінних середовища автентифікації, нормалізацію транспорту/конфігурації, очищення схем інструментів, класифікацію відмовостійкого перемикання, оновлення OAuth, звітування про використання, профілі thinking/reasoning тощо.

Повний список хуків provider-SDK і приклади вбудованих плагінів наведено в [плагінах постачальників](/uk/plugins/sdk-provider-plugins). Постачальник, якому потрібен повністю власний виконавець запитів, є окремою, глибшою поверхнею розширення.

<Note>
Поведінка runner, якою володіє постачальник, живе в явних хуках постачальника, як-от політика replay, нормалізація схем інструментів, обгортання потоку та помічники транспорту/запитів. Застарілий статичний контейнер `ProviderPlugin.capabilities` існує лише для сумісності й більше не читається спільною логікою runner.
</Note>

## Ротація API-ключів

<AccordionGroup>
  <Accordion title="Джерела ключів і пріоритет">
    Налаштуйте кілька ключів через:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одиночне live-перевизначення, найвищий пріоритет)
    - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
    - `<PROVIDER>_API_KEY` (основний ключ)
    - `<PROVIDER>_API_KEY_*` (нумерований список, напр. `<PROVIDER>_API_KEY_1`)

    Для постачальників Google `GOOGLE_API_KEY` також включено як fallback. Порядок вибору ключів зберігає пріоритет і видаляє дублікати значень.

  </Accordion>
  <Accordion title="Коли спрацьовує ротація">
    - Запити повторюються з наступним ключем лише для відповідей про обмеження швидкості (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
    - Збої, не пов’язані з обмеженням швидкості, завершуються одразу; ротація ключів не виконується.
    - Коли всі ключі-кандидати зазнають невдачі, фінальна помилка повертається з останньої спроби.

  </Accordion>
</AccordionGroup>

## Офіційні плагіни постачальників

Офіційні плагіни постачальників публікують власні рядки каталогу моделей. Ці постачальники **не** потребують записів моделей `models.providers`; увімкніть Plugin постачальника, налаштуйте автентифікацію й виберіть модель. Використовуйте `models.providers` лише для явних власних постачальників або вузьких налаштувань запиту, як-от тайм-аути.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одиночне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевірте доступність облікового запису/моделі через `openclaw models list --provider openai`, якщо конкретне встановлення або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto`; OpenClaw передає вибір транспорту спільному середовищу виконання моделей.
- Перевизначайте для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, коли потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають Responses `store`, підказки prompt-cache і формування payload для сумісності з reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` доступна через автентифікацію OAuth підписки ChatGPT/Codex, коли ваш обліковий запис після входу її відкриває; OpenClaw усе ще пригнічує прямі маршрути API-ключа OpenAI і API-ключа Azure для цієї моделі, бо ці транспорти її відхиляють

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (одиночне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком через API-ключ і OAuth-автентифікацію, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Бажана конфігурація Claude CLI зберігає посилання на модель канонічним і вибирає CLI
  бекенд окремо: `anthropic/claude-opus-4-8` з
  `agentRuntime.id: "claude-cli"` в області моделі. Застарілі
  посилання `claude-cli/claude-opus-4-7` усе ще працюють для сумісності.

<Note>
Працівники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику. setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Постачальник: `openai`
- Автентифікація: OAuth (ChatGPT)
- Застаріле посилання на модель OpenAI Codex: `openai/gpt-5.5`
- Посилання нативної обв’язки app-server Codex: `openai/gpt-5.5`
- Документація нативної обв’язки app-server Codex: [обв’язка Codex](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex вибирається середовищем виконання обв’язки Codex.
- CLI: `openclaw onboard --auth-choice openai` або `openclaw models auth login --provider openai`
- Типовий транспорт — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначайте для окремої моделі OpenAI Codex через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) додаються лише до нативного трафіку Codex до `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Має той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямі `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai/gpt-5.5` використовує нативні `contextWindow = 400000` з каталогу Codex і типове середовище виконання `contextTokens = 272000`; перевизначте обмеження середовища виконання через `models.providers.openai.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.
- Для типового маршруту підписки плюс нативного середовища виконання Codex увійдіть через автентифікацію `openai` і налаштуйте `openai/gpt-5.5`; ходи агента OpenAI типово вибирають Codex.
- Використовуйте `agentRuntime.id: "openclaw"` на рівні постачальник/модель лише тоді, коли потрібен вбудований маршрут OpenClaw; інакше залишайте `openai/gpt-5.5` на типовій обв’язці Codex.
- застарілі посилання Codex GPT є застарілим станом, а не live-маршрутом постачальника. Використовуйте `openai/gpt-5.5` у нативному середовищі виконання Codex для нової конфігурації агента й запустіть `openclaw doctor --fix`, щоб мігрувати старі застарілі посилання на моделі Codex до канонічних посилань `openai/*`.

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
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Інші hosted-варіанти в стилі підписки

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/uk/providers/zai">
    Coding Plan Z.AI або загальні API-ендпоїнти.
  </Card>
  <Card title="MiniMax" href="/uk/providers/minimax">
    OAuth MiniMax Coding Plan або доступ через API-ключ.
  </Card>
  <Card title="Qwen Cloud" href="/uk/providers/qwen">
    Поверхня постачальника Qwen Cloud плюс зіставлення ендпоїнтів Alibaba DashScope і Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
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

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов'язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (єдине перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- Псевдонім: `google/gemini-3.1-pro` приймається й нормалізується до чинного ідентифікатора Google Gemini API, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Мислення: `/think adaptive` використовує динамічне мислення Google. Gemini 3/3.1 не вказують фіксований `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent` (або застарілий `cached_content`), щоб передати нативний для провайдера дескриптор `cachedContents/...`; влучання в кеш Gemini відображаються як `cacheRead` OpenClaw

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth

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

    Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`. Ви **не** вставляєте ідентифікатор клієнта або секрет у `openclaw.json`. Потік входу CLI зберігає токени в профілях автентифікації на хості Gateway.

  </Step>
  <Step title="Задайте проєкт (за потреби)">
    Якщо запити не вдаються після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  </Step>
</Steps>

Gemini CLI за замовчуванням використовує `stream-json`. OpenClaw читає потокові
повідомлення асистента й нормалізує `stats.cached` у `cacheRead`; застарілі
перевизначення `--output-format json` досі читають текст відповіді з `response`.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Посилання на моделі використовують канонічний ідентифікатор провайдера `zai/*`.
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Інші вбудовані Plugin провайдерів

| Провайдер                               | Ідентифікатор                    | Змінна середовища автентифікації                    | Приклад моделі                                             |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/uk/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth або `OPENROUTER_API_KEY`            | `openrouter/auto`                                          |
| [Qwen OAuth](/uk/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth або `XAI_API_KEY`          | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Особливості, які варто знати

<AccordionGroup>
  <Accordion title="OpenRouter">
    Застосовує власні заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для кешування промптів із cache-TTL, керованого OpenRouter, але не отримують маркери кешу Anthropic. Як проксі-подібний OpenAI-сумісний шлях, він пропускає формування, властиве лише нативному OpenAI (`serviceTier`, Responses `store`, підказки prompt-cache, сумісність міркувань OpenAI). Посилання на базі Gemini зберігають лише санітизацію сигнатур думок proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Посилання на базі Gemini проходять той самий шлях санітизації proxy-Gemini; `kilocode/kilo/auto` та інші посилання, що не підтримують проксі-міркування, пропускають ін’єкцію проксі-міркувань.
  </Accordion>
  <Accordion title="MiniMax">
    Онбординг через API-ключ записує явні визначення чат-моделей M3 і M2.7; розуміння зображень залишається на медіапровайдері `MiniMax-VL-01`, яким володіє Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Ідентифікатори моделей використовують простір імен `nvidia/<vendor>/<model>` (наприклад, `nvidia/nvidia/nemotron-...` поряд із `nvidia/moonshotai/kimi-k2.5`); засоби вибору зберігають буквальну композицію `<provider>/<model-id>`, тоді як канонічний ключ, надісланий до API, залишається з одним префіксом.
  </Accordion>
  <Accordion title="xAI">
    Використовує шлях xAI Responses. Рекомендований шлях — SuperGrok/X Premium OAuth; API-ключі досі працюють через `XAI_API_KEY` або конфігурацію Plugin, а Grok `web_search` повторно використовує той самий профіль автентифікації перед резервним переходом до API-ключа. `grok-4.3` є вбудованою чат-моделлю за замовчуванням, а `grok-build-0.1` можна вибрати для роботи, зосередженої на збірці/кодуванні. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Провайдери через `models.providers` (користувацький/базовий URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **користувацьких** провайдерів або OpenAI/Anthropic-сумісні проксі.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують стандартний каталог. Використовуйте явні записи `models.providers.<id>` лише тоді, коли потрібно перевизначити стандартний базовий URL, заголовки або список моделей.

Перевірки можливостей моделей Gateway також читають явні метадані `models.providers.<id>.models[]`. Якщо користувацька або проксі-модель приймає зображення, задайте `input: ["text", "image"]` для цієї моделі, щоб WebChat і шляхи вкладень із джерелом Node передавали зображення як нативні вхідні дані моделі, а не як текстові посилання на медіа.

`agents.defaults.models["provider/model"]` керує лише видимістю моделей, псевдонімами та метаданими окремих моделей для агентів. Сам по собі він не реєструє нову модель виконання. Для користувацьких моделей постачальника також додайте `models.providers.<provider>.models[]` щонайменше з відповідним `id`.

### Moonshot AI (Kimi)

Установіть `@openclaw/moonshot-provider` перед онбордингом. Додавайте явний запис `models.providers.moonshot` лише тоді, коли потрібно перевизначити базовий URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Ідентифікатори моделей Kimi K2:

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

### Кодування з Kimi

Kimi Coding використовує Anthropic-сумісну кінцеву точку Moonshot AI:

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

Застарілі `kimi/kimi-code` і `kimi/k2p5` залишаються прийнятними як ідентифікатори моделей для сумісності та нормалізуються до стабільного ідентифікатора моделі API Kimi.

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

Онбординг за замовчуванням використовує поверхню для програмування, але загальний каталог `volcengine/*` реєструється одночасно.

У засобах вибору моделей під час онбордингу/налаштування варіант автентифікації Volcengine надає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого постачальником.

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

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Постачальник: `byteplus` (для програмування: `byteplus-plan`)
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

Онбординг за замовчуванням використовує поверхню для програмування, але загальний каталог `byteplus/*` реєструється одночасно.

У засобах вибору моделей під час онбордингу/налаштування варіант автентифікації BytePlus надає перевагу рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу порожнього засобу вибору, обмеженого постачальником.

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

Synthetic надає Anthropic-сумісні моделі через постачальника `synthetic`:

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

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (Китай): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальний): `--auth-choice minimax-global-api`
- API-ключ MiniMax (Китай): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax), щоб отримати подробиці налаштування, варіанти моделей і фрагменти конфігурації.

<Note>
На Anthropic-сумісному потоковому шляху MiniMax OpenClaw за замовчуванням вимикає thinking для сімейства M2.x, якщо ви явно його не задасте; MiniMax-M3 (і M3.x) за замовчуванням лишається на пропущеному/адаптивному шляху thinking постачальника. `/fast on` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
</Note>

Поділ можливостей, якими володіє Plugin:

- Текстові/чатові значення за замовчуванням лишаються на `minimax/MiniMax-M3`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це належний Plugin `MiniMax-VL-01` на обох шляхах автентифікації MiniMax
- Вебпошук лишається на ідентифікаторі постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, що використовує нативний API:

- Постачальник: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Базова URL-адреса інференсу за замовчуванням: `http://localhost:1234/v1`

Потім задайте модель (замініть одним з ідентифікаторів, повернених `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio для виявлення та автозавантаження, а `/v1/chat/completions` — для інференсу за замовчуванням. Якщо ви хочете, щоб JIT-завантаження, TTL і автоматичне витіснення LM Studio керували життєвим циклом моделі, задайте `models.providers.lmstudio.params.preload: false`. Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування й усунення несправностей.

### Ollama

Ollama постачається як вбудований Plugin постачальника та використовує нативний API Ollama:

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через `OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до `openclaw onboard` і засобу вибору моделей. Див. [/providers/ollama](/uk/providers/ollama) для онбордингу, хмарного/локального режиму та користувацької конфігурації.

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/самостійно розгорнутих OpenAI-сумісних серверів:

- Постачальник: `vllm`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Базова URL-адреса за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автовиявлення (підійде будь-яке значення, якщо ваш сервер не застосовує автентифікацію):

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

Див. [/providers/vllm](/uk/providers/vllm) для подробиць.

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких самостійно розгорнутих OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Базова URL-адреса за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автовиявлення (підійде будь-яке значення, якщо ваш сервер не застосовує автентифікацію):

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
  <Accordion title="Default optional fields">
    Для користувацьких постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов'язковими. Якщо їх пропущено, OpenClaw за замовчуванням використовує:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Рекомендовано: задайте явні значення, що відповідають обмеженням вашого проксі/моделі.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Для `api: "openai-completions"` на ненативних кінцевих точках (будь-яка непорожня `baseUrl`, хост якої не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 постачальника для непідтримуваних ролей `developer`.
    - OpenAI-сумісні маршрути проксі-стилю також пропускають формування запитів, властиве лише нативному OpenAI: без `service_tier`, без Responses `store`, без Completions `store`, без підказок prompt cache, без OpenAI reasoning-compat формування payload і без прихованих заголовків атрибуції OpenClaw.
    - Для OpenAI-сумісних проксі Completions, яким потрібні специфічні для постачальника поля, задайте `agents.defaults.models["provider/model"].params.extra_body` (або `extraBody`), щоб об'єднати додатковий JSON із вихідним тілом запиту.
    - Для керування chat-template у vLLM задайте `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Вбудований Plugin vLLM автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли рівень thinking у сесії вимкнено.
    - Для повільних локальних моделей або віддалених LAN/tailnet-хостів задайте `models.providers.<id>.timeoutSeconds`. Це розширює обробку HTTP-запитів до моделі постачальника, включно з підключенням, заголовками, потоковою передачею тіла та загальним перериванням guarded-fetch, не збільшуючи загальний тайм-аут часу виконання агента. Якщо `agents.defaults.timeoutSeconds` або тайм-аут конкретного запуску нижчий, підніміть і цю межу; тайм-аути постачальника не можуть подовжити весь запуск.
    - HTTP-виклики до постачальників моделей дозволяють fake-IP DNS-відповіді Surge, Clash і sing-box у `198.18.0.0/15` та `fc00::/7` лише для імені хоста налаштованого `baseUrl` постачальника. Користувацькі/локальні кінцеві точки постачальника також довіряють точному налаштованому походженню `scheme://host:port` для захищених запитів моделей, включно з loopback, LAN і tailnet-хостами. Це не новий параметр конфігурації; налаштований вами `baseUrl` розширює політику запитів лише для цього походження. Дозвіл імені хоста fake-IP і довіра до точного походження є незалежними механізмами. Інші приватні, loopback, link-local, metadata призначення та інші порти все ще потребують явного ввімкнення `models.providers.<id>.request.allowPrivateNetwork: true`. Задайте `models.providers.<id>.request.allowPrivateNetwork: false`, щоб відмовитися від довіри до точного походження.
    - Якщо `baseUrl` порожня/пропущена, OpenClaw зберігає стандартну поведінку OpenAI (яка резолвиться в `api.openai.com`).
    - З міркувань безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних кінцевих точках `openai-completions`.
    - Для `api: "anthropic-messages"` на непрямих кінцевих точках (будь-який постачальник, крім канонічного `anthropic`, або користувацька `models.providers.anthropic.baseUrl`, хост якої не є публічною кінцевою точкою `api.anthropic.com`) OpenClaw пригнічує неявні beta-заголовки Anthropic, як-от `claude-code-20250219`, `interleaved-thinking-2025-05-14` і OAuth-маркери, щоб користувацькі Anthropic-сумісні проксі не відхиляли непідтримувані beta-прапорці. Явно задайте `models.providers.<id>.headers["anthropic-beta"]`, якщо вашому проксі потрібні конкретні beta-функції.

  </Accordion>
</AccordionGroup>

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Конфігурація](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов'язане

- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) - ключі конфігурації моделей
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover) - ланцюжки fallback і поведінка повторних спроб
- [Моделі](/uk/concepts/models) - конфігурація моделей і псевдоніми
- [Постачальники](/uk/providers) - посібники з налаштування для кожного постачальника
