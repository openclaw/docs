---
read_when:
    - Робота над поведінкою WhatsApp/веб-каналу або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T04:18:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готовий до production через WhatsApp Web (Baileys). Gateway керує прив’язаними сеансами.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  plugin ще відсутній.
- Dev-канал + git checkout: за замовчуванням використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp` на поточному офіційному
  тегу релізу.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом релізу. Закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення.

У Windows WhatsApp plugin потребує Git у `PATH` під час npm install, оскільки
одна з його залежностей Baileys/libsignal завантажується з git URL. Встановіть
Git for Windows, потім перезапустіть оболонку й повторіть встановлення:

```powershell
winget install --id Git.Git -e
```

Portable Git також працює, якщо його каталог `bin` є в `PATH`.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та playbook-и виправлення.
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

    Щоб під’єднати наявний/користувацький каталог автентифікації WhatsApp Web перед входом:

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
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого варіанту, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist-и DM і межі маршрутизації
    - менша ймовірність плутанини із чатом із самим собою

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
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, зручну для чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти чату із самим собою спираються на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс прив’язаного пристрою не перезапускається лише через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але жодні повідомлення застосунку не обробляються протягом вікна watchdog; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний таймаут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping-ами застосунку WhatsApp Web, `connectTimeoutMs` керує таймаутом початкового handshake, а `defaultQueryTimeoutMs` керує таймаутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Групові надсилання додають нативні метадані згадок для токенів `@+<digits>` і `@<digits>` у тексті та підписах медіа, коли токен збігається з поточними метаданими учасників WhatsApp, включно з групами на базі LID.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси прив’язаного пристрою залишаються активними, доки транспортні кадри продовжують надходити, але зупинка транспорту примусово викликає повторне підключення задовго до пізнішого шляху віддаленого відключення.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; типове значення `main` згортає DM-и до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями з їхнім нативним JID `@newsletter`. Вихідні надсилання до newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику DM-сеансу.
- Транспорт WhatsApp Web враховує стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації proxy на рівні хоста замість налаштувань proxy WhatsApp, специфічних для каналу.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає ack-реакцію WhatsApp після доставки видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, телефонні номери,
ідентифікатори груп, імена відправників і поля кореляції сеансу. З цієї причини
WhatsApp не транслює вхідні payload-и хуку `message_received` до plugins,
якщо ви явно не погодитеся:

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

Можна обмежити згоду одним обліковим записом:

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

Умикайте це лише для plugins, яким ви довіряєте отримувати вхідний вміст повідомлень
WhatsApp та ідентифікатори.

## Контроль доступу та активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    `allowFrom` — це список контролю доступу для відправників DM. Він не обмежує явні вихідні надсилання до JID груп WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Подробиці поведінки під час виконання:

    - pairings зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та fallback для отримувачів Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення DM pairing не є неявними отримувачами Cron чи Heartbeat
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволено за замовчуванням
    - OpenClaw ніколи автоматично не виконує pairing для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Груповий доступ має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має збігатися з `groupAllowFrom` (або `*`)
       - `disabled`: блокує всі вхідні групові повідомлення

    Fallback allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується fallback до `allowFrom`, коли він доступний
    - allowlist-и відправників оцінюються перед активацією згадкою/відповіддю

    Примітка: якщо блока `channels.whatsapp` взагалі немає, fallback політики груп під час виконання — `allowlist` (із попереджувальним логом), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді за замовчуванням потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані шаблони regex згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправника
    - із `groupPolicy: "allowlist"` відправники не з allowlist все одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Особистий номер і поведінка чату із самим собою

Коли прив’язаний власний номер також присутній в `allowFrom`, активуються захисти чату WhatsApp із самим собою:

- пропускати підтвердження прочитання для ходів чату із самим собою
- ігнорувати поведінку автоматичного запуску mention-JID, яка інакше ping-ала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в чаті із самим собою за замовчуванням мають префікс `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp обгортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).
    Коли ціллю цитованої відповіді є медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й надає його як `MediaPath`/`MediaType`, щоб
    агент міг оглянути згадане зображення, а не бачив лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються із placeholder-ами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тож вимовлена згадка бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе одно не згадує бота, він
    зберігається в очікуваній історії групи замість сирого placeholder-а.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і деталі контактів/vCard рендеряться як fenced недовірені метадані, а не як inline-текст prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бот нарешті спрацює.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери інʼєкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Сповіщення про прочитання ввімкнені за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Перевизначення для окремого облікового запису:

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

    Ходи в чаті із самим собою пропускають сповіщення про прочитання, навіть коли вони ввімкнені глобально.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - ліміт фрагмента за замовчуванням: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною розбиття

  </Accordion>

  <Accordion title="Outbound media behavior">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payload-и
    - аудіомедіа надсилається через payload Baileys `audio` з `ptt: true`, тому клієнти WhatsApp відтворюють його як голосову нотатку push-to-talk
    - payload-и відповідей зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не в Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, транскодується за допомогою `ffmpeg` у 48 кГц моно Ogg/Opus перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload-ів відповіді з кількома медіа, крім голосових нотаток PTT: вони надсилають аудіо першим, а видимий текст окремо, оскільки клієнти WhatsApp не відображають підписи до голосових нотаток послідовно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/добір якості), щоб вкладатися в обмеження
    - у разі помилки надсилання медіа резервна поведінка для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                      |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                            |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

