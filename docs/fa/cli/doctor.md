---
read_when:
    - مشکلات اتصال/احراز هویت دارید و راهکارهای هدایت‌شده می‌خواهید
    - به‌روزرسانی کرده‌اید و یک بررسی اطمینان می‌خواهید
summary: مرجع CLI برای `openclaw doctor` (بررسی‌های سلامت + تعمیرات راهنمایی‌شده)
title: عیب‌یاب
x-i18n:
    generated_at: "2026-06-27T17:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

بررسی‌های سلامت + رفع سریع برای Gateway و کانال‌ها.

مرتبط:

- عیب‌یابی: [عیب‌یابی](/fa/gateway/troubleshooting)
- ممیزی امنیتی: [امنیت](/fa/gateway/security)

## چرا از آن استفاده کنیم

`openclaw doctor` سطح سلامت OpenClaw است. وقتی Gateway،
کانال‌ها، Pluginها، Skills، مسیریابی مدل، وضعیت محلی، یا مهاجرت‌های پیکربندی
آن‌طور که انتظار می‌رود رفتار نمی‌کنند و یک فرمان می‌خواهید که بتواند توضیح دهد
چه چیزی اشتباه است، از آن استفاده کنید.

Doctor سه وضعیت دارد:

| وضعیت | فرمان                  | رفتار                                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| بازرسی | `openclaw doctor`        | بررسی‌های مناسب انسان و راهنمایی‌های تعاملی.                                       |
| ترمیم  | `openclaw doctor --fix`  | ترمیم‌های پشتیبانی‌شده را اعمال می‌کند، مگر اینکه ترمیم غیرتعاملی ایمن باشد، از راهنمایی‌ها استفاده می‌کند. |
| Lint    | `openclaw doctor --lint` | یافته‌های ساختاریافته فقط‌خواندنی برای CI، پیش‌بررسی، و دروازه‌های بازبینی.              |

وقتی خودکارسازی به نتیجه‌ای پایدار نیاز دارد، `--lint` را ترجیح دهید. وقتی یک
اپراتور انسانی عمداً می‌خواهد doctor پیکربندی یا وضعیت را ویرایش کند، `--fix` را ترجیح دهید.

## نمونه‌ها

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

برای مجوزهای ویژه کانال، به‌جای `doctor` از پروب‌های کانال استفاده کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

پروب هدفمند قابلیت‌های Discord مجوزهای مؤثر کانالی bot را گزارش می‌کند؛ پروب وضعیت، کانال‌های Discord پیکربندی‌شده و هدف‌های پیوستن خودکار صوتی را ممیزی می‌کند.

## گزینه‌ها

- `--no-workspace-suggestions`: پیشنهادهای حافظه/جست‌وجوی فضای کاری را غیرفعال می‌کند
- `--yes`: پیش‌فرض‌ها را بدون نمایش درخواست تأیید می‌پذیرد
- `--repair`: ترمیم‌های غیرسرویسی توصیه‌شده را بدون نمایش درخواست تأیید اعمال می‌کند؛ نصب‌ها و بازنویسی‌های سرویس Gateway همچنان به تأیید تعاملی یا فرمان‌های صریح Gateway نیاز دارند
- `--fix`: نام مستعار برای `--repair`
- `--force`: ترمیم‌های تهاجمی را اعمال می‌کند، از جمله بازنویسی پیکربندی سفارشی سرویس در صورت نیاز
- `--non-interactive`: بدون درخواست‌های تعاملی اجرا می‌شود؛ فقط مهاجرت‌های ایمن و ترمیم‌های غیرسرویسی
- `--generate-gateway-token`: یک توکن Gateway تولید و پیکربندی می‌کند
- `--allow-exec`: به doctor اجازه می‌دهد هنگام راستی‌آزمایی اسرار، SecretRefهای exec پیکربندی‌شده را اجرا کند
- `--deep`: سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند و واگذاری‌های اخیر راه‌اندازی مجدد ناظر Gateway را گزارش می‌دهد
- `--lint`: بررسی‌های سلامت مدرن‌شده را در حالت فقط‌خواندنی اجرا می‌کند و یافته‌های تشخیصی منتشر می‌کند
- `--post-upgrade`: پروب‌های سازگاری Plugin پس از ارتقا را اجرا می‌کند؛ یافته‌ها را در stdout منتشر می‌کند؛ اگر هر یافته در سطح خطا وجود داشته باشد با کد 1 خارج می‌شود
- `--json`: همراه با `--lint`، به‌جای خروجی انسانی یافته‌های JSON منتشر می‌کند؛ همراه با `--post-upgrade`، یک پاکت JSON قابل خواندن توسط ماشین منتشر می‌کند (`{ probesRun, findings }`)
- `--severity-min <level>`: همراه با `--lint`، یافته‌های پایین‌تر از `info`، `warning`، یا `error` را حذف می‌کند
- `--all`: همراه با `--lint`، همه بررسی‌های ثبت‌شده را اجرا می‌کند، از جمله بررسی‌های opt-in که از مجموعه خودکارسازی پیش‌فرض حذف شده‌اند
- `--skip <id>`: همراه با `--lint`، یک شناسه بررسی را رد می‌کند؛ برای رد کردن بیش از یکی تکرار کنید
- `--only <id>`: همراه با `--lint`، فقط یک شناسه بررسی را اجرا می‌کند؛ برای اجرای یک مجموعه کوچک منتخب تکرار کنید

