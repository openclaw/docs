---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی E2EE و تأیید Matrix
summary: وضعیت پشتیبانی ماتریس، راه‌اندازی، و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-06-28T20:41:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال قابل دانلود برای OpenClaw است.
این Plugin از `matrix-js-sdk` رسمی استفاده می‌کند و از پیام‌های مستقیم، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، مکان و E2EE پشتیبانی می‌کند.

## نصب

پیش از پیکربندی کانال، Matrix را از ClawHub نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

مشخصات Plugin بدون پیشوند ابتدا ClawHub را امتحان می‌کنند و سپس به npm fallback می‌کنند. برای اجبار منبع رجیستری، از `openclaw plugins install clawhub:@openclaw/matrix` یا `openclaw plugins install npm:@openclaw/matrix` استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`، Plugin را ثبت و فعال می‌کند، بنابراین به مرحلهٔ جداگانهٔ `openclaw plugins enable matrix` نیازی نیست. با این حال، تا زمانی که کانال زیر را پیکربندی نکنید، Plugin کاری انجام نمی‌دهد. برای رفتار کلی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را با `homeserver` + `accessToken`، یا `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک پیام مستقیم با ربات شروع کنید، یا آن را به یک اتاق دعوت کنید ( [پیوستن خودکار](#auto-join) را ببینید - دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

جادوگر این موارد را می‌پرسد: نشانی URL homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسهٔ کاربر (فقط احراز هویت با گذرواژه)، نام اختیاری دستگاه، فعال‌سازی E2EE، و پیکربندی دسترسی اتاق و پیوستن خودکار.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، جادوگر میان‌بر متغیر محیطی پیشنهاد می‌دهد. برای resolve کردن نام اتاق‌ها پیش از ذخیرهٔ allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، جادوگر پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

### پیکربندی حداقلی

مبتنی بر توکن:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

مبتنی بر گذرواژه (توکن پس از نخستین ورود cache می‌شود):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### پیوستن خودکار

`channels.matrix.autoJoin` به‌صورت پیش‌فرض `off` است. با مقدار پیش‌فرض، ربات تا زمانی که دستی عضو نشوید، در اتاق‌ها یا پیام‌های مستقیم جدید ناشی از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد که اتاق دعوت‌شده پیام مستقیم است یا گروه، بنابراین همهٔ دعوت‌ها - از جمله دعوت‌های شبیه پیام مستقیم - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدا، پس از پیوستن ربات و طبقه‌بندی اتاق، اعمال می‌شود.

<Warning>
برای محدود کردن دعوت‌هایی که ربات می‌پذیرد، `autoJoin: "allowlist"` به‌همراه `autoJoinAllowlist` را تنظیم کنید، یا برای پذیرش همهٔ دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط targetهای پایدار را می‌پذیرد: `!roomId:server`، `#alias:server`، یا `*`. نام‌های سادهٔ اتاق رد می‌شوند؛ ورودی‌های alias نسبت به homeserver resolve می‌شوند، نه نسبت به state ادعاشده توسط اتاق دعوت‌شده.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

برای پذیرش همهٔ دعوت‌ها، از `autoJoin: "always"` استفاده کنید.

### قالب‌های target برای allowlist

allowlistهای پیام مستقیم و اتاق بهتر است با شناسه‌های پایدار پر شوند:

- پیام‌های مستقیم (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی به‌صورت پیش‌فرض نادیده گرفته می‌شوند چون قابل تغییر هستند؛ فقط وقتی صراحتا به سازگاری با ورودی‌های نام نمایشی نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- کلیدهای allowlist اتاق (`groups`, `rooms` قدیمی): از `!room:server` یا `#alias:server` استفاده کنید. نام‌های سادهٔ اتاق به‌صورت پیش‌فرض نادیده گرفته می‌شوند؛ فقط وقتی صراحتا به سازگاری با lookup نام اتاق‌های عضو‌شده نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- allowlistهای دعوت (`autoJoinAllowlist`): از `!room:server`، `#alias:server`، یا `*` استفاده کنید. نام‌های سادهٔ اتاق رد می‌شوند.

### نرمال‌سازی شناسهٔ حساب

جادوگر یک نام دوستانه را به شناسهٔ حساب نرمال‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های scoped متغیر محیطی escape می‌شود تا دو حساب با هم تداخل نداشته باشند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cache‌شده

Matrix اعتبارنامه‌های cache‌شده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌دار: `credentials-<account>.json`

وقتی اعتبارنامه‌های cache‌شده آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد Matrix را پیکربندی‌شده تلقی می‌کند - این شامل راه‌اندازی، `openclaw doctor` و probeهای وضعیت کانال می‌شود.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌دار، شناسهٔ حساب را پیش از پسوند درج می‌کنند.

| حساب پیش‌فرض          | حساب نام‌دار (`<ID>` شناسهٔ حساب نرمال‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN` و به همین ترتیب تبدیل می‌شوند. متغیرهای محیطی کلید بازیابی توسط flowهای CLI آگاه از بازیابی (`verify backup restore`، `verify device`، `verify bootstrap`) خوانده می‌شوند، وقتی کلید را با `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` را نمی‌توان از یک فایل `.env` فضای کاری تنظیم کرد؛ [فایل‌های `.env` فضای کاری](/fa/gateway/security) را ببینید.

## نمونهٔ پیکربندی

یک baseline کاربردی با جفت‌سازی پیام مستقیم، allowlist اتاق و E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## پیش‌نمایش‌های Streaming

streaming پاسخ Matrix اختیاری است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال تولید دستیار را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر بلوک کامل‌شده به‌عنوان پیام Matrix جداگانهٔ خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه داشتن پیش‌نمایش‌های زندهٔ پاسخ اما پنهان کردن خطوط موقت ابزار/پیشرفت، از فرم object استفاده کنید:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | رفتار                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (پیش‌فرض) | منتظر پاسخ کامل می‌ماند و یک‌بار ارسال می‌کند. `true` ↔ `"partial"`، `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | هم‌زمان با نوشتن بلوک فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. کلاینت‌های معمول Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه روی ویرایش نهایی.              |
| `"quiet"`         | مانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان می‌گیرند که یک قاعدهٔ push مخصوص هر کاربر با ویرایش نهایی‌شده مطابقت پیدا کند (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (پیش‌فرض)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای بلوک فعلی، بلوک‌های کامل‌شده به‌عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای بلوک فعلی، درجا نهایی می‌شود |
| `"off"`                 | یک پیام Matrix اعلان‌دار برای هر بلوک پایان‌یافته                     | یک پیام Matrix اعلان‌دار برای پاسخ کامل      |

نکته‌ها:

- اگر یک پیش‌نمایش از محدودیت اندازهٔ هر event در Matrix بزرگ‌تر شود، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط-نهایی fallback می‌کند.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌طور معمول ارسال می‌کنند. اگر دیگر نتوان یک پیش‌نمایش کهنه را با اطمینان دوباره استفاده کرد، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار به‌صورت پیش‌فرض وقتی streaming پیش‌نمایش Matrix فعال باشد فعال هستند. برای نگه داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ اما باقی گذاشتن پیشرفت ابزار در مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش هزینهٔ فراخوانی‌های اضافی Matrix API دارند. اگر محافظه‌کارانه‌ترین profile محدودیت نرخ را می‌خواهید، `streaming: "off"` را باقی بگذارید.

## پیام‌های صوتی

یادداشت‌های صوتی ورودی Matrix پیش از gate اشارهٔ اتاق transcribe می‌شوند. این اجازه می‌دهد یادداشت صوتی‌ای که نام ربات را می‌گوید، agent را در اتاقی با `requireMention: true` فعال کند، و transcript را به‌جای فقط placeholder پیوست صوتی به agent بدهد.

Matrix از ارائه‌دهندهٔ رسانهٔ صوتی مشترک که زیر `tools.media.audio` پیکربندی شده استفاده می‌کند، مانند OpenAI `gpt-4o-mini-transcribe`. برای راه‌اندازی و محدودیت‌های ارائه‌دهنده، [نمای کلی ابزارهای رسانه](/fa/tools/media-overview) را ببینید.

جزئیات رفتار:

- eventهای `m.audio` و eventهای `m.file` با نوع MIME برابر `audio/*` واجد شرایط هستند.
- در اتاق‌های رمزگذاری‌شده، OpenClaw پیوست را پیش از transcribe از مسیر رسانهٔ Matrix موجود رمزگشایی می‌کند.
- transcript در prompt عامل به‌عنوان تولیدشده توسط ماشین و غیرقابل اعتماد علامت‌گذاری می‌شود.
- پیوست به‌عنوان از قبل transcribe‌شده علامت‌گذاری می‌شود تا ابزارهای رسانهٔ downstream همان یادداشت صوتی را دوباره transcribe نکنند.
- برای غیرفعال کردن transcribe صوتی به‌صورت سراسری، `tools.media.audio.enabled: false` را تنظیم کنید.

## فرادادهٔ تأیید

promptهای تأیید بومی Matrix، eventهای عادی `m.room.message` هستند که محتوای event سفارشی مخصوص OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی محتوای event را مجاز می‌داند، بنابراین کلاینت‌های معمول همچنان body متنی را نمایش می‌دهند، در حالی که کلاینت‌های آگاه از OpenClaw می‌توانند شناسهٔ ساخت‌یافتهٔ تأیید، نوع، state، تصمیم‌های موجود و جزئیات exec/Plugin را بخوانند.

وقتی یک prompt تأیید برای یک event Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را chunk می‌کند و `com.openclaw.approval` را فقط به chunk اول پیوست می‌کند. واکنش‌ها برای تصمیم‌های allow/deny به همان event اول متصل می‌شوند، بنابراین promptهای طولانی همان target تأیید را مانند promptهای تک-event حفظ می‌کنند.

### قواعد push خودمیزبان برای پیش‌نمایش‌های نهایی‌شدهٔ quiet

`streaming: "quiet"` فقط وقتی به گیرندگان اعلان می‌دهد که یک بلوک یا turn نهایی شده باشد - یک قاعدهٔ push مخصوص هر کاربر باید با نشانگر پیش‌نمایش نهایی‌شده مطابقت پیدا کند. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب قاعده، نکات مخصوص هر homeserver)، [قواعد push Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های ربات-به-ربات

به‌صورت پیش‌فرض، پیام‌های Matrix از دیگر حساب‌های Matrix پیکربندی‌شدهٔ OpenClaw نادیده گرفته می‌شوند.

وقتی عمدا ترافیک Matrix میان agentها را می‌خواهید، از `allowBots` استفاده کنید:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` پیام‌ها را از حساب‌های بات Matrix پیکربندی‌شده دیگر در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` آن پیام‌ها را فقط زمانی می‌پذیرد که در اتاق‌ها به‌صورت قابل مشاهده به این بات اشاره کنند. DMها همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق بازنویسی می‌کند.
- پیام‌های پذیرفته‌شده از بات‌های پیکربندی‌شده از [محافظت حلقه بات](/fa/channels/bot-loop-protection) مشترک استفاده می‌کنند. `channels.defaults.botLoopProtection` را پیکربندی کنید، سپس وقتی یک اتاق به بودجه متفاوتی نیاز دارد، با `channels.matrix.botLoopProtection` یا `channels.matrix.groups.<room>.botLoopProtection` بازنویسی کنید.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های پاسخ‌دهی به خود جلوگیری کند.
- Matrix در اینجا پرچم بومی بات ارائه نمی‌کند؛ OpenClaw «نوشته‌شده توسط بات» را به‌صورت «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده دیگر روی این Gateway مربوط به OpenClaw» در نظر می‌گیرد.

هنگام فعال‌سازی ترافیک بات‌به‌بات در اتاق‌های مشترک، از فهرست‌های مجاز سخت‌گیرانه برای اتاق‌ها و الزامات اشاره استفاده کنید.

## رمزگذاری و راستی‌آزمایی

در اتاق‌های رمزگذاری‌شده (E2EE)، رویدادهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزگذاری شوند. اتاق‌های رمزگذاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. نیازی به پیکربندی نیست - Plugin وضعیت E2EE را به‌طور خودکار تشخیص می‌دهد.

همه فرمان‌های `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل خواندن برای ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌صورت پیش‌فرض خلاصه است و ثبت داخلی SDK بی‌صدا انجام می‌شود. نمونه‌های زیر شکل مرجع را نشان می‌دهند؛ در صورت نیاز پرچم‌ها را اضافه کنید.

### فعال‌سازی رمزگذاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و امضای متقاطع را راه‌اندازی اولیه می‌کند، در صورت نیاز یک نسخه پشتیبان از کلیدهای اتاق می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. پرچم‌های مفید:

- `--recovery-key <key>` اعمال یک کلید بازیابی پیش از راه‌اندازی اولیه (شکل stdin مستندشده در زیر را ترجیح دهید)
- `--force-reset-cross-signing` کنار گذاشتن هویت امضای متقاطع فعلی و ساخت هویت جدید (فقط با قصد قبلی استفاده کنید)

برای یک حساب جدید، E2EE را هنگام ایجاد فعال کنید:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` نام مستعار `--enable-e2ee` است.

معادل پیکربندی دستی:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### وضعیت و سیگنال‌های اعتماد

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` سه سیگنال اعتماد مستقل را گزارش می‌کند (`--verbose` همه آن‌ها را نشان می‌دهد):

- `Locally trusted`: فقط توسط این کلاینت مورد اعتماد است
- `Cross-signing verified`: SDK راستی‌آزمایی از طریق امضای متقاطع را گزارش می‌کند
- `Signed by owner`: با کلید خودامضای خودتان امضا شده است (فقط برای عیب‌یابی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا صرفا امضای مالک کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیه حساب Matrix، عیب‌یابی‌های best-effort را برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### راستی‌آزمایی این دستگاه با کلید بازیابی

کلید بازیابی حساس است - آن را به‌جای ارسال در خط فرمان، از طریق stdin pipe کنید. `MATRIX_RECOVERY_KEY` را تنظیم کنید (یا برای یک حساب نام‌گذاری‌شده `MATRIX_<ID>_RECOVERY_KEY`):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این فرمان سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفته است.
- `Backup usable`: نسخه پشتیبان کلیدهای اتاق می‌تواند با مواد بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقاطع Matrix را دارد.

وقتی اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی مواد پشتیبان را باز کرده باشد، با کد غیرصفر خارج می‌شود. در این حالت، خودراستی‌آزمایی را از یک کلاینت Matrix دیگر کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

شکل کلید مستقیم `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچه shell شما باقی می‌ماند.

### راه‌اندازی اولیه یا تعمیر امضای متقاطع

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان تعمیر و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی اولیه می‌کند و در صورت امکان از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقاطع را راه‌اندازی اولیه می‌کند و کلیدهای عمومی مفقود را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و با امضای متقاطع امضا می‌کند
- اگر نسخه پشتیبان کلیدهای اتاق سمت سرور هنوز وجود نداشته باشد، آن را می‌سازد

اگر homeserver برای بارگذاری کلیدهای امضای متقاطع به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و بعد `m.login.password` (نیازمند `channels.matrix.password`).

پرچم‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنار گذاشتن هویت امضای متقاطع فعلی (فقط با قصد قبلی؛ نیاز دارد کلید بازیابی فعال ذخیره شده باشد یا با `--recovery-key-stdin` ارائه شود)

### نسخه پشتیبان کلیدهای اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا نسخه پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را به فروشگاه رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد، می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک نسخه پشتیبان خراب با یک baseline تازه (از دست رفتن تاریخچه قدیمی غیرقابل‌بازیابی را می‌پذیرد؛ همچنین اگر secret نسخه پشتیبان فعلی قابل بارگذاری نباشد می‌تواند ذخیره‌سازی محرمانه را دوباره بسازد):

```bash
openclaw matrix verify backup reset --yes
```

فقط زمانی `--rotate-recovery-key` را اضافه کنید که عمدا می‌خواهید کلید بازیابی قبلی دیگر baseline تازه نسخه پشتیبان را باز نکند.

### فهرست کردن، درخواست دادن، و پاسخ دادن به راستی‌آزمایی‌ها

```bash
openclaw matrix verify list
```

درخواست‌های راستی‌آزمایی معلق را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست راستی‌آزمایی ارسال می‌کند. `--own-user` درخواست خودراستی‌آزمایی می‌دهد (در یک کلاینت Matrix دیگر از همان کاربر، prompt را می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` نمی‌تواند با دیگر پرچم‌های هدف‌گیری ترکیب شود.

برای مدیریت چرخه عمر سطح پایین‌تر - معمولا هنگام دنبال کردن درخواست‌های ورودی از یک کلاینت دیگر - این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌ها یا اعداد ده‌دهی SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با چیزی که کلاینت دیگر نشان می‌دهد مطابقت دارد     |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی ایموجی‌ها یا اعداد ده‌دهی مطابقت ندارند                |
| `openclaw matrix verify cancel <id>`       | لغو؛ گزینه‌های اختیاری `--reason <text>` و `--code <matrix-code>` را می‌پذیرد |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان راهنمای پیگیری DM می‌پذیرند، وقتی راستی‌آزمایی به یک اتاق پیام مستقیم مشخص متصل باشد.

### نکته‌های چندحسابی

بدون `--account <id>`، فرمان‌های CLI مربوط به Matrix از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌گذاری‌شده دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌گذاری‌شده غیرفعال یا ناموجود باشد، خطاها به کلید پیکربندی آن حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه راستی‌آزمایی‌نشده در یک کلاینت Matrix دیگر درخواست خودراستی‌آزمایی می‌دهد، موارد تکراری را رد می‌کند و یک cooldown اعمال می‌کند (به‌صورت پیش‌فرض 24 ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانه bootstrap رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت امضای متقاطع فعلی دوباره استفاده می‌کند. اگر وضعیت bootstrap خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA گذرواژه نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل با امضای مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix اعلان‌های چرخه عمر راستی‌آزمایی را به‌صورت پیام‌های `m.notice` در اتاق سخت‌گیرانه راستی‌آزمایی DM منتشر می‌کند: درخواست، آماده بودن (با راهنمایی "Verify by emoji")، شروع/تکمیل، و جزئیات SAS (ایموجی/ده‌دهی) در صورت وجود.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر رهگیری و به‌صورت خودکار پذیرفته می‌شوند. برای خودراستی‌آزمایی، OpenClaw جریان SAS را به‌طور خودکار شروع می‌کند و وقتی راستی‌آزمایی ایموجی در دسترس باشد سمت خودش را تأیید می‌کند - شما همچنان باید در کلاینت Matrix خود مقایسه کنید و "They match" را تأیید کنید.

    اعلان‌های سامانه راستی‌آزمایی به pipeline چت عامل ارسال نمی‌شوند.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    اگر `verify status` می‌گوید دستگاه فعلی دیگر در homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw بسازید. برای ورود با گذرواژه:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    برای احراز هویت با توکن، یک access token تازه در کلاینت Matrix یا رابط مدیریتی خود بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسه حساب از فرمان ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="Device hygiene">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست کنید و هرس کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE مربوط به Matrix از مسیر رمزنگاری Rust رسمی `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim مربوط به IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌ماند (مجوزهای فایل محدودکننده).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار می‌گیرد و شامل sync store، crypto store، کلید بازیابی، snapshot مربوط به IDB، اتصال‌های thread، و وضعیت راستی‌آزمایی راه‌اندازی است. وقتی توکن تغییر می‌کند اما هویت حساب ثابت می‌ماند، OpenClaw از بهترین root موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

    یک root قدیمی‌تر منفرد برای token-hash می‌تواند مسیر عادی تداوم چرخش توکن باشد. اگر OpenClaw پیام `matrix: multiple populated token-hash storage roots detected` را ثبت کرد، پوشه حساب را بررسی کنید و rootهای sibling قدیمی را فقط پس از تأیید سالم بودن root فعال انتخاب‌شده آرشیو کنید. انتقال rootهای قدیمی به یک پوشه `_archive/` را به حذف فوری آن‌ها ترجیح دهید.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

پروفایل شخصی Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های URL آواتار `mxc://` را مستقیم می‌پذیرد؛ وقتی `http://` یا `https://` را ارسال می‌کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شده‌ی `mxc://` را در `channels.matrix.avatarUrl` (یا بازنویسی مخصوص هر حساب) ذخیره می‌کند.

## رشته‌ها

Matrix از رشته‌های بومی Matrix هم برای پاسخ‌های خودکار و هم برای ارسال‌های ابزار پیام پشتیبانی می‌کند. دو کنترل مستقل رفتار را تعیین می‌کنند:

### مسیریابی نشست (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به نشست‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همه‌ی اتاق‌های DM با همان همتای مسیریابی‌شده یک نشست مشترک دارند.
- `"per-room"`: هر اتاق DM در Matrix کلید نشست خودش را می‌گیرد، حتی وقتی همتا یکسان باشد.

اتصال‌های صریح مکالمه همیشه بر `sessionScope` مقدم‌اند، بنابراین اتاق‌ها و رشته‌های متصل، نشست هدف انتخاب‌شده‌ی خود را حفظ می‌کنند.

### رشته‌بندی پاسخ (`threadReplies`)

`threadReplies` تعیین می‌کند ربات پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها در سطح بالایی هستند. پیام‌های رشته‌ای ورودی روی نشست والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در همان رشته بوده، داخل رشته پاسخ بده.
- `"always"`: داخل رشته‌ای پاسخ بده که از پیام محرک ریشه گرفته است؛ آن مکالمه از نخستین محرک به بعد از طریق نشست هم‌دامنه با رشته‌ی متناظر مسیریابی می‌شود.

`dm.threadReplies` این رفتار را فقط برای DMها بازنویسی می‌کند - برای مثال، رشته‌های اتاق را جدا نگه دارید و در عین حال DMها را تخت نگه دارید.

### وراثت رشته و فرمان‌های اسلش

- پیام‌های رشته‌ای ورودی، پیام ریشه‌ی رشته را به‌عنوان زمینه‌ی اضافی عامل شامل می‌کنند.
- ارسال‌های ابزار پیام هنگام هدف‌گیری همان اتاق (یا همان هدف کاربر DM)، رشته‌ی فعلی Matrix را به‌طور خودکار به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شده باشد.
- استفاده‌ی دوباره از هدف کاربر DM فقط وقتی فعال می‌شود که فراداده‌ی نشست فعلی، همان همتای DM را روی همان حساب Matrix اثبات کند؛ در غیر این صورت OpenClaw به مسیریابی عادی در دامنه‌ی کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` متصل به رشته همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- وقتی `threadBindings.spawnSessions` فعال باشد، `/focus` در سطح بالا یک رشته‌ی جدید Matrix می‌سازد و آن را به نشست هدف متصل می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشته‌ی موجود Matrix، همان رشته را درجا متصل می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، یک `m.notice` یک‌باره در آن اتاق ارسال می‌کند که به راه خروج `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط وقتی ظاهر می‌شود که اتصال‌های رشته فعال باشند.

## اتصال‌های مکالمه ACP

اتاق‌های Matrix، DMها، و رشته‌های موجود Matrix می‌توانند بدون تغییر سطح چت به فضاهای کاری ماندگار ACP تبدیل شوند.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشته‌ی موجود Matrix که می‌خواهید همچنان از آن استفاده کنید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق سطح بالای Matrix، DM/اتاق فعلی به‌عنوان سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشته‌ی موجود Matrix، `--bind here` همان رشته‌ی فعلی را درجا متصل می‌کند.
- `/new` و `/reset` همان نشست ACP متصل را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

نکات:

- `--bind here` رشته‌ی فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions`، `/acp spawn --thread auto|here` را کنترل می‌کند؛ جایی که OpenClaw باید یک رشته‌ی فرزند Matrix ایجاد یا متصل کند.

### پیکربندی اتصال رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و همچنین از بازنویسی‌های مخصوص کانال پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های متصل به رشته در Matrix به‌طور پیش‌فرض روشن است:

- برای جلوگیری از اینکه `/focus` سطح بالا و `/acp spawn --thread auto|here` رشته‌های Matrix را ایجاد/متصل کنند، `threadBindings.spawnSessions: false` را تنظیم کنید.
- وقتی ایجاد رشته‌ی بومی زیرعامل نباید رونویس والد را fork کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به یک رویداد Matrix اضافه می‌کند.
- `reactions` خلاصه‌ی واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از طرف ربات حذف می‌کند.

**ترتیب حل** (اولین مقدار تعریف‌شده برنده است):

| تنظیم                   | ترتیب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | هر حساب → کانال → `messages.ackReaction` → جایگزین ایموجی هویت عامل             |
| `ackReactionScope`      | هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"`       |
| `reactionNotifications` | هر حساب → کانال → پیش‌فرض `"own"`                                                |

`reactionNotifications: "own"` رویدادهای افزوده‌شده‌ی `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف بگیرند، ارسال می‌کند؛ `"off"` رویدادهای سامانه‌ی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سامانه تبدیل نمی‌شود، چون Matrix آن‌ها را به‌صورت ویرایش‌های حذف، نه حذف‌های مستقل `m.reaction`، نمایش می‌دهد.

## زمینه‌ی تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی یک پیام اتاق Matrix عامل را تحریک می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` شامل شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هیچ‌کدام تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی `0` را تنظیم کنید.
- تاریخچه‌ی اتاق Matrix فقط مربوط به اتاق است. DMها همچنان از تاریخچه‌ی عادی نشست استفاده می‌کنند.
- تاریخچه‌ی اتاق Matrix فقط در حالت در انتظار است: OpenClaw پیام‌های اتاق را که هنوز پاسخی را تحریک نکرده‌اند بافر می‌کند، سپس وقتی یک اشاره یا محرک دیگر می‌رسد، از آن پنجره snapshot می‌گیرد.
- پیام محرک فعلی در `InboundHistory` گنجانده نمی‌شود؛ برای آن نوبت در بدنه‌ی اصلی ورودی می‌ماند.
- تلاش‌های دوباره برای همان رویداد Matrix به‌جای حرکت به سمت پیام‌های جدیدتر اتاق، از snapshot تاریخچه‌ی اصلی دوباره استفاده می‌کنند.

## دیدپذیری زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینه‌ی تکمیلی اتاق مانند متن پاسخ دریافت‌شده، ریشه‌های رشته، و تاریخچه‌ی در انتظار پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینه‌ی تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینه‌ی تکمیلی را به فرستندگانی محدود می‌کند که توسط بررسی‌های allowlist فعال اتاق/کاربر مجاز شده‌اند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌شده‌ی صریح را نگه می‌دارد.

این تنظیم بر دیدپذیری زمینه‌ی تکمیلی اثر می‌گذارد، نه بر اینکه خود پیام ورودی بتواند پاسخی را تحریک کند.
مجوز محرک همچنان از `groupPolicy`، `groups`، `groupAllowFrom`، و تنظیمات خط‌مشی DM می‌آید.

## خط‌مشی DM و اتاق

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

برای خاموش‌کردن کامل DMها در حالی که اتاق‌ها همچنان کار کنند، `dm.enabled: false` را تنظیم کنید:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

برای رفتار اشاره‌محور و allowlist، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونه‌ی جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشده‌ی Matrix پیش از تأیید همچنان به شما پیام بدهد، OpenClaw همان کد جفت‌سازی در انتظار را دوباره استفاده می‌کند و ممکن است به‌جای ساخت کد جدید، پس از یک cooldown کوتاه پاسخ یادآوری بفرستد.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنه‌ی `m.direct` روبه‌رو شود که به‌جای DM زنده به اتاق‌های تکی قدیمی اشاره می‌کنند. نگاشت فعلی را برای یک همتا بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای راه‌اندازی‌های چندحسابی `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانه‌ی ۱:۱ را ترجیح می‌دهد که از قبل در `m.direct` نگاشت شده باشد
- به هر DM سخت‌گیرانه‌ی ۱:۱ فعلاً پیوسته با آن کاربر برمی‌گردد
- اگر DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

این کار اتاق‌های قدیمی را به‌طور خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آینده‌ی Matrix، اعلان‌های تأیید، و دیگر جریان‌های پیام مستقیم، اتاق درست را هدف بگیرند.

## تأییدهای Exec

Matrix می‌تواند به‌عنوان یک کارخواه تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای بازنویسی مخصوص هر حساب، `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تأییدها را از طریق اعلان‌های بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده یا `"auto"` باشد، Matrix پس از اینکه دست‌کم یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربری Matrix (`@owner:example.org`) که مجازند درخواست‌های exec را تأیید کنند. اختیاری - به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال اعلان‌ها. `"dm"` (پیش‌فرض) به DMهای تأییدکننده می‌فرستد؛ `"channel"` به اتاق یا DM مبدأ Matrix می‌فرستد؛ `"both"` به هر دو می‌فرستد.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را تحریک کنند.

مجوزدهی میان انواع تأیید کمی متفاوت است:

- **تأییدهای Exec** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجوز می‌گیرند.

هر دو نوع میان‌برهای واکنش و به‌روزرسانی‌های پیام Matrix را مشترک دارند. تأییدکننده‌ها روی پیام تأیید اصلی میان‌برهای واکنش را می‌بینند:

- `✅` یک‌بار اجازه بده
- `❌` رد کن
- `♾️` همیشه اجازه بده (وقتی خط‌مشی مؤثر exec اجازه دهد)

فرمان‌های اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکننده‌های حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای exec متن فرمان را شامل می‌شود - `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای Exec](/fa/tools/exec-approvals).

## فرمان‌های اسلش

فرمان‌های اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیماً در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین فرمان‌هایی را تشخیص می‌دهد که با اشاره‌ی Matrix خود ربات پیشوند شده‌اند، بنابراین `@bot:server /new` بدون regex اشاره‌ی سفارشی مسیر فرمان را تحریک می‌کند. این کار باعث می‌شود ربات به پست‌های سبک اتاق `@mention /command` که Element و کارخواه‌های مشابه وقتی کاربر پیش از تایپ فرمان، ربات را با تکمیل تب انتخاب می‌کند منتشر می‌کنند، پاسخ‌گو بماند.

قواعد مجوز همچنان اعمال می‌شوند: فرستندگان فرمان باید همان خط‌مشی‌های allowlist/مالک DM یا اتاق را مانند پیام‌های عادی برآورده کنند.

## چندحسابی

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**وراثت:**

- مقادیر سطح بالای `channels.matrix` به‌عنوان پیش‌فرض برای حساب‌های نام‌گذاری‌شده عمل می‌کنند، مگر اینکه یک حساب آن‌ها را بازنویسی کند.
- یک ورودی اتاق ارث‌بری‌شده را با `groups.<room>.account` به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک هستند؛ `account: "default"` همچنان زمانی کار می‌کند که حساب پیش‌فرض در سطح بالا پیکربندی شده باشد.

**انتخاب حساب پیش‌فرض:**

- `defaultAccount` را تنظیم کنید تا حساب نام‌گذاری‌شده‌ای انتخاب شود که مسیریابی ضمنی، کاوش و فرمان‌های CLI آن را ترجیح می‌دهند.
- اگر چند حساب دارید و یکی از آن‌ها دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌صورت ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌گذاری‌شده دارید و هیچ پیش‌فرضی انتخاب نشده است، فرمان‌های CLI از حدس زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را پاس بدهید.
- بلوک سطح بالای `channels.matrix.*` فقط زمانی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که احراز هویت آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌گذاری‌شده پس از اینکه اعتبارنامه‌های کش‌شده احراز هویت را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی، یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌گذاری‌شده‌ای وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، همان حساب موجود را حفظ می‌کند. فقط کلیدهای احراز هویت/بوت‌استرپ Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی چندحسابی مشترک، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## سرورهای خانگی خصوصی/LAN

به‌طور پیش‌فرض، OpenClaw سرورهای خانگی خصوصی/داخلی Matrix را برای محافظت در برابر SSRF مسدود می‌کند، مگر اینکه
برای هر حساب صریحاً آن را فعال کنید.

اگر سرور خانگی شما روی localhost، یک IP مربوط به LAN/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود،
`network.dangerouslyAllowPrivateNetwork` را برای آن حساب Matrix فعال کنید:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

نمونه راه‌اندازی CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

این فعال‌سازی فقط مقصدهای خصوصی/داخلی مورد اعتماد را مجاز می‌کند. سرورهای خانگی عمومیِ متن‌واضح مانند
`http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر جا ممکن است `https://` را ترجیح دهید.

## پروکسی‌کردن ترافیک Matrix

اگر استقرار Matrix شما به یک پروکسی خروجی HTTP(S) صریح نیاز دارد، `channels.matrix.proxy` را تنظیم کنید:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

حساب‌های نام‌گذاری‌شده می‌توانند پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پروکسی برای ترافیک Matrix در زمان اجرا و کاوش‌های وضعیت حساب استفاده می‌کند.

## حل مقصد

Matrix این شکل‌های مقصد را در هر جایی که OpenClaw از شما مقصد اتاق یا کاربر می‌خواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی مقصدهای تحویل صریح، کارهای cron، اتصال‌ها، یا فهرست‌های مجاز، از همان حالت دقیق حروف شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای نشست داخلی را برای ذخیره‌سازی canonical نگه می‌دارد، بنابراین آن کلیدهای حروف کوچک
منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوهای کاربر، دایرکتوری کاربران Matrix را روی همان سرور خانگی پرس‌وجو می‌کنند.
- جست‌وجوهای اتاق، شناسه‌های صریح اتاق و نام‌های مستعار را مستقیم می‌پذیرند. جست‌وجوی نام اتاق‌های عضو‌شده به‌صورت best-effort است و فقط وقتی `dangerouslyAllowNameMatching: true` تنظیم شده باشد، برای فهرست‌های مجاز اتاق در زمان اجرا اعمال می‌شود.
- اگر نام یک اتاق به شناسه یا نام مستعار حل نشود، در حل فهرست مجاز زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای کاربر از نوع فهرست مجاز (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (ایمن‌ترین حالت). ورودی‌های کاربری غیرشناسه‌ای به‌طور پیش‌فرض نادیده گرفته می‌شوند. اگر `dangerouslyAllowNameMatching: true` را تنظیم کنید، تطابق‌های دقیق نام نمایشی دایرکتوری Matrix در زمان راه‌اندازی و هر زمان که فهرست مجاز هنگام اجرای پایشگر تغییر کند، حل می‌شوند؛ ورودی‌هایی که قابل حل نباشند در زمان اجرا نادیده گرفته می‌شوند.

کلیدهای فهرست مجاز اتاق (`groups`، `rooms` قدیمی) باید شناسه اتاق یا نام مستعار باشند. کلیدهای نام ساده اتاق به‌طور پیش‌فرض نادیده گرفته می‌شوند؛ `dangerouslyAllowNameMatching: true` جست‌وجوی best-effort را در برابر نام اتاق‌های عضو‌شده بازمی‌گرداند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال کنید.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی زمانی که چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقادیر سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث می‌رسند.
- `homeserver`: URL سرور خانگی، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: اجازه می‌دهد این حساب به `localhost`، IPهای LAN/Tailscale، یا نام‌های میزبان داخلی وصل شود.
- `proxy`: URL اختیاری پروکسی HTTP(S) برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقادیر متن‌واضح و SecretRef در ارائه‌دهنده‌های env/file/exec پشتیبانی می‌شوند ([مدیریت Secrets](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقادیر متن‌واضح و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: URL آواتار خودِ ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد رویدادهایی که هنگام همگام‌سازی راه‌اندازی واکشی می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال کنید. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأییدنشده باشد، هنگام راه‌اندازی به‌طور خودکار درخواست خودتأییدی می‌کند.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار بعدی هنگام راه‌اندازی. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همه DMها نادیده گرفته می‌شوند. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از اینکه ربات به اتاق پیوست و آن را به‌عنوان DM طبقه‌بندی کرد اعمال می‌شود؛ روی مدیریت دعوت اثری ندارد.
- `dm.allowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی فقط برای DM برای رشته‌سازی پاسخ‌ها (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌ها را از دیگر حساب‌های ربات Matrix پیکربندی‌شده بپذیرید (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های فعال DM (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` مجبور می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `dangerouslyAllowNameMatching`: وقتی `true` باشد، جست‌وجوی دایرکتوری نام نمایشی Matrix را برای ورودی‌های فهرست مجاز کاربر و جست‌وجوی نام اتاق‌های عضو‌شده را برای کلیدهای فهرست مجاز اتاق مجاز می‌کند. شناسه‌های کامل `@user:server` و شناسه‌ها یا نام‌های مستعار اتاق را ترجیح دهید.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. برای هر دعوت Matrix، از جمله دعوت‌های سبک DM، اعمال می‌شود.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار در برابر سرور خانگی حل می‌شوند، نه در برابر وضعیتی که اتاق دعوت‌کننده ادعا می‌کند.
- `contextVisibility`: نمایانی زمینه تکمیلی (`"all"` پیش‌فرض، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی نشستِ متصل به رشته و چرخه عمر.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا شکل شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های کامل‌شده دستیار به‌عنوان پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد نویسه) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی یک پیام اتاق عامل را فعال می‌کند، به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه رسانه بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش تأیید برای این کانال/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزاردهی و بازنویسی‌های هر اتاق

- `actions`: کنترل دسترسی ابزار برای هر کنش (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از حل از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاق ارث‌بری‌شده را به یک حساب مشخص محدود کنید.
  - `groups.<room>.allowBots`: بازنویسی هر اتاق برای تنظیم سطح کانال (`true` یا `"mentions"`).
  - `groups.<room>.users`: فهرست مجاز فرستنده برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی هر اتاق برای کنترل الزام اشاره. `true` الزام‌های اشاره را برای آن اتاق غیرفعال می‌کند؛ `false` دوباره آن‌ها را اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر skill برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه اعلان سیستمی برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق اعلان‌های بومی Matrix تحویل دهید.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که مجاز به تأیید هستند. به `dm.allowFrom` برمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: فهرست‌های مجاز اختیاری عامل/نشست برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل الزام اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
