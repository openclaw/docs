---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команд CLI для онбордингу постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій і потоків CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-06T15:29:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9c1f7f8cf09b6047a64189f7440811aafc93d01335f76969afd387cc54c7ab5
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей дивіться в [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задасте `agents.defaults.models`, це стане allowlist.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Правила резервного переходу під час виконання, перевірки під час cooldown і збереження перевизначень сесії
  задокументовано в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження під час виконання.
- Плагіни постачальників можуть додавати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об'єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars`, щоб
  загальним перевіркам автентифікації на основі змінних середовища не потрібно було завантажувати runtime плагіна. Решта мапи змінних середовища в core
  тепер використовується лише для неплагінних/core постачальників і кількох випадків
  загального пріоритету, наприклад онбордингу Anthropic із пріоритетом API-ключа.
- Плагіни постачальників також можуть володіти поведінкою runtime постачальника через
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, і
  `onModelSelected`.
- Примітка: runtime `capabilities` постачальника — це спільні метадані раннера (сімейство постачальника,
  особливості transcript/tooling, підказки для transport/cache). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстовий inference, мовлення тощо).

## Поведінка постачальника, якою володіє плагін

Тепер плагіни постачальників можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий поділ:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками
  онбордингу/входу для `openclaw onboard`, `openclaw models auth` і headless налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками allowlist для онбордингу та записами налаштування в пікерах онбордингу/моделей
- `catalog`: постачальник з'являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview id моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства transport
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників із підтримкою hook, доки один із них справді не змінить
  transport
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  її використанням у runtime; OpenClaw спочатку перевіряє відповідного постачальника, потім інші
  плагіни постачальників із підтримкою hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook постачальника не перепише конфігурацію, вбудовані допоміжні засоби сімейства Google
  усе одно нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує сумісні переписування usage нативного streaming на основі endpoint для конфігурованих постачальників
- `resolveConfigApiKey`: постачальник визначає автентифікацію через маркер змінної середовища для конфігурованих постачальників
  без примусового завантаження повної runtime-автентифікації. `amazon-bedrock` також має
  тут вбудований резолвер маркерів змінних середовища AWS, хоча runtime-автентифікація Bedrock використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: постачальник може повідомляти про доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження секретів у відкритому вигляді
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені synthetic profile
  placeholders як менш пріоритетні, ніж автентифікація на основі env/config
- `resolveDynamicModel`: постачальник приймає id моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного визначення моделі
- `normalizeResolvedModel`: постачальнику потрібні переписування transport або базового URL
- `contributeResolvedModelCompat`: постачальник додає прапорці сумісності для своїх
  моделей постачальника, навіть коли вони надходять через інший сумісний transport
- `capabilities`: постачальник публікує особливості transcript/tooling/provider-family
- `normalizeToolSchemas`: постачальник очищує схеми інструментів перед тим, як вбудований
  раннер їх побачить
- `inspectToolSchemas`: постачальник показує попередження про схеми, специфічні для transport,
  після нормалізації
- `resolveReasoningOutputMode`: постачальник обирає нативні чи позначені тегами
  контракти виводу reasoning
- `prepareExtraParams`: постачальник задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях stream повністю
  власним transport
- `wrapStreamFn`: постачальник застосовує обгортки сумісності до заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: постачальник надає нативні заголовки transport або метадані
  для кожного ходу
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки WebSocket-сеансу
  або політику cooldown сеансу
- `createEmbeddingProvider`: постачальник володіє поведінкою embedding для пам'яті, коли вона
  належить плагіну постачальника, а не комутатору embedding у core
