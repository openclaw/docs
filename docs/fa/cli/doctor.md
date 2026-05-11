---
read_when:
    - مشکلات اتصال/احراز هویت دارید و می‌خواهید با راهنمایی آن‌ها را برطرف کنید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی اولیه انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-11T20:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع سریع مشکلات برای Gateway و کانال‌ها.

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

برای مجوزهای مختص کانال، به‌جای `doctor` از پروب‌های کانال استفاده کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

پروب هدفمند قابلیت‌های Discord مجوزهای مؤثر کانال برای ربات را گزارش می‌کند؛ پروب وضعیت، کانال‌های پیکربندی‌شده Discord و هدف‌های پیوستن خودکار صوتی را ممیزی می‌کند.

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی workspace را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون پرسش می‌پذیرد
- `--repair`: تعمیرهای پیشنهادی غیرسرویسی را بدون پرسش اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون اعلان اجرا می‌کند؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و handoffهای اخیر راه‌اندازی مجدد supervisor در Gateway را گزارش می‌دهد

نکته‌ها:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes`، و `doctor --generate-gateway-token` غیرفعال‌اند چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
- اعلان‌های تعاملی (مانند رفع مشکلات keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- کارایی: اجرای غیرتعاملی `doctor` بارگذاری زودهنگام Plugin را رد می‌کند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های مفقود یا کهنه سرویس Gateway را گزارش می‌دهد، اما خارج از حالت تعمیر به‌روزرسانی آن‌ها را نصب یا بازنویسی نمی‌کند. برای سرویس مفقود، `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید launcher را جایگزین کنید، `openclaw gateway install --force` را اجرا کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در پوشه نشست‌ها تشخیص می‌دهند. آرشیو کردن آن‌ها با نام `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes`، و اجراهای بدون رابط آن‌ها را سر جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی کار Cron اسکن می‌کند و می‌تواند پیش از آنکه scheduler مجبور شود در زمان اجرا آن‌ها را خودکار نرمال‌سازی کند، آن‌ها را درجا بازنویسی کند.
- در Linux، doctor وقتی crontab کاربر همچنان `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا کند هشدار می‌دهد؛ این اسکریپت دیگر نگهداری نمی‌شود و وقتی cron محیط systemd user-bus را ندارد می‌تواند قطعی‌های نادرست Gateway برای WhatsApp را ثبت کند.
- وقتی WhatsApp فعال باشد، doctor وجود event loop تضعیف‌شده Gateway را با کلاینت‌های محلی `openclaw-tui` که هنوز اجرا هستند بررسی می‌کند. `doctor --fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند تا پاسخ‌های WhatsApp پشت حلقه‌های تازه‌سازی کهنه TUI در صف نمانند.
- Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و route pinهای کهنه نشست به ارجاع‌های canonical `openai/*` بازنویسی می‌کند. `--fix` نیت Codex را به ورودی‌های provider/model-scoped `agentRuntime.id: "codex"` منتقل می‌کند، pinهای auth-profile نشست مانند `openai-codex:...` را حفظ می‌کند، runtime pinهای کهنه whole-agent/session را حذف می‌کند، و ارجاع‌های تعمیرشده عامل OpenAI را به‌جای auth مستقیم با OpenAI API-key روی مسیریابی auth در Codex نگه می‌دارد.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ساخته‌اند پاک‌سازی می‌کند. همچنین Pluginهای قابل‌دانلود مفقودی را که پیکربندی به آن‌ها ارجاع می‌دهد، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات provider/search پیکربندی‌شده، یا runtimeهای عامل پیکربندی‌شده، تعمیر می‌کند. هنگام به‌روزرسانی بسته، doctor تعمیر Plugin مربوط به package-manager را تا تکمیل تعویض بسته رد می‌کند؛ اگر Plugin پیکربندی‌شده‌ای همچنان به بازیابی نیاز دارد، پس از آن دوباره `openclaw doctor --fix` را اجرا کنید. اگر دانلود شکست بخورد، doctor خطای نصب را گزارش می‌دهد و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin مفقود از `plugins.allow`/`plugins.deny`/`plugins.entries`، به‌همراه پیکربندی کانال معلق متناظر، هدف‌های Heartbeat، و overrideهای مدل کانال، وقتی کشف Plugin سالم است تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند به اجرا ادامه دهند.
- وقتی supervisor دیگری مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd غیرفعال اضافی شبیه Gateway را نادیده می‌گیرد و هنگام تعمیر، metadata فرمان/entrypoint را برای سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. ابتدا سرویس را متوقف کنید یا وقتی عمداً می‌خواهید launcher فعال را جایگزین کنید، از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk (`talk.voiceId`، `talk.modelId`، و موارد مشابه) را به `talk.provider` + `talk.providers.<provider>` خودکار مهاجرت می‌دهد.
- اجرای تکراری `doctor --fix` وقتی تنها تفاوت، ترتیب کلیدهای object باشد، دیگر نرمال‌سازی Talk را گزارش/اعمال نمی‌کند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه را شامل می‌شود و وقتی credentialهای embedding مفقود باشند، می‌تواند `openclaw configure --section model` را توصیه کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط‌مالک را اجرا کند و اقدامات خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد کسی با ربات صحبت کند؛ اگر پیش از وجود bootstrap مالک اول، فرستنده‌ای را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی عامل‌های حالت Codex پیکربندی شده‌اند و assetهای شخصی Codex CLI در home مربوط به Codex اپراتور وجود دارند هشدار می‌دهد. راه‌اندازی‌های محلی app-server در Codex از homeهای جداشده برای هر عامل استفاده می‌کنند، بنابراین برای فهرست‌برداری از assetهایی که باید آگاهانه ارتقا داده شوند، از `openclaw migrate codex --dry-run` استفاده کنید.
- Doctor گزینه بازنشسته `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف می‌کند؛ app-server در Codex همیشه ابزارهای workspace بومی Codex را بومی نگه می‌دارد.
- Doctor وقتی Skills مجاز برای عامل پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون binها، env varها، config، یا نیازمندی‌های OS مفقودند، هشدار می‌دهد. `doctor --fix` می‌تواند آن Skills ناموجود را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید Skill فعال بماند، نیازمندی مفقود را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار high-signal همراه با راهکار رفع گزارش می‌دهد (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`).
- اگر فایل‌های registry قدیمی sandbox (`~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`) وجود داشته باشند، doctor آن‌ها را گزارش می‌دهد؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های registry شاردشده مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` تحت مدیریت SecretRef باشند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌دهد و credentialهای fallback متن ساده نمی‌نویسد.
- اگر بازرسی SecretRef کانال در مسیر fix شکست بخورد، doctor به کار ادامه می‌دهد و به‌جای خروج زودهنگام، هشدار گزارش می‌دهد.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به env fallback وابسته‌اند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نیست، هشدار می‌دهد.
- auto-resolution نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن Telegram قابل‌حل در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor هشدار گزارش می‌دهد و auto-resolution را برای آن گذر رد می‌کند.

## macOS: overrideهای env در `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را override می‌کند و می‌تواند باعث خطاهای ماندگار «unauthorized» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [doctor Gateway](/fa/gateway/doctor)
