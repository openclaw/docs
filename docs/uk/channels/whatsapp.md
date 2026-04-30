---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T02:42:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готовий до продакшену через WhatsApp Web (`Baileys`). Gateway керує пов’язаними сеансами.

## Встановлення (на вимогу)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити Plugin WhatsApp під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  Plugin ще відсутній.
- Канал розробки + git checkout: типово використовує локальний шлях Plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли актуальний пакет
  опубліковано.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий або відсутній, використовуйте
актуальну упаковану збірку OpenClaw або локальний checkout, доки черга npm-пакетів
не наздожене зміни.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — сполучення для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та інструкції з відновлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони конфігурації каналів і приклади.
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

    Запити на сполучення спливають через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такої схеми, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist DM і межі маршрутизації
    - нижча ймовірність плутанини із чатом із самим собою

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
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, зручну для чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти для чату із самим собою спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається лише через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але повідомлення застосунку не обробляються протягом вікна watchdog; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping-запитами застосунку WhatsApp Web, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Статусні та broadcast-чати ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні кадри продовжують надходити, але зупинка транспорту примушує повторне підключення задовго до пізнішого шляху віддаленого від’єднання.
- Прямі чати використовують правила сеансів DM (`session.dmScope`; типове значення `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web поважає стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста над налаштуваннями проксі WhatsApp для окремого каналу.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає реакцію підтвердження WhatsApp після доставки видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload хуків `message_received` до plugins,
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

Увімкніть це лише для plugins, яким ви довіряєте отримувати вміст вхідних повідомлень
WhatsApp та ідентифікатори.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими налаштуваннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - сполучення зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, зв’язаний власний номер дозволено за замовчуванням
    - OpenClaw ніколи автоматично не сполучає вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі зі зв’язаного пристрою)

  </Tab>

  <Tab title="Політика груп + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, придатні всі групи
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокує всі вхідні повідомлення груп

    Резервний варіант allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlists відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервна групова політика runtime — `allowlist` (із журналюванням попередження), навіть якщо `channels.defaults.groupPolicy` задано.

  </Tab>

  <Tab title="Згадки + /activation">
    Групові відповіді за замовчуванням потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді відповідає ідентичності бота)

    Примітка з безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації рівня сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та чату із собою

Коли зв’язаний власний номер також присутній у `allowFrom`, активуються запобіжники WhatsApp для чату із собою:

- пропускати сповіщення про прочитання для ходів чату із собою
- ігнорувати поведінку автозапуску за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в чаті із собою за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний envelope + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Плейсхолдери медіа та витягування місцезнаходження/контактів">
    Вхідні повідомлення лише з медіа нормалізуються з плейсхолдерами, як-от:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тож промовлена згадка бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе одно не згадує бота, він
    зберігається в очікуваній історії групи замість сирого плейсхолдера.

    Тіла місцезнаходження використовують стислий текст координат. Мітки/коментарі місцезнаходження та дані контакту/vCard відтворюються як fenced ненадійні метадані, а не як вбудований текст промпта.

  </Accordion>

  <Accordion title="Вставлення очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися та вставлятися як контекст, коли бот нарешті запускається.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Сповіщення про прочитання">
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

    Ходи чату із собою пропускають сповіщення про прочитання, навіть коли вони ввімкнені глобально.

  </Accordion>
</AccordionGroup>

## Доставка, поділ на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Поділ тексту на фрагменти">
    - типовий ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною поділу на фрагменти

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документи
    - аудіомедіа надсилаються через payload Baileys `audio` з `ptt: true`, тому клієнти WhatsApp відображають їх як голосову нотатку push-to-talk
    - payload відповідей зберігає `audioAsVoice`; вихід голосових нотаток TTS для WhatsApp лишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не в Ogg, зокрема вихід Microsoft Edge TTS MP3/WebM, транскодується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й запобігає повторному надсиланню тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload відповідей із кількома медіа, але голосові нотатки PTT надсилають спочатку аудіо, а видимий текст окремо, оскільки клієнти WhatsApp не відображають підписи голосових нотаток стабільно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та поведінка fallback">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебирання якості), щоб укластися в ліміти
    - у разі помилки надсилання медіа fallback для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте ним за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                 |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                       |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                             |
| `"batched"` | Цитувати відповіді в черзі, залишаючи негайні відповіді без цитування  |

За замовчуванням `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ----------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так         | Ні                           | Лише Ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`   | Так         | Так (обережно)               | Ack + реакції агента з обережними вказівками     |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними вказівками |

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

WhatsApp підтримує негайні Ack-реакції під час отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
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

Нотатки щодо поведінки:

- надсилаються негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки записуються в журнал, але не блокують звичайну доставку відповіді
- режим групи `mentions` реагує на звернення, спричинені згадкою; активація групи `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо він присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів нормалізуються внутрішньо для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність зі старими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків облікового запису за замовчуванням

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням (вимкнення через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: стан каналу повідомляє, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але від’єднано / цикл повторного підключення">
    Симптом: прив’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного таймауту повідомлень; watchdog
    перезапускається, коли транспортна активність WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку лишається бездіяльною довше за подовжене безпечне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче таймауту простою вашої мережі та збільшення
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

    За потреби повторно прив’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR спливає за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або розривом TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Переконайтеся, що процес gateway успадковує env проксі та що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідне надсилання швидко завершується помилкою, коли для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено й обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Відповідь з’являється в транскрипті, але не у WhatsApp">
    Рядки транскрипту записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys повертає ідентифікатор вихідного повідомлення принаймні для одного видимого тексту або медіанадсилання.

    Ack-реакції є незалежними підтвердженнями перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь було прийнято WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Повідомлення групи неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія вирішення для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Системний промпт wildcard для групи** (`groups["*"].systemPrompt`): використовується, коли конкретного запису групи в мапі взагалі немає або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія вирішення для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Системний промпт wildcard для прямих чатів** (`direct["*"].systemPrompt`): використовується, коли конкретного запису peer у мапі взагалі немає або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` лишається легким bucket перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються в `direct`.
</Note>

**Відмінність від поведінки кількох облікових записів Telegram:** У Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власної `groups`, — щоб запобігти отриманню ботом групових повідомлень для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і коренева `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні промпти для груп або прямих чатів на рівні окремого облікового запису, явно визначте повну мапу в кожному обліковому записі, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно картою конфігурації для окремих груп і списком дозволених груп на рівні чату. На рівні кореня або акаунта `groups["*"]` означає, що "усі групи допускаються" для цієї області.
- Додавайте груповий wildcard `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви й надалі хочете, щоб допустимим був лише фіксований набір ID груп, не використовуйте `groups["*"]` для типового промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть перейти до обробки груп, але сам собою не авторизує кожного відправника в цих групах. Доступ відправників і надалі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для приватних повідомлень. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як приватне повідомлення вже допущено через `dmPolicy` разом із правилами `allowFrom` або сховища сполучення.

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

Високосигнальні поля WhatsApp:

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
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
