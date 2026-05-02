---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و یک بررسی اولیه می‌خواهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-02T11:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع‌های سریع برای Gateway و کانال‌ها.

مرتبط:

- عیب‌یابی: [عیب‌یابی](/fa/gateway/troubleshooting)
- ممیزی امنیتی: [امنیت](/fa/gateway/security)

## نمونه‌ها

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی فضای کاری را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون درخواست تأیید می‌پذیرد
- `--repair`: تعمیرهای پیشنهادی غیرسرویسی را بدون درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون اعلان اجرا می‌شود؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند

نکته‌ها:

- اعلان‌های تعاملی (مانند رفع‌های keychain/OAuth) فقط زمانی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (Cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Plugin را رد می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت آن‌ها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار برای `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های سرویس Gateway گمشده یا قدیمی را گزارش می‌کند، اما بیرون از حالت تعمیر به‌روزرسانی آن‌ها را نصب یا بازنویسی نمی‌کند. برای سرویس گمشده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید راه‌انداز را جایگزین کنید `openclaw gateway install --force` را اجرا کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در دایرکتوری نشست‌ها تشخیص می‌دهند. بایگانی‌کردن آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes`، و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کارهای Cron اسکن می‌کند و می‌تواند پیش از آنکه زمان‌بند مجبور شود آن‌ها را در زمان اجرا به‌طور خودکار عادی‌سازی کند، درجا بازنویسی‌شان کند.
- در Linux، Doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ آن اسکریپت دیگر نگهداری نمی‌شود و وقتی Cron به محیط systemd user-bus دسترسی ندارد می‌تواند قطعی‌های کاذب Gateway مربوط به WhatsApp را لاگ کند.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک می‌کند. همچنین وقتی registry بتواند Pluginهای دانلودشدنی پیکربندی‌شده را حل کند، موارد گمشده را تعمیر می‌کند.
- Doctor پیکربندی قدیمی Plugin را با حذف شناسه‌های Plugin گمشده از `plugins.allow`/`plugins.entries` تعمیر می‌کند، به‌علاوه پیکربندی کانال آویزان متناظر، اهداف Heartbeat، و بازنویسی‌های مدل کانال را وقتی کشف Plugin سالم است.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال‌کردن ورودی متأثر `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به اجرا ادامه دهند.
- وقتی یک supervisor دیگر مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی‌مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، Doctor واحدهای systemd غیرفعال اضافی شبیه Gateway را نادیده می‌گیرد و هنگام تعمیر، metadata فرمان/نقطه ورود را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. ابتدا سرویس را متوقف کنید یا وقتی عمداً می‌خواهید راه‌انداز فعال را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId`، و موارد مشابه) را به `talk.provider` + `talk.providers.<provider>` به‌طور خودکار مهاجرت می‌دهد.
- اجرای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای شیء باشد، عادی‌سازی Talk را گزارش/اعمال نمی‌کند.
- Doctor شامل بررسی آمادگی جست‌وجوی حافظه است و وقتی اعتبارنامه‌های embedding گم شده باشند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان، حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط-مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد کسی با bot صحبت کند؛ اگر فرستنده‌ای را پیش از وجود bootstrap نخستین مالک تأیید کرده‌اید، `commands.ownerAllowFrom` را صریحاً تنظیم کنید.
- Doctor وقتی agentهای حالت Codex پیکربندی شده‌اند و assetهای شخصی Codex CLI در home مربوط به Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های محلی app-server مربوط به Codex از homeهای ایزوله به‌ازای هر agent استفاده می‌کنند، بنابراین برای فهرست‌برداری از assetهایی که باید عامدانه ارتقا داده شوند از `openclaw migrate codex --dry-run` استفاده کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، Doctor یک هشدار با سیگنال بالا همراه با راهکار اصلاحی گزارش می‌کند (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`).
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شوند و در مسیر فرمان فعلی در دسترس نباشند، Doctor یک هشدار فقط‌خواندنی گزارش می‌کند و اعتبارنامه‌های fallback متن ساده نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، Doctor ادامه می‌دهد و به‌جای خروج زودهنگام یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های دایرکتوری وضعیت، Doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته باشند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند Doctor در دسترس نباشد هشدار می‌دهد.
- حل خودکار نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن Telegram قابل‌حل در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، Doctor یک هشدار گزارش می‌کند و حل خودکار را برای آن گذر رد می‌کند.

## macOS: بازنویسی‌های env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را بازنویسی می‌کند و می‌تواند خطاهای پایدار «unauthorized» ایجاد کند.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor مربوط به Gateway](/fa/gateway/doctor)
