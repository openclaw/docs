---
read_when:
    - Ви хочете підключити OpenClaw до IRC-каналів або приватних повідомлень
    - Ви налаштовуєте списки дозволів IRC, групову політику або контроль згадок
summary: Налаштування IRC Plugin, керування доступом і усунення несправностей
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Використовуйте IRC, коли потрібен OpenClaw у класичних каналах (`#room`) і прямих повідомленнях.
Установіть офіційний IRC Plugin, а потім налаштуйте його в `channels.irc`.

## Швидкий старт

1. Установіть Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Увімкніть конфігурацію IRC у `~/.openclaw/openclaw.json`.
3. Задайте щонайменше:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Для координації ботів надавайте перевагу приватному IRC-серверу. Якщо ви свідомо використовуєте публічну IRC-мережу, поширені варіанти включають Libera.Chat, OFTC і Snoonet. Уникайте передбачуваних публічних каналів для зворотного службового трафіку ботів або роїв.

4. Запустіть/перезапустіть gateway:

```bash
openclaw gateway run
```

## Безпечні типові значення

- IRC використовує сирі TCP/TLS-сокети поза маршрутизацією через керований оператором OpenClaw forward proxy. У розгортаннях, де весь вихідний трафік має проходити через цей forward proxy, задайте `channels.irc.enabled=false`, якщо прямий вихідний IRC-трафік явно не схвалено.
- Типове значення `channels.irc.dmPolicy` — `"pairing"`.
- Типове значення `channels.irc.groupPolicy` — `"allowlist"`.
- З `groupPolicy="allowlist"` задайте `channels.irc.groups`, щоб визначити дозволені канали.
- Використовуйте TLS (`channels.irc.tls=true`), якщо ви свідомо не приймаєте передавання відкритим текстом.

## Керування доступом

Для IRC-каналів є два окремі «шлюзи»:

1. **Доступ до каналу** (`groupPolicy` + `groups`): чи бот взагалі приймає повідомлення з каналу.
2. **Доступ відправника** (`groupAllowFrom` / поканальне `groups["#channel"].allowFrom`): кому дозволено запускати бота всередині цього каналу.

Ключі конфігурації:

- Список дозволених для DM (доступ відправника DM): `channels.irc.allowFrom`
- Список дозволених відправників групи (доступ відправника в каналі): `channels.irc.groupAllowFrom`
- Поканальні елементи керування (канал + відправник + правила згадок): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` дозволяє неналаштовані канали (**типово все одно обмежено згадками**)

Записи списку дозволених мають використовувати стабільні ідентичності відправників (`nick!user@host`).
Зіставлення лише за nick є змінним і вмикається тільки коли `channels.irc.dangerouslyAllowNameMatching: true`.

### Поширена пастка: `allowFrom` призначено для DM, а не каналів

Якщо ви бачите журнали на кшталт:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...це означає, що відправника не було дозволено для **групових/канальних** повідомлень. Виправте це одним зі способів:

- задайте `channels.irc.groupAllowFrom` (глобально для всіх каналів), або
- задайте поканальні списки дозволених відправників: `channels.irc.groups["#channel"].allowFrom`

Приклад (дозволити будь-кому в `#tuirc-dev` спілкуватися з ботом):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Запуск відповіді (згадки)

Навіть якщо канал дозволено (через `groupPolicy` + `groups`) і відправника дозволено, OpenClaw типово застосовує **обмеження за згадкою** в групових контекстах.

Це означає, що ви можете бачити журнали на кшталт `drop channel … (missing-mention)`, якщо повідомлення не містить шаблон згадки, який відповідає боту.

Щоб бот відповідав в IRC-каналі **без потреби в згадці**, вимкніть обмеження за згадкою для цього каналу:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Або щоб дозволити **всі** IRC-канали (без поканального списку дозволених) і все одно відповідати без згадок:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Примітка з безпеки (рекомендовано для публічних каналів)

Якщо ви дозволяєте `allowFrom: ["*"]` у публічному каналі, будь-хто може надсилати запити боту.
Щоб зменшити ризик, обмежте інструменти для цього каналу.

### Однакові інструменти для всіх у каналі

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Різні інструменти для кожного відправника (власник отримує більше повноважень)

Використовуйте `toolsBySender`, щоб застосувати суворішу політику до `"*"` і м’якшу до вашого nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Ключі `toolsBySender` мають використовувати `id:` для значень ідентичності IRC-відправника:
  `id:eigen` або `id:eigen!~eigen@174.127.248.171` для сильнішого зіставлення.
- Застарілі ключі без префікса все ще приймаються й зіставляються лише як `id:`.
- Перша політика відправника, що збігається, перемагає; `"*"` є резервним wildcard.

Докладніше про груповий доступ і обмеження за згадкою (та як вони взаємодіють) див.: [/channels/groups](/uk/channels/groups).

## NickServ

Щоб ідентифікуватися через NickServ після підключення:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Необов’язкова одноразова реєстрація під час підключення:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Вимкніть `register` після реєстрації nick, щоб уникнути повторних спроб REGISTER.

## Змінні середовища

Типовий обліковий запис підтримує:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (через кому)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` не можна задавати з workspace `.env`; див. [файли workspace `.env`](/uk/gateway/security).

## Усунення несправностей

- Якщо бот підключається, але ніколи не відповідає в каналах, перевірте `channels.irc.groups` **і** чи обмеження за згадкою відкидає повідомлення (`missing-mention`). Якщо ви хочете, щоб він відповідав без пінгів, задайте `requireMention:false` для каналу.
- Якщо вхід не вдається, перевірте доступність nick і пароль сервера.
- Якщо TLS не працює в користувацькій мережі, перевірте host/port і налаштування сертифіката.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадкою
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
