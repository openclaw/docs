---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T01:00:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub، از دستورهای بومی `openclaw` استفاده کنید.
- برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازیابی حذف، از CLI جداگانه `clawhub` استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

با OpenClaw، Skills را جست‌وجو و نصب کنید:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

با OpenClaw، Pluginها را جست‌وجو و نصب کنید:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای احرازشده با رجیستری، مانند انتشار یا حذف/بازیابی حذف را می‌خواهید،
ClawHub CLI را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | دستور رایج                                    |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد   | بسته‌های Plugin OpenClaw با فراداده سازگاری                 | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw           | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت
فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

دستورهای بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را
نگه می‌دارند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید.
مشخصات Plugin ساده و سازگار با npm ممکن است هنگام جابه‌جایی‌های آغازین از طریق npm حل شوند، و
وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion`
اعلام‌شده را اعتبارسنجی می‌کند. وقتی نسخه‌ای از بسته یک آرتیفکت ClawPack منتشر می‌کند،
OpenClaw بسته دقیق npm-pack بارگذاری‌شده `.tgz` را ترجیح می‌دهد، سرآیند digest ClawHub
و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## ClawHub CLI

ClawHub CLI برای کارهای احرازشده با رجیستری است:

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

CLI همچنین برای گردش‌کارهای مستقیم رجیستری، دستورهای نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL منتشرشده Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با کاما، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL
GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای
خروجی مناسب CI از `--json`.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در
`package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل دستورها، [CLI](/fa/clawhub/cli)
و برای فراداده Skill، [قالب Skill](/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب
GitHub نیاز دارد که به‌اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند. صفحه‌های جزئیات عمومی
پیش از نصب یا دانلود، وضعیت آخرین اسکن را خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی که
در انتظار اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند،
درحالی‌که همچنان برای مالک خود در `/dashboard` قابل مشاهده‌اند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، ببینید:
[امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[نظارت و ایمنی حساب](/clawhub/moderation)، و
[استفاده قابل قبول](/fa/clawhub/acceptable-usage).

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب با بهترین تلاش
ارسال کند تا ClawHub بتواند شمارش‌های تجمعی نصب را محاسبه کند. این را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                         | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایتی را که برای ورود مرورگر استفاده می‌شود بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL API رجیستری را بازنویسی می‌کند.              |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
