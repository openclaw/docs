---
read_when:
    - دستورهای CLI در ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-07-01T15:28:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور callback محلی کوتاه‌عمر راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی داشته باشد.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک توکن API در رابط کاربری وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را دارد.
- اگر از توکن API استفاده می‌کنید، تأیید کنید که در رابط کاربری وب revoke نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از retry صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس
حتی وقتی هر فرد فقط چند درخواست می‌فرستد فعال شود. در صورت امکان وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق می‌شود

CLI به متغیرهای استاندارد proxy احترام می‌گذارد:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک مهارت در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و توسط scan یا moderation نگه داشته نشده است.
- اگر مالک مهارت هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnostics قابل‌مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به دلیل نبود metadata الزامی ناموفق می‌شود

برای مهارت‌ها، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را بفهمند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای GitHub owner یا source ناموفق می‌شود

ClawHub از هویت GitHub و انتساب source برای وصل کردن packageها به
publisherهایشان استفاده می‌کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را
  منتشر کند.
- بررسی کنید که URL منبع عمومی باشد یا برای ClawHub قابل‌دسترسی باشد.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## انتشار به دلیل claim یا reserved بودن namespace ناموفق می‌شود

اگر انتشار به این دلیل ناموفق شد که owner handle، org namespace، package scope، skill
slug یا package name قبلاً claim یا reserved شده است، ابتدا تأیید کنید که با owner
مطابق با namespace در حال انتشار هستید. برای packageهای Plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با owner متناظر
`example-org` منتشر شوند.

اگر باور دارید org، پروژه یا برند شما مالک برحق namespace است اما نمی‌توانید owner
فعلی ClawHub را مدیریت کنید، یک
[مسئله Org / Namespace Claim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با proof عمومی و غیرحساس باز کنید. برای راهنمای evidence و اینکه چه چیزهایی را
نباید در issueهای عمومی قرار دهید، [Org and Namespace Claims](/clawhub/namespace-claims)
را ببینید.

## `sync` می‌گوید هیچ مهارتی پیدا نشد

`sync` به دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر خواهد شد، ابتدا preview کنید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به دلیل تغییرات محلی امتناع می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخه ویرایش‌شده خود را به‌عنوان slug یا fork جدید منتشر کنید.

## نصب Plugin در OpenClaw ناموفق می‌شود

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، held یا blocked باشد، ممکن است تا زمانی که owner مشکل را حل
  نکند قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق می‌شوند

- به headerهای retry برای `429` احترام بگذارید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing رسمی ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را بیرون از سطح API عمومی
  mirror نکنید.

برای جزئیات endpointها، [HTTP API](/clawhub/http-api) را ببینید.
