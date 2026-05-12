---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه‌ی `clawhub` برای احراز هویت رجیستری، انتشار، حذف/بازیابی حذف، و گردش‌کارهای همگام‌سازی استفاده کنید.

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

وقتی گردش‌کارهای دارای احراز هویت رجیستری مانند انتشار، همگام‌سازی، یا حذف/بازیابی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## آنچه ClawHub میزبانی می‌کند

| سطح        | آنچه ذخیره می‌کند                                               | فرمان معمول                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد   | بسته‌های Plugin مربوط به OpenClaw با فراداده‌ی سازگاری         | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |
| Souls          | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند                      | گردش‌کارهای انتشار وب و API                    |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها،
دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت
فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده‌ی
منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید.
مشخصه‌های Plugin سازگار با npm و بدون پیشوند ممکن است هنگام جابه‌جایی‌های راه‌اندازی از طریق npm resolve شوند، و
وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را
پیش از اجرای نصب آرشیو اعتبارسنجی می‌کنند. وقتی نسخه‌ی یک بسته یک مصنوع
ClawPack منتشر می‌کند، OpenClaw بسته‌ی دقیق `.tgz` بارگذاری‌شده با npm-pack را ترجیح می‌دهد، سرآیند digest مربوط به
ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده‌ی مصنوع را برای
به‌روزرسانی‌های بعدی ثبت می‌کند.

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

CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند
و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه‌ی محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: slug مربوط به Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه‌ی semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه‌ی محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت طرح دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json`
استفاده کنید.

Pluginهای کد باید فراداده‌ی سازگاری الزامی OpenClaw را در
`package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و
`openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli)
و برای فراداده‌ی Skill به [قالب Skill](/fa/clawhub/skill-format) مراجعه کنید.

## امنیت و تعدیل محتوا

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب GitHub نیاز دارد
که به‌اندازه‌ی کافی قدیمی باشد تا از دروازه‌ی بارگذاری عبور کند. صفحه‌های جزئیات عمومی، پیش از نصب یا دانلود،
آخرین وضعیت اسکن را خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی که به‌دلیل اسکن نگه داشته شده‌اند
یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که
برای مالکشان در `/dashboard` قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند،
محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، به
[کاربرد قابل قبول](/fa/clawhub/acceptable-usage) و
[امنیت + تعدیل محتوا](/fa/clawhub/security) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا
ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با گزینه‌ی زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                      | اثر                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت مورد استفاده برای ورود مرورگری را بازنویسی می‌کند.     |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.                    |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره‌ی وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را در `sync` غیرفعال می‌کند.                      |

برای مرجع عمیق‌تر، به [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و
[عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
