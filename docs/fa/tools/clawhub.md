---
read_when:
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Plugin‌ها در رجیستری
    - پیکربندی CLI مربوط به clawhub یا بازنویسی‌های محیطی آن
sidebarTitle: ClawHub
summary: 'ClawHub: رجیستری عمومی برای Skills و Pluginهای OpenClaw، جریان‌های نصب بومی، و clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T12:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub رجیستری عمومی برای **Skills و Plugins OpenClaw** است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب، و به‌روزرسانی Skills و نصب Plugins از ClawHub استفاده کنید.
- از CLI جداگانه `clawhub` برای گردش‌کارهای احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و همگام‌سازی استفاده کنید.

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
    یک نشست جدید OpenClaw را شروع کنید — Skill جدید را شناسایی می‌کند.
  </Step>
  <Step title="Publish (optional)">
    برای گردش‌کارهای دارای احراز هویت رجیستری (انتشار، همگام‌سازی، مدیریت)،
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
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` کاتالوگ Pluginهای ClawHub را پرس‌وجو می‌کند و نام بسته‌های
    آماده نصب را چاپ می‌کند. مشخصات Plugin ساده و ایمن برای npm نیز پیش از npm
    در ClawHub امتحان می‌شوند:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    وقتی فقط تفکیک از npm را بدون جست‌وجوی ClawHub می‌خواهید، از
    `npm:<package>` استفاده کنید:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و
    `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند، بنابراین میزبان‌های
    ناسازگار به‌جای نصب ناقص بسته، زود و بسته شکست می‌خورند. وقتی نسخه‌ای از
    بسته یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw آن آرتیفکت را ترجیح می‌دهد،
    سربرگ digest ClawHub و بایت‌های دانلودشده را راستی‌آزمایی می‌کند، و فراداده
    digest ClawPack را برای به‌روزرسانی‌های بعدی ثبت می‌کند. نسخه‌های قدیمی‌تر
    بسته که فراداده ClawPack ندارند همچنان از مسیر قدیمی راستی‌آزمایی آرشیو بسته
    استفاده می‌کنند.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` فقط خانواده‌های Plugin قابل نصب را می‌پذیرد.
اگر یک بسته ClawHub در واقع Skill باشد، OpenClaw متوقف می‌شود و به‌جای آن شما را به
`openclaw skills install <slug>` راهنمایی می‌کند.

نصب‌های ناشناس Plugin از ClawHub برای بسته‌های خصوصی نیز به‌صورت بسته شکست می‌خورند.
کانال‌های اجتماعی یا سایر کانال‌های غیررسمی همچنان می‌توانند نصب شوند، اما OpenClaw
هشدار می‌دهد تا گردانندگان بتوانند پیش از فعال‌سازی، منبع و راستی‌آزمایی را بررسی کنند.
</Note>

## ClawHub چیست

- یک رجیستری عمومی برای Skills و Plugins OpenClaw.
- یک مخزن نسخه‌دار برای بسته‌های Skill و فراداده.
- یک سطح کشف برای جست‌وجو، برچسب‌ها، و سیگنال‌های استفاده.

یک Skill معمولی یک بسته نسخه‌دار از فایل‌هاست که شامل موارد زیر است:

- یک فایل `SKILL.md` با توضیح اصلی و نحوه استفاده.
- پیکربندی‌ها، اسکریپت‌ها، یا فایل‌های پشتیبان اختیاری که Skill از آن‌ها استفاده می‌کند.
- فراداده‌ای مانند برچسب‌ها، خلاصه، و الزامات نصب.

ClawHub از فراداده برای قدرت دادن به کشف و نمایش امن قابلیت‌های Skill استفاده می‌کند.
رجیستری سیگنال‌های استفاده (ستاره‌ها، دانلودها) را دنبال می‌کند تا رتبه‌بندی و دیده‌شدن
را بهبود دهد. هر انتشار یک نسخه semver جدید ایجاد می‌کند، و رجیستری تاریخچه نسخه‌ها را
نگه می‌دارد تا کاربران بتوانند تغییرات را حسابرسی کنند.

## فضای کاری و بارگذاری Skill

CLI جداگانه `clawhub` نیز Skills را در `./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند.
اگر یک فضای کاری OpenClaw پیکربندی شده باشد، `clawhub` به آن فضای کاری برمی‌گردد مگر اینکه
`--workdir` (یا `CLAWHUB_WORKDIR`) را بازنویسی کنید. OpenClaw، Skills فضای کاری را از
`<workspace>/skills` بارگذاری می‌کند و آن‌ها را در نشست **بعدی** شناسایی می‌کند.

اگر همین حالا از `~/.openclaw/skills` یا Skills همراه استفاده می‌کنید، Skills فضای کاری
اولویت دارند. برای جزئیات بیشتر درباره نحوه بارگذاری، اشتراک‌گذاری، و کنترل دسترسی Skills،
[Skills](/fa/tools/skills) را ببینید.

## ویژگی‌های سرویس

