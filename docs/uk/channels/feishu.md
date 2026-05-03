---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, можливості та налаштування
title: Feishu
x-i18n:
    generated_at: "2026-05-03T18:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються, діляться документами, керують календарями та виконують роботу разом.

**Стан:** готово до production для DM із ботом і групових чатів. WebSocket є режимом за замовчуванням; режим webhook необов’язковий.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Запустіть `openclaw --version`, щоб перевірити. Оновіть за допомогою `openclaw update`.
</Note>

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Відскануйте QR-код у мобільному застосунку Feishu/Lark, щоб автоматично створити бота Feishu/Lark.
  </Step>
  
  <Step title="Після завершення налаштування перезапустіть gateway, щоб застосувати зміни">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Контроль доступу

### Прямі повідомлення

Налаштуйте `dmPolicy`, щоб керувати тим, хто може надсилати DM боту:

- `"pairing"` — невідомі користувачі отримують код сполучення; підтвердьте через CLI
- `"allowlist"` — спілкуватися можуть лише користувачі, перелічені в `allowFrom` (за замовчуванням: лише власник бота)
- `"open"` — дозволити публічні DM лише коли `allowFrom` містить `"*"`; з обмежувальними записами спілкуватися можуть лише користувачі, що відповідають умовам
- `"disabled"` — вимкнути всі DM

**Підтвердити запит на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Значення     | Поведінка                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `"open"`     | Відповідати на всі повідомлення в групах                                                                     |
| `"allowlist"` | Відповідати лише групам у `groupAllowFrom` або явно налаштованим у `groups.<chat_id>`                       |
| `"disabled"` | Вимкнути всі групові повідомлення; явні записи `groups.<chat_id>` не перевизначають це                      |

За замовчуванням: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` — вимагати @mention (за замовчуванням)
- `false` — відповідати без @mention
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` і `@_all`, призначені лише для розсилки, не вважаються згадками бота. Повідомлення, яке згадує і `@all`, і бота напряму, все одно зараховується як згадка бота.

---

## Приклади налаштування груп

### Дозволити всі групи, @mention не потрібна

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

У режимі `allowlist` ви також можете допустити групу, додавши явний запис `groups.<chat_id>`. Явні записи не перевизначають `groupPolicy: "disabled"`. Шаблонні значення за замовчуванням у `groups.*` налаштовують відповідні групи, але самі по собі не допускають групи.

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

## Отримати ID групи/користувача

### ID груп (`chat_id`, формат: `oc_xxx`)

Відкрийте групу у Feishu/Lark, натисніть піктограму меню у верхньому правому куті та перейдіть до **Налаштувань**. ID групи (`chat_id`) наведено на сторінці налаштувань.

![Отримати ID групи](/images/feishu-get-group-id.png)

### ID користувачів (`open_id`, формат: `ou_xxx`)

Запустіть gateway, надішліть DM боту, потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виводі журналу. Також можна перевірити запити на сполучення, що очікують:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                                |
| --------- | ----------------------------------- |
| `/status` | Показати стан бота                  |
| `/reset`  | Скинути поточний сеанс              |
| `/model`  | Показати або змінити модель ШІ      |

