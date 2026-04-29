---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T03:50:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 192ef0b17fe67ded990697b48148361a9b0c03631dc7a8efb6510b7fc0c5ede0
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готово до production через WhatsApp Web (`Baileys`). Gateway володіє пов’язаними сеансами.

## Встановлення (на вимогу)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити Plugin WhatsApp під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  Plugin ще відсутній.
- Dev channel + git checkout: за замовчуванням використовує локальний шлях Plugin.
- Stable/Beta: за замовчуванням використовує npm-пакет `@openclaw/whatsapp`.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — створення пари для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
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

    Запити на створення пари спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та потік налаштування оптимізовані для такого сценарію, але сценарії з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші списки дозволених DM і межі маршрутизації
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
    Онбординг підтримує режим особистого номера й записує базову конфігурацію, дружню до чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захисти чату із самим собою спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Сторож повторного підключення використовує транспортну активність WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлень. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні фрейми продовжують надходити, але жодні повідомлення застосунку не обробляються протягом вікна сторожа.
- Таймінги сокета Baileys явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує пінгами застосунку WhatsApp Web, `connectTimeoutMs` керує тайм-аутом початкового рукостискання, а `defaultQueryTimeoutMs` керує тайм-аутами запитів Baileys.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Статусні та широкомовні чати ігноруються (`@status`, `@broadcast`).
- Сторож повторного підключення стежить за транспортною активністю WhatsApp Web, а не лише за обсягом вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, поки транспортні фрейми продовжуються, але зависання транспорту примусово викликає повторне підключення задовго до пізнішого шляху віддаленого від’єднання.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; стандартне `main` зводить DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу конфігурації проксі на рівні хоста, а не канально-специфічним налаштуванням проксі WhatsApp.
- Коли `messages.removeAckAfterReply` увімкнено, OpenClaw очищає ack-реакцію WhatsApp після доставлення видимої відповіді.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. Через це
WhatsApp не транслює вхідні payload-и хука `message_received` до plugins,
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

Вмикайте це лише для plugins, яким ви довіряєте отримання вмісту й ідентифікаторів
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

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над стандартними значеннями рівня каналу для цього облікового запису.

    Деталі поведінки під час виконання:

    - пари зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - якщо список дозволених не налаштовано, пов’язаний власний номер дозволяється за замовчуванням
    - OpenClaw ніколи автоматично не створює пари для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Список дозволеного членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, придатні всі групи
       - якщо `groups` присутній, він діє як список дозволених груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: список дозволених відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні групові повідомлення

    Резервний варіант списку дозволених відправників:

    - якщо `groupAllowFrom` не задано, runtime використовує `allowFrom`, коли він доступний
    - списки дозволених відправників оцінюються перед активацією згадкою/відповіддю

    Примітка: якщо блока `channels.whatsapp` взагалі немає, резервна політика груп runtime — `allowlist` (із попереджувальним логом), навіть якщо `channels.defaults.groupPolicy` задано.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді за замовчуванням потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резерв `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє обмеження згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза списком дозволених усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача зі списку дозволених

    Команда активації рівня сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера й чату із самим собою

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисти WhatsApp для чату із самим собою:

- пропускати сповіщення про прочитання для ходів чату із самим собою
- ігнорувати поведінку автоматичного запуску через mention-JID, яка інакше пінгувала б вас
- якщо `messages.responsePrefix` не задано, відповіді в чаті із самим собою за замовчуванням мають вигляд `[{identity.name}]` або `[openclaw]`

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

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються із placeholder-ами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед обмеженням згадки, коли
    тіло містить лише `<media:audio>`, тому вимовлена згадка бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе одно не згадує бота, він
    зберігається в очікуваній історії групи замість сирого placeholder-а.

    Тіла локацій використовують стислий координатний текст. Мітки/коментарі локацій і деталі контактів/vCard рендеряться як огороджені недовірені метадані, а не як inline-текст prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й ін’єктуватися як контекст, коли бота нарешті запущено.

    - стандартний ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резерв: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Сповіщення про прочитання ввімкнено за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи чату із самим собою пропускають сповіщення про прочитання, навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставлення, розбиття на фрагменти й медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - стандартний ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім переходить до безпечного за довжиною розбиття

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує зображення, відео, аудіо (голосову нотатку PTT) і документні payload-и
    - аудіомедіа надсилається через payload Baileys `audio` з `ptt: true`, тому клієнти WhatsApp відображають його як голосову нотатку push-to-talk
    - reply payload-и зберігають `audioAsVoice`; виведення голосових нотаток TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема виведення Microsoft Edge TTS MP3/WebM, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання reply payload-ів із кількома медіа, за винятком голосових нотаток PTT: аудіо надсилається першим, а видимий текст окремо, оскільки клієнти WhatsApp непослідовно відображають підписи до голосових нотаток
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи

  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб вкладатися в ліміти
    - у разі помилки надсилання медіа резервна поведінка для першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                 |
| `"first"`   | Цитувати лише перший фрагмент вихідної відповіді                       |
| `"all"`     | Цитувати кожен фрагмент вихідної відповіді                             |
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

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ----------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так         | Ні                           | Лише Ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`   | Так         | Так (консервативно)          | Ack + реакції агента з консервативними вказівками |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними вказівками |

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

WhatsApp підтримує негайні ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
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

Примітки щодо поведінки:

- надсилається негайно після прийняття вхідного повідомлення (перед відповіддю)
- помилки журналюються, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; активація групи `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими варіантами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені типово (вимикаються через `channels.whatsapp.configWrites=false`).

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
    перезапускається, коли активність транспорту WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається відсутньою довше за триваліше захисне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
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

    За потреби повторно пов’яжіть за допомогою `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або від’єднанням TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує проксі-env і що `NO_PROXY` не відповідає `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено, а обліковий запис пов’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають раніші, тому тримайте один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження runtime Bun">
    Runtime Gateway WhatsApp має використовувати Node. Bun позначається як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні підказки

WhatsApp підтримує системні підказки в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв’язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук підказки виконується на отриманій єдиній мапі:

1. **Системна підказка для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системна підказка не застосовується.
2. **Wildcard-системна підказка групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв’язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук підказки виконується на отриманій єдиній мапі:

1. **Системна підказка для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системна підказка не застосовується.
2. **Wildcard-системна підказка прямого чату** (`direct["*"].systemPrompt`): використовується, коли конкретний запис peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення підказок розміщуються в `direct`.
</Note>

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у налаштуванні з кількома обліковими записами — навіть для облікових записів, які не визначають власної `groups`, — щоб запобігти отриманню ботом групових повідомлень із груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У налаштуванні WhatsApp із кількома обліковими записами, якщо потрібні групові або прямі підказки для кожного облікового запису, явно визначайте повну мапу під кожним обліковим записом, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і allowlist груп на рівні чату. У кореневій області або області облікового запису `groups["*"]` означає "усі групи допускаються" для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` для типового значення підказки. Натомість повторіть підказку в кожному явно доданому до allowlist записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників усе ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` плюс `allowFrom` або правила сховища зв’язування.

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

## Покажчики довідника конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Ключові поля WhatsApp:

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