| ویژگی | نکات |
| ------------------------ | ------------------------------------------------------------------- |
| مرور عمومی | Skills و محتوای `SKILL.md` آن‌ها به‌صورت عمومی قابل مشاهده‌اند. |
| جست‌وجو | مبتنی بر embedding (جست‌وجوی برداری)، نه فقط کلیدواژه‌ها. |
| نسخه‌بندی | Semver، changelogها، و برچسب‌ها (از جمله `latest`). |
| دانلودها | Zip برای هر نسخه. |
| ستاره‌ها و دیدگاه‌ها | بازخورد جامعه. |
| خلاصه‌های اسکن امنیتی | صفحه‌های جزئیات، آخرین وضعیت اسکن را پیش از نصب یا دانلود نشان می‌دهند. |
| صفحه‌های جزئیات اسکنر | نتایج VirusTotal، ClawScan، و تحلیل ایستا پیوندهای عمیق دارند. |
| داشبورد بازیابی مالک | ناشران می‌توانند محتوای تحت مالکیت نگه‌داشته‌شده به‌دلیل اسکن را از `/dashboard` ببینند. |
| اسکن مجدد به درخواست مالک | مالکان می‌توانند برای بازیابی خطاهای مثبت کاذب، اسکن‌های مجدد محدود درخواست کنند. |
| نظارت | تأییدها و حسابرسی‌ها. |
| API مناسب CLI | مناسب برای خودکارسازی و اسکریپت‌نویسی. |

## امنیت و نظارت

ClawHub به‌صورت پیش‌فرض باز است — هر کسی می‌تواند Skills بارگذاری کند، اما حساب GitHub
برای انتشار باید **حداقل یک هفته عمر داشته باشد**. این کار سوءاستفاده را کند می‌کند
بدون اینکه مشارکت‌کنندگان مشروع را مسدود کند.

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub بررسی‌های امنیتی خودکار را روی Skills منتشرشده و انتشارهای Plugin اجرا می‌کند.
    صفحه‌های جزئیات عمومی نتیجه فعلی را خلاصه می‌کنند، و ردیف‌های اسکنر به صفحه‌های جزئیات
    اختصاصی برای VirusTotal، ClawScan، و تحلیل ایستا پیوند می‌دهند.

    انتشارهای نگه‌داشته‌شده به‌دلیل اسکن یا مسدودشده ممکن است در کاتالوگ عمومی و سطوح
    نصب در دسترس نباشند، در حالی که همچنان برای مالکشان در `/dashboard` قابل مشاهده‌اند.

  </Accordion>
  <Accordion title="Reporting">
    - هر کاربر واردشده می‌تواند یک Skill را گزارش کند.
    - دلایل گزارش الزامی و ثبت می‌شوند.
    - هر کاربر می‌تواند هم‌زمان تا 20 گزارش فعال داشته باشد.
    - Skills با بیش از 3 گزارش منحصربه‌فرد به‌صورت پیش‌فرض به‌طور خودکار پنهان می‌شوند.

  </Accordion>
  <Accordion title="Moderation">
    - ناظران می‌توانند Skills پنهان را ببینند، آن‌ها را از حالت پنهان خارج کنند، حذفشان کنند، یا کاربران را مسدود کنند.
    - سوءاستفاده از قابلیت گزارش می‌تواند به مسدود شدن حساب منجر شود.
    - علاقه‌مند به ناظر شدن هستید؟ در Discord OpenClaw بپرسید و با یک ناظر یا نگه‌دارنده تماس بگیرید.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

