---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Plugin‌ها در رجیستری
    - انتخاب میان روندهای CLI مربوط به openclaw و clawhub
sidebarTitle: ClawHub
summary: مروری عمومی بر ClawHub برای کشف، نصب، انتشار، امنیت، و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانهٔ `clawhub` برای احراز هویت رجیستری، انتشار، حذف/بازیابی حذف، اسکن‌های دوباره، و گردش‌کارهای همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

جست‌وجو و نصب Pluginها با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار، همگام‌سازی، حذف/بازیابی حذف، یا اسکن‌های دوبارهٔ درخواست‌شده توسط مالک را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## آنچه ClawHub میزبانی می‌کند

| سطح           | آنچه ذخیره می‌کند                                           | فرمان معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد   | بسته‌های Plugin مربوط به OpenClaw با فرادادهٔ سازگاری        | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw            | `clawhub package publish <source>`           |
| Souls          | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند     | جریان‌های انتشار Web و API                   |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فرادادهٔ منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید. مشخصات Plugin بدون پیشوند و ایمن برای npm ممکن است هنگام جابه‌جایی‌های راه‌اندازی از طریق npm resolve شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخهٔ بسته یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw فایل دقیق npm-pack `.tgz` بارگذاری‌شده را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را اعتبارسنجی می‌کند، و فرادادهٔ artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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
clawhub sync --all
```

این CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill برای گردش‌کارهای مستقیم رجیستری دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر شاخهٔ کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشهٔ محلی شامل `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: slug مربوط به Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخهٔ semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با کاما، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشهٔ محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت برنامهٔ دقیق انتشار بدون بارگذاری، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json` استفاده کنید.

Pluginهای کد باید فرادادهٔ سازگاری الزامی OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli) و برای فرادادهٔ Skill به [قالب Skill](/fa/clawhub/skill-format) مراجعه کنید.

## امنیت و تعدیل

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب GitHub نیاز دارد که به‌اندازهٔ کافی قدیمی باشد تا از gate بارگذاری عبور کند. صفحه‌های جزئیات عمومی، آخرین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهای نگه‌داشته‌شده به‌دلیل اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، در حالی که برای مالکشان در `/dashboard` همچنان قابل مشاهده باشند.

مالکان می‌توانند برای بازیابی موارد مثبت کاذب، اسکن‌های دوبارهٔ محدود درخواست کنند. گردانندگان و مدیران پلتفرم می‌توانند هنگام رسیدگی به گزارش‌های پشتیبانی، برای هر Skill یا بسته درخواست اسکن دوباره بدهند:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. گردانندگان می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، فرجام‌خواهی‌ها را حل‌وفصل کنند، و حساب‌های سوءاستفاده‌گر را ban کنند. برای جزئیات سیاست و اجرا، [استفادهٔ قابل قبول](/fa/clawhub/acceptable-usage) و [امنیت + تعدیل](/fa/clawhub/security) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

overrideهای مفید محیط:

| متغیر                        | اثر                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود از طریق مرورگر را override می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را override می‌کند.     |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیرهٔ وضعیت token/config توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | شاخهٔ کاری پیش‌فرض را override می‌کند.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را روی `sync` غیرفعال می‌کند.            |

برای منابع مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
