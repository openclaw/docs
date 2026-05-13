---
read_when:
    - دستورهای CLI ClawHub یا رجیستری OpenClaw با شکست مواجه می‌شوند
    - یک بسته را نمی‌توان نصب، منتشر یا به‌روزرسانی کرد
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، همگام‌سازی، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-05-13T05:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور callback محلی کوتاه‌عمر راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی داشته باشد.
- اگر callback هرگز نمی‌رسد، قوانین فایروال محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، در رابط وب ClawHub یک توکن API بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را دربر دارد.
- اگر از توکن API استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات تلاش مجدد را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش مجدد صبر کنید.
- `RateLimit-Remaining` و `RateLimit-Limit`: بودجه فعلی شما.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، محدودیت‌های IP ناشناس ممکن است حتی وقتی هر
فرد فقط چند درخواست می‌فرستد اعمال شوند. هرجا ممکن است وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق است

CLI متغیرهای proxy استاندارد را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک skill در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
```

عیب‌یابی‌های قابل مشاهده برای مالک ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata الزامی ناموفق است

برای skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را بفهمند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا منبع ناموفق است

ClawHub از هویت GitHub و انتساب منبع استفاده می‌کند تا packageها را به
ناشرانشان متصل کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک package است یا می‌تواند آن را
  منتشر کند.
- بررسی کنید URL منبع عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## `sync` می‌گوید هیچ skills پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر خواهد شد، ابتدا پیش‌نمایش بگیرید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی رد می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update <slug> --force
```

- نسخه ویرایش‌شده خود را با یک slug جدید یا fork منتشر کنید.

## نصب Plugin در OpenClaw ناموفق است

- از یک منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا مسدود باشد، ممکن است تا زمانی که
  مالک مشکل را حل کند قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق هستند

- headerهای تلاش مجدد `429` را رعایت کنید و پاسخ‌های عمومی فهرست/جست‌وجو را cache کنید.
- کاربران را به فهرست canonical ClawHub برگردانید.
- محتوای پنهان، خصوصی، نگه‌داشته‌شده یا مسدودشده توسط moderation را خارج از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