За замовчуванням: `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень       | Реакції підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                        | Жодних реакцій                                   |
| `"ack"`       | Так           | Ні                        | Лише реакції підтвердження (сповіщення перед відповіддю) |
| `"minimal"`   | Так           | Так (обережно)            | Підтвердження + реакції агента з обережними вказівками |
| `"extensive"` | Так           | Так (заохочується)        | Підтвердження + реакції агента із заохочувальними вказівками |

За замовчуванням: `"minimal"`.

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

WhatsApp підтримує негайні реакції підтвердження на вхідне отримання через `channels.whatsapp.ackReaction`.
Реакції підтвердження обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

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

- надсилаються негайно після прийняття вхідного повідомлення (до відповіді)
- помилки журналюються, але не блокують звичайну доставку відповіді
- режим групи `mentions` реагує на ходи, запущені згадкою; активація групи `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо він є, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів нормалізуються внутрішньо для пошуку

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків облікового запису за замовчуванням

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб повʼязана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням (вимикаються через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Симптом: стан каналу повідомляє, що його не повʼязано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Симптом: повʼязаний обліковий запис із повторними розривами зʼєднання або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли транспортна активність WhatsApp Web зупиняється, socket закривається або
    активність на рівні застосунку залишається тихою довше за довше захисне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги socket Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче тайм-ауту простою вашої мережі та збільшення
    `connectTimeoutMs` на повільних або ненадійних зʼєднаннях:

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

    Якщо `~/.openclaw/logs/whatsapp-health.log` містить `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    Gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які все ще викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, оскільки cron може не мати середовища systemd user-bus і
    змушувати цей старий скрипт неправильно повідомляти про стан Gateway.

    За потреби повторно повʼяжіть через `channels login`.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або розривом TLS socket.

    Вхід у WhatsApp Web використовує стандартне proxy-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти нижнім регістром і `NO_PROXY`). Перевірте, що процес Gateway успадковує proxy env і що `NO_PROXY` не відповідає `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущений, а обліковий запис повʼязано.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Рядки transcript фіксують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys повертає ідентифікатор вихідного повідомлення щонайменше для одного видимого текстового або медіа-надсилання.

    Реакції підтвердження є незалежними сповіщеннями перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіа-відповідь було прийнято WhatsApp.

    Перевірте журнали Gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають раніші, тому залишайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Bun runtime warning">
    Середовище виконання Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний зі стабільною роботою Gateway для WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія вирішення для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Пошук prompt потім виконується в отриманій єдиній мапі:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначений. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і системний prompt не застосовується.
2. **Wildcard системного prompt групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія вирішення для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Пошук prompt потім виконується в отриманій єдиній мапі:

1. **Системний промпт для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і системний промпт не застосовується.
2. **Wildcard системного промпту direct** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким bucket для перевизначення історії на рівні окремого DM (`dms.<id>.historyLimit`). Перевизначення промптів живуть у `direct`.
</Note>

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для тих, що не визначають власних `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і кореневий `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні групові або direct-промпти для кожного облікового запису окремо, визначайте повну мапу явно в кожному обліковому записі, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і allowlist груп на рівні чату. На кореневому рівні або в scope облікового запису `groups["*"]` означає "допущено всі групи" для цього scope.
- Додавайте wildcard групового `systemPrompt` лише тоді, коли ви вже хочете, щоб цей scope допускав усі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` як значення промпту за замовчуванням. Натомість повторіть промпт у кожному явно внесеному до allowlist записі групи.
- Допуск групи й авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть досягати обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправника все ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає конфігурацію direct-чату за замовчуванням після того, як DM уже допущено через `dmPolicy` плюс `allowFrom` або правила pairing-store.

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

Найважливіші поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сеансу: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
