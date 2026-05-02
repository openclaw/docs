---
read_when:
    - پیکربندی همان فهرست مجاز در چندین کانال پیام‌رسانی
    - قوانین دسترسی فرستنده در پیام خصوصی و گروه
    - بررسی کنترل دسترسی کانال پیام
summary: فهرست‌های مجاز فرستندهٔ قابل استفادهٔ مجدد برای کانال‌های پیام‌رسانی
title: گروه‌های دسترسی
x-i18n:
    generated_at: "2026-05-02T11:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

گروه‌های دسترسی، فهرست‌های نام‌گذاری‌شده‌ای از فرستندگان هستند که یک‌بار تعریف می‌کنید و از allowlistهای کانال با `accessGroup:<name>` به آن‌ها ارجاع می‌دهید.

وقتی از آن‌ها استفاده کنید که همان افراد باید در چند کانال پیام‌رسانی مجاز باشند، یا وقتی یک مجموعه مورد اعتماد باید هم برای پیام‌های مستقیم و هم برای مجوزدهی فرستنده‌های گروهی اعمال شود.

گروه‌های دسترسی به‌تنهایی دسترسی اعطا نمی‌کنند. یک گروه فقط وقتی اهمیت دارد که یک فیلد allowlist به آن ارجاع دهد.

## گروه‌های ایستای فرستندگان پیام

گروه‌های ایستای فرستنده از `type: "message.senders"` استفاده می‌کنند.

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

فهرست‌های اعضا با شناسه کانال پیام‌رسانی کلیدگذاری می‌شوند:

| کلید        | معنی                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | ورودی‌های مشترکی که برای هر کانال پیام‌رسانیِ ارجاع‌دهنده به گروه بررسی می‌شوند. |
| `discord`  | ورودی‌هایی که فقط برای تطبیق allowlist در Discord بررسی می‌شوند.                    |
| `telegram` | ورودی‌هایی که فقط برای تطبیق allowlist در Telegram بررسی می‌شوند.                   |
| `whatsapp` | ورودی‌هایی که فقط برای تطبیق allowlist در WhatsApp بررسی می‌شوند.                   |

ورودی‌ها با قواعد عادی `allowFrom` کانال مقصد تطبیق داده می‌شوند. OpenClaw شناسه‌های فرستنده را بین کانال‌ها ترجمه نمی‌کند. اگر Alice یک شناسه Telegram و یک شناسه Discord دارد، هر دو شناسه را زیر کلیدهای مناسب فهرست کنید.

## ارجاع به گروه‌ها از allowlistها

در هر جایی که مسیر کانال پیام‌رسانی از allowlistهای فرستنده پشتیبانی می‌کند، با `accessGroup:<name>` به یک گروه ارجاع دهید.

نمونه allowlist پیام مستقیم:

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

نمونه allowlist فرستنده گروه:

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

می‌توانید گروه‌ها و ورودی‌های مستقیم را با هم ترکیب کنید:

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

## مسیرهای پشتیبانی‌شده کانال پیام‌رسانی

گروه‌های دسترسی در مسیرهای مشترک مجوزدهی کانال پیام‌رسانی در دسترس هستند، از جمله:

- allowlistهای فرستنده پیام مستقیم مانند `channels.<channel>.allowFrom`
- allowlistهای فرستنده گروه مانند `channels.<channel>.groupAllowFrom`
- allowlistهای فرستنده مختص هر اتاق در کانال که از همان قواعد تطبیق فرستنده استفاده می‌کنند
- مسیرهای مجوزدهی دستور که allowlistهای فرستنده کانال پیام‌رسانی را دوباره استفاده می‌کنند

پشتیبانی کانال به این بستگی دارد که آن کانال از طریق کمک‌کننده‌های مشترک مجوزدهی فرستنده OpenClaw متصل شده باشد یا نه. پشتیبانی بسته‌بندی‌شده فعلی شامل Discord، Google Chat، Nostr، WhatsApp، Zalo و Zalo Personal است. گروه‌های ایستای `message.senders` طوری طراحی شده‌اند که مستقل از کانال باشند، بنابراین کانال‌های پیام‌رسانی جدید باید با استفاده از کمک‌کننده‌های مشترک SDK مربوط به Plugin، به‌جای گسترش سفارشی allowlist، از آن‌ها پشتیبانی کنند.

## مخاطبان کانال Discord

Discord همچنین از یک نوع گروه دسترسی پویا پشتیبانی می‌کند:

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

`discord.channelAudience` یعنی «به فرستندگان پیام مستقیم Discord که در حال حاضر می‌توانند این کانال guild را ببینند، اجازه بده.» OpenClaw فرستنده را در زمان مجوزدهی از طریق Discord resolve می‌کند و قواعد مجوز `ViewChannel` در Discord را اعمال می‌کند.

وقتی از این استفاده کنید که یک کانال Discord از قبل منبع حقیقت برای یک تیم است، مانند `#maintainers` یا `#on-call`.

الزامات و رفتار در حالت خطا:

- بات باید به guild و کانال دسترسی داشته باشد.
- بات به **Server Members Intent** در Discord Developer Portal نیاز دارد.
- وقتی Discord مقدار `Missing Access` برمی‌گرداند، فرستنده نتواند به‌عنوان عضو guild resolve شود، یا کانال متعلق به guild دیگری باشد، گروه دسترسی به‌صورت بسته شکست می‌خورد.

نمونه‌های بیشتر مختص Discord: [کنترل دسترسی Discord](/fa/channels/discord#access-control-and-routing)

## نکات امنیتی

- گروه‌های دسترسی نام‌های مستعار allowlist هستند، نه نقش. آن‌ها به‌تنهایی مالک ایجاد نمی‌کنند، درخواست‌های pairing را تأیید نمی‌کنند، یا مجوز ابزار اعطا نمی‌کنند.
- `dmPolicy: "open"` همچنان به `"*"` در allowlist مؤثر پیام مستقیم نیاز دارد. ارجاع به یک گروه دسترسی همان دسترسی عمومی نیست.
- نام‌های گروهِ مفقود به‌صورت بسته شکست می‌خورند. اگر `allowFrom` شامل `accessGroup:operators` باشد و `accessGroups.operators` وجود نداشته باشد، آن ورودی هیچ‌کس را مجاز نمی‌کند.
- شناسه‌های کانال را پایدار نگه دارید. وقتی کانال از هر دو پشتیبانی می‌کند، شناسه‌های عددی/کاربری را به نام‌های نمایشی ترجیح دهید.

## عیب‌یابی

اگر یک فرستنده باید تطبیق پیدا کند اما مسدود شده است:

1. تأیید کنید فیلد allowlist دقیقاً شامل ارجاع `accessGroup:<name>` باشد.
2. تأیید کنید `accessGroups.<name>.type` درست است.
3. تأیید کنید شناسه فرستنده زیر کلید کانال منطبق، یا زیر `"*"`، فهرست شده است.
4. تأیید کنید ورودی از نحو عادی allowlist همان کانال استفاده می‌کند.
5. برای مخاطبان کانال Discord، تأیید کنید بات می‌تواند کانال guild را ببیند و Server Members Intent فعال است.

پس از ویرایش پیکربندی کنترل دسترسی، `openclaw doctor` را اجرا کنید. این دستور بسیاری از ترکیب‌های نامعتبر allowlist و policy را پیش از زمان اجرا پیدا می‌کند.
