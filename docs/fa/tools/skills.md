---
read_when:
    - افزودن یا تغییر Skills
    - تغییر محدودسازی Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک اولویت Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر محیط کاری، قواعد گیتینگ، فهرست‌های مجاز عامل، و اتصال‌دهی پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-04-29T23:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های مهارت **سازگار با [AgentSkills](https://agentskills.io)** استفاده می‌کند تا به عامل آموزش دهد چگونه از ابزارها استفاده کند. هر مهارت یک دایرکتوری است که شامل یک `SKILL.md` با frontmatter به‌صورت YAML و دستورالعمل‌هاست. OpenClaw مهارت‌های همراه‌شده و بازنویسی‌های محلی اختیاری را بارگذاری می‌کند و هنگام بارگذاری، آن‌ها را بر اساس محیط، پیکربندی، و وجود باینری فیلتر می‌کند.

## مکان‌ها و اولویت

OpenClaw مهارت‌ها را از این منابع بارگذاری می‌کند، **ابتدا با بالاترین اولویت**:

| #   | منبع                | مسیر                             |
| --- | --------------------- | -------------------------------- |
| 1   | مهارت‌های فضای کاری      | `<workspace>/skills`             |
| 2   | مهارت‌های عامل پروژه  | `<workspace>/.agents/skills`     |
| 3   | مهارت‌های عامل شخصی | `~/.agents/skills`               |
| 4   | مهارت‌های مدیریت‌شده/محلی  | `~/.openclaw/skills`             |
| 5   | مهارت‌های همراه‌شده        | همراه با نصب ارائه می‌شوند         |
| 6   | پوشه‌های مهارت اضافی   | `skills.load.extraDirs` (پیکربندی) |

اگر نام یک مهارت تداخل داشته باشد، منبع با بالاترین اولویت برنده می‌شود.

## مهارت‌های مختص عامل در برابر مهارت‌های مشترک

در راه‌اندازی‌های **چندعاملی** هر عامل فضای کاری خودش را دارد:

| دامنه                | مسیر                                        | قابل مشاهده برای                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| مختص عامل            | `<workspace>/skills`                        | فقط همان عامل             |
| عامل پروژه        | `<workspace>/.agents/skills`                | فقط عامل همان فضای کاری |
| عامل شخصی       | `~/.agents/skills`                          | همه عامل‌ها روی آن دستگاه  |
| مدیریت‌شده/محلی مشترک | `~/.openclaw/skills`                        | همه عامل‌ها روی آن دستگاه  |
| دایرکتوری‌های اضافی مشترک    | `skills.load.extraDirs` (پایین‌ترین اولویت) | همه عامل‌ها روی آن دستگاه  |

نام یکسان در چند مکان → منبع با بالاترین اولویت برنده می‌شود. فضای کاری بر
عامل پروژه غلبه می‌کند، بر عامل شخصی غلبه می‌کند، بر مدیریت‌شده/محلی غلبه می‌کند، بر همراه‌شده غلبه می‌کند،
و بر دایرکتوری‌های اضافی غلبه می‌کند.

## فهرست‌های مجاز مهارت عامل

**مکان** مهارت و **دیدپذیری** مهارت کنترل‌های جداگانه‌ای هستند.
مکان/اولویت تعیین می‌کند کدام نسخه از یک مهارت هم‌نام برنده می‌شود؛
فهرست‌های مجاز عامل تعیین می‌کنند عامل واقعاً از کدام مهارت‌ها می‌تواند استفاده کند.

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
    - برای مهارت‌های نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای به‌ارث‌بردن `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای نداشتن هیچ مهارتی، `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** آن عامل است — با پیش‌فرض‌ها ادغام نمی‌شود.
    - فهرست مجاز مؤثر روی ساخت اعلان، کشف دستورهای اسلش مهارت، همگام‌سازی sandbox، و snapshotهای مهارت اعمال می‌شود.

  </Accordion>
</AccordionGroup>

## Pluginها و مهارت‌ها

Pluginها می‌توانند مهارت‌های خودشان را با فهرست‌کردن دایرکتوری‌های `skills` در
`openclaw.plugin.json` ارائه کنند (مسیرها نسبت به ریشه Plugin هستند). مهارت‌های Plugin
وقتی Plugin فعال باشد بارگذاری می‌شوند. اینجا جای مناسب راهنماهای عملیاتی ویژه ابزار است که برای توضیح ابزار بیش از حد طولانی هستند اما باید هر زمان Plugin نصب است در دسترس باشند — برای مثال، Plugin مرورگر یک مهارت `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های مهارت Plugin در همان مسیر با اولویت پایین مانند
`skills.load.extraDirs` ادغام می‌شوند، بنابراین یک مهارت هم‌نام همراه‌شده، مدیریت‌شده، عامل، یا
فضای کاری آن‌ها را بازنویسی می‌کند. می‌توانید آن‌ها را از طریق
`metadata.openclaw.requires.config` روی ورودی پیکربندی Plugin محدود کنید.

برای کشف/پیکربندی، [Pluginها](/fa/tools/plugin) را ببینید و برای سطح ابزاری که این مهارت‌ها آموزش می‌دهند، [ابزارها](/fa/tools) را ببینید.

## Skill Workshop

Plugin اختیاری و آزمایشی **Skill Workshop** می‌تواند از روی رویه‌های قابل‌استفاده‌مجدد که هنگام کار عامل مشاهده می‌شوند، مهارت‌های فضای کاری را ایجاد یا به‌روزرسانی کند. این قابلیت به‌صورت پیش‌فرض غیرفعال است و باید صراحتاً از طریق
`plugins.entries.skill-workshop` فعال شود.

Skill Workshop فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را اسکن می‌کند، از تأیید در انتظار یا نوشتن‌های امن خودکار پشتیبانی می‌کند، پیشنهادهای ناامن را قرنطینه می‌کند، و پس از نوشتن‌های موفق snapshot مهارت را تازه‌سازی می‌کند تا مهارت‌های جدید بدون راه‌اندازی دوباره Gateway در دسترس شوند.

از آن برای اصلاحاتی مانند _"دفعه بعد، انتساب GIF را تأیید کن"_ یا
جریان‌کارهای سخت‌به‌دست‌آمده‌ای مانند چک‌لیست‌های QA رسانه استفاده کنید. با تأیید در انتظار شروع کنید؛ نوشتن خودکار را فقط در فضاهای کاری قابل‌اعتماد و پس از بازبینی پیشنهادهای آن استفاده کنید. راهنمای کامل: [Plugin Skill Workshop](/fa/plugins/skill-workshop).

## ClawHub (نصب و همگام‌سازی)

[ClawHub](https://clawhub.ai) رجیستری عمومی مهارت‌ها برای OpenClaw است.
برای کشف/نصب/به‌روزرسانی از دستورهای بومی `openclaw skills` استفاده کنید، یا برای جریان‌کارهای انتشار/همگام‌سازی از CLI جداگانه `clawhub` استفاده کنید. راهنمای کامل:
[ClawHub](/fa/tools/clawhub).

| اقدام                             | دستور                                |
| ---------------------------------- | -------------------------------------- |
| نصب یک مهارت در فضای کاری | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همه مهارت‌های نصب‌شده        | `openclaw skills update --all`         |
| همگام‌سازی (اسکن + انتشار به‌روزرسانی‌ها)      | `clawhub sync --all`                   |

`openclaw skills install` بومی در دایرکتوری `skills/` فضای کاری فعال نصب می‌کند. CLI جداگانه `clawhub` نیز در `./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند (یا به فضای کاری پیکربندی‌شده OpenClaw برمی‌گردد). OpenClaw در نشست بعدی آن را به‌عنوان
`<workspace>/skills` برمی‌دارد.

صفحه‌های مهارت ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را نشان می‌دهند،
همراه با صفحه‌های جزئیات اسکنر برای VirusTotal، ClawScan، و تحلیل ایستا.
`openclaw skills install <slug>` فقط مسیر نصب باقی می‌ماند؛ منتشرکنندگان
مثبت‌های کاذب را از طریق داشبورد ClawHub یا
`clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
با مهارت‌های شخص ثالث مانند **کد غیرقابل‌اعتماد** رفتار کنید. پیش از فعال‌کردن آن‌ها را بخوانید.
برای ورودی‌های غیرقابل‌اعتماد و ابزارهای پرریسک، اجراهای sandbox‌شده را ترجیح دهید. برای کنترل‌های سمت عامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

- کشف مهارت‌های فضای کاری و دایرکتوری اضافی فقط ریشه‌های مهارت و فایل‌های `SKILL.md` را می‌پذیرد که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند.
- نصب‌های وابستگی مهارت با پشتیبانی Gateway (`skills.install`، onboarding، و رابط کاربری تنظیمات Skills) پیش از اجرای فراداده نصب‌کننده، اسکنر داخلی کد خطرناک را اجرا می‌کنند. یافته‌های `critical` به‌صورت پیش‌فرض مسدود می‌شوند مگر اینکه فراخوان صراحتاً override خطرناک را تنظیم کند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است — یک پوشه مهارت ClawHub را در فضای کاری دانلود می‌کند و از مسیر فراداده نصب‌کننده بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` رازها را برای آن نوبت عامل به فرایند **میزبان** تزریق می‌کنند (نه sandbox). رازها را از اعلان‌ها و لاگ‌ها دور نگه دارید.

برای مدل تهدید گسترده‌تر و چک‌لیست‌ها، [امنیت](/fa/gateway/security) را ببینید.

## قالب SKILL.md

`SKILL.md` باید دست‌کم شامل موارد زیر باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای چیدمان/نیت از مشخصات AgentSkills پیروی می‌کند. پارسری که عامل توکار استفاده می‌کند فقط از کلیدهای frontmatter **تک‌خطی** پشتیبانی می‌کند؛
`metadata` باید یک **شیء JSON تک‌خطی** باشد. برای ارجاع به مسیر پوشه مهارت در دستورالعمل‌ها از `{baseDir}` استفاده کنید.

### کلیدهای frontmatter اختیاری

<ParamField path="homepage" type="string">
  URL که در رابط کاربری Skills در macOS به‌عنوان "وب‌سایت" نمایش داده می‌شود. از طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌عنوان دستور اسلش کاربر ارائه می‌شود.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، مهارت از اعلان مدل حذف می‌شود (همچنان از طریق فراخوانی کاربر در دسترس است).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، دستور اسلش مدل را دور می‌زند و مستقیماً به یک ابزار dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشته خام آرگومان‌ها را به ابزار ارسال می‌کند (بدون پارس هسته). ابزار با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` فراخوانی می‌شود.
</ParamField>

## محدودسازی (فیلترهای زمان بارگذاری)

OpenClaw مهارت‌ها را هنگام بارگذاری با استفاده از `metadata` (JSON تک‌خطی) فیلتر می‌کند:

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
  وقتی `true` باشد، همیشه مهارت را شامل می‌کند (سایر gateها را رد می‌کند).
</ParamField>
<ParamField path="emoji" type="string">
  ایموجی اختیاری که رابط کاربری Skills در macOS استفاده می‌کند.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در رابط کاربری Skills در macOS به‌عنوان "وب‌سایت" نشان داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  فهرست اختیاری پلتفرم‌ها. اگر تنظیم شود، مهارت فقط روی آن سیستم‌عامل‌ها واجد شرایط است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هرکدام باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  دست‌کم یکی باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  متغیر محیطی باید وجود داشته باشد یا در پیکربندی ارائه شود.
</ParamField>
<ParamField path="requires.config" type="string[]">
  فهرستی از مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام متغیر محیطی مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مشخصات نصب‌کننده اختیاری که رابط کاربری Skills در macOS استفاده می‌کند (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، مهارت همیشه واجد شرایط است (مگر اینکه
در پیکربندی غیرفعال شده باشد یا برای مهارت‌های همراه‌شده توسط `skills.allowBundled` مسدود شده باشد).

<Note>
بلوک‌های قدیمی `metadata.clawdbot` همچنان زمانی پذیرفته می‌شوند که
`metadata.openclaw` وجود نداشته باشد، بنابراین مهارت‌های نصب‌شده قدیمی gateهای وابستگی و راهنمایی‌های نصب‌کننده خود را حفظ می‌کنند. مهارت‌های جدید و به‌روزرسانی‌شده باید از
`metadata.openclaw` استفاده کنند.
</Note>

### نکات Sandboxing

- `requires.bins` هنگام بارگذاری مهارت روی **میزبان** بررسی می‌شود.
- اگر یک عامل sandbox‌شده باشد، باینری باید **داخل کانتینر** نیز وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک image سفارشی) نصب کنید. `setupCommand` یک بار پس از ایجاد کانتینر اجرا می‌شود. نصب بسته‌ها همچنین به خروجی شبکه، root FS قابل‌نوشتن، و کاربر root در sandbox نیاز دارد.
- مثال: مهارت `summarize` (`skills/summarize/SKILL.md`) برای اجرا در sandbox container به CLI `summarize` نیاز دارد.

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
  <Accordion title="قوانین انتخاب نصب‌کننده">
    - اگر چند نصب‌کننده فهرست شده باشد، Gateway یک گزینهٔ ترجیحی واحد را انتخاب می‌کند (در صورت موجود بودن brew، وگرنه node).
    - اگر همهٔ نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید آرتیفکت‌های موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها بر اساس پلتفرم فیلتر شوند.
    - نصب‌های Node مقدار `skills.install.nodeManager` را در `openclaw.json` رعایت می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط روی نصب skill اثر می‌گذارد؛ زمان اجرای Gateway همچنان باید Node باشد — Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کنندهٔ پشتیبانی‌شده توسط Gateway بر اساس ترجیح انجام می‌شود: وقتی مشخصات نصب انواع مختلف را ترکیب کنند، OpenClaw در صورت فعال بودن `skills.install.preferBrew` و وجود `brew`، Homebrew را ترجیح می‌دهد، سپس `uv`، سپس مدیر node پیکربندی‌شده، و سپس fallbackهای دیگر مانند `go` یا `download`.
    - اگر همهٔ مشخصات نصب `download` باشند، OpenClaw به‌جای خلاصه کردن به یک نصب‌کنندهٔ ترجیحی، همهٔ گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **نصب‌های Go:** اگر `go` موجود نباشد و `brew` در دسترس باشد، gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` متعلق به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: خودکار وقتی آرشیو شناسایی شود)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

