---
read_when:
    - Робота над функціями Zalo або Webhook-ами
summary: Статус підтримки, можливості та конфігурація бота Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-24T18:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Статус: експериментальний. Підтримуються приватні повідомлення. Наведений нижче розділ [Можливості](#capabilities) відображає поточну поведінку ботів Marketplace.

## Вбудований Plugin

Zalo постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не включає Zalo, встановіть його
вручну:

- Встановити через CLI: `openclaw plugins install @openclaw/zalo`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalo-plugin`
- Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Zalo доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його у складі.
   - У старіших/власних встановленнях його можна додати вручну наведеними вище командами.
2. Встановіть токен:
   - Env: `ZALO_BOT_TOKEN=...`
   - Або config: `channels.zalo.accounts.default.botToken: "..."`.
3. Перезапустіть Gateway (або завершіть налаштування).
4. Доступ до приватних повідомлень за замовчуванням використовує pairing; підтвердьте код pairing при першому контакті.

Мінімальна конфігурація:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Що це таке

Zalo — це месенджер, орієнтований на В’єтнам; його Bot API дозволяє Gateway запускати бота для розмов 1:1.
Він добре підходить для підтримки або сповіщень, коли вам потрібна детермінована маршрутизація назад у Zalo.

Ця сторінка відображає поточну поведінку OpenClaw для **ботів Zalo Bot Creator / Marketplace**.
**боти Zalo Official Account (OA)** належать до іншої продуктової поверхні Zalo і можуть поводитися інакше.

- Канал Zalo Bot API, яким володіє Gateway.
- Детермінована маршрутизація: відповіді повертаються в Zalo; модель ніколи не обирає канали.
- Приватні повідомлення використовують основну сесію агента.
- Наведений нижче розділ [Можливості](#capabilities) показує поточну підтримку ботів Marketplace.

## Налаштування (швидкий шлях)

### 1) Створіть токен бота (Zalo Bot Platform)

1. Перейдіть на [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) і увійдіть.
2. Створіть нового бота та налаштуйте його параметри.
3. Скопіюйте повний токен бота (зазвичай `numeric_id:secret`). Для ботів Marketplace придатний токен виконання може з’явитися у вітальному повідомленні бота після створення.

### 2) Налаштуйте токен (env або config)

Приклад:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Якщо пізніше ви перейдете на продуктову поверхню Zalo для ботів, де доступні групи, ви зможете явно додати специфічну для груп конфігурацію, наприклад `groupPolicy` і `groupAllowFrom`. Для поточної поведінки ботів Marketplace див. [Можливості](#capabilities).

Опція env: `ZALO_BOT_TOKEN=...` (працює лише для облікового запису за замовчуванням).

Підтримка кількох облікових записів: використовуйте `channels.zalo.accounts` із токенами для кожного облікового запису та необов’язковим `name`.

3. Перезапустіть Gateway. Zalo запускається, коли токен визначено (env або config).
4. Доступ до приватних повідомлень за замовчуванням використовує pairing. Підтвердьте код, коли вперше звертаєтеся до бота.

## Як це працює (поведінка)

- Вхідні повідомлення нормалізуються у спільний channel envelope із заповнювачами медіа.
- Відповіді завжди маршрутизуються назад у той самий чат Zalo.
- За замовчуванням використовується long-polling; режим Webhook доступний через `channels.zalo.webhookUrl`.

## Обмеження

- Вихідний текст розбивається на частини по 2000 символів (обмеження API Zalo).
- Завантаження/вивантаження медіа обмежені `channels.zalo.mediaMaxMb` (за замовчуванням 5).
- Streaming за замовчуванням заблоковано, оскільки обмеження в 2000 символів робить його менш корисним.

## Контроль доступу (приватні повідомлення)

### Доступ до приватних повідомлень

- За замовчуванням: `channels.zalo.dmPolicy = "pairing"`. Невідомі відправники отримують код pairing; повідомлення ігноруються до схвалення (коди дійсні 1 годину).
- Схвалення через:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing — це обмін токенами за замовчуванням. Докладніше: [Pairing](/uk/channels/pairing)
- `channels.zalo.allowFrom` приймає числові ID користувачів (пошук за username недоступний).

## Контроль доступу (групи)

Для **Zalo Bot Creator / ботів Marketplace** підтримка груп на практиці була недоступна, оскільки бота взагалі не можна було додати до групи.

Це означає, що наведені нижче ключі конфігурації, пов’язані з групами, існують у схемі, але не були придатними для використання з ботами Marketplace:

- `channels.zalo.groupPolicy` керує обробкою вхідних повідомлень із груп: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` обмежує, які ID відправників можуть активувати бота в групах.
- Якщо `groupAllowFrom` не задано, Zalo використовує `allowFrom` як резервний варіант для перевірок відправника.
- Примітка щодо runtime: якщо `channels.zalo` повністю відсутній, runtime все одно для безпеки використовує резервне значення `groupPolicy="allowlist"`.

Значення group policy (коли на вашій продуктовій поверхні бота доступний доступ до груп):

- `groupPolicy: "disabled"` — блокує всі повідомлення групи.
- `groupPolicy: "open"` — дозволяє будь-якому учаснику групи (із gating за згадкою).
- `groupPolicy: "allowlist"` — fail-closed за замовчуванням; приймаються лише дозволені відправники.

Якщо ви використовуєте іншу продуктову поверхню ботів Zalo й підтвердили, що групи працюють, задокументуйте це окремо, а не припускайте, що вона збігається з потоком ботів Marketplace.

## Long-polling чи webhook

- За замовчуванням: long-polling (публічний URL не потрібен).
- Режим Webhook: задайте `channels.zalo.webhookUrl` і `channels.zalo.webhookSecret`.
  - Секрет Webhook має містити 8–256 символів.
  - URL Webhook має використовувати HTTPS.
  - Zalo надсилає події із заголовком `X-Bot-Api-Secret-Token` для верифікації.
  - HTTP Gateway обробляє запити Webhook на шляху `channels.zalo.webhookPath` (за замовчуванням це шлях URL Webhook).
  - Запити мають використовувати `Content-Type: application/json` (або media types `+json`).
  - Дублікати подій (`event_name + message_id`) ігноруються протягом короткого вікна захисту від повторів.
  - Піковий трафік обмежується за частотою для кожного path/source і може повертати HTTP 429.

**Примітка:** `getUpdates` (polling) і webhook є взаємовиключними згідно з документацією API Zalo.

## Підтримувані типи повідомлень

Щоб швидко побачити стан підтримки, див. [Можливості](#capabilities). Наведені нижче примітки додають подробиці там, де поведінка потребує додаткового контексту.

- **Текстові повідомлення**: повна підтримка з розбиттям на частини по 2000 символів.
- **Звичайні URL у тексті**: поводяться як звичайний текстовий ввід.
- **Попередній перегляд посилань / розширені картки посилань**: див. статус ботів Marketplace у [Можливості](#capabilities); вони ненадійно викликали відповідь.
- **Повідомлення із зображеннями**: див. статус ботів Marketplace у [Можливості](#capabilities); обробка вхідних зображень була ненадійною (індикатор набору без фінальної відповіді).
- **Стікери**: див. статус ботів Marketplace у [Можливості](#capabilities).
- **Голосові нотатки / аудіофайли / відео / загальні вкладення файлів**: див. статус ботів Marketplace у [Можливості](#capabilities).
- **Непідтримувані типи**: логуються (наприклад, повідомлення від захищених користувачів).

## Можливості

Ця таблиця підсумовує поточну поведінку **Zalo Bot Creator / ботів Marketplace** в OpenClaw.

| Feature                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Direct messages             | ✅ Підтримується                        |
| Groups                      | ❌ Недоступно для ботів Marketplace     |
| Media (inbound images)      | ⚠️ Обмежено / перевірте у своєму середовищі |
| Media (outbound images)     | ⚠️ Повторно не перевірялося для ботів Marketplace |
| Plain URLs in text          | ✅ Підтримується                        |
| Link previews               | ⚠️ Ненадійно для ботів Marketplace      |
| Reactions                   | ❌ Не підтримується                     |
| Stickers                    | ⚠️ Немає відповіді агента для ботів Marketplace |
| Voice notes / audio / video | ⚠️ Немає відповіді агента для ботів Marketplace |
| File attachments            | ⚠️ Немає відповіді агента для ботів Marketplace |
| Threads                     | ❌ Не підтримується                     |
| Polls                       | ❌ Не підтримується                     |
| Native commands             | ❌ Не підтримується                     |
| Streaming                   | ⚠️ Заблоковано (обмеження 2000 символів) |

## Цілі доставки (CLI/Cron)

- Використовуйте chat id як ціль.
- Приклад: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Усунення несправностей

**Бот не відповідає:**

- Перевірте, чи токен дійсний: `openclaw channels status --probe`
- Переконайтеся, що відправника схвалено (`pairing` або `allowFrom`)
- Перевірте логи Gateway: `openclaw logs --follow`

**Webhook не отримує події:**

- Переконайтеся, що URL Webhook використовує HTTPS
- Перевірте, що секретний токен має 8–256 символів
- Підтвердьте, що HTTP endpoint Gateway доступний за налаштованим шляхом
- Перевірте, що polling `getUpdates` не запущено (вони взаємовиключні)

## Довідник конфігурації (Zalo)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Плоскі ключі верхнього рівня (`channels.zalo.botToken`, `channels.zalo.dmPolicy` та подібні) — це застаріле скорочення для одного облікового запису. Для нових конфігурацій віддавайте перевагу `channels.zalo.accounts.<id>.*`. Обидві форми все ще задокументовані тут, оскільки вони існують у схемі.

Параметри провайдера:

- `channels.zalo.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.zalo.botToken`: токен бота з Zalo Bot Platform.
- `channels.zalo.tokenFile`: прочитати токен зі шляху до звичайного файла. Symbolic links відхиляються.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.zalo.allowFrom`: allowlist для приватних повідомлень (ID користувачів). Для `open` потрібне `"*"`. Майстер налаштування попросить ввести числові ID.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist). Присутній у config; див. [Можливості](#capabilities) і [Контроль доступу (групи)](#access-control-groups) для поточної поведінки ботів Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist відправників групи (ID користувачів). Якщо не задано, використовується `allowFrom`.
- `channels.zalo.mediaMaxMb`: обмеження вхідних/вихідних медіа (МБ, за замовчуванням 5).
- `channels.zalo.webhookUrl`: увімкнути режим Webhook (потрібен HTTPS).
- `channels.zalo.webhookSecret`: секрет Webhook (8–256 символів).
- `channels.zalo.webhookPath`: шлях Webhook на HTTP-сервері Gateway.
- `channels.zalo.proxy`: URL проксі для API-запитів.

Параметри кількох облікових записів:

- `channels.zalo.accounts.<id>.botToken`: токен для кожного облікового запису.
- `channels.zalo.accounts.<id>.tokenFile`: звичайний файл токена для кожного облікового запису. Symbolic links відхиляються.
- `channels.zalo.accounts.<id>.name`: відображуване ім’я.
- `channels.zalo.accounts.<id>.enabled`: увімкнути/вимкнути обліковий запис.
- `channels.zalo.accounts.<id>.dmPolicy`: policy приватних повідомлень для кожного облікового запису.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist для кожного облікового запису.
- `channels.zalo.accounts.<id>.groupPolicy`: group policy для кожного облікового запису. Присутній у config; див. [Можливості](#capabilities) і [Контроль доступу (групи)](#access-control-groups) для поточної поведінки ботів Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist відправників групи для кожного облікового запису.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook для кожного облікового запису.
- `channels.zalo.accounts.<id>.webhookSecret`: секрет Webhook для кожного облікового запису.
- `channels.zalo.accounts.<id>.webhookPath`: шлях Webhook для кожного облікового запису.
- `channels.zalo.accounts.<id>.proxy`: URL проксі для кожного облікового запису.

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та gating за згадкою
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
