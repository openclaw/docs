---
read_when:
    - Пояснення того, як вхідні повідомлення перетворюються на відповіді
    - Уточнення сесій, режимів черги або поведінки streaming
    - Документування видимості міркувань і наслідків для використання
summary: Потік повідомлень, сесії, черга та видимість міркувань
title: Повідомлення
x-i18n:
    generated_at: "2026-04-23T20:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b1122b75f56083fee383095aa4838a0d62e5a83ae19eb52441859a2c1774ea8
    source_path: concepts/messages.md
    workflow: 15
---

Ця сторінка поєднує пояснення того, як OpenClaw обробляє вхідні повідомлення, сесії, чергу,
streaming і видимість міркувань.

## Потік повідомлень (високий рівень)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Ключові параметри конфігурації:

- `messages.*` для префіксів, черги та поведінки груп.
- `agents.defaults.*` для типових параметрів block streaming і chunking.
- Перевизначення каналів (`channels.whatsapp.*`, `channels.telegram.*` тощо) для лімітів і перемикачів streaming.

Повну схему див. у [Configuration](/uk/gateway/configuration).

## Усунення дублікатів вхідних повідомлень

Канали можуть повторно доставляти те саме повідомлення після перепідключень. OpenClaw зберігає
короткоживучий кеш із ключем channel/account/peer/session/message id, щоб повторні
доставки не запускали ще один агентний run.

## Debouncing вхідних повідомлень

Швидкі послідовні повідомлення від **того самого відправника** можуть об’єднуватися в один
хід агента через `messages.inbound`. Debouncing має область дії channel + conversation
і використовує найновіше повідомлення для threading/ID відповіді.

Конфігурація (глобальне типове значення + перевизначення для каналів):

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

- Debounce застосовується до **лише текстових** повідомлень; media/attachments скидаються негайно.
- Control-команди обходять debouncing, щоб залишатися окремими — **окрім** випадків, коли канал явно погоджується на same-sender DM coalescing (наприклад, [BlueBubbles `coalesceSameSenderDms`](/uk/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), де DM-команди очікують у вікні debounce, щоб payload, надісланий частинами, міг увійти до того самого ходу агента.

## Сесії та пристрої

Сесіями володіє gateway, а не клієнти.

- Приватні чати зводяться до ключа основної сесії агента.
- Групи/канали мають власні ключі сесій.
- Сховище сесій і транскрипти розміщуються на хості gateway.

Кілька пристроїв/каналів можуть зіставлятися з однією сесією, але історія не повністю
синхронізується назад до кожного клієнта. Рекомендація: використовуйте один основний пристрій для довгих
розмов, щоб уникнути розходження контексту. Control UI і TUI завжди показують
транскрипт сесії, що підтримується gateway, тому вони є джерелом істини.

Докладніше: [Session management](/uk/concepts/session).

## Вхідні тіла й контекст історії

OpenClaw розділяє **тіло prompt** і **тіло команди**:

- `Body`: текст prompt, надісланий агенту. Він може містити обгортки каналу та
  необов’язкові обгортки історії.
- `CommandBody`: сирий текст користувача для розбору директив/команд.
- `RawBody`: застарілий псевдонім для `CommandBody` (збережений для сумісності).

Коли канал надає історію, використовується спільна обгортка:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Для **непрямих чатів** (groups/channels/rooms) **тіло поточного повідомлення** має префікс з
міткою відправника (той самий стиль, що й для записів історії). Це забезпечує узгодженість
повідомлень у реальному часі та повідомлень із черги/історії в prompt агента.

Буфери історії є **лише pending**: вони включають групові повідомлення, які _не_
запустили run (наприклад, повідомлення зі шлюзом згадок) і **не включають** повідомлення,
які вже є в транскрипті сесії.

Вилучення директив застосовується лише до розділу **поточного повідомлення**, щоб історія
залишалася недоторканою. Канали, що обгортають історію, мають задавати `CommandBody` (або
`RawBody`) як початковий текст повідомлення, а `Body` зберігати як об’єднаний prompt.
Буфери історії налаштовуються через `messages.groupChat.historyLimit` (глобальне
типове значення) і перевизначення для каналів, такі як `channels.slack.historyLimit` або
`channels.telegram.accounts.<id>.historyLimit` (установіть `0`, щоб вимкнути).

## Черга й followup

Якщо run уже активний, вхідні повідомлення можна поставити в чергу, спрямувати в
поточний run або зібрати для ходу followup.

- Налаштовується через `messages.queue` (і `messages.queue.byChannel`).
- Режими: `interrupt`, `steer`, `followup`, `collect`, а також варіанти backlog.

Докладніше: [Queueing](/uk/concepts/queue).

## Streaming, chunking і batching

Block streaming надсилає часткові відповіді, коли модель створює текстові блоки.
Chunking враховує текстові ліміти каналу й уникає розбиття огородженого коду.

Основні параметри:

- `agents.defaults.blockStreamingDefault` (`on|off`, типово off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching на основі простою)
- `agents.defaults.humanDelay` (людиноподібна пауза між block replies)
- Перевизначення каналів: `*.blockStreaming` і `*.blockStreamingCoalesce` (канали, крім Telegram, вимагають явного `*.blockStreaming: true`)

Докладніше: [Streaming + chunking](/uk/concepts/streaming).

## Видимість міркувань і токени

OpenClaw може показувати або приховувати міркування моделі:

- `/reasoning on|off|stream` керує видимістю.
- Вміст міркувань все одно враховується у використанні токенів, якщо його створює модель.
- Telegram підтримує streaming міркувань у draft bubble.

Докладніше: [Thinking + reasoning directives](/uk/tools/thinking) і [Token use](/uk/reference/token-use).

## Префікси, threading і відповіді

Форматування вихідних повідомлень централізовано в `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` і `channels.<channel>.accounts.<id>.responsePrefix` (каскад вихідних префіксів), а також `channels.whatsapp.messagePrefix` (вхідний префікс WhatsApp)
- Threading відповідей через `replyToMode` і типові значення для каналів

Докладніше: [Configuration](/uk/gateway/configuration-reference#messages) і документація каналів.

## Тихі відповіді

Точний тихий токен `NO_REPLY` / `no_reply` означає «не доставляти видиму для користувача відповідь».
OpenClaw визначає цю поведінку за типом розмови:

- Прямі розмови типово не дозволяють тишу й переписують чисту тиху
  відповідь у короткий видимий fallback.
- Групи/канали типово дозволяють тишу.
- Внутрішня оркестрація типово дозволяє тишу.

Типові значення розміщені в `agents.defaults.silentReply` і
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` і
`surfaces.<id>.silentReplyRewrite` можуть перевизначати їх для кожної поверхні окремо.

Коли батьківська сесія має один або більше pending spawned subagent run,
чисті тихі відповіді відкидаються на всіх поверхнях замість переписування, щоб
батьківська сесія залишалася тихою, доки подія завершення дочірнього процесу не доставить справжню відповідь.

## Пов’язане

- [Streaming](/uk/concepts/streaming) — доставка повідомлень у реальному часі
- [Retry](/uk/concepts/retry) — поведінка повторних спроб доставки повідомлень
- [Queue](/uk/concepts/queue) — черга обробки повідомлень
- [Channels](/uk/channels) — інтеграції платформ обміну повідомленнями
