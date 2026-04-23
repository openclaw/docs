---
read_when:
    - Вам потрібно налагодити ідентифікатори сесій, JSONL транскриптів або поля sessions.json
    - Ви змінюєте поведінку авто-Compaction або додаєте housekeeping перед Compaction
    - Ви хочете реалізувати скидання пам’яті або тихі системні turns
summary: 'Детальний розбір: сховище сесій + транскрипти, життєвий цикл і внутрішні механізми (авто)Compaction'
title: Детальний розбір керування сесіями
x-i18n:
    generated_at: "2026-04-23T21:10:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea56c9305b0884e6ba6bdbd2a0bec16170af97b47749a9929c155ac4e6bd790b
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Керування сесіями та Compaction (детальний розбір)

Цей документ пояснює, як OpenClaw керує сесіями від початку до кінця:

- **Маршрутизація сесій** (як вхідні повідомлення зіставляються з `sessionKey`)
- **Сховище сесій** (`sessions.json`) і що воно відстежує
- **Збереження транскриптів** (`*.jsonl`) і їхню структуру
- **Гігієна транскриптів** (виправлення для конкретних provider перед запуском)
- **Обмеження контексту** (context window проти відстежуваних токенів)
- **Compaction** (ручна + авто-Compaction) і де підключати роботу перед Compaction
- **Тихий housekeeping** (наприклад, записи пам’яті, які не повинні створювати видимий для користувача вивід)

Якщо спочатку вам потрібен огляд вищого рівня, почніть із:

- [/concepts/session](/uk/concepts/session)
- [/concepts/compaction](/uk/concepts/compaction)
- [/concepts/memory](/uk/concepts/memory)
- [/concepts/memory-search](/uk/concepts/memory-search)
- [/concepts/session-pruning](/uk/concepts/session-pruning)
- [/reference/transcript-hygiene](/uk/reference/transcript-hygiene)

---

## Джерело істини: Gateway

OpenClaw спроєктовано навколо одного **процесу Gateway**, який володіє станом сесій.

- UI (застосунок macOS, web Control UI, TUI) повинні запитувати Gateway про списки сесій і кількість токенів.
- У віддаленому режимі файли сесій розташовані на віддаленому хості; «перевірка локальних файлів на Mac» не відображатиме те, що використовує Gateway.

---

## Два шари збереження

OpenClaw зберігає сесії у двох шарах:

1. **Сховище сесій (`sessions.json`)**
   - Мапа key/value: `sessionKey -> SessionEntry`
   - Невелике, змінюване, безпечне для редагування (або видалення записів)
   - Відстежує метадані сесії (поточний id сесії, останню активність, перемикачі, лічильники токенів тощо)

2. **Транскрипт (`<sessionId>.jsonl`)**
   - Транскрипт лише з додаванням, із деревоподібною структурою (записи мають `id` + `parentId`)
   - Зберігає фактичну розмову + виклики інструментів + підсумки Compaction
   - Використовується для відновлення контексту моделі для майбутніх turns

---

## Розташування на диску

Для кожного агента, на хості Gateway:

- Сховище: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Транскрипти: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Сесії тем Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw розв’язує ці шляхи через `src/config/sessions.ts`.

---

## Обслуговування сховища й контроль диска

Збереження сесій має автоматичні елементи керування обслуговуванням (`session.maintenance`) для `sessions.json` і артефактів транскриптів:

- `mode`: `warn` (типово) або `enforce`
- `pruneAfter`: межа віку застарілих записів (типово `30d`)
- `maxEntries`: обмеження кількості записів у `sessions.json` (типово `500`)
- `rotateBytes`: ротація `sessions.json`, коли файл стає надто великим (типово `10mb`)
- `resetArchiveRetention`: зберігання архівів транскриптів `*.reset.<timestamp>` (типово: таке саме, як `pruneAfter`; `false` вимикає очищення)
- `maxDiskBytes`: необов’язковий бюджет каталогу сесій
- `highWaterBytes`: необов’язкова ціль після очищення (типово `80%` від `maxDiskBytes`)

Порядок застосування очищення за бюджетом диска (`mode: "enforce"`):

1. Спочатку видалити найстаріші архівовані або осиротілі артефакти транскриптів.
2. Якщо все ще перевищено ціль, витіснити найстаріші записи сесій та їхні файли транскриптів.
3. Продовжувати, доки використання не стане меншим або рівним `highWaterBytes`.

У `mode: "warn"` OpenClaw повідомляє про потенційні витіснення, але не змінює сховище/файли.

Запуск обслуговування за вимогою:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-сесії та журнали запусків

Ізольовані запуски Cron також створюють записи сесій/транскрипти, і для них є окремі елементи керування зберіганням:

- `cron.sessionRetention` (типово `24h`) очищає старі ізольовані сесії запусків Cron зі сховища сесій (`false` вимикає це).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` очищають файли `~/.openclaw/cron/runs/<jobId>.jsonl` (типові значення: `2_000_000` байтів і `2000` рядків).

---

## Ключі сесій (`sessionKey`)

`sessionKey` визначає, _у якому кошику розмови_ ви перебуваєте (маршрутизація + ізоляція).

Типові шаблони:

- Основний/прямий чат (для кожного агента): `agent:<agentId>:<mainKey>` (типово `main`)
- Група: `agent:<agentId>:<channel>:group:<id>`
- Кімната/канал (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` або `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (якщо не перевизначено)

Канонічні правила задокументовано в [/concepts/session](/uk/concepts/session).

---

## Ідентифікатори сесій (`sessionId`)

Кожен `sessionKey` вказує на поточний `sessionId` (файл транскрипту, який продовжує розмову).

Практичні правила:

- **Скидання** (`/new`, `/reset`) створює новий `sessionId` для цього `sessionKey`.
- **Щоденне скидання** (типово о 4:00 ранку за локальним часом хоста gateway) створює новий `sessionId` у наступному повідомленні після межі скидання.
- **Завершення через простій** (`session.reset.idleMinutes` або legacy `session.idleMinutes`) створює новий `sessionId`, коли повідомлення надходить після вікна простою. Коли налаштовано і щоденне скидання, і idle, перемагає те, що спрацьовує раніше.
- **Захист від fork через батьківський thread** (`session.parentForkMaxTokens`, типово `100000`) пропускає форк батьківського транскрипту, коли батьківська сесія вже надто велика; новий thread починається з нуля. Установіть `0`, щоб вимкнути це.

Деталь реалізації: рішення приймається в `initSessionState()` у `src/auto-reply/reply/session.ts`.

---

## Схема сховища сесій (`sessions.json`)

Тип значення сховища — `SessionEntry` у `src/config/sessions.ts`.

Ключові поля (не вичерпний список):

- `sessionId`: поточний id транскрипту (ім’я файла виводиться з нього, якщо не задано `sessionFile`)
- `updatedAt`: час останньої активності
- `sessionFile`: необов’язкове явне перевизначення шляху до транскрипту
- `chatType`: `direct | group | room` (допомагає UI та політиці надсилання)
- `provider`, `subject`, `room`, `space`, `displayName`: метадані для міток груп/каналів
- Перемикачі:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (перевизначення на рівні сесії)
- Вибір моделі:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Лічильники токенів (best-effort / залежать від provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: скільки разів авто-Compaction було завершено для цього ключа сесії
- `memoryFlushAt`: час останнього скидання пам’яті перед Compaction
- `memoryFlushCompactionCount`: лічильник Compaction на момент останнього скидання

Сховище безпечно редагувати, але джерелом істини є Gateway: він може переписувати або повторно гідратувати записи під час роботи сесій.

---

## Структура транскрипту (`*.jsonl`)

Транскриптами керує `SessionManager` з `@mariozechner/pi-coding-agent`.

Файл має формат JSONL:

- Перший рядок: заголовок сесії (`type: "session"`, включає `id`, `cwd`, `timestamp`, необов’язкове `parentSession`)
- Далі: записи сесії з `id` + `parentId` (дерево)

Помітні типи записів:

- `message`: повідомлення user/assistant/toolResult
- `custom_message`: повідомлення, ін’єктовані extension, які _потрапляють_ у контекст моделі (можуть бути прихованими від UI)
- `custom`: стан extension, який _не потрапляє_ у контекст моделі
- `compaction`: збережений підсумок Compaction з `firstKeptEntryId` і `tokensBefore`
- `branch_summary`: збережений підсумок під час навігації по гілці дерева

OpenClaw навмисно **не** «виправляє» транскрипти; Gateway використовує `SessionManager` для їх читання/запису.

---

## Context window проти відстежуваних токенів

Важливі два різні поняття:

1. **Context window моделі**: жорстке обмеження для кожної моделі (токени, видимі моделі)
2. **Лічильники сховища сесій**: ковзна статистика, що записується в `sessions.json` (використовується для /status і dashboards)

Якщо ви налаштовуєте ліміти:

- Context window надходить із catalog моделі (і може бути перевизначений через config).
- `contextTokens` у сховищі — це runtime-оцінка/значення для звітності; не сприймайте його як сувору гарантію.

Докладніше див. у [/token-use](/uk/reference/token-use).

---

## Compaction: що це таке

Compaction підсумовує старішу частину розмови у збереженому записі `compaction` у транскрипті й залишає недоторканими останні повідомлення.

Після Compaction майбутні turns бачать:

- Підсумок Compaction
- Повідомлення після `firstKeptEntryId`

Compaction є **стійким** (на відміну від очищення сесій). Див. [/concepts/session-pruning](/uk/concepts/session-pruning).

## Межі chunk у Compaction і парування інструментів

Коли OpenClaw розбиває довгий транскрипт на chunk для Compaction, він зберігає
виклики інструментів assistant у парі з відповідними записами `toolResult`.

- Якщо розбиття за часткою токенів припадає між викликом інструмента і його результатом, OpenClaw
  зміщує межу до повідомлення assistant із викликом інструмента замість розділення
  пари.
- Якщо хвостовий блок tool-result інакше перевищив би ціль chunk, OpenClaw
  зберігає цей відкладений блок інструмента і залишає непідсумований хвіст недоторканим.
- Перервані/помилкові блоки викликів інструментів не утримують відкритим відкладене розбиття.

---

## Коли відбувається авто-Compaction (runtime Pi)

У вбудованому агенті Pi авто-Compaction запускається у двох випадках:

1. **Відновлення після overflow**: модель повертає помилку переповнення контексту
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` і подібні варіанти, специфічні для provider) → compact → retry.
2. **Підтримувальне порогове значення**: після успішного turn, коли:

`contextTokens > contextWindow - reserveTokens`

Де:

- `contextWindow` — context window моделі
- `reserveTokens` — запас токенів для prompt + наступного виводу моделі

Це семантика runtime Pi (OpenClaw споживає події, але Pi вирішує, коли виконувати Compaction).

---

## Налаштування Compaction (`reserveTokens`, `keepRecentTokens`)

Налаштування Compaction Pi зберігаються в налаштуваннях Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw також застосовує захисний мінімум для вбудованих запусків:

- Якщо `compaction.reserveTokens < reserveTokensFloor`, OpenClaw підвищує це значення.
- Типове мінімальне значення — `20000` токенів.
- Установіть `agents.defaults.compaction.reserveTokensFloor: 0`, щоб вимкнути цей мінімум.
- Якщо значення вже вище, OpenClaw його не змінює.

Чому: потрібно залишити достатньо запасу для багатокрокового “housekeeping” (наприклад, записів пам’яті), перш ніж Compaction стане неминучим.

Реалізація: `ensurePiCompactionReserveTokens()` у `src/agents/pi-settings.ts`
(викликається з `src/agents/pi-embedded-runner.ts`).

---

## Підключувані providers Compaction

Plugins можуть реєструвати provider Compaction через `registerCompactionProvider()` у plugin API. Коли `agents.defaults.compaction.provider` встановлено на id зареєстрованого provider, extension safeguard делегує підсумовування цьому provider замість вбудованого конвеєра `summarizeInStages`.

