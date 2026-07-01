---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی Matrix E2EE و راستی‌آزمایی
summary: وضعیت پشتیبانی ماتریس، راه‌اندازی، و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-07-01T13:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال قابل دانلود برای OpenClaw است.
این Plugin از `matrix-js-sdk` رسمی استفاده می‌کند و از پیام‌های مستقیم، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، مکان، و E2EE پشتیبانی می‌کند.

## نصب

پیش از پیکربندی کانال، Matrix را از ClawHub نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

مشخصات خام Plugin ابتدا ClawHub را امتحان می‌کنند، سپس به npm برمی‌گردند. برای اجبار به استفاده از منبع رجیستری، از `openclaw plugins install clawhub:@openclaw/matrix` یا `openclaw plugins install npm:@openclaw/matrix` استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`‏ Plugin را ثبت و فعال می‌کند، بنابراین به مرحلهٔ جداگانهٔ `openclaw plugins enable matrix` نیازی نیست. با این حال Plugin تا زمانی که کانال زیر را پیکربندی نکنید کاری انجام نمی‌دهد. برای رفتار عمومی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. روی homeserver خود یک حساب Matrix بسازید.
2. `channels.matrix` را یا با `homeserver` + `accessToken`، یا با `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک پیام مستقیم با ربات شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید - دعوت‌های تازه فقط زمانی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

جادوگر این موارد را می‌پرسد: URL‏ homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسهٔ کاربر (فقط برای احراز هویت با گذرواژه)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، جادوگر یک میانبر متغیر محیطی پیشنهاد می‌دهد. برای حل‌کردن نام اتاق‌ها پیش از ذخیرهٔ allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، جادوگر پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است. با مقدار پیش‌فرض، ربات تا زمانی که دستی عضو نشوید در اتاق‌ها یا پیام‌های مستقیم جدید از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده پیام مستقیم است یا گروه، بنابراین همهٔ دعوت‌ها - از جمله دعوت‌های شبیه پیام مستقیم - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعداً اعمال می‌شود، پس از اینکه ربات عضو شده و اتاق دسته‌بندی شده است.

<Warning>
برای محدودکردن دعوت‌هایی که ربات می‌پذیرد، `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` تنظیم کنید، یا برای پذیرش همهٔ دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط هدف‌های پایدار را می‌پذیرد: `!roomId:server`،‏ `#alias:server`، یا `*`. نام‌های سادهٔ اتاق رد می‌شوند؛ ورودی‌های alias در برابر homeserver حل می‌شوند، نه در برابر وضعیتی که اتاق دعوت‌شده ادعا می‌کند.
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

### قالب‌های هدف allowlist

بهتر است allowlistهای پیام مستقیم و اتاق با شناسه‌های پایدار پر شوند:

