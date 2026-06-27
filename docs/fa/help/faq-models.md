---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - عیب‌یابی جابه‌جایی پس از خرابی مدل / «همهٔ مدل‌ها ناموفق بودند»
    - شناخت پروفایل‌های احراز هویت و نحوهٔ مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تغییر مدل، failover، و پروفایل‌های احراز هویت'
title: 'سؤالات متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-06-27T17:53:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها با قالب `provider/model` ارجاع داده می‌شوند؛ برای مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`. اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را بررسی می‌کند، و فقط بعد از آن، به‌عنوان مسیر سازگاری منسوخ، به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نشان‌دادن پیش‌فرض قدیمیِ ارائه‌دهنده حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. با این حال باید `provider/model` را **صریحاً** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدیدی استفاده کنید که در پشته ارائه‌دهنده شما در دسترس است.
    **برای عامل‌های دارای ابزار یا ورودی‌های غیرقابل‌اعتماد:** قدرت مدل را بر هزینه مقدم بدانید.
    **برای گفت‌وگوی معمولی/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و مسیریابی را بر اساس نقش عامل انجام دهید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده سرانگشتی: برای کارهای پرریسک از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی معمولی یا خلاصه‌سازی از مدلی ارزان‌تر. می‌توانید مدل‌ها را برای هر عامل جداگانه مسیریابی کنید و از زیرعامل‌ها برای
    موازی‌سازی کارهای طولانی استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چگونه بدون پاک‌کردن پیکربندی، مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی پرهیز کنید.

    گزینه‌های امن:

    - `/model` در چت (سریع، برای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی پرهیز کنید، مگر اینکه قصد داشته باشید کل پیکربندی را جایگزین کنید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحاً از `config.patch` استفاده کنید. بار lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی طرح‌واره، و خلاصه‌های فرزند بلافاصله را به شما می‌دهد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا دوباره `openclaw doctor` را اجرا کنید تا تعمیر شود.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [پیکربندی](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان‌شده استفاده کنم (llama.cpp، vLLM، Ollama)؟">
    بله. Ollama ساده‌ترین مسیر برای مدل‌های محلی است.

    سریع‌ترین راه‌اندازی:

    1. Ollama را از `https://ollama.com/download` نصب کنید
    2. یک مدل محلی مانند `ollama pull gemma4` دریافت کنید
    3. اگر مدل‌های ابری هم می‌خواهید، `ollama signin` را اجرا کنید
    4. `openclaw onboard` را اجرا کنید و `Ollama` را انتخاب کنید
    5. `Local` یا `Cloud + Local` را انتخاب کنید

    نکته‌ها:

    - `Cloud + Local` مدل‌های ابری را همراه با مدل‌های محلی Ollama شما می‌دهد
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای جابه‌جایی دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، **مدل‌های بزرگ** را قویاً توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، سندباکسینگ و allowlistهای سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [سندباکسینگ](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill از چه مدل‌هایی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ هیچ توصیه ثابت برای ارائه‌دهنده وجود ندارد.
    - تنظیم فعلی زمان اجرا را روی هر Gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیتی/دارای ابزار، از قوی‌ترین مدل نسل جدیدِ در دسترس استفاده کنید.

  </Accordion>

  <Accordion title="چگونه مدل‌ها را در لحظه عوض کنم (بدون راه‌اندازی مجدد)؟">
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

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` استفاده می‌شود، و کدام پروفایل احراز هویت بعداً امتحان خواهد شد.
    همچنین در صورت موجود بودن، endpoint ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چگونه پروفایلی را که با @profile سنجاق کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    برای تأیید اینکه کدام پروفایل احراز هویت فعال است، از `/model status` استفاده کنید.

  </Accordion>

  <Accordion title="اگر دو ارائه‌دهنده شناسه مدل یکسانی را ارائه کنند، /model از کدام‌یک استفاده می‌کند؟">
    `/model provider/model` همان مسیر دقیق ارائه‌دهنده را برای نشست انتخاب می‌کند.

    برای مثال، `qianfan/deepseek-v4-flash` و `deepseek/deepseek-v4-flash` با اینکه هر دو شامل `deepseek-v4-flash` هستند، ارجاع‌های مدل متفاوتی‌اند. OpenClaw نباید فقط به‌دلیل تطابق شناسه خام مدل، بی‌صدا از یک ارائه‌دهنده به ارائه‌دهنده دیگر جابه‌جا شود.

    ارجاع `/model` انتخاب‌شده توسط کاربر برای سیاست جایگزینی نیز سخت‌گیرانه است. اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای اینکه از `agents.defaults.model.fallbacks` داده شود، به‌صورت آشکار شکست می‌خورد. زنجیره‌های جایگزین پیکربندی‌شده همچنان برای پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کارهای cron، و وضعیت جایگزینِ انتخاب‌شده خودکار اعمال می‌شوند.

    اگر اجرایی که از یک override غیرنشستی شروع شده مجاز باشد از جایگزین استفاده کند، OpenClaw ابتدا ارائه‌دهنده/مدل درخواستی را امتحان می‌کند، سپس جایگزین‌های پیکربندی‌شده، و فقط بعد از آن مدل اصلی پیکربندی‌شده را. این کار مانع می‌شود شناسه‌های خام تکراری مدل مستقیماً به ارائه‌دهنده پیش‌فرض برگردند.

    [مدل‌ها](/fa/concepts/models) و [failover مدل](/fa/concepts/model-failover) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم از GPT 5.5 برای کارهای روزانه و از Codex 5.5 برای کدنویسی استفاده کنم؟">
    بله. انتخاب مدل و انتخاب زمان اجرا را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai` وارد شوید.
    - **کارهای مستقیم OpenAI API خارج از حلقه عامل:** `OPENAI_API_KEY` را برای تصویرها، embeddings، گفتار، realtime، و دیگر سطوح غیرعاملی OpenAI API پیکربندی کنید.
    - **احراز هویت با کلید API برای عامل OpenAI:** از `/model openai/gpt-5.5` همراه با یک پروفایل کلید API مرتب‌شده `openai` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به عاملی متمرکز بر Codex با مدل `openai/gpt-5.5` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چگونه حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک toggle نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **برای هر نشست:** وقتی نشست از `openai/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض برای هر مدل:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.
    - **cutoff خودکار:** از `/fast auto` یا `params.fastMode: "auto"` استفاده کنید تا فراخوانی‌های جدید مدل تا cutoff خودکار سریع شروع شوند، سپس فراخوانی‌های retry، جایگزین، نتیجه ابزار، یا continuation بعدی بدون حالت سریع شروع شوند. مقدار پیش‌فرض cutoff برابر ۶۰ ثانیه است؛ برای تغییر آن، `params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.

    مثال:

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

    برای OpenAI، حالت سریع در درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. overrideهای `/fast` نشست بر پیش‌فرض‌های پیکربندی مقدم‌اند. نوبت‌های app-server در Codex فقط می‌توانند tier را در آغاز نوبت دریافت کنند، بنابراین `auto` به‌جای داخل یک نوبت app-server که از قبل در حال اجراست، روی نوبت مدل بعدی که OpenClaw شروع می‌کند اعمال می‌شود.

    [تفکر و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا «Model ... is not allowed» را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **allowlist** برای `/model` و هر
    override نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    این خطا **به‌جای** پاسخ عادی برگردانده می‌شود. راه‌حل: مدل دقیق را به
    `agents.defaults.models` اضافه کنید، برای کاتالوگ‌های پویای ارائه‌دهنده یک wildcard ارائه‌دهنده مانند `"provider/*": {}` اضافه کنید، allowlist را بردارید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور همچنین شامل `--runtime codex` بود، ابتدا allowlist را به‌روزرسانی کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا «Unknown model: minimax/MiniMax-M3» را می‌بینم؟'>
    یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا پروفایل احراز هویت
    پیدا نشده)، بنابراین مدل قابل حل نیست.

    چک‌لیست رفع مشکل:

    1. به یک نسخه فعلی OpenClaw ارتقا دهید (یا از سورس `main` اجرا کنید)، سپس Gateway را راه‌اندازی مجدد کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/پروفایل‌های احراز هویت وجود دارد تا ارائه‌دهنده مطابق بتواند inject شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شده MiniMax
       برای `minimax-portal`).
    3. از شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M3`، `minimax/MiniMax-M2.7`، یا
       `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی با کلید API، یا
       `minimax-portal/MiniMax-M3`، `minimax-portal/MiniMax-M2.7`، یا
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا در چت `/model list` را بزنید).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را به‌عنوان پیش‌فرض و OpenAI را برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هر زمان لازم بود مدل‌ها را **برای هر نشست** عوض کنید.
    fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه A: جابه‌جایی برای هر نشست**

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
    بله. OpenClaw چند نام کوتاه پیش‌فرض ارائه می‌کند (فقط زمانی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    اگر نام مستعار خودتان را با همان نام تنظیم کنید، مقدار شما اولویت دارد.

  </Accordion>

  <Accordion title="چطور میان‌برهای مدل (نام‌های مستعار) را تعریف/بازنویسی کنم؟">
    نام‌های مستعار از `agents.defaults.models.<modelId>.alias` می‌آیند. مثال:

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

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به آن شناسه مدل نگاشت می‌شود.

  </Accordion>

  <Accordion title="چطور مدل‌هایی از ارائه‌دهندگان دیگر مانند OpenRouter یا Z.AI اضافه کنم؟">
    OpenRouter (پرداخت به‌ازای توکن؛ مدل‌های بسیار):

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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید ارائه‌دهنده موردنیاز وجود نداشته باشد، خطای احراز هویت زمان اجرا دریافت می‌کنید (برای مثال `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولا یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در اینجا ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول ویزارد پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی توکن‌های نوسازی، از عامل پیش‌فرض/اصلی بخواند.

    از `agentDir` مشترک بین عامل‌ها استفاده نکنید؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جایگزینی مدل هنگام خطا و «همه مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="جایگزینی هنگام خطا چطور کار می‌کند؟">
    جایگزینی هنگام خطا در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **بازگشت مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های خنک‌سازی روی پروفایل‌های ناموفق اعمال می‌شوند (پس‌روی نمایی)، بنابراین OpenClaw حتی وقتی یک ارائه‌دهنده محدودیت نرخ دارد یا موقتا دچار خطاست، می‌تواند به پاسخ‌دادن ادامه دهد.

    سطل محدودیت نرخ فقط شامل پاسخ‌های ساده `429` نیست. OpenClaw
    همچنین پیام‌هایی مانند `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted` و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را محدودیت نرخ شایسته جایگزینی
    در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه صورتحساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    هم در همان سطل گذرا می‌مانند. اگر یک ارائه‌دهنده متن صریح مربوط به صورتحساب را روی `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را در
    مسیر صورتحساب نگه دارد، اما تطبیق‌دهنده‌های متن ویژه ارائه‌دهنده محدود به
    همان ارائه‌دهنده مالک خود می‌مانند (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه پنجره مصرف قابل‌تلاش‌مجدد یا محدودیت هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را به‌عنوان
    `rate_limit` در نظر می‌گیرد، نه غیرفعال‌سازی بلندمدت صورتحساب.

    خطاهای سرریز زمینه متفاوت‌اند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model` یا `ollama error: context length
    exceeded` به‌جای پیش‌بردن بازگشت مدل، در مسیر Compaction/تلاش مجدد می‌مانند.

    متن عمومی خطای سرور عمدا محدودتر از «هر چیزی که unknown/error در آن باشد»
    است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده را شایسته جایگزینی
    در نظر می‌گیرد، مانند `An unknown error occurred` خام Anthropic، `Provider returned error` خام OpenRouter،
    خطاهای دلیل توقف مانند `Unhandled stop reason:
    error`، بارهای JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`) و خطاهای شلوغی ارائه‌دهنده مانند `ModelNotReadyException`، آن هم
    وقتی زمینه ارائه‌دهنده منطبق باشد، به‌عنوان سیگنال‌های مهلت‌پایان/بارزیاد.
    متن عمومی بازگشت داخلی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه می‌ماند و به‌تنهایی بازگشت مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌ای برای آن در مخزن احراز هویت مورد انتظار پیدا کند.

    **فهرست بررسی رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در شل خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - چیدمان‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را سریع بررسی کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و وضعیت احراز هویت ارائه‌دهندگان را ببینید.

    **فهرست بررسی رفع مشکل برای «No credentials found for profile anthropic»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان Gateway دستور `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان Gateway** قرار دهید.
      - هر ترتیب سنجاق‌شده‌ای را که یک پروفایل گم‌شده را اجبار می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان Gateway اجرا می‌کنید**
      - در حالت راه دور، پروفایل‌های احراز هویت روی دستگاه Gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان بازگشت شامل کند (یا به یک نام کوتاه Gemini تغییر داده باشید)، OpenClaw آن را هنگام بازگشت مدل امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را می‌بینید.

    رفع مشکل: یا احراز هویت Google را ارائه کنید، یا مدل‌های Google را در `agents.defaults.model.fallbacks` / نام‌های مستعار حذف/اجتناب کنید تا بازگشت به آنجا مسیریابی نشود.

    **درخواست LLM رد شد: امضای تفکر لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های تفکر بدون امضا** است (اغلب از
    یک جریان لغوشده/جزئی). Google Antigravity برای بلوک‌های تفکر به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های تفکر بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر شد، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چه هستند و چطور مدیریتشان کنیم

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌دار (OAuth یا کلید API) است که به یک ارائه‌دهنده متصل است. پروفایل‌ها در اینجا قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون نمایش اسرار، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های رایج پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (رایج وقتی هویت ایمیلی وجود ندارد)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که خودتان انتخاب می‌کنید (برای مثال `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و یک ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این کار اسرار را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تعیین می‌کند.

    اگر یک پروفایل در **دوره خنک‌سازی** کوتاه (محدودیت نرخ/مهلت‌پایان/خطاهای احراز هویت) یا وضعیت **غیرفعال** بلندتر (صورتحساب/اعتبار ناکافی) باشد، OpenClaw ممکن است موقتا از آن صرف‌نظر کند. برای بررسی این وضعیت، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های خنک‌سازی محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که
    برای یک مدل در حال خنک‌سازی است همچنان می‌تواند برای یک مدل هم‌خانواده در همان ارائه‌دهنده قابل استفاده باشد،
    در حالی که پنجره‌های صورتحساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید از طریق CLI یک بازنویسی ترتیب **برای هر عامل** تنظیم کنید (ذخیره‌شده در `auth-state.json` همان عامل):

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

    برای تأیید اینکه واقعا چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شده باشد، probe به‌جای امتحان بی‌صدای آن،
    برای آن پروفایل `excluded_by_auth_order` را گزارش می‌کند.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth / ورود CLI** اغلب در جایی که ارائه‌دهنده پشتیبانی کند از دسترسی اشتراکی استفاده می‌کند. برای Anthropic، backend Claude CLI در OpenClaw از
      Claude Code `claude -p` استفاده می‌کند؛ Anthropic در حال حاضر آن را استفاده Agent
      SDK/برنامه‌ای در نظر می‌گیرد، با اعتبار ماهانه جداگانه Agent SDK که از
      15 ژوئن 2026 شروع می‌شود.
    - **کلیدهای API** از صورتحساب پرداخت به‌ازای توکن استفاده می‌کنند.

    ویزارد به‌طور صریح از Anthropic Claude CLI، OAuth مربوط به OpenAI Codex و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اولین اجرا](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جایگزینی مدل هنگام خطا](/fa/concepts/model-failover)
