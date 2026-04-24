---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Статус підтримки, можливості та конфігурація Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T06:23:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Статус: вбудований Plugin (Webhook-бот). Підтримуються прямі повідомлення, кімнати, реакції та повідомлення у форматі markdown.

## Вбудований Plugin

Nextcloud Talk постачається як вбудований Plugin у поточних релізах OpenClaw, тому
звичайним пакетованим збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить Nextcloud Talk,
встановіть його вручну:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Nextcloud Talk доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його в комплекті.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. На вашому сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або змінна середовища: `NEXTCLOUD_TALK_BOT_SECRET` (лише для облікового запису за замовчуванням)

   Налаштування через CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Еквівалент із явним указанням полів:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Секрет із файлу:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Перезапустіть Gateway (або завершіть налаштування).

Мінімальна конфігурація:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Примітки

- Боти не можуть ініціювати DM. Користувач має спочатку написати боту.
- URL Webhook має бути доступним для Gateway; установіть `webhookPublicUrl`, якщо використовується проксі.
- Завантаження медіа не підтримується API бота; медіа надсилається як URL.
- Payload Webhook не розрізняє DM і кімнати; установіть `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше DM обробляються як кімнати).

## Контроль доступу (DM)

- За замовчуванням: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код прив’язки.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні DM: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` відповідає лише ідентифікаторам користувачів Nextcloud; відображувані імена ігноруються.

## Кімнати (групи)

- За замовчуванням: `channels.nextcloud-talk.groupPolicy = "allowlist"` (із вимогою згадки).
- Додайте кімнати до списку дозволених через `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Щоб не дозволяти жодних кімнат, залиште список дозволених порожнім або встановіть `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція             | Статус            |
| ------------------- | ----------------- |
| Прямі повідомлення  | Підтримується     |
| Кімнати             | Підтримується     |
| Потоки              | Не підтримується  |
| Медіа               | Лише URL          |
| Реакції             | Підтримується     |
| Вбудовані команди   | Не підтримується  |

## Довідник із конфігурації (Nextcloud Talk)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL екземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для пошуку кімнат (визначення DM).
- `channels.nextcloud-talk.apiPassword`: пароль API/застосунку для пошуку кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файла з паролем API.
- `channels.nextcloud-talk.webhookPort`: порт слухача Webhook (за замовчуванням: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (за замовчуванням: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях Webhook (за замовчуванням: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: список дозволених для DM (ідентифікатори користувачів). Для `open` потрібен `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: список дозволених для груп (ідентифікатори користувачів).
- `channels.nextcloud-talk.rooms`: параметри для окремих кімнат і список дозволених.
- `channels.nextcloud-talk.historyLimit`: ліміт історії для груп (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії для DM (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (за замовчуванням) або `newline` для розбиття за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути потокову передачу блоків для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: параметри об’єднання потокової передачі блоків.
- `channels.nextcloud-talk.mediaMaxMb`: вхідне обмеження медіа (МБ).

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес прив’язки
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
