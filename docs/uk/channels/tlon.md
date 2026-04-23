---
read_when:
    - Робота над функціями каналу Tlon/Urbit
summary: Статус підтримки Tlon/Urbit, можливості та конфігурація
title: Tlon
x-i18n:
    generated_at: "2026-04-23T20:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon — це децентралізований месенджер, побудований на Urbit. OpenClaw підключається до вашого Urbit ship і може
відповідати на DM та повідомлення в групових чатах. Відповіді в групах за замовчуванням потребують згадки @ і можуть
додатково обмежуватися через allowlist.

Статус: вбудований plugin. Підтримуються DM, згадки в групах, відповіді в тредах, форматування rich text і
завантаження зображень. Реакції та опитування поки що не підтримуються.

## Вбудований plugin

Tlon постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайним пакетним
збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без Tlon, встановіть його
вручну:

Встановлення через CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Налаштування

1. Переконайтеся, що plugin Tlon доступний.
   - Поточні пакетні випуски OpenClaw уже містять його.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Зберіть URL вашого ship і код входу.
3. Налаштуйте `channels.tlon`.
4. Перезапустіть Gateway.
5. Напишіть боту в DM або згадайте його в груповому каналі.

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

## Приватні/LAN ship

За замовчуванням OpenClaw блокує приватні/внутрішні імена хостів і діапазони IP для захисту від SSRF.
Якщо ваш ship працює в приватній мережі (localhost, LAN IP або внутрішнє ім’я хоста),
ви маєте явно це дозволити:

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

Це застосовується до таких URL, як:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Увімкніть це, лише якщо довіряєте своїй локальній мережі. Це налаштування вимикає захист SSRF
для запитів до URL вашого ship.

## Групові канали

Автовиявлення ввімкнено за замовчуванням. Ви також можете закріпити канали вручну:

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

## Керування доступом

DM allowlist (порожньо = DM не дозволено, використовуйте `ownerShip` для потоку схвалення):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Авторизація груп (за замовчуванням обмежена):

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

Вкажіть ship власника, щоб отримувати запити на схвалення, коли неавторизовані користувачі намагаються взаємодіяти:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship власника **автоматично авторизований скрізь** — запрошення до DM приймаються автоматично, а
повідомлення в каналах завжди дозволені. Вам не потрібно додавати власника до `dmAllowlist` або
`defaultAuthorizedShips`.

Коли це налаштовано, власник отримує DM-сповіщення про:

- запити DM від ship, яких немає в allowlist
- згадки в каналах без авторизації
- запити на групові запрошення

## Налаштування автоприйняття

Автоматично приймати запрошення до DM (для ship у dmAllowlist):

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

## Цілі доставки (CLI/Cron)

Використовуйте їх із `openclaw message send` або доставкою Cron:

- DM: `~sampel-palnet` або `dm/~sampel-palnet`
- Група: `chat/~host-ship/channel` або `group:~host-ship/channel`

## Вбудований skill

Plugin Tlon містить вбудований skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
який надає доступ через CLI до операцій Tlon:

- **Контакти**: отримання/оновлення профілів, перелік контактів
- **Канали**: перелік, створення, надсилання повідомлень, отримання історії
- **Групи**: перелік, створення, керування учасниками
- **DM**: надсилання повідомлень, реакції на повідомлення
- **Реакції**: додавання/видалення emoji-реакцій до постів і DM
- **Налаштування**: керування дозволами plugin через slash-команди

Skill стає автоматично доступним, коли plugin встановлено.

## Можливості

| Функція         | Статус                                  |
| --------------- | --------------------------------------- |
| Прямі повідомлення | ✅ Підтримується                      |
| Групи/канали    | ✅ Підтримується (за замовчуванням із керуванням через згадки) |
| Треди           | ✅ Підтримується (автовідповіді в треді) |
| Rich text       | ✅ Markdown перетворюється у формат Tlon |
| Зображення      | ✅ Завантажуються в сховище Tlon         |
| Реакції         | ✅ Через [вбудований skill](#bundled-skill) |
| Опитування      | ❌ Поки що не підтримуються              |
| Нативні команди | ✅ Підтримуються (за замовчуванням лише для власника) |

## Усунення несправностей

Спочатку запустіть цей набір:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Типові збої:

- **DM ігноруються**: відправника немає в `dmAllowlist`, і не налаштовано `ownerShip` для потоку схвалення.
- **Повідомлення в групах ігноруються**: канал не виявлено або відправник не авторизований.
- **Помилки з’єднання**: перевірте, чи URL ship доступний; увімкніть `allowPrivateNetwork` для локальних ship.
- **Помилки автентифікації**: переконайтеся, що код входу актуальний (коди змінюються).

## Довідник із конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.tlon.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.tlon.ship`: назва Urbit ship бота (наприклад, `~sampel-palnet`).
- `channels.tlon.url`: URL ship (наприклад, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: код входу ship.
- `channels.tlon.allowPrivateNetwork`: дозволити URL localhost/LAN (обхід SSRF).
- `channels.tlon.ownerShip`: ship власника для системи схвалення (завжди авторизований).
- `channels.tlon.dmAllowlist`: ship, яким дозволено DM (порожньо = нікому).
- `channels.tlon.autoAcceptDmInvites`: автоматично приймати DM від ship з allowlist.
- `channels.tlon.autoAcceptGroupInvites`: автоматично приймати всі групові запрошення.
- `channels.tlon.autoDiscoverChannels`: автоматично виявляти групові канали (типово: true).
- `channels.tlon.groupChannels`: вручну закріплені nest каналів.
- `channels.tlon.defaultAuthorizedShips`: ship, авторизовані для всіх каналів.
- `channels.tlon.authorization.channelRules`: правила авторизації для кожного каналу.
- `channels.tlon.showModelSignature`: додавати назву моделі до повідомлень.

## Примітки

- Відповіді в групах потребують згадки (наприклад, `~your-bot-ship`), щоб відповісти.
- Відповіді в тредах: якщо вхідне повідомлення надходить у треді, OpenClaw відповідає в тому ж треді.
- Rich text: форматування Markdown (жирний, курсив, код, заголовки, списки) перетворюється у нативний формат Tlon.
- Зображення: URL завантажуються у сховище Tlon і вбудовуються як блоки зображень.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Прив’язка](/uk/channels/pairing) — автентифікація DM і потік прив’язки
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
