---
read_when:
    - Ви хочете підключити OpenClaw до IRC-каналів або приватних повідомлень
    - Ви налаштовуєте IRC allowlist-и, політику груп або шлюзування за згадками
summary: Налаштування IRC Plugin, керування доступом і усунення несправностей
title: IRC
x-i18n:
    generated_at: "2026-04-23T20:44:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Використовуйте IRC, коли хочете підключити OpenClaw до класичних каналів (`#room`) і приватних повідомлень.
IRC постачається як вбудований Plugin, але налаштовується в основній конфігурації в `channels.irc`.

## Швидкий старт

1. Увімкніть конфігурацію IRC у `~/.openclaw/openclaw.json`.
2. Задайте щонайменше:

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

Для координації ботів бажано використовувати приватний IRC-сервер. Якщо ви свідомо використовуєте публічну IRC-мережу, поширені варіанти включають Libera.Chat, OFTC і Snoonet. Уникайте передбачуваних публічних каналів для бекканального трафіку бота або swarm.

3. Запустіть/перезапустіть Gateway:

```bash
openclaw gateway run
```

## Типові налаштування безпеки

- `channels.irc.dmPolicy` типово має значення `"pairing"`.
- `channels.irc.groupPolicy` типово має значення `"allowlist"`.
- Якщо `groupPolicy="allowlist"`, задайте `channels.irc.groups`, щоб визначити дозволені канали.
- Використовуйте TLS (`channels.irc.tls=true`), якщо тільки ви свідомо не погоджуєтеся на незашифрований транспорт.

## Керування доступом

Для IRC-каналів є два окремі «бар’єри»:

1. **Доступ до каналу** (`groupPolicy` + `groups`): чи приймає бот повідомлення з каналу взагалі.
2. **Доступ відправника** (`groupAllowFrom` / `groups["#channel"].allowFrom` для конкретного каналу): хто має право запускати бота в цьому каналі.

Ключі конфігурації:

- Allowlist DM (доступ відправників у DM): `channels.irc.allowFrom`
- Allowlist відправників у групах (доступ відправників у каналах): `channels.irc.groupAllowFrom`
- Елементи керування для окремого каналу (канал + відправник + правила згадок): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` дозволяє не налаштовані канали (**типово вони все одно проходять шлюзування за згадками**)

Записи allowlist слід задавати через стабільні ідентичності відправників (`nick!user@host`).
Зіставлення лише за nick є змінним і вмикається тільки коли `channels.irc.dangerouslyAllowNameMatching: true`.

### Поширена пастка: `allowFrom` призначений для DM, а не для каналів

Якщо ви бачите такі логи:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…це означає, що відправник не був дозволений для повідомлень **групи/каналу**. Виправити це можна так:

- задати `channels.irc.groupAllowFrom` (глобально для всіх каналів), або
- задати allowlist-и відправників для конкретного каналу: `channels.irc.groups["#channel"].allowFrom`

Приклад (дозволити будь-кому в `#tuirc-dev` звертатися до бота):

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

Навіть якщо канал дозволено (через `groupPolicy` + `groups`) і відправник дозволений, у групових контекстах OpenClaw типово використовує **шлюзування за згадками**.

Це означає, що ви можете бачити логи на кшталт `drop channel … (missing-mention)`, якщо повідомлення не містить шаблон згадки, який збігається з ботом.

Щоб бот відповідав в IRC-каналі **без потреби в згадці**, вимкніть шлюзування за згадками для цього каналу:

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

Або, щоб дозволити **всі** IRC-канали (без allowlist для окремих каналів) і при цьому відповідати без згадок:

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

## Примітка щодо безпеки (рекомендовано для публічних каналів)

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

### Різні інструменти для різних відправників (власник отримує більше можливостей)

Використовуйте `toolsBySender`, щоб застосувати суворішу політику до `"*"` і м’якшу — до вашого nick:

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

- Ключі `toolsBySender` слід задавати з `id:` для значень ідентичності IRC-відправника:
  `id:eigen` або `id:eigen!~eigen@174.127.248.171` для надійнішого зіставлення.
- Застарілі ключі без префікса все ще приймаються й зіставляються лише як `id:`.
- Перемагає перша політика відправника, що збіглася; `"*"` є запасним wildcard-варіантом.

Докладніше про доступ до груп і шлюзування за згадками (та про їхню взаємодію) див.: [/channels/groups](/uk/channels/groups).

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

Після реєстрації nick вимкніть `register`, щоб уникнути повторних спроб REGISTER.

## Змінні середовища

Типовий акаунт підтримує:

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

`IRC_HOST` не можна задавати з workspace `.env`; див. [Файли workspace `.env`](/uk/gateway/security).

## Усунення несправностей

- Якщо бот підключається, але ніколи не відповідає в каналах, перевірте `channels.irc.groups` **і** чи не відкидає повідомлення шлюзування за згадками (`missing-mention`). Якщо ви хочете, щоб він відповідав без пінгів, задайте `requireMention:false` для каналу.
- Якщо вхід не вдається, перевірте доступність nick і пароль сервера.
- Якщо TLS не працює в кастомній мережі, перевірте host/port і налаштування сертифікатів.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюзування за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
