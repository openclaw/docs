---
read_when:
    - Налаштування Zalo Personal для OpenClaw
    - Налагодження входу в Zalo Personal або потоку повідомлень
summary: Підтримка особистих облікових записів Zalo через нативний zca-js (вхід через QR-код), можливості та налаштування
title: Особистий Zalo
x-i18n:
    generated_at: "2026-05-04T17:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Статус: експериментально. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` всередині OpenClaw.

<Warning>
Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Вбудований Plugin

Zalo Personal постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення, яке виключає Zalo Personal,
встановіть npm-пакет безпосередньо:

- Встановити через CLI: `openclaw plugins install @openclaw/zalouser`
- Зафіксована версія: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Подробиці: [Plugins](/uk/tools/plugin)

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Zalo Personal доступний.
   - Поточні пакетовані випуски OpenClaw вже містять його.
   - Старіші/власні встановлення можуть додати його вручну за допомогою команд вище.
2. Увійдіть (QR, на машині Gateway):
   - `openclaw channels login --channel zalouser`
   - Проскануйте QR-код мобільним застосунком Zalo.
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
5. Доступ до DM за замовчуванням використовує pairing; підтвердьте код pairing під час першого контакту.

## Що це таке

- Працює повністю в процесі через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді безпосередньо через JS API (текст/медіа/посилання).
- Призначено для сценаріїв використання “особистого облікового запису”, коли Zalo Bot API недоступний.

## Іменування

ID каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої офіційної інтеграції Zalo API.

## Пошук ID (каталог)

Використовуйте CLI каталогу, щоб знаходити peers/групи та їхні ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Обмеження

- Вихідний текст ділиться на фрагменти приблизно по 2000 символів (обмеження клієнта Zalo).
- Streaming заблоковано за замовчуванням.

## Контроль доступу (DM)

`channels.zalouser.dmPolicy` підтримує: `pairing | allowlist | open | disabled` (за замовчуванням: `pairing`).

`channels.zalouser.allowFrom` має використовувати стабільні ID користувачів Zalo. Під час інтерактивного налаштування введені імена можна перетворити на ID за допомогою внутрішнього пошуку контактів Plugin.

Якщо сире ім’я лишається в конфігурації, під час запуску воно перетворюється лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`. Без цієї явної згоди runtime-перевірки відправника виконуються лише за ID, а сирі імена ігноруються для авторизації.

Підтвердити через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- За замовчуванням: `channels.zalouser.groupPolicy = "open"` (групи дозволено). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити значення за замовчуванням, коли воно не задане.
- Обмежити списком дозволених:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключі мають бути стабільними ID груп; імена перетворюються на ID під час запуску лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть запускати бота)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер налаштування може запитувати списки дозволених груп.
- Під час запуску OpenClaw перетворює імена груп/користувачів у списках дозволених на ID і журналює зіставлення лише коли ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Зіставлення списку дозволених груп за замовчуванням виконується лише за ID. Нерозв’язані імена ігноруються для автентифікації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який повторно вмикає змінне розпізнавання імен під час запуску та runtime-зіставлення назв груп.
- Якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom` для перевірок відправників у групах.
- Перевірки відправників застосовуються як до звичайних групових повідомлень, так і до керівних команд (наприклад `/new`, `/reset`).

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

- `channels.zalouser.groups.<group>.requireMention` керує тим, чи потребують групові відповіді згадки.
- Порядок розпізнавання: точний ID/назва групи -> нормалізований slug групи -> `*` -> значення за замовчуванням (`true`).
- Це застосовується як до груп зі списку дозволених, так і до режиму відкритих груп.
- Цитування повідомлення бота рахується як неявна згадка для активації в групі.
- Авторизовані керівні команди (наприклад `/new`) можуть обходити обмеження згадок.
- Коли групове повідомлення пропускається, бо потрібна згадка, OpenClaw зберігає його як очікувану історію групи та включає його до наступного обробленого групового повідомлення.
- Ліміт історії груп за замовчуванням бере `messages.groupChat.historyLimit` (резервне значення `50`). Його можна перевизначити для облікового запису через `channels.zalouser.historyLimit`.

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
  - Використовуйте `remove: true`, щоб прибрати конкретний emoji-реакцію з повідомлення.
  - Семантика реакцій: [Реакції](/uk/tools/reactions)
- Для вхідних повідомлень, які містять метадані події, OpenClaw надсилає підтвердження доставлено + переглянуто (best-effort).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Повторний вхід: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Ім’я зі списку дозволених/назва групи не розпізналися:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom` і стабільні ID груп у `groups`. Якщо вам навмисно потрібні точні імена друзів/груп, увімкніть `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Оновлено зі старого налаштування на базі CLI:**

- Приберіть будь-які старі припущення про зовнішній процес `zca`.
- Канал тепер повністю працює в OpenClaw без зовнішніх CLI-бінарників.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM та процес pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення
