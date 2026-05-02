---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Стан підтримки, можливості та налаштування Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T21:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Стан: вбудований Plugin (webhook-бот). Підтримуються прямі повідомлення, кімнати, реакції та markdown-повідомлення.

## Вбудований Plugin

Nextcloud Talk постачається як вбудований Plugin у поточних випусках OpenClaw, тому
звичайні пакетні збірки не потребують окремого встановлення.

Якщо ви користуєтеся старішою збіркою або власним встановленням, яке виключає Nextcloud Talk,
встановіть npm-пакет напряму:

Встановлення через CLI (npm-реєстр):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Використовуйте пакет без версії, щоб стежити за поточним офіційним тегом випуску. Закріплюйте точну
версію лише тоді, коли вам потрібне відтворюване встановлення.

Локальна робоча копія (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Nextcloud Talk доступний.
   - Поточні пакетні випуски OpenClaw уже містять його.
   - Старіші/власні встановлення можуть додати його вручну за допомогою команд вище.
2. На сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або env: `NEXTCLOUD_TALK_BOT_SECRET` (лише обліковий запис за замовчуванням)

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

- Боти не можуть ініціювати прямі повідомлення. Користувач має спершу написати боту.
- URL Webhook має бути доступним для Gateway; встановіть `webhookPublicUrl`, якщо він за проксі.
- Завантаження медіа не підтримується API бота; медіа надсилаються як URL.
- Payload Webhook не розрізняє прямі повідомлення та кімнати; встановіть `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше прямі повідомлення обробляються як кімнати).

## Контроль доступу (прямі повідомлення)

- За замовчуванням: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код сполучення.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні прямі повідомлення: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляє лише ID користувачів Nextcloud; відображувані імена ігноруються.

## Кімнати (групи)

- За замовчуванням: `channels.nextcloud-talk.groupPolicy = "allowlist"` (з доступом за згадкою).
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

- Щоб не дозволяти жодні кімнати, залиште список дозволених порожнім або встановіть `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція           | Стан               |
| ----------------- | ------------------ |
| Прямі повідомлення | Підтримується      |
| Кімнати           | Підтримується      |
| Ланцюжки          | Не підтримується   |
| Медіа             | Лише URL           |
| Реакції           | Підтримується      |
| Нативні команди   | Не підтримується   |

## Довідник конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL інстанса Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для визначення кімнат (виявлення прямих повідомлень).
- `channels.nextcloud-talk.apiPassword`: пароль API/застосунку для визначення кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт слухача webhook (за замовчуванням: 8788).
- `channels.nextcloud-talk.webhookHost`: хост webhook (за замовчуванням: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях webhook (за замовчуванням: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: список дозволених для прямих повідомлень (ID користувачів). `open` вимагає `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: список дозволених для груп (ID користувачів).
- `channels.nextcloud-talk.rooms`: налаштування та список дозволених для кожної кімнати.
- `channels.nextcloud-talk.historyLimit`: ліміт історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії прямих повідомлень (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для кожного прямого повідомлення (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (за замовчуванням) або `newline` для поділу за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути блокове потокове передавання для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання блокового потокового передавання.
- `channels.nextcloud-talk.mediaMaxMb`: ліміт вхідних медіа (МБ).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація прямих повідомлень і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та доступ за згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
