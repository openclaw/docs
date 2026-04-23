---
read_when:
    - Робота над поведінкою WhatsApp/web channel або маршрутизацією inbox
summary: Підтримка каналу WhatsApp, керування доступом, поведінка доставки та операції
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T20:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54de9a91b2d43a9e4b8215129d40864fd08fb6a2f34fbb9828b1ce57a31cf66e
    source_path: channels/whatsapp.md
    workflow: 15
---

Стан: готово до production через WhatsApp Web (Baileys). Gateway керує прив’язаною сесією (або сесіями).

## Встановлення (за потреби)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  запропонують встановити Plugin WhatsApp, коли ви вперше його виберете.
- `openclaw channels login --channel whatsapp` також пропонує потік встановлення, коли
  Plugin ще не присутній.
- Dev channel + git checkout: типово використовується локальний шлях до Plugin.
- Stable/Beta: типово використовується npm-пакет `@openclaw/whatsapp`.

Ручне встановлення також доступне:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони конфігурації каналів і приклади.
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

    Для конкретного акаунта:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший pairing-запит (якщо використовується режим pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing-запити спливають через 1 годину. Кількість очікувальних запитів обмежена до 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує, коли це можливо, запускати WhatsApp на окремому номері. (Метадані каналу та потік налаштування оптимізовані для такого сценарію, але конфігурації з особистим номером також підтримуються.)
</Note>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Окремий номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist-и DM і межі маршрутизації
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

  <Accordion title="Запасний варіант із особистим номером">
    Onboarding підтримує режим особистого номера та записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    Під час виконання захист self-chat спирається на прив’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Сфера каналу лише WhatsApp Web">
    Канал платформи повідомлень у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    Окремого каналу обміну повідомленнями Twilio WhatsApp у вбудованому реєстрі чат-каналів немає.

  </Accordion>
</AccordionGroup>

## Модель виконання

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Вихідне надсилання вимагає активного слухача WhatsApp для цільового акаунта.
- Чати статусів і розсилок ігноруються (`@status`, `@broadcast`).
- Прямі чати використовують правила DM-сесій (`session.dmScope`; типове значення `main` зводить DM до головної сесії агента).
- Групові сесії ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- Транспорт WhatsApp Web враховує стандартні proxy-змінні середовища на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Надавайте перевагу proxy-конфігурації на рівні хоста, а не специфічним для каналу налаштуванням proxy WhatsApp.

## Керування доступом і активація

<Tabs>
  <Tab title="Політика DM">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (вимагає, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (внутрішньо нормалізуються).

    Перевизначення для кількох акаунтів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над значеннями канального рівня для цього акаунта.

    Деталі поведінки під час виконання:

    - pairing-и зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - якщо жоден allowlist не налаштовано, прив’язаний власний номер дозволяється типово
    - вихідні DM `fromMe` ніколи не pair-яться автоматично

  </Tab>

  <Tab title="Групова політика + allowlist-и">
    Доступ до груп має два шари:

    1. **Allowlist членства в групі** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, усі групи вважаються придатними
       - якщо `groups` присутній, він працює як allowlist груп (`"*"` дозволено)

    2. **Політика відправників у групі** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має збігатися з `groupAllowFrom` (або `*`)
       - `disabled`: блокувати весь вхідний груповий трафік

    Запасний варіант allowlist відправників:

    - якщо `groupAllowFrom` не задано, під час виконання використовується `allowFrom`, якщо він доступний
    - allowlist-и відправників перевіряються до активації за згадкою/відповіддю

    Примітка: якщо блоку `channels.whatsapp` узагалі не існує, запасне значення групової політики під час виконання — `allowlist` (із warning-логом), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Згадки + /activation">
    Відповіді в групах типово вимагають згадки.

    Визначення згадок включає:

    - явні згадки WhatsApp для ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, запасний варіант `messages.groupChat.mentionPatterns`)
    - неявне визначення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитування/відповідь лише задовольняє шлюзування за згадкою; це **не** надає авторизацію відправника
    - при `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сесії:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сесії (а не глобальну конфігурацію). Вона захищена правами власника.

  </Tab>
</Tabs>

## Поведінка особистого номера та self-chat

Коли прив’язаний власний номер також присутній у `allowFrom`, активуються запобіжники self-chat у WhatsApp:

- пропускати підтвердження прочитання для ходів self-chat
- ігнорувати поведінку автозапуску за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді self-chat типово використовують `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний envelope + контекст reply">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих reply також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Маркери медіа та видобування location/contact">
    Вхідні повідомлення лише з медіа нормалізуються маркерами на кшталт:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Тіла location використовують стислий текст координат. Мітки/коментарі location і дані contact/vCard відображаються як огороджені недовірені метадані, а не як вбудований текст prompt.

  </Accordion>

  <Accordion title="Впровадження pending-історії групи">
    Для груп необроблені повідомлення можуть буферизуватися і впроваджуватися як контекст, коли бот нарешті запускається.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - запасний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери впровадження:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Підтвердження прочитання">
    Підтвердження прочитання типово ввімкнені для прийнятих вхідних повідомлень WhatsApp.

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

    Перевизначення для конкретного акаунта:

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

    Для ходів self-chat підтвердження прочитання пропускаються навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на фрагменти та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на фрагменти">
    - типовий ліміт фрагмента: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім переходить до безпечного розбиття за довжиною
  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримуються payload-и image, video, audio (PTT voice-note) і document
    - `audio/ogg` переписується як `audio/ogg; codecs=opus` для сумісності з voice-note
    - анімоване відтворення GIF підтримується через `gifPlayback: true` для video-send
    - captions застосовуються до першого елемента медіа під час надсилання payload-ів відповіді з кількома медіа
    - джерелом медіа можуть бути HTTP(S), `file://` або локальні шляхи
  </Accordion>

  <Accordion title="Обмеження розміру медіа та запасна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для конкретного акаунта використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб уміститися в ліміти
    - якщо надсилання медіа не вдається, запасний варіант для першого елемента надсилає текстове попередження замість тихого відкидання відповіді
  </Accordion>
</AccordionGroup>

## Цитування відповіді

WhatsApp підтримує нативне цитування відповіді, де вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення | Поведінка                                                                          |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Цитувати вхідне повідомлення, коли провайдер це підтримує; інакше не цитувати      |
| `"on"`   | Завжди цитувати вхідне повідомлення; якщо цитування відхилено, перейти до звичайного надсилання |
| `"off"`  | Ніколи не цитувати; надсилати як звичайне повідомлення                             |

Типове значення — `"auto"`. Перевизначення для конкретного акаунта використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень       | Ack-реакції | Реакції, ініційовані агентом | Опис                                              |
| ------------ | ----------- | ---------------------------- | ------------------------------------------------- |
| `"off"`      | Ні          | Ні                           | Жодних реакцій                                    |
| `"ack"`      | Так         | Ні                           | Лише ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`  | Так         | Так (обережно)               | Ack + реакції агента з обережними настановами     |
| `"extensive"`| Так         | Так (заохочуються)           | Ack + реакції агента із заохочувальними настановами |

Типове значення: `"minimal"`.

Перевизначення для конкретного акаунта використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Ack-реакції

WhatsApp підтримує негайні ack-реакції при отриманні вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції шлюзуються через `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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
- режим груп `mentions` реагує на ходи, запущені згадкою; групова активація `always` працює як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Кілька акаунтів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір акаунта і типові значення">
    - ідентифікатори акаунтів беруться з `channels.whatsapp.accounts`
    - вибір типового акаунта: `default`, якщо він присутній; інакше — перший налаштований ідентифікатор акаунта (відсортований)
    - ідентифікатори акаунтів внутрішньо нормалізуються для пошуку
  </Accordion>

  <Accordion title="Шляхи до облікових даних і сумісність із застарілими варіантами">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - резервний файл: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового акаунта
  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього акаунта.

    У застарілих каталогах автентифікації `oauth.json` зберігається, тоді як файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Шлюзи дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, типово ввімкнені (вимкнути через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не прив’язано (потрібен QR)">
    Симптом: стан каналу показує, що його не прив’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Прив’язано, але відключено / цикл повторного підключення">
    Симптом: прив’язаний акаунт із повторюваними відключеннями або спробами повторного підключення.

    Виправлення:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    За потреби переприв’яжіть через `channels login`.

  </Accordion>

  <Accordion title="Немає активного listener під час надсилання">
    Вихідне надсилання швидко завершується помилкою, якщо для цільового акаунта немає активного listener gateway.

    Переконайтеся, що gateway запущений і акаунт прив’язаний.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевіряйте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - шлюзування за згадками (`requireMention` + шаблони згадок)
    - дубльовані ключі в `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тож зберігайте лише один `groupPolicy` на кожну область

  </Accordion>

  <Accordion title="Попередження про runtime Bun">
    Runtime gateway WhatsApp має використовувати Node. Bun позначений як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні prompt-и

WhatsApp підтримує системні prompt-и в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Ефективна мапа `groups` визначається спочатку: якщо акаунт задає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Пошук prompt потім виконується за отриманою єдиною мапою:

1. **Системний prompt для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, якщо запис конкретної групи задає `systemPrompt`.
2. **Системний prompt wildcard-групи** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи відсутній або не задає `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Ефективна мапа `direct` визначається спочатку: якщо акаунт задає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Пошук prompt потім виконується за отриманою єдиною мапою:

1. **Системний prompt для конкретного direct-чату** (`direct["<peerId>"].systemPrompt`): використовується, якщо запис конкретного peer задає `systemPrompt`.
2. **Системний prompt wildcard direct-чату** (`direct["*"].systemPrompt`): використовується, коли запис конкретного peer відсутній або не задає `systemPrompt`.

Примітка: `dms` залишається полегшеним набором перевизначень історії для окремих DM (`dms.<id>.historyLimit`); перевизначення prompt живуть у `direct`.

**Відмінність від поведінки Telegram з кількома акаунтами:** у Telegram кореневий `groups` навмисно пригнічується для всіх акаунтів у конфігурації з кількома акаунтами — навіть для акаунтів, які не задають власний `groups` — щоб бот не отримував групові повідомлення для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і `direct` завжди успадковуються акаунтами, які не мають перевизначення на рівні акаунта, незалежно від кількості налаштованих акаунтів. У конфігурації WhatsApp з кількома акаунтами, якщо вам потрібні prompt-и для груп або direct-чату для кожного акаунта окремо, явно задайте повну мапу в кожному акаунті, а не покладайтеся на кореневі типові значення.

Важлива поведінка:

- `channels.whatsapp.groups` — це і мапа конфігурації для окремих груп, і allowlist груп на рівні чату. На кореневому рівні або в області акаунта `groups["*"]` означає «усі групи допущені» для цієї області.
- Додавайте wildcard `systemPrompt` для груп лише тоді, коли ви вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним залишався лише фіксований набір group ID, не використовуйте `groups["*"]` як типове значення prompt. Натомість повторіть prompt у кожному явно дозволеному записі групи.
- Допуск групи й авторизація відправника — це окремі перевірки. `groups["*"]` розширює набір груп, які можуть потрапити в групову обробку, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправників і далі окремо контролюється через `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію direct-чату після того, як DM уже допущено через `dmPolicy` плюс `allowFrom` або правила pairing-store.

Приклад:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Використовуйте, лише якщо в кореневій області мають допускатися всі групи.
        // Застосовується до всіх акаунтів, які не задають власну мапу groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Застосовується до всіх акаунтів, які не задають власну мапу direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Цей акаунт задає власну groups, тож коренева groups повністю
            // замінюється. Щоб зберегти wildcard, задайте "*" явно і тут.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Використовуйте, лише якщо в цьому акаунті мають допускатися всі групи.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Цей акаунт задає власну direct, тож кореневі записи direct
            // повністю замінюються. Щоб зберегти wildcard, задайте "*" явно і тут.
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

- [Довідник конфігурації - WhatsApp](/uk/gateway/configuration-reference#whatsapp)

Ключові поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька акаунтів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні акаунта
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt-и: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Pairing](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
