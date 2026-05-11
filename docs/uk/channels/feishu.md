---
read_when:
    - Ви хочете підключити бота Feishu/Lark
    - Ви налаштовуєте канал Feishu
summary: Огляд бота Feishu, можливості та конфігурація
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark — це універсальна платформа для співпраці, де команди спілкуються, обмінюються документами, керують календарями та виконують роботу разом.

**Статус:** готово до production для особистих повідомлень бота й групових чатів. WebSocket є типовим режимом; режим Webhook необов’язковий.

---

## Швидкий старт

<Note>
Потрібен OpenClaw 2026.4.25 або новіший. Виконайте `openclaw --version`, щоб перевірити. Оновіть за допомогою `openclaw update`.
</Note>

<Steps>
  <Step title="Запустіть майстер налаштування каналу">
  ```bash
  openclaw channels login --channel feishu
  ```
  Виберіть ручне налаштування, щоб вставити App ID і App Secret з Feishu Open Platform, або виберіть налаштування через QR, щоб автоматично створити бота. Якщо мобільний застосунок Feishu для внутрішнього ринку не реагує на QR-код, запустіть налаштування знову й виберіть ручне налаштування.
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

- `"pairing"` - невідомі користувачі отримують код сполучення; підтвердьте через CLI
- `"allowlist"` - спілкуватися можуть лише користувачі, перелічені в `allowFrom` (типово: лише власник бота)
- `"open"` - дозволити публічні особисті повідомлення лише коли `allowFrom` містить `"*"`; з обмежувальними записами спілкуватися можуть лише відповідні користувачі
- `"disabled"` - вимкнути всі особисті повідомлення

**Підтвердити запит на сполучення:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Групові чати

**Політика груп** (`channels.feishu.groupPolicy`):

| Значення      | Поведінка                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Відповідати на всі повідомлення в групах                                                     |
| `"allowlist"` | Відповідати лише групам у `groupAllowFrom` або явно налаштованим у `groups.<chat_id>`        |
| `"disabled"`  | Вимкнути всі групові повідомлення; явні записи `groups.<chat_id>` не перевизначають це       |

Типово: `allowlist`

**Вимога згадки** (`channels.feishu.requireMention`):

- `true` - вимагати @згадку (типово)
- `false` - відповідати без @згадки
- Перевизначення для окремої групи: `channels.feishu.groups.<chat_id>.requireMention`
- Широкомовні `@all` і `@_all` не вважаються згадками бота. Повідомлення, у якому згадано і `@all`, і безпосередньо бота, все одно зараховується як згадка бота.

---

## Приклади конфігурації груп

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

У режимі `allowlist` ви також можете допустити групу, додавши явний запис `groups.<chat_id>`. Явні записи не перевизначають `groupPolicy: "disabled"`. Типові налаштування з wildcard у `groups.*` налаштовують відповідні групи, але самі по собі не допускають групи.

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

### Обмежити відправників у межах групи

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

Відкрийте групу у Feishu/Lark, натисніть значок меню у верхньому правому куті та перейдіть до **Налаштувань**. ID групи (`chat_id`) наведено на сторінці налаштувань.

![Отримати ID групи](/images/feishu-get-group-id.png)

### ID користувачів (`open_id`, формат: `ou_xxx`)

Запустіть Gateway, надішліть особисте повідомлення боту, а потім перевірте журнали:

```bash
openclaw logs --follow
```

Знайдіть `open_id` у виводі журналу. Також можна перевірити запити на сполучення, що очікують:

```bash
openclaw pairing list feishu
```

---

## Поширені команди

| Команда   | Опис                       |
| --------- | -------------------------- |
| `/status` | Показати статус бота       |
| `/reset`  | Скинути поточний сеанс     |
| `/model`  | Показати або змінити AI-модель |

<Note>
Feishu/Lark не підтримує нативні меню slash-команд, тому надсилайте їх як звичайні текстові повідомлення.
</Note>

---

## Усунення несправностей

### Бот не відповідає в групових чатах

1. Переконайтеся, що бота додано до групи
2. Переконайтеся, що ви @згадали бота (типово обов’язково)
3. Перевірте, що `groupPolicy` не дорівнює `"disabled"`
4. Перевірте журнали: `openclaw logs --follow`

### Бот не отримує повідомлення

