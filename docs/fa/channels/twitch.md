---
read_when:
    - راه‌اندازی یکپارچه‌سازی چت Twitch برای OpenClaw
sidebarTitle: Twitch
summary: پیکربندی و راه‌اندازی ربات چت Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-29T22:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

پشتیبانی از گفت‌وگوی Twitch از طریق اتصال IRC. OpenClaw به‌عنوان یک کاربر Twitch (حساب بات) متصل می‌شود تا پیام‌ها را در کانال‌ها دریافت و ارسال کند.

## Plugin همراه

<Note>
Twitch در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین بیلدهای بسته‌بندی‌شدهٔ معمول به نصب جداگانه نیاز ندارند.
</Note>

اگر روی یک بیلد قدیمی‌تر یا نصب سفارشی‌ای هستید که Twitch را حذف کرده است، وقتی بستهٔ npm فعلی منتشر شد، آن را نصب کنید:

<Tabs>
  <Tab title="رجیستری npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="چک‌اوت محلی">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

اگر npm گزارش داد بستهٔ متعلق به OpenClaw منسوخ شده است، تا زمان انتشار
بستهٔ npm جدیدتر، از یک بیلد بسته‌بندی‌شدهٔ فعلی OpenClaw یا مسیر چک‌اوت محلی
استفاده کنید.

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع (مبتدی)

