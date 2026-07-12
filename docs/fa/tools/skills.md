---
read_when:
    - افزودن یا تغییر Skills
    - تغییر محدودسازی Skills، فهرست‌های مجاز یا قواعد بارگذاری
    - درک اولویت Skills و رفتار اسنپ‌شات
sidebarTitle: Skills
summary: Skills به عامل شما می‌آموزند چگونه از ابزارها استفاده کند. با نحوهٔ بارگذاری آن‌ها، سازوکار اولویت‌بندی و چگونگی پیکربندی کنترل دسترسی، فهرست‌های مجاز و تزریق متغیرهای محیطی آشنا شوید.
title: Skills
x-i18n:
    generated_at: "2026-07-12T10:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills فایل‌های دستورالعمل Markdown هستند که به عامل می‌آموزند چگونه و چه زمانی از
ابزارها استفاده کند. هر Skill در دایرکتوری‌ای قرار دارد که شامل یک فایل `SKILL.md` با
frontmatter از نوع YAML و بدنه‌ای از نوع Markdown است. OpenClaw، Skills همراه را به‌علاوه
هرگونه بازنویسی محلی بارگذاری می‌کند و هنگام بارگذاری، آن‌ها را بر اساس محیط، پیکربندی و
وجود فایل‌های اجرایی فیلتر می‌کند.

