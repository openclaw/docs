---
read_when:
    - Вам потрібен довідник з налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-22T03:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не чат-канали на кшталт WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви встановите `agents.defaults.models`, це стане списком дозволених значень.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила середовища виконання, cooldown-перевірки та збереження перевизначень сесії
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження середовища виконання.
- Плагіни постачальників можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні перевірки автентифікації на основі env
  та варіанти постачальників не потребували завантаження середовища виконання плагіна. Залишкова карта env-змінних у ядрі тепер
  використовується лише для неплагінових/вбудованих постачальників і кількох випадків загального пріоритету, таких
  як онбординг Anthropic із пріоритетом API-ключа.
- Плагіни постачальників також можуть володіти поведінкою середовища виконання постачальника через
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
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, і
  `onModelSelected`.
- Примітка: runtime `capabilities` постачальника — це спільні метадані раннера (сімейство постачальника,
  особливості стенограми/інструментів, підказки щодо транспорту/кешу). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстовий inference, мовлення тощо).
- Вбудований постачальник `codex` поєднано з вбудованим агентним harness Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні вхід, виявлення моделей, нативне відновлення потоку та виконання app-server, якими керує Codex.
  Звичайні посилання `openai/gpt-*` і надалі використовують постачальника OpenAI та звичайний транспорт постачальника OpenClaw.
  Розгортання лише з Codex можуть вимкнути автоматичний резервний перехід на PI за допомогою
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Codex Harness](/uk/plugins/codex-harness).

## Поведінка постачальника, якою володіє Plugin

Тепер плагіни постачальників можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками списку дозволених значень для онбордингу та записами налаштування в онбордингу/виборі моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview id моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним збиранням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  а потім інші плагіни постачальників, що підтримують цей хук, доки один із них справді не змінить
  транспорт
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  її використанням середовищем виконання; OpenClaw спочатку перевіряє відповідного постачальника, а потім інші
  плагіни постачальників, що підтримують цей хук, доки один із них справді не змінить конфігурацію. Якщо жоден
  хук постачальника не перепише конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує сумісні переписування нативного streaming usage для постачальників конфігурації, що залежать від endpoint
- `resolveConfigApiKey`: постачальник визначає автентифікацію env-marker для постачальників конфігурації
  без примусового завантаження повної runtime-автентифікації. `amazon-bedrock` також має тут
  вбудований AWS-резолвер env-marker, хоча runtime-автентифікація Bedrock використовує
  ланцюжок значень за замовчуванням AWS SDK.
- `resolveSyntheticAuth`: постачальник може надавати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені заповнювачі синтетичного профілю
  як нижчі за пріоритетом, ніж автентифікація на основі env/конфігурації
- `resolveDynamicModel`: постачальник приймає id моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібно оновити метадані перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібні переписування транспорту або base URL
- `contributeResolvedModelCompat`: постачальник додає прапори сумісності для своїх
  vendor-моделей, навіть коли вони надходять через інший сумісний транспорт
- `capabilities`: постачальник публікує особливості стенограми/інструментів/сімейства постачальника
- `normalizeToolSchemas`: постачальник очищає схеми інструментів до того, як вбудований
  раннер їх побачить
- `inspectToolSchemas`: постачальник показує специфічні для транспорту попередження щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: постачальник обирає нативні чи позначені тегами
  контракти виводу reasoning
- `prepareExtraParams`: постачальник встановлює типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях stream повністю
  кастомним транспортом
- `wrapStreamFn`: постачальник застосовує обгортки сумісності заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: постачальник надає нативні заголовки або метадані
  транспорту для кожного ходу
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки сесії WebSocket
  або політику cooldown сесії
- `createEmbeddingProvider`: постачальник володіє поведінкою embedding для пам’яті, коли вона
  належить до плагіна постачальника, а не до вбудованого комутатора embedding
