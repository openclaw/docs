---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب، یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI مربوط به openclaw و ClawHub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T17:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از دستورهای بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه‌ی `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف استفاده کنید.

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

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری مانند انتشار یا حذف/بازگردانی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی را میزبانی می‌کند

| سطح           | چیزی که ذخیره می‌کند                                          | دستور معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد  | بسته‌های Plugin مربوط به OpenClaw با فراداده‌ی سازگاری       | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنگاشت‌ها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های پویش امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

دستورهای بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی منبع را ماندگار می‌کنند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصه‌های Plugin ساده و سازگار با npm ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` همچنان فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری اعلام‌شده‌ی `pluginApi` و `minGatewayVersion` را اعتبارسنجی می‌کنند. وقتی یک نسخه‌ی بسته، آرتیفکت ClawPack منتشر می‌کند، OpenClaw بسته‌ی دقیق `.tgz` آپلودشده با npm-pack را ترجیح می‌دهد، سربرگ digest مربوط به ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده‌ی آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

این CLI همچنین برای گردش‌کارهای مستقیم رجیستری، دستورهای نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر پوشه‌ی کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن تغییرنگاشت.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL گیت‌هاب منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت برنامه‌ی دقیق انتشار بدون آپلود، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json`.

Pluginهای کد باید فراداده‌ی الزامی سازگاری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل دستورها، [CLI](/fa/clawhub/cli) را ببینید و برای فراداده‌ی Skill، [قالب Skill](/clawhub/skill-format) را ببینید.

## امنیت و تعدیل‌گری

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به یک حساب گیت‌هاب نیاز دارد که به‌اندازه‌ی کافی قدیمی باشد تا از دروازه‌ی آپلود عبور کند. صفحه‌های جزئیات عمومی، تازه‌ترین وضعیت پویش را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی که در انتظار پویش نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، درحالی‌که همچنان برای مالک خود در `/dashboard` قابل مشاهده‌اند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. تعدیل‌گران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[تعدیل‌گری و ایمنی حساب](/clawhub/moderation)، و
[استفاده‌ی قابل قبول](/clawhub/acceptable-usage) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب در حد بهترین تلاش ارسال کند تا ClawHub بتواند شمار نصب‌های تجمیعی را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

جایگزینی‌های محیطی مفید:

| متغیر                         | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگر را جایگزین می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را جایگزین می‌کند.      |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت توکن/پیکربندی توسط CLI را جایگزین می‌کند. |
| `CLAWHUB_WORKDIR`             | پوشه‌ی کاری پیش‌فرض را جایگزین می‌کند.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                  |

برای منابع مرجع عمیق‌تر، [تله‌متری](/clawhub/telemetry)، [HTTP API](/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
