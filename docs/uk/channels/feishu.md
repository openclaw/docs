---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, функції та налаштування
title: Feishu
x-i18n:
    generated_at: "2026-04-27T10:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f24fada0adea25fc4f2ea93a1c91af5a0fd86aebe90901aa20031c59a982a970
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та спільно виконують роботу.

**Статус:** готово до використання в продакшені для особистих повідомлень боту та групових чатів. WebSocket — режим за замовчуванням; режим webhook є необов’язковим.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Щоб перевірити версію, запустіть `openclaw --version`. Оновіть за допомогою `openclaw update`.
</Note>

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Відскануйте QR-код у мобільному застосунку Feishu/Lark, щоб автоматично створити бота Feishu/Lark.
  </Step>
  
  <Step title="Після завершення налаштування перезапустіть Gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Керування доступом

### Особисті повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати особисті повідомлення боту:

- `"pairing"` — невідомі користувачі отримують код сполучення; схвалення виконується через CLI
- `"allowlist"` — лише користувачі, перелічені в `allowFrom`, можуть спілкуватися (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі особисті повідомлення

**Схвалити запит на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Value         | Поведінка                                  |
| ------------- | ------------------------------------------ |
| `"open"`      | Відповідати на всі повідомлення в групах   |
| `"allowlist"` | Відповідати лише в групах із `groupAllowFrom` |
| `"disabled"`  | Вимкнути всі групові повідомлення          |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- Згадки лише для широкого сповіщення `@all` і `@_all` не вважаються згадками бота. Повідомлення, яке містить і `@all`, і пряму згадку бота, усе одно вважається згадкою бота.

---

## Приклади налаштування груп

### Дозволити всі групи, без обов’язкової @згадки

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все одно вимагати @згадку

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
      // Ідентифікатори груп мають вигляд: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Обмежити відправників у межах групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id користувачів мають вигляд: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Отримання ID груп/користувачів

### ID груп (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть до **Settings**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Отримання ID групи](/images/feishu-get-group-id.png)

### ID користувачів (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту особисте повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виводі журналу. Ви також можете перевірити запити на сполучення, що очікують на розгляд:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Command   | Опис                         |
| --------- | ---------------------------- |
| `/status` | Показати стан бота           |
| `/reset`  | Скинути поточну сесію        |
| `/model`  | Показати або змінити AI-модель |

<Note>
Feishu/Lark не підтримує вбудовані меню slash-команд, тож надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @ (це потрібно за замовчуванням)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано та схвалено в Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі необхідні дозволи
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Витік App Secret

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у своїй конфігурації
3. Перезапустіть Gateway: `openclaw gateway restart`

---

## Розширене налаштування

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
          name: "Основний бот",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Резервний бот",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` визначає, який обліковий запис використовується, коли вихідні API не вказують `accountId`.
`accounts.<id>.tts` використовує ту саму структуру, що й `messages.tts`, і глибоко об’єднується поверх
глобальної конфігурації TTS, тож у багатоботних конфігураціях Feishu можна зберігати спільні
облікові дані провайдерів глобально, перевизначаючи для кожного облікового запису лише голос, модель, персону або автоматичний режим.

### Ліміти повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `30` МБ)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли цю функцію ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути виведення потокових карток (типово: true)
      blockStreaming: true, // увімкнути потокове передавання на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб не виконувати виклики реакції набору тексту
- `resolveSenderNames` (типово `true`): установіть `false`, щоб не виконувати пошук профілів відправників

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

### Сесії ACP

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тож використовуйте повідомлення `/acp ...` безпосередньо в розмові.

#### Постійна прив’язка ACP

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

У особистих повідомленнях або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до цієї сесії ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб спрямовувати особисті повідомлення або групи Feishu/Lark до різних агентів.

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
- `match.peer.kind`: `"direct"` (особисті повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Поради щодо пошуку дивіться в розділі [Отримання ID груп/користувачів](#get-groupuser-ids).

---

## Довідник з конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Setting                                           | Опис                                         | Default          |
| ------------------------------------------------- | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                     | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | Передавання подій (`websocket` або `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації | `default`        |
| `channels.feishu.verificationToken`               | Потрібний для режиму webhook                 | —                |
| `channels.feishu.encryptKey`                      | Потрібний для режиму webhook                 | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID застосунку                                | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для облікового запису  | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Перевизначення TTS для облікового запису     | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень               | `allowlist`      |
| `channels.feishu.allowFrom`                       | Список дозволених для особистих повідомлень (список `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                       | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                    | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи     | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути окрему групу              | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Ліміт розміру медіа                          | `30`             |
| `channels.feishu.streaming`                       | Виведення потокових карток                   | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове передавання на рівні блоків         | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту              | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників   | `true`           |

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

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як заповнювачі медіа замість
необробленого JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосового повідомлення та виконує спільну транскрипцію аудіо перед
ходом агента, тож агент отримує розшифрований текст мовлення. Якщо Feishu уже містить
текст транскрипції безпосередньо в аудіокорисному навантаженні, цей текст використовується без додаткового
виклику ASR. Без провайдера транскрипції аудіо агент усе одно отримує
заповнювач `<media:audio>` разом зі збереженим вкладенням, а не необроблене корисне навантаження
ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (зокрема з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості авторингу Feishu/Lark)

Власні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують
завантаження медіа у форматі Ogg/Opus (`file_type: "opus"`). Наявні медіафайли `.opus` і `.ogg`
надсилаються безпосередньо як вбудоване аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати
перекодовуються в 48 кГц Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує
голосову доставку (`audioAsVoice` / інструмент повідомлень `asVoice`, зокрема голосові
відповіді TTS у форматі голосових нотаток). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або
перетворення не вдається, OpenClaw повертається до вкладення файлу та записує причину в журнал.

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа зберігають прив’язку до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` власні
тематичні групи Feishu/Lark використовують `thread_id` (`omt_*`) події як канонічний ключ
сесії теми. Звичайні групові відповіді, які OpenClaw перетворює на гілки, і далі
використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший хід і подальший хід
залишалися в одній сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація в особистих повідомленнях і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
