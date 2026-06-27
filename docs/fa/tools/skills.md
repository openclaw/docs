---
read_when:
    - افزودن یا تغییر Skills
    - تغییر در گزینش Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک اولویت Skills و رفتار snapshot
sidebarTitle: Skills
summary: Skills به عامل شما می‌آموزد چگونه از ابزارها استفاده کند. بیاموزید چگونه بارگذاری می‌شوند، تقدم چگونه کار می‌کند، و چگونه دروازه‌گذاری، فهرست‌های مجاز و تزریق محیط را پیکربندی کنید.
title: Skills
x-i18n:
    generated_at: "2026-06-27T19:04:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills فایل‌های دستورالعمل Markdown هستند که به عامل یاد می‌دهند چگونه و چه زمانی از
ابزارها استفاده کند. هر مهارت در یک دایرکتوری قرار دارد که شامل فایل `SKILL.md` با
frontmatter از نوع YAML و بدنه Markdown است. OpenClaw مهارت‌های همراه بسته و هر
بازنویسی محلی را بارگذاری می‌کند و آن‌ها را هنگام بارگذاری بر اساس محیط، پیکربندی و
وجود باینری فیلتر می‌کند.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fa/tools/creating-skills" icon="hammer">
    یک مهارت سفارشی را از ابتدا بسازید و آزمایش کنید.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    پیشنهادهای مهارتِ پیش‌نویس‌شده توسط عامل را بازبینی و تأیید کنید.
  </Card>
  <Card title="Skills config" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*` و فهرست‌های مجاز عامل.
  </Card>
  <Card title="ClawHub" href="/fa/clawhub" icon="cloud">
    مهارت‌های جامعه را مرور و نصب کنید.
  </Card>
</CardGroup>

## ترتیب بارگذاری

OpenClaw از این منابع بارگذاری می‌کند، **ابتدا با بالاترین اولویت**. وقتی نام یکسان
مهارت در چند جای مختلف ظاهر شود، منبع با بالاترین اولویت برنده می‌شود.

| اولویت          | منبع                         | مسیر                                    |
| --------------- | ---------------------------- | --------------------------------------- |
| ۱ — بالاترین    | مهارت‌های فضای کاری          | `<workspace>/skills`                    |
| ۲               | مهارت‌های عامل پروژه         | `<workspace>/.agents/skills`            |
| ۳               | مهارت‌های عامل شخصی          | `~/.agents/skills`                      |
| ۴               | مهارت‌های مدیریت‌شده / محلی  | `~/.openclaw/skills`                    |
| ۵               | مهارت‌های همراه بسته         | همراه نصب ارائه می‌شود                 |
| ۶ — پایین‌ترین  | دایرکتوری‌های اضافی          | `skills.load.extraDirs` + مهارت‌های Plugin |

ریشه‌های مهارت از چیدمان‌های گروه‌بندی‌شده پشتیبانی می‌کنند. OpenClaw هرگاه
`SKILL.md` در هر جایی زیر یک ریشه پیکربندی‌شده ظاهر شود، یک مهارت را کشف می‌کند:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسیر پوشه فقط برای سازمان‌دهی است. نام مهارت، دستور slash، و کلید فهرست مجاز همگی
از فیلد frontmatter با نام `name` می‌آیند (یا وقتی `name` وجود نداشته باشد، از نام
دایرکتوری).

<Note>
  دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI، ریشه مهارت OpenClaw
  **نیست**. از `openclaw migrate plan codex` برای فهرست‌برداری از آن مهارت‌ها استفاده کنید، سپس
  `openclaw migrate codex` را اجرا کنید تا آن‌ها را به فضای کاری OpenClaw خود کپی کنید.
</Note>

## مهارت‌های مختص عامل در برابر مهارت‌های مشترک

در راه‌اندازی‌های چندعاملی، هر عامل فضای کاری خودش را دارد. از مسیری استفاده کنید که
با میزان نمایانی مورد نظر شما سازگار است:

| دامنه           | مسیر                         | قابل مشاهده برای              |
| --------------- | ---------------------------- | ----------------------------- |
| مختص عامل        | `<workspace>/skills`         | فقط همان عامل                 |
| عامل پروژه      | `<workspace>/.agents/skills` | فقط عامل همان فضای کاری       |
| عامل شخصی       | `~/.agents/skills`           | همه عامل‌ها روی این دستگاه    |
| مدیریت‌شده مشترک | `~/.openclaw/skills`         | همه عامل‌ها روی این دستگاه    |
| دایرکتوری‌های اضافی | `skills.load.extraDirs`      | همه عامل‌ها روی این دستگاه    |

## فهرست‌های مجاز عامل

**مکان** مهارت (اولویت) و **نمایانی** مهارت (اینکه کدام عامل می‌تواند از آن استفاده
کند) کنترل‌های جداگانه‌ای هستند. از فهرست‌های مجاز برای محدود کردن مهارت‌هایی که یک عامل می‌بیند استفاده کنید،
صرف‌نظر از اینکه از کجا بارگذاری شده‌اند.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - برای اینکه همه مهارت‌ها به‌طور پیش‌فرض نامحدود بمانند، `agents.defaults.skills` را حذف کنید.
    - برای به ارث بردن `agents.defaults.skills`، مقدار `agents.list[].skills` را حذف کنید.
    - برای اینکه هیچ مهارتی برای آن عامل نمایان نشود، `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** است — با پیش‌فرض‌ها
      ادغام نمی‌شود.
    - فهرست مجاز مؤثر در ساخت prompt، کشف دستورهای slash،
      همگام‌سازی sandbox، و snapshotهای مهارت اعمال می‌شود.
  </Accordion>
