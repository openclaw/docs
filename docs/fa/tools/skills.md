---
read_when:
    - افزودن یا ویرایش Skills
    - تغییر در شرط‌گذاری Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک اولویت‌بندی Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر فضای کاری، قوانین کنترل عبور، فهرست‌های مجاز عامل، و اتصال پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های مهارت **سازگار با [AgentSkills](https://agentskills.io)** استفاده می‌کند
تا به عامل بیاموزد چگونه از ابزارها استفاده کند. هر مهارت یک دایرکتوری است
که شامل یک `SKILL.md` با frontmatter به زبان YAML و دستورالعمل‌هاست. OpenClaw
مهارت‌های همراه بسته و همچنین بازنویسی‌های محلی اختیاری را بارگذاری می‌کند و آن‌ها را در زمان
بارگذاری بر اساس محیط، پیکربندی و وجود binary فیلتر می‌کند.

## مکان‌ها و اولویت

OpenClaw مهارت‌ها را از این منابع بارگذاری می‌کند، **بالاترین اولویت در ابتدا**:

| #   | منبع                  | مسیر                             |
| --- | --------------------- | -------------------------------- |
| 1   | مهارت‌های workspace   | `<workspace>/skills`             |
| 2   | مهارت‌های عامل پروژه  | `<workspace>/.agents/skills`     |
| 3   | مهارت‌های عامل شخصی   | `~/.agents/skills`               |
| 4   | مهارت‌های مدیریت‌شده/محلی | `~/.openclaw/skills`             |
| 5   | مهارت‌های همراه بسته  | همراه نصب ارائه می‌شود           |
| 6   | پوشه‌های مهارت اضافی  | `skills.load.extraDirs` (config) |

اگر نام مهارتی تداخل داشته باشد، منبع با بالاترین اولویت برنده می‌شود.

## مهارت‌های اختصاصی هر عامل در برابر مهارت‌های مشترک

در راه‌اندازی‌های **چندعاملی**، هر عامل workspace خودش را دارد:

| دامنه                | مسیر                                        | قابل مشاهده برای              |
| -------------------- | ------------------------------------------- | ----------------------------- |
| اختصاصی هر عامل      | `<workspace>/skills`                        | فقط همان عامل                 |
| عامل پروژه           | `<workspace>/.agents/skills`                | فقط عامل همان workspace       |
| عامل شخصی            | `~/.agents/skills`                          | همه عامل‌ها روی همان ماشین    |
| مشترک مدیریت‌شده/محلی | `~/.openclaw/skills`                        | همه عامل‌ها روی همان ماشین    |
| دایرکتوری‌های اضافی مشترک | `skills.load.extraDirs` (کمترین اولویت) | همه عامل‌ها روی همان ماشین    |

نام یکسان در چند مکان → منبع با بالاترین اولویت برنده می‌شود. Workspace بر
عامل پروژه، عامل شخصی، مدیریت‌شده/محلی، همراه بسته،
و دایرکتوری‌های اضافی غلبه می‌کند.

## allowlistهای مهارت عامل

**مکان** مهارت و **قابلیت مشاهده** مهارت کنترل‌های جداگانه‌اند.
مکان/اولویت تعیین می‌کند کدام نسخه از یک مهارت هم‌نام برنده می‌شود؛
allowlistهای عامل تعیین می‌کنند عامل واقعا از کدام مهارت‌ها می‌تواند استفاده کند.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="قواعد allowlist">
    - `agents.defaults.skills` را حذف کنید تا مهارت‌ها به‌طور پیش‌فرض نامحدود باشند.
    - `agents.list[].skills` را حذف کنید تا `agents.defaults.skills` به ارث برسد.
    - `agents.list[].skills: []` را تنظیم کنید تا هیچ مهارتی وجود نداشته باشد.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** برای آن
      عامل است — با پیش‌فرض‌ها ادغام نمی‌شود.
    - allowlist موثر در ساخت prompt، کشف slash-command مهارت،
      همگام‌سازی sandbox و snapshotهای مهارت اعمال می‌شود.
  </Accordion>
</AccordionGroup>

## Pluginها و مهارت‌ها

Pluginها می‌توانند مهارت‌های خودشان را با فهرست کردن دایرکتوری‌های `skills` در
`openclaw.plugin.json` ارائه کنند (مسیرها نسبت به ریشه Plugin هستند). مهارت‌های Plugin
وقتی Plugin فعال باشد بارگذاری می‌شوند. این مکان مناسب راهنماهای عملیاتی
مختص ابزار است که برای توضیح ابزار بیش از حد طولانی‌اند اما باید
هر زمان Plugin نصب است در دسترس باشند — برای مثال، Plugin مرورگر
یک مهارت `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های مهارت Plugin در همان مسیر کم‌اولویت
`skills.load.extraDirs` ادغام می‌شوند، بنابراین یک مهارت هم‌نام همراه بسته، مدیریت‌شده، عامل یا
workspace آن‌ها را بازنویسی می‌کند. می‌توانید آن‌ها را از طریق
`metadata.openclaw.requires.config` روی ورودی پیکربندی Plugin محدود کنید.

برای کشف/پیکربندی، [Pluginها](/fa/tools/plugin) و برای سطح ابزارهایی که این مهارت‌ها آموزش می‌دهند
[ابزارها](/fa/tools) را ببینید.

## کارگاه مهارت

Plugin اختیاری و آزمایشی **کارگاه مهارت** می‌تواند از روی رویه‌های قابل استفاده مجدد
که در طول کار عامل مشاهده شده‌اند، مهارت‌های workspace را ایجاد یا به‌روزرسانی کند. این Plugin
به‌طور پیش‌فرض غیرفعال است و باید به‌صورت صریح از طریق
`plugins.entries.skill-workshop` فعال شود.

کارگاه مهارت فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را اسکن می‌کند،
از تایید در انتظار یا نوشتن ایمن خودکار پشتیبانی می‌کند، پیشنهادهای
ناامن را قرنطینه می‌کند و پس از نوشتن‌های موفق، snapshot مهارت را تازه‌سازی می‌کند
تا مهارت‌های جدید بدون راه‌اندازی دوباره Gateway در دسترس شوند.

از آن برای اصلاحاتی مانند _"دفعه بعد، انتساب GIF را بررسی کن"_ یا
گردش‌کارهای دشوار به‌دست‌آمده مانند چک‌لیست‌های QA رسانه استفاده کنید. با تایید در انتظار
شروع کنید؛ نوشتن خودکار را فقط در workspaceهای مورد اعتماد پس از بررسی
پیشنهادهایش استفاده کنید. راهنمای کامل: [Plugin کارگاه مهارت](/fa/plugins/skill-workshop).

## ClawHub (نصب و همگام‌سازی)

[ClawHub](https://clawhub.ai) registry عمومی مهارت‌ها برای OpenClaw است.
از دستورهای بومی `openclaw skills` برای کشف/نصب/به‌روزرسانی، یا از
CLI جداگانه `clawhub` برای گردش‌کارهای انتشار/همگام‌سازی استفاده کنید. راهنمای کامل:
[ClawHub](/fa/tools/clawhub).

| اقدام                              | دستور                                 |
| ---------------------------------- | -------------------------------------- |
| نصب یک مهارت در workspace          | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همه مهارت‌های نصب‌شده | `openclaw skills update --all`         |
| همگام‌سازی (اسکن + انتشار به‌روزرسانی‌ها) | `clawhub sync --all`                   |

`openclaw skills install` بومی، مهارت را در دایرکتوری فعال workspace
یعنی `skills/` نصب می‌کند. CLI جداگانه `clawhub` نیز در
`./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند (یا به
workspace پیکربندی‌شده OpenClaw برمی‌گردد). OpenClaw در نشست بعدی آن را به‌عنوان
`<workspace>/skills` برمی‌دارد.
ریشه‌های مهارت پیکربندی‌شده همچنین از یک سطح گروه‌بندی، مانند
`skills/<group>/<skill>/SKILL.md`، پشتیبانی می‌کنند تا مهارت‌های شخص ثالث مرتبط بتوانند
بدون اسکن بازگشتی گسترده زیر یک پوشه مشترک نگه داشته شوند.

صفحه‌های مهارت ClawHub، آخرین وضعیت اسکن امنیتی را پیش از نصب نمایش می‌دهند،
همراه با صفحه‌های جزئیات اسکنر برای VirusTotal، ClawScan و تحلیل ایستا.
`openclaw skills install <slug>` همچنان فقط مسیر نصب است؛ ناشران
positiveهای کاذب را از طریق داشبورد ClawHub یا
`clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
مهارت‌های شخص ثالث را **کد نامطمئن** در نظر بگیرید. پیش از فعال‌سازی آن‌ها را بخوانید.
برای ورودی‌های نامطمئن و ابزارهای پرریسک، اجرای sandboxشده را ترجیح دهید. برای کنترل‌های سمت عامل،
[Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

- کشف مهارت در workspace و extra-dir فقط ریشه‌های مهارت و فایل‌های `SKILL.md` را می‌پذیرد که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند.
- نصب وابستگی مهارت با پشتوانه Gateway (`skills.install`، onboarding، و UI تنظیمات Skills) پیش از اجرای metadata نصب‌کننده، اسکنر داخلی کد خطرناک را اجرا می‌کند. یافته‌های `critical` به‌طور پیش‌فرض مسدود می‌شوند مگر اینکه فراخوان به‌صورت صریح override خطرناک را تنظیم کند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است — یک پوشه مهارت ClawHub را در workspace دانلود می‌کند و از مسیر metadata نصب‌کننده بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` secretها را برای همان نوبت عامل به فرایند **host** تزریق می‌کنند (نه sandbox). secretها را از promptها و logها دور نگه دارید.

برای مدل تهدید گسترده‌تر و چک‌لیست‌ها، [امنیت](/fa/gateway/security) را ببینید.

## قالب SKILL.md

`SKILL.md` باید حداقل شامل موارد زیر باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای layout/intent از مشخصات AgentSkills پیروی می‌کند. parser استفاده‌شده
توسط عامل embedded فقط از کلیدهای frontmatter **تک‌خطی** پشتیبانی می‌کند؛
`metadata` باید یک **شیء JSON تک‌خطی** باشد. در دستورالعمل‌ها از `{baseDir}` برای
ارجاع به مسیر پوشه مهارت استفاده کنید.

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در UI macOS Skills به‌عنوان "وب‌سایت" نمایش داده می‌شود. از طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌عنوان slash command کاربر نمایش داده می‌شود.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، مهارت از prompt مدل حذف می‌شود (همچنان از طریق فراخوانی کاربر در دسترس است).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، slash command مدل را دور می‌زند و مستقیما به یک ابزار dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشته args خام را به ابزار forward می‌کند (بدون parsing در core). ابزار با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` فراخوانی می‌شود.
</ParamField>

## محدودسازی (فیلترهای زمان بارگذاری)

OpenClaw مهارت‌ها را در زمان بارگذاری با استفاده از `metadata` (JSON تک‌خطی) فیلتر می‌کند:

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

فیلدهای زیر `metadata.openclaw`:

<ParamField path="always" type="boolean">
  وقتی `true` باشد، همیشه مهارت را وارد کن (gateهای دیگر را رد کن).
</ParamField>
<ParamField path="emoji" type="string">
  emoji اختیاری که UI macOS Skills استفاده می‌کند.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در UI macOS Skills به‌عنوان "وب‌سایت" نشان داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  فهرست اختیاری platformها. اگر تنظیم شود، مهارت فقط روی آن OSها واجد شرایط است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هر کدام باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  حداقل یکی باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  env var باید وجود داشته باشد یا در پیکربندی ارائه شده باشد.
</ParamField>
<ParamField path="requires.config" type="string[]">
  فهرستی از مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام env var مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  specهای اختیاری نصب‌کننده که UI macOS Skills استفاده می‌کند (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، مهارت همیشه واجد شرایط است (مگر اینکه
در پیکربندی غیرفعال شده باشد یا برای مهارت‌های همراه بسته توسط `skills.allowBundled` مسدود شود).

<Note>
بلوک‌های قدیمی `metadata.clawdbot` همچنان وقتی
`metadata.openclaw` وجود ندارد پذیرفته می‌شوند، بنابراین مهارت‌های نصب‌شده قدیمی
gateهای وابستگی و hintهای نصب‌کننده خود را نگه می‌دارند. مهارت‌های جدید و به‌روزرسانی‌شده باید از
`metadata.openclaw` استفاده کنند.
</Note>

### نکات sandboxing

- `requires.bins` در زمان بارگذاری مهارت روی **host** بررسی می‌شود.
- اگر یک عامل sandbox شده باشد، binary باید **داخل container** نیز وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک image سفارشی) نصب کنید. `setupCommand` یک بار پس از ایجاد container اجرا می‌شود. نصب packageها همچنین به network egress، root FS قابل نوشتن و user ریشه در sandbox نیاز دارد.
- مثال: مهارت `summarize` (`skills/summarize/SKILL.md`) برای اجرا در container sandbox به CLI `summarize` داخل آن نیاز دارد.

### specهای نصب‌کننده

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
    - اگر چند نصب‌کننده فهرست شده باشند، gateway یک گزینه ترجیحی واحد را انتخاب می‌کند (در صورت موجود بودن brew، در غیر این صورت node).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید artifactهای موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها بر اساس پلتفرم فیلتر شوند.
    - نصب‌های Node از `skills.install.nodeManager` در `openclaw.json` پیروی می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط بر نصب Skills اثر می‌گذارد؛ runtime Gateway همچنان باید Node باشد — Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کننده مبتنی بر Gateway بر اساس ترجیح انجام می‌شود: وقتی مشخصات نصب انواع مختلف را ترکیب می‌کنند، OpenClaw در صورت فعال بودن `skills.install.preferBrew` و وجود `brew`، Homebrew را ترجیح می‌دهد، سپس `uv`، سپس مدیر node پیکربندی‌شده، و بعد fallbackهای دیگر مانند `go` یا `download`.
    - اگر هر مشخصات نصب `download` باشد، OpenClaw به‌جای خلاصه کردن به یک نصب‌کننده ترجیحی، همه گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **نصب‌های Go:** اگر `go` موجود نباشد و `brew` در دسترس باشد، gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: تشخیص خودکار وقتی archive شناسایی شود)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

Skills همراه و مدیریت‌شده را می‌توان فعال/غیرفعال کرد و مقدارهای env را
زیر `skills.entries` در `~/.openclaw/openclaw.json` به آن‌ها داد:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` این Skill را حتی اگر همراه یا نصب‌شده باشد غیرفعال می‌کند.
  Skill همراه `coding-agent` اختیاری است: پیش از در دسترس قرار دادن آن برای agentها،
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  میان‌بری برای Skills که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط در صورتی تزریق می‌شود که متغیر از قبل در process تنظیم نشده باشد.
</ParamField>
<ParamField path="config" type="object">
  محفظه‌ای اختیاری برای فیلدهای سفارشی مختص هر Skill. کلیدهای سفارشی باید اینجا قرار بگیرند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای Skills **همراه**. اگر تنظیم شود، فقط Skills همراه موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده/Workspace تحت تاثیر قرار نمی‌گیرند).
