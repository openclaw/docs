---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی Matrix E2EE و راستی‌آزمایی
summary: وضعیت پشتیبانی Matrix، راه‌اندازی، و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-04-29T22:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال همراه برای OpenClaw است.
از `matrix-js-sdk` رسمی استفاده می‌کند و از DMها، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، موقعیت مکانی و E2EE پشتیبانی می‌کند.

## Plugin همراه

انتشارهای بسته‌بندی‌شده فعلی OpenClaw، Plugin Matrix را به‌صورت داخلی همراه دارند. نیازی نیست چیزی نصب کنید؛ پیکربندی `channels.matrix.*` (ببینید [راه‌اندازی](#setup)) همان چیزی است که آن را فعال می‌کند.

برای ساخت‌های قدیمی‌تر یا نصب‌های سفارشی که Matrix را حذف کرده‌اند، وقتی یک بسته npm فعلی منتشر شد آن را نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

اگر npm گزارش داد بسته متعلق به OpenClaw منسوخ شده است، تا زمان انتشار بسته npm جدیدتر، از یک ساخت بسته‌بندی‌شده فعلی OpenClaw یا یک checkout محلی استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`، Plugin را ثبت و فعال می‌کند، بنابراین به مرحله جداگانه `openclaw plugins enable matrix` نیاز نیست. با این حال Plugin تا زمانی که کانال زیر را پیکربندی نکنید کاری انجام نمی‌دهد. برای رفتار کلی Pluginها و قواعد نصب، [Pluginها](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را با یکی از این ترکیب‌ها پیکربندی کنید: `homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`.
3. Gateway را راه‌اندازی مجدد کنید.
4. یک DM با ربات شروع کنید، یا آن را به یک اتاق دعوت کنید (ببینید [پیوستن خودکار](#auto-join) — دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

ویزارد این موارد را می‌پرسد: URL homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسه کاربر (فقط برای احراز هویت با گذرواژه)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، ویزارد یک میان‌بر متغیر محیطی پیشنهاد می‌کند. برای resolve کردن نام اتاق‌ها پیش از ذخیره یک فهرست مجاز، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، ویزارد پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

مبتنی بر گذرواژه (توکن پس از اولین ورود cache می‌شود):

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

`channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است. با مقدار پیش‌فرض، ربات تا زمانی که دستی join نکنید در اتاق‌ها یا DMهای جدید ناشی از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده DM است یا گروه، بنابراین همه دعوت‌ها — از جمله دعوت‌های شبیه DM — ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدا اعمال می‌شود، پس از آنکه ربات join کرده و اتاق دسته‌بندی شده باشد.

<Warning>
برای محدود کردن دعوت‌هایی که ربات می‌پذیرد، `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` تنظیم کنید، یا برای پذیرش همه دعوت‌ها از `autoJoin: "always"` استفاده کنید.

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

### قالب‌های هدف فهرست مجاز

بهتر است فهرست‌های مجاز DM و اتاق با شناسه‌های پایدار پر شوند:

- DMها (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی فقط وقتی resolve می‌شوند که دایرکتوری homeserver دقیقا یک تطابق برگرداند.
- اتاق‌ها (`groups`، `autoJoinAllowlist`): از `!room:server` یا `#alias:server` استفاده کنید. نام‌ها به‌صورت best-effort در برابر اتاق‌های joined resolve می‌شوند؛ ورودی‌های resolveنشده در زمان اجرا نادیده گرفته می‌شوند.

### نرمال‌سازی شناسه حساب

ویزارد یک نام دوستانه را به یک شناسه حساب نرمال‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های متغیر محیطی scoped escape می‌شود تا دو حساب نتوانند با هم تداخل پیدا کنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cacheشده

Matrix اعتبارنامه‌های cacheشده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌گذاری‌شده: `credentials-<account>.json`

وقتی اعتبارنامه‌های cacheشده آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد، Matrix را پیکربندی‌شده در نظر می‌گیرد — این مورد راه‌اندازی، `openclaw doctor` و probeهای وضعیت کانال را پوشش می‌دهد.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌گذاری‌شده شناسه حساب را پیش از suffix وارد می‌کنند.

| حساب پیش‌فرض          | حساب نام‌گذاری‌شده (`<ID>` شناسه حساب نرمال‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN` و همین‌طور ادامه تبدیل می‌شوند. متغیرهای محیطی کلید بازیابی توسط جریان‌های CLI آگاه از بازیابی (`verify backup restore`، `verify device`، `verify bootstrap`) خوانده می‌شوند، وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` نمی‌تواند از یک فایل `.env` فضای کاری تنظیم شود؛ [فایل‌های `.env` فضای کاری](/fa/gateway/security) را ببینید.

## نمونه پیکربندی

یک baseline عملی با pairing برای DM، فهرست مجاز اتاق و E2EE:

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

streaming پاسخ Matrix اختیاری و نیازمند فعال‌سازی است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال تولید دستیار را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند هر بلوک کامل‌شده به‌عنوان پیام Matrix مستقل خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای حفظ پیش‌نمایش‌های زنده پاسخ اما پنهان کردن خطوط موقت ابزار/پیشرفت، از فرم object استفاده کنید:

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
| `"partial"`       | هنگام نوشتن بلوک فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. کلاینت‌های استاندارد Matrix ممکن است روی اولین پیش‌نمایش اعلان بدهند، نه روی ویرایش نهایی.              |
| `"quiet"`         | مانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان می‌گیرند که یک قاعده push برای هر کاربر با ویرایش نهایی‌شده match شود (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (پیش‌فرض)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای بلوک فعلی، بلوک‌های کامل‌شده به‌صورت پیام نگه داشته می‌شوند | پیش‌نویس زنده برای بلوک فعلی، درجا نهایی می‌شود |
| `"off"`                 | یک پیام Matrix اعلان‌دهنده برای هر بلوک تمام‌شده                     | یک پیام Matrix اعلان‌دهنده برای پاسخ کامل      |

نکات:

- اگر یک پیش‌نمایش از محدودیت اندازه هر event در Matrix عبور کند، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط نهایی fallback می‌کند.
- پاسخ‌های رسانه‌ای همیشه attachmentها را به‌صورت عادی ارسال می‌کنند. اگر یک پیش‌نمایش stale دیگر نتواند با ایمنی دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار، وقتی streaming پیش‌نمایش Matrix فعال باشد، به‌طور پیش‌فرض فعال هستند. برای حفظ ویرایش‌های پیش‌نمایش برای متن پاسخ اما باقی گذاشتن پیشرفت ابزار روی مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش هزینه فراخوانی‌های اضافی Matrix API دارند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را باقی بگذارید.

## metadata تأیید

promptهای تأیید بومی Matrix، eventهای عادی `m.room.message` هستند که محتوای event سفارشی ویژه OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی محتوای event را مجاز می‌داند، بنابراین کلاینت‌های استاندارد همچنان بدنه متن را render می‌کنند، درحالی‌که کلاینت‌های آگاه از OpenClaw می‌توانند شناسه تأیید ساختاریافته، نوع، state، تصمیم‌های موجود و جزئیات exec/Plugin را بخوانند.

وقتی یک prompt تأیید برای یک event Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را chunk می‌کند و `com.openclaw.approval` را فقط به chunk اول attach می‌کند. واکنش‌ها برای تصمیم‌های اجازه/رد به همان event اول bound هستند، بنابراین promptهای طولانی همان هدف تأیید promptهای تک-event را حفظ می‌کنند.

### قواعد push خودمیزبان برای پیش‌نمایش‌های نهایی‌شده quiet

`streaming: "quiet"` فقط وقتی به گیرندگان اعلان می‌دهد که یک بلوک یا turn نهایی شده باشد — یک قاعده push برای هر کاربر باید با marker پیش‌نمایش نهایی‌شده match شود. برای دستورالعمل کامل (توکن گیرنده، بررسی pusher، نصب قاعده، نکات هر homeserver)، [قواعد push Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های ربات-به-ربات

به‌طور پیش‌فرض، پیام‌های Matrix از حساب‌های Matrix دیگر OpenClaw که پیکربندی شده‌اند نادیده گرفته می‌شوند.

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

- `allowBots: true` پیام‌های حساب‌های ربات Matrix پیکربندی‌شده دیگر را در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` آن پیام‌ها را فقط وقتی می‌پذیرد که در اتاق‌ها به‌صورت قابل مشاهده از این ربات mention کنند. DMها همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق override می‌کند.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های پاسخ به خود جلوگیری کند.
- Matrix اینجا flag بومی ربات ارائه نمی‌کند؛ OpenClaw «نوشته‌شده توسط ربات» را به‌معنای «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده دیگر روی این OpenClaw Gateway» در نظر می‌گیرد.

هنگام فعال کردن ترافیک ربات-به-ربات در اتاق‌های مشترک، از فهرست‌های مجاز سخت‌گیرانه اتاق و الزامات mention استفاده کنید.

## رمزگذاری و تأیید

در اتاق‌های رمزگذاری‌شده (E2EE)، رویدادهای تصویر ارسالی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر نیز همراه با پیوست کامل رمزگذاری شوند. اتاق‌های رمزگذاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. به هیچ پیکربندی‌ای نیاز نیست — Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همهٔ فرمان‌های `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل خواندن برای ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌صورت پیش‌فرض خلاصه است و ثبت وقایع داخلی SDK بی‌صدا انجام می‌شود. مثال‌های زیر شکل متعارف را نشان می‌دهند؛ در صورت نیاز این گزینه‌ها را اضافه کنید.

### فعال‌سازی رمزگذاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و امضای متقاطع را راه‌اندازی می‌کند، در صورت نیاز یک پشتیبان از کلیدهای اتاق می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. گزینه‌های مفید:

- `--recovery-key <key>` پیش از راه‌اندازی، یک کلید بازیابی اعمال کنید (شکل stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` هویت امضای متقاطع فعلی را کنار بگذارید و یک هویت جدید بسازید (فقط آگاهانه استفاده کنید)

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

`verify status` سه سیگنال مستقل اعتماد را گزارش می‌کند (`--verbose` همهٔ آن‌ها را نشان می‌دهد):

- `Locally trusted`: فقط از سوی این کلاینت قابل اعتماد است
- `Cross-signing verified`: SDK تأیید از طریق امضای متقاطع را گزارش می‌کند
- `Signed by owner`: با کلید خودامضای خودتان امضا شده است (فقط برای عیب‌یابی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیهٔ حساب Matrix، عیب‌یابی best-effort برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### تأیید این دستگاه با کلید بازیابی

کلید بازیابی حساس است — به‌جای ارسال آن در خط فرمان، آن را از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا برای حساب نام‌گذاری‌شده `MATRIX_<ID>_RECOVERY_KEY`) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

فرمان سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفته است.
- `Backup usable`: پشتیبان کلیدهای اتاق با مواد بازیابی قابل اعتماد قابل بارگذاری است.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقاطع Matrix را دارد.

اگر اعتماد کامل هویت ناقص باشد، حتی وقتی کلید بازیابی مواد پشتیبان را باز کرده باشد، با کد غیرصفر خارج می‌شود. در این حالت، خودتأییدی را از یک کلاینت Matrix دیگر کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

شکل کلیدِ مستقیم `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچهٔ shell شما باقی می‌ماند.

### راه‌اندازی یا ترمیم امضای متقاطع

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان ترمیم و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی می‌کند و در صورت امکان از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقاطع را راه‌اندازی می‌کند و کلیدهای عمومی جاافتاده را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و با امضای متقاطع امضا می‌کند
- اگر پشتیبان سمت سرور از کلیدهای اتاق هنوز وجود نداشته باشد، آن را ایجاد می‌کند

اگر homeserver برای بارگذاری کلیدهای امضای متقاطع به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و سپس `m.login.password` (نیازمند `channels.matrix.password`).

گزینه‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنار گذاشتن هویت امضای متقاطع فعلی (فقط آگاهانه)

### پشتیبان کلیدهای اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را به ذخیره‌گاه رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد، می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزین کردن یک پشتیبان خراب با خط مبنای تازه (با پذیرش از دست رفتن تاریخچهٔ قدیمی غیرقابل‌بازیابی؛ همچنین می‌تواند ذخیره‌سازی محرمانه را در صورتی که محرمانهٔ پشتیبان فعلی قابل بارگذاری نباشد دوباره ایجاد کند):

```bash
openclaw matrix verify backup reset --yes
```

فقط وقتی `--rotate-recovery-key` را اضافه کنید که عمداً می‌خواهید کلید بازیابی قبلی دیگر خط مبنای پشتیبان تازه را باز نکند.

### فهرست کردن، درخواست دادن، و پاسخ دادن به تأییدها

```bash
openclaw matrix verify list
```

درخواست‌های تأیید معلق را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست تأیید ارسال می‌کند. `--own-user` خودتأییدی را درخواست می‌کند (شما اعلان را در یک کلاینت Matrix دیگر برای همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` را نمی‌توان با گزینه‌های هدف‌گیری دیگر ترکیب کرد.

برای مدیریت سطح پایین‌تر چرخهٔ عمر — معمولاً هنگام دنبال کردن درخواست‌های ورودی از یک کلاینت دیگر — این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌ها یا اعداد ده‌دهی SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با آنچه کلاینت دیگر نشان می‌دهد مطابقت دارد        |
| `openclaw matrix verify mismatch-sas <id>` | رد کردن SAS وقتی ایموجی‌ها یا اعداد ده‌دهی مطابقت ندارند           |
| `openclaw matrix verify cancel <id>`       | لغو؛ گزینه‌های اختیاری `--reason <text>` و `--code <matrix-code>` را می‌پذیرد |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان راهنماهای پیگیری DM می‌پذیرند، وقتی تأیید به یک اتاق پیام مستقیم مشخص متصل است.

### نکات چندحسابی

بدون `--account <id>`، فرمان‌های Matrix CLI از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌گذاری‌شده دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌گذاری‌شده غیرفعال یا در دسترس نباشد، خطاها به کلید پیکربندی همان حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه تأییدنشده در کلاینت Matrix دیگری درخواست خودتأییدی می‌دهد، موارد تکراری را رد می‌کند و یک cooldown اعمال می‌کند (به‌صورت پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانهٔ bootstrap رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت امضای متقاطع فعلی دوباره استفاده می‌کند. اگر وضعیت bootstrap خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک ترمیم محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA گذرواژه نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده می‌ماند. دستگاه‌هایی که از قبل توسط مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های تأیید">
    Matrix اعلان‌های چرخهٔ عمر تأیید را به‌صورت پیام‌های `m.notice` در اتاق سخت‌گیرانهٔ تأیید DM ارسال می‌کند: درخواست، آماده بودن (با راهنمایی «تأیید با ایموجی»)، شروع/تکمیل، و جزئیات SAS (ایموجی/ده‌دهی) در صورت وجود.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر ردیابی و خودکار پذیرفته می‌شوند. برای خودتأییدی، OpenClaw جریان SAS را به‌صورت خودکار شروع می‌کند و پس از در دسترس شدن تأیید ایموجی، سمت خودش را تأیید می‌کند — همچنان باید در کلاینت Matrix خود مقایسه کنید و «مطابقت دارند» را تأیید کنید.

    اعلان‌های سیستمی تأیید به خط لولهٔ چت عامل فوروارد نمی‌شوند.

  </Accordion>

  <Accordion title="دستگاه Matrix حذف‌شده یا نامعتبر">
    اگر `verify status` بگوید دستگاه فعلی دیگر در homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw بسازید. برای ورود با گذرواژه:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    برای احراز هویت با توکن، یک توکن دسترسی تازه در کلاینت Matrix یا UI مدیریتی خود بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسهٔ حساب از فرمان ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="بهداشت دستگاه">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست و پاک‌سازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="ذخیره‌گاه رمزنگاری">
    E2EE در Matrix از مسیر رسمی رمزنگاری Rust در `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌ماند (با مجوزهای محدودکنندهٔ فایل).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل ذخیره‌گاه همگام‌سازی، ذخیره‌گاه رمزنگاری، کلید بازیابی، snapshot مربوط به IDB، اتصال‌های thread، و وضعیت تأیید راه‌اندازی است. وقتی توکن تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw از بهترین root موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

پروفایل شخصی Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های آواتار `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` ارسال می‌کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و نشانی `mxc://` حل‌شده را در `channels.matrix.avatarUrl` (یا override مخصوص هر حساب) ذخیره می‌کند.

## Threadها

Matrix از Threadهای بومی Matrix هم برای پاسخ‌های خودکار و هم برای ارسال‌های ابزار پیام پشتیبانی می‌کند. دو کنترل مستقل رفتار را تعیین می‌کنند:

### مسیریابی جلسه (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به جلسه‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همهٔ اتاق‌های DM با همان همتای مسیریابی‌شده یک جلسه را به اشتراک می‌گذارند.
- `"per-room"`: هر اتاق DM در Matrix کلید جلسهٔ خودش را می‌گیرد، حتی وقتی همتا یکسان است.

اتصال‌های صریح مکالمه همیشه بر `sessionScope` مقدم‌اند، بنابراین اتاق‌ها و Threadهای متصل‌شده جلسهٔ هدف انتخاب‌شدهٔ خود را نگه می‌دارند.

### Thread کردن پاسخ‌ها (`threadReplies`)

`threadReplies` تعیین می‌کند ربات پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها سطح بالا هستند. پیام‌های Threadدار ورودی روی جلسهٔ والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در آن Thread بوده، داخل Thread پاسخ بده.
- `"always"`: داخل Threadی پاسخ بده که ریشه‌اش پیام محرک است؛ آن مکالمه از نخستین محرک به بعد از طریق یک جلسهٔ منطبقِ محدود به Thread مسیریابی می‌شود.

`dm.threadReplies` فقط برای DMها این را override می‌کند — برای مثال، Threadهای اتاق را جدا نگه دارید و در عین حال DMها را flat نگه دارید.

### وراثت Thread و فرمان‌های slash

- پیام‌های رشته‌ای ورودی، پیام ریشهٔ رشته را به‌عنوان زمینهٔ اضافی عامل شامل می‌شوند.
- ارسال‌های ابزار پیام، هنگام هدف‌گیری همان اتاق Matrix (یا همان هدف کاربر DM)، به‌صورت خودکار رشتهٔ Matrix فعلی را به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شده باشد.
- استفادهٔ مجدد از هدف کاربر DM فقط زمانی فعال می‌شود که فرادادهٔ نشست فعلی همان همتای DM را روی همان حساب Matrix اثبات کند؛ در غیر این صورت OpenClaw به مسیریابی عادی در محدودهٔ کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` مقید به رشته همگی در اتاق‌های Matrix و DMها کار می‌کنند.
- `/focus` در سطح بالا، زمانی که `threadBindings.spawnSubagentSessions: true` باشد، یک رشتهٔ Matrix جدید ایجاد می‌کند و آن را به نشست هدف مقید می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشتهٔ Matrix موجود، همان رشته را در محل خود مقید می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، در همان اتاق یک `m.notice` یک‌باره ارسال می‌کند که به مسیر خروج `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط زمانی ظاهر می‌شود که مقیدسازی رشته‌ها فعال باشد.

## مقیدسازی گفتگوهای ACP

اتاق‌های Matrix، DMها، و رشته‌های Matrix موجود را می‌توان بدون تغییر سطح چت، به فضاهای کاری پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشتهٔ موجود Matrix که می‌خواهید به استفاده از آن ادامه دهید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق Matrix سطح بالا، همان DM/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشتهٔ Matrix موجود، `--bind here` همان رشتهٔ فعلی را در محل خود مقید می‌کند.
- `/new` و `/reset` همان نشست ACP مقید را در محل خود بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و مقیدسازی را حذف می‌کند.

نکات:

- `--bind here` رشتهٔ فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnAcpSessions` فقط برای `/acp spawn --thread auto|here` لازم است؛ جایی که OpenClaw باید یک رشتهٔ فرزند Matrix ایجاد کند یا آن را مقید کند.

### پیکربندی مقیدسازی رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و از بازنویسی‌های جداگانه برای هر کانال نیز پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

پرچم‌های ایجاد مقید به رشته در Matrix اختیاری‌اند:

- برای اینکه `/focus` سطح بالا بتواند رشته‌های Matrix جدید ایجاد و مقید کند، `threadBindings.spawnSubagentSessions: true` را تنظیم کنید.
- برای اینکه `/acp spawn --thread auto|here` بتواند نشست‌های ACP را به رشته‌های Matrix مقید کند، `threadBindings.spawnAcpSessions: true` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به یک رویداد Matrix اضافه می‌کند.
- `reactions` خلاصهٔ واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از ربات حذف می‌کند.

**ترتیب تفکیک** (نخستین مقدار تعریف‌شده برنده است):

| تنظیم                   | ترتیب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | برای هر حساب → کانال → `messages.ackReaction` → جایگزین ایموجی هویت عامل        |
| `ackReactionScope`      | برای هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"` |
| `reactionNotifications` | برای هر حساب → کانال → پیش‌فرض `"own"`                                          |

`reactionNotifications: "own"` رویدادهای افزوده‌شدهٔ `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف می‌گیرند، ارسال می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی ترکیب نمی‌شود، چون Matrix آن‌ها را به‌صورت redaction نشان می‌دهد، نه به‌صورت حذف‌های مستقل `m.reaction`.

## زمینهٔ تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی یک پیام اتاق Matrix عامل را فعال می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` شامل شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی، `0` را تنظیم کنید.
- تاریخچهٔ اتاق Matrix فقط مختص اتاق است. DMها همچنان از تاریخچهٔ عادی نشست استفاده می‌کنند.
- تاریخچهٔ اتاق Matrix فقط معلق است: OpenClaw پیام‌های اتاق را که هنوز پاسخی فعال نکرده‌اند بافر می‌کند، سپس وقتی یک منشن یا فعال‌ساز دیگر برسد، از آن پنجره snapshot می‌گیرد.
- پیام فعال‌ساز فعلی در `InboundHistory` شامل نمی‌شود؛ برای همان نوبت در بدنهٔ ورودی اصلی باقی می‌ماند.
- تلاش‌های مجدد همان رویداد Matrix به‌جای حرکت به‌سمت پیام‌های جدیدتر اتاق، از snapshot تاریخچهٔ اصلی دوباره استفاده می‌کنند.

## نمایانی زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینهٔ تکمیلی اتاق، مانند متن پاسخ دریافت‌شده، ریشه‌های رشته، و تاریخچهٔ معلق پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینهٔ تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستندگانی محدود می‌کند که توسط بررسی‌های allowlist فعال اتاق/کاربر مجاز شده‌اند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شدهٔ صریح را نگه می‌دارد.

این تنظیم روی نمایانی زمینهٔ تکمیلی اثر می‌گذارد، نه اینکه آیا خود پیام ورودی می‌تواند پاسخی را فعال کند.
مجوز فعال‌سازی همچنان از `groupPolicy`، `groups`، `groupAllowFrom`، و تنظیمات سیاست DM می‌آید.

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

برای بی‌صدا کردن کامل DMها و در عین حال فعال نگه داشتن اتاق‌ها، `dm.enabled: false` را تنظیم کنید:

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

برای رفتار منشن‌محور و allowlist، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونهٔ جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشدهٔ Matrix پیش از تأیید مدام به شما پیام بدهد، OpenClaw از همان کد جفت‌سازی معلق دوباره استفاده می‌کند و ممکن است پس از یک cooldown کوتاه، به‌جای ساختن کد جدید، یک پاسخ یادآوری ارسال کند.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنهٔ `m.direct` روبه‌رو شود که به‌جای DM زنده، به اتاق‌های تک‌نفرهٔ قدیمی اشاره می‌کنند. نگاشت فعلی را برای یک همتا بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای چیدمان‌های چندحسابی `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانهٔ ۱:۱ را ترجیح می‌دهد که از قبل در `m.direct` نگاشت شده باشد
- به هر DM سخت‌گیرانهٔ ۱:۱ که اکنون با آن کاربر join شده باشد برمی‌گردد
- اگر DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

اتاق‌های قدیمی را به‌صورت خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آیندهٔ Matrix، اعلان‌های راستی‌آزمایی، و سایر جریان‌های پیام مستقیم اتاق درست را هدف بگیرند.

## تأییدهای exec

Matrix می‌تواند به‌عنوان یک کلاینت تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای بازنویسی جداگانه برای هر حساب، زیر `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تأییدها را از طریق promptهای بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده باشد یا `"auto"` باشد، Matrix زمانی که دست‌کم یک تأییدکننده قابل تفکیک باشد، به‌صورت خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که اجازه دارند درخواست‌های exec را تأیید کنند. اختیاری است و به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال promptها. `"dm"` (پیش‌فرض) به DMهای تأییدکننده می‌فرستد؛ `"channel"` به اتاق یا DM مبدأ Matrix می‌فرستد؛ `"both"` به هر دو می‌فرستد.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را فعال کنند.

مجوزدهی بین انواع تأیید کمی تفاوت دارد:

- **تأییدهای exec** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجوزدهی می‌شوند.

هر دو نوع، میانبرهای واکنش Matrix و به‌روزرسانی‌های پیام را مشترکاً استفاده می‌کنند. تأییدکنندگان میانبرهای واکنش را روی پیام اصلی تأیید می‌بینند:

- `✅` اجازه برای یک بار
- `❌` رد
- `♾️` همیشه اجازه بده (وقتی سیاست مؤثر exec اجازه دهد)

فرمان‌های slash جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکنندگان تفکیک‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای exec شامل متن فرمان است؛ `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای exec](/fa/tools/exec-approvals).

## فرمان‌های slash

فرمان‌های slash (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیماً در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین فرمان‌هایی را تشخیص می‌دهد که با منشن Matrix خود ربات پیشوند گرفته‌اند؛ بنابراین `@bot:server /new` بدون regex منشن سفارشی مسیر فرمان را فعال می‌کند. این باعث می‌شود ربات به پست‌های سبک اتاق `@mention /command` که Element و کلاینت‌های مشابه وقتی کاربر قبل از تایپ فرمان نام ربات را با tab کامل می‌کند منتشر می‌کنند، پاسخ‌گو بماند.

قواعد مجوزدهی همچنان اعمال می‌شوند: فرستندگان فرمان باید همان سیاست‌های allowlist/مالک DM یا اتاق را که برای پیام‌های ساده لازم است برآورده کنند.

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

- مقادیر سطح بالای `channels.matrix` برای حساب‌های نام‌دار به‌عنوان پیش‌فرض عمل می‌کنند، مگر اینکه یک حساب آن‌ها را بازنویسی کند.
- یک ورودی اتاق ارث‌بری‌شده را با `groups.<room>.account` به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک‌اند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- برای انتخاب حساب نام‌داری که مسیریابی ضمنی، probing، و فرمان‌های CLI ترجیح می‌دهند، `defaultAccount` را تنظیم کنید.
- اگر چند حساب دارید و یکی واقعاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌صورت ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌دار دارید و هیچ پیش‌فرضی انتخاب نشده است، فرمان‌های CLI از حدس زدن خودداری می‌کنند؛ `defaultAccount` را تنظیم کنید یا `--account <id>` را پاس دهید.
- بلوک سطح بالای `channels.matrix.*` فقط زمانی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که احراز هویت آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌دار پس از اینکه اعتبارنامه‌های cacheشده احراز هویت را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ترفیع:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی، یک پیکربندی تک‌حسابی را به چندحسابی ترفیع می‌دهد، اگر حساب نام‌داری وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، همان حساب نام‌دار موجود را حفظ می‌کند. فقط کلیدهای احراز هویت/راه‌اندازی Matrix به حساب ترفیع‌یافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## homeserverهای خصوصی/LAN

به‌صورت پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، homeserverهای خصوصی/داخلی Matrix را مسدود می‌کند، مگر اینکه
برای هر حساب به‌صورت صریح انتخاب کنید.

اگر homeserver شما روی localhost، یک IP شبکهٔ LAN/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود،
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

این فعال‌سازی اختیاری فقط هدف‌های خصوصی/داخلی مورداعتماد را مجاز می‌کند. هوم‌سرورهای عمومیِ متن‌آشکار مانند
`http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر جا ممکن است، `https://` را ترجیح دهید.

## پراکسی‌کردن ترافیک Matrix

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

حساب‌های نام‌گذاری‌شده می‌توانند مقدار پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پراکسی برای ترافیک زمان اجرای Matrix و بررسی‌های وضعیت حساب استفاده می‌کند.

## تفکیک هدف

Matrix این شکل‌های هدف را هر جا که OpenClaw از شما هدف اتاق یا کاربر بخواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی هدف‌های تحویل صریح، کارهای cron، اتصال‌ها، یا فهرست‌های مجاز، از همان بزرگی و کوچکی دقیق شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای نشست داخلی را برای ذخیره‌سازی به شکل canonical نگه می‌دارد، بنابراین آن کلیدهای کوچک‌شده منبع قابل‌اعتمادی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوی کاربران، دایرکتوری کاربران Matrix را روی همان هوم‌سرور پرس‌وجو می‌کند.
- جست‌وجوی اتاق‌ها ابتدا شناسه‌های صریح اتاق و نام‌های مستعار را مستقیما می‌پذیرد، سپس به جست‌وجوی نام اتاق‌های پیوسته برای آن حساب بازمی‌گردد.
- جست‌وجوی نام اتاق‌های پیوسته به‌صورت best-effort انجام می‌شود. اگر نام یک اتاق به شناسه یا نام مستعار قابل تفکیک نباشد، در تفکیک فهرست مجاز زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای سبک فهرست مجاز (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (ایمن‌ترین گزینه). تطابق‌های دقیق دایرکتوری هنگام راه‌اندازی و هر زمان که فهرست مجاز در حالی که پایشگر در حال اجراست تغییر کند تفکیک می‌شوند؛ ورودی‌هایی که قابل تفکیک نباشند در زمان اجرا نادیده گرفته می‌شوند. فهرست‌های مجاز اتاق نیز به همین دلیل شناسه‌های اتاق یا نام‌های مستعار را ترجیح می‌دهند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال کنید.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسهٔ حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث می‌رسند.
- `homeserver`: نشانی URL هوم‌سرور، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، نشانی‌های IP شبکهٔ محلی/Tailscale، یا نام‌های میزبان داخلی متصل شود.
- `proxy`: نشانی URL پراکسی HTTP(S) اختیاری برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسهٔ کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقدارهای متن ساده و SecretRef در ارائه‌دهنده‌های env/file/exec پشتیبانی می‌شوند ([مدیریت اسرار](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقدارهای متن ساده و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسهٔ صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: نشانی URL آواتار خودکاربرِ ذخیره‌شده برای همگام‌سازی نمایه و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: بیشینهٔ تعداد رویدادهایی که هنگام همگام‌سازی راه‌اندازی دریافت می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال کنید. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأیید نشده باشد، هنگام راه‌اندازی به‌صورت خودکار درخواست خودتأییدی می‌دهد.
- `startupVerificationCooldownHours`: دورهٔ انتظار پیش از درخواست خودکار بعدی هنگام راه‌اندازی. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` است، همهٔ پیام‌های مستقیم را نادیده بگیر. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از پیوستن بات و دسته‌بندی اتاق به‌عنوان پیام مستقیم اعمال می‌شود؛ روی مدیریت دعوت‌ها اثری ندارد.
- `dm.allowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک پیام مستقیم.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی مخصوص پیام مستقیم برای رشته‌ای‌کردن پاسخ‌ها (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌ها را از دیگر حساب‌های بات Matrix پیکربندی‌شده بپذیر (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` است، همهٔ سیاست‌های فعال پیام مستقیم (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` وادار می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر دعوت Matrix اعمال می‌شود، از جمله دعوت‌های شبیه پیام مستقیم.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار در برابر هوم‌سرور resolve می‌شوند، نه در برابر وضعیتی که اتاق دعوت‌کننده ادعا می‌کند.
- `contextVisibility`: نمایانی زمینهٔ تکمیلی (پیش‌فرض `"all"`، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی و چرخهٔ عمر نشست وابسته به رشته.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا شکل شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` است، بلوک‌های کامل‌شدهٔ دستیار به‌صورت پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشتهٔ اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازهٔ قطعهٔ خروجی برحسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد نویسه) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی پیام اتاق عامل را تحریک می‌کند به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` بازمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازهٔ رسانه برحسب مگابایت برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش تأیید برای این کانال/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: کنترل دسترسی ابزار برای هر کنش (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از resolve از شناسهٔ پایدار اتاق استفاده می‌کند. (`rooms` نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاقِ به‌ارث‌رسیده را به حسابی مشخص محدود کنید.
  - `groups.<room>.allowBots`: بازنویسی برای هر اتاق از تنظیم سطح کانال (`true` یا `"mentions"`).
  - `groups.<room>.users`: فهرست مجاز فرستنده‌ها برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی دروازه‌گذاری مبتنی بر اشاره برای هر اتاق. `true` الزام اشاره را برای آن اتاق غیرفعال می‌کند؛ `false` آن‌ها را دوباره اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر skill برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعهٔ پرامپت سیستمی برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق پرامپت‌های بومی Matrix تحویل دهید.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که اجازهٔ تأیید دارند. به `dm.allowFrom` بازمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: فهرست‌های مجاز اختیاری عامل/نشست برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گپ گروهی و دروازه‌گذاری مبتنی بر اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
