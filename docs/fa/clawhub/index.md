---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Plugin
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI مربوط به openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-30T22:25:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و پلاگین‌های OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب پلاگین‌ها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و جریان‌های کاری حذف/بازیابی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

Skills را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

پلاگین‌ها را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی جریان‌های کاری احراز هویت‌شده با رجیستری، مانند انتشار یا حذف/بازیابی، را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | فرمان معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| پلاگین‌های کد  | بسته‌های Plugin OpenClaw همراه با فراداده سازگاری           | `openclaw plugins install clawhub:<package>` |
| پلاگین‌های بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw          | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا پلاگین را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک پلاگین باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصات پلاگین بدون پیشوند که برای npm معتبر هستند ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری اعلام‌شده `pluginApi` و `minGatewayVersion` را اعتبارسنجی می‌کنند. وقتی نسخه‌ای از یک بسته یک آرتیفکت ClawPack منتشر کند، OpenClaw بسته دقیق npm آپلودشده با پسوند `.tgz` را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای کارهای احراز هویت‌شده با رجیستری است:

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

این CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای جریان‌های کاری مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

پلاگین‌ها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت برنامه انتشار دقیق بدون آپلود، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json`.

پلاگین‌های کد باید فراداده سازگاری الزامی OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) و برای فراداده Skill، [قالب Skills](/clawhub/skill-format) را ببینید.

## امنیت و تعدیل‌گری

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به یک حساب GitHub نیاز دارد که به‌اندازه کافی قدیمی باشد تا از گیت آپلود عبور کند. صفحه‌های جزئیات عمومی پیش از نصب یا دانلود، آخرین وضعیت اسکن را خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی که در وضعیت نگه‌داشت اسکن هستند یا مسدود شده‌اند، ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، درحالی‌که همچنان برای مالکشان در `/dashboard` قابل مشاهده هستند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)، [ممیزی‌های امنیتی](/clawhub/security-audits)، [تعدیل‌گری و ایمنی حساب](/clawhub/moderation)، و [استفاده قابل قبول](/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب با بهترین تلاش ارسال کند تا ClawHub بتواند شمارش‌های تجمیعی نصب را محاسبه کند. این مورد را با فرمان زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر                        | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت مورد استفاده برای ورود از مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | جایی را که CLI وضعیت توکن/پیکربندی را ذخیره می‌کند بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای منابع مرجع عمیق‌تر، [تله‌متری](/clawhub/telemetry)، [API HTTP](/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
