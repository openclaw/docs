---
read_when:
    - Пояснення того, як вхідні повідомлення перетворюються на відповіді
    - Уточнення сеансів, режимів постановки в чергу або поведінки потокової передачі
    - Документування видимості міркувань і наслідків використання
summary: Потік повідомлень, сеанси, постановка в чергу та видимість міркувань
title: Повідомлення
x-i18n:
    generated_at: "2026-05-06T01:09:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f4861a6d0af11174f8067e9c6d4afb1a8e54f1eb79484d6bbac28dc10b4cf88
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw обробляє вхідні повідомлення через конвеєр визначення сесії, постановки в чергу, streaming, виконання інструментів і видимості reasoning. Ця сторінка показує шлях від вхідного повідомлення до відповіді.

## Потік повідомлень (високий рівень)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Ключові параметри містяться в конфігурації:

- `messages.*` для префіксів, постановки в чергу та поведінки груп.
- `agents.defaults.*` для типових параметрів block streaming і chunking.
- Перевизначення каналів (`channels.whatsapp.*`, `channels.telegram.*` тощо) для обмежень і перемикачів streaming.

Повну схему див. у [Конфігурації](/uk/gateway/configuration).

## Дедуплікація вхідних повідомлень

Канали можуть повторно доставити те саме повідомлення після повторних підключень. OpenClaw зберігає
короткоживучий кеш із ключем за каналом/обліковим записом/співрозмовником/сесією/id повідомлення, щоб дубльовані
доставлення не запускали ще один agent run.

## Debouncing вхідних повідомлень

Швидкі послідовні повідомлення від **того самого відправника** можна об'єднати в один
хід агента через `messages.inbound`. Debouncing обмежений окремо для кожного каналу + розмови
і використовує найновіше повідомлення для reply threading/IDs.

Конфігурація (глобальне типове значення + перевизначення для окремих каналів):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Примітки:

- Debounce застосовується до повідомлень **лише з текстом**; медіа/вкладення надсилаються негайно.
- Керівні команди обходять debouncing, тому залишаються окремими — **крім** випадків, коли канал явно вмикає об'єднання DM від того самого відправника (наприклад, [BlueBubbles `coalesceSameSenderDms`](/uk/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), де DM-команди очікують у межах debounce-вікна, щоб розділено надіслане корисне навантаження могло приєднатися до того самого ходу агента.

## Сесії та пристрої

Сесіями володіє gateway, а не клієнти.

- Прямі чати згортаються в ключ основної сесії агента.
- Групи/канали отримують власні ключі сесій.
- Сховище сесій і транскрипти розташовані на хості gateway.

Кілька пристроїв/каналів можуть відповідати одній сесії, але історія не повністю
синхронізується назад до кожного клієнта. Рекомендація: використовуйте один основний пристрій для довгих
розмов, щоб уникнути розходження контексту. Control UI і TUI завжди показують
транскрипт сесії, підтриманий gateway, тому вони є джерелом істини.

Докладніше: [Керування сесіями](/uk/concepts/session).

## Метадані результату інструмента

`content` результату інструмента — це результат, видимий моделі. `details` результату інструмента — це
runtime-метадані для відтворення в UI, діагностики, доставлення медіа та plugins.

OpenClaw явно зберігає цю межу:

- `toolResult.details` вилучається перед provider replay і вхідними даними Compaction.
- Збережені транскрипти сесій залишають лише обмежені `details`; завеликі метадані
  замінюються стислим підсумком із позначкою `persistedDetailsTruncated: true`.
- Plugins та інструменти мають розміщувати текст, який модель повинна прочитати, у `content`, а не лише
  в `details`.

## Тіла вхідних повідомлень і контекст історії

OpenClaw розділяє **prompt body** і **command body**:

- `BodyForAgent`: основний текст для поточного повідомлення, призначений для моделі. Channel
  plugins мають тримати його зосередженим на поточному тексті відправника, що містить prompt.
- `Body`: застарілий fallback для prompt. Він може містити оболонки каналу та
  необов'язкові обгортки історії, але поточні канали не мають покладатися на нього як на
  основний вхід моделі, коли доступний `BodyForAgent`.
- `CommandBody`: сирий текст користувача для розбору directive/command.
- `RawBody`: застарілий псевдонім для `CommandBody` (збережено для сумісності).

Коли канал надає історію, він використовує спільну обгортку:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Для **непрямих чатів** (груп/каналів/кімнат) до **тіла поточного повідомлення** додається префікс із
міткою відправника (у тому самому стилі, що використовується для записів історії). Це зберігає узгодженість real-time і queued/history
повідомлень у prompt агента.

Буфери історії є **лише очікуваними**: вони містять групові повідомлення, які _не_
запустили run (наприклад, повідомлення з mention gate), і **виключають** повідомлення,
які вже є в транскрипті сесії.

