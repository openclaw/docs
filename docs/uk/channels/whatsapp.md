---
read_when:
    - Робота з поведінкою каналу WhatsApp/веб або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T07:07:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

Статус: готово до production через WhatsApp Web (Baileys). Gateway керує пов’язаними сеансами.

## Встановлення (за потреби)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  plugin ще відсутній.
- Dev-канал + git checkout: за замовчуванням використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли актуальний пакет
  опубліковано.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий або відсутній, використовуйте
актуальну пакетовану збірку OpenClaw або локальний checkout, доки черга npm-пакетів
не наздожене зміни.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для невідомих відправників — сполучення.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та playbook-и відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
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

  <Step title="Пов’яжіть WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного акаунта:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб під’єднати наявну/власну директорію автентифікації WhatsApp Web перед входом:

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

  <Step title="Підтвердьте перший запит на сполучення (якщо використовується режим сполучення)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити на сполучення спливають через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого варіанта, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist-и DM та межі маршрутизації
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

  <Accordion title="Резервний варіант з особистим номером">
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, зручну для чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти чату із самим собою спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише WhatsApp Web">
    Канал платформи повідомлень базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тож тихий сеанс пов’язаного пристрою не перезапускається тільки тому, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але протягом вікна watchdog не обробляються повідомлення застосунку; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний timeout повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно налаштовуються в `web.whatsapp.*`: `keepAliveIntervalMs` керує application ping-ами WhatsApp Web, `connectTimeoutMs` керує timeout початкового handshake, а `defaultQueryTimeoutMs` керує timeout-ами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового акаунта.
