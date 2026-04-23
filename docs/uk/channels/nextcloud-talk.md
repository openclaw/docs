---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Стан підтримки Nextcloud Talk, можливості та конфігурація
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-23T20:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2eebd6cfd013d3a6e1cf03e2a2167d0657e688c5989f179bb0fec39f866586cb
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Стан: вбудований Plugin (бот на Webhook). Підтримуються приватні повідомлення, кімнати, реакції та Markdown-повідомлення.

## Вбудований Plugin

Nextcloud Talk постачається як вбудований Plugin у поточних релізах OpenClaw, тож
для звичайних пакетованих збірок окреме встановлення не потрібне.

Якщо у вас старіша збірка або кастомне встановлення без Nextcloud Talk,
встановіть його вручну:

Встановлення через CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Plugin-и](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Nextcloud Talk доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - У старіших/кастомних встановленнях його можна додати вручну командами вище.
2. На вашому сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або env: `NEXTCLOUD_TALK_BOT_SECRET` (лише для типового акаунта)
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
- URL Webhook має бути доступним для Gateway; задайте `webhookPublicUrl`, якщо ви працюєте за проксі.
- Завантаження медіа не підтримується API бота; медіа надсилаються як URL.
- Payload Webhook не розрізняє DM і кімнати; задайте `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше DM трактуються як кімнати).

## Керування доступом (DM)

- Типово: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код pairing.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні DM: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляється лише з Nextcloud user ID; відображувані імена ігноруються.

## Кімнати (групи)

- Типово: `channels.nextcloud-talk.groupPolicy = "allowlist"` (шлюзування за згадками).
- Додайте кімнати до allowlist через `channels.nextcloud-talk.rooms`:

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

- Щоб не дозволяти жодних кімнат, залиште allowlist порожнім або задайте `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція              | Стан          |
| -------------------- | ------------- |
| Приватні повідомлення | Підтримується |
| Кімнати              | Підтримується |
| Треди                | Не підтримується |
| Медіа                | Лише URL      |
| Реакції              | Підтримується |
| Нативні команди      | Не підтримується |

## Довідник конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL інстансу Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: API-користувач для пошуку кімнат (визначення DM).
- `channels.nextcloud-talk.apiPassword`: API/app password для пошуку кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу з API-паролем.
- `channels.nextcloud-talk.webhookPort`: порт слухача Webhook (типово: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (типово: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях Webhook (типово: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM allowlist (user ID). Для `open` потрібен `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist груп (user ID).
- `channels.nextcloud-talk.rooms`: налаштування для окремих кімнат і allowlist.
- `channels.nextcloud-talk.historyLimit`: ліміт історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії DM (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межі абзаців) перед розбиттям за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути block streaming для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання для block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: ліміт вхідних медіа (МБ).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюзування за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