<CardGroup cols={2}>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    یک Skill سفارشی را از ابتدا بسازید و آزمایش کنید.
  </Card>
  <Card title="کارگاه Skill" href="/fa/tools/skill-workshop" icon="flask">
    پیشنهادهای Skill تهیه‌شده توسط عامل را بازبینی و تأیید کنید.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*` و فهرست‌های مجاز عامل.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills جامعه را مرور و نصب کنید.
  </Card>
</CardGroup>

## ترتیب بارگذاری

OpenClaw از منابع زیر بارگذاری می‌کند؛ **ابتدا بالاترین اولویت**. هنگامی که نام یک
Skill در چند مکان ظاهر شود، منبع دارای بالاترین اولویت برنده می‌شود.

| اولویت       | منبع                         | مسیر                                    |
| ------------ | ---------------------------- | --------------------------------------- |
| ۱ — بالاترین | Skills فضای کاری             | `<workspace>/skills`                    |
| ۲            | Skills عامل پروژه            | `<workspace>/.agents/skills`            |
| ۳            | Skills شخصی عامل             | `~/.agents/skills`                      |
| ۴            | Skills مدیریت‌شده / محلی     | `~/.openclaw/skills`                    |
| ۵            | Skills همراه                 | همراه با نصب ارائه می‌شود               |
| ۶ — پایین‌ترین | دایرکتوری‌های اضافی        | `skills.load.extraDirs` + Skills افزونه |

ریشه‌های Skill از چیدمان‌های گروه‌بندی‌شده پشتیبانی می‌کنند. OpenClaw هرجا که
`SKILL.md` در زیر یک ریشه پیکربندی‌شده ظاهر شود، آن Skill را شناسایی می‌کند
(تا عمق ۶ سطح):

```text
<workspace>/skills/research/SKILL.md          ✓ با نام "research" یافت شد
<workspace>/skills/personal/research/SKILL.md ✓ این نیز با نام "research" یافت شد
```

مسیر پوشه فقط برای سازمان‌دهی است. نام Skill و فرمان اسلش آن از فیلد `name` در
frontmatter می‌آید (یا اگر `name` وجود نداشته باشد، از نام دایرکتوری). فهرست‌های مجاز
عامل (در ادامه) نیز بر اساس همین `name` تطبیق داده می‌شوند.

<Note>
  دایرکتوری بومی `$CODEX_HOME/skills` در Codex CLI، ریشه Skill در OpenClaw
  **نیست**. برای فهرست‌برداری از آن Skills از `openclaw migrate plan codex` استفاده کنید،
  سپس با `openclaw migrate codex` آن‌ها را در فضای کاری OpenClaw خود کپی کنید.
</Note>

## Skills میزبانی‌شده روی Node

یک Node بدون رابط گرافیکیِ متصل می‌تواند Skills نصب‌شده در دایرکتوری فعال Skills در
OpenClaw خود را منتشر کند (`~/.openclaw/skills` به‌طور پیش‌فرض؛ بازنویسی‌های محیطی
پروفایل اعمال می‌شوند). این Skills تا زمانی که Node متصل است، در فهرست عادی Skills عامل
ظاهر می‌شوند و پس از قطع اتصال ناپدید می‌شوند. در صورت تداخل نام، Skill محلی یا Gateway
نام خود را حفظ می‌کند؛ Skill مربوط به Node نامی قطعی با پیشوند Node دریافت می‌کند.
نسخه ۱ Skills میزبانی‌شده روی Node مستلزم آن است که نام دایرکتوری با فیلد `name` در
frontmatter آن Skill مطابقت داشته باشد.

ورودی Skill شامل مکان‌یاب Node است. فایل‌ها، ارجاعات نسبی و فایل‌های اجرایی آن روی Node
قرار دارند؛ بنابراین آن را با `exec host=node node=<node-id>` بارگذاری و اجرا کنید.
پس از تغییر فایل‌های Skill، میزبان Node را راه‌اندازی مجدد کنید. برای جفت‌سازی و
کلیدهای غیرفعال‌سازی، به [Nodeها](/fa/nodes#node-hosted-skills) مراجعه کنید.

## Skills مختص هر عامل در برابر Skills مشترک

در راه‌اندازی‌های چندعاملی، هر عامل فضای کاری خودش را دارد. از مسیری استفاده کنید که
با سطح دسترسی موردنظر شما مطابقت دارد:

| دامنه             | مسیر                         | قابل مشاهده برای                  |
| ----------------- | ---------------------------- | --------------------------------- |
| مختص هر عامل      | `<workspace>/skills`         | فقط همان عامل                     |
| عامل پروژه        | `<workspace>/.agents/skills` | فقط عامل همان فضای کاری           |
| عامل شخصی         | `~/.agents/skills`           | همه عامل‌های این دستگاه           |
| مدیریت‌شده مشترک  | `~/.openclaw/skills`         | همه عامل‌های این دستگاه           |
| دایرکتوری‌های اضافی | `skills.load.extraDirs`    | همه عامل‌های این دستگاه           |

## فهرست‌های مجاز عامل

**محل** Skill (اولویت) و **قابلیت مشاهده** Skill (اینکه کدام عامل می‌تواند از آن
استفاده کند) کنترل‌های جداگانه‌ای هستند. صرف‌نظر از اینکه Skills از کجا بارگذاری
می‌شوند، برای محدودکردن Skills قابل مشاهده برای هر عامل از فهرست‌های مجاز استفاده کنید.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // خط مبنای مشترک
    },
    list: [
      { id: "writer" }, // github و weather را به ارث می‌برد
      { id: "docs", skills: ["docs-search"] }, // پیش‌فرض‌ها را کاملاً جایگزین می‌کند
      { id: "locked-down", skills: [] }, // بدون Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="قواعد فهرست مجاز">
    - برای اینکه همه Skills به‌طور پیش‌فرض بدون محدودیت باقی بمانند، `agents.defaults.skills` را حذف کنید.
    - برای به‌ارث‌بردن `agents.defaults.skills`، مقدار `agents.list[].skills` را حذف کنید.
    - برای اینکه هیچ Skill در معرض دید آن عامل قرار نگیرد، `agents.list[].skills: []` را تنظیم کنید.
    - فهرست غیرخالی `agents.list[].skills` مجموعه **نهایی** است و با پیش‌فرض‌ها
      ادغام نمی‌شود.
    - فهرست مجاز مؤثر در ساخت پرامپت، شناسایی فرمان اسلش، همگام‌سازی محیط ایزوله
      و عکس‌های فوری Skill اعمال می‌شود.
    - این یک مرز مجوزدهی پوسته میزبان نیست. اگر همان عامل می‌تواند از `exec`
      استفاده کند، آن پوسته را جداگانه با محیط ایزوله، جداسازی کاربر سیستم‌عامل،
      فهرست‌های منع/مجاز `exec` و اعتبارنامه‌های مختص هر منبع محدود کنید.
  </Accordion>
</AccordionGroup>

## Pluginها و Skills

Pluginها می‌توانند با فهرست‌کردن دایرکتوری‌های `skills` در
`openclaw.plugin.json` (مسیرهای نسبی به ریشه Plugin)، Skills خود را ارائه کنند.
Skills یک Plugin هنگام فعال‌شدن آن Plugin بارگذاری می‌شوند؛ برای مثال، Plugin مرورگر
یک Skill به نام `browser-automation` برای کنترل چندمرحله‌ای مرورگر ارائه می‌کند.

دایرکتوری‌های Skill مربوط به Plugin در همان سطح کم‌اولویت `skills.load.extraDirs`
ادغام می‌شوند؛ بنابراین یک Skill هم‌نامِ همراه، مدیریت‌شده، عامل یا فضای کاری بر آن‌ها
اولویت دارد. شرایط واجد صلاحیت بودن Skill خود Plugin را از طریق
`metadata.openclaw.requires` در frontmatter آن تعیین کنید، درست مانند هر Skill دیگر.

برای سامانه کامل Plugin به [Pluginها](/fa/tools/plugin) و [ابزارها](/fa/tools) مراجعه کنید.

## کارگاه Skill

[کارگاه Skill](/fa/tools/skill-workshop) صف پیشنهادی میان عامل و فایل‌های Skill فعال شما
است. هنگامی که عامل کار قابل‌استفاده مجددی را شناسایی کند، به‌جای نوشتن مستقیم در
`SKILL.md` یک پیشنهاد پیش‌نویس می‌کند. پیش از هر تغییری، شما آن را بازبینی و تأیید
می‌کنید.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه عمر کامل، مرجع CLI و پیکربندی، به
[کارگاه Skill](/fa/tools/skill-workshop) مراجعه کنید.

## نصب از ClawHub

[ClawHub](https://clawhub.ai) رجیستری عمومی Skills است. برای نصب و به‌روزرسانی از
فرمان‌های `openclaw skills` و برای انتشار و همگام‌سازی از CLI مربوط به `clawhub`
استفاده کنید.

| اقدام                                  | فرمان                                                   |
| -------------------------------------- | ------------------------------------------------------- |
| نصب یک Skill در فضای کاری              | `openclaw skills install @owner/<slug>`                 |
| نصب از مخزن Git                        | `openclaw skills install git:owner/repo@ref`            |
| نصب یک دایرکتوری محلی Skill            | `openclaw skills install ./path/to/skill --as my-tool`  |
| نصب برای همه عامل‌های محلی             | `openclaw skills install @owner/<slug> --global`        |
| به‌روزرسانی همه Skills فضای کاری       | `openclaw skills update --all`                          |
| به‌روزرسانی یک Skill مدیریت‌شده مشترک  | `openclaw skills update @owner/<slug> --global`         |
| به‌روزرسانی همه Skills مدیریت‌شده مشترک | `openclaw skills update --all --global`                |
| تأیید محدوده اعتماد یک Skill           | `openclaw skills verify @owner/<slug>`                  |
| چاپ کارت Skill تولیدشده                | `openclaw skills verify @owner/<slug> --card`           |
| انتشار / همگام‌سازی از طریق CLI مربوط به ClawHub | `clawhub sync --all`                           |

<AccordionGroup>
  <Accordion title="جزئیات نصب">
    `openclaw skills install` به‌طور پیش‌فرض در دایرکتوری `skills/` فضای کاری فعال
    نصب می‌کند. برای نصب در دایرکتوری مشترک `~/.openclaw/skills`، گزینه `--global`
    را اضافه کنید؛ این دایرکتوری برای همه عامل‌های محلی قابل مشاهده است، مگر اینکه
    فهرست‌های مجاز عامل آن را محدود کنند.

    نصب‌های Git و محلی انتظار دارند `SKILL.md` در ریشه منبع باشد. نامک ابتدا، در صورت
    معتبر بودن، از `name` در frontmatter فایل `SKILL.md` گرفته می‌شود و سپس به نام
    دایرکتوری یا مخزن بازمی‌گردد. برای بازنویسی از `--as <slug>` استفاده کنید.
    `openclaw skills update` فقط نصب‌های ClawHub را ردیابی می‌کند؛ برای تازه‌سازی منابع
    Git یا محلی، آن‌ها را دوباره نصب کنید.

  </Accordion>
  <Accordion title="تأیید و اسکن امنیتی">
    `openclaw skills verify @owner/<slug>` محدوده اعتماد
    `clawhub.skill.verify.v1` مربوط به Skill را از ClawHub درخواست می‌کند. Skills
    نصب‌شده از ClawHub بر اساس نسخه و رجیستری ثبت‌شده در `.clawhub/origin.json`
    تأیید می‌شوند. نامک‌های بدون مالک برای Skills نصب‌شده موجود یا بدون ابهام همچنان
    پذیرفته می‌شوند، اما ارجاعات واجد نام مالک از ابهام درباره ناشر جلوگیری می‌کنند.

    صفحات Skill در ClawHub پیش از نصب، آخرین وضعیت اسکن امنیتی را همراه با صفحات
    جزئیات برای VirusTotal، ClawScan و تحلیل ایستا نمایش می‌دهند. هنگامی که ClawHub
    تأیید را ناموفق علامت‌گذاری کند، فرمان با کد خروجی غیرصفر پایان می‌یابد. ناشران
    می‌توانند موارد مثبت کاذب را از طریق داشبورد ClawHub یا
    `clawhub skill rescan @owner/<slug>` برطرف کنند.

  </Accordion>
  <Accordion title="نصب بایگانی خصوصی">
    کلاینت‌های Gateway که به تحویل خارج از ClawHub نیاز دارند، می‌توانند یک بایگانی
    فشرده Skill را با `skills.upload.begin`، `skills.upload.chunk` و
    `skills.upload.commit` آماده کنند و سپس آن را با
    `skills.install({ source: "upload", ... })` نصب کنند. این مسیر به‌طور پیش‌فرض
    غیرفعال است و به `skills.install.allowUploadedArchives: true` در
    `openclaw.json` نیاز دارد. نصب‌های عادی ClawHub هرگز به این تنظیم نیاز ندارند.
  </Accordion>
</AccordionGroup>

## امنیت

<Warning>
  Skills شخص ثالث را **کد نامطمئن** در نظر بگیرید. پیش از فعال‌سازی، آن‌ها را بخوانید.
  برای ورودی‌های نامطمئن و ابزارهای پرخطر، اجرای ایزوله را ترجیح دهید. برای کنترل‌های
  سمت عامل، به [محیط ایزوله](/fa/gateway/sandboxing) مراجعه کنید.
</Warning>

<AccordionGroup>
  <Accordion title="محدودسازی مسیر">
    شناسایی Skill در فضای کاری، عامل پروژه و دایرکتوری اضافی فقط ریشه‌های Skill را
    می‌پذیرد که مسیر واقعی resolve‌شده آن‌ها داخل ریشه پیکربندی‌شده باقی بماند، مگر
    اینکه `skills.load.allowSymlinkTargets` صراحتاً یک ریشه مقصد را مورد اعتماد
    قرار دهد. کارگاه Skill فقط زمانی از طریق آن مقصدهای مورد اعتماد می‌نویسد که
    `skills.workshop.allowSymlinkTargetWrites` فعال باشد.
    دایرکتوری مدیریت‌شده `~/.openclaw/skills` و دایرکتوری شخصی
    `~/.agents/skills` ممکن است شامل پوشه‌های Skill دارای پیوند نمادین باشند، اما
    مسیر واقعی هر `SKILL.md` همچنان باید داخل دایرکتوری resolve‌شده Skill خودش باقی
    بماند.
  </Accordion>
  <Accordion title="سیاست نصب اپراتور">
    `security.installPolicy` را پیکربندی کنید تا پیش از ادامه نصب Skills، یک فرمان
    سیاست محلی مورد اعتماد اجرا شود. این سیاست فراداده و مسیر منبع آماده‌شده را دریافت
    می‌کند، بر مسیرهای ClawHub، بارگذاری‌شده، Git، محلی، به‌روزرسانی و نصب‌کننده
    وابستگی اعمال می‌شود و اگر فرمان نتواند تصمیم معتبری بازگرداند، به‌صورت بسته
    شکست می‌خورد.
  </Accordion>
  <Accordion title="دامنه تزریق اسرار">
    `skills.entries.*.env` و `skills.entries.*.apiKey` اسرار را فقط برای همان نوبت
    عامل به فرایند **میزبان** تزریق می‌کنند، نه به محیط ایزوله. اسرار را از پرامپت‌ها
    و گزارش‌ها دور نگه دارید.
  </Accordion>
</AccordionGroup>

برای مدل تهدید گسترده‌تر و چک‌لیست‌های امنیتی، به
[امنیت](/fa/gateway/security) مراجعه کنید.

## قالب SKILL.md

هر Skill دست‌کم به `name` و `description` در frontmatter نیاز دارد:

```markdown
---
name: image-lab
description: تولید یا ویرایش تصاویر از طریق گردش‌کار تصویر متکی به ارائه‌دهنده
---

