---
read_when:
    - Потрібен довідник із налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команд онбордингу CLI для провайдерів моделей
summary: Огляд провайдерів моделей із прикладами конфігурацій + потоками CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-21T05:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafd4d0da950a4ccdec64f85cf485a7da95da6a858588d43be3f7ac5fd0e05b7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Провайдери моделей

Ця сторінка охоплює **провайдерів LLM/моделей** (а не канали чату на кшталт WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви встановите `agents.defaults.models`, це стане списком дозволених значень.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила під час виконання, cooldown-проби та збереження session-override
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це власні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження під час виконання.
- Провайдерські Plugin можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести провайдерів можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні auth-проби на основі env і варіанти провайдерів
  не потребували завантаження середовища виконання Plugin. Решта мапи env-змінних у core тепер
  потрібна лише для не-Plugin/core провайдерів і кількох випадків загального пріоритету, таких
  як онбординг Anthropic зі схемою API-key-first.
- Провайдерські Plugin також можуть володіти поведінкою провайдера під час виконання через
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `supportsAdaptiveThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, і
  `onModelSelected`.
- Примітка: `capabilities` провайдера під час виконання — це спільні метадані раннера (сімейство провайдера,
  особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що [публічна модель capability](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
- Вбудований провайдер `codex` поєднаний із вбудованим harness агента Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні login під керуванням Codex, виявлення моделей,
  нативне відновлення thread і виконання на сервері застосунку. Звичайні посилання `openai/gpt-*`
  і надалі використовують провайдера OpenAI та звичайний transport провайдера OpenClaw.
  Розгортання лише з Codex можуть вимкнути автоматичний резервний перехід до PI через
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Codex Harness](/uk/plugins/codex-harness).

## Поведінка провайдера, якою володіє Plugin

Тепер провайдерські Plugin можуть володіти більшістю специфічної для провайдера логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий поділ:

- `auth[].run` / `auth[].runNonInteractive`: провайдер володіє потоками онбордингу/login
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: провайдер володіє мітками вибору auth,
  застарілими псевдонімами, підказками щодо списку дозволених значень для онбордингу та записами налаштування в засобах вибору онбордингу/моделей
- `catalog`: провайдер з’являється в `models.providers`
- `normalizeModelId`: провайдер нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: провайдер нормалізує `api` / `baseUrl` сімейства transport
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідний провайдер,
  а потім інші провайдерські Plugin, здатні працювати з цим hook, доки один із них справді не змінить
  transport
- `normalizeConfig`: провайдер нормалізує конфігурацію `models.providers.<id>` перед
  її використанням під час виконання; OpenClaw спочатку перевіряє відповідний провайдер, а потім інші
  провайдерські Plugin, здатні працювати з цим hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  provider hook не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи провайдерів Google.
- `applyNativeStreamingUsageCompat`: провайдер застосовує переписування compat для native streaming-usage на основі endpoint для конфігурованих провайдерів
- `resolveConfigApiKey`: провайдер визначає auth env-marker для конфігурованих провайдерів
  без примусового повного завантаження auth під час виконання. `amazon-bedrock` також має
  тут вбудований розпізнавач AWS env-marker, хоча auth Bedrock під час виконання використовує
  типовий ланцюжок AWS SDK.
- `resolveSyntheticAuth`: провайдер може показувати доступність локального/self-hosted або іншого
  auth на основі конфігурації без збереження секретів у відкритому вигляді
- `shouldDeferSyntheticProfileAuth`: провайдер може позначати збережені синтетичні profile-заповнювачі
  як нижчі за пріоритетом, ніж auth на основі env/конфігурації
- `resolveDynamicModel`: провайдер приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: провайдеру потрібне оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: провайдеру потрібні переписування transport або base URL
- `contributeResolvedModelCompat`: провайдер додає compat-прапорці для своїх
  vendor-моделей, навіть коли вони надходять через інший сумісний transport
- `capabilities`: провайдер публікує особливості transcript/tooling/provider-family
- `normalizeToolSchemas`: провайдер очищує схеми інструментів до того, як вбудований
  раннер їх побачить
- `inspectToolSchemas`: провайдер показує специфічні для transport попередження схем
  після нормалізації
- `resolveReasoningOutputMode`: провайдер вибирає контракти виводу reasoning — native чи tagged
- `prepareExtraParams`: провайдер задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: провайдер замінює звичайний шлях stream повністю
  користувацьким transport
- `wrapStreamFn`: провайдер застосовує обгортки сумісності заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: провайдер постачає нативні заголовки або метадані transport
  для кожного ходу
- `resolveWebSocketSessionPolicy`: провайдер постачає нативні заголовки сесії WebSocket
  або політику cool-down сесії
- `createEmbeddingProvider`: провайдер володіє поведінкою embedding для пам’яті, коли вона
  має належати провайдерському Plugin, а не core-перемикачу embedding
- `formatApiKey`: провайдер форматує збережені auth profile у
  рядок `apiKey` під час виконання, якого очікує transport
- `refreshOAuth`: провайдер володіє оновленням OAuth, коли спільних
  засобів оновлення `pi-ai` недостатньо
- `buildAuthDoctorHint`: провайдер додає підказки щодо виправлення, коли оновлення OAuth
  зазнає невдачі
- `matchesContextOverflowError`: провайдер розпізнає специфічні для провайдера
  помилки переповнення context-window, які загальні евристики можуть пропустити
- `classifyFailoverReason`: провайдер зіставляє специфічні для провайдера необроблені помилки transport/API
  з причинами резервного переходу, такими як rate limit або overload
- `isCacheTtlEligible`: провайдер визначає, які upstream-ідентифікатори моделей підтримують TTL кешу prompt
- `buildMissingAuthMessage`: провайдер замінює загальну помилку сховища auth
  на специфічну для провайдера підказку щодо відновлення
- `suppressBuiltInModel`: провайдер приховує застарілі upstream-рядки та може повертати
  помилку під керуванням vendor для прямих збоїв визначення
- `augmentModelCatalog`: провайдер додає синтетичні/фінальні рядки каталогу після
  виявлення та злиття конфігурації
- `isBinaryThinking`: провайдер володіє UX двійкового thinking — увімк./вимк.
- `supportsXHighThinking`: провайдер вмикає `xhigh` для вибраних моделей
- `supportsAdaptiveThinking`: провайдер вмикає `adaptive` для вибраних моделей
- `resolveDefaultThinkingLevel`: провайдер володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: провайдер застосовує специфічні для провайдера глобальні типові значення
  під час матеріалізації конфігурації залежно від режиму auth, env або сімейства моделей
- `isModernModelRef`: провайдер володіє зіставленням бажаної моделі для live/smoke
- `prepareRuntimeAuth`: провайдер перетворює налаштовані облікові дані на короткоживучий
  токен для виконання
- `resolveUsageAuth`: провайдер визначає облікові дані usage/quota для `/usage`
  і пов’язаних поверхонь status/reporting
- `fetchUsageSnapshot`: провайдер володіє отриманням/розбором endpoint usage, тоді як
  core і далі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: провайдер виконує побічні ефекти після вибору моделі, наприклад
  telemetry або bookkeeping сесії під керуванням провайдера

Поточні вбудовані приклади:

- `anthropic`: резервний механізм прямої сумісності вперед для Claude 4.6, підказки з відновлення auth, отримання
  endpoint usage, метадані cache-TTL/provider-family і глобальні
  типові значення конфігурації з урахуванням auth
- `amazon-bedrock`: зіставлення переповнення контексту під керуванням провайдера та класифікація
  причин резервного переходу для специфічних помилок Bedrock `throttle`/`not-ready`, а також
  спільне сімейство повторного відтворення `anthropic-by-model` для захистів політики replay лише для Claude на трафіку Anthropic
- `anthropic-vertex`: захисти політики replay лише для Claude на трафіку повідомлень Anthropic
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки щодо provider capability,
  очищення thought-signature Gemini на проксійованому трафіку Gemini, впровадження reasoning через проксі
  через сімейство stream `openrouter-thinking`, пересилання метаданих маршрутизації
  і політика cache-TTL
- `github-copilot`: онбординг/login пристрою, резервний механізм прямої сумісності вперед для моделей,
  підказки transcript для Claude-thinking, обмін токенів під час виконання та отримання endpoint usage
- `openai`: резервний механізм прямої сумісності вперед для GPT-5.4, пряма нормалізація
  transport OpenAI, підказки відсутньої auth з урахуванням Codex, придушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів usage-token
  (сімейства `input` / `output` і `prompt` / `completion`), спільне
  сімейство stream `openai-responses-defaults` для нативних обгорток OpenAI/Codex,
  метадані provider-family, реєстрація вбудованого провайдера генерації зображень
  для `gpt-image-1` і реєстрація вбудованого провайдера генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервний механізм прямої сумісності вперед для Gemini 3.1,
  нативна перевірка replay Gemini, очищення bootstrap replay, режим
  виводу reasoning з тегами, зіставлення сучасних моделей, реєстрація вбудованого провайдера
  генерації зображень для моделей Gemini image-preview і вбудована
  реєстрація провайдера генерації відео для моделей Veo; OAuth Gemini CLI також
  володіє форматуванням токенів auth-profile, розбором usage-token і отриманням
  endpoint квот для поверхонь usage
- `moonshot`: спільний transport, нормалізація payload thinking під керуванням Plugin
- `kilocode`: спільний transport, заголовки запитів під керуванням Plugin, нормалізація payload reasoning,
  очищення thought-signature проксійованого Gemini та політика cache-TTL
- `zai`: резервний механізм прямої сумісності вперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model і auth usage + отримання квот;
  невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація transport Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типовий `tool_stream`, очищення tool-schema /
  reasoning-payload, специфічне для xAI, і вбудована реєстрація провайдера генерації відео
  для `grok-imagine-video`
- `mistral`: метадані capability під керуванням Plugin
- `opencode` і `opencode-go`: метадані capability під керуванням Plugin плюс
  очищення thought-signature проксійованого Gemini
- `alibaba`: каталог генерації відео під керуванням Plugin для прямих посилань на моделі Wan,
  таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги під керуванням Plugin плюс вбудована реєстрація провайдера генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: вбудована реєстрація провайдера генерації відео для розміщених сторонніх
  моделей, реєстрація провайдера генерації зображень для моделей FLUX плюс вбудована
  реєстрація провайдера генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги під керуванням Plugin
- `qwen`: каталоги під керуванням Plugin для текстових моделей плюс спільні
  реєстрації провайдерів media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відеоendpoint-и DashScope з
  вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація провайдера генерації відео під керуванням Plugin для нативних
  моделей на основі завдань Runway, таких як `gen4.5`
- `minimax`: каталоги під керуванням Plugin, вбудована реєстрація провайдера генерації відео
  для моделей Hailuo, вбудована реєстрація провайдера генерації зображень
  для `image-01`, вибір політики replay гібридного Anthropic/OpenAI та логіка auth/snapshot usage
- `together`: каталоги під керуванням Plugin плюс вбудована реєстрація провайдера генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги під керуванням Plugin плюс логіка auth/snapshot usage

Вбудований Plugin `openai` тепер володіє обома ідентифікаторами провайдера: `openai` і
`openai-codex`.

Це охоплює провайдерів, які все ще вписуються у звичайні transport OpenClaw. Провайдер,
якому потрібен повністю користувацький виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію провайдерів для вибраних провайдерів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для провайдерів Google також включено `GOOGLE_API_KEY` як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на обмеження швидкості
  (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт usage).
- Збої, не пов’язані з обмеженням швидкості, завершуються негайно; ротація ключів не виконується.
- Коли всі можливі ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих провайдерів **не потрібна**
конфігурація `models.providers`; достатньо налаштувати auth і вибрати модель.

### OpenAI

- Провайдер: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, потім резервний SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму зіставляють запити `openai/*` Responses з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не до
  загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки кешу prompt і
  формування payload сумісності reasoning OpenAI; проксійовані маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark вважається лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком з auth через API-ключ і OAuth, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з `service_tier` Anthropic (`auto` vs `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic і далі доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Провайдер: `openai-codex`
- Auth: OAuth (ChatGPT)
- Приклад моделі: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий transport — `auto` (спочатку WebSocket, потім резервний SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex до
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий спільний перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і типові під час виконання `contextTokens = 272000`; перевизначайте фактичне обмеження під час виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex офіційно підтримується для зовнішніх інструментів/процесів на кшталт OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Інші розміщені варіанти в підписковому стилі

- [Qwen Cloud](/uk/providers/qwen): поверхня провайдера Qwen Cloud плюс зіставлення endpoint-ів Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API-ключ MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API endpoint-и

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер середовища виконання Zen: `opencode`
- Провайдер середовища виконання Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Провайдер: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для провайдера
  дескриптора `cachedContents/...`; потрапляння в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте неважливий обліковий запис, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях auth на хості Gateway.
  - Якщо запити не працюють після входу, встановіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; usage резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклад моделі: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Провайдер: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live
  виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  під час виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Див. [/providers/kilocode](/uk/providers/kilocode) для подробиць налаштування.

### Інші вбудовані провайдерські Plugin

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді, коли
  запит справді спрямований на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter залишається на OpenAI-сумісному шляху у стилі проксі, тому нативне
  формування запитів, притаманне лише OpenAI (`serviceTier`, Responses `store`,
  підказки кешу prompt, payload сумісності reasoning OpenAI), не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише очищення thought-signature для проксійованого Gemini;
  нативна перевірка replay Gemini та переписування bootstrap залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях очищення
  thought-signature для проксійованого Gemini; `kilocode/kilo/auto` та інші підказки,
  де reasoning проксі не підтримується, пропускають впровадження reasoning через проксі
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування онбордингу/API-ключа MiniMax записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог провайдера зберігає chat-посилання
  лише текстовими, доки не буде матеріалізовано конфігурацію цього провайдера
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Приклад моделі: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` або `KIMICODE_API_KEY`)
- Приклад моделі: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Приклад моделі: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` або `DASHSCOPE_API_KEY`)
- Приклад моделі: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Приклад моделі: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Приклад моделі: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Приклад моделі: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Приклад моделі: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Приклад моделі: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Приклад моделі: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Нативні вбудовані запити xAI використовують шлях xAI Responses
  - `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнено; встановіть
    `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM на Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Провайдери через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власні** провайдери або
OpenAI/Anthropic‑сумісні проксі.

Багато з наведених нижче вбудованих провайдерських Plugin уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований провайдерський Plugin. Типово використовуйте вбудований провайдер,
а явний запис `models.providers.moonshot` додавайте лише тоді, коли потрібно перевизначити base URL або метадані моделі:

- Провайдер: `moonshot`
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

Kimi Coding використовує Anthropic-сумісний endpoint Moonshot AI:

- Провайдер: `kimi`
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

Застарілий ідентифікатор моделі `kimi/k2p5` і надалі приймається для сумісності.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Провайдер: `volcengine` (coding: `volcengine-plan`)
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

Онбординг типово використовує coding-поверхню, але загальний каталог `volcengine/*`
реєструється одночасно.

У засобах вибору моделей для онбордингу/налаштування вибір auth Volcengine надає перевагу обом
рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах провайдера.

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

- Провайдер: `byteplus` (coding: `byteplus-plan`)
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

Онбординг типово використовує coding-поверхню, але загальний каталог `byteplus/*`
реєструється одночасно.

У засобах вибору моделей для онбордингу/налаштування вибір auth BytePlus надає перевагу обом
рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах провайдера.

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

Synthetic надає Anthropic-сумісні моделі через провайдер `synthetic`:

- Провайдер: `synthetic`
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

MiniMax налаштовується через `models.providers`, оскільки використовує власні endpoint-и:

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальний): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax) для подробиць налаштування, варіантів моделей і фрагментів конфігурації.

На Anthropic-сумісному шляху потокової передачі MiniMax OpenClaw вимикає thinking
типово, якщо ви явно його не встановите, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ capability під керуванням Plugin:

- Типові значення тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01` під керуванням Plugin на обох auth-шляхах MiniMax
- Вебпошук залишається на ідентифікаторі провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований провайдерський Plugin, який використовує нативний API:

- Провайдер: `lmstudio`
- Auth: `LM_API_TOKEN`
- Типовий base URL для inference: `http://localhost:1234/v1`

Потім установіть модель (замініть на один з ідентифікаторів, повернутих `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio
для виявлення + автозавантаження, а `/v1/chat/completions` — типово для inference.
Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування та усунення несправностей.

### Ollama

Ollama постачається як вбудований провайдерський Plugin і використовує нативний API Ollama:

- Провайдер: `ollama`
- Auth: не потрібна (локальний сервер)
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте її через
`OLLAMA_API_KEY`, а вбудований провайдерський Plugin додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделей. Див. [/providers/ollama](/uk/providers/ollama)
для онбордингу, хмарного/локального режиму та користувацької конфігурації.

### vLLM

vLLM постачається як вбудований провайдерський Plugin для локальних/self-hosted OpenAI-сумісних
серверів:

- Провайдер: `vllm`
- Auth: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб явно ввімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім установіть модель (замініть на один з ідентифікаторів, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Докладніше див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований провайдерський Plugin для швидких self-hosted
OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Auth: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб явно ввімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім установіть модель (замініть на один з ідентифікаторів, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Докладніше див. у [/providers/sglang](/uk/providers/sglang).

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

- Для користувацьких провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх пропущено, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають лімітам вашого проксі/моделі.
- Для `api: "openai-completions"` на не-нативних endpoint-ах (будь-який непорожній `baseUrl`, чий хост не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникати помилок провайдера 400 для непідтримуваних ролей `developer`.
- Маршрути OpenAI-сумісного типу через проксі також пропускають нативне формування
  запитів, притаманне лише OpenAI: без `service_tier`, без `store` Responses, без підказок кешу prompt, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/пропущений, OpenClaw зберігає типову поведінку OpenAI (яка веде до `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на не-нативних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язані сторінки

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — посібники з налаштування для кожного провайдера
