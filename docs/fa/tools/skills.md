---
read_when:
    - افزودن یا تغییر Skills
    - تغییر محدودسازی Skills، فهرست‌های مجاز یا قواعد بارگذاری
    - درک تقدم مهارت و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر فضای کاری، قواعد کنترل عبور، فهرست‌های مجاز عامل، و اتصال‌دهی پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های Skills **سازگار با [AgentSkills](https://agentskills.io)** استفاده می‌کند تا به عامل بیاموزد چگونه از ابزارها استفاده کند. هر Skill یک دایرکتوری است که یک `SKILL.md` با frontmatter به‌صورت YAML و دستورالعمل‌ها دارد. OpenClaw، Skills همراه نصب را به‌علاوه بازنویسی‌های محلی اختیاری بارگذاری می‌کند و آن‌ها را هنگام بارگذاری بر اساس محیط، پیکربندی، و وجود فایل اجرایی فیلتر می‌کند.

## مکان‌ها و اولویت

OpenClaw، Skills را از این منابع بارگذاری می‌کند، **بالاترین اولویت در ابتدا**:

| #   | منبع                  | مسیر                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills محیط کاری      | `<workspace>/skills`             |
| 2   | Skills عامل پروژه     | `<workspace>/.agents/skills`     |
| 3   | Skills عامل شخصی      | `~/.agents/skills`               |
| 4   | Skills مدیریت‌شده/محلی | `~/.openclaw/skills`             |
| 5   | Skills همراه نصب      | همراه با نصب ارائه می‌شوند       |
| 6   | پوشه‌های Skill اضافی  | `skills.load.extraDirs` (پیکربندی) |

اگر نام یک Skill تداخل داشته باشد، منبع با بالاترین اولویت برنده است.

دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI یکی از ریشه‌های Skill در OpenClaw نیست. در حالت harness مربوط به Codex، راه‌اندازی‌های app-server محلی از خانه‌های Codex جداگانه برای هر عامل استفاده می‌کنند، بنابراین Skills شخصی Codex CLI به‌صورت ضمنی بارگذاری نمی‌شوند. برای فهرست‌برداری از آن‌ها از `openclaw migrate codex --dry-run` استفاده کنید و از `openclaw migrate codex` برای انتخاب دایرکتوری‌های Skill با یک اعلان تعاملی checkbox پیش از کپی کردن آن‌ها به محیط کاری عامل فعلی OpenClaw استفاده کنید. برای اجراهای غیرتعاملی، `--skill <name>` را برای Skills دقیق موردنظر برای کپی تکرار کنید.

## Skills ویژه هر عامل در برابر Skills مشترک

در راه‌اندازی‌های **چندعاملی**، هر عامل محیط کاری خودش را دارد:

| دامنه                | مسیر                                        | قابل مشاهده برای             |
| -------------------- | ------------------------------------------- | ---------------------------- |
| ویژه هر عامل         | `<workspace>/skills`                        | فقط همان عامل                |
| عامل پروژه           | `<workspace>/.agents/skills`                | فقط عامل همان محیط کاری      |
| عامل شخصی            | `~/.agents/skills`                          | همه عامل‌ها روی آن ماشین     |
| مدیریت‌شده/محلی مشترک | `~/.openclaw/skills`                        | همه عامل‌ها روی آن ماشین     |
| دایرکتوری‌های اضافی مشترک | `skills.load.extraDirs` (کمترین اولویت) | همه عامل‌ها روی آن ماشین     |

نام یکسان در چند مکان ← منبع با بالاترین اولویت برنده است. محیط کاری بر عامل پروژه، عامل پروژه بر عامل شخصی، عامل شخصی بر مدیریت‌شده/محلی، مدیریت‌شده/محلی بر همراه نصب، و همراه نصب بر دایرکتوری‌های اضافی برتری دارد.

## فهرست‌های مجاز Skill برای عامل

**مکان** Skill و **قابلیت مشاهده** Skill کنترل‌های جداگانه‌ای هستند. مکان/اولویت تعیین می‌کند کدام نسخه از یک Skill هم‌نام برنده شود؛ فهرست‌های مجاز عامل تعیین می‌کنند عامل واقعاً می‌تواند از کدام Skills استفاده کند.

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
    - برای به ارث بردن `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای نداشتن هیچ Skill، مقدار `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** برای آن عامل است — با پیش‌فرض‌ها ادغام نمی‌شود.
    - فهرست مجاز مؤثر در سراسر ساخت prompt، کشف slash-command مربوط به Skill، همگام‌سازی sandbox، و snapshotهای Skill اعمال می‌شود.
  </Accordion>
</AccordionGroup>

## Pluginها و Skills

Pluginها می‌توانند Skills خودشان را با فهرست کردن دایرکتوری‌های `skills` در `openclaw.plugin.json` ارائه کنند (مسیرها نسبت به ریشه Plugin). Skills مربوط به Plugin هنگامی بارگذاری می‌شوند که Plugin فعال باشد. این مکان مناسب راهنماهای عملیاتی ویژه ابزار است که برای توضیح ابزار بیش از حد طولانی هستند اما باید هر زمان Plugin نصب است در دسترس باشند — برای نمونه، Plugin مرورگر یک Skill به نام `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های Skill مربوط به Plugin در همان مسیر کم‌اولویت `skills.load.extraDirs` ادغام می‌شوند، بنابراین یک Skill هم‌نام همراه نصب، مدیریت‌شده، عامل، یا محیط کاری آن‌ها را بازنویسی می‌کند. می‌توانید آن‌ها را از طریق `metadata.openclaw.requires.config` روی ورودی پیکربندی Plugin محدود کنید.

برای کشف/پیکربندی به [Pluginها](/fa/tools/plugin) و برای سطح ابزاری که آن Skills آموزش می‌دهند به [ابزارها](/fa/tools) مراجعه کنید.

## کارگاه Skill

Plugin اختیاری و آزمایشی **کارگاه Skill** می‌تواند Skills محیط کاری را از روی رویه‌های قابل استفاده مجدد که در طول کار عامل مشاهده شده‌اند ایجاد یا به‌روزرسانی کند. این Plugin به‌صورت پیش‌فرض غیرفعال است و باید به‌طور صریح از طریق `plugins.entries.skill-workshop` فعال شود.

کارگاه Skill فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را اسکن می‌کند، تأیید در انتظار یا نوشتن امن خودکار را پشتیبانی می‌کند، پیشنهادهای ناامن را قرنطینه می‌کند، و پس از نوشتن موفق snapshot مربوط به Skill را تازه‌سازی می‌کند تا Skills جدید بدون راه‌اندازی مجدد Gateway در دسترس شوند.

از آن برای اصلاحاتی مانند _"دفعه بعد، انتساب GIF را بررسی کن"_ یا گردش‌کارهای دشوار به‌دست‌آمده مانند چک‌لیست‌های QA رسانه استفاده کنید. با تأیید در انتظار شروع کنید؛ نوشتن خودکار را فقط در محیط‌های کاری مورد اعتماد و پس از بررسی پیشنهادهای آن به کار ببرید. راهنمای کامل: [Plugin کارگاه Skill](/fa/plugins/skill-workshop).

## ClawHub (نصب و همگام‌سازی)

[ClawHub](https://clawhub.ai) رجیستری عمومی Skills برای OpenClaw است. برای کشف/نصب/به‌روزرسانی از فرمان‌های بومی `openclaw skills`، یا برای گردش‌کارهای انتشار/همگام‌سازی از CLI جداگانه `clawhub` استفاده کنید. راهنمای کامل: [ClawHub](/fa/tools/clawhub).

| اقدام                              | فرمان                                  |
| ---------------------------------- | -------------------------------------- |
| نصب یک Skill در محیط کاری          | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همه Skills نصب‌شده     | `openclaw skills update --all`         |
| همگام‌سازی (اسکن + انتشار به‌روزرسانی‌ها) | `clawhub sync --all`                   |

`openclaw skills install` بومی در دایرکتوری فعال `skills/` محیط کاری نصب می‌کند. CLI جداگانه `clawhub` نیز در `./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند (یا به محیط کاری پیکربندی‌شده OpenClaw بازمی‌گردد). OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` شناسایی می‌کند.
ریشه‌های Skill پیکربندی‌شده همچنین از یک سطح گروه‌بندی، مانند `skills/<group>/<skill>/SKILL.md`، پشتیبانی می‌کنند تا Skills شخص ثالث مرتبط بتوانند بدون اسکن بازگشتی گسترده زیر یک پوشه مشترک نگه داشته شوند.

صفحه‌های Skill در ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را با صفحه‌های جزئیات اسکنر برای VirusTotal، ClawScan، و تحلیل ایستا نمایش می‌دهند. `openclaw skills install <slug>` همچنان فقط مسیر نصب است؛ ناشران مثبت‌های کاذب را از طریق داشبورد ClawHub یا `clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
با Skills شخص ثالث مانند **کد نامطمئن** رفتار کنید. پیش از فعال‌سازی، آن‌ها را بخوانید.
برای ورودی‌های نامطمئن و ابزارهای پرخطر، اجراهای sandbox شده را ترجیح دهید. برای کنترل‌های سمت عامل به [Sandboxing](/fa/gateway/sandboxing) مراجعه کنید.
</Warning>

- کشف Skill در محیط کاری و دایرکتوری اضافی فقط ریشه‌های Skill و فایل‌های `SKILL.md` را می‌پذیرد که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند.
- نصب وابستگی Skill با پشتیبانی Gateway (`skills.install`، onboarding، و UI تنظیمات Skills) پیش از اجرای فراداده نصب‌کننده، اسکنر داخلی کد خطرناک را اجرا می‌کند. یافته‌های `critical` به‌صورت پیش‌فرض مسدود می‌شوند، مگر آنکه فراخواننده به‌طور صریح override خطرناک را تنظیم کند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است — یک پوشه Skill مربوط به ClawHub را در محیط کاری دانلود می‌کند و از مسیر فراداده نصب‌کننده بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` رازها را برای آن نوبت عامل به فرایند **میزبان** تزریق می‌کنند (نه sandbox). رازها را از promptها و لاگ‌ها دور نگه دارید.

برای مدل تهدید گسترده‌تر و چک‌لیست‌ها، به [امنیت](/fa/gateway/security) مراجعه کنید.

## قالب SKILL.md

`SKILL.md` باید دست‌کم شامل موارد زیر باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای چیدمان/نیت از مشخصات AgentSkills پیروی می‌کند. parser مورد استفاده توسط عامل تعبیه‌شده فقط کلیدهای frontmatter **تک‌خطی** را پشتیبانی می‌کند؛ `metadata` باید یک **شیء JSON تک‌خطی** باشد. برای ارجاع به مسیر پوشه Skill در دستورالعمل‌ها از `{baseDir}` استفاده کنید.

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  URL که در UI مربوط به Skills در macOS به‌عنوان "Website" نمایش داده می‌شود. از طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، Skill به‌عنوان یک فرمان slash کاربر نمایش داده می‌شود.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، Skill از prompt مدل حذف می‌شود (همچنان از طریق فراخوانی کاربر در دسترس است).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، فرمان slash مدل را دور می‌زند و مستقیماً به یک ابزار dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشته خام args را به ابزار ارسال می‌کند (بدون parsing در core). ابزار با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` فراخوانی می‌شود.
</ParamField>

## محدودسازی (فیلترهای زمان بارگذاری)

OpenClaw، Skills را هنگام بارگذاری با استفاده از `metadata` (JSON تک‌خطی) فیلتر می‌کند:

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
  وقتی `true` باشد، همیشه Skill را شامل کن (از gateهای دیگر عبور کن).
</ParamField>
<ParamField path="emoji" type="string">
  emoji اختیاری که توسط UI مربوط به Skills در macOS استفاده می‌شود.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در UI مربوط به Skills در macOS به‌عنوان "Website" نمایش داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  فهرست اختیاری پلتفرم‌ها. اگر تنظیم شود، Skill فقط روی آن OSها واجد شرایط است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هرکدام باید روی `PATH` وجود داشته باشند.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  دست‌کم یکی باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  متغیر env باید وجود داشته باشد یا در پیکربندی ارائه شود.
</ParamField>
<ParamField path="requires.config" type="string[]">
  فهرست مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام متغیر env مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مشخصات اختیاری نصب‌کننده که توسط UI مربوط به Skills در macOS استفاده می‌شود (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، Skill همیشه واجد شرایط است (مگر آنکه در پیکربندی غیرفعال شده باشد یا برای Skills همراه نصب توسط `skills.allowBundled` مسدود شده باشد).

<Note>
بلوک‌های قدیمی `metadata.clawdbot` همچنان وقتی `metadata.openclaw` وجود ندارد پذیرفته می‌شوند، بنابراین Skills قدیمی نصب‌شده gateهای وابستگی و راهنمای نصب‌کننده خود را حفظ می‌کنند. Skills جدید و به‌روزرسانی‌شده باید از `metadata.openclaw` استفاده کنند.
</Note>

### نکات Sandboxing

- `requires.bins` هنگام بارگذاری Skill روی **میزبان** بررسی می‌شود.
- اگر یک عامل sandbox شده باشد، فایل اجرایی باید **داخل container** نیز وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک image سفارشی) نصب کنید. `setupCommand` یک‌بار پس از ایجاد container اجرا می‌شود. نصب بسته‌ها همچنین به خروجی شبکه، root FS قابل نوشتن، و کاربر root در sandbox نیاز دارد.
- مثال: Skill به نام `summarize` (`skills/summarize/SKILL.md`) برای اجرا در container مربوط به sandbox به CLI به نام `summarize` نیاز دارد.

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
    - اگر چند نصب‌کننده فهرست شده باشد، gateway یک گزینهٔ ترجیحی واحد را انتخاب می‌کند (brew وقتی در دسترس باشد، وگرنه node).
    - اگر همهٔ نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید artifactهای موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها بر اساس سکو فیلتر شوند.
    - نصب‌های Node از `skills.install.nodeManager` در `openclaw.json` پیروی می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط روی نصب skillها اثر می‌گذارد؛ runtime مربوط به Gateway همچنان باید Node باشد — Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کننده با پشتوانهٔ Gateway بر اساس ترجیح انجام می‌شود: وقتی مشخصات نصب چند نوع را ترکیب می‌کند، OpenClaw زمانی Homebrew را ترجیح می‌دهد که `skills.install.preferBrew` فعال باشد و `brew` وجود داشته باشد، سپس `uv`، سپس مدیر node پیکربندی‌شده، و بعد fallbackهای دیگر مثل `go` یا `download`.
    - اگر همهٔ مشخصات نصب `download` باشند، OpenClaw به‌جای خلاصه‌کردن به یک نصب‌کنندهٔ ترجیحی، همهٔ گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **نصب‌های Go:** اگر `go` وجود نداشته باشد و `brew` در دسترس باشد، gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: تشخیص خودکار وقتی آرشیو شناسایی شود)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

