---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی صحت اولیه انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرهای هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-10T19:31:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
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

برای مجوزهای اختصاصی کانال، به‌جای `doctor` از پروب‌های کانال استفاده کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

پروب هدفمند قابلیت‌های Discord مجوزهای مؤثر کانال برای ربات را گزارش می‌کند؛ پروب وضعیت، کانال‌های پیکربندی‌شده Discord و اهداف پیوستن خودکار صوتی را ممیزی می‌کند.

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی فضای کاری را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون پرسش می‌پذیرد
- `--repair`: تعمیرهای توصیه‌شده غیرسرویسی را بدون پرسش اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون پرسش اجرا می‌کند؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و واگذاری‌های اخیر راه‌اندازی مجدد ناظر Gateway را گزارش می‌دهد

نکته‌ها:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes` و `doctor --generate-gateway-token` غیرفعال‌اند، چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) مبتنی بر عامل استفاده کنید.
- پرسش‌های تعاملی (مانند رفع‌های keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم نشده باشد. اجراهای بدون محیط ترمینال (cron، Telegram، بدون پایانه) پرسش‌ها را رد می‌کنند.
- عملکرد: اجراهای غیرتعاملی `doctor` بارگذاری زودهنگام Plugin را رد می‌کنند تا بررسی‌های سلامت بدون محیط ترمینال سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، آن‌ها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار برای `--repair`) یک پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای ناشناخته پیکربندی را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های سرویس Gateway گمشده یا کهنه را گزارش می‌کند، اما آن‌ها را خارج از حالت تعمیر به‌روزرسانی نصب یا بازنویسی نمی‌کند. برای سرویس گمشده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید راه‌انداز را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های رونوشت یتیم را در فهرست نشست‌ها شناسایی می‌کنند. بایگانی کردن آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون محیط ترمینال آن‌ها را سر جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کارهای cron اسکن می‌کند و می‌تواند پیش از آن‌که زمان‌بند مجبور شود هنگام اجرا آن‌ها را خودکار نرمال‌سازی کند، درجا بازنویسی‌شان کند.
- در Linux، doctor وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد؛ این اسکریپت دیگر نگهداری نمی‌شود و وقتی cron محیط user-bus مربوط به systemd را ندارد، می‌تواند قطعی‌های کاذب Gateway مربوط به WhatsApp را ثبت کند.
- وقتی WhatsApp فعال است، doctor وجود حلقه رویداد تنزل‌یافته Gateway را همراه با کلاینت‌های محلی `openclaw-tui` که هنوز در حال اجرا هستند بررسی می‌کند. `doctor --fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند تا پاسخ‌های WhatsApp پشت حلقه‌های تازه‌سازی کهنه TUI در صف نمانند.
- Doctor مرجع‌های مدل قدیمی `openai-codex/*` را در مدل‌های اصلی، fallbackها، بازنویسی‌های Heartbeat/زیرعامل/Compaction، hookها، بازنویسی‌های مدل کانال، و pinهای کهنه مسیر نشست به مرجع‌های کانونی `openai/*` بازنویسی می‌کند. `--fix` نیت Codex را به ورودی‌های `agentRuntime.id: "codex"` در محدوده provider/model منتقل می‌کند، pinهای auth-profile نشست مانند `openai-codex:...` را حفظ می‌کند، pinهای runtime کهنه کل عامل/نشست را حذف می‌کند، و مرجع‌های تعمیرشده عامل OpenAI را به‌جای احراز هویت مستقیم با کلید API مربوط به OpenAI، روی مسیریابی احراز هویت Codex نگه می‌دارد.
- Doctor وضعیت staging وابستگی‌های Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک می‌کند. همچنین Pluginهای قابل‌دانلود گمشده‌ای را که پیکربندی به آن‌ها ارجاع داده تعمیر می‌کند، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات provider/search پیکربندی‌شده، یا runtimeهای عامل پیکربندی‌شده. هنگام به‌روزرسانی بسته، doctor تعمیر Plugin توسط مدیر بسته را تا تکمیل تعویض بسته رد می‌کند؛ اگر یک Plugin پیکربندی‌شده همچنان به بازیابی نیاز دارد، پس از آن دوباره `openclaw doctor --fix` را اجرا کنید. اگر دانلود شکست بخورد، doctor خطای نصب را گزارش می‌کند و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin گمشده از `plugins.allow`/`plugins.entries` تعمیر می‌کند، و همچنین پیکربندی کانال آویزان متناظر، اهداف Heartbeat و بازنویسی‌های مدل کانال را زمانی که کشف Plugin سالم است حذف می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا سایر Pluginها و کانال‌ها بتوانند به اجرا ادامه دهند.
- وقتی ناظر دیگری مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافی شبیه Gateway را که غیرفعال‌اند نادیده می‌گیرد و هنگام تعمیر، فراداده فرمان/entrypoint را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. وقتی عمداً می‌خواهید راه‌انداز فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را خودکار به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت، ترتیب کلیدهای شیء است، نرمال‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه را شامل می‌شود و وقتی credentials مربوط به embedding وجود ندارند، می‌تواند `openclaw configure --section model` را توصیه کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان، حساب اپراتور انسانی مجاز به اجرای فرمان‌های فقط‌مالک و تأیید اقدام‌های خطرناک است. جفت‌سازی DM فقط اجازه می‌دهد کسی با ربات صحبت کند؛ اگر پیش از وجود bootstrap مالک نخست، فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی عامل‌های حالت Codex پیکربندی شده‌اند و دارایی‌های شخصی Codex CLI در خانه Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های app-server محلی Codex از خانه‌های ایزوله برای هر عامل استفاده می‌کنند، پس برای فهرست‌برداری از دارایی‌هایی که باید آگاهانه ترفیع داده شوند از `openclaw migrate codex --dry-run` استفاده کنید.
- Doctor مقدار بازنشسته `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف می‌کند؛ app-server مربوط به Codex همیشه ابزارهای فضای کاری بومی Codex را بومی نگه می‌دارد.
- Doctor وقتی Skills مجاز برای عامل پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون binها، env varها، پیکربندی یا الزامات OS وجود ندارند، هشدار می‌دهد. `doctor --fix` می‌تواند آن Skills ناموجود را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید Skill فعال بماند، به‌جای آن الزام گمشده را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرسیگنال همراه با راهکار اصلاح (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر فایل‌های قدیمی رجیستری sandbox (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به فهرست‌های رجیستری sharded مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شوند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و credentials جایگزین به‌صورت متن ساده نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، doctor به کار ادامه می‌دهد و به‌جای خروج زودهنگام، یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های فهرست وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته‌اند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نیست، هشدار می‌دهد.
- حل خودکار نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن قابل‌حل Telegram در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و حل خودکار را برای آن گذر رد می‌کند.

## macOS: بازنویسی‌های env مربوط به `launchctl`

اگر پیش‌تر `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را بازنویسی می‌کند و می‌تواند باعث خطاهای ماندگار «unauthorized» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor مربوط به Gateway](/fa/gateway/doctor)
