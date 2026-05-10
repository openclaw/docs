---
read_when:
    - افزودن یا تغییر Skills
    - تغییر کنترل دسترسی Skills، فهرست‌های مجاز، یا قواعد بارگذاری
    - درک تقدم Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: 'Skills: مدیریت‌شده در برابر فضای کاری، قواعد گیت‌گذاری، فهرست‌های مجاز عامل‌ها، و اتصال‌دهی پیکربندی'
title: Skills
x-i18n:
    generated_at: "2026-05-10T20:12:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw از پوشه‌های مهارت **سازگار با [AgentSkills](https://agentskills.io)** برای آموزش نحوه استفاده از ابزارها به عامل استفاده می‌کند. هر مهارت یک دایرکتوری است که شامل یک `SKILL.md` با frontmatter از نوع YAML و دستورالعمل‌هاست. OpenClaw مهارت‌های همراه‌شده و بازنویسی‌های محلی اختیاری را بارگذاری می‌کند، و آن‌ها را هنگام بارگذاری بر اساس محیط، پیکربندی و وجود باینری فیلتر می‌کند.

## مکان‌ها و اولویت

OpenClaw مهارت‌ها را از این منابع بارگذاری می‌کند، **با بالاترین اولویت در ابتدا**:

| #   | منبع                 | مسیر                             |
| --- | -------------------- | -------------------------------- |
| 1   | مهارت‌های فضای کاری  | `<workspace>/skills`             |
| 2   | مهارت‌های عامل پروژه | `<workspace>/.agents/skills`     |
| 3   | مهارت‌های عامل شخصی  | `~/.agents/skills`               |
| 4   | مهارت‌های مدیریت‌شده/محلی | `~/.openclaw/skills`             |
| 5   | مهارت‌های همراه      | همراه با نصب ارائه می‌شوند       |
| 6   | پوشه‌های مهارت اضافی | `skills.load.extraDirs` (پیکربندی) |

اگر نام یک مهارت تداخل داشته باشد، منبع با بالاترین اولویت برنده می‌شود.

دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI یکی از ریشه‌های مهارت OpenClaw نیست. در حالت harness کدکس، اجرای app-server محلی از خانه‌های کدکس جداگانه برای هر عامل استفاده می‌کند، بنابراین مهارت‌های شخصی Codex CLI به‌صورت ضمنی بارگذاری نمی‌شوند. برای فهرست‌برداری از آن‌ها از `openclaw migrate codex --dry-run` استفاده کنید و برای انتخاب دایرکتوری‌های مهارت با اعلان چک‌باکس تعاملی، پیش از کپی کردن آن‌ها به فضای کاری عامل فعلی OpenClaw، از `openclaw migrate codex` استفاده کنید. برای اجراهای غیرتعاملی، برای مهارت‌های دقیق مورد کپی، `--skill <name>` را تکرار کنید.

## مهارت‌های اختصاصی عامل در برابر مهارت‌های مشترک

در راه‌اندازی‌های **چندعاملی**، هر عامل فضای کاری خودش را دارد:

| دامنه               | مسیر                                        | قابل مشاهده برای              |
| ------------------- | ------------------------------------------- | ----------------------------- |
| اختصاصی عامل        | `<workspace>/skills`                        | فقط همان عامل                 |
| عامل پروژه          | `<workspace>/.agents/skills`                | فقط عامل همان فضای کاری       |
| عامل شخصی           | `~/.agents/skills`                          | همه عامل‌ها روی همان ماشین    |
| مدیریت‌شده/محلی مشترک | `~/.openclaw/skills`                        | همه عامل‌ها روی همان ماشین    |
| دایرکتوری‌های اضافی مشترک | `skills.load.extraDirs` (پایین‌ترین اولویت) | همه عامل‌ها روی همان ماشین    |

نام یکسان در چند مکان → منبع با بالاترین اولویت برنده می‌شود. فضای کاری بر عامل پروژه غلبه می‌کند، عامل پروژه بر عامل شخصی، عامل شخصی بر مدیریت‌شده/محلی، مدیریت‌شده/محلی بر همراه، و همراه بر دایرکتوری‌های اضافی.

