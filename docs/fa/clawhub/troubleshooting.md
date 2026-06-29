---
read_when:
    - دستورهای CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-06-28T22:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود با مرورگر، یک سرور محلی کوتاه‌عمر برای callback راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی داشته باشد.
- اگر callback هرگز نمی‌رسد، قوانین فایروال محلی، VPN و پراکسی را بررسی کنید.
- در محیط‌های بدون رابط گرافیکی، در رابط وب ClawHub یک توکن API بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر پیکربندی سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که توکن فعلی شما را دارد.
- اگر از توکن API استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات تلاش دوباره را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی این header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی بازنشانی.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس حتی وقتی هر
فرد فقط چند درخواست می‌فرستد فعال شوند. هر جا ممکن است وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت پراکسی ناموفق است

CLI متغیرهای استاندارد پراکسی را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک مهارت در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید انتشار عمومی است و به‌خاطر اسکن یا moderation متوقف نشده است.
- اگر مالک مهارت هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

عیب‌یابی‌های قابل مشاهده برای مالک ممکن است وضعیت اسکن، upload-gate یا moderation را توضیح دهند.

## انتشار به‌خاطر نبود metadata لازم ناموفق است

برای مهارت‌ها، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای لازم باید اعلام شوند تا کاربران و اسکنرها بتوانند package را بفهمند.

برای Pluginها، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا منبع ناموفق است

ClawHub از هویت GitHub و attribution منبع استفاده می‌کند تا packageها را به
ناشرانشان وصل کند.

- مطمئن شوید با حساب GitHub وارد شده‌اید که مالک package است یا می‌تواند آن را
  منتشر کند.
- بررسی کنید URL منبع عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا URL کامل GitHub استفاده کنید.

## انتشار به‌خاطر claimed یا reserved بودن namespace ناموفق است

اگر انتشار به این دلیل ناموفق شد که handle مالک، namespace سازمان، package scope، slug مهارت
یا نام package از قبل claimed یا reserved شده است، ابتدا تأیید کنید که با مالکی
منتشر می‌کنید که با namespace مطابقت دارد. برای packageهای Plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با مالک
مطابق `example-org` منتشر شوند.

اگر باور دارید سازمان، پروژه یا برند شما مالک قانونی namespace است اما
نمی‌توانید مالک فعلی ClawHub را مدیریت کنید، یک
[مسئله ادعای سازمان / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با مدرک عمومی و غیرحساس باز کنید. برای راهنمایی درباره شواهد و اینکه چه چیزهایی
را از مسائل عمومی دور نگه دارید، [ادعاهای سازمان و namespace](/fa/clawhub/namespace-claims) را ببینید.

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

## `update` به‌خاطر تغییرات محلی رد می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده بازنویسی کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخه ویرایش‌شده خود را با slug جدید یا به‌عنوان fork منتشر کنید.

## نصب یک Plugin در OpenClaw ناموفق است

- از یک منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت اسکن و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package مخفی، متوقف یا مسدود شده باشد، ممکن است تا وقتی مالک مشکل را حل نکند
  قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق هستند

- headerهای تلاش دوباره `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing مرجع ClawHub برگردانید.
- محتوای مخفی، خصوصی، متوقف‌شده یا moderation-blocked را بیرون از سطح
  API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/fa/clawhub/http-api) را ببینید.
