---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Plugin‌ها
    - انتشار Skills یا Plugin‌ها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: مرور کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T07:41:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از دستورهای بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و برای نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/لغو حذف استفاده کنید.

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

وقتی گردش‌کارهای احراز هویت‌شده در رجیستری مانند انتشار یا حذف/لغو حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## آنچه ClawHub میزبانی می‌کند

| سطح | آنچه ذخیره می‌کند | دستور معمول |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo` |
| Pluginهای کد | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw | `clawhub package publish <source>` |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها، دانلودها، ستاره‌ها و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

دستورهای بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را پایدار نگه می‌دارند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید. مشخصات Plugin ساده و سازگار با npm ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm resolve شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی نسخه‌ای از یک بسته یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw بسته دقیق `.tgz` آپلودشده با npm-pack را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای کارهای احراز هویت‌شده در رجیستری است:

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

این CLI همچنین دستورهای نصب/به‌روزرسانی skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی دارای `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref` یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساخت طرح انتشار دقیق بدون آپلود، و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل دستورها، [CLI](/fa/clawhub/cli) و برای فراداده skill، [قالب skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌طور پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به یک حساب GitHub نیاز دارد که به‌اندازه کافی قدیمی باشد تا از دروازه آپلود عبور کند. صفحه‌های جزئیات عمومی، تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های خودکار اجرا می‌کند. انتشارهای نگه‌داشته‌شده توسط اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که برای مالک خود در `/dashboard` همچنان قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)، [ممیزی‌های امنیتی](/fa/clawhub/security-audits)، [نظارت و ایمنی حساب](/fa/clawhub/moderation)، و [استفاده قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب best-effort ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند. این را با مورد زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | URL سایت استفاده‌شده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY` | URL API رجیستری را بازنویسی می‌کند. |
| `CLAWHUB_CONFIG_PATH` | جایی را که CLI وضعیت توکن/پیکربندی را ذخیره می‌کند بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR` | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند. |

برای مواد مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [API HTTP](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
