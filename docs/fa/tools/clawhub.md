---
read_when:
    - جست‌وجو، نصب یا به‌روزرسانی Skills یا Pluginها
    - انتشار Skills یا Pluginها در رجیستری
    - پیکربندی CLI مربوط به clawhub یا مقادیر جایگزین محیطی آن
sidebarTitle: ClawHub
summary: 'ClawHub: رجیستری عمومی برای Skills و Pluginهای OpenClaw، فرایندهای نصب بومی، و CLI ‏clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T20:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub رجیستری عمومی برای **Skills و plugins در OpenClaw** است.

- از فرمان‌های بومی `openclaw` برای جست‌وجو، نصب و به‌روزرسانی Skills و نصب plugins از ClawHub استفاده کنید.
- برای گردش‌کارهای احراز هویت رجیستری، انتشار، حذف/بازگردانی حذف، و همگام‌سازی از CLI جداگانه `clawhub` استفاده کنید.

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
    یک نشست جدید OpenClaw را شروع کنید — Skill جدید را شناسایی می‌کند.
  </Step>
  <Step title="انتشار (اختیاری)">
    برای گردش‌کارهای احراز هویت‌شده با رجیستری (انتشار، همگام‌سازی، مدیریت)،
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
    فراداده منبع را پایدار نگه می‌دارند تا فراخوانی‌های بعدی `update` بتوانند روی ClawHub باقی بمانند.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` کاتالوگ Plugin در ClawHub را پرس‌وجو می‌کند و نام‌های
    بسته آماده نصب را چاپ می‌کند. وقتی وضوح‌یابی ClawHub را می‌خواهید، از `clawhub:<package>` استفاده کنید.
    مشخصات Plugin سازگار با npm و بدون پیشوند، در دوره گذار راه‌اندازی از npm نصب می‌شوند:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` نیز فقط npm است و زمانی مفید است که یک مشخصه در غیر این صورت
    ممکن است مبهم باشد:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    نصب‌های Plugin پیش از اجرای نصب آرشیو، سازگاری `pluginApi` و
    `minGatewayVersion` اعلام‌شده را اعتبارسنجی می‌کنند، بنابراین میزبان‌های
    ناسازگار زود و بسته شکست می‌خورند، نه اینکه بسته را به‌صورت ناقص نصب کنند.
    وقتی یک نسخه بسته یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw فایل
    `.tgz` دقیق npm-pack بارگذاری‌شده را ترجیح می‌دهد، سربرگ digest در ClawHub
    و بایت‌های دانلودشده را تأیید می‌کند، و نوع آرتیفکت، یکپارچگی npm،
    shasum در npm، نام tarball، و فراداده digest در ClawPack را برای
    به‌روزرسانی‌های بعدی ثبت می‌کند. نسخه‌های قدیمی‌تر بسته بدون فراداده ClawPack همچنان از
    مسیر قدیمی تأیید آرشیو بسته استفاده می‌کنند.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` فقط خانواده‌های Plugin قابل نصب را می‌پذیرد.
اگر یک بسته ClawHub در واقع Skill باشد، OpenClaw متوقف می‌شود و
در عوض شما را به `openclaw skills install <slug>` راهنمایی می‌کند.

نصب‌های ناشناس Plugin از ClawHub برای بسته‌های خصوصی نیز بسته شکست می‌خورند.
کانال‌های اجتماعی یا سایر کانال‌های غیررسمی همچنان می‌توانند نصب شوند، اما OpenClaw
هشدار می‌دهد تا اپراتورها بتوانند پیش از فعال‌سازی، منبع و تأیید را بازبینی کنند.
</Note>

## ClawHub چیست

- یک رجیستری عمومی برای Skills و plugins در OpenClaw.
- یک مخزن نسخه‌دار از بسته‌های Skill و فراداده.
- یک سطح کشف برای جست‌وجو، برچسب‌ها، و سیگنال‌های استفاده.

یک Skill معمولی بسته‌ای نسخه‌دار از فایل‌هاست که شامل موارد زیر است:

- یک فایل `SKILL.md` با توضیح و نحوه استفاده اصلی.
- پیکربندی‌ها، اسکریپت‌ها، یا فایل‌های پشتیبان اختیاری که Skill از آن‌ها استفاده می‌کند.
- فراداده‌ای مانند برچسب‌ها، خلاصه، و نیازمندی‌های نصب.

ClawHub از فراداده برای توانمندسازی کشف و ارائه ایمن قابلیت‌های Skill استفاده می‌کند.
رجیستری سیگنال‌های استفاده (ستاره‌ها، دانلودها) را برای بهبود رتبه‌بندی و
نمایانی ردیابی می‌کند. هر انتشار یک نسخه semver جدید ایجاد می‌کند و
رجیستری تاریخچه نسخه را نگه می‌دارد تا کاربران بتوانند تغییرات را ممیزی کنند.

## فضای کاری و بارگذاری Skill

CLI جداگانه `clawhub` نیز Skills را در `./skills` زیر
دایرکتوری کاری فعلی شما نصب می‌کند. اگر یک فضای کاری OpenClaw پیکربندی شده باشد،
`clawhub` به آن فضای کاری برمی‌گردد، مگر اینکه `--workdir`
(یا `CLAWHUB_WORKDIR`) را بازنویسی کنید. OpenClaw Skills فضای کاری را از
`<workspace>/skills` بارگذاری می‌کند و آن‌ها را در نشست **بعدی** شناسایی می‌کند.

اگر از قبل از `~/.openclaw/skills` یا Skills همراه استفاده می‌کنید، Skills فضای کاری
اولویت دارند. برای جزئیات بیشتر درباره نحوه بارگذاری، اشتراک‌گذاری،
و کنترل دسترسی Skills، [Skills](/fa/tools/skills) را ببینید.

## قابلیت‌های سرویس

| قابلیت                  | نکات                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| مرور عمومی          | Skills و محتوای `SKILL.md` آن‌ها به‌صورت عمومی قابل مشاهده است.          |
| جست‌وجو                   | مبتنی بر embedding (جست‌وجوی برداری)، نه فقط کلیدواژه‌ها.               |
| نسخه‌بندی               | Semver، changelogها، و برچسب‌ها (از جمله `latest`).                  |
| دانلودها                | Zip برای هر نسخه.                                                    |
| ستاره‌ها و دیدگاه‌ها       | بازخورد جامعه.                                                 |
| خلاصه‌های اسکن امنیتی  | صفحه‌های جزئیات، تازه‌ترین وضعیت اسکن را پیش از نصب یا دانلود نشان می‌دهند. |
| صفحه‌های جزئیات اسکنر     | نتایج VirusTotal، ClawScan، و تحلیل ایستا پیوندهای عمیق دارند.  |
| داشبورد بازیابی مالک | ناشران می‌توانند محتوای متعلق به خود را که به‌دلیل اسکن نگه داشته شده از `/dashboard` ببینند.       |
| اسکن‌های مجدد درخواست‌شده توسط مالک  | مالکان می‌توانند برای بازیابی مثبت کاذب، اسکن مجدد محدود درخواست کنند.     |
| تعدیل محتوا               | تأییدها و ممیزی‌ها.                                               |
| API مناسب CLI         | مناسب برای خودکارسازی و اسکریپت‌نویسی.                              |

## امنیت و تعدیل محتوا

ClawHub به‌صورت پیش‌فرض باز است — هر کسی می‌تواند Skills بارگذاری کند، اما یک حساب GitHub
برای انتشار باید **حداقل یک هفته قدمت** داشته باشد. این کار سوءاستفاده را
بدون مسدود کردن مشارکت‌کنندگان مشروع کند می‌کند.

<AccordionGroup>
  <Accordion title="اسکن‌های امنیتی">
    ClawHub روی Skills منتشرشده و انتشارهای Plugin بررسی‌های امنیتی خودکار اجرا می‌کند.
    صفحه‌های جزئیات عمومی نتیجه فعلی را خلاصه می‌کنند، و ردیف‌های اسکنر
    به صفحه‌های جزئیات اختصاصی برای VirusTotal، ClawScan، و تحلیل ایستا پیوند می‌دهند.

    انتشارهایی که به‌دلیل اسکن نگه داشته یا مسدود شده‌اند ممکن است در کاتالوگ عمومی و
    سطوح نصب در دسترس نباشند، در حالی که همچنان برای مالکشان در `/dashboard` قابل مشاهده‌اند.

  </Accordion>
  <Accordion title="گزارش‌دهی">
    - هر کاربر واردشده می‌تواند یک Skill را گزارش کند.
    - دلایل گزارش الزامی هستند و ثبت می‌شوند.
    - هر کاربر می‌تواند هم‌زمان تا ۲۰ گزارش فعال داشته باشد.
    - Skills با بیش از ۳ گزارش منحصربه‌فرد به‌صورت پیش‌فرض خودکار پنهان می‌شوند.

  </Accordion>
  <Accordion title="تعدیل محتوا">
    - ناظران می‌توانند Skills پنهان را ببینند، آن‌ها را از حالت پنهان خارج کنند، حذف کنند، یا کاربران را مسدود کنند.
    - سوءاستفاده از قابلیت گزارش می‌تواند به مسدود شدن حساب منجر شود.
    - به ناظر شدن علاقه دارید؟ در Discord مربوط به OpenClaw بپرسید و با یک ناظر یا نگه‌دارنده تماس بگیرید.

  </Accordion>
</AccordionGroup>

## CLI مربوط به ClawHub

این مورد را فقط برای گردش‌کارهای احراز هویت‌شده با رجیستری مانند
انتشار/همگام‌سازی نیاز دارید.

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
  <Accordion title="احراز هویت (ورود / خروج / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    گزینه‌های ورود:

    - `--token <token>` — یک API token را جای‌گذاری کنید.
    - `--label <label>` — برچسب ذخیره‌شده برای tokenهای ورود مرورگر (پیش‌فرض: `CLI token`).
    - `--no-browser` — مرورگر را باز نکنید (نیازمند `--token`).

  </Accordion>
  <Accordion title="جست‌وجو">
    ```bash
    clawhub search "query"
    ```

    در Skills جست‌وجو می‌کند. برای کشف Plugin/بسته، از `clawhub package explore` استفاده کنید.

    - `--limit <n>` — حداکثر نتایج.

  </Accordion>
  <Accordion title="مرور / بررسی plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و `package inspect` سطوح CLI مربوط به ClawHub برای کشف Plugin/بسته و بررسی فراداده هستند. نصب‌های بومی OpenClaw همچنان از `openclaw plugins install clawhub:<package>` استفاده می‌کنند.

    گزینه‌ها:

    - `--family skill|code-plugin|bundle-plugin` — فیلتر خانواده بسته.
    - `--official` — فقط بسته‌های رسمی را نشان دهید.
    - `--executes-code` — فقط بسته‌هایی را نشان دهید که کد اجرا می‌کنند.
    - `--version <version>` / `--tag <tag>` — یک نسخه خاص بسته را بررسی کنید.
    - `--versions`, `--files`, `--file <path>` — تاریخچه و فایل‌های بسته را بررسی کنید.
    - `--json` — خروجی قابل خواندن توسط ماشین.

  </Accordion>
  <Accordion title="نصب / به‌روزرسانی / فهرست">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    گزینه‌ها:

    - `--version <version>` — نصب یا به‌روزرسانی به یک نسخه خاص (فقط یک slug در `update`).
    - `--force` — اگر پوشه از قبل وجود دارد، یا وقتی فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابقت ندارند، بازنویسی کنید.
    - `clawhub list` فایل `.clawhub/lock.json` را می‌خواند.

  </Accordion>
  <Accordion title="انتشار Skills">
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
  <Accordion title="انتشار plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` می‌تواند یک پوشه محلی، `owner/repo`، `owner/repo@ref`، یا یک
    URL در GitHub باشد.

    گزینه‌ها:

    - `--dry-run` — برنامه انتشار دقیق را بدون بارگذاری هیچ چیزی بسازید.
    - `--json` — خروجی قابل خواندن توسط ماشین برای CI تولید کنید.
    - `--source-repo`, `--source-commit`, `--source-ref` — بازنویسی‌های اختیاری وقتی تشخیص خودکار کافی نیست.

  </Accordion>
  <Accordion title="درخواست اسکن مجدد">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    فرمان‌های اسکن مجدد به token مالک واردشده نیاز دارند و تازه‌ترین
    نسخه منتشرشده Skill یا انتشار Plugin را هدف می‌گیرند. در اجراهای غیرتعاملی،
    `--yes` را ارسال کنید.

    پاسخ‌های JSON شامل نوع هدف، نام، نسخه، وضعیت اسکن مجدد، و
    تعداد درخواست‌های باقی‌مانده/حداکثر برای آن نسخه یا انتشار هستند.

  </Accordion>
  <Accordion title="حذف / بازگردانی حذف (مالک یا مدیر)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="همگام‌سازی (اسکن محلی + انتشار جدید یا به‌روزرسانی‌شده)">
    ```bash
    clawhub sync
    ```

    گزینه‌ها:

    - `--root <dir...>` — ریشه‌های اسکن اضافی.
    - `--all` — همه چیز را بدون اعلان بارگذاری کنید.
    - `--dry-run` — نشان دهید چه چیزی بارگذاری خواهد شد.
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
  <Tab title="انتشار یک skill تکی">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="همگام‌سازی چندین skill">
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

