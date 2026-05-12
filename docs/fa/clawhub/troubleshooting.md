---
read_when:
    - دستورهای ClawHub CLI یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات مربوط به ورود به ClawHub، نصب، انتشار، همگام‌سازی، به‌روزرسانی و رابط برنامه‌نویسی کاربردی.
x-i18n:
    generated_at: "2026-05-12T12:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود از طریق مرورگر، یک سرور callback محلی کوتاه‌مدت راه‌اندازی می‌کند.

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
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Remaining` و `RateLimit-Limit`: سهمیه فعلی شما.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان reset.

اگر کاربران زیادی یک egress IP مشترک داشته باشند، محدودیت‌های IP ناشناس می‌تواند حتی وقتی هر
شخص فقط چند درخواست می‌فرستد نیز فعال شود. در صورت امکان وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI به متغیرهای استاندارد proxy احترام می‌گذارد:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک skill در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect <skill-slug>
```

diagnosticهایی که برای owner قابل مشاهده‌اند ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata لازم شکست می‌خورد

برای skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای لازم باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای Plugin‌ها، metadata سازگاری در `package.json` را بررسی کنید. انتشار code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارد.

ابتدا payload انتشار را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای owner یا source در GitHub شکست می‌خورد

ClawHub از هویت GitHub و انتساب source برای اتصال packageها به
ناشرانشان استفاده می‌کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را منتشر کند.
- بررسی کنید URL مربوط به source عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## `sync` می‌گوید هیچ skillی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر خواهد شد، ابتدا preview کنید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی امتناع می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update <slug> --force
```

- نسخه ویرایش‌شده خود را با slug جدید یا به‌صورت fork منتشر کنید.

## نصب یک Plugin در OpenClaw شکست می‌خورد

- از source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما با بازه سازگاری اعلام‌شده package مطابقت دارد.
- اگر package hidden، held یا blocked باشد، ممکن است تا زمانی که owner مشکل را
  برطرف نکند قابل نصب نباشد.

## درخواست‌های Public API شکست می‌خورند

- به headerهای retry مربوط به `429` احترام بگذارید و پاسخ‌های list/search عمومی را cache کنید.
- کاربران را به listing رسمی ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را خارج از سطح
  Public API mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
