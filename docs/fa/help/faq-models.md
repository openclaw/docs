---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی جایگزینی خودکار مدل / «همه مدل‌ها ناموفق بودند»
    - آشنایی با پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، جابه‌جایی، جایگزینی هنگام خرابی و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-07-12T10:08:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ درباره مدل‌ها و نمایه‌های احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، به [پرسش‌های متداول](/fa/help/faq) اصلی مراجعه کنید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار و جابه‌جایی

  <AccordionGroup>
  <Accordion title='"مدل پیش‌فرض" چیست؟'>
    با این گزینه تنظیم می‌شود:

    ```text
    agents.defaults.model.primary
    ```

    مدل‌ها ارجاع‌هایی به‌شکل `provider/model` هستند (برای نمونه: `openai/gpt-5.5`،
    `anthropic/claude-sonnet-4-6`). همیشه `provider/model` را صریحاً تنظیم کنید. اگر
    ارائه‌دهنده را حذف کنید، OpenClaw ابتدا تطابق نام مستعار، سپس تطابق یکتای
    ارائه‌دهنده پیکربندی‌شده برای آن شناسه مدل را امتحان می‌کند و در نهایت به
    ارائه‌دهنده پیش‌فرض پیکربندی‌شده بازمی‌گردد (مسیر سازگاری منسوخ‌شده). اگر آن
    ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را نداشته باشد، OpenClaw به‌جای یک
    پیش‌فرض قدیمی، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده بازمی‌گردد.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    از قدرتمندترین مدل نسل جدیدی استفاده کنید که مجموعه ارائه‌دهندگان شما عرضه می‌کند،
    به‌ویژه برای عامل‌های مجهز به ابزار یا عامل‌هایی که ورودی نامطمئن دریافت می‌کنند؛ مدل‌های ضعیف‌تر یا
    بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت و رفتار ناامن
    آسیب‌پذیرترند (به [امنیت](/fa/gateway/security) مراجعه کنید). مدل‌های ارزان‌تر را بر اساس نقش عامل به
    گفت‌وگوهای روزمره و کم‌خطر اختصاص دهید.

    مدل‌ها را برای هر عامل مسیریابی کنید و برای موازی‌سازی وظایف طولانی از زیرعامل‌ها استفاده کنید (هر
    زیرعامل توکن‌های خودش را مصرف می‌کند). به [مدل‌ها](/fa/concepts/models)،
    [زیرعامل‌ها](/fa/tools/subagents)، [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models) مراجعه کنید.

  </Accordion>

  <Accordion title="چگونه بدون پاک‌شدن پیکربندی، مدل‌ها را جابه‌جا کنم؟">
    فقط فیلدهای مدل را تغییر دهید؛ از جایگزینی کامل پیکربندی خودداری کنید.

    - `/model` در گفت‌وگو (برای هر نشست، به [دستورهای اسلش](/fa/tools/slash-commands) مراجعه کنید)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - `agents.defaults.model` را مستقیماً در `~/.openclaw/openclaw.json` ویرایش کنید

    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید (مسیر نرمال‌شده،
    مستندات سطحی طرح‌واره و خلاصه فرزندان)، سپس استفاده از `config.patch`
    با یک شیء جزئی را به `config.apply` ترجیح دهید. اگر پیکربندی را بازنویسی کرده‌اید،
    آن را از نسخه پشتیبان بازیابی کنید یا برای ترمیم `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)،
    [پیکربندی](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان (llama.cpp، vLLM، Ollama) استفاده کنم؟">
    بله؛ Ollama ساده‌ترین مسیر است. راه‌اندازی سریع:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی دریافت کنید، برای نمونه `ollama pull gemma4`
    3. برای مدل‌های ابری نیز `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید، `Ollama` و سپس `Local` یا `Cloud + Local` را انتخاب کنید

    `Cloud + Local` مدل‌های ابری را در کنار مدل‌های محلی Ollama شما ارائه می‌دهد؛
    مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند. برای جابه‌جایی
    دستی: `openclaw models list` و سپس `openclaw models set ollama/<model>` را اجرا کنید.

    مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت آسیب‌پذیرترند.
    برای هر رباتی که به ابزارها دسترسی دارد از مدل‌های بزرگ استفاده کنید؛ اگر بااین‌حال از مدل‌های کوچک
    استفاده می‌کنید، محیط ایزوله و فهرست‌های مجاز سخت‌گیرانه ابزارها را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [محیط ایزوله](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه (بدون راه‌اندازی مجدد) جابه‌جا کنم؟">
    `/model <name>` را به‌صورت یک پیام مستقل ارسال کنید. برای
    فهرست کامل دستورها، از جمله انتخاب‌گر شماره‌دار (`/model`، `/model
    list`، `/model 3`)، دستور `/model default` برای پاک‌کردن بازنویسی نشست و
    `/model status` برای جزئیات نقطه پایانی/حالت API، به
    [دستورهای اسلش](/fa/tools/slash-commands) مراجعه کنید.

    با `@profile` یک نمایه احراز هویت مشخص را برای هر نشست اجباری کنید:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    برای برداشتن تثبیت نمایه‌ای که با `@profile` تنظیم شده است، `/model` را بدون
    پسوند دوباره اجرا کنید (برای نمونه `/model anthropic/claude-opus-4-6`) یا گزینه پیش‌فرض را از
    `/model` انتخاب کنید. برای تأیید نمایه احراز هویت فعال از `/model status` استفاده کنید.

  </Accordion>

  <Accordion title="اگر دو ارائه‌دهنده شناسه مدل یکسانی ارائه کنند، /model از کدام‌یک استفاده می‌کند؟">
    `/model provider/model` دقیقاً همان مسیر ارائه‌دهنده را انتخاب می‌کند. برای نمونه،
    `qianfan/deepseek-v4-flash` و `deepseek/deepseek-v4-flash` با وجود یکسان‌بودن
    شناسه مدل، ارجاع‌های متفاوتی هستند؛ OpenClaw با تطابق صرفِ شناسه، بی‌سروصدا
    ارائه‌دهنده را تغییر نمی‌دهد.

    ارجاع `/model` انتخاب‌شده توسط کاربر برای بازگشت اضطراری سخت‌گیرانه است: اگر آن
    ارائه‌دهنده/مدل از دسترس خارج شود، پاسخ به‌طور آشکار ناموفق می‌شود و به
    `agents.defaults.model.fallbacks` بازنمی‌گردد. زنجیره‌های بازگشت اضطراری پیکربندی‌شده
    همچنان برای پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کارهای Cron و
    وضعیت بازگشت اضطراری خودکار اعمال می‌شوند. هنگامی که اجرای بدون بازنویسی نشست
    اجازه استفاده از بازگشت اضطراری را دارد، OpenClaw ابتدا ارائه‌دهنده/مدل درخواستی،
    سپس گزینه‌های بازگشت اضطراری پیکربندی‌شده و در نهایت مدل اصلی پیکربندی‌شده را
    امتحان می‌کند؛ بنابراین شناسه‌های مدل ساده تکراری هرگز مستقیماً به ارائه‌دهنده
    پیش‌فرض بازنمی‌گردند.

    به [مدل‌ها](/fa/concepts/models) و [جابه‌جایی اضطراری مدل](/fa/concepts/model-failover) مراجعه کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای روزانه از GPT 5.5 و برای برنامه‌نویسی از Codex 5.5 استفاده کنم؟">
    بله؛ انتخاب مدل و انتخاب محیط اجرا مستقل از یکدیگرند:

    - **عامل برنامه‌نویسی بومی Codex:** مقدار `agents.defaults.model.primary` را روی
      `openai/gpt-5.5` تنظیم کنید. برای احراز هویت اشتراک ChatGPT/Codex با
      `openclaw models auth login --provider openai` وارد شوید.
    - **وظایف مستقیم OpenAI API خارج از حلقه عامل:** برای تصاویر، تعبیه‌ها، گفتار، بلادرنگ و دیگر
      سطوح غیرعاملی OpenAI API، متغیر `OPENAI_API_KEY` را پیکربندی کنید.
    - **احراز هویت عامل OpenAI با کلید API:** از `/model openai/gpt-5.5` همراه با یک
      نمایه کلید API مرتب‌شده `openai` استفاده کنید.
    - **زیرعامل‌ها:** وظایف برنامه‌نویسی را به عاملی متمرکز بر Codex با
      مدل اختصاصی `openai/gpt-5.5` مسیریابی کنید.

    به [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) مراجعه کنید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    - **برای هر نشست:** هنگام استفاده از `openai/gpt-5.5`، دستور `/fast on` را ارسال کنید.
    - **پیش‌فرض هر مدل:** مقدار
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.
    - **حد آستانه خودکار:** `/fast auto` یا `params.fastMode: "auto"` فراخوانی‌های جدید
      مدل را تا زمان آستانه در حالت سریع اجرا می‌کند و سپس فراخوانی‌های بعدیِ تلاش مجدد، بازگشت اضطراری،
      نتیجه ابزار یا ادامه را بدون حالت سریع اجرا می‌کند. آستانه به‌طور پیش‌فرض
      ۶۰ ثانیه است؛ آن را با `params.fastAutoOnSeconds` در مدل بازنویسی کنید.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    حالت سریع در درخواست‌های بومی OpenAI Responses به `service_tier = "priority"`
    نگاشت می‌شود؛ مقادیر موجود `service_tier` حفظ می‌شوند و حالت سریع
    `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند. بازنویسی‌های `/fast` در نشست
    بر پیش‌فرض‌های پیکربندی اولویت دارند.

    به [تفکر و حالت سریع](/fa/tools/thinking) و بخش حالت سریع
    زیر پیکربندی پیشرفته در صفحه ارائه‌دهنده [OpenAI](/fa/providers/openai)
    مراجعه کنید.

  </Accordion>

  <Accordion title='چرا پیام "Model ... is not allowed" را می‌بینم و سپس پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای
    `/model` و بازنویسی‌های نشست تبدیل می‌شود. انتخاب مدلی خارج از آن فهرست،
    به‌جای پاسخ عادی این پیام را برمی‌گرداند:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    راه‌حل: مدل دقیق را به `agents.defaults.models` اضافه کنید، برای فهرست‌های
    پویا یک الگوی فراگیر ارائه‌دهنده مانند `"provider/*": {}` اضافه کنید، فهرست
    مجاز را حذف کنید یا مدلی را از `/model list` انتخاب کنید. اگر دستور شامل
    `--runtime codex` نیز بود، ابتدا فهرست مجاز را به‌روزرسانی کنید و سپس همان
    دستور `/model provider/model --runtime codex` را دوباره اجرا کنید.

  </Accordion>

  <Accordion title='چرا پیام "Unknown model: minimax/MiniMax-M3" را می‌بینم؟'>
    اگر از نسخه قدیمی OpenClaw استفاده می‌کنید، ابتدا ارتقا دهید (یا از شاخه منبع
    `main` اجرا کنید) و Gateway را دوباره راه‌اندازی کنید؛ ممکن است `MiniMax-M3` هنوز در
    فهرست مدل‌های نسخه نصب‌شده شما نباشد. در غیر این صورت، ارائه‌دهنده MiniMax
    پیکربندی نشده است (هیچ ورودی ارائه‌دهنده یا نمایه احراز هویتی یافت نشده)، بنابراین مدل
    قابل تفکیک نیست. برای فهرست کامل بررسی‌های لازم جهت رفع مشکل،
    جدول شناسه ارائه‌دهنده/مدل و نمونه بلوک پیکربندی، به بخش عیب‌یابی در صفحه
    ارائه‌دهنده [MiniMax](/fa/providers/minimax) مراجعه کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض و OpenAI را برای وظایف پیچیده استفاده کنم؟">
    بله. MiniMax را به‌عنوان پیش‌فرض استفاده کنید و مدل را برای هر نشست تغییر دهید؛ گزینه‌های
    بازگشت اضطراری برای خطاها هستند، نه «وظایف دشوار»، بنابراین از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه الف: جابه‌جایی برای هر نشست**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    سپس `/model gpt` را اجرا کنید.

    **گزینه ب: عامل‌های جداگانه** — عامل الف به‌طور پیش‌فرض از MiniMax و عامل ب
    به‌طور پیش‌فرض از OpenAI استفاده می‌کند؛ بر اساس عامل مسیریابی کنید یا برای جابه‌جایی از `/agent` استفاده کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)،
    [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله؛ این کوتاه‌نوشت‌های داخلی فقط هنگامی اعمال می‌شوند که مدل مقصد در
    `agents.defaults.models` وجود داشته باشد:

    | نام مستعار | به این مقدار تفکیک می‌شود |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    نام مستعار سفارشی شما با همان نام، مورد داخلی را بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چگونه میان‌برهای مدل (نام‌های مستعار) را تعریف یا بازنویسی کنم؟">
    نام‌های مستعار در `agents.defaults.models.<modelId>.alias` قرار دارند:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    سپس `/model sonnet` (یا در صورت پشتیبانی `/<alias>`) به آن
    شناسه مدل تفکیک می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از ارائه‌دهندگان دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
    OpenRouter (پرداخت به‌ازای هر توکن؛ مدل‌های فراوان):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (مدل‌های GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    نبود کلید ارائه‌دهنده برای یک ارائه‌دهنده/مدل ارجاع‌شده، خطای احراز هویت
    زمان اجرا ایجاد می‌کند (برای نمونه `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، هیچ کلید API برای ارائه‌دهنده یافت نشد**

    عامل جدید مخزن احراز هویت خالی دارد؛ احراز هویت به‌ازای هر عامل است و در مسیر زیر ذخیره می‌شود:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    رفع مشکل: `openclaw agents add <id>` را اجرا کنید و احراز هویت را در راه‌انداز پیکربندی کنید، یا
    فقط پروفایل‌های ایستای قابل‌انتقال `api_key`/`token` را از مخزن عامل اصلی
    کپی کنید. برای OAuth، هنگامی که عامل جدید به حساب مستقل خود نیاز دارد،
    از همان عامل وارد شوید. برای قواعد کامل استفادهٔ مجدد از `agentDir` و
    اشتراک‌گذاری اعتبارنامه‌ها، به [مسیریابی چندعاملی](/fa/concepts/multi-agent)
    مراجعه کنید — هرگز از یک `agentDir` برای چند عامل استفاده نکنید.

  </Accordion>
</AccordionGroup>

## جایگزینی مدل هنگام شکست و «همهٔ مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="جایگزینی هنگام شکست چگونه کار می‌کند؟">
    دو مرحله دارد:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **بازگشت به مدل جایگزین** بعدی در `agents.defaults.model.fallbacks`.

    برای پروفایل‌های ناموفق دورهٔ انتظار اعمال می‌شود (عقب‌نشینی نمایی)،
    بنابراین وقتی ارائه‌دهنده با محدودیت نرخ مواجه است یا موقتاً دچار خطا
    شده، OpenClaw به پاسخ‌گویی ادامه می‌دهد.

    دستهٔ محدودیت نرخ فقط `429` ساده را شامل نمی‌شود: `Too many concurrent
    requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai
    ... quota limit exceeded`، `resource exhausted` و محدودیت‌های دوره‌ای
    بازهٔ مصرف (`weekly/monthly limit reached`) همگی محدودیت نرخ محسوب می‌شوند
    و می‌توانند باعث جایگزینی هنگام شکست شوند.

    پاسخ‌های مربوط به صورت‌حساب همیشه `402` نیستند و برخی پاسخ‌های `402` نیز
    به‌جای مسیر صورت‌حساب، در دستهٔ گذرا/محدودیت نرخ باقی می‌مانند. متن صریح
    مربوط به صورت‌حساب در پاسخ‌های `401`/`403` همچنان می‌تواند به مسیر
    صورت‌حساب هدایت شود؛ تطبیق‌دهنده‌های متن مختص ارائه‌دهنده (برای مثال
    `Key limit exceeded` در OpenRouter) فقط در محدودهٔ همان ارائه‌دهنده
    عمل می‌کنند. پاسخ `402` که شبیه محدودیت قابل‌تلاش‌مجددِ بازهٔ مصرف یا
    سقف هزینهٔ سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، به‌صورت `rate_limit` پردازش
    می‌شود، نه غیرفعال‌سازی طولانی‌مدت به‌دلیل صورت‌حساب.

    خطاهای سرریز زمینه به‌طور کامل از مسیر بازگشت به مدل جایگزین کنار گذاشته
    می‌شوند — نشانه‌هایی مانند `request_too_large`،
    `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`، `input is
    too long for the model` یا `ollama error: context length exceeded`
    به‌جای رفتن به مدل جایگزین بعدی، به Compaction/تلاش مجدد هدایت می‌شوند.

    دامنهٔ متن عمومی خطای سرور محدودتر از «هر چیزی است که unknown/error در
    آن باشد». الگوهای گذرای مختص ارائه‌دهنده که به‌عنوان نشانهٔ جایگزینی هنگام
    شکست محسوب می‌شوند عبارت‌اند از: پیام خالی Anthropic با متن
    `An unknown error occurred`، پیام خالی OpenRouter با متن
    `Provider returned error`، خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، بارهای `api_error` در JSON با متن گذرای سرور (`internal
    server error`، `unknown error, 520`، `upstream error`، `backend error`)
    و خطاهای مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException`، مشروط بر
    اینکه زمینهٔ ارائه‌دهنده مطابقت داشته باشد. متن عمومی بازگشت داخلی مانند
    `LLM request failed with an unknown error.` با احتیاط پردازش می‌شود و
    به‌تنهایی باعث فعال‌شدن بازگشت به مدل جایگزین نمی‌شود.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» به چه معناست؟'>
    شناسهٔ پروفایل احراز هویت `anthropic:default` در مخزن احراز هویت مورد
    انتظار، اعتبارنامه‌ای ندارد.

    **فهرست بررسی رفع مشکل:**

    - محل نگهداری پروفایل‌ها را تأیید کنید — مسیر کنونی:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`؛ مسیر قدیمی:
      `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).
    - تأیید کنید Gateway متغیر محیطی شما را بارگذاری می‌کند.
      `ANTHROPIC_API_KEY` که فقط در پوسته تنظیم شده باشد، به اجرای Gateway
      از طریق systemd/launchd نمی‌رسد — آن را در `~/.openclaw/.env` قرار دهید
      یا `env.shellEnv` را فعال کنید.
    - تأیید کنید عامل درست را ویرایش می‌کنید — پیکربندی‌های چندعاملی چندین
      فایل `auth-profiles.json` دارند.
    - برای مشاهدهٔ مدل‌های پیکربندی‌شده و وضعیت احراز هویت ارائه‌دهنده،
      `openclaw models status` را اجرا کنید.

    **برای «No credentials found for profile anthropic» (بدون پسوند ایمیل):**

    اجرا به یک پروفایل Anthropic مقید شده است که Gateway نمی‌تواند آن را
    پیدا کند.

    - از Claude CLI استفاده کنید: روی میزبان Gateway فرمان `openclaw models
      auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - بهتر است به‌جای آن از کلید API استفاده کنید: `ANTHROPIC_API_KEY` را در
      `~/.openclaw/.env` روی میزبان Gateway قرار دهید، سپس هر ترتیب مقیدی را
      که استفاده از پروفایل گم‌شده را اجبار می‌کند پاک کنید:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - حالت راه‌دور: پروفایل‌های احراز هویت روی دستگاه Gateway قرار دارند،
      نه لپ‌تاپ شما — تأیید کنید فرمان‌ها را روی همان دستگاه اجرا می‌کنید.

  </Accordion>

  <Accordion title="چرا Google Gemini را نیز امتحان کرد و ناموفق شد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان مدل جایگزین داشته باشد
    (یا به نام کوتاه Gemini تغییر داده باشید)، OpenClaw هنگام بازگشت به مدل
    جایگزین آن را امتحان می‌کند. اگر اعتبارنامهٔ Google پیکربندی نشده باشد،
    خطای `No API key found for provider "google"` نمایش داده می‌شود. رفع مشکل:
    احراز هویت Google را اضافه کنید یا مدل‌های Google را از
    `agents.defaults.model.fallbacks`/نام‌های مستعار حذف کنید.

    **درخواست LLM رد شد: امضای تفکر الزامی است (Google Antigravity)**

    علت: تاریخچهٔ نشست شامل بلوک‌های تفکر بدون امضا است (اغلب ناشی از یک
    جریان متوقف‌شده/ناقص)؛ Google Antigravity برای بلوک‌های تفکر امضا
    می‌خواهد. OpenClaw بلوک‌های تفکر بدون امضا را برای Google Antigravity
    Claude حذف می‌کند؛ اگر خطا همچنان ظاهر شد، نشست جدیدی آغاز کنید یا برای
    آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چیستی و نحوهٔ مدیریت آن‌ها

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن و الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    یک رکورد نام‌گذاری‌شدهٔ اعتبارنامه (OAuth یا کلید API) که به یک
    ارائه‌دهنده متصل است و در مسیر زیر ذخیره می‌شود:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    پروفایل‌های ذخیره‌شده را بدون نمایش اسرار بررسی کنید: `openclaw models auth
    list` (در صورت نیاز همراه با `--provider <id>` یا `--json`). به
    [CLI مدل‌ها](/fa/cli/models#auth-profiles) مراجعه کنید.

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل کدام‌اند؟">
    با پیشوند ارائه‌دهنده: `anthropic:default` (وقتی هویت ایمیلی وجود ندارد
    رایج است)، `anthropic:<email>` برای هویت‌های OAuth، یا شناسه‌ای سفارشی
    که خودتان انتخاب می‌کنید (برای مثال `anthropic:work`).

  </Accordion>

  <Accordion title="آیا می‌توانم تعیین کنم کدام پروفایل احراز هویت ابتدا امتحان شود؟">
    بله. پیکربندی `auth.order.<provider>` ترتیب چرخش هر ارائه‌دهنده را تعیین
    می‌کند (فقط فراداده — هیچ رازی ذخیره نمی‌شود).

    OpenClaw ممکن است پروفایلی را که در **دورهٔ انتظار** کوتاه‌مدت است
    (محدودیت نرخ، پایان مهلت، خطاهای احراز هویت) یا در وضعیت
    **غیرفعال** طولانی‌مدت قرار دارد (صورت‌حساب/اعتبار ناکافی)، کنار بگذارد.
    با `openclaw models status --json` آن را بررسی کنید و
    `auth.unusableProfiles` را ببینید. تنظیم دقیق با
    `auth.cooldowns.billingBackoffHours*` انجام می‌شود. دوره‌های انتظار ناشی
    از محدودیت نرخ می‌توانند مختص مدل باشند — پروفایلی که برای یک مدل در
    دورهٔ انتظار است، همچنان می‌تواند به مدل هم‌خانواده‌ای در همان
    ارائه‌دهنده خدمت کند؛ بازه‌های صورت‌حساب/غیرفعال، کل پروفایل را مسدود
    می‌کنند.

    یک بازنویسی ترتیب مختص عامل تنظیم کنید (در `auth-state.json` همان عامل
    ذخیره می‌شود):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    برای بررسی آنچه واقعاً امتحان خواهد شد، `openclaw models status --probe`
    را اجرا کنید. پروفایل ذخیره‌شده‌ای که از ترتیب صریح حذف شده باشد،
    به‌جای آنکه بدون اطلاع امتحان شود، وضعیت `excluded_by_auth_order` را
    گزارش می‌کند.

  </Accordion>

  <Accordion title="تفاوت OAuth و کلید API چیست؟">
    - **ورود OAuth / CLI** در مواردی که ارائه‌دهنده پشتیبانی کند، اغلب از
      دسترسی اشتراکی استفاده می‌کند. برای Anthropic، بخش پشتیبان Claude CLI
      در OpenClaw از Claude Code `claude -p` استفاده می‌کند که Anthropic
      در حال حاضر آن را استفادهٔ Agent SDK/برنامه‌نویسی محسوب می‌کند و از
      محدودیت‌های مصرف اشتراک کسر می‌شود — برای وضعیت فعلی توقف صورت‌حساب و
      پیوندهای منابع به [Anthropic](/fa/providers/anthropic) مراجعه کنید.
    - **کلیدهای API** از صورت‌حساب بر اساس تعداد توکن استفاده می‌کنند.

    راه‌انداز از Anthropic Claude CLI، ‏OpenAI Codex OAuth و کلیدهای API
    پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مطالب مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جایگزینی مدل هنگام شکست](/fa/concepts/model-failover)
