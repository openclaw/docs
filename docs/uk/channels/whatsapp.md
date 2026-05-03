---
read_when:
    - Робота з поведінкою каналу WhatsApp/вебканалу або маршрутизацією вхідної скриньки
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T05:39:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готовий до production через WhatsApp Web (Baileys). Gateway володіє пов’язаними сеансами.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  plugin ще відсутній.
- Dev-канал + git checkout: стандартно використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp` на поточному офіційному
  тезі релізу.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Використовуйте пакет без версії, щоб слідувати за поточним офіційним тегом релізу. Закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та playbook-и відновлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналів.
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

    Запити pairing спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та потік налаштування оптимізовані для такого налаштування, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist-и DM і межі маршрутизації
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
    Onboarding підтримує режим особистого номера і записує базовий варіант, зручний для self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час runtime захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель runtime

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних app-message, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все ще примусово запускає повторне підключення, якщо транспортні кадри продовжують надходити, але протягом вікна watchdog не обробляються повідомлення застосунку; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний таймаут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує application ping-ами WhatsApp Web, `connectTimeoutMs` керує таймаутом початкового handshake, а `defaultQueryTimeoutMs` керує таймаутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Групові надсилання додають нативні метадані згадок для токенів `@+<digits>` і `@<digits>` у тексті та підписах медіа, коли токен відповідає поточним метаданим учасника WhatsApp, включно з групами на базі LID.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення стежить за активністю транспорту WhatsApp Web, а не лише за обсягом вхідних app-message: тихі сеанси пов’язаного пристрою залишаються активними, доки транспортні кадри продовжують надходити, але зупинка транспорту примусово запускає повторне підключення задовго до пізнішого шляху віддаленого від’єднання.
- Прямі чати використовують правила сеансу DM (`session.dmScope`; стандартне `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями зі своїм нативним JID `@newsletter`. Вихідні надсилання newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику сеансу DM.
- Транспорт WhatsApp Web поважає стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу проксі-конфігурації на рівні хоста, а не специфічним для каналу налаштуванням проксі WhatsApp.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає реакцію ack WhatsApp після доставлення видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, телефонні номери,
ідентифікатори груп, імена відправників і поля кореляції сеансу. Через це
WhatsApp не транслює вхідні payload-и hook `message_received` до plugins,
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

Умикайте це лише для plugins, яким ви довіряєте отримувати вміст і
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

    `allowFrom` — це список контролю доступу відправників DM. Він не блокує явні вихідні надсилання до JID груп WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Деталі поведінки runtime:

    - pairings зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та резервні отримувачі Heartbeat використовують явні цілі доставлення або налаштований `allowFrom`; схвалення DM pairing не є неявними отримувачами Cron чи Heartbeat
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не pairing-ить вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Груповий доступ має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправника групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокує всі групові вхідні повідомлення

    Резервна логіка allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlist-и відправників оцінюються перед активацією згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, runtime fallback групової політики — `allowlist` (із попереджувальним логом), навіть якщо `channels.defaults.groupPolicy` задано.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді типово потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних voice-note для авторизованих групових повідомлень
    - неявне виявлення reply-to-bot (відправник відповіді відповідає ідентичності бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє mention gating; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона owner-gated.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли пов’язаний власний номер також присутній в `allowFrom`, активуються запобіжники WhatsApp self-chat:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку auto-trigger за mention-JID, яка інакше ping-ила б вас
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

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).
    Коли ціль цитованої відповіді є медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й показує як `MediaPath`/`MediaType`, щоб
    агент міг оглянути згадане зображення, а не бачити лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються з placeholder-ами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові voice notes транскрибуються перед mention gating, коли
    тіло містить лише `<media:audio>`, тож вимовлена згадка бота у voice note може
    запустити відповідь. Якщо транскрипт усе ще не згадує бота, його
    зберігають в очікуваній груповій історії замість сирого placeholder-а.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і дані contact/vCard рендеряться як fenced недовірені метадані, а не inline-текст prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бота нарешті активовано.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

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

    Ходи в чаті із самим собою пропускають сповіщення про прочитання, навіть коли вони ввімкнені глобально.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на фрагменти">
    - типовий ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім переходить до безпечного за довжиною розбиття на фрагменти

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payloads
    - аудіомедіа надсилаються через payload Baileys `audio` з `ptt: true`, тому клієнти WhatsApp відображають їх як голосову нотатку push-to-talk
    - payloads відповідей зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, транскодується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та приглушує повторні надсилання тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payloads відповідей із кількома медіа, окрім голосових нотаток PTT: вони надсилають аудіо першим, а видимий текст окремо, оскільки клієнти WhatsApp не відображають підписи до голосових нотаток послідовно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебір якості), щоб відповідати лімітам
    - у разі помилки надсилання медіа резервний варіант для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                      |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                            |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Типово: `"off"`. Перевизначення для облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує емодзі-реакції у WhatsApp:

