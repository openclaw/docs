---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی صحت اولیه انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرهای هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-03T21:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع سریع مشکل‌ها برای Gateway و کانال‌ها.

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
- `--non-interactive`: بدون اعلان اجرا می‌شود؛ فقط مهاجرت‌های امن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway ایجاد و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway پویش می‌کند

نکته‌ها:

- اعلان‌های تعاملی (مثل رفع مشکل keychain/OAuth) فقط زمانی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (Cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` از بارگذاری زودهنگام Plugin صرف‌نظر می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Plugin نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار برای `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعاریف گم‌شده یا کهنه سرویس Gateway را گزارش می‌کند، اما آن‌ها را خارج از حالت تعمیر به‌روزرسانی نصب یا بازنویسی نمی‌کند. برای سرویس گم‌شده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید راه‌انداز را جایگزین کنید `openclaw gateway install --force` را اجرا کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در پوشه نشست‌ها تشخیص می‌دهند. بایگانی کردن آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes`، و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی jobهای Cron پویش می‌کند و می‌تواند پیش از آنکه زمان‌بند مجبور شود آن‌ها را در زمان اجرا خودکار نرمال‌سازی کند، همان‌جا بازنویسی‌شان کند.
- در Linux، doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ آن اسکریپت دیگر نگهداری نمی‌شود و وقتی Cron به محیط systemd user-bus دسترسی ندارد، می‌تواند قطعی‌های اشتباه Gateway مربوط به WhatsApp را ثبت کند.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ساخته‌اند پاک‌سازی می‌کند. همچنین وقتی registry بتواند Pluginهای قابل دانلود پیکربندی‌شده اما گم‌شده را resolve کند، آن‌ها را تعمیر می‌کند، و گذر doctor نسخه 2026.5.2 پیش از علامت‌گذاری پیکربندی به‌عنوان لمس‌شده برای آن انتشار، Pluginهای قابل دانلودی را که یک پیکربندی قدیمی از قبل استفاده می‌کند به‌طور خودکار نصب می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های گم‌شده Plugin از `plugins.allow`/`plugins.entries`، به‌علاوه پیکربندی کانال آویزان متناظر، هدف‌های Heartbeat، و بازنویسی‌های مدل کانال وقتی کشف Plugin سالم است، تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی متأثر `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به اجرا ادامه دهند.
- وقتی ناظر دیگری چرخه عمر Gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافی شبیه Gateway را که غیرفعال هستند نادیده می‌گیرد و هنگام تعمیر، metadata فرمان/entrypoint را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. وقتی عمداً می‌خواهید راه‌انداز فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت و قدیمی Talk (`talk.voiceId`، `talk.modelId`، و موارد مشابه) را به‌طور خودکار به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای object باشد، نرمال‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor شامل بررسی آمادگی جست‌وجوی حافظه است و وقتی credentials مربوط به embedding گم‌شده باشند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط-مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. pair کردن DM فقط اجازه می‌دهد کسی با ربات صحبت کند؛ اگر فرستنده‌ای را پیش از وجود bootstrap مالک نخست تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی agentهای حالت Codex پیکربندی شده‌اند و assetهای شخصی Codex CLI در خانه Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های app-server محلی Codex از homeهای جداگانه برای هر agent استفاده می‌کنند، بنابراین از `openclaw migrate codex --dry-run` برای inventory کردن assetهایی استفاده کنید که باید آگاهانه ارتقا داده شوند.
- Doctor وقتی Skills مجاز برای agent پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون binها، env varها، پیکربندی، یا نیازمندی‌های OS گم‌شده‌اند، هشدار می‌دهد. `doctor --fix` می‌تواند آن skillهای در دسترس نبودنی را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، به‌جای آن نیازمندی گم‌شده را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پُرسیگنال همراه با راه‌حل (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر فایل‌های قدیمی registry مربوط به sandbox (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های registry شاردشده مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` توسط SecretRef مدیریت شوند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و credentials جایگزین plaintext نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، doctor به کار ادامه می‌دهد و به‌جای خروج زودهنگام، یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته باشند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نباشد هشدار می‌دهد.
- auto-resolution نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن Telegram قابل resolve در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و auto-resolution را برای آن گذر رد می‌کند.

## macOS: بازنویسی‌های env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده باشید، آن مقدار فایل پیکربندی شما را override می‌کند و می‌تواند خطاهای ماندگار «unauthorized» ایجاد کند.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Gateway doctor](/fa/gateway/doctor)