1. Переконайтеся, що бот опублікований і схвалений у Feishu Open Platform / Lark Developer
2. Переконайтеся, що підписка на події містить `im.message.receive_v1`
3. Переконайтеся, що вибрано **постійне з’єднання** (WebSocket)
4. Переконайтеся, що надано всі потрібні області дозволів
5. Переконайтеся, що Gateway запущено: `openclaw gateway status`
6. Перевірте журнали: `openclaw logs --follow`

### Налаштування через QR не реагує в мобільному застосунку Feishu

1. Запустіть налаштування знову: `openclaw channels login --channel feishu`
2. Виберіть ручне налаштування
3. У Feishu Open Platform створіть власний застосунок і скопіюйте його App ID та App Secret
4. Вставте ці облікові дані в майстер налаштування

### App Secret став відомий стороннім

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
`accounts.<id>.tts` використовує ту саму форму, що й `messages.tts`, і глибоко об’єднується з
глобальною конфігурацією TTS, тому налаштування Feishu із кількома ботами можуть зберігати спільні
облікові дані провайдера глобально, перевизначаючи лише голос, модель, персону або автоматичний режим
для кожного облікового запису.

### Ліміти повідомлень

- `textChunkLimit` - розмір фрагмента вихідного тексту (типово: `2000` символів)
- `mediaMaxMb` - ліміт завантаження/скачування медіа (типово: `30` MB)

### Потокове передавання

Feishu/Lark підтримує потокові відповіді через інтерактивні картки. Коли це ввімкнено, бот оновлює картку в реальному часі під час генерації тексту.

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

Установіть `streaming: false`, щоб надіслати повну відповідь одним повідомленням. `blockStreaming` типово вимкнено; увімкніть його лише тоді, коли потрібно передавати завершені блоки асистента перед фінальною відповіддю.

### Оптимізація квоти

Зменште кількість викликів API Feishu/Lark за допомогою двох необов’язкових прапорців:

- `typingIndicator` (типово `true`): установіть `false`, щоб пропускати виклики реакції набору тексту
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

### Сеанси ACP

Feishu/Lark підтримує ACP для особистих повідомлень і повідомлень у групових тредах. ACP у Feishu/Lark керується текстовими командами - нативних меню slash-команд немає, тому використовуйте повідомлення `/acp ...` безпосередньо в розмові.

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

#### Створити ACP з чату

У особистому повідомленні або треді Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` працює для особистих повідомлень і повідомлень у тредах Feishu/Lark. Подальші повідомлення у прив’язаній розмові спрямовуються безпосередньо до цього сеансу ACP.

### Маршрутизація кількох агентів

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
- `match.peer.id`: Open ID користувача (`ou_xxx`) або ID групи (`oc_xxx`)

Див. [Отримати ID групи/користувача](#get-groupuser-ids), щоб отримати поради з пошуку.

---

## Довідник конфігурації

Повна конфігурація: [Конфігурація Gateway](/uk/gateway/configuration)

| Налаштування | Опис | Типове значення |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled` | Увімкнути/вимкнути канал | `true` |
| `channels.feishu.domain` | Домен API (`feishu` або `lark`) | `feishu` |
| `channels.feishu.connectionMode` | Транспорт подій (`websocket` або `webhook`) | `websocket` |
| `channels.feishu.defaultAccount` | Типовий обліковий запис для вихідної маршрутизації | `default` |
| `channels.feishu.verificationToken` | Обов’язково для режиму webhook | - |
| `channels.feishu.encryptKey` | Обов’язково для режиму webhook | - |
| `channels.feishu.webhookPath` | Шлях маршруту Webhook | `/feishu/events` |
| `channels.feishu.webhookHost` | Хост прив’язування Webhook | `127.0.0.1` |
| `channels.feishu.webhookPort` | Порт прив’язування Webhook | `3000` |
| `channels.feishu.accounts.<id>.appId` | Ідентифікатор застосунку | - |
| `channels.feishu.accounts.<id>.appSecret` | Секрет застосунку | - |
| `channels.feishu.accounts.<id>.domain` | Перевизначення домену для окремого облікового запису | `feishu` |
| `channels.feishu.accounts.<id>.tts` | Перевизначення TTS для окремого облікового запису | `messages.tts` |
| `channels.feishu.dmPolicy` | Політика приватних повідомлень | `allowlist` |
| `channels.feishu.allowFrom` | Список дозволених для приватних повідомлень (список open_id) | [BotOwnerId] |
| `channels.feishu.groupPolicy` | Політика груп | `allowlist` |
| `channels.feishu.groupAllowFrom` | Список дозволених груп | - |
| `channels.feishu.requireMention` | Вимагати @згадку в групах | `true` |
| `channels.feishu.groups.<chat_id>.requireMention` | Перевизначення @згадки для окремої групи; явні ідентифікатори також допускають групу в режимі списку дозволених | inherited |
| `channels.feishu.groups.<chat_id>.enabled` | Увімкнути/вимкнути певну групу | `true` |
| `channels.feishu.textChunkLimit` | Розмір фрагмента повідомлення | `2000` |
| `channels.feishu.mediaMaxMb` | Обмеження розміру медіа | `30` |
| `channels.feishu.streaming` | Потокове виведення картки | `true` |
| `channels.feishu.blockStreaming` | Потокова відповідь завершеними блоками | `false` |
| `channels.feishu.typingIndicator` | Надсилати реакції набору тексту | `true` |
| `channels.feishu.resolveSenderNames` | Визначати відображувані імена відправників | `true` |

