---
read_when:
    - Робота над поведінкою каналів WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T06:23:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Статус: готовий до production через WhatsApp Web (Baileys). Gateway керує прив’язаними сесіями.

## Встановлення (за потреби)

- Під час онбордингу (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  з’являється запит на встановлення WhatsApp Plugin під час першого вибору цього каналу.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  Plugin ще не встановлено.
- Канал розробки + git checkout: за замовчуванням використовується локальний шлях до Plugin.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Прив’язка" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — прив’язка для невідомих відправників.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
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

  <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Підтвердьте перший запит на прив’язку (якщо використовується режим прив’язки)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Термін дії запитів на прив’язку спливає через 1 годину. Кількість очікувальних запитів обмежена 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості використовувати WhatsApp з окремим номером. (Метадані каналу й процес налаштування оптимізовані саме для такого сценарію, але конфігурації з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
    - менша ймовірність плутанини із самочатом

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
    Онбординг підтримує режим особистого номера й записує базову конфігурацію, дружню до самочату:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист самочату орієнтується на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Сфера каналу лише для WhatsApp Web">
    Канал платформи обміну повідомленнями в поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі чат-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Для вихідного надсилання потрібен активний слухач WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Для прямих чатів використовуються правила сесій DM (`session.dmScope`; значення за замовчуванням `main` зводить DM до головної сесії агента).
- Сесії груп ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу проксі-конфігурації на рівні хоста, а не окремим налаштуванням проксі WhatsApp для каналу.

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у форматі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями каналу за замовчуванням для цього облікового запису.

    Деталі поведінки під час виконання:

    - прив’язки зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволяється за замовчуванням
    - OpenClaw ніколи не виконує автоматичну прив’язку для вихідних DM `fromMe` (повідомлень, які ви надсилаєте собі з прив’язаного пристрою)

  </Tab>

  <Tab title="Політика груп + allowlist">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` не вказано, усі групи є допустимими
       - якщо `groups` вказано, це працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників оминається
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення з груп

    Резервна поведінка allowlist відправників:

    - якщо `groupAllowFrom` не встановлено, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist відправників перевіряються до активації за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, резервна політика груп під час виконання — `allowlist` (із попередженням у журналі), навіть якщо встановлено `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Відповіді в групах за замовчуванням потребують згадки.

    Виявлення згадок включає:

    - явні згадки ідентичності бота у WhatsApp
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно — `messages.groupChat.mentionPatterns`)
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє вимогу згадки; це **не** надає авторизацію відправнику
    - при `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Доступ до неї обмежений власником.

  </Tab>
</Tabs>

## Особистий номер і поведінка самочату

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники самочату WhatsApp:

- пропускати квитанції про прочитання для ходів самочату
- ігнорувати автозапуск за JID згадки, який інакше надсилав би згадку вам самим
- якщо `messages.responsePrefix` не встановлено, відповіді в самочаті за замовчуванням використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний конверт + контекст відповіді">
    Вхідні повідомлення WhatsApp обгортаються в спільний вхідний конверт.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Заповнювачі медіа та вилучення локації/контактів">
    Вхідні повідомлення, що містять лише медіа, нормалізуються із заповнювачами на кшталт:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіла повідомлень з локацією використовують стислий текст координат. Підписи/коментарі локації та дані контактів/vCard рендеряться як відокремлені недовірені метадані, а не як вбудований текст запиту.

  </Accordion>

  <Accordion title="Вставка історії очікувальних груп">
    Для груп необроблені повідомлення можуть буферизуватися й вставлятися як контекст, коли бот нарешті активується.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставки:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Квитанції про прочитання">
    Квитанції про прочитання ввімкнені за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Ходи самочату пропускають квитанції про прочитання, навіть якщо вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, поділ на частини й медіа

<AccordionGroup>
  <Accordion title="Поділ тексту на частини">
    - ліміт частини за замовчуванням: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного поділу за довжиною
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються корисні навантаження image, video, audio (голосове повідомлення PTT) і document
    - `audio/ogg` переписується як `audio/ogg; codecs=opus` для сумісності з голосовими повідомленнями
    - відтворення анімованих GIF підтримується через `gifPlayback: true` для надсилання video
    - підписи застосовуються до першого елемента медіа під час надсилання корисних навантажень відповіді з кількома медіа
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (перебір розміру/якості), щоб відповідати обмеженням
    - якщо надсилання медіа завершується помилкою, резервний механізм для першого елемента надсилає текстове попередження замість того, щоб мовчки втратити відповідь
  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповіді, коли вихідні відповіді візуально цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення | Поведінка                                                                          |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Цитувати вхідне повідомлення, коли провайдер це підтримує; інакше пропускати цитування |
| `"on"`   | Завжди цитувати вхідне повідомлення; якщо цитування відхилено, перейти до звичайного надсилання |
| `"off"`  | Ніколи не цитувати; надсилати як звичайне повідомлення                            |

За замовчуванням використовується `"auto"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Рівень реакцій

`channels.whatsapp.reactionLevel` визначає, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень      | Ack-реакції | Реакції, ініційовані агентом | Опис                                           |
| ----------- | ----------- | ---------------------------- | ---------------------------------------------- |
| `"off"`     | Ні          | Ні                           | Жодних реакцій                                 |
| `"ack"`     | Так         | Ні                           | Лише ack-реакції (підтвердження до відповіді)  |
| `"minimal"` | Так         | Так (обережно)               | Ack + реакції агента з обережними вказівками   |
| `"extensive"` | Так       | Так (заохочуються)           | Ack + реакції агента із заохочувальними вказівками |

За замовчуванням: `"minimal"`.

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

WhatsApp підтримує миттєві ack-реакції при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції керуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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
- збої фіксуються в журналі, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, активовані згадкою; групова активація `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо він є, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність зі спадщиною">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла стандартна автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв стандартного облікового запису
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням (вимикаються через `channels.whatsapp.configWrites=false`).

## Усунення проблем

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу показує, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але від’єднано / цикл повторного підключення">
    Симптом: прив’язаний обліковий запис із повторюваними від’єднаннями або спробами повторного підключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Якщо потрібно, виконайте повторну прив’язку через `channels login`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання одразу завершуються помилкою, якщо для цільового облікового запису не існує активного слухача Gateway.

    Переконайтеся, що Gateway запущено й обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - обмеження за згадками (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому зберігайте лише один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження про runtime Bun">
    Runtime Gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Спочатку визначається ефективна мапа `groups`: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без deep merge). Пошук промпта потім виконується за отриманою єдиною мапою:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, якщо запис конкретної групи визначає `systemPrompt`.
2. **Системний промпт для wildcard групи** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи відсутній або не визначає `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Спочатку визначається ефективна мапа `direct`: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без deep merge). Пошук промпта потім виконується за отриманою єдиною мапою:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, якщо запис конкретного співрозмовника визначає `systemPrompt`.
2. **Системний промпт для wildcard прямого чату** (`direct["*"].systemPrompt`): використовується, коли запис конкретного співрозмовника відсутній або не визначає `systemPrompt`.

Примітка: `dms` залишається полегшеним контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`); перевизначення промптів розміщуються в `direct`.

**Відмінність від поведінки Telegram з кількома обліковими записами:** у Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у конфігурації з кількома обліковими записами — навіть для облікових записів, які не визначають власну `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і кореневі `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У конфігурації WhatsApp з кількома обліковими записами, якщо вам потрібні групові або прямі промпти на рівні окремого облікового запису, явно визначайте повну мапу в кожному обліковому записі, а не покладайтеся на кореневі значення за замовчуванням.

Важлива поведінка:

- `channels.whatsapp.groups` — це одночасно мапа конфігурації для окремих груп і allowlist груп на рівні чату. І на кореневому рівні, і в області облікового запису `groups["*"]` означає «усі групи допущені» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб допустимим був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як значення промпта за замовчуванням. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи й авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
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

## Вказівники довідника конфігурації

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
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
