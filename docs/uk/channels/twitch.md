---
read_when:
    - Налаштування інтеграції чату Twitch з OpenClaw
sidebarTitle: Twitch
summary: 'Чат-бот Twitch: встановлення, облікові дані, контроль доступу, оновлення токена'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T13:02:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Підтримка чату Twitch через інтерфейс чату Twitch (IRC) за допомогою клієнта Twurple. OpenClaw входить у систему як обліковий запис бота Twitch, приєднується до одного каналу для кожного налаштованого облікового запису та відповідає в цьому каналі.

## Встановлення

Twitch постачається як офіційний Plugin і не входить до базового встановлення.

<Tabs>
  <Tab title="реєстр npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Локальна робоча копія">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` реєструє та вмикає Plugin. Вибір Twitch під час `openclaw onboard` або `openclaw channels add` встановлює його за потреби. Використовуйте назву пакета без версії, щоб отримувати поточний випуск; фіксуйте точну версію лише для відтворюваних установлень. Потрібна версія OpenClaw 2026.4.10 або новіша.

Докладніше: [Плагіни](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Установіть Plugin">
    Див. розділ [Встановлення](#install) вище.
  </Step>
  <Step title="Створіть обліковий запис бота Twitch">
    Створіть окремий обліковий запис Twitch для бота (або використайте наявний обліковий запис).
  </Step>
  <Step title="Створіть облікові дані">
    Скористайтеся [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Виберіть **Bot Token**
    - Переконайтеся, що області доступу `chat:read` і `chat:write` вибрано
    - Скопіюйте **Client ID** та **Access Token**

  </Step>
  <Step title="Знайдіть свій ідентифікатор користувача Twitch">
    Скористайтеся [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), щоб перетворити ім’я користувача на ідентифікатор користувача Twitch.
  </Step>
  <Step title="Налаштуйте токен">
    - Змінна середовища: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише для типового облікового запису)
    - Або конфігурація: `channels.twitch.accessToken`

    Якщо задано обидва значення, конфігурація має пріоритет (змінна середовища використовується лише як резервний варіант для типового облікового запису).

  </Step>
  <Step title="Запустіть Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб неавторизовані користувачі не могли активувати бота. Типове значення `requireMention` — `true`.
</Warning>

Мінімальна конфігурація:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Обліковий запис бота в Twitch (виконує автентифікацію)
      accessToken: "oauth:abc123...", // Токен доступу OAuth (або використовуйте змінну середовища OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Ідентифікатор клієнта з Token Generator
      channel: "yourchannel", // До чату якого каналу Twitch приєднатися (обов’язково)
      allowFrom: ["123456789"], // (рекомендовано) Лише ваш ідентифікатор користувача Twitch
    },
  },
}
```

## Що це таке

- Канал Twitch, яким керує Gateway.
- Детермінізована маршрутизація: відповіді завжди надсилаються назад у канал Twitch, з якого надійшло повідомлення.
- Кожен приєднаний канал зіставляється з ізольованим ключем групового сеансу `agent:<agentId>:twitch:group:<channel>`.
- `username` — обліковий запис бота (який автентифікується), а `channel` — чат-кімната, до якої потрібно приєднатися. Один запис облікового запису приєднується рівно до одного каналу.
- Токени працюють із префіксом `oauth:` або без нього; OpenClaw нормалізує обидва варіанти (майстер налаштування очікує формат із `oauth:`).

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можуть оновлюватися OpenClaw — створіть їх повторно після завершення строку дії (вони діють кілька годин; реєстрація застосунку не потрібна).

