---
read_when:
    - Налаштування особистого Zalo для OpenClaw
    - Налагодження входу в особистий Zalo або потоку повідомлень
summary: Підтримка особистого облікового запису Zalo через нативний `zca-js` (вхід за QR-кодом), можливості та конфігурація
title: особистий Zalo
x-i18n:
    generated_at: "2026-04-24T18:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Статус: експериментальний. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` всередині OpenClaw.

> **Попередження:** Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.

## Вбудований Plugin

Zalo Personal постачається як вбудований Plugin у поточних релізах OpenClaw, тож звичайні
пакетні збірки не потребують окремого встановлення.

Якщо у вас старіша збірка або кастомне встановлення без Zalo Personal,
встановіть його вручну:

- Встановити через CLI: `openclaw plugins install @openclaw/zalouser`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Деталі: [Plugins](/uk/tools/plugin)

Зовнішній бінарний файл CLI `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Zalo Personal доступний.
   - Поточні пакетні релізи OpenClaw уже містять його вбудованим.
   - У старіших/кастомних встановленнях його можна додати вручну командами вище.
2. Увійдіть (QR, на машині Gateway):
   - `openclaw channels login --channel zalouser`
   - Скануйте QR-код у мобільному застосунку Zalo.
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
5. Доступ через особисті повідомлення за замовчуванням використовує pairing; підтвердьте код pairing при першому контакті.

## Що це таке

- Повністю працює в процесі через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді безпосередньо через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання “особистого облікового запису”, де API Zalo Bot недоступний.

## Найменування

Ідентифікатор каналу — `zalouser`, щоб явно показати, що це автоматизація **особистого облікового запису користувача Zalo** (неофіційно). Ми зберігаємо `zalo` зарезервованим для можливої майбутньої офіційної інтеграції Zalo API.

## Пошук ID (directory)

Використовуйте CLI directory, щоб знаходити контакти/групи та їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст ділиться на частини приблизно по 2000 символів (обмеження клієнта Zalo).
- Streaming за замовчуванням заблоковано.

## Керування доступом (особисті повідомлення)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (типово: `pairing`).

`channels.zalouser.allowFrom` приймає ID користувачів або імена. Під час налаштування імена зіставляються з ID за допомогою внутрішньопроцесного пошуку контактів Plugin.

Підтвердження через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- Типово: `channels.zalouser.groupPolicy = "open"` (групи дозволені). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, якщо його не задано.
- Обмеження через allowlist:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключами мають бути стабільні ID груп; імена, коли можливо, зіставляються з ID під час запуску)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть активувати бота)
- Заборонити всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер налаштування може запитувати allowlist груп.
- Під час запуску OpenClaw зіставляє імена груп/користувачів в allowlist з ID і записує це зіставлення в журнал.
- Зіставлення групового allowlist типово виконується лише за ID. Нерозв’язані імена ігноруються для авторизації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає зіставлення за змінюваними назвами груп.
- Якщо `groupAllowFrom` не задано, під час виконання для перевірок відправників у групах використовується `allowFrom`.
- Перевірки відправника застосовуються як до звичайних групових повідомлень, так і до команд керування (наприклад, `/new`, `/reset`).

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

### Фільтрація згадок у групах

- `channels.zalouser.groups.<group>.requireMention` визначає, чи потрібна згадка для відповідей у групі.
- Порядок визначення: точний id/назва групи -> нормалізований slug групи -> `*` -> типове значення (`true`).
- Це застосовується і до груп з allowlist, і до режиму відкритих груп.
- Цитування повідомлення бота вважається неявною згадкою для активації в групі.
- Авторизовані команди керування (наприклад, `/new`) можуть обходити вимогу згадки.
- Коли групове повідомлення пропускається через вимогу згадки, OpenClaw зберігає його як відкладену історію групи й додає до наступного обробленого повідомлення групи.
- Ліміт історії групи типово дорівнює `messages.groupChat.historyLimit` (резервне значення `50`). Ви можете перевизначити його для облікового запису через `channels.zalouser.historyLimit`.

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

## Набір тексту, реакції та підтвердження доставки

- OpenClaw надсилає подію набору тексту перед відправленням відповіді (best-effort).
- Дія реакції на повідомлення `react` підтримується для `zalouser` у діях каналу.
  - Використовуйте `remove: true`, щоб видалити конкретну реакцію-емодзі з повідомлення.
  - Семантика реакцій: [Reactions](/uk/tools/reactions)
- Для вхідних повідомлень, які містять метадані події, OpenClaw надсилає підтвердження delivered + seen (best-effort).

## Усунення проблем

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Увійдіть знову: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Ім’я в allowlist/назва групи не зіставилися:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom`/`groups` або точні імена друзів/груп.

**Оновилися зі старого налаштування на основі CLI:**

- Приберіть усі старі припущення про зовнішній процес `zca`.
- Тепер канал повністю працює всередині OpenClaw без зовнішніх бінарних файлів CLI.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація в особистих повідомленнях і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та фільтрація згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення захисту
