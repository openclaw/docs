---
read_when:
    - دستورهای CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر، یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود، نصب، انتشار، به‌روزرسانی و API در ClawHub.
x-i18n:
    generated_at: "2026-07-02T01:06:20Z"
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

- مطمئن شوید مرورگرتان می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قواعد firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های بدون رابط گرافیکی، یک API token در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید در رابط وب باطل نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از retry صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجهٔ دقیق باقی‌ماندهٔ شما وقتی header حاضر باشد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس حتی زمانی فعال شوند که هر شخص فقط چند درخواست می‌فرستد. در صورت امکان وارد شوید و پس از تأخیر گزارش‌شده retry کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و `http_proxy` هستند.

## یک skill در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحهٔ owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation متوقف نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnosticهای قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## publish به‌دلیل نبود metadata الزامی شکست می‌خورد

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را بفهمند.

برای Pluginها، metadata سازگاری در `package.json` را بررسی کنید. publishهای code-plugin به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## publish با خطای GitHub owner یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source استفاده می‌کند تا packageها را به منتشرکنندگانشان وصل کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را publish کند.
- بررسی کنید URL منبع عمومی است یا برای ClawHub قابل دسترسی است.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا URL کامل GitHub استفاده کنید.

## publish به‌دلیل claimed یا reserved بودن یک namespace شکست می‌خورد

اگر publish به این دلیل شکست می‌خورد که handle مالک، namespace سازمان، scope package، slug skill یا نام package قبلاً claimed یا reserved شده است، ابتدا تأیید کنید با مالکی publish می‌کنید که با namespace مطابقت دارد. برای packageهای Plugin، نام‌های scoped مانند `@example-org/example-plugin` باید با مالک متناظر `example-org` منتشر شوند.

اگر باور دارید سازمان، پروژه یا برند شما مالک برحق namespace است اما نمی‌توانید owner فعلی ClawHub را مدیریت کنید، یک [issue ادعای سازمان / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) با شواهد عمومی و غیرحساس باز کنید. برای راهنمای شواهد و اینکه چه چیزهایی را نباید در issueهای عمومی بگذارید، [ادعاهای سازمان و Namespace](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ Skillsی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به ریشه‌هایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی publish خواهد شد، ابتدا پیش‌نمایش بگیرید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی رد می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخهٔ منتشرشده overwrite کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخهٔ ویرایش‌شدهٔ خود را به‌عنوان slug یا fork جدید publish کنید.

## نصب Plugin در OpenClaw شکست می‌خورد

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحهٔ جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخهٔ OpenClaw شما بازهٔ سازگاری اعلام‌شدهٔ package را برآورده می‌کند.
- اگر package پنهان، متوقف یا مسدود شده باشد، ممکن است تا زمانی که owner مشکل را حل کند قابل نصب نباشد.

## درخواست‌های API عمومی شکست می‌خورند

- headerهای retry برای `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing canonical در ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را خارج از سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [API HTTP](/clawhub/http-api) را ببینید.
