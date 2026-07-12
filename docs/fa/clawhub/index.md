---
read_when:
    - توضیح ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب میان روندهای CLI در OpenClaw و ClawHub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای یافتن، نصب، انتشار، امنیت و CLI مربوط به clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T09:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار و گردش‌کارهای حذف/بازیابی استفاده کنید.

وب‌سایت: [clawhub.ai](https://clawhub.ai)

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

هنگامی که به گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار یا حذف/بازیابی، نیاز دارید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# یا
pnpm add -g clawhub
```

## محتوای میزبانی‌شده در ClawHub

| سطح           | محتوای ذخیره‌شده                                              | فرمان معمول                                    |
| ------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌بندی‌شده شامل `SKILL.md` و فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`       |
| Pluginهای کد  | بسته‌های Plugin مربوط به OpenClaw همراه با فراداده سازگاری     | `openclaw plugins install clawhub:<package>`   |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw          | `clawhub package publish <source>`             |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، گزارش‌های تغییرات، فایل‌ها، تعداد بارگیری‌ها، ستاره‌ها و خلاصه اسکن‌های امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نمایش می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را به‌صورت پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند همچنان از ClawHub استفاده کنند.

هنگامی که نصب یک Plugin باید از طریق ClawHub انجام شود، از `clawhub:<package>` استفاده کنید. در دوره‌های انتقال راه‌اندازی، مشخصات ساده و سازگار با npm برای Plugin ممکن است از طریق npm تفکیک شوند و هنگامی که منبع باید صریح باشد، `npm:<package>` فقط به npm محدود می‌ماند.

نصب Pluginها پیش از اجرای نصب بایگانی، سازگاری مقادیر اعلام‌شده `pluginApi` و `minGatewayVersion` را اعتبارسنجی می‌کند. هنگامی که نسخه‌ای از یک بسته، مصنوع ClawPack را منتشر می‌کند، OpenClaw فایل دقیق و بارگذاری‌شده npm-pack با پسوند `.tgz` را ترجیح می‌دهد، سرآیند چکیده ClawHub و بایت‌های بارگیری‌شده را تأیید می‌کند و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

CLI همچنین برای گردش‌کارهای مستقیم رجیستری، فرمان‌های نصب و به‌روزرسانی Skill را ارائه می‌دهد:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

این فرمان‌ها Skills را در `./skills` زیر شاخه کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی حاوی `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های متداول انتشار:

- `--slug <slug>`: نام Skill در نشانی وب منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن گزارش تغییرات.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول؛ مقدار پیش‌فرض `latest` است.

Pluginها را از یک پوشه محلی، `owner/repo`،‏ `owner/repo@ref` یا یک نشانی وب GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساخت برنامه دقیق انتشار بدون بارگذاری و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده الزامی سازگاری OpenClaw را در `package.json` داشته باشند؛ از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli) و برای فراداده Skill به [قالب Skill](/clawhub/skill-format) مراجعه کنید.

## امنیت و نظارت

ClawHub به‌طور پیش‌فرض باز است: همه می‌توانند محتوا بارگذاری کنند، اما انتشار به یک حساب GitHub با قدمت کافی برای عبور از دروازه بارگذاری نیاز دارد. صفحه‌های عمومی جزئیات، آخرین وضعیت اسکن را پیش از نصب یا بارگیری خلاصه می‌کنند.

ClawHub بررسی‌های خودکاری را روی Skills منتشرشده و نسخه‌های Plugin اجرا می‌کند. نسخه‌های متوقف‌شده به‌دلیل اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، اما همچنان برای مالک خود در `/dashboard` قابل مشاهده باشند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات خط‌مشی و اعمال آن، به [امنیت](/clawhub/security)،
[ممیزی‌های امنیتی](/fa/clawhub/security-audits)،
[نظارت و ایمنی حساب](/clawhub/moderation) و
[استفاده قابل‌قبول](/clawhub/acceptable-usage) مراجعه کنید.

## تله‌متری و محیط

هنگامی که در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است رویداد نصب را به‌صورت تلاش‌محور ارسال کند تا ClawHub بتواند تعداد تجمیعی نصب‌ها را محاسبه کند. با دستور زیر این قابلیت را غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                         | اثر                                                   |
| ---------------------------- | ----------------------------------------------------- |
| `CLAWHUB_SITE`               | نشانی وب‌سایت مورداستفاده برای ورود مرورگری را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`           | نشانی API رجیستری را بازنویسی می‌کند.                 |
| `CLAWHUB_CONFIG_PATH`        | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`            | شاخه کاری پیش‌فرض را بازنویسی می‌کند.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند.                       |

برای مطالب مرجع عمیق‌تر، به [تله‌متری](/fa/clawhub/telemetry)، [API مبتنی بر HTTP](/clawhub/http-api) و
[عیب‌یابی](/clawhub/troubleshooting) مراجعه کنید.
