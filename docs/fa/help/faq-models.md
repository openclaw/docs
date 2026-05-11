---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جایگزینی خودکار مدل هنگام خرابی / «همهٔ مدل‌ها ناموفق بودند»
    - درک پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، جابه‌جایی، جایگزینی هنگام خرابی، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-11T20:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و نمایه احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر دادن

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها با قالب `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را، و فقط بعد از آن به‌عنوان مسیر سازگاری منسوخ به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی از ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. همچنان باید `provider/model` را **صراحتا** تنظیم کنید.

  </Accordion>

  <Accordion title="What model do you recommend?">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در پشته ارائه‌دهنده خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را بر هزینه مقدم بدانید.
    **برای گفت‌وگوی معمولی/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و براساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده کلی: برای کارهای پرریسک از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی معمولی یا خلاصه‌سازی از یک مدل ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیریابی کنید و برای موازی‌سازی کارهای طولانی از زیرعامل‌ها استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در چت (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی استفاده نکنید مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحا از `config.patch` استفاده کنید. محموله lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی شِما، و خلاصه‌های فرزند بلافاصله را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از پشتیبان بازیابی کنید یا برای ترمیم دوباره `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [پیکربندی](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    بله. Ollama ساده‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` دریافت کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` مدل‌های ابری را همراه با مدل‌های محلی Ollama شما فراهم می‌کند
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای تغییر دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. ما برای هر رباتی که می‌تواند از ابزارها استفاده کند، **مدل‌های بزرگ** را قویا توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و فهرست‌های مجاز سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ هیچ توصیه ثابت ارائه‌دهنده‌ای وجود ندارد.
    - تنظیم runtime فعلی را روی هر Gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیتی/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
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

    می‌توانید مدل‌های موجود را با `/model`، `/model list`، یا `/model status` فهرست کنید.

    `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهد. با شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک نمایه احراز هویت مشخص را برای ارائه‌دهنده اجباری کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، از کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام نمایه احراز هویت بعدا امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چگونه نمایه‌ای را که با @profile ثابت کرده‌ام آزاد کنم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` برای تایید نمایه احراز هویت فعال استفاده کنید.

  </Accordion>

  <Accordion title="If two providers expose the same model id, which one does /model use?">
    `/model provider/model` همان مسیر دقیق ارائه‌دهنده را برای نشست انتخاب می‌کند.

    برای مثال، `qianfan/deepseek-v4-flash` و `deepseek/deepseek-v4-flash` ارجاع‌های مدل متفاوتی هستند، هرچند هر دو شامل `deepseek-v4-flash` هستند. OpenClaw نباید فقط چون شناسه مدل خام تطابق دارد، بی‌صدا از یک ارائه‌دهنده به دیگری تغییر کند.

    ارجاع `/model` انتخاب‌شده توسط کاربر برای سیاست fallback هم سخت‌گیرانه است. اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای پاسخ دادن از `agents.defaults.model.fallbacks` به‌صورت آشکار شکست می‌خورد. زنجیره‌های fallback پیکربندی‌شده همچنان برای پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی job های cron، و وضعیت fallback انتخاب‌شده خودکار اعمال می‌شوند.

    اگر اجرایی که از یک override غیرنشستی شروع شده مجاز به استفاده از fallback باشد، OpenClaw ابتدا ارائه‌دهنده/مدل درخواستی را امتحان می‌کند، سپس fallbackهای پیکربندی‌شده را، و فقط بعد از آن مدل اصلی پیکربندی‌شده را. این مانع می‌شود شناسه‌های مدل خام تکراری مستقیم به ارائه‌دهنده پیش‌فرض برگردند.

    [مدل‌ها](/fa/concepts/models) و [failover مدل](/fa/concepts/model-failover) را ببینید.

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    بله. انتخاب مدل و انتخاب runtime را جداگانه در نظر بگیرید:

    - **عامل کدنویسی Native Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API خارج از حلقه عامل:** `OPENAI_API_KEY` را برای تصاویر، embeddingها، گفتار، realtime، و دیگر سطح‌های OpenAI API غیرعاملی پیکربندی کنید.
    - **احراز هویت کلید API عامل OpenAI:** از `/model openai/gpt-5.5` با یک نمایه کلید API مرتب‌شده `openai-codex` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به یک عامل متمرکز بر Codex با مدل `openai/gpt-5.5` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    از یک toggle نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** وقتی نشست از `openai/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.

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

    برای OpenAI، fast mode در درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. overrideهای نشست `/fast` بر پیش‌فرض‌های پیکربندی اولویت دارند.

    [Thinking and fast mode](/fa/tools/thinking) و [fast mode در OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و هر
    override نشستی تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    آن خطا **به‌جای** پاسخ معمولی برگردانده می‌شود. رفع مشکل: مدل دقیق را به
    `agents.defaults.models` اضافه کنید، یک wildcard ارائه‌دهنده مانند `"provider/*": {}` برای کاتالوگ‌های پویای ارائه‌دهنده اضافه کنید، فهرست مجاز را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور شامل `--runtime codex` هم بود، ابتدا فهرست مجاز را به‌روزرسانی کنید و سپس همان دستور `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    این یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا
    نمایه احراز هویت پیدا نشده است)، بنابراین مدل قابل resolve نیست.

    چک‌لیست رفع مشکل:

    1. به یک انتشار فعلی OpenClaw ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس Gateway را restart کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/نمایه‌های احراز هویت وجود دارد تا ارائه‌دهنده متناظر بتواند inject شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شده MiniMax
       برای `minimax-portal`).
    3. از شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی
       کلید API، یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا `/model list` در چت).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هنگام نیاز مدل‌ها را **برای هر نشست** تغییر دهید.
    Fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

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
    - براساس عامل مسیریابی کنید یا برای تغییر از `/agent` استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض ارائه می‌کند (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر میان‌بُر خودتان را با همان نام تنظیم کنید، مقدار شما اولویت دارد.

  </Accordion>

  <Accordion title="چگونه میان‌بُرهای مدل (نام‌های مستعار) را تعریف/بازنویسی کنم؟">
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

    سپس `/model sonnet` (یا `/<alias>` در جاهایی که پشتیبانی می‌شود) به آن شناسهٔ مدل حل می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از ارائه‌دهندگان دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
    OpenRouter (پرداخت به‌ازای هر توکن؛ مدل‌های بسیار):

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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید لازم آن ارائه‌دهنده موجود نباشد، خطای احراز هویت زمان اجرا دریافت می‌کنید (برای مثال `No API key found for provider "zai"`).

    **پس از افزودن یک عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول راهنما پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی توکن‌های بازتازه‌سازی، از عامل پیش‌فرض/اصلی بخواند.

    `agentDir` را بین عامل‌ها دوباره استفاده نکنید؛ باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جایگزینی مدل و «همهٔ مدل‌ها شکست خوردند»

<AccordionGroup>
  <Accordion title="جایگزینی چگونه کار می‌کند؟">
    جایگزینی در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **جایگزینی مدل** با مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های انتظار برای پروفایل‌های ناموفق اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw حتی وقتی یک ارائه‌دهنده با محدودیت نرخ روبه‌رو است یا موقتاً شکست می‌خورد، می‌تواند همچنان پاسخ دهد.

    سطل محدودیت نرخ فقط شامل پاسخ‌های سادهٔ `429` نیست. OpenClaw
    پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted`، و محدودیت‌های دوره‌ای
    پنجرهٔ مصرف (`weekly/monthly limit reached`) را نیز به‌عنوان محدودیت نرخ
    شایستهٔ جایگزینی در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه صورت‌حساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا باقی می‌مانند. اگر یک ارائه‌دهنده روی `401` یا `403`
    متن صریح صورت‌حساب برگرداند، OpenClaw همچنان می‌تواند آن را در مسیر
    صورت‌حساب نگه دارد، اما تطبیق‌دهنده‌های متن مخصوص ارائه‌دهنده فقط در محدودهٔ
    ارائه‌دهندهٔ مالک خود می‌مانند (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجرهٔ مصرف قابل‌تلاش‌مجدد یا محدودیت هزینهٔ
    سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` تلقی می‌کند، نه یک غیرفعال‌سازی طولانی صورت‌حساب.

    خطاهای سرریز زمینه متفاوت هستند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیشروی به جایگزینی مدل، در مسیر Compaction/تلاش‌مجدد
    باقی می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که unknown/error
    در آن دارد» است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده را
    مانند Anthropic خام `An unknown error occurred`، OpenRouter خام
    `Provider returned error`، خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، payloadهای JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، و خطاهای مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` را، وقتی زمینهٔ ارائه‌دهنده
    مطابقت دارد، به‌عنوان سیگنال‌های وقفه/بار زیاد شایستهٔ جایگزینی
    در نظر می‌گیرد.
    متن عمومی جایگزینی داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی جایگزینی مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسهٔ پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **فهرست بررسی رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در shell خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را بررسی سریع کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت بودن ارائه‌دهندگان را ببینید.

    **فهرست بررسی رفع مشکل برای "No credentials found for profile anthropic"**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده است، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان gateway** قرار دهید.
      - هر ترتیب سنجاق‌شده‌ای را که یک پروفایل گمشده را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان gateway اجرا می‌کنید**
      - در حالت راه‌دور، پروفایل‌های احراز هویت روی دستگاه gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین شامل کند (یا به یک کوتاه‌نویسی Gemini تغییر داده باشید)، OpenClaw در زمان جایگزینی مدل آن را امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را خواهید دید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف/اجتناب کنید تا جایگزینی به آنجا مسیریابی نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچهٔ نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک جریان متوقف‌شده/جزئی). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر هنوز ظاهر می‌شود، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چیستی و روش مدیریت آن‌ها

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامهٔ نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده متصل است. پروفایل‌ها در این مسیر قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون چاپ اسرار، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [Models CLI](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (برای مثال `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فرادادهٔ اختیاری برای پروفایل‌ها و ترتیب‌دهی برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این **اسرار** را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    اگر یک پروفایل در یک **دورهٔ انتظار** کوتاه باشد (محدودیت نرخ/وقفه‌ها/شکست‌های احراز هویت) یا در وضعیت **غیرفعال** طولانی‌تر باشد (صورت‌حساب/اعتبار ناکافی)، OpenClaw ممکن است موقتاً از آن صرف‌نظر کند. برای بررسی این مورد، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های انتظار محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که
    برای یک مدل در دورهٔ انتظار است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده
    قابل‌استفاده باشد، در حالی که پنجره‌های صورت‌حساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

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

    برای تأیید اینکه واقعاً چه چیزی امتحان خواهد شد، از این استفاده کنید:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe برای آن پروفایل
    به‌جای اینکه آن را بی‌صدا امتحان کند، `excluded_by_auth_order` را گزارش می‌کند.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در جاهایی که کاربرد دارد).
    - **کلیدهای API** از صورت‌حساب پرداخت به‌ازای هر توکن استفاده می‌کنند.

    راهنما به‌طور صریح از Anthropic Claude CLI، OpenAI Codex OAuth، و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جایگزینی مدل](/fa/concepts/model-failover)
