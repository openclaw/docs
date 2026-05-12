---
read_when:
    - فرمان‌های CLI ClawHub یا رجیستری OpenClaw با خطا مواجه می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، همگام‌سازی، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-05-12T23:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور callback محلی کوتاه‌عمر راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، در رابط وب ClawHub یک API token بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب revoke نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Remaining` و `RateLimit-Limit`: بودجه فعلی شما.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، محدودیت‌های IP ناشناس ممکن است حتی وقتی هر
شخص فقط چند درخواست می‌فرستد اعمال شوند. در صورت امکان وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق می‌شود

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک Skills در جست‌وجو نمایش داده نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک Skills هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
```

diagnostics قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهد.

## publish به‌دلیل نبود metadata الزامی ناموفق می‌شود

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای environment و
ابزارهای لازم باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای plugins، metadata سازگاری را در `package.json` بررسی کنید. publish کردن code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارد.

ابتدا payload مربوط به publish را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## publish با خطای GitHub owner یا source ناموفق می‌شود

ClawHub از هویت GitHub و attribution منبع استفاده می‌کند تا packageها را به
publisherهایشان وصل کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را publish کند.
- بررسی کنید که URL منبع عمومی است یا برای ClawHub قابل دسترسی است.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## `sync` می‌گوید هیچ Skills پیدا نشد

`sync` به‌دنبال folderهایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی publish خواهد شد، ابتدا preview کنید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی امتناع می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه publishشده overwrite کنید:

```bash
clawhub update <slug> --force
```

- کپی ویرایش‌شده خود را به‌عنوان slug یا fork جدید publish کنید.

## نصب Plugin در OpenClaw ناموفق می‌شود

- از یک منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه داشته‌شده یا مسدود شده باشد، ممکن است تا زمانی که
  owner مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق می‌شوند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing canonical ClawHub برگردانید.
- محتوای پنهان، خصوصی، نگه داشته‌شده یا مسدودشده با moderation را بیرون از
  سطح API عمومی mirror نکنید.

برای جزئیات endpoint به [HTTP API](/fa/clawhub/http-api) مراجعه کنید.
