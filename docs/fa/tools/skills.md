---
read_when:
    - افزودن یا تغییر Skills
    - تغییر کنترل دسترسی مهارت‌ها، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک تقدم Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: Skills به عامل شما می‌آموزد چگونه از ابزارها استفاده کند. بیاموزید چگونه بارگذاری می‌شوند، تقدم چگونه کار می‌کند، و چگونه gating، allowlistها و تزریق محیط را پیکربندی کنید.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:42:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills فایل‌های دستورالعملی Markdown هستند که به عامل یاد می‌دهند چگونه و چه زمانی از
ابزارها استفاده کند. هر Skill در یک پوشه قرار دارد که شامل فایل `SKILL.md` با
frontmatter از نوع YAML و بدنه Markdown است. OpenClaw، Skills همراه بسته و هر
بازنویسی محلی را بارگذاری می‌کند و در زمان بارگذاری، آن‌ها را بر اساس محیط،
پیکربندی و وجود باینری فیلتر می‌کند.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fa/tools/creating-skills" icon="hammer">
    یک Skill سفارشی را از ابتدا بسازید و آزمایش کنید.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    پیشنهادهای Skill تهیه‌شده توسط عامل را بازبینی و تأیید کنید.
  </Card>
  <Card title="Skills config" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*` و فهرست‌های مجاز عامل.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills جامعه را مرور و نصب کنید.
  </Card>
</CardGroup>

## ترتیب بارگذاری

OpenClaw از این منابع بارگذاری می‌کند، با **بالاترین تقدم در ابتدا**. وقتی نام
یک Skill در چند محل ظاهر شود، منبع با بالاترین تقدم برنده می‌شود.

| اولویت | منبع | مسیر |
| ----------- | ---------------------- | --------------------------------------- |
| ۱ — بالاترین | Skills فضای کاری | `<workspace>/skills` |
| ۲ | Skills عامل پروژه | `<workspace>/.agents/skills` |
| ۳ | Skills عامل شخصی | `~/.agents/skills` |
| ۴ | Skills مدیریت‌شده / محلی | `~/.openclaw/skills` |
| ۵ | Skills همراه بسته | همراه نصب ارائه می‌شود |
| ۶ — پایین‌ترین | پوشه‌های اضافی | `skills.load.extraDirs` + Skills مربوط به Plugin |

ریشه‌های Skill از چیدمان‌های گروه‌بندی‌شده پشتیبانی می‌کنند. OpenClaw هر زمان
`SKILL.md` در هر جایی زیر یک ریشه پیکربندی‌شده ظاهر شود، یک Skill را کشف می‌کند:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسیر پوشه فقط برای سازمان‌دهی است. نام Skill، دستور slash و کلید فهرست مجاز همگی
از فیلد frontmatter با نام `name` می‌آیند (یا وقتی `name` وجود ندارد، از نام
پوشه).

<Note>
  پوشه بومی `$CODEX_HOME/skills` در Codex CLI، ریشه Skill در OpenClaw
  **نیست**. از `openclaw migrate plan codex` برای فهرست‌برداری از آن Skills
  استفاده کنید، سپس با `openclaw migrate codex` آن‌ها را به فضای کاری OpenClaw
  خود کپی کنید.
</Note>

## Skills مختص هر عامل در برابر Skills مشترک

در راه‌اندازی‌های چندعاملی، هر عامل فضای کاری خودش را دارد. از مسیری استفاده
کنید که با میزان دیدپذیری دلخواه شما سازگار است:

| دامنه | مسیر | قابل مشاهده برای |
| -------------- | ---------------------------- | --------------------------- |
| مختص هر عامل | `<workspace>/skills` | فقط همان عامل |
| عامل پروژه | `<workspace>/.agents/skills` | فقط عامل همان فضای کاری |
| عامل شخصی | `~/.agents/skills` | همه عامل‌های این دستگاه |
| مدیریت‌شده مشترک | `~/.openclaw/skills` | همه عامل‌های این دستگاه |
| پوشه‌های اضافی | `skills.load.extraDirs` | همه عامل‌های این دستگاه |

## فهرست‌های مجاز عامل

**محل** Skill (تقدم) و **دیدپذیری** Skill (اینکه کدام عامل می‌تواند از آن استفاده
کند) کنترل‌های جداگانه‌ای هستند. از فهرست‌های مجاز برای محدود کردن Skills قابل
مشاهده برای یک عامل استفاده کنید، فارغ از اینکه از کجا بارگذاری شده‌اند.

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
    - برای اینکه همه Skills به‌صورت پیش‌فرض نامحدود باشند، `agents.defaults.skills` را حذف کنید.
    - برای به ارث بردن `agents.defaults.skills`، مقدار `agents.list[].skills` را حذف کنید.
    - برای اینکه هیچ Skill برای آن عامل ارائه نشود، `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** است — با پیش‌فرض‌ها
      ادغام نمی‌شود.
    - فهرست مجاز مؤثر در ساخت prompt، کشف دستورهای slash، همگام‌سازی sandbox و
      snapshotهای Skill اعمال می‌شود.
    - این مرز مجوزدهی پوسته میزبان نیست. اگر همان عامل می‌تواند از `exec`
      استفاده کند، آن پوسته را جداگانه با sandboxing، جداسازی کاربر سیستم‌عامل،
      فهرست‌های رد/مجاز exec و اعتبارنامه‌های مختص هر منبع محدود کنید.
  </Accordion>
