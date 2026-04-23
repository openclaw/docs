---
read_when:
    - Налаштування особистого Zalo для OpenClaw
    - Налагодження входу або потоку повідомлень Zalo Personal
summary: Підтримка особистого облікового запису Zalo через нативний `zca-js` (вхід за QR), можливості та конфігурація
title: Особистий Zalo
x-i18n:
    generated_at: "2026-04-23T20:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Особистий Zalo (неофіційно)

Статус: експериментально. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` всередині OpenClaw.

> **Попередження:** Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.

## Вбудований plugin

Zalo Personal постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без Zalo Personal,
встановіть його вручну:

- Встановлення через CLI: `openclaw plugins install @openclaw/zalouser`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Докладніше: [Plugins](/uk/tools/plugin)

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що plugin Zalo Personal доступний.
   - Поточні пакетні випуски OpenClaw уже містять його.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Увійдіть (QR, на машині Gateway):
   - `openclaw channels login --channel zalouser`
   - Відскануйте QR-код за допомогою мобільного застосунку Zalo.
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
5. Доступ до DM за замовчуванням використовує pairing; схваліть код pairing під час першого контакту.

## Що це таке

- Працює повністю в межах процесу через `zca-js`.
- Використовує нативні прослуховувачі подій для отримання вхідних повідомлень.
- Надсилає відповіді безпосередньо через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання «особистого облікового запису», де API бота Zalo недоступний.

## Найменування

Ідентифікатор каналу — `zalouser`, щоб явно показати, що це автоматизація **особистого облікового запису користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для можливої майбутньої офіційної інтеграції API Zalo.

## Пошук ID (directory)

Використовуйте CLI directory, щоб знаходити peers/groups і їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст розбивається на частини приблизно по 2000 символів (обмеження клієнта Zalo).
- Потокове передавання за замовчуванням заблоковано.

## Керування доступом (DM)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (типово: `pairing`).

`channels.zalouser.allowFrom` приймає ID користувачів або імена. Під час налаштування імена зіставляються з ID за допомогою пошуку контактів plugin у межах процесу.

Схвалення через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- Типово: `channels.zalouser.groupPolicy = "open"` (групи дозволені). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, якщо його не задано.
- Обмеження до allowlist:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключами мають бути стабільні ID груп; імена зіставляються з ID під час запуску, коли це можливо)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть активувати бота)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер налаштування може запитувати group allowlist.
- Під час запуску OpenClaw зіставляє імена груп/користувачів в allowlist з ID і записує це зіставлення в журнал.
- Зіставлення group allowlist за замовчуванням виконується лише за ID. Нерозв’язані імена ігноруються для авторизації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає зіставлення за змінними назвами груп.
- Якщо `groupAllowFrom` не задано, під час виконання для перевірок відправників у групах використовується резервне значення з `allowFrom`.
- Перевірки відправників застосовуються як до звичайних групових повідомлень, так і до керувальних команд (наприклад, `/new`, `/reset`).

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

### Керування згадками в групах

- `channels.zalouser.groups.<group>.requireMention` визначає, чи потребують відповіді в групі згадки.
- Порядок розв’язання: точний id/назва групи -> нормалізований slug групи -> `*` -> типове значення (`true`).
- Це застосовується і до груп з allowlist, і до режиму відкритих груп.
- Цитування повідомлення бота вважається неявною згадкою для активації в групі.
- Авторизовані керувальні команди (наприклад, `/new`) можуть обходити керування згадками.
- Коли групове повідомлення пропускається, бо потрібна згадка, OpenClaw зберігає його як pending-історію групи та включає до наступного обробленого групового повідомлення.
- Ліміт історії груп за замовчуванням дорівнює `messages.groupChat.historyLimit` (резервне значення `50`). Ви можете перевизначити його для кожного облікового запису через `channels.zalouser.historyLimit`.

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

## Введення, реакції та підтвердження доставки

- OpenClaw надсилає подію введення перед надсиланням відповіді (best-effort).
- Дія реакції на повідомлення `react` підтримується для `zalouser` у діях каналу.
  - Використовуйте `remove: true`, щоб видалити конкретну emoji-реакцію з повідомлення.
  - Семантика реакцій: [Реакції](/uk/tools/reactions)
- Для вхідних повідомлень, що містять метадані події, OpenClaw надсилає підтвердження delivered + seen (best-effort).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Повторний вхід: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/назва групи не зіставилися:**

- Використовуйте числові ID у `allowFrom`/`groupAllowFrom`/`groups` або точні імена друга/групи.

**Оновилися зі старого налаштування на основі CLI:**

- Видаліть усі старі припущення про зовнішній процес `zca`.
- Тепер канал повністю працює всередині OpenClaw без зовнішніх CLI-бінарників.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