- `provider`: id зареєстрованого plugin provider Compaction. Залиште порожнім для типового LLM-підсумовування.
- Установлення `provider` примусово задає `mode: "safeguard"`.
- Providers отримують ті самі інструкції Compaction і політику збереження ідентифікаторів, що й вбудований шлях.
- Захист safeguard і далі зберігає контекст останніх turns і suffix для split-turn після виводу provider.
- Якщо provider завершується помилкою або повертає порожній результат, OpenClaw автоматично повертається до вбудованого LLM-підсумовування.
- Сигнали abort/timeout перевикидаються (не поглинаються), щоб поважати скасування з боку викликальника.

Вихідний код: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Поверхні, видимі користувачу

Ви можете спостерігати Compaction і стан сесії через:

- `/status` (у будь-якій чат-сесії)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Докладний режим: `🧹 Auto-compaction complete` + лічильник Compaction

---

## Тихий housekeeping (`NO_REPLY`)

OpenClaw підтримує “тихі” turns для фонових завдань, де користувач не повинен бачити проміжний вивід.

Угода:

- Assistant починає свій вивід із точного silent token `NO_REPLY` /
  `no_reply`, щоб позначити “не доставляти відповідь користувачу”.
- OpenClaw прибирає/приглушує це на рівні доставки.
- Приглушення точного silent token є нечутливим до регістру, тож `NO_REPLY` і
  `no_reply` обидва враховуються, коли весь payload — це лише silent token.
- Це призначено тільки для справді фонових/no-delivery turns; це не скорочення
  для звичайних виконуваних запитів користувача.

Починаючи з `2026.1.10`, OpenClaw також приглушує **чернетковий/typing streaming**, коли
частковий chunk починається з `NO_REPLY`, щоб тихі операції не витікали частковим
виводом посеред turn.

---

## "Memory flush" перед Compaction (реалізовано)

Мета: до того, як спрацює авто-Compaction, запустити тихий agentic turn, який записує стійкий
стан на диск (наприклад, `memory/YYYY-MM-DD.md` у workspace агента), щоб Compaction не міг
стерти критичний контекст.

OpenClaw використовує підхід **flush перед порогом**:

1. Відстежувати використання контексту сесії.
2. Коли воно перетинає “м’який поріг” (нижчий за поріг Compaction у Pi), запустити тиху
   директиву “записати пам’ять зараз” до агента.
3. Використовувати точний silent token `NO_REPLY` / `no_reply`, щоб користувач
   нічого не бачив.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (типово: `true`)
- `softThresholdTokens` (типово: `4000`)
- `prompt` (повідомлення користувача для flush-turn)
- `systemPrompt` (додатковий системний prompt, що додається для flush-turn)

Примітки:

- Типові `prompt`/`systemPrompt` містять підказку `NO_REPLY`, щоб приглушити
  доставку.
- Flush запускається один раз за цикл Compaction (відстежується в `sessions.json`).
- Flush запускається лише для вбудованих сесій Pi (backend CLI його пропускають).
- Flush пропускається, коли workspace сесії доступний лише для читання (`workspaceAccess: "ro"` або `"none"`).
- Схему файлів workspace і шаблони запису див. у [Memory](/uk/concepts/memory).

Pi також надає hook `session_before_compact` в API extension, але логіка flush в OpenClaw
сьогодні живе на боці Gateway.

---

## Контрольний список усунення несправностей

- Неправильний ключ сесії? Почніть із [/concepts/session](/uk/concepts/session) і перевірте `sessionKey` у `/status`.
- Розбіжність між сховищем і транскриптом? Перевірте хост Gateway і шлях до сховища з `openclaw status`.
- Спам Compaction? Перевірте:
  - context window моделі (надто малий)
  - налаштування Compaction (`reserveTokens`, надто високий для context window моделі, може спричиняти раннішу Compaction)
  - роздування через tool-result: увімкніть/налаштуйте очищення сесій
- Витік тихих turns? Переконайтеся, що відповідь починається з `NO_REPLY` (точний токен, нечутливий до регістру) і що ви використовуєте збірку, яка містить виправлення для приглушення streaming.
