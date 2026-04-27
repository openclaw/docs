---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, функції та конфігурація
title: Feishu
x-i18n:
    generated_at: "2026-04-27T22:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54db77a6bb05d862fe8eb5dfc97d04e4252b20e2b0ccbf204eb49d9d7256b026
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються в чаті, діляться документами, керують календарями та разом виконують роботу.

**Статус:** готово до використання у продакшені для особистих повідомлень боту та групових чатів. Режим WebSocket використовується за замовчуванням; режим webhook є необов’язковим.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Щоб перевірити, виконайте `openclaw --version`. Щоб оновити, виконайте `openclaw update`.
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

Налаштуйте `dmPolicy`, щоб керувати тим, хто може писати боту в особисті повідомлення:

- `"pairing"` — невідомі користувачі отримують код прив’язки; схваліть його через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` — дозволити всіх користувачів
- `"disabled"` — вимкнути всі особисті повідомлення

**Схвалити запит на прив’язку:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Значення      | Поведінка                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------- |
| `"open"`      | Відповідати на всі повідомлення в групах                                                    |
| `"allowlist"` | Відповідати лише в групах із `groupAllowFrom` або явно налаштованих у `groups.<chat_id>`   |
| `"disabled"`  | Вимкнути всі повідомлення в групах; явні записи `groups.<chat_id>` не перевизначають це     |

Типове значення: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @mention (типово)
- `false` — відповідати без @mention
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- Згадки лише для розсилки `@all` і `@_all` не вважаються згадками бота. Повідомлення, яке містить і `@all`, і пряму згадку бота, усе одно вважається згадкою бота.

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

### Дозволити всі групи, але все одно вимагати @mention

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

У режимі `allowlist` ви також можете дозволити групу, додавши явний запис `groups.<chat_id>`. Явні записи не перевизначають `groupPolicy: "disabled"`. Шаблонні значення за замовчуванням у `groups.*` налаштовують відповідні групи, але самі по собі не надають групам доступ.

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

### Обмежити відправників усередині групи

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

## Отримання ідентифікаторів груп/користувачів

### Ідентифікатори груп (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть до **Налаштувань**. Ідентифікатор групи (`chat_id`) вказано на сторінці налаштувань.

![Get Group ID](/images/feishu-get-group-id.png)

### Ідентифікатори користувачів (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть боту особисте повідомлення, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виведенні журналів. Ви також можете перевірити незавершені запити на прив’язку:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                          |
| --------- | ----------------------------- |
| `/status` | Показати стан бота            |
| `/reset`  | Скинути поточну сесію         |
| `/model`  | Показати або змінити AI-модель |

<Note>
Feishu/Lark не підтримує вбудовані меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви згадали бота через @mention (це потрібно за замовчуванням)
3. Переконайтеся, що `groupPolicy` не має значення `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бота опубліковано та схвалено в Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **persistent connection** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Витік App Secret

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
`accounts.<id>.tts` використовує ту саму структуру, що й `messages.tts`, і виконує глибоке злиття поверх
глобальної конфігурації TTS, тож у багатоботних конфігураціях Feishu можна
зберігати спільні облікові дані провайдерів глобально, перевизначаючи лише voice, model, persona або auto mode
для кожного облікового запису.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` — обмеження на вивантаження/завантаження медіа (типово: `30` МБ)

### Потокова передача

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Якщо ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // увімкнути потоковий вивід у картках (типово: true)
      blockStreaming: true, // увімкнути потокову передачу на рівні блоків (типово: true)
    },
  },
}
```

Установіть `streaming: false`, щоб надсилати повну відповідь одним повідомленням.

### Оптимізація квот

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропускати виклики реакції друку
- `resolveSenderNames` (типово `true`): установіть `false`, щоб пропускати пошук профілів відправників

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

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у потоках груп. ACP у Feishu/Lark керується текстовими командами — вбудованих меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