Skills همراه و مدیریت‌شده را می‌توان فعال/غیرفعال کرد و مقادیر env را
زیر `skills.entries` در `~/.openclaw/openclaw.json` برایشان فراهم کرد:

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
  `false` این skill را غیرفعال می‌کند، حتی اگر همراه یا نصب‌شده باشد.
  skill همراه `coding-agent` به‌صورت opt-in است: پیش از در دسترس قرار دادن آن برای agentها،
  مقدار `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  راهکاری ساده برای skillsی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط زمانی تزریق می‌شود که متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>
<ParamField path="config" type="object">
  کیسهٔ اختیاری برای فیلدهای سفارشی هر skill. کلیدهای سفارشی باید اینجا باشند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای skills **همراه**. اگر تنظیم شود، فقط skills همراه موجود در فهرست واجد شرایط هستند (skills مدیریت‌شده/Workspace تحت تأثیر قرار نمی‌گیرند).
</ParamField>

اگر نام skill شامل خط تیره است، کلید را در کوتیشن بگذارید (JSON5 کلیدهای
کوتیشن‌دار را مجاز می‌داند). کلیدهای پیکربندی به‌صورت پیش‌فرض با **نام skill** منطبق‌اند — اگر یک skill
مقدار `metadata.openclaw.skillKey` را تعریف کند، همان کلید را زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر آماده داخل OpenClaw، به‌جای یک skill همراه، از ابزار هستهٔ
`image_generate` همراه با `agents.defaults.imageGenerationModel` استفاده کنید.
نمونه‌های skill در اینجا برای گردش‌کارهای سفارشی یا شخص ثالث هستند.
برای تحلیل تصویر بومی از ابزار `image` همراه با
`agents.defaults.imageModel` استفاده کنید. اگر `openai/*`، `google/*`،
`fal/*`، یا مدل تصویر دیگری مخصوص یک provider را انتخاب می‌کنید، کلید احراز هویت/API همان provider را هم اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای یک agent شروع می‌شود، OpenClaw:

1. فرادادهٔ skill را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. system prompt را با skills **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازیابی می‌کند.

تزریق محیط **محدود به اجرای agent** است، نه یک محیط shell سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot واجد شرایط را
به‌عنوان یک Plugin موقت Claude Code نیز می‌سازد و آن را با
`--plugin-dir` پاس می‌دهد. سپس Claude Code می‌تواند از resolver بومی skill خودش استفاده کند، در حالی که
OpenClaw همچنان مالک اولویت، allowlistهای هر agent، gating، و
تزریق env/API key مربوط به `skills.entries.*` است. دیگر backendهای CLI فقط از
کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و تازه‌سازی

OpenClaw هنگام شروع یک session از skills واجد شرایط **snapshot می‌گیرد** و
همان فهرست را برای نوبت‌های بعدی در همان session دوباره استفاده می‌کند. تغییرات در
skills یا config در session جدید بعدی اعمال می‌شوند.

Skills می‌توانند در دو حالت در میانهٔ session تازه‌سازی شوند:

- watcher مربوط به skills فعال باشد.
- یک node راه‌دور واجد شرایط جدید ظاهر شود.

این را مانند یک **hot reload** در نظر بگیرید: فهرست تازه‌شده در
نوبت بعدی agent استفاده می‌شود. اگر allowlist مؤثر skill برای agent در آن
session تغییر کند، OpenClaw snapshot را تازه‌سازی می‌کند تا skills قابل مشاهده با agent فعلی هماهنگ بمانند.

### Watcher مربوط به Skills

به‌صورت پیش‌فرض، OpenClaw پوشه‌های skill را زیر نظر می‌گیرد و وقتی فایل‌های `SKILL.md` تغییر کنند،
snapshot مربوط به skills را افزایش می‌دهد. زیر `skills.load` پیکربندی کنید:

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

### Nodeهای راه‌دور macOS (Gateway لینوکسی)

اگر Gateway روی Linux اجرا شود اما یک **node macOS** با اجازهٔ
`system.run` متصل باشد (امنیت تأییدیه‌های Exec روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند skills فقط مخصوص macOS را وقتی باینری‌های لازم روی آن node موجود باشند واجد شرایط در نظر بگیرد. agent باید آن skills را
از طریق ابزار `exec` با `host=node` اجرا کند.

این به گزارش پشتیبانی فرمان توسط node و به یک بررسی bin
از طریق `system.which` یا `system.run` متکی است. Nodeهای آفلاین skills فقط راه‌دور را
قابل مشاهده نمی‌کنند. اگر یک node متصل دیگر به بررسی‌های bin پاسخ ندهد،
OpenClaw تطابق‌های bin کش‌شدهٔ آن را پاک می‌کند تا agentها دیگر skillsی را که فعلاً نمی‌توانند آنجا اجرا شوند نبینند.

## اثر توکن

وقتی skills واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از skills موجود را
به system prompt تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه قطعی است:

- **سربار پایه** (فقط وقتی ≥1 skill وجود داشته باشد): 195 نویسه.
- **برای هر skill:** 97 نویسه + طول مقادیر XML-escaped مربوط به `<name>`، `<description>`، و `<location>`.

فرمول (نویسه‌ها):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping نویسه‌های `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره) گسترش می‌دهد،
و طول را افزایش می‌دهد. شمارش توکن بر اساس tokenizer مدل متفاوت است. یک تخمین تقریبی
به سبک OpenAI حدود ~4 نویسه/توکن است، بنابراین **97 نویسه ≈ 24 توکن** برای هر
skill، به‌علاوهٔ طول واقعی فیلدهای شما.

## چرخهٔ عمر skills مدیریت‌شده

OpenClaw همراه با نصب (بستهٔ npm یا OpenClaw.app)، یک مجموعهٔ پایه از skills را به‌عنوان **skills همراه** ارائه می‌کند. `~/.openclaw/skills` برای
بازنویسی‌های محلی وجود دارد — برای مثال، pin کردن یا patch کردن یک skill بدون
تغییر دادن نسخهٔ همراه. Workspace skills متعلق به کاربر هستند و
در تعارض نام، هر دو را override می‌کنند.

## دنبال skills بیشتری هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/tools/clawhub) — رجیستری عمومی skills
- [ایجاد skills](/fa/tools/creating-skills) — ساخت skills سفارشی
- [Plugins](/fa/tools/plugin) — نمای کلی سیستم Plugin
- [Plugin کارگاه Skill](/fa/plugins/skill-workshop) — تولید skills از کار agent
- [پیکربندی Skills](/fa/tools/skills-config) — مرجع پیکربندی skill
- [فرمان‌های slash](/fa/tools/slash-commands) — همهٔ فرمان‌های slash موجود
