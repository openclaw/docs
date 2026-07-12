---
read_when:
    - Ви хочете підключити бота Yuanbao
    - Ви налаштовуєте канал Yuanbao
summary: Огляд, функції та налаштування бота Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T13:03:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao — це платформа ШІ-асистента від Tencent. Підтримуваний спільнотою plugin `openclaw-plugin-yuanbao` підключає ботів Yuanbao до OpenClaw через WebSocket для приватних повідомлень і групових чатів.

**Стан:** готовий до промислового використання для приватних повідомлень ботам і групових чатів. WebSocket — єдиний підтримуваний режим підключення. Цей plugin підтримує команда Tencent Yuanbao як зовнішній запис каталогу, а не ядро OpenClaw; наведені нижче відомості про конфігурацію та поведінку (крім установлення й загального інтерфейсу CLI) походять із власної документації plugin і не перевірені за вихідним кодом ядра OpenClaw.

## Швидкий початок

Потрібна версія OpenClaw 2026.4.10 або новіша. Перевірте версію командою `openclaw --version`; оновіть за допомогою `openclaw update`.

<Steps>
  <Step title="Додайте канал Yuanbao зі своїми обліковими даними">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` використовує розділені двокрапкою `appKey:appSecret`. Отримайте їх у застосунку Yuanbao, створивши бота в налаштуваннях свого застосунку.
  </Step>

  <Step title="Перезапустіть Gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Інтерактивне налаштування (альтернатива)

```bash
openclaw channels login --channel yuanbao
```

Дотримуйтеся підказок, щоб ввести App ID та App Secret.

## Керування доступом

### Приватні повідомлення

`channels.yuanbao.dm.policy`:

| Значення         | Поведінка                                                        |
| ---------------- | ---------------------------------------------------------------- |
| `open` (типово)  | Дозволити всіх користувачів                                      |
| `pairing`        | Невідомі користувачі отримують код сполучення; схвалення через CLI |
| `allowlist`      | Спілкуватися можуть лише користувачі з `allowFrom`                |
| `disabled`       | Вимкнути всі приватні повідомлення                               |

Схваліть запит на сполучення:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Групові чати

`channels.yuanbao.requireMention` (типово `true`): вимагати @згадку, перш ніж бот відповість у групі. Відповідь на власне повідомлення бота вважається неявною згадкою.

## Приклади конфігурації

Базове налаштування, відкрита політика приватних повідомлень:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Обмеження приватних повідомлень визначеними користувачами:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Вимкнення вимоги @згадки в групах:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Налаштування вихідної доставки:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // накопичувати до цієї кількості символів
      maxChars: 3000, // примусово розділяти після перевищення цього ліміту
      idleMs: 5000, // автоматично надсилати після тайм-ауту бездіяльності (мс)
    },
  },
}
```

Установіть `outboundQueueStrategy: "immediate"`, щоб надсилати кожну частину без буферизації.

## Поширені команди

| Команда    | Опис                              |
| ---------- | --------------------------------- |
| `/help`    | Показати доступні команди         |
| `/status`  | Показати стан бота                |
| `/new`     | Почати новий сеанс                |
| `/stop`    | Зупинити поточний запуск          |
| `/restart` | Перезапустити OpenClaw            |
| `/compact` | Стиснути контекст сеансу          |

Yuanbao підтримує вбудовані меню команд із косою рискою; команди автоматично синхронізуються з платформою під час запуску Gateway.

## Усунення несправностей

**Бот не відповідає в групових чатах:**

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @згадуєте бота (типово обов’язково)
3. Перевірте журнали: `openclaw logs --follow`

**Бот не отримує повідомлення:**

1. Переконайтеся, що бота створено та схвалено в застосунку Yuanbao
2. Переконайтеся, що `appKey` і `appSecret` налаштовані правильно
3. Переконайтеся, що Gateway працює: `openclaw gateway status`
4. Перевірте журнали: `openclaw logs --follow`

**Бот надсилає порожні або резервні відповіді:**

1. Перевірте, чи повертає модель ШІ коректний вміст
2. Типова резервна відповідь: "暂时无法解答，你可以换个问题问问我哦"
3. Налаштуйте її за допомогою `channels.yuanbao.fallbackReply`

**App Secret розкрито:**

1. Скиньте App Secret у застосунку Yuanbao
2. Оновіть значення у своїй конфігурації
3. Перезапустіть Gateway: `openclaw gateway restart`

## Розширена конфігурація

### Кілька облікових записів

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
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

- `maxChars`: максимальна кількість символів в одному повідомленні (типово `3000`)
- `mediaMaxMb`: ліміт завантаження та вивантаження медіафайлів (типово `20` МБ)
- `overflowPolicy`: поведінка, коли повідомлення перевищує ліміт: `"split"` (типово) або `"stop"`

