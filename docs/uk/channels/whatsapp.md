---
read_when:
    - Робота над поведінкою каналу WhatsApp/веб або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T23:07:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf363ec2cc7100635ee6b0a7b0e7bb956521d0203b445fd38b5a75a13e8918a6
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готовий до production через WhatsApp Web (Baileys). Gateway володіє пов’язаними сеансами.

## Встановлення (за потреби)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити WhatsApp plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, коли
  plugin ще не встановлено.
- Dev-канал + git checkout: типово використовує локальний шлях plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли опубліковано
  поточний пакет.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий або відсутній, використовуйте
поточну пакетовану збірку OpenClaw або локальний checkout, доки черга npm-пакетів
не наздожене.

<CardGroup cols={3}>
  <Card title="Зв’язування" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — зв’язування для невідомих відправників.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони та приклади конфігурації каналу.
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

  <Step title="Зв’яжіть WhatsApp (QR)">

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

  <Step title="Запустіть gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший запит на зв’язування (якщо використовується режим зв’язування)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити на зв’язування спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого налаштування, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - зрозуміліші списки дозволів DM і межі маршрутизації
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
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише WhatsApp Web">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Сторож повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довше обмеження тиші застосунку все ще примусово запускає повторне підключення, якщо транспортні кадри продовжують надходити, але повідомлення застосунку не обробляються протягом вікна сторожа; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping-повідомленнями застосунку WhatsApp Web, `connectTimeoutMs` керує тайм-аутом початкового рукостискання, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусу й трансляцій ігноруються (`@status`, `@broadcast`).
- Сторож повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні кадри продовжують надходити, але зупинка транспорту примусово запускає повторне підключення задовго до пізнішого шляху віддаленого від’єднання.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; типове `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації proxy на рівні хоста замість специфічних для каналу налаштувань proxy WhatsApp.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає ack-реакцію WhatsApp після доставлення видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. Через це
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

Ви можете обмежити згоду одним обліковим записом:

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

Увімкніть це лише для plugins, яким ви довіряєте отримання вхідного вмісту повідомлень
WhatsApp та ідентифікаторів.

## Контроль доступу й активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Подробиці поведінки під час виконання:

    - зв’язування зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не зв’язує вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Політика груп + списки дозволів">
    Доступ до груп має два рівні:

    1. **Список дозволених учасників груп** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи підходять
       - якщо `groups` присутній, він діє як список дозволених груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: список дозволів відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі групові вхідні повідомлення

    Резервний список дозволів відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, коли він доступний
    - списки дозволів відправників оцінюються перед активацією через згадку/відповідь

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, резервна політика груп під час виконання — `allowlist` (із журналом-попередженням), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Відповіді в групах типово потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка з безпеки:

    - цитата/відповідь лише задовольняє шлюз згадки; вона **не** надає авторизацію відправника
    - з `groupPolicy: "allowlist"` відправники не з allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Доступ обмежено власником.

  </Tab>
</Tabs>

## Поведінка особистого номера й self-chat

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати сповіщення про прочитання для ходів self-chat
- ігнорувати поведінку автоматичного запуску через mention-JID, яка інакше ping-нула б вас
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово мають вигляд `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний конверт + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються у спільний вхідний конверт.

    Якщо існує цитована відповідь, контекст додається в такому форматі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Плейсхолдери медіа та витягування локації/контакту">
    Вхідні повідомлення лише з медіа нормалізуються з плейсхолдерами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед шлюзом згадки, коли
    тіло містить лише `<media:audio>`, тому промовляння згадки бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе ще не згадує бота,
    транскрипт зберігається в очікуваній історії групи замість сирого плейсхолдера.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і деталі контакту/vCard відображаються як fenced недовірені метадані, а не як inline-текст prompt.

  </Accordion>

  <Accordion title="Вставлення очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й вставлятися як контекст, коли бот зрештою запускається.

    - типове обмеження: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резерв: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Сповіщення про прочитання">
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

    Ходи self-chat пропускають сповіщення про прочитання, навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставлення, поділ на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Поділ тексту на фрагменти">
    - типове обмеження фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), потім переходить до безпечного за довжиною поділу

  </Accordion>

  <Accordion title="Outbound media behavior">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і document payloads
    - аудіомедіа надсилається через Baileys `audio` payload з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - reply payloads зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому шляху PTT, навіть коли provider повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує auto-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - captions застосовуються до першого медіаелемента під час надсилання multi-media reply payloads, окрім голосових нотаток PTT: вони надсилають аудіо першим, а видимий текст окремо, бо клієнти WhatsApp не відображають captions голосових нотаток стабільно
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в обмеження
    - у разі помилки надсилання медіа fallback для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                 |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                       |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                             |
| `"batched"` | Цитувати поставлені в чергу batched replies, залишаючи негайні відповіді без цитування |

Типове значення — `"off"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji reactions у WhatsApp:

| Рівень        | Ack reactions | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так           | Ні                           | Лише ack reactions (підтвердження перед відповіддю) |
| `"minimal"`   | Так           | Так (консервативно)          | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так           | Так (заохочується)           | Ack + реакції агента із заохочувальними настановами |

Типово: `"minimal"`.

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

WhatsApp підтримує негайні ack reactions після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack reactions обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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

- надсилається негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки журналюються, але не блокують звичайну доставку відповіді
- режим групи `mentions` реагує на звернення, запущені згадкою; активація групи `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - ідентифікатори облікових записів походять із `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він є, інакше перший налаштований ідентифікатор облікового запису (відсортовано)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - legacy default auth у `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків default-account

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього облікового запису.

    У legacy auth directories `oauth.json` зберігається, а auth-файли Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені типово (вимкнути через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Симптом: стан каналу повідомляє, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Симптом: прив’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними довше за звичайний таймаут повідомлень; watchdog
    перезапускається, коли активність транспорту WhatsApp Web зупиняється, socket закривається або
    активність на рівні застосунку залишається тихою довше за довше захисне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги socket Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче за idle timeout вашої мережі та збільшення
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

  <Accordion title="QR login times out behind a proxy">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS socket.

    Вхід у WhatsApp Web використовує стандартне proxy-середовище Gateway-хоста (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує proxy env і що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного listener Gateway.

    Переконайтеся, що Gateway запущено, а обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - mention gating (`requireMention` + mention patterns)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` на scope

  </Accordion>

  <Accordion title="Bun runtime warning">
    Runtime Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompts

WhatsApp підтримує системні prompts у стилі Telegram для груп і прямих чатів через maps `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективний map `groups` визначається першим: якщо обліковий запис визначає власний `groups`, він повністю замінює кореневий map `groups` (без deep merge). Потім пошук prompt виконується в отриманому єдиному map:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в map **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Wildcard системний prompt групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у map або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективний map `direct` визначається першим: якщо обліковий запис визначає власний `direct`, він повністю замінює кореневий map `direct` (без deep merge). Потім пошук prompt виконується в отриманому єдиному map:

1. **Системний prompt для конкретного direct** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в map **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Wildcard системний prompt direct** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у map або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким bucket перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення prompt живуть у `direct`.
</Note>

**Відмінність від поведінки кількох облікових записів у Telegram:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власний `groups`, — щоб не дати боту отримувати групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні групові або direct prompts для кожного облікового запису, явно визначте повний map під кожним обліковим записом замість покладання на root-level defaults.

Важлива поведінка:

- `channels.whatsapp.groups` є водночас map конфігурації для окремих груп і allowlist груп на рівні чату. На кореневому scope або scope облікового запису `groups["*"]` означає "усі групи допускаються" для цього scope.
- Додавайте wildcard group `systemPrompt` лише тоді, коли ви вже хочете, щоб цей scope допускав усі групи. Якщо ви все ще хочете, щоб лише фіксований набір group IDs був придатним, не використовуйте `groups["*"]` для prompt default. Натомість повторіть prompt у кожному явно внесеному до allowlist записі групи.
- Допуск групи й авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до group handling, але сам собою не авторизує кожного відправника в цих групах. Доступ відправника все ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію direct-chat після того, як DM вже допущено правилами `dmPolicy` плюс `allowFrom` або pairing-store.

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

## Посилання на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
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
