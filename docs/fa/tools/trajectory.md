---
read_when:
    - اشکال‌زدایی از اینکه چرا یک عامل پاسخ داده، شکست خورده، یا ابزارها را به شکل خاصی فراخوانی کرده است
    - صدور یک بسته پشتیبانی برای یک نشست OpenClaw
    - بررسی زمینهٔ پرامپت، فراخوانی‌های ابزار، خطاهای زمان اجرا، یا فرادادهٔ استفاده
    - غیرفعال‌سازی یا جابه‌جایی ثبت مسیر
summary: خروجی گرفتن از بسته‌های مسیر حرکت ویرایش‌شده برای اشکال‌زدایی یک نشست عامل OpenClaw
title: بسته‌های مسیر اجرا
x-i18n:
    generated_at: "2026-06-27T19:06:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

ضبط مسیر، جعبه‌سیاه هر نشست در OpenClaw است. این قابلیت یک خط زمانی
ساختاریافته برای هر اجرای عامل ثبت می‌کند، سپس `/export-trajectory` نشست
فعلی را در قالب یک بسته پشتیبانی پالایش‌شده بسته‌بندی می‌کند.

وقتی باید به پرسش‌هایی مانند این‌ها پاسخ دهید، از آن استفاده کنید:

- چه پرامپت، پرامپت سیستمی، و ابزارهایی به مدل فرستاده شدند؟
- کدام پیام‌های رونوشت و فراخوانی‌های ابزار به این پاسخ منجر شدند؟
- آیا اجرا به پایان مهلت رسید، لغو شد، compact شد، یا با خطای provider روبه‌رو شد؟
- کدام مدل، pluginها، skills، و تنظیمات runtime فعال بودند؟
- provider چه فراداده‌ای درباره usage و prompt-cache برگرداند؟

