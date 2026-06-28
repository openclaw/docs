---
read_when:
    - فرمان‌های ClawHub CLI یا رجیستری OpenClaw با خطا مواجه می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-06-28T20:43:39Z"
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
- اگر callback هرگز نمی‌رسد، قواعد firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک توکن API در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را دارد.
- اگر از توکن API استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره منتظر بمانید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک egress IP مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس
حتی وقتی هر نفر فقط چند درخواست می‌فرستد فعال شوند. در صورت امکان وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک مهارت در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌خاطر اسکن یا moderation نگه داشته نشده است.
- اگر مالک مهارت هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnostics قابل مشاهده برای مالک ممکن است وضعیت اسکن، upload-gate یا moderation را توضیح دهد.

## انتشار به‌دلیل نبود metadata الزامی شکست می‌خورد

برای مهارت‌ها، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source برای اتصال packageها به
ناشرانشان استفاده می‌کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک package است یا می‌تواند آن را منتشر کند.
- بررسی کنید URL مربوط به source عمومی است یا برای ClawHub قابل دسترسی است.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## انتشار به‌دلیل claimed یا reserved بودن namespace شکست می‌خورد

اگر انتشار به این دلیل شکست می‌خورد که handle مالک، namespace سازمان، scope package، slug مهارت
یا نام package از قبل claimed یا reserved شده است، ابتدا تأیید کنید که با مالکی منتشر
می‌کنید که با namespace مطابقت دارد. برای packageهای plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با مالک مطابق
`example-org` منتشر شوند.

اگر باور دارید سازمان، پروژه یا برند شما مالک برحق namespace است اما
نمی‌توانید مالک فعلی ClawHub را مدیریت کنید، یک
[مسئله ادعای سازمان / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با شواهد عمومی و غیرحساس باز کنید. برای راهنمای شواهد و اینکه چه چیزهایی را
نباید در issueهای عمومی بگذارید، [ادعاهای سازمان و Namespace](/fa/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ مهارتی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به ریشه‌هایی که می‌خواهید اسکن شوند اشاره دهید:

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
- با نسخه منتشرشده بازنویسی کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخه ویرایش‌شده خود را به‌عنوان یک slug یا fork جدید منتشر کنید.

## نصب یک plugin در OpenClaw شکست می‌خورد

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت اسکن و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package مخفی، نگه‌داشته‌شده یا blocked باشد، ممکن است تا زمانی که
  مالک مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی شکست می‌خورند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing رسمی ClawHub برگردانید.
- محتوای مخفی، خصوصی، نگه‌داشته‌شده یا moderation-blocked را خارج از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