skillهای همراه و مدیریت‌شده را می‌توان در `skills.entries` در `~/.openclaw/openclaw.json` فعال/غیرفعال کرد و مقادیر env به آن‌ها داد:

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
  مقدار `false` skill را غیرفعال می‌کند، حتی اگر همراه یا نصب‌شده باشد.
  skill همراه `coding-agent` انتخابی است: پیش از در دسترس قرار دادن آن برای agentها،
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  میان‌بری برای skillهایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط وقتی تزریق می‌شود که متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>
<ParamField path="config" type="object">
  بستهٔ اختیاری برای فیلدهای سفارشی هر skill. کلیدهای سفارشی باید اینجا قرار بگیرند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای skillهای **همراه**. اگر تنظیم شود، فقط skillهای همراه موجود در فهرست واجد شرایط هستند (skillهای مدیریت‌شده/workspace تحت تأثیر قرار نمی‌گیرند).
</ParamField>

اگر نام skill شامل خط تیره باشد، کلید را داخل نقل‌قول بگذارید (JSON5 کلیدهای
نقل‌قول‌دار را می‌پذیرد). کلیدهای پیکربندی به‌طور پیش‌فرض با **نام skill**
مطابقت دارند — اگر یک skill مقدار `metadata.openclaw.skillKey` را تعریف کند،
از همان کلید زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر آماده داخل OpenClaw، به‌جای یک skill همراه، از ابزار اصلی
`image_generate` همراه با `agents.defaults.imageGenerationModel` استفاده کنید.
نمونه‌های skill در اینجا برای گردش‌کارهای سفارشی یا شخص ثالث هستند.
برای تحلیل تصویر بومی، از ابزار `image` همراه با `agents.defaults.imageModel` استفاده کنید.
اگر `openai/*`، `google/*`، `fal/*`، یا مدل تصویر اختصاصی ارائه‌دهندهٔ دیگری را انتخاب می‌کنید،
کلید احراز هویت/API همان ارائه‌دهنده را هم اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