## فهرست‌های مجاز مهارت عامل

**مکان** مهارت و **نمایانی** مهارت کنترل‌های جداگانه‌ای هستند. مکان/اولویت تعیین می‌کند کدام نسخه از یک مهارت هم‌نام برنده شود؛ فهرست‌های مجاز عامل تعیین می‌کنند عامل واقعاً از کدام مهارت‌ها می‌تواند استفاده کند.

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
    - برای به ارث بردن `agents.defaults.skills`، `agents.list[].skills` را حذف کنید.
    - برای نداشتن هیچ مهارتی، `agents.list[].skills: []` را تنظیم کنید.
    - یک فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** برای آن عامل است - با پیش‌فرض‌ها ادغام نمی‌شود.
    - فهرست مجاز مؤثر در سراسر ساخت اعلان، کشف فرمان‌های اسلش مهارت، همگام‌سازی sandbox و snapshotهای مهارت اعمال می‌شود.
  </Accordion>
</AccordionGroup>

## Pluginها و مهارت‌ها

Pluginها می‌توانند مهارت‌های خودشان را با فهرست کردن دایرکتوری‌های `skills` در `openclaw.plugin.json` ارسال کنند (مسیرها نسبت به ریشه Plugin هستند). مهارت‌های Plugin وقتی بارگذاری می‌شوند که Plugin فعال باشد. این محل مناسب برای راهنماهای عملیاتی خاص ابزار است که برای توضیح ابزار بیش از حد طولانی‌اند، اما هر زمان Plugin نصب است باید در دسترس باشند - برای مثال، Plugin مرورگر یک مهارت `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های مهارت Plugin در همان مسیر کم‌اولویت `skills.load.extraDirs` ادغام می‌شوند، بنابراین یک مهارت هم‌نام همراه، مدیریت‌شده، عامل یا فضای کاری آن‌ها را بازنویسی می‌کند. می‌توانید آن‌ها را از طریق `metadata.openclaw.requires.config` روی ورودی پیکربندی Plugin مقید کنید.

برای کشف/پیکربندی، [Pluginها](/fa/tools/plugin) را ببینید و برای سطح ابزاری که این مهارت‌ها آموزش می‌دهند، [ابزارها](/fa/tools) را ببینید.

## Skill Workshop

Plugin اختیاری و آزمایشی **Skill Workshop** می‌تواند از روی رویه‌های قابل استفاده مجدد که هنگام کار عامل مشاهده شده‌اند، مهارت‌های فضای کاری ایجاد یا به‌روزرسانی کند. به‌صورت پیش‌فرض غیرفعال است و باید صراحتاً از طریق `plugins.entries.skill-workshop` فعال شود.

Skill Workshop فقط در `<workspace>/skills` می‌نویسد، محتوای تولیدشده را اسکن می‌کند، از تأیید در انتظار یا نوشتن‌های امن خودکار پشتیبانی می‌کند، پیشنهادهای ناامن را قرنطینه می‌کند، و پس از نوشتن‌های موفق snapshot مهارت را تازه‌سازی می‌کند تا مهارت‌های جدید بدون راه‌اندازی دوباره Gateway در دسترس شوند.

از آن برای اصلاحاتی مانند _"دفعه بعد، انتساب GIF را بررسی کن"_ یا گردش‌کارهای به‌سختی به‌دست‌آمده مانند چک‌لیست‌های QA رسانه استفاده کنید. با تأیید در انتظار شروع کنید؛ نوشتن خودکار را فقط پس از بازبینی پیشنهادهایش، در فضاهای کاری مورد اعتماد استفاده کنید. راهنمای کامل: [Plugin Skill Workshop](/fa/plugins/skill-workshop).

## ClawHub (نصب و همگام‌سازی)

[ClawHub](https://clawhub.ai) رجیستری عمومی مهارت‌ها برای OpenClaw است. برای کشف/نصب/به‌روزرسانی از فرمان‌های بومی `openclaw skills` استفاده کنید، یا برای گردش‌کارهای انتشار/همگام‌سازی از CLI جداگانه `clawhub` استفاده کنید. راهنمای کامل:
[ClawHub](/fa/clawhub).

| اقدام                              | فرمان                                  |
| ---------------------------------- | -------------------------------------- |
| نصب یک مهارت در فضای کاری          | `openclaw skills install <skill-slug>` |
| به‌روزرسانی همه مهارت‌های نصب‌شده | `openclaw skills update --all`         |
| همگام‌سازی (اسکن + انتشار به‌روزرسانی‌ها) | `clawhub sync --all`                   |

`openclaw skills install` بومی در دایرکتوری `skills/` فضای کاری فعال نصب می‌کند. CLI جداگانه `clawhub` نیز در `./skills` زیر دایرکتوری کاری فعلی شما نصب می‌کند (یا به فضای کاری پیکربندی‌شده OpenClaw برمی‌گردد). OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` برمی‌دارد.
ریشه‌های مهارت پیکربندی‌شده همچنین از یک سطح گروه‌بندی، مانند `skills/<group>/<skill>/SKILL.md`، پشتیبانی می‌کنند، تا مهارت‌های شخص ثالث مرتبط بتوانند بدون اسکن بازگشتی گسترده زیر یک پوشه مشترک نگه داشته شوند.

