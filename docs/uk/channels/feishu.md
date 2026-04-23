---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд, можливості та налаштування бота Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-23T20:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76565e89007211ba194ea9ab47ba926f5c9b5d12782d046bc94995a075671f02
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та спільно виконують роботу.

**Статус:** готово до production для DM ботів і групових чатів. WebSocket — режим за замовчуванням; режим webhook є необов’язковим.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.23 або новіший.** Щоб перевірити, виконайте `openclaw --version`. Щоб оновити, виконайте `openclaw update`.

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

### Прямі повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати боту прямі повідомлення:

- `"pairing"` — невідомі користувачі отримують код спарювання; схваліть через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі прямі повідомлення

**Схвалити запит на спарювання:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика для груп** (`channels.feishu.groupPolicy`):

| Value         | Behavior                                |
| ------------- | --------------------------------------- |
| `"open"`      | Відповідати на всі повідомлення в групах |
| `"allowlist"` | Відповідати лише групам із `groupAllowFrom` |
| `"disabled"`  | Вимкнути всі повідомлення в групах      |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`

---

## Приклади налаштування груп

### Дозволити всі групи, @згадка не потрібна

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
      // IDs груп мають вигляд: oc_xxx
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
          // User open_ids мають вигляд: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Отримання ID групи/користувача

### ID групи (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті й перейдіть до **Settings**. ID групи (`chat_id`) вказано на сторінці налаштувань.

![Отримання ID групи](/images/feishu-get-group-id.png)

### ID користувача (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту пряме повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Шукайте `open_id` у виводі журналу. Ви також можете перевірити запити на спарювання, які очікують розгляду:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Command   | Description                     |
| --------- | ------------------------------- |
| `/status` | Показати статус бота            |
| `/reset`  | Скинути поточну сесію           |
| `/model`  | Показати або змінити AI-модель  |

> Feishu/Lark не підтримує вбудовані меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @згадуєте бота (типово це обов’язково)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано й схвалено в Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні дозволи доступу
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Витік App Secret

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у вашій конфігурації
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
          name: "Primary bot",
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

`defaultAccount` визначає, який обліковий запис використовується, коли вихідні API не вказують `accountId`.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `30` МБ)

### Streaming

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли цю можливість увімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути потокове виведення в картці (типово: true)
      blockStreaming: true, // увімкнути потокове виведення на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квот

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропустити виклики реакції набору
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропустити пошук профілів відправників

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

Feishu/Lark підтримує ACP для прямих повідомлень і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

У прямому повідомленні або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для прямих повідомлень і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до цієї сесії ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб спрямовувати прямі повідомлення або групи Feishu/Lark до різних агентів.

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
- `match.peer.kind`: `"direct"` (DM) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Див. [Отримання ID групи/користувача](#get-groupuser-ids), щоб дізнатися, як їх знайти.

---

## Довідник із конфігурації

Повна конфігурація: [Gateway configuration](/uk/gateway/configuration)

| Setting                                           | Description                              | Default          |
| ------------------------------------------------- | ---------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                 | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)          | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації | `default`        |
| `channels.feishu.verificationToken`               | Потрібно для режиму webhook              | —                |
| `channels.feishu.encryptKey`                      | Потрібно для режиму webhook              | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                    | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                   | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                               | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для облікового запису | `feishu`         |
| `channels.feishu.dmPolicy`                        | Політика прямих повідомлень              | `allowlist`      |
| `channels.feishu.allowFrom`                       | allowlist для прямих повідомлень (список `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist для груп                       | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу       | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення            | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Ліміт розміру медіа                      | `30`             |
| `channels.feishu.streaming`                       | Потокове виведення в картці              | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове виведення на рівні блоків       | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору                 | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників | `true`           |

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

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (включно з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості авторингу Feishu/Lark)

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа зберігають прив’язку до гілки під час відповіді на повідомлення в гілці

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і процес спарювання
- [Групи](/uk/channels/groups) — поведінка групових чатів і керування через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
