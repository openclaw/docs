---
read_when:
    - Вам потрібно налагодити id сесій, JSONL транскриптів або поля sessions.json
    - Ви змінюєте поведінку авто-Compaction або додаєте підготовче housekeeping перед Compaction
    - Ви хочете реалізувати flush пам’яті або тихі системні кроки
summary: 'Глибокий огляд: сховище сесій і транскрипти, життєвий цикл та внутрішня будова (авто)Compaction'
title: Глибокий огляд керування сесіями
x-i18n:
    generated_at: "2026-04-27T12:55:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c03f8862e12622edce08aac17f3f766b6de9db890136866b6e9ae6ca0dd8768
    source_path: reference/session-management-compaction.md
    workflow: 15
---

OpenClaw керує сесіями наскрізно в таких ділянках:

- **Маршрутизація сесій** (як вхідні повідомлення зіставляються з `sessionKey`)
- **Сховище сесій** (`sessions.json`) і що воно відстежує
- **Збереження транскриптів** (`*.jsonl`) та їхню структуру
- **Гігієна транскриптів** (виправлення, специфічні для provider, перед запусками)
- **Обмеження контексту** (вікно контексту проти відстежуваних токенів)
- **Compaction** (ручна й авто-Compaction) і де підключати підготовчу роботу перед Compaction
- **Тихе housekeeping** (записи в пам’ять, які не повинні створювати видимий для користувача вивід)

Якщо вам спочатку потрібен огляд вищого рівня, почніть тут:

- [Керування сесіями](/uk/concepts/session)
- [Compaction](/uk/concepts/compaction)
- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Очищення сесій](/uk/concepts/session-pruning)
- [Гігієна транскриптів](/uk/reference/transcript-hygiene)

---

## Джерело істини: Gateway

OpenClaw спроєктовано навколо єдиного **процесу Gateway**, який володіє станом сесій.

- UI (застосунок macOS, вебінтерфейс Control UI, TUI) мають запитувати в Gateway списки сесій і кількість токенів.
- У remote mode файли сесій розташовані на віддаленому хості; «перевірка локальних файлів на Mac» не відображає того, що використовує Gateway.

---

## Два шари збереження

OpenClaw зберігає сесії у двох шарах:

1. **Сховище сесій (`sessions.json`)**
   - Мапа ключ/значення: `sessionKey -> SessionEntry`
   - Невелике, змінюване, безпечне для редагування (або видалення записів)
   - Відстежує метадані сесії (поточний id сесії, останню активність, перемикачі, лічильники токенів тощо)

2. **Транскрипт (`<sessionId>.jsonl`)**
   - Транскрипт лише з додаванням із деревоподібною структурою (записи мають `id` + `parentId`)
   - Зберігає власне розмову + виклики tools + підсумки Compaction
   - Використовується для відновлення контексту моделі для майбутніх кроків
   - Великі контрольні точки налагодження до Compaction пропускаються, щойно активний
     транскрипт перевищує ліміт розміру контрольної точки, що дозволяє уникнути другої великої
     копії `.checkpoint.*.jsonl`.

---

## Розташування на диску

Для кожного agent, на хості Gateway:

- Сховище: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Транскрипти: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Сесії тем Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw визначає їх через `src/config/sessions.ts`.

---

## Обслуговування сховища та контроль диска

Збереження сесій має автоматичні механізми обслуговування (`session.maintenance`) для `sessions.json` і артефактів транскриптів:

- `mode`: `warn` (типово) або `enforce`
- `pruneAfter`: поріг віку застарілих записів для очищення (типово `30d`)
- `maxEntries`: обмеження кількості записів у `sessions.json` (типово `500`)
- `rotateBytes`: ротація `sessions.json`, коли файл стає завеликим (типово `10mb`)
- `resetArchiveRetention`: строк зберігання архівів транскриптів `*.reset.<timestamp>` (типово: такий самий, як `pruneAfter`; `false` вимикає очищення)
- `maxDiskBytes`: необов’язковий бюджет каталогу сесій на диску
- `highWaterBytes`: необов’язкова ціль після очищення (типово `80%` від `maxDiskBytes`)