کلاینت‌های Gateway که به تحویل خصوصی غیر ClawHub نیاز دارند می‌توانند یک آرشیو zip مهارت را با `skills.upload.begin`، `skills.upload.chunk` و `skills.upload.commit` آماده کنند، سپس آپلود commit‌شده را با `skills.install({ source: "upload", uploadId, slug, force?, sha256? })` نصب کنند. این یک مسیر آپلود مدیریتی صریح برای کلاینت‌های مورد اعتماد است، نه جریان معمول `openclaw skills install <slug>` یا نصب ClawHub. به‌صورت پیش‌فرض خاموش است و فقط وقتی کار می‌کند که `skills.install.allowUploadedArchives: true` در `openclaw.json` تنظیم شده باشد. حالت آپلود همچنان در دایرکتوری پیش‌فرض فضای کاری عامل `skills/<slug>` نصب می‌کند؛ نام پوشه داخلی آرشیو برای هدف نصب نهایی نادیده گرفته می‌شود.

صفحه‌های مهارت ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را با صفحه‌های جزئیات اسکنر برای VirusTotal، ClawScan و تحلیل ایستا نمایش می‌دهند. `openclaw skills install <slug>` فقط مسیر نصب باقی می‌ماند؛ منتشرکنندگان مثبت‌های کاذب را از طریق داشبورد ClawHub یا `clawhub skill rescan <slug>` بازیابی می‌کنند.

## امنیت

<Warning>
با مهارت‌های شخص ثالث مانند **کد غیرقابل اعتماد** رفتار کنید. پیش از فعال‌سازی آن‌ها را بخوانید. برای ورودی‌های غیرقابل اعتماد و ابزارهای پرریسک، اجراهای sandbox شده را ترجیح دهید. برای کنترل‌های سمت عامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Warning>

