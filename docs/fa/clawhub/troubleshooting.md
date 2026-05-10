---
read_when:
    - دستورهای ClawHub CLI یا رجیستری OpenClaw شکست می‌خورند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، همگام‌سازی، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-05-10T19:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور محلی کوتاه‌عمر برای callback راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین فایروال محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک API token در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات تلاش مجدد را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش مجدد صبر کنید.
- `RateLimit-Remaining` و `RateLimit-Limit`: سهمیه فعلی شما.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان بازنشانی.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است حتی وقتی هر
شخص فقط چند درخواست می‌فرستد، محدودیت‌های IP ناشناس فعال شوند. هر جا ممکن است وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق می‌شود

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک Skills در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک Skills هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
```

تشخیص‌های قابل مشاهده برای مالک ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata الزامی ناموفق می‌شود

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای Pluginها، metadata سازگاری در `package.json` را بررسی کنید. انتشار code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارد.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا خطای source ناموفق می‌شود

ClawHub از هویت GitHub و انتساب source استفاده می‌کند تا packageها را به
ناشرانشان متصل کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک package است یا می‌تواند آن را
  منتشر کند.
- بررسی کنید که URL مربوط به source عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## `sync` می‌گوید هیچ Skills پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به ریشه‌هایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر خواهد شد، ابتدا پیش‌نمایش بگیرید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی امتناع می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده بازنویسی کنید:

```bash
clawhub update <slug> --force
```

- نسخه ویرایش‌شده خود را به‌عنوان یک slug یا fork جدید منتشر کنید.

## نصب یک Plugin در OpenClaw ناموفق می‌شود

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا مسدود شده باشد، ممکن است تا زمانی که
  مالک مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق می‌شوند

- headerهای تلاش مجدد `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing مرجع ClawHub برگردانید.
- محتوای پنهان، خصوصی، نگه‌داشته‌شده یا مسدودشده توسط moderation را خارج از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
