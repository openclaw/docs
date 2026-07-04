---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI مربوط به openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T10:50:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازیابی حذف استفاده کنید.

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

وقتی گردش‌کارهای احراز هویت‌شده در رجیستری مانند انتشار یا حذف/بازیابی حذف را
می‌خواهید، CLI ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح            | آنچه ذخیره می‌کند                                           | فرمان معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد   | بسته‌های Plugin OpenClaw با فراداده سازگاری                  | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها،
دانلودها، ستاره‌ها و خلاصه‌های اسکن امنیتی را رهگیری می‌کند. صفحه‌های عمومی
وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا
Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع
را پایدار می‌کنند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>`
استفاده کنید. مشخصات Plugin ساده و سازگار با npm ممکن است در زمان تغییر مسیرهای
راه‌اندازی از طریق npm resolve شوند، و وقتی منبع باید صریح باشد،
`npm:<package>` فقط مخصوص npm می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و
`minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه بسته، یک
artifact از ClawPack منتشر می‌کند، OpenClaw همان `.tgz` دقیق npm-pack بارگذاری‌شده
را ترجیح می‌دهد، سربرگ digest ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند،
و فراداده artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI ClawHub

CLI ClawHub برای کارهای احراز هویت‌شده در رجیستری است:

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

این CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و
نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با کاما، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL GitHub
منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای
خروجی مناسب CI از `--json` استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در `package.json` شامل
`openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` داشته باشند. برای
مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) و برای فراداده Skill،
[قالب Skill](/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌طور پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک
حساب GitHub نیاز دارد که به‌اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند.
صفحه‌های جزئیات عمومی، آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند.
انتشارهایی که در اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ
عمومی و سطح‌های نصب ناپدید شوند، در حالی که برای مالک خود در `/dashboard` قابل
مشاهده باقی می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها
را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود
کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[نظارت و ایمنی حساب](/clawhub/moderation)، و
[استفاده قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی هنگام ورود به حساب `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رخداد
نصب best-effort ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند.
این را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیطی:

| متغیر                         | اثر                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت مورد استفاده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL API رجیستری را بازنویسی می‌کند.              |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
