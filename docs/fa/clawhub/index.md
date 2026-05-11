---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI مربوط به openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، اسکن‌های دوباره، و گردش‌کارهای همگام‌سازی استفاده کنید.

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

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری مانند انتشار، همگام‌سازی، حذف/بازگردانی حذف، یا اسکن‌های دوباره درخواست‌شده توسط مالک را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی را میزبانی می‌کند

| سطح           | چیزی که ذخیره می‌کند                                          | فرمان معمول                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد   | بسته‌های Plugin برای OpenClaw با فراداده سازگاری              | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw             | `clawhub package publish <source>`           |
| Souls          | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند      | جریان‌های انتشار وب و API                    |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک skill یا plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در workspace فعال OpenClaw نصب می‌کنند و فراداده منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصات Plugin بدون پیشوند و سازگار با npm ممکن است هنگام جابه‌جایی‌های زمان راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی یک نسخه بسته، مصنوع ClawPack منتشر می‌کند، OpenClaw فایل npm-pack `.tgz` بارگذاری‌شده دقیق را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

این CLI همچنین برای گردش‌کارهای مستقیم رجیستری، فرمان‌های نصب/به‌روزرسانی skill دارد:

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: slug مربوط به skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساخت برنامه انتشار دقیق بدون بارگذاری، از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json`.

Pluginهای کد باید فراداده سازگاری ضروری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) را ببینید و برای فراداده skill، [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار نیازمند حساب GitHub با قدمت کافی برای عبور از دروازه بارگذاری است. صفحه‌های جزئیات عمومی، پیش از نصب یا دانلود، وضعیت آخرین اسکن را خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند. انتشارهایی که به‌دلیل اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطح‌های نصب ناپدید شوند، در حالی که همچنان برای مالکشان در `/dashboard` قابل مشاهده می‌مانند.

مالکان می‌توانند برای بازیابی از مثبت کاذب، درخواست اسکن دوباره محدود بدهند. ناظران و مدیران پلتفرم می‌توانند هنگام رسیدگی به گزارش‌های پشتیبانی، برای هر skill یا package درخواست اسکن دوباره بدهند:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

کاربران واردشده می‌توانند Skills و packageها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، درخواست‌های تجدیدنظر را حل کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [استفاده قابل قبول](/fa/clawhub/acceptable-usage) و [امنیت + نظارت](/fa/clawhub/security) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                        | اثر                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایتی را که برای ورود از مرورگر استفاده می‌شود بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را بازنویسی می‌کند.      |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را روی `sync` غیرفعال می‌کند.            |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
