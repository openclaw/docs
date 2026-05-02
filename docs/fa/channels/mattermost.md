---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T11:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود (توکن بات + رویدادهای WebSocket). کانال‌ها، گروه‌ها و DMها پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی قابل میزبانی شخصی است؛ برای جزئیات محصول و دانلودها، وب‌سایت رسمی را در [mattermost.com](https://mattermost.com) ببینید.

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
    نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از پیش آن را در خود دارند. نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را به‌صورت دستی اضافه کنند.
  </Step>
  <Step title="Create a Mattermost bot">
    یک حساب بات Mattermost بسازید و **bot token** را کپی کنید.
  </Step>
  <Step title="Copy the base URL">
    **base URL** متعلق به Mattermost را کپی کنید (مثلاً `https://chat.example.com`).
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

دستورهای slash بومی اختیاری هستند. وقتی فعال شوند، OpenClaw دستورهای slash با نام `oc_*` را از طریق API مربوط به Mattermost ثبت می‌کند و POSTهای callback را روی سرور HTTP متعلق به Gateway دریافت می‌کند.

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
    - مقدار `native: "auto"` برای Mattermost به‌صورت پیش‌فرض غیرفعال است. برای فعال‌سازی، `native: true` را تنظیم کنید.
    - اگر `callbackUrl` حذف شود، OpenClaw آن را از میزبان/درگاه Gateway + `callbackPath` استخراج می‌کند.
    - برای راه‌اندازی‌های چندحسابی، `commands` می‌تواند در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم شود (مقادیر حساب، فیلدهای سطح بالا را بازنویسی می‌کنند).
    - Callbackهای دستور با توکن‌های مختص هر دستور که Mattermost هنگام ثبت دستورهای `oc_*` توسط OpenClaw برمی‌گرداند اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر callback، ثبت فعلی دستور Mattermost را تازه‌سازی می‌کند تا توکن‌های قدیمی مربوط به دستورهای slash حذف‌شده یا بازتولیدشده، بدون راه‌اندازی دوباره Gateway دیگر پذیرفته نشوند.
    - اگر API مربوط به Mattermost نتواند تأیید کند که دستور هنوز جاری است، اعتبارسنجی callback به‌صورت بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی cache می‌شوند، جست‌وجوهای هم‌زمان ادغام می‌شوند، و شروع جست‌وجوی تازه برای هر دستور rate-limit می‌شود تا فشار بازپخش محدود بماند.
    - وقتی ثبت ناموفق بوده، شروع کار ناقص بوده، یا توکن callback با توکن ثبت‌شده دستور resolve‌شده مطابقت ندارد، callbackهای slash به‌صورت بسته شکست می‌خورند (توکنی که برای یک دستور معتبر است نمی‌تواند برای دستوری دیگر به اعتبارسنجی upstream برسد).

  </Accordion>
  <Accordion title="Reachability requirement">
    نقطه پایانی callback باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید مگر اینکه Mattermost روی همان میزبان/فضای نام شبکه‌ای OpenClaw اجرا شود.
    - `callbackUrl` را روی base URL مربوط به Mattermost خود تنظیم نکنید مگر اینکه آن URL، مسیر `/api/channels/mattermost/command` را به OpenClaw reverse-proxy کند.
    - یک بررسی سریع `curl https://<gateway-host>/api/channels/mattermost/command` است؛ درخواست GET باید از OpenClaw مقدار `405 Method Not Allowed` برگرداند، نه `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    اگر callback شما نشانی‌های خصوصی/tailnet/داخلی را هدف می‌گیرد، مقدار `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost را طوری تنظیم کنید که میزبان/دامنه callback را شامل شود.

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
Env varها فقط برای حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر پیکربندی استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در workspace](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های چت

Mattermost به DMها به‌صورت خودکار پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (default)">
    فقط وقتی در کانال‌ها @mentioned شده باشد پاسخ بده.
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

## Threading و sessionها

از `channels.mattermost.replyToMode` استفاده کنید تا کنترل کنید پاسخ‌های کانال و گروه در کانال اصلی بمانند یا زیر پست triggerکننده یک thread شروع کنند.

- `off` (پیش‌فرض): فقط وقتی پست ورودی از قبل در یک thread باشد، در thread پاسخ بده.
- `first`: برای پست‌های سطح بالای کانال/گروه، زیر همان پست یک thread شروع کن و گفت‌وگو را به یک session محدود به thread هدایت کن.
- `all`: برای Mattermost در حال حاضر همان رفتار `first` را دارد.
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

- sessionهای محدود به thread از شناسه پست triggerکننده به‌عنوان ریشه thread استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل‌اند، چون وقتی Mattermost یک ریشه thread داشته باشد، قطعه‌های بعدی و رسانه‌ها در همان thread ادامه پیدا می‌کنند.

## کنترل دسترسی (DMها)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستنده‌های ناشناخته یک کد pairing دریافت می‌کنند).
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMهای عمومی: `channels.mattermost.dmPolicy="open"` به‌علاوه `channels.mattermost.allowFrom=["*"]`.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (محدود به mention).
- فرستنده‌ها را با `channels.mattermost.groupAllowFrom` در allowlist قرار دهید (شناسه‌های کاربر توصیه می‌شوند).
- بازنویسی‌های mention برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` یا برای مقدار پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention` قرار می‌گیرند.
- تطبیق `@username` تغییرپذیر است و فقط وقتی `channels.mattermost.dangerouslyAllowNameMatching: true` فعال باشد انجام می‌شود.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (محدود به mention).
- نکته زمان اجرا: اگر `channels.mattermost` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

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

از این قالب‌های هدف با `openclaw message send` یا cron/webhookها استفاده کنید:

- `channel:<id>` برای یک کانال
- `user:<id>` برای یک DM
- `@username` برای یک DM (از طریق API مربوط به Mattermost resolve می‌شود)

<Warning>
شناسه‌های مات opaque بدون پیشوند (مثل `64ifufp...`) در Mattermost **مبهم** هستند (شناسه کاربر در برابر شناسه کانال).

OpenClaw آن‌ها را **اول به‌عنوان کاربر** resolve می‌کند:

- اگر ID به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با resolve کردن کانال مستقیم از طریق `/api/v4/channels/direct` یک **DM** می‌فرستد.
- در غیر این صورت ID به‌عنوان **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح استفاده کنید (`user:<id>` / `channel:<id>`).
</Warning>

## تلاش دوباره کانال DM

وقتی OpenClaw به یک هدف DM در Mattermost ارسال می‌کند و ابتدا باید کانال مستقیم را resolve کند، به‌صورت پیش‌فرض شکست‌های گذرای ایجاد کانال مستقیم را دوباره تلاش می‌کند.

برای تنظیم سراسری این رفتار برای Plugin مربوط به Mattermost از `channels.mattermost.dmChannelRetry` استفاده کنید، یا برای یک حساب از `channels.mattermost.accounts.<id>.dmChannelRetry`.

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

- این فقط برای ایجاد کانال DM (`/api/v4/channels/direct`) اعمال می‌شود، نه هر فراخوانی API مربوط به Mattermost.
- تلاش‌های دوباره برای شکست‌های گذرا مانند محدودیت نرخ، پاسخ‌های 5xx، و خطاهای شبکه یا timeout اعمال می‌شوند.
- خطاهای client از نوع 4xx به‌جز `429` دائمی در نظر گرفته می‌شوند و دوباره تلاش نمی‌شوند.

## Preview streaming

Mattermost فکر کردن، فعالیت ابزار، و متن پاسخ جزئی را در یک **پست draft preview** واحد stream می‌کند که وقتی ارسال پاسخ نهایی امن باشد در همان‌جا نهایی می‌شود. Preview به‌جای پر کردن کانال با پیام‌های جداگانه برای هر قطعه، روی همان شناسه پست به‌روزرسانی می‌شود. نهایی‌سازی‌های رسانه/خطا ویرایش‌های preview در انتظار را لغو می‌کنند و به‌جای flush کردن یک پست preview دورریختنی، از تحویل عادی استفاده می‌کنند.

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
    - `partial` انتخاب معمول است: یک پست preview که با رشد پاسخ ویرایش می‌شود، سپس با پاسخ کامل نهایی می‌شود.
    - `block` از قطعه‌های draft با سبک append داخل پست preview استفاده می‌کند.
    - `progress` هنگام تولید، یک status preview نشان می‌دهد و فقط در پایان، پاسخ نهایی را ارسال می‌کند.
    - `off`، preview streaming را غیرفعال می‌کند.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - اگر stream نتواند در همان‌جا نهایی شود (برای مثال پست در میانه stream حذف شده باشد)، OpenClaw به ارسال یک پست نهایی تازه برمی‌گردد تا پاسخ هرگز از دست نرود.
    - payloadهای فقط reasoning از پست‌های کانال حذف می‌شوند، از جمله متنی که به‌صورت blockquote با `> Reasoning:` می‌رسد. برای دیدن thinking در سطح‌های دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، [Streaming](/fa/concepts/streaming#preview-streaming-modes) را ببینید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مثل `thumbsup` یا `:+1:` را می‌پذیرد (دو نقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (boolean) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای سیستم به session عامل routeشده ارسال می‌شوند.

نمونه‌ها:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال کردن actionهای واکنش (پیش‌فرض true).
- بازنویسی برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربری روی یک دکمه کلیک می‌کند، عامل selection را دریافت می‌کند و می‌تواند پاسخ بدهد.

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

از `message action=send` با پارامتر `buttons` استفاده کنید. دکمه‌ها یک آرایه دوبعدی هستند (ردیف‌هایی از دکمه‌ها):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

فیلدهای دکمه:

<ParamField path="text" type="string" required>
  برچسب نمایشی.
</ParamField>
<ParamField path="callback_data" type="string" required>
  مقداری که هنگام کلیک بازگردانده می‌شود (به‌عنوان شناسهٔ اقدام استفاده می‌شود).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  سبک دکمه.
</ParamField>

وقتی کاربر روی دکمه‌ای کلیک می‌کند:

<Steps>
  <Step title="دکمه‌ها با تأیید جایگزین می‌شوند">
    همهٔ دکمه‌ها با یک خط تأیید جایگزین می‌شوند (برای مثال، "✓ **Yes** selected by @user").
  </Step>
  <Step title="عامل انتخاب را دریافت می‌کند">
    عامل انتخاب را به‌صورت یک پیام ورودی دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="نکات پیاده‌سازی">
    - callbackهای دکمه از راستی‌آزمایی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - Mattermost داده‌های callback را از پاسخ‌های API خود حذف می‌کند (قابلیت امنیتی)، بنابراین همهٔ دکمه‌ها هنگام کلیک حذف می‌شوند — حذف جزئی ممکن نیست.
    - شناسه‌های اقدامی که شامل خط تیره یا زیرخط هستند به‌صورت خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).

  </Accordion>
  <Accordion title="پیکربندی و دسترس‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال‌سازی توضیح ابزار دکمه‌ها در system prompt عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL پایهٔ خارجی اختیاری برای callbackهای دکمه (برای مثال `https://gateway.example.com`). وقتی Mattermost نمی‌تواند مستقیماً به Gateway در میزبان bind آن دسترسی داشته باشد، از این استفاده کنید.
    - در تنظیمات چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw URL callback را از `gateway.customBindHost` + `gateway.port` استخراج می‌کند، سپس به `http://localhost:<port>` برمی‌گردد.
    - قاعدهٔ دسترس‌پذیری: URL callback دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط وقتی کار می‌کند که Mattermost و OpenClaw روی همان میزبان/namespace شبکه اجرا شوند.
    - اگر مقصد callback شما خصوصی/tailnet/داخلی است، میزبان/دامنهٔ آن را به Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌های خارجی و Webhookها می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق API REST Mattermost ارسال کنند. هر وقت ممکن است از `buildButtonAttachments()` در Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را دنبال کنید:

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

1. پیوست‌ها باید در `props.attachments` قرار بگیرند، نه `attachments` سطح بالا (بی‌صدا نادیده گرفته می‌شود).
2. هر action به `type: "button"` نیاز دارد — بدون آن، کلیک‌ها بی‌صدا بلعیده می‌شوند.
3. هر action به فیلد `id` نیاز دارد — Mattermost اقدام‌های بدون شناسه را نادیده می‌گیرد.
4. `id` اقدام باید **فقط الفبایی‌عددی** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی اقدام سمت سرور Mattermost را خراب می‌کنند (404 برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد تا پیام تأیید نام دکمه را نشان دهد (برای مثال، "Approve") نه یک شناسهٔ خام.
6. `context.action_id` الزامی است — handler تعامل بدون آن 400 برمی‌گرداند.

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 راستی‌آزمایی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق راستی‌آزمایی Gateway مطابقت داشته باشد:

<Steps>
  <Step title="استخراج secret از توکن ربات">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="ساخت شیء context">
    شیء context را با همهٔ فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    با **کلیدهای مرتب‌شده** و **بدون فاصله** سریال‌سازی کنید (Gateway از `JSON.stringify` با کلیدهای مرتب‌شده استفاده می‌کند که خروجی فشرده تولید می‌کند).
  </Step>
  <Step title="امضای payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    digest هگز حاصل را به‌عنوان `_token` در context اضافه کنید.
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
    - `json.dumps` در Python به‌صورت پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای مطابقت با خروجی فشردهٔ JavaScript (`{"key":"val"}`) از `separators=(",", ":")` استفاده کنید.
    - همیشه **همهٔ** فیلدهای context را امضا کنید (منهای `_token`). Gateway ابتدا `_token` را حذف می‌کند و سپس هرچه باقی می‌ماند را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌صدای راستی‌آزمایی می‌شود.
    - از `sort_keys=True` استفاده کنید — Gateway پیش از امضا کلیدها را مرتب می‌کند، و Mattermost ممکن است هنگام ذخیرهٔ payload فیلدهای context را بازمرتب کند.
    - secret را از توکن ربات استخراج کنید (قطعی)، نه از بایت‌های تصادفی. secret باید در فرایندی که دکمه‌ها را ایجاد می‌کند و Gateway که راستی‌آزمایی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور دایرکتوری

Plugin مربوط به Mattermost شامل یک آداپتور دایرکتوری است که نام کانال‌ها و کاربران را از طریق API Mattermost resolve می‌کند. این کار مقصدهای `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های cron/webhook فعال می‌کند.

هیچ پیکربندی‌ای لازم نیست — آداپتور از توکن رباتِ پیکربندی حساب استفاده می‌کند.

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
  <Accordion title="پاسخی در کانال‌ها نیست">
    مطمئن شوید ربات در کانال است و آن را mention کنید (oncall)، از یک پیشوند trigger استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن ربات، URL پایه، و فعال بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای محیطی فقط روی حساب `default` اعمال می‌شوند.

  </Accordion>
  <Accordion title="دستورهای slash بومی شکست می‌خورند">
    - `Unauthorized: invalid command token.`: OpenClaw توکن callback را نپذیرفته است. علت‌های معمول:
      - ثبت دستور slash هنگام راه‌اندازی شکست خورده یا فقط تا حدی کامل شده است
      - callback به Gateway/حساب اشتباه برخورد می‌کند
      - Mattermost هنوز دستورهای قدیمی دارد که به مقصد callback قبلی اشاره می‌کنند
      - Gateway بدون فعال‌سازی دوبارهٔ دستورهای slash بازراه‌اندازی شده است
    - اگر دستورهای slash بومی از کار افتادند، لاگ‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده و لاگ‌ها هشدار می‌دهند که callback به `http://127.0.0.1:18789/...` resolve شده است، احتمالاً آن URL فقط وقتی قابل دسترسی است که Mattermost روی همان میزبان/namespace شبکهٔ OpenClaw اجرا شود. به‌جای آن یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌صورت کادرهای سفید ظاهر می‌شوند: عامل ممکن است دادهٔ دکمهٔ بدشکل ارسال کند. بررسی کنید هر دکمه هر دو فیلد `text` و `callback_data` را داشته باشد.
    - دکمه‌ها render می‌شوند اما کلیک‌ها کاری نمی‌کنند: بررسی کنید `AllowedUntrustedInternalConnections` در پیکربندی سرور Mattermost شامل `127.0.0.1 localhost` باشد، و `EnablePostActionIntegration` در ServiceSettings برابر `true` باشد.
    - دکمه‌ها هنگام کلیک 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. router اقدام Mattermost روی شناسه‌های غیرفبایی‌عددی خراب می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - لاگ‌های Gateway عبارت `invalid _token` را نشان می‌دهند: عدم تطابق HMAC. بررسی کنید همهٔ فیلدهای context را امضا می‌کنید (نه یک زیرمجموعه)، از کلیدهای مرتب‌شده استفاده می‌کنید، و JSON فشرده (بدون فاصله) به‌کار می‌برید. بخش HMAC بالا را ببینید.
    - لاگ‌های Gateway عبارت `missing _token in context` را نشان می‌دهند: فیلد `_token` در context دکمه نیست. مطمئن شوید هنگام ساخت payload یکپارچه‌سازی، آن را شامل کرده‌اید.
    - تأیید به‌جای نام دکمه شناسهٔ خام نشان می‌دهد: `context.action_id` با `id` دکمه مطابقت ندارد. هر دو را روی همان مقدار پاک‌سازی‌شده تنظیم کنید.
    - عامل از دکمه‌ها خبر ندارد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و گیت mention
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان Pairing
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
