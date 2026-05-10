---
read_when:
    - Налаштування однакового списку дозволених елементів для кількох каналів повідомлень
    - Правила надання доступу відправникам в особистих повідомленнях і групах
    - Перевірка контролю доступу до каналу повідомлень
summary: Багаторазові списки дозволених відправників для каналів повідомлень
title: Групи доступу
x-i18n:
    generated_at: "2026-05-10T19:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

Групи доступу — це іменовані списки відправників, які ви визначаєте один раз і на які посилаєтеся з allowlist каналів за допомогою `accessGroup:<name>`.

Використовуйте їх, коли одним і тим самим людям потрібно надати доступ у кількох каналах повідомлень або коли один довірений набір має застосовуватися і до DM, і до авторизації відправників у групах.

Групи доступу самі собою не надають доступ. Група має значення лише тоді, коли поле allowlist посилається на неї.

## Статичні групи відправників повідомлень

Статичні групи відправників використовують `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Списки учасників індексуються за id каналів повідомлень:

| Ключ       | Значення                                                                |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Спільні записи, що перевіряються для кожного каналу повідомлень, який посилається на групу. |
| `discord`  | Записи, що перевіряються лише для зіставлення allowlist Discord.        |
| `telegram` | Записи, що перевіряються лише для зіставлення allowlist Telegram.       |
| `whatsapp` | Записи, що перевіряються лише для зіставлення allowlist WhatsApp.       |

Записи зіставляються за звичайними правилами `allowFrom` цільового каналу. OpenClaw не перетворює id відправників між каналами. Якщо Alice має id Telegram і id Discord, вкажіть обидва id під відповідними ключами.

## Посилання на групи з allowlist

Посилайтеся на групу за допомогою `accessGroup:<name>` всюди, де шлях каналу повідомлень підтримує allowlist відправників.

Приклад allowlist для DM:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Приклад allowlist відправників у групі:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Можна поєднувати групи й прямі записи:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Підтримувані шляхи каналів повідомлень

Групи доступу доступні в спільних шляхах авторизації каналів повідомлень, зокрема:

- allowlist відправників DM, як-от `channels.<channel>.allowFrom`
- allowlist відправників у групах, як-от `channels.<channel>.groupAllowFrom`
- специфічні для каналу allowlist відправників для окремих кімнат, що використовують ті самі правила зіставлення відправників
- шляхи авторизації команд, що повторно використовують allowlist відправників каналів повідомлень

Підтримка каналу залежить від того, чи підключено цей канал через спільні допоміжні засоби авторизації відправників OpenClaw. Поточна вбудована підтримка охоплює Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo і Zalo Personal. Статичні групи `message.senders` спроєктовані як незалежні від каналу, тому нові канали повідомлень мають підтримувати їх, використовуючи спільні допоміжні засоби plugin SDK замість власного розгортання allowlist.

## Діагностика Plugin

Автори Plugin можуть перевіряти структурований стан груп доступу без розгортання його назад у плоский allowlist:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Результат повідомляє про групи, на які є посилання, які збіглися, відсутні, непідтримувані та невдалі. Використовуйте це, коли потрібна діагностика або тести відповідності. Використовуйте `expandAllowFromWithAccessGroups(...)` лише для шляхів сумісності, які все ще очікують плоский масив `allowFrom`.

## Аудиторії каналів Discord

Discord також підтримує динамічний тип групи доступу:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` означає "дозволити відправників DM Discord, які наразі можуть переглядати цей канал гільдії." OpenClaw визначає відправника через Discord під час авторизації та застосовує правила дозволу Discord `ViewChannel`.

Використовуйте це, коли канал Discord уже є джерелом істини для команди, наприклад `#maintainers` або `#on-call`.

Вимоги та поведінка в разі помилки:

- Боту потрібен доступ до гільдії та каналу.
- Боту потрібен Discord Developer Portal **Server Members Intent**.
- Група доступу забороняє доступ у разі помилки, коли Discord повертає `Missing Access`, відправника неможливо визначити як учасника гільдії або канал належить іншій гільдії.

Додаткові приклади, специфічні для Discord: [Керування доступом Discord](/uk/channels/discord#access-control-and-routing)

## Примітки щодо безпеки

- Групи доступу — це псевдоніми allowlist, а не ролі. Вони самі собою не створюють власників, не схвалюють запити на сполучення та не надають дозволи на інструменти.
- `dmPolicy: "open"` все одно потребує `"*"` в ефективному allowlist DM. Посилання на групу доступу не є тим самим, що публічний доступ.
- Відсутні назви груп забороняють доступ. Якщо `allowFrom` містить `accessGroup:operators`, а `accessGroups.operators` відсутній, цей запис нікого не авторизує.
- Зберігайте id каналів стабільними. Надавайте перевагу числовим/користувацьким id замість відображуваних імен, коли канал підтримує обидва варіанти.

## Усунення несправностей

Якщо відправник має збігатися, але його заблоковано:

1. Переконайтеся, що поле allowlist містить точне посилання `accessGroup:<name>`.
2. Переконайтеся, що `accessGroups.<name>.type` правильний.
3. Переконайтеся, що id відправника вказано під відповідним ключем каналу або під `"*"`.
4. Переконайтеся, що запис використовує звичайний синтаксис allowlist цього каналу.
5. Для аудиторій каналів Discord переконайтеся, що бот бачить канал гільдії та має ввімкнений Server Members Intent.

Запустіть `openclaw doctor` після редагування конфігурації керування доступом. Він виявляє багато недійсних поєднань allowlist і політик ще до виконання.