هنگامی که کاربر درخواست تولید تصویر می‌کند، از ابزار `image_generate` استفاده کنید...
```

<Note>
  OpenClaw از مشخصات [AgentSkills](https://agentskills.io) پیروی می‌کند. Frontmatter
  ابتدا به‌صورت YAML تجزیه می‌شود؛ اگر این کار ناموفق باشد، به تجزیه‌گری محدود به
  یک خط بازمی‌گردد. بلوک‌های تودرتوی `metadata` (از جمله نگاشت‌های چندخطی YAML)
  به یک رشتهٔ JSON مسطح و دوباره به‌صورت JSON5 تجزیه می‌شوند، بنابراین قالب بلوکی
  نمایش‌داده‌شده در بخش [شرط‌گذاری](#gating) کار می‌کند. برای ارجاع به مسیر پوشهٔ
  مهارت در بدنه، از `{baseDir}` استفاده کنید.
</Note>

### کلیدهای اختیاری frontmatter

<ParamField path="homepage" type="string">
  نشانی اینترنتی که در رابط Skills در macOS با عنوان "Website" نمایش داده می‌شود.
  از طریق `metadata.openclaw.homepage` نیز پشتیبانی می‌شود.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  وقتی `true` باشد، مهارت به‌صورت یک فرمان اسلش قابل فراخوانی توسط کاربر ارائه می‌شود.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  وقتی `true` باشد، OpenClaw دستورالعمل‌های مهارت را از پرامپت عادی عامل کنار
  می‌گذارد. اگر `user-invocable` نیز `true` باشد، مهارت همچنان به‌صورت فرمان
  اسلش در دسترس است.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  وقتی روی `tool` تنظیم شود، فرمان اسلش مدل را دور می‌زند و مستقیماً به یک ابزار
  ثبت‌شده ارسال می‌شود.
</ParamField>

<ParamField path="command-tool" type="string">
  نام ابزاری که هنگام تنظیم `command-dispatch: tool` باید فراخوانی شود.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  برای ارسال به ابزار، رشتهٔ خام آرگومان‌ها را بدون تجزیهٔ هسته به ابزار منتقل
  می‌کند. ابزار این مقدار را دریافت می‌کند:
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## شرط‌گذاری

OpenClaw هنگام بارگذاری، مهارت‌ها را با استفاده از `metadata.openclaw` فیلتر
می‌کند (یک شیء JSON5 جاسازی‌شده در frontmatter؛ یادداشت تجزیه در بالا را ببینید).
مهارتی که بلوک `metadata.openclaw` ندارد، همیشه واجد شرایط است، مگر اینکه
صراحتاً غیرفعال شده باشد.

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
  وقتی `true` باشد، همیشه مهارت را شامل می‌کند و همهٔ شرط‌های دیگر را نادیده می‌گیرد.
</ParamField>

<ParamField path="emoji" type="string">
  ایموجی اختیاری که در رابط Skills در macOS نمایش داده می‌شود.
</ParamField>

<ParamField path="homepage" type="string">
  نشانی اینترنتی اختیاری که در رابط Skills در macOS با عنوان "Website" نمایش داده می‌شود.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  فیلتر پلتفرم. در صورت تنظیم، مهارت فقط در سیستم‌عامل‌های فهرست‌شده واجد شرایط است.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  هر فایل اجرایی باید در `PATH` موجود باشد.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  دست‌کم یکی از فایل‌های اجرایی باید در `PATH` موجود باشد.
</ParamField>

<ParamField path="requires.env" type="string[]">
  هر متغیر محیطی باید در فرایند موجود باشد یا از طریق پیکربندی ارائه شود.
</ParamField>

<ParamField path="requires.config" type="string[]">
  مقدار هر مسیر `openclaw.json` باید درست‌نما باشد.
</ParamField>

<ParamField path="primaryEnv" type="string">
  نام متغیر محیطی مرتبط با `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مشخصات اختیاری نصب‌کننده که رابط Skills در macOS از آن استفاده می‌کند
  (brew / node / go / uv / download).