1. فرادادهٔ skill را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. system prompt را با skillهای **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازمی‌گرداند.

تزریق محیط **محدود به اجرای agent** است، نه یک محیط shell سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot واجد شرایط را هم
به‌صورت یک Plugin موقت Claude Code ایجاد می‌کند و آن را با `--plugin-dir` می‌فرستد.
سپس Claude Code می‌تواند از skill resolver بومی خود استفاده کند، در حالی که
OpenClaw همچنان مالک اولویت، allowlistهای هر agent، gating، و تزریق env/API key مربوط به
`skills.entries.*` است. سایر backendهای CLI فقط از کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و تازه‌سازی

OpenClaw skillهای واجد شرایط را **هنگام شروع یک جلسه** snapshot می‌کند و
همان فهرست را برای turnهای بعدی در همان جلسه دوباره به‌کار می‌برد. تغییرات
skillها یا پیکربندی در جلسهٔ جدید بعدی اثر می‌گذارد.

Skills می‌توانند در دو حالت در میانهٔ جلسه تازه‌سازی شوند:

- ناظر skillها فعال باشد.
- یک node راه‌دور واجد شرایط جدید ظاهر شود.

این را مثل یک **hot reload** در نظر بگیرید: فهرست تازه‌سازی‌شده در turn بعدی agent
استفاده می‌شود. اگر allowlist مؤثر skillهای agent برای آن جلسه تغییر کند،
OpenClaw snapshot را تازه‌سازی می‌کند تا skillهای قابل مشاهده با agent فعلی
هم‌راستا بمانند.

