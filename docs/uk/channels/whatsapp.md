---
read_when:
    - Робота над поведінкою каналу WhatsApp/веб або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-05-01T21:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97215e7f3ae30457e464b35177ad0b0b3631ef6d9b242eaab490eee76bf87f9
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: production-ready через WhatsApp Web (Baileys). Gateway керує пов’язаними сеансами.

## Встановлення (за потреби)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити WhatsApp Plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  Plugin ще немає.
- Канал розробки + git checkout: стандартно використовує локальний шлях Plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли актуальний пакет
  опубліковано.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий або відсутній, використайте
актуальну пакетовану збірку OpenClaw або локальний checkout, доки ланцюг npm-пакетів
не наздожене.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
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

    Запити pairing спливають через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу й потік налаштування оптимізовані для такого варіанта, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші allowlist для DM і межі маршрутизації
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

  <Accordion title="Personal-number fallback">
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, зручну для self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що нещодавно ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні фрейми продовжують надходити, але повідомлення застосунку не обробляються протягом вікна watchdog; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping WhatsApp Web на рівні застосунку, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і broadcast ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні фрейми продовжують надходити, але зупинка транспорту примушує повторне підключення значно раніше за пізніший шлях віддаленого від’єднання.
- Прямі чати використовують правила сеансу DM (`session.dmScope`; стандартне `main` зводить DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web поважає стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста, а не специфічним для каналу налаштуванням проксі WhatsApp.
- Коли ввімкнено `messages.removeAckAfterReply`, OpenClaw очищає ack-реакцію WhatsApp після доставлення видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансу. З цієї причини
WhatsApp не транслює вхідні payload хуків `message_received` до плагінів,
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

Увімкніть це лише для плагінів, яким ви довіряєте отримання вмісту та ідентифікаторів
вхідних повідомлень WhatsApp.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (стандартно)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над стандартами рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - pairing зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено стандартно
    - OpenClaw ніколи автоматично не створює pairing для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групах** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має збігатися з `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення груп

    Fallback для allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlist відправників оцінюються до активації згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, fallback group-policy під час виконання — `allowlist` (із попередженням у журналі), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді стандартно потребують згадки.

    Виявлення згадки охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера й self-chat

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку mention-JID auto-trigger, яка інакше ping-увала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat стандартно мають префікс `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp обгортаються в спільний вхідний envelope.

    Якщо існує процитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються з placeholders, як-от:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тому згадка бота, сказана в голосовій нотатці, може
    запустити відповідь. Якщо транскрипт усе ще не згадує бота, його
    зберігають в очікуваній історії групи замість сирого placeholder.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і дані контактів/vCard відображаються як fenced untrusted metadata, а не як inline prompt text.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бот нарешті спрацьовує.

    - стандартний ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts стандартно ввімкнені для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи self-chat пропускають read receipts, навіть коли їх глобально ввімкнено.

  </Accordion>
</AccordionGroup>

## Доставлення, chunking і медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - стандартний ліміт chunk: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім переходить до chunking, безпечного за довжиною

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payloads
    - аудіомедіа надсилається через Baileys `audio` payload з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - payloads відповідей зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому PTT-шляху, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, транскодується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання тієї самої відповіді; `/tts chat on|off|default` керує auto-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payloads відповідей із кількома медіа, крім голосових нотаток PTT: вони надсилають аудіо спочатку, а видимий текст окремо, бо клієнти WhatsApp не завжди стабільно відображають підписи до голосових нотаток
    - джерело медіа може бути HTTP(S), `file://` або локальними шляхами

  </Accordion>

  <Accordion title="Обмеження розміру медіа та поведінка fallback">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в обмеження
    - у разі помилки надсилання медіа fallback для першого елемента надсилає текстове попередження, а не мовчки відкидає відповідь

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                            |
| ----------- | ------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення              |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                    |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                          |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Типове значення — `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції в WhatsApp:

| Рівень       | Реакції підтвердження | Реакції, ініційовані агентом | Опис                                                   |
| ------------ | --------------------- | ---------------------------- | ------------------------------------------------------ |
| `"off"`      | Ні                    | Ні                           | Без реакцій узагалі                                   |
| `"ack"`      | Так                   | Ні                           | Лише реакції підтвердження (підтвердження отримання перед відповіддю) |
| `"minimal"`  | Так                   | Так (консервативно)          | Підтвердження + реакції агента з консервативними вказівками |
| `"extensive"` | Так                  | Так (заохочується)           | Підтвердження + реакції агента із заохочувальними вказівками |

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

WhatsApp підтримує негайні реакції підтвердження на отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
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

Нотатки щодо поведінки:

- надсилаються негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки журналюються, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; групова активація `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він є, інакше перший налаштований ідентифікатор облікового запису (відсортовано)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спочатку зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов’язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

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
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не пов’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл повторного підключення">
    Симптом: пов’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли активність транспорту WhatsApp Web припиняється, сокет закривається або
    активність на рівні застосунку залишається тихою довше за довше безпечне вікно.

    Якщо журнали показують повторювані `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче за тайм-аут простою вашої мережі та збільшення
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

    Якщо `~/.openclaw/logs/whatsapp-health.log` повідомляє `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    Gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, бо cron може не мати середовища користувацької шини systemd і
    змушувати цей старий скрипт неправильно повідомляти про стан Gateway.

    За потреби повторно пов’яжіть за допомогою `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує env проксі й що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено, а обліковий запис пов’язано.

  </Accordion>

  <Accordion title="Відповідь з’являється в транскрипті, але не в WhatsApp">
    Рядки транскрипта записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys поверне ідентифікатор вихідного повідомлення принаймні для одного видимого текстового або медіанадсилання.

    Реакції підтвердження є незалежними підтвердженнями отримання перед відповіддю. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь було прийнято WhatsApp.

    Перевірте журнали Gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадкою (`requireMention` + шаблони згадок)
    - дублікати ключів в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому зберігайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання WhatsApp gateway має використовувати Node. Bun позначено як несумісний зі стабільною роботою WhatsApp/Telegram gateway.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається спочатку: якщо обліковий запис визначає власні `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук prompt виконується в отриманій єдиній мапі:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний prompt не застосовується.
2. **Wildcard системний prompt групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається спочатку: якщо обліковий запис визначає власні `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук prompt виконується в отриманій єдиній мапі:

1. **Системний prompt для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний prompt не застосовується.
2. **Wildcard системний prompt direct** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення prompt розміщуються в `direct`.
</Note>

**Відмінність від поведінки Telegram із кількома обліковими записами:** У Telegram кореневі `groups` навмисно пригнічуються для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власні `groups`, — щоб запобігти отриманню ботом групових повідомлень для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і кореневі `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp із кількома обліковими записами, якщо вам потрібні prompts для груп або direct для окремого облікового запису, явно визначте повну мапу в кожному обліковому записі, а не покладайтеся на кореневі типові значення.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і списком дозволених груп на рівні чату. На кореневому рівні або в межах облікового запису `groups["*"]` означає «усі групи допущено» для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ID груп, не використовуйте `groups["*"]` для стандартного промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників усе ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для особистих повідомлень. `direct["*"]` лише надає стандартну конфігурацію прямого чату після того, як особисте повідомлення вже допущено через `dmPolicy` плюс `allowFrom` або правила сховища сполучень.

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

## Вказівники на довідку з конфігурації

Основна довідка:

- [Довідка з конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Найважливіші поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставлення: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
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