## حالت Lint

`openclaw doctor --lint` وضعیت خودکارسازی فقط‌خواندنی برای بررسی‌های doctor است.
از مسیر ساختاریافته بررسی سلامت استفاده می‌کند، درخواست تعاملی نشان نمی‌دهد، و
پیکربندی/وضعیت را ترمیم یا بازنویسی نمی‌کند. وقتی به‌جای درخواست‌های ترمیم راهنمایی‌شده
یافته‌های قابل خواندن توسط ماشین می‌خواهید، از آن در CI، اسکریپت‌های پیش‌بررسی، و جریان‌های کاری بازبینی استفاده کنید.
گزینه‌های خروجی Lint مانند `--json`، `--severity-min`، `--all`، `--only`، و `--skip`
فقط همراه با `--lint` پذیرفته می‌شوند.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

خروجی انسانی فشرده است:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

خروجی JSON سطح اسکریپت‌نویسی برای اجراهای lint است:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

رفتار خروج:

- `0`: هیچ یافته‌ای در آستانه شدت انتخاب‌شده یا بالاتر از آن وجود ندارد
- `1`: دست‌کم یک یافته با آستانه انتخاب‌شده مطابقت دارد
- `2`: شکست فرمان/زمان اجرا پیش از آنکه یافته‌های lint بتوانند تولید شوند

`--severity-min` هم یافته‌های قابل مشاهده و هم آستانه خروج را کنترل می‌کند. برای
مثال، `openclaw doctor --lint --severity-min error` می‌تواند هیچ یافته‌ای چاپ نکند و
حتی وقتی یافته‌های `info` یا `warning` با شدت پایین‌تر وجود دارند با `0` خارج شود.

`--all` کنترل می‌کند کدام بررسی‌ها پیش از فیلتر شدت انتخاب شوند. اجرای پیش‌فرض lint
دروازه خودکارسازی پایدار است و بررسی‌هایی را حذف می‌کند که عمداً opt-in هستند، چون
عمیق، تاریخی، یا محتمل‌تر برای آشکار کردن باقی‌مانده‌های legacy قابل ترمیم هستند.
وقتی فهرست کامل lint را بدون فهرست کردن هر شناسه بررسی می‌خواهید، از `--all` استفاده کنید.
`--only <id>` همچنان دقیق‌ترین انتخابگر است و می‌تواند هر بررسی ثبت‌شده را بر اساس شناسه اجرا کند.

## بررسی‌های سلامت ساختاریافته

