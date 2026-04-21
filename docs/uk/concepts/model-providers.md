---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій та потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-21T20:52:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cbb8c9caf148c8db124638a036503fc4d4d3cce947ad99cffdf68a137edaab7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей дивіться в [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає списком дозволених моделей.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила виконання, перевірки cooldown і збереження перевизначень сеансу
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це власні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження часу виконання.
- Плагіни постачальників можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні перевірки автентифікації на основі env і варіанти постачальників
  не потребували завантаження середовища виконання плагіна. Решта мапи env-змінних ядра тепер
  використовується лише для неплагінних/вбудованих постачальників і кількох випадків загального пріоритету, таких
  як онбординг Anthropic зі схемою API-ключ-спочатку.
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
- Примітка: середовище виконання постачальника `capabilities` — це метадані спільного раннера (сімейство постачальника,
  особливості транскрипту/інструментів, підказки щодо транспорту/кешу). Це не
  те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
- Вбудований постачальник `codex` поєднаний із вбудованим каркасом агента Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні вхід, що належить Codex, виявлення моделей, власне
  відновлення потоків і виконання app-server. Звичайні посилання `openai/gpt-*` і надалі
  використовують постачальника OpenAI і звичайний транспорт постачальника OpenClaw.
  Розгортання лише з Codex можуть вимкнути автоматичний резервний перехід на PI за допомогою
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Каркас Codex](/uk/plugins/codex-harness).

## Поведінка постачальника, що належить Plugin

Тепер плагіни постачальників можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий поділ:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками щодо списку дозволених моделей для онбордингу та записами
  налаштування у виборі онбордингу/моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним збиранням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників, здатні працювати через hook, доки один із них справді не змінить
  транспорт
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  використанням у середовищі виконання; OpenClaw спочатку перевіряє відповідного постачальника, а потім інші
  плагіни постачальників, здатні працювати через hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook постачальника не перепише конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує переписування сумісності native streaming-usage, керовані endpoint, для постачальників конфігурації
- `resolveConfigApiKey`: постачальник розв’язує автентифікацію за env-маркером для постачальників конфігурації
  без примусового завантаження повної автентифікації середовища виконання. `amazon-bedrock` також має
  тут вбудований розв’язувач env-маркерів AWS, хоча автентифікація середовища виконання Bedrock використовує
  ланцюжок за замовчуванням AWS SDK.
- `resolveSyntheticAuth`: постачальник може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження секретів у відкритому тексті
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені синтетичні профілі-заповнювачі
  як такі, що мають нижчий пріоритет, ніж автентифікація на основі env/конфігурації
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного розв’язання
- `normalizeResolvedModel`: постачальнику потрібні переписування транспорту або base URL
- `contributeResolvedModelCompat`: постачальник додає прапорці сумісності для своїх
  моделей постачальника, навіть коли вони надходять через інший сумісний транспорт
- `capabilities`: постачальник публікує особливості транскрипту/інструментів/сімейства постачальника
- `normalizeToolSchemas`: постачальник очищає схеми інструментів перед тим, як їх побачить вбудований
  раннер
- `inspectToolSchemas`: постачальник показує попередження щодо схем, специфічні для транспорту,
  після нормалізації
- `resolveReasoningOutputMode`: постачальник вибирає власні чи позначені тегами
  контракти виводу reasoning
- `prepareExtraParams`: постачальник задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях потоку повністю
  користувацьким транспортом
- `wrapStreamFn`: постачальник застосовує обгортки сумісності заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: постачальник надає власні заголовки або метадані транспорту
  для кожного ходу
- `resolveWebSocketSessionPolicy`: постачальник надає власні заголовки сеансу WebSocket
  або політику cooldown сеансу
- `createEmbeddingProvider`: постачальник володіє поведінкою embedding для пам’яті, коли вона
  має належати плагіну постачальника, а не вбудованому комутатору embedding ядра
