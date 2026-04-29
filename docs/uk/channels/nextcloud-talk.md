---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Стан підтримки, можливості та конфігурація Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-29T05:36:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Стан: вбудований Plugin (бот Webhook). Підтримуються прямі повідомлення, кімнати, реакції та markdown-повідомлення.

## Вбудований Plugin

Nextcloud Talk постачається як вбудований Plugin у поточних випусках OpenClaw, тому
звичайні пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить Nextcloud Talk,
установіть поточний npm-пакет, коли його буде опубліковано:

Встановлення через CLI (npm registry, коли існує поточний пакет):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарів, використовуйте поточну пакетовану
збірку OpenClaw або шлях до локального checkout, доки не буде
опубліковано новіший npm-пакет.

Локальний checkout (під час запуску з git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Nextcloud Talk доступний.
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - Старіші/власні встановлення можуть додати його вручну за допомогою команд вище.
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

- Боти не можуть ініціювати DM. Користувач має спершу написати боту.
- URL Webhook має бути доступним для Gateway; установіть `webhookPublicUrl`, якщо використовується проксі.
- Завантаження медіа не підтримуються API бота; медіа надсилаються як URL.
- Payload Webhook не розрізняє DM і кімнати; установіть `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше DM обробляються як кімнати).

## Керування доступом (DM)

- Типово: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код сполучення.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні DM: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляється лише з ID користувачів Nextcloud; відображувані імена ігноруються.

## Кімнати (групи)

- Типово: `channels.nextcloud-talk.groupPolicy = "allowlist"` (доступ за згадкою).
- Додавайте кімнати до allowlist за допомогою `channels.nextcloud-talk.rooms`:

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

- Щоб не дозволяти жодних кімнат, залиште allowlist порожнім або встановіть `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція         | Стан        |
| --------------- | ------------- |
| Прямі повідомлення | Підтримується     |
| Кімнати           | Підтримується     |
| Потоки         | Не підтримується |
| Медіа           | Лише URL      |
| Реакції       | Підтримується     |
| Нативні команди | Не підтримується |

## Довідник конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL інстансу Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символьні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для визначення кімнат (виявлення DM).
- `channels.nextcloud-talk.apiPassword`: пароль API/застосунку для визначення кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт слухача Webhook (типово: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (типово: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях Webhook (типово: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID користувачів). `open` вимагає `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist груп (ID користувачів).
- `channels.nextcloud-talk.rooms`: налаштування для кожної кімнати та allowlist.
- `channels.nextcloud-talk.historyLimit`: ліміт історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії DM (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для кожного DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути блокове потокове передавання для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання блокового потокового передавання.
- `channels.nextcloud-talk.mediaMaxMb`: ліміт вхідних медіа (MB).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та доступ за згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