### Потокове передавання

Yuanbao підтримує потокове виведення на рівні блоків; бот надсилає текст частинами в міру його генерування.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // потокове передавання блоків увімкнено (типово)
    },
  },
}
```

Установіть `disableBlockStreaming: true`, щоб надсилати повну відповідь одним повідомленням.

### Контекст історії групового чату

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // типово: 100, установіть 0, щоб вимкнути
    },
  },
}
```

Визначає, скільки історичних повідомлень включається до контексту ШІ для групових чатів.

### Режим відповіді на повідомлення

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (типово: "first")
    },
  },
}
```

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `off`    | Без цитованої відповіді                                          |
| `first`  | Цитувати лише першу відповідь на кожне вхідне повідомлення (типово) |
| `all`    | Цитувати кожну відповідь                                         |

### Вставлення підказки Markdown

Типово бот додає до системної підказки інструкцію, яка забороняє моделі обгортати всю відповідь у блок коду Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // типово: true
    },
  },
}
```

### Режим налагодження

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Вмикає неочищене виведення журналів для вказаних ідентифікаторів ботів.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб спрямовувати приватні повідомлення або групи Yuanbao до різних агентів:

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (приватне повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: ідентифікатор користувача або код групи

## Довідник із конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                               | Опис                                                               | Типове значення                         |
| ------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------- |
| `channels.yuanbao.enabled`                 | Увімкнути або вимкнути канал                                       | `true`                                  |
| `channels.yuanbao.defaultAccount`          | Типовий обліковий запис для вихідної маршрутизації                  | `default`                               |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (підписування та створення квитка)                          | -                                       |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (підписування)                                          | -                                       |
| `channels.yuanbao.accounts.<id>.token`     | Попередньо підписаний токен (оминає автоматичне підписування квитка) | -                                       |
| `channels.yuanbao.accounts.<id>.name`      | Відображуване ім’я облікового запису                               | -                                       |
| `channels.yuanbao.accounts.<id>.enabled`   | Увімкнути або вимкнути окремий обліковий запис                      | `true`                                  |
| `channels.yuanbao.dm.policy`               | Політика приватних повідомлень                                     | `open`                                  |
| `channels.yuanbao.dm.allowFrom`            | Список дозволених приватних повідомлень (список ID користувачів)    | -                                       |
| `channels.yuanbao.requireMention`          | Вимагати @згадку в групах                                          | `true`                                  |
| `channels.yuanbao.overflowPolicy`          | Оброблення довгих повідомлень (`split` або `stop`)                  | `split`                                 |
| `channels.yuanbao.replyToMode`             | Стратегія відповіді на повідомлення в групі (`off`, `first`, `all`) | `first`                                 |
| `channels.yuanbao.outboundQueueStrategy`   | Вихідна стратегія (`merge-text` або `immediate`)                    | `merge-text`                            |
| `channels.yuanbao.minChars`                | Об’єднання тексту: мінімальна кількість символів для надсилання     | `2800`                                  |
| `channels.yuanbao.maxChars`                | Об’єднання тексту: максимальна кількість символів у повідомленні    | `3000`                                  |
| `channels.yuanbao.idleMs`                  | Об’єднання тексту: тайм-аут бездіяльності до автоматичного надсилання (мс) | `5000`                           |
| `channels.yuanbao.mediaMaxMb`              | Обмеження розміру медіафайлів (МБ)                                 | `20`                                    |
| `channels.yuanbao.historyLimit`            | Кількість записів контексту історії групового чату                  | `100`                                   |
| `channels.yuanbao.disableBlockStreaming`   | Вимкнути потокове виведення на рівні блоків                         | `false`                                 |
| `channels.yuanbao.fallbackReply`           | Резервна відповідь, коли модель не повертає вміст                   | `暂时无法解答，你可以换个问题问问我哦`  |
| `channels.yuanbao.markdownHintEnabled`     | Додавати інструкції проти обгортання в Markdown                     | `true`                                  |
| `channels.yuanbao.debugBotIds`             | Список дозволених ID ботів для налагодження (неочищені журнали)     | `[]`                                    |

## Підтримувані типи повідомлень

**Отримання:** текст, зображення, файли, аудіо/голосові повідомлення, відео, наліпки/власні емодзі, власні елементи (картки посилань).

**Надсилання:** текст (Markdown), зображення, файли, аудіо, відео, наліпки.

**Гілки та відповіді:** цитовані відповіді (налаштовуються через `replyToMode`); платформа не підтримує відповіді в гілках.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація приватних повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
