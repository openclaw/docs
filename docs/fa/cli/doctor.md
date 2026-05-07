---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای راهنمایی‌شده برای رفع آن‌ها می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی سلامت انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + اصلاحات راهنمایی‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-07T13:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + اصلاح‌های سریع برای Gateway و کانال‌ها.

مرتبط:

- عیب‌یابی: [عیب‌یابی](/fa/gateway/troubleshooting)
- ممیزی امنیتی: [امنیت](/fa/gateway/security)

## مثال‌ها

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

برای مجوزهای ویژه کانال، به‌جای `doctor` از کاوشگرهای کانال استفاده کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

کاوشگر هدفمند قابلیت‌های Discord مجوزهای مؤثر کانال برای ربات را گزارش می‌کند؛ کاوشگر وضعیت، کانال‌های Discord پیکربندی‌شده و اهداف پیوستن خودکار صوتی را ممیزی می‌کند.

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی فضای کاری را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون درخواست تأیید می‌پذیرد
- `--repair`: اصلاح‌های غیرسرویسی توصیه‌شده را بدون درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: اصلاح‌های تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون اعلان اجرا می‌کند؛ فقط مهاجرت‌های امن و اصلاح‌های غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و واگذاری‌های اخیر راه‌اندازی مجدد ناظر Gateway را گزارش می‌دهد

نکته‌ها:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes` و `doctor --generate-gateway-token` غیرفعال‌اند، چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید.
- اعلان‌های تعاملی (مانند اصلاح‌های keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم نشده باشد. اجراهای بدون رابط (Cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Plugin را رد می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار `--repair`) یک پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های مفقود یا کهنه سرویس Gateway را گزارش می‌کند، اما آن‌ها را خارج از حالت اصلاح به‌روزرسانی نصب یا بازنویسی نمی‌کند. برای سرویس مفقود، `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید راه‌انداز را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های رونویس یتیم را در پوشه نشست‌ها شناسایی می‌کنند. بایگانی آن‌ها با قالب `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کارهای Cron اسکن می‌کند و می‌تواند پیش از آنکه زمان‌بند ناچار شود در زمان اجرا آن‌ها را خودکار عادی‌سازی کند، همان‌جا بازنویسی‌شان کند.
- در Linux، doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ این اسکریپت دیگر نگهداری نمی‌شود و وقتی Cron محیط user-bus systemd را ندارد، می‌تواند قطعی‌های نادرست Gateway مربوط به WhatsApp را ثبت کند.
- وقتی WhatsApp فعال است، doctor یک حلقه رویداد تنزل‌یافته Gateway را با کلاینت‌های محلی `openclaw-tui` که هنوز در حال اجرا هستند بررسی می‌کند. `doctor --fix` فقط کلاینت‌های TUI محلی تأییدشده را متوقف می‌کند تا پاسخ‌های WhatsApp پشت حلقه‌های تازه‌سازی کهنه TUI صف نشوند.
- Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را در مدل‌های اصلی، جایگزین‌ها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال و پین‌های کهنه مسیر نشست به ارجاع‌های استاندارد `openai/*` بازنویسی می‌کند. `--fix` فقط وقتی `agentRuntime.id: "codex"` را انتخاب می‌کند که Plugin مربوط به Codex نصب و فعال باشد، harness مربوط به `codex` را فراهم کند و OAuth قابل‌استفاده داشته باشد؛ در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند تا مسیر روی اجراکننده پیش‌فرض OpenClaw بماند.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک می‌کند. همچنین Pluginهای قابل دانلود مفقود را که پیکربندی به آن‌ها ارجاع می‌دهد، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات پیکربندی‌شده provider/search یا runtimeهای عامل پیکربندی‌شده، اصلاح می‌کند. هنگام به‌روزرسانی بسته، doctor اصلاح Plugin توسط package-manager را تا تکمیل تعویض بسته رد می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از آن دوباره `openclaw doctor --fix` را اجرا کنید. اگر دانلود شکست بخورد، doctor خطای نصب را گزارش می‌کند و ورودی Plugin پیکربندی‌شده را برای تلاش اصلاح بعدی حفظ می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin مفقود از `plugins.allow`/`plugins.entries`، همراه با پیکربندی کانال آویزان همسان، اهداف Heartbeat و بازنویسی‌های مدل کانال، وقتی کشف Plugin سالم است اصلاح می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به اجرا ادامه دهند.
- وقتی ناظر دیگری مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و اصلاح‌های غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافی شبیه Gateway را که غیرفعال‌اند نادیده می‌گیرد و هنگام اصلاح، فراداده فرمان/نقطه ورود را برای یک سرویس systemd Gateway در حال اجرا بازنویسی نمی‌کند. وقتی عمداً می‌خواهید راه‌انداز فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor به‌طور خودکار پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای شیء باشد، عادی‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه دارد و وقتی اعتبارنامه‌های embedding مفقود باشند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان حساب اپراتور انسانی است که مجاز است فرمان‌های فقط‌مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد فردی با ربات صحبت کند؛ اگر پیش از وجود bootstrap مالک اول فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی عامل‌های حالت Codex پیکربندی شده‌اند و دارایی‌های شخصی Codex CLI در خانه Codex اپراتور وجود دارد هشدار می‌دهد. راه‌اندازی‌های محلی app-server مربوط به Codex از خانه‌های جداگانه برای هر عامل استفاده می‌کنند، بنابراین برای فهرست‌برداری از دارایی‌هایی که باید عامدانه ارتقا داده شوند از `openclaw migrate codex --dry-run` استفاده کنید.
- Doctor وقتی skills مجاز برای عامل پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون باینری‌ها، env varها، پیکربندی یا الزامات OS مفقود است، هشدار می‌دهد. `doctor --fix` می‌تواند آن skills ناموجود را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، به‌جای آن نیازمندی مفقود را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرسیگنال با راهکار اصلاح (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر فایل‌های قدیمی registry sandbox (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های registry قطعه‌بندی‌شده مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` تحت مدیریت SecretRef باشند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و اعتبارنامه‌های جایگزین متن ساده نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، doctor به‌جای خروج زودهنگام ادامه می‌دهد و هشدار گزارش می‌کند.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته‌اند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نیست، هشدار می‌دهد.
- تفکیک خودکار نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن Telegram قابل تفکیک در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor هشدار گزارش می‌کند و تفکیک خودکار را برای آن عبور رد می‌کند.

## macOS: بازنویسی‌های env مربوط به `launchctl`

اگر پیش‌تر `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را بازنویسی می‌کند و می‌تواند باعث خطاهای پایدار "unauthorized" شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Gateway doctor](/fa/gateway/doctor)
