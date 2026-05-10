---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار جایگزینی مدل یا تجربهٔ کاربری انتخاب
    - به‌روزرسانی پروب‌های پویش مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: list، set، aliases، fallbacks، scan، status'
title: CLI مدل‌ها
x-i18n:
    generated_at: "2026-05-10T19:36:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="بازیابی از خرابی مدل" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، دوره‌های خنک‌سازی، و نحوه تعامل آن با جایگزین‌ها.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers">
    مرور سریع ارائه‌دهنده و نمونه‌ها.
  </Card>
  <Card title="زمان‌اجراهای عامل" href="/fa/concepts/agent-runtimes">
    زمان‌اجراهای حلقه عامل PI، Codex و موارد دیگر.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults">
    کلیدهای پیکربندی مدل.
  </Card>
</CardGroup>

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولا زمان‌اجرای سطح پایین عامل را انتخاب نمی‌کنند. ارجاع‌های عامل OpenAI استثنای اصلی هستند: `openai/gpt-5.5` به‌صورت پیش‌فرض روی ارائه‌دهنده رسمی OpenAI از طریق زمان‌اجرای app-server مربوط به Codex اجرا می‌شود. بازنویسی‌های صریح زمان‌اجرا به سیاست ارائه‌دهنده/مدل تعلق دارند، نه به کل عامل یا نشست. در حالت زمان‌اجرای Codex، ارجاع `openai/gpt-*` به‌معنای صورت‌حساب‌گیری با کلید API نیست؛ احراز هویت می‌تواند از یک حساب Codex یا پروفایل احراز هویت `openai-codex` بیاید. [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.

## انتخاب مدل چگونه کار می‌کند

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="مدل اصلی">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="جایگزین‌ها">
    `agents.defaults.model.fallbacks` (به‌ترتیب).
  </Step>
  <Step title="بازیابی از خرابی احراز هویت ارائه‌دهنده">
    بازیابی از خرابی احراز هویت پیش از رفتن به مدل بعدی، داخل یک ارائه‌دهنده رخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سطوح مرتبط با مدل">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌همراه نام‌های مستعار). از مدخل‌های `provider/*` برای محدود کردن ارائه‌دهندگان قابل مشاهده در حالی استفاده کنید که کشف ارائه‌دهنده پویا باقی می‌ماند.
    - `agents.defaults.imageModel` **فقط وقتی** استفاده می‌شود که مدل اصلی نتواند تصویر بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شود، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض بازمی‌گردد.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را نیز پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را نیز پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدیو استفاده می‌شود. اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید ویدیو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را نیز پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌همراه اتصال‌ها بازنویسی کنند ([مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار جایگزین

همان `provider/model` بسته به اینکه از کجا آمده باشد، می‌تواند معانی متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و مدل‌های اصلی مخصوص عامل) نقطه شروع معمول هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های جایگزین خودکار، وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون آزمایش دوباره یک مدل اصلی معلوم‌خراب، همچنان از زنجیره جایگزین استفاده کنند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخابگر مدل، `session_status(model=...)` و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، OpenClaw به‌جای عبور به یک مدل پیکربندی‌شده دیگر، به‌صورت قابل مشاهده شکست می‌خورد.
- `--model` در Cron / مقدار `model` در بار، یک مدل اصلی برای هر کار است. همچنان از جایگزین‌های پیکربندی‌شده استفاده می‌کند، مگر اینکه کار مقدار صریح `fallbacks` را در بار ارائه کند (برای اجرای سخت‌گیرانه cron از `fallbacks: []` استفاده کنید).
- انتخابگرهای مدل پیش‌فرض و فهرست مجاز CLI با فهرست کردن `models.providers.*.models` صریح به‌جای بارگذاری کل کاتالوگ داخلی، به `models.mode: "replace"` احترام می‌گذارند.
- انتخابگر مدل رابط کنترل، نمای مدل پیکربندی‌شده‌اش را از Gateway می‌خواهد: اگر `agents.defaults.models` وجود داشته باشد، همان را به‌همراه مدخل‌های سراسری ارائه‌دهنده `provider/*`، و در غیر این صورت `models.providers.*.models` صریح به‌همراه ارائه‌دهندگانی که احراز هویت قابل استفاده دارند. کاتالوگ کامل داخلی برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` رزرو شده است.

## سیاست سریع مدل

- مدل اصلی خود را روی قوی‌ترین مدل نسل جدیدی تنظیم کنید که در دسترس شماست.
- برای وظایف حساس به هزینه/تاخیر و گفت‌وگوی کم‌ریسک‌تر از جایگزین‌ها استفاده کنید.
- برای عامل‌های دارای ابزار یا ورودی‌های نامطمئن، از رده‌های مدل قدیمی‌تر/ضعیف‌تر دوری کنید.

## راه‌اندازی اولیه (پیشنهادی)

اگر نمی‌خواهید پیکربندی را دستی ویرایش کنید، راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard
```

این فرمان می‌تواند مدل + احراز هویت را برای ارائه‌دهندگان رایج، از جمله **اشتراک OpenAI Code (Codex)** (OAuth) و **Anthropic** (کلید API یا Claude CLI)، تنظیم کند.

## کلیدهای پیکربندی (مرور کلی)

- `agents.defaults.model.primary` و `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (فهرست مجاز + نام‌های مستعار + پارامترهای ارائه‌دهنده + مدخل‌های ارائه‌دهنده پویای `provider/*`)
- `models.providers` (ارائه‌دهندگان سفارشی نوشته‌شده در `models.json`)

<Note>
ارجاع‌های مدل به حروف کوچک نرمال‌سازی می‌شوند. نام‌های مستعار ارائه‌دهنده مانند `z.ai/*` به `zai/*` نرمال‌سازی می‌شوند.

نمونه‌های پیکربندی ارائه‌دهنده (از جمله OpenCode) در [OpenCode](/fa/providers/opencode) قرار دارند.
</Note>

### ویرایش‌های امن فهرست مجاز

هنگام به‌روزرسانی دستی `agents.defaults.models` از نوشتن افزایشی استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد محافظت در برابر بازنویسی ناخواسته">
    `openclaw config set` از نگاشت‌های مدل/ارائه‌دهنده در برابر بازنویسی ناخواسته محافظت می‌کند. تخصیص یک شیء ساده به `agents.defaults.models`، `models.providers` یا `models.providers.<id>.models` وقتی باعث حذف مدخل‌های موجود شود، رد می‌شود. برای تغییرات افزایشی از `--merge` استفاده کنید؛ فقط زمانی از `--replace` استفاده کنید که مقدار ارائه‌شده باید به مقدار کامل هدف تبدیل شود.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های در محدوده ارائه‌دهنده را در فهرست مجاز موجود ادغام می‌کنند، بنابراین افزودن Codex، Ollama یا یک ارائه‌دهنده دیگر، مدخل‌های مدل نامرتبط را حذف نمی‌کند. Configure هنگام اعمال دوباره احراز هویت ارائه‌دهنده، مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و بازنویسی‌های نشست تبدیل می‌شود. وقتی کاربر مدلی را انتخاب کند که در آن فهرست مجاز نیست، OpenClaw برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
این اتفاق **پیش از** تولید یک پاسخ عادی رخ می‌دهد، بنابراین پیام ممکن است این حس را بدهد که «پاسخ نداد». راه‌حل یکی از این‌هاست:

- مدل را به `agents.defaults.models` اضافه کنید، یا
- فهرست مجاز را پاک کنید (`agents.defaults.models` را حذف کنید)، یا
- مدلی را از `/model list` انتخاب کنید.

</Warning>

وقتی فرمان ردشده شامل یک بازنویسی زمان‌اجرا مانند `/model openai/gpt-5.5 --runtime codex` بود، ابتدا فهرست مجاز را درست کنید، سپس همان فرمان `/model ... --runtime ...` را دوباره امتحان کنید. برای اجرای بومی Codex، مدل انتخاب‌شده همچنان `openai/gpt-5.5` است؛ زمان‌اجرای `codex` harness را انتخاب می‌کند و احراز هویت Codex را جداگانه به‌کار می‌برد.

برای مدل‌های محلی/GGUF، ارجاع کامل دارای پیشوند ارائه‌دهنده را در فهرست مجاز ذخیره کنید،
برای نمونه `ollama/gemma4:26b`، `lmstudio/Gemma4-26b-a4-it-gguf`، یا
همان provider/model دقیقی که توسط `openclaw models list --provider <provider>` نشان داده می‌شود.
نام فایل‌های محلی بدون پیشوند یا نام‌های نمایشی وقتی فهرست مجاز فعال است کافی نیستند.

اگر می‌خواهید ارائه‌دهندگان را بدون فهرست کردن دستی هر مدل محدود کنید، مدخل‌های
`provider/*` را به `agents.defaults.models` اضافه کنید:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

با این سیاست، `/model`، `/models` و انتخابگرهای مدل فقط کاتالوگ کشف‌شده
همان ارائه‌دهندگان را نشان می‌دهند. مدل‌های جدید از ارائه‌دهندگان انتخاب‌شده می‌توانند
بدون ویرایش فهرست مجاز ظاهر شوند. وقتی از ارائه‌دهنده‌ای دیگر به یک مدل مشخص نیاز دارید، مدخل‌های دقیق `provider/model` را می‌توان با مدخل‌های `provider/*` ترکیب کرد.

نمونه پیکربندی فهرست مجاز:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## تغییر مدل‌ها در گفت‌وگو (`/model`)

می‌توانید بدون راه‌اندازی دوباره، مدل‌ها را برای نشست فعلی تغییر دهید:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="رفتار انتخابگر">
    - `/model` (و `/model list`) یک انتخابگر فشرده و شماره‌دار است (خانواده مدل + ارائه‌دهندگان موجود).
    - در Discord، `/model` و `/models` یک انتخابگر تعاملی با منوهای کشویی ارائه‌دهنده و مدل به‌همراه یک مرحله Submit باز می‌کنند.
    - در Telegram، انتخاب‌های انتخابگر `/models` در محدوده نشست هستند؛ آن‌ها پیش‌فرض پایدار عامل را در `openclaw.json` تغییر نمی‌دهند.
    - `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، یک پیام منسوخ‌شدن برمی‌گرداند.
    - `/model <#>` از همان انتخابگر انتخاب می‌کند.

  </Accordion>
  <Accordion title="پایداری و تغییر زنده">
    - `/model` انتخاب جدید نشست را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از مدل جدید استفاده می‌کند.
    - اگر یک اجرا از قبل فعال باشد، OpenClaw تغییر زنده را در حالت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش دوباره تمیز، با مدل جدید شروع مجدد می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا یک فرصت تلاش دوباره بعدی یا نوبت کاربر بعدی در صف بماند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای پاسخ دادن بی‌صدا از `agents.defaults.model.fallbacks`، به‌صورت قابل مشاهده شکست می‌خورد. این با پیش‌فرض‌های پیکربندی‌شده و مدل‌های اصلی کارهای cron متفاوت است که همچنان می‌توانند از زنجیره‌های جایگزین استفاده کنند.
    - `/model status` نمای تفصیلی است (نامزدهای احراز هویت و، وقتی پیکربندی شده باشد، مقدار `baseUrl` نقطه پایانی ارائه‌دهنده + حالت `api`).

  </Accordion>
  <Accordion title="Ref parsing">
    - ارجاع‌های مدل با جدا کردن بر اساس **اولین** `/` تحلیل می‌شوند. هنگام تایپ `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسه‌ی مدل شامل `/` باشد (به سبک OpenRouter)، باید پیشوند ارائه‌دهنده را وارد کنید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب حل می‌کند:
      1. تطبیق نام مستعار
      2. تطبیق یکتای ارائه‌دهنده‌ی پیکربندی‌شده برای همان شناسه‌ی مدل بدون پیشوند
      3. بازگشت منسوخ‌شده به ارائه‌دهنده‌ی پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای آن برای جلوگیری از نمایش پیش‌فرض کهنه‌ی یک ارائه‌دهنده‌ی حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
  </Accordion>
</AccordionGroup>

رفتار/پیکربندی کامل فرمان: [فرمان‌های Slash](/fa/tools/slash-commands).

## فرمان‌های CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (بدون زیرفرمان) میان‌بری برای `models status` است.

### `models list`

به‌صورت پیش‌فرض مدل‌های پیکربندی‌شده/در دسترس از نظر احراز هویت را نشان می‌دهد. پرچم‌های مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده‌ی همراه را پیش از پیکربندی احراز هویت شامل می‌شود، بنابراین نماهای صرفا اکتشافی می‌توانند مدل‌هایی را نشان دهند که تا زمانی که اعتبارنامه‌های مطابق ارائه‌دهنده را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهنده‌های محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسه‌ی ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی از انتخابگرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  هر مدل در یک خط.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین.
</ParamField>

### `models status`

مدل اصلی حل‌شده، بازگشت‌ها، مدل تصویر، و نمای کلی احراز هویت ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های پیدا‌شده در مخزن احراز هویت نمایش می‌دهد (به‌صورت پیش‌فرض در فاصله‌ی ۲۴ ساعت هشدار می‌دهد). `--plain` فقط مدل اصلی حل‌شده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` نیز گنجانده می‌شود). اگر یک ارائه‌دهنده‌ی پیکربندی‌شده اعتبارنامه نداشته باشد، `models status` بخش **احراز هویت موجود نیست** را چاپ می‌کند.
    - JSON شامل `auth.oauth` (پنجره‌ی هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، از جمله اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل‌های مخزن احراز هویت است؛ ارائه‌دهنده‌هایی که فقط env دارند در آن ظاهر نمی‌شوند.
    - برای خودکارسازی از `--check` استفاده کنید (کد خروج `1` هنگام نبودن/منقضی بودن، `2` هنگام نزدیک بودن به انقضا).
    - برای بررسی‌های زنده‌ی احراز هویت از `--probe` استفاده کنید؛ ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، probe به‌جای تلاش برای آن، `excluded_by_auth_order` را گزارش می‌کند. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل probe برای آن ارائه‌دهنده قابل حل نباشد، probe مقدار `status: no_model` را گزارش می‌کند.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌روشن، کلیدهای API معمولا قابل پیش‌بینی‌ترین گزینه هستند؛ استفاده‌ی مجدد از Claude CLI و پروفایل‌های OAuth/توکن موجود Anthropic نیز پشتیبانی می‌شود.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل‌های رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را برای پشتیبانی از ابزار و تصویر probe کند.

<ParamField path="--no-probe" type="boolean">
  رد کردن probeهای زنده (فقط فراداده).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازه‌ی پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  رد کردن مدل‌های قدیمی‌تر.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازه‌ی فهرست بازگشت.
</ParamField>
<ParamField path="--set-default" type="boolean">
  تنظیم `agents.defaults.model.primary` روی اولین انتخاب.
</ParamField>
<ParamField path="--set-image" type="boolean">
  تنظیم `agents.defaults.imageModel.primary` روی اولین انتخاب تصویر.
</ParamField>

<Note>
کاتالوگ `/models` در OpenRouter عمومی است، بنابراین اسکن‌های فقط فراداده می‌توانند نامزدهای رایگان را بدون کلید فهرست کنند. probe و استنتاج همچنان به کلید API برای OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر هیچ کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط فراداده برمی‌گردد و پیکربندی را بدون تغییر می‌گذارد. برای درخواست صریح حالت فقط فراداده از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس موارد زیر رتبه‌بندی می‌شوند:

1. پشتیبانی از تصویر
2. تأخیر ابزار
3. اندازه‌ی زمینه
4. تعداد پارامترها

ورودی:

- فهرست `/models` در OpenRouter (فیلتر `:free`)
- probeهای زنده به کلید API برای OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (ببینید [متغیرهای محیطی](/fa/help/environment))
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/probe: `--timeout`، `--concurrency`

وقتی probeهای زنده در یک TUI اجرا می‌شوند، می‌توانید بازگشت‌ها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را پاس دهید. نتایج فقط فراداده اطلاع‌رسان هستند؛ `--set-default` و `--set-image` به probeهای زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل‌استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهنده‌های سفارشی در `models.providers` در فایل `models.json` زیر پوشه‌ی agent نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). این فایل به‌صورت پیش‌فرض ادغام می‌شود، مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    تقدم حالت ادغام برای شناسه‌های ارائه‌دهنده‌ی مطابق:

    - مقدار غیرخالی `baseUrl` که از قبل در `models.json` مربوط به agent وجود دارد برنده می‌شود.
    - مقدار غیرخالی `apiKey` در `models.json` مربوط به agent فقط زمانی برنده می‌شود که آن ارائه‌دهنده در زمینه‌ی پیکربندی/پروفایل احراز هویت فعلی توسط SecretRef مدیریت نشود.
    - مقادیر `apiKey` ارائه‌دهنده‌ی مدیریت‌شده توسط SecretRef به‌جای ماندگار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقادیر header ارائه‌دهنده‌ی مدیریت‌شده توسط SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقدار خالی یا مفقود `apiKey`/`baseUrl` مربوط به agent به `models.providers` در پیکربندی برمی‌گردد.
    - سایر فیلدهای ارائه‌دهنده از پیکربندی و داده‌های کاتالوگ نرمال‌شده تازه‌سازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
ماندگاری نشانگرها بر اساس منبع مرجع است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال (پیش از حل‌شدن) می‌نویسد، نه از مقادیر راز حل‌شده در زمان اجرا. این در هر زمانی که OpenClaw فایل `models.json` را بازتولید کند اعمال می‌شود، از جمله مسیرهای مبتنی بر فرمان مانند `openclaw agent`.
</Note>

## مرتبط

- [زمان‌اجراهای agent](/fa/concepts/agent-runtimes) — PI، Codex، و دیگر زمان‌اجراهای حلقه‌ی agent
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [جابه‌جایی خودکار مدل](/fa/concepts/model-failover) — زنجیره‌های بازگشت
- [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) — مسیریابی و احراز هویت ارائه‌دهنده
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدئو](/fa/tools/video-generation) — پیکربندی مدل ویدئو
