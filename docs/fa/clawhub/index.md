---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI برای openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:38:05Z"
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
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

جست‌وجو و نصب Pluginها با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار یا حذف/بازگردانی حذف، می‌خواهید، ClawHub CLI را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح | آنچه ذخیره می‌کند | فرمان معمول |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌بندی‌شده همراه با `SKILL.md` و فایل‌های پشتیبان | `openclaw skills install @openclaw/demo` |
| Pluginهای کد | بسته‌های Plugin برای OpenClaw همراه با فراداده سازگاری | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin آماده برای توزیع OpenClaw | `clawhub package publish <source>` |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری
را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع
را نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید.
مشخصه‌های Plugin ساده و سازگار با npm ممکن است هنگام جابه‌جایی‌های راه‌اندازی از طریق npm resolve شوند، و
وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب Pluginها سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را
پیش از اجرای نصب آرشیو اعتبارسنجی می‌کند. وقتی نسخه‌ای از بسته یک مصنوع ClawPack منتشر می‌کند،
OpenClaw فایل npm-pack `.tgz` بارگذاری‌شده دقیق را ترجیح می‌دهد، هدر digest ClawHub
و بایت‌های دانلودشده را تأیید می‌کند، و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی دارای `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مهارت منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL
GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن طرح انتشار دقیق بدون بارگذاری، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI
از `--json` استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در
`package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli)
و برای فراداده Skill به [قالب Skill](/clawhub/skill-format) مراجعه کنید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب GitHub
نیاز دارد که به اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند. صفحه‌های جزئیات عمومی
آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های خودکار اجرا می‌کند. انتشارهای نگه‌داشته‌شده به‌دلیل اسکن
یا مسدودشده ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که
برای مالکشان در `/dashboard` قابل مشاهده باقی می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، به
[امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[نظارت و ایمنی حساب](/clawhub/moderation)، و
[استفاده قابل‌قبول](/fa/clawhub/acceptable-usage) مراجعه کنید.

## Telemetry و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب best-effort
ارسال کند تا ClawHub بتواند شمارش‌های نصب تجمعی را محاسبه کند. این کار را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | بازنویسی URL سایتی که برای ورود مرورگر استفاده می‌شود. |
| `CLAWHUB_REGISTRY` | بازنویسی URL API رجیستری. |
| `CLAWHUB_CONFIG_PATH` | بازنویسی محل ذخیره وضعیت توکن/پیکربندی توسط CLI. |
| `CLAWHUB_WORKDIR` | بازنویسی دایرکتوری کاری پیش‌فرض. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | غیرفعال کردن Telemetry نصب. |

برای مطالب مرجع عمیق‌تر، به [Telemetry](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
