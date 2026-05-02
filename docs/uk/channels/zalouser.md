---
read_when:
    - Налаштування Zalo Personal для OpenClaw
    - Налагодження входу або потоку повідомлень Zalo Personal
summary: Підтримка особистого облікового запису Zalo через нативний zca-js (вхід за QR-кодом), можливості та конфігурація
title: Особистий Zalo
x-i18n:
    generated_at: "2026-05-02T21:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8bd665c47705e0213e1a7c05c3242d6ff745346cdee184da4884e5365807b2d
    source_path: channels/zalouser.md
    workflow: 16
---

Статус: експериментально. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` всередині OpenClaw.

<Warning>
Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Вбудований плагін

Zalo Personal постачається як вбудований плагін у поточних випусках OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить Zalo Personal,
встановіть npm-пакет напряму:

- Встановлення через CLI: `openclaw plugins install @openclaw/zalouser`
- Бета-канал: `openclaw plugins install @openclaw/zalouser@beta`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Докладніше: [Плагіни](/uk/tools/plugin)

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що плагін Zalo Personal доступний.
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - У старіших або власних встановленнях його можна додати вручну за допомогою команд вище.
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
5. Для доступу через DM типовим є pairing; підтвердьте код pairing під час першого контакту.

## Що це таке

- Працює повністю в межах процесу через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді напряму через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання “особистого облікового запису”, коли Zalo Bot API недоступний.

## Іменування

Ідентифікатор каналу — `zalouser`, щоб явно показати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої офіційної інтеграції Zalo API.

## Пошук ID (каталог)

Використовуйте CLI каталогу, щоб знаходити peers/групи та їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст розбивається на фрагменти приблизно по 2000 символів (обмеження клієнта Zalo).
- Streaming заблоковано за замовчуванням.

## Контроль доступу (DM)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (за замовчуванням: `pairing`).

`channels.zalouser.allowFrom` приймає ID або імена користувачів. Під час налаштування імена перетворюються на ID за допомогою внутрішньопроцесного пошуку контактів плагіна.

Підтвердження через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- За замовчуванням: `channels.zalouser.groupPolicy = "open"` (групи дозволено). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли його не задано.
- Обмеження до allowlist:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключами мають бути стабільні ID груп; імена за можливості перетворюються на ID під час запуску)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть запускати бота)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер налаштування може запитувати allowlist для груп.
- Під час запуску OpenClaw перетворює імена груп/користувачів в allowlist на ID і записує зіставлення в журнал.
- Зіставлення allowlist груп за замовчуванням виконується лише за ID. Нерозпізнані імена ігноруються для авторизації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає зіставлення за змінними іменами груп.
- Якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom` для перевірок відправників у групах.
- Перевірки відправників застосовуються як до звичайних групових повідомлень, так і до керівних команд (наприклад, `/new`, `/reset`).

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

### Обмеження групових згадок

- `channels.zalouser.groups.<group>.requireMention` керує тим, чи потрібна згадка для відповідей у групі.
- Порядок розв’язання: точний ID/ім’я групи -> нормалізований slug групи -> `*` -> стандартне значення (`true`).
- Це застосовується як до груп в allowlist, так і до режиму відкритих груп.
- Цитування повідомлення бота вважається неявною згадкою для активації в групі.
- Авторизовані керівні команди (наприклад, `/new`) можуть обходити обмеження згадки.
- Коли групове повідомлення пропускається через вимогу згадки, OpenClaw зберігає його як очікувану історію групи та додає її до наступного обробленого групового повідомлення.
- Ліміт історії групи за замовчуванням дорівнює `messages.groupChat.historyLimit` (резервне значення `50`). Його можна перевизначити для кожного облікового запису через `channels.zalouser.historyLimit`.

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

- OpenClaw надсилає подію введення перед відправленням відповіді (best-effort).
- Дія реакції на повідомлення `react` підтримується для `zalouser` у діях каналу.
  - Використовуйте `remove: true`, щоб прибрати конкретний emoji реакції з повідомлення.
  - Семантика реакцій: [Реакції](/uk/tools/reactions)
- Для вхідних повідомлень, які містять метадані подій, OpenClaw надсилає підтвердження доставлено + переглянуто (best-effort).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Повторний вхід: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Ім’я в allowlist/групі не розв’язалося:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom`/`groups` або точні імена друзів/груп.

**Оновлення зі старого налаштування на основі CLI:**

- Приберіть будь-які старі припущення про зовнішній процес `zca`.
- Канал тепер повністю працює в OpenClaw без зовнішніх CLI-бінарників.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
