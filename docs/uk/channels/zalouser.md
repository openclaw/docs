---
read_when:
    - Налаштування Zalo Personal для OpenClaw
    - Налагодження входу в Zalo Personal або потоку повідомлень
summary: Підтримка особистого облікового запису Zalo через нативний zca-js (вхід за QR-кодом), можливості та налаштування
title: Особистий Zalo
x-i18n:
    generated_at: "2026-05-11T20:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Статус: експериментально. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` усередині OpenClaw.

<Warning>
Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Вбудований plugin

Zalo Personal постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення, яке виключає Zalo Personal,
встановіть npm-пакет напряму:

- Встановити через CLI: `openclaw plugins install @openclaw/zalouser`
- Закріплена версія: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Докладніше: [Plugins](/uk/tools/plugin)

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що plugin Zalo Personal доступний.
   - Поточні пакетовані релізи OpenClaw вже містять його.
   - Старіші/спеціальні встановлення можуть додати його вручну за допомогою команд вище.
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
5. Доступ до DM типово використовує спарювання; підтвердьте код спарювання під час першого контакту.

## Що це таке

- Працює повністю в одному процесі через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді напряму через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання "особистого облікового запису", коли Zalo Bot API недоступний.

## Іменування

Ідентифікатор каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для можливої майбутньої офіційної інтеграції з Zalo API.

## Пошук ID (каталог)

Використовуйте CLI каталогу, щоб знаходити співрозмовників/групи та їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст ділиться на фрагменти приблизно по 2000 символів (обмеження клієнта Zalo).
- Потокове передавання типово заблоковане.

## Контроль доступу (DM)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (типово: `pairing`).

`channels.zalouser.allowFrom` має використовувати стабільні ID користувачів Zalo. Також може посилатися на статичні групи доступу відправників (`accessGroup:<name>`). Під час інтерактивного налаштування введені імена можна зіставити з ID за допомогою внутрішньопроцесного пошуку контактів plugin.

Якщо необроблене ім’я залишається в конфігурації, під час запуску воно зіставляється лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`. Без цього явного ввімкнення перевірки відправників під час виконання працюють лише за ID, а необроблені імена ігноруються для авторизації.

Підтвердити через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- Типово: `channels.zalouser.groupPolicy = "open"` (групи дозволені). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли воно не задане.
- Обмежте до allowlist за допомогою:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключами мають бути стабільні ID груп; імена зіставляються з ID під час запуску лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть запускати бота; на статичні групи доступу відправників можна посилатися через `accessGroup:<name>`)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер налаштування може запитувати allowlist для груп.
- Під час запуску OpenClaw зіставляє імена груп/користувачів в allowlist з ID і записує зіставлення в журнал лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Зіставлення allowlist груп типово працює лише за ID. Нерозв’язані імена ігноруються для автентифікації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає змінне зіставлення імен під час запуску та зіставлення назв груп під час виконання.
- Якщо `groupAllowFrom` не задано, під час виконання для перевірок відправників у групах використовується fallback до `allowFrom`.
- Перевірки відправника застосовуються як до звичайних групових повідомлень, так і до керувальних команд (наприклад `/new`, `/reset`).

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

### Обмеження згадок у групах

- `channels.zalouser.groups.<group>.requireMention` керує тим, чи потрібна згадка для відповідей у групі.
- Порядок розв’язання: точний id/назва групи -> нормалізований slug групи -> `*` -> типово (`true`).
- Це застосовується як до груп в allowlist, так і до режиму відкритих груп.
- Цитування повідомлення бота вважається неявною згадкою для активації в групі.
- Авторизовані керувальні команди (наприклад `/new`) можуть обходити обмеження згадок.
- Коли групове повідомлення пропускається через вимогу згадки, OpenClaw зберігає його як очікувану історію групи та додає до наступного обробленого групового повідомлення.
- Обмеження історії групи типово дорівнює `messages.groupChat.historyLimit` (fallback `50`). Ви можете перевизначити його для кожного облікового запису через `channels.zalouser.historyLimit`.

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
  - Використовуйте `remove: true`, щоб видалити певний emoji реакції з повідомлення.
  - Семантика реакцій: [Reactions](/uk/tools/reactions)
- Для вхідних повідомлень, які містять метадані подій, OpenClaw надсилає підтвердження доставлено + переглянуто (best-effort).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Повторний вхід: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Ім’я в allowlist/назва групи не розв’язалися:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom` і стабільні ID груп у `groups`. Якщо вам навмисно потрібні точні імена друзів/груп, увімкніть `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Оновлено зі старого налаштування на основі CLI:**

- Приберіть будь-які старі припущення про зовнішній процес `zca`.
- Канал тепер повністю працює в OpenClaw без зовнішніх CLI-бінарників.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і процес спарювання
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