فقط برای گردش‌کارهای دارای احراز هویت رجیستری مانند انتشار/همگام‌سازی به این نیاز دارید.

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
  اعلان‌ها را غیرفعال کنید (غیرتعاملی).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  نسخه CLI را چاپ کنید.
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

    - `--family skill|code-plugin|bundle-plugin` — خانواده بسته را فیلتر کنید.
    - `--official` — فقط بسته‌های رسمی را نشان دهید.
    - `--executes-code` — فقط بسته‌هایی را نشان دهید که کد اجرا می‌کنند.
    - `--version <version>` / `--tag <tag>` — یک نسخه بسته مشخص را بازرسی کنید.
    - `--versions`, `--files`, `--file <path>` — تاریخچه و فایل‌های بسته را بازرسی کنید.
    - `--json` — خروجی قابل خواندن توسط ماشین.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    گزینه‌ها:

    - `--version <version>` — نصب یا به‌روزرسانی به یک نسخه مشخص (فقط یک slug در `update`).
    - `--force` — اگر پوشه از قبل وجود دارد، یا وقتی فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابق نیستند، بازنویسی کنید.
    - `clawhub list` فایل `.clawhub/lock.json` را می‌خواند.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    گزینه‌ها:

    - `--slug <slug>` — slug مربوط به Skill.
    - `--name <name>` — نام نمایشی.
    - `--version <version>` — نسخه semver.
    - `--changelog <text>` — متن changelog (می‌تواند خالی باشد).
    - `--tags <tags>` — برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` می‌تواند یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک
    URL GitHub باشد.

    گزینه‌ها:

    - `--dry-run` — برنامه دقیق انتشار را بدون بارگذاری هیچ چیزی بسازید.
    - `--json` — خروجی قابل خواندن توسط ماشین برای CI تولید کنید.
    - `--source-repo`, `--source-commit`, `--source-ref` — بازنویسی‌های اختیاری وقتی تشخیص خودکار کافی نیست.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    فرمان‌های اسکن مجدد به یک توکن مالک واردشده نیاز دارند و آخرین نسخه Skill
    منتشرشده یا انتشار Plugin را هدف می‌گیرند. در اجراهای غیرتعاملی، `--yes` را پاس دهید.

    پاسخ‌های JSON شامل نوع هدف، نام، نسخه، وضعیت اسکن مجدد، و شمارش‌های باقی‌مانده/حداکثر
    درخواست برای آن نسخه یا انتشار هستند.

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
    - `--all` — همه چیز را بدون اعلان بارگذاری کنید.
    - `--dry-run` — نشان دهید چه چیزی بارگذاری می‌شد.
    - `--bump <type>` — `patch|minor|major` برای به‌روزرسانی‌ها (پیش‌فرض: `patch`).
    - `--changelog <text>` — changelog برای به‌روزرسانی‌های غیرتعاملی.
    - `--tags <tags>` — برچسب‌های جداشده با ویرگول (پیش‌فرض: `latest`).
    - `--concurrency <n>` — بررسی‌های رجیستری (پیش‌فرض: `4`).

  </Accordion>
</AccordionGroup>

## گردش‌کارهای رایج

<Tabs>
  <Tab title="جست‌وجو">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="یافتن یک Plugin">
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
  <Tab title="انتشار یک مهارت تکی">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="همگام‌سازی مهارت‌های متعدد">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="انتشار یک Plugin از GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### فرادادهٔ بستهٔ Plugin

Pluginهای کد باید فرادادهٔ الزامی OpenClaw را در
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
`runtimeExtensions` را به همان خروجی اشاره دهند. نصب‌های Git checkout همچنان می‌توانند
وقتی فایل ساخته‌شده‌ای وجود ندارد به منبع TypeScript بازگردند، اما مدخل‌های runtime ساخته‌شده
از کامپایل TypeScript در زمان اجرا در مسیرهای راه‌اندازی، doctor و بارگذاری Plugin جلوگیری می‌کنند.

## نسخه‌گذاری، lockfile و telemetry

<AccordionGroup>
  <Accordion title="نسخه‌گذاری و برچسب‌ها">
    - هر انتشار یک `SkillVersion` جدید با **semver** ایجاد می‌کند.
    - برچسب‌ها (مانند `latest`) به یک نسخه اشاره می‌کنند؛ جابه‌جا کردن برچسب‌ها به شما امکان بازگشت به نسخهٔ قبلی را می‌دهد.
    - Changelogها به هر نسخه پیوست می‌شوند و هنگام همگام‌سازی یا انتشار به‌روزرسانی‌ها می‌توانند خالی باشند.

  </Accordion>
  <Accordion title="تغییرات محلی در برابر نسخه‌های registry">
    به‌روزرسانی‌ها محتوای مهارت محلی را با نسخه‌های registry با استفاده از
    هش محتوا مقایسه می‌کنند. اگر فایل‌های محلی با هیچ نسخهٔ منتشرشده‌ای مطابقت نداشته باشند،
    CLI پیش از بازنویسی سؤال می‌کند (یا در اجراهای
    غیرتعاملی به `--force` نیاز دارد).
  </Accordion>
  <Accordion title="اسکن همگام‌سازی و ریشه‌های fallback">
    `clawhub sync` ابتدا workdir فعلی شما را اسکن می‌کند. اگر هیچ مهارتی
    پیدا نشود، به مکان‌های قدیمی شناخته‌شده fallback می‌کند (برای مثال
    `~/openclaw/skills` و `~/.openclaw/skills`). این برای
    یافتن نصب‌های قدیمی‌تر مهارت بدون flagهای اضافی طراحی شده است.
  </Accordion>
  <Accordion title="ذخیره‌سازی و lockfile">
    - مهارت‌های نصب‌شده در `.clawhub/lock.json` زیر workdir شما ثبت می‌شوند.
    - توکن‌های احراز هویت در فایل پیکربندی ClawHub CLI ذخیره می‌شوند (قابل override از طریق `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (شمار نصب‌ها)">
    وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی
    برای محاسبهٔ شمار نصب‌ها می‌فرستد. می‌توانید این را کاملاً غیرفعال کنید:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی

| متغیر                         | اثر                                             |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت را override می‌کند.                   |
| `CLAWHUB_REGISTRY`            | URL API registry را override می‌کند.           |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیرهٔ توکن/پیکربندی توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | workdir پیش‌فرض را override می‌کند.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | telemetry را روی `sync` غیرفعال می‌کند.        |

## مرتبط

- [Pluginهای جامعه](/fa/plugins/community)
- [Pluginها](/fa/tools/plugin)
- [Skills](/fa/tools/skills)
