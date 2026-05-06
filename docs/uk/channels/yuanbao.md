---
read_when:
    - Ви хочете підключити бота Yuanbao
    - Ви налаштовуєте канал Yuanbao
summary: Огляд, функції та конфігурація бота Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T02:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao — це платформа AI-помічника від Tencent. Канальний Plugin OpenClaw
підключає ботів Yuanbao до OpenClaw через WebSocket, щоб вони могли взаємодіяти з користувачами
через прямі повідомлення та групові чати.

**Статус:** готово до продакшну для DM ботів і групових чатів. WebSocket — єдиний підтримуваний режим підключення.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.10 або новіший.** Запустіть `openclaw --version`, щоб перевірити. Оновіть за допомогою `openclaw update`.

<Steps>
  <Step title="Додайте канал Yuanbao зі своїми обліковими даними">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Значення `--token` використовує формат `appKey:appSecret`, розділений двокрапкою. Ви можете отримати їх у застосунку Yuanbao, створивши робота в налаштуваннях вашого застосунку.
  </Step>

  <Step title="Після завершення налаштування перезапустіть gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Інтерактивне налаштування (альтернатива)

Ви також можете скористатися інтерактивним майстром:

```bash
openclaw channels login --channel yuanbao
```

Дотримуйтеся підказок, щоб ввести ідентифікатор застосунку та секрет застосунку.

---

## Контроль доступу

### Прямі повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати DM боту:

- `"pairing"` - невідомі користувачі отримують код сполучення; схвалюйте через CLI
- `"allowlist"` - спілкуватися можуть лише користувачі, указані в `allowFrom`
- `"open"` - дозволити всіх користувачів (типово)
- `"disabled"` - вимкнути всі DM

**Схвалити запит на сполучення:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Групові чати

**Вимога згадки** (`channels.yuanbao.requireMention`):

- `true` - вимагати @mention (типово)
- `false` - відповідати без @mention

Відповідь на повідомлення бота в груповому чаті вважається неявною згадкою.

---

## Приклади конфігурації

### Базове налаштування з відкритою політикою DM

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

### Обмежити DM певними користувачами

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

### Вимкнути вимогу @mention у групах

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Оптимізувати доставку вихідних повідомлень

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Налаштувати стратегію merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Поширені команди

| Команда    | Опис                        |
| ---------- | --------------------------- |
| `/help`    | Показати доступні команди   |
| `/status`  | Показати статус бота        |
| `/new`     | Почати новий сеанс          |
| `/stop`    | Зупинити поточний запуск    |
| `/restart` | Перезапустити OpenClaw      |
| `/compact` | Стиснути контекст сеансу    |

> Yuanbao підтримує нативні меню slash-команд. Команди автоматично синхронізуються з платформою під час запуску gateway.

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадали бота через @mention (типово обов’язково)
3. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота створено та схвалено в застосунку Yuanbao
2. Переконайтеся, що `appKey` і `appSecret` налаштовано правильно
3. Переконайтеся, що gateway запущено: `openclaw gateway status`
4. Перевірте журнали: `openclaw logs --follow`

### Бот надсилає порожні або резервні відповіді

1. Перевірте, чи AI-модель повертає валідний вміст
2. Типова резервна відповідь: "暂时无法解答，你可以换个问题问问我哦"
3. Налаштуйте її через `channels.yuanbao.fallbackReply`

### App Secret витік

1. Скиньте App Secret у YuanBao APP
2. Оновіть значення у своїй конфігурації
3. Перезапустіть gateway: `openclaw gateway restart`

---

## Розширена конфігурація

### Кілька акаунтів

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

`defaultAccount` керує тим, який акаунт використовується, коли вихідні API не вказують `accountId`.

### Обмеження повідомлень

- `maxChars` - максимальна кількість символів в одному повідомленні (типово: `3000` символів)
- `mediaMaxMb` - обмеження завантаження/вивантаження медіа (типово: `20` МБ)
- `overflowPolicy` - поведінка, коли повідомлення перевищує ліміт: `"split"` (типово) або `"stop"`

### Потокове передавання

Yuanbao підтримує потокове виведення на рівні блоків. Коли його ввімкнено, бот надсилає текст частинами під час генерації.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Установіть `disableBlockStreaming: true`, щоб надіслати повну відповідь одним повідомленням.

### Контекст історії групового чату

Керуйте тим, скільки історичних повідомлень включається до AI-контексту для групових чатів:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Режим reply-to

Керуйте тим, як бот цитує повідомлення, відповідаючи в групових чатах:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Значення  | Поведінка                                                |
| --------- | -------------------------------------------------------- |
| `"off"`   | Без відповіді з цитуванням                               |
| `"first"` | Цитувати лише першу відповідь на вхідне повідомлення (типово) |
| `"all"`   | Цитувати кожну відповідь                                 |

### Вставлення підказки Markdown

Типово бот вставляє інструкції в системний prompt, щоб запобігти обгортанню всієї відповіді AI-моделлю в кодові блоки markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Режим налагодження

Увімкніть несанітизований вивід журналів для певних ідентифікаторів ботів:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Маршрутизація кількох агентів

Використовуйте `bindings`, щоб маршрутизувати DM або групи Yuanbao до різних агентів.

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

Поля маршрутизації:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) або `"group"` (груповий чат)
- `match.peer.id`: ідентифікатор користувача або код групи

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                              | Опис                                              | Типово                                 |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Увімкнути/вимкнути канал                          | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Типовий акаунт для вихідної маршрутизації         | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (використовується для підписування та генерації ticket) | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (використовується для підписування)    | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Попередньо підписаний token (пропускає автоматичне підписування ticket) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Відображувана назва акаунта                       | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Увімкнути/вимкнути певний акаунт                  | `true`                                 |
| `channels.yuanbao.dm.policy`               | Політика DM                                       | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Allowlist DM (список ідентифікаторів користувачів) | -                                      |
| `channels.yuanbao.requireMention`          | Вимагати @mention у групах                        | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Обробка довгих повідомлень (`split` або `stop`)   | `split`                                |
| `channels.yuanbao.replyToMode`             | Стратегія reply-to для груп (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Вихідна стратегія (`merge-text` або `immediate`)  | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: мінімум символів для запуску надсилання | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: максимум символів на повідомлення     | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: тайм-аут бездіяльності перед автоматичним flush (мс) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Обмеження розміру медіа (МБ)                      | `20`                                   |
| `channels.yuanbao.historyLimit`            | Записи контексту історії групового чату           | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Вимкнути потокове виведення на рівні блоків       | `false`                                |
| `channels.yuanbao.fallbackReply`           | Резервна відповідь, коли AI не повертає вміст     | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Вставляти інструкції проти обгортання markdown    | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Allowlist ідентифікаторів ботів для налагодження (несанітизовані журнали) | `[]`                                   |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо / голос
- ✅ Відео
- ✅ Стікери / власні emoji
- ✅ Власні елементи (картки посилань тощо)

### Надсилання

- ✅ Текст (з підтримкою markdown)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео
- ✅ Стікери

### Threads і відповіді

- ✅ Відповіді з цитуванням (налаштовується через `replyToMode`)
- ❌ Відповіді в threads (не підтримується платформою)

---

## Пов’язане

- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Сполучення](/uk/channels/pairing) - автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) - поведінка групових чатів і gating згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