</ParamField>

اگر نام Skill شامل خط تیره باشد، کلید را نقل‌قول کنید (JSON5 کلیدهای
نقل‌قول‌شده را مجاز می‌داند). کلیدهای پیکربندی به‌طور پیش‌فرض با **نام Skill** مطابقت دارند — اگر یک Skill
`metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر آماده در OpenClaw، به‌جای یک Skill همراه، از ابزار اصلی
`image_generate` با `agents.defaults.imageGenerationModel` استفاده کنید.
نمونه‌های Skill در اینجا برای workflowهای سفارشی یا شخص ثالث هستند.
برای تحلیل تصویر بومی، از ابزار `image` با
`agents.defaults.imageModel` استفاده کنید. اگر `openai/*`، `google/*`،
`fal/*`، یا مدل تصویر مختص ارائه‌دهنده دیگری را انتخاب می‌کنید، کلید
احراز هویت/API همان ارائه‌دهنده را هم اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای agent شروع می‌شود، OpenClaw:

1. metadata Skill را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. system prompt را با Skills **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازیابی می‌کند.

تزریق محیط **به اجرای agent محدود است**، نه یک محیط shell
سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot واجد شرایط را
به‌صورت یک Plugin موقت Claude Code نیز materialize می‌کند و آن را با
`--plugin-dir` ارسال می‌کند. سپس Claude Code می‌تواند از skill resolver
بومی خود استفاده کند، در حالی که OpenClaw همچنان مالک precedence،
allowlistهای مختص هر agent، gating، و تزریق env/API key در
`skills.entries.*` است. سایر backendهای CLI فقط از کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و تازه‌سازی

OpenClaw هنگام شروع یک session، از Skills واجد شرایط **snapshot می‌گیرد** و
همان فهرست را برای turnهای بعدی در همان session دوباره استفاده می‌کند. تغییرات
Skills یا پیکربندی در session جدید بعدی اعمال می‌شوند.

Skills در دو حالت می‌توانند در میانه session تازه‌سازی شوند:

- watcher مربوط به Skills فعال باشد.
- یک node remote واجد شرایط جدید ظاهر شود.

این را مانند یک **hot reload** در نظر بگیرید: فهرست تازه‌سازی‌شده در
turn بعدی agent به‌کار گرفته می‌شود. اگر allowlist موثر Skillهای agent برای آن
session تغییر کند، OpenClaw snapshot را تازه‌سازی می‌کند تا Skills قابل مشاهده
با agent فعلی هم‌راستا بمانند.

### watcher مربوط به Skills

به‌طور پیش‌فرض، OpenClaw پوشه‌های Skill را watch می‌کند و وقتی فایل‌های
`SKILL.md` تغییر کنند، snapshot مربوط به Skills را افزایش می‌دهد. زیر `skills.load` پیکربندی کنید:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### nodeهای macOS remote (gateway لینوکسی)

اگر Gateway روی Linux اجرا شود اما یک **node macOS** با مجوز
`system.run` متصل باشد (امنیت تاییدهای Exec روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند Skills مختص macOS را زمانی واجد شرایط بداند که binaryهای لازم
روی آن node موجود باشند. agent باید این Skills را از طریق ابزار
`exec` با `host=node` اجرا کند.

این به گزارش پشتیبانی command توسط node و یک bin probe از طریق
`system.which` یا `system.run` متکی است. nodeهای آفلاین، Skills فقط-remote را
قابل مشاهده نمی‌کنند. اگر یک node متصل دیگر به bin probeها پاسخ ندهد،
OpenClaw matchهای bin cache‌شده آن را پاک می‌کند تا agentها دیگر Skills را که
در حال حاضر آنجا قابل اجرا نیستند نبینند.

## اثر روی token

وقتی Skills واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از Skills موجود
را در system prompt تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه deterministic است:

- **سربار پایه** (فقط وقتی ≥1 Skill وجود دارد): 195 کاراکتر.
- **برای هر Skill:** 97 کاراکتر + طول مقدارهای XML-escaped مربوط به `<name>`، `<description>`، و `<location>`.

فرمول (کاراکترها):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping نویسه‌های `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره)
گسترش می‌دهد و طول را افزایش می‌دهد. شمار tokenها بر اساس tokenizer مدل متفاوت است. یک برآورد تقریبی
به سبک OpenAI حدود ~4 کاراکتر/token است، بنابراین **97 کاراکتر ≈ 24 token** برای هر
Skill به‌علاوه طول واقعی فیلدهای شما.

## چرخه عمر Skills مدیریت‌شده

OpenClaw یک مجموعه پایه از Skills را به‌عنوان **Skills همراه** همراه با
نصب (package npm یا OpenClaw.app) ارائه می‌کند. `~/.openclaw/skills` برای
بازنویسی‌های local وجود دارد — برای مثال، pin کردن یا patch کردن یک Skill بدون
تغییر نسخه همراه. Skills مربوط به Workspace متعلق به کاربر هستند و در صورت
تداخل نام، هر دو را بازنویسی می‌کنند.

## به دنبال Skills بیشتری هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/tools/clawhub) — registry عمومی Skills
- [ساخت Skills](/fa/tools/creating-skills) — ساخت Skills سفارشی
- [Plugins](/fa/tools/plugin) — نمای کلی سیستم Plugin
- [Plugin کارگاه Skill](/fa/plugins/skill-workshop) — تولید Skills از کار agent
- [پیکربندی Skills](/fa/tools/skills-config) — مرجع پیکربندی Skill
- [دستورهای slash](/fa/tools/slash-commands) — همه دستورهای slash موجود
