---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار بازگشت به مدل جایگزین یا تجربه کاربری انتخاب
    - به‌روزرسانی کاوشگرهای اسکن مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: فهرست کردن، تنظیم، نام‌های مستعار، جایگزین‌ها، پویش، وضعیت'
title: CLI مدل‌ها
x-i18n:
    generated_at: "2026-05-11T20:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model failover" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، دوره‌های سردشدن، و نحوهٔ تعامل آن با جایگزین‌ها.
  </Card>
  <Card title="Model providers" href="/fa/concepts/model-providers">
    مرور سریع ارائه‌دهنده‌ها و نمونه‌ها.
  </Card>
  <Card title="Agent runtimes" href="/fa/concepts/agent-runtimes">
    PI، Codex، و دیگر runtimeهای حلقهٔ عامل.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/config-agents#agent-defaults">
    کلیدهای پیکربندی مدل.
  </Card>
</CardGroup>

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولاً runtime سطح‌پایین عامل را انتخاب نمی‌کنند. ارجاع‌های عامل OpenAI استثنای اصلی هستند: `openai/gpt-5.5` به‌طور پیش‌فرض روی ارائه‌دهندهٔ رسمی OpenAI از طریق runtime سرور برنامهٔ Codex اجرا می‌شود. بازنویسی‌های صریح runtime باید در سیاست ارائه‌دهنده/مدل قرار بگیرند، نه روی کل عامل یا نشست. در حالت runtime مربوط به Codex، ارجاع `openai/gpt-*` به معنی پرداخت با کلید API نیست؛ احراز هویت می‌تواند از یک حساب Codex یا پروفایل احراز هویت `openai-codex` بیاید. [runtimeهای عامل](/fa/concepts/agent-runtimes) را ببینید.

