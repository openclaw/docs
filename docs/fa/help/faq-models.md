---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جایگزینی خودکار مدل / «همهٔ مدل‌ها ناموفق بودند»
    - آشنایی با پروفایل‌های احراز هویت و نحوهٔ مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'سؤالات متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، جابه‌جایی، انتقال به پشتیبان هنگام خرابی، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-04-29T22:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها، و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌عنوان مقدار زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `openai-codex/gpt-5.5`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را، و فقط بعد از آن به‌عنوان یک مسیر سازگاری منسوخ به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. همچنان باید `provider/model` را **صریحا** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را توصیه می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در پشته ارائه‌دهنده خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را به هزینه اولویت دهید.
    **برای گفت‌وگوی روزمره/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده کلی: برای کارهای حساس از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی روزمره یا خلاصه‌سازی‌ها از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیریابی کنید و برای موازی‌سازی کارهای طولانی از زیرعامل‌ها استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار مهم: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چطور بدون پاک کردن پیکربندی، مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در گفت‌وگو (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحا از `config.patch` استفاده کنید. payload جست‌وجو مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزندهای فوری را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا دوباره `openclaw doctor` را اجرا کنید تا تعمیر شود.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان (llama.cpp، vLLM، Ollama) استفاده کنم؟">
    بله. Ollama آسان‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` را دریافت کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` مدل‌های ابری به‌علاوه مدل‌های محلی Ollama شما را می‌دهد
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای جابه‌جایی دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، قویا **مدل‌های بزرگ** را توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و فهرست‌های مجاز سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd، و Krill برای مدل‌ها از چه چیزی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ توصیه ثابت برای ارائه‌دهنده وجود ندارد.
    - تنظیم فعلی زمان اجرا را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیتی/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چطور مدل‌ها را در لحظه عوض کنم (بدون راه‌اندازی دوباره)؟">
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

    همچنین می‌توانید یک پروفایل احراز هویت مشخص را برای ارائه‌دهنده اجباری کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام پروفایل احراز هویت بعدی امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چطور پروفایلی را که با @profile ثابت کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` برای تأیید پروفایل احراز هویت فعال استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم از GPT 5.5 برای کارهای روزانه و از Codex 5.5 برای کدنویسی استفاده کنم؟">
    بله. یکی را پیش‌فرض کنید و در صورت نیاز جابه‌جا شوید:

    - **جابه‌جایی سریع (برای هر نشست):** برای کارهای فعلی با کلید API مستقیم OpenAI از `/model openai/gpt-5.5` یا برای کارهای GPT-5.5 Codex OAuth از `/model openai-codex/gpt-5.5` استفاده کنید.
    - **پیش‌فرض:** برای استفاده با کلید API مقدار `agents.defaults.model.primary` را روی `openai/gpt-5.5` یا برای استفاده GPT-5.5 Codex OAuth روی `openai-codex/gpt-5.5` بگذارید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به زیرعامل‌هایی با مدل پیش‌فرض متفاوت مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چطور حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک تغییر وضعیت نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** وقتی نشست از `openai/gpt-5.5` یا `openai-codex/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** مقدار `agents.defaults.models["openai/gpt-5.5"].params.fastMode` یا `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` را روی `true` بگذارید.

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

    برای OpenAI، حالت سریع در درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های `/fast` نشست بر پیش‌فرض‌های پیکربندی مقدم هستند.

    [تفکر و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد پاسخی نمی‌آید؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و هرگونه
    بازنویسی نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    آن خطا **به‌جای** یک پاسخ عادی برگردانده می‌شود. راه‌حل: مدل را به
    `agents.defaults.models` اضافه کنید، فهرست مجاز را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده یا پروفایل احراز هویت MiniMax
    پیدا نشده)، بنابراین مدل قابل حل نیست.

    چک‌لیست رفع مشکل:

    1. به نسخه فعلی OpenClaw ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس gateway را دوباره راه‌اندازی کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/auth profiles وجود دارد تا ارائه‌دهنده مطابق بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شده MiniMax
       برای `minimax-portal`).
    3. از شناسه دقیق مدل (حساس به حروف کوچک و بزرگ) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی با کلید API،
       یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا `/model list` در گفت‌وگو).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض خودم و OpenAI را برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و در صورت نیاز مدل‌ها را **برای هر نشست** عوض کنید.
    fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه A: جابه‌جایی برای هر نشست**

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
    - بر اساس عامل مسیریابی کنید یا برای جابه‌جایی از `/agent` استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میانبرهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض ارائه می‌کند (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` برای راه‌اندازی‌های کلید API، یا `openai-codex/gpt-5.5` وقتی برای Codex OAuth پیکربندی شده باشد
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر نام مستعار خودتان را با همان نام تنظیم کنید، مقدار شما مقدم است.

  </Accordion>

  <Accordion title="چطور میانبرهای مدل (نام‌های مستعار) را تعریف/بازنویسی کنم؟">
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

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به آن شناسه مدل حل می‌شود.

  </Accordion>

  <Accordion title="چطور مدل‌هایی از ارائه‌دهندگان دیگر مثل OpenRouter یا Z.AI اضافه کنم؟">
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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید موردنیاز آن ارائه‌دهنده وجود نداشته باشد، یک خطای احراز هویت زمان اجرا دریافت می‌کنید (مثلاً `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک انبار احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول راهنما پیکربندی کنید.
    - یا فقط پروفایل‌های ثابت و قابل‌حمل `api_key` / `token` را از انبار احراز هویت عامل اصلی به انبار احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، زمانی که عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی توکن‌های refresh، از عامل پیش‌فرض/اصلی بخواند.

    `agentDir` را بین عامل‌ها دوباره استفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## بازیابی پس از خطای مدل و «همه مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="بازیابی پس از خطا چگونه کار می‌کند؟">
    بازیابی پس از خطا در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **جایگزینی مدل** با مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های آرام‌سازی برای پروفایل‌های ناموفق اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw می‌تواند حتی زمانی که یک ارائه‌دهنده با محدودیت نرخ روبه‌رو است یا موقتاً خطا می‌دهد، همچنان پاسخ دهد.

    سطل محدودیت نرخ فقط شامل پاسخ‌های ساده `429` نیست. OpenClaw
    همچنین پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted`، و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را محدودیت نرخِ شایسته بازیابی پس از خطا
    در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه خطای صورتحساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا باقی می‌مانند. اگر یک ارائه‌دهنده متن صریح مربوط به صورتحساب را روی `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را در مسیر صورتحساب نگه دارد، اما تطبیق‌گرهای متن مخصوص ارائه‌دهنده فقط در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجره مصرف قابل تلاش مجدد یا محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی مربوط به صورتحساب.

    خطاهای سرریز زمینه متفاوت هستند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش‌بردن جایگزینی مدل، در مسیر Compaction/تلاش مجدد باقی می‌مانند.

    متن خطای عمومی سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد»
    تعریف شده است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده را، مانند خطای بدون جزئیات Anthropic `An unknown error occurred`، خطای بدون جزئیات OpenRouter
    `Provider returned error`، خطاهای دلیل توقف مثل `Unhandled stop reason:
    error`، بارهای JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، و خطاهای مشغول بودن ارائه‌دهنده مانند `ModelNotReadyException` را
    وقتی زمینه ارائه‌دهنده تطبیق داشته باشد، سیگنال‌های زمان‌تمام‌شده/بیش‌بارِ شایسته بازیابی پس از خطا در نظر می‌گیرد.
    متن عمومی جایگزینی داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی جایگزینی مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در انبار احراز هویت مورد انتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر مسیرهای قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در پوسته خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - پیکربندی‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را سریع بررسی کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت بودن ارائه‌دهنده‌ها را ببینید.

    **چک‌لیست رفع مشکل برای «No credentials found for profile anthropic»**

    یعنی اجرا به یک پروفایل احراز هویت Anthropic ثابت شده است، اما Gateway
    نمی‌تواند آن را در انبار احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان Gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از یک کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان Gateway** قرار دهید.
      - هر ترتیب ثابتی را که یک پروفایلِ موجودنیست را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان Gateway اجرا می‌کنید**
      - در حالت راه‌دور، پروفایل‌های احراز هویت روی دستگاه Gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین داشته باشد (یا به یک خلاصه‌نویسی Gemini تغییر داده باشید)، OpenClaw هنگام جایگزینی مدل آن را امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را می‌بینید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف کنید یا از آن‌ها پرهیز کنید تا جایگزینی به آنجا هدایت نشود.

    **درخواست LLM رد شد: امضای تفکر لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های تفکر بدون امضا** است (اغلب از یک جریان
    لغوشده/نیمه‌کاره). Google Antigravity برای بلوک‌های تفکر امضا لازم دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های تفکر بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر می‌شود، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چه هستند و چگونه آن‌ها را مدیریت کنیم

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده متصل است. پروفایل‌ها در این مسیر قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (زمانی رایج است که هویت ایمیلی وجود ندارد)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که خودتان انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و یک ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این **اسرار را ذخیره نمی‌کند**؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است یک پروفایل را موقتاً رد کند اگر در یک **دوره آرام‌سازی** کوتاه باشد (محدودیت نرخ/زمان‌تمام‌شده/خرابی احراز هویت) یا در یک وضعیت **غیرفعال** طولانی‌تر باشد (صورتحساب/اعتبار ناکافی). برای بررسی این وضعیت، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های آرام‌سازی محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که برای یک مدل
    در حال آرام‌سازی است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد،
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

    برای تأیید اینکه واقعاً چه چیزی امتحان خواهد شد، از این استفاده کنید:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe به‌جای اینکه بی‌صدا آن را امتحان کند، برای آن پروفایل
    `excluded_by_auth_order` گزارش می‌دهد.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در موارد قابل اعمال).
    - **کلیدهای API** از صورتحساب به‌ازای هر توکن استفاده می‌کنند.

    راهنما به‌صورت صریح از Anthropic Claude CLI، OpenAI Codex OAuth، و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [بازیابی پس از خطای مدل](/fa/concepts/model-failover)