- `formatApiKey`: постачальник форматує збережені профілі автентифікації в runtime-рядок
  `apiKey`, який очікує транспорт
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних засобів оновлення `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: постачальник додає вказівки з виправлення, коли оновлення OAuth
  завершується невдачею
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення context window, які пропустили б загальні евристики
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки транспорту/API
  з причинами failover, такими як rate limit або перевантаження
- `isCacheTtlEligible`: постачальник визначає, які id моделей вищого рівня підтримують TTL prompt-cache
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки та може повертати
  помилку, що належить vendor, для збоїв прямого визначення
- `augmentModelCatalog`: постачальник додає синтетичні/фінальні рядки каталогу після
  виявлення та об’єднання конфігурації
- `resolveThinkingProfile`: постачальник володіє точним набором рівнів `/think`,
  необов’язковими мітками відображення та рівнем за замовчуванням для вибраної моделі
- `isBinaryThinking`: хук сумісності для бінарного UX thinking увімк./вимк.
- `supportsXHighThinking`: хук сумісності для вибраних моделей `xhigh`
- `resolveDefaultThinkingLevel`: хук сумісності для політики `/think` за замовчуванням
- `applyConfigDefaults`: постачальник застосовує глобальні значення за замовчуванням, специфічні для постачальника,
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням бажаних моделей для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткоживучий
  runtime-токен
- `resolveUsageAuth`: постачальник визначає облікові дані usage/quota для `/usage`
  та пов’язаних поверхонь стану/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/розбором endpoint usage, тоді як
  ядро й надалі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні ефекти після вибору моделі, такі як
  телеметрія або керування сесією, що належить постачальнику

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання
  endpoint usage, метадані cache-TTL/сімейства постачальника та глобальні
  значення конфігурації за замовчуванням, що враховують автентифікацію
- `amazon-bedrock`: відповідність переповнення контексту та класифікація
  причин failover для специфічних для Bedrock помилок throttle/not-ready, плюс
  спільне сімейство повторів `anthropic-by-model` для захисту replay-policy
  лише для Claude на трафіку Anthropic
- `anthropic-vertex`: захист replay-policy лише для Claude на Anthropic-message
  трафіку
- `openrouter`: наскрізні id моделей, обгортки запитів, підказки щодо можливостей постачальника,
  очищення thought-signature Gemini на проксійованому трафіку Gemini,
  ін’єкція reasoning для проксі через сімейство stream `openrouter-thinking`,
  пересилання метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід через пристрій, резервна сумісність моделей уперед,
  підказки стенограми для Claude-thinking, обмін runtime-токенами та отримання endpoint usage
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація транспорту OpenAI,
  підказки щодо відсутньої автентифікації з урахуванням Codex, придушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація
  псевдонімів токенів usage (`input` / `output` і сімейства `prompt` / `completion`), спільне
  сімейство stream `openai-responses-defaults` для нативних обгорток OpenAI/Codex,
  метадані сімейства постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-2` і реєстрація вбудованого постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервна сумісність уперед для Gemini 3.1,
  нативна перевірка replay Gemini, очищення bootstrap replay, режим
  виводу reasoning з тегами, зіставлення сучасних моделей, реєстрація вбудованого постачальника генерації зображень
  для моделей Gemini image-preview і реєстрація вбудованого
  постачальника генерації відео для моделей Veo; Gemini CLI OAuth також
  володіє форматуванням токенів профілю автентифікації, розбором токенів usage і отриманням
  endpoint quota для поверхонь usage
- `moonshot`: спільний транспорт, нормалізація payload thinking, якою володіє Plugin
- `kilocode`: спільний транспорт, заголовки запитів, якими володіє Plugin, нормалізація payload reasoning,
  очищення thought-signature proxy-Gemini та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, значення за замовчуванням `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model та автентифікація usage + отримання quota;
  невідомі id `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація транспорту Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, стандартний `tool_stream`, очищення схем інструментів /
  payload reasoning, специфічне для xAI, та реєстрація вбудованого постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, якими володіє Plugin
- `opencode` і `opencode-go`: метадані можливостей, якими володіє Plugin, плюс
  очищення thought-signature proxy-Gemini
- `alibaba`: каталог генерації відео, яким володіє Plugin, для прямих посилань на моделі Wan
  на кшталт `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, якими володіє Plugin, плюс реєстрація вбудованого постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого постачальника генерації відео для розміщених сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей зображень FLUX плюс реєстрація вбудованого
  постачальника генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, якими володіє Plugin
- `qwen`: каталоги текстових моделей, якими володіє Plugin, плюс спільні
  реєстрації постачальників для мультимодальних поверхонь, пов’язаних із розумінням медіа та генерацією відео; генерація відео Qwen використовує стандартні відеоendpoint-и DashScope зі
  вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, якою володіє Plugin, для нативних
  моделей Runway на основі задач, таких як `gen4.5`
- `minimax`: каталоги, якими володіє Plugin, реєстрація вбудованого постачальника генерації відео
  для відеомоделей Hailuo, реєстрація вбудованого постачальника генерації зображень
  для `image-01`, вибір hybrid Anthropic/OpenAI replay-policy та логіка
  usage auth/snapshot
- `together`: каталоги, якими володіє Plugin, плюс реєстрація вбудованого постачальника генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, якими володіє Plugin, плюс логіка usage auth/snapshot

Вбудований плагін `openai` тепер володіє обома id постачальників: `openai` і
`openai-codex`.

Це охоплює постачальників, які все ще вписуються у звичайні транспорти OpenClaw. Постачальник,
якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список, розділений комами або крапками з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit
  responses (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт usage).
- Збої, не пов’язані з rate-limit, завершуються негайно; ротація ключів не виконується.
- Коли всі можливі ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна**
конфігурація `models.providers`; просто налаштуйте автентифікацію та виберіть модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервний SSE)
- Перевизначення для кожної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів OpenAI Responses WebSocket за замовчуванням увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до
  загальних проксі, сумісних з OpenAI
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки prompt-cache та
  формування payload для сумісності reasoning OpenAI; проксі-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно придушено в OpenClaw, оскільки live OpenAI API його відхиляє; Spark вважається лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема трафік з автентифікацією через API-ключ і OAuth, надісланий на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Токен налаштування Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Постачальник: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Приклад моделі: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервний SSE)
- Перевизначення для кожної моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних проксі, сумісних з OpenAI
- Спільно використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступним, коли каталог OAuth Codex його надає; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і стандартні runtime `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів на кшталт OpenClaw.

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

