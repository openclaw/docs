---
read_when:
    - فرمان‌های CLI ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود، نصب، انتشار، به‌روزرسانی و API در ClawHub.
x-i18n:
    generated_at: "2026-07-05T05:21:47Z"
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

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی داشته باشد.
- اگر callback هرگز نمی‌رسد، قوانین فایروال محلی، VPN و پروکسی را بررسی کنید.
- در محیط‌های headless، یک توکن API در رابط وب ClawHub بسازید و اجرا کنید:

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

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، حتی وقتی هر نفر فقط چند درخواست
می‌فرستد، ممکن است به محدودیت‌های IP ناشناس برسید. در صورت امکان وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت پروکسی ناموفق است

CLI متغیرهای استاندارد پروکسی را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک مهارت در جست‌وجو نمایش داده نمی‌شود

- اگر slug دقیق یا صفحه مالک را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل اسکن یا moderation نگه داشته نشده است.
- اگر مالک مهارت هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

تشخیص‌های قابل مشاهده برای مالک ممکن است وضعیت اسکن، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata مورد نیاز ناموفق است

برای مهارت‌ها، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای مورد نیاز باید اعلام شوند تا کاربران و scannerها بتوانند بسته را بفهمند.

برای pluginها، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای مالک GitHub یا منبع ناموفق است

ClawHub از هویت GitHub و انتساب منبع استفاده می‌کند تا بسته‌ها را به
منتشرکنندگانشان وصل کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک بسته است یا می‌تواند آن را منتشر کند.
- بررسی کنید URL منبع عمومی باشد یا برای ClawHub قابل دسترسی باشد.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## انتشار به‌دلیل claim یا reserved بودن namespace ناموفق است

اگر انتشار به‌دلیل اینکه handle مالک، namespace سازمان، scope بسته، slug مهارت
یا نام بسته از قبل claim یا reserved شده ناموفق شد، ابتدا تأیید کنید که با مالکی
منتشر می‌کنید که با namespace مطابقت دارد. برای بسته‌های plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با مالک
مطابق `example-org` منتشر شوند.

اگر باور دارید سازمان، پروژه یا برند شما مالک برحق namespace است اما
نمی‌توانید مالک فعلی ClawHub را مدیریت کنید، یک
[مسئله Claim سازمان / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با proof عمومی و غیرحساس باز کنید. برای راهنمایی درباره evidence و اینکه چه چیزهایی
نباید در issueهای عمومی قرار بگیرند، [Claimهای سازمان و Namespace](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ مهارتی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به ریشه‌هایی که می‌خواهید اسکن شوند اشاره دهید:

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
clawhub update @openclaw/demo --force
```

- کپی ویرایش‌شده خود را به‌عنوان یک slug یا fork جدید منتشر کنید.

## نصب plugin در OpenClaw ناموفق است

- از یک منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات بسته را برای وضعیت اسکن و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده بسته را برآورده می‌کند.
- اگر بسته hidden، held یا blocked باشد، ممکن است تا زمانی که مالک issue را حل کند
  قابل نصب نباشد.

## درخواست‌های API عمومی ناموفق هستند

- headerهای تلاش دوباره `429` را رعایت کنید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به فهرست canonical ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را بیرون از سطح API عمومی
  mirror نکنید.

برای جزئیات endpointها، [API HTTP](/clawhub/http-api) را ببینید.
