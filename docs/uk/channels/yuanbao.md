---
read_when:
    - Ви хочете підключити бота Yuanbao
    - Ви налаштовуєте канал Yuanbao
summary: Огляд бота Yuanbao, функції та конфігурація
title: Yuanbao
x-i18n:
    generated_at: "2026-04-28T02:07:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 15
---

# Yuanbao

Tencent Yuanbao — це платформа AI-асистента від Tencent. Плагін каналу OpenClaw
підключає ботів Yuanbao до OpenClaw через WebSocket, щоб вони могли взаємодіяти з користувачами
через особисті повідомлення та групові чати.

**Статус:** готово до використання у production для особистих повідомлень ботів і групових чатів. WebSocket — єдиний підтримуваний режим підключення.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.10 або новіший.** Щоб перевірити версію, виконайте `openclaw --version`. Оновіть за допомогою `openclaw update`.

<Steps>
  <Step title="Додайте канал Yuanbao зі своїми обліковими даними">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Значення `--token` використовує формат `appKey:appSecret`, розділений двокрапкою. Ви можете отримати ці значення з застосунку Yuanbao, створивши робота в налаштуваннях вашого застосунку.
  </Step>

  <Step title="Після завершення налаштування перезапустіть Gateway, щоб застосувати зміни">
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

Дотримуйтесь підказок, щоб ввести ваші App ID та App Secret.

---

## Керування доступом

### Особисті повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати боту особисті повідомлення:

- `"pairing"` — невідомі користувачі отримують код прив’язки; підтвердження через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom`
- `"open"` — дозволити всіх користувачів (типово)
- `"disabled"` — вимкнути всі особисті повідомлення

**Підтвердження запиту на прив’язку:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Групові чати

**Вимога згадки** (`channels.yuanbao.requireMention`):

- `true` — вимагати @згадку (типово)
- `false` — відповідати без @згадки

Відповідь на повідомлення бота в груповому чаті вважається неявною згадкою.

---

## Приклади конфігурації

### Базове налаштування з відкритою політикою особистих повідомлень

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

### Обмеження особистих повідомлень для конкретних користувачів

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

### Вимкнення вимоги @згадки в групах

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Оптимізація доставки вихідних повідомлень

```json5
{
  channels: {
    yuanbao: {
      // Надсилати кожен фрагмент одразу без буферизації
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Налаштування стратегії merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // буферизувати, доки не буде стільки символів
      maxChars: 3000, // примусовий поділ понад цей ліміт
      idleMs: 5000, // автоматичне скидання після простою (мс)
    },
  },
}
```

---

## Поширені команди

| Команда    | Опис                          |
| ---------- | ----------------------------- |
| `/help`    | Показати доступні команди     |
| `/status`  | Показати статус бота          |
| `/new`     | Почати нову сесію             |
| `/stop`    | Зупинити поточний запуск      |
| `/restart` | Перезапустити OpenClaw        |
| `/compact` | Виконати Compaction контексту сесії |

> Yuanbao підтримує вбудовані меню slash-команд. Команди автоматично синхронізуються з платформою під час запуску Gateway.

---

## Усунення проблем

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @ (типово це обов’язково)
3. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бот створений і підтверджений у застосунку Yuanbao
2. Переконайтеся, що `appKey` і `appSecret` налаштовані правильно
3. Переконайтеся, що Gateway запущено: `openclaw gateway status`
4. Перевірте журнали: `openclaw logs --follow`

### Бот надсилає порожні або резервні відповіді

1. Перевірте, чи AI-модель повертає коректний вміст
2. Типова резервна відповідь: "暂时无法解答，你可以换个问题问问我哦"
3. Налаштуйте її через `channels.yuanbao.fallbackReply`

### App Secret скомпрометовано

1. Скиньте App Secret у YuanBao APP
2. Оновіть значення у своїй конфігурації
3. Перезапустіть Gateway: `openclaw gateway restart`

---

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

### Ліміти повідомлень

- `maxChars` — максимальна кількість символів в одному повідомленні (типово: `3000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `20` МБ)
- `overflowPolicy` — поведінка, коли повідомлення перевищує ліміт: `"split"` (типово) або `"stop"`