- کشف مهارت فضای کاری و دایرکتوری اضافی فقط ریشه‌های مهارت و فایل‌های `SKILL.md` را می‌پذیرد که realpath حل‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند.
- نصب‌های آرشیو خصوصی Gateway به‌صورت پیش‌فرض خاموش‌اند. وقتی صراحتاً فعال شوند، به یک آپلود zip commit‌شده نیاز دارند که شامل `SKILL.md` باشد و همان محافظت‌های استخراج آرشیو، پیمایش مسیر، symlink، force و rollback نصب‌های مهارت ClawHub را دوباره استفاده می‌کنند. آن‌ها با `skills.install.allowUploadedArchives` کنترل می‌شوند؛ نصب‌های معمول ClawHub به آن تنظیم نیاز ندارند.
- نصب‌های وابستگی مهارت مبتنی بر Gateway (`skills.install`، onboarding و UI تنظیمات Skills) پیش از اجرای metadata نصب‌کننده، اسکنر داخلی کد خطرناک را اجرا می‌کنند. یافته‌های `critical` به‌صورت پیش‌فرض مسدود می‌شوند مگر اینکه فراخوان صراحتاً بازنویسی خطرناک را تنظیم کند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند.
- `openclaw skills install <slug>` متفاوت است - یک پوشه مهارت ClawHub را در فضای کاری دانلود می‌کند و از مسیر metadata نصب‌کننده بالا استفاده نمی‌کند.
- `skills.entries.*.env` و `skills.entries.*.apiKey` اسرار را برای نوبت آن عامل به فرایند **میزبان** تزریق می‌کنند (نه sandbox). اسرار را از اعلان‌ها و لاگ‌ها دور نگه دارید.

برای مدل تهدید و چک‌لیست‌های گسترده‌تر، [امنیت](/fa/gateway/security) را ببینید.

## قالب SKILL.md

`SKILL.md` باید دست‌کم شامل موارد زیر باشد:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw برای چیدمان/هدف از مشخصات AgentSkills پیروی می‌کند. پارسری که توسط عامل تعبیه‌شده استفاده می‌شود فقط از کلیدهای frontmatter **تک‌خطی** پشتیبانی می‌کند؛ `metadata` باید یک **شیء JSON تک‌خطی** باشد. برای ارجاع به مسیر پوشه مهارت در دستورالعمل‌ها، از `{baseDir}` استفاده کنید.

### کلیدهای frontmatter اختیاری

<ParamField path="homepage" type="string">
  URL که در UI Skills در macOS به‌عنوان "وب‌سایت" نمایش داده می‌شود. همچنین از طریق `metadata.openclaw.homepage` پشتیبانی می‌شود.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌عنوان فرمان اسلش کاربر ارائه می‌شود.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های مهارت را از اعلان عادی عامل بیرون نگه می‌دارد. مهارت همچنان نصب است و وقتی `user-invocable` نیز `true` باشد، همچنان می‌تواند صراحتاً به‌عنوان فرمان اسلش اجرا شود.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، فرمان اسلش از مدل عبور نمی‌کند و مستقیماً به یک ابزار dispatch می‌شود.
</ParamField>
<ParamField path="command-tool" type="string">
  نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای dispatch ابزار، رشته آرگومان‌های خام را به ابزار ارسال می‌کند (بدون پارس core). ابزار با `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` فراخوانی می‌شود.
</ParamField>

## مقیدسازی (فیلترهای زمان بارگذاری)

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
  وقتی `true` باشد، همیشه مهارت را شامل کن (سایر دروازه‌ها را رد کن).
</ParamField>
<ParamField path="emoji" type="string">
  ایموجی اختیاری که UI مهارت‌های macOS از آن استفاده می‌کند.
</ParamField>
<ParamField path="homepage" type="string">
  URL اختیاری که در UI مهارت‌های macOS به‌عنوان «وب‌سایت» نشان داده می‌شود.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  فهرست اختیاری پلتفرم‌ها. اگر تنظیم شود، مهارت فقط روی آن سیستم‌عامل‌ها واجد شرایط است.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  هرکدام باید روی `PATH` وجود داشته باشند.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  دست‌کم یکی باید روی `PATH` وجود داشته باشد.
</ParamField>
<ParamField path="requires.env" type="string[]">
  متغیر محیطی باید وجود داشته باشد یا در پیکربندی ارائه شده باشد.
</ParamField>
<ParamField path="requires.config" type="string[]">
  فهرست مسیرهای `openclaw.json` که باید truthy باشند.
</ParamField>
<ParamField path="primaryEnv" type="string">
  نام متغیر محیطی مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مشخصات نصب‌کننده اختیاری که UI مهارت‌های macOS از آن‌ها استفاده می‌کند (brew/node/go/uv/download).
</ParamField>