- Статусні та broadcast-чати ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення стежить за активністю транспорту WhatsApp Web, а не лише за обсягом вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки надходять транспортні кадри, але зупинка транспорту примушує повторне підключення значно раніше за пізніший шлях віддаленого від’єднання.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; типове значення `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web поважає стандартні змінні середовища проксі на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста замість специфічних для каналу налаштувань проксі WhatsApp.
- Коли ввімкнено `messages.removeAckAfterReply`, OpenClaw очищає реакцію підтвердження WhatsApp після доставки видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload-и hook `message_received` до plugins,
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

Можна обмежити opt-in одним акаунтом:

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
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох акаунтів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього акаунта.

    Деталі поведінки під час виконання:

    - сполучення зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та fallback одержувача Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; підтвердження DM-сполучень не є неявними одержувачами Cron чи Heartbeat
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено за замовчуванням
    - OpenClaw ніколи автоматично не сполучає вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Політика груп + allowlist-и">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокує всі групові вхідні повідомлення

    Fallback allowlist-а відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується fallback до `allowFrom`, коли він доступний
    - allowlist-и відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, fallback політики груп під час виконання — `allowlist` (із попередженням у логах), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Групові відповіді за замовчуванням потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє gating згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона gated власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та чату із самим собою

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисти WhatsApp для чату із самим собою:

- пропускати read receipts для ходів чату із самим собою
- ігнорувати поведінку автоактивації mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в чаті із самим собою за замовчуванням мають вигляд `[{identity.name}]` або `[openclaw]`

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
    Коли ціль цитованої відповіді — медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й надає його як `MediaPath`/`MediaType`, щоб
    агент міг переглянути зображення, на яке є посилання, замість того щоб бачити лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Медіа-плейсхолдери та витягування локації/контактів">
    Вхідні повідомлення лише з медіа нормалізуються з плейсхолдерами на кшталт:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед gating згадки, коли
    тіло містить лише `<media:audio>`, тож вимовлення згадки бота в голосовій нотатці може
    активувати відповідь. Якщо транскрипт усе одно не згадує бота, його
    зберігають в історії очікуваної групи замість сирого плейсхолдера.

    Тіла локацій використовують стислий текст координат. Позначки/коментарі локацій і деталі контактів/vCard рендеряться як fenced недовірені метадані, а не як inline prompt text.

  </Accordion>

  <Accordion title="Ін’єкція очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися та ін’єктуватися як контекст, коли бот нарешті активується.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts за замовчуванням увімкнені для прийнятих вхідних повідомлень WhatsApp.

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

    Перевизначення для акаунта:

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

    Ходи чату із самим собою пропускають read receipts, навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, chunking і медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на фрагменти">
    - стандартний ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), потім повертається до безпечного за довжиною розбиття на фрагменти

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payloads
    - аудіомедіа надсилається через Baileys payload `audio` з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - reply payloads зберігають `audioAsVoice`; вивід голосових нотаток TTS для WhatsApp лишається на цьому PTT-шляху, навіть коли провайдер повертає MP3 або WebM
    - нативне Ogg/Opus-аудіо надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема MP3/WebM-вивід Microsoft Edge TTS, перекодовується через `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й приглушує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує авто-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання reply payloads із кількома медіа, окрім голосових нотаток PTT: аудіо надсилається першим, а видимий текст окремо, бо клієнти WhatsApp не відображають підписи до голосових нотаток узгоджено
    - джерело медіа може бути HTTP(S), `file://` або локальними шляхами

  </Accordion>

  <Accordion title="Обмеження розміру медіа та поведінка fallback">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (стандартно `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в ліміти
    - у разі помилки надсилання медіа fallback для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                      |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                            |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, лишаючи негайні відповіді без цитування |

Стандартно `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ----------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так         | Ні                           | Лише ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`   | Так         | Так (консервативно)          | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними настановами |

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

WhatsApp підтримує негайні ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — вони приглушуються, коли `reactionLevel` дорівнює `"off"`.

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
- помилки записуються в журнали, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; групова активація `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та стандартні значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - стандартний вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (за відсортованим порядком)
    - ідентифікатори облікових записів нормалізуються внутрішньо для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілим форматом">
    - поточний шлях auth: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застарілий стандартний auth у `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків стандартного облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан auth WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов'язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах auth `oauth.json` зберігається, а auth-файли Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнено стандартно (вимкнення через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов'язано (потрібен QR)">
    Симптом: стан каналу повідомляє, що він не пов'язаний.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов'язано, але відключено / цикл перепідключення">
    Симптом: пов'язаний обліковий запис із повторними відключеннями або спробами перепідключення.

    Тихі облікові записи можуть лишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли транспортна активність WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку лишається тихою довше за довше безпечне вікно.

    Якщо журнали показують повторюваний `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче за тайм-аут простою вашої мережі та збільшення
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
    `crontab -e`, бо cron може не мати середовища user-bus systemd і
    змушувати старий скрипт неправильно повідомляти про справність gateway.

    За потреби повторно пов'яжіть через `channels login`.

  </Accordion>

  <Accordion title="QR-вхід завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або відключенням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне proxy-середовище хоста gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес gateway успадковує proxy env і що `NO_PROXY` не відповідає `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено, а обліковий запис пов'язано.

  </Accordion>

  <Accordion title="Відповідь з'являється в транскрипті, але не у WhatsApp">
    Рядки транскрипту записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автовідповідь надісланою лише після того, як Baileys повертає ідентифікатор вихідного повідомлення принаймні для одного видимого текстового або медіанадсилання.

    Ack-реакції є незалежними підтвердженнями перед відповіддю. Успішна реакція не доводить, що пізніша текстова або медіавідповідь була прийнята WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` для кожного scope

  </Accordion>

  <Accordion title="Попередження runtime Bun">
    Runtime gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через maps `groups` і `direct`.

Ієрархія розв'язання для групових повідомлень:

Ефективна map `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу map `groups` (без глибокого merge). Потім пошук prompt виконується на отриманій єдиній map:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в map **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard приглушується й системний prompt не застосовується.
2. **Wildcard системного prompt для групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у map або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв'язання для прямих повідомлень:

Ефективна map `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу map `direct` (без глибокого merge). Потім пошук prompt виконується на отриманій єдиній map:

1. **Системний prompt для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний peer-запис існує в map **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard приглушується й системний prompt не застосовується.
2. **Wildcard системного prompt для direct** (`direct["*"].systemPrompt`): використовується, коли конкретний peer-запис повністю відсутній у map або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` лишається легким контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення prompt розміщуються в `direct`.
</Note>

**Відмінність від поведінки кількох облікових записів Telegram:** У Telegram кореневі `groups` навмисно пригнічуються для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власних `groups`, — щоб запобігти отриманню ботом групових повідомлень із груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і кореневі `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp із кількома обліковими записами, якщо потрібні групові або прямі промпти для кожного облікового запису окремо, явно визначте повну мапу в кожному обліковому записі, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і allowlist груп на рівні чату. У кореневій області або в області облікового запису `groups["*"]` означає "усі групи допускаються" для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` для стандартного промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і надалі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає стандартну конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами сховища спарювання.

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

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Спарювання](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
