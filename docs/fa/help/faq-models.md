---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از انتقال خودکار مدل هنگام خرابی / «همهٔ مدل‌ها شکست خوردند»
    - آشنایی با نمایه‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تغییر، جایگزینی هنگام خرابی، و نمایه‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-10T19:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر دادن

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن به‌عنوان مسیر سازگاری منسوخ، به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. بااین‌حال همچنان باید `provider/model` را **صریحاً** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعه ارائه‌دهندگان خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را به هزینه اولویت دهید.
    **برای گفت‌وگوی روتین/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و براساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده کلی: برای کارهای پرریسک از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی روتین یا خلاصه‌ها از یک
    مدل ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل مسیریابی کنید و از زیرعامل‌ها برای
    موازی‌سازی کارهای طولانی استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چگونه بدون پاک کردن پیکربندی، مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **model** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در گفت‌وگو (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحاً از `config.patch` استفاده کنید. محموله lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزند مستقیم را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا دوباره `openclaw doctor` را برای تعمیر اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان‌شده (llama.cpp, vLLM, Ollama) استفاده کنم؟">
    بله. Ollama ساده‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` را دریافت کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` به شما مدل‌های ابری به‌همراه مدل‌های محلی Ollama را می‌دهد
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای تغییر دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، قویاً **مدل‌های بزرگ** را توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، سندباکسینگ و allowlistهای سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [سندباکسینگ](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill از چه مدل‌هایی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ توصیه ثابتی برای ارائه‌دهنده وجود ندارد.
    - تنظیم زمان اجرای فعلی را در هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیت/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه تغییر دهم (بدون راه‌اندازی مجدد)؟">
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

    این‌ها نام‌های مستعار داخلی هستند. نام‌های مستعار سفارشی را می‌توان از طریق `agents.defaults.models` افزود.

    می‌توانید مدل‌های موجود را با `/model`، `/model list` یا `/model status` فهرست کنید.

    `/model` (و `/model list`) یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهد. براساس شماره انتخاب کنید:

    ```
    /model 3
    ```

    همچنین می‌توانید یک پروفایل احراز هویت مشخص را برای ارائه‌دهنده اجبار کنید (برای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` در حال استفاده است، و کدام پروفایل احراز هویت بعداً امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چگونه پروفایلی را که با @profile ثابت کرده‌ام بردارم؟**

    دوباره `/model` را **بدون** پسوند `@profile` اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    برای تأیید پروفایل احراز هویت فعال، از `/model status` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای روزانه از GPT 5.5 و برای کدنویسی از Codex 5.5 استفاده کنم؟">
    بله. انتخاب مدل و انتخاب زمان اجرا را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** مقدار `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API خارج از حلقه عامل:** برای تصاویر، embeddings، گفتار، realtime، و سایر سطح‌های OpenAI API غیرعاملی، `OPENAI_API_KEY` را پیکربندی کنید.
    - **احراز هویت کلید API عامل OpenAI:** از `/model openai/gpt-5.5` با یک پروفایل کلید API مرتب‌شده `openai-codex` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به عاملی متمرکز بر Codex با مدل `openai/gpt-5.5` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک toggle نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** زمانی که نشست از `openai/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** مقدار `agents.defaults.models["openai/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.

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

    برای OpenAI، حالت سریع در درخواست‌های Responses بومی پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. overrideهای `/fast` نشست بر پیش‌فرض‌های پیکربندی غلبه می‌کنند.

    [Thinking و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **allowlist** برای `/model` و هر
    override نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست، این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    آن خطا **به‌جای** پاسخ عادی برگردانده می‌شود. راه‌حل: مدل دقیق را به
    `agents.defaults.models` اضافه کنید، برای کاتالوگ‌های پویای ارائه‌دهنده یک wildcard ارائه‌دهنده مانند `"provider/*": {}` اضافه کنید، allowlist را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور همچنین شامل `--runtime codex` بود، ابتدا allowlist را به‌روزرسانی کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    این یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا پروفایل احراز هویت
    پیدا نشده)، بنابراین مدل قابل resolve نیست.

    فهرست بررسی رفع مشکل:

    1. به یک نسخه فعلی OpenClaw ارتقا دهید (یا از source `main` اجرا کنید)، سپس gateway را راه‌اندازی مجدد کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا اینکه احراز هویت MiniMax
       در env/پروفایل‌های احراز هویت وجود دارد تا ارائه‌دهنده متناظر بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شده MiniMax
       برای `minimax-portal`).
    3. شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) را برای مسیر احراز هویت خود استفاده کنید:
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

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض خودم قرار دهم و از OpenAI برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هنگام نیاز مدل‌ها را **برای هر نشست** تغییر دهید.
    fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

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
    - براساس عامل مسیریابی کنید یا از `/agent` برای تغییر استفاده کنید

    مستندات: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میانبرهای داخلی هستند؟">
    بله. OpenClaw چند shorthand پیش‌فرض همراه دارد (فقط زمانی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    اگر نام مستعار خودتان را با همان نام تنظیم کنید، مقدار شما اولویت دارد.

  </Accordion>

  <Accordion title="چگونه میانبرهای مدل (نام‌های مستعار) را تعریف/override کنم؟">
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
    OpenRouter (پرداخت به‌ازای هر توکن؛ مدل‌های متعدد):

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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید لازم ارائه‌دهنده موجود نباشد، خطای احراز هویت زمان اجرا دریافت می‌کنید (برای مثال `No API key found for provider "zai"`).

    **پس از افزودن یک عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در اینجا ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و در طول جادوگر احراز هویت را پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون کلون‌کردن توکن‌های نوسازی، از عامل پیش‌فرض/اصلی بخواند.

    از `agentDir` مشترک بین عامل‌ها استفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جایگزینی مدل هنگام شکست و «همه مدل‌ها شکست خوردند»

<AccordionGroup>
  <Accordion title="جایگزینی هنگام شکست چگونه کار می‌کند؟">
    جایگزینی هنگام شکست در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **مدل جایگزین** به مدل بعدی در `agents.defaults.model.fallbacks`.

    زمان‌های خنک‌سازی روی پروفایل‌های شکست‌خورده اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw می‌تواند حتی وقتی یک ارائه‌دهنده با محدودیت نرخ روبه‌رو است یا موقتاً شکست می‌خورد، همچنان پاسخ دهد.

    سطل محدودیت نرخ بیش از پاسخ‌های ساده `429` را شامل می‌شود. OpenClaw
    پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted` و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را نیز محدودیت نرخ
    شایسته جایگزینی هنگام شکست در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه صورت‌حساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا می‌مانند. اگر یک ارائه‌دهنده متن صریح مربوط به صورت‌حساب را روی `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را در
    مسیر صورت‌حساب نگه دارد، اما تطبیق‌دهنده‌های متن ویژه ارائه‌دهنده در محدوده همان
    ارائه‌دهنده‌ای می‌مانند که مالکشان است (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجره مصرف قابل تلاش دوباره یا
    محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی مربوط به صورت‌حساب.

    خطاهای سرریز زمینه متفاوت هستند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیشروی به مدل جایگزین، در مسیر Compaction/تلاش دوباره
    باقی می‌مانند.

    متن خطای عمومی سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد»
    است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده مانند
    `An unknown error occurred` خام Anthropic، `Provider returned error` خام
    OpenRouter، خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، بارهای JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`) و خطاهای مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` را
    زمانی که زمینه ارائه‌دهنده مطابق باشد، سیگنال‌های timeout/بار بیش از حد
    شایسته جایگزینی هنگام شکست در نظر می‌گیرد.
    متن عمومی جایگزینی داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی باعث مدل جایگزین نمی‌شود.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **فهرست بررسی رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در پوسته خود تنظیم کنید اما Gateway را از طریق systemd/launchd اجرا کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را بررسی اولیه کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و اینکه ارائه‌دهندگان احراز هویت شده‌اند یا نه را ببینید.

    **فهرست بررسی رفع مشکل برای «No credentials found for profile anthropic»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده است، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان Gateway دستور `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از یک کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان Gateway** قرار دهید.
      - هر ترتیب سنجاق‌شده‌ای را که یک پروفایل گم‌شده را اجباری می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان Gateway اجرا می‌کنید**
      - در حالت راه‌دور، پروفایل‌های احراز هویت روی دستگاه Gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین شامل کند (یا به یک کوتاه‌نویسی Gemini جابه‌جا شده باشید)، OpenClaw آن را در زمان جایگزینی مدل امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را خواهید دید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف کنید/اجتناب کنید تا جایگزینی به آنجا مسیریابی نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک جریان لغوشده/جزئی). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر شد، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چه هستند و چگونه مدیریتشان کنیم

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده وابسته است. پروفایل‌ها در اینجا قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون نمایش اسرار، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل چه هستند؟">
    OpenClaw از شناسه‌های پیشونددار با ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (برای مثال `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و یک ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این **اسرار را ذخیره نمی‌کند**؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است یک پروفایل را اگر در **خنک‌سازی** کوتاه باشد (محدودیت نرخ/timeout/شکست احراز هویت) یا در وضعیت طولانی‌تر **غیرفعال** باشد (صورت‌حساب/اعتبار ناکافی)، موقتاً رد کند. برای بررسی این مورد، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    خنک‌سازی‌های محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که برای یک مدل در حال خنک‌شدن
    است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد،
    در حالی که پنجره‌های صورت‌حساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید یک بازنویسی ترتیب **برای هر عامل** (ذخیره‌شده در `auth-state.json` همان عامل) را از طریق CLI تنظیم کنید:

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

    برای هدف‌گرفتن یک عامل خاص:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    برای راستی‌آزمایی اینکه واقعاً چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe به‌جای اینکه بی‌صدا
    آن را امتحان کند، برای آن پروفایل `excluded_by_auth_order` گزارش می‌دهد.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی بهره می‌گیرد (در موارد قابل اعمال).
    - **کلیدهای API** از صورت‌حساب پرداخت به‌ازای توکن استفاده می‌کنند.

    جادوگر به‌طور صریح از Anthropic Claude CLI، OpenAI Codex OAuth و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اولین اجرا](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جایگزینی مدل هنگام شکست](/fa/concepts/model-failover)
