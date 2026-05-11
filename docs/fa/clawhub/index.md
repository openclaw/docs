---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Plugin
    - انتشار Skills یا Plugin‌ها در رجیستری
    - انتخاب بین روندهای CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از دستورهای بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه‌ی `clawhub` برای گردش‌کارهای احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

جست‌وجو و نصب Pluginها با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری مانند انتشار، همگام‌سازی، یا
حذف/بازگردانی حذف را می‌خواهید، ClawHub CLI را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                             | دستور معمول                                  |
| ------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد  | بسته‌های Plugin برای OpenClaw با فراداده‌ی سازگاری             | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw              | `clawhub package publish <source>`           |
| Souls         | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند       | گردش‌کارهای انتشار وب و API                 |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری
را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

دستورهای بومی OpenClaw در workspace فعال OpenClaw نصب می‌کنند و فراداده‌ی منبع
را نگه می‌دارند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید.
مشخصه‌های Plugin سازگار با npm و بدون پیشوند ممکن است هنگام گذارهای راه‌اندازی از طریق npm resolve شوند، و
`npm:<package>` وقتی منبع باید صریح باشد، فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب archive، سازگاری `pluginApi` و `minGatewayVersion`
اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه‌ی بسته artifact از نوع
ClawPack منتشر می‌کند، OpenClaw بسته‌ی دقیق npm-pack بارگذاری‌شده‌ی `.tgz` را ترجیح می‌دهد، header digest مربوط به ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده‌ی artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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
clawhub sync --all
```

CLI همچنین دستورهای نصب/به‌روزرسانی skill را برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی شامل `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: slug مربوط به skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک GitHub
URL منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساختن طرح دقیق انتشار بدون بارگذاری، و از `--json`
برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده‌ی الزامی سازگاری OpenClaw را در
`package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل دستورها به [CLI](/fa/clawhub/cli)
و برای فراداده‌ی skill به [قالب Skill](/fa/clawhub/skill-format) مراجعه کنید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب GitHub
نیاز دارد که به‌اندازه‌ی کافی قدیمی باشد تا از gate بارگذاری عبور کند. صفحه‌های جزئیات عمومی
آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills و انتشارهای Plugin منتشرشده اجرا می‌کند. انتشارهای نگه‌داشته‌شده
در اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، در حالی که
برای مالکشان در `/dashboard` همچنان قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اعمال آن، به
[استفاده‌ی قابل قبول](/fa/clawhub/acceptable-usage) و
[امنیت + نظارت](/fa/clawhub/security) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی می‌فرستد تا
ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این کار را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

overrideهای مفید محیط:

| متغیر                         | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود از مرورگر را override می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به registry API را override می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت token/config توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را override می‌کند.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را روی `sync` غیرفعال می‌کند.            |

برای منابع مرجع عمیق‌تر، به [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