اگر `metadata.openclaw` وجود نداشته باشد، مهارت همیشه واجد شرایط است (مگر اینکه
در پیکربندی غیرفعال شده باشد یا برای مهارت‌های همراه با `skills.allowBundled` مسدود شده باشد).

<Note>
بلوک‌های قدیمی `metadata.clawdbot` همچنان وقتی
`metadata.openclaw` وجود ندارد پذیرفته می‌شوند، بنابراین مهارت‌های نصب‌شده قدیمی
دروازه‌های وابستگی و راهنمایی‌های نصب‌کننده خود را حفظ می‌کنند. مهارت‌های جدید و به‌روزشده باید از
`metadata.openclaw` استفاده کنند.
</Note>

### نکته‌های Sandboxing

- `requires.bins` هنگام بارگذاری مهارت روی **میزبان** بررسی می‌شود.
- اگر یک عامل sandbox شده باشد، باینری باید **داخل کانتینر** هم وجود داشته باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand` (یا یک تصویر سفارشی) نصب کنید. `setupCommand` یک‌بار پس از ایجاد کانتینر اجرا می‌شود. نصب بسته‌ها همچنین به خروجی شبکه، FS ریشه قابل‌نوشتن، و کاربر root در sandbox نیاز دارد.
- مثال: مهارت `summarize` (`skills/summarize/SKILL.md`) برای اجرا در کانتینر sandbox به CLI `summarize` نیاز دارد.

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
    - اگر چند نصب‌کننده فهرست شده باشند، Gateway یک گزینه ترجیحی واحد انتخاب می‌کند (وقتی brew در دسترس باشد، brew؛ در غیر این صورت node).
    - اگر همه نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند تا بتوانید artifactهای موجود را ببینید.
    - مشخصات نصب‌کننده می‌تواند شامل `os: ["darwin"|"linux"|"win32"]` باشد تا گزینه‌ها را بر اساس پلتفرم فیلتر کند.
    - نصب‌های Node به `skills.install.nodeManager` در `openclaw.json` احترام می‌گذارند (پیش‌فرض: npm؛ گزینه‌ها: npm/pnpm/yarn/bun). این فقط بر نصب مهارت‌ها اثر می‌گذارد؛ runtime Gateway همچنان باید Node باشد - Bun برای WhatsApp/Telegram توصیه نمی‌شود.
    - انتخاب نصب‌کننده مبتنی بر Gateway بر پایه ترجیح است: وقتی مشخصات نصب انواع مختلف را ترکیب می‌کند، OpenClaw در صورت فعال بودن `skills.install.preferBrew` و وجود `brew`، Homebrew را ترجیح می‌دهد، سپس `uv`، سپس مدیر node پیکربندی‌شده، و بعد fallbackهای دیگر مانند `go` یا `download`.
    - اگر هر مشخصه نصب `download` باشد، OpenClaw به‌جای خلاصه کردن به یک نصب‌کننده ترجیحی، همه گزینه‌های دانلود را نمایش می‌دهد.

  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **نصب‌های Go:** اگر `go` موجود نباشد و `brew` در دسترس باشد، gateway ابتدا Go را از طریق Homebrew نصب می‌کند و در صورت امکان `GOBIN` را روی `bin` مربوط به Homebrew تنظیم می‌کند.
    - **نصب‌های دانلودی:** `url` (ضروری)، `archive` (`tar.gz` | `tar.bz2` | `zip`)، `extract` (پیش‌فرض: خودکار هنگام شناسایی archive)، `stripComponents`، `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## بازنویسی‌های پیکربندی

مهارت‌های همراه و مدیریت‌شده را می‌توان روشن/خاموش کرد و مقدارهای محیطی را
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
  `false` مهارت را غیرفعال می‌کند، حتی اگر همراه یا نصب‌شده باشد.
  مهارت همراه `coding-agent` نیازمند opt-in است: پیش از اینکه آن را در معرض عامل‌ها قرار دهید،
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید،
  سپس مطمئن شوید یکی از `claude`، `codex`، `opencode`، یا `pi` نصب شده و
  برای CLI خودش احراز هویت شده است.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  میان‌بری برای مهارت‌هایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند. از متن ساده یا SecretRef پشتیبانی می‌کند.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  فقط در صورتی تزریق می‌شود که متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>