- `formatApiKey`: постачальник форматує збережені профілі автентифікації в рядок середовища виконання
  `apiKey`, який очікує транспорт
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних засобів оновлення `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: постачальник додає вказівки з виправлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення контекстного вікна, які загальні евристики могли б пропустити
- `classifyFailoverReason`: постачальник відображає специфічні для постачальника необроблені помилки транспорту/API
  на причини резервного переходу, як-от обмеження швидкості або перевантаження
- `isCacheTtlEligible`: постачальник визначає, які upstream-ідентифікатори моделей підтримують TTL кешу промптів
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на підказку відновлення, специфічну для постачальника
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки та може повертати
  помилку, що належить постачальнику, для збоїв прямого розв’язання
- `augmentModelCatalog`: постачальник додає синтетичні/фінальні рядки каталогу після
  виявлення та об’єднання конфігурацій
- `resolveThinkingProfile`: постачальник володіє точним набором рівнів `/think`,
  необов’язковими мітками відображення та типовим рівнем для вибраної моделі
- `isBinaryThinking`: hook сумісності для двійкового UX мислення ввімк./вимк.
- `supportsXHighThinking`: hook сумісності для вибраних моделей `xhigh`
- `resolveDefaultThinkingLevel`: hook сумісності для типової політики `/think`
- `applyConfigDefaults`: постачальник застосовує глобальні типові значення, специфічні для постачальника,
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням пріоритетних моделей для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткоживучий
  токен середовища виконання
- `resolveUsageAuth`: постачальник розв’язує облікові дані використання/квот для `/usage`
  та пов’язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/розбором endpoint використання, тоді як
  ядро й далі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні ефекти після вибору моделі, такі як
  телеметрія або облік сеансу, що належить постачальнику

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання
  endpoint використання, метадані cache-TTL/сімейства постачальника та глобальні
  типові значення конфігурації з урахуванням автентифікації
- `amazon-bedrock`: зіставлення переповнення контексту, що належить постачальнику, і класифікація
  причин резервного переходу для специфічних для Bedrock помилок throttle/not-ready, а також
  спільне сімейство повторного відтворення `anthropic-by-model` для захисту політики повторного відтворення лише для Claude
  на трафіку Anthropic
- `anthropic-vertex`: захист політики повторного відтворення лише для Claude на трафіку
  повідомлень Anthropic
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки можливостей постачальника,
  санітаризація thought-signature Gemini на проксійованому трафіку Gemini,
  ін’єкція reasoning проксі через сімейство потоків `openrouter-thinking`, пересилання
  метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід через пристрій, резервна сумісність моделей уперед,
  підказки транскрипту Claude-thinking, обмін токенами середовища виконання та отримання endpoint використання
- `openai`: резервна сумісність уперед для GPT-5.4, нормалізація прямого транспорту OpenAI,
  підказки відсутньої автентифікації з урахуванням Codex, приглушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів використання
  (`input` / `output` і сімейства `prompt` / `completion`), спільне
  сімейство потоків `openai-responses-defaults` для власних обгорток OpenAI/Codex,
  метадані сімейства постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-2` і реєстрація вбудованого постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервна сумісність уперед для Gemini 3.1,
  власна валідація повторного відтворення Gemini, санітаризація bootstrap replay, режим
  виводу reasoning з тегами, зіставлення сучасних моделей, реєстрація вбудованого постачальника
  генерації зображень для моделей Gemini image-preview і реєстрація вбудованого
  постачальника генерації відео для моделей Veo; OAuth Gemini CLI також
  володіє форматуванням токенів профілю автентифікації, розбором токенів використання та отриманням endpoint
  квот для поверхонь використання
- `moonshot`: спільний транспорт, нормалізація payload thinking, що належить плагіну
- `kilocode`: спільний транспорт, заголовки запитів, що належать плагіну, payload reasoning
  нормалізація, санітаризація thought-signature proxy-Gemini та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика двійкового thinking/live-model та автентифікація використання + отримання квот;
  невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нормалізація власного транспорту Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, специфічне для xAI очищення схем інструментів /
  payload reasoning і реєстрація вбудованого постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, що належать плагіну
- `opencode` і `opencode-go`: метадані можливостей, що належать плагіну, плюс
  санітаризація thought-signature proxy-Gemini
- `alibaba`: каталог генерації відео, що належить плагіну, для прямих посилань на моделі Wan,
  таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, що належать плагіну, плюс реєстрація вбудованого постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого постачальника генерації відео для розміщених сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей зображень FLUX плюс вбудована
  реєстрація постачальника генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, що належать плагіну
- `qwen`: каталоги, що належать плагіну, для текстових моделей плюс спільні
  реєстрації постачальників розуміння медіа та генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відеоendpoint-и DashScope
  з вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, що належить плагіну, для власних
  моделей на основі задач Runway, таких як `gen4.5`
- `minimax`: каталоги, що належать плагіну, вбудована реєстрація постачальника генерації відео
  для відеомоделей Hailuo, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики повторного відтворення Anthropic/OpenAI
  та логіка автентифікації/знімка використання
- `together`: каталоги, що належать плагіну, плюс вбудована реєстрація постачальника генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, що належать плагіну, плюс логіка автентифікації/знімка використання

