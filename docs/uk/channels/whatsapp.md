---
read_when:
    - Робота з поведінкою каналів WhatsApp/веб або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставлення та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T21:58:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Статус: готово до production через WhatsApp Web (Baileys). Gateway володіє пов’язаними сеансами.

## Встановлення (за потреби)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  plugin ще немає.
- Канал розробки + git checkout: за замовчуванням використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp` на поточному офіційному
  тезі релізу.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом релізу. Закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для невідомих відправників — pairing.
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

    Щоб підключити наявний або власний каталог автентифікації WhatsApp Web перед входом:

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
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу й потік налаштування оптимізовані для такого сценарію, але сценарії з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlists DM і межі маршрутизації
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
    Онбординг підтримує режим особистого номера й записує базову конфігурацію, зручну для self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі chat-channel немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних app-message, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довше обмеження application-silence все ще примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але протягом вікна watchdog не обробляються повідомлення застосунку; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка application-silence використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Часові параметри сокета Baileys явно налаштовуються в `web.whatsapp.*`: `keepAliveIntervalMs` керує application pings WhatsApp Web, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних app-message: тихі сеанси пов’язаних пристроїв залишаються активними, доки тривають транспортні кадри, але зупинка транспорту примушує повторне підключення значно раніше за пізніший шлях віддаленого відключення.
- Прямі чати використовують правила сеансів DM (`session.dmScope`; стандартне `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями зі своїм нативним JID `@newsletter`. Вихідні надсилання newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику сеансів DM.
- Транспорт WhatsApp Web поважає стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу proxy-конфігурації на рівні хоста, а не специфічним для каналу налаштуванням proxy WhatsApp.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає реакцію ack у WhatsApp після доставки видимої відповіді.

## Plugin hooks і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload hook `message_received` до plugins,
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

Можна обмежити opt-in одним обліковим записом:

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

Увімкніть це лише для plugins, яким ви довіряєте отримувати вміст і ідентифікатори
вхідних повідомлень WhatsApp.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    `allowFrom` — це список контролю доступу відправників DM. Він не обмежує явні вихідні надсилання до JID груп WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над стандартними значеннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - pairings зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та резервний вибір отримувачів Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення DM pairing не є неявними отримувачами cron чи heartbeat
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено за замовчуванням
    - OpenClaw ніколи автоматично не pair вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні групові повідомлення

    Резервний варіант allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlists відправників оцінюються до активації через mention/reply

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервна групова політика runtime — `allowlist` (із warning log), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді за замовчуванням потребують mention.

    Виявлення mention включає:

    - явні mentions WhatsApp ідентичності бота
    - налаштовані шаблони regex для mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних voice-note для авторизованих групових повідомлень
    - неявне виявлення reply-to-bot (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - quote/reply лише задовольняє mention gating; він **не** надає авторизацію відправника
    - з `groupPolicy: "allowlist"` відправники не з allowlist усе одно блокуються, навіть якщо відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Доступ обмежено власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються запобіжники WhatsApp self-chat:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку автоматичного запуску mention-JID, яка інакше ping себе
- якщо `messages.responsePrefix` не задано, відповіді self-chat за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp загортаються в спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).
    Коли ціль цитованої відповіді — медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й надає його як `MediaPath`/`MediaType`, щоб
    агент міг переглянути згадане зображення, а не бачити лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються з placeholders, як-от:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові voice notes транскрибуються до mention gating, коли
    тіло містить лише `<media:audio>`, тож вимова mention бота у voice note може
    запустити відповідь. Якщо транскрипт усе ще не згадує бота, його
    зберігають в історії очікуваних групових повідомлень замість сирого placeholder.

    Тіла location використовують стислий текст координат. Мітки/коментарі location і деталі contact/vCard відображаються як fenced untrusted metadata, а не inline prompt text.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й вставлятися як контекст, коли бот нарешті запускається.

    - стандартний ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts увімкнені за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи в чаті із самим собою не надсилають сповіщення про прочитання, навіть коли їх увімкнено глобально.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на фрагменти">
    - стандартне обмеження фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною розбиття на фрагменти

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payload-и
    - аудіомедіа надсилається через payload `audio` Baileys із `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - payload-и відповідей зберігають `audioAsVoice`; вивід голосових нотаток TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload-ів відповідей із кількома медіа, крім голосових нотаток PTT: вони спочатку надсилають аудіо, а видимий текст окремо, бо клієнти WhatsApp не завжди стабільно відображають підписи до голосових нотаток
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб вкластися в обмеження
    - у разі помилки надсилання медіа резервна поведінка для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                  |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                        |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                              |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Стандартно: `"off"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                           |
