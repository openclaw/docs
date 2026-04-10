---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команд онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-10T21:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає списком дозволених моделей.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила середовища виконання, перевірки cooldown і збереження перевизначень сеансу
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це власні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження середовища виконання.
- Плагіни постачальників можуть додавати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні перевірки автентифікації на основі env і варіанти постачальників
  не потребували завантаження середовища виконання плагіна. Решта карти env-змінних у ядрі тепер
  призначена лише для неплагінних/базових постачальників і кількох випадків загального пріоритету, таких
  як онбординг Anthropic з пріоритетом API-ключа.
- Плагіни постачальників також можуть володіти поведінкою постачальника в середовищі виконання через
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
- Примітка: `capabilities` постачальника в середовищі виконання — це спільні метадані раннера (сімейство постачальника, особливості стенограми/інструментів, підказки щодо транспорту/кешу). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстова інференція, мовлення тощо).
- Вбудований постачальник `codex` поєднаний із вбудованим агентним harness Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні вхід, пошук моделей, власне
  відновлення потоків і виконання на сервері застосунку, якими володіє Codex. Звичайні посилання `openai/gpt-*` і надалі
  використовують постачальника OpenAI та стандартний транспорт постачальника OpenClaw.
  У розгортаннях лише з Codex можна вимкнути автоматичний резервний перехід до PI за допомогою
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Codex Harness](/uk/plugins/codex-harness).

## Поведінка постачальника під керуванням плагіна

Плагіни постачальників тепер можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл інференції.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками для списку дозволених моделей під час онбордингу та записами налаштування у вибірниках онбордингу/моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників, що підтримують хуки, доки один із них справді не змінить
  транспорт
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  тим, як її використовуватиме середовище виконання; OpenClaw спочатку перевіряє відповідного постачальника, а потім інші
  плагіни постачальників, що підтримують хуки, доки один із них справді не змінить конфігурацію. Якщо жоден
  хук постачальника не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google
  усе одно нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує переписування сумісності використання нативного потокового режиму на основі endpoint для конфігурованих постачальників
- `resolveConfigApiKey`: постачальник визначає автентифікацію за env-marker для конфігурованих постачальників
  без примусового повного завантаження автентифікації середовища виконання. `amazon-bedrock` також має тут
  вбудований засіб визначення AWS env-marker, хоча автентифікація середовища виконання Bedrock використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: постачальник може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені заповнювачі синтетичного профілю
  як такі, що мають нижчий пріоритет, ніж автентифікація на основі env/конфігурації
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібні переписування транспорту або базового URL
- `contributeResolvedModelCompat`: постачальник додає прапори сумісності для своїх
  моделей вендора, навіть якщо вони надходять через інший сумісний транспорт
- `capabilities`: постачальник публікує особливості стенограм/інструментів/сімейства постачальника
- `normalizeToolSchemas`: постачальник очищує схеми інструментів до того, як їх побачить вбудований
  раннер
- `inspectToolSchemas`: постачальник показує специфічні для транспорту попередження щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: постачальник вибирає нативні чи теговані
  контракти виводу міркувань
- `prepareExtraParams`: постачальник задає значення за замовчуванням або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях потокової передачі повністю
  власним транспортом
- `wrapStreamFn`: постачальник застосовує обгортки сумісності заголовків/тіла запиту/моделі
- `resolveTransportTurnState`: постачальник надає нативні транспортні
  заголовки або метадані для кожного кроку
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки сеансу WebSocket
  або політику cooldown сеансу
- `createEmbeddingProvider`: постачальник володіє поведінкою embedding пам’яті, коли вона
  належить плагіну постачальника, а не базовому комутатору embedding
- `formatApiKey`: постачальник форматує збережені профілі автентифікації у рядок
  `apiKey` середовища виконання, який очікує транспорт
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних
  засобів оновлення `pi-ai` недостатньо
- `buildAuthDoctorHint`: постачальник додає підказки з виправлення, коли оновлення OAuth
  завершується невдачею
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення контекстного вікна, які загальні евристики могли б пропустити
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки транспорту/API
  з причинами резервного перемикання, як-от rate limit або overload
- `isCacheTtlEligible`: постачальник визначає, які ідентифікатори моделей вище за потоком підтримують TTL кешу промптів
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки та може повертати
  помилку під керуванням вендора для збоїв прямого визначення
- `augmentModelCatalog`: постачальник додає синтетичні/остаточні рядки каталогу після
  виявлення та об’єднання конфігурації