<Note>
Feishu/Lark не підтримує нативні меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @mention бота (обов’язково за замовчуванням)
3. Перевірте, що `groupPolicy` не дорівнює `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бот опублікований і схвалений у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **постійне з’єднання** (WebSocket)
4. Переконайтеся, що надано всі необхідні permission scopes
5. Переконайтеся, що gateway запущений: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### App Secret витік

1. Скиньте App Secret у Feishu Open Platform / Lark Developer
2. Оновіть значення у вашій конфігурації
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

`defaultAccount` керує тим, який обліковий запис використовується, коли outbound API не вказують `accountId`.
`accounts.<id>.tts` використовує ту саму форму, що й `messages.tts`, і виконує глибоке злиття поверх
глобальної конфігурації TTS, тож налаштування Feishu з кількома ботами можуть зберігати спільні облікові дані
провайдерів глобально, перевизначаючи лише голос, модель, персону або автоматичний режим
для кожного облікового запису.

### Обмеження повідомлень

- `textChunkLimit` — розмір фрагмента вихідного тексту (за замовчуванням: `2000` символів)
- `mediaMaxMb` — обмеження на завантаження/вивантаження медіа (за замовчуванням: `30` MB)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли це ввімкнено, бот оновлює картку в реальному часі під час генерування тексту.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Встановіть `streaming: false`, щоб надіслати повну відповідь одним повідомленням. `blockStreaming` вимкнено за замовчуванням; вмикайте його лише тоді, коли хочете перед фінальною відповіддю скидати завершені блоки асистента.

### Оптимізація квоти

Зменште кількість API-викликів Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (за замовчуванням `true`): встановіть `false`, щоб пропускати виклики реакції набору тексту
- `resolveSenderNames` (за замовчуванням `true`): встановіть `false`, щоб пропускати пошуки профілів відправників

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

Feishu/Lark підтримує ACP для DM і повідомлень у групових тредах. ACP у Feishu/Lark керується текстовими командами — нативних меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

#### Створити ACP із чату

У DM або треді Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для DM і повідомлень у тредах Feishu/Lark. Подальші повідомлення у прив’язаній розмові спрямовуються безпосередньо до цього сеансу ACP.

### Маршрутизація між кількома агентами

Використовуйте `bindings`, щоб маршрутизувати DM або групи Feishu/Lark до різних агентів.

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

Див. [Отримати ID групи/користувача](#get-groupuser-ids) для порад із пошуку.

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування                                      | Опис                                                                             | Типове значення |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Увімкнути/вимкнути канал                                                         | `true`           |
| `channels.feishu.domain`                          | Домен API (`feishu` або `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | Транспорт подій (`websocket` або `webhook`)                                      | `websocket`      |
| `channels.feishu.defaultAccount`                  | Типовий обліковий запис для вихідної маршрутизації                               | `default`        |
| `channels.feishu.verificationToken`               | Потрібно для режиму Webhook                                                      | —                |
| `channels.feishu.encryptKey`                      | Потрібно для режиму Webhook                                                      | —                |
| `channels.feishu.webhookPath`                     | Шлях маршруту Webhook                                                            | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Хост прив’язки Webhook                                                           | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Порт прив’язки Webhook                                                           | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | Ідентифікатор застосунку                                                         | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Секрет застосунку                                                                | —                |
| `channels.feishu.accounts.<id>.domain`            | Перевизначення домену для окремого облікового запису                             | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Перевизначення TTS для окремого облікового запису                                | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Політика приватних повідомлень                                                   | `allowlist`      |
| `channels.feishu.allowFrom`                       | Список дозволених приватних повідомлень (список open_id)                         | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Політика груп                                                                    | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Список дозволених груп                                                           | —                |
| `channels.feishu.requireMention`                  | Вимагати @згадку в групах                                                        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для групи; явні ідентифікатори також допускають групу в режимі списку дозволених | успадковано      |
| `channels.feishu.groups.<chat_id>.enabled`        | Увімкнути/вимкнути певну групу                                                   | `true`           |
| `channels.feishu.textChunkLimit`                  | Розмір фрагмента повідомлення                                                    | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Обмеження розміру медіа                                                          | `30`             |
| `channels.feishu.streaming`                       | Потокове виведення картки                                                        | `true`           |
| `channels.feishu.blockStreaming`                  | Потокове надсилання відповідей завершеними блоками                               | `false`          |
| `channels.feishu.typingIndicator`                 | Надсилати реакції набору тексту                                                  | `true`           |
| `channels.feishu.resolveSenderNames`              | Визначати відображувані імена відправників                                       | `true`           |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Розширений текст (допис)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Стікери

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як медіаплейсхолдери замість
необробленого JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосової нотатки й запускає спільну транскрипцію аудіо перед
ходом агента, тому агент отримує розшифровку мовлення. Якщо Feishu включає
текст транскрипту безпосередньо в аудіокорисне навантаження, цей текст
використовується без додаткового виклику ASR. Без провайдера транскрипції аудіо
агент усе одно отримує плейсхолдер `<media:audio>` разом зі збереженим
вкладенням, а не необроблене корисне навантаження ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (зокрема потокові оновлення)
- ⚠️ Розширений текст (форматування у стилі допису; не підтримує повні можливості авторингу Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio`
і потребують завантажених медіа Ogg/Opus (`file_type: "opus"`). Наявні медіа
`.opus` і `.ogg` надсилаються безпосередньо як нативне аудіо. MP3/WAV/M4A та
інші ймовірні аудіоформати перекодовуються у 48 кГц Ogg/Opus за допомогою
`ffmpeg` лише коли відповідь запитує доставку голосом (`audioAsVoice` /
інструмент повідомлень `asVoice`, зокрема відповіді голосовими нотатками TTS).
Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній
або перетворення не вдається, OpenClaw повертається до файлового вкладення й
записує причину в журнал.

### Ланцюжки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в ланцюжках
- ✅ Медіавідповіді залишаються прив’язаними до ланцюжка під час відповіді на повідомлення в ланцюжку

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні
тематичні групи Feishu/Lark використовують подію `thread_id` (`omt_*`) як
канонічний ключ тематичної сесії. Звичайні групові відповіді, які OpenClaw
перетворює на ланцюжки, продовжують використовувати ідентифікатор кореневого
повідомлення відповіді (`om_*`), щоб перший хід і наступний хід залишалися в тій
самій сесії.

---

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація приватних повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і контроль згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
