---
read_when:
    - Налаштування розбору або типових значень директив thinking, fast-mode чи verbose
summary: Синтаксис директив для `/think`, `/fast`, `/verbose`, `/trace` і видимості reasoning
title: Рівні thinking
x-i18n:
    generated_at: "2026-04-23T21:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: afa7a90ac91d108bd21c6bb50dc2db3520a4ce9b89fb31b541d5ef72faeb5988
    source_path: tools/thinking.md
    workflow: 15
---

# Рівні thinking (директиви `/think`)

## Що це робить

- Inline-директива в будь-якому вхідному тілі: `/t <level>`, `/think:<level>` або `/thinking <level>`.
- Рівні (псевдоніми): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (максимальний бюджет)
  - xhigh → “ultrathink+” (GPT-5.2 + моделі Codex і Anthropic Claude Opus 4.7 effort)
  - adaptive → керований провайдером adaptive thinking (підтримується для Claude 4.6 на Anthropic/Bedrock і Anthropic Claude Opus 4.7)
  - max → максимальний reasoning провайдера (наразі Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` і `extra_high` зіставляються з `xhigh`.
  - `highest` зіставляється з `high`.
- Примітки щодо провайдерів:
  - Меню та вибір thinking залежать від профілю провайдера. Provider plugins оголошують точний набір рівнів для вибраної моделі, включно з мітками на кшталт бінарного `on`.
  - `adaptive`, `xhigh` і `max` оголошуються лише для профілів provider/model, які їх підтримують. Введені директиви для непідтримуваних рівнів відхиляються з переліком валідних варіантів для цієї моделі.
  - Наявні збережені непідтримувані рівні переназначаються за рангом профілю провайдера. `adaptive` повертається до `medium` на неadaptive-моделях, а `xhigh` і `max` — до найбільшого підтримуваного рівня, відмінного від `off`, для вибраної моделі.
  - Моделі Anthropic Claude 4.6 типово використовують `adaptive`, коли явний рівень thinking не задано.
  - Anthropic Claude Opus 4.7 не використовує adaptive thinking за замовчуванням. Його типове значення effort API залишається під керуванням провайдера, якщо ви явно не задасте рівень thinking.
  - Anthropic Claude Opus 4.7 зіставляє `/think xhigh` з adaptive thinking плюс `output_config.effort: "xhigh"`, тому що `/think` — це директива thinking, а `xhigh` — це параметр effort для Opus 4.7.
  - Anthropic Claude Opus 4.7 також надає `/think max`; воно зіставляється з тим самим шляхом максимального effort, яким володіє провайдер.
  - Моделі OpenAI GPT зіставляють `/think` через support effort Responses API, специфічний для моделі. `/think off` надсилає `reasoning.effort: "none"` лише тоді, коли цільова модель це підтримує; інакше OpenClaw не надсилає payload вимкненого reasoning замість надсилання непідтримуваного значення.
  - MiniMax (`minimax/*`) на Anthropic-сумісному streaming-шляху типово використовує `thinking: { type: "disabled" }`, якщо ви явно не задасте thinking у model params або request params. Це запобігає витоку дельт `reasoning_content` з ненативного Anthropic streaming-формату MiniMax.
  - Z.AI (`zai/*`) підтримує лише бінарний thinking (`on`/`off`). Будь-який рівень, відмінний від `off`, трактується як `on` (зіставляється з `low`).
  - Moonshot (`moonshot/*`) зіставляє `/think off` з `thinking: { type: "disabled" }`, а будь-який рівень, відмінний від `off`, — з `thinking: { type: "enabled" }`. Коли thinking увімкнено, Moonshot приймає лише `tool_choice` `auto|none`; OpenClaw нормалізує несумісні значення до `auto`.

## Порядок визначення

1. Inline-директива в повідомленні (застосовується лише до цього повідомлення).
2. Перевизначення сесії (задається надсиланням повідомлення, що містить лише директиву).
3. Типове значення для окремого агента (`agents.list[].thinkingDefault` у config).
4. Глобальне типове значення (`agents.defaults.thinkingDefault` у config).
5. Fallback: типове значення, оголошене провайдером, якщо доступне; інакше моделі з підтримкою reasoning визначаються як `medium` або найближчий підтримуваний рівень, відмінний від `off`, для цієї моделі, а моделі без reasoning залишаються на `off`.

## Установлення типового значення для сесії

- Надішліть повідомлення, яке **містить лише директиву** (пробіли дозволені), наприклад `/think:medium` або `/t high`.
- Це закріплюється для поточної сесії (типово для конкретного відправника); очищається через `/think:off` або idle reset сесії.
- Надсилається відповідь-підтвердження (`Thinking level set to high.` / `Thinking disabled.`). Якщо рівень невалідний (наприклад, `/thinking big`), команду буде відхилено з підказкою, а стан сесії залишиться без змін.
- Надішліть `/think` (або `/think:`) без аргументу, щоб побачити поточний рівень thinking.

## Застосування за агентом

- **Embedded Pi**: визначений рівень передається до in-process runtime агента Pi.

## Швидкий режим (/fast)

- Рівні: `on|off`.
- Повідомлення лише з директивою перемикає session override для fast-mode і відповідає `Fast mode enabled.` / `Fast mode disabled.`.
- Надішліть `/fast` (або `/fast status`) без режиму, щоб побачити поточний ефективний стан fast-mode.
- OpenClaw визначає fast mode в такому порядку:
  1. Inline/directive-only `/fast on|off`
  2. Перевизначення сесії
  3. Типове значення для окремого агента (`agents.list[].fastModeDefault`)
  4. Config для конкретної моделі: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Для `openai/*` fast mode зіставляється з пріоритетною обробкою OpenAI шляхом надсилання `service_tier=priority` у підтримуваних запитах Responses.
- Для `openai-codex/*` fast mode надсилає той самий прапорець `service_tier=priority` у Codex Responses. OpenClaw зберігає один спільний перемикач `/fast` для обох шляхів auth.
- Для прямих публічних запитів `anthropic/*`, включно з OAuth-автентифікованим трафіком, надісланим до `api.anthropic.com`, fast mode зіставляється з рівнями сервісу Anthropic: `/fast on` задає `service_tier=auto`, `/fast off` задає `service_tier=standard_only`.
- Для `minimax/*` на Anthropic-сумісному шляху `/fast on` (або `params.fastMode: true`) переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
- Явні model params Anthropic `serviceTier` / `service_tier` перевизначають типове значення fast-mode, коли задано обидва. OpenClaw усе одно пропускає впровадження service-tier Anthropic для base URL проксі, відмінних від Anthropic.
- `/status` показує `Fast` лише тоді, коли fast mode увімкнено.

## Директиви verbose (/verbose або /v)

- Рівні: `on` (мінімальний) | `full` | `off` (типово).
- Повідомлення лише з директивою перемикає verbose для сесії і відповідає `Verbose logging enabled.` / `Verbose logging disabled.`; невалідні рівні повертають підказку без зміни стану.
- `/verbose off` зберігає явне перевизначення для сесії; очистіть його через Sessions UI, вибравши `inherit`.
- Inline-директива впливає лише на це повідомлення; в інших випадках застосовуються типові значення сесії/глобальні.
- Надішліть `/verbose` (або `/verbose:`) без аргументу, щоб побачити поточний рівень verbose.
- Коли verbose увімкнено, агенти, що надсилають структуровані результати інструментів (Pi, інші JSON-агенти), повертають кожен виклик інструмента як окреме повідомлення лише з metadata, з префіксом `<emoji> <tool-name>: <arg>`, коли це можливо (path/command). Ці зведення інструментів надсилаються щойно кожен інструмент запускається (окремими бульбашками), а не як streaming deltas.
- Зведення про збої інструментів залишаються видимими в нормальному режимі, але необроблені суфікси деталей помилок приховуються, якщо verbose не має значення `on` або `full`.
- Коли verbose має значення `full`, після завершення також пересилається вивід інструментів (окремою бульбашкою, обрізаною до безпечної довжини). Якщо ви перемикаєте `/verbose on|full|off`, поки запуск ще триває, наступні бульбашки інструментів враховують нове значення.

## Директиви trace для Plugin (/trace)

- Рівні: `on` | `off` (типово).
- Повідомлення лише з директивою перемикає session output trace для Plugin і відповідає `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-директива впливає лише на це повідомлення; в інших випадках застосовуються типові значення сесії/глобальні.
- Надішліть `/trace` (або `/trace:`) без аргументу, щоб побачити поточний рівень trace.
- `/trace` вужчий за `/verbose`: він показує лише trace/debug-рядки, якими володіє plugin, наприклад підсумки debug Active Memory.
- Рядки trace можуть з’являтися в `/status` і як діагностичне follow-up-повідомлення після звичайної відповіді assistant.

## Видимість reasoning (/reasoning)

- Рівні: `on|off|stream`.
- Повідомлення лише з директивою перемикає, чи показуються блоки thinking у відповідях.
- Коли функцію ввімкнено, reasoning надсилається як **окреме повідомлення** з префіксом `Reasoning:`.
- `stream` (лише Telegram): передає reasoning у чернеткову бульбашку Telegram під час генерування відповіді, а потім надсилає фінальну відповідь без reasoning.
- Псевдонім: `/reason`.
- Надішліть `/reasoning` (або `/reasoning:`) без аргументу, щоб побачити поточний рівень reasoning.
- Порядок визначення: inline-директива, потім session override, потім типове значення для окремого агента (`agents.list[].reasoningDefault`), потім fallback (`off`).

## Пов’язане

- Документація elevated mode міститься в [Elevated mode](/uk/tools/elevated).

## Heartbeat

- Тіло heartbeat probe — це налаштований prompt heartbeat (типово: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-директиви в повідомленні heartbeat застосовуються як звичайно (але уникайте зміни типових значень сесії через heartbeat).
- Доставка heartbeat типово надсилає лише фінальний payload. Щоб також надсилати окреме повідомлення `Reasoning:` (коли воно доступне), задайте `agents.defaults.heartbeat.includeReasoning: true` або для окремого агента `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- Селектор thinking у web chat під час завантаження сторінки віддзеркалює збережений рівень session зі вхідного сховища session/config.
- Вибір іншого рівня негайно записує перевизначення сесії через `sessions.patch`; він не чекає на наступне надсилання і не є одноразовим перевизначенням `thinkingOnce`.
- Першим варіантом завжди є `Default (<resolved level>)`, де визначене типове значення походить із профілю thinking провайдера активної моделі сесії плюс та ж логіка fallback, яку використовують `/status` і `session_status`.
- Селектор використовує `thinkingOptions`, повернені рядком сесії gateway. UI браузера не зберігає власний список regex провайдерів; plugins володіють наборами рівнів, специфічними для моделі.
- `/think:<level>` усе ще працює й оновлює той самий збережений рівень session, тому директиви чату й селектор залишаються синхронізованими.

## Профілі провайдерів

- Provider plugins можуть надавати `resolveThinkingProfile(ctx)`, щоб визначати підтримувані рівні моделі та типове значення.
- Кожен рівень профілю має збережений канонічний `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` або `max`) і може містити display `label`. Бінарні провайдери використовують `{ id: "low", label: "on" }`.
- Опубліковані legacy hooks (`supportsXHighThinking`, `isBinaryThinking` і `resolveDefaultThinkingLevel`) залишаються як сумісні adapter, але нові власні набори рівнів мають використовувати `resolveThinkingProfile`.
- Рядки gateway надають `thinkingOptions` і `thinkingDefault`, щоб ACP/chat-клієнти відображали той самий профіль, який використовує перевірка runtime.
