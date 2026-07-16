---
read_when:
    - توضیح ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T15:36:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی Skills و Pluginهای OpenClaw است.

- برای جست‌وجو، نصب و به‌روزرسانی Skills و نیز نصب Pluginها از ClawHub، از فرمان‌های بومی `openclaw` استفاده کنید.
- برای احراز هویت رجیستری، انتشار و گردش‌کارهای حذف/بازیابی، از CLI مستقل `clawhub` استفاده کنید.

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

هنگامی که به گردش‌کارهای احراز هویت‌شده در رجیستری، مانند انتشار یا حذف/بازیابی، نیاز دارید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# یا
pnpm add -g clawhub
```

## محتوای میزبانی‌شده در ClawHub

| سطح           | محتوای ذخیره‌شده                                               | فرمان معمول                                   |
| ------------- | -------------------------------------------------------------- | --------------------------------------------- |
| Skills        | بسته‌های متنی نسخه‌بندی‌شده دارای `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo`     |
| Pluginهای کد  | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری            | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw          | `clawhub package publish <source>`           |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنگارها، فایل‌ها، تعداد دانلودها، ستاره‌ها و خلاصه اسکن‌های امنیتی را ردیابی می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نمایش می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## گردش‌کارهای بومی OpenClaw

فرمان‌های بومی OpenClaw محتوا را در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند همچنان از ClawHub استفاده کنند.

وقتی نصب یک Plugin باید از طریق ClawHub انجام شود، از `clawhub:<package>` استفاده کنید.
مشخصات ساده Plugin که برای npm معتبرند، ممکن است هنگام دوره‌های گذار انتشار از طریق npm رفع شوند؛ و هنگامی که منبع باید صریح باشد، `npm:<package>` صرفاً برای npm باقی می‌ماند.

نصب Pluginها پیش از اجرای نصب بایگانی، سازگاری اعلام‌شده در `pluginApi` و `minGatewayVersion` را اعتبارسنجی می‌کند. وقتی نسخه‌ای از بسته یک مصنوع ClawPack منتشر می‌کند، OpenClaw فایل دقیق npm-pack با نام `.tgz` را ترجیح می‌دهد، سربرگ چکیده ClawHub و بایت‌های دانلودشده را تأیید می‌کند و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

## CLI مربوط به ClawHub

CLI مربوط به ClawHub برای عملیات احراز هویت‌شده در رجیستری است:

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

این فرمان‌ها Skills را در `./skills` زیر پوشه کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی حاوی `SKILL.md` منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های متداول انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنگار.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول که مقدار پیش‌فرض آن‌ها `latest` است.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref` یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

برای ساختن برنامه دقیق انتشار بدون بارگذاری، از `--dry-run` و برای خروجی مناسب CI از `--json` استفاده کنید.

Pluginهای کد باید فراداده سازگاری الزامی OpenClaw، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` را در `package.json` داشته باشند. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli) و برای فراداده Skill به [قالب Skill](/clawhub/skill-format) مراجعه کنید.

## امنیت و نظارت

ClawHub به‌طور پیش‌فرض باز است: همه می‌توانند محتوا بارگذاری کنند، اما انتشار به یک حساب GitHub با قدمت کافی برای عبور از دروازه بارگذاری نیاز دارد. صفحه‌های عمومی جزئیات، پیش از نصب یا دانلود، خلاصه آخرین وضعیت اسکن را نمایش می‌دهند.

ClawHub روی Skills منتشرشده و نسخه‌های Plugin بررسی‌های خودکار اجرا می‌کند. نسخه‌های متوقف‌شده برای اسکن یا مسدودشده ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، اما همچنان برای مالک خود در `/dashboard` قابل مشاهده باشند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند و حساب‌های سوءاستفاده‌گر را مسدود کنند. برای جزئیات خط‌مشی و اعمال آن، به [امنیت](/fa/clawhub/security)،
[ممیزی‌های امنیتی](/clawhub/security-audits)،
[نظارت و ایمنی حساب](/clawhub/moderation) و
[استفاده قابل‌قبول](/clawhub/acceptable-usage) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب را به‌صورت بهترین تلاش ارسال کند تا ClawHub بتواند تعداد کل نصب‌ها را محاسبه کند. با فرمان زیر آن را غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های محیطی مفید:

| متغیر                        | اثر                                               |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`           | URL وب‌سایت مورداستفاده برای ورود مرورگری را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY`           | URL مربوط به API رجیستری را بازنویسی می‌کند.      |
| `CLAWHUB_CONFIG_PATH`           | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`           | پوشه کاری پیش‌فرض را بازنویسی می‌کند.             |
| `CLAWHUB_DISABLE_TELEMETRY=1`           | تله‌متری نصب را غیرفعال می‌کند.                   |

برای مطالب مرجع عمیق‌تر، به [تله‌متری](/clawhub/telemetry)، [API مربوط به HTTP](/clawhub/http-api) و
[عیب‌یابی](/fa/clawhub/troubleshooting) مراجعه کنید.
