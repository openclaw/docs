---
read_when:
    - جستجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - پیکربندی CLI ‏clawhub یا بازنویسی‌های محیطی آن
sidebarTitle: ClawHub
summary: 'ClawHub: رجیستری عمومی برای Skills و Pluginهای OpenClaw، جریان‌های نصب بومی، و CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub رجیستری عمومی برای **Skills و Plugin‌های OpenClaw** است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Plugin‌ها از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای جریان‌های کاری احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و همگام‌سازی استفاده کنید.

سایت: [clawhub.ai](https://clawhub.ai)

## شروع سریع

<Steps>
  <Step title="جست‌وجو">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="نصب">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="استفاده">
    یک نشست جدید OpenClaw را شروع کنید - Skill جدید را شناسایی می‌کند.
  </Step>
  <Step title="انتشار (اختیاری)">
    برای جریان‌های کاری احراز هویت‌شده در رجیستری (انتشار، همگام‌سازی، مدیریت)،
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
  <Tab title="Plugin‌ها">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` کاتالوگ Plugin‌های ClawHub را پرس‌وجو می‌کند و نام‌های
    بسته آماده نصب را چاپ می‌کند. وقتی وضوح‌دهی ClawHub را می‌خواهید از
    `clawhub:<package>` استفاده کنید. مشخصه‌های Plugin سازگار با npm بدون
    پیشوند در زمان گذار راه‌اندازی از npm نصب می‌شوند:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` نیز فقط مخصوص npm است و زمانی مفید است که یک مشخصه در غیر این صورت
    می‌تواند مبهم باشد:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    نصب‌های Plugin سازگاری `pluginApi` و `minGatewayVersion` اعلام‌شده را
    پیش از اجرای نصب آرشیو اعتبارسنجی می‌کنند، بنابراین میزبان‌های ناسازگار
    به‌جای نصب ناقص بسته، زودتر به‌صورت بسته شکست می‌خورند. وقتی یک نسخه بسته
    آرتیفکت ClawPack منتشر می‌کند، OpenClaw بسته npm بارگذاری‌شده دقیق `.tgz`
    را ترجیح می‌دهد، سرآیند digest در ClawHub و بایت‌های دانلودشده را
    راستی‌آزمایی می‌کند، و نوع آرتیفکت، integrity در npm، shasum در npm،
    نام tarball، و فراداده digest در ClawPack را برای به‌روزرسانی‌های بعدی
    ثبت می‌کند. نسخه‌های قدیمی‌تر بسته بدون فراداده ClawPack همچنان از مسیر
    قدیمی راستی‌آزمایی آرشیو بسته استفاده می‌کنند.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` فقط خانواده‌های Plugin قابل نصب را
می‌پذیرد. اگر یک بسته ClawHub در واقع Skill باشد، OpenClaw متوقف می‌شود و
به‌جای آن شما را به `openclaw skills install <slug>` ارجاع می‌دهد.

نصب‌های ناشناس Plugin از ClawHub برای بسته‌های خصوصی نیز به‌صورت بسته شکست
می‌خورند. کانال‌های اجتماعی یا دیگر کانال‌های غیررسمی همچنان می‌توانند نصب
شوند، اما OpenClaw هشدار می‌دهد تا گردانندگان بتوانند پیش از فعال‌سازی،
منبع و راستی‌آزمایی را بررسی کنند.
</Note>

## ClawHub چیست

- یک رجیستری عمومی برای Skills و Plugin‌های OpenClaw.
- یک مخزن نسخه‌بندی‌شده برای بسته‌های Skill و فراداده.
- یک سطح کشف برای جست‌وجو، برچسب‌ها، و سیگنال‌های استفاده.

یک Skill معمولی یک بسته نسخه‌بندی‌شده از فایل‌ها است که شامل موارد زیر است:

- یک فایل `SKILL.md` با توضیح اصلی و نحوه استفاده.
- پیکربندی‌ها، اسکریپت‌ها، یا فایل‌های پشتیبان اختیاری که Skill از آن‌ها استفاده می‌کند.
- فراداده‌ای مانند برچسب‌ها، خلاصه، و نیازمندی‌های نصب.

ClawHub از فراداده برای تقویت کشف و نمایش امن قابلیت‌های Skill استفاده می‌کند.
رجیستری سیگنال‌های استفاده (ستاره‌ها، دانلودها) را دنبال می‌کند تا رتبه‌بندی
و دیده‌شدن را بهبود دهد. هر انتشار یک نسخه semver جدید ایجاد می‌کند، و
رجیستری تاریخچه نسخه‌ها را نگه می‌دارد تا کاربران بتوانند تغییرات را ممیزی کنند.

## فضای کاری و بارگذاری Skill

CLI جداگانه `clawhub` نیز Skills را در `./skills` زیر دایرکتوری کاری فعلی
شما نصب می‌کند. اگر یک فضای کاری OpenClaw پیکربندی شده باشد، `clawhub`
به آن فضای کاری برمی‌گردد مگر اینکه `--workdir` (یا `CLAWHUB_WORKDIR`) را
بازنویسی کنید. OpenClaw، Skills فضای کاری را از `<workspace>/skills` بارگذاری
می‌کند و آن‌ها را در نشست **بعدی** شناسایی می‌کند.

اگر از قبل از `~/.openclaw/skills` یا Skills همراه استفاده می‌کنید، Skills
فضای کاری اولویت دارند. برای جزئیات بیشتر درباره اینکه Skills چگونه بارگذاری،
هم‌رسانی، و کنترل می‌شوند، [Skills](/fa/tools/skills) را ببینید.

## ویژگی‌های سرویس

| ویژگی                  | یادداشت‌ها                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| مرور عمومی          | Skills و محتوای `SKILL.md` آن‌ها به‌صورت عمومی قابل مشاهده هستند.          |
| جست‌وجو                   | مبتنی بر embedding (جست‌وجوی برداری)، نه فقط کلیدواژه‌ها.               |
| نسخه‌بندی               | Semver، changelogها، و برچسب‌ها (از جمله `latest`).                  |
| دانلودها                | Zip برای هر نسخه.                                                    |
| ستاره‌ها و دیدگاه‌ها       | بازخورد جامعه.                                                 |
| خلاصه‌های اسکن امنیتی  | صفحه‌های جزئیات آخرین وضعیت اسکن را پیش از نصب یا دانلود نشان می‌دهند. |
| صفحه‌های جزئیات اسکنر     | نتایج VirusTotal، ClawScan، و تحلیل ایستا پیوندهای عمیق دارند.  |
| داشبورد بازیابی مالک | ناشران می‌توانند محتوای متعلق به خود را که به‌خاطر اسکن نگه داشته شده از `/dashboard` ببینند.       |
| اسکن‌های مجدد درخواستی مالک  | مالکان می‌توانند برای بازیابی موارد مثبت کاذب، اسکن مجدد محدود درخواست کنند.     |
| نظارت               | تأییدها و ممیزی‌ها.                                               |
| API مناسب CLI         | مناسب برای خودکارسازی و اسکریپت‌نویسی.                              |

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است - هر کسی می‌تواند Skills بارگذاری کند، اما
برای انتشار، حساب GitHub باید **حداقل یک هفته عمر داشته باشد**. این کار
بدون مسدودکردن مشارکت‌کنندگان معتبر، سوءاستفاده را کند می‌کند.

<AccordionGroup>
  <Accordion title="اسکن‌های امنیتی">
    ClawHub بررسی‌های امنیتی خودکار را روی Skills و انتشارهای Plugin منتشرشده
    اجرا می‌کند. صفحه‌های جزئیات عمومی نتیجه فعلی را خلاصه می‌کنند، و ردیف‌های
    اسکنر به صفحه‌های جزئیات اختصاصی برای VirusTotal، ClawScan، و تحلیل ایستا
    پیوند می‌دهند.

    انتشارهایی که به‌خاطر اسکن نگه داشته شده یا مسدود شده‌اند ممکن است روی کاتالوگ عمومی
    و سطح‌های نصب در دسترس نباشند، در حالی که همچنان برای مالکشان در `/dashboard`
    قابل مشاهده‌اند.

  </Accordion>
  <Accordion title="گزارش‌دهی">
    - هر کاربر واردشده می‌تواند یک Skill را گزارش کند.
    - دلیل‌های گزارش الزامی و ثبت می‌شوند.
    - هر کاربر می‌تواند هم‌زمان تا 20 گزارش فعال داشته باشد.
    - Skills با بیش از 3 گزارش یکتای پیش‌فرض به‌صورت خودکار پنهان می‌شوند.

  </Accordion>
  <Accordion title="نظارت">
    - ناظران می‌توانند Skills پنهان را ببینند، آن‌ها را از حالت پنهان خارج کنند، حذف کنند، یا کاربران را مسدود کنند.
    - سوءاستفاده از قابلیت گزارش می‌تواند به مسدودشدن حساب منجر شود.
    - علاقه‌مند به ناظر شدن هستید؟ در Discord مربوط به OpenClaw بپرسید و با یک ناظر یا نگهدارنده تماس بگیرید.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

فقط برای جریان‌های کاری احراز هویت‌شده در رجیستری مانند انتشار/همگام‌سازی
به این نیاز دارید.

### گزینه‌های سراسری

<ParamField path="--workdir <dir>" type="string">
  دایرکتوری کاری. پیش‌فرض: دایرکتوری فعلی؛ به فضای کاری OpenClaw برمی‌گردد.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دایرکتوری Skills، نسبی به workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL پایه سایت (ورود از مرورگر).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL پایه API رجیستری.
</ParamField>
<ParamField path="--no-input" type="boolean">
  اعلان‌ها را غیرفعال می‌کند (غیرتعاملی).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  نسخه CLI را چاپ می‌کند.
</ParamField>

### فرمان‌ها

<AccordionGroup>
  <Accordion title="احراز هویت (ورود / خروج / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    گزینه‌های ورود:

    - `--token <token>` - یک توکن API را جای‌گذاری کنید.
    - `--label <label>` - برچسب ذخیره‌شده برای توکن‌های ورود از مرورگر (پیش‌فرض: `CLI token`).
    - `--no-browser` - مرورگر باز نکنید (به `--token` نیاز دارد).

  </Accordion>
  <Accordion title="جست‌وجو">
    ```bash
    clawhub search "query"
    ```

    Skills را جست‌وجو می‌کند. برای کشف Plugin/بسته، از `clawhub package explore` استفاده کنید.

    - `--limit <n>` - بیشینه نتایج.

  </Accordion>
  <Accordion title="مرور / بازرسی Plugin‌ها">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و `package inspect` سطح‌های CLI ClawHub برای کشف Plugin/بسته و بازرسی فراداده هستند. نصب‌های بومی OpenClaw همچنان از `openclaw plugins install clawhub:<package>` استفاده می‌کنند.

    گزینه‌ها:

    - `--family skill|code-plugin|bundle-plugin` - خانواده بسته را فیلتر می‌کند.
    - `--official` - فقط بسته‌های رسمی را نشان می‌دهد.
    - `--executes-code` - فقط بسته‌هایی را نشان می‌دهد که کد اجرا می‌کنند.
    - `--version <version>` / `--tag <tag>` - یک نسخه مشخص بسته را بازرسی می‌کند.
    - `--versions`، `--files`، `--file <path>` - تاریخچه و فایل‌های بسته را بازرسی می‌کند.
    - `--json` - خروجی قابل خواندن برای ماشین.

  </Accordion>
  <Accordion title="نصب / به‌روزرسانی / فهرست">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    گزینه‌ها:

    - `--version <version>` - نصب یا به‌روزرسانی به یک نسخه مشخص (در `update` فقط برای یک slug).
    - `--force` - اگر پوشه از قبل وجود دارد، یا وقتی فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابقت ندارند، بازنویسی می‌کند.
    - `clawhub list` فایل `.clawhub/lock.json` را می‌خواند.

  </Accordion>
  <Accordion title="انتشار Skills">
    ```bash
    clawhub skill publish <path>
    ```

    گزینه‌ها:

    - `--slug <slug>` - slug مربوط به Skill.
    - `--name <name>` - نام نمایشی.
    - `--version <version>` - نسخه semver.
    - `--changelog <text>` - متن changelog (می‌تواند خالی باشد).
    - `--tags <tags>` - برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).

  </Accordion>
  <Accordion title="انتشار Plugin‌ها">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` می‌تواند یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک
    URL مربوط به GitHub باشد.

    گزینه‌ها:

    - `--dry-run` - برنامه انتشار دقیق را بدون بارگذاری چیزی می‌سازد.
    - `--json` - خروجی قابل خواندن برای ماشین را برای CI منتشر می‌کند.
    - `--source-repo`، `--source-commit`، `--source-ref` - بازنویسی‌های اختیاری وقتی تشخیص خودکار کافی نیست.

  </Accordion>
  <Accordion title="درخواست اسکن مجدد">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    فرمان‌های اسکن مجدد به توکن مالک واردشده نیاز دارند و آخرین نسخه
    Skill منتشرشده یا انتشار Plugin را هدف می‌گیرند. در اجراهای غیرتعاملی،
    `--yes` را ارسال کنید.

    پاسخ‌های JSON شامل نوع هدف، نام، نسخه، وضعیت اسکن مجدد، و شمار درخواست‌های
    باقی‌مانده/بیشینه برای آن نسخه یا انتشار هستند.

  </Accordion>
  <Accordion title="حذف / بازگردانی حذف (مالک یا مدیر)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="همگام‌سازی (اسکن محلی + انتشار جدید یا به‌روزشده)">
    ```bash
    clawhub sync
    ```

    گزینه‌ها:

    - `--root <dir...>` - ریشه‌های اسکن اضافی.
    - `--all` - همه چیز را بدون اعلان بارگذاری می‌کند.
    - `--dry-run` - نشان می‌دهد چه چیزی بارگذاری خواهد شد.
    - `--bump <type>` - `patch|minor|major` برای به‌روزرسانی‌ها (پیش‌فرض: `patch`).
    - `--changelog <text>` - changelog برای به‌روزرسانی‌های غیرتعاملی.
    - `--tags <tags>` - برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).
    - `--concurrency <n>` - بررسی‌های رجیستری (پیش‌فرض: `4`).

  </Accordion>
</AccordionGroup>

## جریان‌های کاری رایج

<Tabs>
  <Tab title="جست‌وجو">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="یافتن یک plugin">
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
  <Tab title="انتشار یک skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="همگام‌سازی تعداد زیادی skill">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="انتشار یک plugin از GitHub">
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

بسته‌های منتشرشده باید **JavaScript ساخته‌شده** را همراه داشته باشند و
`runtimeExtensions` را به آن خروجی اشاره دهند. نصب‌های checkout از Git همچنان می‌توانند
در صورت نبود فایل‌های ساخته‌شده به منبع TypeScript برگردند، اما ورودی‌های runtime ساخته‌شده
از کامپایل TypeScript در زمان اجرا در مسیرهای startup، doctor و
بارگذاری plugin جلوگیری می‌کنند.

## نسخه‌بندی، lockfile و تله‌متری

<AccordionGroup>
  <Accordion title="نسخه‌بندی و برچسب‌ها">
    - هر انتشار یک `SkillVersion` جدید با **semver** ایجاد می‌کند.
    - برچسب‌ها (مانند `latest`) به یک نسخه اشاره می‌کنند؛ جابه‌جایی برچسب‌ها امکان بازگشت به نسخه قبل را می‌دهد.
    - changelogها برای هر نسخه پیوست می‌شوند و هنگام همگام‌سازی یا انتشار به‌روزرسانی‌ها می‌توانند خالی باشند.

  </Accordion>
  <Accordion title="تغییرات محلی در برابر نسخه‌های registry">
    به‌روزرسانی‌ها محتوای skill محلی را با نسخه‌های registry با استفاده از
    hash محتوا مقایسه می‌کنند. اگر فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابقت نداشته باشند،
    CLI پیش از بازنویسی سؤال می‌کند (یا در اجراهای
    غیرتعاملی به `--force` نیاز دارد).
  </Accordion>
  <Accordion title="پویش همگام‌سازی و ریشه‌های جایگزین">
    `clawhub sync` ابتدا workdir فعلی شما را پویش می‌کند. اگر هیچ skillای
    پیدا نشود، به مکان‌های قدیمی شناخته‌شده (برای مثال
    `~/openclaw/skills` و `~/.openclaw/skills`) برمی‌گردد. این برای
    یافتن نصب‌های قدیمی‌تر skill بدون flagهای اضافی طراحی شده است.
  </Accordion>
  <Accordion title="ذخیره‌سازی و lockfile">
    - skillهای نصب‌شده در `.clawhub/lock.json` زیر workdir شما ثبت می‌شوند.
    - tokenهای احراز هویت در فایل پیکربندی ClawHub CLI ذخیره می‌شوند (قابل بازنویسی با `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="تله‌متری (شمار نصب‌ها)">
    وقتی در حالت ورودشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی
    برای محاسبه شمار نصب‌ها ارسال می‌کند. می‌توانید این را کاملاً غیرفعال کنید:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی

| متغیر                         | اثر                                             |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت را بازنویسی می‌کند.                   |
| `CLAWHUB_REGISTRY`            | URL API registry را بازنویسی می‌کند.           |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره token/پیکربندی توسط CLI را بازنویسی می‌کند. |
| `CLAWHUB_WORKDIR`             | workdir پیش‌فرض را بازنویسی می‌کند.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تله‌متری را در `sync` غیرفعال می‌کند.          |

## مرتبط

- [pluginهای جامعه](/fa/plugins/community)
- [Plugins](/fa/tools/plugin)
- [Skills](/fa/tools/skills)
