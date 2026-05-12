---
read_when:
    - توضیح اینکه ClawHub چیست
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - انتخاب بین جریان‌های CLI openclaw و clawhub
sidebarTitle: ClawHub
summary: نمای کلی عمومی ClawHub برای کشف، نصب، انتشار، امنیت و CLI ‏clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:49:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub رجیستری عمومی برای Skills و Pluginهای OpenClaw است.

- از دستورهای بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای احراز هویت رجیستری، انتشار، حذف/بازیابی حذف، و گردش‌کارهای همگام‌سازی استفاده کنید.

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

وقتی گردش‌کارهای نیازمند احراز هویت رجیستری، مانند انتشار، همگام‌سازی، یا حذف/بازیابی حذف را می‌خواهید، CLI مربوط به ClawHub را نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub چه چیزهایی را میزبانی می‌کند

| سطح | آنچه ذخیره می‌کند | دستور رایج |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | بسته‌های متنی نسخه‌دار با `SKILL.md` به‌همراه فایل‌های پشتیبان | `openclaw skills install <slug>` |
| Pluginهای کد | بسته‌های Plugin متعلق به OpenClaw با فراداده سازگاری | `openclaw plugins install clawhub:<package>` |
| Pluginهای بسته‌ای | بسته‌های Plugin بسته‌بندی‌شده برای توزیع OpenClaw | `clawhub package publish <source>` |
| روح‌ها | بسته‌های `SOUL.md` که فقط در onlycrabs.ai نمایش داده می‌شوند | جریان‌های انتشار وب و API |

ClawHub نسخه‌های semver، برچسب‌هایی مانند `latest`، تغییرنامه‌ها، فایل‌ها، دانلودها، ستاره‌ها، و خلاصه‌های اسکن امنیتی را رهگیری می‌کند. صفحه‌های عمومی وضعیت فعلی رجیستری را نشان می‌دهند تا کاربران بتوانند پیش از نصب، یک Skill یا Plugin را بررسی کنند.

## جریان‌های بومی OpenClaw

دستورهای بومی OpenClaw در فضای کاری فعال OpenClaw نصب می‌کنند و فراداده منبع را ماندگار می‌کنند تا دستورهای به‌روزرسانی بعدی بتوانند روی ClawHub باقی بمانند.

وقتی نصب یک Plugin باید از طریق ClawHub حل شود، از `clawhub:<package>` استفاده کنید. مشخصه‌های ساده Plugin که برای npm امن هستند ممکن است در زمان جابه‌جایی‌های راه‌اندازی از طریق npm حل شوند، و وقتی منبع باید صریح باشد، `npm:<package>` فقط روی npm باقی می‌ماند.

نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری اعلام‌شده `pluginApi` و `minGatewayVersion` را اعتبارسنجی می‌کنند. وقتی یک نسخه بسته، آرتیفکت ClawPack منتشر می‌کند، OpenClaw همان `.tgz` آپلودشده از npm-pack را ترجیح می‌دهد، سرآیند digest مربوط به ClawHub و بایت‌های دانلودشده را تأیید می‌کند، و فراداده آرتیفکت را برای به‌روزرسانی‌های بعدی ثبت می‌کند.

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

این CLI همچنین برای گردش‌کارهای مستقیم رجیستری، دستورهای نصب/به‌روزرسانی Skill دارد:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

این دستورها Skills را در `./skills` زیر دایرکتوری کاری فعلی نصب می‌کنند و نسخه‌های نصب‌شده را در `.clawhub/lock.json` ثبت می‌کنند.

## انتشار

Skills را از یک پوشه محلی که شامل `SKILL.md` است منتشر کنید:

```bash
clawhub skill publish <path>
```

گزینه‌های رایج انتشار:

- `--slug <slug>`: اسلاگ Skill.
- `--name <name>`: نام نمایشی.
- `--version <version>`: نسخه semver.
- `--changelog <text>`: متن تغییرنامه.
- `--tags <tags>`: برچسب‌های جداشده با ویرگول، با مقدار پیش‌فرض `latest`.

Pluginها را از یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک URL مربوط به GitHub منتشر کنید:

```bash
clawhub package publish <source>
```

از `--dry-run` برای ساختن طرح دقیق انتشار بدون آپلود، و از `--json` برای خروجی مناسب CI استفاده کنید.

Pluginهای کد باید فراداده سازگاری مورد نیاز OpenClaw را در `package.json` شامل کنند، از جمله `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion`. برای مرجع کامل دستورها، [CLI](/fa/clawhub/cli) و برای فراداده Skill، [قالب Skill](/fa/clawhub/skill-format) را ببینید.

## امنیت و تعدیل‌گری

ClawHub به‌صورت پیش‌فرض باز است: هر کسی می‌تواند آپلود کند، اما انتشار نیازمند حساب GitHub با قدمت کافی برای عبور از دروازه آپلود است. صفحه‌های جزئیات عمومی پیش از نصب یا دانلود، وضعیت آخرین اسکن را خلاصه می‌کنند.

ClawHub بررسی‌های خودکار را روی Skills و نسخه‌های Plugin منتشرشده اجرا می‌کند. نسخه‌هایی که به‌دلیل اسکن نگه داشته شده‌اند یا مسدود شده‌اند ممکن است از کاتالوگ عمومی و سطوح نصب ناپدید شوند، در حالی که همچنان برای مالکشان در `/dashboard` قابل مشاهده باشند.

کاربران واردشده می‌توانند Skills و بسته‌ها را گزارش کنند. ناظران می‌توانند گزارش‌ها را بررسی کنند، محتوا را پنهان یا بازیابی کنند، و حساب‌های سوءاستفاده‌گر را ممنوع کنند. برای جزئیات سیاست و اجرا، [استفاده قابل قبول](/fa/clawhub/acceptable-usage) و [امنیت + تعدیل‌گری](/fa/clawhub/security) را ببینید.

## تله‌متری و محیط

وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی ارسال می‌کند تا ClawHub بتواند تعداد نصب‌ها را محاسبه کند. این مورد را با دستور زیر غیرفعال کنید:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

بازنویسی‌های مفید محیطی:

| متغیر | اثر |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | URL سایت استفاده‌شده برای ورود از طریق مرورگر را بازنویسی می‌کند. |
| `CLAWHUB_REGISTRY` | URL مربوط به API رجیستری را بازنویسی می‌کند. |
| `CLAWHUB_CONFIG_PATH` | محل ذخیره وضعیت token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR` | دایرکتوری کاری پیش‌فرض را بازنویسی می‌کند. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری روی `sync` را غیرفعال می‌کند. |

برای مطالب مرجع عمیق‌تر، [تله‌متری](/fa/clawhub/telemetry)، [HTTP API](/fa/clawhub/http-api)، و [عیب‌یابی](/fa/clawhub/troubleshooting) را ببینید.
