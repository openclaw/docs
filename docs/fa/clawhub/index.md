---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب، یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T20:27:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و برای نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه‌ی `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

Skills را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Pluginها را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری مانند انتشار یا حذف/بازگردانی حذف
را می‌خواهید، ClawHub CLI را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## آنچه ClawHub میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | فرمان معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد   | بسته‌های Plugin برای OpenClaw با فراداده‌ی سازگاری           | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی
وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا
Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی
منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub
باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده
کنید. مشخصات ساده‌ی Plugin که برای npm امن هستند ممکن است هنگام جابه‌جایی‌های
راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>`
فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion`
اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه‌ی بسته یک artifact از ClawPack
منتشر می‌کند، OpenClaw همان `.tgz` دقیق آپلودشده با npm-pack را ترجیح می‌دهد،
سرآیند digest ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده‌ی
artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## ClawHub CLI

ClawHub CLI برای کارهای نیازمند احراز هویت رجیستری است:

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

CLI همچنین برای گردش‌کارهای مستقیم رجیستری فرمان‌های نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL در GitHub
منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه‌ی دقیق انتشار بدون آپلود از `--dry-run`، و برای خروجی مناسب CI
از `--json` استفاده کنید.

Pluginهای کد باید فراداده‌ی سازگاری الزامی OpenClaw را در `package.json` شامل
کنند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها [CLI](/fa/clawhub/cli)
و برای فراداده‌ی Skill [قالب Skill](/clawhub/skill-format) را ببینید.

## امنیت و مدیریت محتوا

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به یک
حساب GitHub نیاز دارد که به‌اندازه‌ی کافی قدیمی باشد تا از دروازه‌ی آپلود عبور
کند. صفحه‌های جزئیات عمومی تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود خلاصه
می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند.
انتشارهایی که در وضعیت نگه‌داشت اسکن هستند یا مسدود شده‌اند ممکن است از کاتالوگ
عمومی و سطح‌های نصب ناپدید شوند، در حالی که همچنان برای مالکشان در `/dashboard`
قابل مشاهده هستند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. مدیران محتوا می‌توانند
گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر
را مسدود کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[مدیریت محتوا و ایمنی حساب](/clawhub/moderation)، و
[استفاده‌ی قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## دورسنجی و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد
نصب با بهترین تلاش ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه
کند. این را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                        | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایتی را که برای ورود مرورگر استفاده می‌شود بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL API رجیستری را بازنویسی می‌کند.              |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | دورسنجی نصب را غیرفعال می‌کند.                   |

برای مطالب مرجع عمیق‌تر، [دورسنجی](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