- `formatApiKey`: постачальник форматує збережені профілі автентифікації у runtime-рядок
  `apiKey`, якого очікує transport
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних засобів оновлення `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: постачальник додає рекомендації щодо виправлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення context window, які загальні евристики не помітять
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки transport/API
  з причинами резервного переходу, такими як ліміт швидкості або перевантаження
- `isCacheTtlEligible`: постачальник визначає, які id моделей вище за потоком підтримують prompt-cache TTL
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі рядки вище за потоком і може повертати
  помилку постачальника для прямих збоїв визначення
- `augmentModelCatalog`: постачальник додає synthetic/final рядки каталогу після
  виявлення та об'єднання конфігурації
- `isBinaryThinking`: постачальник володіє UX двійкового вмикання/вимикання thinking
- `supportsXHighThinking`: постачальник додає вибраним моделям підтримку `xhigh`
- `resolveDefaultThinkingLevel`: постачальник володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує глобальні типові значення, специфічні для постачальника,
  під час матеріалізації конфігурації залежно від режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням бажаних live/smoke моделей
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткочасний
  runtime-токен
- `resolveUsageAuth`: постачальник визначає облікові дані для usage/quota для `/usage`
  і пов'язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/парсингом endpoint usage, тоді як
  core усе ще володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник запускає побічні ефекти після вибору моделі, як-от
  телеметрія або ведення сеансу, яким володіє постачальник

Поточні вбудовані приклади:

- `anthropic`: резервний механізм прямої сумісності вперед для Claude 4.6, підказки з ремонту автентифікації, отримання
  endpoint usage, метадані cache-TTL/provider-family та глобальні
  типові значення конфігурації, що враховують автентифікацію
- `amazon-bedrock`: визначення переповнення контексту та класифікація
  причин резервного переходу для специфічних для Bedrock помилок throttle/not-ready, а також
  спільне сімейство повторного відтворення `anthropic-by-model` для захистів політики повторного відтворення лише для Claude
  у трафіку Anthropic
- `anthropic-vertex`: захисти політики повторного відтворення лише для Claude в Anthropic-message
  трафіку
- `openrouter`: наскрізні id моделей, обгортки запитів, підказки capability постачальника,
  очищення підпису думок Gemini у проксійованому трафіку Gemini,
  ін'єкція reasoning проксі через сімейство stream `openrouter-thinking`,
  пересилання метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід із пристрою, резервний механізм сумісності вперед для моделей,
  підказки transcript thinking для Claude, обмін runtime-токенів і отримання endpoint
  usage
- `openai`: резервний механізм сумісності вперед для GPT-5.4, пряма нормалізація
  transport OpenAI, підказки про відсутню автентифікацію з урахуванням Codex, приглушення Spark, synthetic
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів usage
  (`input` / `output` і сімейства `prompt` / `completion`), спільне сімейство stream `openai-responses-defaults`
  для нативних обгорток OpenAI/Codex, метадані сімейства постачальника, вбудована реєстрація постачальника генерації зображень
  для `gpt-image-1` і вбудована реєстрація постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервний механізм сумісності вперед для Gemini 3.1,
  нативна перевірка повторного відтворення Gemini, очищення bootstrap replay, позначений тегами
  режим виводу reasoning, зіставлення сучасних моделей, вбудована реєстрація постачальника генерації зображень
  для preview-моделей Gemini image і вбудована
  реєстрація постачальника генерації відео для моделей Veo; Gemini CLI OAuth також
  володіє форматуванням токенів профілю автентифікації, парсингом токенів usage та отриманням endpoint квот
  для поверхонь usage
- `moonshot`: спільний transport, нормалізація payload thinking, якою володіє плагін
- `kilocode`: спільний transport, заголовки запитів, якими володіє плагін, нормалізація payload reasoning,
  очищення підпису думок проксійованого Gemini та політика cache-TTL
- `zai`: резервний механізм сумісності вперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model і автентифікація usage + отримання квот;
  невідомі id `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація transport Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, специфічне для xAI очищення схем інструментів /
  payload reasoning і вбудована реєстрація постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані capability, якими володіє плагін
- `opencode` і `opencode-go`: метадані capability, якими володіє плагін, плюс
  очищення підпису думок проксійованого Gemini
- `alibaba`: каталог генерації відео, яким володіє плагін, для прямих посилань на моделі Wan
  на кшталт `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, якими володіє плагін, плюс вбудована реєстрація постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: вбудована реєстрація постачальника генерації відео для розміщеного стороннього
  постачальника генерації зображень для моделей FLUX image плюс вбудована
  реєстрація постачальника генерації відео для розміщених сторонніх моделей відео
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, якими володіє плагін
- `qwen`: каталоги, якими володіє плагін, для текстових моделей плюс спільні
  реєстрації постачальників media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні endpoint відео DashScope
  з вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, якою володіє плагін, для нативних моделей
  на основі задач Runway, таких як `gen4.5`
- `minimax`: каталоги, якими володіє плагін, вбудована реєстрація постачальника генерації відео
  для відеомоделей Hailuo, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики повторного відтворення Anthropic/OpenAI
  і логіка автентифікації usage/знімка
- `together`: каталоги, якими володіє плагін, плюс вбудована реєстрація постачальника генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, якими володіє плагін, плюс логіка автентифікації usage/знімка

Вбудований плагін `openai` тепер володіє обома id постачальників: `openai` і
`openai-codex`.

Це охоплює постачальників, які все ще відповідають звичайним transport OpenClaw. Постачальник,
якому потрібен повністю власний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google також включено `GOOGLE_API_KEY` як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і видаляє дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на повідомлення про ліміт швидкості (for
  example `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про обмеження usage).
