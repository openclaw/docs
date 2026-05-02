---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی E2EE و تأیید در Matrix
summary: وضعیت پشتیبانی، راه‌اندازی، و نمونه‌های پیکربندی Matrix
title: ماتریس
x-i18n:
    generated_at: "2026-05-02T11:35:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix یک Plugin کانال قابل دانلود برای OpenClaw است.
از `matrix-js-sdk` رسمی استفاده می‌کند و از پیام‌های مستقیم، اتاق‌ها، رشته‌ها، رسانه، واکنش‌ها، نظرسنجی‌ها، موقعیت مکانی و E2EE پشتیبانی می‌کند.

## نصب

پیش از پیکربندی کانال، Matrix را نصب کنید:

```bash
openclaw plugins install @openclaw/matrix
```

از یک checkout محلی:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` Plugin را ثبت و فعال می‌کند، بنابراین به مرحله جداگانه `openclaw plugins enable matrix` نیاز نیست. با این حال Plugin تا زمانی که کانال زیر را پیکربندی نکنید کاری انجام نمی‌دهد. برای رفتار کلی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی homeserver خود بسازید.
2. `channels.matrix` را با `homeserver` + `accessToken`، یا `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را بازراه‌اندازی کنید.
4. یک پیام مستقیم با bot شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید — دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه دهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

