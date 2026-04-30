---
read_when:
    - مشکلات اتصال/احراز هویت دارید و رفع‌های راهنمایی‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی اولیه انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-04-30T20:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
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
- `--yes`: پذیرش پیش‌فرض‌ها بدون درخواست تأیید
- `--repair`: اعمال تعمیرهای پیشنهادی بدون درخواست تأیید
- `--fix`: نام مستعار برای `--repair`
- `--force`: اعمال تعمیرهای تهاجمی، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: اجرا بدون درخواست‌های تعاملی؛ فقط مهاجرت‌های ایمن
- `--generate-gateway-token`: ایجاد و پیکربندی یک توکن Gateway
- `--deep`: اسکن سرویس‌های سیستم برای نصب‌های اضافی Gateway

نکته‌ها:

- درخواست‌های تعاملی (مانند رفع‌های keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (cron، Telegram، بدون ترمینال) درخواست‌ها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Plugin را رد می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار برای `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در پوشه نشست‌ها تشخیص می‌دهند. بایگانی کردن آن‌ها به صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کارهای cron اسکن می‌کند و می‌تواند پیش از آنکه زمان‌بند در زمان اجرا مجبور به نرمال‌سازی خودکار آن‌ها شود، آن‌ها را درجا بازنویسی کند.
- Doctor وابستگی‌های runtime مفقود برای Pluginهای همراه را بدون نوشتن در نصب‌های سراسری بسته‌بندی‌شده تعمیر می‌کند. برای نصب‌های npm متعلق به root یا واحدهای systemd سخت‌گیرانه، `OPENCLAW_PLUGIN_STAGE_DIR` را روی پوشه‌ای قابل نوشتن مانند `/var/lib/openclaw/plugin-runtime-deps` تنظیم کنید؛ همچنین می‌تواند فهرستی از مسیرها مانند `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` باشد، که در آن ریشه‌های قبلی لایه‌های فقط‌خواندنی جست‌وجو هستند و ریشه نهایی هدف تعمیر است.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin مفقود از `plugins.allow`/`plugins.entries`، همراه با پیکربندی کانال آویزان متناظر، هدف‌های Heartbeat و بازنویسی‌های مدل کانال، وقتی کشف Plugin سالم باشد، تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا سایر Pluginها و کانال‌ها بتوانند به اجرا ادامه دهند.
- وقتی supervisor دیگری چرخه عمر Gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd غیرفعال اضافی شبیه Gateway را نادیده می‌گیرد و هنگام تعمیر، فراداده command/entrypoint را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. اگر عمداً می‌خواهید launcher فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را به `talk.provider` + `talk.providers.<provider>` به‌طور خودکار مهاجرت می‌دهد.
- اجرای تکراری `doctor --fix` دیگر وقتی تنها تفاوت، ترتیب کلیدهای شیء باشد، نرمال‌سازی Talk را گزارش/اعمال نمی‌کند.
- Doctor شامل یک بررسی آمادگی جست‌وجوی حافظه است و می‌تواند وقتی اعتبارنامه‌های embedding موجود نیستند، `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان حساب اپراتور انسانی است که مجاز به اجرای فرمان‌های فقط‌مالک و تأیید اقدام‌های خطرناک است. جفت‌سازی DM فقط اجازه می‌دهد کسی با bot صحبت کند؛ اگر پیش از وجود bootstrap نخستین مالک، فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صراحتاً تنظیم کنید.
- Doctor وقتی agentهای حالت Codex پیکربندی شده‌اند و دارایی‌های شخصی Codex CLI در خانه Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های محلی app-server Codex از خانه‌های ایزوله برای هر agent استفاده می‌کنند، بنابراین از `openclaw migrate codex --dry-run` برای فهرست‌برداری دارایی‌هایی استفاده کنید که باید آگاهانه ارتقا داده شوند.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرسیگنال همراه با راهکار رفع (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شوند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و اعتبارنامه‌های fallback متن ساده نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، doctor ادامه می‌دهد و به‌جای خروج زودهنگام، یک هشدار گزارش می‌کند.
- حل خودکار نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن قابل‌حل Telegram در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و حل خودکار را برای آن گذر رد می‌کند.

## macOS: بازنویسی‌های env در `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را بازنویسی می‌کند و می‌تواند باعث خطاهای پایدار «غیرمجاز» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor برای Gateway](/fa/gateway/doctor)
