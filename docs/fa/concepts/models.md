---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار بازگشت به مدل جایگزین یا تجربهٔ کاربری انتخاب
    - به‌روزرسانی پروب‌های اسکن مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: فهرست، تنظیم، نام‌های مستعار، جایگزین‌ها، اسکن، وضعیت'
title: CLI مدل‌ها
x-i18n:
    generated_at: "2026-05-02T11:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="جابه‌جایی اضطراری مدل" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، زمان‌های سردسازی، و نحوه تعامل آن با جایگزین‌ها.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers">
    مرور سریع ارائه‌دهنده و مثال‌ها.
  </Card>
  <Card title="زمان‌اجراهای عامل" href="/fa/concepts/agent-runtimes">
    PI، Codex، و زمان‌اجراهای دیگر حلقه عامل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults">
    کلیدهای پیکربندی مدل.
  </Card>
</CardGroup>

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولا زمان‌اجرای سطح‌پایین عامل را انتخاب نمی‌کنند. برای مثال، `openai/gpt-5.5` بسته به `agents.defaults.agentRuntime.id` می‌تواند از مسیر عادی ارائه‌دهنده OpenAI یا از طریق زمان‌اجرای app-server در Codex اجرا شود. در حالت زمان‌اجرای Codex، ارجاع `openai/gpt-*` به معنای صورتحساب‌گیری با کلید API نیست؛ احراز هویت می‌تواند از حساب Codex یا پروفایل احراز هویت `openai-codex` بیاید. [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.

## انتخاب مدل چگونه کار می‌کند

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="مدل اصلی">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="جایگزین‌ها">
    `agents.defaults.model.fallbacks` (به‌ترتیب).
  </Step>
  <Step title="جابه‌جایی اضطراری احراز هویت ارائه‌دهنده">
    جابه‌جایی اضطراری احراز هویت، پیش از رفتن به مدل بعدی، داخل یک ارائه‌دهنده رخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سطح‌های مرتبط با مدل">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌علاوه نام‌های مستعار).
    - `agents.defaults.imageModel` **فقط وقتی** استفاده می‌شود که مدل اصلی نتواند تصویر بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شده باشد، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل پیش‌فرض/نشست حل‌شده برمی‌گردد.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شده باشد، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شده باشد، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدیو استفاده می‌شود. اگر حذف شده باشد، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید ویدیو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌علاوه اتصال‌ها بازنویسی کنند ([مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار جایگزین

همان `provider/model` می‌تواند بسته به این‌که از کجا آمده است، معنی متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و مدل‌های اصلی ویژه عامل) نقطه شروع عادی هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های جایگزین خودکار، وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون آزمودن دوباره یک مدل اصلی شناخته‌شده به‌عنوان بد، همچنان از زنجیره جایگزین استفاده کنند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخابگر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده دسترس‌ناپذیر باشد، OpenClaw به‌جای افتادن روی مدل پیکربندی‌شده دیگر، خطا را آشکار نشان می‌دهد.
- `--model` در Cron / مقدار `model` در بار، مدل اصلی هر کار است. همچنان از جایگزین‌های پیکربندی‌شده استفاده می‌کند مگر این‌که کار، `fallbacks` صریح در بار فراهم کند (برای اجرای سخت‌گیرانه cron از `fallbacks: []` استفاده کنید).
- مدل پیش‌فرض CLI و انتخابگرهای فهرست مجاز با فهرست‌کردن `models.providers.*.models` صریح به‌جای بارگذاری کل کاتالوگ داخلی، به `models.mode: "replace"` احترام می‌گذارند.
- انتخابگر مدل در رابط کنترل، نمای مدل پیکربندی‌شده را از Gateway می‌خواهد: وقتی موجود باشد `agents.defaults.models`، در غیر این صورت `models.providers.*.models` صریح به‌علاوه ارائه‌دهندگانی با احراز هویت قابل استفاده. کل کاتالوگ داخلی برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` نگه داشته می‌شود.

## سیاست سریع مدل

- مدل اصلی خود را روی قوی‌ترین مدل نسل‌جدید در دسترس خود تنظیم کنید.
- برای کارهای حساس به هزینه/تاخیر و گفت‌وگوی کم‌ریسک‌تر از جایگزین‌ها استفاده کنید.
- برای عامل‌های دارای ابزار یا ورودی‌های نامطمئن، از رده‌های مدل قدیمی‌تر/ضعیف‌تر پرهیز کنید.

## راه‌اندازی اولیه (پیشنهادی)

اگر نمی‌خواهید پیکربندی را دستی ویرایش کنید، راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard
```

این می‌تواند مدل + احراز هویت را برای ارائه‌دهندگان رایج تنظیم کند، از جمله **اشتراک OpenAI Code (Codex)** (OAuth) و **Anthropic** (کلید API یا Claude CLI).

## کلیدهای پیکربندی (نمای کلی)

- `agents.defaults.model.primary` و `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (فهرست مجاز + نام‌های مستعار + پارامترهای ارائه‌دهنده)
- `models.providers` (ارائه‌دهندگان سفارشی نوشته‌شده در `models.json`)

<Note>
ارجاع‌های مدل به حروف کوچک نرمال می‌شوند. نام‌های مستعار ارائه‌دهنده مانند `z.ai/*` به `zai/*` نرمال می‌شوند.

نمونه‌های پیکربندی ارائه‌دهنده (از جمله OpenCode) در [OpenCode](/fa/providers/opencode) قرار دارند.
</Note>

### ویرایش‌های امن فهرست مجاز

هنگام به‌روزرسانی دستی `agents.defaults.models` از نوشتن افزایشی استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد محافظت در برابر بازنویسی">
    `openclaw config set` از نگاشت‌های مدل/ارائه‌دهنده در برابر بازنویسی‌های تصادفی محافظت می‌کند. انتساب یک شیء ساده به `agents.defaults.models`، `models.providers`، یا `models.providers.<id>.models` وقتی باعث حذف ورودی‌های موجود شود رد می‌شود. برای تغییرات افزایشی از `--merge` استفاده کنید؛ فقط وقتی مقدار ارائه‌شده باید به مقدار کامل هدف تبدیل شود از `--replace` استفاده کنید.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های محدود به ارائه‌دهنده را با فهرست مجاز موجود ادغام می‌کنند، بنابراین افزودن Codex، Ollama، یا ارائه‌دهنده‌ای دیگر ورودی‌های مدل نامرتبط را حذف نمی‌کند. Configure هنگام اعمال دوباره احراز هویت ارائه‌دهنده، `agents.defaults.model.primary` موجود را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و برای بازنویسی‌های نشست تبدیل می‌شود. وقتی کاربر مدلی را انتخاب کند که در آن فهرست مجاز نیست، OpenClaw برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
این اتفاق **پیش از** تولید یک پاسخ عادی رخ می‌دهد، بنابراین پیام ممکن است این حس را بدهد که «پاسخ نداد». راه‌حل این است که یکی از این کارها را انجام دهید:

- مدل را به `agents.defaults.models` اضافه کنید، یا
- فهرست مجاز را پاک کنید (`agents.defaults.models` را حذف کنید)، یا
- مدلی را از `/model list` انتخاب کنید.

</Warning>

برای مدل‌های محلی/GGUF، ارجاع کامل دارای پیشوند ارائه‌دهنده را در فهرست مجاز ذخیره کنید،
برای مثال `ollama/gemma4:26b`، `lmstudio/Gemma4-26b-a4-it-gguf`، یا
ارائه‌دهنده/مدل دقیقی که توسط `openclaw models list --provider <provider>` نشان داده می‌شود.
نام فایل‌های محلی بدون پیشوند یا نام‌های نمایشی وقتی فهرست مجاز
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
    - `/model` (و `/model list`) یک انتخابگر فشرده و شماره‌دار است (خانواده مدل + ارائه‌دهندگان موجود).
    - در Discord، `/model` و `/models` یک انتخابگر تعاملی با کشویی‌های ارائه‌دهنده و مدل به‌همراه گام Submit باز می‌کنند.
    - در Telegram، انتخاب‌های انتخابگر `/models` محدود به نشست هستند؛ آن‌ها پیش‌فرض پایدار عامل را در `openclaw.json` تغییر نمی‌دهند.
    - `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، پیام منسوخ‌شدن برمی‌گرداند.
    - `/model <#>` از همان انتخابگر انتخاب می‌کند.

  </Accordion>
  <Accordion title="ماندگاری و تغییر زنده">
    - `/model` انتخاب جدید نشست را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فورا از مدل جدید استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw تغییر زنده را به‌عنوان در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید دوباره شروع می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده دسترس‌ناپذیر باشد، پاسخ به‌جای پاسخ‌دادن بی‌سروصدا از `agents.defaults.model.fallbacks`، آشکارا شکست می‌خورد. این با پیش‌فرض‌های پیکربندی‌شده و مدل‌های اصلی کار cron متفاوت است؛ آن‌ها همچنان می‌توانند از زنجیره‌های جایگزین استفاده کنند.
    - `/model status` نمای جزئیات است (گزینه‌های احراز هویت و، وقتی پیکربندی شده باشد، نقطه پایانی ارائه‌دهنده `baseUrl` + حالت `api`).

  </Accordion>
  <Accordion title="تجزیه ارجاع">
    - ارجاع‌های مدل با جداکردن روی **اولین** `/` تجزیه می‌شوند. هنگام تایپ `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسه مدل شامل `/` باشد (سبک OpenRouter)، باید پیشوند ارائه‌دهنده را وارد کنید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب حل می‌کند:
      1. تطبیق نام مستعار
      2. تطبیق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل بدون پیشوند دقیق
      3. بازگشت منسوخ به ارائه‌دهنده پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را عرضه نکند، OpenClaw برای جلوگیری از نمایش پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، در عوض به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
  </Accordion>
</AccordionGroup>

رفتار/پیکربندی کامل فرمان: [فرمان‌های اسلش](/fa/tools/slash-commands).

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

به‌طور پیش‌فرض مدل‌های پیکربندی‌شده/دارای احراز هویت در دسترس را نشان می‌دهد. پرچم‌های مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. شامل ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده‌های همراه، پیش از پیکربندی احراز هویت است؛ بنابراین نماهای فقط-کشف می‌توانند مدل‌هایی را نشان دهند که تا زمانی که اعتبارنامه‌های مطابق ارائه‌دهنده را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهنده‌های محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسهٔ ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی از انتخاب‌گرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  هر خط یک مدل.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین.
</ParamField>

### `models status`

مدل اصلی حل‌شده، جایگزین‌ها، مدل تصویر و نمای کلی احراز هویت ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های یافت‌شده در ذخیره‌گاه احراز هویت نمایش می‌دهد (به‌طور پیش‌فرض در بازهٔ ۲۴ ساعت هشدار می‌دهد). `--plain` فقط مدل اصلی حل‌شده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="رفتار احراز هویت و پروب">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` هم گنجانده می‌شود). اگر ارائه‌دهندهٔ پیکربندی‌شده اعتبارنامه نداشته باشد، `models status` بخشی با عنوان **احراز هویت موجود نیست** چاپ می‌کند.
    - JSON شامل `auth.oauth` (بازهٔ هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، شامل اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل‌های ذخیره‌گاه احراز هویت است؛ ارائه‌دهنده‌های فقط-env در آن ظاهر نمی‌شوند.
    - برای خودکارسازی از `--check` استفاده کنید (در صورت نبود یا انقضا، خروج با `1`؛ در صورت نزدیک بودن انقضا، خروج با `2`).
    - برای بررسی‌های زندهٔ احراز هویت از `--probe` استفاده کنید؛ ردیف‌های پروب می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، پروب به‌جای تلاش برای استفاده از آن، `excluded_by_auth_order` گزارش می‌کند. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل پروبی برای آن ارائه‌دهنده حل نشود، پروب `status: no_model` گزارش می‌کند.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌روشن، کلیدهای API معمولاً قابل پیش‌بینی‌ترین گزینه هستند؛ استفادهٔ دوباره از Claude CLI و پروفایل‌های OAuth/توکن موجود Anthropic نیز پشتیبانی می‌شود.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل‌های رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را برای پشتیبانی از ابزار و تصویر پروب کند.

<ParamField path="--no-probe" type="boolean">
  پروب‌های زنده را رد کنید (فقط فراداده).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازهٔ پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  مدل‌های قدیمی‌تر را رد کنید.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازهٔ فهرست جایگزین‌ها.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` را روی اولین انتخاب تنظیم کنید.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` را روی اولین انتخاب تصویر تنظیم کنید.
</ParamField>

<Note>
کاتالوگ `/models` در OpenRouter عمومی است، بنابراین اسکن‌های فقط-فراداده می‌توانند نامزدهای رایگان را بدون کلید فهرست کنند. پروب و استنتاج همچنان به یک کلید API برای OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط-فراداده برمی‌گردد و پیکربندی را بدون تغییر می‌گذارد. برای درخواست صریح حالت فقط-فراداده از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس این موارد رتبه‌بندی می‌شوند:

1. پشتیبانی از تصویر
2. تأخیر ابزار
3. اندازهٔ زمینه
4. تعداد پارامترها

ورودی:

- فهرست `/models` در OpenRouter (فیلتر `:free`)
- پروب‌های زنده به کلید API برای OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (نگاه کنید به [متغیرهای محیطی](/fa/help/environment))
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/پروب: `--timeout`، `--concurrency`

وقتی پروب‌های زنده در یک TTY اجرا می‌شوند، می‌توانید جایگزین‌ها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را پاس دهید. نتایج فقط-فراداده اطلاع‌رسانی هستند؛ `--set-default` و `--set-image` به پروب‌های زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهنده‌های سفارشی در `models.providers` در `models.json` زیر پوشهٔ عامل نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). این فایل به‌طور پیش‌فرض ادغام می‌شود، مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="اولویت حالت ادغام">
    اولویت حالت ادغام برای شناسه‌های ارائه‌دهندهٔ مطابق:

    - `baseUrl` غیرخالی که از قبل در `models.json` عامل وجود دارد برنده است.
    - `apiKey` غیرخالی در `models.json` عامل فقط زمانی برنده است که آن ارائه‌دهنده در زمینهٔ پیکربندی/پروفایل احراز هویت فعلی با SecretRef مدیریت نشده باشد.
    - مقدارهای `apiKey` ارائه‌دهنده‌های مدیریت‌شده با SecretRef به‌جای پایدارسازی رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقدارهای header ارائه‌دهنده‌های مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - `apiKey`/`baseUrl` خالی یا موجود نبودن آن‌ها در عامل به `models.providers` پیکربندی برمی‌گردد.
    - سایر فیلدهای ارائه‌دهنده از پیکربندی و داده‌های کاتالوگ نرمال‌سازی‌شده تازه‌سازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
پایداری نشانگرها مبتنی بر منبع مرجع است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال (پیش از حل‌کردن) می‌نویسد، نه از مقدارهای راز حل‌شده در زمان اجرا. این رفتار هر زمان که OpenClaw دوباره `models.json` را تولید کند اعمال می‌شود، از جمله مسیرهای فرمان‌محور مانند `openclaw agent`.
</Note>

## مرتبط

- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) — زمان‌های اجرای حلقهٔ عامل برای PI، Codex، و عامل‌های دیگر
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [failover مدل](/fa/concepts/model-failover) — زنجیره‌های جایگزین
- [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) — مسیریابی و احراز هویت ارائه‌دهنده
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدیو](/fa/tools/video-generation) — پیکربندی مدل ویدیو