جادوگر این موارد را می‌پرسد: URL homeserver، روش احراز هویت (توکن دسترسی یا رمز عبور)، شناسه کاربر (فقط برای احراز هویت با رمز عبور)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، جادوگر یک میانبر متغیر محیطی پیشنهاد می‌کند. برای resolve کردن نام اتاق‌ها پیش از ذخیره allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، جادوگر پیکربندی را می‌نویسد و همان bootstrap را که [`openclaw matrix encryption setup`](#encryption-and-verification) انجام می‌دهد اجرا می‌کند.

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

مبتنی بر رمز عبور (توکن پس از نخستین ورود cache می‌شود):

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

مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است. با مقدار پیش‌فرض، bot تا زمانی که به‌صورت دستی join نکنید در اتاق‌ها یا پیام‌های مستقیم جدید از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw هنگام دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده پیام مستقیم است یا گروه، بنابراین همه دعوت‌ها — از جمله دعوت‌های شبیه DM — ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدتر اعمال می‌شود، پس از اینکه bot join کرده و اتاق طبقه‌بندی شده باشد.

<Warning>
برای محدود کردن دعوت‌هایی که bot می‌پذیرد، `autoJoin: "allowlist"` به‌همراه `autoJoinAllowlist` را تنظیم کنید، یا برای پذیرش همه دعوت‌ها از `autoJoin: "always"` استفاده کنید.

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

allowlistهای DM و اتاق بهتر است با شناسه‌های پایدار پر شوند:

- DMها (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی فقط وقتی resolve می‌شوند که فهرست homeserver دقیقاً یک تطابق برگرداند.
- اتاق‌ها (`groups`، `autoJoinAllowlist`): از `!room:server` یا `#alias:server` استفاده کنید. نام‌ها به‌صورت best-effort در برابر اتاق‌های join‌شده resolve می‌شوند؛ ورودی‌های resolveنشده در زمان اجرا نادیده گرفته می‌شوند.

### نرمال‌سازی شناسه حساب

جادوگر یک نام دوستانه را به شناسه حساب نرمال‌شده تبدیل می‌کند. برای نمونه، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های scoped متغیر محیطی escape می‌شود تا دو حساب نتوانند تداخل پیدا کنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cacheشده

Matrix اعتبارنامه‌های cacheشده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌گذاری‌شده: `credentials-<account>.json`

وقتی اعتبارنامه‌های cacheشده آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد، Matrix را پیکربندی‌شده در نظر می‌گیرد — این شامل راه‌اندازی، `openclaw doctor`، و probeهای وضعیت کانال می‌شود.

### متغیرهای محیطی

وقتی کلید پیکربندی معادل تنظیم نشده باشد استفاده می‌شوند. حساب پیش‌فرض از نام‌های بدون پیشوند استفاده می‌کند؛ حساب‌های نام‌گذاری‌شده شناسه حساب را پیش از پسوند وارد می‌کنند.

| حساب پیش‌فرض          | حساب نام‌گذاری‌شده (`<ID>` شناسه حساب نرمال‌شده است) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN`، و همین‌طور ادامه پیدا می‌کنند. متغیرهای محیطی recovery-key توسط جریان‌های CLI آگاه از recovery (`verify backup restore`، `verify device`، `verify bootstrap`) خوانده می‌شوند، وقتی کلید را از طریق `--recovery-key-stdin` pipe می‌کنید.

`MATRIX_HOMESERVER` نمی‌تواند از یک `.env` workspace تنظیم شود؛ [فایل‌های `.env` workspace](/fa/gateway/security) را ببینید.

## نمونه پیکربندی

یک خط پایه عملی با جفت‌سازی DM، allowlist اتاق، و E2EE:

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

streaming پاسخ Matrix اختیاری است. `streaming` کنترل می‌کند OpenClaw چگونه پاسخ در حال تولید دستیار را تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر block تکمیل‌شده به‌عنوان پیام Matrix خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه‌داشتن پیش‌نمایش‌های زنده پاسخ اما پنهان کردن خط‌های موقت ابزار/پیشرفت، از شکل object استفاده کنید:

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
| `"off"` (پیش‌فرض) | منتظر پاسخ کامل بمانید، یک‌بار ارسال کنید. `true` ↔ `"partial"`، `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | هم‌زمان با نوشتن block فعلی توسط مدل، یک پیام متنی معمولی را درجا ویرایش می‌کند. کلاینت‌های استاندارد Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه روی ویرایش نهایی.              |
| `"quiet"`         | همانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط وقتی اعلان دریافت می‌کنند که یک قاعده push برای هر کاربر با ویرایش نهایی‌شده تطابق داشته باشد (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (پیش‌فرض)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای block فعلی، blockهای تکمیل‌شده به‌عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای block فعلی، درجا نهایی می‌شود |
| `"off"`                 | یک پیام Matrix اعلان‌دار برای هر block پایان‌یافته                     | یک پیام Matrix اعلان‌دار برای پاسخ کامل      |

نکته‌ها:

- اگر یک پیش‌نمایش از حد اندازه هر event در Matrix بزرگ‌تر شود، OpenClaw پیش‌نمایش streaming را متوقف می‌کند و به تحویل فقط نهایی fallback می‌کند.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌صورت معمول ارسال می‌کنند. اگر یک پیش‌نمایش stale دیگر نتواند با اطمینان دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار وقتی Matrix preview streaming فعال باشد به‌صورت پیش‌فرض فعال هستند. برای نگه‌داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ، اما باقی گذاشتن پیشرفت ابزار در مسیر تحویل معمول، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش فراخوانی‌های اضافی Matrix API مصرف می‌کنند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را باقی بگذارید.

## فراداده تأیید

promptهای تأیید native در Matrix، eventهای معمول `m.room.message` هستند که محتوای custom event ویژه OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای محتوای event سفارشی را مجاز می‌داند، بنابراین کلاینت‌های استاندارد همچنان بدنه متن را render می‌کنند، در حالی که کلاینت‌های آگاه از OpenClaw می‌توانند شناسه تأیید ساختاریافته، نوع، state، تصمیم‌های موجود، و جزئیات exec/plugin را بخوانند.

وقتی یک prompt تأیید برای یک event Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را chunk می‌کند و `com.openclaw.approval` را فقط به نخستین chunk پیوست می‌کند. واکنش‌ها برای تصمیم‌های allow/deny به همان event نخست bound می‌شوند، بنابراین promptهای طولانی همان هدف تأیید promptهای تک-event را حفظ می‌کنند.

### قواعد push خودمیزبان برای پیش‌نمایش‌های نهایی‌شده quiet

`streaming: "quiet"` فقط وقتی یک block یا turn نهایی شد به گیرندگان اعلان می‌دهد — یک قاعده push برای هر کاربر باید با نشانگر پیش‌نمایش نهایی‌شده تطابق داشته باشد. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب قاعده، نکات هر homeserver)، [قواعد push Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های bot-to-bot

به‌صورت پیش‌فرض، پیام‌های Matrix از دیگر حساب‌های Matrix پیکربندی‌شده OpenClaw نادیده گرفته می‌شوند.

وقتی عمداً ترافیک Matrix بین agentها را می‌خواهید، از `allowBots` استفاده کنید:

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

- `allowBots: true` پیام‌ها را از دیگر حساب‌های bot پیکربندی‌شده Matrix در اتاق‌ها و DMهای مجاز می‌پذیرد.
- `allowBots: "mentions"` آن پیام‌ها را فقط وقتی می‌پذیرد که این bot را به‌صورت قابل مشاهده در اتاق‌ها mention کنند. DMها همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق override می‌کند.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های self-reply جلوگیری کند.
- Matrix در اینجا flag بومی bot را ارائه نمی‌کند؛ OpenClaw «نوشته‌شده توسط bot» را به‌معنای «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده دیگر روی این OpenClaw gateway» در نظر می‌گیرد.

هنگام فعال کردن ترافیک bot-to-bot در اتاق‌های مشترک، از allowlistهای سخت‌گیرانه اتاق و الزام mention استفاده کنید.

## رمزنگاری و تأیید

در اتاق‌های رمزنگاری‌شده (E2EE)، eventهای خروجی تصویر از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزنگاری شوند. اتاق‌های رمزنگاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. هیچ پیکربندی‌ای لازم نیست — Plugin وضعیت E2EE را به‌صورت خودکار تشخیص می‌دهد.

همه فرمان‌های `openclaw matrix` از `--verbose` (تشخیص‌های کامل)، `--json` (خروجی قابل خواندن برای ماشین)، و `--account <id>` (راه‌اندازی‌های چندحسابی) پشتیبانی می‌کنند. خروجی به‌صورت پیش‌فرض با logging داخلی quiet از SDK مختصر است. نمونه‌های زیر شکل canonical را نشان می‌دهند؛ flagها را در صورت نیاز اضافه کنید.

### فعال کردن رمزنگاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی محرمانه و امضای متقابل را راه‌اندازی می‌کند، در صورت نیاز یک پشتیبان کلید اتاق می‌سازد، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. پرچم‌های مفید:

- `--recovery-key <key>` پیش از راه‌اندازی، یک کلید بازیابی را اعمال کن (فرم stdin مستندشده در پایین ترجیح داده می‌شود)
- `--force-reset-cross-signing` هویت امضای متقابل فعلی را کنار بگذار و یک هویت تازه بساز (فقط آگاهانه استفاده شود)

برای یک حساب جدید، هنگام ایجاد حساب E2EE را فعال کنید:

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
- `Signed by owner`: با کلید خودامضایی خودتان امضا شده است (فقط تشخیصی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا صرفاً امضای مالک کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیهٔ حساب Matrix، تشخیص‌های best-effort برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### تأیید این دستگاه با کلید بازیابی

کلید بازیابی حساس است — به‌جای ارسال آن در خط فرمان، آن را از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا برای یک حساب نام‌دار `MATRIX_<ID>_RECOVERY_KEY`) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این فرمان سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی محرمانه یا اعتماد دستگاه پذیرفت.
- `Backup usable`: پشتیبان کلید اتاق می‌تواند با دادهٔ بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقابل Matrix را دارد.

اگر اعتماد کامل هویت ناقص باشد، حتی اگر کلید بازیابی دادهٔ پشتیبان را باز کرده باشد، با کد غیرصفر خارج می‌شود. در این حالت، خودتأییدی را از یک کلاینت Matrix دیگر کامل کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق، منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

فرم کلید صریح `openclaw matrix verify device "<recovery-key>"` نیز پذیرفته می‌شود، اما کلید در تاریخچهٔ shell شما باقی می‌ماند.

### راه‌اندازی یا تعمیر امضای متقابل

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان تعمیر و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی محرمانه را راه‌اندازی می‌کند و در صورت امکان از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقابل را راه‌اندازی می‌کند و کلیدهای عمومیِ جاافتاده را بارگذاری می‌کند
- دستگاه فعلی را علامت‌گذاری و با امضای متقابل امضا می‌کند
- اگر پشتیبان کلید اتاق سمت سرور از قبل وجود نداشته باشد، آن را ایجاد می‌کند

اگر homeserver برای بارگذاری کلیدهای امضای متقابل به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، و بعد `m.login.password` (نیازمند `channels.matrix.password`).

پرچم‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای کنار گذاشتن هویت امضای متقابل فعلی (فقط آگاهانه)

### پشتیبان کلید اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را به فروشگاه رمزنگاری محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد، می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان خراب با یک خط مبنای تازه (با پذیرش از دست رفتن تاریخچهٔ قدیمیِ غیرقابل‌بازیابی؛ همچنین می‌تواند اگر محرمانهٔ پشتیبان فعلی قابل بارگذاری نباشد، ذخیره‌سازی محرمانه را دوباره ایجاد کند):

```bash
openclaw matrix verify backup reset --yes
```

فقط وقتی `--rotate-recovery-key` را اضافه کنید که عمداً می‌خواهید کلید بازیابی قبلی دیگر خط مبنای پشتیبان تازه را باز نکند.

### فهرست‌کردن، درخواست‌دادن، و پاسخ‌دادن به تأییدها

```bash
openclaw matrix verify list
```

درخواست‌های تأیید در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

یک درخواست تأیید از این حساب OpenClaw ارسال می‌کند. `--own-user` خودتأییدی را درخواست می‌کند (شما اعلان را در یک کلاینت Matrix دیگر از همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` را نمی‌توان با دیگر پرچم‌های هدف‌گیری ترکیب کرد.

برای مدیریت چرخهٔ عمر در سطح پایین‌تر — معمولاً هنگام دنبال‌کردن درخواست‌های ورودی از یک کلاینت دیگر — این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (که توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرش یک درخواست ورودی                                             |
| `openclaw matrix verify start <id>`        | آغاز جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ ایموجی‌ها یا اعداد SAS                                          |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با چیزی که کلاینت دیگر نشان می‌دهد مطابقت دارد     |
| `openclaw matrix verify mismatch-sas <id>` | رد SAS وقتی ایموجی‌ها یا اعداد مطابقت ندارند                       |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد    |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان راهنمای پیگیری DM می‌پذیرند، وقتی تأیید به یک اتاق پیام مستقیم مشخص متصل باشد.

### نکات چندحسابی

بدون `--account <id>`، فرمان‌های Matrix CLI از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌دار دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌دار غیرفعال یا در دسترس نباشد، خطاها به کلید پیکربندی آن حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه تأییدنشده در یک کلاینت Matrix دیگر درخواست خودتأییدی می‌کند، موارد تکراری را رد می‌کند و cooldown اعمال می‌کند (به‌طور پیش‌فرض ۲۴ ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانهٔ راه‌اندازی رمزنگاری اجرا می‌کند که از ذخیره‌سازی محرمانه و هویت امضای متقابل فعلی دوباره استفاده می‌کند. اگر وضعیت راه‌اندازی خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به UIA مبتنی بر گذرواژه نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل توسط مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های تأیید">
    Matrix اعلان‌های چرخهٔ عمر تأیید را به‌صورت پیام‌های `m.notice` در اتاق تأیید DM سخت‌گیرانه ارسال می‌کند: درخواست، آماده (با راهنمای "Verify by emoji")، شروع/تکمیل، و جزئیات SAS (ایموجی/عددی) در صورت موجود بودن.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر ردیابی و به‌طور خودکار پذیرفته می‌شوند. برای خودتأییدی، OpenClaw جریان SAS را خودکار آغاز می‌کند و پس از در دسترس بودن تأیید ایموجی، سمت خودش را تأیید می‌کند — همچنان باید در کلاینت Matrix خود مقایسه کنید و "They match" را تأیید کنید.

    اعلان‌های سیستمی تأیید به مسیر گفت‌وگوی agent فرستاده نمی‌شوند.

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

    برای احراز هویت با token، در کلاینت Matrix یا UI مدیریتی خود یک access token تازه بسازید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسهٔ حساب از فرمان شکست‌خورده جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="بهداشت دستگاه">
    دستگاه‌های قدیمیِ مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست و پاک‌سازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="فروشگاه رمزنگاری">
    Matrix E2EE از مسیر رمزنگاری Rust رسمی `matrix-js-sdk` با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت رمزنگاری در `crypto-idb-snapshot.json` باقی می‌ماند (با مجوزهای فایل محدودکننده).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل فروشگاه همگام‌سازی، فروشگاه رمزنگاری، کلید بازیابی، snapshot IDB، اتصال‌های thread، و وضعیت تأیید راه‌اندازی است. وقتی token تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw از بهترین root موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

پروفایل شخصی Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix URLهای آواتار `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` ارسال کنید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شدهٔ `mxc://` را در `channels.matrix.avatarUrl` (یا override هر حساب) ذخیره می‌کند.

## Threadها

Matrix از threadهای بومی Matrix هم برای پاسخ‌های خودکار و هم برای ارسال‌های ابزار پیام پشتیبانی می‌کند. دو knob مستقل رفتار را کنترل می‌کنند:

### مسیریابی نشست (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به نشست‌های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همهٔ اتاق‌های DM با همان همتای مسیردهی‌شده یک نشست را به‌اشتراک می‌گذارند.
- `"per-room"`: هر اتاق DM در Matrix کلید نشست خودش را می‌گیرد، حتی وقتی همتا یکی باشد.

اتصال‌های گفت‌وگوی صریح همیشه بر `sessionScope` مقدم‌اند، بنابراین اتاق‌ها و threadهای متصل‌شده نشست هدف انتخابی خود را نگه می‌دارند.

### threadسازی پاسخ (`threadReplies`)

`threadReplies` تعیین می‌کند bot پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها در سطح بالا هستند. پیام‌های threadدار ورودی روی نشست والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در آن thread بوده باشد، داخل thread پاسخ بده.
- `"always"`: داخل threadی پاسخ بده که ریشه‌اش پیام محرک است؛ آن گفت‌وگو از اولین محرک به بعد از طریق یک نشست thread-scoped مطابق مسیردهی می‌شود.

`dm.threadReplies` این رفتار را فقط برای DMها override می‌کند — برای مثال، threadهای اتاق را جدا نگه دارید و هم‌زمان DMها را تخت نگه دارید.

### وراثت thread و فرمان‌های slash

- پیام‌های رشته‌ای ورودی، پیام ریشه رشته را به‌عنوان بافت اضافی عامل شامل می‌شوند.
- ارسال‌های ابزار پیام هنگام هدف‌گیری همان اتاق Matrix (یا همان هدف کاربر پیام مستقیم)، به‌طور خودکار رشته فعلی Matrix را به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شود.
- استفاده مجدد از هدف کاربر پیام مستقیم فقط زمانی فعال می‌شود که فراداده نشست فعلی همان همتای پیام مستقیم را روی همان حساب Matrix اثبات کند؛ در غیر این صورت OpenClaw به مسیریابی عادی با دامنه کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age` و `/acp spawn` مقید به رشته، همگی در اتاق‌های Matrix و پیام‌های مستقیم کار می‌کنند.
- `/focus` سطح بالا یک رشته Matrix جدید ایجاد می‌کند و وقتی `threadBindings.spawnSessions` فعال باشد، آن را به نشست هدف متصل می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` درون یک رشته Matrix موجود، همان رشته را در همان‌جا متصل می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق پیام مستقیم Matrix با اتاق پیام مستقیم دیگری روی همان نشست مشترک تداخل دارد، یک `m.notice` یک‌باره در آن اتاق ارسال می‌کند که به راه گریز `/focus` اشاره دارد و تغییر `dm.sessionScope` را پیشنهاد می‌کند. این اعلان فقط وقتی اتصالات رشته فعال باشند ظاهر می‌شود.

## اتصالات گفت‌وگوی ACP

اتاق‌های Matrix، پیام‌های مستقیم و رشته‌های موجود Matrix را می‌توان بدون تغییر سطح چت، به فضاهای کاری پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل پیام مستقیم Matrix، اتاق یا رشته موجودی که می‌خواهید به استفاده از آن ادامه دهید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک پیام مستقیم یا اتاق سطح بالای Matrix، پیام مستقیم/اتاق فعلی سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیریابی می‌شوند.
- داخل یک رشته موجود Matrix، `--bind here` همان رشته فعلی را در همان‌جا متصل می‌کند.
- `/new` و `/reset` همان نشست ACP متصل را در همان‌جا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

نکات:

- `--bind here` یک رشته فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` اجرای `/acp spawn --thread auto|here` را کنترل می‌کند؛ جایی که OpenClaw باید یک رشته فرزند Matrix ایجاد یا متصل کند.

### پیکربندی اتصال رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و همچنین از بازنویسی‌های جداگانه برای هر کانال پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های مقید به رشته Matrix به‌طور پیش‌فرض فعال است:

- `threadBindings.spawnSessions: false` را تنظیم کنید تا `/focus` سطح بالا و `/acp spawn --thread auto|here` نتوانند رشته‌های Matrix را ایجاد یا متصل کنند.
- وقتی ایجاد رشته‌های زیرعامل بومی نباید رونوشت والد را منشعب کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به رویداد Matrix اضافه می‌کند.
- `reactions` خلاصه واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود بات روی آن رویداد را حذف می‌کند.
- `remove: true` فقط واکنش ایموجی مشخص‌شده را از بات حذف می‌کند.

**ترتیب حل** (اولین مقدار تعریف‌شده برنده است):

| تنظیم                  | ترتیب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | هر حساب → کانال → `messages.ackReaction` → بازگشت به ایموجی هویت عامل   |
| `ackReactionScope`      | هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"` |
| `reactionNotifications` | هر حساب → کانال → پیش‌فرض `"own"`                                          |

`reactionNotifications: "own"` رویدادهای `m.reaction` اضافه‌شده را وقتی پیام‌های Matrix نوشته‌شده توسط بات را هدف می‌گیرند، منتقل می‌کند؛ `"off"` رویدادهای سامانه واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سامانه‌ای تبدیل نمی‌شود، چون Matrix آن‌ها را به‌صورت حذف محتوا نمایش می‌دهد، نه به‌عنوان حذف مستقل `m.reaction`.

## بافت تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی یک پیام اتاق Matrix عامل را فعال می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` شامل شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هر دو تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی، `0` را تنظیم کنید.
- تاریخچه اتاق Matrix فقط مربوط به اتاق است. پیام‌های مستقیم همچنان از تاریخچه عادی نشست استفاده می‌کنند.
- تاریخچه اتاق Matrix فقط در حالت انتظار است: OpenClaw پیام‌های اتاقی را که هنوز پاسخی را فعال نکرده‌اند بافر می‌کند، سپس وقتی یک اشاره یا محرک دیگر برسد، از آن پنجره عکس‌برداری می‌کند.
- پیام محرک فعلی در `InboundHistory` شامل نمی‌شود؛ برای آن نوبت در بدنه ورودی اصلی باقی می‌ماند.
- تلاش‌های دوباره همان رویداد Matrix، به‌جای جابه‌جایی به پیام‌های جدیدتر اتاق، از عکس تاریخچه اصلی استفاده می‌کنند.

## دیدپذیری بافت

Matrix از کنترل مشترک `contextVisibility` برای بافت تکمیلی اتاق مانند متن پاسخ واکشی‌شده، ریشه‌های رشته و تاریخچه در انتظار پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. بافت تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` بافت تکمیلی را به فرستندگانی محدود می‌کند که توسط بررسی‌های فهرست مجاز اتاق/کاربر فعال مجاز شده‌اند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شده صریح را نگه می‌دارد.

این تنظیم بر دیدپذیری بافت تکمیلی اثر می‌گذارد، نه اینکه خود پیام ورودی بتواند پاسخی را فعال کند یا نه.
مجوز فعال‌سازی همچنان از `groupPolicy`، `groups`، `groupAllowFrom` و تنظیمات سیاست پیام مستقیم می‌آید.

## سیاست پیام مستقیم و اتاق

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

برای کاملاً بی‌صدا کردن پیام‌های مستقیم و حفظ کارکرد اتاق‌ها، `dm.enabled: false` را تنظیم کنید:

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

برای رفتار محدودسازی با اشاره و فهرست مجاز، [گروه‌ها](/fa/channels/groups) را ببینید.

نمونه جفت‌سازی برای پیام‌های مستقیم Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشده Matrix پیش از تأیید به پیام دادن ادامه دهد، OpenClaw از همان کد جفت‌سازی در انتظار دوباره استفاده می‌کند و ممکن است پس از یک دوره کوتاه خنک‌سازی، به‌جای ساختن کد جدید، یک پاسخ یادآور ارسال کند.

برای جریان مشترک جفت‌سازی پیام مستقیم و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنه `m.direct` مواجه شود که به اتاق‌های تک‌نفره قدیمی اشاره می‌کنند، نه پیام مستقیم زنده. نگاشت فعلی را برای یک همتا بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو فرمان برای راه‌اندازی‌های چندحسابی، `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک پیام مستقیم سخت‌گیرانه ۱:۱ را که از قبل در `m.direct` نگاشت شده ترجیح می‌دهد
- به هر پیام مستقیم سخت‌گیرانه ۱:۱ فعلاً پیوسته با آن کاربر برمی‌گردد
- اگر هیچ پیام مستقیم سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

اتاق‌های قدیمی را به‌طور خودکار حذف نمی‌کند. پیام مستقیم سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آینده Matrix، اعلان‌های راستی‌آزمایی و دیگر جریان‌های پیام مستقیم اتاق درست را هدف بگیرند.

## تأییدهای اجرا

Matrix می‌تواند به‌عنوان یک کارخواه تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` پیکربندی کنید (یا برای بازنویسی در هر حساب، `channels.matrix.accounts.<account>.execApprovals`):

- `enabled`: تأییدها را از طریق اعلان‌های بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده یا `"auto"` باشد، Matrix پس از اینکه دست‌کم یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که اجازه تأیید درخواست‌های اجرا را دارند. اختیاری است — به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال اعلان‌ها. `"dm"` (پیش‌فرض) به پیام‌های مستقیم تأییدکنندگان ارسال می‌کند؛ `"channel"` به اتاق Matrix یا پیام مستقیم مبدأ ارسال می‌کند؛ `"both"` به هر دو ارسال می‌کند.
- `agentFilter` / `sessionFilter`: فهرست‌های مجاز اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را فعال کنند.

مجوزدهی بین انواع تأیید کمی تفاوت دارد:

- **تأییدهای اجرا** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجاز می‌شوند.

هر دو نوع میان‌برهای واکنش و به‌روزرسانی‌های پیام Matrix را به اشتراک می‌گذارند. تأییدکنندگان میان‌برهای واکنش را روی پیام تأیید اصلی می‌بینند:

- `✅` یک‌بار مجاز
- `❌` رد
- `♾️` همیشه مجاز (وقتی سیاست اجرای مؤثر آن را اجازه دهد)

فرمان‌های اسلش جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکنندگان حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای اجرا شامل متن فرمان است — `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای اجرا](/fa/tools/exec-approvals).

## فرمان‌های اسلش

فرمان‌های اسلش (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve` و غیره) مستقیماً در پیام‌های مستقیم کار می‌کنند. در اتاق‌ها، OpenClaw همچنین فرمان‌هایی را تشخیص می‌دهد که با اشاره Matrix خود بات پیشوند دارند؛ بنابراین `@bot:server /new` بدون یک عبارت منظم اشاره سفارشی، مسیر فرمان را فعال می‌کند. این کار بات را نسبت به پست‌های سبک اتاق `@mention /command` که Element و کارخواه‌های مشابه وقتی کاربر پیش از تایپ فرمان نام بات را با تکمیل خودکار وارد می‌کند، منتشر می‌کنند، پاسخ‌گو نگه می‌دارد.

قواعد مجوز همچنان اعمال می‌شوند: فرستندگان فرمان باید همان سیاست‌های فهرست مجاز/مالک پیام مستقیم یا اتاق را که برای پیام‌های ساده لازم است، برآورده کنند.

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

- مقادیر سطح بالای `channels.matrix` برای حساب‌های نام‌دار به‌عنوان پیش‌فرض عمل می‌کنند، مگر اینکه حسابی آن‌ها را بازنویسی کند.
- یک ورودی اتاق به ارث‌رسیده را با `groups.<room>.account` به حسابی خاص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک‌اند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- `defaultAccount` را تنظیم کنید تا حساب نام‌داری را انتخاب کند که مسیریابی ضمنی، کاوش و فرمان‌های CLI ترجیح می‌دهند.
- اگر چند حساب دارید و یکی دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، از آن به‌صورت ضمنی استفاده می‌کند.
- اگر چند حساب نام‌دار دارید و هیچ پیش‌فرضی انتخاب نشده است، فرمان‌های CLI از حدس زدن خودداری می‌کنند — `defaultAccount` را تنظیم کنید یا `--account <id>` را پاس دهید.
- بلوک سطح بالای `channels.matrix.*` فقط وقتی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که احراز هویت آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌دار از `homeserver` + `userId` قابل کشف می‌مانند، به شرطی که اعتبارنامه‌های ذخیره‌شده احراز هویت را پوشش دهند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر یک حساب نام‌دار موجود باشد یا `defaultAccount` از قبل به یکی اشاره کند، آن را حفظ می‌کند. فقط کلیدهای احراز هویت/راه‌اندازی اولیه Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## سرورهای خانگی خصوصی/شبکه محلی

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، سرورهای خانگی خصوصی/داخلی Matrix را مسدود می‌کند، مگر اینکه برای هر حساب
صریحاً آن را فعال کنید.

اگر سرور خانگی شما روی میزبان محلی، یک IP شبکه محلی/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود،
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

نمونهٔ راه‌اندازی CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

این انتخاب صریح فقط اهداف خصوصی/داخلیِ مورد اعتماد را مجاز می‌کند. سرورهای خانگی عمومی با متن آشکار مانند
`http://matrix.example.org:8008` همچنان مسدود می‌مانند. هر زمان ممکن است، `https://` را ترجیح دهید.

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

## حل مقصد

Matrix این قالب‌های مقصد را در هر جایی که OpenClaw از شما مقصد اتاق یا کاربر می‌خواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. هنگام پیکربندی مقصدهای تحویل صریح، کارهای cron، اتصال‌ها، یا فهرست‌های مجاز، دقیقاً از همان شکل حروف شناسهٔ اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای داخلی نشست را برای ذخیره‌سازی به شکل canonical نگه می‌دارد، بنابراین آن کلیدهای حروف کوچک منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زندهٔ دایرکتوری از حساب واردشدهٔ Matrix استفاده می‌کند:

- جست‌وجوی کاربران، دایرکتوری کاربران Matrix را روی همان سرور خانگی پرس‌وجو می‌کند.
- جست‌وجوی اتاق‌ها ابتدا شناسه‌ها و نام‌های مستعار صریح اتاق را مستقیماً می‌پذیرد، سپس به جست‌وجو در نام اتاق‌های پیوسته‌شده برای آن حساب برمی‌گردد.
- جست‌وجوی نام اتاق‌های پیوسته‌شده best-effort است. اگر نام اتاقی به شناسه یا نام مستعار قابل حل نباشد، در حل فهرست مجاز زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای سبک فهرست مجاز (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (امن‌ترین گزینه). تطابق‌های دقیق دایرکتوری هنگام شروع و هر زمان که فهرست مجاز در زمان اجرای پایشگر تغییر کند حل می‌شوند؛ ورودی‌هایی که قابل حل نباشند در زمان اجرا نادیده گرفته می‌شوند. فهرست‌های مجاز اتاق نیز به همین دلیل شناسه‌ها یا نام‌های مستعار اتاق را ترجیح می‌دهند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال کنید.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسهٔ حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقادیر سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث می‌رسند.
- `homeserver`: URL سرور خانگی، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه دهید به `localhost`، IPهای LAN/Tailscale، یا نام‌های میزبان داخلی وصل شود.
- `proxy`: URL پراکسی HTTP(S) اختیاری برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسهٔ کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقادیر متن آشکار و SecretRef در providerهای env/file/exec پشتیبانی می‌شوند ([مدیریت Secrets](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقادیر متن آشکار و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسهٔ صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: URL آواتار خودکاربر که برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set` ذخیره می‌شود.
- `initialSyncLimit`: بیشینهٔ تعداد رویدادهایی که هنگام همگام‌سازی شروع دریافت می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال کنید. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأیید نشده باشد، هنگام شروع به‌طور خودکار درخواست خود-تأییدی می‌کند.
- `startupVerificationCooldownHours`: دورهٔ انتظار پیش از درخواست خودکار بعدی در شروع. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همهٔ DMها را نادیده می‌گیرد. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از اینکه bot به اتاق پیوست و آن را به‌عنوان DM دسته‌بندی کرد اعمال می‌شود؛ بر مدیریت دعوت اثر نمی‌گذارد.
- `dm.allowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی مخصوص DM برای رشته‌بندی پاسخ‌ها (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌های دیگر حساب‌های bot پیکربندی‌شدهٔ Matrix را بپذیرید (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همهٔ سیاست‌های DM فعال (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` وادار می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر دعوت Matrix، از جمله دعوت‌های سبک DM، اعمال می‌شود.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعاری که وقتی `autoJoin` برابر `"allowlist"` است مجازند. ورودی‌های نام مستعار در برابر سرور خانگی حل می‌شوند، نه در برابر وضعیتی که اتاق دعوت‌کننده ادعا می‌کند.
- `contextVisibility`: دیده‌شدن زمینهٔ تکمیلی (پیش‌فرض `"all"`، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی و چرخهٔ عمر نشست‌های وابسته به رشته.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا شکل شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های تکمیل‌شدهٔ assistant به‌صورت پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشتهٔ اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازهٔ قطعهٔ خروجی بر حسب نویسه وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد نویسه) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی یک پیام اتاق عامل را فعال می‌کند به‌عنوان `InboundHistory` گنجانده می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازهٔ رسانه بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش تأیید برای این کانال/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: کنترل دسترسی ابزار برای هر کنش (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نگاشت سیاست برای هر اتاق. هویت نشست پس از حل از شناسهٔ پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاقِ به‌ارث‌رسیده را به یک حساب مشخص محدود کنید.
  - `groups.<room>.allowBots`: بازنویسی برای هر اتاق از تنظیم سطح کانال (`true` یا `"mentions"`).
  - `groups.<room>.users`: فهرست مجاز فرستنده برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های اجازه/رد ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی کنترل مبتنی بر mention برای هر اتاق. `true` الزام‌های mention را برای آن اتاق غیرفعال می‌کند؛ `false` آن‌ها را دوباره اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر Skills برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعهٔ system prompt برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق promptهای بومی Matrix تحویل دهید.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که مجاز به تأیید هستند. به `dm.allowFrom` برمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: فهرست‌های مجاز اختیاری عامل/نشست برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل مبتنی بر mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
