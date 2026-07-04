---
read_when:
    - دستورهای CLI مربوط به ClawHub یا رجیستری OpenClaw شکست می‌خورند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-07-04T18:10:04Z"
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
- اگر از API token استفاده می‌کنید، تأیید کنید در رابط وب revoke نشده باشد.

## جستجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از retry صبر کنید.
- `RateLimit-Limit`: محدودیتی که روی این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header وجود دارد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، ممکن است محدودیت‌های IP ناشناس فعال شوند حتی وقتی هر
نفر فقط چند درخواست می‌فرستد. در صورت امکان وارد شوید و پس از تأخیر
گزارش‌شده retry کنید.

## جستجو یا نصب پشت proxy شکست می‌خورد

CLI به متغیرهای استاندارد proxy احترام می‌گذارد:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک skill در جستجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

diagnostics قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهد.

## انتشار به دلیل نبود metadata ضروری شکست می‌خورد

برای skills، frontmatter در `SKILL.md` را بررسی کنید. متغیرهای environment و
tools ضروری باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را preview کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای GitHub owner یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source استفاده می‌کند تا packageها را به
publisherهایشان متصل کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را منتشر کند.
- بررسی کنید source URL عمومی است یا برای ClawHub قابل دسترسی است.
- برای sourceهای GitHub، از `owner/repo`، `owner/repo@ref` یا URL کامل GitHub استفاده کنید.

## انتشار به دلیل claim یا reserve بودن namespace شکست می‌خورد

اگر انتشار به این دلیل شکست می‌خورد که owner handle، org namespace، package scope، skill
slug یا package name از قبل claim یا reserve شده است، ابتدا تأیید کنید که با
owner مطابق با namespace در حال انتشار هستید. برای packageهای plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با owner مطابق
`example-org` منتشر شوند.

اگر باور دارید org، project یا brand شما owner برحق namespace است اما
نمی‌توانید owner فعلی ClawHub را مدیریت کنید، یک
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با proof عمومی و غیرحساس باز کنید. برای راهنمایی evidence و اینکه چه چیزهایی
را نباید در issueهای عمومی قرار دهید، [Org and Namespace Claims](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ skills پیدا نشد

`sync` به دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` هستند.

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

- کپی ویرایش‌شده خود را به‌عنوان slug یا fork جدید منتشر کنید.

## نصب یک plugin در OpenClaw شکست می‌خورد

- از source صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری advertised شده package را
  برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا blocked باشد، ممکن است تا زمانی که
  owner مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های Public API شکست می‌خورند

- به headerهای retry برای `429` احترام بگذارید و پاسخ‌های فهرست/جستجوی عمومی را cache کنید.
- کاربران را به listing مرجع ClawHub برگردانید.
- محتوای hidden، private، held یا moderation-blocked را خارج از
  سطح Public API mirror نکنید.

برای جزئیات endpoint، [HTTP API](/clawhub/http-api) را ببینید.