| ------------- | ----------- | ---------------------------- | ---------------------------------------------- |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                 |
| `"ack"`       | Так         | Ні                           | Лише Ack-реакції (сповіщення перед відповіддю) |
| `"minimal"`   | Так         | Так (обережно)               | Ack + реакції агента з обережними настановами  |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними настановами |

Стандартно: `"minimal"`.

Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

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
Ack-реакції обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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

- надсилається негайно після прийняття вхідного повідомлення (до відповіді)
- помилки записуються в журнал, але не блокують нормальну доставку відповіді
- режим групи `mentions` реагує на ходи, запущені згадкою; активація групи `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та стандартні значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - стандартний вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (відсортовано)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими версіями">
    - поточний шлях авторизації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла стандартна авторизація в `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків стандартного облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан авторизації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов’язаний сеанс не продовжував отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах авторизації `oauth.json` зберігається, а файли авторизації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнено стандартно (вимикайте через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: стан каналу повідомляє, що його не пов’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл повторного підключення">
    Симптом: пов’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлення; watchdog
    перезапускається, коли зупиняється активність транспорту WhatsApp Web, socket закривається або
    активність рівня застосунку лишається тихою понад довше безпечне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги socket Baileys у `web.whatsapp`. Почніть зі скорочення
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
    Gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, бо cron може не мати середовища користувацької шини systemd і
    змушувати старий скрипт неправильно повідомляти стан Gateway.

    За потреби повторно пов’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS socket.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує proxy env і що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису не існує активного слухача gateway.

    Переконайтеся, що gateway запущено й обліковий запис пов’язано.

  </Accordion>

  <Accordion title="Відповідь з’являється в transcript, але не у WhatsApp">
    Рядки transcript записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys поверне ідентифікатор вихідного повідомлення для принаймні одного видимого текстового або медіанадсилання.

    Ack-реакції є незалежними сповіщеннями перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь прийняв WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дублікати ключів в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` на область

  </Accordion>

  <Accordion title="Попередження runtime Bun">
    Runtime gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власні `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Груповий системний prompt** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний prompt не застосовується.
2. **Груповий wildcard-системний prompt** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власні `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук prompt виконується на отриманій єдиній мапі:

1. **Прямий системний prompt** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний prompt не застосовується.
2. **Прямий wildcard-системний prompt** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення prompt живуть у `direct`.
</Note>

**Відмінність від поведінки кількох акаунтів у Telegram:** У Telegram кореневий `groups` навмисно пригнічується для всіх акаунтів у налаштуванні з кількома акаунтами — навіть для акаунтів, які не визначають власних `groups`, — щоб бот не отримував групові повідомлення з груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і кореневий `direct` завжди успадковуються акаунтами, які не визначають перевизначення на рівні акаунта, незалежно від того, скільки акаунтів налаштовано. У налаштуванні WhatsApp із кількома акаунтами, якщо вам потрібні групові або прямі промпти для кожного акаунта окремо, явно визначте повну мапу під кожним акаунтом, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для кожної групи та списком дозволених груп на рівні чату. На кореневому рівні або в межах акаунта `groups["*"]` означає «усі групи допускаються» для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` для промпта за замовчуванням. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи й авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити в обробку груп, але сам по собі він не авторизує кожного відправника в цих групах. Доступ відправників усе ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для особистих повідомлень. `direct["*"]` лише надає конфігурацію за замовчуванням для прямого чату після того, як особисте повідомлення вже допущено через `dmPolicy` разом із `allowFrom` або правилами сховища сполучень.

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

Найважливіші поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька акаунтів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні акаунта
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