У особистому повідомленні Feishu/Lark або в потоці:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у потоках Feishu/Lark. Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до цієї сесії ACP.

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
- `match.peer.kind`: `"direct"` (особисте повідомлення) або `"group"` (груповий чат)
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ідентифікатор групи (`oc_xxx`)

Див. [Отримання ідентифікаторів груп/користувачів](#get-groupuser-ids), щоб дізнатися, як їх знайти.

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                                      | Опис                                                                                 | Типове значення |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                                                             | `true`          |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)                                                      | `feishu`        |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)                                          | `websocket`     |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації                                   | `default`       |
| `channels.feishu.verificationToken`               | Потрібен для режиму webhook                                                          | —               |
| `channels.feishu.encryptKey`                      | Потрібен для режиму webhook                                                          | —               |
| `channels.feishu.webhookPath`                     | Шлях маршруту webhook                                                                | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки webhook                                                               | `127.0.0.1`     |
| `channels.feishu.webhookPort`                     | Порт прив’язки webhook                                                               | `3000`          |
| `channels.feishu.accounts.<id>.appId`             | App ID                                                                               | —               |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                           | —               |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису                                 | `feishu`        |
| `channels.feishu.accounts.<id>.tts`               | Перевизначення TTS для окремого облікового запису                                    | `messages.tts`  |
| `channels.feishu.dmPolicy`                        | Політика особистих повідомлень                                                       | `allowlist`     |
| `channels.feishu.allowFrom`                       | Список дозволених для особистих повідомлень (`open_id`)                              | [BotOwnerId]    |
| `channels.feishu.groupPolicy`                     | Політика груп                                                                        | `allowlist`     |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                                                               | —               |
| `channels.feishu.requireMention`                  | Вимагати @mention у групах                                                           | `true`          |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @mention для окремої групи; явні ID також дозволяють групу в режимі allowlist | inherited       |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути конкретну групу                                                   | `true`          |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                                                        | `2000`          |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                                                              | `30`            |
| `channels.feishu.streaming`                       | Потоковий вивід у картках                                                            | `true`          |
| `channels.feishu.blockStreaming`                  | Потокова передача на рівні блоків                                                    | `true`          |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту                                                      | `true`          |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників                                           | `true`          |

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
необробленого JSON `file_key`. Якщо налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосового повідомлення та виконує спільну транскрипцію аудіо перед
ходом агента, щоб агент отримав транскрибований мовний текст. Якщо Feishu вже містить
текст транскрипції безпосередньо в аудіокорисному навантаженні, цей текст використовується без
додаткового виклику ASR. Без провайдера транскрипції аудіо агент усе одно отримує
заповнювач `<media:audio>` разом зі збереженим вкладенням, а не необроблене корисне навантаження ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (включно з потоковими оновленнями)
- ⚠️ Форматований текст (форматування у стилі post; не підтримує всі можливості авторингу Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio` і потребують
вивантаження медіа у форматі Ogg/Opus (`file_type: "opus"`). Наявні медіафайли `.opus` і `.ogg`
надсилаються напряму як нативне аудіо. MP3/WAV/M4A та інші ймовірні аудіоформати
транскодуються в 48kHz Ogg/Opus за допомогою `ffmpeg` лише тоді, коли відповідь запитує
голосову доставку (`audioAsVoice` / інструмент повідомлень `asVoice`, включно з голосовими
відповідями TTS). Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній або
конвертація завершується помилкою, OpenClaw переходить до вкладення файлу та записує причину в журнал.

### Потоки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в потоках
- ✅ Відповіді з медіа зберігають прив’язку до потоку при відповіді на повідомлення в потоці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні
тематичні групи Feishu/Lark використовують `thread_id` події (`omt_*`) як канонічний ключ сесії теми.
Звичайні відповіді в групі, які OpenClaw перетворює на потоки, і далі використовують ID кореневого
повідомлення відповіді (`om_*`), щоб перший хід і наступний хід залишалися в одній сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Прив’язка](/uk/channels/pairing) — автентифікація особистих повідомлень і процес прив’язки
- [Групи](/uk/channels/groups) — поведінка групових чатів і керування через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та захист системи
