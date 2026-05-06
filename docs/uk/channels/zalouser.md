---
read_when:
    - Налаштування Zalo Personal для OpenClaw
    - Налагодження входу в Zalo Personal або потоку повідомлень
summary: Підтримка особистого облікового запису Zalo через нативний zca-js (вхід за QR-кодом), можливості та конфігурація
title: Особистий Zalo
x-i18n:
    generated_at: "2026-05-06T16:00:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Статус: експериментально. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` усередині OpenClaw.

<Warning>
Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Вбудований Plugin

Zalo Personal постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або кастомне встановлення, яке не включає Zalo Personal,
установіть npm-пакет напряму:

- Установлення через CLI: `openclaw plugins install @openclaw/zalouser`
- Закріплена версія: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Докладніше: [Plugins](/uk/tools/plugin)

Зовнішній бінарний файл CLI `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Zalo Personal доступний.
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - Старіші/кастомні встановлення можуть додати його вручну за допомогою команд вище.
2. Увійдіть (QR, на машині Gateway):
   - `openclaw channels login --channel zalouser`
   - Відскануйте QR-код мобільним застосунком Zalo.
3. Увімкніть канал:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Перезапустіть Gateway (або завершіть налаштування).
5. Доступ до DM за замовчуванням використовує сполучення; підтвердьте код сполучення під час першого контакту.

## Що це таке

- Працює повністю всередині процесу через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді напряму через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання "особистого облікового запису", коли Zalo Bot API недоступний.

## Іменування

ID каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої офіційної інтеграції Zalo API.

## Пошук ID (каталог)

Використовуйте CLI каталогу, щоб знаходити співрозмовників/групи та їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст розбивається на фрагменти приблизно по 2000 символів (обмеження клієнта Zalo).
- Потокове передавання за замовчуванням заблоковане.

## Контроль доступу (DM)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (типово: `pairing`).

`channels.zalouser.allowFrom` має використовувати стабільні ID користувачів Zalo. Під час інтерактивного налаштування введені імена можна зіставити з ID за допомогою внутрішнього пошуку контактів Plugin.

Якщо необроблене ім'я залишається в конфігурації, під час запуску воно зіставляється лише тоді, коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`. Без цієї явної згоди перевірки відправника під час виконання працюють лише за ID, а необроблені імена ігноруються для авторизації.

Підтвердьте через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов'язково)

- Типово: `channels.zalouser.groupPolicy = "open"` (групи дозволені). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли його не задано.
- Обмежте до allowlist за допомогою:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключі мають бути стабільними ID груп; імена зіставляються з ID під час запуску лише тоді, коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть запускати бота)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер конфігурації може запитати allowlist для груп.
- Під час запуску OpenClaw зіставляє імена груп/користувачів в allowlist з ID і журналює відповідність лише тоді, коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Зіставлення allowlist груп за замовчуванням працює лише за ID. Нерозв'язані імена ігноруються для автентифікації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає змінне зіставлення імен під час запуску та зіставлення імен груп під час виконання.
- Якщо `groupAllowFrom` не задано, під час виконання перевірки відправників у групах повертаються до `allowFrom`.
- Перевірки відправника застосовуються як до звичайних групових повідомлень, так і до керівних команд (наприклад, `/new`, `/reset`).

Приклад:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Обмеження за згадкою в групі

- `channels.zalouser.groups.<group>.requireMention` керує тим, чи потрібна згадка для відповідей у групі.
- Порядок розв'язання: exact group id/name -> normalized group slug -> `*` -> типово (`true`).
- Це застосовується як до груп з allowlist, так і до відкритого режиму груп.
- Цитування повідомлення бота рахується як неявна згадка для активації в групі.
- Авторизовані керівні команди (наприклад, `/new`) можуть обходити обмеження за згадкою.
- Коли групове повідомлення пропускається через те, що потрібна згадка, OpenClaw зберігає його як очікувану групову історію та включає його в наступне оброблене групове повідомлення.
- Ліміт історії групи за замовчуванням дорівнює `messages.groupChat.historyLimit` (резервне значення `50`). Ви можете перевизначити його для кожного облікового запису через `channels.zalouser.historyLimit`.

Приклад:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Кілька облікових записів

Облікові записи зіставляються з профілями `zalouser` у стані OpenClaw. Приклад:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Індикатор набору, реакції та підтвердження доставки

- OpenClaw надсилає подію набору тексту перед відправленням відповіді (за можливості).
- Дія реакції на повідомлення `react` підтримується для `zalouser` у діях каналу.
  - Використовуйте `remove: true`, щоб видалити конкретну емодзі-реакцію з повідомлення.
  - Семантика реакцій: [Реакції](/uk/tools/reactions)
- Для вхідних повідомлень, що містять метадані події, OpenClaw надсилає підтвердження delivered + seen (за можливості).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Повторний вхід: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Ім'я в allowlist/групі не зіставилося:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom` і стабільні ID груп у `groups`. Якщо вам навмисно потрібні точні імена друзів/груп, увімкніть `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Оновлено зі старого налаштування на базі CLI:**

- Видаліть будь-які старі припущення про зовнішній процес `zca`.
- Канал тепер повністю працює в OpenClaw без зовнішніх бінарних файлів CLI.

## Пов'язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення
