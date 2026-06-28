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
    generated_at: "2026-06-28T05:07:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و جریان‌های کاری حذف/لغو حذف استفاده کنید.

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

وقتی جریان‌های کاری دارای احراز هویت رجیستری، مانند انتشار یا حذف/لغو حذف را
می‌خواهید، CLI ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح        | آنچه ذخیره می‌کند                                               | فرمان معمول                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد   | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری         | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، گزارش‌های تغییرات، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت
فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده
منبع را پایدار می‌کنند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید.
مشخصات Plugin ساده و سازگار با npm ممکن است هنگام گذارهای راه‌اندازی از طریق npm حل شوند، و
وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری اعلام‌شده `pluginApi` و `minGatewayVersion`
را اعتبارسنجی می‌کنند. وقتی یک نسخه بسته، آرتیفکت ClawPack منتشر می‌کند، OpenClaw فایل
`.tgz` دقیق npm-pack بارگذاری‌شده را ترجیح می‌دهد، هدر digest در ClawHub و بایت‌های دانلودشده
را راستی‌آزمایی می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI ClawHub

CLI ClawHub برای کار دارای احراز هویت رجیستری است:

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

CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill را برای جریان‌های کاری مستقیم رجیستری دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن گزارش تغییرات.
- `--tags <tags>`: برچسب‌های جداشده با کاما، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub
منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت طرح دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای خروجی
مناسب CI از `--json` استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در
`package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) و
برای فراداده Skill، [فرمت Skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به حساب GitHub
با قدمت کافی برای گذر از دروازه بارگذاری نیاز دارد. صفحه‌های جزئیات عمومی، پیش از نصب یا دانلود،
آخرین وضعیت اسکن را خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و نسخه‌های Plugin بررسی‌های خودکار اجرا می‌کند. نسخه‌های
نگه‌داشته‌شده توسط اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، درحالی‌که
برای مالک خود در `/dashboard` همچنان قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا،
[امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/fa/clawhub/security-audits)،
[نظارت و ایمنی حساب](/fa/clawhub/moderation)، و
[استفاده قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## دورسنجی و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب
در حد بهترین تلاش ارسال کند تا ClawHub بتواند شمارش‌های تجمیعی نصب را محاسبه کند. این مورد را با گزینه زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر                      | اثر                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگر را بازنویسی می‌کند.     |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.                    |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | دورسنجی نصب را غیرفعال می‌کند.                        |

برای مطالب مرجع عمیق‌تر، [دورسنجی](/fa/clawhub/telemetry)، [API HTTP](/fa/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