## نحوهٔ کار انتخاب مدل

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="Primary model">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (به‌ترتیب).
  </Step>
  <Step title="Provider auth failover">
    پیش از رفتن به مدل بعدی، failover احراز هویت داخل یک ارائه‌دهنده انجام می‌شود.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Related model surfaces">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌همراه aliasها). برای محدودکردن ارائه‌دهنده‌های قابل مشاهده و در عین حال پویا نگه‌داشتن کشف ارائه‌دهنده، از ورودی‌های `provider/*` استفاده کنید.
    - `agents.defaults.imageModel` **فقط زمانی** استفاده می‌شود که مدل اصلی نتواند تصویر بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شود، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل پیش‌فرض/نشست resolveشده fallback می‌کند.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده با پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهنده‌های ثبت‌شدهٔ باقی‌ماندهٔ تولید تصویر را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده با پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهنده‌های ثبت‌شدهٔ باقی‌ماندهٔ تولید موسیقی را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدئو استفاده می‌شود. اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده با پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهنده‌های ثبت‌شدهٔ باقی‌ماندهٔ تولید ویدئو را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند. اگر یک ارائه‌دهنده/مدل مشخص تنظیم می‌کنید، احراز هویت/کلید API همان ارائه‌دهنده را هم پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌همراه bindingها بازنویسی کنند ([مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار fallback

همان `provider/model` بسته به این‌که از کجا آمده باشد می‌تواند معنی‌های متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و primaryهای مخصوص عامل) نقطهٔ شروع عادی هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های fallback خودکار، وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون آزمودن یک primary خرابِ شناخته‌شده، همچنان از زنجیرهٔ fallback استفاده کنند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخاب‌گر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، OpenClaw به‌جای افتادن روی مدل پیکربندی‌شدهٔ دیگر، خطا را آشکارا نشان می‌دهد.
- Cron `--model` / payload `model` یک primary در سطح هر job است. همچنان از fallbackهای پیکربندی‌شده استفاده می‌کند، مگر اینکه job مقدار payload صریح `fallbacks` ارائه کند (برای اجرای سخت‌گیرانهٔ cron از `fallbacks: []` استفاده کنید).
- مدل پیش‌فرض CLI و انتخاب‌گرهای allowlist به `models.mode: "replace"` احترام می‌گذارند و به‌جای بارگذاری کل کاتالوگ داخلی، `models.providers.*.models` صریح را فهرست می‌کنند.
- انتخاب‌گر مدل در رابط Control از Gateway نمای مدل پیکربندی‌شده‌اش را می‌خواهد: در صورت وجود، `agents.defaults.models`، شامل ورودی‌های سراسری ارائه‌دهنده مانند `provider/*`؛ در غیر این صورت `models.providers.*.models` صریح به‌همراه ارائه‌دهنده‌هایی که احراز هویت قابل استفاده دارند. کل کاتالوگ داخلی فقط برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` رزرو شده است.

## سیاست سریع مدل

- primary خود را روی قوی‌ترین مدل نسل جدیدی که در دسترس شماست تنظیم کنید.
- برای کارهای حساس به هزینه/تأخیر و گفت‌وگوهای کم‌ریسک‌تر از fallbackها استفاده کنید.
- برای عامل‌های دارای ابزار یا ورودی‌های نامطمئن، از رده‌های مدل قدیمی‌تر/ضعیف‌تر پرهیز کنید.

## راه‌اندازی اولیه (توصیه‌شده)

اگر نمی‌خواهید پیکربندی را دستی ویرایش کنید، راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard
```

این فرمان می‌تواند مدل + احراز هویت را برای ارائه‌دهنده‌های رایج تنظیم کند، از جمله **اشتراک OpenAI Code (Codex)** (OAuth) و **Anthropic** (کلید API یا Claude CLI).

## کلیدهای پیکربندی (مرور کلی)

- `agents.defaults.model.primary` و `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliasها + پارامترهای ارائه‌دهنده + ورودی‌های پویأ ارائه‌دهندهٔ `provider/*`)
- `models.providers` (ارائه‌دهنده‌های سفارشی نوشته‌شده در `models.json`)

<Note>
ارجاع‌های مدل به حروف کوچک نرمال‌سازی می‌شوند. aliasهای ارائه‌دهنده مانند `z.ai/*` به `zai/*` نرمال‌سازی می‌شوند.

نمونه‌های پیکربندی ارائه‌دهنده (از جمله OpenCode) در [OpenCode](/fa/providers/opencode) قرار دارند.
</Note>

### ویرایش‌های امن allowlist

هنگام به‌روزرسانی دستی `agents.defaults.models` از نوشتن‌های افزایشی استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Clobber protection rules">
    `openclaw config set` از mapهای مدل/ارائه‌دهنده در برابر clobber شدن تصادفی محافظت می‌کند. انتساب یک شیء ساده به `agents.defaults.models`، `models.providers`، یا `models.providers.<id>.models` زمانی رد می‌شود که باعث حذف ورودی‌های موجود شود. برای تغییرات افزایشی از `--merge` استفاده کنید؛ فقط وقتی از `--replace` استفاده کنید که مقدار ارائه‌شده باید به مقدار کامل مقصد تبدیل شود.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های محدود به ارائه‌دهنده را در allowlist موجود merge می‌کنند، بنابراین افزودن Codex، Ollama، یا ارائه‌دهندهٔ دیگر باعث حذف ورودی‌های مدل نامرتبط نمی‌شود. Configure هنگام اعمال دوبارهٔ احراز هویت ارائه‌دهنده، مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، به **allowlist** برای `/model` و بازنویسی‌های نشست تبدیل می‌شود. وقتی کاربر مدلی را انتخاب کند که در آن allowlist نیست، OpenClaw این را برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
این اتفاق **پیش از** تولید یک پاسخ عادی رخ می‌دهد، بنابراین پیام ممکن است این حس را بدهد که «پاسخ نداد». راه‌حل یکی از این‌هاست:

- مدل را به `agents.defaults.models` اضافه کنید، یا
- allowlist را پاک کنید (`agents.defaults.models` را حذف کنید)، یا
- مدلی را از `/model list` انتخاب کنید.

</Warning>

وقتی فرمان ردشده شامل بازنویسی runtime مانند `/model openai/gpt-5.5 --runtime codex` بود، ابتدا allowlist را اصلاح کنید، سپس همان فرمان `/model ... --runtime ...` را دوباره امتحان کنید. برای اجرای بومی Codex، مدل انتخاب‌شده همچنان `openai/gpt-5.5` است؛ runtime `codex` harness را انتخاب می‌کند و احراز هویت Codex را جداگانه به‌کار می‌گیرد.

برای مدل‌های محلی/GGUF، ارجاع کامل دارای پیشوند ارائه‌دهنده را در allowlist ذخیره کنید،
برای مثال `ollama/gemma4:26b`، `lmstudio/Gemma4-26b-a4-it-gguf`، یا
همان provider/model دقیقی که `openclaw models list --provider <provider>` نشان می‌دهد.
نام فایل‌های محلی بدون پیشوند یا نام‌های نمایشی وقتی allowlist
فعال است کافی نیستند.

اگر می‌خواهید ارائه‌دهنده‌ها را بدون فهرست‌کردن دستی هر مدل محدود کنید،
ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید:

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

با این سیاست، `/model`، `/models`، و انتخاب‌گرهای مدل کاتالوگ کشف‌شده را
فقط برای همان ارائه‌دهنده‌ها نشان می‌دهند. مدل‌های جدید از ارائه‌دهنده‌های انتخاب‌شده می‌توانند
بدون ویرایش allowlist ظاهر شوند. وقتی به یک مدل مشخص از ارائه‌دهنده‌ای دیگر نیاز دارید،
ورودی‌های دقیق `provider/model` می‌توانند با ورودی‌های `provider/*` ترکیب شوند.

نمونهٔ پیکربندی allowlist:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## تعویض مدل‌ها در گفت‌وگو (`/model`)

می‌توانید بدون راه‌اندازی دوباره، مدل‌ها را برای نشست فعلی تعویض کنید:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Picker behavior">
    - `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار است (خانوادهٔ مدل + ارائه‌دهنده‌های موجود).
    - در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با dropdownهای ارائه‌دهنده و مدل به‌همراه مرحلهٔ Submit باز می‌کنند.
    - در Telegram، انتخاب‌های انتخاب‌گر `/models` محدود به نشست هستند؛ آن‌ها پیش‌فرض پایدار عامل را در `openclaw.json` تغییر نمی‌دهند.
    - `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از داخل گفت‌وگو، پیام منسوخ‌شدن برمی‌گرداند.
    - `/model <#>` از همان انتخاب‌گر انتخاب می‌کند.

  </Accordion>
  <Accordion title="Persistence and live switching">
    - `/model` انتخاب جدید نشست را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از مدل جدید استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تعویض زنده را در حالت pending علامت‌گذاری می‌کند و فقط در یک نقطهٔ retry تمیز با مدل جدید restart می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تعویض pending می‌تواند تا یک فرصت retry بعدی یا نوبت بعدی کاربر در صف بماند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای جواب‌دادن بی‌صدا از `agents.defaults.model.fallbacks`، آشکارا شکست می‌خورد. این با پیش‌فرض‌های پیکربندی‌شده و primaryهای job مربوط به cron فرق دارد که همچنان می‌توانند از زنجیره‌های fallback استفاده کنند.
    - `/model status` نمای جزئیات است (نامزدهای احراز هویت و، در صورت پیکربندی، `baseUrl` مربوط به endpoint ارائه‌دهنده + حالت `api`).

  </Accordion>
  <Accordion title="Ref parsing">
    - ارجاع‌های مدل با جدا کردن روی **نخستین** `/` تجزیه می‌شوند. هنگام وارد کردن `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسهٔ مدل شامل `/` باشد (به سبک OpenRouter)، باید پیشوند ارائه‌دهنده را وارد کنید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب resolve می‌کند:
      1. تطابق alias
      2. تطابق یکتای ارائه‌دهندهٔ پیکربندی‌شده برای همان شناسهٔ مدل بدون پیشوند
      3. بازگشت منسوخ به ارائه‌دهندهٔ پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw در عوض برای جلوگیری از نمایش پیش‌فرض کهنهٔ ارائه‌دهندهٔ حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده بازمی‌گردد.
  </Accordion>
</AccordionGroup>

رفتار/پیکربندی کامل دستور: [دستورات Slash](/fa/tools/slash-commands).

## دستورات CLI

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

`openclaw models` (بدون زیردستور) میان‌بری برای `models status` است.

### `models list`

به‌طور پیش‌فرض مدل‌های پیکربندی‌شده/در دسترس از نظر احراز هویت را نشان می‌دهد. flagهای مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهندهٔ همراه را پیش از پیکربندی احراز هویت شامل می‌شود، بنابراین نماهای صرفاً اکتشافی می‌توانند مدل‌هایی را نشان دهند که تا زمانی که اعتبارنامه‌های مطابق ارائه‌دهنده را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهنده‌های محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسهٔ ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی از انتخابگرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  یک مدل در هر خط.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین.
</ParamField>

### `models status`

مدل اصلی resolveشده، fallbackها، مدل تصویر و نمای کلی احراز هویت ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های یافت‌شده در مخزن احراز هویت نمایش می‌دهد (به‌طور پیش‌فرض در بازهٔ ۲۴ ساعت هشدار می‌دهد). `--plain` فقط مدل اصلی resolveشده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` نیز گنجانده می‌شود). اگر ارائه‌دهندهٔ پیکربندی‌شده‌ای اعتبارنامه نداشته باشد، `models status` بخشی با عنوان **احراز هویت گمشده** چاپ می‌کند.
    - JSON شامل `auth.oauth` (پنجرهٔ هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، شامل اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل مخزن احراز هویت است؛ ارائه‌دهنده‌های فقط-env در آن ظاهر نمی‌شوند.
    - برای خودکارسازی از `--check` استفاده کنید (هنگام نبودن/منقضی بودن خروج با `1`، هنگام نزدیک بودن انقضا خروج با `2`).
    - برای بررسی‌های زندهٔ احراز هویت از `--probe` استفاده کنید؛ ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، probe به‌جای تلاش برای آن، `excluded_by_auth_order` را گزارش می‌کند. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل probe برای آن ارائه‌دهنده resolve نشود، probe مقدار `status: no_model` را گزارش می‌کند.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌روشن، کلیدهای API معمولاً قابل‌پیش‌بینی‌ترین گزینه‌اند؛ استفادهٔ دوباره از Claude CLI و پروفایل‌های OAuth/توکن موجود Anthropic نیز پشتیبانی می‌شود.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را برای پشتیبانی از ابزار و تصویر probe کند.

<ParamField path="--no-probe" type="boolean">
  از probeهای زنده صرف‌نظر کن (فقط metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازهٔ پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  مدل‌های قدیمی‌تر را رد کن.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازهٔ فهرست fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` را روی نخستین انتخاب تنظیم کن.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` را روی نخستین انتخاب تصویر تنظیم کن.
</ParamField>

<Note>
کاتالوگ `/models` OpenRouter عمومی است، بنابراین اسکن‌های فقط-metadata می‌توانند نامزدهای رایگان را بدون کلید فهرست کنند. probe و inference همچنان به کلید API OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط-metadata بازمی‌گردد و پیکربندی را بدون تغییر می‌گذارد. برای درخواست صریح حالت فقط-metadata از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس موارد زیر رتبه‌بندی می‌شوند:

1. پشتیبانی تصویر
2. تأخیر ابزار
3. اندازهٔ زمینه
4. تعداد پارامترها

ورودی:

- فهرست `/models` در OpenRouter (فیلتر `:free`)
- probeهای زنده به کلید API OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (نگاه کنید به [متغیرهای محیطی](/fa/help/environment))
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/probe: `--timeout`، `--concurrency`

وقتی probeهای زنده در یک TTY اجرا می‌شوند، می‌توانید fallbackها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را پاس دهید. نتایج فقط-metadata اطلاع‌رسانی هستند؛ `--set-default` و `--set-image` به probeهای زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهنده‌های سفارشی در `models.providers` در فایل `models.json` زیر دایرکتوری عامل نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). این فایل به‌طور پیش‌فرض merge می‌شود مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    تقدم حالت merge برای شناسه‌های ارائه‌دهندهٔ مطابق:

    - `baseUrl` غیرخالی که از قبل در `models.json` عامل وجود دارد برنده است.
    - `apiKey` غیرخالی در `models.json` عامل فقط زمانی برنده است که آن ارائه‌دهنده در زمینهٔ پیکربندی/پروفایل احراز هویت فعلی تحت مدیریت SecretRef نباشد.
    - مقادیر `apiKey` ارائه‌دهندهٔ تحت مدیریت SecretRef به‌جای ماندگار کردن رازهای resolveشده، از markerهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - مقادیر header ارائه‌دهندهٔ تحت مدیریت SecretRef از markerهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
    - `apiKey`/`baseUrl` خالی یا گمشدهٔ عامل به `models.providers` پیکربندی fallback می‌کند.
    - فیلدهای دیگر ارائه‌دهنده از پیکربندی و داده‌های کاتالوگ نرمال‌شده تازه‌سازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
ماندگاری marker منبع‌محور است: OpenClaw markerها را از snapshot پیکربندی منبع فعال (پیش از resolution) می‌نویسد، نه از مقادیر راز resolveشدهٔ runtime. این موضوع هر زمان که OpenClaw فایل `models.json` را دوباره تولید کند اعمال می‌شود، از جمله مسیرهای مبتنی بر دستور مانند `openclaw agent`.
</Note>

## مرتبط

- [runtimeهای عامل](/fa/concepts/agent-runtimes) — PI، Codex و runtimeهای دیگر حلقهٔ عامل
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [failover مدل](/fa/concepts/model-failover) — زنجیره‌های fallback
- [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) — مسیریابی ارائه‌دهنده و احراز هویت
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدئو](/fa/tools/video-generation) — پیکربندی مدل ویدئو