</AccordionGroup>

## Pluginها و Skills

Pluginها می‌توانند با فهرست کردن پوشه‌های `skills` در `openclaw.plugin.json`
(مسیرها نسبت به ریشه Plugin)، Skills خودشان را ارائه کنند. Skills مربوط به Plugin
وقتی Plugin فعال باشد بارگذاری می‌شوند — برای مثال، Plugin مرورگر یک Skill با نام
`browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

پوشه‌های Skill مربوط به Plugin در همان سطح کم‌تقدم `skills.load.extraDirs` ادغام
می‌شوند، بنابراین یک Skill همراه بسته، مدیریت‌شده، عامل یا فضای کاری با همان نام،
آن‌ها را بازنویسی می‌کند. آن‌ها را از طریق `metadata.openclaw.requires.config`
روی ورودی پیکربندی Plugin محدود کنید.

برای سامانه کامل Plugin، [Pluginها](/fa/tools/plugin) و [ابزارها](/fa/tools) را ببینید.

## Skill Workshop

[Skill Workshop](/fa/tools/skill-workshop) صف پیشنهادی میان عامل و فایل‌های Skill
فعال شماست. وقتی عامل کار قابل استفاده مجددی را تشخیص دهد، به‌جای نوشتن مستقیم
در `SKILL.md` یک پیشنهاد تهیه می‌کند. شما پیش از هر تغییری آن را بازبینی و تأیید
می‌کنید.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه عمر کامل، مرجع CLI و پیکربندی، [Skill Workshop](/fa/tools/skill-workshop)
را ببینید.

## نصب از ClawHub

[ClawHub](https://clawhub.ai) رجیستری عمومی Skills است. برای نصب و به‌روزرسانی از
دستورهای `openclaw skills` استفاده کنید، یا برای انتشار و همگام‌سازی از CLI
`clawhub` استفاده کنید.

| کنش | دستور |
| ---------------------------------- | ------------------------------------------------------ |
| نصب یک Skill در فضای کاری | `openclaw skills install @owner/<slug>` |
| نصب از یک مخزن Git | `openclaw skills install git:owner/repo@ref` |
| نصب یک پوشه Skill محلی | `openclaw skills install ./path/to/skill --as my-tool` |
| نصب برای همه عامل‌های محلی | `openclaw skills install @owner/<slug> --global` |
| به‌روزرسانی همه Skills فضای کاری | `openclaw skills update --all` |
| به‌روزرسانی یک Skill مدیریت‌شده مشترک | `openclaw skills update @owner/<slug> --global` |
| به‌روزرسانی همه Skills مدیریت‌شده مشترک | `openclaw skills update --all --global` |
| بررسی پوشش اعتماد یک Skill | `openclaw skills verify @owner/<slug>` |
| چاپ Skill Card تولیدشده | `openclaw skills verify @owner/<slug> --card` |
| انتشار / همگام‌سازی از طریق CLI ClawHub | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` به‌صورت پیش‌فرض در پوشه `skills/` فضای کاری فعال
    نصب می‌کند. برای نصب در پوشه مشترک `~/.openclaw/skills`، که برای همه
    عامل‌های محلی قابل مشاهده است مگر اینکه فهرست‌های مجاز عامل آن را محدود
    کنند، `--global` را اضافه کنید.

    نصب‌های Git و محلی انتظار دارند `SKILL.md` در ریشه منبع باشد. slug ابتدا از
    frontmatter فایل `SKILL.md` و فیلد `name` در صورت معتبر بودن گرفته می‌شود،
    سپس به نام پوشه یا مخزن برمی‌گردد. برای بازنویسی از `--as <slug>` استفاده
    کنید. `openclaw skills update` فقط نصب‌های ClawHub را دنبال می‌کند — برای
    تازه‌سازی منابع Git یا محلی، آن‌ها را دوباره نصب کنید.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` از ClawHub پوشش اعتماد
    `clawhub.skill.verify.v1` مربوط به Skill را درخواست می‌کند. Skills نصب‌شده از
    ClawHub در برابر نسخه و رجیستری ثبت‌شده در `.clawhub/origin.json` بررسی
    می‌شوند. slugهای تنها برای Skills نصب‌شده موجود یا بدون ابهام همچنان پذیرفته
    می‌شوند، اما ارجاع‌های دارای owner از ابهام ناشر جلوگیری می‌کنند.

    صفحه‌های Skill در ClawHub تازه‌ترین وضعیت اسکن امنیتی را پیش از نصب نشان
    می‌دهند، همراه با صفحه‌های جزئیات برای VirusTotal، ClawScan و تحلیل ایستا.
    وقتی ClawHub بررسی را ناموفق علامت‌گذاری کند، دستور با وضعیت غیرصفر خارج
    می‌شود. ناشران false positiveها را از طریق داشبورد ClawHub یا
    `clawhub skill rescan @owner/<slug>` برطرف می‌کنند.

  </Accordion>
  <Accordion title="Private archive installs">
    کلاینت‌های Gateway که به تحویل خارج از ClawHub نیاز دارند می‌توانند یک
    آرشیو zip از Skill را با `skills.upload.begin`، `skills.upload.chunk` و
    `skills.upload.commit` آماده کنند، سپس با
    `skills.install({ source: "upload", ... })` نصب کنند. این مسیر به‌صورت
    پیش‌فرض غیرفعال است و به `skills.install.allowUploadedArchives: true` در
    `openclaw.json` نیاز دارد. نصب‌های عادی ClawHub هرگز به آن تنظیم نیاز ندارند.
  </Accordion>
</AccordionGroup>

## امنیت

<Warning>
  با Skills شخص ثالث مانند **کد غیرقابل اعتماد** رفتار کنید. پیش از فعال‌سازی
  آن‌ها را بخوانید. برای ورودی‌های غیرقابل اعتماد و ابزارهای پرخطر، اجرای
  sandboxشده را ترجیح دهید. برای کنترل‌های سمت عامل، [Sandboxing](/fa/gateway/sandboxing)
  را ببینید.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    کشف Skill در فضای کاری، عامل پروژه و پوشه‌های اضافی فقط ریشه‌های Skill را
    می‌پذیرد که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده بماند، مگر اینکه
    `skills.load.allowSymlinkTargets` به‌طور صریح به یک ریشه مقصد اعتماد کند.
    Skill Workshop فقط وقتی `skills.workshop.allowSymlinkTargetWrites` فعال باشد
    از طریق آن مقصدهای مورد اعتماد می‌نویسد. پوشه‌های مدیریت‌شده
    `~/.openclaw/skills` و شخصی `~/.agents/skills` ممکن است شامل پوشه‌های Skill
    symlinkشده باشند، اما realpath هر `SKILL.md` همچنان باید داخل پوشه Skill
    حل‌شده خودش بماند.
  </Accordion>
  <Accordion title="Operator install policy">
    `security.installPolicy` را پیکربندی کنید تا پیش از ادامه نصب Skill، یک
    دستور سیاست محلی مورد اعتماد اجرا شود. این سیاست metadata و مسیر منبع
    آماده‌شده را دریافت می‌کند، برای مسیرهای ClawHub، آپلودشده، Git، محلی،
    به‌روزرسانی و نصب‌کننده وابستگی اعمال می‌شود و وقتی دستور نتواند تصمیم
    معتبری برگرداند، بسته و ناموفق می‌شود.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` و `skills.entries.*.apiKey` اسرار را فقط برای همان
    نوبت عامل به فرایند **میزبان** تزریق می‌کنند — نه به sandbox. اسرار را از
    promptها و logها دور نگه دارید.
  </Accordion>
