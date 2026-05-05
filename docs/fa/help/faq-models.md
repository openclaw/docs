---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جایگزینی خودکار مدل هنگام خرابی / «همهٔ مدل‌ها با شکست مواجه شدند»
    - آشنایی با پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تغییر، بازیابی پس از خرابی، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-05T01:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و نمایه احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (نمونه: `openai/gpt-5.5` یا `openai-codex/gpt-5.5`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطبیق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را، و فقط بعد از آن به‌عنوان مسیر سازگاری منسوخ، به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نشان دادن یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. همچنان باید `provider/model` را **صریح** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعه ارائه‌دهندگان خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را به هزینه ترجیح دهید.
    **برای گفت‌وگوی روزمره/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده سرانگشتی: برای کارهای حساس از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگو یا خلاصه‌سازی روزمره از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیریابی کنید و از زیرعامل‌ها برای
    موازی‌سازی کارهای طولانی استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرتر هستند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چطور بدون پاک کردن پیکربندی، مدل‌ها را تغییر بدهم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **model** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در گفت‌وگو (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحا از `config.patch` استفاده کنید. بار داده lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزند فوری را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا برای تعمیر دوباره `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان‌شده (llama.cpp، vLLM، Ollama) استفاده کنم؟">
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

    نکته امنیتی: مدل‌های کوچک‌تر یا شدیدا کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرتر هستند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، **مدل‌های بزرگ** را قویا پیشنهاد می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و فهرست‌های مجاز سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill از چه مدل‌هایی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است با گذشت زمان تغییر کنند؛ هیچ پیشنهاد ثابت ارائه‌دهنده‌ای وجود ندارد.
    - تنظیم runtime فعلی را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیت/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چطور مدل‌ها را در لحظه تغییر بدهم (بدون راه‌اندازی مجدد)؟">
    دستور `/model` را به‌عنوان یک پیام مستقل استفاده کنید:

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

    `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهد. با شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک نمایه احراز هویت مشخص را برای ارائه‌دهنده اجباری کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام نمایه احراز هویت بعدا امتحان خواهد شد.
    همچنین در صورت وجود، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چطور نمایه‌ای را که با @profile سنجاق کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` برای تایید نمایه احراز هویت فعال استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم از GPT 5.5 برای کارهای روزانه و از Codex 5.5 برای کدنویسی استفاده کنم؟">
    بله. انتخاب مدل و انتخاب runtime را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` و `agents.defaults.agentRuntime.id` را روی `"codex"` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API از طریق PI:** از `/model openai/gpt-5.5` بدون بازنویسی runtime مربوط به Codex استفاده کنید و `OPENAI_API_KEY` را پیکربندی کنید.
    - **Codex OAuth از طریق PI:** فقط وقتی از `/model openai-codex/gpt-5.5` استفاده کنید که عمدا runner معمول PI را با Codex OAuth می‌خواهید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به یک عامل فقط Codex با مدل خودش و پیش‌فرض `agentRuntime` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چطور حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک toggle نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** وقتی نشست از `openai/gpt-5.5` یا `openai-codex/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` یا `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.

    نمونه:

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

    برای OpenAI، حالت سریع در درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های `/fast` نشست بر پیش‌فرض‌های پیکربندی اولویت دارند.

    [Thinking و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و هر
    بازنویسی نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    این خطا **به‌جای** یک پاسخ معمولی برگردانده می‌شود. راه‌حل: مدل را به
    `agents.defaults.models` اضافه کنید، فهرست مجاز را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور همچنین شامل `--runtime codex` بود، ابتدا مدل را اضافه کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    این یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا
    نمایه احراز هویتی پیدا نشده)، بنابراین مدل قابل resolve نیست.

    چک‌لیست رفع مشکل:

    1. به یک انتشار فعلی OpenClaw ارتقا دهید (یا از source `main` اجرا کنید)، سپس gateway را راه‌اندازی مجدد کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا اینکه احراز هویت MiniMax
       در env/auth profiles وجود دارد تا ارائه‌دهنده متناظر بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا MiniMax
       OAuth ذخیره‌شده برای `minimax-portal`).
    3. شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) را برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی
       API-key، یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا `/model list` در گفت‌وگو).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را به‌عنوان پیش‌فرض و OpenAI را برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هر وقت لازم بود مدل‌ها را **برای هر نشست** تغییر دهید.
    جایگزین‌ها برای **خطاها** هستند، نه «کارهای سخت»، بنابراین از `/model` یا یک عامل جداگانه استفاده کنید.

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
    - بر اساس عامل مسیریابی کنید یا برای تغییر از `/agent` استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض ارائه می‌کند (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

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

  <Accordion title="چطور میان‌برهای مدل (نام‌های مستعار) را تعریف/بازنویسی کنم؟">
    نام‌های مستعار از `agents.defaults.models.<modelId>.alias` می‌آیند. نمونه:

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

  <Accordion title="چطور مدل‌هایی از ارائه‌دهندگان دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
    OpenRouter (پرداخت به‌ازای توکن؛ مدل‌های متعدد):

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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید موردنیاز ارائه‌دهنده وجود نداشته باشد، یک خطای احراز هویت زمان اجرا دریافت می‌کنید (مثلاً `No API key found for provider "zai"`).

    **پس از افزودن یک عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در جادوگر پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد، از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی توکن‌های تازه‌سازی، از عامل پیش‌فرض/اصلی بخواند.

    از `agentDir` در چند عامل دوباره استفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جابه‌جایی مدل هنگام خرابی و «همه مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="جابه‌جایی هنگام خرابی چگونه کار می‌کند؟">
    جابه‌جایی هنگام خرابی در دو مرحله رخ می‌دهد:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **بازگشت به مدل جایگزین** بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های سردشدن برای پروفایل‌های ناموفق اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw می‌تواند حتی وقتی یک ارائه‌دهنده با محدودیت نرخ روبه‌رو است یا موقتاً خطا می‌دهد، همچنان پاسخ دهد.

    سطل محدودیت نرخ فقط شامل پاسخ‌های ساده `429` نیست. OpenClaw
    پیام‌هایی مثل `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted`، و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را نیز محدودیت نرخ شایسته جابه‌جایی هنگام خرابی
    در نظر می‌گیرد.

    بعضی پاسخ‌هایی که شبیه خطای پرداخت هستند `402` نیستند، و بعضی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا باقی می‌مانند. اگر یک ارائه‌دهنده متن صریح پرداخت را در `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را در
    مسیر پرداخت نگه دارد، اما تطبیق‌دهنده‌های متن ویژه ارائه‌دهنده در محدوده همان
    ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجره مصرف قابل‌تلاش‌مجدد یا
    محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی‌مدت پرداخت.

    خطاهای سرریز زمینه متفاوت هستند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش‌بردن بازگشت به مدل جایگزین، در مسیر Compaction/تلاش‌مجدد باقی می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد» است. OpenClaw
    شکل‌های گذرای محدود به ارائه‌دهنده مانند `An unknown error occurred` خالی از Anthropic، `Provider returned error` خالی از OpenRouter، خطاهای دلیل توقف مثل `Unhandled stop reason:
    error`، محموله‌های JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، و خطاهای مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` را وقتی زمینه ارائه‌دهنده
    مطابقت داشته باشد، سیگنال‌های مهلت‌پایان‌یافته/بارگذاری‌بیش‌ازحد شایسته جابه‌جایی هنگام خرابی
    در نظر می‌گیرد.
    متن عمومی بازگشت داخلی مثل `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی بازگشت به مدل جایگزین را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **فهرست بررسی رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر مسیرهای قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری می‌شود**
      - اگر `ANTHROPIC_API_KEY` را در پوسته خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چندعاملی یعنی ممکن است چندین فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را برای اطمینان بررسی کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت بودن ارائه‌دهندگان را ببینید.

    **فهرست بررسی رفع مشکل برای «No credentials found for profile anthropic»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان Gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از یک کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان Gateway** قرار دهید.
      - هر ترتیب سنجاق‌شده‌ای را که یک پروفایل گمشده را اجباری می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان Gateway اجرا می‌کنید**
      - در حالت راه دور، پروفایل‌های احراز هویت روی دستگاه Gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و ناموفق شد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین شامل کند (یا به یک کوتاه‌نوشت Gemini تغییر داده باشید)، OpenClaw هنگام بازگشت به مدل جایگزین آن را امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را خواهید دید.

    اصلاح: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را در `agents.defaults.model.fallbacks` / aliases حذف کنید یا از آن‌ها پرهیز کنید تا fallback به آنجا هدایت نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک جریان لغوشده/ناقص). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    اصلاح: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر هنوز ظاهر می‌شود، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چه هستند و چگونه آن‌ها را مدیریت کنید

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده متصل است. پروفایل‌ها در اینجا قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون افشای اسرار، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#openclaw-models-auth-list) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده مانند این‌ها استفاده می‌کند:

    - `anthropic:default` (رایج وقتی هویت ایمیلی وجود ندارد)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت ابتدا امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و ترتیب‌بندی برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این مورد اسرار را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است اگر پروفایلی در یک **دوره انتظار** کوتاه باشد (محدودیت نرخ/مهلت‌های زمانی/شکست‌های احراز هویت) یا در وضعیت **غیرفعال** طولانی‌تر باشد (صورت‌حساب/اعتبار ناکافی)، آن را موقتاً رد کند. برای بررسی این موضوع، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های انتظار محدودیت نرخ می‌توانند به مدل محدود باشند. پروفایلی که
    برای یک مدل در دوره انتظار است، همچنان می‌تواند برای مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد،
    در حالی که بازه‌های صورت‌حساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید با CLI یک ترتیب بازنویسی **برای هر عامل** تنظیم کنید (که در `auth-state.json` همان عامل ذخیره می‌شود):

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

    برای هدف‌گرفتن یک عامل مشخص:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    برای راستی‌آزمایی اینکه واقعاً چه چیزی امتحان خواهد شد، از این استفاده کنید:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe به‌جای اینکه آن را بی‌صدا امتحان کند،
    برای آن پروفایل `excluded_by_auth_order` گزارش می‌دهد.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در موارد قابل اعمال).
    - **کلیدهای API** از صورت‌حساب پرداخت به‌ازای توکن استفاده می‌کنند.

    راه‌انداز به‌طور صریح از Anthropic Claude CLI، OpenAI Codex OAuth و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [FAQ](/fa/help/faq) — FAQ اصلی
- [FAQ — شروع سریع و راه‌اندازی اجرای اول](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
