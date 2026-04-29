---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-29T22:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin بسته‌بندی‌شده (توکن ربات + رویدادهای WebSocket). کانال‌ها، گروه‌ها و پیام‌های مستقیم پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی با قابلیت میزبانی شخصی است؛ برای جزئیات محصول و دانلودها، سایت رسمی را در [mattermost.com](https://mattermost.com) ببینید.

## Plugin بسته‌بندی‌شده

<Note>
Mattermost در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin بسته‌بندی‌شده عرضه می‌شود، بنابراین بیلدهای بسته‌بندی‌شده عادی به نصب جداگانه نیاز ندارند.
</Note>

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Mattermost را حذف کرده است، وقتی یک بسته npm فعلی منتشر شد، آن را نصب کنید:

<Tabs>
  <Tab title="رجیستری npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="checkout محلی">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

اگر npm گزارش داد که بسته متعلق به OpenClaw منسوخ شده است، تا زمانی که بسته npm جدیدتری منتشر شود، از یک بیلد بسته‌بندی‌شده فعلی OpenClaw یا مسیر checkout محلی استفاده کنید.

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="مطمئن شوید Plugin در دسترس است">
    نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه خود دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند با فرمان‌های بالا آن را به‌صورت دستی اضافه کنند.
  </Step>
  <Step title="یک ربات Mattermost بسازید">
    یک حساب ربات Mattermost بسازید و **توکن ربات** را کپی کنید.
  </Step>
  <Step title="URL پایه را کپی کنید">
    **URL پایه** Mattermost را کپی کنید (مثلاً `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw را پیکربندی کنید و Gateway را شروع کنید">
    پیکربندی حداقلی:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## فرمان‌های slash بومی

فرمان‌های slash بومی اختیاری هستند. وقتی فعال شوند، OpenClaw فرمان‌های slash با الگوی `oc_*` را از طریق API Mattermost ثبت می‌کند و POSTهای callback را روی سرور HTTP Gateway دریافت می‌کند.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نکات رفتاری">
    - `native: "auto"` برای Mattermost به‌صورت پیش‌فرض غیرفعال است. برای فعال‌سازی، `native: true` را تنظیم کنید.
    - اگر `callbackUrl` حذف شود، OpenClaw یکی را از میزبان/پورت Gateway + `callbackPath` استخراج می‌کند.
    - برای راه‌اندازی‌های چندحسابی، `commands` می‌تواند در سطح بالایی یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم شود (مقادیر حساب، فیلدهای سطح بالایی را override می‌کنند).
    - callbackهای فرمان با توکن‌های مختص هر فرمان که هنگام ثبت فرمان‌های `oc_*` توسط OpenClaw از Mattermost برگردانده می‌شوند، اعتبارسنجی می‌شوند.
    - وقتی ثبت ناموفق باشد، راه‌اندازی ناقص باشد، یا توکن callback با هیچ‌کدام از فرمان‌های ثبت‌شده مطابقت نداشته باشد، callbackهای slash به‌صورت بسته شکست می‌خورند.

  </Accordion>
  <Accordion title="نیازمندی دسترس‌پذیری">
    endpoint callback باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید، مگر اینکه Mattermost روی همان میزبان/namespace شبکه‌ای OpenClaw اجرا شود.
    - `callbackUrl` را روی URL پایه Mattermost خود تنظیم نکنید، مگر اینکه آن URL مسیر `/api/channels/mattermost/command` را با reverse proxy به OpenClaw بفرستد.
    - یک بررسی سریع `curl https://<gateway-host>/api/channels/mattermost/command` است؛ درخواست GET باید از OpenClaw مقدار `405 Method Not Allowed` برگرداند، نه `404`.

  </Accordion>
  <Accordion title="allowlist خروجی Mattermost">
    اگر callback شما نشانی‌های خصوصی/tailnet/داخلی را هدف می‌گیرد، `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost را طوری تنظیم کنید که میزبان/دامنه callback را شامل شود.

    از ورودی‌های میزبان/دامنه استفاده کنید، نه URLهای کامل.

    - درست: `gateway.tailnet-name.ts.net`
    - نادرست: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی (حساب پیش‌فرض)

اگر env varها را ترجیح می‌دهید، این‌ها را روی میزبان Gateway تنظیم کنید:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
env varها فقط روی حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر پیکربندی استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در workspace](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های چت

Mattermost به پیام‌های مستقیم به‌صورت خودکار پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (پیش‌فرض)">
    فقط هنگام @mention شدن در کانال‌ها پاسخ بده.
  </Tab>
  <Tab title="onmessage">
    به هر پیام کانال پاسخ بده.
  </Tab>
  <Tab title="onchar">
    وقتی پیام با یک پیشوند trigger شروع می‌شود پاسخ بده.
  </Tab>
</Tabs>

نمونه پیکربندی:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

نکات:

- `onchar` همچنان به @mentionهای صریح پاسخ می‌دهد.
- `channels.mattermost.requireMention` برای پیکربندی‌های legacy رعایت می‌شود، اما `chatmode` ترجیح داده می‌شود.

## threadها و نشست‌ها

از `channels.mattermost.replyToMode` استفاده کنید تا کنترل کنید پاسخ‌های کانال و گروه در کانال اصلی بمانند یا زیر پست triggerکننده یک thread شروع کنند.

- `off` (پیش‌فرض): فقط وقتی پست ورودی از قبل در یک thread است، در thread پاسخ بده.
- `first`: برای پست‌های سطح بالای کانال/گروه، زیر همان پست یک thread شروع کن و مکالمه را به یک نشست محدود به thread مسیریابی کن.
- `all`: برای Mattermost امروز همان رفتار `first` را دارد.
- پیام‌های مستقیم این تنظیم را نادیده می‌گیرند و بدون thread باقی می‌مانند.

نمونه پیکربندی:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

نکات:

- نشست‌های محدود به thread از شناسه پست triggerکننده به‌عنوان ریشه thread استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل‌اند، چون وقتی Mattermost یک ریشه thread داشته باشد، chunkهای بعدی و رسانه‌ها در همان thread ادامه پیدا می‌کنند.

## کنترل دسترسی (پیام‌های مستقیم)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستنده‌های ناشناس یک کد pairing دریافت می‌کنند).
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- پیام‌های مستقیم عمومی: `channels.mattermost.dmPolicy="open"` به‌علاوه `channels.mattermost.allowFrom=["*"]`.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (با نیاز به mention).
- فرستنده‌ها را با `channels.mattermost.groupAllowFrom` در allowlist قرار دهید (شناسه‌های کاربری توصیه می‌شوند).
- overrideهای mention برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` قرار دارند، یا برای یک پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention`.
- تطبیق `@username` قابل تغییر است و فقط وقتی فعال می‌شود که `channels.mattermost.dangerouslyAllowNameMatching: true` تنظیم شده باشد.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (با نیاز به mention).
- نکته runtime: اگر `channels.mattermost` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

مثال:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## هدف‌ها برای تحویل خروجی

از این قالب‌های هدف با `openclaw message send` یا cron/webhooks استفاده کنید:

- `channel:<id>` برای یک کانال
- `user:<id>` برای یک پیام مستقیم
- `@username` برای یک پیام مستقیم (از طریق API Mattermost resolve می‌شود)

<Warning>
شناسه‌های opaque بدون پیشوند (مثل `64ifufp...`) در Mattermost **مبهم** هستند (شناسه کاربر در برابر شناسه کانال).

OpenClaw آن‌ها را **ابتدا به‌عنوان کاربر** resolve می‌کند:

- اگر شناسه به‌عنوان یک کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با resolve کردن کانال مستقیم از طریق `/api/v4/channels/direct` یک **پیام مستقیم** می‌فرستد.
- در غیر این صورت، شناسه به‌عنوان یک **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح (`user:<id>` / `channel:<id>`) استفاده کنید.
</Warning>

## تلاش دوباره برای کانال پیام مستقیم

وقتی OpenClaw به یک هدف پیام مستقیم Mattermost ارسال می‌کند و لازم است ابتدا کانال مستقیم را resolve کند، به‌صورت پیش‌فرض شکست‌های گذرای ایجاد کانال مستقیم را دوباره تلاش می‌کند.

برای تنظیم این رفتار به‌صورت سراسری برای Plugin Mattermost از `channels.mattermost.dmChannelRetry` استفاده کنید، یا برای یک حساب از `channels.mattermost.accounts.<id>.dmChannelRetry`.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

نکات:

- این فقط برای ایجاد کانال پیام مستقیم (`/api/v4/channels/direct`) اعمال می‌شود، نه برای هر فراخوانی API Mattermost.
- تلاش‌های دوباره برای شکست‌های گذرا مثل rate limitها، پاسخ‌های 5xx، و خطاهای شبکه یا timeout اعمال می‌شوند.
- خطاهای client از نوع 4xx به‌جز `429` دائمی در نظر گرفته می‌شوند و دوباره تلاش نمی‌شوند.

## streaming پیش‌نمایش

Mattermost فکر کردن، فعالیت ابزار و متن پاسخ جزئی را در یک **پست پیش‌نمایش draft** واحد stream می‌کند که وقتی ارسال پاسخ نهایی امن باشد، در همان‌جا نهایی می‌شود. پیش‌نمایش به‌جای پر کردن کانال با پیام‌های هر chunk، روی همان شناسه پست به‌روزرسانی می‌شود. نهایی‌های رسانه/خطا، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند و به‌جای flush کردن یک پست پیش‌نمایش دورریختنی، از تحویل عادی استفاده می‌کنند.

از طریق `channels.mattermost.streaming` فعال کنید:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="حالت‌های streaming">
    - `partial` انتخاب معمول است: یک پست پیش‌نمایش که با رشد پاسخ ویرایش می‌شود و سپس با پاسخ کامل نهایی می‌شود.
    - `block` از chunkهای draft با سبک append درون پست پیش‌نمایش استفاده می‌کند.
    - `progress` هنگام تولید، یک پیش‌نمایش وضعیت نشان می‌دهد و فقط پس از تکمیل، پاسخ نهایی را پست می‌کند.
    - `off` streaming پیش‌نمایش را غیرفعال می‌کند.

  </Accordion>
  <Accordion title="نکات رفتاری streaming">
    - اگر stream نتواند در همان‌جا نهایی شود (برای مثال، پست در میانه stream حذف شده باشد)، OpenClaw به ارسال یک پست نهایی تازه برمی‌گردد تا پاسخ هرگز از دست نرود.
    - payloadهای فقط reasoning از پست‌های کانال حذف می‌شوند، از جمله متنی که به‌صورت blockquote با `> Reasoning:` می‌رسد. برای دیدن فکر کردن در سطوح دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، [Streaming](/fa/concepts/streaming#preview-streaming-modes) را ببینید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مثل `thumbsup` یا `:+1:` را می‌پذیرد (دونقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (boolean) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای سیستمی به نشست agent مسیریابی‌شده forward می‌شوند.

مثال‌ها:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال کردن actionهای واکنش (پیش‌فرض true).
- override برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربری روی یک دکمه کلیک می‌کند، agent انتخاب را دریافت می‌کند و می‌تواند پاسخ بدهد.

دکمه‌ها را با افزودن `inlineButtons` به قابلیت‌های کانال فعال کنید:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

از `message action=send` با پارامتر `buttons` استفاده کنید. دکمه‌ها یک آرایه دوبعدی هستند (ردیف‌هایی از دکمه‌ها):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

فیلدهای دکمه:

<ParamField path="text" type="string" required>
  برچسب نمایشی.
</ParamField>
<ParamField path="callback_data" type="string" required>
  مقداری که هنگام کلیک برگردانده می‌شود (به‌عنوان شناسه action استفاده می‌شود).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  سبک دکمه.
</ParamField>

وقتی کاربری روی یک دکمه کلیک می‌کند:

<Steps>
  <Step title="دکمه‌ها با تأیید جایگزین می‌شوند">
    همه دکمه‌ها با یک خط تأیید جایگزین می‌شوند (مثلاً، "✓ **بله** توسط @user انتخاب شد").
  </Step>
  <Step title="عامل انتخاب را دریافت می‌کند">
    عامل انتخاب را به‌عنوان یک پیام ورودی دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="یادداشت‌های پیاده‌سازی">
    - فراخوان‌های بازگشتی دکمه‌ها از راستی‌آزمایی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - Mattermost داده‌های callback را از پاسخ‌های API خود حذف می‌کند (ویژگی امنیتی)، بنابراین همه دکمه‌ها هنگام کلیک حذف می‌شوند — حذف جزئی ممکن نیست.
    - شناسه‌های کنش که شامل خط تیره یا زیرخط هستند به‌طور خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).

  </Accordion>
  <Accordion title="پیکربندی و دسترس‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال‌کردن توضیح ابزار دکمه‌ها در پرامپت سیستمی عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایه خارجی اختیاری برای callbackهای دکمه‌ها (برای مثال `https://gateway.example.com`). وقتی Mattermost نمی‌تواند مستقیماً در میزبان bind خود به Gateway دسترسی پیدا کند، از این استفاده کنید.
    - در راه‌اندازی‌های چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw نشانی callback را از `gateway.customBindHost` + `gateway.port` می‌سازد، سپس به `http://localhost:<port>` برمی‌گردد.
    - قانون دسترس‌پذیری: نشانی callback دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط زمانی کار می‌کند که Mattermost و OpenClaw روی همان میزبان/فضای نام شبکه اجرا شوند.
    - اگر مقصد callback شما خصوصی/tailnet/داخلی است، میزبان/دامنه آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌های خارجی و Webhookها می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق Mattermost REST API ارسال کنند. در صورت امکان از `buildButtonAttachments()` در Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را دنبال کنید:

**ساختار Payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**قواعد حیاتی**

1. پیوست‌ها در `props.attachments` قرار می‌گیرند، نه در `attachments` سطح بالا (بی‌صدا نادیده گرفته می‌شود).
2. هر کنش به `type: "button"` نیاز دارد — بدون آن، کلیک‌ها بی‌صدا بلعیده می‌شوند.
3. هر کنش به یک فیلد `id` نیاز دارد — Mattermost کنش‌های بدون شناسه را نادیده می‌گیرد.
4. `id` کنش باید **فقط الفبایی‌عددی** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی کنش سمت سرور Mattermost را خراب می‌کنند (404 برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد تا پیام تأیید نام دکمه (مثلاً، "Approve") را به‌جای شناسه خام نشان دهد.
6. `context.action_id` الزامی است — handler تعامل بدون آن 400 برمی‌گرداند.

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 راستی‌آزمایی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق راستی‌آزمایی Gateway مطابقت داشته باشد:

<Steps>
  <Step title="استخراج secret از توکن bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="ساخت شیء context">
    شیء context را با همه فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    با **کلیدهای مرتب‌شده** و **بدون فاصله** سریال‌سازی کنید (Gateway از `JSON.stringify` با کلیدهای مرتب‌شده استفاده می‌کند که خروجی فشرده تولید می‌کند).
  </Step>
  <Step title="امضای Payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    digest هگز حاصل را به‌عنوان `_token` در context اضافه کنید.
  </Step>
</Steps>

مثال Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="اشتباهات رایج HMAC">
    - `json.dumps` در Python به‌صورت پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای مطابقت با خروجی فشرده JavaScript (`{"key":"val"}`) از `separators=(",", ":")` استفاده کنید.
    - همیشه **همه** فیلدهای context را امضا کنید (منهای `_token`). Gateway ابتدا `_token` را حذف می‌کند و سپس همه موارد باقی‌مانده را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌صدای راستی‌آزمایی می‌شود.
    - از `sort_keys=True` استفاده کنید — Gateway پیش از امضا کلیدها را مرتب می‌کند، و Mattermost ممکن است هنگام ذخیره Payload ترتیب فیلدهای context را تغییر دهد.
    - secret را از توکن bot استخراج کنید (قطعی)، نه از بایت‌های تصادفی. secret باید در فرایندی که دکمه‌ها را ایجاد می‌کند و Gateway که راستی‌آزمایی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور دایرکتوری

Plugin مربوط به Mattermost شامل یک آداپتور دایرکتوری است که نام‌های کانال و کاربر را از طریق Mattermost API resolve می‌کند. این کار اهداف `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های cron/webhook فعال می‌کند.

هیچ پیکربندی لازم نیست — آداپتور از توکن bot در پیکربندی حساب استفاده می‌کند.

## چندحسابی

Mattermost از چند حساب زیر `channels.mattermost.accounts` پشتیبانی می‌کند:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدون پاسخ در کانال‌ها">
    مطمئن شوید bot در کانال است و آن را mention کنید (oncall)، از یک پیشوند trigger استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن bot، نشانی پایه و فعال‌بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای env فقط روی حساب `default` اعمال می‌شوند.

  </Accordion>
  <Accordion title="دستورهای slash بومی شکست می‌خورند">
    - `Unauthorized: invalid command token.`: OpenClaw توکن callback را نپذیرفته است. علت‌های معمول:
      - ثبت دستور slash هنگام شروع شکست خورده یا فقط به‌صورت جزئی کامل شده است
      - callback به Gateway/حساب اشتباه برخورد می‌کند
      - Mattermost هنوز دستورهای قدیمی دارد که به مقصد callback قبلی اشاره می‌کنند
      - Gateway بدون فعال‌سازی دوباره دستورهای slash راه‌اندازی مجدد شده است
    - اگر دستورهای slash بومی از کار افتادند، logها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده و logها هشدار می‌دهند که callback به `http://127.0.0.1:18789/...` resolve شده است، آن URL احتمالاً فقط زمانی قابل دسترسی است که Mattermost روی همان میزبان/فضای نام شبکه OpenClaw اجرا شود. به‌جای آن یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌شکل کادرهای سفید ظاهر می‌شوند: عامل ممکن است داده دکمه نامعتبر ارسال کند. بررسی کنید که هر دکمه هم فیلد `text` و هم فیلد `callback_data` داشته باشد.
    - دکمه‌ها رندر می‌شوند اما کلیک‌ها کاری نمی‌کنند: بررسی کنید `AllowedUntrustedInternalConnections` در پیکربندی سرور Mattermost شامل `127.0.0.1 localhost` باشد، و `EnablePostActionIntegration` در ServiceSettings برابر `true` باشد.
    - دکمه‌ها هنگام کلیک 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. router کنش Mattermost روی شناسه‌های غیر الفبایی‌عددی خراب می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - logهای Gateway مقدار `invalid _token` را نشان می‌دهند: عدم تطابق HMAC. بررسی کنید که همه فیلدهای context را امضا می‌کنید (نه یک زیرمجموعه)، از کلیدهای مرتب‌شده استفاده می‌کنید و JSON فشرده (بدون فاصله) به‌کار می‌برید. بخش HMAC بالا را ببینید.
    - logهای Gateway مقدار `missing _token in context` را نشان می‌دهند: فیلد `_token` در context دکمه نیست. هنگام ساخت Payload یکپارچه‌سازی، مطمئن شوید که درج شده است.
    - تأیید، شناسه خام را به‌جای نام دکمه نشان می‌دهد: `context.action_id` با `id` دکمه مطابقت ندارد. هر دو را روی همان مقدار پاک‌سازی‌شده تنظیم کنید.
    - عامل از دکمه‌ها خبر ندارد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و gate کردن mention
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
