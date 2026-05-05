---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار جایگزینی مدل یا تجربهٔ کاربری انتخاب
    - به‌روزرسانی کاوشگرهای پویش مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: فهرست، تنظیم، نام‌های مستعار، جایگزین‌ها، اسکن، وضعیت'
title: CLI مدل‌ها
x-i18n:
    generated_at: "2026-05-05T01:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="جایگزینی مدل هنگام خرابی" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، دوره‌های انتظار، و نحوه تعامل آن با مدل‌های جایگزین.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers">
    مرور سریع ارائه‌دهنده‌ها و مثال‌ها.
  </Card>
  <Card title="زمان‌اجراهای عامل" href="/fa/concepts/agent-runtimes">
    PI، Codex، و دیگر زمان‌اجراهای حلقه عامل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults">
    کلیدهای پیکربندی مدل.
  </Card>
</CardGroup>

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولاً زمان‌اجرای سطح پایین عامل را انتخاب نمی‌کنند. برای مثال، `openai/gpt-5.5` بسته به `agents.defaults.agentRuntime.id` می‌تواند از مسیر عادی ارائه‌دهنده OpenAI یا از طریق زمان‌اجرای app-server در Codex اجرا شود. در حالت زمان‌اجرای Codex، ارجاع `openai/gpt-*` به‌معنای صورتحساب API key نیست؛ احراز هویت می‌تواند از یک حساب Codex یا پروفایل احراز هویت `openai-codex` بیاید. [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.

## انتخاب مدل چگونه کار می‌کند

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="مدل اصلی">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="مدل‌های جایگزین">
    `agents.defaults.model.fallbacks` (به‌ترتیب).
  </Step>
  <Step title="جایگزینی احراز هویت ارائه‌دهنده هنگام خرابی">
    جایگزینی احراز هویت هنگام خرابی، پیش از رفتن به مدل بعدی، داخل یک ارائه‌دهنده انجام می‌شود.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سطوح مرتبط با مدل">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌همراه aliasها).
    - `agents.defaults.imageModel` **فقط وقتی** استفاده می‌شود که مدل اصلی نتواند تصویر بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شود، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/API key آن ارائه‌دهنده را نیز پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/API key آن ارائه‌دهنده را نیز پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدئو استفاده می‌شود. اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید ویدئو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/API key آن ارائه‌دهنده را نیز پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌همراه bindingها بازنویسی کنند ([مسیریابی چندعامله](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار جایگزینی

همان `provider/model` بسته به این‌که از کجا آمده است می‌تواند معنی‌های متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و مدل‌های اصلی مخصوص عامل) نقطه شروع عادی هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های جایگزین خودکار، وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون بررسی اولیه‌ای که می‌دانیم خراب است، همچنان از زنجیره جایگزین استفاده کنند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخابگر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، OpenClaw به‌جای افتادن به مدل پیکربندی‌شده دیگر، به‌صورت آشکار شکست می‌خورد.
- Cron `--model` / payload `model` مدل اصلی هر کار است. همچنان از مدل‌های جایگزین پیکربندی‌شده استفاده می‌کند، مگر این‌که کار payload `fallbacks` صریح ارائه کند (برای اجرای cron سخت‌گیرانه از `fallbacks: []` استفاده کنید).
- انتخابگرهای مدل پیش‌فرض و فهرست مجاز CLI با فهرست کردن `models.providers.*.models` صریح به‌جای بارگذاری کامل کاتالوگ داخلی، به `models.mode: "replace"` احترام می‌گذارند.
- انتخابگر مدل Control UI از Gateway نمای مدل پیکربندی‌شده‌اش را می‌خواهد: وقتی وجود داشته باشد `agents.defaults.models`، وگرنه `models.providers.*.models` صریح به‌همراه ارائه‌دهندگانی که احراز هویت قابل استفاده دارند. کاتالوگ کامل داخلی برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` رزرو شده است.

## سیاست سریع مدل

- مدل اصلی خود را روی قوی‌ترین مدل نسل جدیدی تنظیم کنید که در دسترس شماست.
- از مدل‌های جایگزین برای کارهای حساس به هزینه/تأخیر و گفت‌وگوهای کم‌ریسک‌تر استفاده کنید.
- برای عامل‌های دارای ابزار یا ورودی‌های غیرقابل اعتماد، از رده‌های مدل قدیمی‌تر/ضعیف‌تر پرهیز کنید.

## راه‌اندازی اولیه (توصیه‌شده)

اگر نمی‌خواهید پیکربندی را دستی ویرایش کنید، راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard
```

این می‌تواند مدل + احراز هویت را برای ارائه‌دهندگان رایج، از جمله **اشتراک OpenAI Code (Codex)** (OAuth) و **Anthropic** (API key یا Claude CLI)، تنظیم کند.

## کلیدهای پیکربندی (مرور کلی)

- `agents.defaults.model.primary` و `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (فهرست مجاز + aliasها + پارامترهای ارائه‌دهنده)
- `models.providers` (ارائه‌دهندگان سفارشی نوشته‌شده در `models.json`)

<Note>
ارجاع‌های مدل به حروف کوچک نرمال‌سازی می‌شوند. aliasهای ارائه‌دهنده مانند `z.ai/*` به `zai/*` نرمال‌سازی می‌شوند.

نمونه‌های پیکربندی ارائه‌دهنده (از جمله OpenCode) در [OpenCode](/fa/providers/opencode) قرار دارند.
</Note>

### ویرایش‌های امن فهرست مجاز

هنگام به‌روزرسانی دستی `agents.defaults.models` از نوشتن افزایشی استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد محافظت در برابر بازنویسی ناخواسته">
    `openclaw config set` از mapهای مدل/ارائه‌دهنده در برابر بازنویسی ناخواسته محافظت می‌کند. انتساب یک شیء ساده به `agents.defaults.models`، `models.providers`، یا `models.providers.<id>.models` وقتی که باعث حذف ورودی‌های موجود شود رد می‌شود. برای تغییرات افزایشی از `--merge` استفاده کنید؛ فقط وقتی از `--replace` استفاده کنید که مقدار ارائه‌شده باید مقدار کامل مقصد شود.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های محدود به ارائه‌دهنده را با فهرست مجاز موجود ادغام می‌کنند، بنابراین افزودن Codex، Ollama، یا ارائه‌دهنده‌ای دیگر ورودی‌های مدل نامرتبط را حذف نمی‌کند. Configure هنگام اعمال دوباره احراز هویت ارائه‌دهنده، `agents.defaults.model.primary` موجود را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و برای بازنویسی‌های نشست تبدیل می‌شود. وقتی کاربر مدلی را انتخاب کند که در آن فهرست مجاز نیست، OpenClaw برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
این اتفاق **پیش از** تولید پاسخ عادی رخ می‌دهد، بنابراین پیام می‌تواند این حس را بدهد که «پاسخ نداد». راه‌حل یکی از این موارد است:

- مدل را به `agents.defaults.models` اضافه کنید، یا
- فهرست مجاز را پاک کنید (`agents.defaults.models` را حذف کنید)، یا
- مدلی را از `/model list` انتخاب کنید.

</Warning>

وقتی فرمان ردشده شامل یک بازنویسی زمان‌اجرا مانند `/model openai/gpt-5.5 --runtime codex` بود، ابتدا فهرست مجاز را اصلاح کنید، سپس همان فرمان `/model ... --runtime ...` را دوباره امتحان کنید. برای اجرای بومی Codex، مدل انتخاب‌شده همچنان `openai/gpt-5.5` است؛ زمان‌اجرای `codex` harness را انتخاب می‌کند و احراز هویت Codex را جداگانه به‌کار می‌برد.

برای مدل‌های محلی/GGUF، ارجاع کامل دارای پیشوند ارائه‌دهنده را در فهرست مجاز ذخیره کنید،
برای مثال `ollama/gemma4:26b`، `lmstudio/Gemma4-26b-a4-it-gguf`، یا
ارائه‌دهنده/مدل دقیقی که توسط `openclaw models list --provider <provider>` نمایش داده می‌شود.
نام فایل‌های محلی خام یا نام‌های نمایشی وقتی فهرست مجاز
فعال است کافی نیستند.

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
    - `/model` (و `/model list`) یک انتخابگر فشرده و شماره‌گذاری‌شده است (خانواده مدل + ارائه‌دهندگان موجود).
    - در Discord، `/model` و `/models` یک انتخابگر تعاملی با dropdownهای ارائه‌دهنده و مدل به‌همراه گام Submit باز می‌کنند.
    - در Telegram، انتخاب‌های انتخابگر `/models` محدود به نشست هستند؛ آن‌ها پیش‌فرض پایدار عامل را در `openclaw.json` تغییر نمی‌دهند.
    - `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، پیام منسوخ‌شدن برمی‌گرداند.
    - `/model <#>` از همان انتخابگر انتخاب می‌کند.

  </Accordion>
  <Accordion title="پایداری و تغییر زنده">
    - `/model` انتخاب نشست جدید را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از مدل جدید استفاده می‌کند.
    - اگر یک اجرا از قبل فعال باشد، OpenClaw تغییر زنده را در حالت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز به مدل جدید راه‌اندازی دوباره می‌شود.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا یک فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای پاسخ دادن بی‌صدا از `agents.defaults.model.fallbacks` به‌صورت آشکار شکست می‌خورد. این با پیش‌فرض‌های پیکربندی‌شده و مدل‌های اصلی کار cron متفاوت است، که همچنان می‌توانند از زنجیره‌های جایگزین استفاده کنند.
    - `/model status` نمای جزئیات است (نامزدهای احراز هویت و، در صورت پیکربندی، endpoint ارائه‌دهنده `baseUrl` + حالت `api`).

  </Accordion>
  <Accordion title="تجزیه ارجاع">
    - ارجاع‌های مدل با تقسیم روی **اولین** `/` تجزیه می‌شوند. هنگام تایپ `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسه مدل شامل `/` باشد (سبک OpenRouter)، باید پیشوند ارائه‌دهنده را وارد کنید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب حل می‌کند:
      1. تطابق alias
      2. تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل بدون پیشوند دقیق
      3. بازگشت منسوخ‌شده به ارائه‌دهنده پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش پیش‌فرض کهنه ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
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

مدل‌های پیکربندی‌شده/دارای احراز هویت موجود را به‌صورت پیش‌فرض نشان می‌دهد. پرچم‌های مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده‌های همراه را پیش از پیکربندی احراز هویت شامل می‌شود، بنابراین نماهای صرفاً اکتشافی می‌توانند مدل‌هایی را نشان دهند که تا وقتی اعتبارنامه‌های ارائه‌دهنده متناظر را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهنده‌های محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسه ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی از انتخاب‌گرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  هر مدل در یک خط.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین.
</ParamField>

### `models status`

مدل اصلی حل‌شده، جایگزین‌ها، مدل تصویر، و نمای کلی احراز هویت ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های موجود در ذخیره‌گاه احراز هویت نمایش می‌دهد (به‌صورت پیش‌فرض در بازه ۲۴ ساعت هشدار می‌دهد). `--plain` فقط مدل اصلی حل‌شده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="رفتار احراز هویت و آزمون">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` هم گنجانده می‌شود). اگر یک ارائه‌دهنده پیکربندی‌شده اعتبارنامه نداشته باشد، `models status` یک بخش **احراز هویت مفقود** چاپ می‌کند.
    - JSON شامل `auth.oauth` (پنجره هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، از جمله اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل‌های ذخیره‌گاه احراز هویت است؛ ارائه‌دهنده‌های فقط env در آن ظاهر نمی‌شوند.
    - برای خودکارسازی از `--check` استفاده کنید (کد خروج `1` هنگام فقدان/انقضا، `2` هنگام نزدیک بودن انقضا).
    - برای بررسی‌های زنده احراز هویت از `--probe` استفاده کنید؛ ردیف‌های آزمون می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، آزمون به‌جای تلاش برای آن، `excluded_by_auth_order` گزارش می‌دهد. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل آزمونی برای آن ارائه‌دهنده قابل حل نباشد، آزمون `status: no_model` گزارش می‌دهد.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌روشن، کلیدهای API معمولاً قابل پیش‌بینی‌ترین گزینه‌اند؛ استفاده مجدد از Claude CLI و پروفایل‌های موجود OAuth/توکن Anthropic نیز پشتیبانی می‌شوند.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را برای پشتیبانی از ابزار و تصویر بیازماید.

<ParamField path="--no-probe" type="boolean">
  آزمون‌های زنده را رد کن (فقط فراداده).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازه پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  مدل‌های قدیمی‌تر را رد کن.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازه فهرست جایگزین‌ها.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` را روی نخستین انتخاب تنظیم کن.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` را روی نخستین انتخاب تصویر تنظیم کن.
</ParamField>

<Note>
کاتالوگ `/models` در OpenRouter عمومی است، بنابراین اسکن‌های فقط فراداده می‌توانند گزینه‌های رایگان را بدون کلید فهرست کنند. آزمون و استنتاج همچنان به کلید API OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط فراداده برمی‌گردد و پیکربندی را بدون تغییر می‌گذارد. برای درخواست صریح حالت فقط فراداده از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس موارد زیر رتبه‌بندی می‌شوند:

1. پشتیبانی تصویر
2. تأخیر ابزار
3. اندازه زمینه
4. تعداد پارامترها

ورودی:

- فهرست `/models` در OpenRouter (فیلتر `:free`)
- آزمون‌های زنده به کلید API OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (نگاه کنید به [متغیرهای محیطی](/fa/help/environment))
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/آزمون: `--timeout`، `--concurrency`

وقتی آزمون‌های زنده در TTY اجرا می‌شوند، می‌توانید جایگزین‌ها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را پاس دهید. نتایج فقط فراداده اطلاع‌رسانی هستند؛ `--set-default` و `--set-image` به آزمون‌های زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهنده‌های سفارشی در `models.providers` در `models.json` زیر دایرکتوری عامل نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). این فایل به‌صورت پیش‌فرض ادغام می‌شود، مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="تقدم حالت ادغام">
    تقدم حالت ادغام برای شناسه‌های ارائه‌دهنده مطابق:

    - `baseUrl` غیرخالی که از قبل در `models.json` عامل وجود دارد برنده می‌شود.
    - `apiKey` غیرخالی در `models.json` عامل فقط وقتی برنده می‌شود که آن ارائه‌دهنده در زمینه فعلی پیکربندی/پروفایل احراز هویت توسط SecretRef مدیریت نشده باشد.
    - مقدارهای `apiKey` ارائه‌دهنده مدیریت‌شده توسط SecretRef به‌جای ماندگار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقدارهای هدر ارائه‌دهنده مدیریت‌شده توسط SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - `apiKey`/`baseUrl` خالی یا مفقود عامل به `models.providers` در پیکربندی برمی‌گردد.
    - فیلدهای دیگر ارائه‌دهنده از پیکربندی و داده‌های کاتالوگ نرمال‌شده تازه‌سازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
ماندگاری نشانگر مبتنی بر منبع معتبر است: OpenClaw نشانگرها را از اسنپ‌شات پیکربندی منبع فعال (پیش از حل‌شدن)، نه از مقدارهای راز حل‌شده زمان اجرا، می‌نویسد. این موضوع هر زمان که OpenClaw، `models.json` را دوباره تولید کند اعمال می‌شود، از جمله مسیرهای مبتنی بر فرمان مثل `openclaw agent`.
</Note>

## مرتبط

- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) — Pi، Codex، و دیگر زمان‌های اجرای حلقه عامل
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [جابجایی خرابی مدل](/fa/concepts/model-failover) — زنجیره‌های جایگزین
- [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) — مسیریابی و احراز هویت ارائه‌دهنده
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدئو](/fa/tools/video-generation) — پیکربندی مدل ویدئو