- `isBinaryThinking`: постачальник володіє UX бінарного ввімкнення/вимкнення thinking
- `supportsXHighThinking`: постачальник вмикає `xhigh` для вибраних моделей
- `resolveDefaultThinkingLevel`: постачальник володіє політикою `/think` за замовчуванням для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує специфічні для постачальника глобальні значення за замовчуванням
  під час матеріалізації конфігурації залежно від режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням бажаної моделі для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткоживучий
  токен середовища виконання
- `resolveUsageAuth`: постачальник визначає облікові дані використання/квоти для `/usage`
  і пов’язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/розбором endpoint використання, тоді як
  ядро й надалі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні ефекти після вибору моделі, як-от
  телеметрія або ведення обліку сеансу під керуванням постачальника

Поточні вбудовані приклади:

- `anthropic`: резервний режим сумісності вперед для Claude 4.6, підказки з відновлення автентифікації, отримання
  endpoint використання, метадані TTL кешу/сімейства постачальника та глобальні
  значення конфігурації за замовчуванням з урахуванням автентифікації
- `amazon-bedrock`: зіставлення переповнення контексту під керуванням постачальника та класифікація
  причин резервного перемикання для специфічних помилок Bedrock, пов’язаних із throttle/not-ready, а також
  спільне сімейство відтворення `anthropic-by-model` для захисту політики відтворення лише для Claude
  у трафіку Anthropic
- `anthropic-vertex`: захист політики відтворення лише для Claude у трафіку
  повідомлень Anthropic
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки щодо можливостей
  постачальника, санітизація thought-signature Gemini у проксійованому трафіку Gemini, ін’єкція
  міркувань через проксі через сімейство потоків `openrouter-thinking`, пересилання
  метаданих маршрутизації та політика TTL кешу
- `github-copilot`: онбординг/вхід за кодом пристрою, резервний режим сумісності вперед для моделей,
  підказки стенограми Claude-thinking, обмін токенів середовища виконання та отримання endpoint використання
- `openai`: резервний режим сумісності вперед для GPT-5.4, пряма нормалізація
  транспорту OpenAI, підказки про відсутню автентифікацію з урахуванням Codex, придушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів використання
  (`input` / `output` і сімейства `prompt` / `completion`), спільне
  сімейство потоків `openai-responses-defaults` для нативних обгорток OpenAI/Codex, метадані
  сімейства постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-1` і реєстрація вбудованого постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервний режим сумісності вперед для Gemini 3.1,
  нативна перевірка відтворення Gemini, санітизація bootstrap-відтворення, тегований
  режим виводу міркувань, зіставлення сучасних моделей, реєстрація вбудованого постачальника
  генерації зображень для preview-моделей Gemini image і вбудована
  реєстрація постачальника генерації відео для моделей Veo; OAuth Gemini CLI також
  володіє форматуванням токенів профілю автентифікації, розбором токенів використання та отриманням endpoint квоти
  для поверхонь використання
- `moonshot`: спільний транспорт, нормалізація payload thinking під керуванням плагіна
- `kilocode`: спільний транспорт, заголовки запитів під керуванням плагіна, payload міркувань
  нормалізація, санітизація thought-signature proxy-Gemini та політика TTL кешу
- `zai`: резервний режим сумісності вперед для GLM-5, значення за замовчуванням `tool_stream`, політика TTL кешу,
  політика binary-thinking/live-model і автентифікація використання + отримання квоти;
  невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація транспорту Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типовий `tool_stream`, очищення схем інструментів /
  payload міркувань, специфічне для xAI, і реєстрація вбудованого постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей під керуванням плагіна
- `opencode` і `opencode-go`: метадані можливостей під керуванням плагіна плюс
  санітизація thought-signature proxy-Gemini
- `alibaba`: каталог генерації відео під керуванням плагіна для прямих посилань на моделі Wan,
  таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги під керуванням плагіна плюс реєстрація вбудованого постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого постачальника генерації відео для хостованих сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей FLUX, а також вбудована
  реєстрація постачальника генерації відео для хостованих сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги під керуванням плагіна
- `qwen`: каталоги текстових моделей під керуванням плагіна плюс спільні
  реєстрації постачальників media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відеоendpoint DashScope
  із вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео під керуванням плагіна для нативних
  моделей Runway на основі задач, таких як `gen4.5`
- `minimax`: каталоги під керуванням плагіна, реєстрація вбудованого постачальника генерації відео
  для моделей Hailuo video, реєстрація вбудованого постачальника генерації зображень
  для `image-01`, гібридний вибір політики відтворення Anthropic/OpenAI
  і логіка автентифікації/знімка використання
- `together`: каталоги під керуванням плагіна плюс реєстрація вбудованого постачальника генерації відео
  для моделей Wan video
- `xiaomi`: каталоги під керуванням плагіна плюс логіка автентифікації/знімка використання

Вбудований плагін `openai` тепер володіє обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які досі вписуються у звичайні транспорти OpenClaw. Постачальник,
якому потрібен повністю власний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список, розділений комами або крапками з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і видаляє дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit помилки (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Невдачі, не пов’язані з rate-limit, одразу завершуються помилкою; ротація ключів не виконується.
- Коли всі можливі ключі не спрацьовують, повертається остання помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Ці постачальники **не** потребують
конфігурації `models.providers`; достатньо налаштувати автентифікацію та вибрати модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів WebSocket OpenAI Responses за замовчуванням увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до універсальних проксі, сумісних з OpenAI
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки кешу промптів і
  формування payload сумісності міркувань OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark вважається доступним лише для Codex

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
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема для трафіку з автентифікацією API-ключем і OAuth, надісланого на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тож OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

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
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до універсальних проксі, сумісних з OpenAI
- Використовує той самий спільний перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і стандартне значення середовища виконання `contextTokens = 272000`; перевизначте ліміт середовища виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex прямо підтримується для зовнішніх інструментів/потоків роботи, таких як OpenClaw.

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

### Інші хостовані варіанти в стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud, а також зіставлення endpoint Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API-ключ MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API endpoint

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
- Сумісність: застарілу конфігурацію OpenClaw, що використовує `google/gemini-3.1-flash-preview`, нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; збіги кешу Gemini відображаються як `cacheRead` OpenClaw

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості шлюзу.
  - Якщо після входу запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості шлюзу.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
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
  виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  середовища виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Докладніше про налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку лише тоді, коли
  запит справді спрямований на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter і надалі використовує проксі-стиль шляху, сумісного з OpenAI, тому
  формування запитів, властиве лише нативному OpenAI (`serviceTier`, Responses `store`,
  підказки кешу промптів, payload сумісності міркувань OpenAI), не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише санітизацію thought-signature proxy-Gemini;
  нативна перевірка відтворення Gemini та bootstrap-переписування залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях санітизації thought-signature
  proxy-Gemini; `kilocode/kilo/auto` та інші підказки, що не підтримують proxy reasoning,
  пропускають ін’єкцію reasoning через проксі
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування онбордингу/API-ключа MiniMax записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає chat-посилання
  лише текстовими, доки не буде матеріалізовано конфігурацію цього постачальника
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
  - `tool_stream` увімкнено за замовчуванням; задайте
    `agents.defaults.models["xai/<model>"].params.tool_stream` як `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM на Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Базовий URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (власний/base URL)