بررسی‌های مدرن doctor از یک قرارداد ساختاریافته کوچک استفاده می‌کنند:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` نیروی محرک `doctor --lint` است. `repair()` اختیاری است و فقط توسط
`doctor --fix` / `doctor --repair` در نظر گرفته می‌شود. بررسی‌هایی که هنوز به این
شکل مهاجرت نکرده‌اند، همچنان از جریان contribution قدیمی doctor استفاده می‌کنند.

این جداسازی عمدی است: `detect()` مالک تشخیص است، در حالی که `repair()` مالک
گزارش آن چیزی است که تغییر داده یا تغییر می‌دهد. زمینه‌های ترمیم می‌توانند
درخواست‌های `dryRun`/`diff` را حمل کنند، و نتایج ترمیم می‌توانند `diffs` ساختاریافته برای
ویرایش‌های config/file به‌علاوه `effects` برای سرویس، فرایند، بسته، وضعیت، یا
اثرهای جانبی دیگر برگردانند. این به بررسی‌های تبدیل‌شده اجازه می‌دهد به‌سمت
`doctor --fix --dry-run` و گزارش diff رشد کنند، بدون اینکه برنامه‌ریزی mutation به `detect()` منتقل شود.

`repair()` گزارش می‌دهد که آیا ترمیم درخواست‌شده را با `status:
"repaired" | "skipped" | "failed"` تلاش کرده است یا نه. حذف status یعنی `repaired`، بنابراین بررسی‌های
ترمیم ساده فقط باید تغییرات را برگردانند. وقتی repair مقدار `skipped` یا
`failed` برمی‌گرداند، doctor دلیل را گزارش می‌کند و اعتبارسنجی را برای آن بررسی اجرا نمی‌کند.

پس از یک ترمیم ساختاریافته موفق، doctor دوباره `detect()` را با
یافته‌های ترمیم‌شده به‌عنوان scope اجرا می‌کند. بررسی‌ها می‌توانند از یافته‌های انتخاب‌شده، مسیرها، یا مقدارهای `ocPath`
برای اعتبارسنجی متمرکز استفاده کنند. اگر یافته هنوز وجود داشته باشد، doctor به‌جای اینکه تغییر را بی‌صدا کامل‌شده تلقی کند، یک
هشدار ترمیم گزارش می‌کند.

یک یافته شامل موارد زیر است:

| فیلد             | هدف                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | شناسه پایدار برای فیلترهای skip/only و allowlistهای CI.     |
| `severity`        | `info`، `warning`، یا `error`.                         |
| `message`         | بیان مسئله قابل خواندن برای انسان.                      |
| `path`            | مسیر پیکربندی، فایل، یا مسیر منطقی در صورت وجود.          |
| `line` / `column` | مکان منبع در صورت وجود.                        |
| `ocPath`          | نشانی دقیق `oc://` وقتی یک بررسی بتواند به آن اشاره کند. |
| `fixHint`         | اقدام پیشنهادی اپراتور یا خلاصه ترمیم.           |

بررسی‌های مدرن‌شده core doctor به contribution مرتب‌شده doctor متصل می‌مانند
که مالک رفتار انسانی `doctor` / `doctor --fix` آن‌ها است. رجیستری مشترک
سلامت ساختاریافته نقطه extension است: بررسی‌های bundled و متکی به Plugin
پس از بررسی‌های core doctor اجرا می‌شوند، وقتی package مالک آن‌ها را در مسیر فعال
فرمان ثبت کند. زیرمسیر `openclaw/plugin-sdk/health` همان
قرارداد را برای آن مصرف‌کنندگان extension ارائه می‌کند.

## انتخاب بررسی

