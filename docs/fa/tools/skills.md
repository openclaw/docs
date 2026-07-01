---
read_when:
    - افزودن یا تغییر Skills
    - تغییر در مهار Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک اولویت مهارت و رفتار Snapshot
sidebarTitle: Skills
summary: Skills به عامل شما می‌آموزد چگونه از ابزارها استفاده کند. یاد بگیرید چگونه بارگذاری می‌شوند، تقدم چگونه کار می‌کند، و چگونه کنترل دسترسی، فهرست‌های مجاز، و تزریق محیط را پیکربندی کنید.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:34:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills فایل‌های دستورالعمل markdown هستند که به agent یاد می‌دهند چگونه و چه زمانی از
ابزارها استفاده کند. هر مهارت در یک دایرکتوری قرار دارد که شامل فایل `SKILL.md` با
frontmatter از نوع YAML و بدنه markdown است. OpenClaw مهارت‌های همراه و هر
بازنویسی محلی را بارگذاری می‌کند، و آن‌ها را هنگام بارگذاری بر اساس محیط، پیکربندی، و
وجود binary فیلتر می‌کند.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fa/tools/creating-skills" icon="hammer">
    یک مهارت سفارشی را از ابتدا بسازید و آزمایش کنید.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    پیشنهادهای مهارت تهیه‌شده توسط agent را بازبینی و تأیید کنید.
  </Card>
  <Card title="Skills config" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*` و allowlistهای agent.
  </Card>
  <Card title="ClawHub" href="/fa/clawhub" icon="cloud">
    مهارت‌های جامعه را مرور و نصب کنید.
  </Card>
</CardGroup>

## ترتیب بارگذاری

OpenClaw از این منابع بارگذاری می‌کند، **ابتدا با بالاترین اولویت**. وقتی نام یکسانی برای
مهارت در چند جا ظاهر شود، منبع با اولویت بالاتر برنده است.

| اولویت | منبع | مسیر |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — بالاترین | مهارت‌های workspace | `<workspace>/skills` |
| 2 | مهارت‌های project agent | `<workspace>/.agents/skills` |
| 3 | مهارت‌های personal agent | `~/.agents/skills` |
| 4 | مهارت‌های مدیریت‌شده / محلی | `~/.openclaw/skills` |
| 5 | مهارت‌های همراه | همراه نصب ارائه می‌شود |
| 6 — پایین‌ترین | دایرکتوری‌های اضافی | `skills.load.extraDirs` + مهارت‌های Plugin |

ریشه‌های مهارت از چیدمان‌های گروه‌بندی‌شده پشتیبانی می‌کنند. OpenClaw هر زمان که
`SKILL.md` در هر جایی زیر یک ریشه پیکربندی‌شده ظاهر شود، یک مهارت را کشف می‌کند:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسیر پوشه فقط برای سازمان‌دهی است. نام مهارت، slash command، و کلید allowlist همگی
از فیلد frontmatter به نام `name` می‌آیند (یا وقتی `name` وجود ندارد، از نام دایرکتوری).

<Note>
  دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI ریشه مهارت OpenClaw
  **نیست**. از `openclaw migrate plan codex` برای فهرست‌برداری از آن مهارت‌ها استفاده کنید، سپس
  برای کپی کردن آن‌ها به workspace OpenClaw خود، `openclaw migrate codex` را اجرا کنید.
</Note>

## مهارت‌های مختص هر agent در برابر مهارت‌های مشترک

در راه‌اندازی‌های چند-agent، هر agent workspace خودش را دارد. از مسیری استفاده کنید که
با میزان دیدپذیری موردنظرتان هم‌خوان است:

| دامنه | مسیر | قابل مشاهده برای |
| -------------- | ---------------------------- | --------------------------- |
| مختص هر agent | `<workspace>/skills` | فقط همان agent |
| Project-agent | `<workspace>/.agents/skills` | فقط agent همان workspace |
| Personal-agent | `~/.agents/skills` | همه agentها روی این ماشین |
| مدیریت‌شده مشترک | `~/.openclaw/skills` | همه agentها روی این ماشین |
| دایرکتوری‌های اضافی | `skills.load.extraDirs` | همه agentها روی این ماشین |

## Allowlistهای agent

**مکان** مهارت (اولویت) و **دیدپذیری** مهارت (اینکه کدام agent می‌تواند از آن استفاده کند)
کنترل‌های جداگانه هستند. برای محدود کردن اینکه یک agent کدام مهارت‌ها را می‌بیند، فارغ از اینکه
از کجا بارگذاری شده‌اند، از allowlistها استفاده کنید.

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
    - برای اینکه همه مهارت‌ها به‌صورت پیش‌فرض نامحدود بمانند، `agents.defaults.skills` را حذف کنید.
    - برای به ارث بردن `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای اینکه هیچ مهارتی برای آن agent ارائه نشود، `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** است — با پیش‌فرض‌ها
      ادغام نمی‌شود.
    - allowlist مؤثر در ساخت prompt، کشف slash-command، همگام‌سازی sandbox، و
      snapshotهای مهارت اعمال می‌شود.
    - این یک مرز مجوزدهی shell میزبان نیست. اگر همان agent می‌تواند از `exec`
      استفاده کند، آن shell را جداگانه با sandboxing، جداسازی OS-user،
      deny/allowlistهای exec، و اعتبارنامه‌های مختص هر منبع محدود کنید.
  </Accordion>
</AccordionGroup>

## Pluginها و مهارت‌ها

Pluginها می‌توانند با فهرست کردن دایرکتوری‌های `skills` در
`openclaw.plugin.json` مهارت‌های خودشان را ارائه کنند (مسیرها نسبت به ریشه Plugin هستند). مهارت‌های Plugin
وقتی Plugin فعال باشد بارگذاری می‌شوند — برای نمونه، Plugin مرورگر یک مهارت
`browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های مهارت Plugin در همان سطح کم‌اولویت `skills.load.extraDirs` ادغام می‌شوند،
بنابراین یک مهارت همراه، مدیریت‌شده، agent، یا workspace با نام یکسان
آن‌ها را بازنویسی می‌کند. آن‌ها را از طریق `metadata.openclaw.requires.config` روی ورودی
پیکربندی Plugin gate کنید.

