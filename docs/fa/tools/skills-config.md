---
read_when:
    - افزودن یا تغییر پیکربندی Skills
    - تنظیم فهرست مجاز همراه یا رفتار نصب
summary: طرحوارهٔ پیکربندی Skills و نمونه‌ها
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-04-29T23:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی بارگذاری/نصب Skills زیر `skills` در
`~/.openclaw/openclaw.json` قرار دارد. نمایانی Skills مختص agent زیر
`agents.defaults.skills` و `agents.list[].skills` قرار دارد.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
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
به‌همراه ابزار هسته‌ای `image_generate` را ترجیح دهید. `skills.entries.*` فقط برای workflowهای سفارشی یا
Skills شخص ثالث است.

اگر provider/model تصویر مشخصی را انتخاب می‌کنید، کلید auth/API همان provider را نیز پیکربندی کنید.
نمونه‌های رایج: `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای
`google/*`، `OPENAI_API_KEY` برای `openai/*`، و `FAL_KEY` برای `fal/*`.

نمونه‌ها:

- راه‌اندازی بومی به سبک Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- راه‌اندازی بومی fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## فهرست‌های مجاز Skills برای agent

وقتی می‌خواهید ریشه‌های Skills یکسانی برای ماشین/workspace داشته باشید، اما مجموعه Skills قابل مشاهده برای هر agent متفاوت باشد، از پیکربندی agent استفاده کنید.

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

قواعد:

- `agents.defaults.skills`: فهرست مجاز پایه مشترک برای agentهایی که
  `agents.list[].skills` را حذف می‌کنند.
- برای اینکه Skills به‌طور پیش‌فرض محدود نباشند، `agents.defaults.skills` را حذف کنید.
- `agents.list[].skills`: مجموعه نهایی و صریح Skills برای آن agent؛ با defaults
  ادغام نمی‌شود.
- `agents.list[].skills: []`: هیچ Skillsی را برای آن agent نمایش ندهید.

## فیلدها

- ریشه‌های Skills داخلی همیشه شامل `~/.openclaw/skills`، `~/.agents/skills`،
  `<workspace>/.agents/skills`، و `<workspace>/skills` هستند.
- `allowBundled`: فهرست مجاز اختیاری فقط برای Skills **bundled**. وقتی تنظیم شود، فقط
  Skills bundled موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده، agent، و workspace بی‌تأثیر می‌مانند).
- `load.extraDirs`: دایرکتوری‌های اضافی Skills برای اسکن (کمترین اولویت).
- `load.watch`: پوشه‌های Skills را زیر نظر بگیرد و snapshot مربوط به Skills را تازه‌سازی کند (پیش‌فرض: true).
- `load.watchDebounceMs`: debounce رویدادهای watcher مربوط به Skills بر حسب میلی‌ثانیه (پیش‌فرض: 250).
- `install.preferBrew`: نصب‌کننده‌های brew را، وقتی در دسترس باشند، ترجیح دهد (پیش‌فرض: true).
- `install.nodeManager`: ترجیح نصب‌کننده node (`npm` | `pnpm` | `yarn` | `bun`، پیش‌فرض: npm).
  این فقط بر **نصب‌های Skills** اثر می‌گذارد؛ runtime مربوط به Gateway همچنان باید Node باشد
  (Bun برای WhatsApp/Telegram توصیه نمی‌شود).
  - `openclaw setup --node-manager` محدودتر است و فعلاً `npm`،
    `pnpm`، یا `bun` را می‌پذیرد. اگر نصب‌های Skills با پشتوانه Yarn می‌خواهید،
    `skills.install.nodeManager: "yarn"` را دستی تنظیم کنید.
- `entries.<skillKey>`: overrideهای هر Skill.
- `agents.defaults.skills`: فهرست مجاز پیش‌فرض اختیاری Skills که توسط agentهایی که
  `agents.list[].skills` را حذف می‌کنند به ارث برده می‌شود.
- `agents.list[].skills`: فهرست مجاز نهایی اختیاری Skills برای هر agent؛
  فهرست‌های صریح، به‌جای ادغام، defaults موروثی را جایگزین می‌کنند.

فیلدهای هر Skill:

- `enabled`: برای غیرفعال کردن یک Skill، حتی اگر bundled/installed باشد، `false` تنظیم کنید.
- `env`: متغیرهای محیطی تزریق‌شده برای اجرای agent (فقط اگر از قبل تنظیم نشده باشند).
- `apiKey`: میانبر اختیاری برای Skillsی که یک env var اصلی اعلام می‌کنند.
  از رشته plaintext یا شیء SecretRef (`{ source, provider, id }`) پشتیبانی می‌کند.

## نکته‌ها

- کلیدهای زیر `entries` به‌طور پیش‌فرض به نام Skill نگاشت می‌شوند. اگر یک Skill
  `metadata.openclaw.skillKey` را تعریف می‌کند، به‌جای آن از همان کلید استفاده کنید.
- اولویت بارگذاری به‌ترتیب `<workspace>/skills` ← `<workspace>/.agents/skills` ←
  `~/.agents/skills` ← `~/.openclaw/skills` ← Skills bundled ←
  `skills.load.extraDirs` است.
- وقتی watcher فعال باشد، تغییرات Skills در نوبت بعدی agent دریافت می‌شوند.

### Skills سندباکس‌شده + env vars

وقتی یک session **sandboxed** باشد، فرایندهای Skills داخل backend سندباکس پیکربندی‌شده اجرا می‌شوند.
سندباکس `process.env` میزبان را به ارث **نمی‌برد**.

از یکی از این‌ها استفاده کنید:

- `agents.defaults.sandbox.docker.env` برای backend Docker (یا `agents.list[].sandbox.docker.env` برای هر agent)
- env را داخل تصویر سندباکس سفارشی یا محیط سندباکس remote خود bake کنید

`env` سراسری و `skills.entries.<skill>.env/apiKey` فقط برای اجراهای **host** اعمال می‌شوند.

## مرتبط

- [Skills](/fa/tools/skills)
- [ایجاد Skills](/fa/tools/creating-skills)
- [دستورات Slash](/fa/tools/slash-commands)