Порядок примусового очищення бюджету диска (`mode: "enforce"`):

1. Спочатку видалити найстаріші архівні або осиротілі артефакти транскриптів.
2. Якщо цього все ще недостатньо, витіснити найстаріші записи сесій і їхні файли транскриптів.
3. Продовжувати, доки використання не стане меншим або рівним `highWaterBytes`.

У `mode: "warn"` OpenClaw повідомляє про потенційні витіснення, але не змінює сховище/файли.

Запуск обслуговування за вимогою:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Сесії Cron і журнали запусків

Ізольовані запуски Cron також створюють записи/транскрипти сесій, і для них є окремі параметри зберігання:

- `cron.sessionRetention` (типово `24h`) очищає старі сесії ізольованих запусків Cron зі сховища сесій (`false` вимикає це).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` очищають файли `~/.openclaw/cron/runs/<jobId>.jsonl` (типові значення: `2_000_000` байт і `2000` рядків).

Коли Cron примусово створює нову сесію ізольованого запуску, він санітує попередній
запис сесії `cron:<jobId>` перед записом нового рядка. Він зберігає безпечні
налаштування, такі як параметри thinking/fast/verbose, labels і явні
перевизначення model/auth, вибрані користувачем. Він відкидає навколишній контекст розмови, такий
як маршрутизація channel/group, політика send або queue, elevation, origin та
прив’язка runtime ACP, щоб новий ізольований запуск не міг успадкувати застарілу доставку або
повноваження runtime від старішого запуску.

---

## Ключі сесій (`sessionKey`)

`sessionKey` визначає, _у якому кошику розмови_ ви перебуваєте (маршрутизація + ізоляція).

Поширені шаблони:

- Основний/прямий чат (для кожного agent): `agent:<agentId>:<mainKey>` (типово `main`)
- Group: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` або `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (якщо не перевизначено)

Канонічні правила задокументовано на [/concepts/session](/uk/concepts/session).

---

## ID сесій (`sessionId`)

Кожен `sessionKey` вказує на поточний `sessionId` (файл транскрипту, який продовжує розмову).

Практичні правила:

- **Reset** (`/new`, `/reset`) створює новий `sessionId` для цього `sessionKey`.
- **Щоденний reset** (типово о 4:00 ранку за локальним часом на хості gateway) створює новий `sessionId` при наступному повідомленні після межі reset.
- **Завершення за простоєм** (`session.reset.idleMinutes` або застарілий `session.idleMinutes`) створює новий `sessionId`, коли повідомлення приходить після вікна простою. Якщо налаштовано і щоденний reset, і idle, спрацьовує той, що настане раніше.
- **Системні події** (Heartbeat, пробудження Cron, сповіщення exec, службове bookkeeping gateway) можуть змінювати рядок сесії, але не подовжують актуальність щоденного/idle reset. Під час переходу reset відкидає поставлені в чергу повідомлення системних подій для попередньої сесії до побудови нового prompt.
- **Захист fork батьківського thread** (`session.parentForkMaxTokens`, типово `100000`) пропускає fork батьківського транскрипту, коли батьківська сесія вже надто велика; новий thread починається з нуля. Установіть `0`, щоб вимкнути.

Деталь реалізації: рішення приймається в `initSessionState()` у `src/auto-reply/reply/session.ts`.

---

## Схема сховища сесій (`sessions.json`)

Тип значення сховища — `SessionEntry` у `src/config/sessions.ts`.

Ключові поля (не вичерпно):

- `sessionId`: поточний id транскрипту (ім’я файла виводиться з нього, якщо не задано `sessionFile`)
- `sessionStartedAt`: початкова часова мітка для поточного `sessionId`; нею користується
  актуальність щоденного reset. Застарілі рядки можуть виводити її із заголовка сесії JSONL.
- `lastInteractionAt`: часова мітка останньої справжньої взаємодії користувача/каналу; її використовує
  актуальність idle reset, щоб Heartbeat, Cron і події exec не підтримували
  життя сесій. Застарілі рядки без цього поля повертаються до відновленого часу початку сесії для idle-актуальності.
- `updatedAt`: часова мітка останньої зміни рядка сховища, використовується для списків, очищення та
  bookkeeping. Це не авторитетне поле для актуальності щоденного/idle reset.
- `sessionFile`: необов’язкове явне перевизначення шляху транскрипту
- `chatType`: `direct | group | room` (допомагає UI і політиці send)
- `provider`, `subject`, `room`, `space`, `displayName`: метадані для маркування group/channel
- Перемикачі:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (перевизначення для сесії)
- Вибір моделі:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Лічильники токенів (best-effort / залежать від provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: скільки разів авто-Compaction завершувалася для цього ключа сесії
- `memoryFlushAt`: часова мітка останнього flush пам’яті перед Compaction
- `memoryFlushCompactionCount`: кількість Compaction, коли виконувався останній flush

Сховище безпечне для редагування, але Gateway — джерело істини: він може переписувати або повторно гідратувати записи під час роботи сесій.

---

## Структура транскрипту (`*.jsonl`)

Транскриптами керує `SessionManager` з `@mariozechner/pi-coding-agent`.

Файл має формат JSONL:

- Перший рядок: заголовок сесії (`type: "session"`, містить `id`, `cwd`, `timestamp`, необов’язковий `parentSession`)
- Далі: записи сесії з `id` + `parentId` (дерево)

Помітні типи записів:

- `message`: повідомлення user/assistant/toolResult
- `custom_message`: повідомлення, ін’єктовані extension, які _входять_ в контекст моделі (можуть бути приховані від UI)
- `custom`: стан extension, який _не_ входить в контекст моделі
- `compaction`: збережений підсумок Compaction із `firstKeptEntryId` і `tokensBefore`
- `branch_summary`: збережений підсумок під час навігації гілкою дерева

OpenClaw навмисно **не** «виправляє» транскрипти; Gateway використовує `SessionManager` для їх читання/запису.

---

## Вікна контексту проти відстежуваних токенів

Важливі два різні поняття:

1. **Вікно контексту моделі**: жорстке обмеження для кожної моделі (токени, видимі моделі)
2. **Лічильники сховища сесій**: накопичувальні статистики, записані в `sessions.json` (використовуються для `/status` і dashboard)

Якщо ви налаштовуєте ліміти:

- Вікно контексту береться з каталогу моделей (і може бути перевизначене через config).
- `contextTokens` у сховищі — це значення оцінки/звітності runtime; не сприймайте його як сувору гарантію.

Докладніше див. у [/token-use](/uk/reference/token-use).

---

## Compaction: що це

Compaction підсумовує старішу розмову в збережений запис `compaction` у транскрипті й залишає недавні повідомлення недоторканими.

Після Compaction майбутні кроки бачать:

- Підсумок Compaction
- Повідомлення після `firstKeptEntryId`

Compaction є **постійною** (на відміну від очищення сесій). Див. [/concepts/session-pruning](/uk/concepts/session-pruning).

## Межі chunk Compaction і поєднання tools

Коли OpenClaw ділить довгий транскрипт на chunk для Compaction, він зберігає
пари викликів tools assistant із відповідними записами `toolResult`.

- Якщо розділення за часткою токенів потрапляє між викликом tool і його результатом, OpenClaw
  зміщує межу до повідомлення assistant з викликом tool, а не розділяє
  пару.
- Якщо кінцевий блок результату tool інакше перевищив би цільовий розмір chunk,
  OpenClaw зберігає цей незавершений блок tool і лишає непідсумований хвіст недоторканим.
- Перервані/помилкові блоки викликів tool не утримують відкрите розділення.

---

## Коли відбувається авто-Compaction (runtime Pi)

У вбудованому agent Pi авто-Compaction спрацьовує у двох випадках:

1. **Відновлення після переповнення**: модель повертає помилку переповнення контексту
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` та подібні варіанти, сформовані provider) → виконати Compaction → повторити.
2. **Порогове обслуговування**: після успішного кроку, коли:

`contextTokens > contextWindow - reserveTokens`

Де:

- `contextWindow` — вікно контексту моделі
- `reserveTokens` — запас токенів для prompts + наступного виводу моделі

Це семантика runtime Pi (OpenClaw споживає події, але Pi вирішує, коли виконувати Compaction).

OpenClaw також може запустити локальну передпольотну Compaction перед відкриттям наступного
запуску, коли задано `agents.defaults.compaction.maxActiveTranscriptBytes` і
активний файл транскрипту досягає цього розміру. Це захист розміру файла для локальної
вартості повторного відкриття, а не сире архівування: OpenClaw усе одно виконує звичайну
семантичну Compaction, і для цього потрібен `truncateAfterCompaction`, щоб підсумок після Compaction міг стати
новим наступним транскриптом.

---

## Налаштування Compaction (`reserveTokens`, `keepRecentTokens`)

Налаштування Compaction у Pi живуть у налаштуваннях Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw також застосовує мінімальний поріг безпеки для вбудованих запусків:

- Якщо `compaction.reserveTokens < reserveTokensFloor`, OpenClaw підвищує його.
- Типовий мінімальний поріг — `20000` токенів.
- Установіть `agents.defaults.compaction.reserveTokensFloor: 0`, щоб вимкнути цей поріг.
- Якщо значення вже вище, OpenClaw його не змінює.
- Ручна команда `/compact` враховує явне `agents.defaults.compaction.keepRecentTokens`
  і зберігає точку відсікання недавнього хвоста Pi. Без явного бюджету keep
  ручна Compaction лишається жорсткою контрольною точкою, і відновлений контекст починається
  з нового підсумку.