</ParamField>

<Note>
  وقتی `metadata.openclaw` وجود نداشته باشد، بلوک‌های قدیمی
  `metadata.clawdbot` همچنان پذیرفته می‌شوند تا مهارت‌های قدیمی نصب‌شده،
  شرط‌های وابستگی و راهنمایی‌های نصب‌کنندهٔ خود را حفظ کنند. مهارت‌های جدید
  باید از `metadata.openclaw` استفاده کنند.
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
    - وقتی چند نصب‌کننده فهرست شده باشند، Gateway یک گزینهٔ ترجیحی را انتخاب
      می‌کند (در صورت دسترسی brew، و در غیر این صورت node).
    - اگر همهٔ نصب‌کننده‌ها `download` باشند، OpenClaw هر ورودی را فهرست می‌کند
      تا بتوانید همهٔ مصنوعات موجود را ببینید.
    - مشخصات می‌توانند برای فیلتر بر اساس پلتفرم شامل
      `os: ["darwin"|"linux"|"win32"]` باشند.
    - نصب‌های Node از `skills.install.nodeManager` در `openclaw.json` پیروی
      می‌کنند (پیش‌فرض: npm؛ گزینه‌ها: npm / pnpm / yarn / bun). این فقط بر
      نصب مهارت‌ها تأثیر می‌گذارد؛ محیط اجرای Gateway همچنان باید Node باشد.
    - ترتیب ترجیح نصب‌کننده در Gateway: Homebrew ← uv ← مدیر node پیکربندی‌شده
      ← go ← download.
  </Accordion>
  <Accordion title="جزئیات هر نصب‌کننده">
    - **Homebrew:** ‏OpenClaw، ‏Homebrew را به‌طور خودکار نصب نمی‌کند و فرمول‌های
      brew را به فرمان‌های بستهٔ سیستم تبدیل نمی‌کند. در کانتینرهای Linux فاقد
      `brew`، نصب‌کننده‌های صرفاً brew پنهان می‌شوند؛ از یک تصویر سفارشی
      استفاده کنید یا وابستگی را به‌صورت دستی نصب کنید.
    - **Go:** ‏OpenClaw برای نصب خودکار مهارت‌ها به Go نسخهٔ 1.21 یا جدیدتر
      نیاز دارد. اگر `go` موجود نباشد و Homebrew در دسترس باشد، OpenClaw ابتدا
      Go را از طریق Homebrew نصب می‌کند؛ در Linux فاقد Homebrew، می‌تواند در
      عوض از `apt-get` با کاربر root یا از طریق `sudo` بدون گذرواژه استفاده کند،
      مشروط بر اینکه بستهٔ پیشنهادی و تازه‌سازی‌شدهٔ `golang-go` حداقل نسخه را
      برآورده کند. فرمان واقعی `go install` برای وابستگی، همیشه به یک پوشهٔ
      اختصاصی فایل‌های اجرایی تحت مدیریت OpenClaw اشاره می‌کند (`bin` مربوط به
      Homebrew در نصب تازه، وگرنه `~/.local/bin`) و نه `GOBIN` پیکربندی‌شدهٔ
      شما — متغیرهای محیطی `GOBIN`،‏ `GOPATH` و `GOTOOLCHAIN` شما خوانده
      می‌شوند، اما هرگز بازنویسی نمی‌شوند.
    - **بارگیری:** `url` (الزامی)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (پیش‌فرض: خودکار هنگام تشخیص بایگانی)، `stripComponents`،
      `targetDir` (پیش‌فرض: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="نکات محیط ایزوله">
    وجود `requires.bins` هنگام بارگذاری مهارت روی **میزبان** بررسی می‌شود. اگر
    عامل در یک محیط ایزوله اجرا شود، فایل اجرایی باید **داخل کانتینر** نیز
    موجود باشد. آن را از طریق `agents.defaults.sandbox.docker.setupCommand`
    یا یک تصویر سفارشی نصب کنید. `setupCommand` پس از ایجاد کانتینر یک‌بار اجرا
    می‌شود و به دسترسی خروجی شبکه، سیستم فایل ریشهٔ قابل نوشتن و کاربر root در
    محیط ایزوله نیاز دارد.
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
  مقدار `false` مهارت را حتی اگر همراه یا نصب‌شده باشد، غیرفعال می‌کند. مهارت
  همراه `coding-agent` نیازمند فعال‌سازی صریح است — مقدار
  `skills.entries.coding-agent.enabled: true` را تنظیم کنید و مطمئن شوید یکی
  از `claude`،‏ `codex`،‏ `opencode` یا یک CLI پشتیبانی‌شدهٔ دیگر نصب شده و
  احراز هویت شده است.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  فیلدی تسهیل‌کننده برای مهارت‌هایی که `metadata.openclaw.primaryEnv` را اعلام
  می‌کنند. از یک رشتهٔ متن ساده یا یک شیء SecretRef پشتیبانی می‌کند.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای عامل. فقط زمانی تزریق می‌شوند که متغیر
  از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="config" type="object">
  مجموعه‌ای اختیاری برای فیلدهای پیکربندی سفارشی هر مهارت.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  فهرست مجاز اختیاری فقط برای مهارت‌های **همراه**. در صورت تنظیم، فقط
  مهارت‌های همراه موجود در فهرست واجد شرایط هستند. مهارت‌های مدیریت‌شده و
  فضای‌کار تحت تأثیر قرار نمی‌گیرند.
</ParamField>

<Note>
  کلیدهای پیکربندی به‌طور پیش‌فرض با **نام مهارت** مطابقت دارند. اگر مهارتی
  `metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان کلید زیر
  `skills.entries` استفاده کنید. نام‌های خط‌تیره‌دار را داخل نقل‌قول قرار دهید:
  JSON5 کلیدهای نقل‌قول‌شده را مجاز می‌داند.
</Note>

## تزریق محیط

هنگام شروع اجرای یک عامل، OpenClaw:

<Steps>
  <Step title="فرادادهٔ مهارت را می‌خواند">
    OpenClaw فهرست مؤثر مهارت‌ها را برای عامل تعیین می‌کند و قواعد شرط‌گذاری،
    فهرست‌های مجاز و بازنویسی‌های پیکربندی را اعمال می‌کند.
  </Step>
  <Step title="متغیرهای محیطی و کلیدهای API را تزریق می‌کند">
    `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` در طول اجرا روی
    `process.env` اعمال می‌شوند.
  </Step>
  <Step title="پرامپت سیستم را می‌سازد">
    مهارت‌های واجد شرایط در یک بلوک فشردهٔ XML گردآوری و به پرامپت سیستم تزریق
    می‌شوند.
  </Step>
  <Step title="محیط را بازیابی می‌کند">
    پس از پایان اجرا، محیط اصلی بازیابی می‌شود.
  </Step>
</Steps>

<Warning>
  تزریق محیط فقط به اجرای عامل روی **میزبان** محدود است، نه محیط ایزوله. درون
  محیط ایزوله، `env` و `apiKey` اثری ندارند. برای چگونگی انتقال اطلاعات محرمانه
  به اجراهای ایزوله، بخش
  [پیکربندی Skills](/fa/tools/skills-config#sandboxed-skills-and-env-vars) را ببینید.
</Warning>

برای زیرسامانهٔ همراه `claude-cli`، ‏OpenClaw همان تصویر لحظه‌ای مهارت‌های واجد
شرایط را نیز به‌صورت یک افزونهٔ موقت Claude Code ایجاد می‌کند و آن را از طریق
`--plugin-dir` منتقل می‌کند. سایر زیرسامانه‌های CLI فقط از فهرست پرامپت استفاده
می‌کنند.

## تصاویر لحظه‌ای و تازه‌سازی

OpenClaw مهارت‌های واجد شرایط را **هنگام شروع یک نشست** ثبت می‌کند و همان فهرست
را برای همهٔ نوبت‌های بعدی نشست دوباره به کار می‌برد. تغییرات مهارت‌ها یا
پیکربندی در نشست جدید بعدی اعمال می‌شوند.

Skills در دو حالت میان نشست تازه‌سازی می‌شوند:

- ناظر مهارت‌ها تغییری در `SKILL.md` تشخیص دهد.
- یک node راه‌دور واجد شرایط جدید متصل شود.

فهرست تازه‌شده در نوبت بعدی عامل به کار گرفته می‌شود. اگر فهرست مجاز مؤثر عامل
تغییر کند، OpenClaw تصویر لحظه‌ای را تازه‌سازی می‌کند تا مهارت‌های قابل مشاهده
هم‌تراز بمانند.

<AccordionGroup>
  <Accordion title="ناظر Skills">
    OpenClaw به‌طور پیش‌فرض پوشه‌های مهارت را زیر نظر می‌گیرد و هنگام تغییر
    فایل‌های `SKILL.md`، تصویر لحظه‌ای را به‌روز می‌کند. آن را زیر
    `skills.load` پیکربندی کنید:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    برای چیدمان‌های پیوند نمادین عمدی که در آن پیوند نمادین ریشهٔ یک مهارت به
    خارج از ریشهٔ پیکربندی‌شده اشاره می‌کند، از `allowSymlinkTargets` استفاده
    کنید؛ برای مثال:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    گزینهٔ `skills.workshop.allowSymlinkTargetWrites` را فقط زمانی فعال کنید
    که Skill Workshop باید پیشنهادها را از طریق همان مسیرهای پیوند نمادین
    مورد اعتماد نیز اعمال کند.

  </Accordion>
  <Accordion title="nodeهای راه‌دور macOS ‏(Gateway در Linux)">
    اگر Gateway روی Linux اجرا شود، اما یک **node مبتنی بر macOS** با مجوز
    `system.run` متصل باشد، OpenClaw می‌تواند مهارت‌های مختص macOS را در صورتی
    واجد شرایط بداند که فایل‌های اجرایی لازم روی آن node موجود باشند. عامل باید
    آن مهارت‌ها را با ابزار `exec` و `host=node` اجرا کند.

    nodeهای آفلاین، مهارت‌های صرفاً راه‌دور را قابل مشاهده **نمی‌کنند**. اگر
    node پاسخ‌گویی به کاوش‌های فایل اجرایی را متوقف کند، OpenClaw تطابق‌های
    فایل اجرایی ذخیره‌شدهٔ آن را پاک می‌کند.

  </Accordion>
</AccordionGroup>

## تأثیر بر توکن‌ها

وقتی مهارت‌ها واجد شرایط باشند، OpenClaw یک بلوک فشردهٔ XML را به پرامپت سیستم
تزریق می‌کند. هزینه قطعی است و برای هر مهارت به‌صورت خطی افزایش می‌یابد:

- **سربار پایه** (فقط وقتی بیش از صفر مهارت واجد شرایط باشد): یک بلوک ثابت از
  متن مقدماتی به‌همراه پوشش `<available_skills>`.
- **برای هر مهارت:** حدود ۹۷ نویسه به‌اضافهٔ طول فیلدهای `name`،‏ `description`
  و `location` شما.
- نویسه‌گریزی XML، نویسه‌های `& < > " '` را به موجودیت‌ها تبدیل می‌کند و برای
  هر رخداد چند نویسه می‌افزاید.
- با نسبت تقریبی ۴ نویسه به‌ازای هر توکن، ۹۷ نویسه پیش از محاسبهٔ طول فیلدها
  تقریباً برابر با ۲۴ توکن برای هر مهارت است.

اگر بلوک رندرشده از بودجه پیکربندی‌شده پرامپت
(`skills.limits.maxSkillsPromptChars`) فراتر برود، OpenClaw ابتدا تا حدی که قالب فشرده بدون توضیحات
ظرفیت دارد، هویت‌های Skills (نام، مکان و نسخه) را حفظ می‌کند. سپس از بودجه باقی‌مانده
برای توضیحات کوتاه‌شده استفاده می‌کند. اگر هیچ بودجه‌ای برای توضیحات باقی نماند،
توضیحات حذف می‌شوند. هرگاه قالب‌بندی فشرده یا کوتاه‌سازی فهرست
لازم باشد، پرامپت یادداشتی شامل ارجاع به `openclaw skills check` خواهد داشت.

برای به حداقل رساندن سربار پرامپت، توضیحات را کوتاه و گویا نگه دارید.

## مرتبط

<CardGroup cols={2}>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    راهنمای گام‌به‌گام نگارش یک Skill سفارشی.
  </Card>
  <Card title="کارگاه Skills" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهادها برای Skills پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*` و فهرست‌های مجاز عامل.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="terminal">
    نحوه ثبت و مسیریابی دستورهای اسلش Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    مرور و انتشار Skills در رجیستری عمومی.
  </Card>
  <Card title="Pluginها" href="/fa/tools/plugin" icon="plug">
    Pluginها می‌توانند Skills را همراه با ابزارهایی که مستندسازی می‌کنند عرضه کنند.
  </Card>
</CardGroup>
