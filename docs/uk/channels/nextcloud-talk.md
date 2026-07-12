---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Стан підтримки, можливості та налаштування Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T12:59:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk — це завантажуваний Plugin каналу (`@openclaw/nextcloud-talk`), який з’єднує OpenClaw із власним екземпляром Nextcloud через Webhook-бота Talk. Підтримуються особисті повідомлення, кімнати, реакції та повідомлення у форматі Markdown; медіафайли надсилаються як URL-адреси.

## Встановлення

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Використовуйте специфікацію пакета без версії, щоб отримувати поточний офіційний тег випуску. Закріплюйте точну версію лише тоді, коли потрібне відтворюване встановлення.

З локальної робочої копії (процеси розробки):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Після встановлення перезапустіть Gateway. Докладніше: [Pluginи](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Встановіть Plugin (див. вище).
2. На сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Залиште `--feature response`: без нього вихідні відповіді завершуються помилкою 401. Виправте наявного бота командою `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або змінна середовища: `NEXTCLOUD_TALK_BOT_SECRET` (лише для облікового запису за замовчуванням)

   Налаштування через CLI (`--url`/`--token` є псевдонімами явних полів; `nc-talk` і `nc` працюють як псевдоніми каналу):

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

- Боти не можуть ініціювати особисті повідомлення. Користувач має спочатку надіслати повідомлення боту.
- URL-адреса Webhook має бути доступною із сервера Nextcloud; якщо Gateway розташований за проксі-сервером, задайте `webhookPublicUrl`. Запити Webhook підписуються за допомогою HMAC-SHA256 із секретом бота; запити з недійсними підписами відхиляються та підлягають обмеженню частоти.
- API бота не підтримує завантаження медіафайлів; до вихідних медіафайлів додається рядок `Attachment: <url>`.
- Корисне навантаження Webhook не розрізняє особисті повідомлення й кімнати; задайте `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (кешується приблизно на 5 хвилин). Без них кожна розмова вважається кімнатою.
- Вихідні запити проходять через захист від SSRF. Для хоста Nextcloud у довіреній приватній або внутрішній мережі явно увімкніть `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Якщо задано `apiUser`/`apiPassword` і `webhookPublicUrl`, команда `openclaw channels status` перевіряє бота та попереджає про відсутність можливості `response`.

## Керування доступом (особисті повідомлення)

- За замовчуванням: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код сполучення.
- Підтвердьте за допомогою:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Загальнодоступні особисті повідомлення: `channels.nextcloud-talk.dmPolicy="open"` разом із `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляє лише ідентифікатори користувачів Nextcloud (у нижньому регістрі); відображувані імена ігноруються.

## Кімнати (групи)

- За замовчуванням: `channels.nextcloud-talk.groupPolicy = "allowlist"` (потрібна згадка).
- Додайте кімнати до списку дозволених за допомогою `channels.nextcloud-talk.rooms`, де ключем є токен кімнати; `"*"` задає шаблонне значення за замовчуванням:

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

- Ключі для окремої кімнати: `requireMention` (за замовчуванням true), `enabled` (false вимикає кімнату), `allowFrom` (список дозволених відправників для кімнати), `tools` (перевизначення дозволу або заборони інструментів), `skills` (обмеження завантажуваних Skills), `systemPrompt`.
- Щоб не дозволяти жодних кімнат, залиште список дозволених порожнім або задайте `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція             | Стан                |
| ------------------- | ------------------- |
| Особисті повідомлення | Підтримується       |
| Кімнати             | Підтримуються       |
| Гілки обговорень    | Не підтримуються    |
| Медіафайли          | Лише URL-адреси     |
| Реакції             | Підтримуються       |
| Вбудовані команди   | Не підтримуються    |

## Довідник із конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри постачальника:

- `channels.nextcloud-talk.enabled`: увімкнути або вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL-адреса екземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота (рядок або посилання на секрет).
- `channels.nextcloud-talk.botSecretFile`: шлях до звичайного файлу із секретом. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для визначення кімнат (виявлення особистих повідомлень) і перевірки стану.
- `channels.nextcloud-talk.apiPassword`: пароль API або застосунку для визначення кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт прослуховувача Webhook (за замовчуванням: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (за замовчуванням: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях Webhook (за замовчуванням: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: доступна ззовні URL-адреса Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing). Для `open` потрібне `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: список дозволених для особистих повідомлень (ідентифікатори користувачів).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (за замовчуванням: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: список дозволених відправників у кімнатах (ідентифікатори користувачів); якщо не задано, використовується `allowFrom`.
- `channels.nextcloud-talk.rooms`: налаштування та список дозволених для окремих кімнат (див. вище).
- На статичні групи доступу відправників можна посилатися з `allowFrom` і `groupAllowFrom` за допомогою `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: обмеження історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: обмеження історії особистих повідомлень (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих особистих діалогів із ключем-ідентифікатором користувача (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: розмір частини вихідного тексту в символах (за замовчуванням: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути блокове потокове передавання для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання блокового потокового передавання.
- `channels.nextcloud-talk.responsePrefix`: префікс вихідної відповіді.
- `channels.nextcloud-talk.markdown.tables`: режим відтворення таблиць Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: обмеження розміру вхідних медіафайлів (МБ).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: дозволити приватним або внутрішнім хостам Nextcloud проходити захист від SSRF.
- `channels.nextcloud-talk.accounts.<id>`: перевизначення для окремих облікових записів (ті самі ключі); `defaultAccount` вибирає обліковий запис за замовчуванням. Змінні середовища `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` застосовуються лише до облікового запису за замовчуванням.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