### Інші розміщені варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud плюс зіставлення endpoint-ів Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): OAuth або доступ за API-ключем для MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API endpoint-и

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
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
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; cache hits Gemini відображаються як `cacheRead` OpenClaw

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний OAuth-потік
- Застереження: Gemini CLI OAuth в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- Gemini CLI OAuth постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: ви **не** вставляєте client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості Gateway.
  - Якщо після входу запити не працюють, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; usage резервно береться з
    `stats`, при цьому `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live
  виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime
  каталог.
- Точна маршрутизація на upstream за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклади моделей: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді, коли
  запит справді спрямовано на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter залишається на проксі-шляху у стилі OpenAI-compatible, тому нативне
  формування запитів лише для OpenAI (`serviceTier`, Responses `store`,
  підказки prompt-cache, payload-и сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише очищення thought-signature proxy-Gemini;
  нативна перевірка replay Gemini і переписування bootstrap залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях очищення thought-signature
  proxy-Gemini; `kilocode/kilo/auto` та інші підказки, де proxy-reasoning не підтримується,
  пропускають ін’єкцію proxy reasoning
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування MiniMax через онбординг/API-ключ записує явні визначення моделі M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає чат-посилання
  лише текстовими, доки ця конфігурація постачальника не буде матеріалізована
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
- Приклади моделей: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
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
  - `/fast` або `params.fastMode: true` переписують `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` увімкнено за замовчуванням; установіть
    `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM у Cerebras використовують id `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (кастомний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **кастомних** постачальників або
проксі, сумісні з OpenAI/Anthropic.

Багато вбудованих плагінів постачальників нижче вже публікують каталог за замовчуванням.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
base URL, заголовки або список моделей за замовчуванням.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
за замовчуванням і додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
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

### Kimi Coding

Kimi Coding використовує endpoint Moonshot AI, сумісний з Anthropic:

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

Застарілий `kimi/k2p5` і далі приймається як сумісний id моделі.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Постачальник: `volcengine` (coding: `volcengine-plan`)
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

Під час онбордингу за замовчуванням вибирається coding-поверхня, але загальний каталог `volcengine/*`
реєструється одночасно.

У засобах вибору моделі onboarding/configure варіант автентифікації Volcengine надає перевагу як
рядкам `volcengine/*`, так і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах постачальника.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Моделі для coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (міжнародний)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Постачальник: `byteplus` (coding: `byteplus-plan`)
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

Під час онбордингу за замовчуванням вибирається coding-поверхня, але загальний каталог `byteplus/*`
реєструється одночасно.

У засобах вибору моделі onboarding/configure варіант автентифікації BytePlus надає перевагу як
рядкам `byteplus/*`, так і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах постачальника.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Моделі для coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic надає моделі, сумісні з Anthropic, через постачальника `synthetic`:

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

MiniMax налаштовується через `models.providers`, оскільки використовує кастомні endpoint-и:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (Global): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному streaming-шляху MiniMax OpenClaw вимикає thinking за
замовчуванням, якщо ви явно його не встановите, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, якими володіє Plugin:

- Типові значення для тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розпізнавання зображень — це `MiniMax-VL-01`, яким володіє Plugin, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на id постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований плагін постачальника, який використовує нативний API:

- Постачальник: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Base URL inference за замовчуванням: `http://localhost:1234/v1`

Потім установіть модель (замініть на один з ID, повернутих `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio
для виявлення + автозавантаження, а `/v1/chat/completions` — для inference за замовчуванням.
Деталі налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований плагін постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
- Автентифікація: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Установлення: [https://ollama.com/download](https://ollama.com/download)

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

Ollama локально виявляється за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, cloud/local режиму та кастомної конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted серверів,
сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб локально ввімкнути автовиявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім установіть модель (замініть на один з ID, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted серверів,
сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб локально ввімкнути автовиявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім установіть модель (замініть на один з ID, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

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

- Для кастомних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх опущено, OpenClaw за замовчуванням використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: установлюйте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних endpoint-ах (будь-який непорожній `baseUrl`, чий host не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 для непідтримуваних ролей `developer`.
- Проксі-маршрути у стилі OpenAI-compatible також пропускають нативне
  формування запитів лише для OpenAI: без `service_tier`, без Responses `store`, без підказок prompt-cache, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків
  атрибуції OpenClaw.
- Якщо `baseUrl` порожній/пропущений, OpenClaw зберігає типову поведінку OpenAI (яка вказує на `api.openai.com`).
- Для безпеки явний `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — посібники з налаштування для кожного постачальника