### Потокове передавання

Yuanbao підтримує потокове виведення на рівні блоків. Якщо ввімкнено, бот надсилає текст частинами в міру генерації.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // потокове передавання блоками ввімкнено (типово)
    },
  },
}
```

Установіть `disableBlockStreaming: true`, щоб надсилати повну відповідь одним повідомленням.

### Контекст історії групового чату

Керуйте тим, скільки історичних повідомлень включається в AI-контекст для групових чатів:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // типово: 100, установіть 0, щоб вимкнути
    },
  },
}
```

### Режим reply-to

Керуйте тим, як бот цитує повідомлення під час відповіді в групових чатах:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (типово: "first")
    },
  },
}
```

| Значення  | Поведінка                                                |
| --------- | -------------------------------------------------------- |
| `"off"`   | Без цитованої відповіді                                  |
| `"first"` | Цитувати лише першу відповідь на кожне вхідне повідомлення (типово) |
| `"all"`   | Цитувати кожну відповідь                                 |

### Вставка підказки для Markdown

Типово бот додає інструкції в system prompt, щоб AI-модель не обгортала всю відповідь у markdown-блоки коду.

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

Увімкніть несанітизований вивід журналів для конкретних ID ботів:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Маршрутизація між агентами

Використовуйте `bindings`, щоб маршрутизувати особисті повідомлення або групи Yuanbao до різних агентів.

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
- `match.peer.kind`: `"direct"` (особисті повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: ID користувача або код групи

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Параметр                                  | Опис                                              | Типово                                 |
| ----------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                | Увімкнути/вимкнути канал                          | `true`                                 |
| `channels.yuanbao.defaultAccount`         | Типовий обліковий запис для вихідної маршрутизації | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`   | App Key (використовується для підпису та генерації квитків) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (використовується для підпису)        | —                                      |
| `channels.yuanbao.accounts.<id>.token`    | Попередньо підписаний токен (пропускає автоматичний підпис квитків) | —                                      |
| `channels.yuanbao.accounts.<id>.name`     | Відображувана назва облікового запису             | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`  | Увімкнути/вимкнути конкретний обліковий запис     | `true`                                 |
| `channels.yuanbao.dm.policy`              | Політика особистих повідомлень                    | `open`                                 |
| `channels.yuanbao.dm.allowFrom`           | Allowlist особистих повідомлень (список ID користувачів) | —                                      |
| `channels.yuanbao.requireMention`         | Вимагати @згадку в групах                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`         | Обробка довгих повідомлень (`split` або `stop`)   | `split`                                |
| `channels.yuanbao.replyToMode`            | Стратегія group reply-to (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`  | Вихідна стратегія (`merge-text` або `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`               | Merge-text: мінімум символів для запуску надсилання | `2800`                                 |
| `channels.yuanbao.maxChars`               | Merge-text: максимум символів на повідомлення     | `3000`                                 |
| `channels.yuanbao.idleMs`                 | Merge-text: тайм-аут простою перед автоскиданням (мс) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`             | Ліміт розміру медіа (МБ)                          | `20`                                   |
| `channels.yuanbao.historyLimit`           | Кількість записів історії в контексті групового чату | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`  | Вимкнути потокове виведення на рівні блоків       | `false`                                |
| `channels.yuanbao.fallbackReply`          | Резервна відповідь, коли AI не повертає вміст     | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`    | Додавати інструкції проти обгортання в Markdown   | `true`                                 |
| `channels.yuanbao.debugBotIds`            | Debug whitelist ID ботів (несанітизовані журнали) | `[]`                                   |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо / голос
- ✅ Відео
- ✅ Стікери / користувацькі емодзі
- ✅ Користувацькі елементи (картки посилань тощо)

### Надсилання

- ✅ Текст (з підтримкою markdown)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео
- ✅ Стікери

### Гілки та відповіді

- ✅ Цитовані відповіді (налаштовується через `replyToMode`)
- ❌ Відповіді в гілках (платформа не підтримує)

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Прив’язка](/uk/channels/pairing) — автентифікація особистих повідомлень і потік прив’язки
- [Групи](/uk/channels/groups) — поведінка групових чатів і керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
