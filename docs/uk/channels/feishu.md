---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд, можливості та конфігурація бота Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-29T05:57:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для спільної роботи, де команди спілкуються, діляться документами, керують календарями та працюють разом.

**Статус:** готово до production для приватних повідомлень ботам і групових чатів. WebSocket є типовим режимом; режим Webhook необов’язковий.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Виконайте `openclaw --version`, щоб перевірити. Оновіться за допомогою `openclaw update`.
</Note>

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Проскануйте QR-код мобільним застосунком Feishu/Lark, щоб автоматично створити бота Feishu/Lark.
  </Step>
  
  <Step title="Після завершення налаштування перезапустіть gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Контроль доступу

### Приватні повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати приватні повідомлення боту:

- `"pairing"` — невідомі користувачі отримують код сполучення; підтвердіть через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити публічні приватні повідомлення лише коли `allowFrom` містить `"*"`; з обмежувальними записами спілкуватися можуть лише відповідні користувачі
- `"disabled"` — вимкнути всі приватні повідомлення

**Підтвердити запит на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Значення      | Поведінка                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `"open"`      | Відповідати на всі повідомлення в групах                                                         |
| `"allowlist"` | Відповідати лише групам у `groupAllowFrom` або явно налаштованим у `groups.<chat_id>`            |
| `"disabled"`  | Вимкнути всі групові повідомлення; явні записи `groups.<chat_id>` не перевизначають це           |

Типово: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- Трансляційні лише `@all` і `@_all` не вважаються згадками бота. Повідомлення, яке згадує і `@all`, і бота напряму, усе одно зараховується як згадка бота.

---

## Приклади конфігурації груп

### Дозволити всі групи, без вимоги @згадки

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все ще вимагати @згадку

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Дозволити лише певні групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

У режимі `allowlist` ви також можете допустити групу, додавши явний запис `groups.<chat_id>`. Явні записи не перевизначають `groupPolicy: "disabled"`. Типові значення з wildcard у `groups.*` налаштовують відповідні групи, але самі по собі не допускають групи.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Обмежити відправників у групі

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Отримати ідентифікатори груп/користувачів

### Ідентифікатори груп (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть іконку меню у верхньому правому куті та перейдіть до **Налаштувань**. Ідентифікатор групи (`chat_id`) зазначено на сторінці налаштувань.

![Отримати ідентифікатор групи](/images/feishu-get-group-id.png)

### Ідентифікатори користувачів (`open_id`, формат: `ou_xxx`)

Запустіть gateway, надішліть приватне повідомлення боту, потім перевірте журнали:

```bash
openclaw logs --follow
```

Шукайте `open_id` у виводі журналу. Також можна перевірити запити на сполучення, що очікують:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                         |
| --------- | ---------------------------- |
| `/status` | Показати статус бота         |
| `/reset`  | Скинути поточний сеанс       |
| `/model`  | Показати або змінити модель ШІ |

<Note>
Feishu/Lark не підтримує нативні меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @згадали бота (це потрібно типово)
3. Перевірте, що `groupPolicy` не є `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано й схвалено у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **постійне підключення** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
5. Переконайтеся, що gateway працює: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### App Secret витік

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у своїй конфігурації
3. Перезапустіть gateway: `openclaw gateway restart`

---

## Розширена конфігурація

### Кілька облікових записів

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` керує тим, який обліковий запис використовується, коли вихідні API не вказують `accountId`.
`accounts.<id>.tts` використовує ту саму форму, що й `messages.tts`, і виконує глибоке злиття поверх
глобальної конфігурації TTS, тому налаштування Feishu з кількома ботами можуть зберігати спільні облікові дані
провайдера глобально, перевизначаючи лише голос, модель, персону або автоматичний режим
для кожного облікового запису.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `30` МБ)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли це ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надіслати повну відповідь одним повідомленням.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропустити виклики реакції набору тексту
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропустити пошуки профілів відправників

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Сеанси ACP

Feishu/Lark підтримує ACP для приватних повідомлень і повідомлень у групових тредах. ACP у Feishu/Lark керується текстовими командами — нативних меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійне прив’язування ACP

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Запуск ACP із чату

У приватному повідомленні або треді Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для приватних повідомлень і повідомлень у тредах Feishu/Lark. Подальші повідомлення у прив’язаній розмові спрямовуються безпосередньо до цього сеансу ACP.

### Маршрутизація кількох агентів

Використовуйте `bindings`, щоб спрямовувати приватні повідомлення або групи Feishu/Lark до різних агентів.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Поля маршрутизації:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (приватне повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ідентифікатор групи (`oc_xxx`)

Див. [Отримати ідентифікатори груп/користувачів](#get-groupuser-ids), щоб отримати поради щодо пошуку.

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                                      | Опис                                                                                          | Типово           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                                                                      | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)                                                               | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)                                                   | `websocket`      |
| `channels.feishu.defaultAccount`                  | Обліковий запис за замовчуванням для вихідної маршрутизації                                   | `default`        |
| `channels.feishu.verificationToken`               | Потрібно для режиму webhook                                                                   | —                |
| `channels.feishu.encryptKey`                      | Потрібно для режиму webhook                                                                   | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                                                                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                                                                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                                                                        | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID застосунку                                                                                 | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Секрет застосунку                                                                             | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису                                          | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Перевизначення TTS для окремого облікового запису                                             | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Політика DM                                                                                   | `allowlist`      |
| `channels.feishu.allowFrom`                       | Список дозволених DM (список open_id)                                                         | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                                                                 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                                                                        | —                |
| `channels.feishu.requireMention`                  | Вимагати @mention у групах                                                                    | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @mention для окремої групи; явні ID також допускають групу в режимі allowlist | успадковано      |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу                                                            | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                                                                       | `30`             |
| `channels.feishu.streaming`                       | Потокове виведення карток                                                                     | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове передавання на рівні блоків                                                          | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту                                                               | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників                                                    | `true`           |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Форматований текст (post)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Стікери

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як медіаплейсхолдери, а не
як необроблений JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосової нотатки й запускає спільну транскрипцію аудіо перед
ходом агента, тож агент отримує текстову розшифровку мовлення. Якщо Feishu містить
текст транскрипції безпосередньо в аудіо payload, цей текст використовується без
ще одного виклику ASR. Без провайдера транскрипції аудіо агент усе одно отримує
плейсхолдер `<media:audio>` разом зі збереженим вкладенням, а не необроблений
payload ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (зокрема потокові оновлення)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує повні можливості авторингу Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують
медіа для завантаження Ogg/Opus (`file_type: "opus"`). Наявні медіа `.opus` і `.ogg`
надсилаються безпосередньо як нативне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати
перекодовуються у 48kHz Ogg/Opus через `ffmpeg` лише тоді, коли відповідь запитує
доставку голосом (`audioAsVoice` / інструмент повідомлень `asVoice`, зокрема відповіді
TTS у вигляді голосових нотаток). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або
конвертація не вдається, OpenClaw повертається до вкладення файлу й записує причину в журнал.

### Потоки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в потоках
- ✅ Відповіді з медіа залишаються прив’язаними до потоку під час відповіді на повідомлення в потоці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні
тематичні групи Feishu/Lark використовують подію `thread_id` (`omt_*`) як канонічний
ключ тематичної сесії. Звичайні групові відповіді, які OpenClaw перетворює на потоки, і далі
використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший хід і наступний хід
залишалися в тій самій сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
