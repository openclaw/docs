---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, функції та налаштування
title: Feishu
x-i18n:
    generated_at: "2026-04-25T09:41:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для спільної роботи, де команди спілкуються в чаті, обмінюються документами, керують календарями та разом виконують роботу.

**Статус:** готово до production для DM ботів і групових чатів. WebSocket — режим за замовчуванням; режим webhook — необов’язковий.

---

## Швидкий старт

> **Потрібен OpenClaw 2026.4.25 або новіший.** Щоб перевірити, виконайте `openclaw --version`. Оновіть за допомогою `openclaw update`.

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Проскануйте QR-код за допомогою мобільного застосунку Feishu/Lark, щоб автоматично створити бота Feishu/Lark.
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

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати боту DM:

- `"pairing"` — невідомі користувачі отримують код pairing; підтвердження виконується через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі DM

**Підтвердити запит на pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Value         | Поведінка                                  |
| ------------- | ------------------------------------------ |
| `"open"`      | Відповідати на всі повідомлення в групах   |
| `"allowlist"` | Відповідати лише групам у `groupAllowFrom` |
| `"disabled"`  | Вимкнути всі повідомлення в групах         |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @mention (типово)
- `false` — відповідати без @mention
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`

---

## Приклади конфігурації груп

### Дозволити всі групи, без обов’язкової @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Дозволити всі групи, але все ще вимагати @mention

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

### Дозволити лише вказані групи

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Ідентифікатори груп мають такий вигляд: oc_xxx
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
          // open_id користувачів мають такий вигляд: ou_xxx
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

![Get Group ID](/images/feishu-get-group-id.png)

### ID користувачів (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту DM, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Шукайте `open_id` у виводі журналу. Ви також можете перевірити запити pairing, які очікують на підтвердження:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Command   | Опис                             |
| --------- | -------------------------------- |
| `/status` | Показати статус бота             |
| `/reset`  | Скинути поточну сесію            |
| `/model`  | Показати або змінити модель ШІ   |

> Feishu/Lark не підтримує вбудовані меню slash-команд, тому надсилайте ці команди як звичайні текстові повідомлення.

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадуєте бота через @mention (типово це обов’язково)
3. Перевірте, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано та схвалено в Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події включає `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### App Secret скомпрометовано

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у своїй конфігурації
3. Перезапустіть Gateway: `openclaw gateway restart`

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
          name: "Основний бот",
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

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — ліміт завантаження/вивантаження медіа (типово: `30` MB)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Якщо цю функцію ввімкнено, бот у реальному часі оновлює картку під час генерування тексту.

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

### Оптимізація квот

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропустити виклики реакції друку
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

Feishu/Lark підтримує ACP для DM і повідомлень у гілках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

У DM або гілці Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для DM і повідомлень у гілках Feishu/Lark. Подальші повідомлення в прив’язаній розмові напряму спрямовуються до цієї сесії ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб спрямовувати DM або групи Feishu/Lark до різних агентів.

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

Підказки щодо пошуку див. у [Отримання ID груп/користувачів](#get-groupuser-ids).

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Setting                                           | Опис                                         | Default          |
| ------------------------------------------------- | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                     | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)  | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації | `default`        |
| `channels.feishu.verificationToken`               | Обов’язково для режиму webhook               | —                |
| `channels.feishu.encryptKey`                      | Обов’язково для режиму webhook               | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID застосунку                                | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису | `feishu`         |
| `channels.feishu.dmPolicy`                        | Політика DM                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | allowlist DM (список `open_id`)              | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist груп                               | —                |
| `channels.feishu.requireMention`                  | Вимагати @mention у групах                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @mention для окремої групи    | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу           | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                      | `30`             |
| `channels.feishu.streaming`                       | Виведення потокових карток                   | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове передавання на рівні блоків         | `true`           |
| `channels.feishu.typingIndicator`                 | Надсилати реакції друку                      | `true`           |
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

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (включно з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує повні можливості авторингу Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують завантаження медіа у форматі Ogg/Opus (`file_type: "opus"`). Наявні медіафайли `.opus` і `.ogg` надсилаються безпосередньо як нативне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати перекодовуються в 48 kHz Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує доставку голосом (`audioAsVoice` / інструмент повідомлень `asVoice`, включно з голосовими нотатками TTS). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або конвертація завершується помилкою, OpenClaw повертається до вкладення файлу й записує причину в журнал.

### Гілки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в гілках
- ✅ Відповіді з медіа зберігають прив’язку до гілки під час відповіді на повідомлення в гілці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні тематичні групи Feishu/Lark використовують `thread_id` події (`omt_*`) як канонічний ключ сесії теми. Звичайні відповіді в групі, які OpenClaw перетворює на гілки, і далі використовують ID кореневого повідомлення відповіді (`om_*`), щоб перший і наступний кроки залишалися в одній сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
