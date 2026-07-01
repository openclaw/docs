---
read_when:
    - ClawHub CLI یا فرمان‌های رجیستری OpenClaw شکست می‌خورند
    - یک بسته نمی‌تواند نصب، منتشر یا به‌روزرسانی شود
summary: عیب‌یابی مشکلات ورود به ClawHub، نصب، انتشار، به‌روزرسانی و API.
x-i18n:
    generated_at: "2026-07-01T08:20:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# عیب‌یابی

## `clawhub login` مرورگر را باز می‌کند اما هرگز کامل نمی‌شود

CLI هنگام ورود از طریق مرورگر، یک سرور محلی کوتاه‌عمر برای callback راه‌اندازی می‌کند.

- مطمئن شوید مرورگر شما می‌تواند به `http://127.0.0.1:<port>/callback` دسترسی پیدا کند.
- اگر callback هرگز نمی‌رسد، قوانین firewall محلی، VPN و proxy را بررسی کنید.
- در محیط‌های headless، در رابط وب ClawHub یک API token بسازید و اجرا کنید:

```bash
clawhub login --token clh_...
```

## `whoami` یا `publish` مقدار `Unauthorized` (401) برمی‌گرداند

- دوباره با `clawhub login` وارد شوید.
- اگر از مسیر config سفارشی استفاده می‌کنید، تأیید کنید `CLAWHUB_CONFIG_PATH` به
  فایلی اشاره می‌کند که token فعلی شما را در خود دارد.
- اگر از API token استفاده می‌کنید، تأیید کنید که در رابط وب لغو نشده باشد.

## جست‌وجو یا نصب مقدار `Rate limit exceeded` (429) برمی‌گرداند

اطلاعات retry را در پاسخ بخوانید:

- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از retry صبر کنید.
- `RateLimit-Limit`: محدودیتی که برای این درخواست اعمال شده است.
- `RateLimit-Remaining`: بودجه دقیق باقی‌مانده شما وقتی header حاضر باشد. در `429`، مقدار آن `0` است.
- `RateLimit-Reset` یا `X-RateLimit-Reset`: زمان‌بندی reset.

اگر کاربران زیادی یک IP خروجی مشترک داشته باشند، محدودیت‌های IP ناشناس ممکن است حتی وقتی هر
نفر فقط چند درخواست می‌فرستد هم فعال شوند. هرجا ممکن است وارد شوید و پس از
تأخیر گزارش‌شده دوباره تلاش کنید.

## جست‌وجو یا نصب پشت proxy شکست می‌خورد

CLI به متغیرهای استاندارد proxy احترام می‌گذارد:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

نام‌های پشتیبانی‌شده شامل `HTTPS_PROXY`، `HTTP_PROXY`، `https_proxy` و
`http_proxy` هستند.

## یک skill در جست‌وجو ظاهر نمی‌شود

- اگر slug دقیق یا صفحه owner را می‌دانید، آن را بررسی کنید.
- تأیید کنید release عمومی است و به‌دلیل scan یا moderation نگه داشته نشده است.
- اگر مالک skill هستید، وارد شوید و آن را بررسی کنید:

```bash
clawhub inspect @openclaw/demo
```

عیب‌یابی‌های قابل مشاهده برای owner ممکن است وضعیت scan، upload-gate یا moderation را توضیح دهند.

## انتشار به‌دلیل نبود metadata الزامی شکست می‌خورد

برای skills، frontmatter در `SKILL.md` را بررسی کنید. متغیرهای محیطی و
ابزارهای الزامی باید اعلام شوند تا کاربران و scannerها بتوانند package را درک کنند.

برای plugins، metadata سازگاری در `package.json` را بررسی کنید. انتشارهای code-plugin
به فیلدهای سازگاری OpenClaw مانند `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion` نیاز دارند.

ابتدا payload انتشار را پیش‌نمایش کنید:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## انتشار با خطای GitHub owner یا source شکست می‌خورد

ClawHub از هویت GitHub و انتساب source برای اتصال packageها به
ناشرانشان استفاده می‌کند.

- مطمئن شوید با حساب GitHubی وارد شده‌اید که مالک package است یا می‌تواند آن را منتشر کند.
- بررسی کنید URL منبع عمومی است یا برای ClawHub قابل دسترسی است.
- برای منابع GitHub، از `owner/repo`، `owner/repo@ref` یا یک URL کامل GitHub استفاده کنید.

## انتشار شکست می‌خورد چون یک namespace ادعا یا رزرو شده است

اگر انتشار به این دلیل شکست می‌خورد که handle مالک، namespace سازمان، scope package، slug skill
یا نام package از قبل ادعا یا رزرو شده است، ابتدا تأیید کنید که با owner مطابق با namespace
در حال انتشار هستید. برای packageهای plugin،
نام‌های scoped مانند `@example-org/example-plugin` باید با owner مطابق
`example-org` منتشر شوند.

اگر باور دارید سازمان، پروژه یا برند شما مالک برحق namespace است اما
نمی‌توانید owner فعلی ClawHub را مدیریت کنید، یک
[درخواست ادعای سازمان / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
با مدرک عمومی و غیرحساس باز کنید. برای راهنمای شواهد و این‌که چه چیزهایی را
نباید در issueهای عمومی قرار دهید، [ادعاهای سازمان و Namespace](/clawhub/namespace-claims) را ببینید.

## `sync` می‌گوید هیچ skillsی پیدا نشد

`sync` به‌دنبال پوشه‌هایی می‌گردد که شامل `SKILL.md` یا `skill.md` باشند.

آن را به rootهایی که می‌خواهید scan شوند اشاره دهید:

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
- با نسخه منتشرشده overwrite کنید:

```bash
clawhub update @openclaw/demo --force
```

- نسخه ویرایش‌شده خود را به‌عنوان slug یا fork جدید منتشر کنید.

## نصب plugin در OpenClaw شکست می‌خورد

- از منبع صریح ClawHub استفاده کنید:

```bash
openclaw plugins install clawhub:<package>
```

- صفحه جزئیات package را برای وضعیت scan و metadata سازگاری بررسی کنید.
- تأیید کنید نسخه OpenClaw شما بازه سازگاری اعلام‌شده package را برآورده می‌کند.
- اگر package پنهان، نگه‌داشته‌شده یا مسدود باشد، ممکن است تا زمانی که
  owner مشکل را حل نکند قابل نصب نباشد.

## درخواست‌های API عمومی شکست می‌خورند

- به headerهای retry در `429` احترام بگذارید و پاسخ‌های فهرست/جست‌وجوی عمومی را cache کنید.
- کاربران را به listing مرجع ClawHub برگردانید.
- محتوای پنهان، خصوصی، نگه‌داشته‌شده یا مسدودشده توسط moderation را بیرون از
  سطح API عمومی mirror نکنید.

برای جزئیات endpointها، [HTTP API](/clawhub/http-api) را ببینید.