</AccordionGroup>

## Pluginها و مهارت‌ها

Pluginها می‌توانند با فهرست کردن دایرکتوری‌های `skills` در
`openclaw.plugin.json` (مسیرها نسبت به ریشه Plugin) مهارت‌های خودشان را ارائه کنند. مهارت‌های Plugin
وقتی Plugin فعال باشد بارگذاری می‌شوند — برای مثال، Plugin مرورگر یک مهارت
`browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های مهارت Plugin در همان سطح کم‌اولویت
`skills.load.extraDirs` ادغام می‌شوند، بنابراین یک مهارت همراه بسته، مدیریت‌شده، عامل، یا فضای کاری
با همان نام آن‌ها را بازنویسی می‌کند. آن‌ها را از طریق `metadata.openclaw.requires.config` روی ورودی
پیکربندی Plugin محدود کنید.

برای سامانه کامل Plugin، [Pluginها](/fa/tools/plugin) و [ابزارها](/fa/tools) را ببینید.

## کارگاه مهارت

[کارگاه مهارت](/fa/tools/skill-workshop) یک صف پیشنهاد میان عامل
و فایل‌های مهارت فعال شماست. وقتی عامل کار قابل استفاده مجددی تشخیص دهد، به‌جای نوشتن مستقیم در
`SKILL.md` یک پیشنهاد پیش‌نویس می‌کند. پیش از هر تغییری، شما بازبینی و تأیید می‌کنید.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه عمر کامل، مرجع CLI
و پیکربندی، [کارگاه مهارت](/fa/tools/skill-workshop) را ببینید.

## نصب از ClawHub

[ClawHub](https://clawhub.ai) رجیستری عمومی مهارت‌هاست. از دستورهای
`openclaw skills` برای نصب و به‌روزرسانی، یا از CLI `clawhub` برای
انتشار و همگام‌سازی استفاده کنید.

| اقدام                              | دستور                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| نصب یک مهارت در فضای کاری          | `openclaw skills install @owner/<slug>`                |
| نصب از یک مخزن Git                 | `openclaw skills install git:owner/repo@ref`           |
| نصب یک دایرکتوری مهارت محلی        | `openclaw skills install ./path/to/skill --as my-tool` |
| نصب برای همه عامل‌های محلی         | `openclaw skills install @owner/<slug> --global`       |
| به‌روزرسانی همه مهارت‌های فضای کاری | `openclaw skills update --all`                         |
| به‌روزرسانی یک مهارت مدیریت‌شده مشترک | `openclaw skills update @owner/<slug> --global`        |
| به‌روزرسانی همه مهارت‌های مدیریت‌شده مشترک | `openclaw skills update --all --global`                |
| راستی‌آزمایی trust envelope یک مهارت | `openclaw skills verify @owner/<slug>`                 |
| چاپ Skill Card تولیدشده            | `openclaw skills verify @owner/<slug> --card`          |
| انتشار / همگام‌سازی از طریق ClawHub CLI | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` به‌طور پیش‌فرض در دایرکتوری `skills/`
    فضای کاری فعال نصب می‌کند. برای نصب در دایرکتوری مشترک
    `~/.openclaw/skills`، که برای همه عامل‌های محلی قابل مشاهده است مگر اینکه فهرست‌های مجاز عامل
    آن را محدود کنند، `--global` را اضافه کنید.

    نصب‌های Git و محلی انتظار دارند `SKILL.md` در ریشه منبع باشد. slug از
    frontmatter `SKILL.md` و فیلد `name` می‌آید، اگر معتبر باشد، سپس به نام
    دایرکتوری یا مخزن برمی‌گردد. برای بازنویسی از `--as <slug>` استفاده کنید.
    `openclaw skills update` فقط نصب‌های ClawHub را ردیابی می‌کند — برای تازه‌سازی منابع Git یا
    محلی، آن‌ها را دوباره نصب کنید.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` از ClawHub،
    trust envelope مهارت با نام `clawhub.skill.verify.v1` را می‌خواهد. مهارت‌های نصب‌شده از ClawHub
    در برابر نسخه و رجیستری ثبت‌شده در `.clawhub/origin.json` راستی‌آزمایی می‌شوند.
    slugهای بدون owner همچنان برای مهارت‌های نصب‌شده موجود یا بدون ابهام پذیرفته می‌شوند، اما
    refهای دارای owner از ابهام ناشر جلوگیری می‌کنند.

    صفحه‌های مهارت در ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را نشان می‌دهند،
    با صفحه‌های جزئیات برای VirusTotal، ClawScan و تحلیل ایستا. وقتی
    ClawHub راستی‌آزمایی را ناموفق علامت بزند، دستور با وضعیت غیرصفر خارج می‌شود. ناشران
    false positiveها را از طریق داشبورد ClawHub یا
    `clawhub skill rescan @owner/<slug>` برطرف می‌کنند.

  </Accordion>
  <Accordion title="Private archive installs">
    کلاینت‌های Gateway که به تحویل غیر ClawHub نیاز دارند می‌توانند یک آرشیو zip مهارت را
    با `skills.upload.begin`، `skills.upload.chunk` و `skills.upload.commit` آماده کنند،
    سپس با `skills.install({ source: "upload", ... })` نصب کنند. این مسیر به‌طور
    پیش‌فرض غیرفعال است و به `skills.install.allowUploadedArchives: true` در
    `openclaw.json` نیاز دارد. نصب‌های عادی ClawHub هرگز به آن تنظیم نیاز ندارند.
  </Accordion>
</AccordionGroup>

## امنیت

<Warning>
  با مهارت‌های شخص ثالث مانند **کد غیرقابل اعتماد** رفتار کنید. پیش از فعال‌سازی آن‌ها را بخوانید.
  برای ورودی‌های غیرقابل اعتماد و ابزارهای پرخطر، اجرای sandboxشده را ترجیح دهید. برای کنترل‌های سمت عامل،
  [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    کشف مهارت‌های فضای کاری، عامل پروژه و دایرکتوری اضافی فقط ریشه‌های مهارتی را می‌پذیرد
    که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند، مگر اینکه
    `skills.load.allowSymlinkTargets` به‌طور صریح به یک ریشه هدف اعتماد کند.
    کارگاه مهارت فقط زمانی از طریق آن هدف‌های مورد اعتماد می‌نویسد که
    `skills.workshop.allowSymlinkTargetWrites` فعال باشد.
    `~/.openclaw/skills` مدیریت‌شده و `~/.agents/skills` شخصی ممکن است شامل
    پوشه‌های مهارت symlinkشده باشند، اما realpath هر `SKILL.md` همچنان باید
    داخل دایرکتوری مهارت حل‌شده خودش باقی بماند.
  </Accordion>
  <Accordion title="Operator install policy">
    `security.installPolicy` را پیکربندی کنید تا پیش از ادامه نصب مهارت‌ها، یک دستور سیاست محلی مورد اعتماد
    اجرا شود. این سیاست metadata و مسیر منبع آماده‌شده را دریافت می‌کند، برای مسیرهای
    ClawHub، آپلودشده، Git، محلی، به‌روزرسانی و نصب‌کننده وابستگی اعمال می‌شود، و وقتی دستور نتواند
    یک تصمیم معتبر برگرداند، fail closed می‌شود.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` و `skills.entries.*.apiKey` رازها را فقط برای همان نوبت عامل
    به فرایند **میزبان** تزریق می‌کنند — نه به sandbox. رازها را از promptها و گزارش‌ها
    دور نگه دارید.
  </Accordion>
