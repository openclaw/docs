---
read_when:
    - فرمان‌های CLI ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به سیستم، نصب، انتشار، همگام‌سازی، به‌روزرسانی و API در ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:58:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود از طریق مرورگر، یک سرور callback محلی کوتاه‌عمر راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک API token در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب revoke نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از retry منتظر بمانید.
- `RateLimit-Remaining` و `RateLimit-Limit`: بودجه فعلی شما.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، حتی وقتی هر نفر فقط چند درخواست
ارسال می‌کند، ممکن است به محدودیت‌های IP ناشناس برسید. هرجا ممکن است وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق است

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک Skills در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر owner آن Skills هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
```

diagnosticهای قابل‌مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## publish به‌دلیل نبود metadata موردنیاز ناموفق است

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای موردنیاز باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای Pluginها، metadata سازگاری `package.json` را بررسی کنید. publish کردن code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارد.

ابتدا payload انتشار را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## publish با خطای GitHub owner یا source ناموفق است

ClawHub از هویت GitHub و انتساب source استفاده می‌کند تا packageها را به
publisherهایشان متصل کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که owner package است یا می‌تواند آن را publish کند.
- بررسی کنید که URL منبع عمومی باشد یا برای ClawHub قابل‌دسترسی باشد.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## `sync` می‌گوید هیچ Skillsی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به rootهایی که می‌خواهید scan کنید اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی publish خواهد شد، ابتدا preview کنید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی رد می‌شود

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update <slug> --force
```

- نسخه ویرایش‌شده خود را به‌عنوان یک slug جدید یا fork منتشر کنید.

## نصب Plugin در OpenClaw ناموفق است

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا مسدود شده باشد، ممکن است تا زمانی که
  owner مشکل را حل کند قابل نصب نباشد.

## درخواست‌های Public API ناموفق هستند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing canonical در ClawHub برگردانید.
- محتوای پنهان، private، نگه‌داشته‌شده یا moderation-blocked را خارج از
  سطح Public API mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