---

## Підтримувані типи повідомлень

### Отримання

- ✅ Текст
- ✅ Форматований текст (допис)
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Стікери

Вхідні аудіоповідомлення Feishu/Lark нормалізуються як медіазаповнювачі замість
необробленого JSON `file_key`. Коли налаштовано `tools.media.audio`, OpenClaw
завантажує ресурс голосової нотатки та запускає спільну транскрипцію аудіо перед
ходом агента, тому агент отримує транскрипт мовлення. Якщо Feishu включає
текст транскрипта безпосередньо в аудіокорисне навантаження, цей текст
використовується без ще одного виклику ASR. Без постачальника транскрипції аудіо
агент усе одно отримує заповнювач `<media:audio>` разом зі збереженим вкладенням,
а не необроблене корисне навантаження ресурсу Feishu.

### Надсилання

- ✅ Текст
- ✅ Зображення
- ✅ Файли
- ✅ Аудіо
- ✅ Відео/медіа
- ✅ Інтерактивні картки (зокрема потокові оновлення)
- ⚠️ Форматований текст (форматування в стилі допису; не підтримує повні можливості створення вмісту Feishu/Lark)

Нативні аудіобульбашки Feishu/Lark використовують тип повідомлення Feishu `audio`
і потребують завантаженого медіа Ogg/Opus (`file_type: "opus"`). Наявні медіа
`.opus` і `.ogg` надсилаються безпосередньо як нативне аудіо. MP3/WAV/M4A та інші
ймовірні аудіоформати перекодовуються в Ogg/Opus 48 кГц за допомогою `ffmpeg`
лише тоді, коли відповідь запитує доставку голосом (`audioAsVoice` / інструмент
повідомлень `asVoice`, зокрема відповіді TTS у вигляді голосових нотаток).
Звичайні вкладення MP3 залишаються звичайними файлами. Якщо `ffmpeg` відсутній
або перетворення завершується невдало, OpenClaw повертається до файлового
вкладення й журналює причину.

### Потоки та відповіді

- ✅ Вбудовані відповіді
- ✅ Відповіді в потоці
- ✅ Медіавідповіді залишаються обізнаними про потік під час відповіді на повідомлення в потоці

Для `groupSessionScope: "group_topic"` і `"group_topic_sender"` нативні тематичні
групи Feishu/Lark використовують подієвий `thread_id` (`omt_*`) як канонічний
ключ тематичного сеансу. Якщо нативна подія початку теми не містить `thread_id`,
OpenClaw доповнює його з Feishu перед маршрутизацією ходу. Звичайні відповіді
в групі, які OpenClaw перетворює на потоки, і надалі використовують ідентифікатор
кореневого повідомлення відповіді (`om_*`), щоб перший хід і наступний хід
залишалися в одному сеансі.

---

## Пов’язане

- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Спарювання](/uk/channels/pairing) - автентифікація приватних повідомлень і потік спарювання
- [Групи](/uk/channels/groups) - поведінка групового чату та контроль згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