| Рівень        | Реакції підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------- | --------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні                    | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так                   | Ні                           | Лише реакції підтвердження (отримання перед відповіддю) |
| `"minimal"`   | Так                   | Так (обережно)               | Підтвердження + реакції агента з обережними вказівками |
| `"extensive"` | Так                   | Так (заохочується)           | Підтвердження + реакції агента із заохочувальними вказівками |

Типово: `"minimal"`.

Перевизначення для облікового запису використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp підтримує негайні реакції підтвердження на отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Реакції підтвердження обмежуються `reactionLevel` — вони приглушуються, коли `reactionLevel` дорівнює `"off"`.

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

- надсилається негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки записуються в журнал, але не блокують нормальну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; групова активація `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів надходять із `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілим форматом">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу з облікового запису">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спершу зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов’язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмежувачі дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені типово (вимкнути через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що він не пов’язаний.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл повторного підключення">
    Симптом: пов’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлення; сторожовий механізм
    перезапускається, коли транспортна активність WhatsApp Web припиняється, сокет закривається або
    активність на рівні застосунку залишається беззвучною довше за довше захисне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче тайм-ауту простою вашої мережі та збільшення
    `connectTimeoutMs` для повільних або нестабільних з’єднань:

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
    Gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, оскільки cron може не мати середовища user-bus systemd і
    змусити старий скрипт неправильно повідомляти про справність Gateway.

    За потреби повторно пов’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує змінні середовища проксі та що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущений і обліковий запис пов’язаний.

  </Accordion>

  <Accordion title="Відповідь з’являється в transcript, але не в WhatsApp">
    Рядки transcript записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys повертає ідентифікатор вихідного повідомлення хоча б для одного видимого текстового або медіанадсилання.

    Реакції підтвердження є незалежними отриманнями перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь прийняв WhatsApp.

    Перевірте журнали Gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначений. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard приглушується і системний prompt не застосовується.
2. **Системний prompt wildcard для групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Системний prompt для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис співрозмовника існує в мапі **і** його ключ `systemPrompt` визначений. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard приглушується і системний prompt не застосовується.
2. **Системний prompt wildcard для direct** (`direct["*"].systemPrompt`): використовується, коли конкретний запис співрозмовника повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення prompt розміщуються в `direct`.
</Note>

**Відмінність від поведінки мультиакаунтів Telegram:** У Telegram кореневий `groups` навмисно пригнічується для всіх акаунтів у налаштуванні з кількома акаунтами — навіть для акаунтів, які не визначають власних `groups`, — щоб бот не отримував групові повідомлення з груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і кореневий `direct` завжди успадковуються акаунтами, які не визначають перевизначення на рівні акаунта, незалежно від кількості налаштованих акаунтів. У налаштуванні WhatsApp із кількома акаунтами, якщо вам потрібні окремі групові або прямі промпти для кожного акаунта, явно визначте повну мапу для кожного акаунта замість того, щоб покладатися на стандартні значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є і мапою конфігурації для окремих груп, і allowlist груп на рівні чату. На кореневому рівні або в межах акаунта `groups["*"]` означає «допущено всі групи» для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` для стандартного промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити в обробку груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає стандартну конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` разом з `allowFrom` або правилами pairing-store.

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

## Вказівники до довідника конфігурації

Основна довідка:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- мультиакаунт: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні акаунта
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сеансу: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Pairing](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
