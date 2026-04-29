---
read_when:
    - جست‌وجو، نصب، یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - پیکربندی CLI مربوط به clawhub یا بازنویسی‌های محیطی آن
sidebarTitle: ClawHub
summary: 'ClawHub: رجیستری عمومی برای Skills و Pluginهای OpenClaw، جریان‌های نصب بومی، و CLI ‏clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-29T23:40:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub رجیستری عمومی برای **Skills و Pluginهای OpenClaw** است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills، و برای نصب Pluginها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای جریان‌های کاری احراز هویت رجیستری، انتشار، حذف/بازیابی حذف، و همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    یک نشست جدید OpenClaw شروع کنید — مهارت جدید را شناسایی می‌کند.
  </Step>
  <Step title="Publish (optional)">
    برای جریان‌های کاری احرازشده با رجیستری (انتشار، همگام‌سازی، مدیریت)،
    CLI جداگانه `clawhub` را نصب کنید:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## جریان‌های بومی OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    فرمان‌های بومی `openclaw` در فضای کاری فعال شما نصب می‌کنند و
    فراداده منبع را نگه می‌دارند تا فراخوانی‌های بعدی `update` بتوانند روی ClawHub بمانند.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    مشخصه‌های ساده و سازگار با npm برای Plugin نیز پیش از npm در ClawHub امتحان می‌شوند:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    وقتی می‌خواهید فقط با npm و بدون جست‌وجوی
    ClawHub حل‌وفصل شود، از `npm:<package>` استفاده کنید:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    نصب Pluginها پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و
    `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کند، بنابراین
    میزبان‌های ناسازگار زود و بسته شکست می‌خورند، به‌جای اینکه بسته
    به‌صورت ناقص نصب شود.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` فقط خانواده‌های Plugin قابل‌نصب را می‌پذیرد.
اگر یک بسته ClawHub در واقع یک Skill باشد، OpenClaw متوقف می‌شود و
در عوض شما را به `openclaw skills install <slug>` راهنمایی می‌کند.

نصب‌های ناشناس Plugin از ClawHub برای بسته‌های خصوصی نیز بسته شکست می‌خورند.
کانال‌های اجتماعی یا سایر کانال‌های غیررسمی همچنان می‌توانند نصب شوند، اما OpenClaw
هشدار می‌دهد تا اپراتورها بتوانند پیش از فعال‌سازی، منبع و راستی‌آزمایی را بررسی کنند.
</Note>

## ClawHub چیست

- یک رجیستری عمومی برای Skills و Pluginهای OpenClaw.
- یک مخزن نسخه‌دار برای بسته‌های Skill و فراداده.
- یک سطح کشف برای جست‌وجو، برچسب‌ها، و سیگنال‌های استفاده.

یک Skill معمولی، بسته‌ای نسخه‌دار از فایل‌ها است که شامل موارد زیر می‌شود:

- یک فایل `SKILL.md` با توضیح اصلی و نحوه استفاده.
- پیکربندی‌ها، اسکریپت‌ها، یا فایل‌های پشتیبان اختیاری که Skill از آن‌ها استفاده می‌کند.
- فراداده‌ای مانند برچسب‌ها، خلاصه، و الزامات نصب.

ClawHub از فراداده برای توان‌دهی به کشف و نمایش امن
قابلیت‌های Skill استفاده می‌کند. رجیستری سیگنال‌های استفاده (ستاره‌ها، دانلودها) را ردیابی می‌کند تا
رتبه‌بندی و دیده‌شدن را بهبود دهد. هر انتشار یک نسخه semver جدید ایجاد می‌کند،
و رجیستری تاریخچه نسخه‌ها را نگه می‌دارد تا کاربران بتوانند تغییرات را حسابرسی کنند.

## فضای کاری و بارگذاری Skill

CLI جداگانه `clawhub` نیز Skills را در `./skills` زیر
دایرکتوری کاری فعلی شما نصب می‌کند. اگر یک فضای کاری OpenClaw پیکربندی شده باشد،
`clawhub` به آن فضای کاری برمی‌گردد مگر اینکه `--workdir`
(یا `CLAWHUB_WORKDIR`) را بازنویسی کنید. OpenClaw مهارت‌های فضای کاری را از
`<workspace>/skills` بارگذاری می‌کند و آن‌ها را در نشست **بعدی** شناسایی می‌کند.

اگر از قبل از `~/.openclaw/skills` یا Skills همراه استفاده می‌کنید، Skills فضای کاری
اولویت دارند. برای جزئیات بیشتر درباره اینکه Skills چگونه بارگذاری،
اشتراک‌گذاری، و کنترل می‌شوند، [Skills](/fa/tools/skills) را ببینید.

## قابلیت‌های سرویس

| قابلیت                  | یادداشت‌ها                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| مرور عمومی          | Skills و محتوای `SKILL.md` آن‌ها به‌صورت عمومی قابل مشاهده هستند.          |
| جست‌وجو                   | مبتنی بر امبدینگ (جست‌وجوی برداری)، نه فقط کلیدواژه‌ها.               |
| نسخه‌بندی               | Semver، تغییرنامه‌ها، و برچسب‌ها (از جمله `latest`).                  |
| دانلودها                | Zip برای هر نسخه.                                                    |
| ستاره‌ها و دیدگاه‌ها       | بازخورد جامعه.                                                 |
| خلاصه‌های اسکن امنیتی  | صفحه‌های جزئیات پیش از نصب یا دانلود، آخرین وضعیت اسکن را نشان می‌دهند. |
| صفحه‌های جزئیات اسکنر     | نتایج VirusTotal، ClawScan، و تحلیل ایستا پیوندهای عمیق دارند.  |
| داشبورد بازیابی مالک | ناشران می‌توانند محتوای تحت مالکیت نگه‌داشته‌شده به‌دلیل اسکن را از `/dashboard` ببینند.       |
| اسکن‌های مجدد به‌درخواست مالک  | مالکان می‌توانند برای بازیابی مثبت کاذب، اسکن‌های مجدد محدود درخواست کنند.     |
| مدیریت محتوا               | تأییدها و حسابرسی‌ها.                                               |
| API مناسب CLI         | مناسب برای خودکارسازی و اسکریپت‌نویسی.                              |

## امنیت و مدیریت محتوا

ClawHub به‌صورت پیش‌فرض باز است — هر کسی می‌تواند Skills بارگذاری کند، اما یک حساب GitHub
برای انتشار باید **حداقل یک هفته عمر داشته باشد**. این کار سوءاستفاده را کند می‌کند
بدون اینکه مشارکت‌کنندگان معتبر را مسدود کند.

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub بررسی‌های امنیتی خودکار را روی Skills و انتشارهای Plugin
    منتشرشده اجرا می‌کند. صفحه‌های جزئیات عمومی نتیجه فعلی را خلاصه می‌کنند، و ردیف‌های اسکنر
    به صفحه‌های جزئیات اختصاصی برای VirusTotal، ClawScan، و تحلیل ایستا پیوند دارند.

    انتشارهای نگه‌داشته‌شده به‌دلیل اسکن یا مسدودشده ممکن است در کاتالوگ عمومی و
    سطوح نصب در دسترس نباشند، اما همچنان برای مالکشان در `/dashboard` قابل مشاهده باشند.

  </Accordion>
  <Accordion title="Reporting">
    - هر کاربر واردشده می‌تواند یک Skill را گزارش کند.
    - دلیل‌های گزارش الزامی هستند و ثبت می‌شوند.
    - هر کاربر می‌تواند هم‌زمان تا 20 گزارش فعال داشته باشد.
    - Skills با بیش از 3 گزارش یکتا به‌صورت پیش‌فرض خودکار پنهان می‌شوند.

  </Accordion>
  <Accordion title="Moderation">
    - مدیران محتوا می‌توانند Skills پنهان را ببینند، آن‌ها را از حالت پنهان خارج کنند، حذف کنند، یا کاربران را مسدود کنند.
    - سوءاستفاده از قابلیت گزارش می‌تواند به مسدودشدن حساب منجر شود.
    - علاقه‌مند به مدیر محتوا شدن هستید؟ در Discord OpenClaw بپرسید و با یک مدیر محتوا یا نگه‌دارنده تماس بگیرید.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

