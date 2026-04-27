---
read_when:
    - Налаштування парсингу або типових значень директив thinking, fast-mode чи verbose
summary: Синтаксис директив для /think, /fast, /verbose, /trace і видимості міркувань
title: Рівні мислення
x-i18n:
    generated_at: "2026-04-27T14:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d79dc5a84bb2e695fafb6f2298aabf253126dc20d474bc64ca19a7fe6ac5454
    source_path: tools/thinking.md
    workflow: 15
---

## Що це робить

- Вбудована директива в будь-якому вхідному тілі: `/t <level>`, `/think:<level>` або `/thinking <level>`.
- Рівні (аліаси): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → «think»
  - low → «think hard»
  - medium → «think harder»
  - high → «ultrathink» (максимальний бюджет)
  - xhigh → «ultrathink+» (моделі GPT-5.2+ і Codex, а також зусилля Anthropic Claude Opus 4.7)
  - adaptive → кероване провайдером адаптивне thinking (підтримується для Claude 4.6 на Anthropic/Bedrock, Anthropic Claude Opus 4.7 і динамічного thinking Google Gemini)
  - max → максимальне reasoning провайдера (Anthropic Claude Opus 4.7; Ollama відображає це у своє найвище нативне зусилля `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` і `extra_high` відображаються в `xhigh`.
  - `highest` відображається в `high`.
- Примітки щодо провайдерів:
  - Меню та селектори thinking керуються профілями провайдерів. Provider plugins оголошують точний набір рівнів для вибраної моделі, включно з мітками на кшталт бінарного `on`.
  - `adaptive`, `xhigh` і `max` оголошуються лише для профілів провайдерів/моделей, які їх підтримують. Типізовані директиви для непідтримуваних рівнів відхиляються з переліком дійсних варіантів для цієї моделі.
  - Наявні збережені непідтримувані рівні повторно відображаються за рангом профілю провайдера. `adaptive` повертається до `medium` на неадаптивних моделях, а `xhigh` і `max` повертаються до найбільшого підтримуваного рівня, що не є `off`, для вибраної моделі.
  - Моделі Anthropic Claude 4.6 типово використовують `adaptive`, коли явно не задано рівень thinking.
  - Anthropic Claude Opus 4.7 не використовує адаптивне thinking типово. Типове значення зусилля API залишається у власності провайдера, якщо ви явно не встановите рівень thinking.
  - Anthropic Claude Opus 4.7 відображає `/think xhigh` на адаптивне thinking плюс `output_config.effort: "xhigh"`, тому що `/think` — це директива thinking, а `xhigh` — це параметр effort для Opus 4.7.
  - Anthropic Claude Opus 4.7 також підтримує `/think max`; це відображається на той самий шлях максимального effort, керований провайдером.
  - Моделі Ollama з підтримкою thinking надають `/think low|medium|high|max`; `max` відображається на нативне `think: "high"`, тому що нативний API Ollama приймає рядки effort `low`, `medium` і `high`.
  - Моделі OpenAI GPT відображають `/think` через підтримку effort Responses API, специфічну для моделі. `/think off` надсилає `reasoning.effort: "none"` лише тоді, коли цільова модель це підтримує; інакше OpenClaw пропускає вимкнений payload reasoning замість надсилання непідтримуваного значення.
  - Застарілі налаштовані посилання OpenRouter Hunter Alpha пропускають ін’єкцію proxy reasoning, тому що цей виведений з експлуатації маршрут міг повертати текст фінальної відповіді через поля reasoning.
  - Google Gemini відображає `/think adaptive` на динамічне thinking, кероване провайдером у Gemini. Запити Gemini 3 пропускають фіксований `thinkingLevel`, тоді як запити Gemini 2.5 надсилають `thinkingBudget: -1`; фіксовані рівні все одно відображаються на найближчий `thinkingLevel` або бюджет Gemini для цього сімейства моделей.
  - MiniMax (`minimax/*`) на Anthropic-сумісному streaming path типово використовує `thinking: { type: "disabled" }`, якщо ви явно не встановите thinking у параметрах моделі або параметрах запиту. Це запобігає витоку дельт `reasoning_content` з ненативного формату потоку Anthropic у MiniMax.
  - Z.AI (`zai/*`) підтримує лише бінарне thinking (`on`/`off`). Будь-який рівень, відмінний від `off`, вважається `on` (відображається на `low`).
  - Moonshot (`moonshot/*`) відображає `/think off` на `thinking: { type: "disabled" }`, а будь-який рівень, відмінний від `off`, — на `thinking: { type: "enabled" }`. Коли thinking увімкнено, Moonshot приймає лише `tool_choice` `auto|none`; OpenClaw нормалізує несумісні значення до `auto`.

## Порядок визначення

1. Вбудована директива в повідомленні (застосовується лише до цього повідомлення).
2. Перевизначення сесії (встановлюється надсиланням повідомлення, що містить лише директиву).
3. Типове значення для агента (`agents.list[].thinkingDefault` у конфігурації).
4. Глобальне типове значення (`agents.defaults.thinkingDefault` у конфігурації).
5. Резервний варіант: типове значення, оголошене провайдером, якщо доступне; інакше моделі з підтримкою reasoning визначаються як `medium` або найближчий підтримуваний рівень, що не є `off`, для цієї моделі, а моделі без reasoning залишаються `off`.

## Установлення типового значення для сесії

- Надішліть повідомлення, яке **містить лише** директиву (пробіли дозволені), наприклад `/think:medium` або `/t high`.
- Воно закріплюється для поточної сесії (типово для кожного відправника окремо); очищується через `/think:off` або скидання через неактивність сесії.
- Надсилається відповідь-підтвердження (`Thinking level set to high.` / `Thinking disabled.`). Якщо рівень недійсний (наприклад, `/thinking big`), команда відхиляється з підказкою, а стан сесії не змінюється.
- Надішліть `/think` (або `/think:`) без аргументу, щоб побачити поточний рівень thinking.

## Застосування агентом

- **Вбудований Pi**: визначений рівень передається у внутрішньопроцесне середовище виконання агента Pi.

## Швидкий режим (/fast)

- Рівні: `on|off`.
- Повідомлення лише з директивою перемикає перевизначення fast-mode для сесії та відповідає `Fast mode enabled.` / `Fast mode disabled.`.
- Надішліть `/fast` (або `/fast status`) без режиму, щоб побачити поточний ефективний стан fast-mode.
- OpenClaw визначає fast mode в такому порядку:
  1. Вбудована директива/директива-тільки `/fast on|off`
  2. Перевизначення сесії
  3. Типове значення для агента (`agents.list[].fastModeDefault`)
  4. Конфігурація для моделі: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Резервний варіант: `off`
- Для `openai/*` fast mode відображається на пріоритетну обробку OpenAI через надсилання `service_tier=priority` у підтримуваних запитах Responses.
- Для `openai-codex/*` fast mode надсилає той самий прапорець `service_tier=priority` у Codex Responses. OpenClaw зберігає один спільний перемикач `/fast` для обох шляхів автентифікації.
- Для прямих публічних запитів `anthropic/*`, включно з трафіком з OAuth-автентифікацією, надісланим до `api.anthropic.com`, fast mode відображається на рівні сервісу Anthropic: `/fast on` встановлює `service_tier=auto`, `/fast off` встановлює `service_tier=standard_only`.
- Для `minimax/*` на Anthropic-сумісному шляху `/fast on` (або `params.fastMode: true`) переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
- Явні параметри моделі Anthropic `serviceTier` / `service_tier` перевизначають типове значення fast-mode, коли встановлено обидва. OpenClaw усе одно пропускає ін’єкцію рівня сервісу Anthropic для не-Anthropic proxy base URL.
- `/status` показує `Fast` лише коли fast mode увімкнено.

## Директиви verbose (/verbose або /v)

- Рівні: `on` (мінімальний) | `full` | `off` (типово).
- Повідомлення лише з директивою перемикає session verbose і відповідає `Verbose logging enabled.` / `Verbose logging disabled.`; недійсні рівні повертають підказку без зміни стану.
- `/verbose off` зберігає явне перевизначення сесії; очистьте його через UI Sessions, вибравши `inherit`.
- Вбудована директива впливає лише на це повідомлення; в інших випадках застосовуються session/global defaults.
- Надішліть `/verbose` (або `/verbose:`) без аргументу, щоб побачити поточний рівень verbose.
- Коли verbose увімкнено, агенти, що виводять структуровані результати інструментів (Pi, інші JSON-агенти), надсилають кожен виклик інструмента назад як окреме повідомлення лише з метаданими з префіксом `<emoji> <tool-name>: <arg>`, коли доступно (шлях/команда). Ці підсумки інструментів надсилаються щойно кожен інструмент запускається (окремими бульбашками), а не як streaming deltas.
- Підсумки збоїв інструментів залишаються видимими у звичайному режимі, але сирі суфікси деталей помилок приховані, якщо verbose не має значення `on` або `full`.
- Коли verbose має значення `full`, виводи інструментів також пересилаються після завершення (окрема бульбашка, обрізана до безпечної довжини). Якщо ви перемкнете `/verbose on|full|off` під час виконання, наступні бульбашки інструментів врахують нове значення.

## Директиви trace Plugin (/trace)

- Рівні: `on` | `off` (типово).
- Повідомлення лише з директивою перемикає вивід plugin trace для сесії та відповідає `Plugin trace enabled.` / `Plugin trace disabled.`.
- Вбудована директива впливає лише на це повідомлення; в інших випадках застосовуються session/global defaults.
- Надішліть `/trace` (або `/trace:`) без аргументу, щоб побачити поточний рівень trace.
- `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать Plugin, наприклад підсумки налагодження Active Memory.
- Рядки trace можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.

## Видимість reasoning (/reasoning)

- Рівні: `on|off|stream`.
- Повідомлення лише з директивою перемикає, чи показуються блоки thinking у відповідях.
- Коли увімкнено, reasoning надсилається як **окреме повідомлення** з префіксом `Reasoning:`.
- `stream` (лише Telegram): передає reasoning у чернеткову бульбашку Telegram, поки генерується відповідь, а потім надсилає фінальну відповідь без reasoning.
- Аліас: `/reason`.
- Надішліть `/reasoning` (або `/reasoning:`) без аргументу, щоб побачити поточний рівень reasoning.
- Порядок визначення: вбудована директива, потім перевизначення сесії, потім типове значення для агента (`agents.list[].reasoningDefault`), потім резервний варіант (`off`).

Некоректні теги reasoning локальних моделей обробляються консервативно. Закриті блоки `<think>...</think>` залишаються прихованими у звичайних відповідях, а незакритий reasoning після вже видимого тексту також приховується. Якщо відповідь повністю обгорнута в один незакритий opening tag і інакше була б доставлена як порожній текст, OpenClaw видаляє некоректний opening tag і доставляє решту тексту.

## Пов’язане

- Документація режиму elevated розміщена в [Elevated mode](/uk/tools/elevated).

## Heartbeats

- Тіло перевірки Heartbeat — це налаштований heartbeat prompt (типово: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Вбудовані директиви в heartbeat-повідомленні застосовуються як зазвичай (але уникайте зміни типових значень сесії з heartbeat-повідомлень).
- Доставка Heartbeat типово включає лише фінальний payload. Щоб також надсилати окреме повідомлення `Reasoning:` (коли доступне), установіть `agents.defaults.heartbeat.includeReasoning: true` або для конкретного агента `agents.list[].heartbeat.includeReasoning: true`.

## UI вебчату

- Селектор thinking у вебчаті віддзеркалює збережений рівень сесії зі сховища/конфігурації вхідної сесії під час завантаження сторінки.
- Вибір іншого рівня негайно записує перевизначення сесії через `sessions.patch`; він не чекає наступного надсилання і не є одноразовим перевизначенням `thinkingOnce`.
- Перший варіант завжди має вигляд `Default (<resolved level>)`, де визначене типове значення походить із профілю provider thinking для активної моделі сесії плюс та сама логіка резервних варіантів, яку використовують `/status` і `session_status`.
- Селектор використовує `thinkingLevels`, повернені рядком/типовими значеннями сесії шлюзу, а `thinkingOptions` зберігається як застарілий список міток. UI браузера не зберігає власний список regex провайдерів; plugins володіють наборами рівнів, специфічними для моделі.
- `/think:<level>` усе ще працює й оновлює той самий збережений рівень сесії, тож директиви чату та селектор залишаються синхронізованими.

## Профілі провайдерів

- Provider plugins можуть надавати `resolveThinkingProfile(ctx)` для визначення підтримуваних рівнів і типового значення моделі.
- Provider plugins, що проксують моделі Claude, мають повторно використовувати `resolveClaudeThinkingProfile(modelId)` з `openclaw/plugin-sdk/provider-model-shared`, щоб прямі каталоги Anthropic і proxy залишалися узгодженими.
- Кожен рівень профілю має збережений канонічний `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` або `max`) і може містити відображувану `label`. Бінарні провайдери використовують `{ id: "low", label: "on" }`.
- Tool plugins, яким потрібно перевіряти явне перевизначення thinking, мають використовувати `api.runtime.agent.resolveThinkingPolicy({ provider, model })` плюс `api.runtime.agent.normalizeThinkingLevel(...)`; вони не повинні зберігати власні списки рівнів для провайдера/моделі.
- Опубліковані застарілі хуки (`supportsXHighThinking`, `isBinaryThinking` і `resolveDefaultThinkingLevel`) залишаються як адаптери сумісності, але нові користувацькі набори рівнів мають використовувати `resolveThinkingProfile`.
- Рядки/типові значення Gateway надають `thinkingLevels`, `thinkingOptions` і `thinkingDefault`, щоб клієнти ACP/chat відображали ті самі id і label профілів, які використовує валідація під час виконання.
