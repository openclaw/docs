---
read_when:
    - افزودن یا تغییر پیکربندی Skills
    - تنظیم فهرست مجاز بسته‌بندی‌شده یا رفتار نصب
summary: طرح‌واره و نمونه‌های پیکربندی Skills
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-05-06T09:48:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی بارگذار/نصب Skills زیر `skills` در
`~/.openclaw/openclaw.json` قرار دارد. قابلیت مشاهده Skills مخصوص عامل زیر
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
به‌همراه ابزار اصلی `image_generate` را ترجیح دهید. `skills.entries.*` فقط برای گردش‌کارهای سفارشی یا
Skills شخص ثالث است.

اگر یک ارائه‌دهنده/مدل تصویر مشخص انتخاب می‌کنید، کلید احراز هویت/API همان ارائه‌دهنده را نیز پیکربندی کنید. نمونه‌های رایج: `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای
`google/*`، `OPENAI_API_KEY` برای `openai/*`، و `FAL_KEY` برای `fal/*`.

نمونه‌ها:

- راه‌اندازی بومی به سبک Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- راه‌اندازی بومی fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## فهرست‌های مجاز Skills عامل

زمانی از پیکربندی عامل استفاده کنید که ریشه‌های Skills یکسانی در همان ماشین/فضای کاری می‌خواهید، اما
مجموعه Skills قابل مشاهده برای هر عامل متفاوت باشد.

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

- `agents.defaults.skills`: فهرست مجاز پایه مشترک برای عامل‌هایی که
  `agents.list[].skills` را حذف می‌کنند.
- برای اینکه Skills به‌صورت پیش‌فرض محدود نباشد، `agents.defaults.skills` را حذف کنید.
- `agents.list[].skills`: مجموعه نهایی و صریح Skills برای آن عامل؛ با پیش‌فرض‌ها
  ادغام نمی‌شود.
- `agents.list[].skills: []`: هیچ Skills برای آن عامل در معرض دسترس قرار ندهید.

## فیلدها

- ریشه‌های داخلی Skills همیشه شامل `~/.openclaw/skills`، `~/.agents/skills`،
  `<workspace>/.agents/skills`، و `<workspace>/skills` هستند.
- `allowBundled`: فهرست مجاز اختیاری فقط برای Skills **بسته‌بندی‌شده**. وقتی تنظیم شود، فقط
  Skills بسته‌بندی‌شده موجود در فهرست واجد شرایط هستند (Skills مدیریت‌شده، عامل، و فضای کاری تحت تأثیر قرار نمی‌گیرند).
- `load.extraDirs`: پوشه‌های اضافی Skills برای اسکن (کمترین اولویت).
- `load.watch`: پوشه‌های Skills را پایش می‌کند و عکس‌برداشت Skills را تازه‌سازی می‌کند (پیش‌فرض: true).
- `load.watchDebounceMs`: زمان debounce رویدادهای پایشگر Skills بر حسب میلی‌ثانیه (پیش‌فرض: 250).
- `install.preferBrew`: در صورت موجود بودن، نصب‌کننده‌های brew را ترجیح می‌دهد (پیش‌فرض: true).
- `install.nodeManager`: ترجیح نصب‌کننده node (`npm` | `pnpm` | `yarn` | `bun`، پیش‌فرض: npm).
  این فقط روی **نصب‌های Skills** اثر می‌گذارد؛ زمان اجرای Gateway همچنان باید Node باشد
  (Bun برای WhatsApp/Telegram توصیه نمی‌شود).
  - `openclaw setup --node-manager` محدودتر است و در حال حاضر `npm`،
    `pnpm`، یا `bun` را می‌پذیرد. اگر نصب‌های Skills مبتنی بر Yarn می‌خواهید،
    `skills.install.nodeManager: "yarn"` را به‌صورت دستی تنظیم کنید.
- `entries.<skillKey>`: بازنویسی‌های مخصوص هر Skill.
- `agents.defaults.skills`: فهرست مجاز پیش‌فرض اختیاری Skills که توسط عامل‌هایی به ارث می‌رسد
  که `agents.list[].skills` را حذف می‌کنند.
- `agents.list[].skills`: فهرست مجاز نهایی اختیاری Skills برای هر عامل؛ فهرست‌های صریح
  به‌جای ادغام، پیش‌فرض‌های به‌ارث‌رسیده را جایگزین می‌کنند.

فیلدهای مخصوص هر Skill:

- `enabled`: برای غیرفعال کردن یک Skill، حتی اگر بسته‌بندی/نصب شده باشد، مقدار `false` را تنظیم کنید.
- `env`: متغیرهای محیطی تزریق‌شده برای اجرای عامل (فقط اگر از قبل تنظیم نشده باشند).
- `apiKey`: میانبر اختیاری برای Skills که یک متغیر محیطی اصلی اعلام می‌کنند.
  از رشته متن ساده یا شیء SecretRef (`{ source, provider, id }`) پشتیبانی می‌کند.

## نکات

- کلیدهای زیر `entries` به‌صورت پیش‌فرض به نام Skill نگاشت می‌شوند. اگر یک Skill
  `metadata.openclaw.skillKey` را تعریف می‌کند، به‌جای آن از همان کلید استفاده کنید.
- اولویت بارگذاری این است: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills بسته‌بندی‌شده →
  `skills.load.extraDirs`.
- وقتی پایشگر فعال باشد، تغییرات Skills در نوبت بعدی عامل اعمال می‌شوند.

### Skills سندباکس‌شده و متغیرهای env

وقتی یک نشست **سندباکس‌شده** است، فرایندهای Skill داخل backend سندباکس پیکربندی‌شده اجرا می‌شوند. سندباکس `process.env` میزبان را به ارث **نمی‌برد**.

<Warning>
  `env` سراسری و `skills.entries.<skill>.env`/`apiKey` فقط روی اجراهای **میزبان** اعمال می‌شوند. داخل سندباکس اثری ندارند، بنابراین Skill وابسته به `GEMINI_API_KEY` با `apiKey not configured` شکست می‌خورد، مگر اینکه متغیر جداگانه به سندباکس داده شود.
</Warning>

از یکی از این‌ها استفاده کنید:

- `agents.defaults.sandbox.docker.env` برای backend Docker (یا `agents.list[].sandbox.docker.env` مخصوص هر عامل).
- env را داخل تصویر سندباکس سفارشی یا محیط سندباکس راه‌دور خود بگنجانید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills" href="/fa/tools/skills" icon="puzzle-piece">
    اینکه Skills چیستند و چگونه بارگذاری می‌شوند.
  </Card>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    نوشتن بسته‌های Skill سفارشی.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="terminal">
    کاتالوگ دستورهای بومی و دستورالعمل‌های گپ.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل `skills` و `agents.skills`.
  </Card>
</CardGroup>
