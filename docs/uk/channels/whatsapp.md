---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T11:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готовий до production через WhatsApp Web (Baileys). Gateway керує пов’язаними сесіями.

## Встановлення (за потреби)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити плагін WhatsApp, коли ви вперше його обираєте.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  плагін ще не встановлено.
- Канал dev + git checkout: за замовчуванням використовується локальний шлях до плагіна.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Прив’язування" icon="link" href="/uk/channels/pairing">
    Політика DM за замовчуванням для невідомих відправників — прив’язування.
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

  <Step title="Під’єднайте WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Для конкретного акаунта:

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

  <Step title="Схваліть перший запит на прив’язування (якщо використовується режим прив’язування)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на прив’язування спливає через 1 годину. Кількість очікуваних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, за можливості, використовувати WhatsApp з окремим номером. (Метадані каналу та процес налаштування оптимізовані для такого сценарію, але конфігурації з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший режим з операційної точки зору:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
    - нижча ймовірність плутанини із самочатом

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
    Onboarding підтримує режим особистого номера і записує базову конфігурацію, дружню до самочату:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист самочату спирається на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише для WhatsApp Web">
    Канал платформи обміну повідомленнями в поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі чат-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом перепідключення.
- Для вихідних надсилань потрібен активний слухач WhatsApp для цільового акаунта.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; за замовчуванням `main` згортає DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні змінні середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу конфігурації проксі на рівні хоста замість специфічних налаштувань проксі WhatsApp для каналу.

## Хуки Plugin і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сесій. З цієї причини
WhatsApp не транслює payload вхідних хуків `message_received` до Plugin
, якщо ви явно не ввімкнете це:

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

Ви можете обмежити цю згоду одним акаунтом:

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

Вмикайте це лише для Plugin, яким ви довіряєте отримання вмісту
вхідних повідомлень WhatsApp та ідентифікаторів.

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у форматі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох акаунтів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями каналу за замовчуванням для цього акаунта.

    Деталі поведінки під час виконання:

    - прив’язування зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволяється за замовчуванням
    - OpenClaw ніколи не виконує автоматичне прив’язування вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Групова політика + allowlist">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, усі групи є допустимими
       - якщо `groups` вказано, він працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні групові повідомлення

    Резервне значення allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist відправників оцінюються до активації за згадкою/відповіддю

    Примітка: якщо блок `channels.whatsapp` повністю відсутній, резервне значення group-policy під час виконання — `allowlist` (із попередженням у логах), навіть якщо встановлено `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    За замовчуванням відповіді в групі вимагають згадки.

    Виявлення згадок включає:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє перевірку згадки; це **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Поведінка особистого номера і самочату

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються захисні механізми самочату WhatsApp:

- пропускати read receipts для ходів самочату
- ігнорувати поведінку автоматичного тригера mention-JID, яка інакше згадувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в самочаті за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний конверт + контекст відповіді">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний конверт.

    Якщо існує цитована відповідь, контекст додається у такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, якщо доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Заповнювачі медіа і витягування локації/контактів">
    Вхідні повідомлення лише з медіа нормалізуються за допомогою заповнювачів, таких як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіла повідомлень про локацію використовують стислий текст координат. Мітки/коментарі локації та дані контакту/vCard відображаються як fenced недовірені метадані, а не як вбудований текст prompt.

  </Accordion>

  <Accordion title="Ін’єкція історії очікування групи">
    Для груп необроблені повідомлення можуть буферизуватися та ін’єктуватися як контекст, коли бота нарешті буде активовано.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери ін’єкції:

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

    Перевизначення для окремого акаунта:

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

    Ходи самочату пропускають read receipts, навіть якщо вони глобально увімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на частини">
    - ліміт частини за замовчуванням: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною розбиття
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються payload зображень, відео, аудіо (голосові PTT-нотатки) і документів
    - payload відповідей зберігають `audioAsVoice`; WhatsApp надсилає аудіомедіа як голосові PTT-нотатки Baileys
    - аудіо не у форматі Ogg, включно з MP3/WebM-виводом Microsoft Edge TTS, транскодується в Ogg/Opus перед доставкою як PTT
    - нативне аудіо Ogg/Opus надсилається з `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - підтримується відтворення анімованих GIF через `gifPlayback: true` під час надсилання відео
    - підписи застосовуються до першого медіаелемента під час надсилання payload відповідей з кількома медіаелементами
    - джерелом медіа можуть бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа і резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для окремого акаунта використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебір якості), щоб вкладатися в ліміти
    - у разі помилки надсилання медіа резервний механізм для першого елемента надсилає текстове попередження замість того, щоб мовчки втратити відповідь
  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповіді, коли вихідні відповіді видимо цитують вхідне повідомлення. Керується через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише першу частину вихідної відповіді                        |
