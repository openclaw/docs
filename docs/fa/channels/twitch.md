---
read_when:
    - راه‌اندازی یکپارچه‌سازی چت Twitch برای OpenClaw
sidebarTitle: Twitch
summary: 'ربات گفت‌وگوی Twitch: نصب، اطلاعات احراز هویت، کنترل دسترسی، تازه‌سازی توکن'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T09:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

پشتیبانی از گفت‌وگوی Twitch از طریق رابط چت (IRC) این سرویس و با استفاده از کلاینت Twurple. OpenClaw با یک حساب ربات Twitch وارد می‌شود، برای هر حساب پیکربندی‌شده به یک کانال می‌پیوندد و در همان کانال پاسخ می‌دهد.

## نصب

Twitch به‌صورت یک Plugin رسمی ارائه می‌شود و بخشی از نصب هسته نیست.

<Tabs>
  <Tab title="مخزن npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="نسخه محلی">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install`، Plugin را ثبت و فعال می‌کند. انتخاب Twitch هنگام اجرای `openclaw onboard` یا `openclaw channels add`، آن را در صورت نیاز نصب می‌کند. برای دنبال‌کردن انتشار فعلی از نام ساده بسته استفاده کنید؛ فقط برای نصب‌های تکرارپذیر، نسخه‌ای دقیق را ثابت کنید. به OpenClaw 2026.4.10 یا جدیدتر نیاز دارد.

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="نصب Plugin">
    بخش [نصب](#install) در بالا را ببینید.
  </Step>
  <Step title="ایجاد حساب ربات Twitch">
    یک حساب اختصاصی Twitch برای ربات ایجاد کنید (یا از حسابی موجود استفاده کنید).
  </Step>
  <Step title="ایجاد اطلاعات احراز هویت">
    از [Twitch Token Generator](https://twitchtokengenerator.com/) استفاده کنید:

    - **Bot Token** را انتخاب کنید
    - مطمئن شوید محدوده‌های `chat:read` و `chat:write` انتخاب شده‌اند
    - **Client ID** و **Access Token** را کپی کنید

  </Step>
  <Step title="یافتن شناسه کاربری Twitch">
    برای تبدیل نام کاربری به شناسه کاربری Twitch، از [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) استفاده کنید.
  </Step>
  <Step title="پیکربندی توکن">
    - متغیر محیطی: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (فقط حساب پیش‌فرض)
    - یا پیکربندی: `channels.twitch.accessToken`

    اگر هر دو تنظیم شده باشند، پیکربندی اولویت دارد (متغیر محیطی فقط برای حساب پیش‌فرض نقش جایگزین را دارد).

  </Step>
  <Step title="راه‌اندازی Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
برای جلوگیری از فعال‌کردن ربات توسط کاربران غیرمجاز، کنترل دسترسی (`allowFrom` یا `allowedRoles`) را اضافه کنید. مقدار پیش‌فرض `requireMention` برابر `true` است.
</Warning>

حداقل پیکربندی:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // حساب Twitch ربات (احراز هویت می‌کند)
      accessToken: "oauth:abc123...", // توکن دسترسی OAuth (یا استفاده از متغیر محیطی OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // شناسه کلاینت از Token Generator
      channel: "yourchannel", // گفت‌وگوی کدام کانال Twitch باید پیوسته شود (الزامی)
      allowFrom: ["123456789"], // (توصیه‌شده) فقط شناسه کاربری Twitch شما
    },
  },
}
```

## چیستی آن

- یک کانال Twitch تحت مالکیت Gateway.
- مسیریابی قطعی: پاسخ‌ها همیشه به همان کانال Twitch که پیام از آن آمده است بازمی‌گردند.
- هر کانال پیوسته‌شده به یک کلید نشست گروهی مجزا با قالب `agent:<agentId>:twitch:group:<channel>` نگاشت می‌شود.
- `username` حساب ربات است (حسابی که احراز هویت می‌کند) و `channel` اتاق گفت‌وگویی است که باید به آن پیوست. هر ورودی حساب دقیقاً به یک کانال می‌پیوندد.
- توکن‌ها با یا بدون پیشوند `oauth:` کار می‌کنند؛ OpenClaw هر دو شکل را یکسان‌سازی می‌کند (جادوگر راه‌اندازی شکل دارای `oauth:` را انتظار دارد).

## تازه‌سازی توکن (اختیاری)

توکن‌های [Twitch Token Generator](https://twitchtokengenerator.com/) توسط OpenClaw قابل تازه‌سازی نیستند؛ پس از انقضا آن‌ها را دوباره ایجاد کنید (این توکن‌ها چند ساعت اعتبار دارند و نیازی به ثبت برنامه نیست).

برای تازه‌سازی خودکار، برنامه خود را در [Twitch Developer Console](https://dev.twitch.tv/console) ایجاد کرده و موارد زیر را اضافه کنید:

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

با تنظیم هر دو مورد، Plugin از ارائه‌دهنده احراز هویتی استفاده می‌کند که توکن‌ها را پیش از انقضا تازه می‌کند و هر تازه‌سازی را در گزارش ثبت می‌کند. بدون `refreshToken`، پیام `token refresh disabled (no refresh token)` را ثبت می‌کند؛ بدون `clientSecret`، به توکن ثابت (غیرقابل تازه‌سازی) بازمی‌گردد.

## پشتیبانی از چند حساب

از `channels.twitch.accounts` همراه با اطلاعات احراز هویت مجزا برای هر حساب استفاده کنید. برای الگوی مشترک، [پیکربندی](/fa/gateway/configuration) را ببینید.

نمونه (یک حساب ربات در دو کانال):

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
هر ورودی حساب به `accessToken` مخصوص خود نیاز دارد (متغیر محیطی فقط حساب پیش‌فرض را پوشش می‌دهد). هر حساب دقیقاً به یک کانال می‌پیوندد، بنابراین پیوستن به دو کانال به دو حساب نیاز دارد. `channels.twitch.defaultAccount` تعیین می‌کند کدام حساب پیش‌فرض است.
</Note>

## کنترل دسترسی

`allowFrom` فهرست مجاز قطعی شناسه‌های کاربری Twitch است. وقتی تنظیم شود، `allowedRoles` نادیده گرفته می‌شود؛ برای استفاده از دسترسی مبتنی بر نقش، `allowFrom` را تنظیم‌نشده باقی بگذارید.

**نقش‌های موجود:** `"moderator"`، `"owner"`، `"vip"`، `"subscriber"`، `"all"`.

<Tabs>
  <Tab title="فهرست مجاز شناسه‌های کاربری (امن‌ترین)">
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
  </Tab>
  <Tab title="غیرفعال‌کردن الزام @اشاره">
    مقدار پیش‌فرض `requireMention` برابر `true` است. برای پاسخ‌دادن به همه پیام‌های مجاز:

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
**چرا شناسه‌های کاربری؟** نام‌های کاربری می‌توانند تغییر کنند و امکان جعل هویت را فراهم کنند. شناسه‌های کاربری دائمی هستند.

شناسه خود را با [مبدل نام کاربری به شناسه](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) پیدا کنید.
</Note>

## عیب‌یابی

ابتدا فرمان‌های تشخیصی را اجرا کنید:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="ربات به پیام‌ها پاسخ نمی‌دهد">
    - **کنترل دسترسی را بررسی کنید:** مطمئن شوید شناسه کاربری شما در `allowFrom` قرار دارد، یا برای آزمایش به‌طور موقت `allowFrom` را حذف کرده و `allowedRoles: ["all"]` را تنظیم کنید.
    - **دروازه اشاره را بررسی کنید:** با `requireMention: true` (پیش‌فرض)، پیام‌ها باید با @ به نام کاربری ربات اشاره کنند.
    - **بررسی کنید ربات در کانال باشد:** ربات فقط به کانالی می‌پیوندد که در `channel` نام‌گذاری شده است.

  </Accordion>
  <Accordion title="مشکلات توکن">
    خطاهای «اتصال ناموفق بود» یا خطاهای احراز هویت:

    - مطمئن شوید `accessToken` مقدار توکن دسترسی OAuth است (پیشوند `oauth:` اختیاری است)
    - بررسی کنید توکن دارای محدوده‌های `chat:read` و `chat:write` باشد
    - اگر از تازه‌سازی توکن استفاده می‌کنید، مطمئن شوید `clientSecret` و `refreshToken` تنظیم شده‌اند

  </Accordion>
  <Accordion title="تازه‌سازی توکن کار نمی‌کند">
    گزارش‌ها را برای رویدادهای تازه‌سازی بررسی کنید:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    اگر `token refresh disabled (no refresh token)` را مشاهده کردید:

    - مطمئن شوید `clientSecret` ارائه شده است
    - مطمئن شوید `refreshToken` ارائه شده است

  </Accordion>
</AccordionGroup>

## پیکربندی

### پیکربندی حساب

<ParamField path="username" type="string" required>
  نام کاربری ربات (حساب احراز هویت‌کننده).
</ParamField>
<ParamField path="accessToken" type="string" required>
  توکن دسترسی OAuth با `chat:read` و `chat:write` (پیکربندی یا متغیر محیطی برای حساب پیش‌فرض).
</ParamField>
<ParamField path="clientId" type="string" required>
  شناسه کلاینت Twitch (از Token Generator یا برنامه خودتان). در طرح‌واره اختیاری است، اما برای اتصال الزامی است.
</ParamField>
<ParamField path="channel" type="string" required>
  کانالی که باید به آن پیوست.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  این حساب را فعال می‌کند.
</ParamField>
<ParamField path="clientSecret" type="string">
  اختیاری: برای تازه‌سازی خودکار توکن.
</ParamField>
<ParamField path="refreshToken" type="string">
  اختیاری: برای تازه‌سازی خودکار توکن.
</ParamField>
<ParamField path="expiresIn" type="number">
  زمان انقضای توکن برحسب ثانیه (ردیابی تازه‌سازی).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  مُهر زمانی دریافت توکن (ردیابی تازه‌سازی).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  فهرست مجاز شناسه‌های کاربری. در صورت تنظیم، نقش‌ها نادیده گرفته می‌شوند.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  کنترل دسترسی مبتنی بر نقش.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  برای فعال‌کردن ربات، @اشاره را الزامی می‌کند.
</ParamField>
<ParamField path="responsePrefix" type="string">
  بازنویسی پیشوند پاسخ خروجی برای این حساب.
</ParamField>

### گزینه‌های ارائه‌دهنده

- `channels.twitch.enabled` - فعال/غیرفعال‌کردن راه‌اندازی کانال
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - پیکربندی ساده‌شده تک‌حسابی (حساب ضمنی `default`؛ نسبت به `accounts.default` اولویت دارد)
- `channels.twitch.accounts.<accountName>` - پیکربندی چندحسابی (همه فیلدهای حساب در بالا)
- `channels.twitch.defaultAccount` - نام حسابی که پیش‌فرض است
- `channels.twitch.markdown.tables` - حالت نمایش جدول Markdown (`off` | `bullets` | `code` | `block`)

نمونه کامل:

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

## کنش‌های ابزار

عامل می‌تواند پیام‌های Twitch را از طریق کنش `send` در ابزار پیام ارسال کند:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` اختیاری است و مقدار پیش‌فرض آن `channel` پیکربندی‌شده حساب است.

