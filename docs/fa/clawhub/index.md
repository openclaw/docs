---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا plugins
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI مربوط به openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T13:10:06Z"
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
- از CLI جداگانه‌ی `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/لغو حذف استفاده کنید.

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

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار یا حذف/لغو حذف، را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | فرمان رایج                                    |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد   | بسته‌های Plugin برای OpenClaw با فراداده‌ی سازگاری          | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی منبع را نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید. مشخصه‌های Plugin سازگار با npm و بدون پیشوند ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm resolve شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را پیش از اجرای نصب آرشیو اعتبارسنجی می‌کنند. وقتی نسخه‌ی یک بسته یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw بسته‌ی دقیق npm-pack آپلودشده با پسوند `.tgz` را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده‌ی artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

این CLI همچنین برای گردش‌کارهای مستقیم رجیستری، فرمان‌های نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر پوشه‌ی کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساختن طرح دقیق انتشار بدون آپلود، و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده‌ی سازگاری الزامی OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها [CLI](/fa/clawhub/cli) و برای فراداده‌ی Skill [قالب Skill](/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به حساب GitHubای نیاز دارد که به‌اندازه‌ی کافی قدیمی باشد تا از gate آپلود عبور کند. صفحه‌های جزئیات عمومی، تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های خودکار اجرا می‌کند. انتشارهایی که به‌دلیل اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که همچنان برای مالک خود در `/dashboard` قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)، [ممیزی‌های امنیتی](/clawhub/security-audits)، [نظارت و ایمنی حساب](/clawhub/moderation)، و [استفاده‌ی قابل قبول](/fa/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب best-effort بفرستد تا ClawHub بتواند شمارش‌های تجمیعی نصب را محاسبه کند. این رفتار را با این مورد غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

overrideهای محیطی مفید:

| متغیر                        | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگری را override می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را override می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت token/config توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | پوشه‌ی کاری پیش‌فرض را override می‌کند.          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای منابع مرجع عمیق‌تر، [تله‌متری](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
