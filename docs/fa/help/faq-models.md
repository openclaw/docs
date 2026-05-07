---
read_when:
    - انتخاب یا تعویض مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جابه‌جایی خودکار مدل / "همهٔ مدل‌ها ناموفق بودند"
    - درک پروفایل‌های احراز هویت و نحوهٔ مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تعویض، جایگزینی هنگام خرابی، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-07T13:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و نمایهٔ احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها، و
  عیب‌یابی، [FAQ](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌شکل `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهندهٔ پیکربندی‌شده برای همان شناسهٔ دقیق مدل را، و فقط بعد از آن به‌عنوان مسیر سازگاری منسوخ‌شده به ارائه‌دهندهٔ پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی از ارائه‌دهندهٔ حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. همچنان باید `provider/model` را **صریحاً** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعهٔ ارائه‌دهندگان خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را بر هزینه مقدم بدانید.
    **برای گفت‌وگوی معمولی/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعدهٔ کلی: برای کارهای حساس از **بهترین مدلی که از عهدهٔ هزینه‌اش برمی‌آیید** استفاده کنید، و برای گفت‌وگوی معمولی یا خلاصه‌ها از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل جداگانه مسیریابی کنید و از عامل‌های فرعی برای
    موازی‌سازی کارهای طولانی استفاده کنید (هر عامل فرعی توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [عامل‌های فرعی](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناامن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینهٔ بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چگونه بدون پاک کردن پیکربندی، مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در گفت‌وگو (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحاً از `config.patch` استفاده کنید. بار ارسالی lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصهٔ فرزندان مستقیم را در اختیار شما می‌گذارد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کرده‌اید، از نسخهٔ پشتیبان بازیابی کنید یا دوباره `openclaw doctor` را برای تعمیر اجرا کنید.

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

    نکات:

    - `Cloud + Local` مدل‌های ابری را به‌همراه مدل‌های محلی Ollama شما می‌دهد
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای جابه‌جایی دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکتهٔ امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، قویاً **مدل‌های بزرگ** را پیشنهاد می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و فهرست‌های مجاز سخت‌گیرانهٔ ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd، و Krill برای مدل‌ها از چه چیزی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ توصیهٔ ثابتی برای ارائه‌دهنده وجود ندارد.
    - تنظیم فعلی زمان اجرا را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیت/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه عوض کنم (بدون راه‌اندازی دوباره)؟">
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

    می‌توانید مدل‌های موجود را با `/model`، `/model list`، یا `/model status` فهرست کنید.

    `/model` (و `/model list`) یک انتخابگر فشردهٔ شماره‌دار نشان می‌دهد. با شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک نمایهٔ احراز هویت مشخص را برای ارائه‌دهنده مجبور کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` در حال استفاده است، و کدام نمایهٔ احراز هویت بعداً امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهندهٔ پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چگونه نمایه‌ای را که با @profile پین کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` برای تأیید نمایهٔ احراز هویت فعال استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای روزانه از GPT 5.5 و برای کدنویسی از Codex 5.5 استفاده کنم؟">
    بله. انتخاب مدل و انتخاب زمان اجرا را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API بیرون از حلقهٔ عامل:** `OPENAI_API_KEY` را برای تصاویر، embeddingها، گفتار، realtime، و دیگر سطوح غیرعاملی OpenAI API پیکربندی کنید.
    - **احراز هویت کلید API عامل OpenAI:** از `/model openai/gpt-5.5` با یک نمایهٔ کلید API مرتب‌شدهٔ `openai-codex` استفاده کنید.
    - **عامل‌های فرعی:** کارهای کدنویسی را به یک عامل فقط Codex با مدل خودش و پیش‌فرض `agentRuntime` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک کلید نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** در حالی که نشست از `openai/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
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

    برای OpenAI، حالت سریع در درخواست‌های بومی Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های `/fast` نشست بر پیش‌فرض‌های پیکربندی مقدم‌اند.

    [تفکر و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد هیچ پاسخی نمی‌آید؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و هر
    بازنویسی نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    آن خطا **به‌جای** یک پاسخ عادی برگردانده می‌شود. راه‌حل: مدل را به
    `agents.defaults.models` اضافه کنید، فهرست مجاز را بردارید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور همچنین شامل `--runtime codex` بود، ابتدا مدل را اضافه کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    این یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهندهٔ MiniMax یا نمایهٔ احراز هویت
    پیدا نشده است)، بنابراین مدل قابل حل نیست.

    چک‌لیست رفع مشکل:

    1. به یک نسخهٔ فعلی OpenClaw ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس gateway را دوباره راه‌اندازی کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/نمایه‌های احراز هویت وجود دارد تا ارائه‌دهندهٔ متناظر بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شدهٔ MiniMax
       برای `minimax-portal`).
    3. از شناسهٔ دقیق مدل (حساس به بزرگی/کوچکی حروف) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی
       کلید API، یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا `/model list` در گفت‌وگو).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض خودم قرار دهم و برای کارهای پیچیده از OpenAI استفاده کنم؟">
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

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض همراه دارد (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر نام مستعار خودتان را با همان نام تنظیم کنید، مقدار شما برنده می‌شود.

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

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به آن شناسهٔ مدل resolve می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از ارائه‌دهندگان دیگر مثل OpenRouter یا Z.AI اضافه کنم؟">
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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید موردنیاز ارائه‌دهنده موجود نباشد، با خطای احراز هویت زمان اجرا روبه‌رو می‌شوید (برای مثال `No API key found for provider "zai"`).

    **پس از افزودن یک agent جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **agent جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر agent جداست و در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول ویزارد پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت agent اصلی به مخزن احراز هویت agent جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی agent جدید به حساب خودش نیاز دارد از همان agent وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی refresh tokenها، از agent پیش‌فرض/اصلی بخواند.

    از `agentDir` مشترک بین agentها استفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جایگزینی مدل هنگام خطا و «همهٔ مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="جایگزینی هنگام خطا چگونه کار می‌کند؟">
    جایگزینی هنگام خطا در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **جایگزینی مدل** با مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های خنک‌سازی برای پروفایل‌های ناموفق اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw می‌تواند حتی وقتی یک ارائه‌دهنده با محدودیت نرخ روبه‌روست یا موقتاً دچار خطا شده است، همچنان پاسخ بدهد.

    سبد محدودیت نرخ فقط پاسخ‌های سادهٔ `429` را شامل نمی‌شود. OpenClaw
    همچنین پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted` و محدودیت‌های دوره‌ای
    پنجرهٔ مصرف (`weekly/monthly limit reached`) را محدودیت نرخِ شایستهٔ
    جایگزینی هنگام خطا در نظر می‌گیرد.

    بعضی پاسخ‌هایی که شبیه صورت‌حساب هستند `402` نیستند، و بعضی پاسخ‌های HTTP `402`
    نیز همچنان در همان سبد گذرا می‌مانند. اگر یک ارائه‌دهنده متن صریح صورت‌حساب را
    روی `401` یا `403` برگرداند، OpenClaw هنوز می‌تواند آن را در مسیر
    صورت‌حساب نگه دارد، اما تطبیق‌گرهای متنِ مختص ارائه‌دهنده فقط در محدودهٔ همان
    ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجرهٔ مصرف قابل‌تلاش دوباره یا
    محدودیت هزینهٔ سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی مربوط به صورت‌حساب.

    خطاهای سرریز زمینه متفاوت‌اند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model` یا `ollama error: context length
    exceeded` به‌جای پیش بردن جایگزینی مدل، در مسیر Compaction/تلاش دوباره
    می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد»
    است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده، مانند
    Anthropic با متن تنها `An unknown error occurred`، OpenRouter با متن تنها
    `Provider returned error`، خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، بدنه‌های JSON از نوع `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`) و خطاهای مشغول بودن ارائه‌دهنده مانند `ModelNotReadyException` را
    وقتی زمینهٔ ارائه‌دهنده تطابق داشته باشد، سیگنال‌های timeout/بار بیش از حد
    شایستهٔ جایگزینی هنگام خطا در نظر می‌گیرد.
    متن عمومی جایگزینی داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی جایگزینی مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسهٔ پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت موردانتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در shell خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید agent درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چند-agent یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را sanity-check کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت بودن ارائه‌دهندگان را ببینید.

    **چک‌لیست رفع مشکل برای «No credentials found for profile anthropic»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic پین شده است، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را روی **میزبان gateway** در `~/.openclaw/.env` قرار دهید.
      - هر ترتیب پین‌شده‌ای را که یک پروفایل ناموجود را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان gateway اجرا می‌کنید**
      - در حالت راه دور، پروفایل‌های احراز هویت روی دستگاه gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و ناموفق شد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین هنگام خطا داشته باشد (یا به یک کوتاه‌نویسی Gemini تغییر داده باشید)، OpenClaw آن را در طول جایگزینی مدل امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را خواهید دید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / aliasها حذف کنید یا از آن‌ها پرهیز کنید تا جایگزینی هنگام خطا به آنجا هدایت نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچهٔ نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک جریان لغوشده/جزئی). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    راه‌حل: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر شد، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چه هستند و چگونه آن‌ها را مدیریت کنیم

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    پروفایل احراز هویت یک رکورد نام‌دار از اعتبارنامه‌ها (OAuth یا کلید API) است که به یک ارائه‌دهنده وابسته است. پروفایل‌ها در اینجا قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون نمایش اسرار، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (رایج وقتی هویت ایمیلی وجود ندارد)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که خودتان انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    بله. پیکربندی از فرادادهٔ اختیاری برای پروفایل‌ها و ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این کار **اسرار** را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است یک پروفایل را موقتاً نادیده بگیرد، اگر در یک **دورهٔ خنک‌سازی** کوتاه (محدودیت نرخ/زمان‌پایان‌ها/خطاهای احراز هویت) یا یک وضعیت **غیرفعال** طولانی‌تر (صورت‌حساب/اعتبار ناکافی) باشد. برای بررسی این وضعیت، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های خنک‌سازی محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که برای
    یک مدل در حال خنک‌سازی است، همچنان می‌تواند برای مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد،
    در حالی که پنجره‌های صورت‌حساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید از طریق CLI یک بازنویسی ترتیب **برای هر عامل** تنظیم کنید (که در `auth-state.json` همان عامل ذخیره می‌شود):

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

    برای تأیید اینکه واقعاً چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe برای آن پروفایل
    به‌جای امتحان بی‌صدا، `excluded_by_auth_order` را گزارش می‌کند.

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در مواردی که قابل اعمال باشد).
    - **کلیدهای API** از صورت‌حساب پرداخت به‌ازای هر توکن استفاده می‌کنند.

    راهنما به‌طور صریح از Anthropic Claude CLI، OAuth مربوط به OpenAI Codex، و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