Використовуйте `models.providers` (або `models.json`) для додавання **власних** постачальників або
проксі, сумісних з OpenAI/Anthropic.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
за замовчуванням і додавайте явний запис `models.providers.moonshot` лише тоді, коли вам
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

Застарілий `kimi/k2p5` і далі приймається як сумісний ідентифікатор моделі.

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

Під час онбордингу за замовчуванням вибирається поверхня coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У вибірниках моделей onboarding/configure для вибору автентифікації Volcengine пріоритет надається і рядкам
`volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
вибірника в межах постачальника.

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

Під час онбордингу за замовчуванням вибирається поверхня coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У вибірниках моделей onboarding/configure для вибору автентифікації BytePlus пріоритет надається і рядкам
`byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
вибірника в межах постачальника.

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

Докладніше про налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному шляху потокової передачі MiniMax OpenClaw вимикає thinking за
замовчуванням, якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей під керуванням плагіна:

- За замовчуванням текст/chat лишається на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це керований плагіном `MiniMax-VL-01` на обох шляхах автентифікації MiniMax
- Вебпошук лишається на ідентифікаторі постачальника `minimax`

### Ollama

Ollama постачається як вбудований плагін постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
- Автентифікація: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Установлення: [https://ollama.com/download](https://ollama.com/download)

```bash
# Установіть Ollama, потім завантажте модель:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте це через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і вибірника моделей. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

Докладніше див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

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

Докладніше див. у [/providers/sglang](/uk/providers/sglang).

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

- Для власних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх не задано, OpenClaw використовує такі значення за замовчуванням:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, які відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних endpoint (будь-який непорожній `baseUrl`, чий хост не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 через непідтримувані ролі `developer`.
- Проксі-маршрути в стилі OpenAI-compatible також пропускають формування запитів, властиве лише нативному OpenAI:
  без `service_tier`, без Responses `store`, без підказок кешу промптів, без
  формування payload сумісності міркувань OpenAI і без прихованих заголовків атрибуції
  OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає стандартну поведінку OpenAI (яка вказує на `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint `openai-completions`.

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
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — окремі довідники з налаштування постачальників