### فراداده بسته Plugin

Plugin‌های کد باید فراداده الزامی OpenClaw را در
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

بسته‌های منتشرشده باید **JavaScript ساخته‌شده** را ارائه کنند و
`runtimeExtensions` را به آن خروجی اشاره دهند. نصب‌های Git checkout همچنان می‌توانند وقتی هیچ فایل ساخته‌شده‌ای وجود ندارد به سورس TypeScript برگردند، اما ورودی‌های runtime ساخته‌شده از کامپایل TypeScript در زمان اجرا در مسیرهای راه‌اندازی، doctor، و بارگذاری Plugin جلوگیری می‌کنند.

## نسخه‌بندی، lockfile، و دورسنجی

<AccordionGroup>
  <Accordion title="نسخه‌بندی و tagها">
    - هر انتشار یک `SkillVersion` جدید با **semver** می‌سازد.
    - tagها (مانند `latest`) به یک نسخه اشاره می‌کنند؛ جابه‌جا کردن tagها به شما امکان rollback می‌دهد.
    - changelogها به‌ازای هر نسخه پیوست می‌شوند و هنگام همگام‌سازی یا انتشار به‌روزرسانی‌ها می‌توانند خالی باشند.

  </Accordion>
  <Accordion title="تغییرات محلی در برابر نسخه‌های registry">
    به‌روزرسانی‌ها محتوای skill محلی را با نسخه‌های registry با استفاده از
    هش محتوا مقایسه می‌کنند. اگر فایل‌های محلی با هیچ نسخه منتشرشده‌ای مطابق نباشند،
    CLI پیش از بازنویسی سؤال می‌کند (یا در اجراهای غیرتعاملی به `--force` نیاز دارد).
  </Accordion>
  <Accordion title="اسکن همگام‌سازی و ریشه‌های fallback">
    `clawhub sync` ابتدا workdir فعلی شما را اسکن می‌کند. اگر هیچ skillی
    پیدا نشود، به مکان‌های قدیمی شناخته‌شده برمی‌گردد (برای مثال
    `~/openclaw/skills` و `~/.openclaw/skills`). این برای یافتن نصب‌های قدیمی‌تر skill بدون flagهای اضافی طراحی شده است.
  </Accordion>
  <Accordion title="ذخیره‌سازی و lockfile">
    - skillهای نصب‌شده در `.clawhub/lock.json` زیر workdir شما ثبت می‌شوند.
    - tokenهای احراز هویت در فایل config مربوط به ClawHub CLI ذخیره می‌شوند (قابل override از طریق `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="دورسنجی (تعداد نصب‌ها)">
    وقتی در حالت واردشده `clawhub sync` را اجرا می‌کنید، CLI یک snapshot حداقلی
    برای محاسبه تعداد نصب‌ها ارسال می‌کند. می‌توانید این را به‌طور کامل غیرفعال کنید:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی

| متغیر                        | اثر                                             |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | URL سایت را override می‌کند.                   |
| `CLAWHUB_REGISTRY`            | URL مربوط به registry API را override می‌کند.  |
| `CLAWHUB_CONFIG_PATH`         | محل ذخیره token/config توسط CLI را override می‌کند. |
| `CLAWHUB_WORKDIR`             | workdir پیش‌فرض را override می‌کند.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | دورسنجی را در `sync` غیرفعال می‌کند.           |

## مرتبط

- [Pluginهای جامعه](/fa/plugins/community)
- [Pluginها](/fa/tools/plugin)
- [Skills](/fa/tools/skills)
