---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Статус підтримки Nextcloud Talk, можливості та конфігурація
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T21:04:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b05d31a3e57cd8989ccb2ac122f2cd548de4120a54a8a04aa979e5ebc94eab61
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Статус: вбудований Plugin (Webhook-бот). Підтримуються прямі повідомлення, кімнати, реакції та повідомлення з markdown.

## Вбудований Plugin

Nextcloud Talk постачається як вбудований Plugin у поточних релізах OpenClaw, тому
звичайні пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке виключає Nextcloud Talk,
встановіть npm-пакет напряму:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Використовуйте `@openclaw/nextcloud-talk@beta`, коли стежите за beta-каналом OpenClaw і
npmjs показує `beta` попереду `latest`.

Локальний checkout (коли запуск відбувається з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Nextcloud Talk доступний.
   - Поточні пакетні релізи OpenClaw уже містять його.
   - Старіші або власні встановлення можуть додати його вручну за допомогою команд вище.
2. На вашому сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або env: `NEXTCLOUD_TALK_BOT_SECRET` (лише типовий обліковий запис)

   Налаштування CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Еквівалентні явні поля:

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
- URL Webhook має бути доступним для Gateway; установіть `webhookPublicUrl`, якщо він за проксі.
- Завантаження медіа не підтримується API бота; медіа надсилаються як URL.
- Payload Webhook не розрізняє DM і кімнати; задайте `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше DM обробляються як кімнати).

## Контроль доступу (DM)

- Типово: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код сполучення.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні DM: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` збігається лише з ID користувачів Nextcloud; відображувані імена ігноруються.

## Кімнати (групи)

- Типово: `channels.nextcloud-talk.groupPolicy = "allowlist"` (доступ через згадку).
- Дозвольте кімнати списком дозволених у `channels.nextcloud-talk.rooms`:

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

| Функція           | Статус            |
| ----------------- | ----------------- |
| Прямі повідомлення | Підтримується     |
| Кімнати           | Підтримується     |
| Потоки            | Не підтримується  |
| Медіа             | Лише URL          |
| Реакції           | Підтримується     |
| Нативні команди   | Не підтримується  |

## Довідник конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL інстансу Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для пошуку кімнат (виявлення DM).
- `channels.nextcloud-talk.apiPassword`: пароль API/застосунку для пошуку кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт слухача Webhook (типово: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (типово: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях Webhook (типово: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: список дозволених для DM (ID користувачів). `open` вимагає `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: список дозволених для груп (ID користувачів).
- `channels.nextcloud-talk.rooms`: налаштування й список дозволених для кожної кімнати.
- `channels.nextcloud-talk.historyLimit`: ліміт історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії DM (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути потокове передавання блоків для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання потокового передавання блоків.
- `channels.nextcloud-talk.mediaMaxMb`: обмеження вхідних медіа (МБ).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та доступ через згадку
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
