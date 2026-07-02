---
read_when:
    - فرمان‌های CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته را نمی‌توان نصب، منتشر یا به‌روزرسانی کرد
summary: عیب‌یابی مشکلات ورود، نصب، انتشار، به‌روزرسانی و API در ClawHub.
x-i18n:
    generated_at: "2026-07-02T17:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور callback محلی کوتاه‌عمر را راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک API token در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، محدودیت‌های IP ناشناس ممکن است حتی وقتی هر
نفر فقط چند درخواست می‌فرستد فعال شوند. در صورت امکان وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک Skills در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک Skills هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnosticهای قابل مشاهده برای مالک ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به دلیل نبود metadata الزامی شکست می‌خورد

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای Pluginها، metadata سازگاری `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source برای اتصال packageها به
ناشرانشان استفاده می‌کند.

- مطمئن شوید با حساب GitHub که مالک package است یا می‌تواند آن را منتشر کند
  وارد شده‌اید.
- بررسی کنید URL منبع عمومی است یا برای ClawHub قابل دسترسی است.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا URL کامل GitHub استفاده کنید.

## انتشار به دلیل claim یا reserved بودن namespace شکست می‌خورد

اگر انتشار به دلیل اینکه owner handle، org namespace، package scope، slug مربوط به Skills
یا نام package از قبل claim یا reserved شده شکست می‌خورد، ابتدا تأیید کنید که با
مالکی منتشر می‌کنید که با namespace مطابقت دارد. برای packageهای Plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با مالک
مطابق `example-org` منتشر شوند.

اگر فکر می‌کنید org، پروژه یا برند شما مالک برحق namespace است اما
نمی‌توانید مالک فعلی ClawHub را مدیریت کنید، یک
[issue برای Org / Namespace Claim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با proof عمومی و غیرحساس باز کنید. برای راهنمای evidence و اینکه چه چیزهایی را
نباید در issueهای عمومی قرار دهید، [Org and Namespace Claims](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ Skillsی پیدا نشد

`sync` به دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر خواهد شد، ابتدا پیش‌نمایش بگیرید:

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

## نصب Plugin در OpenClaw شکست می‌خورد

- از یک منبع ClawHub صریح استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را
  برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا مسدود شده باشد، ممکن است تا زمانی که
  مالک مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی شکست می‌خورند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing canonical در ClawHub برگردانید.
- محتوای پنهان، خصوصی، نگه‌داشته‌شده یا مسدودشده توسط moderation را خارج از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/clawhub/http-api) را ببینید.