شما فقط برای جریان‌های کاری احرازشده با رجیستری مانند
انتشار/همگام‌سازی به این نیاز دارید.

### گزینه‌های سراسری

<ParamField path="--workdir <dir>" type="string">
  دایرکتوری کاری. پیش‌فرض: دایرکتوری فعلی؛ به فضای کاری OpenClaw برمی‌گردد.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دایرکتوری Skills، نسبی به workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL پایه سایت (ورود مرورگر).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL پایه API رجیستری.
</ParamField>
<ParamField path="--no-input" type="boolean">
  غیرفعال‌کردن پرامپت‌ها (غیرتعاملی).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  چاپ نسخه CLI.
</ParamField>

### فرمان‌ها

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    گزینه‌های ورود:

    - `--token <token>` — یک توکن API را جای‌گذاری کنید.
    - `--label <label>` — برچسب ذخیره‌شده برای توکن‌های ورود مرورگر (پیش‌فرض: `CLI token`).
    - `--no-browser` — مرورگر را باز نکنید (به `--token` نیاز دارد).

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    Skills را جست‌وجو می‌کند. برای کشف Plugin/بسته، از `clawhub package explore` استفاده کنید.

    - `--limit <n>` — حداکثر نتایج.

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و `package inspect` سطوح CLI ClawHub برای کشف Plugin/بسته و بازرسی فراداده هستند. نصب‌های بومی OpenClaw همچنان از `openclaw plugins install clawhub:<package>` استفاده می‌کنند.

    گزینه‌ها:

    - `--family skill|code-plugin|bundle-plugin` — فیلتر خانواده بسته.
    - `--official` — فقط بسته‌های رسمی را نشان بده.
    - `--executes-code` — فقط بسته‌هایی را نشان بده که کد اجرا می‌کنند.
    - `--version <version>` / `--tag <tag>` — یک نسخه مشخص از بسته را بازرسی کن.
    - `--versions`، `--files`، `--file <path>` — تاریخچه و فایل‌های بسته را بازرسی کن.
    - `--json` — خروجی قابل‌خواندن توسط ماشین.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    گزینه‌ها:

    - `--version <version>` — نصب یا به‌روزرسانی به یک نسخه مشخص (در `update` فقط برای یک slug).
    - `--force` — اگر پوشه از قبل وجود دارد، یا وقتی فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابق نیستند، بازنویسی کن.
    - `clawhub list` فایل `.clawhub/lock.json` را می‌خواند.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    گزینه‌ها:

    - `--slug <slug>` — slug مهارت.
    - `--name <name>` — نام نمایشی.
    - `--version <version>` — نسخه semver.
    - `--changelog <text>` — متن تغییرنامه (می‌تواند خالی باشد).
    - `--tags <tags>` — برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` می‌تواند یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک
    URL GitHub باشد.

    گزینه‌ها:

    - `--dry-run` — ساخت برنامه انتشار دقیق بدون بارگذاری چیزی.
    - `--json` — تولید خروجی قابل‌خواندن توسط ماشین برای CI.
    - `--source-repo`، `--source-commit`، `--source-ref` — بازنویسی‌های اختیاری وقتی تشخیص خودکار کافی نیست.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    فرمان‌های اسکن مجدد به یک توکن مالک واردشده نیاز دارند و آخرین
    نسخه منتشرشده Skill یا انتشار Plugin را هدف می‌گیرند. در اجراهای غیرتعاملی،
    `--yes` را ارسال کنید.

    پاسخ‌های JSON شامل نوع هدف، نام، نسخه، وضعیت اسکن مجدد، و
    شمار درخواست‌های باقی‌مانده/حداکثر برای آن نسخه یا انتشار هستند.

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    گزینه‌ها:

    - `--root <dir...>` — ریشه‌های اسکن اضافی.
    - `--all` — بارگذاری همه‌چیز بدون پرامپت.
    - `--dry-run` — نشان بده چه چیزی بارگذاری خواهد شد.
    - `--bump <type>` — `patch|minor|major` برای به‌روزرسانی‌ها (پیش‌فرض: `patch`).
    - `--changelog <text>` — تغییرنامه برای به‌روزرسانی‌های غیرتعاملی.
    - `--tags <tags>` — برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).
    - `--concurrency <n>` — بررسی‌های رجیستری (پیش‌فرض: `4`).

  </Accordion>
</AccordionGroup>

## جریان‌های کاری رایج

<Tabs>
  <Tab title="جستجو">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="یافتن Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="نصب">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="به‌روزرسانی همه">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="انتشار یک skill تکی">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="همگام‌سازی skillهای متعدد">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="انتشار Plugin از GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### فراداده بسته Plugin

Pluginهای کد باید فراداده الزامی OpenClaw را در
`package.json` داشته باشند:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

بسته‌های منتشرشده باید **JavaScript ساخته‌شده** را همراه خود داشته باشند و
`runtimeExtensions` را به همان خروجی اشاره دهند. نصب‌های مبتنی بر checkout در Git همچنان می‌توانند
وقتی فایل ساخته‌شده‌ای وجود ندارد به منبع TypeScript برگردند، اما ورودی‌های runtime ساخته‌شده
از کامپایل TypeScript در زمان اجرا در مسیرهای راه‌اندازی، doctor و بارگذاری
Plugin جلوگیری می‌کنند.

## نسخه‌بندی، lockfile و telemetry

<AccordionGroup>
  <Accordion title="نسخه‌بندی و tagها">
    - هر انتشار یک `SkillVersion` جدید با **semver** ایجاد می‌کند.
    - tagها (مانند `latest`) به یک نسخه اشاره می‌کنند؛ جابه‌جا کردن tagها امکان rollback را فراهم می‌کند.
    - changelogها برای هر نسخه پیوست می‌شوند و هنگام همگام‌سازی یا انتشار به‌روزرسانی‌ها می‌توانند خالی باشند.

  </Accordion>
  <Accordion title="تغییرات محلی در برابر نسخه‌های registry">
    به‌روزرسانی‌ها محتوای skill محلی را با نسخه‌های registry با استفاده از
    hash محتوا مقایسه می‌کنند. اگر فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابقت نداشته باشند،
    CLI پیش از بازنویسی سؤال می‌کند (یا در اجراهای
    غیرتعاملی به `--force` نیاز دارد).
  </Accordion>
  <Accordion title="پویش همگام‌سازی و ریشه‌های fallback">
    `clawhub sync` ابتدا workdir فعلی شما را پویش می‌کند. اگر هیچ skillی
    پیدا نشود، به مکان‌های قدیمی شناخته‌شده fallback می‌کند (برای مثال
    `~/openclaw/skills` و `~/.openclaw/skills`). این کار برای یافتن
    نصب‌های قدیمی‌تر skill بدون flagهای اضافی طراحی شده است.
  </Accordion>
  <Accordion title="ذخیره‌سازی و lockfile">
    - skillهای نصب‌شده در `.clawhub/lock.json` زیر workdir شما ثبت می‌شوند.
    - tokenهای احراز هویت در فایل پیکربندی CLI متعلق به ClawHub ذخیره می‌شوند (با `CLAWHUB_CONFIG_PATH` بازنویسی کنید).

  </Accordion>
  <Accordion title="Telemetry (شمارش نصب‌ها)">
    وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی
    برای محاسبه شمارش نصب‌ها ارسال می‌کند. می‌توانید این را کاملاً غیرفعال کنید:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی

| متغیر                         | اثر                                             |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت را بازنویسی می‌کند.                   |
| `CLAWHUB_REGISTRY`            | URL API مربوط به registry را بازنویسی می‌کند.  |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره token/config توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | workdir پیش‌فرض را بازنویسی می‌کند.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | telemetry را روی `sync` غیرفعال می‌کند.        |

## مرتبط

- [Pluginهای انجمن](/fa/plugins/community)
- [Pluginها](/fa/tools/plugin)
- [Skills](/fa/tools/skills)