- پیام‌های مستقیم (`dm.allowFrom`،‏ `groupAllowFrom`،‏ `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی به‌طور پیش‌فرض نادیده گرفته می‌شوند چون تغییرپذیرند؛ فقط وقتی صراحتاً به سازگاری با ورودی‌های نام نمایشی نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- کلیدهای allowlist اتاق (`groups`،‏ `rooms` قدیمی): از `!room:server` یا `#alias:server` استفاده کنید. نام‌های سادهٔ اتاق به‌طور پیش‌فرض نادیده گرفته می‌شوند؛ فقط وقتی صراحتاً به سازگاری با جست‌وجوی نام اتاق‌های عضو‌شده نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- allowlistهای دعوت (`autoJoinAllowlist`): از `!room:server`،‏ `#alias:server`، یا `*` استفاده کنید. نام‌های سادهٔ اتاق رد می‌شوند.

### عادی‌سازی شناسهٔ حساب

جادوگر یک نام دوستانه را به شناسهٔ حساب عادی‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های متغیر محیطی scoped escape می‌شود تا دو حساب با هم تداخل نکنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cache‌شده

Matrix اعتبارنامه‌های cache‌شده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌دار: `credentials-<account>.json`

وقتی اعتبارنامه‌های cache‌شده در آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد Matrix را پیکربندی‌شده در نظر می‌گیرد - این شامل راه‌اندازی، `openclaw doctor`، و probeهای وضعیت کانال می‌شود.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌دار از شناسهٔ حساب که پیش از پسوند درج شده استفاده می‌کنند.

| حساب پیش‌فرض          | حساب نام‌دار (`<ID>` شناسهٔ حساب عادی‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`،‏ `MATRIX_OPS_ACCESS_TOKEN`، و همین‌طور ادامه پیدا می‌کنند. متغیرهای محیطی کلید بازیابی توسط جریان‌های CLI آگاه از بازیابی (`verify backup restore`،‏ `verify device`،‏ `verify bootstrap`) خوانده می‌شوند، وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` نمی‌تواند از یک فایل `.env` workspace تنظیم شود؛ [فایل‌های `.env` workspace](/fa/gateway/security) را ببینید.

## نمونهٔ پیکربندی

یک خط مبنای عملی با جفت‌سازی پیام مستقیم، allowlist اتاق، و E2EE:

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

## پیش‌نمایش‌های streaming

streaming پاسخ Matrix اختیاری و نیازمند فعال‌سازی است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال تولید دستیار را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر block کامل‌شده به‌عنوان پیام Matrix جداگانهٔ خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه‌داشتن پیش‌نمایش‌های زندهٔ پاسخ ولی پنهان‌کردن خط‌های موقت ابزار/پیشرفت، از فرم object استفاده کنید:

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

فرم کامل object مقدار `{ mode, preview, progress }` را می‌پذیرد:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: یک برچسب سفارشی، `"auto"` یا تنظیم‌نشده برای انتخاب از برچسب‌های پیکربندی‌شده یا داخلی، یا `false` برای پنهان‌کردن خط برچسب.
- `progress.labels`: برچسب‌های نامزد که فقط وقتی `label` برابر `"auto"` باشد یا تنظیم نشده باشد استفاده می‌شوند. برای پیش‌فرض‌های داخلی، آن را تنظیم‌نشده رها کنید.
- `progress.maxLines`: بیشترین تعداد خط‌های پیشرفت rolling که در پیش‌نویس نگه داشته می‌شوند. پس از این حد، خط‌های قدیمی‌تر کوتاه می‌شوند.
- `progress.maxLineChars`: بیشترین تعداد نویسه در هر خط پیشرفت فشرده پیش از کوتاه‌سازی.
- `progress.toolProgress`: وقتی `true` باشد (پیش‌فرض)، فعالیت زندهٔ ابزار/پیشرفت در پیش‌نویس ظاهر می‌شود.

| `streaming`       | رفتار                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (پیش‌فرض) | منتظر پاسخ کامل می‌ماند، یک‌بار ارسال می‌کند. `true` ↔ `"partial"`،‏ `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | هنگام نوشتن block فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. کلاینت‌های Matrix معمولی ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه ویرایش نهایی.              |
| `"quiet"`         | مانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط زمانی اعلان می‌گیرند که یک قاعدهٔ push برای هر کاربر با ویرایش نهایی‌شده مطابق شود (پایین را ببینید). |
| `"progress"`      | خط‌های پیشرفت فشردهٔ جداگانه را با استفاده از یک پیش‌نویس پیشرفت ارسال می‌کند.                                                                                                     |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (پیش‌فرض)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای block فعلی، blockهای کامل‌شده به‌عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای block فعلی، درجا نهایی می‌شود |
| `"off"`                 | برای هر block تمام‌شده یک پیام Matrix اعلان‌دار                     | یک پیام Matrix اعلان‌دار برای پاسخ کامل      |

نکته‌ها:

- اگر یک پیش‌نمایش از محدودیت اندازهٔ هر رویداد Matrix عبور کند، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط نهایی برمی‌گردد.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌صورت عادی ارسال می‌کنند. اگر یک پیش‌نمایش stale دیگر نتواند با ایمنی دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار وقتی streaming پیش‌نمایش Matrix فعال باشد به‌طور پیش‌فرض فعال‌اند. برای نگه‌داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ اما رهاکردن پیشرفت ابزار روی مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش باعث فراخوانی‌های اضافی Matrix API می‌شوند. اگر محافظه‌کارانه‌ترین پروفایل محدودیت نرخ را می‌خواهید، `streaming: "off"` را نگه دارید.

## پیام‌های صوتی

یادداشت‌های صوتی ورودی Matrix پیش از gate ذکر اتاق رونویسی می‌شوند. این باعث می‌شود یادداشت صوتی‌ای که نام ربات را می‌گوید agent را در اتاقی با `requireMention: true` فعال کند، و به agent به‌جای فقط یک placeholder پیوست صوتی، رونویسی را بدهد.

Matrix از ارائه‌دهندهٔ رسانهٔ صوتی مشترک که زیر `tools.media.audio` پیکربندی شده استفاده می‌کند، مانند OpenAI `gpt-4o-mini-transcribe`. برای راه‌اندازی ارائه‌دهنده و محدودیت‌ها، [نمای کلی ابزارهای رسانه](/fa/tools/media-overview) را ببینید.

جزئیات رفتار:

- رویدادهای `m.audio` و رویدادهای `m.file` با نوع MIME از نوع `audio/*` واجد شرایط هستند.
- در اتاق‌های رمزنگاری‌شده، OpenClaw پیوست را پیش از رونویسی از طریق مسیر رسانه‌ای Matrix موجود رمزگشایی می‌کند.
- رونویس در پرامپت عامل به‌عنوان تولیدشده توسط ماشین و غیرقابل‌اعتماد علامت‌گذاری می‌شود.
- پیوست به‌عنوان قبلاً رونویسی‌شده علامت‌گذاری می‌شود تا ابزارهای رسانه‌ای پایین‌دست همان یادداشت صوتی را دوباره رونویسی نکنند.
- برای غیرفعال کردن سراسری رونویسی صوتی، `tools.media.audio.enabled: false` را تنظیم کنید.

## فراداده تأیید

پرامپت‌های تأیید بومی Matrix رویدادهای عادی `m.room.message` هستند که محتوای رویداد سفارشی ویژه OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی محتوای رویداد را مجاز می‌داند، بنابراین کلاینت‌های استاندارد همچنان بدنه متن را نمایش می‌دهند، در حالی که کلاینت‌های آگاه از OpenClaw می‌توانند شناسه تأیید ساختاریافته، نوع، وضعیت، تصمیم‌های در دسترس، و جزئیات exec/plugin را بخوانند.

وقتی یک پرامپت تأیید برای یک رویداد Matrix بیش از حد طولانی باشد، OpenClaw متن قابل‌مشاهده را به قطعه‌ها تقسیم می‌کند و `com.openclaw.approval` را فقط به قطعه اول پیوست می‌کند. واکنش‌ها برای تصمیم‌های اجازه/رد به همان رویداد اول متصل می‌شوند، بنابراین پرامپت‌های طولانی همان هدف تأیید پرامپت‌های تک‌رویدادی را حفظ می‌کنند.

### قواعد push خودمیزبان برای پیش‌نمایش‌های نهایی‌شده بی‌صدا

`streaming: "quiet"` فقط پس از نهایی شدن یک بلوک یا نوبت به گیرندگان اطلاع می‌دهد - یک قاعده push مخصوص هر کاربر باید با نشانگر پیش‌نمایش نهایی‌شده مطابقت داشته باشد. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب قاعده، یادداشت‌های مخصوص هر homeserver)، [قواعد push در Matrix برای پیش‌نمایش‌های بی‌صدا](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های ربات-به-ربات

به‌طور پیش‌فرض، پیام‌های Matrix از دیگر حساب‌های Matrix پیکربندی‌شده OpenClaw نادیده گرفته می‌شوند.

وقتی عمداً ترافیک Matrix بین عامل‌ها را می‌خواهید، از `allowBots` استفاده کنید:

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

- `allowBots: true` پیام‌های دیگر حساب‌های ربات Matrix پیکربندی‌شده را در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` آن پیام‌ها را فقط وقتی می‌پذیرد که در اتاق‌ها به‌صورت قابل‌مشاهده به این ربات اشاره کنند. DMها همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق بازنویسی می‌کند.
- پیام‌های پذیرفته‌شده از ربات‌های پیکربندی‌شده از [محافظت مشترک در برابر حلقه ربات](/fa/channels/bot-loop-protection) استفاده می‌کنند. `channels.defaults.botLoopProtection` را پیکربندی کنید، سپس وقتی یک اتاق به بودجه متفاوتی نیاز دارد، با `channels.matrix.botLoopProtection` یا `channels.matrix.groups.<room>.botLoopProtection` بازنویسی کنید.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های پاسخ به خود جلوگیری کند.
- Matrix در اینجا پرچم بومی ربات را در معرض قرار نمی‌دهد؛ OpenClaw «نوشته‌شده توسط ربات» را به‌معنای «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده دیگر روی این Gateway OpenClaw» در نظر می‌گیرد.

هنگام فعال کردن ترافیک ربات-به-ربات در اتاق‌های مشترک، از allowlistهای سخت‌گیرانه اتاق و الزامات اشاره استفاده کنید.

## رمزنگاری و راستی‌آزمایی

در اتاق‌های رمزنگاری‌شده (E2EE)، رویدادهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزنگاری شوند. اتاق‌های رمزنگاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. هیچ پیکربندی‌ای لازم نیست - Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همه فرمان‌های `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل‌خواندن توسط ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌طور پیش‌فرض خلاصه است و لاگ‌گیری داخلی SDK بی‌صدا انجام می‌شود. نمونه‌های زیر شکل canonical را نشان می‌دهند؛ پرچم‌ها را در صورت نیاز اضافه کنید.

### فعال‌سازی رمزنگاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و cross-signing را راه‌اندازی می‌کند، در صورت نیاز یک پشتیبان room-key می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. پرچم‌های مفید:

- `--recovery-key <key>` یک کلید بازیابی را پیش از راه‌اندازی اعمال می‌کند (فرم stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` هویت cross-signing فعلی را کنار می‌گذارد و یک هویت جدید می‌سازد (فقط آگاهانه استفاده کنید)

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
- `Cross-signing verified`: SDK راستی‌آزمایی از طریق cross-signing را گزارش می‌کند
- `Signed by owner`: با کلید self-signing خودتان امضا شده است (فقط تشخیصی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیه حساب Matrix، عیب‌یابی best-effort را برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### راستی‌آزمایی این دستگاه با کلید بازیابی

کلید بازیابی حساس است - به‌جای ارسال آن در خط فرمان، از طریق stdin آن را pipe کنید. `MATRIX_RECOVERY_KEY` (یا `MATRIX_<ID>_RECOVERY_KEY` برای یک حساب نام‌دار) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این فرمان سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفته است.
- `Backup usable`: پشتیبان room-key می‌تواند با مواد بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت cross-signing در Matrix را دارد.

اگر اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی مواد پشتیبان را باز کرده باشد، با مقدار غیرصفر خارج می‌شود. در این حالت، خودراستی‌آزمایی را از یک کلاینت Matrix دیگر تمام کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

فرم کلید literal یعنی `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچه shell شما باقی می‌ماند.

### راه‌اندازی اولیه یا تعمیر cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان تعمیر و راه‌اندازی برای حساب‌های رمزنگاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی می‌کند و در صورت امکان از یک کلید بازیابی موجود دوباره استفاده می‌کند
- cross-signing را راه‌اندازی می‌کند و کلیدهای عمومی مفقود را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و cross-sign می‌کند
- اگر پشتیبان room-key سمت سرور از قبل وجود نداشته باشد، یکی می‌سازد

اگر homeserver برای بارگذاری کلیدهای cross-signing به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و سپس `m.login.password` (نیازمند `channels.matrix.password`).

پرچم‌های مفید:

- `--recovery-key-stdin` (با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` همراه کنید) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنار گذاشتن هویت cross-signing فعلی (فقط آگاهانه؛ نیاز دارد کلید بازیابی فعال ذخیره شده باشد یا با `--recovery-key-stdin` ارائه شود)

### پشتیبان room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا یک پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای room پشتیبان‌گیری‌شده را به crypto store محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد، می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان خراب با یک baseline تازه (با پذیرش از دست رفتن تاریخچه قدیمی غیرقابل‌بازیابی؛ همچنین اگر secret پشتیبان فعلی غیرقابل‌بارگذاری باشد، می‌تواند ذخیره‌سازی محرمانه را دوباره بسازد):

```bash
openclaw matrix verify backup reset --yes
```

فقط وقتی `--rotate-recovery-key` را اضافه کنید که عمداً می‌خواهید کلید بازیابی قبلی دیگر baseline تازه پشتیبان را باز نکند.

### فهرست‌کردن، درخواست‌دادن، و پاسخ‌دادن به راستی‌آزمایی‌ها

```bash
openclaw matrix verify list
```

درخواست‌های راستی‌آزمایی در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست راستی‌آزمایی ارسال می‌کند. `--own-user` خودراستی‌آزمایی را درخواست می‌کند (شما پرامپت را در یک کلاینت Matrix دیگر از همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` نمی‌تواند با پرچم‌های هدف‌گیری دیگر ترکیب شود.

برای مدیریت lifecycle سطح پایین‌تر - معمولاً هنگام shadow کردن درخواست‌های ورودی از یک کلاینت دیگر - این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌ها یا اعداد SAS                                         |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با چیزی که کلاینت دیگر نشان می‌دهد مطابقت دارد     |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی ایموجی‌ها یا اعداد مطابقت ندارند                      |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد   |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان راهنمای follow-up برای DM می‌پذیرند، وقتی راستی‌آزمایی به یک اتاق پیام مستقیم مشخص متصل شده باشد.

### یادداشت‌های چندحسابی

بدون `--account <id>`، فرمان‌های CLI مربوط به Matrix از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌دار دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌دار غیرفعال یا در دسترس نباشد، خطاها به کلید پیکربندی همان حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="رفتار هنگام راه‌اندازی">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه راستی‌آزمایی‌نشده از یک کلاینت Matrix دیگر درخواست خودراستی‌آزمایی می‌کند، موارد تکراری را رد می‌کند و cooldown اعمال می‌کند (به‌طور پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانه bootstrap رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت cross-signing فعلی دوباره استفاده می‌کند. اگر وضعیت bootstrap خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA با گذرواژه نیاز داشته باشد، راه‌اندازی یک هشدار لاگ می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل توسط مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های راستی‌آزمایی">
    Matrix اعلان‌های lifecycle راستی‌آزمایی را به‌صورت پیام‌های `m.notice` در اتاق سخت‌گیرانه DM راستی‌آزمایی ارسال می‌کند: درخواست، آماده (با راهنمای «راستی‌آزمایی با ایموجی»)، شروع/تکمیل، و جزئیات SAS (ایموجی/عدد) در صورت وجود.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر ردیابی و به‌صورت خودکار پذیرفته می‌شوند. برای خودراستی‌آزمایی، OpenClaw جریان SAS را خودکار شروع می‌کند و پس از در دسترس بودن راستی‌آزمایی ایموجی، سمت خودش را تأیید می‌کند - شما همچنان باید در کلاینت Matrix خود مقایسه کنید و «مطابقت دارند» را تأیید کنید.

    اعلان‌های سامانه راستی‌آزمایی به pipeline چت عامل ارسال نمی‌شوند.

  </Accordion>

  <Accordion title="دستگاه Matrix حذف‌شده یا نامعتبر">
    اگر `verify status` بگوید دستگاه فعلی دیگر روی homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw ایجاد کنید. برای ورود با گذرواژه:

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
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست کنید و موارد کهنه را پاک‌سازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    رمزنگاری سرتاسری Matrix از مسیر رمزنگاری Rust رسمی `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌ماند (با مجوزهای محدودکننده فایل).

    وضعیت runtime رمزنگاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل sync store، crypto store، recovery key، IDB snapshot، thread bindings، و وضعیت verification در startup است. وقتی توکن تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw بهترین ریشه موجود را دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

    یک ریشه token-hash قدیمی‌تر می‌تواند مسیر عادی تداوم چرخش توکن باشد. اگر OpenClaw پیام `matrix: multiple populated token-hash storage roots detected` را ثبت کرد، دایرکتوری حساب را بررسی کنید و ریشه‌های هم‌سطح کهنه را فقط پس از تأیید سالم بودن ریشه فعال انتخاب‌شده بایگانی کنید. ترجیح دهید ریشه‌های کهنه را به‌جای حذف فوری، به یک دایرکتوری `_archive/` منتقل کنید.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

پروفایل خود Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های avatar با قالب `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` را ارسال می‌کنید، OpenClaw ابتدا فایل را آپلود می‌کند و URL حل‌شده `mxc://` را در `channels.matrix.avatarUrl` (یا override مخصوص هر حساب) ذخیره می‌کند.

## رشته‌ها

Matrix از رشته‌های بومی Matrix برای پاسخ‌های خودکار و ارسال‌های message-tool پشتیبانی می‌کند. دو کنترل مستقل رفتار را تعیین می‌کنند:

### مسیریابی جلسه (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به جلسه‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همه اتاق‌های DM با peer مسیریابی‌شده یکسان، یک جلسه مشترک دارند.
- `"per-room"`: هر اتاق DM در Matrix کلید جلسه خودش را می‌گیرد، حتی وقتی peer یکسان باشد.

اتصال‌های صریح مکالمه همیشه بر `sessionScope` مقدم‌اند، بنابراین اتاق‌ها و رشته‌های متصل‌شده هدف جلسه انتخاب‌شده خود را حفظ می‌کنند.

### رشته‌بندی پاسخ (`threadReplies`)

`threadReplies` تعیین می‌کند bot پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها در سطح بالا هستند. پیام‌های رشته‌ای ورودی روی جلسه والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در همان رشته بوده باشد، داخل رشته پاسخ بده.
- `"always"`: داخل رشته‌ای با ریشه پیام محرک پاسخ بده؛ آن مکالمه از نخستین محرک به بعد از طریق جلسه متناظر با دامنه رشته مسیریابی می‌شود.

`dm.threadReplies` این رفتار را فقط برای DMها override می‌کند - برای مثال، رشته‌های اتاق را ایزوله نگه دارید و در عین حال DMها را تخت نگه دارید.

### ارث‌بری رشته و فرمان‌های slash

- پیام‌های رشته‌ای ورودی، پیام ریشه رشته را به‌عنوان زمینه اضافی agent شامل می‌کنند.
- ارسال‌های message-tool هنگام هدف‌گیری همان اتاق (یا همان هدف کاربر DM)، رشته فعلی Matrix را خودکار به ارث می‌برند، مگر اینکه `threadId` صریح ارائه شده باشد.
- استفاده دوباره از هدف کاربر DM فقط وقتی فعال می‌شود که metadata جلسه فعلی همان peer در DM روی همان حساب Matrix را ثابت کند؛ در غیر این صورت OpenClaw به مسیریابی عادی با دامنه کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` متصل به رشته همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- `/focus` در سطح بالا وقتی `threadBindings.spawnSessions` فعال باشد، یک رشته Matrix جدید می‌سازد و آن را به جلسه هدف متصل می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشته Matrix موجود، همان رشته را در همان‌جا متصل می‌کند.

وقتی OpenClaw تشخیص می‌دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان جلسه مشترک تداخل دارد، یک `m.notice` یک‌باره در آن اتاق ارسال می‌کند که به راه گریز `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط وقتی اتصال‌های رشته فعال باشند ظاهر می‌شود.

## اتصال‌های مکالمه ACP

اتاق‌ها، DMها، و رشته‌های موجود Matrix را می‌توان بدون تغییر سطح چت به workspaceهای پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشته موجود Matrix که می‌خواهید همچنان استفاده کنید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق Matrix در سطح بالا، DM/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های آینده به جلسه ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشته Matrix موجود، `--bind here` همان رشته فعلی را در همان‌جا متصل می‌کند.
- `/new` و `/reset` همان جلسه ACP متصل‌شده را در همان‌جا بازنشانی می‌کنند.
- `/acp close` جلسه ACP را می‌بندد و اتصال را حذف می‌کند.

یادداشت‌ها:

- `--bind here` یک رشته فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` روی `/acp spawn --thread auto|here` گیت می‌گذارد، جایی که OpenClaw باید یک رشته فرزند Matrix ایجاد یا متصل کند.

### پیکربندی اتصال رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و همچنین از overrideهای مخصوص هر کانال پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد جلسه‌های متصل به رشته در Matrix به‌صورت پیش‌فرض فعال است:

- `threadBindings.spawnSessions: false` را تنظیم کنید تا `/focus` در سطح بالا و `/acp spawn --thread auto|here` از ایجاد/اتصال رشته‌های Matrix منع شوند.
- وقتی ایجاد رشته‌های subagent بومی نباید transcript والد را fork کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` گیت می‌شود:

- `react` به یک رویداد Matrix واکنش اضافه می‌کند.
- `reactions` خلاصه واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود bot را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش emoji مشخص‌شده را از bot حذف می‌کند.

**ترتیب حل‌وفصل** (نخستین مقدار تعریف‌شده برنده است):

| تنظیم                   | ترتیب                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | هر حساب → کانال → `messages.ackReaction` → fallback emoji هویت agent            |
| `ackReactionScope`      | هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"`      |
| `reactionNotifications` | هر حساب → کانال → پیش‌فرض `"own"`                                               |

`reactionNotifications: "own"` رویدادهای افزوده‌شده `m.reaction` را وقتی هدفشان پیام‌های Matrix نوشته‌شده توسط bot باشد فوروارد می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی تبدیل نمی‌شوند، زیرا Matrix آن‌ها را به‌عنوان redaction عرضه می‌کند، نه حذف‌های مستقل `m.reaction`.

## زمینه تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی پیام یک اتاق Matrix agent را تحریک می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` شامل شوند. به `messages.groupChat.historyLimit` fallback می‌کند؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی `0` را تنظیم کنید.
- تاریخچه اتاق Matrix فقط مخصوص اتاق است. DMها همچنان از تاریخچه عادی جلسه استفاده می‌کنند.
- تاریخچه اتاق Matrix فقط pending است: OpenClaw پیام‌های اتاق را که هنوز پاسخی را تحریک نکرده‌اند buffer می‌کند، سپس وقتی یک mention یا محرک دیگر برسد از آن پنجره snapshot می‌گیرد.
- پیام محرک فعلی در `InboundHistory` شامل نمی‌شود؛ برای آن turn در بدنه اصلی ورودی می‌ماند.
- تلاش‌های دوباره همان رویداد Matrix به‌جای حرکت رو به جلو به پیام‌های جدیدتر اتاق، از snapshot تاریخچه اصلی دوباره استفاده می‌کنند.

## دیدپذیری زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینه تکمیلی اتاق مانند متن پاسخ واکشی‌شده، ریشه‌های رشته، و تاریخچه pending پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینه تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینه تکمیلی را به فرستنده‌هایی فیلتر می‌کند که توسط بررسی‌های allowlist فعال اتاق/کاربر مجاز شده‌اند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شده صریح را نگه می‌دارد.

این تنظیم روی دیدپذیری زمینه تکمیلی اثر می‌گذارد، نه اینکه خود پیام ورودی بتواند پاسخی را تحریک کند یا نه.
مجوزدهی محرک همچنان از `groupPolicy`، `groups`، `groupAllowFrom`، و تنظیمات policy مربوط به DM می‌آید.

## policy مربوط به DM و اتاق

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

برای ساکت کردن کامل DMها در حالی که اتاق‌ها همچنان کار کنند، `dm.enabled: false` را تنظیم کنید:

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

برای رفتار mention-gating و allowlist، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونه pairing برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشده Matrix پیش از تأیید همچنان به شما پیام بدهد، OpenClaw همان کد pairing در انتظار را دوباره استفاده می‌کند و ممکن است پس از یک cooldown کوتاه، به‌جای ساختن کد جدید، یک پاسخ یادآوری ارسال کند.

برای جریان مشترک pairing در DM و چیدمان ذخیره‌سازی، [Pairing](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگام‌سازی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنه `m.direct` روبه‌رو شود که به اتاق‌های solo قدیمی اشاره می‌کنند، نه DM زنده. نگاشت فعلی را برای یک peer بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای راه‌اندازی‌های چندحسابی `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانه 1:1 را که از قبل در `m.direct` نگاشت شده ترجیح می‌دهد
- به هر DM سخت‌گیرانه 1:1 که اکنون با آن کاربر join شده باشد fallback می‌کند
- اگر DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه می‌سازد و `m.direct` را بازنویسی می‌کند

اتاق‌های قدیمی را به‌صورت خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آینده Matrix، اعلان‌های verification، و سایر جریان‌های پیام مستقیم، اتاق درست را هدف بگیرند.

## تأییدهای exec

Matrix می‌تواند به‌عنوان کلاینت تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای override مخصوص هر حساب، زیر `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تأییدها را از طریق promptهای بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده باشد یا `"auto"` باشد، Matrix پس از اینکه حداقل یک approver قابل حل باشد به‌صورت خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که اجازه تأیید درخواست‌های exec را دارند. اختیاری است - به `channels.matrix.dm.allowFrom` fallback می‌کند.
- `target`: محل ارسال promptها. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند؛ `"channel"` به اتاق یا DM مبدأ Matrix ارسال می‌کند؛ `"both"` به هر دو ارسال می‌کند.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام agentها/جلسه‌ها تحویل Matrix را تحریک کنند.

مجوزدهی بین انواع تأیید کمی متفاوت است:

- **تأییدهای exec** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` fallback می‌کنند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجوزدهی می‌شوند.

هر دو نوع، میان‌برهای واکنش Matrix و به‌روزرسانی‌های پیام را مشترکاً استفاده می‌کنند. Approverها میان‌برهای واکنش را روی پیام تأیید اصلی می‌بینند:

- `✅` یک‌بار مجاز کن
- `❌` رد کن
- `♾️` همیشه مجاز کن (وقتی policy مؤثر exec اجازه دهد)

دستورهای اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکننده‌های حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانال برای تأییدهای exec شامل متن دستور است - `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای exec](/fa/tools/exec-approvals).

## دستورهای اسلش

دستورهای اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیماً در پیام‌های خصوصی کار می‌کنند. در اتاق‌ها، OpenClaw همچنین دستورهایی را تشخیص می‌دهد که با اشاره Matrix خود بات شروع شده باشند؛ بنابراین `@bot:server /new` مسیر دستور را بدون regex سفارشی برای اشاره فعال می‌کند. این باعث می‌شود بات به فرستاده‌های سبک اتاق یعنی `@mention /command` که Element و کلاینت‌های مشابه هنگام تکمیل خودکار نام بات پیش از تایپ دستور تولید می‌کنند، پاسخ‌گو بماند.

قواعد مجوز همچنان اعمال می‌شوند: فرستنده‌های دستور باید همان سیاست‌های allowlist/مالک پیام خصوصی یا اتاق را مانند پیام‌های عادی برآورده کنند.

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

- مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض برای حساب‌های نام‌دار عمل می‌کنند، مگر اینکه یک حساب آن‌ها را بازنویسی کند.
- یک ورودی اتاق موروثی را با `groups.<room>.account` به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` میان حساب‌ها مشترک هستند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- `defaultAccount` را تنظیم کنید تا حساب نام‌داری را انتخاب کند که مسیریابی ضمنی، بررسی‌ها و دستورهای CLI ترجیح می‌دهند.
- اگر چند حساب دارید و یکی از آن‌ها دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌طور ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌دار دارید و هیچ پیش‌فرضی انتخاب نشده است، دستورهای CLI از حدس زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را بفرستید.
- بلوک سطح بالای `channels.matrix.*` فقط زمانی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که auth آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌دار پس از آنکه اعتبارنامه‌های ذخیره‌شده auth را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌دار موجود باشد یا `defaultAccount` از قبل به یکی اشاره کند، همان حساب موجود را حفظ می‌کند. فقط کلیدهای auth/bootstrap مربوط به Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## homeserverهای خصوصی/LAN

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، homeserverهای خصوصی/داخلی Matrix را مسدود می‌کند مگر اینکه برای هر حساب به‌صراحت آن را فعال کنید.

اگر homeserver شما روی localhost، یک IP مربوط به LAN/Tailscale، یا یک hostname داخلی اجرا می‌شود، برای آن حساب Matrix گزینه `network.dangerouslyAllowPrivateNetwork` را فعال کنید:

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

این فعال‌سازی صریح فقط هدف‌های خصوصی/داخلی مورد اعتماد را مجاز می‌کند. homeserverهای عمومی با متن آشکار مانند `http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر زمان ممکن است `https://` را ترجیح دهید.

## پروکسی کردن ترافیک Matrix

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

حساب‌های نام‌دار می‌توانند پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پروکسی برای ترافیک زمان اجرای Matrix و بررسی‌های وضعیت حساب استفاده می‌کند.

## حل هدف

Matrix این شکل‌های هدف را در هر جایی که OpenClaw از شما هدف اتاق یا کاربر بخواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی هدف‌های تحویل صریح، jobهای cron، bindingها یا allowlistها، از همان بزرگی و کوچکی دقیق شناسه اتاق در Matrix استفاده کنید. OpenClaw کلیدهای داخلی session را برای ذخیره‌سازی canonical نگه می‌دارد، بنابراین آن کلیدهای lowercase منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوهای کاربر، دایرکتوری کاربران Matrix را روی همان homeserver پرس‌وجو می‌کنند.
- جست‌وجوهای اتاق، شناسه‌های اتاق و نام‌های مستعار صریح را مستقیماً می‌پذیرند. جست‌وجوی نام اتاق‌های joined به‌صورت بهترین تلاش انجام می‌شود و فقط وقتی برای allowlistهای اتاق زمان اجرا اعمال می‌شود که `dangerouslyAllowNameMatching: true` تنظیم شده باشد.
- اگر نام اتاق به شناسه یا نام مستعار حل نشود، در حل allowlist زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای کاربری سبک allowlist (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (ایمن‌ترین حالت). ورودی‌های کاربری غیرشناسه به‌طور پیش‌فرض نادیده گرفته می‌شوند. اگر `dangerouslyAllowNameMatching: true` را تنظیم کنید، تطابق‌های دقیق نام نمایشی در دایرکتوری Matrix هنگام راه‌اندازی و هر زمان که allowlist در حال اجرای monitor تغییر کند، حل می‌شوند؛ ورودی‌هایی که قابل حل نیستند در زمان اجرا نادیده گرفته می‌شوند.

کلیدهای allowlist اتاق (`groups`، `rooms` قدیمی) باید شناسه‌های اتاق یا نام‌های مستعار باشند. کلیدهای نام ساده اتاق به‌طور پیش‌فرض نادیده گرفته می‌شوند؛ `dangerouslyAllowNameMatching: true` جست‌وجوی بهترین تلاش در برابر نام اتاق‌های joined را برمی‌گرداند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال می‌کند.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌دار برای هر حساب. مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث می‌رسند.
- `homeserver`: URL homeserver، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، IPهای LAN/Tailscale، یا hostnameهای داخلی متصل شود.
- `proxy`: URL پروکسی HTTP(S) اختیاری برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای auth مبتنی بر توکن. مقدارهای متن ساده و SecretRef در providerهای env/file/exec پشتیبانی می‌شوند ([مدیریت اسرار](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقدارهای متن ساده و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه دستگاه صریح Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام password-login استفاده می‌شود.
- `avatarUrl`: URL آواتار خودِ ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد eventهایی که هنگام sync راه‌اندازی دریافت می‌شوند.

### رمزنگاری

- `encryption`: فعال‌سازی E2EE. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأیید نشده باشد، هنگام راه‌اندازی به‌طور خودکار درخواست self-verification می‌دهد.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار بعدی هنگام راه‌اندازی. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: allowlist شناسه‌های کاربر برای ترافیک اتاق.
- `mentionPatterns`: الگوهای regex محدود به scope برای اشاره‌های اتاق. شیء با `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. کنترل می‌کند که آیا `agents.list[].groupChat.mentionPatterns` پیکربندی‌شده برای هر اتاق اعمال شوند یا نه.
- `dm.enabled`: وقتی `false` باشد، همه پیام‌های خصوصی را نادیده می‌گیرد. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از اینکه بات به اتاق پیوست و آن را به‌عنوان پیام خصوصی طبقه‌بندی کرد اعمال می‌شود؛ روی مدیریت invite اثر نمی‌گذارد.
- `dm.allowFrom`: allowlist شناسه‌های کاربر برای ترافیک پیام خصوصی.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی فقط برای پیام خصوصی جهت threading پاسخ‌ها (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌های حساب‌های بات Matrix پیکربندی‌شده دیگر را می‌پذیرد (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های فعال پیام خصوصی (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را مجبور به `"allowlist"` می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `dangerouslyAllowNameMatching`: وقتی `true` باشد، جست‌وجوی دایرکتوری نام نمایشی Matrix برای ورودی‌های allowlist کاربر و جست‌وجوی نام اتاق joined برای کلیدهای allowlist اتاق را مجاز می‌کند. شناسه‌های کامل `@user:server` و شناسه‌های اتاق یا نام‌های مستعار را ترجیح دهید.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر invite در Matrix اعمال می‌شود، از جمله inviteهای سبک پیام خصوصی.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار در برابر homeserver حل می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌کننده.
- `contextVisibility`: نمایانی context تکمیلی (`"all"` پیش‌فرض، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی session وابسته به thread و lifecycle.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، `"progress"`، یا شکل شیء `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های تکمیل‌شده assistant به‌عنوان پیام‌های progress جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، بر اساس تعداد نویسه تقسیم می‌کند) یا `"newline"` (در مرزهای خط تقسیم می‌کند).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی پیام اتاق agent را فعال می‌کند، به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه رسانه بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش ack برای این کانال/حساب.
- `ackReactionScope`: بازنویسی scope (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: دروازه‌گذاری ابزار برای هر اقدام (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از resolve شدن از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاق موروثی را به یک حساب مشخص محدود می‌کند.
  - `groups.<room>.enabled`: کلید فعال‌سازی برای هر اتاق. وقتی `false` باشد، اتاق طوری نادیده گرفته می‌شود که انگار در نگاشت وجود ندارد.
  - `groups.<room>.requireMention`: بازنویسی الزام mention در سطح کانال برای هر اتاق.
  - `groups.<room>.allowBots`: بازنویسی تنظیم سطح کانال برای هر اتاق (`true` یا `"mentions"`).
  - `groups.<room>.botLoopProtection`: بازنویسی بودجه محافظت در برابر حلقه بات‌به‌بات برای هر اتاق.
  - `groups.<room>.users`: فهرست مجاز فرستندگان برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های مجاز/غیرمجاز ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی دروازه‌گذاری mention برای هر اتاق. `true` الزامات mention را برای آن اتاق غیرفعال می‌کند؛ `false` دوباره آن‌ها را اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر مهارت برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه system prompt برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق promptهای بومی Matrix تحویل می‌دهد.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که مجاز به تأیید هستند. به `dm.allowFrom` fallback می‌کند.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: فهرست‌های مجاز اختیاری agent/session برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) - احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
