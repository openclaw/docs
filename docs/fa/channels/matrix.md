---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی E2EE و تأیید در Matrix
summary: وضعیت پشتیبانی Matrix، راه‌اندازی، و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-05-10T19:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
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

مشخصات خام Plugin ابتدا ClawHub را امتحان می‌کنند و سپس به npm برمی‌گردند. برای اجبار منبع رجیستری، از `openclaw plugins install clawhub:@openclaw/matrix` یا `openclaw plugins install npm:@openclaw/matrix` استفاده کنید.

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`، Plugin را ثبت و فعال می‌کند، بنابراین نیازی به مرحله‌ی جداگانه‌ی `openclaw plugins enable matrix` نیست. با این حال، Plugin تا زمانی که کانال زیر را پیکربندی نکنید کاری انجام نمی‌دهد. برای رفتار عمومی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را با `homeserver` + `accessToken`، یا `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک DM با ربات شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید - دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه بدهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

ویزارد این موارد را می‌پرسد: URL مربوط به homeserver، روش احراز هویت (توکن دسترسی یا گذرواژه)، شناسه‌ی کاربر (فقط برای احراز هویت با گذرواژه)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، ویزارد یک میان‌بر متغیر محیطی پیشنهاد می‌دهد. برای resolve کردن نام اتاق‌ها پیش از ذخیره‌ی allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، ویزارد پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

`channels.matrix.autoJoin` به‌صورت پیش‌فرض `off` است. با حالت پیش‌فرض، ربات تا زمانی که دستی join نکنید در اتاق‌ها یا DMهای جدید حاصل از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw در زمان دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده DM است یا گروه، بنابراین همه‌ی دعوت‌ها - از جمله دعوت‌های شبیه DM - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدتر اعمال می‌شود، پس از اینکه ربات join کرده و اتاق طبقه‌بندی شده باشد.

<Warning>
برای محدود کردن دعوت‌هایی که ربات می‌پذیرد، `autoJoin: "allowlist"` به‌همراه `autoJoinAllowlist` را تنظیم کنید، یا برای پذیرش همه‌ی دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط targetهای پایدار را می‌پذیرد: `!roomId:server`، `#alias:server`، یا `*`. نام‌های ساده‌ی اتاق رد می‌شوند؛ ورودی‌های alias در برابر homeserver resolve می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌شده.
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

برای پذیرش همه‌ی دعوت‌ها، از `autoJoin: "always"` استفاده کنید.

### قالب‌های target برای allowlist

بهتر است allowlistهای DM و اتاق با شناسه‌های پایدار پر شوند:

- DMها (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی فقط وقتی resolve می‌شوند که دایرکتوری homeserver دقیقا یک match برگرداند.
- اتاق‌ها (`groups`, `autoJoinAllowlist`): از `!room:server` یا `#alias:server` استفاده کنید. نام‌ها به‌صورت best-effort در برابر اتاق‌های joined resolve می‌شوند؛ ورودی‌های resolveنشده در زمان اجرا نادیده گرفته می‌شوند.

### نرمال‌سازی شناسه‌ی حساب

ویزارد یک نام دوستانه را به شناسه‌ی حساب نرمال‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های scoped متغیر محیطی escape می‌شود تا دو حساب نتوانند collide کنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cache‌شده

Matrix اعتبارنامه‌های cache‌شده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌گذاری‌شده: `credentials-<account>.json`

وقتی اعتبارنامه‌های cache‌شده در آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد، Matrix را پیکربندی‌شده در نظر می‌گیرد - این شامل setup، `openclaw doctor` و probeهای وضعیت کانال می‌شود.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌گذاری‌شده شناسه‌ی حساب را پیش از پسوند وارد می‌کنند.

| حساب پیش‌فرض           | حساب نام‌گذاری‌شده (`<ID>` شناسه‌ی حساب نرمال‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN` و مانند آن تبدیل می‌شوند. متغیرهای محیطی کلید بازیابی توسط جریان‌های CLI آگاه از بازیابی (`verify backup restore`، `verify device`، `verify bootstrap`) خوانده می‌شوند، وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در workspace](/fa/gateway/security) را ببینید.

## نمونه‌ی پیکربندی

یک baseline عملی با pairing برای DM، allowlist اتاق و E2EE:

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

streaming پاسخ Matrix اختیاری و نیازمند فعال‌سازی است. `streaming` کنترل می‌کند OpenClaw پاسخ در حال اجرای assistant را چگونه تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر block تکمیل‌شده به‌عنوان پیام Matrix جداگانه‌ی خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه داشتن پیش‌نمایش‌های زنده‌ی پاسخ اما پنهان کردن خطوط موقت tool/progress، از فرم object استفاده کنید:

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

| `streaming`          | رفتار                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (پیش‌فرض)   | منتظر پاسخ کامل می‌ماند و یک‌بار ارسال می‌کند. `true` ↔ `"partial"`، `false` ↔ `"off"`.                                                                          |
| `"partial"`          | هم‌زمان با نوشتن block فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. clientهای معمول Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه روی ویرایش نهایی. |
| `"quiet"`            | همانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان می‌گیرند که یک push rule برای هر کاربر با ویرایش نهایی‌شده match شود (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                            | `blockStreaming: false` (پیش‌فرض)                  |
| ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای block فعلی، blockهای تکمیل‌شده به‌عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای block فعلی، درجا نهایی می‌شود |
| `"off"`                 | برای هر block پایان‌یافته، یک پیام Matrix دارای اعلان           | یک پیام Matrix دارای اعلان برای پاسخ کامل        |

نکته‌ها:

- اگر یک پیش‌نمایش از محدودیت اندازه‌ی هر event در Matrix بزرگ‌تر شود، OpenClaw پیش‌نمایش streaming را متوقف می‌کند و به تحویل فقط نهایی برمی‌گردد.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌صورت عادی ارسال می‌کنند. اگر یک پیش‌نمایش stale دیگر نتواند با اطمینان دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش tool-progress وقتی streaming پیش‌نمایش Matrix فعال باشد به‌صورت پیش‌فرض فعال‌اند. برای نگه داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ اما باقی گذاشتن پیشرفت ابزار در مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش هزینه‌ی فراخوانی‌های اضافی Matrix API دارند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را نگه دارید.

## metadata تأیید

promptهای تأیید native در Matrix، eventهای عادی `m.room.message` هستند که محتوای event سفارشی و مخصوص OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی event-content را مجاز می‌داند، بنابراین clientهای معمول همچنان بدنه‌ی متنی را render می‌کنند، در حالی که clientهای آگاه از OpenClaw می‌توانند شناسه‌ی ساختاریافته‌ی تأیید، نوع، state، تصمیم‌های موجود و جزئیات exec/Plugin را بخوانند.

وقتی یک prompt تأیید برای یک event در Matrix بیش از حد طولانی باشد، OpenClaw متن قابل‌مشاهده را chunk می‌کند و `com.openclaw.approval` را فقط به chunk اول پیوست می‌کند. واکنش‌ها برای تصمیم‌های allow/deny به همان event اول bound می‌شوند، بنابراین promptهای طولانی همان target تأیید promptهای تک-event را نگه می‌دارند.

### push ruleهای self-hosted برای پیش‌نمایش‌های نهایی‌شده‌ی quiet

`streaming: "quiet"` فقط وقتی به گیرندگان اعلان می‌دهد که یک block یا turn نهایی شده باشد - یک push rule برای هر کاربر باید با marker پیش‌نمایش نهایی‌شده match شود. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب rule، نکته‌های مربوط به هر homeserver)، [push ruleهای Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های bot-to-bot

به‌صورت پیش‌فرض، پیام‌های Matrix از حساب‌های Matrix دیگر که در OpenClaw پیکربندی شده‌اند نادیده گرفته می‌شوند.

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

- `allowBots: true` پیام‌های حساب‌های ربات Matrix دیگرِ پیکربندی‌شده را در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` این پیام‌ها را فقط وقتی می‌پذیرد که در اتاق‌ها به‌صورت قابل‌مشاهده این ربات را mention کنند. DMها همچنان مجازند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق override می‌کند.
- OpenClaw همچنان پیام‌های همان شناسه‌ی کاربر Matrix را نادیده می‌گیرد تا از loopهای self-reply جلوگیری کند.
- Matrix در اینجا flag بومی ربات را expose نمی‌کند؛ OpenClaw «bot-authored» را به‌معنای «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده‌ی دیگر روی این OpenClaw Gateway» در نظر می‌گیرد.

هنگام فعال کردن ترافیک bot-to-bot در اتاق‌های مشترک، از allowlistهای سخت‌گیرانه‌ی اتاق و الزام‌های mention استفاده کنید.

## رمزنگاری و verification

در اتاق‌های رمزنگاری‌شده (E2EE)، eventهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزنگاری شوند. اتاق‌های رمزنگاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. هیچ پیکربندی‌ای لازم نیست - Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همهٔ فرمان‌های `openclaw matrix` گزینه‌های `--verbose` (عیب‌یابی کامل)، `--json` (خروجی قابل‌خواندن برای ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌صورت پیش‌فرض، با ثبت داخلی کم‌صدای SDK، خلاصه است. نمونه‌های زیر شکل متعارف را نشان می‌دهند؛ در صورت نیاز گزینه‌ها را اضافه کنید.

### فعال‌سازی رمزنگاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و امضای متقابل را راه‌اندازی اولیه می‌کند، در صورت نیاز یک پشتیبان کلیدهای اتاق می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. گزینه‌های مفید:

- `--recovery-key <key>` پیش از راه‌اندازی اولیه، یک کلید بازیابی اعمال می‌کند (شکل stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` هویت امضای متقابل فعلی را دور می‌اندازد و هویت جدیدی می‌سازد (فقط آگاهانه استفاده کنید)

برای یک حساب جدید، E2EE را هنگام ساخت حساب فعال کنید:

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

- `Locally trusted`: فقط برای این کلاینت مورد اعتماد است
- `Cross-signing verified`: SDK تأیید از طریق امضای متقابل را گزارش می‌کند
- `Signed by owner`: با کلید خودامضای خودتان امضا شده است (فقط برای عیب‌یابی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیهٔ حساب Matrix، عیب‌یابی بهترین‌تلاشی را برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### تأیید این دستگاه با کلید بازیابی

کلید بازیابی حساس است - آن را به‌جای ارسال در خط فرمان، از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا برای یک حساب نام‌دار `MATRIX_<ID>_RECOVERY_KEY`) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این فرمان سه حالت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفت.
- `Backup usable`: پشتیبان کلیدهای اتاق را می‌توان با مادهٔ بازیابی مورد اعتماد بارگذاری کرد.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقابل Matrix را دارد.

اگر اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی مواد پشتیبان را باز کرده باشد، با کد غیرصفر خارج می‌شود. در این حالت، خودتأییدی را از یک کلاینت Matrix دیگر کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

شکل کلید صریح `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچهٔ شل شما باقی می‌ماند.

### راه‌اندازی اولیه یا تعمیر امضای متقابل

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان تعمیر و راه‌اندازی برای حساب‌های رمزنگاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی اولیه می‌کند و هرجا ممکن باشد از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقابل را راه‌اندازی اولیه می‌کند و کلیدهای عمومی ازدست‌رفته را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و با امضای متقابل امضا می‌کند
- اگر پشتیبان سمت سرور کلیدهای اتاق از قبل وجود نداشته باشد، آن را می‌سازد

اگر homeserver برای بارگذاری کلیدهای امضای متقابل به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت، سپس `m.login.dummy`، و بعد `m.login.password` را امتحان می‌کند (به `channels.matrix.password` نیاز دارد).

گزینه‌های مفید:

- `--recovery-key-stdin` (با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` جفت کنید) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای دور انداختن هویت امضای متقابل فعلی (فقط آگاهانه)

### پشتیبان کلیدهای اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گرفته‌شده را به انبار رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان خراب با یک خط مبنای تازه (از دست رفتن تاریخچهٔ قدیمیِ غیرقابل‌بازیابی را می‌پذیرد؛ اگر راز پشتیبان فعلی قابل‌بارگذاری نباشد، می‌تواند ذخیره‌سازی محرمانه را نیز دوباره بسازد):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` را فقط زمانی اضافه کنید که آگاهانه می‌خواهید کلید بازیابی قبلی دیگر خط مبنای پشتیبان تازه را باز نکند.

### فهرست‌کردن، درخواست‌دادن و پاسخ‌دادن به تأییدها

```bash
openclaw matrix verify list
```

درخواست‌های تأیید در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست تأیید می‌فرستد. `--own-user` خودتأییدی را درخواست می‌کند (شما اعلان را در یک کلاینت Matrix دیگر همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` نمی‌تواند با گزینه‌های هدف‌گیری دیگر ترکیب شود.

برای مدیریت چرخهٔ عمر در سطح پایین‌تر - معمولاً هنگام دنبال‌کردن درخواست‌های ورودی از یک کلاینت دیگر - این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                              |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                      |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌ها یا اعداد اعشاری SAS                                   |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با آنچه کلاینت دیگر نشان می‌دهد مطابق است           |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی ایموجی‌ها یا اعداد اعشاری مطابقت ندارند                 |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد     |

همهٔ `accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` وقتی تأیید به یک اتاق پیام مستقیم مشخص متصل باشد، `--user-id` و `--room-id` را به‌عنوان راهنمای پیگیری DM می‌پذیرند.

### نکات چندحسابی

بدون `--account <id>`، فرمان‌های CLI مربوط به Matrix از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌دار دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌دار غیرفعال یا ناموجود باشد، خطاها به کلید پیکربندی همان حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه تأییدنشد‌ه از یک کلاینت Matrix دیگر خودتأییدی درخواست می‌کند، موارد تکراری را رد می‌کند و یک دورهٔ توقف اعمال می‌کند (به‌صورت پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانهٔ راه‌اندازی اولیهٔ رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت امضای متقابل فعلی دوباره استفاده می‌کند. اگر وضعیت راه‌اندازی اولیه خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA مبتنی بر گذرواژه نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل با امضای مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix اعلان‌های چرخهٔ عمر تأیید را به‌صورت پیام‌های `m.notice` در اتاق سخت‌گیرانهٔ تأیید DM منتشر می‌کند: درخواست، آماده (با راهنمای «تأیید با ایموجی»)، شروع/تکمیل، و جزئیات SAS (ایموجی/اعشاری) در صورت وجود.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر رهگیری و به‌صورت خودکار پذیرفته می‌شوند. برای خودتأییدی، OpenClaw جریان SAS را به‌طور خودکار شروع می‌کند و پس از دردسترس‌شدن تأیید ایموجی، سمت خودش را تأیید می‌کند - همچنان باید در کلاینت Matrix خود مقایسه کنید و «مطابقت دارند» را تأیید کنید.

    اعلان‌های سیستمی تأیید به خط لولهٔ گفت‌وگوی عامل فوروارد نمی‌شوند.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    اگر `verify status` بگوید دستگاه فعلی دیگر در homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw بسازید. برای ورود با گذرواژه:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    برای احراز هویت با توکن، در کلاینت Matrix یا رابط مدیر خود یک access token تازه بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسهٔ حسابِ فرمان ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="Device hygiene">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست کنید و هرس کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE در Matrix از مسیر رمزنگاری Rust رسمی `matrix-js-sdk` با `fake-indexeddb` به‌عنوان شیم IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` پایدار می‌شود (مجوزهای فایل محدودکننده).

    وضعیت زمان اجرای رمزنگاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل انبار همگام‌سازی، انبار رمزنگاری، کلید بازیابی، تصویر لحظه‌ای IDB، پیوندهای رشته، و وضعیت تأیید هنگام راه‌اندازی است. وقتی توکن تغییر کند اما هویت حساب همان بماند، OpenClaw بهترین ریشهٔ موجود را دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

پروفایل شخصی Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های URL آواتار `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` را ارسال کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شدهٔ `mxc://` را در `channels.matrix.avatarUrl` (یا بازنویسی ویژهٔ هر حساب) ذخیره می‌کند.

## رشته‌ها

Matrix برای هم پاسخ‌های خودکار و هم ارسال‌های ابزار پیام، از رشته‌های بومی Matrix پشتیبانی می‌کند. دو تنظیم مستقل رفتار را کنترل می‌کنند:

### مسیریابی نشست (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به نشست‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همهٔ اتاق‌های DM با همان همتای مسیریابی‌شده یک نشست مشترک دارند.
- `"per-room"`: هر اتاق DM در Matrix کلید نشست خودش را می‌گیرد، حتی وقتی همتا یکسان باشد.

پیوندهای صریح مکالمه همیشه بر `sessionScope` غالب‌اند، بنابراین اتاق‌ها و رشته‌های پیوندخورده نشست هدف انتخاب‌شدهٔ خود را نگه می‌دارند.

### رشته‌بندی پاسخ (`threadReplies`)

`threadReplies` تعیین می‌کند ربات پاسخ خود را کجا منتشر کند:

- `"off"`: پاسخ‌ها در سطح بالایی هستند. پیام‌های رشته‌ای ورودی روی نشست والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در آن رشته بوده است، داخل رشته پاسخ بده.
- `"always"`: داخل رشته‌ای پاسخ بده که ریشه‌اش پیام محرک است؛ آن مکالمه از نخستین محرک به بعد از طریق یک نشست متناظرِ محدود به رشته مسیریابی می‌شود.

`dm.threadReplies` این رفتار را فقط برای DMها بازنویسی می‌کند - برای مثال، رشته‌های اتاق را جدا نگه دارید و در عین حال DMها را تخت نگه دارید.

### ارث‌بری رشته و فرمان‌های اسلش

- پیام‌های رشته‌ای ورودی، پیام ریشهٔ رشته را به‌عنوان زمینهٔ اضافی عامل شامل می‌شوند.
- ارسال‌های ابزار پیام، هنگام هدف‌گیری همان اتاق Matrix (یا همان هدف کاربر DM)، به‌طور خودکار رشتهٔ فعلی Matrix را به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شده باشد.
- استفادهٔ دوباره از هدف کاربر DM فقط زمانی فعال می‌شود که فرادادهٔ نشست فعلی همان همتای DM را روی همان حساب Matrix اثبات کند؛ در غیر این صورت OpenClaw به مسیریابی عادیِ محدود به کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` مقید به رشته، همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- `/focus` در سطح بالا، وقتی `threadBindings.spawnSessions` فعال باشد، یک رشتهٔ Matrix جدید ایجاد می‌کند و آن را به نشست هدف پیوند می‌دهد.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشتهٔ Matrix موجود، همان رشته را در جای خود پیوند می‌دهد.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، یک `m.notice` یک‌باره در همان اتاق ارسال می‌کند که به راه خروج `/focus` اشاره دارد و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط وقتی ظاهر می‌شود که پیوندهای رشته فعال باشند.

## پیوندهای گفت‌وگوی ACP

اتاق‌های Matrix، DMها، و رشته‌های موجود Matrix را می‌توان بدون تغییر سطح چت به فضاهای کاری پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشتهٔ موجود Matrix که می‌خواهید همچنان از آن استفاده کنید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق Matrix در سطح بالا، DM/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشتهٔ موجود Matrix، `--bind here` همان رشتهٔ فعلی را در جای خود پیوند می‌دهد.
- `/new` و `/reset` همان نشست ACP پیوندخورده را در جای خود بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و پیوند را حذف می‌کند.

نکته‌ها:

- `--bind here` یک رشتهٔ فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` روی `/acp spawn --thread auto|here` کنترل دارد، جایی که OpenClaw باید یک رشتهٔ فرزند Matrix ایجاد یا پیوند کند.

### پیکربندی پیوند رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و از بازنویسی‌های مختص کانال نیز پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های مقید به رشتهٔ Matrix به‌طور پیش‌فرض فعال است:

- برای جلوگیری از ایجاد/پیوند رشته‌های Matrix توسط `/focus` سطح بالا و `/acp spawn --thread auto|here`، مقدار `threadBindings.spawnSessions: false` را تنظیم کنید.
- وقتی ایجاد رشتهٔ زیرعامل بومی نباید رونویس گفت‌وگوی والد را منشعب کند، مقدار `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تأیید دریافت پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به رویداد Matrix اضافه می‌کند.
- `reactions` خلاصهٔ واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از ربات حذف می‌کند.

**ترتیب حل‌وفصل** (نخستین مقدار تعریف‌شده برنده است):

| تنظیم                  | ترتیب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | هر حساب → کانال → `messages.ackReaction` → جایگزین ایموجی هویت عامل             |
| `ackReactionScope`      | هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"`       |
| `reactionNotifications` | هر حساب → کانال → پیش‌فرض `"own"`                                                |

`reactionNotifications: "own"` رویدادهای افزوده‌شدهٔ `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف بگیرند، ارسال می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی تبدیل نمی‌شود، چون Matrix آن‌ها را به‌صورت حذف، نه حذف مستقل `m.reaction`، ارائه می‌کند.

## زمینهٔ تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی پیام یک اتاق Matrix عامل را فعال می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` گنجانده شود. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی، `0` تنظیم کنید.
- تاریخچهٔ اتاق Matrix فقط مخصوص اتاق است. DMها همچنان از تاریخچهٔ عادی نشست استفاده می‌کنند.
- تاریخچهٔ اتاق Matrix فقط در حالت در انتظار است: OpenClaw پیام‌های اتاق را که هنوز پاسخی فعال نکرده‌اند، بافر می‌کند، سپس وقتی یک اشاره یا محرک دیگر برسد، از آن پنجره عکس‌برداری می‌کند.
- پیام محرک فعلی در `InboundHistory` گنجانده نمی‌شود؛ برای آن نوبت در بدنهٔ ورودی اصلی باقی می‌ماند.
- تلاش‌های دوباره برای همان رویداد Matrix به‌جای جابه‌جا شدن به پیام‌های جدیدتر اتاق، از عکس‌برداری تاریخچهٔ اصلی دوباره استفاده می‌کنند.

## دیدپذیری زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینهٔ تکمیلی اتاق، مانند متن پاسخ دریافت‌شده، ریشه‌های رشته، و تاریخچهٔ در انتظار پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینهٔ تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستندگانی محدود می‌کند که بررسی‌های فهرست مجاز اتاق/کاربر فعال اجازه می‌دهند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شدهٔ صریح را نگه می‌دارد.

این تنظیم روی دیدپذیری زمینهٔ تکمیلی اثر می‌گذارد، نه اینکه خود پیام ورودی بتواند پاسخی را فعال کند یا نه.
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

برای رفتار کنترل اشاره و فهرست مجاز، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونهٔ جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشدهٔ Matrix پیش از تأیید همچنان به شما پیام بدهد، OpenClaw از همان کد جفت‌سازی در انتظار دوباره استفاده می‌کند و ممکن است پس از یک دورهٔ کوتاه کاهش دفعات، به‌جای ساختن کد جدید، یک پاسخ یادآوری بفرستد.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## ترمیم اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنهٔ `m.direct` روبه‌رو شود که به‌جای DM زنده، به اتاق‌های تک‌نفرهٔ قدیمی اشاره می‌کنند. نگاشت فعلی برای یک همتا را بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را ترمیم کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو دستور برای راه‌اندازی‌های چندحسابی، `--account <id>` را می‌پذیرند. جریان ترمیم:

- یک DM سخت‌گیرانهٔ ۱:۱ را ترجیح می‌دهد که از قبل در `m.direct` نگاشت شده باشد
- به هر DM سخت‌گیرانهٔ ۱:۱ که اکنون با آن کاربر عضو شده باشد برمی‌گردد
- اگر هیچ DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

این کار اتاق‌های قدیمی را به‌طور خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آیندهٔ Matrix، اعلان‌های راستی‌آزمایی، و دیگر جریان‌های پیام مستقیم اتاق درست را هدف بگیرند.

## تأییدهای اجرا

Matrix می‌تواند به‌عنوان یک کارخواه تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای بازنویسی هر حساب، زیر `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تأییدها را از طریق اعلان‌های بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده باشد یا `"auto"` باشد، Matrix پس از اینکه دست‌کم یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که اجازهٔ تأیید درخواست‌های اجرا را دارند. اختیاری است - به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال اعلان‌ها. `"dm"` (پیش‌فرض) به DMهای تأییدکننده ارسال می‌کند؛ `"channel"` به اتاق یا DM مبدأ Matrix ارسال می‌کند؛ `"both"` به هر دو ارسال می‌کند.
- `agentFilter` / `sessionFilter`: فهرست‌های مجاز اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را فعال کنند.

مجوزدهی بین انواع تأیید کمی تفاوت دارد:

- **تأییدهای اجرا** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجاز می‌شوند.

هر دو نوع، میانبرهای واکنش Matrix و به‌روزرسانی‌های پیام را به‌صورت مشترک دارند. تأییدکننده‌ها روی پیام اصلی تأیید، میانبرهای واکنش را می‌بینند:

- `✅` یک‌بار اجازه بده
- `❌` رد کن
- `♾️` همیشه اجازه بده (وقتی سیاست مؤثر اجرا اجازه دهد)

دستورهای اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکننده‌های حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای اجرا متن دستور را شامل می‌شود - `channel` یا `both` را فقط در اتاق‌های مورداعتماد فعال کنید.

مرتبط: [تأییدهای اجرا](/fa/tools/exec-approvals).

## دستورهای اسلش

دستورهای اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیماً در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین دستورهایی را می‌شناسد که با اشارهٔ خود ربات در Matrix پیشوند شده باشند، بنابراین `@bot:server /new` مسیر دستور را بدون یک عبارت منظم اشارهٔ سفارشی فعال می‌کند. این کار ربات را نسبت به پست‌های سبک اتاقیِ `@mention /command` که Element و کارخواه‌های مشابه وقتی کاربر پیش از تایپ دستور نام ربات را با تکمیل خودکار وارد می‌کند منتشر می‌کنند، پاسخ‌گو نگه می‌دارد.

قواعد مجوز همچنان اعمال می‌شوند: فرستندگان دستور باید همان سیاست‌های فهرست مجاز/مالک DM یا اتاق را که برای پیام‌های عادی لازم است برآورده کنند.

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

- مقدارهای سطح بالای `channels.matrix` برای حساب‌های نام‌گذاری‌شده به‌عنوان پیش‌فرض عمل می‌کنند، مگر اینکه حسابی آن‌ها را بازنویسی کند.
- یک ورودی اتاق ارث‌بری‌شده را با `groups.<room>.account` به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک هستند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- برای انتخاب حساب نام‌گذاری‌شده‌ای که مسیریابی ضمنی، کاوش، و دستورهای CLI ترجیح می‌دهند، `defaultAccount` را تنظیم کنید.
- اگر چند حساب دارید و یکی از آن‌ها دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، به‌طور ضمنی از آن استفاده می‌کند.
- اگر چند حساب نام‌گذاری‌شده دارید و هیچ پیش‌فرضی انتخاب نشده باشد، دستورهای CLI از حدس زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را بدهید.
- بلوک سطح بالای `channels.matrix.*` فقط وقتی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که احراز هویت آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌گذاری‌شده پس از اینکه اعتبارنامه‌های کش‌شده احراز هویت را پوشش دهند، همچنان از `homeserver` + `userId` قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام ترمیم یا راه‌اندازی یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌گذاری‌شدهٔ موجودی وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، همان را حفظ می‌کند. فقط کلیدهای احراز هویت/راه‌اندازی اولیهٔ Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## کارسازهای خانگی خصوصی/شبکهٔ محلی

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF کارسازهای خانگی خصوصی/داخلی Matrix را مسدود می‌کند، مگر اینکه برای هر حساب به‌صراحت شرکت کنید.

اگر کارساز خانگی شما روی localhost، یک نشانی IP شبکهٔ محلی/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود، برای آن حساب Matrix گزینهٔ `network.dangerouslyAllowPrivateNetwork` را فعال کنید:

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

این انتخاب اختیاری فقط هدف‌های خصوصی/داخلی مورد اعتماد را مجاز می‌کند. هوم‌سرورهای عمومی بدون رمزنگاری مانند
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

حساب‌های نام‌گذاری‌شده می‌توانند مقدار پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پراکسی برای ترافیک زمان اجرای Matrix و بررسی‌های وضعیت حساب استفاده می‌کند.

## حل‌وفصل هدف

Matrix این قالب‌های هدف را در هر جایی که OpenClaw از شما هدف اتاق یا کاربر می‌خواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی هدف‌های تحویل صریح، کارهای cron، bindingها، یا allowlistها، از دقیقاً همان بزرگی و کوچکی حروف شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای نشست داخلی را برای ذخیره‌سازی canonical نگه می‌دارد، بنابراین آن کلیدهای lowercase منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوهای کاربر دایرکتوری کاربران Matrix را روی همان هوم‌سرور پرس‌وجو می‌کنند.
- جست‌وجوهای اتاق ابتدا شناسه‌های صریح اتاق و نام‌های مستعار را مستقیم می‌پذیرند، سپس به جست‌وجوی نام اتاق‌های join‌شده برای آن حساب برمی‌گردند.
- جست‌وجوی نام اتاق join‌شده به‌صورت بهترین تلاش انجام می‌شود. اگر نام اتاق به شناسه یا نام مستعار قابل حل نباشد، در حل‌وفصل allowlist زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای سبک allowlist (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (امن‌ترین گزینه). تطبیق‌های دقیق دایرکتوری هنگام شروع و هر زمان که allowlist در حال اجرای monitor تغییر کند حل می‌شوند؛ ورودی‌هایی که قابل حل نباشند در زمان اجرا نادیده گرفته می‌شوند. allowlistهای اتاق نیز به همین دلیل شناسه‌های اتاق یا نام‌های مستعار را ترجیح می‌دهند.

### حساب و اتصال

- `enabled`: channel را فعال یا غیرفعال می‌کند.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی هنگامی که چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقادیر سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث برده می‌شوند.
- `homeserver`: نشانی URL هوم‌سرور، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، IPهای LAN/Tailscale، یا نام میزبان‌های داخلی متصل شود.
- `proxy`: نشانی URL پراکسی HTTP(S) اختیاری برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقادیر متن ساده و SecretRef در providerهای env/file/exec پشتیبانی می‌شوند ([مدیریت اسرار](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقادیر متن ساده و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که در زمان ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: نشانی URL خودآواتار ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد eventهایی که هنگام همگام‌سازی شروع دریافت می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال می‌کند. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأییدنشده باشد، هنگام شروع به‌طور خودکار درخواست خودتأییدی می‌دهد.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار بعدی هنگام شروع. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: allowlist شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همه DMها نادیده گرفته می‌شوند. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از join شدن bot و طبقه‌بندی اتاق به‌عنوان DM اعمال می‌شود؛ روی مدیریت دعوت‌ها اثری ندارد.
- `dm.allowFrom`: allowlist شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی فقط مخصوص DM برای reply threading (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌های حساب‌های bot دیگرِ Matrix که پیکربندی شده‌اند را می‌پذیرد (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های DM فعال (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` اجبار می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر دعوت Matrix اعمال می‌شود، از جمله دعوت‌های سبک DM.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار در برابر هوم‌سرور حل می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌شده.
- `contextVisibility`: نمایانی context تکمیلی (`"all"` پیش‌فرض، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر channel برای مسیریابی نشست وابسته به thread و چرخه عمر.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا فرم شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلاک‌های کامل‌شده assistant به‌صورت پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه chunk خروجی بر حسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد نویسه) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی پیام اتاق agent را تحریک می‌کند، به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه media بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش ack برای این channel/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: کنترل دسترسی ابزار برای هر action (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از حل‌وفصل از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار legacy است.)
  - `groups.<room>.account`: یک ورودی اتاق به‌ارث‌رسیده را به یک حساب مشخص محدود می‌کند.
  - `groups.<room>.allowBots`: بازنویسی هر اتاق برای تنظیم سطح channel (`true` یا `"mentions"`).
  - `groups.<room>.users`: allowlist فرستنده برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی mention-gating برای هر اتاق. `true` الزامات mention را برای آن اتاق غیرفعال می‌کند؛ `false` دوباره آن‌ها را اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر skill برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه system prompt برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق promptهای بومی Matrix تحویل می‌دهد.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که اجازه تأیید دارند. به `dm.allowFrom` برمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlistهای اختیاری agent/نشست برای تحویل.

## مرتبط

- [نمای کلی channelها](/fa/channels) - همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) - احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و mention gating
- [مسیریابی channel](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
