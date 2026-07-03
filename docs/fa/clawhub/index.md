---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T23:37:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Plugin‌های OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Plugin‌ها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/لغو حذف استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

جست‌وجو و نصب Plugin‌ها با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای دارای احراز هویت رجیستری، مانند انتشار یا حذف/لغو حذف، را می‌خواهید،
CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                                | فرمان معمول                                  |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان   | `openclaw skills install @openclaw/demo`     |
| Plugin‌های کد | بسته‌های Plugin OpenClaw با فراداده سازگاری                      | `openclaw plugins install clawhub:<package>` |
| Plugin‌های باندل | باندل‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw               | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت
فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را
پایدار می‌کنند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید.
مشخصات Plugin بدون پیشوند و سازگار با npm ممکن است هنگام گذارهای راه‌اندازی از طریق npm resolve شوند، و
وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion`
اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه بسته یک آرتیفکت ClawPack منتشر می‌کند،
OpenClaw بسته دقیق `.tgz` آپلودشده با npm-pack را ترجیح می‌دهد، هدر digest ClawHub و بایت‌های
دانلودشده را راستی‌آزمایی می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای کارهای دارای احراز هویت رجیستری است:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI همچنین برای گردش‌کارهای مستقیم رجیستری، فرمان‌های نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی شامل `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Plugin‌ها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL گیت‌هاب
منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه دقیق انتشار بدون بارگذاری، از `--dry-run` و برای خروجی مناسب CI
از `--json` استفاده کنید.

Plugin‌های کد باید فراداده سازگاری الزامی OpenClaw را در
`package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli)
و برای فراداده Skill به [قالب Skill](/clawhub/skill-format) مراجعه کنید.

## امنیت و تعدیل‌گری

ClawHub به‌طور پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب گیت‌هاب
نیاز دارد که به‌اندازه کافی قدیمی باشد تا از گیت بارگذاری عبور کند. صفحه‌های جزئیات عمومی،
آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی
که در اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند،
در حالی که همچنان برای مالکشان در `/dashboard` قابل مشاهده‌اند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا به
[امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[تعدیل‌گری و ایمنی حساب](/clawhub/moderation)، و
[استفاده قابل قبول](/fa/clawhub/acceptable-usage) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب با بهترین تلاش
ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند. این را با فرمان زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر                        | اثر                                                  |
| ---------------------------- | ---------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت مورد استفاده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL API رجیستری را بازنویسی می‌کند.                  |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                      |

برای مطالب مرجع عمیق‌تر به [تله‌متری](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
