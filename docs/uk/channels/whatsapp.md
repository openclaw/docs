---
read_when:
    - Робота з поведінкою каналу WhatsApp/вебканалу або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T21:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ce4696b9d055695e340be5d9570316f957118d1925af577783c27443e725056
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готово до production через WhatsApp Web (Baileys). Gateway керує пов'язаними сеансами.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити плагін WhatsApp під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  плагін ще не наявний.
- Dev-канал + git checkout: типово використовує локальний шлях плагіна.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`; оновлення beta-каналу
  віддають перевагу `@openclaw/whatsapp@beta`, коли цей тег доступний.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Використовуйте `@openclaw/whatsapp@beta`, коли стежите за beta-каналом OpenClaw і npmjs
показує `beta` попереду `latest`.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM — сполучення для невідомих відправників.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Налаштуйте політику доступу WhatsApp">

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

  <Step title="Під'єднайте WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб прикріпити наявний/власний каталог автентифікації WhatsApp Web перед входом:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Запустіть gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший запит на сполучення (якщо використовується режим сполучення)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити на сполучення спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого варіанта, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist DM і межі маршрутизації
    - нижча ймовірність плутанини із self-chat

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

  <Accordion title="Резервний варіант з особистим номером">
    Onboarding підтримує режим особистого номера й записує базовий варіант, дружній до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat базуються на пов'язаному власному номері та `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише WhatsApp Web">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі chat-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов'язаного пристрою не перезапускається тільки тому, що останнім часом ніхто не надсилав повідомлення. Довше обмеження тиші застосунку все ще примусово виконує повторне підключення, якщо транспортні фрейми продовжують надходити, але жодні повідомлення застосунку не обробляються протягом вікна watchdog; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлення для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping WhatsApp Web на рівні застосунку, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусу та трансляцій ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси пов'язаних пристроїв залишаються активними, доки тривають транспортні фрейми, але збій транспорту примусово виконує повторне підключення задовго до пізнішого шляху віддаленого відключення.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; типове `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями зі своїм нативним JID `@newsletter`. Вихідні надсилання до newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику DM-сеансу.
- Транспорт WhatsApp Web поважає стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу конфігурації proxy на рівні хоста замість налаштувань proxy WhatsApp, специфічних для каналу.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає ack-реакцію WhatsApp після доставки видимої відповіді.

## Plugin hooks і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload `message_received` hook до плагінів,
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

Увімкніть це лише для плагінів, яким довіряєте отримувати вміст і
ідентифікатори вхідних повідомлень WhatsApp.

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    `allowFrom` — це список контролю доступу відправників DM. Він не обмежує явні вихідні надсилання до JID груп WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - сполучення зберігаються в allow-store каналу й об'єднуються з налаштованим `allowFrom`
    - запланована автоматизація та fallback отримувачів heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення DM-сполучення не є неявними отримувачами cron чи heartbeat
    - якщо allowlist не налаштовано, пов'язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не створює сполучення для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов'язаного пристрою)

  </Tab>

  <Tab title="Політика груп + allowlist">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` наявний, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників груп** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі групові вхідні повідомлення

    Fallback allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання fallback переходить до `allowFrom`, коли доступно
    - allowlist відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блока `channels.whatsapp` взагалі немає, fallback політики груп під час виконання — `allowlist` (із warning-log), навіть якщо `channels.defaults.groupPolicy` задано.

  </Tab>

  <Tab title="Згадки + /activation">
    Групові відповіді типово потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних voice-note для авторизованих групових повідомлень
    - неявне виявлення reply-to-bot (відправник відповіді відповідає ідентичності бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє вимогу згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли пов'язаний власний номер також присутній у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку auto-trigger mention-JID, яка інакше ping-нула б вас
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідна оболонка + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються у спільну вхідну оболонку.

    Якщо існує процитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).
    Коли ціль процитованої відповіді — медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й надає як `MediaPath`/`MediaType`, щоб
    агент міг оглянути згадане зображення, а не бачити лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Медіа-заповнювачі та витягнення location/contact">
    Вхідні повідомлення лише з медіа нормалізуються із заповнювачами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові voice notes транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тож вимовлена згадка бота в voice note може
    викликати відповідь. Якщо транскрипт усе ще не згадує бота, транскрипт
    зберігається в очікуваній історії групи замість сирого заповнювача.

    Тіла location використовують стислий текст координат. Мітки/коментарі location і деталі contact/vCard відображаються як fenced untrusted metadata, а не inline prompt text.

  </Accordion>

  <Accordion title="Ін'єкція очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бот нарешті активується.

    - типове обмеження: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін'єкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts типово ввімкнені для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи в чаті із самим собою пропускають сповіщення про прочитання, навіть коли їх увімкнено глобально.

  </Accordion>
</AccordionGroup>

## Доставка, фрагментація та медіа

<AccordionGroup>
  <Accordion title="Фрагментація тексту">
    - стандартний ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечної за довжиною фрагментації

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payload
    - аудіомедіа надсилається через Baileys `audio` payload з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - payload відповіді зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому PTT-шляху, навіть коли provider повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, включно з виводом Microsoft Edge TTS MP3/WebM, перекодовується за допомогою `ffmpeg` у 48 кГц моно Ogg/Opus перед PTT-доставкою
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує авто-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload відповіді з кількома медіа, крім голосових нотаток PTT: для них спочатку надсилається аудіо, а видимий текст окремо, бо клієнти WhatsApp не відображають підписи до голосових нотаток стабільно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Ліміти розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебір якості), щоб укластися в ліміти
    - у разі помилки надсилання медіа резервний варіант для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповіді, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте ним за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                              |
| ----------- | ---------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                 |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                       |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                             |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Стандартне значення — `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко agent використовує emoji-реакції у WhatsApp:

| Рівень       | Реакції підтвердження | Реакції, ініційовані agent | Опис                                               |
| ------------ | --------------------- | -------------------------- | -------------------------------------------------- |
| `"off"`      | Ні                    | Ні                         | Жодних реакцій                                     |
| `"ack"`      | Так                   | Ні                         | Лише реакції підтвердження (підтвердження перед відповіддю) |
| `"minimal"`  | Так                   | Так (обережно)             | Підтвердження + реакції agent з обережними настановами |
| `"extensive"` | Так                  | Так (заохочується)         | Підтвердження + реакції agent із заохочувальними настановами |

Стандартно: `"minimal"`.

Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp підтримує негайні реакції підтвердження при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Реакції підтвердження залежать від `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

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

Примітки щодо поведінки:

- надсилаються негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки журналюються, але не блокують нормальну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; групова активація `always` діє як обхід для цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та стандартні значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - стандартний вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (відсортовано)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла стандартна автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків стандартного облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов’язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів agent включає дію реакції WhatsApp (`react`).
- Обмежувачі дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені стандартно (вимикаються через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не пов’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл повторного підключення">
    Симптом: пов’язаний обліковий запис із повторюваними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлення; watchdog
    перезапускається, коли зупиняється активність транспорту WhatsApp Web, сокет закривається або
    активність на рівні застосунку лишається беззвучною довше за подовжене вікно безпеки.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
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

    Якщо `~/.openclaw/logs/whatsapp-health.log` каже `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які все ще викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, бо cron може не мати середовища systemd user-bus і
    змушувати старий скрипт неправильно повідомляти про стан gateway.

    За потреби повторно пов’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес gateway успадковує проксі-env і що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено, а обліковий запис пов’язано.

  </Accordion>

  <Accordion title="Відповідь з’являється в transcript, але не у WhatsApp">
    Рядки transcript записують те, що згенерував agent. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys поверне ідентифікатор вихідного повідомлення принаймні для одного видимого текстового або медійного надсилання.

    Реакції підтвердження є незалежними підтвердженнями перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь було прийнято WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дублікати ключів в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому залишайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Wildcard системний prompt для групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Системний prompt для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Wildcard системний prompt для direct** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` лишається полегшеним контейнером перевизначень історії для кожного DM (`dms.<id>.historyLimit`). Перевизначення prompt розміщуються в `direct`.
</Note>

**Відмінність від поведінки кількох облікових записів Telegram:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у налаштуванні з кількома обліковими записами — навіть для облікових записів, які не визначають власних `groups`, — щоб запобігти отриманню ботом групових повідомлень із груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і кореневий `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У налаштуванні WhatsApp із кількома обліковими записами, якщо вам потрібні окремі групові або прямі промпти для кожного облікового запису, явно визначте повну мапу під кожним обліковим записом, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для кожної групи та списком дозволених груп на рівні чату. На кореневому рівні або в межах облікового запису `groups["*"]` означає «усі групи дозволені» для цієї області.
- Додавайте груповий wildcard `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область дозволяла всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` для типового промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників усе ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами сховища спарювання.

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

## Вказівники довідника конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Важливі поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставлення: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сеансу: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Спарювання](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
