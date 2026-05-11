---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی E2EE و تأیید در Matrix
summary: وضعیت پشتیبانی Matrix، راه‌اندازی و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-05-11T20:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال قابل دانلود برای OpenClaw است.
از `matrix-js-sdk` رسمی استفاده می‌کند و از DMها، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، موقعیت مکانی و E2EE پشتیبانی می‌کند.

## نصب

پیش از پیکربندی کانال، Matrix را از ClawHub نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

مشخصات Plugin بدون پیشوند ابتدا ClawHub را امتحان می‌کنند و سپس به npm برمی‌گردند. برای اجبار به استفاده از منبع رجیستری، از `openclaw plugins install clawhub:@openclaw/matrix` یا `openclaw plugins install npm:@openclaw/matrix` استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` Plugin را ثبت و فعال می‌کند، بنابراین به مرحله جداگانه `openclaw plugins enable matrix` نیازی نیست. با این حال، تا زمانی که کانال زیر را پیکربندی نکنید، Plugin کاری انجام نمی‌دهد. برای رفتار عمومی Plugin و قوانین نصب، [Pluginها](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را یا با `homeserver` + `accessToken`، یا با `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک DM با بات شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید - دعوت‌های جدید فقط وقتی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

ویزارد این موارد را می‌پرسد: نشانی URL homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسه کاربر (فقط احراز هویت گذرواژه‌ای)، نام اختیاری دستگاه، اینکه آیا E2EE فعال شود، و اینکه آیا دسترسی اتاق و پیوستن خودکار پیکربندی شود.

اگر env varهای مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، ویزارد یک میان‌بر env-var پیشنهاد می‌کند. برای resolve کردن نام اتاق‌ها پیش از ذخیره allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، ویزارد پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

مبتنی بر گذرواژه (توکن پس از نخستین ورود در cache ذخیره می‌شود):

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

مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است. با مقدار پیش‌فرض، بات تا زمانی که دستی join نکنید در اتاق‌ها یا DMهای جدید ناشی از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده DM است یا گروه، بنابراین همه دعوت‌ها - از جمله دعوت‌های شبیه DM - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدا اعمال می‌شود، پس از اینکه بات join کرده و اتاق طبقه‌بندی شده باشد.

<Warning>
برای محدود کردن دعوت‌هایی که بات می‌پذیرد، `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` تنظیم کنید، یا برای پذیرش همه دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط هدف‌های پایدار را می‌پذیرد: `!roomId:server`، `#alias:server`، یا `*`. نام‌های ساده اتاق رد می‌شوند؛ ورودی‌های alias در برابر homeserver resolve می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌شده.
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

بهتر است allowlistهای DM و اتاق با شناسه‌های پایدار پر شوند:

- DMها (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی به طور پیش‌فرض نادیده گرفته می‌شوند چون تغییرپذیرند؛ فقط وقتی صراحتا به سازگاری با ورودی‌های نام نمایشی نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- کلیدهای allowlist اتاق (`groups`، `rooms` قدیمی): از `!room:server` یا `#alias:server` استفاده کنید. نام‌های ساده اتاق به طور پیش‌فرض نادیده گرفته می‌شوند؛ فقط وقتی صراحتا به سازگاری با جست‌وجوی نام اتاق joinشده نیاز دارید، `dangerouslyAllowNameMatching: true` را تنظیم کنید.
- allowlistهای دعوت (`autoJoinAllowlist`): از `!room:server`، `#alias:server`، یا `*` استفاده کنید. نام‌های ساده اتاق رد می‌شوند.

### نرمال‌سازی شناسه حساب

ویزارد یک نام دوستانه را به شناسه حساب نرمال‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های env-var محدوده‌دار escape می‌شود تا دو حساب نتوانند تداخل داشته باشند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cacheشده

Matrix اعتبارنامه‌های cacheشده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌دار: `credentials-<account>.json`

وقتی اعتبارنامه‌های cacheشده آنجا وجود داشته باشند، OpenClaw با Matrix مانند کانال پیکربندی‌شده رفتار می‌کند، حتی اگر توکن دسترسی در فایل پیکربندی نباشد - این راه‌اندازی، `openclaw doctor`، و probeهای وضعیت کانال را پوشش می‌دهد.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌دار شناسه حساب را پیش از پسوند درج می‌کنند.

| حساب پیش‌فرض          | حساب نام‌دار (`<ID>` شناسه حساب نرمال‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN` و مانند آن تبدیل می‌شوند. env varهای کلید بازیابی توسط جریان‌های CLI آگاه از بازیابی (`verify backup restore`، `verify device`، `verify bootstrap`) خوانده می‌شوند، وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` نمی‌تواند از یک فایل `.env` در workspace تنظیم شود؛ [فایل‌های `.env` در workspace](/fa/gateway/security) را ببینید.

## نمونه پیکربندی

یک مبنای عملی با pairing برای DM، allowlist اتاق، و E2EE:

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

streaming پاسخ Matrix opt-in است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال تولید assistant را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر بلوک کامل‌شده به عنوان پیام جداگانه Matrix حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه‌داشتن پیش‌نمایش‌های زنده پاسخ ولی پنهان کردن خطوط موقت ابزار/پیشرفت، از شکل object استفاده کنید:

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
| `"partial"`       | هم‌زمان با نوشتن بلوک فعلی توسط مدل، یک پیام متنی عادی را در جای خود ویرایش می‌کند. کلاینت‌های استاندارد Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه ویرایش نهایی.              |
| `"quiet"`         | همانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان می‌گیرند که یک قانون push مختص کاربر با ویرایش نهایی‌شده match شود (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (پیش‌فرض)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای بلوک فعلی، بلوک‌های کامل‌شده به عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای بلوک فعلی، در جای خود نهایی می‌شود |
| `"off"`                 | یک پیام اعلان‌دار Matrix برای هر بلوک پایان‌یافته                     | یک پیام اعلان‌دار Matrix برای پاسخ کامل      |

نکته‌ها:

- اگر یک پیش‌نمایش از حد اندازه هر event در Matrix بزرگ‌تر شود، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط نهایی برمی‌گردد.
- پاسخ‌های رسانه‌ای همیشه attachmentها را به شکل عادی ارسال می‌کنند. اگر یک پیش‌نمایش قدیمی دیگر نتواند با ایمنی دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ نهایی رسانه‌ای آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار به طور پیش‌فرض وقتی streaming پیش‌نمایش Matrix فعال باشد، فعال هستند. برای نگه‌داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ ولی باقی گذاشتن پیشرفت ابزار روی مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش هزینه تماس‌های API اضافی Matrix دارند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را نگه دارید.

## metadata تأیید

درخواست‌های تأیید native در Matrix رویدادهای عادی `m.room.message` هستند که محتوای سفارشی event مخصوص OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی محتوای event را مجاز می‌داند، بنابراین کلاینت‌های استاندارد همچنان بدنه متن را render می‌کنند و کلاینت‌های آگاه از OpenClaw می‌توانند شناسه ساختاریافته تأیید، نوع، state، تصمیم‌های موجود، و جزئیات exec/Plugin را بخوانند.

وقتی یک درخواست تأیید برای یک event در Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را تکه‌تکه می‌کند و `com.openclaw.approval` را فقط به نخستین تکه ضمیمه می‌کند. واکنش‌ها برای تصمیم‌های allow/deny به همان event نخست بسته می‌شوند، بنابراین درخواست‌های طولانی همان هدف تأیید درخواست‌های تک-event را حفظ می‌کنند.

### قوانین push خودمیزبان برای پیش‌نمایش‌های نهایی‌شده quiet

`streaming: "quiet"` فقط وقتی به گیرندگان اعلان می‌دهد که یک بلوک یا turn نهایی شده باشد - یک قانون push مختص کاربر باید با نشانگر پیش‌نمایش نهایی‌شده match شود. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب قانون، نکته‌های هر homeserver)، [قوانین push Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های بات‌به‌بات

به طور پیش‌فرض، پیام‌های Matrix از حساب‌های Matrix دیگر که در OpenClaw پیکربندی شده‌اند نادیده گرفته می‌شوند.

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

- `allowBots: true` پیام‌ها را از حساب‌های بات Matrix دیگرِ پیکربندی‌شده در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` این پیام‌ها را فقط وقتی می‌پذیرد که در اتاق‌ها به طور قابل مشاهده این بات را mention کنند. DMها همچنان مجازند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق override می‌کند.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های پاسخ به خود جلوگیری کند.
- Matrix در اینجا یک پرچم native برای بات ارائه نمی‌کند؛ OpenClaw «نوشته‌شده توسط بات» را به معنای «ارسال‌شده توسط یک حساب Matrix دیگرِ پیکربندی‌شده روی این Gateway در OpenClaw» در نظر می‌گیرد.

هنگام فعال کردن ترافیک بات‌به‌بات در اتاق‌های مشترک، از allowlistهای سخت‌گیرانه اتاق و الزامات mention استفاده کنید.

## رمزنگاری و تأیید

در اتاق‌های رمزگذاری‌شده (E2EE)، رویدادهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزگذاری شوند. اتاق‌های رمزگذاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. هیچ پیکربندی‌ای لازم نیست - Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همهٔ دستورهای `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل خواندن توسط ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌صورت پیش‌فرض کوتاه است و ثبت گزارش داخلی SDK کم‌صدا انجام می‌شود. مثال‌های زیر شکل متعارف را نشان می‌دهند؛ در صورت نیاز پرچم‌ها را اضافه کنید.

### فعال‌سازی رمزگذاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و امضای متقابل را راه‌اندازی می‌کند، در صورت نیاز یک پشتیبان کلید اتاق می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. پرچم‌های مفید:

- `--recovery-key <key>` یک کلید بازیابی را پیش از راه‌اندازی اعمال می‌کند (شکل stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` هویت امضای متقابل فعلی را کنار می‌گذارد و هویت تازه‌ای می‌سازد (فقط آگاهانه استفاده کنید)

برای یک حساب جدید، E2EE را هنگام ساخت فعال کنید:

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

`verify status` سه سیگنال اعتماد مستقل را گزارش می‌کند (`--verbose` همهٔ آن‌ها را نشان می‌دهد):

- `Locally trusted`: فقط توسط این کلاینت مورد اعتماد است
- `Cross-signing verified`: SDK تأیید از طریق امضای متقابل را گزارش می‌کند
- `Signed by owner`: با کلید خودامضای خودتان امضا شده است (فقط برای عیب‌یابی)

`Verified by owner` فقط زمانی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیهٔ حساب Matrix، عیب‌یابی‌های best-effort را برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### تأیید این دستگاه با کلید بازیابی

کلید بازیابی حساس است - آن را به‌جای ارسال در خط فرمان، از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا برای حساب نام‌دار `MATRIX_<ID>_RECOVERY_KEY`) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این دستور سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفته است.
- `Backup usable`: پشتیبان کلید اتاق می‌تواند با مادهٔ بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقابل Matrix را دارد.

وقتی اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی مواد پشتیبان را باز کرده باشد، با وضعیت غیرصفر خارج می‌شود. در این حالت، خودتأییدی را از یک کلاینت Matrix دیگر کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

شکل کلید صریح `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچهٔ shell شما باقی می‌ماند.

### راه‌اندازی یا تعمیر امضای متقابل

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` دستور تعمیر و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب:

- ذخیره‌سازی محرمانه را راه‌اندازی می‌کند و در صورت امکان از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقابل را راه‌اندازی می‌کند و کلیدهای عمومی جاافتاده را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و با امضای متقابل امضا می‌کند
- اگر پشتیبان کلید اتاق سمت سرور از قبل وجود نداشته باشد، یکی می‌سازد

اگر homeserver برای بارگذاری کلیدهای امضای متقابل به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و بعد `m.login.password` (به `channels.matrix.password` نیاز دارد).

پرچم‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنار گذاشتن هویت امضای متقابل فعلی (فقط آگاهانه)

### پشتیبان کلید اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را در فروشگاه رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد، می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان خراب با یک مبنای تازه (با پذیرش از دست رفتن تاریخچهٔ قدیمی غیرقابل‌بازیابی؛ همچنین می‌تواند در صورت غیرقابل‌بارگذاری بودن راز پشتیبان فعلی، ذخیره‌سازی محرمانه را بازسازی کند):

```bash
openclaw matrix verify backup reset --yes
```

فقط زمانی `--rotate-recovery-key` را اضافه کنید که آگاهانه می‌خواهید کلید بازیابی قبلی دیگر مبنای پشتیبان تازه را باز نکند.

### فهرست‌کردن، درخواست‌دادن، و پاسخ‌دادن به تأییدها

```bash
openclaw matrix verify list
```

درخواست‌های تأیید در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست تأیید می‌فرستد. `--own-user` خودتأییدی را درخواست می‌کند (درخواست را در یک کلاینت Matrix دیگر همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` را نمی‌توان با پرچم‌های هدف‌گیری دیگر ترکیب کرد.

برای مدیریت چرخهٔ عمر سطح پایین‌تر - معمولاً هنگام دنبال‌کردن درخواست‌های ورودی از یک کلاینت دیگر - این دستورها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| دستور                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌های SAS یا اعداد اعشاری                                 |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با چیزی که کلاینت دیگر نشان می‌دهد مطابقت دارد     |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی ایموجی‌ها یا اعداد اعشاری مطابقت ندارند                |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد    |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان راهنمای پیگیری DM می‌پذیرند، وقتی تأیید به یک اتاق پیام مستقیم مشخص متصل باشد.

### نکته‌های چندحسابی

بدون `--account <id>`، دستورهای CLI مربوط به Matrix از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌دار دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌دار غیرفعال یا ناموجود باشد، خطاها به کلید پیکربندی آن حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، دستگاه تأییدنشده در یک کلاینت Matrix دیگر درخواست خودتأییدی می‌دهد، موارد تکراری را رد می‌کند و cooldown اعمال می‌کند (به‌صورت پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانهٔ راه‌اندازی رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت امضای متقابل فعلی دوباره استفاده می‌کند. اگر وضعیت راه‌اندازی خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA رمز عبور نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده می‌ماند. دستگاه‌هایی که از قبل با امضای مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های تأیید">
    Matrix اعلان‌های چرخهٔ عمر تأیید را به‌صورت پیام‌های `m.notice` در اتاق تأیید DM سخت‌گیرانه ارسال می‌کند: درخواست، آماده (با راهنمایی "Verify by emoji")، شروع/تکمیل، و جزئیات SAS (ایموجی/اعشاری) در صورت موجود بودن.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر پیگیری و به‌صورت خودکار پذیرفته می‌شوند. برای خودتأییدی، OpenClaw جریان SAS را به‌صورت خودکار شروع می‌کند و پس از در دسترس شدن تأیید ایموجی، سمت خودش را تأیید می‌کند - همچنان باید در کلاینت Matrix خود مقایسه کنید و "They match" را تأیید کنید.

    اعلان‌های سیستمی تأیید به خط لولهٔ چت عامل ارسال نمی‌شوند.

  </Accordion>

  <Accordion title="دستگاه Matrix حذف‌شده یا نامعتبر">
    اگر `verify status` می‌گوید دستگاه فعلی دیگر در homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw بسازید. برای ورود با رمز عبور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    برای احراز هویت با توکن، یک access token تازه در کلاینت Matrix یا UI مدیریتی خود بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسهٔ حساب از دستور ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="بهداشت دستگاه">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست کنید و پاک‌سازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="فروشگاه رمزنگاری">
    E2EE در Matrix از مسیر رمزنگاری Rust رسمی `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌ماند (با مجوزهای فایل محدودکننده).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل فروشگاه همگام‌سازی، فروشگاه رمزنگاری، کلید بازیابی، snapshot مربوط به IDB، اتصال‌های thread، و وضعیت تأیید راه‌اندازی است. وقتی توکن تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw از بهترین ریشهٔ موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت نمایه

نمایهٔ خودِ Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های آواتار `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` ارسال کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شدهٔ `mxc://` را در `channels.matrix.avatarUrl` (یا override مخصوص هر حساب) ذخیره می‌کند.

## Threadها

Matrix از threadهای بومی Matrix هم برای پاسخ‌های خودکار و هم برای ارسال‌های ابزار پیام پشتیبانی می‌کند. دو کنترل مستقل رفتار را تعیین می‌کنند:

### مسیریابی نشست (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به نشست‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همهٔ اتاق‌های DM با همان همتای مسیریابی‌شده یک نشست را به اشتراک می‌گذارند.
- `"per-room"`: هر اتاق DM در Matrix کلید نشست خودش را می‌گیرد، حتی وقتی همتا همان باشد.

اتصال‌های صریح گفتگو همیشه بر `sessionScope` مقدم‌اند، بنابراین اتاق‌ها و threadهای متصل‌شده نشست هدف انتخابی خود را نگه می‌دارند.

### thread کردن پاسخ‌ها (`threadReplies`)

`threadReplies` تعیین می‌کند bot پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها در سطح بالا هستند. پیام‌های threadشدهٔ ورودی روی نشست والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در آن thread بوده، داخل thread پاسخ می‌دهد.
- `"always"`: داخل threadی پاسخ می‌دهد که ریشهٔ آن پیام محرک است؛ آن گفتگو از همان محرک نخست به بعد از طریق یک نشست متناظر با دامنهٔ thread مسیریابی می‌شود.

`dm.threadReplies` این رفتار را فقط برای DMها override می‌کند - برای مثال، threadهای اتاق را جدا نگه دارید و در عین حال DMها را تخت نگه دارید.

### ارث‌بری thread و دستورهای slash

- پیام‌های رشته‌ای ورودی، پیام ریشهٔ رشته را به‌عنوان زمینهٔ اضافی عامل دربر می‌گیرند.
- ارسال‌های ابزار پیام، هنگام هدف‌گیری همان اتاق Matrix (یا همان هدف کاربر DM)، رشتهٔ فعلی Matrix را به‌صورت خودکار به ارث می‌برند، مگر اینکه `threadId` به‌صراحت ارائه شده باشد.
- استفادهٔ مجدد از هدف کاربر DM فقط وقتی فعال می‌شود که فرادادهٔ نشست فعلی همان همتای DM را روی همان حساب Matrix ثابت کند؛ در غیر این صورت OpenClaw به مسیریابی عادی با دامنهٔ کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age` و `/acp spawn` مقید به رشته، همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- `/focus` سطح بالا، وقتی `threadBindings.spawnSessions` فعال باشد، یک رشتهٔ Matrix تازه ایجاد می‌کند و آن را به نشست هدف مقید می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشتهٔ موجود Matrix، همان رشته را در جای خود مقید می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، یک `m.notice` یک‌باره در آن اتاق ارسال می‌کند که به راه گریز `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط وقتی نمایش داده می‌شود که مقیدسازی رشته‌ها فعال باشد.

## مقیدسازی مکالمه‌های ACP

اتاق‌های Matrix، DMها و رشته‌های موجود Matrix را می‌توان بدون تغییر سطح چت، به فضاهای کاری پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشتهٔ موجود Matrix که می‌خواهید همچنان از آن استفاده کنید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق سطح بالای Matrix، همان DM/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشتهٔ موجود Matrix، `--bind here` همان رشتهٔ فعلی را در جای خود مقید می‌کند.
- `/new` و `/reset` همان نشست ACP مقیدشده را در جای خود بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و مقیدسازی را حذف می‌کند.

نکته‌ها:

- `--bind here` رشتهٔ فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` روی `/acp spawn --thread auto|here` کنترل دارد؛ جایی که OpenClaw باید یک رشتهٔ فرزند Matrix ایجاد یا مقید کند.

### پیکربندی مقیدسازی رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و همچنین از بازنویسی‌های سطح کانال پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های مقید به رشته در Matrix به‌صورت پیش‌فرض فعال است:

- برای جلوگیری از اینکه `/focus` سطح بالا و `/acp spawn --thread auto|here` رشته‌های Matrix را ایجاد/مقید کنند، `threadBindings.spawnSessions: false` را تنظیم کنید.
- وقتی ایجاد رشتهٔ زیرعامل بومی نباید رونوشت والد را fork کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به رویداد Matrix اضافه می‌کند.
- `reactions` خلاصهٔ واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از ربات حذف می‌کند.

**ترتیب حل‌وفصل** (اولین مقدار تعریف‌شده برنده است):

| تنظیمات                 | ترتیب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | در سطح حساب → کانال → `messages.ackReaction` → جایگزین ایموجی هویت عامل   |
| `ackReactionScope`      | در سطح حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"` |
| `reactionNotifications` | در سطح حساب → کانال → پیش‌فرض `"own"`                                          |

`reactionNotifications: "own"` رویدادهای اضافه‌شدهٔ `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف بگیرند، ارسال می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی تبدیل نمی‌شود، زیرا Matrix آن‌ها را به‌صورت حذف محتوا نمایش می‌دهد، نه به‌عنوان حذف‌های مستقل `m.reaction`.

## زمینهٔ تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند چند پیام اخیر اتاق به‌عنوان `InboundHistory` هنگام تحریک عامل توسط پیام اتاق Matrix گنجانده شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی، `0` را تنظیم کنید.
- تاریخچهٔ اتاق Matrix فقط مختص اتاق است. DMها همچنان از تاریخچهٔ عادی نشست استفاده می‌کنند.
- تاریخچهٔ اتاق Matrix فقط در انتظار است: OpenClaw پیام‌های اتاق را که هنوز پاسخی را تحریک نکرده‌اند در بافر نگه می‌دارد، سپس وقتی یک اشاره یا محرک دیگر می‌رسد، از آن پنجره snapshot می‌گیرد.
- پیام محرک فعلی در `InboundHistory` گنجانده نمی‌شود؛ برای آن نوبت در بدنهٔ ورودی اصلی باقی می‌ماند.
- تلاش‌های مجدد همان رویداد Matrix، به‌جای حرکت به سمت پیام‌های جدیدتر اتاق، از snapshot اصلی تاریخچه دوباره استفاده می‌کنند.

## دیدپذیری زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینهٔ تکمیلی اتاق، مانند متن پاسخ دریافت‌شده، ریشه‌های رشته و تاریخچهٔ در انتظار، پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینهٔ تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستندگانی محدود می‌کند که بررسی‌های allowlist فعال اتاق/کاربر اجازه می‌دهند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شدهٔ صریح را نگه می‌دارد.

این تنظیم روی دیدپذیری زمینهٔ تکمیلی اثر می‌گذارد، نه اینکه خود پیام ورودی بتواند پاسخی را تحریک کند یا نه.
مجوز تحریک همچنان از `groupPolicy`، `groups`، `groupAllowFrom` و تنظیمات سیاست DM می‌آید.

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

برای بی‌صدا کردن کامل DMها در حالی که اتاق‌ها همچنان کار می‌کنند، `dm.enabled: false` را تنظیم کنید:

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

برای رفتار کنترل با اشاره و allowlist، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونهٔ جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر کاربر تأییدنشدهٔ Matrix پیش از تأیید همچنان به شما پیام بدهد، OpenClaw دوباره از همان کد جفت‌سازی در انتظار استفاده می‌کند و ممکن است پس از یک cooldown کوتاه، به‌جای ساختن کد تازه، پاسخ یادآوری بفرستد.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنهٔ `m.direct` روبه‌رو شود که به اتاق‌های تک‌نفرهٔ قدیمی اشاره می‌کنند، نه DM زنده. نگاشت فعلی برای یک همتا را بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای راه‌اندازی‌های چندحسابی، `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانهٔ 1:1 را ترجیح می‌دهد که از قبل در `m.direct` نگاشت شده باشد
- به هر DM سخت‌گیرانهٔ 1:1 که اکنون با آن کاربر عضو آن است برمی‌گردد
- اگر هیچ DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

این کار اتاق‌های قدیمی را به‌صورت خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آیندهٔ Matrix، اعلان‌های تأیید و دیگر جریان‌های پیام مستقیم، اتاق درست را هدف بگیرند.

## تأییدهای exec

Matrix می‌تواند به‌عنوان یک کلاینت تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` (یا برای بازنویسی در سطح حساب، زیر `channels.matrix.accounts.<account>.execApprovals`) پیکربندی کنید:

- `enabled`: تأییدها را از طریق promptهای بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده باشد یا `"auto"` باشد، Matrix پس از حل‌شدن دست‌کم یک تأییدکننده، به‌صورت خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که مجاز به تأیید درخواست‌های exec هستند. اختیاری است - به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال promptها. `"dm"` (پیش‌فرض) به DMهای تأییدکننده می‌فرستد؛ `"channel"` به اتاق یا DM مبدأ Matrix می‌فرستد؛ `"both"` به هر دو می‌فرستد.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را تحریک کنند.

مجوزدهی بین انواع تأیید کمی تفاوت دارد:

- **تأییدهای exec** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجوز می‌گیرند.

هر دو نوع، میانبرهای واکنش Matrix و به‌روزرسانی‌های پیام را مشترک دارند. تأییدکنندگان روی پیام اصلی تأیید، میانبرهای واکنش را می‌بینند:

- `✅` یک‌بار اجازه دادن
- `❌` رد کردن
- `♾️` همیشه اجازه دادن (وقتی سیاست مؤثر exec اجازه دهد)

فرمان‌های اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکنندگان حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای exec شامل متن فرمان است - `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای exec](/fa/tools/exec-approvals).

## فرمان‌های اسلش

فرمان‌های اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve` و غیره) مستقیماً در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین فرمان‌هایی را تشخیص می‌دهد که با اشارهٔ Matrix خود ربات پیشوندگذاری شده‌اند، بنابراین `@bot:server /new` بدون regex اشارهٔ سفارشی، مسیر فرمان را تحریک می‌کند. این کار ربات را نسبت به پست‌های سبک اتاق `@mention /command` که Element و کلاینت‌های مشابه وقتی کاربر پیش از تایپ فرمان، ربات را با تکمیل زبانه‌ای کامل می‌کند منتشر می‌کنند، پاسخ‌گو نگه می‌دارد.

قواعد مجوزدهی همچنان اعمال می‌شوند: فرستندگان فرمان باید همان سیاست‌های allowlist/مالک DM یا اتاق را مانند پیام‌های ساده برآورده کنند.

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

- مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض برای حساب‌های نام‌گذاری‌شده عمل می‌کنند، مگر اینکه حسابی آن‌ها را بازنویسی کند.
- با `groups.<room>.account` یک ورودی اتاق ارث‌برده را به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` میان حساب‌ها مشترک هستند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- برای انتخاب حساب نام‌گذاری‌شده‌ای که مسیریابی ضمنی، کاوش و فرمان‌های CLI ترجیح می‌دهند، `defaultAccount` را تنظیم کنید.
- اگر چند حساب دارید و یکی دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌صورت ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌گذاری‌شده دارید و هیچ پیش‌فرضی انتخاب نشده باشد، فرمان‌های CLI از حدس زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را پاس بدهید.
- بلوک سطح بالای `channels.matrix.*` فقط وقتی auth آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`) به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود. حساب‌های نام‌گذاری‌شده پس از اینکه اعتبارنامه‌های cacheشده auth را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی، پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌گذاری‌شدهٔ موجودی وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، آن را حفظ می‌کند. فقط کلیدهای auth/bootstrap مربوط به Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای مشترک سیاست تحویل در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## homeserverهای خصوصی/LAN

به‌صورت پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، homeserverهای خصوصی/داخلی Matrix را مسدود می‌کند، مگر اینکه
به‌صراحت برای هر حساب opt in کنید.

اگر homeserver شما روی localhost، یک IP در LAN/Tailscale، یا یک hostname داخلی اجرا می‌شود،
برای آن حساب Matrix، `network.dangerouslyAllowPrivateNetwork` را فعال کنید:

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

این انتخاب صریح فقط هدف‌های خصوصی/داخلی مورد اعتماد را مجاز می‌کند. homeserverهای عمومی با متن ساده مانند
`http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر زمان ممکن است، `https://` را ترجیح دهید.

## پراکسی کردن ترافیک Matrix

اگر استقرار Matrix شما به یک پراکسی خروجی HTTP(S) صریح نیاز دارد، `channels.matrix.proxy` را تنظیم کنید:

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
OpenClaw از همان تنظیم پراکسی برای ترافیک زمان اجرای Matrix و بررسی‌های وضعیت حساب استفاده می‌کند.

## تفکیک هدف

Matrix این شکل‌های هدف را در هر جایی که OpenClaw از شما هدف اتاق یا کاربر بخواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی هدف‌های تحویل صریح، کارهای cron، اتصال‌ها یا allowlistها، از حروف دقیق شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای نشست داخلی را برای ذخیره‌سازی canonical نگه می‌دارد، بنابراین آن کلیدهای lowercase منبع قابل اعتمادی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوی کاربران، دایرکتوری کاربران Matrix را روی همان homeserver پرس‌وجو می‌کند.
- جست‌وجوی اتاق‌ها، شناسه‌های صریح اتاق و نام‌های مستعار را مستقیم می‌پذیرد. جست‌وجوی نام اتاق‌های عضو‌شده به‌صورت بهترین تلاش انجام می‌شود و فقط وقتی `dangerouslyAllowNameMatching: true` تنظیم شده باشد، برای allowlistهای اتاق در زمان اجرا اعمال می‌شود.
- اگر نام اتاق به شناسه یا نام مستعار تفکیک نشود، در تفکیک allowlist زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای کاربری با سبک allowlist (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (امن‌ترین حالت). ورودی‌های کاربری غیرشناسه به‌طور پیش‌فرض نادیده گرفته می‌شوند. اگر `dangerouslyAllowNameMatching: true` را تنظیم کنید، تطبیق‌های دقیق نام نمایشی دایرکتوری Matrix هنگام راه‌اندازی و هر زمان که allowlist در حال اجرای مانیتور تغییر کند تفکیک می‌شوند؛ ورودی‌هایی که قابل تفکیک نباشند در زمان اجرا نادیده گرفته می‌شوند.

کلیدهای allowlist اتاق (`groups`، `rooms` قدیمی) باید شناسه اتاق یا نام مستعار باشند. کلیدهای نام اتاق ساده به‌طور پیش‌فرض نادیده گرفته می‌شوند؛ `dangerouslyAllowNameMatching: true` جست‌وجوی بهترین تلاش را در برابر نام اتاق‌های عضو‌شده بازمی‌گرداند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال کنید.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث برده می‌شوند.
- `homeserver`: URL homeserver، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، IPهای LAN/Tailscale، یا نام‌های میزبان داخلی وصل شود.
- `proxy`: URL اختیاری پراکسی HTTP(S) برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقدارهای متن ساده و SecretRef در ارائه‌دهندگان env/file/exec پشتیبانی می‌شوند ([مدیریت اسرار](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقدارهای متن ساده و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: URL آواتار خودِ ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد رویدادهایی که در طول همگام‌سازی راه‌اندازی دریافت می‌شوند.

### رمزگذاری

- `encryption`: E2EE را فعال کنید. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأییدنشده باشد، هنگام راه‌اندازی به‌طور خودکار درخواست خودتأییدی می‌دهد.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار بعدی هنگام راه‌اندازی. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: allowlist شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همه DMها را نادیده می‌گیرد. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از اینکه bot به اتاق پیوست و آن را به‌عنوان DM طبقه‌بندی کرد اعمال می‌شود؛ روی مدیریت دعوت اثر نمی‌گذارد.
- `dm.allowFrom`: allowlist شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی فقط DM برای thread کردن پاسخ‌ها (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌های دیگر حساب‌های bot پیکربندی‌شده Matrix را بپذیرید (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های DM فعال (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` اجبار می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `dangerouslyAllowNameMatching`: وقتی `true` باشد، جست‌وجوی دایرکتوری نام نمایشی Matrix را برای ورودی‌های allowlist کاربر و جست‌وجوی نام اتاق‌های عضو‌شده را برای کلیدهای allowlist اتاق مجاز می‌کند. شناسه‌های کامل `@user:server` و شناسه‌ها یا نام‌های مستعار اتاق را ترجیح دهید.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر دعوت Matrix، از جمله دعوت‌های سبک DM، اعمال می‌شود.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعاری که وقتی `autoJoin` برابر `"allowlist"` است مجازند. ورودی‌های نام مستعار در برابر homeserver تفکیک می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌کننده.
- `contextVisibility`: نمایانی زمینه تکمیلی (`"all"` پیش‌فرض، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی نشست وابسته به thread و چرخه عمر.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا شکل شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های تکمیل‌شده assistant به‌عنوان پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه قطعه خروجی بر حسب کاراکتر وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد کاراکتر) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی پیام اتاق agent را فعال می‌کند، به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه رسانه بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش تأیید برای این کانال/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: کنترل ابزار برای هر کنش (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نقشه سیاست برای هر اتاق. هویت نشست پس از تفکیک از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاق ارث‌بری‌شده را به حسابی خاص محدود کنید.
  - `groups.<room>.allowBots`: بازنویسی هر اتاق برای تنظیم سطح کانال (`true` یا `"mentions"`).
  - `groups.<room>.users`: allowlist فرستندگان برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی گیت‌گذاری mention برای هر اتاق. `true` نیازمندی‌های mention را برای آن اتاق غیرفعال می‌کند؛ `false` دوباره آن‌ها را اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر Skills برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه system prompt برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق promptهای بومی Matrix تحویل دهید.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که اجازه تأیید دارند. به `dm.allowFrom` برمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlistهای اختیاری agent/session برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) - احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و گیت‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
