---
read_when:
    - پیکربندی همان فهرست مجاز در چندین کانال پیام‌رسانی
    - قواعد دسترسی فرستنده در پیام‌های خصوصی و گروه‌ها برای اشتراک‌گذاری
    - بازبینی کنترل دسترسی کانال پیام‌رسانی
summary: فهرست‌های مجازِ فرستندگانِ قابل استفادهٔ مجدد برای کانال‌های پیام
title: گروه‌های دسترسی
x-i18n:
    generated_at: "2026-05-10T19:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

گروه‌های دسترسی، فهرست‌های نام‌گذاری‌شده‌ای از فرستندگان هستند که یک‌بار تعریف می‌کنید و از allowlistهای کانال با `accessGroup:<name>` به آن‌ها ارجاع می‌دهید.

وقتی همان افراد باید در چند کانال پیام مجاز باشند، یا وقتی یک مجموعهٔ مورد اعتماد باید هم برای پیام‌های مستقیم و هم برای مجوزدهی فرستندهٔ گروه اعمال شود، از آن‌ها استفاده کنید.

گروه‌های دسترسی به‌تنهایی دسترسی اعطا نمی‌کنند. یک گروه فقط زمانی اهمیت دارد که یک فیلد allowlist به آن ارجاع دهد.

## گروه‌های ثابت فرستندهٔ پیام

گروه‌های ثابت فرستنده از `type: "message.senders"` استفاده می‌کنند.

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

فهرست‌های عضو با شناسهٔ کانال پیام کلیدگذاری می‌شوند:

| کلید       | معنی                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | ورودی‌های مشترکی که برای هر کانال پیام ارجاع‌دهنده به گروه بررسی می‌شوند. |
| `discord`  | ورودی‌هایی که فقط برای تطبیق allowlist در Discord بررسی می‌شوند.        |
| `telegram` | ورودی‌هایی که فقط برای تطبیق allowlist در Telegram بررسی می‌شوند.       |
| `whatsapp` | ورودی‌هایی که فقط برای تطبیق allowlist در WhatsApp بررسی می‌شوند.       |

ورودی‌ها با قواعد عادی `allowFrom` کانال مقصد تطبیق داده می‌شوند. OpenClaw شناسه‌های فرستنده را بین کانال‌ها ترجمه نمی‌کند. اگر Alice یک شناسهٔ Telegram و یک شناسهٔ Discord دارد، هر دو شناسه را زیر کلیدهای مناسب فهرست کنید.

## ارجاع به گروه‌ها از allowlistها

هر جا که مسیر کانال پیام از allowlistهای فرستنده پشتیبانی می‌کند، با `accessGroup:<name>` به یک گروه ارجاع دهید.

نمونهٔ allowlist برای پیام مستقیم:

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

نمونهٔ allowlist برای فرستندهٔ گروه:

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

می‌توانید گروه‌ها و ورودی‌های مستقیم را ترکیب کنید:

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

## مسیرهای پشتیبانی‌شدهٔ کانال پیام

گروه‌های دسترسی در مسیرهای مشترک مجوزدهی کانال پیام در دسترس هستند، از جمله:

- allowlistهای فرستندهٔ پیام مستقیم مانند `channels.<channel>.allowFrom`
- allowlistهای فرستندهٔ گروه مانند `channels.<channel>.groupAllowFrom`
- allowlistهای فرستندهٔ هر اتاق که مخصوص کانال هستند و از همان قواعد تطبیق فرستنده استفاده می‌کنند
- مسیرهای مجوزدهی فرمان که از allowlistهای فرستندهٔ کانال پیام دوباره استفاده می‌کنند

پشتیبانی کانال به این بستگی دارد که آن کانال از طریق کمک‌کننده‌های مشترک مجوزدهی فرستندهٔ OpenClaw متصل شده باشد. پشتیبانی فعلیِ همراه شامل Discord، Feishu، Google Chat، iMessage، LINE، Mattermost، Microsoft Teams، Nextcloud Talk، Nostr، QQBot، Signal، WhatsApp، Zalo، و Zalo Personal است. گروه‌های ثابت `message.senders` طوری طراحی شده‌اند که وابسته به کانال نباشند، بنابراین کانال‌های پیام جدید باید با استفاده از کمک‌کننده‌های مشترک SDK مربوط به plugin، به‌جای گسترش سفارشی allowlist، از آن‌ها پشتیبانی کنند.

