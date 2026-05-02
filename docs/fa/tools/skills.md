---
read_when:
    - افزودن یا تغییر Skills
    - تغییر کنترل دسترسی مهارت‌ها، فهرست‌های مجاز، یا قواعد بارگذاری
    - آشنایی با تقدم Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر فضای کاری، قواعد گیت، فهرست‌های مجاز عامل، و اتصال‌دهی پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:01:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های skill **سازگار با [AgentSkills](https://agentskills.io)** استفاده می‌کند تا به agent یاد بدهد چگونه از ابزارها استفاده کند. هر skill یک directory است که شامل یک `SKILL.md` با frontmatter از نوع YAML و دستورالعمل‌ها است. OpenClaw skillهای همراه بسته و همچنین overrideهای محلی اختیاری را بارگذاری می‌کند و هنگام بارگذاری، آن‌ها را بر اساس محیط، config و وجود binary فیلتر می‌کند.

## مکان‌ها و تقدم

OpenClaw skillها را از این منابع بارگذاری می‌کند، **ابتدا با بالاترین تقدم**:

| #   | منبع                 | مسیر                             |
| --- | -------------------- | -------------------------------- |
| 1   | skillهای workspace   | `<workspace>/skills`             |
| 2   | skillهای project agent | `<workspace>/.agents/skills`   |
| 3   | skillهای personal agent | `~/.agents/skills`             |
| 4   | skillهای managed/local | `~/.openclaw/skills`           |
| 5   | skillهای bundled     | همراه install ارائه می‌شوند     |
| 6   | پوشه‌های skill اضافی | `skills.load.extraDirs` (config) |

اگر نام یک skill تداخل داشته باشد، منبع با بالاترین تقدم برنده می‌شود.

directory بومی `$CODEX_HOME/skills` در Codex CLI یکی از ریشه‌های skill در OpenClaw نیست. در حالت harness مربوط به Codex، اجرای app-server محلی از Codex homeهای ایزوله‌ی مختص هر agent استفاده می‌کند، بنابراین skillهای شخصی Codex CLI به‌صورت ضمنی بارگذاری نمی‌شوند. از `openclaw migrate codex --dry-run` برای فهرست‌برداری از آن‌ها و از `openclaw migrate codex` برای انتخاب directoryهای skill با یک prompt تعاملی checkbox، پیش از کپی کردن آن‌ها در workspace فعلی agent در OpenClaw استفاده کنید. برای اجراهای غیرتعاملی، برای skillهای دقیق مورد نظر جهت کپی، `--skill <name>` را تکرار کنید.

## skillهای per-agent در برابر skillهای shared

در setupهای **multi-agent** هر agent workspace خودش را دارد:

| دامنه                | مسیر                                        | قابل مشاهده برای            |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agent            | `<workspace>/skills`                        | فقط همان agent              |
| Project-agent        | `<workspace>/.agents/skills`                | فقط agent همان workspace    |
| Personal-agent       | `~/.agents/skills`                          | همه agentهای روی آن machine |
| Shared managed/local | `~/.openclaw/skills`                        | همه agentهای روی آن machine |
| Shared extra dirs    | `skills.load.extraDirs` (کمترین تقدم)       | همه agentهای روی آن machine |

نام یکسان در چند مکان → منبع با بالاترین تقدم برنده می‌شود. Workspace بر project-agent مقدم است، project-agent بر personal-agent، personal-agent بر managed/local، managed/local بر bundled، و bundled بر extra dirs مقدم است.

## allowlistهای skill برای agent

**مکان** skill و **visibility** skill کنترل‌های جداگانه‌اند. مکان/تقدم تعیین می‌کند کدام کپی از یک skill هم‌نام برنده می‌شود؛ allowlistهای agent تعیین می‌کنند یک agent واقعا از کدام skillها می‌تواند استفاده کند.

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
  <Accordion title="قوانین allowlist">
    - برای skillهای نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای ارث‌بری از `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای نداشتن هیچ skill، `agents.list[].skills: []` را تنظیم کنید.
    - یک list غیرخالی `agents.list[].skills` مجموعه **نهایی** برای آن agent است — با defaults ادغام نمی‌شود.
    - allowlist موثر در سراسر ساخت prompt، کشف slash-command مربوط به skill، sync sandbox و snapshotهای skill اعمال می‌شود.
  </Accordion>
</AccordionGroup>

## Pluginها و skillها

Pluginها می‌توانند skillهای خودشان را با فهرست کردن directoryهای `skills` در `openclaw.plugin.json` ارسال کنند (مسیرها نسبت به root مربوط به plugin هستند). skillهای Plugin وقتی plugin فعال باشد بارگذاری می‌شوند. این محل مناسب راهنماهای عملیاتی مختص ابزار است که برای description ابزار بیش از حد طولانی‌اند اما باید هر زمان plugin نصب است در دسترس باشند — برای مثال، plugin مرورگر یک skill به نام `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

directoryهای skill مربوط به Plugin در همان مسیر کم‌تقدم `skills.load.extraDirs` ادغام می‌شوند، بنابراین یک skill bundled، managed، agent یا workspace با همان نام آن‌ها را override می‌کند. می‌توانید آن‌ها را از طریق `metadata.openclaw.requires.config` در entry مربوط به config آن plugin gate کنید.

برای discovery/config به [Pluginها](/fa/tools/plugin) و برای سطح ابزارهایی که این skillها آموزش می‌دهند به [ابزارها](/fa/tools) مراجعه کنید.

## کارگاه Skill

Plugin اختیاری و آزمایشی **Skill Workshop** می‌تواند از روی procedureهای قابل استفاده مجدد که هنگام کار agent مشاهده شده‌اند، skillهای workspace ایجاد یا به‌روزرسانی کند. این plugin به‌صورت پیش‌فرض غیرفعال است و باید از طریق `plugins.entries.skill-workshop` به‌صراحت فعال شود.

Skill Workshop فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را scan می‌کند، از approval معلق یا نوشتن‌های امن خودکار پشتیبانی می‌کند، proposalهای ناامن را quarantine می‌کند، و پس از نوشتن‌های موفق snapshot مربوط به skill را refresh می‌کند تا skillهای جدید بدون restart کردن Gateway در دسترس شوند.

از آن برای correctionهایی مثل _"دفعه بعد، attribution مربوط به GIF را verify کن"_ یا workflowهایی که با تجربه به دست آمده‌اند، مثل checklistهای QA رسانه، استفاده کنید. با approval معلق شروع کنید؛ نوشتن‌های خودکار را فقط در workspaceهای مورد اعتماد و پس از review کردن proposalهای آن استفاده کنید. راهنمای کامل: [Plugin مربوط به Skill Workshop](/fa/plugins/skill-workshop).

## ClawHub (install و sync)

[ClawHub](https://clawhub.ai) registry عمومی skillها برای OpenClaw است. برای discover/install/update از commandهای بومی `openclaw skills` استفاده کنید، یا برای workflowهای publish/sync از CLI جداگانه‌ی `clawhub` استفاده کنید. راهنمای کامل: [ClawHub](/fa/tools/clawhub).

| اقدام                              | Command                                |
| ---------------------------------- | -------------------------------------- |
| نصب یک skill در workspace          | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همه skillهای نصب‌شده   | `openclaw skills update --all`         |
| Sync (scan + publish updates)      | `clawhub sync --all`                   |

`openclaw skills install` بومی در directory فعال `skills/` در workspace نصب می‌کند. CLI جداگانه‌ی `clawhub` نیز در `./skills` زیر directory کاری فعلی شما نصب می‌کند (یا به workspace پیکربندی‌شده‌ی OpenClaw fallback می‌کند). OpenClaw در session بعدی آن را به‌عنوان `<workspace>/skills` تشخیص می‌دهد.
ریشه‌های skill پیکربندی‌شده از یک سطح grouping نیز پشتیبانی می‌کنند، مثل `skills/<group>/<skill>/SKILL.md`، تا skillهای third-party مرتبط بتوانند بدون scan بازگشتی گسترده زیر یک پوشه shared نگهداری شوند.

صفحه‌های skill در ClawHub پیش از install، آخرین state مربوط به scan امنیتی را همراه با صفحه‌های جزئیات scanner برای VirusTotal، ClawScan و static analysis نشان می‌دهند. `openclaw skills install <slug>` همچنان فقط مسیر install است؛ ناشران false positiveها را از طریق dashboard مربوط به ClawHub یا `clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
skillهای third-party را **کد غیرقابل اعتماد** در نظر بگیرید. پیش از فعال‌سازی، آن‌ها را بخوانید. برای inputهای غیرقابل اعتماد و ابزارهای پرریسک، اجراهای sandboxed را ترجیح دهید. برای کنترل‌های سمت agent، [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

- کشف skill در workspace و extra-dir فقط ریشه‌های skill و فایل‌های `SKILL.md` را می‌پذیرد که realpath resolveشده‌ی آن‌ها داخل root پیکربندی‌شده باقی بماند.
- install وابستگی‌های skill با پشتوانه Gateway (`skills.install`، onboarding و UI تنظیمات Skills) پیش از اجرای metadata مربوط به installer، scanner داخلی dangerous-code را اجرا می‌کند. یافته‌های `critical` به‌صورت پیش‌فرض block می‌شوند مگر اینکه caller به‌صراحت dangerous override را تنظیم کند؛ یافته‌های suspicious همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است — یک پوشه skill از ClawHub را در workspace download می‌کند و از مسیر installer-metadata بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` secretها را برای آن turn مربوط به agent به process مربوط به **host** inject می‌کنند (نه sandbox). secretها را از promptها و logها دور نگه دارید.

برای threat model گسترده‌تر و checklistها، [امنیت](/fa/gateway/security) را ببینید.

## فرمت SKILL.md

`SKILL.md` باید حداقل شامل این موارد باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای layout/intent از spec مربوط به AgentSkills پیروی می‌کند. parser استفاده‌شده توسط agent تعبیه‌شده فقط از کلیدهای frontmatter **تک‌خطی** پشتیبانی می‌کند؛ `metadata` باید یک **object تک‌خطی JSON** باشد. برای reference دادن به مسیر پوشه skill در دستورالعمل‌ها از `{baseDir}` استفاده کنید.

### کلیدهای frontmatter اختیاری

<ParamField path="homepage" type="string">
  URL که در UI مربوط به Skills در macOS به‌عنوان "Website" نمایش داده می‌شود. همچنین از طریق `metadata.openclaw.homepage` پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، skill به‌عنوان slash command کاربر expose می‌شود.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های skill را از prompt عادی agent خارج نگه می‌دارد. skill همچنان نصب است و وقتی `user-invocable` نیز `true` باشد، همچنان می‌تواند به‌صراحت به‌عنوان یک slash command اجرا شود.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، slash command مدل را bypass می‌کند و مستقیم به یک tool dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام tool برای invoke وقتی `command-dispatch: tool` تنظیم شده است.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای tool dispatch، string خام args را به tool forward می‌کند (بدون parsing در core). tool با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` invoke می‌شود.
</ParamField>

## Gating (فیلترهای زمان بارگذاری)

OpenClaw هنگام بارگذاری، skillها را با استفاده از `metadata` (JSON تک‌خطی) فیلتر می‌کند:

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
  وقتی `true` باشد، همیشه skill را include کن (gateهای دیگر را skip کن).
</ParamField>
<ParamField path="emoji" type="string">
  emoji اختیاری که UI مربوط به Skills در macOS استفاده می‌کند.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در UI مربوط به Skills در macOS به‌عنوان "Website" نشان داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  list اختیاری از platformها. اگر تنظیم شود، skill فقط روی آن OSها eligible است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هرکدام باید در `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  حداقل یکی باید در `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  متغیر env باید وجود داشته باشد یا در config ارائه شده باشد.
</ParamField>
<ParamField path="requires.config" type="string[]">
  list مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام متغیر env مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  specهای اختیاری installer که UI مربوط به Skills در macOS استفاده می‌کند (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، skill همیشه eligible است (مگر اینکه در config غیرفعال شده باشد یا برای skillهای bundled توسط `skills.allowBundled` block شده باشد).

<Note>
blockهای legacy مربوط به `metadata.clawdbot` وقتی `metadata.openclaw` وجود نداشته باشد همچنان پذیرفته می‌شوند، بنابراین skillهای نصب‌شده قدیمی‌تر gateهای وابستگی و hintهای installer خود را حفظ می‌کنند. skillهای جدید و به‌روزرسانی‌شده باید از `metadata.openclaw` استفاده کنند.
</Note>

### نکات sandboxing

- `requires.bins` هنگام بارگذاری skill روی **host** بررسی می‌شود.
- اگر یک agent sandboxed باشد، binary باید **داخل container** نیز وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک image سفارشی) نصب کنید. `setupCommand` یک بار پس از ایجاد container اجرا می‌شود. نصب packageها همچنین به network egress، root FS قابل نوشتن و یک root user در sandbox نیاز دارد.
- مثال: skill مربوط به `summarize` (`skills/summarize/SKILL.md`) برای اجرا در sandbox container به CLI مربوط به `summarize` در sandbox نیاز دارد.

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
  <Accordion title="Installer selection rules">
    - اگر چند نصب‌کننده فهرست شده باشد، gateway یک گزینه ترجیحی واحد را انتخاب می‌کند (`brew` وقتی در دسترس باشد، وگرنه `node`).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید artifactهای موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها بر اساس پلتفرم فیلتر شوند.
    - نصب‌های Node مقدار `skills.install.nodeManager` را در `openclaw.json` رعایت می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط بر نصب Skills اثر می‌گذارد؛ زمان اجرای Gateway همچنان باید Node باشد — Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کننده با پشتیبانی Gateway ترجیح‌محور است: وقتی مشخصات نصب چند نوع را ترکیب می‌کند، OpenClaw وقتی `skills.install.preferBrew` فعال باشد و `brew` وجود داشته باشد Homebrew را ترجیح می‌دهد، سپس `uv`، سپس مدیر node پیکربندی‌شده، و بعد گزینه‌های جایگزین دیگر مانند `go` یا `download`.
    - اگر هر مشخصه نصب `download` باشد، OpenClaw به‌جای فشرده‌سازی به یک نصب‌کننده ترجیحی، همه گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="Per-installer details">
    - **نصب‌های Go:** اگر `go` وجود نداشته باشد و `brew` در دسترس باشد، gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: خودکار وقتی آرشیو تشخیص داده شود)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

Skills همراه و مدیریت‌شده را می‌توان روشن یا خاموش کرد و مقادیر env را
زیر `skills.entries` در `~/.openclaw/openclaw.json` برای آن‌ها فراهم کرد:

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
  `false` حتی اگر skill همراه باشد یا نصب شده باشد، آن را غیرفعال می‌کند.
  skill همراه `coding-agent` انتخابی است: پیش از در دسترس قرار دادن آن برای agentها،
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  میان‌بری برای Skillsهایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط اگر متغیر از قبل در فرایند تنظیم نشده باشد تزریق می‌شود.
</ParamField>
<ParamField path="config" type="object">
  کیسه اختیاری برای فیلدهای سفارشی هر skill. کلیدهای سفارشی باید اینجا قرار بگیرند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای Skills **همراه**. اگر تنظیم شود، فقط Skills همراه موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده/فضای کاری تحت تأثیر قرار نمی‌گیرند).
</ParamField>

اگر نام skill شامل خط تیره باشد، کلید را در کوتیشن بگذارید (JSON5 کلیدهای
کوتیشن‌دار را مجاز می‌داند). کلیدهای پیکربندی به‌طور پیش‌فرض با **نام skill** مطابقت دارند — اگر یک skill
`metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر آماده داخل OpenClaw، به‌جای یک skill همراه، از ابزار اصلی
`image_generate` همراه با `agents.defaults.imageGenerationModel` استفاده کنید.
نمونه‌های Skills در اینجا برای جریان‌های کاری سفارشی یا شخص ثالث هستند.
برای تحلیل تصویر بومی از ابزار `image` همراه با
`agents.defaults.imageModel` استفاده کنید. اگر `openai/*`، `google/*`،
`fal/*`، یا مدل تصویر اختصاصی ارائه‌دهنده دیگری را انتخاب می‌کنید، کلید
احراز هویت/API آن ارائه‌دهنده را هم اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

1. metadata مربوط به skill را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. prompt سیستمی را با Skills **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازمی‌گرداند.

تزریق محیط **به اجرای agent محدود است**، نه یک محیط shell سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot واجد شرایط را نیز
به‌صورت یک Plugin موقت Claude Code مادی‌سازی می‌کند و آن را با
`--plugin-dir` ارسال می‌کند. سپس Claude Code می‌تواند از resolver بومی skill خود استفاده کند، در حالی که
OpenClaw همچنان مالک اولویت، allowlistهای هر agent، gating، و تزریق
کلید env/API مربوط به `skills.entries.*` است. backendهای CLI دیگر فقط از
کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و نوسازی

OpenClaw هنگام شروع یک session، Skills واجد شرایط را snapshot می‌کند و
همان فهرست را برای turnهای بعدی در همان session دوباره استفاده می‌کند. تغییرات در
Skills یا پیکربندی در session جدید بعدی اعمال می‌شوند.

Skills در دو حالت می‌توانند در میانه session نوسازی شوند:

- watcher مربوط به Skills فعال باشد.
- یک node راه‌دور واجد شرایط جدید ظاهر شود.

این را مثل یک **hot reload** در نظر بگیرید: فهرست نوسازی‌شده در
turn بعدی agent استفاده می‌شود. اگر allowlist مؤثر skillهای agent برای آن
session تغییر کند، OpenClaw snapshot را نوسازی می‌کند تا Skills قابل مشاهده با
agent فعلی همگام بمانند.

### watcher مربوط به Skills

به‌طور پیش‌فرض، OpenClaw پوشه‌های skill را پایش می‌کند و وقتی فایل‌های
`SKILL.md` تغییر کنند snapshot مربوط به Skills را افزایش می‌دهد. زیر `skills.load` پیکربندی کنید:

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

### nodeهای راه‌دور macOS (gateway لینوکسی)

اگر Gateway روی Linux اجرا شود اما یک **node macOS** با مجوز
`system.run` متصل باشد (امنیت تأییدیه‌های Exec روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند وقتی binaryهای لازم روی آن node حاضر باشند، Skills مخصوص macOS را واجد شرایط در نظر بگیرد. agent باید آن Skills را
از طریق ابزار `exec` با `host=node` اجرا کند.

این به گزارش پشتیبانی command توسط node و به یک probe برای bin از طریق
`system.which` یا `system.run` متکی است. nodeهای offline باعث نمی‌شوند
Skills فقط-راه‌دور قابل مشاهده شوند. اگر یک node متصل پاسخ دادن به probeهای bin را متوقف کند،
OpenClaw تطابق‌های bin cacheشده آن را پاک می‌کند تا agentها دیگر Skillsی را نبینند
که در حال حاضر نمی‌توانند آنجا اجرا شوند.

## اثر توکن

وقتی Skills واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از skillهای در دسترس را
در prompt سیستمی تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه قطعی است:

- **سربار پایه** (فقط وقتی ≥1 skill وجود دارد): 195 نویسه.
- **برای هر skill:** 97 نویسه + طول مقادیر XML-escaped مربوط به `<name>`، `<description>`، و `<location>`.

فرمول (نویسه‌ها):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping نویسه‌های `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره)
گسترش می‌دهد و طول را افزایش می‌دهد. شمارش توکن بسته به tokenizer مدل متفاوت است. یک برآورد تقریبی
به سبک OpenAI حدود ~4 نویسه/توکن است، بنابراین **97 نویسه ≈ 24 توکن** به‌ازای هر
skill، به‌علاوه طول واقعی فیلدهای شما.

## چرخه عمر Skills مدیریت‌شده

OpenClaw یک مجموعه پایه از Skills را به‌عنوان **Skills همراه** همراه با
نصب (بسته npm یا OpenClaw.app) ارائه می‌کند. `~/.openclaw/skills` برای
بازنویسی‌های محلی وجود دارد — برای مثال، pin کردن یا patch کردن یک skill بدون
تغییر نسخه همراه. Skills فضای کاری در مالکیت کاربر هستند و در تعارض‌های نامی
هر دو را بازنویسی می‌کنند.

## دنبال Skills بیشتری هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/tools/clawhub) — registry عمومی Skills
- [ایجاد Skills](/fa/tools/creating-skills) — ساخت Skills سفارشی
- [Plugins](/fa/tools/plugin) — نمای کلی سیستم Plugin
- [Plugin کارگاه Skill](/fa/plugins/skill-workshop) — تولید Skills از کار agent
- [پیکربندی Skills](/fa/tools/skills-config) — مرجع پیکربندی skill
- [دستورهای slash](/fa/tools/slash-commands) — همه دستورهای slash موجود
