---
read_when:
    - با مشکلات اتصال/احراز هویت روبه‌رو هستید و راهکارهای رفع مشکل هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی سریع انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات راهنمایی‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-12T08:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

برای مجوزهای مخصوص کانال، به‌جای `doctor` از کاوشگرهای کانال استفاده کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

کاوشگر هدفمند قابلیت‌های Discord، مجوزهای مؤثر کانال برای بات را گزارش می‌کند؛ کاوشگر وضعیت، کانال‌های پیکربندی‌شده Discord و هدف‌های پیوستن خودکار صوتی را ممیزی می‌کند.

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی فضای کاری را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون درخواست تأیید می‌پذیرد
- `--repair`: تعمیرهای پیشنهادی غیرسرویسی را بدون درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار `--repair`
- `--force`: تعمیرهای تهاجمی، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز را اعمال می‌کند
- `--non-interactive`: بدون اعلان اجرا می‌شود؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و واگذاری‌های اخیر راه‌اندازی مجدد سرپرست Gateway را گزارش می‌دهد

نکات:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes` و `doctor --generate-gateway-token` غیرفعال‌اند چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید.
- اعلان‌های تعاملی (مانند رفع‌های keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم نشده باشد. اجراهای بدون‌سر (cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری زودهنگام Plugin را رد می‌کنند تا بررسی‌های سلامت بدون‌سر سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های گمشده یا کهنه سرویس Gateway را گزارش می‌کند اما آن‌ها را خارج از حالت تعمیر به‌روزرسانی نصب یا بازنویسی نمی‌کند. برای سرویس گمشده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید راه‌انداز را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های رونوشت یتیم را در پوشه نشست‌ها تشخیص می‌دهند. بایگانی آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون‌سر آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کارهای cron اسکن می‌کند و می‌تواند آن‌ها را پیش از آنکه زمان‌بند مجبور شود در زمان اجرا به‌طور خودکار نرمال‌سازی کند، درجا بازنویسی کند.
- در Linux، doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ آن اسکریپت دیگر نگهداری نمی‌شود و وقتی cron فاقد محیط user-bus مربوط به systemd باشد می‌تواند قطعی‌های نادرست Gateway مربوط به WhatsApp را ثبت کند.
- وقتی WhatsApp فعال است، doctor وجود حلقه رویداد تنزل‌یافته Gateway را با کلاینت‌های محلی `openclaw-tui` که هنوز در حال اجرا هستند بررسی می‌کند. `doctor --fix` فقط کلاینت‌های محلی تأییدشده TUI را متوقف می‌کند تا پاسخ‌های WhatsApp پشت حلقه‌های تازه‌سازی کهنه TUI در صف نمانند.
- Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را در مدل‌های اصلی، fallbackها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال و pinهای کهنه مسیر نشست، به ارجاع‌های معیار `openai/*` بازنویسی می‌کند. `--fix` نیت Codex را به ورودی‌های `agentRuntime.id: "codex"` با دامنه provider/model منتقل می‌کند، pinهای auth-profile نشست مانند `openai-codex:...` را حفظ می‌کند، pinهای runtime کهنه کل عامل/نشست را حذف می‌کند و ارجاع‌های تعمیرشده عامل OpenAI را به‌جای احراز هویت مستقیم با کلید API OpenAI، روی مسیریابی احراز هویت Codex نگه می‌دارد.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک می‌کند و بسته میزبان `openclaw` را برای Pluginهای مدیریت‌شده npm که آن را به‌عنوان وابستگی همتا اعلام می‌کنند دوباره لینک می‌کند. همچنین Pluginهای قابل‌دانلود گمشده‌ای را که در پیکربندی به آن‌ها ارجاع شده است تعمیر می‌کند، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات پیکربندی‌شده provider/search، یا runtimeهای پیکربندی‌شده عامل. هنگام به‌روزرسانی بسته‌ها، doctor تعمیر Plugin توسط package-manager را تا کامل شدن تعویض بسته رد می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از آن `openclaw doctor --fix` را دوباره اجرا کنید. اگر دانلود ناموفق باشد، doctor خطای نصب را گزارش می‌کند و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin گمشده از `plugins.allow`/`plugins.deny`/`plugins.entries`، به‌علاوه پیکربندی کانال معلق، هدف‌های Heartbeat و بازنویسی‌های مدل کانال متناظر، وقتی کشف Plugin سالم است، تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی تحت‌تأثیر `plugins.entries.<id>` و حذف payload نامعتبر `config` قرنطینه می‌کند. راه‌اندازی Gateway از پیش فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به اجرا ادامه دهند.
- وقتی سرپرست دیگری چرخه عمر Gateway را در اختیار دارد، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافی شبیه Gateway را که غیرفعال‌اند نادیده می‌گیرد و هنگام تعمیر، فراداده فرمان/نقطه ورود را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. ابتدا سرویس را متوقف کنید یا وقتی عمداً می‌خواهید راه‌انداز فعال را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی مسطح قدیمی Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را به‌طور خودکار به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجرای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای شیء باشد، نرمال‌سازی Talk را گزارش/اعمال نمی‌کند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه را شامل می‌شود و وقتی اطلاعات احراز هویت embedding گم شده باشد می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط‌مالک را اجرا کند و اقدامات خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد کسی با بات صحبت کند؛ اگر پیش از وجود bootstrap مالک اول، فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صراحتاً تنظیم کنید.
- Doctor وقتی عامل‌های حالت Codex پیکربندی شده‌اند و دارایی‌های شخصی Codex CLI در خانه Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های محلی app-server مربوط به Codex از خانه‌های جداگانه برای هر عامل استفاده می‌کنند، پس برای فهرست‌برداری از دارایی‌هایی که باید آگاهانه ارتقا داده شوند از `openclaw migrate codex --dry-run` استفاده کنید.
- Doctor کلید بازنشسته `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف می‌کند؛ app-server مربوط به Codex همیشه ابزارهای فضای کاری بومی Codex را بومی نگه می‌دارد.
- Doctor وقتی Skills مجاز برای عامل پیش‌فرض در محیط runtime فعلی به‌دلیل نبودن binها، env varها، پیکربندی یا الزامات سیستم‌عامل در دسترس نیستند هشدار می‌دهد. `doctor --fix` می‌تواند آن Skills در دسترس‌نبودنی را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، به‌جای آن الزام گمشده را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پُرمعنا با راهکار (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر فایل‌های رجیستری sandbox قدیمی (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های رجیستری sharded مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` تحت مدیریت SecretRef باشند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و اطلاعات احراز هویت fallback به‌صورت plaintext نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix ناموفق شود، doctor به کار ادامه می‌دهد و به‌جای خروج زودهنگام یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیطی وابسته‌اند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نیست، هشدار می‌دهد.
- حل خودکار نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن قابل‌حل Telegram در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و حل خودکار را برای آن گذر رد می‌کند.

## macOS: بازنویسی‌های env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را بازنویسی می‌کند و می‌تواند باعث خطاهای پایدار «غیرمجاز» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Gateway doctor](/fa/gateway/doctor)