## عیب‌یابی Plugin

نویسندگان Plugin می‌توانند وضعیت ساخت‌یافتهٔ گروه دسترسی را بدون گسترش دوبارهٔ آن به یک allowlist تخت بررسی کنند:

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

نتیجه، گروه‌های ارجاع‌شده، تطبیق‌یافته، مفقود، پشتیبانی‌نشده، و ناموفق را گزارش می‌کند. وقتی به عیب‌یابی یا آزمون‌های انطباق نیاز دارید از این استفاده کنید. از `expandAllowFromWithAccessGroups(...)` فقط برای مسیرهای سازگاری استفاده کنید که هنوز انتظار یک آرایهٔ تخت `allowFrom` را دارند.

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

`discord.channelAudience` یعنی «فرستندگان پیام مستقیم Discord را مجاز کن که در حال حاضر می‌توانند این کانال guild را ببینند.» OpenClaw هنگام مجوزدهی، فرستنده را از طریق Discord resolve می‌کند و قواعد مجوز `ViewChannel` در Discord را اعمال می‌کند.

وقتی یک کانال Discord از قبل منبع حقیقت برای یک تیم است، مانند `#maintainers` یا `#on-call`، از این استفاده کنید.

الزامات و رفتار در زمان شکست:

- bot به دسترسی به guild و کانال نیاز دارد.
- bot به **Server Members Intent** در Discord Developer Portal نیاز دارد.
- وقتی Discord مقدار `Missing Access` را برمی‌گرداند، فرستنده نمی‌تواند به‌عنوان عضو guild resolve شود، یا کانال به guild دیگری تعلق دارد، گروه دسترسی بسته شکست می‌خورد.

نمونه‌های بیشتر مخصوص Discord: [کنترل دسترسی Discord](/fa/channels/discord#access-control-and-routing)

## نکات امنیتی

- گروه‌های دسترسی نام‌های مستعار allowlist هستند، نه نقش‌ها. آن‌ها به‌تنهایی owner ایجاد نمی‌کنند، درخواست‌های pairing را تأیید نمی‌کنند، یا مجوز ابزار اعطا نمی‌کنند.
- `dmPolicy: "open"` همچنان به `"*"` در allowlist مؤثر پیام مستقیم نیاز دارد. ارجاع به یک گروه دسترسی با دسترسی عمومی یکسان نیست.
- نام‌های گروه مفقود بسته شکست می‌خورند. اگر `allowFrom` شامل `accessGroup:operators` باشد و `accessGroups.operators` وجود نداشته باشد، آن ورودی هیچ‌کس را مجاز نمی‌کند.
- شناسه‌های کانال را پایدار نگه دارید. وقتی کانال از هر دو پشتیبانی می‌کند، شناسه‌های عددی/کاربر را به نام‌های نمایشی ترجیح دهید.

## عیب‌یابی

اگر یک فرستنده باید تطبیق بخورد اما مسدود شده است:

1. تأیید کنید فیلد allowlist شامل ارجاع دقیق `accessGroup:<name>` است.
2. تأیید کنید `accessGroups.<name>.type` درست است.
3. تأیید کنید شناسهٔ فرستنده زیر کلید کانال مطابق، یا زیر `"*"`، فهرست شده است.
4. تأیید کنید ورودی از نحو عادی allowlist همان کانال استفاده می‌کند.
5. برای مخاطبان کانال Discord، تأیید کنید bot می‌تواند کانال guild را ببیند و Server Members Intent فعال است.

پس از ویرایش پیکربندی کنترل دسترسی، `openclaw doctor` را اجرا کنید. این فرمان بسیاری از ترکیب‌های نامعتبر allowlist و policy را پیش از زمان اجرا پیدا می‌کند.
