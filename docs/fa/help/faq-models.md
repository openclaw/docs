---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جابه‌جایی خودکار مدل هنگام خرابی / «همهٔ مدل‌ها ناموفق بودند»
    - شناخت پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، جابه‌جایی، جایگزینی هنگام خرابی، و نمایه‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-12T04:10:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ دربارهٔ مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [FAQ](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌عنوان مقدار زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌شکل `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`). اگر provider را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق provider پیکربندی‌شدهٔ یکتا برای همان شناسهٔ دقیق مدل را، و فقط پس از آن به‌عنوان مسیر سازگاری منسوخ‌شده، به provider پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض کهنه از provider حذف‌شده، به نخستین provider/model پیکربندی‌شده برمی‌گردد. بااین‌حال همچنان باید `provider/model` را **صریحاً** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعهٔ providerهای خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را بر هزینه اولویت دهید.
    **برای گفت‌وگوی معمولی/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیردهی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعدهٔ سرانگشتی: برای کارهای پرریسک از **بهترین مدلی که از پس هزینه‌اش برمی‌آیید** استفاده کنید، و برای گفت‌وگوی معمولی یا خلاصه‌سازی از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیردهی کنید و از زیرعامل‌ها برای
    موازی‌سازی کارهای طولانی استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناامن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینهٔ بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چگونه بدون پاک کردن پیکربندی، مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **model** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در چت (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحاً از `config.patch` استفاده کنید. payload جست‌وجو مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزند بلافاصله را
    برای به‌روزرسانی‌های جزئی در اختیارتان می‌گذارد.
    اگر پیکربندی را بازنویسی کردید، از نسخهٔ پشتیبان بازیابی کنید یا برای تعمیر دوباره `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان (llama.cpp، vLLM، Ollama) استفاده کنم؟">
    بله. Ollama ساده‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` را pull کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` مدل‌های ابری را به‌همراه مدل‌های محلی Ollama شما می‌دهد
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به pull محلی نیاز ندارند
    - برای جابه‌جایی دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکتهٔ امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. ما برای هر رباتی که می‌تواند از ابزارها استفاده کند، **مدل‌های بزرگ** را قویاً توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و allowlistهای سخت‌گیرانهٔ ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [providerهای مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill برای مدل‌ها از چه چیزی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ هیچ توصیهٔ provider ثابتی وجود ندارد.
    - تنظیم runtime فعلی را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس به امنیت/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه عوض کنم (بدون راه‌اندازی دوباره)؟">
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

    `/model` (و `/model list`) یک انتخاب‌گر فشردهٔ شماره‌دار نشان می‌دهد. با شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک پروفایل احراز هویت خاص را برای provider اجبار کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام پروفایل احراز هویت بعداً امتحان خواهد شد.
    همچنین endpoint پیکربندی‌شدهٔ provider (`baseUrl`) و حالت API (`api`) را در صورت موجود بودن نشان می‌دهد.

    **چگونه پروفایلی را که با @profile سنجاق کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    از `/model status` استفاده کنید تا تأیید کنید کدام پروفایل احراز هویت فعال است.

  </Accordion>

  <Accordion title="اگر دو provider یک شناسهٔ مدل یکسان ارائه کنند، /model از کدام استفاده می‌کند؟">
    `/model provider/model` همان مسیر دقیق provider را برای نشست انتخاب می‌کند.

    برای مثال، `qianfan/deepseek-v4-flash` و `deepseek/deepseek-v4-flash` ارجاع‌های مدل متفاوتی هستند، هرچند هر دو شامل `deepseek-v4-flash` هستند. OpenClaw نباید فقط به‌خاطر تطابق شناسهٔ مدل بدون provider، بی‌صدا از یک provider به دیگری جابه‌جا شود.

    ارجاع `/model` انتخاب‌شده توسط کاربر برای سیاست fallback نیز سخت‌گیرانه است. اگر آن provider/model انتخاب‌شده در دسترس نباشد، پاسخ به‌صورت قابل‌مشاهده شکست می‌خورد، به‌جای اینکه از `agents.defaults.model.fallbacks` پاسخ دهد. زنجیره‌های fallback پیکربندی‌شده همچنان برای پیش‌فرض‌های پیکربندی‌شده، primaryهای کار Cron، و وضعیت fallback انتخاب‌شدهٔ خودکار اعمال می‌شوند.

    اگر اجرایی که از یک override غیرنشستی شروع شده اجازهٔ استفاده از fallback را داشته باشد، OpenClaw ابتدا provider/model درخواست‌شده را امتحان می‌کند، سپس fallbackهای پیکربندی‌شده را، و فقط پس از آن primary پیکربندی‌شده را. این کار مانع می‌شود شناسه‌های مدل تکراری بدون provider مستقیماً به provider پیش‌فرض برگردند.

    [مدل‌ها](/fa/concepts/models) و [failover مدل](/fa/concepts/model-failover) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم از GPT 5.5 برای کارهای روزانه و Codex 5.5 برای کدنویسی استفاده کنم؟">
    بله. انتخاب مدل و انتخاب runtime را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API خارج از حلقهٔ عامل:** `OPENAI_API_KEY` را برای تصاویر، embeddingها، گفتار، realtime و دیگر سطح‌های غیرعاملی OpenAI API پیکربندی کنید.
    - **احراز هویت کلید API عامل OpenAI:** از `/model openai/gpt-5.5` با یک پروفایل API-key مرتب‌شدهٔ `openai-codex` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به یک عامل متمرکز بر Codex با مدل `openai/gpt-5.5` خودش مسیردهی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک toggle نشستی یا یک پیش‌فرض پیکربندی استفاده کنید:

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

    برای OpenAI، حالت سریع در درخواست‌های بومی Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. overrideهای نشستی `/fast` بر پیش‌فرض‌های پیکربندی غلبه می‌کنند.

    [تفکر و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و سپس پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **allowlist** برای `/model` و هر
    override نشستی تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    آن خطا **به‌جای** پاسخ عادی برگردانده می‌شود. راه‌حل: مدل دقیق را به
    `agents.defaults.models` اضافه کنید، برای کاتالوگ‌های provider پویا یک wildcard provider مانند `"provider/*": {}` اضافه کنید، allowlist را بردارید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور شامل `--runtime codex` هم بود، ابتدا allowlist را به‌روزرسانی کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    یعنی **provider پیکربندی نشده است** (هیچ پیکربندی provider یا پروفایل احراز هویت MiniMax
    پیدا نشده)، بنابراین مدل قابل resolve نیست.

    چک‌لیست رفع مشکل:

    1. به نسخهٔ فعلی OpenClaw ارتقا دهید (یا از source `main` اجرا کنید)، سپس gateway را راه‌اندازی دوباره کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/auth profiles وجود دارد تا provider منطبق بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شدهٔ MiniMax
       برای `minimax-portal`).
    3. از شناسهٔ دقیق مدل (حساس به حروف بزرگ و کوچک) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی
       API-key، یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا `/model list` در چت).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را به‌عنوان پیش‌فرض و OpenAI را برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و در صورت نیاز مدل‌ها را **برای هر نشست** عوض کنید.
    Fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینهٔ A: جابه‌جایی برای هر نشست**

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

    **گزینهٔ B: عامل‌های جداگانه**

    - پیش‌فرض عامل A: MiniMax
    - پیش‌فرض عامل B: OpenAI
    - بر اساس عامل مسیردهی کنید یا برای جابه‌جایی از `/agent` استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیردهی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض ارائه می‌کند (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر alias خودتان را با همان نام تنظیم کنید، مقدار شما اولویت دارد.

  </Accordion>

  <Accordion title="چگونه میان‌برهای مدل (aliasها) را تعریف/بازنویسی کنم؟">
    aliasها از `agents.defaults.models.<modelId>.alias` می‌آیند. نمونه:

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

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به همان شناسه مدل resolve می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از providerهای دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
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

    اگر به یک provider/model اشاره کنید اما کلید provider لازم وجود نداشته باشد، در زمان اجرا خطای احراز هویت می‌گیرید (مثلاً `No API key found for provider "zai"`).

    **پس از افزودن یک agent جدید، کلید API برای provider پیدا نشد**

    این معمولاً یعنی **agent جدید** مخزن auth خالی دارد. auth برای هر agent جداست و در این مسیر ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و auth را در طول wizard پیکربندی کنید.
    - یا فقط profileهای ایستای قابل‌حمل `api_key` / `token` را از مخزن auth agent اصلی به مخزن auth agent جدید کپی کنید.
    - برای profileهای OAuth، وقتی agent جدید به حساب خودش نیاز دارد از همان agent جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون clone کردن refresh tokenها، از agent پیش‌فرض/اصلی بخواند.

    `agentDir` را بین agentها دوباره استفاده نکنید؛ این کار باعث تداخل auth/session می‌شود.

  </Accordion>
</AccordionGroup>

## failover مدل و "همه مدل‌ها ناموفق بودند"

<AccordionGroup>
  <Accordion title="failover چگونه کار می‌کند؟">
    failover در دو مرحله انجام می‌شود:

    1. **چرخش profile احراز هویت** در همان provider.
    2. **fallback مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

    cooldownها روی profileهای ناموفق اعمال می‌شوند (backoff نمایی)، بنابراین OpenClaw حتی وقتی یک provider با محدودیت نرخ روبه‌روست یا موقتاً دچار خطاست، می‌تواند به پاسخ‌گویی ادامه دهد.

    bucket محدودیت نرخ فقط پاسخ‌های ساده `429` را شامل نمی‌شود. OpenClaw
    همچنین پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted` و محدودیت‌های
    دوره‌ای پنجره مصرف (`weekly/monthly limit reached`) را محدودیت نرخ
    شایسته failover تلقی می‌کند.

    برخی پاسخ‌هایی که شبیه billing هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان bucket گذرا می‌مانند. اگر provider روی `401` یا `403`
    متن billing صریح برگرداند، OpenClaw همچنان می‌تواند آن را در مسیر
    billing نگه دارد، اما matcherهای متن مخصوص provider در محدوده همان
    provideri می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر پیام `402`
    در عوض شبیه یک پنجره مصرف قابل تلاش مجدد یا
    محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` تلقی می‌کند، نه یک غیرفعال‌سازی billing طولانی.

    خطاهای سرریز context متفاوت‌اند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش بردن fallback مدل، در مسیر Compaction/تلاش مجدد
    می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که
    unknown/error در آن باشد» است. OpenClaw شکل‌های گذرای محدود به provider
    مانند `An unknown error occurred` خام از Anthropic، `Provider returned error` خام از OpenRouter،
    خطاهای stop-reason مانند `Unhandled stop reason:
    error`، payloadهای JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`) و خطاهای provider-busy مانند `ModelNotReadyException` را
    وقتی context provider مطابقت داشته باشد، سیگنال‌های timeout/overloaded
    شایسته failover تلقی می‌کند.
    متن عمومی fallback داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه می‌ماند و به‌تنهایی fallback مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='معنای "No credentials found for profile anthropic:default" چیست؟'>
    یعنی سیستم تلاش کرده از شناسه profile احراز هویت `anthropic:default` استفاده کند، اما نتوانسته credentialهای آن را در مخزن auth مورد انتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید profileهای auth کجا قرار دارند** (مسیرهای جدید در برابر legacy)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - legacy: `~/.openclaw/agent/*` (با `openclaw doctor` migrate می‌شود)
    - **تأیید کنید env var شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در shell خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید agent درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چند-agent یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/auth را sanity-check کنید**
      - از `openclaw models status` برای دیدن مدل‌های پیکربندی‌شده و اینکه providerها authenticated هستند یا نه استفاده کنید.

    **چک‌لیست رفع مشکل برای "No credentials found for profile anthropic"**

    این یعنی اجرا به یک profile احراز هویت Anthropic pin شده، اما Gateway
    نمی‌تواند آن را در مخزن auth خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان gateway** قرار دهید.
      - هر ترتیب pin شده‌ای را که profile گم‌شده را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید commandها را روی میزبان gateway اجرا می‌کنید**
      - در حالت remote، profileهای auth روی ماشین gateway قرار دارند، نه laptop شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر config مدل شما Google Gemini را به‌عنوان fallback شامل شود (یا به shorthand مربوط به Gemini تغییر داده باشید)، OpenClaw آن را هنگام fallback مدل امتحان می‌کند. اگر credentialهای Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را می‌بینید.

    رفع مشکل: یا auth Google را فراهم کنید، یا مدل‌های Google را در `agents.defaults.model.fallbacks` / aliasها حذف/اجتناب کنید تا fallback به آنجا route نشود.

    **درخواست LLM رد شد: thinking signature required (Google Antigravity)**

    علت: history نشست شامل **thinking blockهای بدون signature** است (اغلب از
    یک stream لغوشده/جزئی). Google Antigravity برای thinking blockها به signature نیاز دارد.

    رفع مشکل: OpenClaw اکنون thinking blockهای بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر هنوز ظاهر می‌شود، یک **نشست جدید** شروع کنید یا برای آن agent، `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## profileهای auth: چه هستند و چگونه آن‌ها را مدیریت کنید

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (flowهای OAuth، ذخیره‌سازی token، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="profile auth چیست؟">
    profile auth یک رکورد credential نام‌گذاری‌شده (OAuth یا کلید API) است که به یک provider وابسته است. profileها در این مسیر قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی profileهای ذخیره‌شده بدون dump کردن secrets، `openclaw models auth list` را اجرا کنید (اختیاری: `--provider <id>` یا `--json`). برای جزئیات به [Models CLI](/fa/cli/models#auth-profiles) مراجعه کنید.

  </Accordion>

  <Accordion title="شناسه‌های profile معمول چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند provider مانند این‌ها استفاده می‌کند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام profile auth اول امتحان شود؟">
    بله. config از metadata اختیاری برای profileها و یک ترتیب برای هر provider (`auth.order.<provider>`) پشتیبانی می‌کند. این کار secrets را ذخیره نمی‌کند؛ شناسه‌ها را به provider/mode نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است یک profile را اگر در **cooldown** کوتاه (محدودیت نرخ/timeout/خطاهای auth) یا وضعیت **disabled** طولانی‌تر (billing/اعتبار ناکافی) باشد، موقتاً skip کند. برای بررسی این موضوع، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    cooldownهای محدودیت نرخ می‌توانند وابسته به مدل باشند. profileای که برای یک مدل در cooldown است
    همچنان می‌تواند برای مدل هم‌خانواده روی همان provider قابل استفاده باشد،
    در حالی که پنجره‌های billing/disabled همچنان کل profile را مسدود می‌کنند.

    همچنین می‌توانید از طریق CLI یک override ترتیب **برای هر agent** تنظیم کنید (که در `auth-state.json` همان agent ذخیره می‌شود):

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

    برای هدف‌گیری یک agent مشخص:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    برای تأیید اینکه واقعاً چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک profile ذخیره‌شده از ترتیب صریح حذف شده باشد، probe به‌جای اینکه آن را بی‌صدا امتحان کند،
    برای آن profile، `excluded_by_auth_order` را گزارش می‌دهد.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در موارد قابل اعمال).
    - **کلیدهای API** از billing پرداخت به‌ازای توکن استفاده می‌کنند.

    wizard به‌صورت صریح از Anthropic Claude CLI، OpenAI Codex OAuth و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [FAQ](/fa/help/faq) — FAQ اصلی
- [FAQ — شروع سریع و راه‌اندازی اجرای اول](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
