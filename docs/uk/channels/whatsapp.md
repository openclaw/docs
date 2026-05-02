---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби керування доступом, поведінка доставки та операційні процедури
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Статус: готовий до production через WhatsApp Web (Baileys). Gateway керує прив’язаними сеансами.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  plugin ще відсутній.
- Dev channel + git checkout: типово використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли актуальний пакет
  опубліковано.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий або відсутній, використовуйте
актуальну пакетовану збірку OpenClaw або локальний checkout, доки ланцюг npm-пакетів
не наздожене.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з виправлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналу.
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

    Запити pairing спливають через 1 годину. Очікувані запити обмежено до 3 на канал.

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

    Під час виконання захисти self-chat спираються на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    Окремого каналу повідомлень Twilio WhatsApp у вбудованому реєстрі чат-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє WhatsApp socket і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс прив’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але протягом вікна watchdog не обробляються повідомлення застосунку; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Таймінги Baileys socket явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping WhatsApp Web застосунку, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення стежить за активністю транспорту WhatsApp Web, а не лише за обсягом вхідних повідомлень застосунку: тихі сеанси прив’язаних пристроїв залишаються активними, доки транспортні кадри продовжують надходити, але зупинка транспорту примушує повторне підключення задовго до пізнішого шляху віддаленого від’єднання.
