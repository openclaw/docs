---
read_when:
    - توضیح اینکه ClawHub چیست
    - جستجو، نصب یا به‌روزرسانی Skills یا Plugin‌ها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین روندهای CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- برای احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و گردش‌کارهای همگام‌سازی از CLI جداگانه `clawhub` استفاده کنید.

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

وقتی گردش‌کارهای دارای احراز هویت رجیستری مانند انتشار، همگام‌سازی، یا حذف/بازگردانی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## چیزهایی که ClawHub میزبانی می‌کند

| سطح           | چیزی که ذخیره می‌کند                                      | فرمان معمول                                  |
| ------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌بندی‌شده با `SKILL.md` و فایل‌های پشتیبان | `openclaw skills install <slug>`             |
| Pluginهای کد  | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری       | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته | بسته‌های Plugin آماده برای توزیع OpenClaw                 | `clawhub package publish <source>`           |
| Souls         | بسته‌های `SOUL.md` که در onlycrabs.ai نمایش داده می‌شوند   | جریان‌های انتشار وب و API                    |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub resolve شود، از `clawhub:<package>` استفاده کنید. مشخصه‌های Plugin ایمن برای npm ممکن است هنگام گذارهای انتشار از طریق npm resolve شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی نسخه‌ای از یک بسته یک artifact از نوع ClawPack منتشر کند، OpenClaw فایل `.tgz` دقیق npm-pack بارگذاری‌شده را ترجیح می‌دهد، سرآیند digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده artifact را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

این CLI همچنین فرمان‌های نصب/به‌روزرسانی Skill را برای گردش‌کارهای مستقیم رجیستری دارد:

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

- `--slug <slug>`: slug مربوط به Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه دقیق انتشار بدون بارگذاری از `--dry-run` استفاده کنید، و برای خروجی مناسب CI از `--json`.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها، [CLI](/fa/clawhub/cli) و برای فراداده Skill، [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند بارگذاری کند، اما انتشار به یک حساب GitHub نیاز دارد که به‌اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند. صفحه‌های جزئیات عمومی، پیش از نصب یا دانلود، آخرین وضعیت اسکن را خلاصه می‌کنند.

ClawHub روی Skills و نسخه‌های منتشرشده Pluginها بررسی‌های خودکار اجرا می‌کند. نسخه‌های نگه‌داشته‌شده در اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، در حالی که برای مالکشان در `/dashboard` همچنان قابل مشاهده‌اند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات سیاست و اجرا، [کاربری قابل قبول](/fa/clawhub/acceptable-usage) و [امنیت + نظارت](/fa/clawhub/security) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با فرمان زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

overrideهای محیطی مفید:

| متغیر                        | اثر                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت استفاده‌شده برای ورود مرورگر را override می‌کند. |
| `CLAWHUB_REGISTRY`            | URL مربوط به API رجیستری را override می‌کند.      |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره وضعیت token/config توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | دایرکتوری کاری پیش‌فرض را override می‌کند.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را در `sync` غیرفعال می‌کند.             |

برای مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
