---
read_when:
    - دستورهای CLI مربوط به ClawHub یا رجیستری OpenClaw ناموفق می‌شوند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود، نصب، انتشار، به‌روزرسانی و API در ClawHub.
x-i18n:
    generated_at: "2026-06-28T00:12:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود از طریق مرورگر، یک سرور callback محلی کوتاه‌مدت راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین فایروال محلی، VPN، و proxy را بررسی کنید.
- در محیط‌های headless، یک API token در رابط وب ClawHub بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب revoked نشده است.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه باقی‌مانده دقیق شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس حتی وقتی هر
فرد فقط چند درخواست می‌فرستد فعال شوند. در صورت امکان وارد شوید و پس از تأخیر
گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI متغیرهای استاندارد proxy را رعایت می‌کند:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy`، و
`http_proxy` هستند.

## یک مهارت در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌خاطر scan یا moderation نگه داشته نشده است.
- اگر مالک مهارت هستید، وارد شوید و آن را inspect کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnostics قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate، یا moderation را توضیح دهد.

## انتشار به‌دلیل نبود metadata الزامی شکست می‌خورد

برای مهارت‌ها، frontmatter فایل `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای Pluginها، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای GitHub owner یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source برای اتصال packageها به
ناشرانشان استفاده می‌کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را
  منتشر کند.
- بررسی کنید که source URL عمومی یا برای ClawHub قابل دسترسی باشد.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref`، یا یک URL کامل GitHub استفاده کنید.

## انتشار به‌دلیل claimed یا reserved بودن namespace شکست می‌خورد

اگر انتشار به این دلیل شکست می‌خورد که owner handle، org namespace، package scope، skill
slug، یا package name قبلاً claimed یا reserved شده است، ابتدا تأیید کنید که با
owner مطابق با namespace منتشر می‌کنید. برای packageهای Plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با owner
مطابق `example-org` منتشر شوند.

اگر باور دارید org، پروژه، یا برند شما مالک برحق namespace است اما
نمی‌توانید owner فعلی ClawHub را مدیریت کنید، یک
[مسئله Org / Namespace Claim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با proof عمومی و غیرحساس باز کنید. برای راهنمایی evidence و اینکه چه چیزهایی
را از issueهای عمومی بیرون نگه دارید، [Org and Namespace Claims](/fa/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ مهارتی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که `SKILL.md` یا `skill.md` دارند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

```bash
clawhub sync --root /path/to/skills
```

اگر مطمئن نیستید چه چیزی منتشر می‌شود، ابتدا پیش‌نمایش کنید:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` به‌دلیل تغییرات محلی رد می‌کند

فایل‌های محلی با هیچ نسخه‌ای که ClawHub می‌شناسد مطابقت ندارند. یکی را انتخاب کنید:

- ویرایش‌های محلی را نگه دارید و update را رد کنید.
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update @openclaw/demo --force
```

- کپی ویرایش‌شده خود را با slug جدید یا fork منتشر کنید.

## نصب یک Plugin در OpenClaw شکست می‌خورد

- از یک source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما range سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده، یا blocked باشد، ممکن است تا وقتی
  owner مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های Public API شکست می‌خورند

- headerهای retry مربوط به `429` را رعایت کنید و پاسخ‌های public list/search را cache کنید.
- کاربران را به listing رسمی ClawHub برگردانید.
- محتوای hidden، private، held، یا moderation-blocked را خارج از
  سطح Public API mirror نکنید.

برای جزئیات endpoint، [HTTP API](/fa/clawhub/http-api) را ببینید.