- Установіть `agents.defaults.compaction.maxActiveTranscriptBytes` у значення байтів або
  рядок на кшталт `"20mb"`, щоб виконувати локальну Compaction перед кроком, коли активний
  транскрипт стає великим. Цей захист активний лише тоді, коли
  також увімкнено `truncateAfterCompaction`. Залиште поле невстановленим або задайте `0`,
  щоб вимкнути.
- Коли ввімкнено `agents.defaults.compaction.truncateAfterCompaction`,
  OpenClaw після Compaction обертає активний транскрипт у компактного наступника JSONL.
  Старий повний транскрипт лишається в архіві та зв’язується з контрольної точки
  Compaction замість переписування на місці.

Чому: потрібно залишити достатньо запасу для багатокрокового “housekeeping” (наприклад, записів у пам’ять) до того, як Compaction стане неминучою.

Реалізація: `ensurePiCompactionReserveTokens()` у `src/agents/pi-settings.ts`
(викликається з `src/agents/pi-embedded-runner.ts`).

---

## Підключувані providers Compaction

Plugins можуть реєструвати provider Compaction через `registerCompactionProvider()` у API plugin. Коли встановлено `agents.defaults.compaction.provider` на id зареєстрованого provider, розширення safeguard делегує підсумовування цьому provider замість вбудованого конвеєра `summarizeInStages`.

- `provider`: id зареєстрованого plugin provider Compaction. Залиште невстановленим для типового LLM-підсумовування.
- Встановлення `provider` примусово задає `mode: "safeguard"`.
- Providers отримують ті самі інструкції Compaction і політику збереження ідентифікаторів, що й вбудований шлях.
- Safeguard, як і раніше, зберігає контекст суфікса недавніх кроків і розділених кроків після виводу provider.
- Вбудоване safeguard-підсумовування повторно дистилює попередні підсумки разом із новими повідомленнями,
  а не зберігає повний попередній підсумок дослівно.
- Режим safeguard типово вмикає аудити якості підсумку; установіть
  `qualityGuard.enabled: false`, щоб пропустити поведінку повторної спроби за malformed-output.
