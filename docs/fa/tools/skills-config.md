---
read_when:
    - افزودن یا تغییر پیکربندی Skills
    - تنظیم فهرست مجاز همراه یا رفتار نصب
summary: طرح‌واره و نمونه‌های پیکربندی Skills
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-05-10T20:11:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی بارگذار/نصب Skills زیر `skills` در
`~/.openclaw/openclaw.json` قرار دارد. قابلیت مشاهده Skills مخصوص هر عامل زیر
`agents.defaults.skills` و `agents.list[].skills` قرار دارد.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

برای تولید/ویرایش تصویر داخلی، `agents.defaults.imageGenerationModel`
به‌همراه ابزار هسته‌ای `image_generate` را ترجیح دهید. `skills.entries.*` فقط برای
گردش‌کارهای Skills سفارشی یا شخص ثالث است.

اگر ارائه‌دهنده/مدل تصویر مشخصی را انتخاب می‌کنید، کلید احراز هویت/API همان ارائه‌دهنده را نیز
پیکربندی کنید. نمونه‌های رایج: `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای
`google/*`، `OPENAI_API_KEY` برای `openai/*`، و `FAL_KEY` برای `fal/*`.

نمونه‌ها:

- پیکربندی بومی به سبک Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- پیکربندی بومی fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## فهرست‌های مجاز Skills عامل

وقتی ریشه‌های Skills یکسانی برای ماشین/فضای کاری می‌خواهید، اما
مجموعه Skills قابل مشاهده برای هر عامل متفاوت است، از پیکربندی عامل استفاده کنید.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

قوانین:

- `agents.defaults.skills`: فهرست مجاز پایه مشترک برای عامل‌هایی که
  `agents.list[].skills` را حذف کرده‌اند.
- برای اینکه Skills به‌طور پیش‌فرض نامحدود بماند، `agents.defaults.skills` را حذف کنید.
- `agents.list[].skills`: مجموعه نهایی و صریح Skills برای آن عامل؛ با پیش‌فرض‌ها
  ادغام نمی‌شود.
- `agents.list[].skills: []`: هیچ Skillsی را برای آن عامل در معرض استفاده قرار ندهید.

## فیلدها

- ریشه‌های داخلی Skills همیشه شامل `~/.openclaw/skills`، `~/.agents/skills`،
  `<workspace>/.agents/skills` و `<workspace>/skills` هستند.
- `allowBundled`: فهرست مجاز اختیاری فقط برای Skills **بسته‌بندی‌شده**. وقتی تنظیم شود، فقط
  Skills بسته‌بندی‌شده موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده، عامل و فضای کاری تحت تأثیر نیستند).
- `load.extraDirs`: دایرکتوری‌های اضافی Skills برای اسکن (کمترین تقدم).
- `load.allowSymlinkTargets`: دایرکتوری‌های مقصد واقعی و مورد اعتماد که پوشه‌های
  Skills دارای پیوند نمادین می‌توانند به آن‌ها resolve شوند، حتی وقتی پیوند نمادین خارج از آن
  ریشه مقصد قرار دارد. از این برای چیدمان‌های عمدی مخزن‌های هم‌سطح مانند
  `~/.agents/skills/manager -> ~/Projects/manager/skills` استفاده کنید.
- `load.watch`: پوشه‌های Skills را رصد کن و snapshot مربوط به Skills را نوسازی کن (پیش‌فرض: true).
- `load.watchDebounceMs`: debounce برای رویدادهای watcher مربوط به Skills بر حسب میلی‌ثانیه (پیش‌فرض: 250).
- `install.preferBrew`: نصب‌کننده‌های brew را در صورت وجود ترجیح بده (پیش‌فرض: true).
- `install.nodeManager`: ترجیح نصب‌کننده node (`npm` | `pnpm` | `yarn` | `bun`، پیش‌فرض: npm).
  این فقط بر **نصب‌های Skills** اثر می‌گذارد؛ runtime مربوط به Gateway همچنان باید Node باشد
  (Bun برای WhatsApp/Telegram توصیه نمی‌شود).
  - `openclaw setup --node-manager` محدودتر است و در حال حاضر `npm`،
    `pnpm` یا `bun` را می‌پذیرد. اگر نصب‌های Skills مبتنی بر Yarn می‌خواهید،
    `skills.install.nodeManager: "yarn"` را به‌صورت دستی تنظیم کنید.
- `install.allowUploadedArchives`: به کلاینت‌های Gateway مورد اعتماد `operator.admin` اجازه بده آرشیوهای zip خصوصی را که از طریق `skills.upload.*` مرحله‌بندی شده‌اند نصب کنند
  (پیش‌فرض: false). این فقط مسیر آرشیو آپلودشده را فعال می‌کند؛ نصب‌های معمول ClawHub
  به آن نیاز ندارند.
- `entries.<skillKey>`: overrideهای مخصوص هر Skill.
- `agents.defaults.skills`: فهرست مجاز پیش‌فرض و اختیاری Skills که عامل‌هایی که
  `agents.list[].skills` را حذف می‌کنند آن را به ارث می‌برند.
- `agents.list[].skills`: فهرست مجاز نهایی و اختیاری Skills برای هر عامل؛ فهرست‌های صریح
  به‌جای ادغام، پیش‌فرض‌های به‌ارث‌رسیده را جایگزین می‌کنند.

## مخزن‌های هم‌سطح دارای پیوند نمادین

به‌طور پیش‌فرض، هر ریشه Skills یک مرز containment است. اگر پوشه‌ای از Skills زیر
`~/.agents/skills` یک پیوند نمادین باشد که به بیرون از `~/.agents/skills` resolve شود،
OpenClaw از آن صرف‌نظر می‌کند و `Skipping escaped skill path outside its configured
root` را ثبت می‌کند.

چیدمان پیوند نمادین را نگه دارید و فقط ریشه مقصد مورد اعتماد را مجاز کنید:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

با این پیکربندی، پیوند نمادینی مانند
`~/.agents/skills/manager -> ~/Projects/manager/skills` پس از
realpath resolution پذیرفته می‌شود. `extraDirs` همچنین مخزن هم‌سطح را مستقیماً اسکن می‌کند، در حالی که
`allowSymlinkTargets` مسیر دارای پیوند نمادین را برای چیدمان‌های موجود Skills عامل
حفظ می‌کند. ورودی‌های مقصد را محدود نگه دارید؛ به ریشه‌های گسترده‌ای مانند `~` یا
`~/Projects` اشاره نکنید مگر اینکه همه درخت‌های Skills زیر آن ریشه مورد اعتماد باشند.

فیلدهای مخصوص هر Skill:

- `enabled`: برای غیرفعال کردن یک Skill حتی اگر بسته‌بندی/نصب شده باشد، `false` تنظیم کنید.
- `env`: متغیرهای محیطی تزریق‌شده برای اجرای عامل (فقط اگر از قبل تنظیم نشده باشند).
- `apiKey`: میانبر اختیاری برای Skillsی که یک متغیر محیطی اصلی اعلام می‌کنند.
  از رشته متن ساده یا شیء SecretRef (`{ source, provider, id }`) پشتیبانی می‌کند.

## نکته‌ها

- کلیدهای زیر `entries` به‌طور پیش‌فرض به نام Skill نگاشت می‌شوند. اگر یک Skill
  `metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان کلید استفاده کنید.
- تقدم بارگذاری به این صورت است: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills بسته‌بندی‌شده →
  `skills.load.extraDirs`.
- وقتی watcher فعال باشد، تغییرات Skills در نوبت بعدی عامل دریافت می‌شوند.

### Skills سندباکس‌شده و متغیرهای env

وقتی یک نشست **سندباکس‌شده** است، فرایندهای Skills داخل backend سندباکس پیکربندی‌شده اجرا می‌شوند. سندباکس `process.env` میزبان را به ارث **نمی‌برد**.

<Warning>
  `env` سراسری و `skills.entries.<skill>.env`/`apiKey` فقط بر اجراهای **میزبان** اعمال می‌شوند. داخل سندباکس اثری ندارند، بنابراین Skillی که به `GEMINI_API_KEY` وابسته است، مگر اینکه متغیر جداگانه به سندباکس داده شود، با `apiKey not configured` شکست می‌خورد.
</Warning>

از یکی از این‌ها استفاده کنید:

- `agents.defaults.sandbox.docker.env` برای backend مربوط به Docker (یا `agents.list[].sandbox.docker.env` برای هر عامل).
- env را در تصویر سندباکس سفارشی یا محیط سندباکس راه دور خود bake کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills" href="/fa/tools/skills" icon="puzzle-piece">
    Skills چه هستند و چگونه بارگذاری می‌شوند.
  </Card>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    نگارش بسته‌های Skills سفارشی.
  </Card>
  <Card title="دستورهای Slash" href="/fa/tools/slash-commands" icon="terminal">
    کاتالوگ دستور بومی و directiveهای چت.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    schema کامل `skills` و `agents.skills`.
  </Card>
</CardGroup>