Вилучення directives застосовується лише до секції **поточного повідомлення**, щоб історія
залишалася неушкодженою. Канали, які обгортають історію, мають задавати `CommandBody` (або
`RawBody`) як оригінальний текст повідомлення та залишати `Body` як об'єднаний prompt.
Структурована історія, відповіді, переслані повідомлення та метадані каналу відтворюються як
ненадійні context blocks з роллю user під час складання prompt.
Буфери історії налаштовуються через `messages.groupChat.historyLimit` (глобальне
типове значення) і перевизначення для окремих каналів, як-от `channels.slack.historyLimit` або
`channels.telegram.accounts.<id>.historyLimit` (установіть `0`, щоб вимкнути).

## Постановка в чергу та followups

Якщо run уже активний, вхідні повідомлення можна поставити в чергу, спрямувати в
поточний run або зібрати для followup-ходу.

- Налаштовується через `messages.queue` (і `messages.queue.byChannel`).
- Типовий режим — `steer`, із 500ms followup debounce, коли steering повертається
  до доставлення queued followup.
- Режими: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` і
  застарілий режим по одному за раз `queue`.

Докладніше: [Черга команд](/uk/concepts/queue) і [Steering queue](/uk/concepts/queue-steering).

## Володіння run каналом

Channel plugins можуть зберігати порядок, debounce вхідні дані та застосовувати transport
backpressure перед тим, як повідомлення потрапить у чергу сесії. Вони не мають накладати
окремий timeout навколо самого ходу агента. Щойно повідомлення маршрутизовано до
сесії, довготривала робота керується сесією, інструментом і runtime
lifecycle, щоб усі канали узгоджено повідомляли про повільні ходи й відновлювалися після них.

## Streaming, chunking і batching

Block streaming надсилає часткові відповіді, коли модель створює текстові блоки.
Chunking враховує текстові обмеження каналу й уникає розділення fenced code.

Ключові налаштування:

- `agents.defaults.blockStreamingDefault` (`on|off`, типово off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching на основі idle)
- `agents.defaults.humanDelay` (пауза, схожа на людську, між block replies)
- Перевизначення каналів: `*.blockStreaming` і `*.blockStreamingCoalesce` (канали, що не є Telegram, потребують явного `*.blockStreaming: true`)

Докладніше: [Streaming + chunking](/uk/concepts/streaming).

## Видимість reasoning і tokens

OpenClaw може показувати або приховувати reasoning моделі:

- `/reasoning on|off|stream` керує видимістю.
- Reasoning content усе одно враховується у використанні tokens, коли його створює модель.
- Telegram підтримує reasoning stream у тимчасову бульбашку чернетки, яку видаляють після фінального доставлення; використовуйте `/reasoning on` для постійного виводу reasoning.

Докладніше: [Thinking + reasoning directives](/uk/tools/thinking) і [Використання tokens](/uk/reference/token-use).

## Префікси, threading і відповіді

Форматування вихідних повідомлень централізовано в `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` і `channels.<channel>.accounts.<id>.responsePrefix` (каскад вихідних префіксів), а також `channels.whatsapp.messagePrefix` (вхідний префікс WhatsApp)
- Reply threading через `replyToMode` і типові значення для окремих каналів

Докладніше: [Конфігурація](/uk/gateway/config-agents#messages) і документація каналів.

## Тихі відповіді

Точний silent token `NO_REPLY` / `no_reply` означає «не доставляти відповідь, видиму користувачеві».
Коли хід також має pending tool media, як-от згенероване TTS-аудіо, OpenClaw
вилучає silent text, але все одно доставляє медіавкладення.
OpenClaw визначає цю поведінку за типом розмови:

- Прямі розмови типово забороняють silence і переписують bare silent
  reply на короткий видимий fallback.
- Групи/канали типово дозволяють silence.
- Внутрішня orchestration типово дозволяє silence.

OpenClaw також використовує silent replies для внутрішніх збоїв runner, які трапляються
до будь-якої відповіді assistant у непрямих чатах, тому групи/канали не бачать
шаблонний текст помилки gateway. Прямі чати типово показують стислий текст збою;
сирі деталі runner показуються лише тоді, коли `/verbose` має значення `on` або `full`.

Типові значення містяться в `agents.defaults.silentReply` і
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` і
`surfaces.<id>.silentReplyRewrite` можуть перевизначати їх для кожної surface.

Коли батьківська сесія має один або кілька pending spawned subagent runs, bare
silent replies відкидаються на всіх surfaces замість переписування, тому
parent залишається тихим, доки подія завершення child не доставить справжню відповідь.

## Пов'язане

- [Рефакторинг життєвого циклу повідомлень](/uk/concepts/message-lifecycle-refactor) - цільовий durable send and receive design
- [Streaming](/uk/concepts/streaming) — доставлення повідомлень у реальному часі
- [Retry](/uk/concepts/retry) — поведінка повторних спроб доставлення повідомлень
- [Queue](/uk/concepts/queue) — черга обробки повідомлень
- [Канали](/uk/channels) — інтеграції з платформами обміну повідомленнями