<Steps>
  <Step title="مطمئن شوید Plugin در دسترس است">
    نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw از قبل آن را همراه دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را دستی اضافه کنند.
  </Step>
  <Step title="یک حساب بات Twitch بسازید">
    برای بات یک حساب اختصاصی Twitch بسازید (یا از یک حساب موجود استفاده کنید).
  </Step>
  <Step title="اعتبارنامه‌ها را تولید کنید">
    از [Twitch Token Generator](https://twitchtokengenerator.com/) استفاده کنید:

    - **Bot Token** را انتخاب کنید
    - بررسی کنید scopeهای `chat:read` و `chat:write` انتخاب شده باشند
    - **Client ID** و **Access Token** را کپی کنید

  </Step>
  <Step title="شناسهٔ کاربر Twitch خود را پیدا کنید">
    از [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) برای تبدیل نام کاربری به شناسهٔ کاربر Twitch استفاده کنید.
  </Step>
  <Step title="توکن را پیکربندی کنید">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (فقط حساب پیش‌فرض)
    - یا پیکربندی: `channels.twitch.accessToken`

    اگر هر دو تنظیم شده باشند، پیکربندی اولویت دارد (بازگشت به env فقط برای حساب پیش‌فرض است).

  </Step>
  <Step title="Gateway را شروع کنید">
    Gateway را با کانال پیکربندی‌شده شروع کنید.
  </Step>
</Steps>

<Warning>
برای جلوگیری از اینکه کاربران غیرمجاز بات را فعال کنند، کنترل دسترسی (`allowFrom` یا `allowedRoles`) اضافه کنید. مقدار پیش‌فرض `requireMention` برابر `true` است.
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

## چیستی آن

- یک کانال Twitch که متعلق به Gateway است.
- مسیریابی قطعی: پاسخ‌ها همیشه به Twitch برمی‌گردند.
- هر حساب به یک کلید نشست ایزولهٔ `agent:<agentId>:twitch:<accountName>` نگاشت می‌شود.
- `username` حساب بات است (کسی که احراز هویت می‌کند)، `channel` اتاق گفت‌وگویی است که باید به آن ملحق شود.

## راه‌اندازی (جزئیات)

### تولید اعتبارنامه‌ها

از [Twitch Token Generator](https://twitchtokengenerator.com/) استفاده کنید:

- **Bot Token** را انتخاب کنید
- بررسی کنید scopeهای `chat:read` و `chat:write` انتخاب شده باشند
- **Client ID** و **Access Token** را کپی کنید

<Note>
ثبت دستی برنامه لازم نیست. توکن‌ها پس از چند ساعت منقضی می‌شوند.
</Note>

### پیکربندی بات

<Tabs>
  <Tab title="متغیر env (فقط حساب پیش‌فرض)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="پیکربندی">
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

اگر هر دو env و پیکربندی تنظیم شده باشند، پیکربندی اولویت دارد.

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

برای یک فهرست مجاز سخت‌گیرانه، `allowFrom` را ترجیح دهید. اگر دسترسی مبتنی بر نقش می‌خواهید، به‌جای آن از `allowedRoles` استفاده کنید.

**نقش‌های در دسترس:** `"moderator"`، `"owner"`، `"vip"`، `"subscriber"`، `"all"`.

<Note>
**چرا شناسه‌های کاربر؟** نام‌های کاربری می‌توانند تغییر کنند و جعل هویت را ممکن کنند. شناسه‌های کاربر دائمی هستند.

شناسهٔ کاربر Twitch خود را پیدا کنید: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (نام کاربری Twitch خود را به شناسه تبدیل کنید)
</Note>

## نوسازی توکن (اختیاری)

توکن‌های [Twitch Token Generator](https://twitchtokengenerator.com/) نمی‌توانند به‌طور خودکار نوسازی شوند - پس از انقضا دوباره تولید کنید.

برای نوسازی خودکار توکن، برنامهٔ Twitch خودتان را در [Twitch Developer Console](https://dev.twitch.tv/console) بسازید و به پیکربندی اضافه کنید:

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

بات پیش از انقضا توکن‌ها را به‌طور خودکار نوسازی می‌کند و رویدادهای نوسازی را در لاگ ثبت می‌کند.

## پشتیبانی چندحسابی

از `channels.twitch.accounts` با توکن‌های مخصوص هر حساب استفاده کنید. الگوی مشترک را در [پیکربندی](/fa/gateway/configuration) ببینید.

مثال (یک حساب بات در دو کانال):

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
  <Tab title="فهرست مجاز شناسهٔ کاربر (امن‌ترین)">
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
  <Tab title="مبتنی بر نقش">
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

    `allowFrom` یک فهرست مجاز سخت‌گیرانه است. وقتی تنظیم شود، فقط آن شناسه‌های کاربر مجاز هستند. اگر دسترسی مبتنی بر نقش می‌خواهید، `allowFrom` را تنظیم نکنید و به‌جای آن `allowedRoles` را پیکربندی کنید.

  </Tab>
  <Tab title="غیرفعال کردن الزام @mention">
    به‌طور پیش‌فرض، `requireMention` برابر `true` است. برای غیرفعال کردن و پاسخ دادن به همهٔ پیام‌ها:

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
  <Accordion title="بات به پیام‌ها پاسخ نمی‌دهد">
    - **کنترل دسترسی را بررسی کنید:** مطمئن شوید شناسهٔ کاربر شما در `allowFrom` است، یا برای آزمایش موقتاً `allowFrom` را حذف کنید و `allowedRoles: ["all"]` را تنظیم کنید.
    - **بررسی کنید بات در کانال باشد:** بات باید به کانالی که در `channel` مشخص شده است ملحق شود.

  </Accordion>
  <Accordion title="مشکلات توکن">
    «اتصال ناموفق بود» یا خطاهای احراز هویت:

    - بررسی کنید `accessToken` مقدار توکن دسترسی OAuth باشد (معمولاً با پیشوند `oauth:` شروع می‌شود)
    - بررسی کنید توکن scopeهای `chat:read` و `chat:write` را داشته باشد
    - اگر از نوسازی توکن استفاده می‌کنید، بررسی کنید `clientSecret` و `refreshToken` تنظیم شده باشند

  </Accordion>
  <Accordion title="نوسازی توکن کار نمی‌کند">
    لاگ‌ها را برای رویدادهای نوسازی بررسی کنید:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    اگر «token refresh disabled (no refresh token)» را می‌بینید:

    - مطمئن شوید `clientSecret` ارائه شده باشد
    - مطمئن شوید `refreshToken` ارائه شده باشد

  </Accordion>
</AccordionGroup>

## پیکربندی

### پیکربندی حساب

<ParamField path="username" type="string">
  نام کاربری بات.
</ParamField>
<ParamField path="accessToken" type="string">
  توکن دسترسی OAuth با `chat:read` و `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (از Token Generator یا برنامهٔ شما).
</ParamField>
<ParamField path="channel" type="string" required>
  کانالی که باید به آن ملحق شد.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  این حساب را فعال کنید.
</ParamField>
<ParamField path="clientSecret" type="string">
  اختیاری: برای نوسازی خودکار توکن.
</ParamField>
<ParamField path="refreshToken" type="string">
  اختیاری: برای نوسازی خودکار توکن.
</ParamField>
<ParamField path="expiresIn" type="number">
  انقضای توکن بر حسب ثانیه.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  مُهر زمانی دریافت توکن.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  فهرست مجاز شناسهٔ کاربر.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  کنترل دسترسی مبتنی بر نقش.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  نیازمند @mention.
</ParamField>

### گزینه‌های ارائه‌دهنده

- `channels.twitch.enabled` - فعال/غیرفعال کردن شروع کانال
- `channels.twitch.username` - نام کاربری بات (پیکربندی ساده‌شدهٔ تک‌حسابی)
- `channels.twitch.accessToken` - توکن دسترسی OAuth (پیکربندی ساده‌شدهٔ تک‌حسابی)
- `channels.twitch.clientId` - Twitch Client ID (پیکربندی ساده‌شدهٔ تک‌حسابی)
- `channels.twitch.channel` - کانالی که باید به آن ملحق شد (پیکربندی ساده‌شدهٔ تک‌حسابی)
- `channels.twitch.accounts.<accountName>` - پیکربندی چندحسابی (همهٔ فیلدهای حساب در بالا)

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

عامل می‌تواند `twitch` را با کنش زیر فراخوانی کند:

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

- **با توکن‌ها مانند گذرواژه رفتار کنید** — هرگز توکن‌ها را به git کامیت نکنید.
- **برای بات‌های بلندمدت از نوسازی خودکار توکن استفاده کنید**.
- **برای کنترل دسترسی از فهرست‌های مجاز شناسهٔ کاربر** به‌جای نام‌های کاربری استفاده کنید.
- **لاگ‌ها را پایش کنید** تا رویدادهای نوسازی توکن و وضعیت اتصال را ببینید.
- **دامنهٔ توکن‌ها را حداقلی نگه دارید** — فقط `chat:read` و `chat:write` را درخواست کنید.
- **اگر گیر کردید**: پس از تأیید اینکه هیچ فرایند دیگری مالک نشست نیست، Gateway را بازراه‌اندازی کنید.

## محدودیت‌ها

- **۵۰۰ نویسه** برای هر پیام (به‌طور خودکار در مرز واژه‌ها به قطعه‌ها تقسیم می‌شود).
- Markdown پیش از قطعه‌بندی حذف می‌شود.
- بدون محدودسازی نرخ (از محدودیت‌های نرخ داخلی Twitch استفاده می‌کند).

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه‌گذاری mention
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