- Збої, не пов'язані з лімітом швидкості, завершуються негайно; ротація ключів не виконується.
- Коли всі кандидати на ключі не спрацьовують, повертається остання помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не**
потрібна конфігурація `models.providers`; просто задайте автентифікацію й виберіть модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов'язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання WebSocket OpenAI Responses типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до загальних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки prompt-cache і
  формування payload сумісності reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark розглядається як лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов'язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим через API-ключ і OAuth, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic і далі доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.

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
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і типове runtime `contextTokens = 272000`; перевизначте runtime-ліміт через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/робочих процесів, таких як OpenClaw.

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
- [MiniMax](/uk/providers/minimax): доступ через MiniMax Coding Plan OAuth або API-ключ
- [GLM Models](/uk/providers/glm): кінцеві точки Z.AI Coding Plan або загального API

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник runtime Zen: `opencode`
- Постачальник runtime Go: `opencode-go`
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
- Необов'язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; збіги кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: Gemini CLI OAuth у OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- Gemini CLI OAuth постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3.1-pro-preview`
  - Примітка: ви **не** вставляєте client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості gateway.
  - Якщо запити не працюють після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway.
  - JSON-відповіді Gemini CLI парсяться з `response`; usage резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

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
- Базовий URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live
  виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime
  каталог.
- Точна маршрутизація вище за потоком за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Дивіться [/providers/kilocode](/uk/providers/kilocode) для подробиць налаштування.

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку лише тоді, коли
  запит справді спрямований до `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter і далі залишається на шляху проксі-типу, сумісному з OpenAI, тому нативне
  формування запиту лише для OpenAI (`serviceTier`, Responses `store`,
  підказки prompt-cache, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише очищення підпису думок проксійованого Gemini;
  нативна перевірка повторного відтворення Gemini та переписування bootstrap залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях очищення підпису думок
  проксійованого Gemini; `kilocode/kilo/auto` та інші підказки, що не підтримують proxy reasoning,
  пропускають ін'єкцію reasoning проксі
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Онбординг MiniMax/налаштування API-ключа записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає chat-посилання
  лише текстовими, доки конфігурацію цього постачальника не буде матеріалізовано
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
  - `tool_stream` типово ввімкнено; задайте
    `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM на Cerebras використовують id `zai-glm-4.7` і `zai-glm-4.6`.
  - Базовий URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Дивіться [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (власний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власних** постачальників або
сумісні з OpenAI/Anthropic проксі.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
типово і додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

ID моделей Kimi K2:

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

Kimi Coding використовує сумісний з Anthropic endpoint Moonshot AI:

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

Застарілий `kimi/k2p5` і далі приймається як id моделі для сумісності.

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

Онбординг типово використовує поверхню coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У пікерах онбордингу/налаштування моделі вибір автентифікації Volcengine надає перевагу обом
рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw резервно переходить до нефільтрованого каталогу замість показу порожнього
пікера з областю постачальника.

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

Онбординг типово використовує поверхню coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У пікерах онбордингу/налаштування моделі вибір автентифікації BytePlus надає перевагу обом
рядкам `byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw резервно переходить до нефільтрованого каталогу замість показу порожнього
пікера з областю постачальника.

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

MiniMax налаштовується через `models.providers`, оскільки використовує власні endpoint:

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальний): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Дивіться [/providers/minimax](/uk/providers/minimax) для подробиць налаштування, варіантів моделей і фрагментів конфігурації.

На Anthropic-сумісному шляху streaming MiniMax OpenClaw вимикає thinking
типово, якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ можливостей, якими володіє плагін:

- Типові значення text/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01` на обох шляхах автентифікації MiniMax, яким володіє плагін
- Вебпошук залишається на id постачальника `minimax`

### Ollama

Ollama постачається як вбудований плагін постачальника та використовує нативний API Ollama:

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і пікера моделей. Дивіться [/providers/ollama](/uk/providers/ollama)
для онбордингу, cloud/local режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікацію):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один із ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Дивіться [/providers/vllm](/uk/providers/vllm) для подробиць.

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікацію):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один із ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Дивіться [/providers/sglang](/uk/providers/sglang) для подробиць.

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

- Для власних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов'язкові.
  Якщо їх не вказано, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавати явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних endpoint (будь-який непорожній `baseUrl`, хост якого не `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від постачальника через непідтримувані ролі `developer`.
- Маршрути проксі-типу, сумісні з OpenAI, також пропускають нативне формування запиту лише для OpenAI:
  без `service_tier`, без Responses `store`, без підказок prompt-cache, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції
  OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає типову поведінку OpenAI (яка резолвиться до `api.openai.com`).
- З міркувань безпеки явний `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Дивіться також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов'язані сторінки

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — посібники з налаштування для кожного постачальника