### ناظر Skills

به‌طور پیش‌فرض، OpenClaw پوشه‌های skill را پایش می‌کند و وقتی فایل‌های `SKILL.md`
تغییر کنند snapshot مربوط به skills را بالا می‌برد. زیر `skills.load` پیکربندی کنید:

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

### nodeهای macOS راه‌دور (gateway لینوکسی)

اگر Gateway روی Linux اجرا شود اما یک **node macOS** با مجوز
`system.run` متصل باشد (امنیت تأییدهای Exec روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند skillهای فقط macOS را وقتی binaryهای لازم روی آن node وجود دارند واجد شرایط بداند.
agent باید آن skillها را از طریق ابزار `exec` با `host=node` اجرا کند.

این به گزارش پشتیبانی فرمان از سوی node و یک bin probe از طریق
`system.which` یا `system.run` متکی است. nodeهای آفلاین skillهای فقط راه‌دور
را قابل مشاهده نمی‌کنند. اگر یک node متصل پاسخ‌دادن به bin probeها را متوقف کند،
OpenClaw تطابق‌های bin کش‌شدهٔ آن را پاک می‌کند تا agentها دیگر skillهایی را که
در حال حاضر آنجا قابل اجرا نیستند نبینند.

## اثر توکنی

وقتی skillها واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از skillهای موجود
را در system prompt تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه قطعی است:

- **سربار پایه** (فقط وقتی ≥1 skill وجود دارد): 195 نویسه.
- **برای هر skill:** 97 نویسه + طول مقادیر XML-escaped مربوط به `<name>`، `<description>`، و `<location>`.

فرمول (نویسه‌ها):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping نویسه‌های `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره)
گسترش می‌دهد و طول را افزایش می‌دهد. شمار توکن‌ها بسته به tokenizer مدل فرق می‌کند.
یک برآورد تقریبی به سبک OpenAI حدود ~4 نویسه/توکن است، پس **97 نویسه ≈ 24 توکن**
برای هر skill، به‌علاوهٔ طول واقعی فیلدهای شما.

## چرخهٔ عمر skillهای مدیریت‌شده

OpenClaw یک مجموعهٔ پایه از skillها را به‌عنوان **skillهای همراه** همراه نصب
(بستهٔ npm یا OpenClaw.app) ارائه می‌کند. `~/.openclaw/skills` برای بازنویسی‌های
محلی وجود دارد — برای مثال، pin کردن یا patch کردن یک skill بدون تغییر نسخهٔ همراه.
skillهای workspace متعلق به کاربر هستند و در تعارض نام، هر دو مورد را override می‌کنند.

## به‌دنبال skillهای بیشتر هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/tools/clawhub) — رجیستری عمومی skills
- [ایجاد skills](/fa/tools/creating-skills) — ساخت skillهای سفارشی
- [Pluginها](/fa/tools/plugin) — نمای کلی سیستم Plugin
- [Plugin کارگاه Skill](/fa/plugins/skill-workshop) — تولید skills از کار agent
- [پیکربندی Skills](/fa/tools/skills-config) — مرجع پیکربندی skill
- [فرمان‌های slash](/fa/tools/slash-commands) — همهٔ فرمان‌های slash موجود
