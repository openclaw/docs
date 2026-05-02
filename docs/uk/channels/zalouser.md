---
read_when:
    - Налаштування Zalo Personal для OpenClaw
    - Налагодження входу до Zalo Personal або потоку повідомлень
summary: Підтримка особистого облікового запису Zalo через нативний zca-js (вхід за QR-кодом), можливості та конфігурація
title: Особистий Zalo
x-i18n:
    generated_at: "2026-05-02T21:58:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Статус: експериментальний. Ця інтеграція автоматизує **особистий обліковий запис Zalo** через нативний `zca-js` всередині OpenClaw.

<Warning>
Це неофіційна інтеграція, яка може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Вбудований Plugin

Zalo Personal постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або кастомне встановлення, що виключає Zalo Personal,
встановіть npm-пакет напряму:

- Встановити через CLI: `openclaw plugins install @openclaw/zalouser`
- Закріплена версія: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Або з checkout вихідного коду: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Докладніше: [Plugins](/uk/tools/plugin)

Зовнішній двійковий файл CLI `zca`/`openzca` не потрібен.

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Zalo Personal доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його.
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
5. Доступ до DM за замовчуванням використовує pairing; підтвердьте код pairing під час першого контакту.

## Що це таке

- Повністю працює всередині процесу через `zca-js`.
- Використовує нативні слухачі подій для отримання вхідних повідомлень.
- Надсилає відповіді напряму через JS API (текст/медіа/посилання).
- Призначено для сценаріїв із “особистим обліковим записом”, коли Zalo Bot API недоступний.

## Іменування

ID каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для можливої майбутньої офіційної інтеграції Zalo API.

## Пошук ID (каталог)

Використовуйте CLI каталогу, щоб знаходити співрозмовників/групи та їхні ID:

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

`channels.zalouser.allowFrom` приймає ID користувачів або імена. Під час налаштування імена зіставляються з ID за допомогою внутрішнього пошуку контактів Plugin у процесі.

Підтвердьте через:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Доступ до груп (необов’язково)

- За замовчуванням: `channels.zalouser.groupPolicy = "open"` (групи дозволені). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити стандартне значення, коли воно не задане.
- Обмежте до allowlist за допомогою:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ключами мають бути стабільні ID груп; імена зіставляються з ID під час запуску, коли це можливо)
  - `channels.zalouser.groupAllowFrom` (керує тим, які відправники в дозволених групах можуть запускати бота)
- Заблокувати всі групи: `channels.zalouser.groupPolicy = "disabled"`.
- Майстер конфігурації може запитувати allowlist для груп.
- Під час запуску OpenClaw зіставляє імена груп/користувачів у allowlist з ID і записує відповідність у журнал.
- Зіставлення group allowlist за замовчуванням виконується лише за ID. Нерозв’язані імена ігноруються для авторизації, якщо не ввімкнено `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` — це режим сумісності на випадок аварійного відновлення, який знову вмикає зіставлення за змінюваними іменами груп.
- Якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom` для перевірок відправників у групах.
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

### Обмеження згадуванням у групі

- `channels.zalouser.groups.<group>.requireMention` керує тим, чи потрібна згадка для відповідей у групі.
- Порядок розв’язання: точний ID/назва групи -> нормалізований slug групи -> `*` -> значення за замовчуванням (`true`).
- Це застосовується як до груп в allowlist, так і до відкритого групового режиму.
- Цитування повідомлення бота вважається неявною згадкою для активації в групі.
- Авторизовані керівні команди (наприклад, `/new`) можуть обходити обмеження згадуванням.
- Коли групове повідомлення пропускається, бо потрібна згадка, OpenClaw зберігає його як очікувану групову історію та додає до наступного обробленого групового повідомлення.
- Ліміт групової історії за замовчуванням дорівнює `messages.groupChat.historyLimit` (fallback `50`). Його можна перевизначити для кожного облікового запису через `channels.zalouser.historyLimit`.

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

## Набір тексту, реакції та підтвердження доставлення

- OpenClaw надсилає подію набору тексту перед відправленням відповіді (best-effort).
- Дія реакції на повідомлення `react` підтримується для `zalouser` у діях каналу.
  - Використовуйте `remove: true`, щоб видалити конкретний emoji реакції з повідомлення.
  - Семантика реакцій: [Реакції](/uk/tools/reactions)
- Для вхідних повідомлень, що містять метадані події, OpenClaw надсилає підтвердження доставлено + переглянуто (best-effort).

## Усунення несправностей

**Вхід не зберігається:**

- `openclaw channels status --probe`
- Увійдіть повторно: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/назва групи не розв’язалася:**

- Використовуйте числові ID в `allowFrom`/`groupAllowFrom`/`groups` або точні імена друзів/груп.

**Оновлено зі старого налаштування на основі CLI:**

- Видаліть будь-які старі припущення щодо зовнішнього процесу `zca`.
- Канал тепер повністю працює в OpenClaw без зовнішніх двійкових файлів CLI.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження згадуванням
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
