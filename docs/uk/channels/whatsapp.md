---
read_when:
    - Робота над поведінкою каналу WhatsApp/веб або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T05:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9057208c69d125aea8d063f7c16c98babbf70ded7f693bdb15cde159c4920019
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готовий до production через WhatsApp Web (Baileys). Gateway володіє пов’язаними сеансами.

## Встановлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити Plugin WhatsApp під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік встановлення, коли
  Plugin ще не наявний.
- Канал розробки + git checkout: за замовчуванням використовує локальний шлях Plugin.
- Stable/Beta: використовує npm-пакет `@openclaw/whatsapp`, коли поточний пакет
  опубліковано.

Ручне встановлення лишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий або відсутній, використайте
поточну пакетовану збірку OpenClaw або локальний checkout, доки ланцюжок npm-пакетів
не наздожене.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
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

  <Step title="Зв’яжіть WhatsApp (QR)">

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

  <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Підтвердьте перший запит pairing (якщо використовується режим pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити pairing спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу й потік налаштування оптимізовані для такого налаштування, але налаштування з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist DM і межі маршрутизації
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
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, зручну для self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Обсяг каналу лише WhatsApp Web">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Сторож повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але повідомлення застосунку не обробляються протягом вікна сторожа.
- Часові параметри сокета Baileys явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує пінгами застосунку WhatsApp Web, `connectTimeoutMs` керує таймаутом початкового handshake, а `defaultQueryTimeoutMs` керує таймаутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Сторож повторного підключення відстежує активність транспорту WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні кадри продовжуються, але зависання транспорту примушує повторне підключення значно раніше за пізніший шлях віддаленого відключення.
- Прямі чати використовують правила сеансів DM (`session.dmScope`; стандартне `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web поважає стандартні змінні середовища proxy на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації proxy на рівні хоста замість налаштувань proxy WhatsApp для конкретного каналу.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає реакцію підтвердження WhatsApp після доставки видимої відповіді.

## Хуки Plugin і конфіденційність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
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

Можна обмежити це ввімкнення одним обліковим записом:

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

Вмикайте це лише для plugins, яким ви довіряєте отримувати вміст та ідентифікатори
вхідних повідомлень WhatsApp.

## Контроль доступу й активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (стандартно)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери в стилі E.164 (нормалізуються внутрішньо).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над стандартними значеннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - pairings зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено за замовчуванням
    - OpenClaw ніколи автоматично не створює pairing для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Політика груп + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи придатні
       - якщо `groups` наявний, він діє як груповий allowlist (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення груп

    Резервна логіка allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, коли він доступний
    - allowlists відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` взагалі відсутній, резервна групова політика під час виконання — `allowlist` (із попереджувальним логом), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Відповіді в групах за замовчуванням потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка з безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist все одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації рівня сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера й self-chat

Коли пов’язаний власний номер також наявний у `allowFrom`, активуються захисти self-chat WhatsApp:

- пропускати підтвердження прочитання для ходів self-chat
- ігнорувати поведінку автоматичного спрацювання mention-JID, яка інакше пінгувала б вас
- якщо `messages.responsePrefix` не задано, відповіді self-chat за замовчуванням мають вигляд `[{identity.name}]` або `[openclaw]`

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

  <Accordion title="Плейсхолдери медіа й витягування локації/контакту">
    Вхідні повідомлення лише з медіа нормалізуються з плейсхолдерами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тож промовляння згадки бота в голосовій нотатці може
    викликати відповідь. Якщо транскрипт усе одно не згадує бота,
    транскрипт зберігається в очікуваній історії групи замість сирого плейсхолдера.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і дані контактів/vCard відображаються як відгороджені недовірені метадані, а не як вбудований текст prompt.

  </Accordion>

  <Accordion title="Вставлення очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й вставлятися як контекст, коли бот нарешті спрацьовує.

    - стандартний ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Підтвердження прочитання">
    Підтвердження прочитання за замовчуванням увімкнені для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи self-chat пропускають підтвердження прочитання, навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, фрагментація й медіа

<AccordionGroup>
  <Accordion title="Фрагментація тексту">
    - стандартний ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім переходить до безпечної за довжиною фрагментації

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і document payloads
    - аудіомедіа надсилається через Baileys `audio` payload з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - reply payloads зберігають `audioAsVoice`; вихідна голосова нотатка TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вихід MP3/WebM Microsoft Edge TTS, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та пригнічує повторне надсилання тієї самої відповіді; `/tts chat on|off|default` керує авто-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання multi-media reply payloads, крім голосових нотаток PTT: для них спершу надсилається аудіо, а видимий текст окремо, оскільки клієнти WhatsApp не завжди стабільно відображають підписи до голосових нотаток
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та поведінка резервного варіанта">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в ліміти
    - у разі помилки надсилання медіа резервний варіант для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Видимість помилок

`channels.whatsapp.exposeErrorText` керує тим, чи доставляється текст помилки агента/провайдера назад у WhatsApp. Типове значення — `true`. Установіть `false`, щоб помилки у WhatsApp не показувалися, зберігаючи поведінку інших каналів.

```json5
{
  channels: {
    whatsapp: {
      exposeErrorText: false,
    },
  },
}
```

Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.exposeErrorText`.

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                      |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                            |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Типово — `"off"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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
| `"minimal"`   | Так         | Так (консервативно)          | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними настановами |

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

- надсилається негайно після прийняття вхідного повідомлення (до відповіді)
- помилки журналюються, але не блокують нормальну доставку відповіді
- режим групи `mentions` реагує на ходи, спричинені згадкою; активація групи `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він є, інакше перший налаштований ідентифікатор облікового запису (відсортовано)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність зі старими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

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
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але від’єднано / цикл повторного підключення">
    Симптом: прив’язаний обліковий запис із повторюваними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли активність транспорту WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається тихою довше за розширене захисне вікно.

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

    За потреби повторно прив’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за proxy">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне proxy-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує proxy env і що `NO_PROXY` не відповідає `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено, а обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` на кожну область

  </Accordion>

  <Accordion title="Попередження runtime Bun">
    Runtime WhatsApp Gateway має використовувати Node. Bun позначено як несумісний для стабільної роботи WhatsApp/Telegram Gateway.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається спочатку: якщо обліковий запис визначає власні `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується в отриманій єдиній мапі:

1. **Системний промпт конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Системний промпт wildcard для груп** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається спочатку: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується в отриманій єдиній мапі:

1. **Системний промпт конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Системний промпт wildcard для прямих чатів** (`direct["*"].systemPrompt`): використовується, коли запис конкретного peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким bucket перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються в `direct`.
</Note>

**Відмінність від поведінки Telegram із кількома обліковими записами:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для тих, що не визначають власні `groups`, — щоб запобігти отриманню ботом групових повідомлень для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і коренева `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp із кількома обліковими записами, якщо вам потрібні групові або прямі промпти для окремих облікових записів, явно визначайте повну мапу в кожному обліковому записі, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і allowlist груп на рівні чату. У кореневій області або області облікового запису `groups["*"]` означає «усі групи допускаються» для цієї області.
- Додавайте wildcard group `systemPrompt` лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як типове значення промпта. Натомість повторіть промпт у кожному явно доданому до allowlist записі групи.
- Допуск групи та авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправника все ще окремо керується через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` плюс `allowFrom` або правила pairing-store.

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
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`, `exposeErrorText`
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
