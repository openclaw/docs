---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی اطمینانی انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات هدایت‌شده)
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-06T17:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع سریع برای Gateway و کانال‌ها.

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
- `--yes`: پیش‌فرض‌ها را بدون نمایش درخواست تأیید می‌پذیرد
- `--repair`: تعمیرهای پیشنهادیِ غیرسرویسی را بدون درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا دستورهای صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون درخواست‌های تعاملی اجرا می‌کند؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و واگذاری‌های اخیر راه‌اندازی مجدد ناظر Gateway را گزارش می‌دهد

نکته‌ها:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes` و `doctor --generate-gateway-token` غیرفعال هستند چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید.
- درخواست‌های تعاملی (مانند رفع‌های keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (cron، Telegram، بدون ترمینال) از درخواست‌ها عبور می‌کنند.
- عملکرد: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Pluginها را رد می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای ناشناخته پیکربندی را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های گم‌شده یا قدیمی سرویس Gateway را گزارش می‌دهد، اما خارج از حالت تعمیر به‌روزرسانی، آن‌ها را نصب یا بازنویسی نمی‌کند. برای سرویس گم‌شده `openclaw gateway install` را اجرا کنید، یا وقتی عمدا می‌خواهید راه‌انداز را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های متن پیاده‌شده یتیم را در پوشه نشست‌ها تشخیص می‌دهند. بایگانی کردن آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کار Cron اسکن می‌کند و می‌تواند پیش از آنکه زمان‌بند مجبور شود در زمان اجرا آن‌ها را خودکار عادی‌سازی کند، همان‌جا بازنویسی‌شان کند.
- در Linux، doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ آن اسکریپت دیگر نگهداری نمی‌شود و وقتی cron محیط user-bus مربوط به systemd را ندارد، می‌تواند قطعی‌های نادرست Gateway مربوط به WhatsApp را ثبت کند.
- وقتی WhatsApp فعال باشد، doctor وجود حلقه رویداد تنزل‌یافته Gateway را با کلاینت‌های محلی `openclaw-tui` که هنوز در حال اجرا هستند بررسی می‌کند. `doctor --fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند تا پاسخ‌های WhatsApp پشت حلقه‌های تازه‌سازی قدیمی TUI در صف نمانند.
- Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال و pinهای قدیمی مسیر نشست به ارجاع‌های استاندارد `openai/*` بازنویسی می‌کند. `--fix` فقط وقتی `agentRuntime.id: "codex"` را انتخاب می‌کند که Plugin مربوط به Codex نصب و فعال باشد، harness مربوط به `codex` را مشارکت دهد و OAuth قابل استفاده داشته باشد؛ در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند تا مسیر روی اجراکننده پیش‌فرض OpenClaw باقی بماند.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک‌سازی می‌کند. همچنین Pluginهای قابل دانلودِ گم‌شده‌ای را تعمیر می‌کند که پیکربندی به آن‌ها ارجاع داده است، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات پیکربندی‌شده provider/search یا runtimeهای پیکربندی‌شده عامل. هنگام به‌روزرسانی بسته‌ها، doctor تعمیر Plugin مدیر بسته را تا تکمیل تعویض بسته رد می‌کند؛ اگر یک Plugin پیکربندی‌شده همچنان به بازیابی نیاز دارد، پس از آن دوباره `openclaw doctor --fix` را اجرا کنید. اگر دانلود ناموفق باشد، doctor خطای نصب را گزارش می‌دهد و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی قدیمی Plugin را با حذف شناسه‌های گم‌شده Plugin از `plugins.allow`/`plugins.entries` تعمیر می‌کند، به‌همراه پیکربندی کانال آویزان متناظر، هدف‌های heartbeat و overrideهای مدل کانال، وقتی کشف Plugin سالم باشد.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin بد را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به کار ادامه دهند.
- وقتی ناظر دیگری چرخه عمر Gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافیِ شبیه Gateway را که غیرفعال هستند نادیده می‌گیرد و هنگام تعمیر، metadata دستور/entrypoint را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. وقتی عمدا می‌خواهید راه‌انداز فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را به‌طور خودکار به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای object باشد، عادی‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه دارد و وقتی اعتبارنامه‌های embedding گم شده باشند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک دستوری پیکربندی نشده باشد هشدار می‌دهد. مالک دستور حساب کاربری انسانیِ اپراتوری است که اجازه دارد دستورهای فقط‌مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد کسی با bot صحبت کند؛ اگر پیش از وجود bootstrap مالک اول، فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی عامل‌های حالت Codex پیکربندی شده باشند و دارایی‌های شخصی Codex CLI در خانه Codex اپراتور وجود داشته باشد هشدار می‌دهد. راه‌اندازی‌های app-server محلی Codex از خانه‌های جداشده برای هر عامل استفاده می‌کنند، پس برای فهرست‌برداری از دارایی‌هایی که باید آگاهانه ارتقا داده شوند از `openclaw migrate codex --dry-run` استفاده کنید.
- Doctor وقتی skills مجاز برای عامل پیش‌فرض در محیط runtime فعلی در دسترس نباشند، چون binها، env varها، پیکربندی یا الزامات OS گم شده‌اند، هشدار می‌دهد. `doctor --fix` می‌تواند آن skills در دسترس‌نبودنی را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، به‌جای آن نیازمندی گم‌شده را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار با سیگنال بالا همراه با راهکار اصلاحی گزارش می‌دهد (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`).
- اگر فایل‌های registry قدیمی sandbox (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌دهد؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های registry شاردشده مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شده باشند و در مسیر دستور فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌دهد و اعتبارنامه‌های fallback متن ساده نمی‌نویسد.
- اگر بررسی SecretRef کانال در مسیر fix ناموفق باشد، doctor به‌جای خروج زودهنگام ادامه می‌دهد و یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته باشند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نباشد هشدار می‌دهد.
- auto-resolution نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن قابل resolve شدن Telegram در مسیر دستور فعلی نیاز دارد. اگر بررسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌دهد و auto-resolution را برای آن گذر رد می‌کند.

## macOS: overrideهای env مربوط به `launchctl`

اگر قبلا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده باشید، آن مقدار فایل پیکربندی شما را override می‌کند و می‌تواند باعث خطاهای پایدار "unauthorized" شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [doctor مربوط به Gateway](/fa/gateway/doctor)
