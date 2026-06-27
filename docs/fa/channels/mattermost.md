---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود (توکن ربات + رویدادهای WebSocket). کانال‌ها، گروه‌ها و DMها پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی قابل میزبانی توسط خودتان است؛ برای جزئیات محصول و دانلودها، سایت رسمی را در [mattermost.com](https://mattermost.com) ببینید.

## نصب

Mattermost را پیش از پیکربندی کانال نصب کنید:

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
    `@openclaw/mattermost` را با دستور بالا نصب کنید، سپس اگر Gateway از قبل در حال اجراست، آن را بازراه‌اندازی کنید.
  </Step>
  <Step title="Create a Mattermost bot">
    یک حساب ربات Mattermost بسازید و **توکن ربات** را کپی کنید.
  </Step>
  <Step title="Copy the base URL">
    **URL پایه** Mattermost را کپی کنید (برای نمونه، `https://chat.example.com`).
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

## دستورهای اسلش بومی

دستورهای اسلش بومی اختیاری هستند. وقتی فعال باشند، OpenClaw دستورهای اسلش `oc_*` را از طریق API Mattermost ثبت می‌کند و POSTهای callback را روی سرور HTTP Gateway دریافت می‌کند.

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
    - مقدار پیش‌فرض `native: "auto"` برای Mattermost غیرفعال است. برای فعال‌سازی، `native: true` را تنظیم کنید.
    - اگر `callbackUrl` حذف شود، OpenClaw آن را از میزبان/درگاه Gateway + `callbackPath` استخراج می‌کند.
    - برای راه‌اندازی‌های چندحسابی، `commands` می‌تواند در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم شود (مقادیر حساب، فیلدهای سطح بالا را بازنویسی می‌کنند).
    - callbackهای دستور با توکن‌های هر دستور که Mattermost هنگام ثبت دستورهای `oc_*` توسط OpenClaw برمی‌گرداند، اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر callback، ثبت فعلی دستور Mattermost را تازه‌سازی می‌کند تا توکن‌های کهنه از دستورهای اسلش حذف‌شده یا بازتولیدشده بدون بازراه‌اندازی Gateway دیگر پذیرفته نشوند.
    - اگر API Mattermost نتواند تأیید کند که دستور هنوز جاری است، اعتبارسنجی callback بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی cache می‌شوند، جست‌وجوهای هم‌زمان ادغام می‌شوند، و شروع جست‌وجوی تازه برای هر دستور rate-limit می‌شود تا فشار replay محدود بماند.
    - callbackهای اسلش وقتی ثبت ناموفق بوده، راه‌اندازی ناقص بوده، یا توکن callback با توکن ثبت‌شده دستور حل‌شده مطابقت ندارد بسته شکست می‌خورند (توکنی که برای یک دستور معتبر است، نمی‌تواند برای دستور دیگری به اعتبارسنجی upstream برسد).

  </Accordion>
  <Accordion title="Reachability requirement">
    endpoint callback باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید مگر اینکه Mattermost روی همان میزبان/namespace شبکه OpenClaw اجرا شود.
    - `callbackUrl` را روی URL پایه Mattermost خود تنظیم نکنید مگر اینکه آن URL مسیر `/api/channels/mattermost/command` را با reverse proxy به OpenClaw هدایت کند.
    - یک بررسی سریع `curl https://<gateway-host>/api/channels/mattermost/command` است؛ درخواست GET باید از OpenClaw مقدار `405 Method Not Allowed` برگرداند، نه `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    اگر callback شما آدرس‌های خصوصی/tailnet/داخلی را هدف می‌گیرد، `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost را طوری تنظیم کنید که میزبان/دامنه callback را شامل شود.

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

`MATTERMOST_URL` را نمی‌توان از یک `.env` فضای کاری تنظیم کرد؛ [فایل‌های `.env` فضای کاری](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های چت

Mattermost به‌صورت خودکار به DMها پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (default)">
    فقط وقتی در کانال‌ها @mention شدید پاسخ بده.
  </Tab>
  <Tab title="onmessage">
    به هر پیام کانال پاسخ بده.
  </Tab>
  <Tab title="onchar">
    وقتی پیام با یک پیشوند محرک شروع می‌شود پاسخ بده.
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
- `channels.mattermost.requireMention` برای پیکربندی‌های legacy رعایت می‌شود، اما `chatmode` ترجیح دارد.
- پس از اینکه ربات یک پاسخ قابل مشاهده در thread کانال می‌فرستد، پیام‌های بعدی در همان thread بدون @mention جدید یا پیشوند `onchar` پاسخ داده می‌شوند، بنابراین گفت‌وگوهای چندنوبتی thread روان ادامه پیدا می‌کنند. مشارکت برای ۷ روز عدم فعالیت thread به خاطر سپرده می‌شود (با هر پاسخ تازه‌سازی می‌شود) و در بازراه‌اندازی‌های Gateway باقی می‌ماند. threadهایی که ربات فقط مشاهده کرده بی‌تأثیر می‌مانند؛ برای الزام دوباره به mention صریح، یک پیام سطح‌بالای جدید شروع کنید.

## Threading و sessionها

برای کنترل اینکه پاسخ‌های کانال و گروه در کانال اصلی بمانند یا زیر پست محرک یک thread شروع کنند، از `channels.mattermost.replyToMode` استفاده کنید.

- `off` (پیش‌فرض): فقط زمانی در thread پاسخ بده که پست ورودی از قبل در یک thread باشد.
- `first`: برای پست‌های سطح‌بالای کانال/گروه، زیر همان پست یک thread شروع کن و گفت‌وگو را به یک session محدود به thread هدایت کن.
- `all`: در حال حاضر برای Mattermost همان رفتار `first` را دارد.
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

- sessionهای محدود به thread از شناسه پست محرک به‌عنوان ریشه thread استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل‌اند، چون وقتی Mattermost ریشه thread داشته باشد، قطعه‌های ادامه و رسانه در همان thread ادامه پیدا می‌کنند.

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
- بازنویسی‌های mention برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` یا برای مقدار پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention` قرار می‌گیرند.
- تطبیق `@username` تغییرپذیر است و فقط وقتی `channels.mattermost.dangerouslyAllowNameMatching: true` باشد فعال می‌شود.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (وابسته به mention).
- نکته runtime: اگر `channels.mattermost` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

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

از این قالب‌های هدف با `openclaw message send` یا Cron/Webhookها استفاده کنید:

- `channel:<id>` برای یک کانال
- `user:<id>` برای یک DM
- `@username` برای یک DM (از طریق API Mattermost حل می‌شود)

<Warning>
شناسه‌های opaque بدون پیشوند (مانند `64ifufp...`) در Mattermost **مبهم** هستند (شناسه کاربر در برابر شناسه کانال).

OpenClaw آن‌ها را **ابتدا به‌عنوان کاربر** حل می‌کند:

- اگر شناسه به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با حل کانال مستقیم از طریق `/api/v4/channels/direct` یک **DM** می‌فرستد.
- در غیر این صورت شناسه به‌عنوان **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح استفاده کنید (`user:<id>` / `channel:<id>`).
</Warning>

## تلاش دوباره برای کانال DM

وقتی OpenClaw به یک هدف DM در Mattermost پیام می‌فرستد و ابتدا باید کانال مستقیم را حل کند، به‌صورت پیش‌فرض خطاهای گذرای ساخت کانال مستقیم را دوباره تلاش می‌کند.

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

نکته‌ها:

- این فقط روی ساخت کانال DM (`/api/v4/channels/direct`) اعمال می‌شود، نه هر فراخوانی API Mattermost.
- تلاش‌های دوباره روی خطاهای گذرا مانند rate limitها، پاسخ‌های 5xx، و خطاهای شبکه یا timeout اعمال می‌شوند.
- خطاهای 4xx سمت کلاینت به‌جز `429` دائمی در نظر گرفته می‌شوند و دوباره تلاش نمی‌شوند.

## Streaming پیش‌نمایش

Mattermost تفکر، فعالیت ابزار و متن پاسخ جزئی را در یک **پست پیش‌نویس پیش‌نمایش** واحد stream می‌کند که وقتی پاسخ نهایی برای ارسال امن باشد، در همان‌جا نهایی می‌شود. پیش‌نمایش به‌جای پر کردن کانال با پیام‌های هر قطعه، روی همان شناسه پست به‌روزرسانی می‌شود. خروجی‌های نهایی رسانه/خطا ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند و به‌جای flush کردن یک پست پیش‌نمایش دورریختنی، از تحویل عادی استفاده می‌کنند.

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
    - `block` از قطعه‌های پیش‌نویس به سبک append داخل پست پیش‌نمایش استفاده می‌کند.
    - `progress` هنگام تولید، یک پیش‌نمایش وضعیت نشان می‌دهد و فقط در پایان، پاسخ نهایی را پست می‌کند.
    - `off` Streaming پیش‌نمایش را غیرفعال می‌کند.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - اگر stream نتواند در همان‌جا نهایی شود (برای مثال پست در میانه stream حذف شده باشد)، OpenClaw به ارسال یک پست نهایی تازه fallback می‌کند تا پاسخ هرگز از دست نرود.
    - payloadهای فقط تفکر از پست‌های کانال حذف می‌شوند، از جمله متنی که به‌صورت blockquote با `> Thinking` می‌رسد. برای دیدن تفکر در سطح‌های دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، [Streaming](/fa/concepts/streaming#preview-streaming-modes) را ببینید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مانند `thumbsup` یا `:+1:` را می‌پذیرد (دونقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (boolean) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای سیستم به session عامل مسیریابی‌شده ارسال می‌شوند.

نمونه‌ها:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال کردن کنش‌های واکنش (پیش‌فرض true).
- بازنویسی برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربر روی دکمه کلیک می‌کند، عامل انتخاب را دریافت می‌کند و می‌تواند پاسخ دهد.

پاسخ‌های معمول عامل همچنین می‌توانند شامل بارهای معنایی `presentation` باشند. OpenClaw دکمه‌های مقدار را به‌صورت دکمه‌های تعاملی Mattermost رندر می‌کند، دکمه‌های URL را در متن پیام قابل مشاهده نگه می‌دارد، و منوهای انتخاب را به متن خوانا تنزل می‌دهد.

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

از `message action=send` همراه با پارامتر `buttons` استفاده کنید. دکمه‌ها یک آرایه دوبعدی هستند (ردیف‌هایی از دکمه‌ها):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

فیلدهای دکمه:

<ParamField path="text" type="string" required>
  برچسب نمایشی.
</ParamField>
<ParamField path="callback_data" type="string" required>
  مقداری که هنگام کلیک بازگردانده می‌شود (به‌عنوان شناسه کنش استفاده می‌شود).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  سبک دکمه.
</ParamField>

وقتی کاربر روی دکمه کلیک می‌کند:

<Steps>
  <Step title="Buttons replaced with confirmation">
    همه دکمه‌ها با یک خط تأیید جایگزین می‌شوند (مثلاً، «✓ **بله** توسط @user انتخاب شد»).
  </Step>
  <Step title="Agent receives the selection">
    عامل انتخاب را به‌صورت یک پیام ورودی دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - فراخوانی‌های بازگشتی دکمه از اعتبارسنجی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - Mattermost داده‌های فراخوانی بازگشتی را از پاسخ‌های API خود حذف می‌کند (ویژگی امنیتی)، بنابراین همه دکمه‌ها هنگام کلیک حذف می‌شوند - حذف جزئی ممکن نیست.
    - شناسه‌های کنشی که شامل خط تیره یا زیرخط هستند به‌صورت خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال کردن توضیح ابزار دکمه‌ها در پرامپت سیستمی عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایه خارجی اختیاری برای فراخوانی‌های بازگشتی دکمه‌ها (برای مثال `https://gateway.example.com`). وقتی Mattermost نمی‌تواند مستقیماً از طریق میزبان bind خود به Gateway برسد، از این استفاده کنید.
    - در راه‌اندازی‌های چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw نشانی فراخوانی بازگشتی را از `gateway.customBindHost` + `gateway.port` می‌سازد، سپس به `http://localhost:<port>` بازمی‌گردد.
    - قاعده دسترس‌پذیری: نشانی فراخوانی بازگشتی دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط وقتی کار می‌کند که Mattermost و OpenClaw روی همان میزبان/فضای نام شبکه اجرا شوند.
    - اگر مقصد فراخوانی بازگشتی شما خصوصی/tailnet/داخلی است، میزبان/دامنه آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌ها و Webhookهای خارجی می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق REST API Mattermost ارسال کنند. هر زمان ممکن است از `buildButtonAttachments()` از Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را دنبال کنید:

**ساختار بار:**

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
4. `id` کنش باید **فقط حروف و ارقام** باشد (`[a-zA-Z0-9]`). خط تیره‌ها و زیرخط‌ها مسیریابی کنش سمت سرور Mattermost را خراب می‌کنند (404 برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد تا پیام تأیید به‌جای شناسه خام، نام دکمه (مثلاً «Approve») را نشان دهد.
6. `context.action_id` الزامی است - کنترل‌کننده تعامل بدون آن 400 برمی‌گرداند.

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 اعتبارسنجی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق اعتبارسنجی Gateway مطابقت داشته باشد:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    شیء زمینه را با همه فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="Serialize with sorted keys">
    با **کلیدهای مرتب‌شده** و **بدون فاصله** سریال‌سازی کنید (Gateway از `JSON.stringify` با کلیدهای مرتب‌شده استفاده می‌کند که خروجی فشرده تولید می‌کند).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    چکیده هگز حاصل را به‌عنوان `_token` در زمینه اضافه کنید.
  </Step>
</Steps>

نمونه Python:

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
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` در Python به‌طور پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای مطابقت با خروجی فشرده JavaScript (`{"key":"val"}`) از `separators=(",", ":")` استفاده کنید.
    - همیشه **همه** فیلدهای زمینه را امضا کنید (منهای `_token`). Gateway ابتدا `_token` را حذف می‌کند و سپس همه چیزهای باقی‌مانده را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌صدای اعتبارسنجی می‌شود.
    - از `sort_keys=True` استفاده کنید - Gateway پیش از امضا کلیدها را مرتب می‌کند، و Mattermost ممکن است هنگام ذخیره بار، فیلدهای زمینه را بازمرتب کند.
    - راز را از توکن بات استخراج کنید (قطعی)، نه از بایت‌های تصادفی. راز باید در فرایندی که دکمه‌ها را می‌سازد و Gateway که اعتبارسنجی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور فهرست

Plugin Mattermost شامل یک آداپتور فهرست است که نام‌های کانال و کاربر را از طریق API Mattermost حل می‌کند. این کار اهداف `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های Cron/Webhook فعال می‌کند.

هیچ پیکربندی‌ای لازم نیست - آداپتور از توکن بات موجود در پیکربندی حساب استفاده می‌کند.

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
  <Accordion title="No replies in channels">
    مطمئن شوید بات در کانال است و آن را mention کنید (oncall)، از یک پیشوند راه‌انداز استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - توکن بات، نشانی پایه، و فعال بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای محیطی فقط برای حساب `default` اعمال می‌شوند.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw توکن فراخوانی بازگشتی را نپذیرفت. علت‌های معمول:
      - ثبت دستور slash در زمان راه‌اندازی شکست خورده یا فقط به‌طور جزئی کامل شده است
      - فراخوانی بازگشتی به Gateway/حساب نادرست برخورد می‌کند
      - Mattermost هنوز دستورهای قدیمی دارد که به مقصد فراخوانی بازگشتی قبلی اشاره می‌کنند
      - Gateway بدون فعال‌سازی دوباره دستورهای slash بازراه‌اندازی شده است
    - اگر دستورهای slash بومی از کار افتادند، لاگ‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده و لاگ‌ها هشدار می‌دهند که فراخوانی بازگشتی به `http://127.0.0.1:18789/...` حل شده است، آن نشانی احتمالاً فقط وقتی قابل دسترسی است که Mattermost روی همان میزبان/فضای نام شبکه OpenClaw اجرا شود. به‌جای آن یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="Buttons issues">
    - دکمه‌ها به‌صورت کادرهای سفید ظاهر می‌شوند: عامل ممکن است داده دکمه بدشکل ارسال کند. بررسی کنید که هر دکمه هر دو فیلد `text` و `callback_data` را داشته باشد.
    - دکمه‌ها رندر می‌شوند اما کلیک‌ها کاری انجام نمی‌دهند: بررسی کنید `AllowedUntrustedInternalConnections` در پیکربندی سرور Mattermost شامل `127.0.0.1 localhost` باشد، و `EnablePostActionIntegration` در ServiceSettings برابر `true` باشد.
    - دکمه‌ها هنگام کلیک 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. مسیریاب کنش Mattermost روی شناسه‌های غیرحرف‌ورقمی خراب می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - لاگ‌های Gateway عبارت `invalid _token` را نشان می‌دهند: عدم تطابق HMAC. بررسی کنید که همه فیلدهای زمینه را امضا می‌کنید (نه یک زیرمجموعه)، از کلیدهای مرتب‌شده استفاده می‌کنید، و از JSON فشرده (بدون فاصله) استفاده می‌کنید. بخش HMAC بالا را ببینید.
    - لاگ‌های Gateway عبارت `missing _token in context` را نشان می‌دهند: فیلد `_token` در زمینه دکمه نیست. مطمئن شوید هنگام ساخت بار یکپارچه‌سازی اضافه شده است.
    - تأیید به‌جای نام دکمه، شناسه خام را نشان می‌دهد: `context.action_id` با `id` دکمه مطابقت ندارد. هر دو را روی همان مقدار پاک‌سازی‌شده تنظیم کنید.
    - عامل از دکمه‌ها خبر ندارد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و gating مربوط به mention
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
