---
read_when:
    - دستورهای CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-07-04T10:51:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود از طریق مرورگر، یک سرور callback محلی کوتاه‌عمر راه‌اندازی می‌کند.

- مطمئن شوید مرورگرتان می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، یک توکن API در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را در خود دارد.
- اگر از توکن API استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات تلاش دوباره را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، محدودیت‌های IP ناشناس ممکن است حتی وقتی هر
فرد فقط چند درخواست می‌فرستد، فعال شوند. هر جا ممکن است وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy ناموفق می‌شود

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک Skills در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک Skills هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

عیب‌یابی‌های قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به دلیل نبود metadata الزامی ناموفق می‌شود

برای Skills، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند بسته را بفهمند.

برای Pluginها، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای owner یا source در GitHub ناموفق می‌شود

ClawHub از هویت GitHub و انتساب source استفاده می‌کند تا بسته‌ها را به
منتشرکنندگانشان وصل کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک بسته است یا می‌تواند آن را منتشر کند.
- بررسی کنید که URL منبع عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا URL کامل GitHub استفاده کنید.

## انتشار به دلیل claim یا reserved بودن namespace ناموفق می‌شود

اگر انتشار به این دلیل ناموفق شد که handle مالک، namespace سازمان، scope بسته، slug مربوط به Skills
یا نام بسته از قبل claim یا reserved شده است، ابتدا تأیید کنید که با مالکی منتشر می‌کنید
که با namespace مطابقت دارد. برای بسته‌های Plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با owner
مطابق `example-org` منتشر شوند.

اگر فکر می‌کنید سازمان، پروژه یا برند شما مالک برحق namespace است اما
نمی‌توانید owner فعلی ClawHub را مدیریت کنید، یک
[issue ادعای سازمان / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با شواهد عمومی و غیرحساس باز کنید. برای راهنمایی شواهد و اینکه چه چیزهایی را
نباید در issueهای عمومی قرار دهید، [ادعاهای سازمان و Namespace](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ Skills پیدا نشد

`sync` به دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به rootهایی اشاره دهید که می‌خواهید scan شوند:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر می‌شود، ابتدا پیش‌نمایش بگیرید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به دلیل تغییرات محلی خودداری می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخه ویرایش‌شده خود را به‌عنوان slug یا fork جدید منتشر کنید.

## نصب Plugin در OpenClaw ناموفق می‌شود

- از منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات بسته را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده بسته را برآورده می‌کند.
- اگر بسته hidden، held یا blocked باشد، ممکن است تا زمانی که
  owner مشکل را حل نکند، قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق می‌شوند

- headerهای تلاش دوباره `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به فهرست canonical در ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را خارج از
  سطح API عمومی mirror نکنید.

برای جزئیات endpoint، [HTTP API](/clawhub/http-api) را ببینید.
