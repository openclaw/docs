---
read_when:
    - راه‌اندازی یکپارچه‌سازی چت Twitch برای OpenClaw
sidebarTitle: Twitch
summary: پیکربندی و راه‌اندازی ربات چت Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

پشتیبانی از چت Twitch از طریق اتصال IRC. OpenClaw به‌عنوان یک کاربر Twitch (حساب bot) وصل می‌شود تا پیام‌ها را در کانال‌ها دریافت و ارسال کند.

## Plugin همراه

<Note>
Twitch در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود، بنابراین buildهای بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.
</Note>

اگر روی build قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Twitch را حذف کرده است، بسته npm را مستقیما نصب کنید:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

از بسته خام استفاده کنید تا برچسب انتشار رسمی فعلی را دنبال کنید. فقط زمانی یک
نسخه دقیق را pin کنید که به نصب قابل بازتولید نیاز دارید.

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

<Steps>
  <Step title="مطمئن شوید Plugin در دسترس است">
    نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را دستی اضافه کنند.
  </Step>
  <Step title="یک حساب bot در Twitch بسازید">
    یک حساب Twitch اختصاصی برای bot بسازید (یا از یک حساب موجود استفاده کنید).
  </Step>
  <Step title="اعتبارنامه‌ها را ایجاد کنید">
    از [Twitch Token Generator](https://twitchtokengenerator.com/) استفاده کنید:

    - **Bot Token** را انتخاب کنید
    - بررسی کنید scopeهای `chat:read` و `chat:write` انتخاب شده باشند
    - **Client ID** و **Access Token** را کپی کنید

  </Step>
  <Step title="شناسه کاربری Twitch خود را پیدا کنید">
    از [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) برای تبدیل نام کاربری به شناسه کاربری Twitch استفاده کنید.
  </Step>
  <Step title="توکن را پیکربندی کنید">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (فقط حساب پیش‌فرض)
    - یا config: `channels.twitch.accessToken`

    اگر هر دو تنظیم شده باشند، config اولویت دارد (fallback به env فقط برای حساب پیش‌فرض است).

  </Step>
  <Step title="Gateway را شروع کنید">
    Gateway را با کانال پیکربندی‌شده شروع کنید.
  </Step>
</Steps>

<Warning>
برای جلوگیری از راه‌اندازی bot توسط کاربران غیرمجاز، کنترل دسترسی (`allowFrom` یا `allowedRoles`) اضافه کنید. مقدار پیش‌فرض `requireMention` برابر `true` است.
</Warning>

پیکربندی حداقلی:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## چیست

- یک کانال Twitch که مالک آن Gateway است.
- مسیریابی قطعی: پاسخ‌ها همیشه به Twitch برمی‌گردند.
- هر حساب به یک کلید جلسه ایزوله‌شده با قالب `agent:<agentId>:twitch:<accountName>` نگاشت می‌شود.
- `username` حساب bot است (کسی که احراز هویت می‌کند)، `channel` اتاق چتی است که باید به آن ملحق شود.

## راه‌اندازی (جزئیات)

### ایجاد اعتبارنامه‌ها

از [Twitch Token Generator](https://twitchtokengenerator.com/) استفاده کنید:

- **Bot Token** را انتخاب کنید
- بررسی کنید scopeهای `chat:read` و `chat:write` انتخاب شده باشند
- **Client ID** و **Access Token** را کپی کنید

<Note>
نیازی به ثبت دستی app نیست. توکن‌ها پس از چند ساعت منقضی می‌شوند.
</Note>

### پیکربندی bot

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

اگر هر دو env و config تنظیم شده باشند، config اولویت دارد.

### کنترل دسترسی (توصیه‌شده)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

برای allowlist سخت‌گیرانه، `allowFrom` را ترجیح دهید. اگر دسترسی مبتنی بر نقش می‌خواهید، به‌جای آن از `allowedRoles` استفاده کنید.

**نقش‌های موجود:** `"moderator"`، `"owner"`، `"vip"`، `"subscriber"`، `"all"`.

<Note>
**چرا شناسه‌های کاربری؟** نام‌های کاربری می‌توانند تغییر کنند و امکان جعل هویت بدهند. شناسه‌های کاربری دائمی هستند.

شناسه کاربری Twitch خود را پیدا کنید: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (نام کاربری Twitch خود را به شناسه تبدیل کنید)
</Note>

## تازه‌سازی توکن (اختیاری)

توکن‌های [Twitch Token Generator](https://twitchtokengenerator.com/) به‌صورت خودکار تازه‌سازی نمی‌شوند - هنگام انقضا دوباره ایجادشان کنید.

برای تازه‌سازی خودکار توکن، برنامه Twitch خودتان را در [Twitch Developer Console](https://dev.twitch.tv/console) بسازید و به config اضافه کنید:

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

bot توکن‌ها را پیش از انقضا به‌صورت خودکار تازه‌سازی می‌کند و رویدادهای تازه‌سازی را log می‌کند.

## پشتیبانی چندحسابی

از `channels.twitch.accounts` با توکن‌های اختصاصی هر حساب استفاده کنید. برای الگوی مشترک، [پیکربندی](/fa/gateway/configuration) را ببینید.

مثال (یک حساب bot در دو کانال):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
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
هر حساب به توکن خودش نیاز دارد (یک توکن برای هر کانال).
</Note>

## کنترل دسترسی

<Tabs>
  <Tab title="User ID allowlist (most secure)">
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
  <Tab title="Role-based">
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

    `allowFrom` یک allowlist سخت‌گیرانه است. وقتی تنظیم شود، فقط آن شناسه‌های کاربری مجاز هستند. اگر دسترسی مبتنی بر نقش می‌خواهید، `allowFrom` را تنظیم نکنید و به‌جای آن `allowedRoles` را پیکربندی کنید.

  </Tab>
  <Tab title="Disable @mention requirement">
    به‌صورت پیش‌فرض، `requireMention` برابر `true` است. برای غیرفعال‌کردن و پاسخ به همه پیام‌ها:

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

## عیب‌یابی

ابتدا، دستورهای تشخیصی را اجرا کنید:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot به پیام‌ها پاسخ نمی‌دهد">
    - **کنترل دسترسی را بررسی کنید:** مطمئن شوید شناسه کاربری شما در `allowFrom` است، یا برای آزمایش، موقتا `allowFrom` را حذف کنید و `allowedRoles: ["all"]` را تنظیم کنید.
    - **بررسی کنید bot در کانال باشد:** bot باید به کانالی که در `channel` مشخص شده است ملحق شود.

  </Accordion>
  <Accordion title="مشکلات توکن">
    «اتصال ناموفق بود» یا خطاهای احراز هویت:

    - بررسی کنید `accessToken` مقدار توکن دسترسی OAuth باشد (معمولا با پیشوند `oauth:` شروع می‌شود)
    - بررسی کنید توکن scopeهای `chat:read` و `chat:write` را داشته باشد
    - اگر از تازه‌سازی توکن استفاده می‌کنید، بررسی کنید `clientSecret` و `refreshToken` تنظیم شده باشند

  </Accordion>
  <Accordion title="تازه‌سازی توکن کار نمی‌کند">
    logها را برای رویدادهای تازه‌سازی بررسی کنید:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    اگر «token refresh disabled (no refresh token)» را می‌بینید:

    - مطمئن شوید `clientSecret` ارائه شده است
    - مطمئن شوید `refreshToken` ارائه شده است

  </Accordion>
</AccordionGroup>

## Config

### پیکربندی حساب

<ParamField path="username" type="string">
  نام کاربری bot.
</ParamField>
<ParamField path="accessToken" type="string">
  توکن دسترسی OAuth با `chat:read` و `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID مربوط به Twitch (از Token Generator یا app خودتان).
</ParamField>
<ParamField path="channel" type="string" required>
  کانالی که باید به آن ملحق شد.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  این حساب را فعال کنید.
</ParamField>
<ParamField path="clientSecret" type="string">
  اختیاری: برای تازه‌سازی خودکار توکن.
</ParamField>
<ParamField path="refreshToken" type="string">
  اختیاری: برای تازه‌سازی خودکار توکن.
</ParamField>
<ParamField path="expiresIn" type="number">
  زمان انقضای توکن بر حسب ثانیه.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  timestamp دریافت توکن.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  allowlist شناسه کاربری.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  کنترل دسترسی مبتنی بر نقش.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention را الزامی کنید.
</ParamField>

### گزینه‌های Provider

- `channels.twitch.enabled` - فعال/غیرفعال‌کردن شروع کانال
- `channels.twitch.username` - نام کاربری bot (پیکربندی ساده‌شده تک‌حسابی)
- `channels.twitch.accessToken` - توکن دسترسی OAuth (پیکربندی ساده‌شده تک‌حسابی)
- `channels.twitch.clientId` - Client ID مربوط به Twitch (پیکربندی ساده‌شده تک‌حسابی)
- `channels.twitch.channel` - کانالی که باید به آن ملحق شد (پیکربندی ساده‌شده تک‌حسابی)
- `channels.twitch.accounts.<accountName>` - پیکربندی چندحسابی (همه فیلدهای حساب در بالا)

مثال کامل:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## کنش‌های ابزار

agent می‌تواند `twitch` را با action زیر فراخوانی کند:

- `send` - ارسال پیام به یک کانال

مثال:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## ایمنی و عملیات

- **با توکن‌ها مثل گذرواژه برخورد کنید** — هرگز توکن‌ها را در git commit نکنید.
- **برای botهای طولانی‌مدت از تازه‌سازی خودکار توکن استفاده کنید**.
- **برای کنترل دسترسی، به‌جای نام کاربری از allowlistهای شناسه کاربری استفاده کنید**.
- **logها را برای رویدادهای تازه‌سازی توکن و وضعیت اتصال پایش کنید**.
- **scope توکن‌ها را حداقلی نگه دارید** — فقط `chat:read` و `chat:write` را درخواست کنید.
- **اگر گیر کردید**: پس از تأیید اینکه هیچ فرایند دیگری مالک جلسه نیست، Gateway را راه‌اندازی مجدد کنید.

## محدودیت‌ها

- **۵۰۰ نویسه** برای هر پیام (به‌صورت خودکار در مرز واژه‌ها chunk می‌شود).
- Markdown پیش از chunk کردن حذف می‌شود.
- بدون محدودسازی نرخ (از محدودیت‌های نرخ داخلی Twitch استفاده می‌کند).

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی جلسه برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و gating مبتنی بر mention
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