| `"all"`     | Цитувати кожну частину вихідної відповіді                             |
| `"batched"` | Цитувати поставлені в чергу пакетні відповіді, залишаючи негайні відповіді без цитування |

За замовчуванням — `"off"`. Перевизначення для окремих акаунтів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` визначає, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень       | Реакції підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------ | --------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`      | Ні                    | Ні                           | Жодних реакцій                                   |
| `"ack"`      | Так                   | Ні                           | Лише реакції підтвердження (отримання до відповіді) |
| `"minimal"`  | Так                   | Так (консервативно)          | Підтвердження + реакції агента з консервативними вказівками |
| `"extensive"`| Так                   | Так (заохочувано)            | Підтвердження + реакції агента з заохочувальними вказівками |

За замовчуванням: `"minimal"`.

Перевизначення для окремих акаунтів використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

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
Реакції підтвердження залежать від `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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

- надсилаються негайно після прийняття вхідного повідомлення (до відповіді)
- збої логуються, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, активовані згадкою; групова активація `always` обходить цю перевірку
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька акаунтів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір акаунта та значення за замовчуванням">
    - ідентифікатори акаунтів беруться з `channels.whatsapp.accounts`
    - вибір акаунта за замовчуванням: `default`, якщо присутній, інакше перший налаштований ідентифікатор акаунта (відсортований)
    - ідентифікатори акаунтів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність зі застарілими варіантами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв з акаунтом за замовчуванням
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього акаунта.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням (вимикаються через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: статус каналу показує, що він не пов’язаний.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл перепідключення">
    Симптом: пов’язаний акаунт із повторюваними відключеннями або спробами перепідключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби повторно прив’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються з помилкою, якщо для цільового акаунта немає активного слухача Gateway.

    Переконайтеся, що Gateway запущений і акаунт пов’язаний.

  </Accordion>

  <Accordion title="Групові повідомлення несподівано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадкою (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тож залишайте лише один `groupPolicy` на область

  </Accordion>

  <Accordion title="Попередження про середовище виконання Bun">
    Середовище виконання WhatsApp Gateway має використовувати Node. Bun позначено як несумісний для стабільної роботи WhatsApp/Telegram Gateway.
  </Accordion>
</AccordionGroup>

## Системні prompt

WhatsApp підтримує системні prompt у стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Спочатку визначається ефективна мапа `groups`: якщо акаунт задає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук prompt виконується в отриманій єдиній мапі:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** його ключ `systemPrompt` визначений. Якщо `systemPrompt` — порожній рядок (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Системний prompt wildcard для груп** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Спочатку визначається ефективна мапа `direct`: якщо акаунт задає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук prompt виконується в отриманій єдиній мапі:

1. **Системний prompt для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного peer існує в мапі **і** його ключ `systemPrompt` визначений. Якщо `systemPrompt` — порожній рядок (`""`), wildcard пригнічується і системний prompt не застосовується.
2. **Системний prompt wildcard для прямих чатів** (`direct["*"].systemPrompt`): використовується, коли запис конкретного peer повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Примітка: `dms` залишається спрощеним контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`); перевизначення prompt розміщуються в `direct`.

**Відмінність від поведінки Telegram з кількома акаунтами:** У Telegram кореневий `groups` навмисно пригнічується для всіх акаунтів у конфігурації з кількома акаунтами — навіть для акаунтів, які не визначають власний `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей захист: кореневі `groups` і `direct` завжди успадковуються акаунтами, які не визначають перевизначення на рівні акаунта, незалежно від кількості налаштованих акаунтів. У конфігурації WhatsApp з кількома акаунтами, якщо вам потрібні prompt для груп або прямих чатів на рівні окремого акаунта, явно визначайте повну мапу в кожному акаунті, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` — це одночасно мапа конфігурації для окремих груп і allowlist груп на рівні чату. На рівні кореня або акаунта `groups["*"]` означає «усі групи допущено» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб допустимими були лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як значення prompt за замовчуванням. Натомість повторіть prompt у кожному явно дозволеному записі групи.
- Допуск груп і авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до групової обробки, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає конфігурацію прямого чату за замовчуванням після того, як DM уже допущено через `dmPolicy` разом із правилами `allowFrom` або pairing-store.

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

Важливі поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька акаунтів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні акаунта
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Прив’язування](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
