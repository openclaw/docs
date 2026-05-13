---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Plugin در رجیستری
    - انتخاب بین جریان‌های CLI openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از دستورهای بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای جریان‌های کاری احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

Skills را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Pluginها را با OpenClaw جست‌وجو و نصب کنید:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی جریان‌های کاری نیازمند احراز هویت رجیستری مانند انتشار، همگام‌سازی، یا حذف/بازگردانی حذف می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | دستور معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد   | بسته‌های Plugin برای OpenClaw با فراداده سازگاری             | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |
| Souls          | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند      | جریان‌های انتشار وب و API                   |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را دنبال می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

دستورهای بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را پایدار نگه می‌دارند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصات Plugin بدون پیشوند که برای npm امن هستند ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب Pluginها پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کند. وقتی نسخه‌ای از یک بسته یک مصنوع ClawPack منتشر می‌کند، OpenClaw فایل `.tgz` دقیق آپلودشده با npm-pack را ترجیح می‌دهد، سربرگ digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI ClawHub

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
clawhub sync --all
```

CLI همچنین دستورهای نصب/به‌روزرسانی Skill برای جریان‌های کاری مستقیم رجیستری دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی حاوی `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: slug مربوط به Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL گیت‌هاب منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساختن برنامه انتشار دقیق بدون آپلود، و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل دستور، [CLI](/fa/clawhub/cli) و برای فراداده Skill، [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار به یک حساب گیت‌هاب نیاز دارد که به‌اندازه کافی قدیمی باشد تا از دروازه آپلود عبور کند. صفحه‌های جزئیات عمومی، آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills و انتشارهای Plugin اجرا می‌کند. انتشارهایی که در حالت نگه‌داری اسکن هستند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، درحالی‌که همچنان برای مالکشان در `/dashboard` قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [استفاده قابل‌قبول](/fa/clawhub/acceptable-usage) و [امنیت + نظارت](/fa/clawhub/security) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند شمار نصب‌ها را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر                        | اثر                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را روی `sync` غیرفعال می‌کند.           |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