</AccordionGroup>

برای مدل تهدید گسترده‌تر و چک‌لیست‌های امنیتی، [امنیت](/fa/gateway/security) را
ببینید.

## قالب SKILL.md

هر Skill حداقل به یک `name` و `description` در frontmatter نیاز دارد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw از مشخصات [AgentSkills](https://agentskills.io) پیروی می‌کند. parser
  مربوط به frontmatter فقط از **کلیدهای تک‌خطی** پشتیبانی می‌کند — `metadata`
  باید یک شیء JSON تک‌خطی باشد. از `{baseDir}` در بدنه برای ارجاع به مسیر پوشه
  Skill استفاده کنید.
</Note>

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در رابط کاربری macOS Skills به‌صورت "Website" نمایش داده می‌شود. از
  طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، Skill به‌صورت یک دستور slash قابل فراخوانی توسط کاربر ارائه
  می‌شود.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های Skill را از prompt عادی عامل بیرون
  نگه می‌دارد. وقتی `user-invocable` نیز `true` باشد، Skill همچنان به‌صورت دستور
  slash در دسترس است.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، دستور slash مدل را دور می‌زند و مستقیماً به یک
  ابزار ثبت‌شده dispatch می‌شود.
</ParamField>

<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای ارسال ابزار، رشته خام آرگومان‌ها را بدون هیچ تحلیل هسته‌ای
  به ابزار ارسال می‌کند. ابزار
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` را دریافت می‌کند.
</ParamField>

## دروازه‌گذاری

OpenClaw هنگام بارگذاری، مهارت‌ها را با استفاده از `metadata.openclaw` (JSON تک‌خطی
در frontmatter) فیلتر می‌کند. مهارتی که بلوک `metadata.openclaw` ندارد همیشه
واجد شرایط است، مگر اینکه صراحتا غیرفعال شده باشد.

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
  وقتی `true` باشد، همیشه مهارت را شامل می‌کند و همه دروازه‌های دیگر را رد می‌کند.
</ParamField>

<ParamField path="emoji" type="string">
  ایموجی اختیاری که در رابط Skills در macOS نشان داده می‌شود.
</ParamField>

<ParamField path="homepage" type="string">
  URL اختیاری که با عنوان «وب‌سایت» در رابط Skills در macOS نشان داده می‌شود.
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
  مشخصات نصب‌کننده اختیاری که توسط رابط Skills در macOS استفاده می‌شود (brew / node / go / uv / download).
</ParamField>

<Note>
  وقتی `metadata.openclaw` وجود نداشته باشد، بلوک‌های قدیمی `metadata.clawdbot`
  همچنان پذیرفته می‌شوند، بنابراین مهارت‌های نصب‌شده قدیمی دروازه‌های
  وابستگی و راهنماهای نصب‌کننده خود را حفظ می‌کنند. مهارت‌های جدید باید از
  `metadata.openclaw` استفاده کنند.
</Note>

### مشخصات نصب‌کننده

مشخصات نصب‌کننده به رابط Skills در macOS می‌گوید چگونه یک وابستگی را نصب کند:

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
    - وقتی چند نصب‌کننده فهرست شده باشند، Gateway یک گزینه ترجیحی را انتخاب
      می‌کند (brew وقتی در دسترس باشد، وگرنه node).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید
      همه artifactهای موجود را ببینید.
    - مشخصات می‌توانند شامل `os: ["darwin"|"linux"|"win32"]` باشند تا براساس پلتفرم فیلتر شوند.
    - نصب‌های Node به `skills.install.nodeManager` در `openclaw.json`
      احترام می‌گذارند (پیش‌فرض: npm؛ گزینه‌ها: npm / pnpm / yarn / bun). این فقط روی نصب
      مهارت‌ها اثر می‌گذارد؛ runtime مربوط به Gateway همچنان باید Node باشد.
    - ترجیح نصب‌کننده Gateway: Homebrew → uv → مدیر node پیکربندی‌شده →
      go → download.
  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **Homebrew:** OpenClaw به‌صورت خودکار Homebrew را نصب نمی‌کند یا فرمول‌های brew
      را به دستورهای بسته سیستم ترجمه نمی‌کند. در کانتینرهای Linux بدون
      `brew`، نصب‌کننده‌های فقط brew پنهان می‌شوند؛ از یک image سفارشی استفاده کنید یا
      وابستگی را دستی نصب کنید.
    - **Go:** OpenClaw برای نصب خودکار مهارت‌ها به Go 1.21 یا جدیدتر نیاز دارد و
      تنظیمات موجود `GOBIN`، `GOPATH` و `GOTOOLCHAIN` را حفظ می‌کند. اگر
      toolchain پیکربندی‌شده نتواند نسخه Go موردنیاز یک ماژول را تامین کند،
      onboarding پس از تلاش نصب، مهارت را همراه با پیش‌نیازهای دستی Go گروه‌بندی می‌کند.
      اگر `go` وجود نداشته باشد و Homebrew در دسترس باشد، OpenClaw ابتدا
      Go را از طریق Homebrew نصب می‌کند و `GOBIN` را روی `bin` متعلق به Homebrew تنظیم می‌کند. در Linux،
      OpenClaw می‌تواند به‌جای آن از `apt-get` به‌عنوان root یا از طریق `sudo` بدون گذرواژه
      استفاده کند، وقتی candidate تازه‌سازی‌شده `golang-go` حداقل نسخه را برآورده کند.
    - **Download:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (پیش‌فرض: تشخیص خودکار وقتی آرشیو شناسایی شود)، `stripComponents`،
      `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="نکات sandboxing">
    `requires.bins` هنگام بارگذاری مهارت روی **host** بررسی می‌شود. اگر یک agent
    در sandbox اجرا شود، باینری باید **داخل کانتینر** هم وجود داشته باشد.
    آن را از طریق `agents.defaults.sandbox.docker.setupCommand` یا یک image سفارشی
    نصب کنید. `setupCommand` یک بار پس از ایجاد کانتینر اجرا می‌شود و به
    خروج شبکه، فایل‌سیستم root قابل نوشتن، و کاربر root در sandbox نیاز دارد.
  </Accordion>
</AccordionGroup>

## overrideهای پیکربندی

مهارت‌های bundled یا managed را زیر `skills.entries` در
`~/.openclaw/openclaw.json` روشن و پیکربندی کنید:

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
  `false` مهارت را حتی وقتی bundled یا نصب‌شده باشد غیرفعال می‌کند. مهارت bundled
  `coding-agent` اختیاری است — `skills.entries.coding-agent.enabled: true`
  را تنظیم کنید و مطمئن شوید یکی از `claude`، `codex`، `opencode` یا CLI
  پشتیبانی‌شده دیگری نصب و احراز هویت شده است.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای مهارت‌هایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از یک رشته متن ساده یا شیء SecretRef پشتیبانی می‌کند.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغیرهای محیطی که برای اجرای agent تزریق می‌شوند. فقط وقتی تزریق می‌شوند که
  متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="config" type="object">
  کیسه اختیاری برای فیلدهای پیکربندی سفارشی هر مهارت.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای مهارت‌های **bundled**. وقتی تنظیم شود، فقط مهارت‌های bundled
  داخل فهرست واجد شرایط هستند. مهارت‌های managed و workspace تحت تاثیر قرار نمی‌گیرند.
</ParamField>

<Note>
  کلیدهای پیکربندی به‌صورت پیش‌فرض با **نام مهارت** مطابقت دارند. اگر مهارتی
  `metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید. نام‌های
  دارای خط تیره را داخل کوتیشن بگذارید: JSON5 کلیدهای quoted را مجاز می‌داند.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

<Steps>
  <Step title="metadata مهارت را می‌خواند">
    OpenClaw فهرست موثر مهارت‌ها را برای agent حل می‌کند و قواعد دروازه‌گذاری،
    allowlistها، و overrideهای پیکربندی را اعمال می‌کند.
  </Step>
  <Step title="محیط و کلیدهای API را تزریق می‌کند">
    `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` برای مدت اجرای
    run روی `process.env` اعمال می‌شوند.
  </Step>
  <Step title="system prompt را می‌سازد">
    مهارت‌های واجد شرایط در یک بلوک XML فشرده کامپایل می‌شوند و داخل
    system prompt تزریق می‌شوند.
  </Step>
  <Step title="محیط را بازیابی می‌کند">
    پس از پایان run، محیط اصلی بازیابی می‌شود.
  </Step>
</Steps>

<Warning>
  تزریق env به اجرای agent روی **host** محدود است، نه sandbox. داخل یک
  sandbox، `env` و `apiKey` اثری ندارند. برای نحوه
  انتقال secretها به اجراهای sandboxed، [پیکربندی Skills](/fa/tools/skills-config#sandboxed-skills-and-env-vars) را ببینید.
</Warning>

برای backend bundled به نام `claude-cli`، OpenClaw همان snapshot مهارت‌های
واجد شرایط را نیز به‌صورت یک Plugin موقت Claude Code materialize می‌کند و آن را از طریق
`--plugin-dir` ارسال می‌کند. backendهای CLI دیگر فقط از prompt catalog استفاده می‌کنند.

## Snapshotها و refresh

OpenClaw مهارت‌های واجد شرایط را **هنگام شروع یک session** snapshot می‌کند و همان
فهرست را برای همه turnهای بعدی در session دوباره استفاده می‌کند. تغییرات مهارت‌ها یا پیکربندی
در session جدید بعدی اثر می‌گذارند.

Skills در میانه session در دو حالت refresh می‌شود:

- watcher مهارت‌ها یک تغییر `SKILL.md` را شناسایی کند.
- یک node راه‌دور واجد شرایط جدید متصل شود.

فهرست refreshشده در turn بعدی agent استفاده می‌شود. اگر allowlist موثر agent
تغییر کند، OpenClaw برای هم‌تراز نگه داشتن مهارت‌های قابل مشاهده،
snapshot را refresh می‌کند.

<AccordionGroup>
  <Accordion title="Watcher مهارت‌ها">
    به‌صورت پیش‌فرض، OpenClaw پوشه‌های مهارت را watch می‌کند و وقتی فایل‌های
    `SKILL.md` تغییر کنند، snapshot را bump می‌کند. زیر `skills.load` پیکربندی کنید:

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

    از `allowSymlinkTargets` برای چیدمان‌های symlinkشده عمدی استفاده کنید که در آن root
    یک مهارت به خارج از root پیکربندی‌شده اشاره می‌کند، برای مثال
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    `skills.workshop.allowSymlinkTargetWrites` را فقط وقتی فعال کنید که Skill Workshop
    باید پیشنهادها را از طریق همان مسیرهای symlinkشده قابل اعتماد نیز اعمال کند.

  </Accordion>
  <Accordion title="nodeهای macOS راه‌دور (Gateway لینوکسی)">
    اگر Gateway روی Linux اجرا شود اما یک **node macOS** با
    مجوز `system.run` متصل باشد، OpenClaw می‌تواند مهارت‌های فقط macOS را واجد شرایط بداند، وقتی
    باینری‌های لازم روی آن node موجود باشند. agent باید آن
    مهارت‌ها را از طریق ابزار `exec` با `host=node` اجرا کند.

    nodeهای offline مهارت‌های فقط راه‌دور را قابل مشاهده نمی‌کنند. اگر یک node پاسخ دادن
    به probeهای bin را متوقف کند، OpenClaw matchهای bin کش‌شده آن را پاک می‌کند.

  </Accordion>
</AccordionGroup>

## اثر توکن

وقتی مهارت‌ها واجد شرایط باشند، OpenClaw یک بلوک XML فشرده را داخل system
prompt تزریق می‌کند. هزینه قطعی است:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **سربار پایه** (فقط وقتی ≥ 1 مهارت وجود داشته باشد): حدود 195 کاراکتر
- **برای هر مهارت:** حدود 97 کاراکتر + طول فیلدهای `name`، `description` و `location` شما
- XML escaping، `& < > " '` را به entity تبدیل می‌کند و به‌ازای هر رخداد چند کاراکتر اضافه می‌کند
- با حدود 4 کاراکتر/توکن، 97 کاراکتر ≈ 24 توکن برای هر مهارت پیش از طول فیلدها

برای کمینه کردن سربار prompt، توضیحات را کوتاه و توصیفی نگه دارید.

## مرتبط

<CardGroup cols={2}>
  <Card title="ایجاد مهارت‌ها" href="/fa/tools/creating-skills" icon="hammer">
    راهنمای گام‌به‌گام برای نوشتن یک مهارت سفارشی.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای مهارت‌های draftشده توسط agent.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    schema کامل پیکربندی `skills.*` و allowlistهای agent.
  </Card>
  <Card title="دستورهای slash" href="/fa/tools/slash-commands" icon="terminal">
    نحوه ثبت و route شدن دستورهای slash مهارت.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    مهارت‌ها را در registry عمومی مرور و منتشر کنید.
  </Card>
  <Card title="Pluginها" href="/fa/tools/plugin" icon="plug">
    Pluginها می‌توانند مهارت‌ها را همراه ابزارهایی که مستند می‌کنند ارسال کنند.
  </Card>
</CardGroup>