<ParamField path="config" type="object">
  کیسه اختیاری برای فیلدهای سفارشی هر مهارت. کلیدهای سفارشی باید اینجا قرار بگیرند.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  allowlist اختیاری فقط برای مهارت‌های **همراه**. اگر تنظیم شود، فقط مهارت‌های همراه موجود در فهرست واجد شرایط هستند (مهارت‌های مدیریت‌شده/workspace تحت تأثیر قرار نمی‌گیرند).
</ParamField>

اگر نام مهارت شامل خط تیره باشد، کلید را در گیومه بگذارید (JSON5 کلیدهای
در گیومه را مجاز می‌داند). کلیدهای پیکربندی به‌طور پیش‌فرض با **نام مهارت** مطابقت دارند - اگر یک مهارت
`metadata.openclaw.skillKey` را تعریف کند، از همان کلید زیر `skills.entries` استفاده کنید.

<Note>
برای تولید/ویرایش تصویر stock داخل OpenClaw، به‌جای
یک مهارت همراه، از ابزار core
`image_generate` همراه با `agents.defaults.imageGenerationModel` استفاده کنید.
مثال‌های مهارت در اینجا برای workflowهای سفارشی یا شخص ثالث هستند.
برای تحلیل تصویر native از ابزار `image` همراه با
`agents.defaults.imageModel` استفاده کنید. اگر `openai/*`، `google/*`،
`fal/*`، یا مدل تصویر اختصاصی ارائه‌دهنده دیگری را انتخاب می‌کنید، کلید
احراز هویت/API همان ارائه‌دهنده را نیز اضافه کنید.
</Note>

## تزریق محیط

وقتی اجرای یک عامل شروع می‌شود، OpenClaw:

1. metadata مهارت را می‌خواند.
2. `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` را روی `process.env` اعمال می‌کند.
3. prompt سیستم را با مهارت‌های **واجد شرایط** می‌سازد.
4. پس از پایان اجرا، محیط اصلی را بازیابی می‌کند.

تزریق محیط **محدود به اجرای عامل** است، نه یک محیط shell
سراسری.

برای backend همراه `claude-cli`، OpenClaw همان snapshot
واجد شرایط را به‌صورت یک Plugin موقت Claude Code هم materialize می‌کند و آن را با
`--plugin-dir` می‌فرستد. سپس Claude Code می‌تواند از resolver مهارت native خود استفاده کند، در حالی که
OpenClaw همچنان مالک precedence، allowlistهای هر عامل، gating، و
تزریق کلید env/API مربوط به `skills.entries.*` است. سایر backendهای CLI فقط از
کاتالوگ prompt استفاده می‌کنند.

## Snapshotها و refresh

OpenClaw مهارت‌های واجد شرایط را **هنگام شروع یک session** snapshot می‌کند و
از همان فهرست برای نوبت‌های بعدی در همان session دوباره استفاده می‌کند. تغییرات
مهارت‌ها یا پیکربندی در session جدید بعدی اثر می‌گذارند.

مهارت‌ها در دو حالت می‌توانند میان session refresh شوند:

- watcher مهارت‌ها فعال باشد.
- یک node راه‌دور واجد شرایط جدید ظاهر شود.

این را مانند یک **hot reload** در نظر بگیرید: فهرست refresh شده در
نوبت بعدی عامل به کار گرفته می‌شود. اگر allowlist مؤثر مهارت‌های عامل برای آن
session تغییر کند، OpenClaw snapshot را refresh می‌کند تا مهارت‌های قابل مشاهده
با عامل فعلی هم‌راستا بمانند.

### Watcher مهارت‌ها

به‌طور پیش‌فرض، OpenClaw پوشه‌های مهارت را watch می‌کند و وقتی فایل‌های
`SKILL.md` تغییر کنند snapshot مهارت‌ها را bump می‌کند. زیر `skills.load` پیکربندی کنید:

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