برای سامانه کامل Plugin، [Plugins](/fa/tools/plugin) و [Tools](/fa/tools) را ببینید.

## کارگاه مهارت

[Skill Workshop](/fa/tools/skill-workshop) یک صف پیشنهاد بین agent
و فایل‌های مهارت فعال شما است. وقتی agent کار قابل استفاده مجددی را تشخیص دهد، به‌جای نوشتن مستقیم در
`SKILL.md` یک پیشنهاد تهیه می‌کند. شما پیش از هر تغییری آن را بازبینی و تأیید می‌کنید.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه عمر کامل، مرجع CLI، و پیکربندی، [Skill Workshop](/fa/tools/skill-workshop) را ببینید.

## نصب از ClawHub

[ClawHub](https://clawhub.ai) رجیستری عمومی مهارت‌ها است. برای نصب و به‌روزرسانی از
دستورهای `openclaw skills` استفاده کنید، یا برای انتشار و همگام‌سازی از CLI
`clawhub` استفاده کنید.

| اقدام | دستور |
| ---------------------------------- | ------------------------------------------------------ |
| نصب یک مهارت در workspace | `openclaw skills install @owner/<slug>` |
| نصب از یک مخزن Git | `openclaw skills install git:owner/repo@ref` |
| نصب یک دایرکتوری مهارت محلی | `openclaw skills install ./path/to/skill --as my-tool` |
| نصب برای همه agentهای محلی | `openclaw skills install @owner/<slug> --global` |
| به‌روزرسانی همه مهارت‌های workspace | `openclaw skills update --all` |
| به‌روزرسانی یک مهارت مدیریت‌شده مشترک | `openclaw skills update @owner/<slug> --global` |
| به‌روزرسانی همه مهارت‌های مدیریت‌شده مشترک | `openclaw skills update --all --global` |
| راستی‌آزمایی trust envelope یک مهارت | `openclaw skills verify @owner/<slug>` |
| چاپ Skill Card تولیدشده | `openclaw skills verify @owner/<slug> --card` |
| انتشار / همگام‌سازی از طریق ClawHub CLI | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` به‌صورت پیش‌فرض در دایرکتوری `skills/`
    workspace فعال نصب می‌کند. برای نصب در دایرکتوری مشترک
    `~/.openclaw/skills` که برای همه agentهای محلی قابل مشاهده است، `--global` را اضافه کنید، مگر اینکه
    allowlistهای agent آن را محدود کنند.

    نصب‌های Git و محلی انتظار دارند `SKILL.md` در ریشه منبع باشد. slug وقتی معتبر باشد
    از frontmatter `name` در `SKILL.md` می‌آید، سپس به نام
    دایرکتوری یا مخزن برمی‌گردد. برای بازنویسی از `--as <slug>` استفاده کنید.
    `openclaw skills update` فقط نصب‌های ClawHub را رهگیری می‌کند — برای تازه‌سازی منابع Git یا
    محلی، آن‌ها را دوباره نصب کنید.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` از ClawHub برای trust envelope
    `clawhub.skill.verify.v1` مهارت درخواست می‌کند. مهارت‌های ClawHub نصب‌شده
    در برابر نسخه و رجیستری ثبت‌شده در `.clawhub/origin.json` راستی‌آزمایی می‌شوند.
    slugهای بدون owner همچنان برای مهارت‌های نصب‌شده موجود یا بدون ابهام پذیرفته می‌شوند، اما
    refهای دارای owner از ابهام ناشر جلوگیری می‌کنند.

    صفحه‌های مهارت ClawHub آخرین وضعیت اسکن امنیتی را پیش از نصب نمایش می‌دهند،
    همراه با صفحه‌های جزئیات برای VirusTotal، ClawScan، و تحلیل ایستا. وقتی
    ClawHub راستی‌آزمایی را ناموفق علامت‌گذاری کند، دستور با مقدار غیرصفر خارج می‌شود. ناشران
    false positiveها را از طریق داشبورد ClawHub یا
    `clawhub skill rescan @owner/<slug>` برطرف می‌کنند.

  </Accordion>
  <Accordion title="Private archive installs">
    کلاینت‌های Gateway که به تحویل غیر ClawHub نیاز دارند می‌توانند یک آرشیو zip مهارت را
    با `skills.upload.begin`، `skills.upload.chunk`، و `skills.upload.commit` آماده کنند،
    سپس با `skills.install({ source: "upload", ... })` نصب کنند. این مسیر به‌صورت
    پیش‌فرض غیرفعال است و به `skills.install.allowUploadedArchives: true` در
    `openclaw.json` نیاز دارد. نصب‌های معمول ClawHub هرگز به آن تنظیم نیاز ندارند.
  </Accordion>
</AccordionGroup>

## امنیت

<Warning>
  با مهارت‌های شخص ثالث به‌عنوان **کد غیرقابل اعتماد** برخورد کنید. پیش از فعال‌سازی آن‌ها را بخوانید.
  برای ورودی‌های غیرقابل اعتماد و ابزارهای پرریسک، اجراهای sandbox شده را ترجیح دهید. برای کنترل‌های سمت agent
  [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    کشف مهارت در workspace، project-agent، و extra-dir فقط ریشه‌های مهارتی را می‌پذیرد
    که realpath resolved آن‌ها داخل ریشه پیکربندی‌شده باقی بماند، مگر اینکه
    `skills.load.allowSymlinkTargets` به‌صراحت به یک ریشه هدف اعتماد کند.
    Skill Workshop فقط وقتی از طریق آن هدف‌های مورد اعتماد می‌نویسد که
    `skills.workshop.allowSymlinkTargetWrites` فعال باشد.
    مسیرهای مدیریت‌شده `~/.openclaw/skills` و شخصی `~/.agents/skills` ممکن است شامل
    پوشه‌های مهارت symlink شده باشند، اما realpath هر `SKILL.md` همچنان باید
    داخل دایرکتوری مهارت resolved خودش باقی بماند.
  </Accordion>
  <Accordion title="Operator install policy">
    `security.installPolicy` را پیکربندی کنید تا پیش از ادامه نصب مهارت‌ها یک دستور policy محلی مورد اعتماد
    اجرا شود. policy متادیتا و مسیر منبع stage شده را دریافت می‌کند، روی مسیرهای
    ClawHub، uploaded، Git، local، update، و dependency-installer اعمال می‌شود،
    و وقتی دستور نتواند یک تصمیم معتبر برگرداند، fail closed می‌شود.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` و `skills.entries.*.apiKey` رازها را فقط برای همان نوبت agent
    به فرایند **میزبان** تزریق می‌کنند — نه به sandbox. رازها را
    بیرون از promptها و logها نگه دارید.
  </Accordion>
</AccordionGroup>

برای مدل تهدید گسترده‌تر و checklistهای امنیتی، [Security](/fa/gateway/security) را ببینید.

## قالب SKILL.md

هر مهارت حداقل به یک `name` و `description` در frontmatter نیاز دارد:

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
  شیء JSON تک‌خطی باشد. برای ارجاع به مسیر پوشه مهارت در بدنه، از `{baseDir}` استفاده کنید.
</Note>

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در UI مربوط به macOS Skills به‌صورت "Website" نشان داده می‌شود. همچنین از طریق
  `metadata.openclaw.homepage` پشتیبانی می‌شود.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌عنوان یک slash command قابل فراخوانی توسط کاربر ارائه می‌شود.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های مهارت را از prompt معمول agent
  بیرون نگه می‌دارد. وقتی `user-invocable` نیز `true` باشد، مهارت همچنان به‌عنوان slash command
  در دسترس است.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، slash command مدل را دور می‌زند و
  مستقیماً به یک ابزار ثبت‌شده dispatch می‌شود.
</ParamField>

<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای ارسال ابزار، رشته خام آرگومان‌ها را بدون هیچ
  پردازش هسته‌ای به ابزار ارسال می‌کند. ابزار این را دریافت می‌کند:
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## کنترل دسترسی

OpenClaw هنگام بارگذاری، Skills را با استفاده از `metadata.openclaw` (JSON تک‌خطی
در frontmatter) فیلتر می‌کند. Skill بدون بلوک `metadata.openclaw` همیشه
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
  وقتی `true` باشد، همیشه Skill را شامل می‌کند و از همه دروازه‌های دیگر عبور می‌کند.
</ParamField>

<ParamField path="emoji" type="string">
  ایموجی اختیاری که در رابط کاربری macOS Skills نشان داده می‌شود.
</ParamField>

<ParamField path="homepage" type="string">
  URL اختیاری که در رابط کاربری macOS Skills با عنوان «وب‌سایت» نشان داده می‌شود.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  فیلتر پلتفرم. وقتی تنظیم شود، Skill فقط روی OSهای فهرست‌شده واجد شرایط است.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  هر باینری باید در `PATH` وجود داشته باشد.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  حداقل یک باینری باید در `PATH` وجود داشته باشد.
</ParamField>

<ParamField path="requires.env" type="string[]">
  هر متغیر env باید در فرایند وجود داشته باشد یا از طریق پیکربندی ارائه شود.
</ParamField>

<ParamField path="requires.config" type="string[]">
  هر مسیر `openclaw.json` باید truthy باشد.
</ParamField>

<ParamField path="primaryEnv" type="string">
  نام متغیر env مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مشخصات نصب‌کننده اختیاری که توسط رابط کاربری macOS Skills استفاده می‌شود (brew / node / go / uv / download).
</ParamField>

<Note>
  بلوک‌های قدیمی `metadata.clawdbot` همچنان زمانی پذیرفته می‌شوند که
  `metadata.openclaw` وجود نداشته باشد، بنابراین Skills نصب‌شده قدیمی دروازه‌های
  وابستگی و راهنمایی‌های نصب‌کننده خود را حفظ می‌کنند. Skills جدید باید از
  `metadata.openclaw` استفاده کنند.
</Note>

### مشخصات نصب‌کننده

مشخصات نصب‌کننده به رابط کاربری macOS Skills می‌گوید چگونه یک وابستگی را نصب کند:

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
  <Accordion title="Installer selection rules">
    - وقتی چند نصب‌کننده فهرست شده باشند، gateway یک گزینه ترجیحی را انتخاب می‌کند
      (brew وقتی در دسترس باشد، در غیر این صورت node).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید
      همه آرتیفکت‌های موجود را ببینید.
    - مشخصات می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` برای فیلتر بر اساس پلتفرم باشد.
    - نصب‌های Node از `skills.install.nodeManager` در `openclaw.json` پیروی می‌کنند
      (پیش‌فرض: npm؛ گزینه‌ها: npm / pnpm / yarn / bun). این فقط روی نصب
      Skill اثر می‌گذارد؛ runtime Gateway همچنان باید Node باشد.
    - ترجیح نصب‌کننده Gateway: Homebrew → uv → مدیر node پیکربندی‌شده →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw به‌صورت خودکار Homebrew را نصب نمی‌کند یا فرمول‌های brew
      را به فرمان‌های بسته سیستم ترجمه نمی‌کند. در کانتینرهای Linux بدون
      `brew`، نصب‌کننده‌های فقط brew پنهان می‌شوند؛ از یک ایمیج سفارشی استفاده کنید یا
      وابستگی را دستی نصب کنید.
    - **Go:** اگر `go` وجود نداشته باشد و `brew` در دسترس باشد، gateway ابتدا
      Go را از طریق Homebrew نصب می‌کند و `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **Download:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (پیش‌فرض: تشخیص خودکار هنگام شناسایی آرشیو)، `stripComponents`،
      `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` هنگام بارگذاری Skill روی **host** بررسی می‌شود. اگر یک agent
    در sandbox اجرا شود، باینری باید **داخل container** هم وجود داشته باشد.
    آن را از طریق `agents.defaults.sandbox.docker.setupCommand` یا یک ایمیج سفارشی
    نصب کنید. `setupCommand` یک‌بار پس از ایجاد container اجرا می‌شود و به
    خروجی شبکه، root FS قابل نوشتن، و کاربر root در sandbox نیاز دارد.
  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

Skills همراه یا مدیریت‌شده را زیر `skills.entries` در
`~/.openclaw/openclaw.json` فعال/غیرفعال و پیکربندی کنید:

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
  `false` حتی وقتی Skill همراه یا نصب‌شده باشد آن را غیرفعال می‌کند. Skill همراه `coding-agent`
  opt-in است — `skills.entries.coding-agent.enabled: true` را تنظیم کنید
  و مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا CLI پشتیبانی‌شده دیگری
  نصب و احراز هویت شده است.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای Skillsی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از یک رشته متن ساده یا یک شیء SecretRef پشتیبانی می‌کند.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای agent. فقط زمانی تزریق می‌شوند که
  متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="config" type="object">
  بسته اختیاری برای فیلدهای پیکربندی سفارشیِ مخصوص هر Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای Skills **همراه**. وقتی تنظیم شود، فقط Skills همراه
  موجود در فهرست واجد شرایط هستند. Skills مدیریت‌شده و workspace تحت تأثیر قرار نمی‌گیرند.
</ParamField>

<Note>
  کلیدهای پیکربندی به‌طور پیش‌فرض با **نام Skill** مطابقت دارند. اگر یک Skill
  `metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید. نام‌های
  دارای خط تیره را نقل‌قول کنید: JSON5 کلیدهای نقل‌قول‌شده را مجاز می‌داند.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw فهرست مؤثر Skills را برای agent resolve می‌کند و قواعد کنترل دسترسی،
    allowlistها و بازنویسی‌های پیکربندی را اعمال می‌کند.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` برای مدت اجرای
    run روی `process.env` اعمال می‌شوند.
  </Step>
  <Step title="Builds the system prompt">
    Skills واجد شرایط در یک بلوک XML فشرده کامپایل و داخل
    system prompt تزریق می‌شوند.
  </Step>
  <Step title="Restores the environment">
    پس از پایان run، محیط اصلی بازیابی می‌شود.
  </Step>
</Steps>

<Warning>
  تزریق env به اجرای agent روی **host** محدود است، نه sandbox. داخل یک
  sandbox، `env` و `apiKey` اثری ندارند. برای نحوه
  عبور دادن secrets به اجراهای sandboxed، به
  [پیکربندی Skills](/fa/tools/skills-config#sandboxed-skills-and-env-vars) مراجعه کنید.
</Warning>

برای backend همراه `claude-cli`، OpenClaw همان snapshot
Skills واجد شرایط را نیز به‌عنوان یک Plugin موقت Claude Code ایجاد می‌کند و آن را از طریق
`--plugin-dir` ارسال می‌کند. backendهای CLI دیگر فقط از کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و تازه‌سازی

OpenClaw Skills واجد شرایط را **هنگام شروع یک session** snapshot می‌کند و همان
فهرست را برای همه turnهای بعدی در session دوباره استفاده می‌کند. تغییرات Skills یا پیکربندی
در session جدید بعدی اعمال می‌شوند.

Skills در دو حالت در میانه session تازه‌سازی می‌شوند:

- watcher مربوط به Skills تغییر `SKILL.md` را تشخیص دهد.
- یک node ریموت واجد شرایط جدید وصل شود.

فهرست تازه‌شده در turn بعدی agent استفاده می‌شود. اگر allowlist مؤثر agent
تغییر کند، OpenClaw snapshot را تازه‌سازی می‌کند تا Skills قابل مشاهده
هم‌راستا بمانند.

<AccordionGroup>
  <Accordion title="Skills watcher">
    به‌طور پیش‌فرض، OpenClaw پوشه‌های Skill را watch می‌کند و وقتی
    فایل‌های `SKILL.md` تغییر کنند snapshot را افزایش می‌دهد. زیر `skills.load` پیکربندی کنید:

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

    برای چیدمان‌های symlinkشده عمدی که در آن یک symlink ریشه Skill
    به بیرون از ریشه پیکربندی‌شده اشاره می‌کند، از `allowSymlinkTargets` استفاده کنید، برای مثال
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    فقط زمانی `skills.workshop.allowSymlinkTargetWrites` را فعال کنید که Skill Workshop
    باید proposalها را از طریق همان مسیرهای symlinkشده مورد اعتماد نیز اعمال کند.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    اگر Gateway روی Linux اجرا شود اما یک **node macOS** با
    مجوز `system.run` وصل باشد، OpenClaw می‌تواند Skills فقط مخصوص macOS را زمانی واجد شرایط بداند
    که باینری‌های لازم روی آن node وجود داشته باشند. agent باید آن
    Skills را از طریق ابزار `exec` با `host=node` اجرا کند.

    nodeهای آفلاین Skills فقط ریموت را قابل مشاهده نمی‌کنند. اگر یک node پاسخ دادن
    به probeهای bin را متوقف کند، OpenClaw تطابق‌های bin کش‌شده آن را پاک می‌کند.

  </Accordion>
</AccordionGroup>

## اثر توکنی

وقتی Skills واجد شرایط باشند، OpenClaw یک بلوک XML فشرده را داخل system
prompt تزریق می‌کند. هزینه قطعی است:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **سربار پایه** (فقط وقتی ≥ 1 Skill): حدود 195 کاراکتر
- **به‌ازای هر Skill:** حدود 97 کاراکتر + طول فیلدهای `name`، `description` و `location`
- XML escaping، `& < > " '` را به entityها گسترش می‌دهد و به‌ازای هر رخداد چند کاراکتر اضافه می‌کند
- با حدود 4 کاراکتر/توکن، 97 کاراکتر پیش از طول فیلدها ≈ 24 توکن برای هر Skill است

برای کمینه کردن سربار prompt، توضیحات را کوتاه و توصیفی نگه دارید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fa/tools/creating-skills" icon="hammer">
    راهنمای گام‌به‌گام برای نویسندگی یک Skill سفارشی.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف proposal برای Skills پیش‌نویس‌شده توسط agent.
  </Card>
  <Card title="Skills config" href="/fa/tools/skills-config" icon="gear">
    schema کامل پیکربندی `skills.*` و allowlistهای agent.
  </Card>
  <Card title="Slash commands" href="/fa/tools/slash-commands" icon="terminal">
    اینکه slash commandهای Skill چگونه ثبت و route می‌شوند.
  </Card>
  <Card title="ClawHub" href="/fa/clawhub" icon="cloud">
    Skills را در registry عمومی مرور و منتشر کنید.
  </Card>
  <Card title="Plugins" href="/fa/tools/plugin" icon="plug">
    Plugins می‌توانند Skills را در کنار ابزارهایی که مستند می‌کنند عرضه کنند.
  </Card>
</CardGroup>
