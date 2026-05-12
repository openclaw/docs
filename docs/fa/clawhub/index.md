---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Plugin در رجیستری
    - انتخاب بین جریان‌های CLI openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Plugin‌های OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Plugin‌ها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، حذف/بازیابی حذف، و گردش‌کارهای همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

Skills را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin‌ها را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی به گردش‌کارهای دارای احراز هویت رجیستری مانند انتشار، همگام‌سازی، یا حذف/بازیابی حذف نیاز دارید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی را میزبانی می‌کند

| سطح | آنچه ذخیره می‌کند | فرمان معمول |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>` |
| Plugin‌های کد | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری | `openclaw plugins install clawhub:<package>` |
| Plugin‌های بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw | `clawhub package publish <source>` |
| Souls | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند | جریان‌های انتشار وب و API |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را ماندگار می‌کنند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصه‌های Plugin سازگار با npm و بدون پیشوند ممکن است هنگام جابه‌جایی‌های راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی نسخه‌ای از بسته یک مصنوع ClawPack منتشر می‌کند، OpenClaw همان `.tgz` بارگذاری‌شده با npm-pack را ترجیح می‌دهد، سرآیند digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای کارهای دارای احراز هویت رجیستری است:

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

این CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی حاوی `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: اسلاگ Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Plugin‌ها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساخت برنامه انتشار دقیق بدون بارگذاری، و از `--json` برای خروجی مناسب CI استفاده کنید.

Plugin‌های کد باید فراداده سازگاری موردنیاز OpenClaw را در `package.json` شامل شوند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli) و برای فراداده Skill به [فرمت Skill](/fa/clawhub/skill-format) مراجعه کنید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هرکسی می‌تواند بارگذاری کند، اما انتشار نیازمند یک حساب GitHub است که به‌اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند. صفحه‌های جزئیات عمومی پیش از نصب یا دانلود، آخرین وضعیت اسکن را خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های خودکار اجرا می‌کند. انتشارهای نگه‌داشته‌شده توسط اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که همچنان برای مالک خود در `/dashboard` قابل مشاهده‌اند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا به [استفاده قابل قبول](/fa/clawhub/acceptable-usage) و [امنیت + نظارت](/fa/clawhub/security) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | URL سایت استفاده‌شده برای ورود از مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY` | URL مربوط به API رجیستری را بازنویسی می‌کند. |
| `CLAWHUB_CONFIG_PATH` | محل ذخیره وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR` | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری روی `sync` را غیرفعال می‌کند. |

برای مطالب مرجع عمیق‌تر به [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