وقتی یک جریان کاری یک دروازه متمرکز می‌خواهد، از `--only` و `--skip` استفاده کنید:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` و `--skip` شناسه‌های کامل بررسی را می‌پذیرند و می‌توانند تکرار شوند. اگر یک شناسه `--only`
ثبت نشده باشد، هیچ بررسی‌ای برای آن شناسه اجرا نمی‌شود؛ از فیلدهای `checksRun`
و `checksSkipped` فرمان استفاده کنید تا راستی‌آزمایی کنید یک دروازه متمرکز بررسی‌هایی را که
انتظار دارید انتخاب می‌کند.

## حالت پس از ارتقا

`openclaw doctor --post-upgrade` پروب‌های سازگاری Plugin را اجرا می‌کند که قرار است
پس از build یا ارتقا زنجیره شوند. یافته‌ها در stdout منتشر می‌شوند؛ اگر هر یافته
دارای `level: "error"` باشد، فرمان با کد 1 خارج می‌شود. برای دریافت یک
پاکت قابل خواندن توسط ماشین (`{ probesRun, findings }`) مناسب برای CI،
Skill جامعه `fork-upgrade`، و ابزارهای smoke پس از ارتقا، `--json` را اضافه کنید. اگر
شاخص Plugin نصب‌شده وجود نداشته باشد یا بدشکل باشد، حالت JSON همچنان آن
پاکت را همراه با یک یافته خطای `plugin.index_unavailable` منتشر می‌کند.

یادداشت‌ها:

- در حالت Nix (`OPENCLAW_NIX_MODE=1`)، بررسی‌های فقط‌خواندنی doctor همچنان کار می‌کنند، اما `doctor --fix`، `doctor --repair`، `doctor --yes` و `doctor --generate-gateway-token` غیرفعال‌اند، چون `openclaw.json` تغییرناپذیر است. به‌جای آن، منبع Nix این نصب را ویرایش کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
- اعلان‌های تعاملی (مثل اصلاحات keychain/OAuth) فقط زمانی اجرا می‌شوند که stdin یک TTY باشد و `--non-interactive` تنظیم **نشده** باشد. اجراهای headless (cron، Telegram، بدون ترمینال) اعلان‌ها را رد می‌کنند.
- عملکرد: اجراهای غیرتعاملی `doctor` بارگذاری مشتاقانه Plugin را رد می‌کنند تا بررسی‌های سلامت headless سریع بمانند. نشست‌های تعاملی doctor همچنان سطح‌های Plugin موردنیاز جریان سلامت و تعمیر قدیمی را بارگذاری می‌کنند.
- `--lint` از `--non-interactive` سخت‌گیرانه‌تر است: همیشه فقط‌خواندنی است، هرگز اعلان نمی‌دهد، و هرگز مهاجرت‌های ایمن را اعمال نمی‌کند. وقتی می‌خواهید doctor تغییر ایجاد کند، `doctor --fix` یا `doctor --repair` را اجرا کنید.
- به‌طور پیش‌فرض، doctor هنگام بررسی secretها SecretRefهای `exec` را اجرا نمی‌کند. فقط زمانی از `openclaw doctor --allow-exec` یا `openclaw doctor --lint --allow-exec` استفاده کنید که عمداً می‌خواهید doctor آن حل‌کننده‌های secret پیکربندی‌شده را اجرا کند.
- `--fix` (نام مستعار برای `--repair`) یک نسخه پشتیبان در `~/.openclaw/openclaw.json.bak` می‌نویسد و کلیدهای پیکربندی ناشناخته را حذف می‌کند و هر حذف را فهرست می‌کند.
- بررسی‌های سلامت نوسازی‌شده می‌توانند یک مسیر `repair()` برای `doctor --fix` ارائه کنند؛ بررسی‌هایی که چنین مسیری ارائه نمی‌کنند از طریق جریان تعمیر موجود doctor ادامه می‌یابند.
- `doctor --fix --non-interactive` تعریف‌های Gateway service گم‌شده یا قدیمی را گزارش می‌کند، اما خارج از حالت تعمیر به‌روزرسانی آن‌ها را نصب یا بازنویسی نمی‌کند. برای service گم‌شده `openclaw gateway install` را اجرا کنید، یا وقتی عمداً می‌خواهید launcher را جایگزین کنید از `openclaw gateway install --force` استفاده کنید.
- بررسی‌های یکپارچگی state اکنون فایل‌های transcript یتیم را در دایرکتوری sessions تشخیص می‌دهند. بایگانی کردن آن‌ها با قالب `.deleted.<timestamp>` به تأیید تعاملی نیاز دارد؛ `--fix`، `--yes` و اجراهای headless آن‌ها را در جای خود باقی می‌گذارند.
- Doctor همچنین `~/.openclaw/cron/jobs.json` (یا `cron.store`) را برای شکل‌های قدیمی cron job اسکن می‌کند و پیش از وارد کردن ردیف‌های canonical به SQLite آن‌ها را بازنویسی می‌کند.
- Doctor cron jobهایی را که overrideهای صریح `payload.model` دارند گزارش می‌کند، از جمله شمارش‌های namespace ارائه‌دهنده و ناهمخوانی‌ها با `agents.defaults.model`، تا jobهای زمان‌بندی‌شده‌ای که مدل پیش‌فرض را به ارث نمی‌برند هنگام بررسی‌های auth یا billing قابل مشاهده باشند.
- در Linux، وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند، doctor هشدار می‌دهد؛ آن script دیگر نگهداری نمی‌شود و وقتی cron محیط systemd user-bus را ندارد می‌تواند قطعی‌های کاذب WhatsApp gateway را ثبت کند.
- وقتی WhatsApp فعال است، doctor یک Gateway event loop تنزل‌یافته را با clientهای محلی `openclaw-tui` که هنوز اجرا هستند بررسی می‌کند. `doctor --fix` فقط clientهای محلی TUI تأییدشده را متوقف می‌کند تا پاسخ‌های WhatsApp پشت refresh loopهای قدیمی TUI در صف نمانند.
- Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را در سراسر مدل‌های اصلی، fallbackها، مدل‌های تولید image/video، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل channel و pinهای قدیمی مسیر session به ارجاع‌های canonical `openai/*` بازنویسی می‌کند. `--fix` همچنین پروفایل‌های auth قدیمی `openai-codex:*` و ورودی‌های `auth.order.openai-codex` را به `openai:*` مهاجرت می‌دهد، intent مربوط به Codex را به ورودی‌های `agentRuntime.id: "codex"` محدود به provider/model منتقل می‌کند، pinهای runtime کل agent/session قدیمی را حذف می‌کند، و ارجاع‌های تعمیرشده agent مربوط به OpenAI را به‌جای auth مستقیم OpenAI API-key روی مسیریابی auth مربوط به Codex نگه می‌دارد.
- Doctor state مرحله‌بندی وابستگی Plugin قدیمی را که نسخه‌های قدیمی‌تر OpenClaw ایجاد کرده‌اند پاک می‌کند و package میزبان `openclaw` را برای Pluginهای npm مدیریت‌شده‌ای که آن را به‌عنوان peer dependency اعلام می‌کنند دوباره link می‌کند. همچنین Pluginهای دانلودشدنی گم‌شده‌ای را که پیکربندی به آن‌ها ارجاع داده است تعمیر می‌کند، مانند `plugins.entries`، channelهای پیکربندی‌شده، تنظیمات provider/search پیکربندی‌شده، یا runtimeهای agent پیکربندی‌شده. هنگام به‌روزرسانی package، doctor تعمیر Plugin مربوط به package-manager را تا کامل شدن جابه‌جایی package رد می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از آن `openclaw doctor --fix` را دوباره اجرا کنید. اگر دانلود شکست بخورد، doctor خطای نصب را گزارش می‌کند و ورودی Plugin پیکربندی‌شده را برای تلاش تعمیر بعدی حفظ می‌کند.
- Doctor پیکربندی قدیمی Plugin را با حذف plugin idهای گم‌شده از `plugins.allow`/`plugins.deny`/`plugins.entries`، به‌علاوه پیکربندی channel آویزان متناظر، هدف‌های Heartbeat، و overrideهای مدل channel، زمانی که کشف Plugin سالم است تعمیر می‌کند.
- Doctor پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی `plugins.entries.<id>` آسیب‌دیده و حذف payload نامعتبر `config` آن قرنطینه می‌کند. راه‌اندازی Gateway از قبل فقط همان Plugin خراب را رد می‌کند تا سایر Pluginها و channelها بتوانند به اجرا ادامه دهند.
- وقتی supervisor دیگری چرخه‌عمر gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید. Doctor همچنان سلامت gateway/service را گزارش می‌کند و تعمیرهای غیر service را اعمال می‌کند، اما نصب/شروع/restart/bootstrap service و پاکسازی service قدیمی را رد می‌کند.
- در Linux، doctor unitهای systemd اضافی و غیرفعال شبیه gateway را نادیده می‌گیرد و هنگام تعمیر، metadata مربوط به command/entrypoint را برای یک Gateway service در حال اجرای systemd بازنویسی نمی‌کند. وقتی عمداً می‌خواهید launcher فعال را جایگزین کنید، ابتدا service را متوقف کنید یا از `openclaw gateway install --force` استفاده کنید.
- Doctor پیکربندی flat Talk قدیمی (`talk.voiceId`، `talk.modelId`، و موارد مشابه) را خودکار به `talk.provider` + `talk.providers.<provider>` مهاجرت می‌دهد.
- اجراهای تکراری `doctor --fix` دیگر وقتی تنها تفاوت ترتیب کلیدهای object است، normalization مربوط به Talk را گزارش/اعمال نمی‌کنند.
- Doctor یک بررسی آمادگی memory-search را شامل می‌شود و وقتی credentialهای embedding گم شده‌اند می‌تواند `openclaw configure --section model` را پیشنهاد کند.
- Doctor وقتی هیچ مالک command پیکربندی نشده باشد هشدار می‌دهد. مالک command همان حساب operator انسانی است که اجازه دارد commandهای فقط‌مالک را اجرا کند و actionهای خطرناک را تأیید کند. DM pairing فقط به کسی اجازه می‌دهد با bot صحبت کند؛ اگر پیش از وجود bootstrap مالک اول، یک sender را تأیید کرده‌اید، `commands.ownerAllowFrom` را صریح تنظیم کنید.
- Doctor وقتی agentهای حالت Codex پیکربندی شده‌اند و assetهای شخصی Codex CLI در Codex home مربوط به operator وجود دارند، یک یادداشت info گزارش می‌کند. راه‌اندازی‌های local Codex app-server از homeهای جداگانه برای هر agent استفاده می‌کنند، بنابراین در صورت نیاز ابتدا Codex plugin را نصب کنید، سپس از `openclaw migrate plan codex` برای inventory کردن assetهایی استفاده کنید که باید عامدانه ارتقا داده شوند.
- Doctor مقدار بازنشسته `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف می‌کند؛ Codex app-server همیشه ابزارهای workspace بومی Codex را native نگه می‌دارد.
- Doctor وقتی Skills مجاز برای agent پیش‌فرض در محیط runtime فعلی در دسترس نیستند، چون binها، env varها، config یا الزامات OS گم شده‌اند، هشدار می‌دهد. `doctor --fix` می‌تواند آن Skills در دسترس‌نبودنی را با `skills.entries.<skill>.enabled=false` غیرفعال کند؛ وقتی می‌خواهید skill فعال بماند، به‌جای آن نیازمندی گم‌شده را نصب/پیکربندی کنید.
- اگر sandbox mode فعال باشد اما Docker در دسترس نباشد، doctor یک هشدار پرسیگنال با remediation (`install Docker` یا `openclaw config set agents.defaults.sandbox.mode off`) گزارش می‌کند.
- اگر فایل‌های registry قدیمی sandbox یا دایرکتوری‌های shard وجود داشته باشند (`~/.openclaw/sandbox/containers.json`، `~/.openclaw/sandbox/browsers.json`، `~/.openclaw/sandbox/containers/`، یا `~/.openclaw/sandbox/browsers/`)، doctor آن‌ها را گزارش می‌کند؛ `openclaw doctor --fix` ورودی‌های معتبر را به SQLite مهاجرت می‌دهد و فایل‌های قدیمی نامعتبر را قرنطینه می‌کند.
- اگر `gateway.auth.token`/`gateway.auth.password` با SecretRef مدیریت شده باشند و در مسیر command فعلی در دسترس نباشند، doctor یک هشدار فقط‌خواندنی گزارش می‌کند و credentialهای fallback به‌صورت plaintext نمی‌نویسد. برای SecretRefهای پشتیبانی‌شده با exec، doctor اجرا را رد می‌کند مگر اینکه `--allow-exec` وجود داشته باشد.
- اگر بازرسی SecretRef مربوط به channel در مسیر fix شکست بخورد، doctor به‌جای خروج زودهنگام ادامه می‌دهد و یک هشدار گزارش می‌کند.
- پس از مهاجرت‌های دایرکتوری state، doctor وقتی حساب‌های پیش‌فرض فعال Telegram یا Discord به env fallback وابسته‌اند و `TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN` برای process مربوط به doctor در دسترس نیست، هشدار می‌دهد.
- auto-resolution نام کاربری Telegram در `allowFrom` (`doctor --fix`) به یک token قابل resolve مربوط به Telegram در مسیر command فعلی نیاز دارد. اگر بازرسی token در دسترس نباشد، doctor یک هشدار گزارش می‌کند و auto-resolution را برای آن گذر رد می‌کند.

## macOS: overrideهای env مربوط به `launchctl`

اگر قبلاً `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (یا `...PASSWORD`) را اجرا کرده باشید، آن مقدار فایل config شما را override می‌کند و می‌تواند باعث خطاهای پایدار "unauthorized" شود.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Gateway doctor](/fa/gateway/doctor)
