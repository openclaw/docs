---
read_when:
    - فرمان‌های CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-07-01T20:28:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور کوتاه‌عمر callback محلی راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های بدون رابط گرافیکی، در رابط وب ClawHub یک API token بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجهٔ دقیق باقی‌ماندهٔ شما وقتی header وجود دارد. روی `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس فعال شوند، حتی وقتی هر
نفر فقط چند درخواست می‌فرستد. در صورت امکان وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک skill در جست‌وجو ظاهر نمی‌شود

- اگر slug یا صفحهٔ مالک دقیق را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل اسکن یا moderation متوقف نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

عیب‌یابی‌های قابل مشاهده برای مالک ممکن است وضعیت اسکن، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata الزامی شکست می‌خورد

برای skills، frontmatter در `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و اسکنرها بتوانند package را درک کنند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای
code-plugin به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا منبع شکست می‌خورد

ClawHub از هویت GitHub و انتساب منبع استفاده می‌کند تا packageها را به
ناشرانشان متصل کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک package است یا می‌تواند آن را منتشر کند.
- بررسی کنید URL منبع عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## انتشار به‌دلیل claim یا reserved بودن namespace شکست می‌خورد

اگر انتشار به این دلیل شکست خورد که handle مالک، namespace سازمان، scope پکیج، slug مهارت
یا نام پکیج قبلاً claim یا reserved شده است، ابتدا تأیید کنید که با مالکی منتشر می‌کنید
که با namespace مطابقت دارد. برای پکیج‌های plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با مالک
مطابق `example-org` منتشر شوند.

اگر فکر می‌کنید سازمان، پروژه یا برند شما مالک قانونی namespace است اما
نمی‌توانید مالک فعلی ClawHub را مدیریت کنید، یک
[issue برای claim سازمان / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با مدارک عمومی و غیرحساس باز کنید. برای راهنمای مدارک و اینکه چه چیزهایی را
نباید در issueهای عمومی قرار دهید، [claimهای سازمان و namespace](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ skillای پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` داشته باشند.

آن را به rootهایی اشاره دهید که می‌خواهید اسکن شوند:

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
- با نسخهٔ منتشرشده بازنویسی کنید:

```bash
clawhub update @openclaw/demo --force
```

- کپی ویرایش‌شدهٔ خود را به‌عنوان یک slug یا fork جدید منتشر کنید.

## نصب plugin در OpenClaw شکست می‌خورد

- از یک منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحهٔ جزئیات package را برای وضعیت اسکن و metadata سازگاری بررسی کنید.
- تأیید کنید نسخهٔ OpenClaw شما با بازهٔ سازگاری اعلام‌شدهٔ package
  سازگار است.
- اگر package hidden، held یا blocked باشد، ممکن است تا زمانی که
  مالک مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی شکست می‌خورند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing canonical در ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را بیرون از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/clawhub/http-api) را ببینید.
