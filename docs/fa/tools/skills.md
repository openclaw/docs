---
read_when:
    - افزودن یا ویرایش Skills
    - تغییر گیتینگ Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک تقدم Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر فضای کاری، قواعد کنترل عبور، فهرست‌های مجاز عامل، و اتصال پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:49:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های Skill **سازگار با [AgentSkills](https://agentskills.io)** برای آموزش نحوهٔ استفاده از ابزارها به عامل استفاده می‌کند. هر Skill یک دایرکتوری است که شامل یک `SKILL.md` با frontmatter YAML و دستورالعمل‌هاست. OpenClaw، Skills همراه بسته و overrideهای محلی اختیاری را بارگذاری می‌کند و آن‌ها را در زمان بارگذاری بر اساس محیط، پیکربندی، و وجود باینری فیلتر می‌کند.

## مکان‌ها و تقدم

OpenClaw Skills را از این منابع بارگذاری می‌کند، **ابتدا با بالاترین تقدم**:

| #   | منبع                 | مسیر                             |
| --- | -------------------- | -------------------------------- |
| 1   | Skills فضای کاری     | `<workspace>/skills`             |
| 2   | Skills عامل پروژه    | `<workspace>/.agents/skills`     |
| 3   | Skills عامل شخصی     | `~/.agents/skills`               |
| 4   | Skills مدیریت‌شده/محلی | `~/.openclaw/skills`             |
| 5   | Skills همراه بسته    | همراه نصب ارائه می‌شود           |
| 6   | پوشه‌های Skill اضافی | `skills.load.extraDirs` (پیکربندی) |

اگر نام یک Skill تداخل داشته باشد، منبع با بالاترین تقدم برنده می‌شود.

دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI یکی از ریشه‌های Skill در OpenClaw نیست. در حالت harness مربوط به Codex، راه‌اندازی‌های app-server محلی از خانه‌های Codex ایزوله و مختص هر عامل استفاده می‌کنند، بنابراین Skills شخصی Codex CLI به‌صورت ضمنی بارگذاری نمی‌شوند. از `openclaw migrate codex --dry-run` برای فهرست‌برداری از آن‌ها استفاده کنید و از `openclaw migrate codex` برای انتخاب دایرکتوری‌های Skill با یک اعلان checkbox تعاملی، پیش از کپی کردن آن‌ها به فضای کاری عامل فعلی OpenClaw استفاده کنید. برای اجراهای غیرتعاملی، `--skill <name>` را برای Skills دقیق موردنظر برای کپی، تکرار کنید.

## Skills مختص هر عامل در برابر Skills مشترک

در تنظیمات **چندعاملی**، هر عامل فضای کاری خودش را دارد:

| دامنه                | مسیر                                        | قابل مشاهده برای              |
| -------------------- | ------------------------------------------- | ----------------------------- |
| مختص هر عامل         | `<workspace>/skills`                        | فقط همان عامل                 |
| عامل پروژه           | `<workspace>/.agents/skills`                | فقط عامل همان فضای کاری       |
| عامل شخصی            | `~/.agents/skills`                          | همهٔ عامل‌ها روی آن ماشین     |
| مشترک مدیریت‌شده/محلی | `~/.openclaw/skills`                        | همهٔ عامل‌ها روی آن ماشین     |
| دایرکتوری‌های اضافی مشترک | `skills.load.extraDirs` (پایین‌ترین تقدم) | همهٔ عامل‌ها روی آن ماشین     |

نام یکسان در چند مکان → منبع با بالاترین تقدم برنده می‌شود. فضای کاری بر عامل پروژه مقدم است، عامل پروژه بر عامل شخصی، عامل شخصی بر مدیریت‌شده/محلی، مدیریت‌شده/محلی بر همراه بسته، و همراه بسته بر دایرکتوری‌های اضافی مقدم است.

## فهرست‌های مجاز Skill برای عامل

**مکان** Skill و **قابلیت مشاهده** Skill کنترل‌های جداگانه‌ای هستند. مکان/تقدم تعیین می‌کند کدام نسخه از یک Skill هم‌نام برنده می‌شود؛ فهرست‌های مجاز عامل تعیین می‌کنند یک عامل واقعاً از کدام Skills می‌تواند استفاده کند.

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
  <Accordion title="قواعد فهرست مجاز">
    - برای Skills نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای ارث‌بری از `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای نداشتن هیچ Skill، مقدار `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعهٔ **نهایی** برای آن عامل است - با پیش‌فرض‌ها ادغام نمی‌شود.
    - فهرست مجاز مؤثر روی ساخت prompt، کشف slash-command مربوط به Skill، همگام‌سازی sandbox، و snapshotهای Skill اعمال می‌شود.

  </Accordion>
</AccordionGroup>

## Pluginها و Skills

Pluginها می‌توانند Skills خودشان را با فهرست کردن دایرکتوری‌های `skills` در `openclaw.plugin.json` ارائه کنند (مسیرها نسبت به ریشهٔ Plugin هستند). Skills مربوط به Plugin زمانی بارگذاری می‌شوند که Plugin فعال باشد. این مکان مناسب راهنماهای عملیاتی مختص ابزار است که برای توضیح ابزار بیش از حد طولانی هستند اما باید هر زمان Plugin نصب شده باشد در دسترس باشند - برای مثال، Plugin مرورگر یک Skill به نام `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های Skill مربوط به Plugin در همان مسیر با تقدم پایین مانند `skills.load.extraDirs` ادغام می‌شوند، بنابراین یک Skill هم‌نام همراه بسته، مدیریت‌شده، عامل، یا فضای کاری، آن‌ها را override می‌کند. می‌توانید آن‌ها را از طریق `metadata.openclaw.requires.config` روی ورودی پیکربندی Plugin محدود کنید.

برای کشف/پیکربندی، [Pluginها](/fa/tools/plugin) را ببینید و برای سطح ابزاری که این Skills آموزش می‌دهند، [ابزارها](/fa/tools) را ببینید.

## کارگاه Skill

Plugin اختیاری و آزمایشی **کارگاه Skill** می‌تواند از روی رویه‌های قابل استفادهٔ مجددی که در جریان کار عامل مشاهده شده‌اند، Skills فضای کاری را ایجاد یا به‌روزرسانی کند. این Plugin به‌صورت پیش‌فرض غیرفعال است و باید به‌صراحت از طریق `plugins.entries.skill-workshop` فعال شود.

کارگاه Skill فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را اسکن می‌کند، از تأیید در انتظار یا نوشتن‌های امن خودکار پشتیبانی می‌کند، پیشنهادهای ناامن را قرنطینه می‌کند، و پس از نوشتن‌های موفق، snapshot مربوط به Skill را تازه‌سازی می‌کند تا Skills جدید بدون راه‌اندازی مجدد Gateway در دسترس شوند.

از آن برای اصلاحاتی مانند _"دفعهٔ بعد، انتساب GIF را بررسی کن"_ یا workflowهای دشوار به‌دست‌آمده مانند چک‌لیست‌های QA رسانه استفاده کنید. با تأیید در انتظار شروع کنید؛ نوشتن‌های خودکار را فقط در فضاهای کاری مورد اعتماد و پس از بررسی پیشنهادهای آن استفاده کنید. راهنمای کامل: [Plugin کارگاه Skill](/fa/plugins/skill-workshop).

## ClawHub (نصب و همگام‌سازی)

[ClawHub](https://clawhub.ai) رجیستری عمومی Skills برای OpenClaw است. برای کشف/نصب/به‌روزرسانی از فرمان‌های بومی `openclaw skills` استفاده کنید، یا برای workflowهای انتشار/همگام‌سازی از CLI جداگانهٔ `clawhub` استفاده کنید. راهنمای کامل: [ClawHub](/fa/tools/clawhub).

| اقدام                              | فرمان                                  |
| ---------------------------------- | -------------------------------------- |
| نصب یک Skill در فضای کاری          | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همهٔ Skills نصب‌شده    | `openclaw skills update --all`         |
| همگام‌سازی (اسکن + انتشار به‌روزرسانی‌ها) | `clawhub sync --all`                   |

`openclaw skills install` بومی، در دایرکتوری `skills/` فضای کاری فعال نصب می‌کند. CLI جداگانهٔ `clawhub` نیز در `./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند (یا به فضای کاری پیکربندی‌شدهٔ OpenClaw fallback می‌کند). OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` تشخیص می‌دهد. ریشه‌های Skill پیکربندی‌شده از یک سطح گروه‌بندی نیز پشتیبانی می‌کنند، مانند `skills/<group>/<skill>/SKILL.md`، تا Skills شخص ثالث مرتبط بتوانند بدون اسکن بازگشتی گسترده زیر یک پوشهٔ مشترک نگهداری شوند.

صفحه‌های Skill در ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را نمایش می‌دهند، همراه با صفحه‌های جزئیات اسکنر برای VirusTotal، ClawScan، و تحلیل ایستا. `openclaw skills install <slug>` همچنان فقط مسیر نصب است؛ ناشران false positiveها را از طریق داشبورد ClawHub یا `clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
Skills شخص ثالث را به‌عنوان **کد غیرقابل اعتماد** در نظر بگیرید. پیش از فعال‌سازی، آن‌ها را بخوانید. برای ورودی‌های غیرقابل اعتماد و ابزارهای پرریسک، اجراهای sandboxشده را ترجیح دهید. برای کنترل‌های سمت عامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

- کشف Skill در فضای کاری و دایرکتوری‌های اضافی فقط ریشه‌های Skill و فایل‌های `SKILL.md` را می‌پذیرد که realpath حل‌شدهٔ آن‌ها داخل ریشهٔ پیکربندی‌شده باقی بماند.
- نصب‌های وابستگی Skill با پشتیبانی Gateway (`skills.install`، onboarding، و UI تنظیمات Skills) پیش از اجرای metadata نصب‌کننده، اسکنر داخلی کد خطرناک را اجرا می‌کنند. یافته‌های `critical` به‌صورت پیش‌فرض مسدود می‌شوند مگر اینکه فراخواننده صراحتاً override خطرناک را تنظیم کند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است - این فرمان یک پوشهٔ Skill از ClawHub را در فضای کاری دانلود می‌کند و از مسیر metadata نصب‌کنندهٔ بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` اسرار را برای آن نوبت عامل به فرایند **host** تزریق می‌کنند (نه sandbox). اسرار را از promptها و logها دور نگه دارید.

برای مدل تهدید و چک‌لیست‌های گسترده‌تر، [امنیت](/fa/gateway/security) را ببینید.

## قالب SKILL.md

`SKILL.md` حداقل باید شامل این موارد باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای چیدمان/نیت از مشخصات AgentSkills پیروی می‌کند. Parser استفاده‌شده توسط عامل embedded فقط از کلیدهای frontmatter **تک‌خطی** پشتیبانی می‌کند؛ `metadata` باید یک **شیء JSON تک‌خطی** باشد. از `{baseDir}` در دستورالعمل‌ها برای ارجاع به مسیر پوشهٔ Skill استفاده کنید.

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در UI مربوط به Skills در macOS به‌عنوان "وب‌سایت" نمایش داده می‌شود. از طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، Skill به‌عنوان یک slash command کاربری در معرض استفاده قرار می‌گیرد.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های Skill را از prompt معمول عامل بیرون نگه می‌دارد. Skill همچنان نصب است و وقتی `user-invocable` نیز `true` باشد، همچنان می‌تواند به‌صراحت به‌عنوان یک slash command اجرا شود.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، slash command مدل را دور می‌زند و مستقیماً به یک ابزار dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشتهٔ args خام را به ابزار forward می‌کند (بدون parsing هسته). ابزار با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` فراخوانی می‌شود.
</ParamField>

## محدودسازی (فیلترهای زمان بارگذاری)

OpenClaw در زمان بارگذاری با استفاده از `metadata` (JSON تک‌خطی) Skills را فیلتر می‌کند:

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
  وقتی `true` باشد، همیشه Skill را شامل می‌شود (سایر gateها را رد می‌کند).
</ParamField>
<ParamField path="emoji" type="string">
  emoji اختیاری که UI مربوط به Skills در macOS استفاده می‌کند.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در UI مربوط به Skills در macOS به‌عنوان "وب‌سایت" نمایش داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  فهرست اختیاری platformها. اگر تنظیم شود، Skill فقط روی همان OSها واجد شرایط است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هرکدام باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  حداقل یکی باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  متغیر محیطی باید وجود داشته باشد یا در پیکربندی ارائه شود.
</ParamField>
<ParamField path="requires.config" type="string[]">
  فهرست مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام متغیر محیطی مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مشخصات نصب‌کنندهٔ اختیاری که UI مربوط به Skills در macOS استفاده می‌کند (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، Skill همیشه واجد شرایط است (مگر اینکه در پیکربندی غیرفعال شده باشد یا برای Skills همراه بسته توسط `skills.allowBundled` مسدود شده باشد).

<Note>
بلوک‌های قدیمی `metadata.clawdbot` همچنان وقتی `metadata.openclaw` غایب باشد پذیرفته می‌شوند، بنابراین Skills نصب‌شدهٔ قدیمی gateهای وابستگی و hintهای نصب‌کنندهٔ خود را حفظ می‌کنند. Skills جدید و به‌روزرسانی‌شده باید از `metadata.openclaw` استفاده کنند.
</Note>

### یادداشت‌های Sandboxing

- `requires.bins` در زمان بارگذاری Skill روی **host** بررسی می‌شود.
- اگر یک عامل sandboxشده باشد، باینری باید **داخل کانتینر** نیز وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک image سفارشی) نصب کنید. `setupCommand` یک‌بار پس از ایجاد کانتینر اجرا می‌شود. نصب‌های package همچنین به خروجی شبکه، root FS قابل نوشتن، و کاربر root در sandbox نیاز دارند.
- مثال: Skill به نام `summarize` (`skills/summarize/SKILL.md`) برای اجرا در آنجا به CLI `summarize` داخل کانتینر sandbox نیاز دارد.

### مشخصات نصب‌کننده

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
    - اگر چند نصب‌کننده فهرست شده باشد، Gateway یک گزینه ترجیحی واحد را انتخاب می‌کند (`brew` وقتی در دسترس باشد، در غیر این صورت `node`).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید آرتیفکت‌های موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها بر اساس پلتفرم فیلتر شوند.
    - نصب‌های Node مقدار `skills.install.nodeManager` را در `openclaw.json` رعایت می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط بر نصب Skills اثر می‌گذارد؛ زمان اجرای Gateway همچنان باید Node باشد - Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کننده پشتیبانی‌شده با Gateway بر اساس ترجیح انجام می‌شود: وقتی مشخصات نصب انواع مختلف را ترکیب می‌کند، OpenClaw در صورت فعال بودن `skills.install.preferBrew` و وجود `brew`، Homebrew را ترجیح می‌دهد، سپس `uv`، سپس مدیر Node پیکربندی‌شده، و بعد گزینه‌های جایگزین دیگر مانند `go` یا `download`.
    - اگر همه مشخصات نصب `download` باشند، OpenClaw به‌جای خلاصه کردن به یک نصب‌کننده ترجیحی، همه گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **نصب‌های Go:** اگر `go` موجود نباشد و `brew` در دسترس باشد، Gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` متعلق به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: خودکار وقتی آرشیو تشخیص داده شود)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

Skills همراه و مدیریت‌شده را می‌توان در بخش `skills.entries` در `~/.openclaw/openclaw.json` فعال یا غیرفعال کرد و مقادیر env به آن‌ها داد:

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
  مقدار `false`، Skill را حتی اگر همراه یا نصب‌شده باشد غیرفعال می‌کند.
  Skill همراه `coding-agent` اختیاری است: قبل از نمایش آن به agentها،
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  میانبری برای Skills که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط وقتی متغیر از قبل در فرایند تنظیم نشده باشد تزریق می‌شود.
</ParamField>
<ParamField path="config" type="object">
  محفظه اختیاری برای فیلدهای سفارشی هر Skill. کلیدهای سفارشی باید اینجا قرار بگیرند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  فهرست مجاز اختیاری فقط برای Skills **همراه**. اگر تنظیم شود، فقط Skills همراه موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده/workspace تحت تأثیر قرار نمی‌گیرند).
</ParamField>

اگر نام Skill شامل خط تیره است، کلید را در کوتیشن بگذارید (JSON5 کلیدهای
کوتیشن‌دار را مجاز می‌داند). کلیدهای پیکربندی به‌صورت پیش‌فرض با **نام Skill**
مطابقت دارند - اگر یک Skill مقدار `metadata.openclaw.skillKey` را تعریف کند، همان کلید را زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر آماده درون OpenClaw، به‌جای Skill همراه، از ابزار اصلی
`image_generate` همراه با `agents.defaults.imageGenerationModel` استفاده کنید.
نمونه‌های Skill اینجا برای workflowهای سفارشی یا شخص ثالث هستند. برای تحلیل تصویر بومی از ابزار `image` همراه با
`agents.defaults.imageModel` استفاده کنید. اگر `openai/*`، `google/*`،
`fal/*`، یا مدل تصویر اختصاصی ارائه‌دهنده دیگری را انتخاب می‌کنید، کلید احراز هویت/API همان ارائه‌دهنده را نیز اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

1. فراداده Skill را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. اعلان سیستم را با Skills **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازمی‌گرداند.

تزریق محیط **محدود به اجرای agent** است، نه یک محیط shell سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot واجد شرایط را به‌صورت یک Plugin موقت Claude Code نیز ایجاد می‌کند و آن را با
`--plugin-dir` می‌فرستد. سپس Claude Code می‌تواند از resolver بومی Skill خودش استفاده کند، در حالی که
OpenClaw همچنان مالک اولویت، allowlistهای هر agent، gating، و تزریق env/کلید API مربوط به
`skills.entries.*` است. backendهای CLI دیگر فقط از catalog اعلان استفاده می‌کنند.

## Snapshotها و تازه‌سازی

OpenClaw در **شروع یک session** از Skills واجد شرایط snapshot می‌گیرد و
همان فهرست را برای نوبت‌های بعدی در همان session دوباره استفاده می‌کند. تغییرات در
Skills یا پیکربندی در session جدید بعدی اثر می‌گذارند.

Skills در دو حالت می‌توانند در میانه session تازه‌سازی شوند:

- watcher مربوط به Skills فعال باشد.
- یک Node راه‌دور واجد شرایط جدید ظاهر شود.

این را مانند **hot reload** در نظر بگیرید: فهرست تازه‌سازی‌شده در
نوبت بعدی agent استفاده می‌شود. اگر allowlist مؤثر Skill برای آن
session تغییر کند، OpenClaw snapshot را تازه‌سازی می‌کند تا Skills قابل مشاهده با agent فعلی همسو بمانند.

### watcher مربوط به Skills

به‌صورت پیش‌فرض، OpenClaw پوشه‌های Skill را پایش می‌کند و وقتی فایل‌های `SKILL.md` تغییر کنند، snapshot مربوط به Skills را افزایش می‌دهد. در `skills.load` پیکربندی کنید:

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

### Nodeهای macOS راه‌دور (Gateway لینوکس)

اگر Gateway روی لینوکس اجرا شود اما یک **Node macOS** با مجوز
`system.run` متصل باشد (امنیت تأییدیه‌های Exec روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند Skills فقط macOS را وقتی باینری‌های لازم روی آن Node وجود دارند واجد شرایط بداند. agent باید آن Skills را
از طریق ابزار `exec` با `host=node` اجرا کند.

این به گزارش پشتیبانی دستور توسط Node و به یک probe باینری
از طریق `system.which` یا `system.run` متکی است. Nodeهای آفلاین، Skills فقط راه‌دور را قابل مشاهده نمی‌کنند. اگر یک Node متصل پاسخ‌دادن به probeهای باینری را متوقف کند، OpenClaw تطبیق‌های باینری cache‌شده آن را پاک می‌کند تا agentها دیگر Skillsای را نبینند
که در حال حاضر نمی‌توانند آنجا اجرا شوند.

## اثر روی token

وقتی Skills واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از Skills موجود را
به اعلان سیستم تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه قطعی است:

- **سربار پایه** (فقط وقتی ≥1 Skill وجود دارد): 195 نویسه.
- **برای هر Skill:** 97 نویسه + طول مقادیر XML-escaped شده `<name>`، `<description>`، و `<location>`.

فرمول (نویسه‌ها):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping نویسه‌های `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره) گسترش می‌دهد و
طول را افزایش می‌دهد. شمار tokenها بر اساس tokenizer مدل متفاوت است. یک برآورد تقریبی
به سبک OpenAI حدود ~4 نویسه/token است، بنابراین **97 نویسه ≈ 24 token** برای هر
Skill به‌علاوه طول واقعی فیلدهای شما.

## چرخه عمر Skills مدیریت‌شده

OpenClaw یک مجموعه پایه از Skills را به‌صورت **Skills همراه** با نصب
(بسته npm یا OpenClaw.app) ارائه می‌کند. `~/.openclaw/skills` برای
بازنویسی‌های محلی وجود دارد - برای مثال، pin یا patch کردن یک Skill بدون
تغییر دادن نسخه همراه. Skills مربوط به workspace متعلق به کاربر هستند و در
تداخل نام، هر دو را بازنویسی می‌کنند.

## دنبال Skills بیشتری هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/tools/clawhub) - registry عمومی Skills
- [ایجاد Skills](/fa/tools/creating-skills) - ساخت Skills سفارشی
- [Pluginها](/fa/tools/plugin) - نمای کلی سیستم Plugin
- [Plugin کارگاه Skill](/fa/plugins/skill-workshop) - تولید Skills از کار agent
- [پیکربندی Skills](/fa/tools/skills-config) - مرجع پیکربندی Skill
- [دستورهای slash](/fa/tools/slash-commands) - همه دستورهای slash موجود
