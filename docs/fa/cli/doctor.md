---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و یک بررسی سریع می‌خواهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-05T01:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + اصلاحات سریع برای Gateway و کانال‌ها.

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

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی workspace را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون درخواست تأیید می‌پذیرد
- `--repair`: تعمیرهای پیشنهادی غیرسرویسی را بدون درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون prompt اجرا می‌شود؛ فقط مهاجرت‌های ایمن و تعمیرهای غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند

نکات:

- promptهای تعاملی، مانند اصلاحات keychain/OAuth، فقط زمانی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای headless، مانند cron، Telegram و بدون ترمینال، promptها را نادیده می‌گیرند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری زودهنگام Plugin را رد می‌کنند تا بررسی‌های سلامت headless سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، Pluginها را کامل بارگذاری می‌کنند.
- `--fix`، نام مستعار `--repair`، یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- `doctor --fix --non-interactive` تعریف‌های سرویس Gateway را که گم شده یا کهنه هستند گزارش می‌کند، اما بیرون از حالت تعمیر به‌روزرسانی آن‌ها را نصب یا بازنویسی نمی‌کند. برای سرویس گم‌شده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید launcher را جایگزین کنید `openclaw gateway install --force` را اجرا کنید.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در پوشه sessions شناسایی می‌کنند. آرشیو کردن آن‌ها با قالب `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای headless آن‌ها را سر جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` یا `cron.store` را برای شکل‌های قدیمی cron job اسکن می‌کند و می‌تواند پیش از آنکه زمان‌بند مجبور شود آن‌ها را در runtime خودکار نرمال‌سازی کند، همان‌جا بازنویسی‌شان کند.
- در Linux، وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند، doctor هشدار می‌دهد؛ آن اسکریپت دیگر نگهداری نمی‌شود و وقتی cron محیط systemd user-bus را ندارد، می‌تواند قطعی‌های نادرست Gateway مربوط به WhatsApp را log کند.
- Doctor وضعیت staging وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ساخته‌اند پاک‌سازی می‌کند. همچنین Pluginهای قابل دانلود گم‌شده‌ای را که در پیکربندی ارجاع شده‌اند تعمیر می‌کند، مانند `plugins.entries`، کانال‌های پیکربندی‌شده، تنظیمات provider/search پیکربندی‌شده، یا runtimeهای agent پیکربندی‌شده. هنگام به‌روزرسانی package، doctor تعمیر Plugin توسط package-manager را تا تکمیل جابه‌جایی package رد می‌کند؛ اگر یک Plugin پیکربندی‌شده همچنان به بازیابی نیاز دارد، پس از آن `openclaw doctor --fix` را دوباره اجرا کنید. اگر دانلود شکست بخورد، doctor خطای نصب را گزارش می‌کند و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی کهنه Plugin را با حذف شناسه‌های Plugin گم‌شده از `plugins.allow`/`plugins.entries`، به‌همراه پیکربندی کانال آویزان متناظر، هدف‌های Heartbeat و overrideهای مدل کانال، وقتی discovery Plugin سالم باشد، تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی آسیب‌دیده `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا سایر Pluginها و کانال‌ها بتوانند به کار ادامه دهند.
- وقتی supervisor دیگری lifecycle Gateway را مالکیت می‌کند، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس و پاک‌سازی سرویس قدیمی را رد می‌کند.
- در Linux، doctor واحدهای systemd اضافی شبیه Gateway را که inactive هستند نادیده می‌گیرد و هنگام تعمیر، metadata فرمان/entrypoint را برای یک سرویس Gateway در حال اجرا تحت systemd بازنویسی نمی‌کند. ابتدا سرویس را متوقف کنید، یا وقتی عمداً می‌خواهید launcher فعال را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی تخت قدیمی Talk، مانند `talk.voiceId`، `talk.modelId` و موارد مشابه، را به `talk.provider` + `talk.providers.<provider>` خودکار مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای object باشد، نرمال‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه دارد و وقتی credentialهای embedding گم شده باشند، می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان، حساب انسانی operator است که اجازه دارد فرمان‌های فقط-مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. جفت‌سازی DM فقط اجازه می‌دهد کسی با bot صحبت کند؛ اگر پیش از وجود bootstrap مالک اول، یک فرستنده را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی agentهای حالت Codex پیکربندی شده‌اند و assetهای شخصی Codex CLI در خانه Codex متعلق به operator وجود دارند، هشدار می‌دهد. اجرای app-server محلی Codex از خانه‌های جداگانه برای هر agent استفاده می‌کند، پس از `openclaw migrate codex --dry-run` برای فهرست کردن assetهایی استفاده کنید که باید عامدانه ارتقا داده شوند.
- Doctor وقتی skills مجاز برای agent پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون binها، env varها، config یا نیازمندی‌های OS گم شده‌اند، هشدار می‌دهد. `doctor --fix` می‌تواند آن skills غیرقابل‌دسترس را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، در عوض نیازمندی گم‌شده را نصب/پیکربندی کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرسیگنال همراه با راهکار رفع مشکل گزارش می‌کند: `install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`.
- اگر فایل‌های قدیمی registry مربوط به sandbox، یعنی `~/.openclaw/sandbox/containers.json` یا `~/.openclaw/sandbox/browsers.json`، وجود داشته باشند، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به پوشه‌های registry شاردشده مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` توسط SecretRef مدیریت شوند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط-خواندنی گزارش می‌کند و credentialهای fallback متن ساده نمی‌نویسد.
- اگر بررسی SecretRef کانال در مسیر fix شکست بخورد، doctor به‌جای خروج زودهنگام ادامه می‌دهد و یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های پوشه وضعیت، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به fallback محیط وابسته باشند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای فرایند doctor در دسترس نباشد، هشدار می‌دهد.
- auto-resolution نام کاربری `allowFrom` در Telegram (`doctor --fix`) به یک توکن قابل resolve مربوط به Telegram در مسیر فرمان فعلی نیاز دارد. اگر بررسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و auto-resolution را برای آن گذر رد می‌کند.

## macOS: overrideهای env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` یا `...PASSWORD` را اجرا کرده‌اید، آن مقدار فایل پیکربندی شما را override می‌کند و می‌تواند باعث خطاهای پایدار «غیرمجاز» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [doctor مربوط به Gateway](/fa/gateway/doctor)
