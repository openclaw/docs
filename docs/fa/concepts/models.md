---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار بازگشت به مدل جایگزین یا تجربه کاربری انتخاب
    - به‌روزرسانی پروب‌های اسکن مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: فهرست، تنظیم، نام‌های مستعار، گزینه‌های جایگزین، اسکن، وضعیت'
title: CLI مدل‌ها
x-i18n:
    generated_at: "2026-04-29T22:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="تغییر مسیر مدل هنگام خرابی" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، دوره‌های انتظار، و نحوه تعامل آن با گزینه‌های جایگزین.
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

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولا زمان‌اجرای سطح پایین عامل را انتخاب نمی‌کنند. برای مثال، `openai/gpt-5.5` بسته به `agents.defaults.agentRuntime.id` می‌تواند از مسیر عادی ارائه‌دهنده OpenAI یا از زمان‌اجرای سرور برنامه Codex اجرا شود. [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.

## انتخاب مدل چگونه کار می‌کند

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="مدل اصلی">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="گزینه‌های جایگزین">
    `agents.defaults.model.fallbacks` (به ترتیب).
  </Step>
  <Step title="تغییر مسیر احراز هویت ارائه‌دهنده هنگام خرابی">
    تغییر مسیر احراز هویت هنگام خرابی، پیش از رفتن به مدل بعدی، داخل یک ارائه‌دهنده رخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سطح‌های مرتبط با مدل">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌علاوه نام‌های مستعار).
    - `agents.defaults.imageModel` **فقط وقتی** استفاده می‌شود که مدل اصلی نتواند تصویر بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شده باشد، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شده باشد، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید تصویر را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شده باشد، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید موسیقی را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدئو استفاده می‌شود. اگر حذف شده باشد، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی و سپس باقی ارائه‌دهندگان ثبت‌شده تولید ویدئو را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌همراه اتصال‌ها بازنویسی کنند ([مسیر‌دهی چندعاملی](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار جایگزینی

همان `provider/model` بسته به اینکه از کجا آمده باشد می‌تواند معنای متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و مدل‌های اصلی ویژه عامل) نقطه شروع عادی هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های جایگزین خودکار، وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون بررسی اولیه یک مدل اصلی شناخته‌شده به‌عنوان خراب، همچنان از زنجیره جایگزین استفاده کنند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخاب‌گر مدل، `session_status(model=...)` و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، OpenClaw به‌جای افتادن به مدل پیکربندی‌شده دیگر، به‌صورت قابل مشاهده شکست می‌خورد.
- `--model` در Cron / مقدار `model` در payload یک مدل اصلی برای هر کار است. همچنان از گزینه‌های جایگزین پیکربندی‌شده استفاده می‌کند، مگر اینکه کار مقدار صریح `fallbacks` را در payload بدهد (برای اجرای سخت‌گیرانه cron از `fallbacks: []` استفاده کنید).
- انتخاب‌گرهای مدل پیش‌فرض و فهرست مجاز CLI به `models.mode: "replace"` احترام می‌گذارند و به‌جای بارگذاری کاتالوگ کامل داخلی، `models.providers.*.models` صریح را فهرست می‌کنند.
- انتخاب‌گر مدل Control UI از Gateway نمای مدل پیکربندی‌شده‌اش را می‌خواهد: اگر `agents.defaults.models` وجود داشته باشد همان، وگرنه `models.providers.*.models` صریح به‌همراه ارائه‌دهندگان دارای احراز هویت قابل استفاده. کاتالوگ کامل داخلی برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` نگه داشته می‌شود.

## سیاست سریع مدل

- مدل اصلی خود را روی قوی‌ترین مدل آخرین نسل که در دسترس شماست تنظیم کنید.
- برای کارهای حساس به هزینه/تاخیر و گفت‌وگوی کم‌ریسک‌تر از گزینه‌های جایگزین استفاده کنید.
- برای عامل‌های دارای ابزار یا ورودی‌های نامطمئن، از رده‌های مدل قدیمی‌تر/ضعیف‌تر پرهیز کنید.

## راه‌اندازی اولیه (توصیه‌شده)

اگر نمی‌خواهید پیکربندی را دستی ویرایش کنید، راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard
```

این می‌تواند مدل + احراز هویت را برای ارائه‌دهندگان رایج تنظیم کند، از جمله **اشتراک OpenAI Code (Codex)** (OAuth) و **Anthropic** (کلید API یا Claude CLI).

## کلیدهای پیکربندی (مرور کلی)

- `agents.defaults.model.primary` و `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (فهرست مجاز + نام‌های مستعار + پارامترهای ارائه‌دهنده)
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
    `openclaw config set` از نقشه‌های مدل/ارائه‌دهنده در برابر بازنویسی ناخواسته محافظت می‌کند. انتساب یک شیء ساده به `agents.defaults.models`، `models.providers` یا `models.providers.<id>.models` وقتی باعث حذف ورودی‌های موجود شود رد می‌شود. برای تغییرهای افزایشی از `--merge` استفاده کنید؛ فقط وقتی از `--replace` استفاده کنید که مقدار ارائه‌شده باید به مقدار کامل هدف تبدیل شود.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های محدود به ارائه‌دهنده را در فهرست مجاز موجود ادغام می‌کنند، بنابراین افزودن Codex، Ollama یا ارائه‌دهنده‌ای دیگر باعث حذف ورودی‌های نامرتبط مدل نمی‌شود. Configure هنگام اعمال دوباره احراز هویت ارائه‌دهنده، `agents.defaults.model.primary` موجود را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و بازنویسی‌های نشست تبدیل می‌شود. وقتی کاربر مدلی را انتخاب کند که در آن فهرست مجاز نیست، OpenClaw برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
این اتفاق **پیش از** تولید یک پاسخ عادی رخ می‌دهد، بنابراین پیام ممکن است این حس را بدهد که «پاسخ نداد». راه‌حل یکی از این‌هاست:

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

## تغییر مدل‌ها در چت (`/model`)

می‌توانید بدون راه‌اندازی مجدد، مدل‌های نشست فعلی را تغییر دهید:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="رفتار انتخاب‌گر">
    - `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار است (خانواده مدل + ارائه‌دهندگان در دسترس).
    - در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل به‌همراه مرحله Submit باز می‌کنند.
    - `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌بودن برمی‌گرداند.
    - `/model <#>` از همان انتخاب‌گر انتخاب می‌کند.

  </Accordion>
  <Accordion title="ماندگاری و تغییر زنده">
    - `/model` انتخاب نشست جدید را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فورا از مدل جدید استفاده می‌کند.
    - اگر اجرا از قبل فعال باشد، OpenClaw تغییر زنده را به‌عنوان در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز، با مدل جدید دوباره شروع می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای اینکه بی‌صدا از `agents.defaults.model.fallbacks` پاسخ دهد، به‌صورت قابل مشاهده شکست می‌خورد. این با پیش‌فرض‌های پیکربندی‌شده و مدل‌های اصلی کارهای cron متفاوت است، که همچنان می‌توانند از زنجیره‌های جایگزین استفاده کنند.
    - `/model status` نمای جزئیات است (نامزدهای احراز هویت و، وقتی پیکربندی شده باشد، نقطه پایانی ارائه‌دهنده `baseUrl` + حالت `api`).

  </Accordion>
  <Accordion title="تجزیه ارجاع">
    - ارجاع‌های مدل با جدا کردن روی **اولین** `/` تجزیه می‌شوند. هنگام تایپ `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسه مدل شامل `/` باشد (سبک OpenRouter)، باید پیشوند ارائه‌دهنده را بیاورید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب حل می‌کند:
      1. تطابق نام مستعار
      2. تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل بدون پیشوند دقیق
      3. بازگشت منسوخ به ارائه‌دهنده پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw در عوض به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد تا از نمایش پیش‌فرض قدیمی ارائه‌دهنده حذف‌شده جلوگیری کند.
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

به‌طور پیش‌فرض مدل‌های پیکربندی‌شده/در دسترس با احراز هویت را نشان می‌دهد. پرچم‌های مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. شامل ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده‌های همراه پیش از پیکربندی احراز هویت است، بنابراین نماهای صرفا اکتشافی می‌توانند مدل‌هایی را نشان دهند که تا وقتی اعتبارنامه‌های مطابق ارائه‌دهنده را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهندگان محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسه ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی انتخاب‌گرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  یک مدل در هر خط.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین.
</ParamField>

### `models status`

مدل اصلی حل‌شده، جایگزین‌ها، مدل تصویر و نمای کلی احراز هویتِ ارائه‌دهندگان پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های یافت‌شده در مخزن احراز هویت نمایش می‌دهد (به‌طور پیش‌فرض، در بازه ۲۴ ساعت هشدار می‌دهد). `--plain` فقط مدل اصلی حل‌شده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="رفتار احراز هویت و probe">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` هم گنجانده می‌شود). اگر یک ارائه‌دهنده پیکربندی‌شده فاقد اعتبارنامه باشد، `models status` یک بخش **احراز هویت ناموجود** چاپ می‌کند.
    - JSON شامل `auth.oauth` (پنجره هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، شامل اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل مخزن احراز هویت است؛ ارائه‌دهندگان صرفاً env در آن ظاهر نمی‌شوند.
    - برای خودکارسازی از `--check` استفاده کنید (خروج با `1` هنگام ناموجود/منقضی بودن، و `2` هنگام نزدیک بودن به انقضا).
    - برای بررسی‌های زنده احراز هویت از `--probe` استفاده کنید؛ ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح، یک پروفایل ذخیره‌شده را حذف کند، probe به‌جای امتحان کردن آن، `excluded_by_auth_order` را گزارش می‌کند. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل probe برای آن ارائه‌دهنده حل نشود، probe مقدار `status: no_model` را گزارش می‌کند.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌فعال، کلیدهای API معمولاً قابل‌پیش‌بینی‌ترین گزینه‌اند؛ استفاده مجدد از Claude CLI و پروفایل‌های OAuth/token موجود Anthropic نیز پشتیبانی می‌شوند.
</Note>

نمونه (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را از نظر پشتیبانی از ابزار و تصویر probe کند.

<ParamField path="--no-probe" type="boolean">
  probeهای زنده را رد کنید (فقط فراداده).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازه پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  مدل‌های قدیمی‌تر را رد کنید.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازه فهرست جایگزین‌ها.
</ParamField>
<ParamField path="--set-default" type="boolean">
  مقدار `agents.defaults.model.primary` را روی اولین انتخاب تنظیم کنید.
</ParamField>
<ParamField path="--set-image" type="boolean">
  مقدار `agents.defaults.imageModel.primary` را روی اولین انتخاب تصویر تنظیم کنید.
</ParamField>

<Note>
کاتالوگ OpenRouter `/models` عمومی است، بنابراین اسکن‌های فقط فراداده می‌توانند نامزدهای رایگان را بدون کلید فهرست کنند. probe و inference همچنان به کلید API OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط فراداده برمی‌گردد و پیکربندی را بدون تغییر باقی می‌گذارد. برای درخواست صریح حالت فقط فراداده، از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس موارد زیر رتبه‌بندی می‌شوند:

1. پشتیبانی از تصویر
2. تأخیر ابزار
3. اندازه زمینه
4. تعداد پارامترها

ورودی:

- فهرست OpenRouter `/models` (فیلتر `:free`)
- probeهای زنده به کلید API OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (نگاه کنید به [متغیرهای محیطی](/fa/help/environment))
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/probe: `--timeout`، `--concurrency`

وقتی probeهای زنده در یک TTY اجرا می‌شوند، می‌توانید جایگزین‌ها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را وارد کنید. نتایج فقط فراداده اطلاع‌رسانی هستند؛ `--set-default` و `--set-image` به probeهای زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل‌استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهندگان سفارشی در `models.providers` درون `models.json` زیر دایرکتوری عامل نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). این فایل به‌طور پیش‌فرض ادغام می‌شود، مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="اولویت حالت ادغام">
    اولویت حالت ادغام برای شناسه‌های ارائه‌دهنده منطبق:

    - `baseUrl` غیرخالی که از قبل در `models.json` عامل وجود دارد، برنده است.
    - `apiKey` غیرخالی در `models.json` عامل فقط وقتی برنده است که آن ارائه‌دهنده در زمینه پیکربندی/پروفایل احراز هویت فعلی تحت مدیریت SecretRef نباشد.
    - مقادیر `apiKey` ارائه‌دهنده تحت مدیریت SecretRef به‌جای پایدار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقادیر هدر ارائه‌دهنده تحت مدیریت SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - `apiKey`/`baseUrl` خالی یا ناموجود عامل به `models.providers` پیکربندی برمی‌گردد.
    - فیلدهای دیگر ارائه‌دهنده از پیکربندی و داده‌های کاتالوگ نرمال‌سازی‌شده تازه‌سازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
پایداری نشانگرها مبتنی بر منبع معتبر است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال (پیش از حل‌سازی) می‌نویسد، نه از مقادیر راز حل‌شده زمان اجرا. این مورد هر زمان که OpenClaw فایل `models.json` را بازتولید کند اعمال می‌شود، از جمله مسیرهای مبتنی بر دستور مانند `openclaw agent`.
</Note>

## مرتبط

- [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) — PI، Codex، و دیگر زمان‌اجراهای حلقه عامل
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [failover مدل](/fa/concepts/model-failover) — زنجیره‌های جایگزین
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers) — مسیریابی و احراز هویت ارائه‌دهنده
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدیو](/fa/tools/video-generation) — پیکربندی مدل ویدیو
