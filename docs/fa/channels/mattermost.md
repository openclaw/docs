---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T09:03:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود (توکن بات + رویدادهای WebSocket). کانال‌ها، گروه‌ها و DMها پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی قابل میزبانی شخصی است؛ برای جزئیات محصول و دانلودها، سایت رسمی را در [mattermost.com](https://mattermost.com) ببینید.

## نصب

پیش از پیکربندی کانال، Mattermost را نصب کنید:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="Ensure plugin is available">
    نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه خود دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با فرمان‌های بالا به‌صورت دستی اضافه کنند.
  </Step>
  <Step title="Create a Mattermost bot">
    یک حساب بات Mattermost بسازید و **توکن بات** را کپی کنید.
  </Step>
  <Step title="Copy the base URL">
    **نشانی پایه** Mattermost را کپی کنید (برای مثال، `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

## دستورهای slash بومی

دستورهای slash بومی اختیاری هستند. وقتی فعال شوند، OpenClaw دستورهای slash با نام `oc_*` را از طریق API Mattermost ثبت می‌کند و POSTهای callback را روی سرور HTTP Gateway دریافت می‌کند.

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
  <Accordion title="Behavior notes">
    - مقدار `native: "auto"` برای Mattermost به‌طور پیش‌فرض غیرفعال است. برای فعال‌سازی، `native: true` را تنظیم کنید.
    - اگر `callbackUrl` حذف شود، OpenClaw آن را از میزبان/درگاه Gateway + `callbackPath` استخراج می‌کند.
    - برای راه‌اندازی‌های چندحسابی، `commands` می‌تواند در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم شود (مقادیر حساب، فیلدهای سطح بالا را بازنویسی می‌کنند).
    - callbackهای دستور با توکن‌های مختص هر دستور که هنگام ثبت دستورهای `oc_*` توسط OpenClaw از Mattermost بازگردانده می‌شوند، اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر callback، ثبت فعلی دستور Mattermost را تازه‌سازی می‌کند تا توکن‌های منسوخِ دستورهای slash حذف‌شده یا بازتولیدشده بدون راه‌اندازی مجدد Gateway دیگر پذیرفته نشوند.
    - اگر API Mattermost نتواند تأیید کند که دستور هنوز جاری است، اعتبارسنجی callback به‌صورت بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی cache می‌شوند، جست‌وجوهای هم‌زمان ادغام می‌شوند، و شروع جست‌وجوی تازه برای هر دستور rate-limit می‌شود تا فشار replay محدود بماند.
    - callbackهای slash وقتی ثبت ناموفق بوده، راه‌اندازی ناقص بوده، یا توکن callback با توکن ثبت‌شده دستور resolve‌شده مطابقت ندارد، به‌صورت بسته شکست می‌خورند (توکنی که برای یک دستور معتبر است نمی‌تواند برای دستور دیگری به اعتبارسنجی upstream برسد).

  </Accordion>
  <Accordion title="Reachability requirement">
    endpoint مربوط به callback باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید مگر اینکه Mattermost روی همان میزبان/namespace شبکه‌ای OpenClaw اجرا شود.
    - `callbackUrl` را روی نشانی پایه Mattermost خود تنظیم نکنید مگر اینکه آن نشانی، `/api/channels/mattermost/command` را با reverse proxy به OpenClaw هدایت کند.
    - یک بررسی سریع `curl https://<gateway-host>/api/channels/mattermost/command` است؛ درخواست GET باید از OpenClaw پاسخ `405 Method Not Allowed` برگرداند، نه `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    اگر callback شما آدرس‌های خصوصی/tailnet/داخلی را هدف می‌گیرد، مقدار `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost را طوری تنظیم کنید که میزبان/دامنه callback را شامل شود.

    از ورودی‌های میزبان/دامنه استفاده کنید، نه URL کامل.

    - خوب: `gateway.tailnet-name.ts.net`
    - بد: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی (حساب پیش‌فرض)

اگر env varها را ترجیح می‌دهید، این‌ها را روی میزبان Gateway تنظیم کنید:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
env varها فقط روی حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر پیکربندی استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در Workspace](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های چت

Mattermost به‌صورت خودکار به DMها پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (default)">
    فقط وقتی در کانال‌ها @mention شد پاسخ بده.
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

نکته‌ها:

- `onchar` همچنان به @mentionهای صریح پاسخ می‌دهد.
- `channels.mattermost.requireMention` برای پیکربندی‌های قدیمی رعایت می‌شود، اما `chatmode` ترجیح داده می‌شود.

## رشته‌ها و sessionها

از `channels.mattermost.replyToMode` استفاده کنید تا کنترل کنید پاسخ‌های کانال و گروه در کانال اصلی بمانند یا زیر پست triggerکننده یک thread شروع کنند.

- `off` (پیش‌فرض): فقط وقتی پست ورودی از قبل داخل یک thread است، در thread پاسخ بده.
- `first`: برای پست‌های سطح بالای کانال/گروه، زیر همان پست یک thread شروع کن و گفتگو را به یک session محدود به thread هدایت کن.
- `all`: برای Mattermost فعلاً همان رفتار `first` را دارد.
- پیام‌های مستقیم این تنظیم را نادیده می‌گیرند و بدون thread می‌مانند.

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

نکته‌ها:

- sessionهای محدود به thread از id پست triggerکننده به‌عنوان ریشه thread استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل‌اند، چون وقتی Mattermost یک ریشه thread داشته باشد، chunkهای پیگیری و رسانه‌ها در همان thread ادامه پیدا می‌کنند.

## کنترل دسترسی (DMها)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستنده‌های ناشناس یک کد pairing دریافت می‌کنند).
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMهای عمومی: `channels.mattermost.dmPolicy="open"` به‌همراه `channels.mattermost.allowFrom=["*"]`.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (محدودشده با mention).
- فرستنده‌ها را با `channels.mattermost.groupAllowFrom` در allowlist قرار دهید (شناسه‌های کاربری توصیه می‌شوند).
- بازنویسی‌های mention برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` یا برای مقدار پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention` قرار می‌گیرند.
- تطبیق `@username` تغییرپذیر است و فقط وقتی `channels.mattermost.dangerouslyAllowNameMatching: true` فعال باشد، فعال می‌شود.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (محدودشده با mention).
- نکته runtime: اگر `channels.mattermost` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` fallback می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

نمونه:

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
- `user:<id>` برای یک DM
- `@username` برای یک DM (از طریق API Mattermost resolve می‌شود)

<Warning>
شناسه‌های opaque بدون پیشوند (مانند `64ifufp...`) در Mattermost **مبهم** هستند (شناسه کاربر در برابر شناسه کانال).

OpenClaw آن‌ها را **اول به‌عنوان کاربر** resolve می‌کند:

- اگر ID به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با resolve کردن کانال مستقیم از طریق `/api/v4/channels/direct` یک **DM** می‌فرستد.
- در غیر این صورت، ID به‌عنوان **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح (`user:<id>` / `channel:<id>`) استفاده کنید.
</Warning>

## تلاش دوباره برای کانال DM

وقتی OpenClaw به یک هدف DM در Mattermost پیام می‌فرستد و ابتدا باید کانال مستقیم را resolve کند، به‌طور پیش‌فرض شکست‌های گذرای ایجاد کانال مستقیم را دوباره تلاش می‌کند.

برای تنظیم این رفتار به‌صورت سراسری برای Plugin Mattermost از `channels.mattermost.dmChannelRetry`، یا برای یک حساب از `channels.mattermost.accounts.<id>.dmChannelRetry` استفاده کنید.

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

نکته‌ها:

- این فقط روی ایجاد کانال DM (`/api/v4/channels/direct`) اعمال می‌شود، نه هر فراخوانی API Mattermost.
- تلاش‌های دوباره روی شکست‌های گذرا مانند rate limitها، پاسخ‌های 5xx و خطاهای شبکه یا timeout اعمال می‌شوند.
- خطاهای client از نوع 4xx به‌جز `429` دائمی در نظر گرفته می‌شوند و دوباره تلاش نمی‌شوند.

## استریم پیش‌نمایش

Mattermost فرایند فکر کردن، فعالیت ابزار و متن پاسخ جزئی را در یک **پست پیش‌نویس پیش‌نمایش** واحد stream می‌کند که وقتی پاسخ نهایی برای ارسال امن باشد، در همان‌جا نهایی می‌شود. پیش‌نمایش به‌جای پر کردن کانال با پیام‌های هر chunk، روی همان post id به‌روزرسانی می‌شود. خروجی‌های نهایی رسانه/خطا، ویرایش‌های معلق پیش‌نمایش را لغو می‌کنند و به‌جای flush کردن یک پست پیش‌نمایش دورریختنی، از تحویل عادی استفاده می‌کنند.

فعال‌سازی از طریق `channels.mattermost.streaming`:

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
  <Accordion title="Streaming modes">
    - `partial` انتخاب معمول است: یک پست پیش‌نمایش که با رشد پاسخ ویرایش می‌شود، سپس با پاسخ کامل نهایی می‌شود.
    - `block` از chunkهای پیش‌نویس به سبک append داخل پست پیش‌نمایش استفاده می‌کند.
    - `progress` هنگام تولید، یک پیش‌نمایش وضعیت نشان می‌دهد و فقط پس از تکمیل، پاسخ نهایی را پست می‌کند.
    - `off` استریم پیش‌نمایش را غیرفعال می‌کند.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - اگر stream نتواند در همان‌جا نهایی شود (برای مثال پست در میانه stream حذف شده باشد)، OpenClaw به ارسال یک پست نهایی تازه fallback می‌کند تا پاسخ هرگز از دست نرود.
    - payloadهای فقط reasoning از پست‌های کانال حذف می‌شوند، از جمله متنی که به‌صورت blockquote با `> Reasoning:` می‌رسد. برای دیدن تفکر در سطح‌های دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، [Streaming](/fa/concepts/streaming#preview-streaming-modes) را ببینید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مانند `thumbsup` یا `:+1:` را می‌پذیرد (دو نقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (boolean) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای سیستمی به session عامل routeشده فوروارد می‌شوند.

نمونه‌ها:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال کردن کنش‌های واکنش (پیش‌فرض true).
- بازنویسی برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربر روی دکمه‌ای کلیک می‌کند، عامل انتخاب را دریافت می‌کند و می‌تواند پاسخ دهد.

با افزودن `inlineButtons` به قابلیت‌های کانال، دکمه‌ها را فعال کنید:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

از `message action=send` با پارامتر `buttons` استفاده کنید. دکمه‌ها یک آرایه دوبعدی هستند (ردیف‌های دکمه‌ها):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

فیلدهای دکمه:

<ParamField path="text" type="string" required>
  برچسب نمایشی.
</ParamField>
<ParamField path="callback_data" type="string" required>
  مقداری که هنگام کلیک بازفرستاده می‌شود (به‌عنوان شناسهٔ کنش استفاده می‌شود).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  سبک دکمه.
</ParamField>

وقتی کاربری روی دکمه‌ای کلیک می‌کند:

<Steps>
  <Step title="دکمه‌ها با تأیید جایگزین می‌شوند">
    همهٔ دکمه‌ها با یک خط تأیید جایگزین می‌شوند (مثلاً، "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent انتخاب را دریافت می‌کند">
    Agent انتخاب را به‌صورت یک پیام ورودی دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="نکات پیاده‌سازی">
    - بازخوانی‌های دکمه از راستی‌آزمایی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - Mattermost دادهٔ بازخوانی را از پاسخ‌های API خود حذف می‌کند (قابلیت امنیتی)، بنابراین هنگام کلیک همهٔ دکمه‌ها حذف می‌شوند - حذف جزئی ممکن نیست.
    - شناسه‌های کنشی که خط تیره یا زیرخط دارند به‌صورت خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).

  </Accordion>
  <Accordion title="پیکربندی و دسترس‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. `"inlineButtons"` را اضافه کنید تا توضیح ابزار دکمه‌ها در system prompt مربوط به agent فعال شود.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایهٔ خارجی اختیاری برای بازخوانی‌های دکمه (برای نمونه `https://gateway.example.com`). زمانی از این استفاده کنید که Mattermost نتواند مستقیماً در میزبان bind خود به gateway دسترسی پیدا کند.
    - در راه‌اندازی‌های چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` هم تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw نشانی بازخوانی را از `gateway.customBindHost` + `gateway.port` استخراج می‌کند و سپس به `http://localhost:<port>` برمی‌گردد.
    - قانون دسترس‌پذیری: نشانی بازخوانی دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط زمانی کار می‌کند که Mattermost و OpenClaw روی همان میزبان/فضای نام شبکه اجرا شوند.
    - اگر مقصد بازخوانی شما خصوصی/tailnet/داخلی است، میزبان/دامنهٔ آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌های خارجی و webhooks می‌توانند به‌جای عبور از ابزار `message` متعلق به agent، دکمه‌ها را مستقیماً از طریق Mattermost REST API ارسال کنند. در صورت امکان از `buildButtonAttachments()` در Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را دنبال کنید:

**ساختار payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
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

1. پیوست‌ها باید در `props.attachments` قرار بگیرند، نه در `attachments` سطح بالا (بی‌صدا نادیده گرفته می‌شود).
2. هر کنش به `type: "button"` نیاز دارد - بدون آن، کلیک‌ها بی‌صدا بلعیده می‌شوند.
3. هر کنش به یک فیلد `id` نیاز دارد - Mattermost کنش‌های بدون شناسه را نادیده می‌گیرد.
4. `id` کنش باید **فقط الفبایی‌عددی** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی کنش سمت سرور Mattermost را خراب می‌کنند (۴۰۴ برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد تا پیام تأیید، نام دکمه (مثلاً "Approve") را به‌جای یک شناسهٔ خام نشان دهد.
6. `context.action_id` الزامی است - handler تعامل بدون آن ۴۰۰ برمی‌گرداند.

</Warning>

**تولید توکن HMAC**

gateway کلیک‌های دکمه را با HMAC-SHA256 راستی‌آزمایی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق راستی‌آزمایی gateway مطابقت داشته باشند:

<Steps>
  <Step title="استخراج secret از توکن bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="ساخت شیء context">
    شیء context را با همهٔ فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    با **کلیدهای مرتب‌شده** و **بدون فاصله** سریال‌سازی کنید (gateway از `JSON.stringify` با کلیدهای مرتب‌شده استفاده می‌کند که خروجی فشرده تولید می‌کند).
  </Step>
  <Step title="امضای payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    چکیدهٔ hex حاصل را به‌عنوان `_token` در context اضافه کنید.
  </Step>
</Steps>

نمونهٔ Python:

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
  <Accordion title="دام‌های رایج HMAC">
    - `json.dumps` در Python به‌صورت پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای تطبیق با خروجی فشردهٔ JavaScript از `separators=(",", ":")` استفاده کنید (`{"key":"val"}`).
    - همیشه **همهٔ** فیلدهای context را امضا کنید (به‌جز `_token`). gateway ابتدا `_token` را حذف می‌کند و سپس هرچه باقی مانده را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌صدای راستی‌آزمایی می‌شود.
    - از `sort_keys=True` استفاده کنید - gateway پیش از امضا کلیدها را مرتب می‌کند و Mattermost ممکن است هنگام ذخیرهٔ payload ترتیب فیلدهای context را تغییر دهد.
    - secret را از توکن bot استخراج کنید (قطعی)، نه از بایت‌های تصادفی. secret باید در فرایندی که دکمه‌ها را می‌سازد و gatewayای که راستی‌آزمایی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتر دایرکتوری

Plugin مربوط به Mattermost شامل یک آداپتر دایرکتوری است که نام کانال‌ها و کاربران را از طریق Mattermost API حل می‌کند. این کار هدف‌های `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های cron/webhook فعال می‌کند.

هیچ پیکربندی‌ای لازم نیست - آداپتر از توکن bot موجود در پیکربندی حساب استفاده می‌کند.

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
  <Accordion title="نبود پاسخ در کانال‌ها">
    مطمئن شوید bot در کانال است و آن را mention کنید (oncall)، از یک پیشوند trigger استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن bot، نشانی پایه و فعال بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای محیطی فقط روی حساب `default` اعمال می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های slash بومی شکست می‌خورند">
    - `Unauthorized: invalid command token.`: OpenClaw توکن بازخوانی را نپذیرفت. علت‌های معمول:
      - ثبت فرمان slash در زمان راه‌اندازی شکست خورده یا فقط بخشی از آن کامل شده است
      - بازخوانی به gateway/حساب اشتباه برخورد می‌کند
      - Mattermost هنوز فرمان‌های قدیمی‌ای دارد که به مقصد بازخوانی قبلی اشاره می‌کنند
      - gateway بدون فعال‌سازی دوبارهٔ فرمان‌های slash راه‌اندازی مجدد شده است
    - اگر فرمان‌های slash بومی از کار افتادند، گزارش‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده و گزارش‌ها هشدار می‌دهند که بازخوانی به `http://127.0.0.1:18789/...` تبدیل شده است، آن نشانی احتمالاً فقط زمانی قابل دسترسی است که Mattermost روی همان میزبان/فضای نام شبکهٔ OpenClaw اجرا شود. به‌جای آن یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌صورت کادرهای سفید ظاهر می‌شوند: ممکن است agent دادهٔ دکمهٔ بدشکل ارسال کند. بررسی کنید که هر دکمه هر دو فیلد `text` و `callback_data` را داشته باشد.
    - دکمه‌ها رندر می‌شوند اما کلیک‌ها کاری نمی‌کنند: بررسی کنید `AllowedUntrustedInternalConnections` در پیکربندی سرور Mattermost شامل `127.0.0.1 localhost` باشد و `EnablePostActionIntegration` در ServiceSettings برابر `true` باشد.
    - دکمه‌ها هنگام کلیک ۴۰۴ برمی‌گردانند: احتمالاً `id` دکمه خط تیره یا زیرخط دارد. مسیریاب کنش Mattermost روی شناسه‌های غیرالفبایی‌عددی خراب می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - گزارش‌های Gateway می‌گویند `invalid _token`: عدم تطابق HMAC. بررسی کنید همهٔ فیلدهای context را امضا می‌کنید (نه یک زیرمجموعه)، از کلیدهای مرتب‌شده استفاده می‌کنید، و JSON فشرده (بدون فاصله) به کار می‌برید. بخش HMAC بالا را ببینید.
    - گزارش‌های Gateway می‌گویند `missing _token in context`: فیلد `_token` در context دکمه نیست. هنگام ساخت payload یکپارچه‌سازی مطمئن شوید که شامل شده است.
    - تأیید، شناسهٔ خام را به‌جای نام دکمه نشان می‌دهد: `context.action_id` با `id` دکمه مطابقت ندارد. هر دو را روی همان مقدار پاک‌سازی‌شده تنظیم کنید.
    - Agent از دکمه‌ها خبر ندارد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و گیت mention
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