اگر یک گزارش پشتیبانی گسترده برای یک مشکل زنده Gateway ثبت می‌کنید، با
[`/diagnostics`](/fa/gateway/diagnostics#chat-command) شروع کنید. Diagnostics بسته
پاک‌سازی‌شده Gateway را جمع‌آوری می‌کند و، برای نشست‌های harness مربوط به OpenAI Codex،
می‌تواند پس از تأیید، بازخورد Codex را نیز به سرورهای OpenAI بفرستد. وقتی
به‌طور مشخص به خط زمانی دقیق هر نشست از پرامپت، ابزار، و رونوشت نیاز دارید،
از `/export-trajectory` استفاده کنید.

## شروع سریع

این را در نشست فعال بفرستید:

```text
/export-trajectory
```

نام مستعار:

```text
/trajectory
```

OpenClaw بسته را زیر workspace می‌نویسد:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

می‌توانید یک نام دایرکتوری خروجی نسبی انتخاب کنید:

```text
/export-trajectory bug-1234
```

مسیر سفارشی داخل `.openclaw/trajectory-exports/` resolve می‌شود. مسیرهای مطلق
و مسیرهای `~` رد می‌شوند.

بسته‌های مسیر می‌توانند شامل پرامپت‌ها، پیام‌های مدل، schemaهای ابزار، نتایج
ابزار، رویدادهای runtime، و مسیرهای محلی باشند. بنابراین فرمان slash در chat
هر بار از مسیر تأیید exec عبور می‌کند. وقتی قصد ساخت بسته را دارید، یک‌بار
export را تأیید کنید؛ از allow-all استفاده نکنید. در گفت‌وگوهای گروهی، OpenClaw
پرامپت تأیید و نتیجه export را به‌صورت خصوصی برای owner می‌فرستد، نه اینکه
جزئیات مسیر را دوباره در اتاق مشترک منتشر کند.

برای بررسی محلی یا workflowهای پشتیبانی، می‌توانید مسیر فرمان تأییدشده را
مستقیماً هم اجرا کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## دسترسی

export مسیر یک فرمان owner است. فرستنده باید بررسی‌های عادی authorization
فرمان و بررسی‌های owner برای کانال را با موفقیت بگذراند.

## چه چیزهایی ثبت می‌شود

ضبط مسیر به‌صورت پیش‌فرض برای اجراهای عامل OpenClaw روشن است.

رویدادهای Runtime شامل این‌ها هستند:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`، شامل مدل مبدأ، مدل بعدی، دلیل/جزئیات شکست، موقعیت در زنجیره، و اینکه fallback جلو رفت، موفق شد، یا زنجیره را تمام کرد
- `model.completed`
- `trace.artifacts`
- `session.ended`

رویدادهای رونوشت نیز از شاخه نشست فعال بازسازی می‌شوند:

- پیام‌های کاربر
- پیام‌های دستیار
- فراخوانی‌های ابزار
- نتایج ابزار
- compactionها
- تغییرات مدل
- برچسب‌ها و ورودی‌های سفارشی نشست

رویدادها به‌صورت JSON Lines با این نشانگر schema نوشته می‌شوند:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## فایل‌های بسته

یک بسته exportشده می‌تواند شامل این‌ها باشد:

| فایل                  | محتوا                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | schema بسته، فایل‌های منبع، شمار رویدادها، و فهرست فایل‌های تولیدشده                             |
| `events.jsonl`        | خط زمانی مرتب‌شده runtime و رونوشت                                                        |
| `session-branch.json` | شاخه رونوشت فعال پالایش‌شده و سرآیند نشست                                           |
| `metadata.json`       | نسخه OpenClaw، OS/runtime، مدل، snapshot پیکربندی، pluginها، skills، و فراداده پرامپت     |
| `artifacts.json`      | وضعیت نهایی، خطاها، usage، prompt cache، شمار compaction، متن دستیار، و فراداده ابزار |
| `prompts.json`        | پرامپت‌های ارسال‌شده و جزئیات منتخب ساخت پرامپت                                         |
| `system-prompt.txt`   | آخرین پرامپت سیستمی کامپایل‌شده، هنگام ضبط                                                   |
| `tools.json`          | تعریف‌های ابزار فرستاده‌شده به مدل، هنگام ضبط                                              |

`manifest.json` فایل‌های موجود در آن بسته را فهرست می‌کند. بعضی فایل‌ها زمانی
حذف می‌شوند که نشست داده runtime متناظر را ضبط نکرده باشد.

## محل ضبط

به‌صورت پیش‌فرض، رویدادهای مسیر runtime کنار فایل نشست نوشته می‌شوند:

```text
<session>.trajectory.jsonl
```

OpenClaw همچنین یک فایل اشاره‌گر best-effort کنار نشست می‌نویسد:

```text
<session>.trajectory-path.json
```

برای ذخیره sidecarهای مسیر runtime در یک دایرکتوری اختصاصی،
`OPENCLAW_TRAJECTORY_DIR` را تنظیم کنید:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

وقتی این متغیر تنظیم شده باشد، OpenClaw برای هر session id یک فایل JSONL در
آن دایرکتوری می‌نویسد.

نگهداشت نشست، وقتی ورودی نشست مالک آن prune، cap، یا به‌واسطه بودجه دیسک نشست‌ها
evict شود، sidecarهای مسیر را حذف می‌کند. فایل‌های runtime بیرون از دایرکتوری
نشست‌ها فقط زمانی حذف می‌شوند که هدف اشاره‌گر همچنان ثابت کند متعلق به همان
نشست است.

## غیرفعال کردن ضبط

پیش از شروع OpenClaw، `OPENCLAW_TRAJECTORY=0` را تنظیم کنید:

```bash
export OPENCLAW_TRAJECTORY=0
```

این کار ضبط مسیر runtime را غیرفعال می‌کند. `/export-trajectory` همچنان می‌تواند
شاخه رونوشت را export کند، اما فایل‌های فقط-runtime مانند context کامپایل‌شده،
artifactهای provider، و فراداده پرامپت ممکن است وجود نداشته باشند.

## تنظیم timeout تخلیه

OpenClaw در زمان پاک‌سازی عامل، sidecarهای مسیر runtime را flush می‌کند. timeout
پیش‌فرض پاک‌سازی 10,000 ms است. روی دیسک‌های کند یا storeهای بزرگ، پیش از شروع
OpenClaw، `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` را تنظیم کنید:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

این کنترل می‌کند که OpenClaw چه زمانی یک timeout با نام `openclaw-trajectory-flush` را log کند و ادامه دهد.
این مقدار capهای اندازه مسیر را تغییر نمی‌دهد. برای تنظیم همه گام‌های پاک‌سازی
عامل که timeout صریحی پاس نمی‌دهند، `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` را تنظیم کنید.

## حریم خصوصی و محدودیت‌ها

بسته‌های مسیر برای پشتیبانی و اشکال‌زدایی طراحی شده‌اند، نه انتشار عمومی.
OpenClaw پیش از نوشتن فایل‌های export، مقادیر حساس را پالایش می‌کند:

- credentials و فیلدهای payload شناخته‌شده‌ای که شبیه secret هستند
- داده تصویر
- مسیرهای state محلی
- مسیرهای workspace، جایگزین‌شده با `$WORKSPACE_DIR`
- مسیرهای دایرکتوری home، در صورت تشخیص

exporter اندازه ورودی را نیز محدود می‌کند:

- فایل‌های sidecar runtime: ضبط زنده در 10 MiB متوقف می‌شود و در صورت باقی‌ماندن فضا یک رویداد truncation ثبت می‌کند؛ export sidecarهای runtime موجود را تا 50 MiB می‌پذیرد
- فایل‌های نشست: 50 MiB
- رویدادهای runtime: 200,000
- کل رویدادهای exportشده: 250,000
- خط‌های منفرد رویداد runtime در بالای 256 KiB truncate می‌شوند

پیش از اشتراک‌گذاری بسته‌ها بیرون از تیم خود، آن‌ها را بازبینی کنید. پالایش
best-effort است و نمی‌تواند همه secretهای خاص هر برنامه را بشناسد.

## عیب‌یابی

اگر export هیچ رویداد runtime ندارد:

- تأیید کنید OpenClaw بدون `OPENCLAW_TRAJECTORY=0` شروع شده باشد
- بررسی کنید آیا `OPENCLAW_TRAJECTORY_DIR` به یک دایرکتوری قابل‌نوشتن اشاره می‌کند
- یک پیام دیگر در نشست اجرا کنید، سپس دوباره export بگیرید
- برای `runtimeEventCount`، `manifest.json` را بررسی کنید

اگر فرمان مسیر خروجی را رد می‌کند:

- از یک نام نسبی مثل `bug-1234` استفاده کنید
- `/tmp/...` یا `~/...` را پاس ندهید
- export را داخل `.openclaw/trajectory-exports/` نگه دارید

اگر export با خطای اندازه شکست بخورد، نشست یا sidecar از محدودیت‌های ایمنی
export فراتر رفته است. یک نشست جدید شروع کنید یا یک بازتولید کوچک‌تر export کنید.

## مرتبط

- [Diffs](/fa/tools/diffs)
- [مدیریت نشست](/fa/concepts/session)
- [ابزار Exec](/fa/tools/exec)
