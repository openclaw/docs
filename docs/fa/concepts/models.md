---
read_when:
    - افزودن یا تغییر CLI مدل‌ها (models list/set/scan/aliases/fallbacks)
    - تغییر رفتار جایگزینی مدل یا تجربه کاربری انتخاب
    - به‌روزرسانی کاوشگرهای اسکن مدل (ابزارها/تصاویر)
sidebarTitle: Models CLI
summary: 'CLI مدل‌ها: فهرست، تنظیم، نام‌های مستعار، مسیرهای جایگزین، اسکن، وضعیت'
title: مدل‌های CLI
x-i18n:
    generated_at: "2026-06-27T17:34:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="جایگزینی خودکار مدل" href="/fa/concepts/model-failover">
    چرخش پروفایل احراز هویت، دوره‌های خنک‌سازی، و نحوه تعامل آن با جایگزین‌ها.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers">
    مرور سریع ارائه‌دهنده و نمونه‌ها.
  </Card>
  <Card title="زمان‌اجراهای عامل" href="/fa/concepts/agent-runtimes">
    OpenClaw، Codex، و دیگر زمان‌اجراهای حلقه عامل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults">
    کلیدهای پیکربندی مدل.
  </Card>
</CardGroup>

ارجاع‌های مدل یک ارائه‌دهنده و مدل را انتخاب می‌کنند. آن‌ها معمولا زمان‌اجرای سطح‌پایین عامل را انتخاب نمی‌کنند. ارجاع‌های عامل OpenAI استثنای اصلی هستند: `openai/gpt-5.5` به‌طور پیش‌فرض روی ارائه‌دهنده رسمی OpenAI از طریق زمان‌اجرای سرور برنامه Codex اجرا می‌شود. ارجاع‌های اشتراکی Copilot (`github-copilot/*`) علاوه بر این می‌توانند به Plugin زمان‌اجرای عامل خارجی GitHub Copilot وارد شوند — آن مسیر صریح باقی می‌ماند (بدون جایگزین `auto`). بازنویسی‌های صریح زمان‌اجرا به سیاست ارائه‌دهنده/مدل تعلق دارند، نه به کل عامل یا نشست. در حالت زمان‌اجرای Codex، ارجاع `openai/gpt-*` به معنای صورتحساب‌گیری کلید API نیست؛ احراز هویت می‌تواند از یک حساب Codex یا پروفایل OAuth `openai` بیاید. [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) و [زمان‌اجرای عامل GitHub Copilot](/fa/plugins/copilot) را ببینید.

## انتخاب مدل چگونه کار می‌کند

OpenClaw مدل‌ها را به این ترتیب انتخاب می‌کند:

<Steps>
  <Step title="مدل اصلی">
    `agents.defaults.model.primary` (یا `agents.defaults.model`).
  </Step>
  <Step title="جایگزین‌ها">
    `agents.defaults.model.fallbacks` (به‌ترتیب).
  </Step>
  <Step title="جایگزینی خودکار احراز هویت ارائه‌دهنده">
    جایگزینی خودکار احراز هویت پیش از رفتن به مدل بعدی، داخل یک ارائه‌دهنده رخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سطوح مرتبط با مدل">
    - `agents.defaults.models` فهرست مجاز/کاتالوگ مدل‌هایی است که OpenClaw می‌تواند استفاده کند (به‌علاوه نام‌های مستعار). از ورودی‌های `provider/*` برای محدود کردن ارائه‌دهندگان قابل‌مشاهده استفاده کنید، در حالی که کشف ارائه‌دهنده پویا می‌ماند.
    - `agents.defaults.imageModel` **فقط زمانی** استفاده می‌شود که مدل اصلی نتواند تصویرها را بپذیرد.
    - `agents.defaults.pdfModel` توسط ابزار `pdf` استفاده می‌شود. اگر حذف شود، ابزار ابتدا به `agents.defaults.imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
    - `agents.defaults.imageGenerationModel` توسط قابلیت مشترک تولید تصویر استفاده می‌شود. اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.musicGenerationModel` توسط قابلیت مشترک تولید موسیقی استفاده می‌شود. اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - `agents.defaults.videoGenerationModel` توسط قابلیت مشترک تولید ویدئو استفاده می‌شود. اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید ویدئو را به‌ترتیب شناسه ارائه‌دهنده. اگر ارائه‌دهنده/مدل مشخصی تنظیم می‌کنید، احراز هویت/کلید API آن ارائه‌دهنده را هم پیکربندی کنید.
    - پیش‌فرض‌های هر عامل می‌توانند `agents.defaults.model` را از طریق `agents.list[].model` به‌همراه اتصال‌ها بازنویسی کنند ([مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید).

  </Accordion>
</AccordionGroup>

## منبع انتخاب و رفتار جایگزین

یک `provider/model` یکسان می‌تواند بسته به این‌که از کجا آمده، معنای متفاوتی داشته باشد:

- پیش‌فرض‌های پیکربندی‌شده (`agents.defaults.model.primary` و مدل‌های اصلی ویژه عامل) نقطه شروع عادی هستند و از `agents.defaults.model.fallbacks` استفاده می‌کنند.
- انتخاب‌های جایگزین خودکار وضعیت بازیابی موقت هستند. آن‌ها با `modelOverrideSource: "auto"` ذخیره می‌شوند تا نوبت‌های بعدی بتوانند بدون آزمودن هر باره یک مدل اصلی شناخته‌شده معیوب، همچنان از زنجیره جایگزین استفاده کنند؛ OpenClaw به‌صورت دوره‌ای مدل اصلی اولیه را دوباره می‌آزماید، پس از بازیابی انتخاب خودکار را پاک می‌کند، و گذارهای جایگزینی/بازیابی را یک بار به‌ازای هر تغییر وضعیت اعلام می‌کند.
- انتخاب‌های نشست کاربر دقیق هستند. `/model`، انتخابگر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را ذخیره می‌کنند؛ اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، OpenClaw به‌جای عبور به مدل پیکربندی‌شده دیگر، به‌صورت قابل‌مشاهده شکست می‌خورد.
- تغییر `agents.defaults.model.primary` انتخاب‌های نشست موجود را بازنویسی نمی‌کند. اگر وضعیت می‌گوید `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`، انتخاب نشست فعلی را با `/model default` پاک کنید تا دوباره مدل اصلی پیکربندی‌شده را به ارث ببرد.
- Cron `--model` / محموله `model` یک مدل اصلی برای هر کار است. همچنان از جایگزین‌های پیکربندی‌شده استفاده می‌کند مگر این‌که کار، محموله صریح `fallbacks` را فراهم کند (برای اجرای سخت‌گیرانه cron از `fallbacks: []` استفاده کنید).
- انتخابگرهای مدل پیش‌فرض CLI و فهرست مجاز با فهرست کردن `models.providers.*.models` صریح به‌جای بارگذاری کاتالوگ داخلی کامل، به `models.mode: "replace"` احترام می‌گذارند.
- انتخابگر مدل Control UI از Gateway نمای مدل پیکربندی‌شده‌اش را می‌خواهد: در صورت وجود، `agents.defaults.models`، شامل ورودی‌های سراسری ارائه‌دهنده `provider/*`، وگرنه `models.providers.*.models` صریح به‌علاوه ارائه‌دهندگانی با احراز هویت قابل‌استفاده. کاتالوگ داخلی کامل برای نماهای مرور صریح مانند `models.list` با `view: "all"` یا `openclaw models list --all` رزرو شده است.

## سیاست سریع مدل

- مدل اصلی خود را روی قوی‌ترین مدل نسل جدیدی که در دسترس شماست تنظیم کنید.
- برای کارهای حساس به هزینه/تأخیر و گفت‌وگوی کم‌ریسک‌تر، از جایگزین‌ها استفاده کنید.
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
- `agents.defaults.models` (فهرست مجاز + نام‌های مستعار + پارامترهای ارائه‌دهنده + ورودی‌های ارائه‌دهنده پویای `provider/*`)
- `models.providers` (ارائه‌دهندگان سفارشی نوشته‌شده در `models.json`)

<Note>
ارجاع‌های مدل به حروف کوچک نرمال‌سازی می‌شوند. شناسه‌های ارائه‌دهنده در غیر این صورت دقیق هستند؛ از شناسه ارائه‌دهنده‌ای استفاده کنید که Plugin اعلام کرده است.

نمونه‌های پیکربندی ارائه‌دهنده (شامل OpenCode) در [OpenCode](/fa/providers/opencode) قرار دارند.
</Note>

### ویرایش‌های ایمن فهرست مجاز

هنگام به‌روزرسانی دستی `agents.defaults.models` از نوشتن‌های افزایشی استفاده کنید:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="قواعد محافظت در برابر بازنویسی ناخواسته">
    `openclaw config set` از نگاشت‌های مدل/ارائه‌دهنده در برابر بازنویسی ناخواسته محافظت می‌کند. انتساب یک شیء ساده به `agents.defaults.models`، `models.providers`، یا `models.providers.<id>.models` وقتی باعث حذف ورودی‌های موجود شود رد می‌شود. برای تغییرات افزایشی از `--merge` استفاده کنید؛ فقط زمانی از `--replace` استفاده کنید که مقدار ارائه‌شده باید به مقدار کامل هدف تبدیل شود.

    راه‌اندازی تعاملی ارائه‌دهنده و `openclaw configure --section model` نیز انتخاب‌های محدود به ارائه‌دهنده را در فهرست مجاز موجود ادغام می‌کنند، بنابراین افزودن Codex، Ollama، یا ارائه‌دهنده‌ای دیگر، ورودی‌های مدل نامرتبط را حذف نمی‌کند. Configure هنگام اعمال دوباره احراز هویت ارائه‌دهنده، `agents.defaults.model.primary` موجود را حفظ می‌کند. فرمان‌های صریح تنظیم پیش‌فرض مانند `openclaw models auth login --provider <id> --set-default` و `openclaw models set <model>` همچنان `agents.defaults.model.primary` را جایگزین می‌کنند.

  </Accordion>
</AccordionGroup>

## «مدل مجاز نیست» (و چرا پاسخ‌ها متوقف می‌شوند)

اگر `agents.defaults.models` تنظیم شده باشد، برای `/model` و بازنویسی‌های نشست به **فهرست مجاز** تبدیل می‌شود. وقتی کاربر مدلی را انتخاب می‌کند که در آن فهرست مجاز نیست، OpenClaw برمی‌گرداند:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
این اتفاق **پیش از** تولید یک پاسخ عادی رخ می‌دهد، بنابراین ممکن است پیام طوری به نظر برسد که «پاسخ نداده است». راه‌حل یکی از این‌هاست:

- مدل را به `agents.defaults.models` اضافه کنید، یا
- فهرست مجاز را پاک کنید (`agents.defaults.models` را حذف کنید)، یا
- مدلی را از `/model list` انتخاب کنید.

</Warning>

وقتی فرمان ردشده شامل یک بازنویسی زمان‌اجرا مانند `/model openai/gpt-5.5 --runtime codex` بود، ابتدا فهرست مجاز را اصلاح کنید، سپس همان فرمان `/model ... --runtime ...` را دوباره امتحان کنید. برای اجرای بومی Codex، مدل انتخاب‌شده همچنان `openai/gpt-5.5` است؛ زمان‌اجرای `codex` مهار را انتخاب می‌کند و جداگانه از احراز هویت Codex استفاده می‌کند.

برای مدل‌های محلی/GGUF، ارجاع کامل دارای پیشوند ارائه‌دهنده را در فهرست مجاز ذخیره کنید،
برای مثال `ollama/gemma4:26b`، `lmstudio/Gemma4-26b-a4-it-gguf`، یا
provider/model دقیقی که `openclaw models list --provider <provider>` نشان می‌دهد.
نام فایل‌های محلی خام یا نام‌های نمایشی وقتی فهرست مجاز فعال است کافی نیستند.

اگر می‌خواهید ارائه‌دهندگان را بدون فهرست کردن دستی همه مدل‌ها محدود کنید،
ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

با آن سیاست، `/model`، `/models`، و انتخابگرهای مدل فقط کاتالوگ کشف‌شده
برای آن ارائه‌دهندگان را نشان می‌دهند. مدل‌های جدید از ارائه‌دهندگان انتخاب‌شده می‌توانند
بدون ویرایش فهرست مجاز ظاهر شوند. وقتی به یک مدل مشخص از ارائه‌دهنده‌ای دیگر نیاز دارید،
ورودی‌های دقیق `provider/model` را می‌توان با ورودی‌های `provider/*` ترکیب کرد.

نمونه پیکربندی فهرست مجاز:

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

## تغییر مدل‌ها در گفت‌وگو (`/model`)

می‌توانید مدل‌ها را برای نشست فعلی بدون راه‌اندازی مجدد تغییر دهید:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="رفتار انتخابگر">
    - `/model` (و `/model list`) یک انتخابگر فشرده و شماره‌دار است (خانواده مدل + ارائه‌دهندگان موجود).
    - در Discord، `/model` و `/models` یک انتخابگر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل به‌همراه مرحله Submit باز می‌کنند.
    - در Telegram، انتخاب‌های انتخابگر `/models` محدود به نشست هستند؛ آن‌ها پیش‌فرض پایدار عامل را در `openclaw.json` تغییر نمی‌دهند.
    - `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، یک پیام منسوخ‌شدن برمی‌گرداند.
    - `/model <#>` از آن انتخابگر انتخاب می‌کند.

  </Accordion>
  <Accordion title="پایداری و جابه‌جایی زنده">
    - `/model` انتخاب نشست جدید را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فوراً از مدل جدید استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک جابه‌جایی زنده را به‌صورت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطهٔ تلاش مجدد تمیز، با مدل جدید دوباره شروع می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، جابه‌جایی در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت کاربر بعدی در صف بماند.
    - `/model default` انتخاب نشست را پاک می‌کند و نشست را به مدل پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    - ارجاع `/model` انتخاب‌شده توسط کاربر برای آن نشست سخت‌گیرانه است: اگر ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌صورت آشکار شکست می‌خورد و به‌جای آن بی‌صدا از `agents.defaults.model.fallbacks` پاسخ نمی‌دهد. این با پیش‌فرض‌های پیکربندی‌شده و مدل‌های اصلی کارهای cron متفاوت است، که همچنان می‌توانند از زنجیره‌های جایگزین استفاده کنند.
    - `/model status` نمای جزئیات است (نامزدهای احراز هویت و، هنگام پیکربندی، نقطهٔ پایانی ارائه‌دهنده `baseUrl` + حالت `api`).

  </Accordion>
  <Accordion title="تجزیهٔ ارجاع">
    - ارجاع‌های مدل با تقسیم بر اساس **اولین** `/` تجزیه می‌شوند. هنگام نوشتن `/model <ref>` از `provider/model` استفاده کنید.
    - اگر خود شناسهٔ مدل شامل `/` باشد (به سبک OpenRouter)، باید پیشوند ارائه‌دهنده را وارد کنید (مثال: `/model openrouter/moonshotai/kimi-k2`).
    - اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را به این ترتیب حل می‌کند:
      1. تطبیق نام مستعار
      2. تطبیق یکتای ارائه‌دهندهٔ پیکربندی‌شده برای همان شناسهٔ مدل دقیقاً بدون پیشوند
      3. بازگشت منسوخ به ارائه‌دهندهٔ پیش‌فرض پیکربندی‌شده — اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را عرضه نکند، OpenClaw در عوض برای جلوگیری از نمایش پیش‌فرض کهنهٔ ارائه‌دهندهٔ حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده بازمی‌گردد.
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

به‌طور پیش‌فرض مدل‌های پیکربندی‌شده/در دسترس از نظر احراز هویت را نشان می‌دهد. پرچم‌های مفید:

<ParamField path="--all" type="boolean">
  کاتالوگ کامل. شامل ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهندهٔ همراه پیش از پیکربندی احراز هویت است، بنابراین نماهای فقط کشف می‌توانند مدل‌هایی را نشان دهند که تا وقتی اعتبارنامه‌های ارائه‌دهندهٔ منطبق را اضافه نکنید در دسترس نیستند.
</ParamField>
<ParamField path="--local" type="boolean">
  فقط ارائه‌دهنده‌های محلی.
</ParamField>
<ParamField path="--provider <id>" type="string">
  فیلتر بر اساس شناسهٔ ارائه‌دهنده، برای مثال `moonshot`. برچسب‌های نمایشی از انتخابگرهای تعاملی پذیرفته نمی‌شوند.
</ParamField>
<ParamField path="--plain" type="boolean">
  هر خط یک مدل.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین.
</ParamField>

### `models status`

مدل اصلی حل‌شده، جایگزین‌ها، مدل تصویر، و نمای کلی احراز هویت ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد. همچنین وضعیت انقضای OAuth را برای پروفایل‌های یافت‌شده در مخزن احراز هویت نمایش می‌دهد (به‌طور پیش‌فرض در ۲۴ ساعت پایانی هشدار می‌دهد). `--plain` فقط مدل اصلی حل‌شده را چاپ می‌کند.

<AccordionGroup>
  <Accordion title="رفتار احراز هویت و کاوش">
    - وضعیت OAuth همیشه نشان داده می‌شود (و در خروجی `--json` گنجانده می‌شود). اگر یک ارائه‌دهندهٔ پیکربندی‌شده اعتبارنامه نداشته باشد، `models status` بخش **احراز هویت مفقود** را چاپ می‌کند.
    - JSON شامل `auth.oauth` (پنجرهٔ هشدار + پروفایل‌ها) و `auth.providers` (احراز هویت مؤثر برای هر ارائه‌دهنده، از جمله اعتبارنامه‌های مبتنی بر env) است. `auth.oauth` فقط سلامت پروفایل مخزن احراز هویت است؛ ارائه‌دهنده‌های فقط env در آن ظاهر نمی‌شوند.
    - برای اتوماسیون از `--check` استفاده کنید (کد خروج `1` هنگام مفقود/منقضی، `2` هنگام نزدیک به انقضا).
    - برای بررسی‌های زندهٔ احراز هویت از `--probe` استفاده کنید؛ ردیف‌های کاوش می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
    - اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، کاوش به‌جای امتحان کردن آن، `excluded_by_auth_order` گزارش می‌کند. اگر احراز هویت وجود داشته باشد اما هیچ مدل قابل کاوشی برای آن ارائه‌دهنده حل نشود، کاوش `status: no_model` گزارش می‌کند.

  </Accordion>
</AccordionGroup>

<Note>
انتخاب احراز هویت به ارائه‌دهنده/حساب وابسته است. برای میزبان‌های Gateway همیشه‌روشن، کلیدهای API معمولاً قابل‌پیش‌بینی‌ترین گزینه هستند؛ استفادهٔ دوباره از Claude CLI و پروفایل‌های OAuth/توکن Anthropic موجود نیز پشتیبانی می‌شود.
</Note>

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## اسکن (مدل‌های رایگان OpenRouter)

`openclaw models scan` **کاتالوگ مدل‌های رایگان** OpenRouter را بررسی می‌کند و می‌تواند به‌صورت اختیاری مدل‌ها را برای پشتیبانی از ابزار و تصویر کاوش کند.

<ParamField path="--no-probe" type="boolean">
  رد کردن کاوش‌های زنده (فقط فراداده).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  حداقل اندازهٔ پارامتر (میلیارد).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  رد کردن مدل‌های قدیمی‌تر.
</ParamField>
<ParamField path="--provider <name>" type="string">
  فیلتر پیشوند ارائه‌دهنده.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  اندازهٔ فهرست جایگزین.
</ParamField>
<ParamField path="--set-default" type="boolean">
  تنظیم `agents.defaults.model.primary` روی اولین انتخاب.
</ParamField>
<ParamField path="--set-image" type="boolean">
  تنظیم `agents.defaults.imageModel.primary` روی اولین انتخاب تصویر.
</ParamField>

<Note>
کاتالوگ `/models` OpenRouter عمومی است، بنابراین اسکن‌های فقط فراداده می‌توانند نامزدهای رایگان را بدون کلید فهرست کنند. کاوش و استنتاج همچنان به یک کلید API OpenRouter نیاز دارند (از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY`). اگر هیچ کلیدی در دسترس نباشد، `openclaw models scan` به خروجی فقط فراداده بازمی‌گردد و پیکربندی را بدون تغییر می‌گذارد. برای درخواست صریح حالت فقط فراداده از `--no-probe` استفاده کنید.
</Note>

نتایج اسکن بر اساس این موارد رتبه‌بندی می‌شوند:

1. پشتیبانی از تصویر
2. تأخیر ابزار
3. اندازهٔ زمینه
4. تعداد پارامترها

ورودی:

- فهرست `/models` OpenRouter (فیلتر `:free`)
- کاوش‌های زنده به کلید API OpenRouter از پروفایل‌های احراز هویت یا `OPENROUTER_API_KEY` نیاز دارند (به [متغیرهای محیطی](/fa/help/environment) مراجعه کنید)
- فیلترهای اختیاری: `--max-age-days`، `--min-params`، `--provider`، `--max-candidates`
- کنترل‌های درخواست/کاوش: `--timeout`، `--concurrency`

وقتی کاوش‌های زنده در TUI اجرا شوند، می‌توانید جایگزین‌ها را به‌صورت تعاملی انتخاب کنید. در حالت غیرتعاملی، برای پذیرش پیش‌فرض‌ها `--yes` را پاس دهید. نتایج فقط فراداده جنبهٔ اطلاع‌رسانی دارند؛ `--set-default` و `--set-image` به کاوش‌های زنده نیاز دارند تا OpenClaw یک مدل OpenRouter بدون کلید و غیرقابل استفاده را پیکربندی نکند.

## رجیستری مدل‌ها (`models.json`)

ارائه‌دهنده‌های سفارشی در `models.providers` در `models.json` زیر پوشهٔ عامل نوشته می‌شوند (پیش‌فرض `~/.openclaw/agents/<agentId>/agent/models.json`). کاتالوگ‌های provider-plugin به‌صورت shardهای کاتالوگ تولیدشده و متعلق به Plugin زیر وضعیت Plugin عامل ذخیره می‌شوند و به‌طور خودکار بارگذاری می‌شوند. این فایل به‌طور پیش‌فرض ادغام می‌شود مگر اینکه `models.mode` روی `replace` تنظیم شده باشد.

<AccordionGroup>
  <Accordion title="اولویت حالت ادغام">
    اولویت حالت ادغام برای شناسه‌های ارائه‌دهندهٔ منطبق:

    - `baseUrl` غیرخالی که از قبل در `models.json` عامل وجود دارد برنده می‌شود.
    - `apiKey` غیرخالی در `models.json` عامل فقط وقتی برنده می‌شود که آن ارائه‌دهنده در زمینهٔ فعلی پیکربندی/پروفایل احراز هویت تحت مدیریت SecretRef نباشد.
    - مقادیر `apiKey` ارائه‌دهندهٔ تحت مدیریت SecretRef به‌جای پایدار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) نوسازی می‌شوند.
    - مقادیر سرآیند ارائه‌دهندهٔ تحت مدیریت SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) نوسازی می‌شوند.
    - `apiKey`/`baseUrl` خالی یا مفقود عامل به `models.providers` پیکربندی بازمی‌گردد.
    - سایر فیلدهای ارائه‌دهنده از پیکربندی و دادهٔ کاتالوگ نرمال‌سازی‌شده نوسازی می‌شوند.

  </Accordion>
</AccordionGroup>

<Note>
پایداری نشانگرها مبتنی بر اقتدار منبع است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال (پیش از حل)، نه از مقادیر راز حل‌شدهٔ زمان اجرا، می‌نویسد. این موضوع هر زمان که OpenClaw، `models.json` را دوباره تولید کند، از جمله مسیرهای مبتنی بر فرمان مانند `openclaw agent`، اعمال می‌شود.
</Note>

## مرتبط

- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) — OpenClaw، Codex، و دیگر زمان‌های اجرای حلقهٔ عامل
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [تولید تصویر](/fa/tools/image-generation) — پیکربندی مدل تصویر
- [جابه‌جایی خودکار مدل](/fa/concepts/model-failover) — زنجیره‌های جایگزین
- [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) — مسیریابی ارائه‌دهنده و احراز هویت
- [تولید موسیقی](/fa/tools/music-generation) — پیکربندی مدل موسیقی
- [تولید ویدئو](/fa/tools/video-generation) — پیکربندی مدل ویدئو