Вбудований плагін `openai` тепер володіє обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які все ще вписуються у звичайні транспорти OpenClaw. Постачальник,
якому потрібен повністю користувацький виконавець запитів, — це окрема, глибша поверхня
розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (один live override, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список, розділений комами або крапками з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google як резерв також включається `GOOGLE_API_KEY`.
- Порядок вибору ключів зберігає пріоритет і дедуплікує значення.
- Запити повторюються з наступним ключем лише у відповідь на обмеження швидкості (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з обмеженням швидкості, одразу завершуються збоєм; ротація ключів не виконується.
- Коли всі можливі ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Цим постачальникам **не потрібна**
конфігурація `models.providers`; достатньо налаштувати автентифікацію й вибрати модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (один override)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спочатку WebSocket, резервний варіант — SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання WebSocket OpenAI Responses типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` відображають прямі запити Responses `openai/*` на `service_tier=priority` у `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до власного трафіку OpenAI на `api.openai.com`, а не
  до загальних OpenAI-сумісних проксі
- Власні маршрути OpenAI також зберігають `store` Responses, підказки кешу промптів і
  формування payload сумісності reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark вважається лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (один override)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком з API-ключем та OAuth-автентифікацією, надісланим до `api.anthropic.com`; OpenClaw відображає це на Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.

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
- Типовий транспорт — `auto` (спочатку WebSocket, резервний варіант — SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається у власних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до власного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Має той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw відображає це на `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає власні `contextWindow = 1050000` і типові для середовища виконання `contextTokens = 272000`; перевизначайте обмеження часу виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex явно підтримується для зовнішніх інструментів/робочих процесів, таких як OpenClaw.

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
- [MiniMax](/uk/providers/minimax): OAuth MiniMax Coding Plan або доступ за API-ключем
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
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (один override)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застарілу конфігурацію OpenClaw з `google/gemini-3.1-flash-preview` нормалізовано до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання власного для постачальника
  дескриптора `cachedContents/...`; збіги кешу Gemini відображаються як `cacheRead` OpenClaw

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження акаунтів Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний акаунт, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості Gateway.
  - Якщо після входу запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується в `cacheRead` OpenClaw.

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
- Приклад моделі: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live
  виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити
  каталог середовища виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування дивіться в [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді, коли
  запит справді спрямований до `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter залишається на проксійованому OpenAI-сумісному шляху, тому власне
  формування запитів лише для OpenAI (`serviceTier`, Responses `store`,
  підказки кешу промптів, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише санітаризацію thought-signature proxy-Gemini;
  власна валідація повторного відтворення Gemini і bootstrap-переписування залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях
  санітаризації thought-signature proxy-Gemini; `kilocode/kilo/auto` та інші підказки,
  де proxy reasoning не підтримується, пропускають ін’єкцію proxy reasoning
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Онбординг MiniMax/налаштування API-ключа записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає посилання чату
  лише текстовими, доки конфігурація цього постачальника не буде матеріалізована
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
- Приклад моделей: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
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
  - Власні вбудовані запити xAI використовують шлях xAI Responses
  - `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнено; задайте
    `agents.defaults.models["xai/<model>"].params.tool_stream` як `false`, щоб
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

## Постачальники через `models.providers` (користувацький/base URL)

Використовуйте `models.providers` (або `models.json`) для додавання **користувацьких** постачальників або
OpenAI/Anthropic-сумісних проксі.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
типово й додавайте явний запис `models.providers.moonshot` лише тоді, коли вам
потрібно перевизначити base URL або метадані моделі:

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

### Kimi Coding

Kimi Coding використовує Anthropic-сумісний endpoint Moonshot AI:

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

Застарілий `kimi/k2p5` і далі приймається як ідентифікатор моделі для сумісності.

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

У виборі моделей під час онбордингу/налаштування вибір автентифікації Volcengine віддає перевагу рядкам
`volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
вибору в межах постачальника.

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

У виборі моделей під час онбордингу/налаштування вибір автентифікації BytePlus віддає перевагу рядкам
`byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
вибору в межах постачальника.

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

MiniMax налаштовується через `models.providers`, оскільки використовує користувацькі endpoint-и:

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобальний): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, параметри моделей і фрагменти конфігурації дивіться в [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному потоковому шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ можливостей, що належать плагіну:

- Типові значення тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить плагіну, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований плагін постачальника, який використовує власний API:

- Постачальник: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Типовий base URL inference: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з ідентифікаторів, повернених `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує власні `LM Studio` `/api/v1/models` і `/api/v1/models/load`
для виявлення + автозавантаження, а `/v1/chat/completions` — для inference за замовчуванням.
Налаштування і усунення проблем дивіться в [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований плагін постачальника і використовує власний API Ollama:

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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте це через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і вибору моделі. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та користувацької конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted OpenAI-сумісних
серверів:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автодетекцію локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

Деталі дивіться в [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автодетекцію локально (підійде будь-яке значення, якщо ваш сервер не
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

Деталі дивіться в [/providers/sglang](/uk/providers/sglang).

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

- Для користувацьких постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх пропущено, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, які відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на невласних endpoint-ах (будь-який непорожній `baseUrl`, чий хост не `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 для непідтримуваних ролей `developer`.
- Проксійовані OpenAI-сумісні маршрути також пропускають власне формування
  запитів лише для OpenAI: без `service_tier`, без Responses `store`, без підказок кешу промптів, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає типову поведінку OpenAI (яка вказує на `api.openai.com`).
- Для безпеки явний `compat.supportsDeveloperRole: true` однаково перевизначається на невласних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Дивіться також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Моделі](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Резервний перехід моделей](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Довідник з конфігурації](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Постачальники](/uk/providers) — інструкції з налаштування для кожного постачальника
