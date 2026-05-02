---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی جایگزینی اضطراری مدل / «همه مدل‌ها ناموفق بودند»
    - درک پروفایل‌های احراز هویت و نحوهٔ مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تغییر، جایگزینی هنگام خرابی، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-02T11:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `openai-codex/gpt-5.5`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده را برای همان شناسه دقیق مدل بررسی می‌کند، و فقط پس از آن به‌عنوان مسیر سازگاری منسوخ‌شده به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. با این حال همچنان باید `provider/model` را **صراحتا** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعه ارائه‌دهنده‌های خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی‌های نامطمئن:** قدرت مدل را بر هزینه اولویت دهید.
    **برای گفت‌وگوی روزمره/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده کلی: برای کارهای پرریسک از **بهترین مدلی که از عهده هزینه‌اش برمی‌آیید** استفاده کنید، و برای گفت‌وگوی روزمره یا خلاصه‌سازی از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیریابی کنید و از زیرعامل‌ها برای موازی‌سازی کارهای طولانی استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناامن آسیب‌پذیرتر هستند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چگونه بدون پاک کردن پیکربندی، مدل‌ها را تغییر بدهم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های ایمن:

    - `/model` در گفت‌وگو (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی استفاده نکنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحا از `config.patch` استفاده کنید. محموله lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزند فوری را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از پشتیبان بازیابی کنید یا دوباره `openclaw doctor` را برای تعمیر اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان (llama.cpp، vLLM، Ollama) استفاده کنم؟">
    بله. Ollama ساده‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` را دریافت کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` مدل‌های ابری را به‌همراه مدل‌های محلی Ollama شما فراهم می‌کند
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای تغییر دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرتر هستند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، قویا **مدل‌های بزرگ** را پیشنهاد می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، سندباکسینگ و allowlistهای سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [سندباکسینگ](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill از چه مدل‌هایی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ هیچ پیشنهاد ثابت ارائه‌دهنده‌ای وجود ندارد.
    - تنظیم runtime فعلی را روی هر Gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیت/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه تغییر بدهم (بدون راه‌اندازی مجدد)؟">
    از دستور `/model` به‌عنوان یک پیام مستقل استفاده کنید:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    این‌ها نام‌های مستعار داخلی هستند. نام‌های مستعار سفارشی را می‌توان از طریق `agents.defaults.models` اضافه کرد.

    می‌توانید مدل‌های موجود را با `/model`، `/model list` یا `/model status` فهرست کنید.

    `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهد. بر اساس شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک پروفایل احراز هویت مشخص را برای ارائه‌دهنده اجبار کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، از کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام پروفایل احراز هویت بعدی امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چگونه پروفایلی را که با @profile ثابت کرده‌ام آزاد کنم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` برای تأیید پروفایل احراز هویت فعال استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم از GPT 5.5 برای کارهای روزانه و از Codex 5.5 برای کدنویسی استفاده کنم؟">
    بله. انتخاب مدل و انتخاب runtime را جداگانه در نظر بگیرید:

    - **عامل کدنویسی Native Codex:** مقدار `agents.defaults.model.primary` را روی `openai/gpt-5.5` و مقدار `agents.defaults.agentRuntime.id` را روی `"codex"` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API از طریق PI:** از `/model openai/gpt-5.5` بدون بازنویسی runtime مربوط به Codex استفاده کنید و `OPENAI_API_KEY` را پیکربندی کنید.
    - **Codex OAuth از طریق PI:** فقط وقتی عمدا runner معمولی PI را با Codex OAuth می‌خواهید، از `/model openai-codex/gpt-5.5` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به یک عامل فقط-Codex با مدل خودش و پیش‌فرض `agentRuntime` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک toggle نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** وقتی نشست از `openai/gpt-5.5` یا `openai-codex/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** مقدار `agents.defaults.models["openai/gpt-5.5"].params.fastMode` یا `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    برای OpenAI، حالت سریع در درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های `/fast` در نشست بر پیش‌فرض‌های پیکربندی اولویت دارند.

    [Thinking and fast mode](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، برای `/model` و هر بازنویسی نشست به **allowlist** تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    آن خطا **به‌جای** پاسخ عادی برگردانده می‌شود. راه‌حل: مدل را به
    `agents.defaults.models` اضافه کنید، allowlist را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    این یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا پروفایل احراز هویت پیدا نشده)، بنابراین مدل قابل resolve نیست.

    چک‌لیست رفع مشکل:

    1. به نسخه فعلی OpenClaw ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس Gateway را راه‌اندازی مجدد کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا اینکه احراز هویت MiniMax
       در env/پروفایل‌های احراز هویت وجود دارد تا ارائه‌دهنده مطابق بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا MiniMax
       OAuth ذخیره‌شده برای `minimax-portal`).
    3. از شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی با API-key،
       یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی با OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا در گفت‌وگو `/model list` را بزنید).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض قرار دهم و از OpenAI برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و در صورت نیاز مدل‌ها را **برای هر نشست** تغییر دهید.
    fallbackها برای **خطاها** هستند، نه «کارهای سخت»، بنابراین از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه A: تغییر برای هر نشست**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    سپس:

    ```
    /model gpt
    ```

    **گزینه B: عامل‌های جداگانه**

    - پیش‌فرض عامل A: MiniMax
    - پیش‌فرض عامل B: OpenAI
    - بر اساس عامل مسیریابی کنید یا از `/agent` برای تغییر استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض همراه خود دارد (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` برای راه‌اندازی‌های API-key، یا `openai-codex/gpt-5.5` وقتی برای Codex OAuth پیکربندی شده باشد
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر نام مستعار خودتان را با همان نام تنظیم کنید، مقدار شما اولویت دارد.

  </Accordion>

  <Accordion title="چگونه میان‌برهای مدل (نام‌های مستعار) را تعریف/بازنویسی کنم؟">
    نام‌های مستعار از `agents.defaults.models.<modelId>.alias` می‌آیند. مثال:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به آن شناسه مدل resolve می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از ارائه‌دهندگان دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
    OpenRouter (پرداخت به‌ازای توکن؛ مدل‌های زیاد):

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید لازم آن ارائه‌دهنده وجود نداشته باشد، یک خطای احراز هویت زمان اجرا دریافت می‌کنید (برای مثال `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و
    در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول راهنمای مرحله‌ای پیکربندی کنید.
    - یا فقط پروفایل‌های ثابت و قابل‌انتقال `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون کلون کردن توکن‌های تازه‌سازی، از عامل پیش‌فرض/اصلی بخواند.

    از `agentDir` مشترک بین عامل‌ها استفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## Failover مدل و «همه مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="Failover چگونه کار می‌کند؟">
    Failover در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **جایگزینی مدل** با مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های انتظار برای پروفایل‌های ناموفق اعمال می‌شوند (پس‌نشینی نمایی)، بنابراین OpenClaw حتی وقتی یک ارائه‌دهنده با محدودیت نرخ مواجه است یا موقتاً شکست می‌خورد هم می‌تواند پاسخ‌گویی را ادامه دهد.

    سبد محدودیت نرخ فقط پاسخ‌های ساده `429` را شامل نمی‌شود. OpenClaw
    پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted`، و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را نیز محدودیت نرخِ شایسته Failover
    در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه صورتحساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان سبد گذرا باقی می‌مانند. اگر ارائه‌دهنده‌ای روی `401` یا `403`
    متن صریح مربوط به صورتحساب برگرداند، OpenClaw همچنان می‌تواند آن را در
    مسیر صورتحساب نگه دارد، اما تطبیق‌دهنده‌های متنِ ویژه ارائه‌دهنده فقط در محدوده
    همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجره مصرف قابل‌تلاش‌مجدد یا
    محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی صورتحساب.

    خطاهای سرریز زمینه متفاوت هستند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش بردن جایگزینی مدل،
    در مسیر Compaction/تلاش‌مجدد باقی می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که
    ناشناخته/خطا در آن باشد» است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده
    مانند `An unknown error occurred` خام Anthropic، خطای خام
    `Provider returned error` در OpenRouter، خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، محموله‌های JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، و خطاهای مشغول بودن ارائه‌دهنده مانند `ModelNotReadyException` را هنگام
    تطابق زمینه ارائه‌دهنده، سیگنال‌های مهلت‌پایان‌یافته/بارگذاری‌زیادِ شایسته
    Failover در نظر می‌گیرد.
    متن عمومی جایگزینی داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی جایگزینی مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«هیچ اعتبارنامه‌ای برای پروفایل anthropic:default پیدا نشد» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در شِل خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - پیکربندی‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را از نظر معقول بودن بررسی کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و وضعیت احراز هویت ارائه‌دهنده‌ها را ببینید.

    **چک‌لیست رفع مشکل برای «هیچ اعتبارنامه‌ای برای پروفایل anthropic پیدا نشد»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده است، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان gateway دستور `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان gateway** قرار دهید.
      - هر ترتیب سنجاق‌شده‌ای را که یک پروفایل گمشده را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان gateway اجرا می‌کنید**
      - در حالت راه دور، پروفایل‌های احراز هویت روی ماشین gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و ناموفق شد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین شامل کند (یا به یک صورت کوتاه Gemini تغییر کرده باشید)، OpenClaw آن را در طول جایگزینی مدل امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را می‌بینید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف کنید/اجتناب کنید تا جایگزینی به آن‌جا مسیریابی نشود.

    **درخواست LLM رد شد: امضای تفکر لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های تفکر بدون امضا** است (اغلب از
    یک جریان قطع‌شده/جزئی). Google Antigravity برای بلوک‌های تفکر به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های تفکر بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر شد، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چیستی آن‌ها و روش مدیریتشان

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده متصل است. پروفایل‌ها در این مسیر قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="شناسه‌های رایج پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که خودتان انتخاب می‌کنید (برای مثال `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و یک ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این کار رازها را ذخیره **نمی‌کند**؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است اگر یک پروفایل در **دوره انتظار** کوتاه (محدودیت‌های نرخ/مهلت‌پایان‌یافته/شکست‌های احراز هویت) یا وضعیت **غیرفعال** طولانی‌تر (صورتحساب/اعتبار ناکافی) باشد، موقتاً از آن بگذرد. برای بررسی این مورد، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های انتظار محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که برای یک مدل
    در حال انتظار است، همچنان می‌تواند برای یک مدل خواهر روی همان ارائه‌دهنده قابل‌استفاده باشد،
    در حالی که پنجره‌های صورتحساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید از طریق CLI یک بازنویسی ترتیب **برای هر عامل** تنظیم کنید (در `auth-state.json` همان عامل ذخیره می‌شود):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    برای هدف‌گیری یک عامل مشخص:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    برای تأیید این‌که واقعاً چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، کاوشگر به‌جای امتحان بی‌سروصدای آن،
    `excluded_by_auth_order` را برای آن پروفایل گزارش می‌کند.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراک استفاده می‌کند (در موارد قابل‌اعمال).
    - **کلیدهای API** از صورتحساب پرداخت به‌ازای توکن استفاده می‌کنند.

    راهنمای مرحله‌ای به‌طور صریح از Anthropic Claude CLI، OpenAI Codex OAuth، و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [Failover مدل](/fa/concepts/model-failover)
