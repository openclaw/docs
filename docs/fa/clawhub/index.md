---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب، یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI در openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت، و CLI مربوط به ClawHub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T07:32:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و برای نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، و گردش‌کارهای حذف/بازگردانی حذف استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

جست‌وجو و نصب Skills با OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

جست‌وجو و نصب Pluginها با OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

وقتی گردش‌کارهای دارای احراز هویت رجیستری مانند انتشار یا حذف/بازگردانی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی را میزبانی می‌کند

| سطح | آنچه ذخیره می‌کند | فرمان معمول |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install @openclaw/demo` |
| Pluginهای کد | بسته‌های Plugin مربوط به OpenClaw با فراداده سازگاری | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin آماده‌شده برای توزیع OpenClaw | `clawhub package publish <source>` |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، changelogها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را پیگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

فرمان‌های بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را پایدار نگه می‌دارند تا فرمان‌های به‌روزرسانی بعدی بتوانند روی ClawHub بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصات Plugin بدون پیشوند که برای npm معتبر هستند ممکن است هنگام جابه‌جایی‌های زمان عرضه از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط روی npm می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند. وقتی نسخه‌ای از یک بسته یک مصنوع ClawPack منتشر می‌کند، OpenClaw بسته دقیق npm-pack بارگذاری‌شده با پسوند `.tgz` را ترجیح می‌دهد، هدر digest مربوط به ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده مصنوع را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: نام URL مربوط به Skill منتشرشده.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن changelog.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساخت برنامه دقیق انتشار بدون بارگذاری، و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده سازگاری ضروری OpenClaw را در `package.json` داشته باشند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل فرمان‌ها به [CLI](/fa/clawhub/cli) و برای فراداده Skill به [قالب Skill](/clawhub/skill-format) مراجعه کنید.

## امنیت و تعدیل محتوا

ClawHub به‌صورت پیش‌فرض باز است: هرکسی می‌تواند بارگذاری کند، اما انتشار نیازمند یک حساب GitHub است که به‌اندازه کافی قدیمی باشد تا از دروازه بارگذاری عبور کند. صفحه‌های جزئیات عمومی، تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود خلاصه می‌کنند.

ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های خودکار اجرا می‌کند. انتشارهایی که به‌دلیل اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، در حالی که همچنان برای مالک خود در `/dashboard` قابل مشاهده می‌مانند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را ممنوع کنند. برای جزئیات سیاست و اجرا، به [امنیت](/clawhub/security)، [ممیزی‌های امنیتی](/fa/clawhub/security-audits)، [تعدیل محتوا و ایمنی حساب](/clawhub/moderation)، و [استفاده قابل قبول](/clawhub/acceptable-usage) مراجعه کنید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub install` را اجرا می‌کنید، CLI ممکن است یک رویداد نصب best-effort ارسال کند تا ClawHub بتواند شمارش‌های تجمیعی نصب را محاسبه کند. این را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیط:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | URL سایت استفاده‌شده برای ورود از مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY` | URL مربوط به API رجیستری را بازنویسی می‌کند. |
| `CLAWHUB_CONFIG_PATH` | محل ذخیره وضعیت توکن/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR` | پوشه کاری پیش‌فرض را بازنویسی می‌کند. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری نصب را غیرفعال می‌کند. |

برای مطالب مرجع عمیق‌تر، به [تله‌متری](/fa/clawhub/telemetry)، [API مربوط به HTTP](/clawhub/http-api)، و [عیب‌یابی](/clawhub/troubleshooting) مراجعه کنید.