از `allowSymlinkTargets` برای چیدمان‌های عمدی sibling-repo استفاده کنید که در آن‌ها ریشه
مهارت داخلی شامل symlink است، برای مثال
`~/.agents/skills/manager -> ~/Projects/manager/skills`. فهرست هدف پس از realpath resolution
مطابقت داده می‌شود و باید محدود بماند.

### nodeهای macOS راه‌دور (gateway لینوکسی)

اگر Gateway روی Linux اجرا شود اما یک **node macOS** با
`system.run` مجاز متصل باشد (امنیت Exec approvals روی `deny` تنظیم نشده باشد)،
OpenClaw می‌تواند مهارت‌های فقط macOS را وقتی باینری‌های لازم
روی آن node موجود باشند، واجد شرایط در نظر بگیرد. عامل باید آن مهارت‌ها را
از طریق ابزار `exec` با `host=node` اجرا کند.

این به گزارش node از پشتیبانی command و probe باینری
از طریق `system.which` یا `system.run` متکی است. nodeهای آفلاین
مهارت‌های فقط راه‌دور را قابل مشاهده نمی‌کنند. اگر یک node متصل از پاسخ دادن به probeهای باینری بازبماند،
OpenClaw تطابق‌های باینری cache شده آن را پاک می‌کند تا عامل‌ها دیگر
مهارت‌هایی را که در حال حاضر نمی‌توانند آنجا اجرا شوند نبینند.

## اثر توکن

وقتی مهارت‌ها واجد شرایط باشند، OpenClaw یک فهرست XML فشرده از مهارت‌های موجود
را به prompt سیستم تزریق می‌کند (از طریق `formatSkillsForPrompt` در
`pi-coding-agent`). هزینه deterministic است:

- **سربار پایه** (فقط وقتی ≥1 مهارت وجود دارد): 195 کاراکتر.
- **برای هر مهارت:** 97 کاراکتر + طول مقدارهای XML-escaped مربوط به `<name>`، `<description>`، و `<location>`.

فرمول (کاراکتر):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping کاراکترهای `& < > " '` را به entityها (`&amp;`، `&lt;`، و غیره)
گسترش می‌دهد و طول را افزایش می‌دهد. تعداد توکن‌ها بسته به tokenizer مدل متفاوت است. یک تخمین تقریبی
به سبک OpenAI حدود ۴ کاراکتر/توکن است، بنابراین **97 کاراکتر ≈ 24 توکن** برای هر
مهارت به‌علاوه طول واقعی فیلدهای شما.

## چرخه عمر مهارت‌های مدیریت‌شده

OpenClaw همراه install (بسته npm یا OpenClaw.app) یک مجموعه پایه از مهارت‌ها را به‌صورت **مهارت‌های همراه** ارائه می‌کند. `~/.openclaw/skills` برای
بازنویسی‌های محلی وجود دارد - برای مثال، pin کردن یا patch کردن یک مهارت بدون
تغییر نسخه همراه. مهارت‌های workspace متعلق به کاربر هستند و در تعارض نام
هر دو را override می‌کنند.

## دنبال مهارت‌های بیشتری هستید؟

[https://clawhub.ai](https://clawhub.ai) را مرور کنید. schema کامل پیکربندی:
[پیکربندی Skills](/fa/tools/skills-config).

## مرتبط

- [ClawHub](/fa/clawhub) - رجیستری عمومی مهارت‌ها
- [ایجاد مهارت‌ها](/fa/tools/creating-skills) - ساخت مهارت‌های سفارشی
- [Plugins](/fa/tools/plugin) - نمای کلی سیستم Plugin
- [Plugin کارگاه مهارت](/fa/plugins/skill-workshop) - تولید مهارت‌ها از کار عامل
- [پیکربندی Skills](/fa/tools/skills-config) - مرجع پیکربندی مهارت
- [دستورهای slash](/fa/tools/slash-commands) - همه دستورهای slash موجود
