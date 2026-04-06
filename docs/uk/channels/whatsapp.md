---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, контроль доступу, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-06T15:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2ce84d869ace6c0bebd9ec17bdbbef997a5c31e5da410b02a19a0f103f7359
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web-канал)

Статус: готовий до production через WhatsApp Web (Baileys). Gateway керує прив’язаними сесіями.

## Встановлення (за потреби)

- Онбординг (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити плагін WhatsApp, коли ви вперше вибираєте його.
- `openclaw channels login --channel whatsapp` також пропонує процес встановлення, якщо
  плагін ще не присутній.
- Канал розробки + git checkout: за замовчуванням використовується локальний шлях до плагіна.
- Stable/Beta: за замовчуванням використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також залишається доступним:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Прив’язка" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — прив’язка для невідомих відправників.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
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

    Запити на прив’язку спливають через 1 годину. Кількість запитів у стані очікування обмежена до 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та процес налаштування оптимізовані для такого сценарію, але конфігурації з особистим номером також підтримуються.)
</Note>

## Схеми розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist-и DM та межі маршрутизації
    - менша ймовірність плутанини з чатом із самим собою

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
    Онбординг підтримує режим особистого номера та записує базову конфігурацію, дружню до чату із самим собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист для чату із самим собою спирається на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Область каналу лише для WhatsApp Web">
    Канал платформи обміну повідомленнями у поточній архітектурі каналів OpenClaw побудований на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі чат-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом перепідключення.
- Надсилання назовні вимагає активного слухача WhatsApp для цільового облікового запису.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила сесій DM (`session.dmScope`; значення за замовчуванням `main` зводить DM до основної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу конфігурації проксі на рівні хоста, а не специфічним налаштуванням проксі WhatsApp для каналу.

## Контроль доступу та активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями канального рівня для цього облікового запису.

    Деталі поведінки під час виконання:

    - прив’язки зберігаються в channel allow-store і об’єднуються з налаштованим `allowFrom`
    - якщо allowlist не налаштовано, прив’язаний власний номер дозволяється за замовчуванням
    - вихідні `fromMe` DM ніколи не прив’язуються автоматично

  </Tab>

  <Tab title="Групова політика + allowlist-и">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи є допустимими
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні групові повідомлення

    Резервна логіка allowlist-а відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist-и відправників перевіряються перед активацією за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` взагалі не існує, резервна групова політика під час виконання — `allowlist` (із попередженням у журналі), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Для відповідей у групі за замовчуванням потрібна згадка.

    Виявлення згадки включає:

    - явні згадки ідентичності бота у WhatsApp
    - налаштовані шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє вимогу згадки; це **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Доступ до нього обмежений власником.

  </Tab>
</Tabs>

## Поведінка особистого номера та чату із самим собою

Коли прив’язаний власний номер також присутній у `allowFrom`, активується захист WhatsApp для чату із самим собою:

- пропускати підтвердження прочитання для ходів у чаті із самим собою
- ігнорувати поведінку автозапуску за JID-згадкою, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в чаті із самим собою за замовчуванням мають формат `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний конверт + контекст відповіді">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний конверт.

    Якщо існує цитована відповідь, контекст додається в такому форматі:

    ```text
    [Відповідь на <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Відповідь]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).

  </Accordion>

  <Accordion title="Заповнювачі медіа та витягування геолокації/контактів">
    Вхідні повідомлення, що містять лише медіа, нормалізуються із заповнювачами, такими як:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Дані геолокації та контактів нормалізуються в текстовий контекст перед маршрутизацією.

  </Accordion>

  <Accordion title="Вставка історії очікування для груп">
    Для груп необроблені повідомлення можуть буферизуватися і вставлятися як контекст, коли бот нарешті активується.

    - ліміт за замовчуванням: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставки:

    - `[Повідомлення чату з часу вашої останньої відповіді — для контексту]`
    - `[Поточне повідомлення — відповідайте на нього]`

  </Accordion>

  <Accordion title="Підтвердження прочитання">
    Підтвердження прочитання ввімкнені за замовчуванням для прийнятих вхідних повідомлень WhatsApp.

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

    Перевизначення для кожного облікового запису:

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

    Для ходів у чаті із самим собою підтвердження прочитання пропускаються, навіть якщо вони глобально ввімкнені.

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
    - підтримуються payload-и image, video, audio (голосове повідомлення PTT) і document
    - `audio/ogg` переписується як `audio/ogg; codecs=opus` для сумісності з голосовими повідомленнями
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання video
    - підписи застосовуються до першого елемента медіа під час надсилання payload-ів відповіді з кількома медіа
    - джерелом медіа може бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - обмеження збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - обмеження надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (за замовчуванням `50`)
    - перевизначення для кожного облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб відповідати обмеженням
    - у разі помилки надсилання медіа резервна логіка для першого елемента надсилає текстове попередження замість тихого пропуску відповіді
  </Accordion>
</AccordionGroup>

## Рівень реакцій

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень        | Реакції-підтвердження | Реакції, ініційовані агентом | Опис                                             |
| ------------- | --------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні                    | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так                   | Ні                           | Лише реакції-підтвердження (отримання до відповіді) |
| `"minimal"`   | Так                   | Так (консервативно)          | Підтвердження + реакції агента з консервативними вказівками |
| `"extensive"` | Так                   | Так (заохочуються)           | Підтвердження + реакції агента із заохочувальними вказівками |

За замовчуванням: `"minimal"`.

Перевизначення для кожного облікового запису використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакції-підтвердження

WhatsApp підтримує миттєві реакції-підтвердження при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Реакції-підтвердження залежать від `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

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
- помилки логуються, але не блокують звичайну доставку відповіді
- у груповому режимі `mentions` реакція ставиться на ходах, активованих згадкою; групова активація `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та значення за замовчуванням">
    - ідентифікатори облікових записів беруться з `channels.whatsapp.accounts`
    - вибір облікового запису за замовчуванням: `default`, якщо присутній, інакше перший налаштований id облікового запису (відсортований)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність зі спадщиною">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла автентифікація за замовчуванням у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для сценаріїв з обліковим записом за замовчуванням
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан автентифікації WhatsApp для цього облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та запис конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Обмеження дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Запис конфігурації, ініційований каналом, увімкнений за замовчуванням (вимикається через `channels.whatsapp.configWrites=false`).

## Усунення проблем

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не прив’язано.

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
    Вихідні надсилання одразу завершуються помилкою, коли для цільового облікового запису не існує активного слухача gateway.

    Переконайтеся, що gateway запущено і обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist-а `groups`
    - обмеження за згадкою (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому зберігайте лише один `groupPolicy` для кожної області

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway для WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основне посилання:

- [Довідник конфігурації - WhatsApp](/uk/gateway/configuration-reference#whatsapp)

Важливі поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Пов’язане

- [Прив’язка](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
