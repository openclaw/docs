---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Статус підтримки, можливості та налаштування Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T17:29:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk — це завантажуваний Plugin каналу (`@openclaw/nextcloud-talk`), який з’єднує OpenClaw із самостійно розміщеним екземпляром Nextcloud через webhook-бота Talk. Підтримуються особисті повідомлення, кімнати, реакції та повідомлення Markdown; медіафайли надсилаються як URL-адреси.

## Установлення

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Використовуйте специфікацію пакета без версії, щоб отримувати поточний офіційний тег випуску. Закріплюйте точну версію лише тоді, коли потрібне відтворюване встановлення.

З локальної робочої копії (процеси розробки):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Після встановлення перезапустіть Gateway. Докладніше: [Плагіни](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Установіть Plugin (див. вище).
2. На сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Збережіть `--feature response`: без нього вихідні відповіді завершуватимуться помилкою 401. Виправте наявного бота за допомогою `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або змінні середовища: `NEXTCLOUD_TALK_BOT_SECRET` (лише обліковий запис за замовчуванням)

   Налаштування через CLI (`--url`/`--token` — псевдоніми явних полів; `nc-talk` і `nc` працюють як псевдоніми каналу):

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
- URL-адреса webhook має бути доступною із сервера Nextcloud; установіть `webhookPublicUrl`, якщо Gateway розташований за проксі-сервером. Запити webhook підписуються HMAC-SHA256 за допомогою секрету бота; запити з недійсними підписами відхиляються та підлягають обмеженню частоти.
- API бота не підтримує завантаження медіафайлів; вихідні медіафайли додаються як рядок `Attachment: <url>`.
- Корисне навантаження webhook не розрізняє особисті повідомлення та кімнати; установіть `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (кешується приблизно на 5 хвилин). Без них кожна розмова вважається кімнатою.
- Вихідні запити проходять через захист від SSRF. Для хоста Nextcloud у довіреній приватній або внутрішній мережі явно дозвольте це за допомогою `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Якщо задано `apiUser`/`apiPassword` і `webhookPublicUrl`, команда `openclaw channels status` перевіряє бота та попереджає про відсутність можливості `response`.

## Керування доступом (особисті повідомлення)

- За замовчуванням: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код сполучення.
- Схвалення:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Загальнодоступні особисті повідомлення: `channels.nextcloud-talk.dmPolicy="open"` разом із `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляє лише ідентифікатори користувачів Nextcloud (у нижньому регістрі); відображувані імена ігноруються.

## Кімнати (групи)

- За замовчуванням: `channels.nextcloud-talk.groupPolicy = "allowlist"` (потрібна згадка).
- Додайте кімнати до списку дозволених за допомогою `channels.nextcloud-talk.rooms`, використовуючи токен кімнати як ключ; `"*"` задає типове значення для всіх кімнат:

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

- Ключі для окремих кімнат: `requireMention` (типово true), `enabled` (false вимикає кімнату), `allowFrom` (список дозволених відправників для кімнати), `tools` (перевизначення дозволів і заборон інструментів), `skills` (обмеження завантажуваних Skills), `systemPrompt`.
- Щоб не дозволяти жодної кімнати, залиште список дозволених порожнім або встановіть `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція           | Стан                          |
| ----------------- | ----------------------------- |
| Особисті повідомлення | Підтримується             |
| Кімнати           | Підтримується                 |
| Гілки             | Не підтримується              |
| Медіафайли        | Лише URL-адреси               |
| Реакції           | Підтримується                 |
| Вбудовані команди | Не підтримуються              |

## Довідник із конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри постачальника:

- `channels.nextcloud-talk.enabled`: увімкнення або вимкнення запуску каналу.
- `channels.nextcloud-talk.baseUrl`: URL-адреса екземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота (рядок або посилання на секрет).
- `channels.nextcloud-talk.botSecretFile`: шлях до звичайного файлу із секретом. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для пошуку кімнат (визначення особистих повідомлень) і перевірки стану.
- `channels.nextcloud-talk.apiPassword`: пароль API або застосунку для пошуку кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файлу з паролем API.
- `channels.nextcloud-talk.webhookPort`: порт прослуховування webhook (за замовчуванням: 8788).
- `channels.nextcloud-talk.webhookHost`: хост webhook (за замовчуванням: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях webhook (за замовчуванням: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: доступна ззовні URL-адреса webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing). `open` вимагає `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: список дозволених особистих повідомлень (ідентифікатори користувачів).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (за замовчуванням: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: список дозволених відправників у кімнатах (ідентифікатори користувачів); якщо не задано, використовується `allowFrom`.
- `channels.nextcloud-talk.rooms`: налаштування та список дозволених для окремих кімнат (див. вище).
- На статичні групи доступу відправників можна посилатися з `allowFrom` і `groupAllowFrom` за допомогою `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: обмеження історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: обмеження історії особистих повідомлень (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих особистих повідомлень із ключем за ідентифікатором користувача (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту в символах (за замовчуванням: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.streaming.block.enabled`: увімкнення або вимкнення потокового передавання блоків для цього каналу.
- `channels.nextcloud-talk.streaming.block.coalesce`: налаштування об’єднання блоків потокового передавання.
- `channels.nextcloud-talk.responsePrefix`: префікс вихідної відповіді.
- `channels.nextcloud-talk.markdown.tables`: режим відтворення таблиць Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: обмеження розміру вхідних медіафайлів (МБ).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: дозволяє приватним або внутрішнім хостам Nextcloud проходити захист від SSRF.
- `channels.nextcloud-talk.accounts.<id>`: перевизначення для окремих облікових записів (ті самі ключі); `defaultAccount` вибирає типовий обліковий запис. Змінні середовища `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` застосовуються лише до типового облікового запису.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