## ایمنی و عملیات

- **با توکن‌ها مانند گذرواژه رفتار کنید** - هرگز توکن‌ها را در git ثبت نکنید.
- برای ربات‌های طولانی‌مدت **از تازه‌سازی خودکار توکن استفاده کنید**.
- برای کنترل دسترسی، به‌جای نام‌های کاربری **از فهرست‌های مجاز شناسه کاربری استفاده کنید**.
- برای رویدادهای تازه‌سازی توکن و وضعیت اتصال **گزارش‌ها را پایش کنید**.
- **محدوده توکن‌ها را به حداقل برسانید** - فقط `chat:read` و `chat:write` را درخواست کنید.
- **اگر گیر کردید**: پس از اطمینان از اینکه فرایند دیگری مالک نشست نیست، Gateway را دوباره راه‌اندازی کنید.

## محدودیت‌ها

- **۵۰۰ نویسه** در هر پیام؛ پاسخ‌های طولانی‌تر در مرز واژه‌ها قطعه‌بندی می‌شوند.
- Markdown پیش از ارسال حذف می‌شود (گفت‌وگوی Twitch متن ساده است؛ خطوط جدید به فاصله تبدیل می‌شوند).
- OpenClaw محدودسازی نرخ جداگانه‌ای اضافه نمی‌کند؛ کلاینت گفت‌وگوی Twurple محدودیت‌های نرخ Twitch را مدیریت می‌کند.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه اشاره
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
