---
read_when:
    - راه‌اندازی Matrix در OpenClaw
    - پیکربندی E2EE و راستی‌آزمایی در Matrix
summary: وضعیت پشتیبانی Matrix، راه‌اندازی و نمونه‌های پیکربندی
title: ماتریس
x-i18n:
    generated_at: "2026-05-06T09:03:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
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

`plugins install`، Plugin را ثبت و فعال می‌کند، بنابراین به مرحله جداگانه `openclaw plugins enable matrix` نیازی نیست. بااین‌حال، تا وقتی کانال زیر را پیکربندی نکنید، Plugin کاری انجام نمی‌دهد. برای رفتار عمومی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی

1. یک حساب Matrix روی سرور خانگی خود بسازید.
2. `channels.matrix` را با `homeserver` + `accessToken`، یا `homeserver` + `userId` + `password` پیکربندی کنید.
3. Gateway را راه‌اندازی مجدد کنید.
4. یک پیام مستقیم با بات شروع کنید، یا آن را به یک اتاق دعوت کنید ([پیوستن خودکار](#auto-join) را ببینید - دعوت‌های تازه فقط وقتی وارد می‌شوند که `autoJoin` اجازه بدهد).

### راه‌اندازی تعاملی

```bash
openclaw channels add
openclaw configure --section channels
```

جادوگر این موارد را می‌پرسد: URL سرور خانگی، روش احراز هویت (توکن دسترسی یا رمز عبور)، شناسه کاربر (فقط برای احراز هویت با رمز عبور)، نام اختیاری دستگاه، اینکه E2EE فعال شود یا نه، و اینکه دسترسی اتاق و پیوستن خودکار پیکربندی شود یا نه.

اگر متغیرهای محیطی مطابق `MATRIX_*` از قبل وجود داشته باشند و حساب انتخاب‌شده احراز هویت ذخیره‌شده نداشته باشد، جادوگر یک میان‌بر متغیر محیطی پیشنهاد می‌کند. برای resolve کردن نام اتاق‌ها پیش از ذخیره allowlist، `openclaw channels resolve --channel matrix "Project Room"` را اجرا کنید. وقتی E2EE فعال باشد، جادوگر پیکربندی را می‌نویسد و همان bootstrap مربوط به [`openclaw matrix encryption setup`](#encryption-and-verification) را اجرا می‌کند.

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

مبتنی بر رمز عبور (توکن پس از نخستین ورود در cache ذخیره می‌شود):

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

مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است. با مقدار پیش‌فرض، بات تا زمانی که دستی join نکنید در اتاق‌ها یا پیام‌های مستقیم جدید ناشی از دعوت‌های تازه ظاهر نمی‌شود.

OpenClaw در زمان دعوت نمی‌تواند تشخیص دهد اتاق دعوت‌شده پیام مستقیم است یا گروه، بنابراین همه دعوت‌ها - از جمله دعوت‌های شبیه پیام مستقیم - ابتدا از `autoJoin` عبور می‌کنند. `dm.policy` فقط بعدا اعمال می‌شود، پس از اینکه بات join کرد و اتاق طبقه‌بندی شد.

<Warning>
برای محدود کردن دعوت‌هایی که بات می‌پذیرد، `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` تنظیم کنید، یا برای پذیرش همه دعوت‌ها از `autoJoin: "always"` استفاده کنید.

`autoJoinAllowlist` فقط هدف‌های پایدار را می‌پذیرد: `!roomId:server`، `#alias:server`، یا `*`. نام‌های ساده اتاق رد می‌شوند؛ ورودی‌های alias در برابر سرور خانگی resolve می‌شوند، نه در برابر state ادعاشده توسط اتاق دعوت‌شده.
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

allowlistهای پیام مستقیم و اتاق بهتر است با شناسه‌های پایدار پر شوند:

- پیام‌های مستقیم (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): از `@user:server` استفاده کنید. نام‌های نمایشی فقط وقتی resolve می‌شوند که فهرست سرور خانگی دقیقا یک تطابق برگرداند.
- اتاق‌ها (`groups`, `autoJoinAllowlist`): از `!room:server` یا `#alias:server` استفاده کنید. نام‌ها به‌صورت best-effort در برابر اتاق‌های join شده resolve می‌شوند؛ ورودی‌های resolve نشده در زمان اجرا نادیده گرفته می‌شوند.

### نرمال‌سازی شناسه حساب

جادوگر یک نام دوستانه را به شناسه حساب نرمال‌شده تبدیل می‌کند. برای مثال، `Ops Bot` به `ops-bot` تبدیل می‌شود. نشانه‌گذاری در نام‌های متغیر محیطی scoped escape می‌شود تا دو حساب نتوانند با هم تداخل پیدا کنند: `-` → `_X2D_`، بنابراین `ops-prod` به `MATRIX_OPS_X2D_PROD_*` نگاشت می‌شود.

### اعتبارنامه‌های cache‌شده

Matrix اعتبارنامه‌های cache‌شده را زیر `~/.openclaw/credentials/matrix/` ذخیره می‌کند:

- حساب پیش‌فرض: `credentials.json`
- حساب‌های نام‌گذاری‌شده: `credentials-<account>.json`

وقتی اعتبارنامه‌های cache‌شده آنجا وجود داشته باشند، OpenClaw حتی اگر توکن دسترسی در فایل پیکربندی نباشد Matrix را پیکربندی‌شده در نظر می‌گیرد - این شامل راه‌اندازی، `openclaw doctor` و probeهای وضعیت کانال می‌شود.

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

برای حساب `ops`، نام‌ها به `MATRIX_OPS_HOMESERVER`، `MATRIX_OPS_ACCESS_TOKEN` و موارد مشابه تبدیل می‌شوند. متغیرهای محیطی recovery-key توسط جریان‌های CLI آگاه از بازیابی (`verify backup restore`, `verify device`, `verify bootstrap`) خوانده می‌شوند، وقتی کلید را با `--recovery-key-stdin` از طریق pipe وارد کنید.

`MATRIX_HOMESERVER` را نمی‌توان از یک `.env` workspace تنظیم کرد؛ [فایل‌های `.env` مربوط به Workspace](/fa/gateway/security) را ببینید.

## نمونه پیکربندی

یک baseline کاربردی با pair کردن پیام مستقیم، allowlist اتاق، و E2EE:

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

Streaming پاسخ Matrix اختیاری و نیازمند فعال‌سازی است. `streaming` کنترل می‌کند OpenClaw چگونه پاسخ در حال انجام دستیار را تحویل دهد؛ `blockStreaming` کنترل می‌کند آیا هر بلاک کامل‌شده به‌عنوان پیام Matrix جداگانه خودش حفظ شود یا نه.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

برای نگه داشتن پیش‌نمایش‌های زنده پاسخ، اما پنهان کردن خطوط موقت ابزار/پیشرفت، از شکل object استفاده کنید:

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

| `streaming`        | رفتار                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (پیش‌فرض) | منتظر پاسخ کامل می‌ماند و یک‌بار ارسال می‌کند. `true` ↔ `"partial"`، `false` ↔ `"off"`.                                                                              |
| `"partial"`        | هم‌زمان با نوشتن بلاک فعلی توسط مدل، یک پیام متنی عادی را درجا ویرایش می‌کند. کلاینت‌های پیش‌فرض Matrix ممکن است روی نخستین پیش‌نمایش اعلان بدهند، نه ویرایش نهایی. |
| `"quiet"`          | مانند `"partial"` است، اما پیام یک notice بدون اعلان است. گیرندگان فقط زمانی اعلان می‌گیرند که یک push rule به‌ازای هر کاربر با ویرایش نهایی‌شده تطبیق پیدا کند (پایین را ببینید). |

`blockStreaming` مستقل از `streaming` است:

| `streaming`             | `blockStreaming: true`                                         | `blockStreaming: false` (پیش‌فرض)                 |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| `"partial"` / `"quiet"` | پیش‌نویس زنده برای بلاک فعلی، بلاک‌های کامل‌شده به‌عنوان پیام نگه داشته می‌شوند | پیش‌نویس زنده برای بلاک فعلی، درجا نهایی می‌شود |
| `"off"`                 | یک پیام Matrix دارای اعلان برای هر بلاک تمام‌شده               | یک پیام Matrix دارای اعلان برای پاسخ کامل         |

یادداشت‌ها:

- اگر یک پیش‌نمایش از حد اندازه هر event در Matrix بزرگ‌تر شود، OpenClaw streaming پیش‌نمایش را متوقف می‌کند و به تحویل فقط نهایی fallback می‌کند.
- پاسخ‌های رسانه‌ای همیشه پیوست‌ها را به‌صورت عادی ارسال می‌کنند. اگر یک پیش‌نمایش قدیمی دیگر نتواند با ایمنی دوباره استفاده شود، OpenClaw پیش از ارسال پاسخ رسانه‌ای نهایی آن را redact می‌کند.
- به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار به‌طور پیش‌فرض وقتی streaming پیش‌نمایش Matrix فعال باشد، فعال هستند. برای نگه داشتن ویرایش‌های پیش‌نمایش برای متن پاسخ اما باقی گذاشتن پیشرفت ابزار روی مسیر تحویل عادی، `streaming.preview.toolProgress: false` را تنظیم کنید.
- ویرایش‌های پیش‌نمایش باعث فراخوانی‌های اضافی Matrix API می‌شوند. اگر محافظه‌کارانه‌ترین پروفایل rate-limit را می‌خواهید، `streaming: "off"` را باقی بگذارید.

## فراداده approval

promptهای approval بومی Matrix، eventهای عادی `m.room.message` هستند که محتوای event سفارشی مخصوص OpenClaw را زیر `com.openclaw.approval` دارند. Matrix کلیدهای سفارشی محتوای event را مجاز می‌داند، بنابراین کلاینت‌های پیش‌فرض همچنان بدنه متن را render می‌کنند، درحالی‌که کلاینت‌های آگاه از OpenClaw می‌توانند شناسه approval ساختاریافته، نوع، state، تصمیم‌های موجود و جزئیات exec/plugin را بخوانند.

وقتی یک prompt approval برای یک event Matrix بیش از حد طولانی باشد، OpenClaw متن قابل مشاهده را به chunkها تقسیم می‌کند و `com.openclaw.approval` را فقط به chunk نخست پیوست می‌کند. واکنش‌های مربوط به تصمیم‌های allow/deny به همان event نخست bound می‌شوند، بنابراین promptهای طولانی همان هدف approval promptهای تک-event را حفظ می‌کنند.

### push ruleهای self-hosted برای پیش‌نمایش‌های نهایی‌شده quiet

`streaming: "quiet"` فقط وقتی یک بلاک یا turn نهایی شد به گیرندگان اعلان می‌دهد - یک push rule به‌ازای هر کاربر باید با نشانگر پیش‌نمایش نهایی‌شده تطبیق پیدا کند. برای دستور کامل (توکن گیرنده، بررسی pusher، نصب rule، یادداشت‌های هر سرور خانگی)، [push ruleهای Matrix برای پیش‌نمایش‌های quiet](/fa/channels/matrix-push-rules) را ببینید.

## اتاق‌های بات‌به‌بات

به‌طور پیش‌فرض، پیام‌های Matrix از دیگر حساب‌های Matrix پیکربندی‌شده OpenClaw نادیده گرفته می‌شوند.

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

- `allowBots: true` پیام‌های دیگر حساب‌های بات Matrix پیکربندی‌شده را در اتاق‌ها و پیام‌های مستقیم مجاز می‌پذیرد.
- `allowBots: "mentions"` این پیام‌ها را فقط وقتی می‌پذیرد که در اتاق‌ها به‌شکل قابل مشاهده از این بات نام ببرند. پیام‌های مستقیم همچنان مجاز هستند.
- `groups.<room>.allowBots` تنظیم سطح حساب را برای یک اتاق override می‌کند.
- OpenClaw همچنان پیام‌های همان شناسه کاربر Matrix را نادیده می‌گیرد تا از حلقه‌های self-reply جلوگیری کند.
- Matrix اینجا flag بومی بات را expose نمی‌کند؛ OpenClaw «نوشته‌شده توسط بات» را به‌معنای «ارسال‌شده توسط یک حساب Matrix پیکربندی‌شده دیگر روی این OpenClaw gateway» در نظر می‌گیرد.

هنگام فعال کردن ترافیک بات‌به‌بات در اتاق‌های مشترک، از allowlistهای سخت‌گیرانه اتاق و الزامات mention استفاده کنید.

## رمزنگاری و راستی‌آزمایی

در اتاق‌های رمزنگاری‌شده (E2EE)، eventهای تصویر خروجی از `thumbnail_file` استفاده می‌کنند تا پیش‌نمایش‌های تصویر همراه با پیوست کامل رمزنگاری شوند. اتاق‌های رمزنگاری‌نشده همچنان از `thumbnail_url` ساده استفاده می‌کنند. به هیچ پیکربندی‌ای نیاز نیست - Plugin به‌صورت خودکار state E2EE را تشخیص می‌دهد.

همه دستورهای `openclaw matrix` گزینه‌های `--verbose` (تشخیص‌های کامل)، `--json` (خروجی قابل خواندن توسط ماشین) و `--account <id>` (راه‌اندازی‌های چندحسابی) را می‌پذیرند. خروجی به‌طور پیش‌فرض با logging داخلی آرام SDK مختصر است. نمونه‌های زیر شکل canonical را نشان می‌دهند؛ flagها را در صورت نیاز اضافه کنید.

### فعال کردن رمزنگاری

```bash
openclaw matrix encryption setup
```

ذخیره‌سازی راز و امضای متقابل را راه‌اندازی می‌کند، در صورت نیاز یک پشتیبان‌گیری کلید اتاق ایجاد می‌کند، سپس وضعیت و گام‌های بعدی را چاپ می‌کند. فلگ‌های مفید:

- `--recovery-key <key>` اعمال یک کلید بازیابی پیش از راه‌اندازی اولیه (فرم stdin مستندشده در پایین را ترجیح دهید)
- `--force-reset-cross-signing` دور انداختن هویت امضای متقابل فعلی و ایجاد هویت جدید (فقط آگاهانه استفاده کنید)

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
- `Cross-signing verified`: SDK تأیید از طریق امضای متقابل را گزارش می‌کند
- `Signed by owner`: با کلید خودامضاکننده خودتان امضا شده است (فقط تشخیصی)

`Verified by owner` فقط وقتی `yes` می‌شود که `Cross-signing verified` برابر `yes` باشد. اعتماد محلی یا امضای مالک به‌تنهایی کافی نیست.

`--allow-degraded-local-state` بدون آماده‌سازی اولیه حساب Matrix، عیب‌یابی‌های best-effort را برمی‌گرداند؛ برای بررسی‌های آفلاین یا نیمه‌پیکربندی‌شده مفید است.

### تأیید این دستگاه با کلید بازیابی

کلید بازیابی حساس است - آن را به‌جای ارسال در خط فرمان، از طریق stdin پایپ کنید. `MATRIX_RECOVERY_KEY` (یا `MATRIX_<ID>_RECOVERY_KEY` برای یک حساب نام‌گذاری‌شده) را تنظیم کنید:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

این فرمان سه وضعیت را گزارش می‌کند:

- `Recovery key accepted`: Matrix کلید را برای ذخیره‌سازی راز یا اعتماد دستگاه پذیرفت.
- `Backup usable`: پشتیبان‌گیری کلید اتاق می‌تواند با ماده بازیابی مورد اعتماد بارگذاری شود.
- `Device verified by owner`: این دستگاه اعتماد کامل هویت امضای متقابل Matrix را دارد.

وقتی اعتماد کامل هویت ناقص باشد با کد غیرصفر خارج می‌شود، حتی اگر کلید بازیابی ماده پشتیبان‌گیری را باز کرده باشد. در این حالت، خودتأییدی را از یک کلاینت Matrix دیگر تمام کنید:

```bash
openclaw matrix verify self
```

`verify self` پیش از خروج موفق منتظر `Cross-signing verified: yes` می‌ماند. برای تنظیم زمان انتظار از `--timeout-ms <ms>` استفاده کنید.

فرم کلید صریح `openclaw matrix verify device "<recovery-key>"` هم پذیرفته می‌شود، اما کلید در تاریخچه shell شما باقی می‌ماند.

### راه‌اندازی اولیه یا تعمیر امضای متقابل

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` فرمان تعمیر و راه‌اندازی برای حساب‌های رمزگذاری‌شده است. به‌ترتیب، این کارها را انجام می‌دهد:

- ذخیره‌سازی راز را راه‌اندازی می‌کند و در صورت امکان از کلید بازیابی موجود دوباره استفاده می‌کند
- امضای متقابل را راه‌اندازی می‌کند و کلیدهای عمومیِ گمشده را بارگذاری می‌کند
- دستگاه فعلی را نشانه‌گذاری و با امضای متقابل امضا می‌کند
- اگر پشتیبان‌گیری کلید اتاق سمت سرور از قبل وجود نداشته باشد، آن را ایجاد می‌کند

اگر homeserver برای بارگذاری کلیدهای امضای متقابل به UIA نیاز داشته باشد، OpenClaw ابتدا بدون احراز هویت تلاش می‌کند، سپس `m.login.dummy`، سپس `m.login.password` (نیازمند `channels.matrix.password`).

فلگ‌های مفید:

- `--recovery-key-stdin` (همراه با `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) یا `--recovery-key <key>`
- `--force-reset-cross-signing` برای دور انداختن هویت امضای متقابل فعلی (فقط آگاهانه)

### پشتیبان‌گیری کلید اتاق

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` نشان می‌دهد آیا پشتیبان‌گیری سمت سرور وجود دارد و آیا این دستگاه می‌تواند آن را رمزگشایی کند. `backup restore` کلیدهای اتاق پشتیبان‌گیری‌شده را به crypto store محلی وارد می‌کند؛ اگر کلید بازیابی از قبل روی دیسک باشد می‌توانید `--recovery-key-stdin` را حذف کنید.

برای جایگزینی یک پشتیبان‌گیری خراب با baseline تازه (از دست رفتن تاریخچه قدیمی غیرقابل‌بازیابی را می‌پذیرد؛ همچنین اگر راز پشتیبان‌گیری فعلی قابل بارگذاری نباشد می‌تواند ذخیره‌سازی راز را دوباره ایجاد کند):

```bash
openclaw matrix verify backup reset --yes
```

`--rotate-recovery-key` را فقط وقتی اضافه کنید که عمداً می‌خواهید کلید بازیابی قبلی دیگر baseline پشتیبان‌گیری تازه را باز نکند.

### فهرست‌کردن، درخواست‌دادن، و پاسخ‌دادن به تأییدها

```bash
openclaw matrix verify list
```

درخواست‌های تأیید در انتظار را برای حساب انتخاب‌شده فهرست می‌کند.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

از این حساب OpenClaw یک درخواست تأیید می‌فرستد. `--own-user` خودتأییدی را درخواست می‌کند (prompt را در یک کلاینت Matrix دیگر متعلق به همان کاربر می‌پذیرید)؛ `--user-id`/`--device-id`/`--room-id` شخص دیگری را هدف می‌گیرند. `--own-user` را نمی‌توان با فلگ‌های هدف‌گیری دیگر ترکیب کرد.

برای مدیریت چرخه عمر سطح پایین‌تر - معمولاً هنگام همراهی با درخواست‌های ورودی از کلاینتی دیگر - این فرمان‌ها روی یک درخواست مشخص `<id>` عمل می‌کنند (توسط `verify list` و `verify request` چاپ می‌شود):

| فرمان                                      | هدف                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | پذیرفتن یک درخواست ورودی                                           |
| `openclaw matrix verify start <id>`        | شروع جریان SAS                                                     |
| `openclaw matrix verify sas <id>`          | چاپ emoji یا اعداد ده‌دهی SAS                                       |
| `openclaw matrix verify confirm-sas <id>`  | تأیید اینکه SAS با چیزی که کلاینت دیگر نشان می‌دهد مطابقت دارد     |
| `openclaw matrix verify mismatch-sas <id>` | رد کردن SAS وقتی emoji یا اعداد ده‌دهی مطابقت ندارند               |
| `openclaw matrix verify cancel <id>`       | لغو؛ `--reason <text>` و `--code <matrix-code>` اختیاری می‌پذیرد    |

`accept`، `start`، `sas`، `confirm-sas`، `mismatch-sas`، و `cancel` همگی `--user-id` و `--room-id` را به‌عنوان hint های پیگیری DM می‌پذیرند، وقتی تأیید به یک اتاق پیام مستقیم مشخص متصل است.

### نکته‌های چندحسابی

بدون `--account <id>`، فرمان‌های Matrix CLI از حساب پیش‌فرض ضمنی استفاده می‌کنند. اگر چند حساب نام‌گذاری‌شده دارید و `channels.matrix.defaultAccount` را تنظیم نکرده‌اید، از حدس‌زدن خودداری می‌کنند و از شما می‌خواهند انتخاب کنید. وقتی E2EE برای یک حساب نام‌گذاری‌شده غیرفعال یا ناموجود باشد، خطاها به کلید پیکربندی همان حساب اشاره می‌کنند، برای مثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    با `encryption: true`، مقدار پیش‌فرض `startupVerification` برابر `"if-unverified"` است. هنگام راه‌اندازی، یک دستگاه تأییدنشد‌ه در یک کلاینت Matrix دیگر درخواست خودتأییدی می‌دهد، تکراری‌ها را رد می‌کند و cooldown اعمال می‌کند (به‌طور پیش‌فرض 24 ساعت). با `startupVerificationCooldownHours` تنظیم کنید یا با `startupVerification: "off"` غیرفعال کنید.

    راه‌اندازی همچنین یک گذر محافظه‌کارانه راه‌اندازی crypto اجرا می‌کند که از ذخیره‌سازی راز و هویت امضای متقابل فعلی دوباره استفاده می‌کند. اگر وضعیت راه‌اندازی خراب باشد، OpenClaw حتی بدون `channels.matrix.password` یک تعمیر محافظت‌شده را امتحان می‌کند؛ اگر homeserver به password UIA نیاز داشته باشد، راه‌اندازی یک هشدار ثبت می‌کند و غیرکشنده باقی می‌ماند. دستگاه‌هایی که از قبل توسط مالک امضا شده‌اند حفظ می‌شوند.

    برای جریان کامل ارتقا، [مهاجرت Matrix](/fa/channels/matrix-migration) را ببینید.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix اعلان‌های چرخه عمر تأیید را در اتاق سخت‌گیرانه تأیید DM به‌صورت پیام‌های `m.notice` ارسال می‌کند: درخواست، آماده (با راهنمایی "Verify by emoji")، شروع/تکمیل، و جزئیات SAS (emoji/decimal) وقتی موجود باشد.

    درخواست‌های ورودی از یک کلاینت Matrix دیگر ردیابی و به‌صورت خودکار پذیرفته می‌شوند. برای خودتأییدی، OpenClaw جریان SAS را خودکار شروع می‌کند و وقتی تأیید emoji در دسترس شد سمت خودش را تأیید می‌کند - هنوز لازم است در کلاینت Matrix خود مقایسه کنید و "They match" را تأیید کنید.

    اعلان‌های سیستمی تأیید به pipeline گفت‌وگوی agent ارسال نمی‌شوند.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    اگر `verify status` می‌گوید دستگاه فعلی دیگر در homeserver فهرست نشده است، یک دستگاه Matrix جدید برای OpenClaw ایجاد کنید. برای ورود با گذرواژه:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    برای احراز هویت با token، در کلاینت Matrix یا UI مدیریتی خود یک access token تازه ایجاد کنید، سپس OpenClaw را به‌روزرسانی کنید:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` را با شناسه حساب از فرمان ناموفق جایگزین کنید، یا برای حساب پیش‌فرض `--account` را حذف کنید.

  </Accordion>

  <Accordion title="Device hygiene">
    دستگاه‌های قدیمی مدیریت‌شده توسط OpenClaw می‌توانند انباشته شوند. فهرست کنید و پاک‌سازی کنید:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE از مسیر crypto رسمی Rust در `matrix-js-sdk` همراه با `fake-indexeddb` به‌عنوان shim برای IndexedDB استفاده می‌کند. وضعیت crypto در `crypto-idb-snapshot.json` پایدار می‌ماند (مجوزهای فایل محدودکننده).

    وضعیت runtime رمزگذاری‌شده زیر `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` قرار دارد و شامل sync store، crypto store، کلید بازیابی، IDB snapshot، اتصال‌های thread، و وضعیت تأیید راه‌اندازی است. وقتی token تغییر می‌کند اما هویت حساب همان می‌ماند، OpenClaw از بهترین root موجود دوباره استفاده می‌کند تا وضعیت قبلی همچنان قابل مشاهده بماند.

  </Accordion>
</AccordionGroup>

## مدیریت پروفایل

خود-پروفایل Matrix را برای حساب انتخاب‌شده به‌روزرسانی کنید:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

می‌توانید هر دو گزینه را در یک فراخوانی ارسال کنید. Matrix نشانی‌های avatar با `mxc://` را مستقیماً می‌پذیرد؛ وقتی `http://` یا `https://` می‌فرستید، OpenClaw ابتدا فایل را بارگذاری می‌کند و URL حل‌شده `mxc://` را در `channels.matrix.avatarUrl` (یا override هر حساب) ذخیره می‌کند.

## Thread ها

Matrix از thread های بومی Matrix برای پاسخ‌های خودکار و ارسال‌های message-tool پشتیبانی می‌کند. دو knob مستقل رفتار را کنترل می‌کنند:

### مسیریابی session (`sessionScope`)

`dm.sessionScope` تعیین می‌کند اتاق‌های DM در Matrix چگونه به session های OpenClaw نگاشت شوند:

- `"per-user"` (پیش‌فرض): همه اتاق‌های DM با همان peer مسیریابی‌شده، یک session را به‌اشتراک می‌گذارند.
- `"per-room"`: هر اتاق DM در Matrix کلید session خودش را می‌گیرد، حتی وقتی peer یکسان باشد.

binding های صریح conversation همیشه بر `sessionScope` اولویت دارند، بنابراین اتاق‌ها و thread های bound شده session هدف انتخاب‌شده خود را حفظ می‌کنند.

### thread کردن پاسخ (`threadReplies`)

`threadReplies` تعیین می‌کند bot پاسخ خود را کجا ارسال کند:

- `"off"`: پاسخ‌ها top-level هستند. پیام‌های threaded ورودی روی session والد می‌مانند.
- `"inbound"`: فقط وقتی پیام ورودی از قبل در همان thread بوده، داخل thread پاسخ بده.
- `"always"`: داخل thread ی پاسخ بده که ریشه آن پیام trigger کننده است؛ آن conversation از همان اولین trigger به بعد از طریق session همسان scoped به thread مسیریابی می‌شود.

`dm.threadReplies` فقط برای DM ها این رفتار را override می‌کند - برای مثال، thread های اتاق را جدا نگه دارید و در عین حال DM ها را flat نگه دارید.

### وراثت thread و slash command ها

- پیام‌های رشته‌ای ورودی، پیام ریشهٔ رشته را به‌عنوان زمینهٔ اضافی عامل شامل می‌شوند.
- ارسال‌های ابزار پیام هنگام هدف‌گیری همان اتاق (یا همان هدف کاربر DM)، به‌طور خودکار رشتهٔ Matrix فعلی را به ارث می‌برند، مگر اینکه `threadId` صریحی ارائه شده باشد.
- استفادهٔ مجدد از هدف کاربر DM فقط زمانی فعال می‌شود که فرادادهٔ نشست فعلی همان همتای DM را روی همان حساب Matrix ثابت کند؛ در غیر این صورت OpenClaw به مسیریابی عادیِ محدود به کاربر برمی‌گردد.
- `/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و `/acp spawn` وابسته به رشته همگی در اتاق‌ها و DMهای Matrix کار می‌کنند.
- `/focus` سطح بالا یک رشتهٔ Matrix جدید ایجاد می‌کند و وقتی `threadBindings.spawnSessions` فعال باشد، آن را به نشست هدف متصل می‌کند.
- اجرای `/focus` یا `/acp spawn --thread here` داخل یک رشتهٔ Matrix موجود، همان رشته را درجا متصل می‌کند.

وقتی OpenClaw تشخیص دهد یک اتاق DM در Matrix با اتاق DM دیگری روی همان نشست مشترک تداخل دارد، یک `m.notice` یک‌باره در آن اتاق ارسال می‌کند که به راه خروجی `/focus` اشاره می‌کند و تغییر `dm.sessionScope` را پیشنهاد می‌دهد. این اعلان فقط زمانی ظاهر می‌شود که اتصال‌های رشته فعال باشند.

## اتصال‌های گفت‌وگوی ACP

اتاق‌های Matrix، DMها، و رشته‌های Matrix موجود را می‌توان بدون تغییر سطح چت، به فضاهای کاری پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM، اتاق، یا رشتهٔ Matrix موجودی که می‌خواهید همچنان از آن استفاده کنید، `/acp spawn codex --bind here` را اجرا کنید.
- در یک DM یا اتاق سطح بالای Matrix، DM/اتاق فعلی به‌عنوان سطح چت باقی می‌ماند و پیام‌های آینده به نشست ACP ایجادشده مسیر‌دهی می‌شوند.
- داخل یک رشتهٔ Matrix موجود، `--bind here` همان رشتهٔ فعلی را درجا متصل می‌کند.
- `/new` و `/reset` همان نشست ACP متصل‌شده را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

نکات:

- `--bind here` رشتهٔ فرزند Matrix ایجاد نمی‌کند.
- `threadBindings.spawnSessions` برای `/acp spawn --thread auto|here` نقش دروازه را دارد؛ جایی که OpenClaw باید یک رشتهٔ فرزند Matrix ایجاد کند یا متصل کند.

### پیکربندی اتصال رشته

Matrix پیش‌فرض‌های سراسری را از `session.threadBindings` به ارث می‌برد و از بازنویسی‌های مخصوص کانال نیز پشتیبانی می‌کند:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

ایجاد نشست‌های وابسته به رشتهٔ Matrix به‌طور پیش‌فرض روشن است:

- `threadBindings.spawnSessions: false` را تنظیم کنید تا `/focus` سطح بالا و `/acp spawn --thread auto|here` از ایجاد/اتصال رشته‌های Matrix منع شوند.
- وقتی ایجاد رشتهٔ زیرعامل بومی نباید رونوشت والد را fork کند، `threadBindings.defaultSpawnContext: "isolated"` را تنظیم کنید.

## واکنش‌ها

Matrix از واکنش‌های خروجی، اعلان‌های واکنش ورودی، و واکنش‌های تأیید پشتیبانی می‌کند.

ابزار واکنش خروجی با `channels.matrix.actions.reactions` کنترل می‌شود:

- `react` یک واکنش به یک رویداد Matrix اضافه می‌کند.
- `reactions` خلاصهٔ واکنش فعلی را برای یک رویداد Matrix فهرست می‌کند.
- `emoji=""` واکنش‌های خود ربات را روی آن رویداد حذف می‌کند.
- `remove: true` فقط واکنش emoji مشخص‌شده را از ربات حذف می‌کند.

**ترتیب حل‌وفصل** (نخستین مقدار تعریف‌شده برنده است):

| تنظیم                   | ترتیب                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | برای هر حساب → کانال → `messages.ackReaction` → جایگزین emoji هویت عامل         |
| `ackReactionScope`      | برای هر حساب → کانال → `messages.ackReactionScope` → پیش‌فرض `"group-mentions"` |
| `reactionNotifications` | برای هر حساب → کانال → پیش‌فرض `"own"`                                          |

`reactionNotifications: "own"` رویدادهای اضافه‌شدهٔ `m.reaction` را وقتی پیام‌های Matrix نوشته‌شده توسط ربات را هدف بگیرند، ارسال می‌کند؛ `"off"` رویدادهای سیستمی واکنش را غیرفعال می‌کند. حذف واکنش‌ها به رویدادهای سیستمی تبدیل نمی‌شود، چون Matrix آن‌ها را به‌صورت redaction ارائه می‌کند، نه حذف‌های مستقل `m.reaction`.

## زمینهٔ تاریخچه

- `channels.matrix.historyLimit` کنترل می‌کند وقتی یک پیام اتاق Matrix عامل را فعال می‌کند، چند پیام اخیر اتاق به‌عنوان `InboundHistory` گنجانده شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ اگر هیچ‌کدام تنظیم نشده باشند، پیش‌فرض مؤثر `0` است. برای غیرفعال‌سازی، `0` را تنظیم کنید.
- تاریخچهٔ اتاق Matrix فقط مختص اتاق است. DMها همچنان از تاریخچهٔ عادی نشست استفاده می‌کنند.
- تاریخچهٔ اتاق Matrix فقط در حالت در انتظار است: OpenClaw پیام‌های اتاق را که هنوز پاسخی فعال نکرده‌اند بافر می‌کند، سپس وقتی یک اشاره یا محرک دیگر می‌رسد، از آن پنجره snapshot می‌گیرد.
- پیام محرک فعلی در `InboundHistory` گنجانده نمی‌شود؛ برای آن نوبت در بدنهٔ ورودی اصلی باقی می‌ماند.
- تلاش‌های دوباره برای همان رویداد Matrix به‌جای حرکت به جلو تا پیام‌های جدیدتر اتاق، از snapshot تاریخچهٔ اصلی دوباره استفاده می‌کنند.

## دیدپذیری زمینه

Matrix از کنترل مشترک `contextVisibility` برای زمینهٔ تکمیلی اتاق، مانند متن پاسخ واکشی‌شده، ریشه‌های رشته، و تاریخچهٔ در انتظار پشتیبانی می‌کند.

- `contextVisibility: "all"` پیش‌فرض است. زمینهٔ تکمیلی همان‌طور که دریافت شده نگه داشته می‌شود.
- `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستندگانی محدود می‌کند که توسط بررسی‌های allowlist فعال اتاق/کاربر مجاز هستند.
- `contextVisibility: "allowlist_quote"` مانند `allowlist` رفتار می‌کند، اما همچنان یک پاسخ نقل‌قول‌شدهٔ صریح را نگه می‌دارد.

این تنظیم بر دیدپذیری زمینهٔ تکمیلی اثر می‌گذارد، نه بر اینکه خود پیام ورودی بتواند پاسخی را فعال کند.
مجوز فعال‌سازی همچنان از تنظیمات `groupPolicy`، `groups`، `groupAllowFrom`، و سیاست DM می‌آید.

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

برای ساکت‌کردن کامل DMها در حالی که اتاق‌ها همچنان کار کنند، `dm.enabled: false` را تنظیم کنید:

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

نمونهٔ جفت‌سازی برای DMهای Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

اگر یک کاربر تأییدنشدۀ Matrix پیش از تأیید همچنان به شما پیام بدهد، OpenClaw از همان کد جفت‌سازی در انتظار دوباره استفاده می‌کند و ممکن است پس از یک cooldown کوتاه، به‌جای ساخت کد جدید، پاسخ یادآوری ارسال کند.

برای جریان مشترک جفت‌سازی DM و چیدمان ذخیره‌سازی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## تعمیر اتاق مستقیم

اگر وضعیت پیام مستقیم از همگامی خارج شود، OpenClaw ممکن است با نگاشت‌های کهنهٔ `m.direct` مواجه شود که به‌جای DM زنده، به اتاق‌های تک‌نفرهٔ قدیمی اشاره می‌کنند. نگاشت فعلی را برای یک همتا بررسی کنید:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

آن را تعمیر کنید:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

هر دو دستور برای راه‌اندازی‌های چندحسابی `--account <id>` را می‌پذیرند. جریان تعمیر:

- یک DM سخت‌گیرانهٔ 1:1 را که از قبل در `m.direct` نگاشت شده باشد ترجیح می‌دهد
- به هر DM سخت‌گیرانهٔ 1:1 فعلی و عضو‌شده با آن کاربر برمی‌گردد
- اگر DM سالمی وجود نداشته باشد، یک اتاق مستقیم تازه ایجاد می‌کند و `m.direct` را بازنویسی می‌کند

اتاق‌های قدیمی را به‌طور خودکار حذف نمی‌کند. DM سالم را انتخاب می‌کند و نگاشت را به‌روزرسانی می‌کند تا ارسال‌های آیندهٔ Matrix، اعلان‌های تأیید، و دیگر جریان‌های پیام مستقیم، اتاق درست را هدف بگیرند.

## تأییدهای exec

Matrix می‌تواند به‌عنوان یک کلاینت تأیید بومی عمل کند. زیر `channels.matrix.execApprovals` (یا `channels.matrix.accounts.<account>.execApprovals` برای بازنویسی مخصوص حساب) پیکربندی کنید:

- `enabled`: تأییدها را از طریق اعلان‌های بومی Matrix تحویل می‌دهد. وقتی تنظیم نشده باشد یا `"auto"` باشد، Matrix پس از قابل‌حل‌شدن حداقل یک تأییدکننده، به‌طور خودکار فعال می‌شود. برای غیرفعال‌سازی صریح، `false` را تنظیم کنید.
- `approvers`: شناسه‌های کاربر Matrix (`@owner:example.org`) که اجازهٔ تأیید درخواست‌های exec را دارند. اختیاری است - به `channels.matrix.dm.allowFrom` برمی‌گردد.
- `target`: محل ارسال اعلان‌ها. `"dm"` (پیش‌فرض) به DMهای تأییدکننده ارسال می‌کند؛ `"channel"` به اتاق یا DM مبدأ Matrix ارسال می‌کند؛ `"both"` به هر دو ارسال می‌کند.
- `agentFilter` / `sessionFilter`: allowlistهای اختیاری برای اینکه کدام عامل‌ها/نشست‌ها تحویل Matrix را فعال کنند.

مجوزدهی بین انواع تأیید کمی متفاوت است:

- **تأییدهای exec** از `execApprovals.approvers` استفاده می‌کنند و به `dm.allowFrom` برمی‌گردند.
- **تأییدهای Plugin** فقط از طریق `dm.allowFrom` مجوزدهی می‌شوند.

هر دو نوع، میانبرهای واکنش Matrix و به‌روزرسانی‌های پیام را به اشتراک می‌گذارند. تأییدکنندگان میانبرهای واکنش را روی پیام تأیید اصلی می‌بینند:

- `✅` یک‌بار اجازه بده
- `❌` رد کن
- `♾️` همیشه اجازه بده (وقتی سیاست exec مؤثر اجازه دهد)

دستورهای slash جایگزین: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

فقط تأییدکنندگان حل‌شده می‌توانند تأیید یا رد کنند. تحویل کانالی برای تأییدهای exec متن دستور را شامل می‌شود - `channel` یا `both` را فقط در اتاق‌های مورد اعتماد فعال کنید.

مرتبط: [تأییدهای exec](/fa/tools/exec-approvals).

## دستورهای slash

دستورهای slash (`/new`، `/reset`، `/model`، `/focus`، `/unfocus`، `/agents`، `/session`، `/acp`، `/approve`، و غیره) مستقیماً در DMها کار می‌کنند. در اتاق‌ها، OpenClaw همچنین دستورهایی را که با mention خود ربات در Matrix پیشوند شده‌اند تشخیص می‌دهد، بنابراین `@bot:server /new` بدون regex سفارشی mention، مسیر دستور را فعال می‌کند. این کار باعث می‌شود ربات به پست‌های سبک اتاق `@mention /command` که Element و کلاینت‌های مشابه هنگام تکمیل تبِ ربات پیش از تایپ دستور منتشر می‌کنند، پاسخ‌گو بماند.

قواعد مجوزدهی همچنان اعمال می‌شوند: فرستندگان دستور باید همان سیاست‌های allowlist/owner مربوط به DM یا اتاق را که برای پیام‌های ساده لازم است، برآورده کنند.

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

- مقدارهای سطح بالای `channels.matrix` به‌عنوان پیش‌فرض برای حساب‌های نام‌گذاری‌شده عمل می‌کنند، مگر اینکه یک حساب آن‌ها را بازنویسی کند.
- با `groups.<room>.account` یک ورودی اتاق ارث‌بری‌شده را به یک حساب مشخص محدود کنید. ورودی‌های بدون `account` بین حساب‌ها مشترک‌اند؛ وقتی حساب پیش‌فرض در سطح بالا پیکربندی شده باشد، `account: "default"` همچنان کار می‌کند.

**انتخاب حساب پیش‌فرض:**

- `defaultAccount` را تنظیم کنید تا حساب نام‌گذاری‌شده‌ای را انتخاب کنید که مسیریابی ضمنی، probing، و دستورهای CLI ترجیح می‌دهند.
- اگر چند حساب دارید و یکی دقیقاً `default` نام دارد، OpenClaw حتی وقتی `defaultAccount` تنظیم نشده باشد، از آن به‌صورت ضمنی استفاده می‌کند.
- اگر چند حساب نام‌گذاری‌شده دارید و هیچ پیش‌فرضی انتخاب نشده است، دستورهای CLI از حدس‌زدن خودداری می‌کنند - `defaultAccount` را تنظیم کنید یا `--account <id>` را بدهید.
- بلوک سطح بالای `channels.matrix.*` فقط زمانی به‌عنوان حساب ضمنی `default` در نظر گرفته می‌شود که auth آن کامل باشد (`homeserver` + `accessToken`، یا `homeserver` + `userId` + `password`). حساب‌های نام‌گذاری‌شده پس از اینکه اعتبارنامه‌های cache‌شده auth را پوشش دهند، از `homeserver` + `userId` همچنان قابل کشف می‌مانند.

**ارتقا:**

- وقتی OpenClaw هنگام تعمیر یا راه‌اندازی یک پیکربندی تک‌حسابی را به چندحسابی ارتقا می‌دهد، اگر حساب نام‌گذاری‌شدهٔ موجودی وجود داشته باشد یا `defaultAccount` از قبل به یکی اشاره کند، آن را حفظ می‌کند. فقط کلیدهای auth/bootstrap مربوط به Matrix به حساب ارتقایافته منتقل می‌شوند؛ کلیدهای سیاست تحویل مشترک در سطح بالا باقی می‌مانند.

برای الگوی مشترک چندحسابی، [مرجع پیکربندی](/fa/gateway/config-channels#multi-account-all-channels) را ببینید.

## homeserverهای خصوصی/LAN

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، homeserverهای خصوصی/داخلی Matrix را مسدود می‌کند، مگر اینکه
برای هر حساب به‌صراحت انتخاب کنید.

اگر homeserver شما روی localhost، یک IP در LAN/Tailscale، یا یک نام میزبان داخلی اجرا می‌شود، برای آن حساب Matrix
`network.dangerouslyAllowPrivateNetwork` را فعال کنید:

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

این گزینه اختیاری فقط مقصدهای خصوصی/داخلیِ مورد اعتماد را مجاز می‌کند. هوم‌سرورهای عمومی با متن آشکار مانند
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

حساب‌های نام‌گذاری‌شده می‌توانند پیش‌فرض سطح بالا را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
OpenClaw از همان تنظیم پراکسی برای ترافیک زمان اجرای Matrix و بررسی‌های وضعیت حساب استفاده می‌کند.

## تفکیک مقصد

Matrix این شکل‌های مقصد را در هر جایی که OpenClaw از شما مقصد اتاق یا کاربر بخواهد می‌پذیرد:

- کاربران: `@user:server`، `user:@user:server`، یا `matrix:user:@user:server`
- اتاق‌ها: `!room:server`، `room:!room:server`، یا `matrix:room:!room:server`
- نام‌های مستعار: `#alias:server`، `channel:#alias:server`، یا `matrix:channel:#alias:server`

شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. هنگام پیکربندی مقصدهای تحویل صریح، کارهای cron، اتصال‌ها، یا فهرست‌های مجاز، از همان بزرگی و کوچکی دقیق شناسه اتاق در Matrix استفاده کنید.
OpenClaw کلیدهای نشست داخلی را برای ذخیره‌سازی به‌شکل canonical نگه می‌دارد، بنابراین آن کلیدهای حروف کوچک منبع قابل اتکایی برای شناسه‌های تحویل Matrix نیستند.

جست‌وجوی زنده دایرکتوری از حساب Matrix واردشده استفاده می‌کند:

- جست‌وجوهای کاربر، دایرکتوری کاربران Matrix را روی همان هوم‌سرور پرس‌وجو می‌کنند.
- جست‌وجوهای اتاق، شناسه‌های صریح اتاق و نام‌های مستعار را مستقیم می‌پذیرند، سپس به جست‌وجوی نام اتاق‌های پیوسته برای آن حساب برمی‌گردند.
- جست‌وجوی نام اتاق‌های پیوسته به‌صورت بهترین تلاش انجام می‌شود. اگر نام اتاق را نتوان به شناسه یا نام مستعار تفکیک کرد، در تفکیک فهرست مجاز زمان اجرا نادیده گرفته می‌شود.

## مرجع پیکربندی

فیلدهای سبک فهرست مجاز (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) شناسه‌های کامل کاربر Matrix را می‌پذیرند (ایمن‌ترین گزینه). تطابق‌های دقیق دایرکتوری در زمان شروع و هر زمان که فهرست مجاز هنگام اجرای مانیتور تغییر کند تفکیک می‌شوند؛ ورودی‌هایی که قابل تفکیک نباشند در زمان اجرا نادیده گرفته می‌شوند. فهرست‌های مجاز اتاق نیز به همین دلیل شناسه‌های اتاق یا نام‌های مستعار را ترجیح می‌دهند.

### حساب و اتصال

- `enabled`: کانال را فعال یا غیرفعال می‌کند.
- `name`: برچسب نمایشی اختیاری برای حساب.
- `defaultAccount`: شناسه حساب ترجیحی وقتی چند حساب Matrix پیکربندی شده‌اند.
- `accounts`: بازنویسی‌های نام‌گذاری‌شده برای هر حساب. مقادیر سطح بالای `channels.matrix` به‌عنوان پیش‌فرض به ارث برده می‌شوند.
- `homeserver`: URL هوم‌سرور، برای مثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: به این حساب اجازه می‌دهد به `localhost`، IPهای LAN/Tailscale، یا نام میزبان‌های داخلی وصل شود.
- `proxy`: URL پراکسی HTTP(S) اختیاری برای ترافیک Matrix. بازنویسی برای هر حساب پشتیبانی می‌شود.
- `userId`: شناسه کامل کاربر Matrix (`@bot:example.org`).
- `accessToken`: توکن دسترسی برای احراز هویت مبتنی بر توکن. مقادیر متن آشکار و SecretRef در ارائه‌دهنده‌های env/file/exec پشتیبانی می‌شوند ([مدیریت اسرار](/fa/gateway/secrets)).
- `password`: گذرواژه برای ورود مبتنی بر گذرواژه. مقادیر متن آشکار و SecretRef پشتیبانی می‌شوند.
- `deviceId`: شناسه صریح دستگاه Matrix.
- `deviceName`: نام نمایشی دستگاه که هنگام ورود با گذرواژه استفاده می‌شود.
- `avatarUrl`: URL خود-آواتار ذخیره‌شده برای همگام‌سازی پروفایل و به‌روزرسانی‌های `profile set`.
- `initialSyncLimit`: حداکثر تعداد رویدادهایی که هنگام همگام‌سازی شروع واکشی می‌شوند.

### رمزنگاری

- `encryption`: E2EE را فعال می‌کند. پیش‌فرض: `false`.
- `startupVerification`: `"if-unverified"` (پیش‌فرض وقتی E2EE روشن است) یا `"off"`. وقتی این دستگاه تأییدنشده باشد، هنگام شروع به‌صورت خودکار درخواست خود-تأییدی می‌کند.
- `startupVerificationCooldownHours`: دوره انتظار پیش از درخواست خودکار بعدی هنگام شروع. پیش‌فرض: `24`.

### دسترسی و سیاست

- `groupPolicy`: `"open"`، `"allowlist"`، یا `"disabled"`. پیش‌فرض: `"allowlist"`.
- `groupAllowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک اتاق.
- `dm.enabled`: وقتی `false` باشد، همه DMها را نادیده می‌گیرد. پیش‌فرض: `true`.
- `dm.policy`: `"pairing"` (پیش‌فرض)، `"allowlist"`، `"open"`، یا `"disabled"`. پس از اینکه بات به اتاق پیوست و اتاق را به‌عنوان DM طبقه‌بندی کرد اعمال می‌شود؛ روی پردازش دعوت اثری ندارد.
- `dm.allowFrom`: فهرست مجاز شناسه‌های کاربر برای ترافیک DM.
- `dm.sessionScope`: `"per-user"` (پیش‌فرض) یا `"per-room"`.
- `dm.threadReplies`: بازنویسی مخصوص DM برای رشته‌ای‌کردن پاسخ (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: پیام‌ها را از دیگر حساب‌های بات Matrix پیکربندی‌شده می‌پذیرد (`true` یا `"mentions"`).
- `allowlistOnly`: وقتی `true` باشد، همه سیاست‌های DM فعال (به‌جز `"disabled"`) و سیاست‌های گروهی `"open"` را به `"allowlist"` مجبور می‌کند. سیاست‌های `"disabled"` را تغییر نمی‌دهد.
- `autoJoin`: `"always"`، `"allowlist"`، یا `"off"`. پیش‌فرض: `"off"`. روی هر دعوت Matrix اعمال می‌شود، از جمله دعوت‌های سبک DM.
- `autoJoinAllowlist`: اتاق‌ها/نام‌های مستعار مجاز وقتی `autoJoin` برابر `"allowlist"` است. ورودی‌های نام مستعار در برابر هوم‌سرور تفکیک می‌شوند، نه در برابر وضعیتی که اتاق دعوت‌کننده ادعا می‌کند.
- `contextVisibility`: دیدپذیری زمینه تکمیلی (پیش‌فرض `"all"`، `"allowlist"`، `"allowlist_quote"`).

### رفتار پاسخ

- `replyToMode`: `"off"`، `"first"`، `"all"`، یا `"batched"`.
- `threadReplies`: `"off"`، `"inbound"`، یا `"always"`.
- `threadBindings`: بازنویسی‌های هر کانال برای مسیریابی نشست وابسته به رشته و چرخه عمر.
- `streaming`: `"off"` (پیش‌فرض)، `"partial"`، `"quiet"`، یا شکل شیء `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: وقتی `true` باشد، بلوک‌های کامل‌شده دستیار به‌صورت پیام‌های پیشرفت جداگانه نگه داشته می‌شوند.
- `markdown`: پیکربندی اختیاری رندر Markdown برای متن خروجی.
- `responsePrefix`: رشته اختیاری که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `textChunkLimit`: اندازه قطعه خروجی بر حسب کاراکتر وقتی `chunkMode: "length"` است. پیش‌فرض: `4000`.
- `chunkMode`: `"length"` (پیش‌فرض، تقسیم بر اساس تعداد کاراکتر) یا `"newline"` (تقسیم در مرزهای خط).
- `historyLimit`: تعداد پیام‌های اخیر اتاق که وقتی یک پیام اتاق عامل را فعال می‌کند به‌عنوان `InboundHistory` درج می‌شوند. به `messages.groupChat.historyLimit` برمی‌گردد؛ پیش‌فرض مؤثر `0` (غیرفعال).
- `mediaMaxMb`: سقف اندازه رسانه بر حسب MB برای ارسال‌های خروجی و پردازش ورودی.

### تنظیمات واکنش

- `ackReaction`: بازنویسی واکنش تأیید برای این کانال/حساب.
- `ackReactionScope`: بازنویسی دامنه (`"group-mentions"` پیش‌فرض، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: حالت اعلان واکنش ورودی (`"own"` پیش‌فرض، `"off"`).

### ابزارها و بازنویسی‌های هر اتاق

- `actions`: کنترل دسترسی ابزار برای هر اقدام (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: نقشه سیاست برای هر اتاق. هویت نشست پس از تفکیک از شناسه پایدار اتاق استفاده می‌کند. (`rooms` یک نام مستعار قدیمی است.)
  - `groups.<room>.account`: یک ورودی اتاق به‌ارث‌رسیده را به یک حساب مشخص محدود می‌کند.
  - `groups.<room>.allowBots`: بازنویسی هر اتاق برای تنظیم سطح کانال (`true` یا `"mentions"`).
  - `groups.<room>.users`: فهرست مجاز فرستنده برای هر اتاق.
  - `groups.<room>.tools`: بازنویسی‌های مجاز/غیرمجاز ابزار برای هر اتاق.
  - `groups.<room>.autoReply`: بازنویسی دروازه‌گذاری منشن برای هر اتاق. `true` نیاز به منشن را برای آن اتاق غیرفعال می‌کند؛ `false` آن را دوباره اجباری می‌کند.
  - `groups.<room>.skills`: فیلتر skill برای هر اتاق.
  - `groups.<room>.systemPrompt`: قطعه پرامپت سیستمی برای هر اتاق.

### تنظیمات تأیید exec

- `execApprovals.enabled`: تأییدهای exec را از طریق پرامپت‌های بومی Matrix تحویل می‌دهد.
- `execApprovals.approvers`: شناسه‌های کاربر Matrix که اجازه تأیید دارند. به `dm.allowFrom` برمی‌گردد.
- `execApprovals.target`: `"dm"` (پیش‌فرض)، `"channel"`، یا `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: فهرست‌های مجاز اختیاری agent/session برای تحویل.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و دروازه‌گذاری منشن
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
