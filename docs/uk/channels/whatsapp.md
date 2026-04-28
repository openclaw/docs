---
read_when:
    - Робота над поведінкою WhatsApp/веб-каналу або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставлення та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-28T13:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec5dc5c600cd151bb4c8b05827e7c8516f9db79f4170d11ff15073160f410671
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: готово до production через WhatsApp Web (Baileys). Gateway керує пов’язаними сесіями.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити WhatsApp Plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік встановлення, коли
  Plugin ще відсутній.
- Канал розробки + git checkout: типово використовує локальний шлях Plugin.
- Stable/Beta: типово використовує npm-пакет `@openclaw/whatsapp`.

Ручне встановлення лишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM для невідомих відправників — pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб під’єднати наявний/власний каталог автентифікації WhatsApp Web перед входом:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити pairing спливають через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та потік налаштування оптимізовані для такого сценарію, але сценарії з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist DM і межі маршрутизації
    - менша ймовірність плутанини із self-chat

    Мінімальний шаблон політики:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом перепідключення.
- Watchdog перепідключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тиха сесія пов’язаного пристрою не перезапускається лише через те, що останнім часом ніхто не надсилав повідомлення. Довший ліміт мовчання застосунку все одно примусово перепідключає, якщо транспортні кадри продовжують надходити, але жодні повідомлення застосунку не обробляються протягом вікна watchdog.
- Таймінги сокета Baileys явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping WhatsApp Web на рівні застосунку, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; типове `main` згортає DM у головну сесію агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста над специфічними для каналу налаштуваннями проксі WhatsApp.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає ack-реакцію WhatsApp після доставки видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сесій. З цієї причини
WhatsApp не транслює вхідні payload хуків `message_received` до plugins,
якщо ви явно не ввімкнете це:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Ви можете обмежити ввімкнення одним обліковим записом:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Вмикайте це лише для plugins, яким ви довіряєте отримувати вміст і
ідентифікатори вхідних повідомлень WhatsApp.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - pairings зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не створює pairing для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` наявний, він працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групах** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має збігатися з `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі групові вхідні повідомлення

    Резервний allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlists відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, резервна групова політика runtime — `allowlist` (із попередженням у журналі), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді типово потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє gating згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати сповіщення про прочитання для ходів self-chat
- ігнорувати поведінку авто-тригера mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово мають префікс `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються із placeholder на кшталт:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед gating згадки, коли
    тіло містить лише `<media:audio>`, тому вимовлена згадка бота в голосовій нотатці може
    викликати відповідь. Якщо транскрипт усе ще не згадує бота,
    транскрипт зберігається в очікуваній груповій історії замість сирого placeholder.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і дані контакту/vCard відображаються як fenced ненадійні метадані, а не як inline prompt text.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися та вставлятися як контекст, коли бот нарешті спрацьовує.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Сповіщення про прочитання типово ввімкнені для прийнятих вхідних повідомлень WhatsApp.

    Вимкнути глобально:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Перевизначення для облікового запису:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Ходи self-chat пропускають сповіщення про прочитання, навіть коли вони ввімкнені глобально.

  </Accordion>
</AccordionGroup>

## Доставка, фрагментація та медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - типовий ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім повертається до фрагментації, безпечної за довжиною

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payloads
    - аудіомедіа надсилається через Baileys `audio` payload із `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - payloads відповідей зберігають `audioAsVoice`; вихідні голосові нотатки TTS для WhatsApp залишаються на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вихідні MP3/WebM від Microsoft Edge TTS, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payloads відповіді з кількома медіа, окрім голосових нотаток PTT: аудіо надсилається першим, а видимий текст окремо, оскільки клієнти WhatsApp не відображають підписи до голосових нотаток стабільно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та поведінка резервного варіанта">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремого акаунта використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебір якості), щоб уміститися в ліміти
    - у разі помилки надсилання медіа резервний варіант для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                 |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                       |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                             |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Типово: `"off"`. Перевизначення для окремого акаунта використовують `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Рівень реакцій

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує реакції emoji у WhatsApp:

| Рівень       | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                        | Жодних реакцій                                   |
| `"ack"`       | Так           | Ні                        | Лише Ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`   | Так           | Так (обережно)            | Ack + реакції агента з обережними настановами    |
| `"extensive"` | Так           | Так (заохочується)        | Ack + реакції агента із заохочувальними настановами |

Типово: `"minimal"`.

Перевизначення для окремого акаунта використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакції підтвердження

WhatsApp підтримує негайні Ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Нотатки щодо поведінки:

- надсилаються негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки записуються в журнал, але не блокують звичайну доставку відповіді
- режим групи `mentions` реагує на ходи, ініційовані згадкою; активація групи `always` діє як обхід для цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька акаунтів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір акаунта та типові значення">
    - ідентифікатори акаунтів надходять із `channels.whatsapp.accounts`
    - типовий вибір акаунта: `default`, якщо він є, інакше перший налаштований ідентифікатор акаунта (після сортування)
    - ідентифікатори акаунтів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілим режимом">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового акаунта

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього акаунта.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмежувачі дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені типово (вимкніть через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але від’єднано / цикл повторного підключення">
    Симптом: прив’язаний акаунт із повторними від’єднаннями або спробами повторного підключення.

    Тихі акаунти можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли транспортна активність WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається тихою довше за довше вікно безпеки.

    Якщо журнали показують повторні `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче тайм-ауту простою вашої мережі та збільшення
    `connectTimeoutMs` на повільних або нестабільних з’єднаннях:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби повторно прив’яжіть за допомогою `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується збоєм до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує env проксі та що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються збоєм, коли для цільового акаунта немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено, а акаунт прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження runtime Bun">
    Runtime Gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо акаунт визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується в отриманій єдиній мапі:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і системний промпт не застосовується.
2. **Wildcard-системний промпт групи** (`groups["*"].systemPrompt`): використовується, коли конкретного запису групи повністю немає в мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо акаунт визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується в отриманій єдиній мапі:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і системний промпт не застосовується.
2. **Wildcard-системний промпт прямого чату** (`direct["*"].systemPrompt`): використовується, коли конкретного запису peer повністю немає в мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються в `direct`.
</Note>

**Відмінність від поведінки кількох акаунтів Telegram:** У Telegram коренева `groups` навмисно пригнічується для всіх акаунтів у конфігурації з кількома акаунтами — навіть для акаунтів, які не визначають власну `groups`, — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і коренева `direct` завжди успадковуються акаунтами, які не визначають перевизначення на рівні акаунта, незалежно від кількості налаштованих акаунтів. У конфігурації WhatsApp з кількома акаунтами, якщо потрібні групові або прямі промпти для кожного акаунта, явно визначте повну мапу під кожним акаунтом, а не покладайтеся на кореневі типові значення.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для кожної групи та allowlist груп на рівні чату. На кореневому рівні або в області акаунта `groups["*"]` означає «усі групи дозволені» для цієї області.
- Додавайте wildcard-груповий `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як типове значення промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити в обробку груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправника все ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено за `dmPolicy` плюс `allowFrom` або правилами сховища парування.

Приклад:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Вказівники до довідки з конфігурації

Основна довідка:

- [Довідка з конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Найважливіші поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставлення: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сеансу: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- підказки: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
