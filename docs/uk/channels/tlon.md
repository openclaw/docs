---
read_when:
    - Робота над функціями каналу Tlon/Urbit
summary: Статус підтримки, можливості та конфігурація Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T21:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon — це децентралізований месенджер, побудований на Urbit. OpenClaw підключається до вашого Urbit ship і може
відповідати на DM та повідомлення групових чатів. Групові відповіді за замовчуванням потребують @-згадки, і їх можна
додатково обмежити за допомогою allowlist.

Статус: вбудований plugin. Підтримуються DM, групові згадки, відповіді в тредах, форматування rich text і
завантаження зображень. Реакції та опитування ще не підтримуються.

## Вбудований plugin

Tlon постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайні пакетовані
збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення, яке не містить Tlon, установіть
поточний npm-пакет:

Установлення через CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Використовуйте базовий пакет, щоб стежити за поточним офіційним тегом випуску. Закріплюйте точну
версію лише тоді, коли вам потрібне відтворюване встановлення.

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Налаштування

1. Переконайтеся, що plugin Tlon доступний.
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - Старіші/спеціальні встановлення можуть додати його вручну за допомогою команд вище.
2. Зберіть URL вашого ship і код входу.
3. Налаштуйте `channels.tlon`.
4. Перезапустіть gateway.
5. Надішліть боту DM або згадайте його в груповому каналі.

Мінімальна конфігурація (один обліковий запис):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Приватні/LAN ships

За замовчуванням OpenClaw блокує приватні/внутрішні імена хостів і діапазони IP для захисту від SSRF.
Якщо ваш ship працює в приватній мережі (localhost, LAN IP або внутрішнє ім’я хоста),
потрібно явно ввімкнути це:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Це застосовується до URL на кшталт:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Вмикайте це лише якщо довіряєте своїй локальній мережі. Цей параметр вимикає захист від SSRF
для запитів до URL вашого ship.

## Групові канали

Автоматичне виявлення ввімкнено за замовчуванням. Також можна закріпити канали вручну:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Вимкнення автоматичного виявлення:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Контроль доступу

Allowlist для DM (порожній = DM заборонені, використовуйте `ownerShip` для процесу схвалення):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Авторизація груп (обмежена за замовчуванням):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Власник і система схвалення

Налаштуйте owner ship, щоб отримувати запити на схвалення, коли неавторизовані користувачі намагаються взаємодіяти:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Owner ship **автоматично авторизований всюди** — запрошення DM приймаються автоматично, а
повідомлення каналів завжди дозволені. Не потрібно додавати власника до `dmAllowlist` або
`defaultAuthorizedShips`.

Якщо це налаштовано, власник отримує DM-сповіщення про:

- DM-запити від ships, яких немає в allowlist
- Згадки в каналах без авторизації
- Запити на групові запрошення

## Параметри автоматичного прийняття

Автоматично приймати DM-запрошення (для ships у dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Автоматично приймати групові запрошення:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Цілі доставлення (CLI/cron)

Використовуйте їх з `openclaw message send` або доставленням cron:

- DM: `~sampel-palnet` або `dm/~sampel-palnet`
- Група: `chat/~host-ship/channel` або `group:~host-ship/channel`

## Вбудований skill

Plugin Tlon містить вбудований skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
який надає CLI-доступ до операцій Tlon:

- **Контакти**: отримання/оновлення профілів, список контактів
- **Канали**: список, створення, публікація повідомлень, отримання історії
- **Групи**: список, створення, керування учасниками
- **DM**: надсилання повідомлень, реакції на повідомлення
- **Реакції**: додавання/видалення emoji-реакцій до дописів і DM
- **Налаштування**: керування дозволами plugin через slash commands

Skill автоматично доступний, коли plugin установлено.

## Можливості

| Функція           | Статус                                      |
| ----------------- | ------------------------------------------- |
| Прямі повідомлення | ✅ Підтримується                            |
| Групи/канали      | ✅ Підтримується (за замовчуванням через згадки) |
| Треди             | ✅ Підтримується (автовідповіді в треді)    |
| Rich text         | ✅ Markdown перетворюється у формат Tlon    |
| Зображення        | ✅ Завантажуються до сховища Tlon           |
| Реакції           | ✅ Через [вбудований skill](#bundled-skill) |
| Опитування        | ❌ Ще не підтримується                      |
| Нативні команди   | ✅ Підтримується (за замовчуванням лише для власника) |

## Усунення несправностей

Спершу виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Поширені збої:

- **DM ігноруються**: відправника немає в `dmAllowlist`, і `ownerShip` не налаштовано для процесу схвалення.
- **Групові повідомлення ігноруються**: канал не виявлено або відправник не авторизований.
- **Помилки підключення**: перевірте, чи URL ship доступний; увімкніть `allowPrivateNetwork` для локальних ships.
- **Помилки авторизації**: переконайтеся, що код входу актуальний (коди змінюються).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.tlon.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.tlon.ship`: ім’я Urbit ship бота (наприклад, `~sampel-palnet`).
- `channels.tlon.url`: URL ship (наприклад, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: код входу ship.
- `channels.tlon.allowPrivateNetwork`: дозволити localhost/LAN URL (обхід SSRF).
- `channels.tlon.ownerShip`: owner ship для системи схвалення (завжди авторизований).
- `channels.tlon.dmAllowlist`: ships, яким дозволено надсилати DM (порожній = жодного).
- `channels.tlon.autoAcceptDmInvites`: автоматично приймати DM від ships з allowlist.
- `channels.tlon.autoAcceptGroupInvites`: автоматично приймати всі групові запрошення.
- `channels.tlon.autoDiscoverChannels`: автоматично виявляти групові канали (за замовчуванням: true).
- `channels.tlon.groupChannels`: вручну закріплені channel nests.
- `channels.tlon.defaultAuthorizedShips`: ships, авторизовані для всіх каналів.
- `channels.tlon.authorization.channelRules`: правила авторизації для кожного каналу.
- `channels.tlon.showModelSignature`: додавати назву моделі до повідомлень.

## Примітки

- Групові відповіді потребують згадки (наприклад, `~your-bot-ship`), щоб відповісти.
- Відповіді в тредах: якщо вхідне повідомлення в треді, OpenClaw відповідає в цьому треді.
- Rich text: форматування Markdown (жирний, курсив, код, заголовки, списки) перетворюється в нативний формат Tlon.
- Зображення: URL завантажуються до сховища Tlon і вбудовуються як блоки зображень.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
