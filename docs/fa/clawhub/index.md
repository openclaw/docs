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
    generated_at: "2026-06-28T20:41:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و plugins در OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب plugins از ClawHub استفاده کنید.
- برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف از CLI جداگانه‌ی `clawhub` استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

جست‌وجو و نصب plugins با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار یا حذف/بازگردانی حذف،
را می‌خواهید، ClawHub CLI را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | فرمان معمول                                  |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Code plugins  | بسته‌های plugin برای OpenClaw با فراداده‌ی سازگاری           | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | بسته‌های plugin بسته‌بندی‌شده برای توزیع OpenClaw           | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، گزارش‌های تغییرات، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت
فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک skill یا plugin را
بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی
مبدأ را ماندگار می‌کنند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>`
استفاده کنید. مشخصه‌های plugin بدون پیشوند و امن برای npm ممکن است در دوره‌های
گذار راه‌اندازی از طریق npm resolve شوند، و وقتی مبدأ باید صریح باشد،
`npm:<package>` فقط npm باقی می‌ماند.

نصب‌های plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion`
اعلام‌شده را اعتبارسنجی می‌کنند. وقتی نسخه‌ی یک بسته یک آرتیفکت ClawPack منتشر
می‌کند، OpenClaw فایل `.tgz` دقیق npm-pack بارگذاری‌شده را ترجیح می‌دهد، هدر
digest در ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده‌ی آرتیفکت را برای
به‌روزرسانی‌های بعدی ثبت می‌کند.

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

CLI همچنین فرمان‌های نصب/به‌روزرسانی skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و
نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL منتشرشده‌ی skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن گزارش تغییرات.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

plugins را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL در GitHub
منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت برنامه‌ی دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای
خروجی مناسب CI از `--json`.

Code plugins باید فراداده‌ی سازگاری مورد نیاز OpenClaw را در `package.json`
شامل `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` داشته باشند.
برای مرجع کامل فرمان‌ها [CLI](/fa/clawhub/cli) و برای فراداده‌ی skill
[قالب skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و مدیریت محتوا

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار نیازمند
یک حساب GitHub است که سن آن برای عبور از دروازه‌ی بارگذاری کافی باشد. صفحه‌های
جزئیات عمومی، آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای plugin اجرا می‌کند.
انتشارهایی که به‌دلیل اسکن نگه داشته شده‌اند یا مسدود شده‌اند، ممکن است از کاتالوگ
عمومی و سطح‌های نصب ناپدید شوند، در حالی که برای مالکشان در `/dashboard` قابل
مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها
را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود
کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/fa/clawhub/security-audits)،
[مدیریت محتوا و ایمنی حساب](/fa/clawhub/moderation)، و
[استفاده‌ی قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد
نصب best-effort ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند.
این را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیطی:

| متغیر                         | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)،
[HTTP API](/fa/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
