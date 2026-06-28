---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب، یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: مرور کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T08:02:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و plugins در OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب plugins از ClawHub استفاده کنید.
- از CLI جداگانه‌ی `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف استفاده کنید.

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

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری مانند انتشار یا حذف/بازگردانی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح | چیزی که ذخیره می‌کند | فرمان معمول |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo` |
| plugins کدی | بسته‌های plugin مربوط به OpenClaw با فراداده‌ی سازگاری | `openclaw plugins install clawhub:<package>` |
| plugins بسته‌ای | بسته‌های plugin بسته‌بندی‌شده برای توزیع OpenClaw | `clawhub package publish <source>` |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک skill یا plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی منبع را نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید. مشخصات plugin بدون پیشوند که برای npm امن هستند ممکن است هنگام جابه‌جایی‌های راه‌اندازی از طریق npm resolve شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه‌ی بسته، artifact مربوط به ClawPack را منتشر می‌کند، OpenClaw همان `.tgz` دقیقِ npm-pack بارگذاری‌شده را ترجیح می‌دهد، digest header مربوط به ClawHub و بایت‌های دانلودشده را بررسی می‌کند، و فراداده‌ی artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای کارهای نیازمند احراز هویت رجیستری است:

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

این CLI همچنین فرمان‌های نصب/به‌روزرسانی skill را برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

آن فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی شامل `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

plugins را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساختن برنامه‌ی دقیق انتشار بدون بارگذاری، و از `--json` برای خروجی مناسب CI استفاده کنید.

plugins کدی باید فراداده‌ی سازگاری الزامی OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) و برای فراداده‌ی skill، [قالب skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به حساب GitHub نیاز دارد که به اندازه‌ی کافی قدیمی باشد تا از gate بارگذاری عبور کند. صفحه‌های جزئیات عمومی، تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای plugin اجرا می‌کند. انتشارهای نگه‌داشته‌شده توسط اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که برای مالکشان در `/dashboard` قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را ban کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)، [ممیزی‌های امنیتی](/fa/clawhub/security-audits)، [نظارت و ایمنی حساب](/fa/clawhub/moderation)، و [استفاده‌ی قابل‌قبول](/fa/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالی که وارد شده‌اید `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب best-effort ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند. این را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | URL سایت استفاده‌شده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY` | URL مربوط به API رجیستری را بازنویسی می‌کند. |
| `CLAWHUB_CONFIG_PATH` | محل ذخیره‌ی وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR` | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند. |

برای منابع مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
