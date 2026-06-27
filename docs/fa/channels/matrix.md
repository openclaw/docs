---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی Matrix E2EE و راستی‌آزمایی
summary: وضعیت پشتیبانی Matrix، راه‌اندازی و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-06-27T17:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال قابل دانلود برای OpenClaw است.
از `matrix-js-sdk` رسمی استفاده می‌کند و از پیام‌های مستقیم، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، موقعیت مکانی و E2EE پشتیبانی می‌کند.

## نصب

پیش از پیکربندی کانال، Matrix را از ClawHub نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

مشخصات Plugin بدون پیشوند ابتدا ClawHub را امتحان می‌کنند، سپس به npm برمی‌گردند. برای اجبار منبع رجیستری، از `openclaw plugins install clawhub:@openclaw/matrix` یا `openclaw plugins install npm:@openclaw/matrix` استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` این Plugin را ثبت و فعال می‌کند، بنابراین به مرحله جداگانه `openclaw plugins enable matrix` نیازی نیست. با این حال، Plugin تا وقتی کانال زیر را پیکربندی نکنید کاری انجام نمی‌دهد. برای رفتار عمومی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را یا با `homeserver` + `accessToken`، یا با `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک پیام مستقیم با ربات شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید - دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

جادوگر این موارد را می‌پرسد: URL homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسه کاربر (فقط احراز هویت گذرواژه‌ای)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، جادوگر یک میان‌بر متغیر محیطی پیشنهاد می‌دهد. برای حل‌کردن نام اتاق‌ها پیش از ذخیره allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، جادوگر پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است. با مقدار پیش‌فرض، ربات تا زمانی که دستی عضو نشوید در اتاق‌ها یا پیام‌های مستقیم جدید حاصل از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده پیام مستقیم است یا گروه، بنابراین همه دعوت‌ها - از جمله دعوت‌های شبیه پیام مستقیم - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدا، پس از پیوستن ربات و دسته‌بندی اتاق اعمال می‌شود.

<Warning>
برای محدودکردن دعوت‌هایی که ربات می‌پذیرد، `autoJoin: "allowlist"` به‌همراه `autoJoinAllowlist` را تنظیم کنید، یا برای پذیرش همه دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط هدف‌های پایدار را می‌پذیرد: `!roomId:server`، `#alias:server`، یا `*`. نام‌های ساده اتاق رد می‌شوند؛ مدخل‌های alias در برابر homeserver حل می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌شده.
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

برای پذیرش همه دعوت‌ها، از `autoJoin: "always"` استفاده کنید.

### قالب‌های هدف allowlist

بهتر است allowlistهای پیام مستقیم و اتاق با شناسه‌های پایدار پر شوند:

- پیام‌های مستقیم (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی به‌صورت پیش‌فرض نادیده گرفته می‌شوند چون تغییرپذیرند؛ فقط وقتی صراحتا به سازگاری با مدخل‌های نام نمایشی نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- کلیدهای allowlist اتاق (`groups`، `rooms` قدیمی): از `!room:server` یا `#alias:server` استفاده کنید. نام‌های ساده اتاق به‌صورت پیش‌فرض نادیده گرفته می‌شوند؛ فقط وقتی صراحتا به سازگاری با جست‌وجوی نام اتاق‌های عضو شده نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- allowlistهای دعوت (`autoJoinAllowlist`): از `!room:server`، `#alias:server`، یا `*` استفاده کنید. نام‌های ساده اتاق رد می‌شوند.

### عادی‌سازی شناسه حساب

جادوگر یک نام دوستانه را به شناسه حساب عادی‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های متغیر محیطی scoped escape می‌شود تا دو حساب با هم تداخل نکنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cache‌شده

Matrix اعتبارنامه‌های cache‌شده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌گذاری‌شده: `credentials-<account>.json`

وقتی اعتبارنامه‌های cache‌شده آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد، Matrix را پیکربندی‌شده در نظر می‌گیرد - این شامل راه‌اندازی، `openclaw doctor`، و probeهای وضعیت کانال می‌شود.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌گذاری‌شده شناسه حساب را پیش از پسوند وارد می‌کنند.

| حساب پیش‌فرض          | حساب نام‌گذاری‌شده (`<ID>` شناسه حساب عادی‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN`، و موارد مشابه تبدیل می‌شوند. متغیرهای محیطی recovery-key توسط جریان‌های CLI آگاه از recovery (`verify backup restore`، `verify device`، `verify bootstrap`) وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید خوانده می‌شوند.

`MATRIX_HOMESERVER` نمی‌تواند از یک فایل `.env` فضای کاری تنظیم شود؛ [فایل‌های `.env` فضای کاری](/fa/gateway/security) را ببینید.

## نمونه پیکربندی

یک مبنای عملی با جفت‌سازی پیام مستقیم، allowlist اتاق، و E2EE:

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

streaming پاسخ Matrix اختیاری است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال تولید assistant را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر بلوک تکمیل‌شده به‌عنوان پیام Matrix جداگانه خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه‌داشتن پیش‌نمایش‌های زنده پاسخ اما پنهان‌کردن خطوط موقت ابزار/پیشرفت، از قالب object استفاده کنید:

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

| `streaming`          | رفتار                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (پیش‌فرض)    | منتظر پاسخ کامل می‌ماند و یک‌بار ارسال می‌کند. `true` ↔ `"partial"`، `false` ↔ `"off"`.                                                                                         |
| `"partial"`          | هم‌زمان با نوشتن بلوک فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. کلاینت‌های معمول Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه ویرایش نهایی.              |
| `"quiet"`            | مانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان می‌گیرند که یک rule push برای هر کاربر با ویرایش نهایی‌شده منطبق شود (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                           | `blockStreaming: false` (پیش‌فرض)                   |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای بلوک فعلی، بلوک‌های تکمیل‌شده به‌صورت پیام نگه داشته می‌شوند | پیش‌نویس زنده برای بلوک فعلی، درجا نهایی می‌شود |
| `"off"`                 | یک پیام Matrix اعلان‌دار برای هر بلوک تمام‌شده                  | یک پیام Matrix اعلان‌دار برای پاسخ کامل             |

نکات:

- اگر یک پیش‌نمایش از سقف اندازه هر event در Matrix عبور کند، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط نهایی برمی‌گردد.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌صورت عادی ارسال می‌کنند. اگر یک پیش‌نمایش قدیمی دیگر نتواند با اطمینان دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار وقتی streaming پیش‌نمایش Matrix فعال باشد به‌صورت پیش‌فرض فعال‌اند. برای نگه‌داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ اما باقی‌گذاشتن پیشرفت ابزار روی مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش هزینه تماس‌های اضافی Matrix API دارند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را نگه دارید.

## پیام‌های صوتی

یادداشت‌های صوتی ورودی Matrix پیش از gate اشاره اتاق رونویسی می‌شوند. این باعث می‌شود یادداشت صوتی‌ای که نام ربات را می‌گوید agent را در اتاق `requireMention: true` فعال کند، و به agent به‌جای فقط یک placeholder پیوست صوتی، transcript داده شود.

Matrix از ارائه‌دهنده رسانه صوتی مشترک پیکربندی‌شده زیر `tools.media.audio` استفاده می‌کند، مانند OpenAI `gpt-4o-mini-transcribe`. برای راه‌اندازی ارائه‌دهنده و محدودیت‌ها، [نمای کلی ابزارهای رسانه](/fa/tools/media-overview) را ببینید.

جزئیات رفتار:

- eventهای `m.audio` و eventهای `m.file` با MIME type از نوع `audio/*` واجد شرایط‌اند.
- در اتاق‌های رمزگذاری‌شده، OpenClaw پیوست را پیش از رونویسی از مسیر رسانه Matrix موجود decrypt می‌کند.
- transcript در prompt agent به‌عنوان تولیدشده توسط ماشین و غیرقابل اعتماد علامت‌گذاری می‌شود.
- پیوست به‌عنوان قبلا رونویسی‌شده علامت‌گذاری می‌شود تا ابزارهای رسانه پایین‌دستی همان یادداشت صوتی را دوباره رونویسی نکنند.
- برای غیرفعال‌کردن رونویسی صوتی به‌صورت سراسری، `tools.media.audio.enabled: false` را تنظیم کنید.

## فراداده approval

promptهای approval بومی Matrix، eventهای عادی `m.room.message` با محتوای event سفارشی مخصوص OpenClaw زیر `com.openclaw.approval` هستند. Matrix کلیدهای محتوای event سفارشی را مجاز می‌داند، بنابراین کلاینت‌های معمول همچنان body متنی را render می‌کنند، در حالی که کلاینت‌های آگاه از OpenClaw می‌توانند شناسه، نوع، state، تصمیم‌های موجود، و جزئیات exec/plugin ساختاریافته approval را بخوانند.

وقتی یک prompt approval برای یک event در Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را قطعه‌بندی می‌کند و `com.openclaw.approval` را فقط به قطعه اول پیوست می‌کند. واکنش‌ها برای تصمیم‌های allow/deny به همان event اول متصل‌اند، بنابراین promptهای طولانی همان هدف approval را مانند promptهای تک-event نگه می‌دارند.

### ruleهای push خودمیزبان برای پیش‌نمایش‌های نهایی quiet

`streaming: "quiet"` فقط وقتی یک بلوک یا turn نهایی می‌شود به گیرندگان اعلان می‌دهد - یک rule push برای هر کاربر باید با marker پیش‌نمایش نهایی‌شده منطبق شود. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب rule، نکات هر homeserver)، [ruleهای push Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های ربات-به-ربات

به‌صورت پیش‌فرض، پیام‌های Matrix از دیگر حساب‌های Matrix پیکربندی‌شده OpenClaw نادیده گرفته می‌شوند.

وقتی عمدا ترافیک Matrix بین agentها را می‌خواهید، از `allowBots` استفاده کنید:

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

- `allowBots: true` پیام‌ها را از دیگر حساب‌های بات Matrix پیکربندی‌شده در اتاق‌های مجاز و DMها می‌پذیرد.
- `allowBots: "mentions"` این پیام‌ها را فقط زمانی می‌پذیرد که در اتاق‌ها به‌صورت قابل مشاهده این بات را منشن کنند. DMها همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق بازنویسی می‌کند.
- پیام‌های پذیرفته‌شده از بات‌های پیکربندی‌شده از [محافظت حلقه بات](/fa/channels/bot-loop-protection) مشترک استفاده می‌کنند. `channels.defaults.botLoopProtection` را پیکربندی کنید، سپس وقتی یک اتاق به بودجه متفاوتی نیاز دارد، با `channels.matrix.botLoopProtection` یا `channels.matrix.groups.<room>.botLoopProtection` بازنویسی کنید.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های پاسخ‌دهی به خود جلوگیری کند.
- Matrix در اینجا پرچم بومی بات را ارائه نمی‌کند؛ OpenClaw «نوشته‌شده توسط بات» را به‌معنای «ارسال‌شده توسط حساب Matrix پیکربندی‌شده دیگری روی این Gateway OpenClaw» در نظر می‌گیرد.

هنگام فعال‌کردن ترافیک بات‌به‌بات در اتاق‌های مشترک، از فهرست‌های مجاز سخت‌گیرانه برای اتاق‌ها و الزام‌های منشن استفاده کنید.

## رمزگذاری و راستی‌آزمایی

در اتاق‌های رمزگذاری‌شده (E2EE)، رویدادهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزگذاری شوند. اتاق‌های رمزگذاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. نیازی به پیکربندی نیست - Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همه دستورهای `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل‌خواندن برای ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌صورت پیش‌فرض خلاصه است و لاگ‌گیری داخلی SDK بی‌صداست. مثال‌های زیر شکل canonical را نشان می‌دهند؛ در صورت نیاز پرچم‌ها را اضافه کنید.

### فعال‌کردن رمزگذاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و cross-signing را راه‌اندازی اولیه می‌کند، در صورت نیاز یک پشتیبان room-key می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. پرچم‌های مفید:

- `--recovery-key <key>` پیش از راه‌اندازی اولیه، یک کلید بازیابی اعمال می‌کند (فرم stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` هویت cross-signing فعلی را کنار می‌گذارد و هویت جدیدی می‌سازد (فقط آگاهانه استفاده کنید)

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
- `Signed by owner`: با کلید self-signing خودتان امضا شده است (فقط عیب‌یابی)

`Verified by owner` فقط زمانی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیه حساب Matrix، عیب‌یابی best-effort برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### راستی‌آزمایی این دستگاه با کلید بازیابی

کلید بازیابی حساس است - به‌جای عبوردادن آن در خط فرمان، آن را از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا `MATRIX_<ID>_RECOVERY_KEY` برای حساب نام‌گذاری‌شده) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این دستور سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفته است.
- `Backup usable`: پشتیبان room-key می‌تواند با ماده بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت cross-signing در Matrix را دارد.

وقتی اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی مواد پشتیبان را باز کرده باشد، با کد غیرصفر خارج می‌شود. در آن حالت، self-verification را از کلاینت Matrix دیگری کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم مدت انتظار از `--timeout-ms <ms>` استفاده کنید.

فرم کلید صریح `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچه shell شما باقی می‌ماند.

### راه‌اندازی اولیه یا تعمیر cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` دستور تعمیر و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی اولیه می‌کند و هر جا ممکن باشد از کلید بازیابی موجود دوباره استفاده می‌کند
- cross-signing را راه‌اندازی اولیه می‌کند و کلیدهای عمومی گمشده را آپلود می‌کند
- دستگاه فعلی را علامت‌گذاری و cross-sign می‌کند
- اگر پشتیبان room-key سمت سرور از قبل وجود نداشته باشد، یکی می‌سازد

اگر homeserver برای آپلود کلیدهای cross-signing به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و بعد `m.login.password` (به `channels.matrix.password` نیاز دارد).

پرچم‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنارگذاشتن هویت cross-signing فعلی (فقط آگاهانه؛ نیاز دارد کلید بازیابی فعال ذخیره شده باشد یا با `--recovery-key-stdin` ارائه شود)

### پشتیبان room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را به ذخیره‌گاه رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان خراب با baseline تازه (از دست‌دادن تاریخچه قدیمی غیرقابل‌بازیابی را می‌پذیرد؛ همچنین اگر محرمانه پشتیبان فعلی قابل بارگذاری نباشد می‌تواند ذخیره‌سازی محرمانه را دوباره بسازد):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` را فقط زمانی اضافه کنید که عمداً می‌خواهید کلید بازیابی قبلی دیگر baseline پشتیبان تازه را باز نکند.

### فهرست‌کردن، درخواست‌دادن، و پاسخ‌دادن به راستی‌آزمایی‌ها

```bash
openclaw matrix verify list
```

درخواست‌های راستی‌آزمایی در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست راستی‌آزمایی می‌فرستد. `--own-user` درخواست self-verification می‌دهد (شما prompt را در کلاینت Matrix دیگری از همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` نمی‌تواند با دیگر پرچم‌های هدف‌گیری ترکیب شود.

برای مدیریت lifecycle سطح پایین‌تر - معمولاً هنگام shadow کردن درخواست‌های ورودی از کلاینتی دیگر - این دستورها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| دستور                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ emoji یا اعداد اعشاری SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با آنچه کلاینت دیگر نشان می‌دهد مطابقت دارد       |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی emoji یا اعداد اعشاری مطابقت ندارند                   |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد   |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی وقتی راستی‌آزمایی به یک اتاق پیام مستقیم مشخص متصل است، `--user-id` و `--room-id` را به‌عنوان راهنمای follow-up در DM می‌پذیرند.

### نکات چندحسابی

بدون `--account <id>`، دستورهای CLI مربوط به Matrix از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌گذاری‌شده دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌گذاری‌شده غیرفعال یا در دسترس نباشد، خطاها به کلید پیکربندی همان حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام startup، یک دستگاه راستی‌آزمایی‌نشده در کلاینت Matrix دیگری درخواست self-verification می‌دهد، موارد تکراری را نادیده می‌گیرد و cooldown اعمال می‌کند (به‌صورت پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    Startup همچنین یک گذر راه‌اندازی اولیه رمزنگاری محافظه‌کارانه اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت cross-signing فعلی دوباره استفاده می‌کند. اگر وضعیت bootstrap خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA گذرواژه نیاز داشته باشد، startup یک هشدار لاگ می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل توسط مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix اعلان‌های lifecycle راستی‌آزمایی را به‌صورت پیام‌های `m.notice` در اتاق راستی‌آزمایی DM سخت‌گیرانه منتشر می‌کند: درخواست، آماده (با راهنمایی "Verify by emoji")، شروع/تکمیل، و جزئیات SAS (emoji/decimal) در صورت دسترس‌بودن.

    درخواست‌های ورودی از کلاینت Matrix دیگر ردیابی و به‌صورت خودکار پذیرفته می‌شوند. برای self-verification، OpenClaw جریان SAS را به‌صورت خودکار شروع می‌کند و وقتی راستی‌آزمایی emoji در دسترس باشد، سمت خودش را تأیید می‌کند - شما همچنان باید در کلاینت Matrix خود مقایسه کنید و "They match" را تأیید کنید.

    اعلان‌های سیستم راستی‌آزمایی به pipeline چت agent ارسال نمی‌شوند.

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

    برای احراز هویت با token، یک access token تازه در کلاینت Matrix یا UI ادمین خود بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسه حساب از دستور ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="Device hygiene">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست و پاکسازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE در Matrix از مسیر رسمی رمزنگاری Rust در `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌ماند (با مجوزهای محدودکننده فایل).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل sync store، crypto store، recovery key، snapshot مربوط به IDB، thread bindings، و وضعیت startup verification است. وقتی token تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw از بهترین ریشه موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

self-profile مربوط به Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های URL آواتار `mxc://` را مستقیما می‌پذیرد؛ وقتی `http://` یا `https://` را ارسال می‌کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شده‌ی `mxc://` را در `channels.matrix.avatarUrl` (یا بازنویسی مخصوص هر حساب) ذخیره می‌کند.

## رشته‌ها

Matrix از رشته‌های بومی Matrix هم برای پاسخ‌های خودکار و هم برای ارسال‌های ابزار پیام پشتیبانی می‌کند. دو تنظیم مستقل رفتار را کنترل می‌کنند:

### مسیریابی نشست (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به نشست‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همه‌ی اتاق‌های DM با همان همتای مسیریابی‌شده یک نشست مشترک دارند.
- `"per-room"`: هر اتاق DM در Matrix کلید نشست خودش را می‌گیرد، حتی وقتی همتا یکسان باشد.

اتصال‌های صریح مکالمه همیشه بر `sessionScope` اولویت دارند، بنابراین اتاق‌ها و رشته‌های متصل‌شده نشست هدف انتخاب‌شده‌ی خود را حفظ می‌کنند.

### رشته‌بندی پاسخ‌ها (`threadReplies`)

`threadReplies` تعیین می‌کند ربات پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها در سطح بالا هستند. پیام‌های رشته‌ای ورودی روی نشست والد باقی می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در آن رشته بوده، داخل رشته پاسخ بده.
- `"always"`: داخل رشته‌ای پاسخ بده که ریشه‌ی آن پیام محرک است؛ آن مکالمه از اولین محرک به بعد از طریق یک نشست متناظر با دامنه‌ی رشته مسیریابی می‌شود.

`dm.threadReplies` فقط برای DMها این را بازنویسی می‌کند - برای مثال، رشته‌های اتاق را ایزوله نگه دارید و در عین حال DMها را تخت نگه دارید.

### ارث‌بری رشته و فرمان‌های اسلش

- پیام‌های رشته‌ای ورودی، پیام ریشه‌ی رشته را به‌عنوان زمینه‌ی اضافی عامل شامل می‌کنند.
- ارسال‌های ابزار پیام هنگام هدف‌گیری همان اتاق (یا همان هدف کاربر DM)، رشته‌ی فعلی Matrix را خودکار به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شده باشد.
- استفاده‌ی دوباره از هدف کاربر DM فقط زمانی فعال می‌شود که فراداده‌ی نشست فعلی همان همتای DM را روی همان حساب Matrix ثابت کند؛ در غیر این صورت OpenClaw به مسیریابی عادی با دامنه‌ی کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` متصل به رشته همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- وقتی `threadBindings.spawnSessions` فعال باشد، `/focus` در سطح بالا یک رشته‌ی Matrix جدید می‌سازد و آن را به نشست هدف متصل می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشته‌ی موجود Matrix، همان رشته را در جای خود متصل می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، یک‌بار `m.notice` در آن اتاق ارسال می‌کند که به راه خروج `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط وقتی اتصال‌های رشته فعال باشند ظاهر می‌شود.

## اتصال‌های مکالمه ACP

اتاق‌های Matrix، DMها، و رشته‌های موجود Matrix می‌توانند بدون تغییر سطح چت به فضاهای کاری پایدار ACP تبدیل شوند.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشته‌ی موجود Matrix که می‌خواهید به استفاده از آن ادامه دهید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق سطح‌بالای Matrix، همان DM/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های بعدی به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشته‌ی موجود Matrix، `--bind here` همان رشته‌ی فعلی را در جای خود متصل می‌کند.
- `/new` و `/reset` همان نشست ACP متصل‌شده را در جای خود بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

نکته‌ها:

- `--bind here` رشته‌ی فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` برای `/acp spawn --thread auto|here` دروازه‌گذاری می‌کند، جایی که OpenClaw باید یک رشته‌ی فرزند Matrix بسازد یا متصل کند.

### پیکربندی اتصال رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و همچنین از بازنویسی‌های مخصوص هر کانال پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های متصل به رشته‌ی Matrix به‌صورت پیش‌فرض روشن است:

- `threadBindings.spawnSessions: false` را تنظیم کنید تا `/focus` سطح‌بالا و `/acp spawn --thread auto|here` نتوانند رشته‌های Matrix را ایجاد/متصل کنند.
- وقتی ایجاد رشته‌های زیرعامل بومی نباید رونوشت والد را fork کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تایید دریافت پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` دروازه‌گذاری می‌شود:

- `react` یک واکنش به یک رویداد Matrix اضافه می‌کند.
- `reactions` خلاصه‌ی واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات روی آن رویداد را حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از ربات حذف می‌کند.

**ترتیب حل** (اولین مقدار تعریف‌شده برنده است):

| تنظیم                   | ترتیب                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | هر حساب → کانال → `messages.ackReaction` → جایگزین ایموجی هویت عامل            |
| `ackReactionScope`      | هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"`     |
| `reactionNotifications` | هر حساب → کانال → پیش‌فرض `"own"`                                               |

`reactionNotifications: "own"` رویدادهای اضافه‌شده‌ی `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف بگیرند ارسال می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی ساخته‌شده تبدیل نمی‌شود، چون Matrix آن‌ها را به‌عنوان redaction ارائه می‌کند، نه به‌عنوان حذف‌های مستقل `m.reaction`.

## زمینه‌ی تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی یک پیام اتاق Matrix عامل را تحریک می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` شامل شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض موثر `0` است. برای غیرفعال‌سازی `0` تنظیم کنید.
- تاریخچه‌ی اتاق Matrix فقط مخصوص اتاق است. DMها همچنان از تاریخچه‌ی عادی نشست استفاده می‌کنند.
- تاریخچه‌ی اتاق Matrix فقط در حالت pending است: OpenClaw پیام‌های اتاق را که هنوز پاسخی تحریک نکرده‌اند بافر می‌کند، سپس وقتی یک منشن یا محرک دیگر برسد، از آن پنجره snapshot می‌گیرد.
- پیام محرک فعلی در `InboundHistory` شامل نمی‌شود؛ برای آن نوبت در بدنه‌ی ورودی اصلی باقی می‌ماند.
- تلاش‌های دوباره‌ی همان رویداد Matrix به‌جای جلو رفتن به پیام‌های جدیدتر اتاق، از snapshot تاریخچه‌ی اصلی دوباره استفاده می‌کنند.

## دیده‌شدن زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینه‌ی مکمل اتاق مثل متن پاسخ دریافت‌شده، ریشه‌های رشته، و تاریخچه‌ی pending پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینه‌ی مکمل همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینه‌ی مکمل را به فرستندگانی فیلتر می‌کند که توسط بررسی‌های allowlist فعال اتاق/کاربر مجاز هستند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شده‌ی صریح را نگه می‌دارد.

این تنظیم بر دیده‌شدن زمینه‌ی مکمل اثر می‌گذارد، نه اینکه خود پیام ورودی بتواند پاسخی را تحریک کند یا نه.
مجوز محرک همچنان از `groupPolicy`، `groups`، `groupAllowFrom`، و تنظیمات سیاست DM می‌آید.

## سیاست DM و اتاق

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

برای بی‌صدا کردن کامل DMها و فعال نگه داشتن اتاق‌ها، `dm.enabled: false` را تنظیم کنید:

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

برای رفتار منشن‌گذاری و allowlist، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونه‌ی جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تاییدنشده‌ی Matrix پیش از تایید همچنان به شما پیام بدهد، OpenClaw دوباره از همان کد جفت‌سازی pending استفاده می‌کند و ممکن است پس از یک cooldown کوتاه، به‌جای ساختن کد جدید، یک پاسخ یادآوری ارسال کند.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگام‌سازی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنه‌ی `m.direct` روبه‌رو شود که به‌جای DM زنده به اتاق‌های تک‌نفره‌ی قدیمی اشاره می‌کنند. نگاشت فعلی برای یک همتا را بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای راه‌اندازی‌های چندحسابی `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانه‌ی ۱:۱ را ترجیح می‌دهد که از قبل در `m.direct` نگاشت شده باشد
- به هر DM سخت‌گیرانه‌ی ۱:۱ فعلا پیوسته‌شده با آن کاربر برمی‌گردد
- اگر هیچ DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه می‌سازد و `m.direct` را بازنویسی می‌کند

اتاق‌های قدیمی را به‌طور خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آینده‌ی Matrix، اعلان‌های راستی‌آزمایی، و دیگر جریان‌های پیام مستقیم اتاق درست را هدف بگیرند.

## تاییدهای اجرا

Matrix می‌تواند به‌عنوان یک کارخواه تایید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای بازنویسی مخصوص هر حساب، `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تاییدها را از طریق promptهای بومی Matrix تحویل بده. وقتی تنظیم نشده یا `"auto"` باشد، Matrix پس از حل شدن دست‌کم یک تاییدکننده، خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` تنظیم کنید.
- `approvers`: شناسه‌های کاربری Matrix (`@owner:example.org`) که مجاز به تایید درخواست‌های اجرا هستند. اختیاری - به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: promptها کجا بروند. `"dm"` (پیش‌فرض) به DMهای تاییدکننده می‌فرستد؛ `"channel"` به اتاق یا DM مبدأ Matrix می‌فرستد؛ `"both"` به هر دو می‌فرستد.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را تحریک کنند.

مجوزدهی بین انواع تایید کمی متفاوت است:

- **تاییدهای اجرا** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تاییدهای Plugin** فقط از طریق `dm.allowFrom` مجاز می‌شوند.

هر دو نوع میانبرهای واکنش Matrix و به‌روزرسانی‌های پیام را به‌اشتراک می‌گذارند. تاییدکنندگان میانبرهای واکنش را روی پیام اصلی تایید می‌بینند:

- `✅` یک‌بار اجازه بده
- `❌` رد کن
- `♾️` همیشه اجازه بده (وقتی سیاست موثر اجرا اجازه دهد)

فرمان‌های اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تاییدکنندگان حل‌شده می‌توانند تایید یا رد کنند. تحویل کانالی برای تاییدهای اجرا متن فرمان را شامل می‌شود - `channel` یا `both` را فقط در اتاق‌های قابل اعتماد فعال کنید.

مرتبط: [تاییدهای اجرا](/fa/tools/exec-approvals).

## فرمان‌های اسلش

فرمان‌های اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیما در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین فرمان‌هایی را تشخیص می‌دهد که با منشن Matrix خود ربات پیشوند گرفته‌اند، بنابراین `@bot:server /new` بدون regex منشن سفارشی مسیر فرمان را تحریک می‌کند. این کار ربات را نسبت به پست‌های اتاقی از نوع `@mention /command` که Element و کارخواه‌های مشابه وقتی کاربر پیش از تایپ فرمان نام ربات را با tab کامل می‌کند منتشر می‌کنند، پاسخ‌گو نگه می‌دارد.

قواعد مجوز همچنان اعمال می‌شوند: فرستندگان فرمان باید همان سیاست‌های allowlist/مالک DM یا اتاق را مثل پیام‌های ساده برآورده کنند.

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

**ارث‌بری:**

- مقدارهای سطح‌بالای `channels.matrix` به‌عنوان پیش‌فرض برای حساب‌های نام‌دار عمل می‌کنند، مگر اینکه یک حساب آن‌ها را بازنویسی کند.
- با `groups.<room>.account` یک ورودی اتاق ارث‌بری‌شده را به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک هستند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- `defaultAccount` را تنظیم کنید تا حساب نام‌گذاری‌شده‌ای انتخاب شود که مسیریابی ضمنی، probing و فرمان‌های CLI آن را ترجیح می‌دهند.
- اگر چند حساب دارید و یکی از آن‌ها دقیقا `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌صورت ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌گذاری‌شده دارید و هیچ پیش‌فرضی انتخاب نشده است، فرمان‌های CLI از حدس‌زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را پاس بدهید.
- بلوک سطح‌بالای `channels.matrix.*` فقط زمانی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که احراز هویت آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌گذاری‌شده پس از آنکه اعتبارنامه‌های کش‌شده احراز هویت را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌گذاری‌شده‌ای وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، همان حساب موجود را حفظ می‌کند. فقط کلیدهای احراز هویت/راه‌اندازی اولیه Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای مشترک سیاست تحویل در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## homeserverهای خصوصی/LAN

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، homeserverهای خصوصی/داخلی Matrix را مسدود می‌کند مگر اینکه
برای هر حساب صراحتا آن را فعال کنید.

اگر homeserver شما روی localhost، یک IP مربوط به LAN/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود،
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

این فعال‌سازی فقط مقصدهای خصوصی/داخلی مورد اعتماد را مجاز می‌کند. homeserverهای عمومی با متن آشکار مانند
`http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر زمان ممکن است `https://` را ترجیح دهید.

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

حساب‌های نام‌گذاری‌شده می‌توانند مقدار پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پروکسی برای ترافیک زمان اجرای Matrix و probing وضعیت حساب استفاده می‌کند.

## تشخیص مقصد

Matrix این قالب‌های مقصد را در هر جایی که OpenClaw از شما مقصد اتاق یا کاربر می‌خواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی مقصدهای تحویل صریح، Cron jobها، bindingها، یا allowlistها،
دقیقا از همان بزرگی و کوچکی حروف شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای داخلی نشست را برای ذخیره‌سازی canonical نگه می‌دارد، بنابراین آن کلیدهای lowercase
منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده directory از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوی کاربران، directory کاربران Matrix را روی همان homeserver پرس‌وجو می‌کند.
- جست‌وجوی اتاق‌ها، شناسه‌های صریح اتاق و نام‌های مستعار را مستقیما می‌پذیرد. جست‌وجوی نام اتاق‌های عضو‌شده best-effort است و فقط زمانی برای allowlistهای اتاق در زمان اجرا اعمال می‌شود که `dangerouslyAllowNameMatching: true` تنظیم شده باشد.
- اگر نام یک اتاق به شناسه یا نام مستعار قابل resolve نباشد، در resolve کردن allowlist زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای کاربری به سبک allowlist (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (ایمن‌ترین گزینه). ورودی‌های کاربری غیرشناسه به‌طور پیش‌فرض نادیده گرفته می‌شوند. اگر `dangerouslyAllowNameMatching: true` را تنظیم کنید، تطابق‌های دقیق display-name در directory Matrix هنگام startup و هر زمان که allowlist در زمان اجرای monitor تغییر کند resolve می‌شوند؛ ورودی‌هایی که قابل resolve نباشند در زمان اجرا نادیده گرفته می‌شوند.

کلیدهای allowlist اتاق (`groups`، `rooms` legacy) باید شناسه یا نام مستعار اتاق باشند. کلیدهای نام ساده اتاق به‌طور پیش‌فرض نادیده گرفته می‌شوند؛ `dangerouslyAllowNameMatching: true` جست‌وجوی best-effort بر اساس نام اتاق‌های عضو‌شده را دوباره فعال می‌کند.

### حساب و اتصال

- `enabled`: channel را فعال یا غیرفعال می‌کند.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقادیر سطح‌بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث برده می‌شوند.
- `homeserver`: URL مربوط به homeserver، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، IPهای LAN/Tailscale، یا نام‌های میزبان داخلی متصل شود.
- `proxy`: URL اختیاری پروکسی HTTP(S) برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقادیر متن ساده و SecretRef در providerهای env/file/exec پشتیبانی می‌شوند ([مدیریت Secrets](/fa/gateway/secrets)).
- `password`: رمز عبور برای ورود مبتنی بر رمز عبور. مقادیر متن ساده و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با رمز عبور استفاده می‌شود.
- `avatarUrl`: URL آواتار خود ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد رویدادهایی که هنگام همگام‌سازی startup دریافت می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال می‌کند. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأییدنشده باشد، هنگام startup به‌صورت خودکار درخواست self-verification می‌دهد.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار startup بعدی. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: allowlist شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همه DMها را نادیده می‌گیرد. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از پیوستن bot و طبقه‌بندی اتاق به‌عنوان DM اعمال می‌شود؛ روی مدیریت دعوت اثر نمی‌گذارد.
- `dm.allowFrom`: allowlist شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی فقط برای DM جهت threading پاسخ (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌های حساب‌های bot دیگرِ Matrix که پیکربندی شده‌اند را می‌پذیرد (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های فعال DM (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را مجبور به `"allowlist"` می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `dangerouslyAllowNameMatching`: وقتی `true` باشد، جست‌وجوی directory بر اساس display-name در Matrix را برای ورودی‌های allowlist کاربر و جست‌وجوی نام اتاق‌های عضو‌شده را برای کلیدهای allowlist اتاق مجاز می‌کند. شناسه‌های کامل `@user:server` و شناسه‌ها یا نام‌های مستعار اتاق را ترجیح دهید.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. برای هر دعوت Matrix اعمال می‌شود، از جمله دعوت‌های شبیه DM.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار نسبت به homeserver resolve می‌شوند، نه نسبت به state ادعاشده توسط اتاق دعوت‌کننده.
- `contextVisibility`: نمایانی context تکمیلی (`"all"` پیش‌فرض، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر channel برای مسیریابی نشست وابسته به thread و چرخه عمر.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا قالب شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های کامل‌شده assistant به‌عنوان پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه chunk خروجی بر حسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد نویسه) یا `"newline"` (تقسیم در مرز خطوط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی یک پیام اتاق agent را trigger می‌کند به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` fallback می‌کند؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه media بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش ack برای این channel/حساب.
- `ackReactionScope`: بازنویسی scope (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### Tooling و بازنویسی‌های هر اتاق

- `actions`: gating ابزار برای هر action (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از resolve شدن از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار legacy است.)
  - `groups.<room>.account`: یک ورودی اتاق به‌ارث‌برده‌شده را به حسابی مشخص محدود می‌کند.
  - `groups.<room>.allowBots`: بازنویسی هر اتاق برای تنظیم سطح channel (`true` یا `"mentions"`).
  - `groups.<room>.users`: allowlist فرستنده برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی gating مبتنی بر mention برای هر اتاق. `true` الزامات mention را برای آن اتاق غیرفعال می‌کند؛ `false` آن‌ها را دوباره اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر skill برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه system prompt برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق promptهای بومی Matrix تحویل می‌دهد.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که مجاز به تأیید هستند. به `dm.allowFrom` fallback می‌کند.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlistهای اختیاری agent/session برای تحویل.

## مرتبط

- [نمای کلی channelها](/fa/channels) - همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) - احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و gating مبتنی بر mention
- [مسیریابی channel](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