</AccordionGroup>

برای مدل تهدید گسترده‌تر و فهرست‌های بررسی امنیتی،
[امنیت](/fa/gateway/security) را ببینید.

## قالب SKILL.md

هر مهارت دست‌کم به یک `name` و `description` در frontmatter نیاز دارد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw از مشخصات [AgentSkills](https://agentskills.io) پیروی می‌کند. parser
  frontmatter فقط از **کلیدهای تک‌خطی** پشتیبانی می‌کند — `metadata` باید یک
  شیء JSON تک‌خطی باشد. از `{baseDir}` در بدنه برای ارجاع به مسیر پوشه مهارت
  استفاده کنید.
</Note>

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در UI مهارت‌های macOS به‌عنوان "Website" نشان داده می‌شود. از طریق
  `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌عنوان یک دستور slash قابل فراخوانی توسط کاربر نمایان می‌شود.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های مهارت را از prompt عادی عامل
  بیرون نگه می‌دارد. وقتی `user-invocable` نیز `true` باشد،
  مهارت همچنان به‌عنوان دستور slash در دسترس است.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، دستور slash مدل را دور می‌زند و
  مستقیم به یک ابزار ثبت‌شده dispatch می‌شود.
</ParamField>

<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشته خام args را بدون parsing هسته
  به ابزار می‌فرستد. ابزار
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` را دریافت می‌کند.
</ParamField>

## محدودسازی

OpenClaw مهارت‌ها را هنگام بارگذاری با استفاده از `metadata.openclaw` (JSON تک‌خطی
در frontmatter) فیلتر می‌کند. مهارتی که بلوک `metadata.openclaw` ندارد همیشه
واجد شرایط است، مگر اینکه صراحتاً غیرفعال شده باشد.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  وقتی `true` باشد، مهارت همیشه اضافه می‌شود و همه دروازه‌های دیگر نادیده گرفته می‌شوند.
</ParamField>

<ParamField path="emoji" type="string">
  ایموجی اختیاری که در رابط کاربری Skills در macOS نمایش داده می‌شود.
</ParamField>

<ParamField path="homepage" type="string">
  نشانی اختیاری که به‌عنوان «وب‌سایت» در رابط کاربری Skills در macOS نمایش داده می‌شود.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  فیلتر پلتفرم. وقتی تنظیم شود، مهارت فقط روی سیستم‌عامل‌های فهرست‌شده واجد شرایط است.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  هر باینری باید روی `PATH` وجود داشته باشد.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  حداقل یک باینری باید روی `PATH` وجود داشته باشد.
</ParamField>

<ParamField path="requires.env" type="string[]">
  هر متغیر محیطی باید در فرایند وجود داشته باشد یا از طریق پیکربندی ارائه شود.
</ParamField>

<ParamField path="requires.config" type="string[]">
  هر مسیر `openclaw.json` باید truthy باشد.
</ParamField>

<ParamField path="primaryEnv" type="string">
  نام متغیر محیطی مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مشخصات نصب‌کننده اختیاری که رابط کاربری Skills در macOS از آن استفاده می‌کند (brew / node / go / uv / download).
</ParamField>

<Note>
  بلوک‌های قدیمی `metadata.clawdbot` همچنان وقتی
  `metadata.openclaw` وجود نداشته باشد پذیرفته می‌شوند، بنابراین مهارت‌های نصب‌شده قدیمی
  دروازه‌های وابستگی و راهنمای نصب‌کننده خود را حفظ می‌کنند. مهارت‌های جدید باید از
  `metadata.openclaw` استفاده کنند.
</Note>

### مشخصات نصب‌کننده

مشخصات نصب‌کننده به رابط کاربری Skills در macOS می‌گوید چگونه یک وابستگی را نصب کند:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="قواعد انتخاب نصب‌کننده">
    - وقتی چند نصب‌کننده فهرست شده باشند، gateway یک گزینه ترجیحی را انتخاب می‌کند
      (brew در صورت وجود، در غیر این صورت node).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید
      همه آرتیفکت‌های موجود را ببینید.
    - مشخصات می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا بر اساس پلتفرم فیلتر شود.
    - نصب‌های Node به `skills.install.nodeManager` در `openclaw.json`
      احترام می‌گذارند (پیش‌فرض: npm؛ گزینه‌ها: npm / pnpm / yarn / bun). این فقط بر نصب
      مهارت‌ها اثر می‌گذارد؛ زمان اجرای Gateway همچنان باید Node باشد.
    - ترجیح نصب‌کننده Gateway: Homebrew → uv → مدیر node پیکربندی‌شده →
      go → download.
  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **Homebrew:** OpenClaw به‌طور خودکار Homebrew را نصب نمی‌کند یا فرمول‌های brew را
      به فرمان‌های بسته سیستم تبدیل نمی‌کند. در کانتینرهای Linux بدون
      `brew`، نصب‌کننده‌های فقط brew پنهان می‌شوند؛ از یک تصویر سفارشی استفاده کنید یا
      وابستگی را دستی نصب کنید.
    - **Go:** اگر `go` وجود نداشته باشد و `brew` در دسترس باشد، gateway ابتدا
      Go را از طریق Homebrew نصب می‌کند و `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **Download:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (پیش‌فرض: خودکار وقتی آرشیو شناسایی شود)، `stripComponents`،
      `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="نکات sandbox">
    `requires.bins` هنگام بارگذاری مهارت روی **میزبان** بررسی می‌شود. اگر یک agent
    در sandbox اجرا شود، باینری باید **داخل کانتینر** نیز وجود داشته باشد.
    آن را از طریق `agents.defaults.sandbox.docker.setupCommand` یا یک تصویر سفارشی
    نصب کنید. `setupCommand` یک‌بار پس از ساخت کانتینر اجرا می‌شود و به
    خروجی شبکه، root FS قابل نوشتن، و کاربر root در sandbox نیاز دارد.
  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

مهارت‌های همراه یا مدیریت‌شده را زیر `skills.entries` در
`~/.openclaw/openclaw.json` فعال، غیرفعال و پیکربندی کنید:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` مهارت را حتی وقتی همراه یا نصب‌شده باشد غیرفعال می‌کند. مهارت همراه `coding-agent`
  اختیاری است — `skills.entries.coding-agent.enabled: true` را تنظیم کنید
  و مطمئن شوید یکی از `claude`، `codex`، `opencode` یا CLI پشتیبانی‌شده دیگری
  نصب و احراز هویت شده است.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای مهارت‌هایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از یک رشته متنی ساده یا یک شیء SecretRef پشتیبانی می‌کند.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای agent. فقط وقتی تزریق می‌شوند که
  متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="config" type="object">
  محفظه اختیاری برای فیلدهای پیکربندی سفارشی ویژه هر مهارت.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  فهرست مجاز اختیاری فقط برای مهارت‌های **همراه**. وقتی تنظیم شود، فقط مهارت‌های همراه
  داخل فهرست واجد شرایط هستند. مهارت‌های مدیریت‌شده و workspace تحت تأثیر قرار نمی‌گیرند.
</ParamField>

<Note>
  کلیدهای پیکربندی به‌طور پیش‌فرض با **نام مهارت** مطابقت دارند. اگر مهارتی
  `metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید. نام‌های
  دارای خط تیره را داخل کوتیشن بگذارید: JSON5 کلیدهای کوتیشن‌دار را مجاز می‌داند.
</Note>

## تزریق محیط

وقتی اجرای agent شروع می‌شود، OpenClaw:

<Steps>
  <Step title="فراداده مهارت را می‌خواند">
    OpenClaw فهرست مؤثر مهارت‌ها را برای agent resolve می‌کند و قواعد gating،
    allowlistها و بازنویسی‌های پیکربندی را اعمال می‌کند.
  </Step>
  <Step title="env و کلیدهای API را تزریق می‌کند">
    `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` برای مدت اجرای run روی
    `process.env` اعمال می‌شوند.
  </Step>
  <Step title="system prompt را می‌سازد">
    مهارت‌های واجد شرایط در یک بلوک XML فشرده گردآوری و به
    system prompt تزریق می‌شوند.
  </Step>
  <Step title="محیط را بازیابی می‌کند">
    پس از پایان run، محیط اصلی بازیابی می‌شود.
  </Step>
</Steps>

<Warning>
  تزریق env محدود به اجرای agent روی **میزبان** است، نه sandbox. داخل
  sandbox، `env` و `apiKey` اثری ندارند. برای نحوه
  ارسال secrets به اجراهای sandboxed، [پیکربندی Skills](/fa/tools/skills-config#sandboxed-skills-and-env-vars) را ببینید.
</Warning>

برای backend همراه `claude-cli`، OpenClaw همان snapshot مهارت‌های
واجد شرایط را نیز به‌صورت یک Plugin موقت Claude Code materialize می‌کند و آن را از طریق
`--plugin-dir` پاس می‌دهد. backendهای CLI دیگر فقط از catalog مربوط به prompt استفاده می‌کنند.

## Snapshotها و refresh

OpenClaw مهارت‌های واجد شرایط را **وقتی یک session شروع می‌شود** snapshot می‌گیرد و همان
فهرست را برای همه turnهای بعدی در session دوباره استفاده می‌کند. تغییرات در مهارت‌ها یا پیکربندی
در session جدید بعدی اعمال می‌شود.

Skills در دو حالت وسط session refresh می‌شوند:

- watcher مهارت‌ها تغییر در `SKILL.md` را تشخیص دهد.
- یک node راه‌دور واجد شرایط جدید متصل شود.

فهرست refresh‌شده در turn بعدی agent استفاده می‌شود. اگر allowlist مؤثر agent
تغییر کند، OpenClaw snapshot را refresh می‌کند تا مهارت‌های قابل مشاهده
هم‌راستا بمانند.

<AccordionGroup>
  <Accordion title="Watcher مربوط به Skills">
    به‌طور پیش‌فرض، OpenClaw پوشه‌های مهارت را watch می‌کند و وقتی
    فایل‌های `SKILL.md` تغییر کنند snapshot را bump می‌کند. زیر `skills.load` پیکربندی کنید:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    از `allowSymlinkTargets` برای layoutهای symlinkشده عمدی استفاده کنید که در آن root یک مهارت
    symlink به بیرون از root پیکربندی‌شده اشاره می‌کند، برای مثال
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    `skills.workshop.allowSymlinkTargetWrites` را فقط وقتی فعال کنید که Skill Workshop
    باید proposalها را از طریق همان مسیرهای symlinkشده مورد اعتماد نیز اعمال کند.

  </Accordion>
  <Accordion title="Nodeهای راه‌دور macOS (gateway در Linux)">
    اگر Gateway روی Linux اجرا شود اما یک **node macOS** با اجازه
    `system.run` متصل باشد، OpenClaw می‌تواند مهارت‌های فقط macOS را وقتی
    باینری‌های لازم روی آن node موجود باشند واجد شرایط بداند. agent باید آن
    مهارت‌ها را از طریق ابزار `exec` با `host=node` اجرا کند.

    nodeهای offline مهارت‌های فقط راه‌دور را قابل مشاهده **نمی‌کنند**. اگر یک node پاسخ‌دادن
    به probeهای bin را متوقف کند، OpenClaw تطابق‌های bin کش‌شده آن را پاک می‌کند.

  </Accordion>
</AccordionGroup>

## اثر توکن

وقتی مهارت‌ها واجد شرایط باشند، OpenClaw یک بلوک XML فشرده را به system
prompt تزریق می‌کند. هزینه deterministic است:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **سربار پایه** (فقط وقتی ≥ 1 مهارت وجود دارد): حدود 195 نویسه
- **برای هر مهارت:** حدود 97 نویسه + طول فیلدهای `name`، `description` و `location`
- XML escaping، `& < > " '` را به entityها گسترش می‌دهد و برای هر رخداد چند نویسه اضافه می‌کند
- با حدود 4 نویسه/توکن، 97 نویسه ≈ 24 توکن برای هر مهارت پیش از طول فیلدها

توضیح‌ها را کوتاه و گویا نگه دارید تا سربار prompt به حداقل برسد.

## مرتبط

<CardGroup cols={2}>
  <Card title="ایجاد مهارت‌ها" href="/fa/tools/creating-skills" icon="hammer">
    راهنمای گام‌به‌گام برای نوشتن یک مهارت سفارشی.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف proposal برای مهارت‌های draftشده توسط agent.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    schema کامل پیکربندی `skills.*` و allowlistهای agent.
  </Card>
  <Card title="فرمان‌های اسلش" href="/fa/tools/slash-commands" icon="terminal">
    نحوه ثبت و route شدن فرمان‌های اسلش مهارت.
  </Card>
  <Card title="ClawHub" href="/fa/clawhub" icon="cloud">
    مهارت‌ها را در registry عمومی مرور و منتشر کنید.
  </Card>
  <Card title="Plugins" href="/fa/tools/plugin" icon="plug">
    Plugins می‌توانند Skills را همراه ابزارهایی که مستند می‌کنند ارسال کنند.
  </Card>
</CardGroup>