- Якщо provider завершується збоєм або повертає порожній результат, OpenClaw автоматично повертається до вбудованого LLM-підсумовування.
- Сигнали abort/timeout перевикидаються (а не приглушуються), щоб поважати скасування виклику.

Джерело: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Поверхні, видимі користувачу

Ви можете спостерігати стан Compaction і сесії через:

- `/status` (у будь-якій чат-сесії)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Режим verbose: `🧹 Auto-compaction complete` + кількість Compaction

---

## Тихе housekeeping (`NO_REPLY`)

OpenClaw підтримує “тихі” кроки для фонових завдань, де користувач не повинен бачити проміжний вивід.

Домовленість:

- Assistant починає свій вивід з точного тихого token `NO_REPLY` /
  `no_reply`, щоб позначити “не доставляти відповідь користувачу”.
- OpenClaw прибирає/приглушує це на рівні доставки.
- Приглушення точного тихого token не залежить від регістру, тож `NO_REPLY` і
  `no_reply` однаково спрацьовують, коли весь payload — це лише тихий token.
- Це лише для справжніх фонових кроків / кроків без доставки; це не скорочення для
  звичайних прикладних запитів користувача.

Починаючи з `2026.1.10`, OpenClaw також приглушує **draft/typing streaming**, коли
частковий chunk починається з `NO_REPLY`, щоб тихі операції не витікали частковим
виводом посеред кроку.

---

## Підготовчий "flush пам’яті" перед Compaction (реалізовано)

Мета: перед тим як станеться авто-Compaction, виконати тихий agentic-крок, який записує стійкий
стан на диск (наприклад, `memory/YYYY-MM-DD.md` у робочому просторі agent), щоб Compaction не могла
стерти критичний контекст.

OpenClaw використовує підхід **flush до порога**:

1. Відстежувати використання контексту сесії.
2. Коли воно перетинає “м’який поріг” (нижчий за поріг Compaction у Pi), виконати тиху
   директиву “записати пам’ять зараз” для agent.
3. Використати точний тихий token `NO_REPLY` / `no_reply`, щоб користувач
   нічого не бачив.

Конфігурація (`agents.defaults.compaction.memoryFlush`):

- `enabled` (типово: `true`)
- `softThresholdTokens` (типово: `4000`)
- `prompt` (повідомлення користувача для кроку flush)
- `systemPrompt` (додатковий system prompt, доданий для кроку flush)

Примітки:

- Типові `prompt`/`systemPrompt` містять підказку `NO_REPLY` для приглушення
  доставки.
- Flush виконується один раз за цикл Compaction (відстежується в `sessions.json`).
- Flush виконується лише для вбудованих сесій Pi (backend CLI його пропускають).
- Flush пропускається, коли робочий простір сесії має доступ лише для читання (`workspaceAccess: "ro"` або `"none"`).
- Див. [Memory](/uk/concepts/memory) щодо структури файлів робочого простору й шаблонів запису.

Pi також надає hook `session_before_compact` в API extension, але логіка
flush у OpenClaw сьогодні живе на боці Gateway.

---

## Контрольний список усунення несправностей

- Неправильний ключ сесії? Почніть з [/concepts/session](/uk/concepts/session) і підтвердьте `sessionKey` у `/status`.
- Невідповідність між сховищем і транскриптом? Підтвердьте хост Gateway і шлях до сховища з `openclaw status`.
- Надмірно часта Compaction? Перевірте:
  - вікно контексту моделі (занадто мале)
  - налаштування Compaction (`reserveTokens`, завищене відносно вікна моделі, може спричиняти раннішу Compaction)
  - роздування результатів tools: увімкніть/налаштуйте очищення сесій
- Витікають тихі кроки? Переконайтеся, що відповідь починається з `NO_REPLY` (точний token без урахування регістру) і що у вас збірка з виправленням приглушення streaming.

## Пов’язане

- [Керування сесіями](/uk/concepts/session)
- [Очищення сесій](/uk/concepts/session-pruning)
- [Рушій контексту](/uk/concepts/context-engine)
