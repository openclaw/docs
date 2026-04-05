---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд CLI для онбордингу постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій і потоків CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-05T23:54:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e4b82e07221018a723279d309e245bb4023bc06e64b3c910ef2cae3dfa2599
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає списком дозволених значень.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Правила резервного перемикання під час виконання, перевірки стану після cooldown і збереження перевизначень сесії
  задокументовано в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження під час виконання.
- Плагіни постачальників можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars`, щоб загальним перевіркам
  автентифікації через змінні середовища не потрібно було завантажувати код плагіна під час виконання. Решта мапи змінних середовища в core
  тепер призначена лише для неплагінових/core постачальників і кількох випадків
  загального пріоритету, як-от онбординг Anthropic зі сценарієм «спочатку API-ключ».
- Плагіни постачальників також можуть керувати поведінкою постачальника під час виконання через
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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`.
- Примітка: `capabilities` постачальника під час виконання — це спільні метадані runner-а (сімейство постачальника, особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що саме реєструє плагін (текстовий inference, speech тощо).

## Поведінка постачальника, якою володіє плагін

Плагіни постачальників тепер можуть керувати більшістю логіки, специфічної для постачальника, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник керує потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник керує мітками вибору автентифікації,
  застарілими псевдонімами, підказками щодо allowlist під час онбордингу та записами налаштування у вибірниках онбордингу/моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує transport-family `api` / `baseUrl`
  перед загальним збиранням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників, здатні виконувати цей hook, доки один із них справді не змінить
  transport
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  використанням під час виконання; OpenClaw спочатку перевіряє відповідного постачальника, потім інші
  плагіни постачальників, здатні виконувати цей hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook постачальника не переписує конфігурацію, вбудовані допоміжні засоби для сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує переписування сумісності для нативного streaming-usage, зумовлене endpoint, для конфігурованих постачальників
- `resolveConfigApiKey`: постачальник визначає автентифікацію через env-marker для конфігурованих постачальників
  без примусового повного завантаження runtime-автентифікації. `amazon-bedrock` також має тут
  вбудований resolver AWS env-marker, хоча runtime-автентифікація Bedrock використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: постачальник може повідомляти про доступність локальної/self-hosted або іншої
  автентифікації, що базується на конфігурації, без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені синтетичні заповнювачі профілю
  як менш пріоритетні, ніж автентифікація через env/config
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібні переписування transport або base URL
- `contributeResolvedModelCompat`: постачальник додає прапорці сумісності для своїх
  моделей постачальника, навіть коли вони надходять через інший сумісний transport
- `capabilities`: постачальник публікує особливості transcript/tooling/provider-family
- `normalizeToolSchemas`: постачальник очищує схеми інструментів перед тим, як вбудований
  runner їх побачить
- `inspectToolSchemas`: постачальник показує транспортно-специфічні попередження щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: постачальник обирає нативні або теговані
  контракти reasoning-output
- `prepareExtraParams`: постачальник задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях stream повністю
  користувацьким transport
- `wrapStreamFn`: постачальник застосовує обгортки сумісності для заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: постачальник надає нативні заголовки transport або метадані
  для кожного turn
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки сесії WebSocket
  або політику cooldown сесії
- `createEmbeddingProvider`: постачальник керує поведінкою embedding для пам’яті, коли вона
  належить плагіну постачальника, а не core-перемикачу embedding
- `formatApiKey`: постачальник форматує збережені профілі автентифікації в runtime-рядок
  `apiKey`, який очікує transport
- `refreshOAuth`: постачальник керує оновленням OAuth, коли спільних
  refresher-ів `pi-ai` недостатньо
- `buildAuthDoctorHint`: постачальник додає підказку щодо виправлення, коли оновлення OAuth
  завершується помилкою
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення контекстного вікна, які загальні евристики не виявляють
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки transport/API
  із причинами резервного перемикання, наприклад обмеження швидкості або перевантаження
- `isCacheTtlEligible`: постачальник визначає, які upstream-ідентифікатори моделей підтримують TTL кешу prompt
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку щодо відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки й може повертати
  помилку від постачальника у разі збоїв прямого визначення
- `augmentModelCatalog`: постачальник додає синтетичні/фінальні рядки каталогу після
  виявлення та злиття конфігурації
- `isBinaryThinking`: постачальник керує UX двійкового thinking увімк./вимк.
- `supportsXHighThinking`: постачальник додає вибраним моделям підтримку `xhigh`
- `resolveDefaultThinkingLevel`: постачальник керує типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує специфічні для постачальника глобальні значення за замовчуванням
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник керує зіставленням пріоритетних моделей для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткочасний
  runtime-токен
- `resolveUsageAuth`: постачальник визначає облікові дані usage/quota для `/usage`
  і пов’язаних поверхонь status/reporting
- `fetchUsageSnapshot`: постачальник керує отриманням/парсингом endpoint usage, тоді як
  core усе ще керує оболонкою зведення та форматуванням
- `onModelSelected`: постачальник виконує побічні ефекти після вибору моделі, наприклад
  телеметрію або ведення сесії, що належить постачальнику

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки щодо ремонту автентифікації, отримання
  endpoint usage, метадані cache-TTL/provider-family та глобальні
  значення конфігурації за замовчуванням, що враховують автентифікацію
- `amazon-bedrock`: визначення переповнення контексту й класифікація
  причин failover для специфічних помилок Bedrock про throttle/not-ready, а також
  спільне сімейство повторного програвання `anthropic-by-model` для захистів політики replay лише для Claude
  на трафіку Anthropic
- `anthropic-vertex`: захисти політики replay лише для Claude на Anthropic-message
  трафіку
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки щодо
  можливостей постачальника, очищення thought-signature Gemini на проксійованому Gemini-трафіку,
  впровадження reasoning для proxy через сімейство stream `openrouter-thinking`,
  передавання метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід із пристрою, резервна сумісність моделей уперед,
  підказки щодо transcript для Claude-thinking, обмін runtime-токенів і отримання endpoint
  usage
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація transport OpenAI,
  підказки про відсутню автентифікацію з урахуванням Codex, приглушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів usage-token
  (`input` / `output` і сімейства `prompt` / `completion`), спільне сімейство stream `openai-responses-defaults` для нативних
  обгорток OpenAI/Codex, метадані сімейства постачальника, реєстрація
  вбудованого постачальника генерації зображень для `gpt-image-1` і вбудованого постачальника
  генерації відео для `sora-2`
- `google`: резервна сумісність уперед для Gemini 3.1, нативна перевірка replay Gemini,
  очищення bootstrap replay, режим тегованого reasoning-output,
  зіставлення modern-model, реєстрація вбудованого постачальника генерації зображень для
  Gemini image-preview models і вбудованого постачальника генерації відео
  для моделей Veo
- `moonshot`: спільний transport, нормалізація payload thinking, якою володіє плагін
- `kilocode`: спільний transport, заголовки запитів, якими володіє плагін, нормалізація payload reasoning,
  очищення thought-signature для proxy-Gemini та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, значення `tool_stream` за замовчуванням, cache-TTL
  policy, binary-thinking/live-model policy, а також usage auth + отримання квот;
  невідомі ідентифікатори `glm-5*` синтезуються на основі вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація transport Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, очищення схем інструментів /
  payload reasoning, специфічне для xAI, і реєстрація вбудованого постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, якими володіє плагін
- `opencode` і `opencode-go`: метадані можливостей, якими володіє плагін, плюс
  очищення thought-signature для proxy-Gemini
- `alibaba`: каталог генерації відео, яким володіє плагін, для прямих посилань на моделі Wan
  таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, якими володіє плагін, плюс реєстрація вбудованого постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого постачальника генерації відео для розміщених сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей FLUX плюс вбудована
  реєстрація постачальника генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, якими володіє плагін
- `qwen`: каталоги текстових моделей, якими володіє плагін, плюс спільні
  реєстрації постачальників media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відеоendpoint-и DashScope з вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, якою володіє плагін, для нативних
  моделей Runway на основі завдань, таких як `gen4.5`
- `minimax`: каталоги, якими володіє плагін, вбудована реєстрація постачальника генерації відео
  для моделей Hailuo video, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики replay Anthropic/OpenAI,
  а також логіка usage auth/snapshot
- `together`: каталоги, якими володіє плагін, плюс реєстрація вбудованого постачальника генерації відео
  для моделей Wan video
- `xiaomi`: каталоги, якими володіє плагін, плюс логіка usage auth/snapshot

Вбудований плагін `openai` тепер володіє обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які все ще вписуються в звичайні transports OpenClaw. Постачальник,
якому потрібен повністю користувацький виконавець запитів, — це окрема, глибша
поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на обмеження швидкості (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Збої, не пов’язані з обмеженням швидкості, завершуються помилкою одразу; ротація ключів не виконується.
- Коли всі кандидати-ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Ці постачальники **не**
потребують конфігурації `models.providers`; просто налаштуйте автентифікацію й оберіть модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити `openai/*` Responses із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не до
  загальних OpenAI-сумісних proxy
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки кешу prompt і
  формування payload сумісності reasoning OpenAI; proxy-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark розглядається лише як Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим через API-ключ і OAuth, який надсилається на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` або `standard_only`)
- Примітка щодо білінгу: для Anthropic в OpenClaw практичний поділ — це **API key** або **Claude subscription with Extra Usage**. Anthropic повідомив користувачам OpenClaw **4 квітня 2026 року о 12:00 PT / 8:00 PM BST**, що шлях входу Claude через **OpenClaw** вважається використанням через сторонній harness і потребує **Extra Usage**, що тарифікується окремо від підписки. Наші локальні відтворення також показують, що рядок prompt, який ідентифікує OpenClaw, не відтворюється на шляху Anthropic SDK + API key.
- Setup-токен Anthropic знову доступний як застарілий/ручний шлях OpenClaw. Використовуйте його з урахуванням того, що Anthropic повідомив користувачам OpenClaw, що цей шлях потребує **Extra Usage**.

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
- Transport за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних proxy
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли її надає каталог Codex OAuth; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і типове runtime-значення `contextTokens = 272000`; перевизначте runtime-ліміт через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex явно підтримується для зовнішніх інструментів/потоків роботи, таких як OpenClaw.

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

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud плюс зіставлення endpoint Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): OAuth або доступ за API key для MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API endpoint-и

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник Zen runtime: `opencode`
- Постачальник Go runtime: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; збіги кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex

- Постачальник: `google-vertex`
- Автентифікація: gcloud ADC
  - JSON-відповіді Gemini CLI парсяться з `response`; usage резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклад моделі: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення
  `https://api.kilo.ai/api/gateway/models` може додатково розширювати runtime-каталог.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку лише тоді, коли
  запит справді спрямований на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними proxy URL
- OpenRouter лишається на шляху proxy-стилю OpenAI-compatible, тому специфічне лише для нативного
  OpenAI формування запитів (`serviceTier`, Responses `store`,
  підказки кешу prompt, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на базі Gemini зберігають лише очищення thought-signature для proxy-Gemini;
  нативна перевірка replay Gemini та переписування bootstrap залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на базі Gemini зберігають той самий шлях очищення thought-signature
  для proxy-Gemini; `kilocode/kilo/auto` та інші підказки, які не підтримують proxy-reasoning,
  пропускають упровадження reasoning для proxy
- MiniMax: `minimax` (API key) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування MiniMax через онбординг/API key записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає chat-посилання
  лише для тексту, доки конфігурація цього постачальника не буде матеріалізована
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Приклад моделі: `moonshot/kimi-k2.5`
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
  - `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнений; установіть
    `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM у Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **custom** постачальників або
OpenAI/Anthropic‑сумісні proxy.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
типово, а явний запис `models.providers.moonshot` додавайте лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Ідентифікатори моделей Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding використовує Anthropic-compatible endpoint Moonshot AI:

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

Застарілий `kimi/k2p5` усе ще приймається як ідентифікатор моделі для сумісності.

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

Під час онбордингу типово використовується coding-поверхня, але загальний каталог `volcengine/*`
реєструється одночасно.

У вибірниках моделей онбордингу/налаштування Volcengine варіант автентифікації
віддає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
вибірник, прив’язаний до постачальника.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding-моделі (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK надає доступ до тих самих моделей, що й Volcano Engine, для міжнародних користувачів.

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

Під час онбордингу типово використовується coding-поверхня, але загальний каталог `byteplus/*`
реєструється одночасно.

У вибірниках моделей онбордингу/налаштування варіант автентифікації BytePlus віддає перевагу як
рядкам `byteplus/*`, так і `byteplus-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
вибірник, прив’язаний до постачальника.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding-моделі (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic надає Anthropic-compatible моделі через постачальника `synthetic`:

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

MiniMax налаштовується через `models.providers`, оскільки використовує custom endpoint-и:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-compatible streaming-шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не вкажете, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, якими володіє плагін:

- Типові значення для тексту/chat лишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, яким володіє плагін, на обох шляхах автентифікації MiniMax
- Вебпошук лишається на ідентифікаторі постачальника `minimax`

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

Ollama локально виявляється за адресою `http://127.0.0.1:11434`, коли ви ввімкнули її через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і вибірника моделей. Див. [/providers/ollama](/uk/providers/ollama)
для онбордингу, режиму cloud/local і custom-конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

### Локальні proxy (LM Studio, vLLM, LiteLLM тощо)

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
        apiKey: "LMSTUDIO_KEY",
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

- Для custom-постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх пропущено, OpenClaw використовує такі типові значення:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, які відповідають лімітам вашого proxy/моделі.
- Для `api: "openai-completions"` на ненативних endpoint-ах (будь-який непорожній `baseUrl`, у якого host не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникати помилок 400 від постачальника для непідтримуваних ролей `developer`.
- Маршрути OpenAI-compatible у стилі proxy також пропускають специфічне лише для нативного OpenAI
  формування запиту: без `service_tier`, без `store` у Responses, без підказок кешу prompt, без
  формування payload сумісності reasoning OpenAI та без прихованих заголовків атрибуції
  OpenClaw.
- Якщо `baseUrl` порожній/пропущений, OpenClaw зберігає типову поведінку OpenAI (яка зіставляється з `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — інструкції з налаштування для кожного постачальника