- Прямі чати використовують правила сеансів DM (`session.dmScope`; типове `main` згортає DM у головний сеанс агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями зі своїм нативним JID `@newsletter`. Вихідні надсилання до newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику сеансів DM.
- Транспорт WhatsApp Web поважає стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу конфігурації proxy на рівні хоста, а не специфічним для каналу налаштуванням proxy WhatsApp.
- Коли ввімкнено `messages.removeAckAfterReply`, OpenClaw очищає реакцію ack у WhatsApp після доставки видимої відповіді.

## Plugin hooks і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload `message_received` hook до plugins,
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

Можна обмежити ввімкнення одним обліковим записом:

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

Вмикайте це лише для plugins, яким ви довіряєте отримувати вміст і ідентифікатори
вхідних повідомлень WhatsApp.

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

    Деталі поведінки під час виконання:

    - pairings зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація і fallback одержувачів Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення DM pairing не є неявними одержувачами Cron чи Heartbeat
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не створює pairing для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, всі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення груп

    Fallback allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується fallback до `allowFrom`, коли він доступний
    - allowlists відправників оцінюються перед активацією через згадку/відповідь

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, fallback політики груп під час виконання — `allowlist` (із warning log), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Відповіді в групах типово потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти voice-note для авторизованих групових повідомлень
    - неявне виявлення reply-to-bot (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - quote/reply лише задовольняє gating за згадкою; він **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники, яких немає в allowlist, усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати read receipts для turns self-chat
- ігнорувати поведінку автоматичного запуску mention-JID, яка інакше пінгувала б вас
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово мають префікс `[{identity.name}]` або `[openclaw]`

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
    Коли ціль цитованої відповіді — медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа та показує як `MediaPath`/`MediaType`, щоб
    агент міг переглянути згадане зображення, а не бачив лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються з placeholders, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові voice notes транскрибуються перед gating за згадкою, коли
    body містить лише `<media:audio>`, тому вимовляння згадки бота у voice note може
    запустити відповідь. Якщо транскрипт усе ще не згадує бота,
    транскрипт зберігається в очікуваній історії групи замість сирого placeholder.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і деталі контакту/vCard відображаються як fenced недовірені метадані, а не inline текст prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися та вставлятися як контекст, коли бота нарешті запускають.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

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

    Повороти самочату пропускають сповіщення про прочитання, навіть коли їх увімкнено глобально.

  </Accordion>
</AccordionGroup>

## Доставка, поділ на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Поділ тексту на фрагменти">
    - стандартний ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім переходить до безпечного за довжиною поділу на фрагменти

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payload-и
    - аудіомедіа надсилається через Baileys payload `audio` з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - payload-и відповідей зберігають `audioAsVoice`; вихід голосової нотатки TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вихід Microsoft Edge TTS MP3/WebM, транскодується через `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує auto-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload-ів відповіді з кількома медіа, окрім голосових нотаток PTT: для них спочатку надсилається аудіо, а видимий текст окремо, бо клієнти WhatsApp не відображають підписи голосових нотаток стабільно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в ліміти
    - у разі помилки надсилання медіа резервна поведінка для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                           |
| ----------- | ------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення              |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                    |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                          |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Типово: `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                                |
| ------------- | ----------- | ---------------------------- | --------------------------------------------------- |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                      |
| `"ack"`       | Так         | Ні                           | Лише Ack-реакції (квитанція перед відповіддю)       |
| `"minimal"`   | Так         | Так (консервативно)          | Ack + реакції агента з консервативними вказівками   |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними вказівками  |

Типово: `"minimal"`.

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

WhatsApp підтримує негайні Ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — їх пригнічено, коли `reactionLevel` дорівнює `"off"`.

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
- груповий режим `mentions` реагує на повороти, спричинені згадкою; активація групи `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та стандартні значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - стандартний вибір облікового запису: `default`, якщо він присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів нормалізуються внутрішньо для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла стандартна автентифікація в `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків стандартного облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов'язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента охоплює дію реакції WhatsApp (`react`).
- Обмежувачі дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнено типово (вимикається через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов'язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що він не пов'язаний.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов'язано, але від'єднано / цикл повторного підключення">
    Симптом: пов'язаний обліковий запис із повторними від'єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли транспортна активність WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається беззвучною довше за довше вікно безпеки.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче тайм-ауту простою вашої мережі та збільшення
    `connectTimeoutMs` на повільних або нестабільних з'єднаннях:

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

    Якщо `~/.openclaw/logs/whatsapp-health.log` повідомляє `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи через
    `crontab -e`, бо cron може не мати середовища користувацької шини systemd і
    змушувати старий скрипт хибно звітувати про стан gateway.

    За потреби повторно пов'яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід через QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від'єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес gateway успадковує проксі-змінні середовища і що `NO_PROXY` не відповідає `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущений, а обліковий запис пов'язано.

  </Accordion>

  <Accordion title="Відповідь є у транскрипті, але не у WhatsApp">
    Рядки транскрипту записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys повертає ідентифікатор вихідного повідомлення принаймні для одного видимого текстового або медіа-надсилання.

    Ack-реакції є незалежними квитанціями перед відповіддю. Успішна реакція не доводить, що пізніша текстова або медіа-відповідь була прийнята WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому залишайте один `groupPolicy` на кожну область

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв'язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Wildcard-системний промпт групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв'язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис співрозмовника існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Wildcard-системний промпт прямого чату** (`direct["*"].systemPrompt`): використовується, коли конкретний запис співрозмовника повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються в `direct`.
</Note>

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у налаштуванні з кількома обліковими записами — навіть для облікових записів, які не визначають власних `groups`, — щоб бот не отримував групові повідомлення з груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і кореневий `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У налаштуванні WhatsApp з кількома обліковими записами, якщо потрібні окремі для кожного облікового запису групові або прямі підказки, явно визначайте повну мапу в кожному обліковому записі, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є і мапою конфігурації для кожної групи, і дозвільним списком груп на рівні чату. У кореневій області або області облікового запису `groups["*"]` означає "усі групи допускаються" для цієї області.
- Додавайте груповий символ узагальнення `systemPrompt` лише тоді, коли вже потрібно, щоб ця область допускала всі групи. Якщо все ще потрібно, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` як типову підказку. Натомість повторіть підказку в кожному явно дозволеному записі групи.
- Допуск групи й авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для приватних повідомлень. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як приватне повідомлення вже допущено правилами `dmPolicy` плюс `allowFrom` або сховища сполучень.

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

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Поля WhatsApp з високою цінністю сигналу:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- підказки: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація між агентами](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
