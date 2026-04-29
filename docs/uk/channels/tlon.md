---
read_when:
    - Робота над функціями каналу Tlon/Urbit
summary: Стан підтримки Tlon/Urbit, можливості та конфігурація
title: Tlon
x-i18n:
    generated_at: "2026-04-29T05:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon — це децентралізований месенджер, побудований на Urbit. OpenClaw підключається до вашого Urbit ship і може
відповідати на DM та повідомлення групових чатів. Групові відповіді за замовчуванням потребують @ згадки і можуть
бути додатково обмежені через allowlist.

Статус: вбудований плагін. Підтримуються DM, групові згадки, відповіді в гілках, форматування rich text і
завантаження зображень. Реакції й опитування поки не підтримуються.

## Вбудований плагін

Tlon постачається як вбудований плагін у поточних випусках OpenClaw, тому звичайні packaged
збірки не потребують окремого встановлення.

Якщо ви користуєтеся старішою збіркою або кастомним встановленням, яке виключає Tlon, установіть
поточний npm-пакет, коли його буде опубліковано:

Установлення через CLI (npm registry, коли поточний пакет існує):

```bash
openclaw plugins install @openclaw/tlon
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, використовуйте поточну packaged
збірку OpenClaw або шлях до локального checkout, доки не буде
опубліковано новіший npm-пакет.

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Докладніше: [Плагіни](/uk/tools/plugin)

## Налаштування

1. Переконайтеся, що плагін Tlon доступний.
   - Поточні packaged випуски OpenClaw уже містять його.
   - Старіші/кастомні встановлення можуть додати його вручну командами вище.
2. Зберіть URL вашого ship і код входу.
3. Налаштуйте `channels.tlon`.
4. Перезапустіть gateway.
5. Надішліть DM боту або згадайте його в груповому каналі.

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
потрібно явно увімкнути це:

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

Це стосується URL на кшталт:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Умикайте це лише тоді, коли довіряєте своїй локальній мережі. Це налаштування вимикає захист від SSRF
для запитів до URL вашого ship.

## Групові канали

Автовиявлення ввімкнене за замовчуванням. Ви також можете закріпити канали вручну:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Вимкнення автовиявлення:

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

Allowlist для DM (порожній = DM не дозволені, використовуйте `ownerShip` для потоку схвалення):

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

Задайте owner ship, щоб отримувати запити на схвалення, коли неавторизовані користувачі намагаються взаємодіяти:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Owner ship **автоматично авторизований усюди** — запрошення DM приймаються автоматично, а
повідомлення каналів завжди дозволені. Вам не потрібно додавати власника до `dmAllowlist` або
`defaultAuthorizedShips`.

Якщо це налаштовано, власник отримує DM-сповіщення про:

- DM-запити від ships, яких немає в allowlist
- Згадки в каналах без авторизації
- Запити на групові запрошення

## Налаштування автоматичного прийняття

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

## Цілі доставки (CLI/cron)

Використовуйте їх з `openclaw message send` або cron-доставкою:

- DM: `~sampel-palnet` або `dm/~sampel-palnet`
- Група: `chat/~host-ship/channel` або `group:~host-ship/channel`

## Вбудований skill

Плагін Tlon містить вбудований skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
який надає CLI-доступ до операцій Tlon:

- **Контакти**: отримання/оновлення профілів, список контактів
- **Канали**: список, створення, публікація повідомлень, отримання історії
- **Групи**: список, створення, керування учасниками
- **DM**: надсилання повідомлень, реагування на повідомлення
- **Реакції**: додавання/видалення emoji-реакцій до дописів і DM
- **Налаштування**: керування дозволами плагіна через slash-команди

Skill автоматично доступний, коли плагін установлено.

## Можливості

| Функція         | Статус                                  |
| --------------- | --------------------------------------- |
| Прямі повідомлення | ✅ Підтримується                            |
| Групи/канали | ✅ Підтримується (за замовчуванням через згадки) |
| Гілки         | ✅ Підтримується (автовідповіді в гілці)   |
| Rich text       | ✅ Markdown перетворюється у формат Tlon    |
| Зображення          | ✅ Завантажуються в сховище Tlon             |
| Реакції       | ✅ Через [вбудований skill](#bundled-skill)  |
| Опитування           | ❌ Поки не підтримується                    |
| Нативні команди | ✅ Підтримується (за замовчуванням лише для власника)    |

## Усунення несправностей

Спершу виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Поширені збої:

- **DM ігноруються**: відправника немає в `dmAllowlist` і `ownerShip` не налаштовано для потоку схвалення.
- **Групові повідомлення ігноруються**: канал не виявлено або відправник не авторизований.
- **Помилки з’єднання**: перевірте, що URL ship доступний; увімкніть `allowPrivateNetwork` для локальних ships.
- **Помилки автентифікації**: переконайтеся, що код входу актуальний (коди змінюються).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.tlon.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.tlon.ship`: ім’я Urbit ship бота (наприклад, `~sampel-palnet`).
- `channels.tlon.url`: URL ship (наприклад, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: код входу ship.
- `channels.tlon.allowPrivateNetwork`: дозволити localhost/LAN URL (обхід SSRF).
- `channels.tlon.ownerShip`: owner ship для системи схвалення (завжди авторизований).
- `channels.tlon.dmAllowlist`: ships, яким дозволено надсилати DM (порожньо = жодного).
- `channels.tlon.autoAcceptDmInvites`: автоматично приймати DM від ships з allowlist.
- `channels.tlon.autoAcceptGroupInvites`: автоматично приймати всі групові запрошення.
- `channels.tlon.autoDiscoverChannels`: автоматично виявляти групові канали (за замовчуванням: true).
- `channels.tlon.groupChannels`: вручну закріплені channel nests.
- `channels.tlon.defaultAuthorizedShips`: ships, авторизовані для всіх каналів.
- `channels.tlon.authorization.channelRules`: правила автентифікації для кожного каналу.
- `channels.tlon.showModelSignature`: додавати назву моделі до повідомлень.

## Примітки

- Групові відповіді потребують згадки (наприклад, `~your-bot-ship`), щоб відповісти.
- Відповіді в гілках: якщо вхідне повідомлення належить до гілки, OpenClaw відповідає в цій гілці.
- Rich text: форматування Markdown (жирний, курсив, code, заголовки, списки) перетворюється у нативний формат Tlon.
- Зображення: URL завантажуються до сховища Tlon і вбудовуються як блоки зображень.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
