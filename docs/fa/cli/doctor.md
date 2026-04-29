---
read_when:
    - با مشکلات اتصال/احراز هویت روبه‌رو هستید و راه‌حل‌های راهنمایی‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و می‌خواهید یک بررسی سریع صحت انجام دهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + ترمیم‌های هدایت‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-04-29T22:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع‌اشکال‌های سریع برای Gateway و کانال‌ها.

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
- `--yes`: پیش‌فرض‌ها را بدون پرسش می‌پذیرد
- `--repair`: تعمیرهای پیشنهادی را بدون پرسش اعمال می‌کند
- `--fix`: نام مستعار برای `--repair`
- `--force`: تعمیرهای تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون prompt اجرا می‌شود؛ فقط مهاجرت‌های امن
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند

نکته‌ها:

- promptهای تعاملی (مانند رفع مشکلات keychain/OAuth) فقط وقتی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای بدون رابط (cron، Telegram، بدون ترمینال) promptها را رد می‌کنند.
- کارایی: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Plugin را رد می‌کنند تا بررسی‌های سلامت بدون رابط سریع بمانند. نشست‌های تعاملی همچنان وقتی یک بررسی به مشارکت Pluginها نیاز داشته باشد، آن‌ها را کامل بارگذاری می‌کنند.
- `--fix` (نام مستعار برای `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- بررسی‌های یکپارچگی وضعیت اکنون فایل‌های transcript یتیم را در پوشه sessions شناسایی می‌کنند. بایگانی کردن آن‌ها به‌صورت `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای بدون رابط آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی jobهای cron اسکن می‌کند و می‌تواند پیش از آنکه scheduler مجبور شود هنگام اجرا آن‌ها را خودکار نرمال‌سازی کند، همان‌جا بازنویسی‌شان کند.
- Doctor وابستگی‌های runtime گمشده Pluginهای bundled را بدون نوشتن در نصب‌های global بسته‌بندی‌شده تعمیر می‌کند. برای نصب‌های npm متعلق به root یا unitهای systemd سخت‌سازی‌شده، `OPENCLAW_PLUGIN_STAGE_DIR` را روی یک پوشه قابل‌نوشتن مانند `/var/lib/openclaw/plugin-runtime-deps` تنظیم کنید؛ همچنین می‌تواند یک فهرست مسیر مانند `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` باشد، که rootهای قبلی لایه‌های lookup فقط‌خواندنی هستند و root نهایی هدف تعمیر است.
- Doctor پیکربندی stale Plugin را با حذف idهای Plugin گمشده از `plugins.allow`/`plugins.entries`، به‌همراه پیکربندی dangling متناظر کانال، هدف‌های Heartbeat و overrideهای مدل کانال، وقتی کشف Plugin سالم است تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی affected `plugins.entries.<id>` و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا Pluginها و کانال‌های دیگر بتوانند همچنان اجرا شوند.
- وقتی supervisor دیگری مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت Gateway/سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اعمال می‌کند، اما نصب/شروع/راه‌اندازی‌مجدد/bootstrap سرویس و پاک‌سازی سرویس legacy را رد می‌کند.
- در Linux، doctor unitهای systemd غیرفعال اضافی شبیه Gateway را نادیده می‌گیرد و هنگام تعمیر، metadata فرمان/entrypoint را برای یک سرویس Gateway در حال اجرای systemd بازنویسی نمی‌کند. وقتی عمداً می‌خواهید launcher فعال را جایگزین کنید، ابتدا سرویس را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی flat legacy مربوط به Talk (`talk.voiceId`، `talk.modelId` و موارد مشابه) را به `talk.provider` + `talk.providers.<provider>` خودکار مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای object باشد، نرمال‌سازی Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی جست‌وجوی حافظه دارد و وقتی credentialهای embedding گم باشند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک فرمانی پیکربندی نشده باشد هشدار می‌دهد. مالک فرمان، حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط‌مالک را اجرا کند و اقدام‌های خطرناک را تأیید کند. جفت‌سازی DM فقط به کسی اجازه می‌دهد با bot صحبت کند؛ اگر پیش از وجود bootstrap اولین مالک یک فرستنده را تأیید کرده‌اید، `commands.ownerAllowFrom` را صراحتاً تنظیم کنید.
- اگر حالت sandbox فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرمعنا همراه با راهکار رفع (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شده باشند و در مسیر فرمان فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و credentialهای fallback متن‌آشکار نمی‌نویسد.
- اگر بازرسی SecretRef کانال در یک مسیر fix شکست بخورد، doctor ادامه می‌دهد و به‌جای خروج زودهنگام، یک هشدار گزارش می‌کند.
- auto-resolution نام کاربری Telegram در `allowFrom` (`doctor --fix`) به یک توکن Telegram قابل resolve در مسیر فرمان فعلی نیاز دارد. اگر بازرسی توکن در دسترس نباشد، doctor یک هشدار گزارش می‌کند و auto-resolution را برای آن اجرا رد می‌کند.

## macOS: overrideهای env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده باشید، آن مقدار فایل پیکربندی شما را override می‌کند و می‌تواند باعث خطاهای persistent «unauthorized» شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Doctor مربوط به Gateway](/fa/gateway/doctor)