Для автоматичного оновлення створіть власний застосунок у [Twitch Developer Console](https://dev.twitch.tv/console) і додайте:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Якщо задано обидва параметри, Plugin використовує постачальник автентифікації з оновленням, який поновлює токени до завершення строку їхньої дії та записує кожне оновлення в журнал. Без `refreshToken` він записує `token refresh disabled (no refresh token)`; без `clientSecret` він повертається до статичного токена (без оновлення).

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` з окремими обліковими даними для кожного облікового запису. Спільний шаблон описано в розділі [Конфігурація](/uk/gateway/configuration).

Приклад (один обліковий запис бота у двох каналах):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Для кожного запису облікового запису потрібен власний `accessToken` (змінна середовища стосується лише типового облікового запису). Обліковий запис приєднується рівно до одного каналу, тому для приєднання до двох каналів потрібні два облікові записи. `channels.twitch.defaultAccount` визначає, який обліковий запис є типовим.
</Note>

## Контроль доступу

`allowFrom` — це суворий список дозволених ідентифікаторів користувачів Twitch. Якщо його задано, `allowedRoles` ігнорується; не задавайте `allowFrom`, щоб натомість використовувати доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Список дозволених ідентифікаторів користувачів (найбезпечніше)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="На основі ролей">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Вимкнення вимоги @згадки">
    Типове значення `requireMention` — `true`. Щоб відповідати на всі дозволені повідомлення:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

<Note>
**Чому ідентифікатори користувачів?** Імена користувачів можна змінювати, що дає змогу видавати себе за іншу особу. Ідентифікатори користувачів постійні.

Знайдіть свій за допомогою [перетворювача імені користувача на ідентифікатор](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Усунення несправностей

Спочатку виконайте діагностичні команди:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Бот не відповідає на повідомлення">
    - **Перевірте контроль доступу:** переконайтеся, що ваш ідентифікатор користувача є в `allowFrom`, або для перевірки тимчасово видаліть `allowFrom` і задайте `allowedRoles: ["all"]`.
    - **Перевірте обмеження за згадкою:** коли `requireMention: true` (типове значення), повідомлення мають містити @згадку імені користувача бота.
    - **Перевірте, чи бот перебуває в каналі:** бот приєднується лише до каналу, зазначеного в `channel`.

  </Accordion>
  <Accordion title="Проблеми з токеном">
    Помилка «Не вдалося підключитися» або помилки автентифікації:

    - Переконайтеся, що `accessToken` містить значення токена доступу OAuth (префікс `oauth:` необов’язковий)
    - Перевірте, чи токен має області доступу `chat:read` і `chat:write`
    - Якщо використовується оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

  </Accordion>
  <Accordion title="Оновлення токена не працює">
    Перевірте журнал на наявність подій оновлення:

    ```text
    Використовується джерело токена зі змінної середовища для mybot
    Токен доступу для користувача 123456 оновлено (завершення строку дії через 14400 с)
    ```

    Якщо ви бачите `token refresh disabled (no refresh token)`:

    - Переконайтеся, що `clientSecret` надано
    - Переконайтеся, що `refreshToken` надано

  </Accordion>
</AccordionGroup>

## Конфігурація

### Конфігурація облікового запису

<ParamField path="username" type="string" required>
  Ім’я користувача бота (обліковий запис, який автентифікується).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Токен доступу OAuth з областями доступу `chat:read` і `chat:write` (конфігурація або змінна середовища для типового облікового запису).
</ParamField>
<ParamField path="clientId" type="string" required>
  Ідентифікатор клієнта Twitch (із Token Generator або вашого застосунку). Необов’язковий у схемі, але потрібний для підключення.
</ParamField>
<ParamField path="channel" type="string" required>
  Канал, до якого потрібно приєднатися.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Увімкнути цей обліковий запис.
</ParamField>
<ParamField path="clientSecret" type="string">
  Необов’язково: для автоматичного оновлення токена.
</ParamField>
<ParamField path="refreshToken" type="string">
  Необов’язково: для автоматичного оновлення токена.
</ParamField>
<ParamField path="expiresIn" type="number">
  Строк дії токена в секундах (відстеження оновлення).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Позначка часу отримання токена (відстеження оновлення).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Список дозволених ідентифікаторів користувачів. Якщо його задано, ролі ігноруються.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Контроль доступу на основі ролей.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Вимагати @згадку для активації бота.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Перевизначення префікса вихідної відповіді для цього облікового запису.
</ParamField>

### Параметри постачальника

- `channels.twitch.enabled` — увімкнути або вимкнути запуск каналу
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` — спрощена конфігурація одного облікового запису (неявний обліковий запис `default`; має пріоритет над `accounts.default`)
- `channels.twitch.accounts.<accountName>` — конфігурація кількох облікових записів (усі наведені вище поля облікового запису)
- `channels.twitch.defaultAccount` — назва облікового запису, який є типовим
- `channels.twitch.markdown.tables` — режим відтворення таблиць Markdown (`off` | `bullets` | `code` | `block`)

Повний приклад:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Дії інструмента

Агент може надсилати повідомлення Twitch через дію `send` інструмента повідомлень:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` є необов’язковим і за замовчуванням використовує налаштований для облікового запису `channel`.

## Безпека та експлуатація

- **Поводьтеся з токенами як із паролями** — ніколи не додавайте токени до git.
- **Використовуйте автоматичне оновлення токенів** для ботів, що працюють тривалий час.
- **Використовуйте списки дозволених ідентифікаторів користувачів** замість імен користувачів для контролю доступу.
- **Відстежуйте журнали** щодо подій оновлення токенів і стану підключення.
- **Мінімізуйте області доступу токенів** — запитуйте лише `chat:read` і `chat:write`.
- **Якщо виникли труднощі**: перезапустіть Gateway, попередньо переконавшись, що жоден інший процес не володіє сеансом.

## Обмеження

- **500 символів** на повідомлення; довші відповіді розбиваються на частини за межами слів.
- Markdown видаляється перед надсиланням (чат Twitch використовує звичайний текст; переноси рядків перетворюються на пробіли).
- OpenClaw не додає власного обмеження частоти запитів; клієнт чату Twurple обробляє обмеження частоти Twitch.

## Пов’язані розділи

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження за згадкою
- [Сполучення](/uk/channels/pairing) — автентифікація в особистих повідомленнях і процес сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
