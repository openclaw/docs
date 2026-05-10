---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی بات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin قابل دانلود (توکن ربات + رویدادهای WebSocket). کانال‌ها، گروه‌ها و DMها پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی قابل میزبانی شخصی است؛ برای جزئیات محصول و دانلودها، وب‌سایت رسمی را در [mattermost.com](https://mattermost.com) ببینید.

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

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="Ensure plugin is available">
    انتشارهای بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را به‌صورت دستی با دستورهای بالا اضافه کنند.
  </Step>
  <Step title="Create a Mattermost bot">
    یک حساب ربات Mattermost بسازید و **توکن ربات** را کپی کنید.
  </Step>
  <Step title="Copy the base URL">
    **base URL** مربوط به Mattermost را کپی کنید (مثلاً `https://chat.example.com`).
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

دستورهای slash بومی اختیاری هستند. وقتی فعال شوند، OpenClaw دستورهای slash با پیشوند `oc_*` را از طریق Mattermost API ثبت می‌کند و POSTهای callback را روی سرور HTTP Gateway دریافت می‌کند.

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
    - `native: "auto"` برای Mattermost به‌صورت پیش‌فرض غیرفعال است. برای فعال‌سازی، `native: true` را تنظیم کنید.
    - اگر `callbackUrl` حذف شود، OpenClaw آن را از میزبان/پورت Gateway + `callbackPath` استخراج می‌کند.
    - برای راه‌اندازی‌های چندحسابی، `commands` می‌تواند در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم شود (مقادیر حساب، فیلدهای سطح بالا را override می‌کنند).
    - callbackهای دستور با توکن‌های مخصوص هر دستور که هنگام ثبت دستورهای `oc_*` توسط OpenClaw از Mattermost برگردانده می‌شوند، اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر callback، ثبت فعلی دستور Mattermost را تازه‌سازی می‌کند تا توکن‌های منسوخ مربوط به دستورهای slash حذف‌شده یا بازتولیدشده بدون نیاز به راه‌اندازی دوباره Gateway پذیرفته نشوند.
    - اگر Mattermost API نتواند تأیید کند که دستور هنوز فعلی است، اعتبارسنجی callback به‌صورت بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی cache می‌شوند، lookupهای هم‌زمان ادغام می‌شوند، و شروع lookup تازه برای هر دستور rate-limit می‌شود تا فشار replay محدود بماند.
    - callbackهای slash وقتی ثبت شکست خورده باشد، startup ناقص بوده باشد، یا توکن callback با توکن ثبت‌شده دستور resolve‌شده مطابقت نداشته باشد، به‌صورت بسته شکست می‌خورند (توکنی که برای یک دستور معتبر است نمی‌تواند برای دستور دیگری به اعتبارسنجی upstream برسد).

  </Accordion>
  <Accordion title="Reachability requirement">
    endpoint مربوط به callback باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید، مگر اینکه Mattermost روی همان میزبان/namespace شبکه‌ای OpenClaw اجرا شود.
    - `callbackUrl` را روی base URL مربوط به Mattermost خود تنظیم نکنید، مگر اینکه آن URL مسیر `/api/channels/mattermost/command` را به OpenClaw reverse-proxy کند.
    - یک بررسی سریع این است: `curl https://<gateway-host>/api/channels/mattermost/command`؛ یک GET باید از OpenClaw مقدار `405 Method Not Allowed` برگرداند، نه `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    اگر callback شما نشانی‌های خصوصی/tailnet/داخلی را هدف می‌گیرد، مقدار `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost را طوری تنظیم کنید که میزبان/دامنه callback را شامل شود.

    از ورودی‌های میزبان/دامنه استفاده کنید، نه URLهای کامل.

    - خوب: `gateway.tailnet-name.ts.net`
    - بد: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی (حساب پیش‌فرض)

اگر env varها را ترجیح می‌دهید، این‌ها را روی میزبان Gateway تنظیم کنید:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
env varها فقط روی حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر config استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در Workspace](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های chat

Mattermost به‌صورت خودکار به DMها پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (default)">
    در کانال‌ها فقط وقتی @mention شود پاسخ می‌دهد.
  </Tab>
  <Tab title="onmessage">
    به هر پیام کانال پاسخ می‌دهد.
  </Tab>
  <Tab title="onchar">
    وقتی پیام با یک پیشوند trigger شروع شود پاسخ می‌دهد.
  </Tab>
</Tabs>

نمونه config:

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
- `channels.mattermost.requireMention` برای configهای legacy رعایت می‌شود، اما `chatmode` ترجیح داده می‌شود.

## Threading و sessionها

از `channels.mattermost.replyToMode` استفاده کنید تا کنترل کنید پاسخ‌های کانال و گروه در کانال اصلی بمانند یا یک thread زیر پست triggerکننده شروع کنند.

- `off` (پیش‌فرض): فقط زمانی در thread پاسخ می‌دهد که پست ورودی از قبل داخل یک thread باشد.
- `first`: برای پست‌های سطح بالای کانال/گروه، یک thread زیر همان پست شروع می‌کند و مکالمه را به یک session با scope همان thread هدایت می‌کند.
- `all`: برای Mattermost در حال حاضر همان رفتار `first` را دارد.
- پیام‌های مستقیم این تنظیم را نادیده می‌گیرند و غیر-threaded باقی می‌مانند.

نمونه config:

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

- sessionهای با scope thread از شناسه پست triggerکننده به‌عنوان ریشه thread استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل هستند، چون وقتی Mattermost یک ریشه thread داشته باشد، chunkها و mediaهای بعدی در همان thread ادامه می‌یابند.

## کنترل دسترسی (DMها)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستنده‌های ناشناس یک کد pairing دریافت می‌کنند).
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMهای عمومی: `channels.mattermost.dmPolicy="open"` به‌همراه `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (وابسته به mention).
- فرستنده‌ها را با `channels.mattermost.groupAllowFrom` در allowlist قرار دهید (شناسه‌های کاربر توصیه می‌شوند).
- `channels.mattermost.groupAllowFrom` ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.
- overrideهای mention برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` یا برای یک پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention` قرار می‌گیرند.
- تطبیق `@username` تغییرپذیر است و فقط وقتی `channels.mattermost.dangerouslyAllowNameMatching: true` باشد فعال می‌شود.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (وابسته به mention).
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

## targetها برای تحویل خروجی

از این فرمت‌های target با `openclaw message send` یا cron/webhookها استفاده کنید:

- `channel:<id>` برای یک کانال
- `user:<id>` برای یک DM
- `@username` برای یک DM (از طریق Mattermost API resolve می‌شود)

<Warning>
IDهای opaque بدون پیشوند (مثل `64ifufp...`) در Mattermost **مبهم** هستند (شناسه کاربر در برابر شناسه کانال).

OpenClaw آن‌ها را **ابتدا به‌عنوان کاربر** resolve می‌کند:

- اگر ID به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با resolve کردن کانال مستقیم از طریق `/api/v4/channels/direct` یک **DM** می‌فرستد.
- در غیر این صورت، ID به‌عنوان **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح (`user:<id>` / `channel:<id>`) استفاده کنید.
</Warning>

## retry کانال DM

وقتی OpenClaw به یک target از نوع DM در Mattermost ارسال می‌کند و لازم است ابتدا کانال مستقیم را resolve کند، به‌صورت پیش‌فرض شکست‌های گذرای ساخت کانال مستقیم را retry می‌کند.

از `channels.mattermost.dmChannelRetry` برای تنظیم سراسری این رفتار برای Plugin Mattermost استفاده کنید، یا از `channels.mattermost.accounts.<id>.dmChannelRetry` برای یک حساب.

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

- این فقط روی ساخت کانال DM (`/api/v4/channels/direct`) اعمال می‌شود، نه هر فراخوانی Mattermost API.
- retryها روی شکست‌های گذرا مثل rate limitها، پاسخ‌های 5xx، و خطاهای شبکه یا timeout اعمال می‌شوند.
- خطاهای client از نوع 4xx به‌جز `429` دائمی در نظر گرفته می‌شوند و retry نمی‌شوند.

## استریم پیش‌نمایش

Mattermost thinking، فعالیت ابزار، و متن پاسخ جزئی را در یک **پست پیش‌نمایش draft** واحد stream می‌کند که وقتی پاسخ نهایی برای ارسال امن باشد، درجا نهایی می‌شود. پیش‌نمایش روی همان شناسه پست به‌روزرسانی می‌شود، به‌جای اینکه کانال را با پیام‌های جداگانه برای هر chunk شلوغ کند. نهایی‌های media/error ویرایش‌های pending پیش‌نمایش را لغو می‌کنند و به‌جای flush کردن یک پست پیش‌نمایش دورریختنی، از تحویل عادی استفاده می‌کنند.

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
  <Accordion title="Streaming modes">
    - `partial` انتخاب معمول است: یک پست پیش‌نمایش که با رشد پاسخ ویرایش می‌شود، سپس با پاسخ کامل نهایی می‌شود.
    - `block` از chunkهای draft با سبک append داخل پست پیش‌نمایش استفاده می‌کند.
    - `progress` هنگام تولید، یک پیش‌نمایش وضعیت نشان می‌دهد و فقط در پایان پاسخ نهایی را ارسال می‌کند.
    - `off` استریم پیش‌نمایش را غیرفعال می‌کند.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - اگر stream نتواند درجا نهایی شود (برای مثال پست در میانه stream حذف شده باشد)، OpenClaw به ارسال یک پست نهایی تازه fallback می‌کند تا پاسخ هرگز از دست نرود.
    - payloadهای فقط reasoning از پست‌های کانال حذف می‌شوند، از جمله متنی که به‌صورت blockquote با `> Reasoning:` می‌رسد. برای دیدن thinking در سطح‌های دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، [Streaming](/fa/concepts/streaming#preview-streaming-modes) را ببینید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مثل `thumbsup` یا `:+1:` را می‌پذیرد (colonها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (boolean) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای system به session عامل route‌شده forward می‌شوند.

مثال‌ها:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: کنش‌های واکنش را فعال/غیرفعال می‌کند (پیش‌فرض true).
- override برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربر روی یک دکمه کلیک کند، عامل انتخاب را دریافت می‌کند و می‌تواند پاسخ دهد.

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

از `message action=send` با پارامتر `buttons` استفاده کنید. دکمه‌ها یک آرایه دوبعدی هستند (ردیف‌های دکمه‌ها):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

فیلدهای دکمه:

<ParamField path="text" type="string" required>
  برچسب نمایشی.
</ParamField>
<ParamField path="callback_data" type="string" required>
  مقداری که هنگام کلیک بازگردانده می‌شود (به‌عنوان شناسهٔ کنش استفاده می‌شود).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  سبک دکمه.
</ParamField>

وقتی کاربر روی دکمه‌ای کلیک می‌کند:

<Steps>
  <Step title="دکمه‌ها با تأیید جایگزین می‌شوند">
    همهٔ دکمه‌ها با یک خط تأیید جایگزین می‌شوند (مثلاً، "✓ **Yes** selected by @user").
  </Step>
  <Step title="عامل انتخاب را دریافت می‌کند">
    عامل انتخاب را به‌عنوان یک پیام ورودی دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="یادداشت‌های پیاده‌سازی">
    - فراخوان‌های بازگشتی دکمه از راستی‌آزمایی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - Mattermost دادهٔ فراخوان بازگشتی را از پاسخ‌های API خود حذف می‌کند (ویژگی امنیتی)، بنابراین با کلیک، همهٔ دکمه‌ها حذف می‌شوند - حذف جزئی ممکن نیست.
    - شناسه‌های کنشی که دارای خط تیره یا زیرخط هستند به‌صورت خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).

  </Accordion>
  <Accordion title="پیکربندی و دسترسی‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال کردن توضیح ابزار دکمه‌ها در پرامپت سیستم عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایهٔ خارجی اختیاری برای فراخوان‌های بازگشتی دکمه (برای مثال `https://gateway.example.com`). زمانی از این استفاده کنید که Mattermost نتواند مستقیماً از طریق میزبان اتصالش به Gateway دسترسی داشته باشد.
    - در راه‌اندازی‌های چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw نشانی فراخوان بازگشتی را از `gateway.customBindHost` + `gateway.port` می‌سازد، سپس به `http://localhost:<port>` برمی‌گردد.
    - قاعدهٔ دسترسی‌پذیری: نشانی فراخوان بازگشتی دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط زمانی کار می‌کند که Mattermost و OpenClaw روی همان میزبان/فضای نام شبکه اجرا شوند.
    - اگر مقصد فراخوان بازگشتی شما خصوصی/tailnet/داخلی است، میزبان/دامنهٔ آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌های خارجی و Webhookها می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق Mattermost REST API ارسال کنند. در صورت امکان از `buildButtonAttachments()` متعلق به Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را دنبال کنید:

**ساختار بار داده:**

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

1. پیوست‌ها در `props.attachments` قرار می‌گیرند، نه `attachments` در سطح بالا (بی‌صدا نادیده گرفته می‌شود).
2. هر کنش به `type: "button"` نیاز دارد - بدون آن، کلیک‌ها بی‌صدا بلعیده می‌شوند.
3. هر کنش به فیلد `id` نیاز دارد - Mattermost کنش‌های بدون شناسه را نادیده می‌گیرد.
4. `id` کنش باید **فقط الفبایی‌عددی** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی کنش سمت سرور Mattermost را خراب می‌کنند (404 برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد تا پیام تأیید نام دکمه (مثلاً "Approve") را به‌جای یک شناسهٔ خام نشان دهد.
6. `context.action_id` الزامی است - گردانندهٔ تعامل بدون آن 400 برمی‌گرداند.

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 راستی‌آزمایی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق راستی‌آزمایی Gateway مطابقت داشته باشد:

<Steps>
  <Step title="استخراج راز از توکن ربات">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="ساخت شیء زمینه">
    شیء زمینه را با همهٔ فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    با **کلیدهای مرتب‌شده** و **بدون فاصله** سریال‌سازی کنید (Gateway از `JSON.stringify` با کلیدهای مرتب‌شده استفاده می‌کند که خروجی فشرده تولید می‌کند).
  </Step>
  <Step title="امضای بار داده">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    چکیدهٔ هگز حاصل را به‌عنوان `_token` در زمینه اضافه کنید.
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
    - `json.dumps` در Python به‌صورت پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای تطبیق با خروجی فشردهٔ JavaScript (`{"key":"val"}`) از `separators=(",", ":")` استفاده کنید.
    - همیشه **همهٔ** فیلدهای زمینه را امضا کنید (منهای `_token`). Gateway ابتدا `_token` را حذف می‌کند و سپس هرچه باقی می‌ماند را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌صدای راستی‌آزمایی می‌شود.
    - از `sort_keys=True` استفاده کنید - Gateway پیش از امضا کلیدها را مرتب می‌کند و Mattermost ممکن است هنگام ذخیرهٔ بار داده ترتیب فیلدهای زمینه را تغییر دهد.
    - راز را از توکن ربات استخراج کنید (قطعی)، نه از بایت‌های تصادفی. راز باید در فرایندی که دکمه‌ها را می‌سازد و Gateway که راستی‌آزمایی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور فهرست

Plugin Mattermost شامل یک آداپتور فهرست است که نام‌های کانال و کاربر را از طریق Mattermost API resolve می‌کند. این کار مقصدهای `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های cron/webhook فعال می‌کند.

هیچ پیکربندی‌ای لازم نیست - آداپتور از توکن ربات موجود در پیکربندی حساب استفاده می‌کند.

## چندحسابی

Mattermost از چندین حساب زیر `channels.mattermost.accounts` پشتیبانی می‌کند:

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
    مطمئن شوید ربات در کانال است و آن را mention کنید (oncall)، از یک پیشوند trigger استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن ربات، نشانی پایه، و فعال بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای env فقط برای حساب `default` اعمال می‌شوند.

  </Accordion>
  <Accordion title="دستورهای slash بومی شکست می‌خورند">
    - `Unauthorized: invalid command token.`: OpenClaw توکن فراخوان بازگشتی را نپذیرفت. علت‌های معمول:
      - ثبت دستور slash هنگام راه‌اندازی شکست خورده یا فقط به‌صورت جزئی کامل شده است
      - فراخوان بازگشتی به Gateway/حساب اشتباه می‌خورد
      - Mattermost هنوز دستورهای قدیمی دارد که به یک مقصد فراخوان بازگشتی قبلی اشاره می‌کنند
      - Gateway بدون فعال‌سازی دوبارهٔ دستورهای slash راه‌اندازی مجدد شده است
    - اگر دستورهای slash بومی از کار افتادند، لاگ‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده و لاگ‌ها هشدار می‌دهند که فراخوان بازگشتی به `http://127.0.0.1:18789/...` resolve شده است، احتمالاً آن نشانی فقط زمانی قابل دسترسی است که Mattermost روی همان میزبان/فضای نام شبکهٔ OpenClaw اجرا شود. به‌جای آن یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌صورت کادرهای سفید ظاهر می‌شوند: عامل ممکن است دادهٔ دکمهٔ بدشکل ارسال کرده باشد. بررسی کنید هر دکمه هر دو فیلد `text` و `callback_data` را داشته باشد.
    - دکمه‌ها render می‌شوند اما کلیک‌ها کاری انجام نمی‌دهند: بررسی کنید `AllowedUntrustedInternalConnections` در پیکربندی سرور Mattermost شامل `127.0.0.1 localhost` باشد، و `EnablePostActionIntegration` در ServiceSettings برابر `true` باشد.
    - دکمه‌ها هنگام کلیک 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. مسیریاب کنش Mattermost روی شناسه‌های غیرالفبایی‌عددی خراب می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - لاگ‌های Gateway می‌گویند `invalid _token`: عدم تطابق HMAC. بررسی کنید همهٔ فیلدهای زمینه را امضا می‌کنید (نه یک زیرمجموعه)، از کلیدهای مرتب‌شده استفاده می‌کنید، و JSON فشرده (بدون فاصله) به‌کار می‌برید. بخش HMAC بالا را ببینید.
    - لاگ‌های Gateway می‌گویند `missing _token in context`: فیلد `_token` در زمینهٔ دکمه نیست. مطمئن شوید هنگام ساخت بار دادهٔ یکپارچه‌سازی، آن را درج می‌کنید.
    - تأیید به‌جای نام دکمه، شناسهٔ خام نشان می‌دهد: `context.action_id` با `id` دکمه مطابقت ندارد. هر دو را روی همان مقدار پاک‌سازی‌شده تنظیم کنید.
    - عامل از دکمه‌ها اطلاع ندارد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی session برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و گیت mention
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
