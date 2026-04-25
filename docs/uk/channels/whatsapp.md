---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T05:54:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9510b013f19c0ff4cd8376b7a3d0eca7466cf6ef17255349ccc729fe919911a0
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готово до продакшену через WhatsApp Web (Baileys). Gateway володіє прив’язаною сесією (або сесіями).

## Встановлення (за потреби)

- Під час онбордингу (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  система пропонує встановити Plugin WhatsApp, коли ви вперше його вибираєте.
- `openclaw channels login --channel whatsapp` також пропонує сценарій встановлення, якщо
  Plugin ще не встановлено.
- Dev channel + git checkout: за замовчуванням використовується локальний шлях до Plugin.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Прив’язка" icon="link" href="/uk/channels/pairing">
    Типова політика DM — прив’язка для невідомих відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
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

  <Step title="Прив’яжіть WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб підключити наявний/власний каталог автентифікації WhatsApp Web перед входом:

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

  <Step title="Схваліть перший запит на прив’язку (якщо використовується режим прив’язки)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на прив’язку спливає через 1 годину. Кількість запитів у стані очікування обмежена до 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, за можливості, запускати WhatsApp на окремому номері. (Метадані каналу та сценарій налаштування оптимізовані саме для такого варіанта, але конфігурації з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший режим з операційної точки зору:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
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
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист self-chat спирається на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Сфера каналу лише для WhatsApp Web">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі chat-channel немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway володіє сокетом WhatsApp і циклом перепідключення.
- Для надсилання вихідних повідомлень потрібен активний слухач WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; значення за замовчуванням `main` згортає DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста, а не окремим налаштуванням проксі WhatsApp для каналу.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сесій. З цієї причини
WhatsApp не транслює вхідні payload хуку `message_received` до Plugins,
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

Ви можете обмежити це ввімкнення одним обліковим записом:

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

Увімкніть це лише для Plugins, яким ви довіряєте отримання вхідного вмісту
повідомлень WhatsApp та ідентифікаторів.

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у форматі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями канального рівня для цього облікового запису.

    Деталі поведінки під час виконання:

    - прив’язки зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволяється за замовчуванням
    - OpenClaw ніколи не виконує авто-прив’язку для вихідних `fromMe` DM (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Групова політика + allowlist">
    Доступ до груп має два шари:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, придатними вважаються всі групи
       - якщо `groups` задано, воно діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення груп

    Резервний варіант allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо воно доступне
    - allowlist відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервне значення group-policy під час виконання — `allowlist` (із попереджувальним записом у журналі), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    За замовчуванням відповіді в групах потребують згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє перевірку згадки; це **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Доступ до нього обмежено власником.

  </Tab>
</Tabs>

## Особистий номер і поведінка self-chat

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники self-chat у WhatsApp:

- пропускати read receipts для ходів self-chat
- ігнорувати поведінку auto-trigger за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний envelope + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються у спільний вхідний envelope.

    Якщо є цитована відповідь, контекст додається в такому вигляді:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Заповнювачі медіа та витягування локації/контакту">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою таких заповнювачів:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіло повідомлення з локацією використовує стислий текст координат. Мітки/коментарі локації та дані контакту/vCard відображаються як fenced недовірені метадані, а не як вбудований текст промпту.

  </Accordion>

  <Accordion title="Ін’єкція відкладеної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й ін’єктуватися як контекст, коли бот нарешті активується.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервно: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts увімкнено за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Для ходів self-chat read receipts пропускаються, навіть якщо вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на частини">
    - ліміт частини за замовчуванням: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім резервно переходить до безпечного за довжиною розбиття
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються payload зображень, відео, аудіо (голосові нотатки PTT) і документів
    - payload відповідей зберігають `audioAsVoice`; WhatsApp надсилає аудіомедіа як голосові нотатки Baileys PTT
    - `audio/ogg` переписується в `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - підтримується відтворення анімованих GIF через `gifPlayback: true` під час надсилання відео
    - captions застосовуються до першого медіаелемента під час надсилання payload відповідей із кількома медіа
    - джерелом медіа можуть бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (підбір розміру/якості), щоб вкладатися в обмеження
    - у разі помилки надсилання медіа резервний сценарій для першого елемента надсилає текстове попередження замість тихого пропуску відповіді
  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді візуально цитують вхідне повідомлення. Керуйте цим за допомогою `channels.whatsapp.replyToMode`.

| Value       | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише першу частину вихідної відповіді                        |
| `"all"`     | Цитувати кожну частину вихідної відповіді                             |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

Значення за замовчуванням — `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує реакції-емодзі у WhatsApp:

| Рівень        | Реакції підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------- | --------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні                    | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так                   | Ні                           | Лише реакції підтвердження (підтвердження до відповіді) |
| `"minimal"`   | Так                   | Так (обережно)               | Підтвердження + реакції агента з обережними вказівками |
| `"extensive"` | Так                   | Так (заохочуються)           | Підтвердження + реакції агента із заохочувальними вказівками |

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

WhatsApp підтримує негайні реакції підтвердження після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Реакції підтвердження обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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

- надсилаються одразу після прийняття вхідного повідомлення (до відповіді)
- збої записуються в журнал, але не блокують звичайну доставку відповіді
- режим груп `mentions` реагує на ходи, активовані згадкою; групова активація `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застаріле `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів походять із `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо він є; інакше — перший налаштований ідентифікатор облікового запису (після сортування)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність зі застарілими варіантами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв з обліковим записом за замовчуванням
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
- Записи конфігурації, ініційовані каналом, увімкнено за замовчуванням (вимкнення через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що канал не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але відключено / цикл перепідключення">
    Симптом: прив’язаний обліковий запис із повторними відключеннями або спробами перепідключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби повторно прив’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні повідомлення швидко завершуються з помилкою, якщо для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено і обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - перевірка згадок (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому зберігайте лише один `groupPolicy` на кожну область

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Спочатку визначається ефективна мапа `groups`: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Пошук промпту потім виконується в цій єдиній результуючій мапі:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` — це порожній рядок (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Wildcard-системний промпт групи** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не має ключа `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Спочатку визначається ефективна мапа `direct`: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Пошук промпту потім виконується в цій єдиній результуючій мапі:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного peer існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` — це порожній рядок (`""`), wildcard пригнічується і системний промпт не застосовується.
2. **Wildcard-системний промпт прямого чату** (`direct["*"].systemPrompt`): використовується, коли запис конкретного peer повністю відсутній у мапі або коли він існує, але не має ключа `systemPrompt`.

Примітка: `dms` залишається спрощеним контейнером перевизначень історії для окремих DM (`dms.<id>.historyLimit`); перевизначення промптів знаходяться в `direct`.

**Відмінність від поведінки Telegram з кількома обліковими записами:** У Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власної `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не мають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні окремі групові або прямі промпти для кожного облікового запису, явно визначайте повну мапу в кожному обліковому записі, а не покладайтеся на значення за замовчуванням кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` — це одночасно мапа конфігурації для окремих груп і allowlist груп на рівні чату. На кореневому рівні або в області облікового запису `groups["*"]` означає «усі групи допущені» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб дозволеними були лише фіксовані ідентифікатори груп, не використовуйте `groups["*"]` як значення промпту за замовчуванням. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск груп і авторизація відправників — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але саме по собі не авторизує всіх відправників у цих групах. Доступ відправників і надалі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` разом із `allowFrom` або правилами pairing-store.

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

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Прив’язка](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналу](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
