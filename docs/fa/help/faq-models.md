---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی جابه‌جایی اضطراری مدل / «همه مدل‌ها ناموفق بودند»
    - درک پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تعویض، failover، و پروفایل‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-06-28T20:44:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ درباره مدل و نمایه احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌صورت زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `anthropic/claude-sonnet-4-6`). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط بعد از آن به‌عنوان مسیر سازگاری منسوخ‌شده به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد. بااین‌حال همچنان باید `provider/model` را **صریحاً** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعه ارائه‌دهندگان خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی غیرقابل‌اعتماد:** قدرت مدل را بر هزینه مقدم بدانید.
    **برای گفت‌وگوی روزمره/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده سرانگشتی: برای کارهای پرریسک از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی روزمره یا خلاصه‌سازی از مدلی ارزان‌تر. می‌توانید مدل‌ها را به‌ازای هر عامل مسیریابی کنید و برای موازی‌سازی کارهای طولانی از زیرعامل‌ها استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناایمن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چطور بدون پاک‌کردن پیکربندی، مدل‌ها را تغییر دهم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **مدل** را ویرایش کنید. از جایگزینی کامل پیکربندی خودداری کنید.

    گزینه‌های امن:

    - `/model` در گفت‌وگو (سریع، به‌ازای هر نشست)
    - `openclaw models set ...` (فقط پیکربندی مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک شیء جزئی استفاده نکنید، مگر اینکه قصد جایگزینی کل پیکربندی را داشته باشید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحاً از `config.patch` استفاده کنید. محموله lookup مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی طرح‌واره، و خلاصه‌های فرزند بلافصل را در اختیارتان می‌گذارد.
    برای به‌روزرسانی‌های جزئی.
    اگر پیکربندی را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا برای تعمیر دوباره `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [پیکربندی](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

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

    - `Cloud + Local` مدل‌های ابری را همراه با مدل‌های محلی Ollama شما فراهم می‌کند
    - مدل‌های ابری مانند `kimi-k2.5:cloud` به دریافت محلی نیاز ندارند
    - برای تغییر دستی، از `openclaw models list` و `openclaw models set ollama/<model>` استفاده کنید

    نکته امنیتی: مدل‌های کوچک‌تر یا به‌شدت کوانتیزه‌شده در برابر تزریق پرامپت
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، قویاً **مدل‌های بزرگ** را توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، سندباکسینگ و فهرست‌های مجاز سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [سندباکسینگ](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill از چه مدل‌هایی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ هیچ توصیه ثابت ارائه‌دهنده‌ای وجود ندارد.
    - تنظیم فعلی زمان اجرا را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیتی/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چطور مدل‌ها را در لحظه تغییر دهم (بدون راه‌اندازی مجدد)؟">
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

    همچنین می‌توانید یک نمایه احراز هویت مشخص را برای ارائه‌دهنده اجبار کنید (به‌ازای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` در حال استفاده است، و کدام نمایه احراز هویت بعداً امتحان خواهد شد.
    همچنین در صورت وجود، نقطه پایانی ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) را نشان می‌دهد.

    **چطور نمایه‌ای را که با @profile سنجاق کرده‌ام بردارم؟**

    `/model` را دوباره **بدون** پسوند `@profile` اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را بفرستید).
    برای تأیید نمایه احراز هویت فعال، از `/model status` استفاده کنید.

  </Accordion>

  <Accordion title="اگر دو ارائه‌دهنده شناسه مدل یکسانی ارائه کنند، /model از کدام استفاده می‌کند؟">
    `/model provider/model` همان مسیر دقیق ارائه‌دهنده را برای نشست انتخاب می‌کند.

    برای مثال، `qianfan/deepseek-v4-flash` و `deepseek/deepseek-v4-flash` ارجاع‌های مدل متفاوتی هستند، هرچند هر دو شامل `deepseek-v4-flash` هستند. OpenClaw نباید فقط به‌خاطر تطابق شناسه مدل بدون ارائه‌دهنده، بی‌سروصدا از یک ارائه‌دهنده به دیگری تغییر کند.

    ارجاع `/model` انتخاب‌شده توسط کاربر برای سیاست جایگزینی نیز سخت‌گیرانه است. اگر آن ارائه‌دهنده/مدل انتخاب‌شده در دسترس نباشد، پاسخ به‌جای جواب‌دادن از `agents.defaults.model.fallbacks` آشکارا شکست می‌خورد. زنجیره‌های جایگزین پیکربندی‌شده همچنان برای پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کارهای cron، و وضعیت جایگزین انتخاب‌شده خودکار اعمال می‌شوند.

    اگر اجرایی که از یک بازنویسی غیرنشستی شروع شده مجاز به استفاده از جایگزین باشد، OpenClaw ابتدا ارائه‌دهنده/مدل درخواستی را امتحان می‌کند، سپس جایگزین‌های پیکربندی‌شده، و فقط بعد از آن مدل اصلی پیکربندی‌شده را. این کار مانع می‌شود شناسه‌های مدل بدون ارائه‌دهنده تکراری مستقیماً به ارائه‌دهنده پیش‌فرض برگردند.

    [مدل‌ها](/fa/concepts/models) و [جایگزینی مدل هنگام خرابی](/fa/concepts/model-failover) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای روزانه از GPT 5.5 و برای کدنویسی از Codex 5.5 استفاده کنم؟">
    بله. انتخاب مدل و انتخاب زمان اجرا را جداگانه در نظر بگیرید:

    - **عامل کدنویسی بومی Codex:** `agents.defaults.model.primary` را روی `openai/gpt-5.5` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai` وارد شوید.
    - **کارهای مستقیم OpenAI API خارج از حلقه عامل:** برای تصاویر، embeddingها، گفتار، realtime، و دیگر سطوح غیرعاملی OpenAI API، `OPENAI_API_KEY` را پیکربندی کنید.
    - **احراز هویت کلید API عامل OpenAI:** از `/model openai/gpt-5.5` با یک نمایه کلید API مرتب‌شده `openai` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به عاملی متمرکز بر Codex با مدل `openai/gpt-5.5` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چطور حالت سریع را برای GPT 5.5 پیکربندی کنم؟">
    از یک تغییر نشست یا یک پیش‌فرض پیکربندی استفاده کنید:

    - **به‌ازای هر نشست:** وقتی نشست از `openai/gpt-5.5` استفاده می‌کند، `/fast on` را بفرستید.
    - **پیش‌فرض به‌ازای هر مدل:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.
    - **آستانه خودکار:** از `/fast auto` یا `params.fastMode: "auto"` استفاده کنید تا فراخوانی‌های جدید مدل تا رسیدن به آستانه خودکار سریع شروع شوند، سپس فراخوانی‌های بعدی retry، fallback، نتیجه ابزار، یا ادامه بدون حالت سریع شروع شوند. آستانه به‌طور پیش‌فرض ۶۰ ثانیه است؛ برای تغییر آن، `params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.

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

    برای OpenAI، حالت سریع در درخواست‌های بومی Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های `/fast` نشست بر پیش‌فرض‌های پیکربندی اولویت دارند. نوبت‌های app-server مربوط به Codex فقط می‌توانند tier را در شروع نوبت دریافت کنند، بنابراین `auto` به‌جای داخل یک نوبت app-server که از قبل در حال اجراست، روی نوبت مدل بعدی که OpenClaw شروع می‌کند اعمال می‌شود.

    [تفکر و حالت سریع](/fa/tools/thinking) و [حالت سریع OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا «Model ... is not allowed» را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **فهرست مجاز** برای `/model` و هر
    بازنویسی نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    این خطا **به‌جای** یک پاسخ عادی برگردانده می‌شود. راه‌حل: مدل دقیق را به
    `agents.defaults.models` اضافه کنید، برای کاتالوگ‌های پویای ارائه‌دهنده یک wildcard ارائه‌دهنده مانند `"provider/*": {}` اضافه کنید، فهرست مجاز را حذف کنید، یا مدلی از `/model list` انتخاب کنید.
    اگر دستور همچنین شامل `--runtime codex` بود، ابتدا فهرست مجاز را به‌روزرسانی کنید و سپس همان دستور `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا «Unknown model: minimax/MiniMax-M3» را می‌بینم؟'>
    یعنی **ارائه‌دهنده پیکربندی نشده است** (هیچ پیکربندی ارائه‌دهنده MiniMax یا نمایه احراز هویتی
    پیدا نشده)، بنابراین مدل قابل حل‌کردن نیست.

    چک‌لیست رفع مشکل:

    1. به یک نسخه فعلی OpenClaw ارتقا دهید (یا از منبع `main` اجرا کنید)، سپس gateway را راه‌اندازی مجدد کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/نمایه‌های احراز هویت وجود دارد تا ارائه‌دهنده مطابق بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا OAuth ذخیره‌شده MiniMax
       برای `minimax-portal`).
    3. شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) را برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M3`، `minimax/MiniMax-M2.7`، یا
       `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی با کلید API، یا
       `minimax-portal/MiniMax-M3`، `minimax-portal/MiniMax-M2.7`، یا
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا در گفت‌وگو `/model list`).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض و OpenAI را برای کارهای پیچیده استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هر زمان لازم بود مدل‌ها را **به‌ازای هر نشست** تغییر دهید.
    جایگزین‌ها برای **خطاها** هستند، نه «کارهای دشوار»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه A: تغییر به‌ازای هر نشست**

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
    - بر اساس عامل مسیریابی کنید یا برای تغییر از `/agent` استفاده کنید

    اسناد: [مدل‌ها](/fa/concepts/models)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [MiniMax](/fa/providers/minimax)، [OpenAI](/fa/providers/openai).

  </Accordion>

  <Accordion title="آیا opus / sonnet / gpt میان‌برهای داخلی هستند؟">
    بله. OpenClaw چند کوتاه‌نویسی پیش‌فرض ارائه می‌کند (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    اگر نام مستعار خودتان را با همین نام تنظیم کنید، مقدار شما اولویت دارد.

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
          },
        },
      },
    }
    ```

    سپس `/model sonnet` (یا `/<alias>` وقتی پشتیبانی شود) به آن شناسه مدل resolve می‌شود.

  </Accordion>

  <Accordion title="چگونه مدل‌هایی از ارائه‌دهندگان دیگر مثل OpenRouter یا Z.AI اضافه کنم؟">
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

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید لازم آن ارائه‌دهنده وجود نداشته باشد، خطای احراز هویت زمان اجرا دریافت می‌کنید (مثلاً `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، هیچ کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداگانه است و در اینجا ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را در طول راهنما پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌انتقال `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون کپی‌کردن توکن‌های refresh، از عامل پیش‌فرض/اصلی بخواند.

    از `agentDir` مشترک بین عامل‌ها استفاده **نکنید**؛ باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## failover مدل و "All models failed"

<AccordionGroup>
  <Accordion title="failover چگونه کار می‌کند؟">
    failover در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **fallback مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

    Cooldownها روی پروفایل‌های ناموفق اعمال می‌شوند (عقب‌نشینی نمایی)، بنابراین OpenClaw حتی وقتی ارائه‌دهنده rate limit شده یا موقتاً دچار خطاست، می‌تواند همچنان پاسخ دهد.

    سطل rate-limit فقط پاسخ‌های ساده `429` را شامل نمی‌شود. OpenClaw
    پیام‌هایی مثل `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted`، و محدودیت‌های دوره‌ای
    پنجره مصرف (`weekly/monthly limit reached`) را نیز rate limitهایی شایسته failover
    در نظر می‌گیرد.

    برخی پاسخ‌هایی که شبیه خطای صورتحساب هستند `402` نیستند، و برخی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا باقی می‌مانند. اگر ارائه‌دهنده متن صریح مربوط به صورتحساب را
    روی `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را در مسیر صورتحساب نگه دارد،
    اما تطبیق‌دهنده‌های متن مخصوص ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند
    که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). اگر پیام `402`
    در عوض شبیه یک پنجره مصرف قابل تلاش مجدد یا محدودیت هزینه سازمان/فضای کاری باشد
    (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` تلقی می‌کند، نه غیرفعال‌سازی طولانی صورتحساب.

    خطاهای سرریز context متفاوت‌اند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش‌بردن fallback مدل، در مسیر Compaction/تلاش مجدد باقی
    می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد»
    است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده را شایسته failover تلقی می‌کند؛
    مثل Anthropic با متن خام `An unknown error occurred`، OpenRouter با متن خام
    `Provider returned error`، خطاهای stop-reason مانند `Unhandled stop reason:
    error`، payloadهای JSON با `api_error` و متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، و خطاهای مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException`،
    وقتی context ارائه‌دهنده مطابق باشد، به‌عنوان سیگنال‌های timeout/overloaded
    شایسته failover.
    متن fallback داخلی عمومی مانند `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی fallback مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='معنای "No credentials found for profile anthropic:default" چیست؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا قرار دارند** (مسیرهای جدید در برابر legacy)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - legacy: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری می‌شود**
      - اگر `ANTHROPIC_API_KEY` را در shell خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - چیدمان‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را sanity-check کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت ارائه‌دهندگان را ببینید.

    **چک‌لیست رفع مشکل برای "No credentials found for profile anthropic"**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic pin شده، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خود پیدا کند.

    - **از Claude CLI استفاده کنید**
      - روی میزبان gateway، `openclaw models auth login --provider anthropic --method cli --set-default` را اجرا کنید.
    - **اگر می‌خواهید به‌جای آن از کلید API استفاده کنید**
      - `ANTHROPIC_API_KEY` را در `~/.openclaw/.env` روی **میزبان gateway** قرار دهید.
      - هر ترتیب pin شده‌ای را که یک پروفایل گمشده را اجباری می‌کند پاک کنید:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأیید کنید فرمان‌ها را روی میزبان gateway اجرا می‌کنید**
      - در حالت remote، پروفایل‌های احراز هویت روی ماشین gateway قرار دارند، نه لپ‌تاپ شما.

  </Accordion>

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان fallback شامل شود (یا به یک کوتاه‌نویسی Gemini تغییر داده باشید)، OpenClaw در طول fallback مدل آن را امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را می‌بینید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف/اجتناب کنید تا fallback به آنجا مسیریابی نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک stream لغوشده/جزئی). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر شد، یک **نشست جدید** شروع کنید یا برای آن عامل `/thinking off` را تنظیم کنید.

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

    برای بررسی پروفایل‌های ذخیره‌شده بدون چاپ اسرار، `openclaw models auth list` را اجرا کنید (به‌صورت اختیاری با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های معمول پروفایل چه هستند؟">
    OpenClaw از شناسه‌های دارای پیشوند ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت ابتدا امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و یک ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این **اسرار** را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است یک پروفایل را موقتاً رد کند اگر در **cooldown** کوتاه باشد (rate limitها/timeoutها/خطاهای احراز هویت) یا در وضعیت **disabled** طولانی‌تر باشد (صورتحساب/اعتبار ناکافی). برای بررسی این مورد، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیم: `auth.cooldowns.billingBackoffHours*`.

    Cooldownهای rate-limit می‌توانند محدود به مدل باشند. پروفایلی که برای یک مدل
    در حال cooldown است، همچنان می‌تواند برای مدل هم‌خانواده‌ای روی همان ارائه‌دهنده
    قابل استفاده باشد، در حالی که پنجره‌های صورتحساب/disabled همچنان کل پروفایل را مسدود می‌کنند.

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

    برای هدف‌گرفتن یک عامل مشخص:

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

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth / ورود CLI** اغلب در جایی که ارائه‌دهنده پشتیبانی کند از دسترسی اشتراکی
      بهره می‌برد. برای Anthropic، backend مربوط به Claude CLI در OpenClaw از
      Claude Code `claude -p` استفاده می‌کند؛ Anthropic در حال حاضر این را به‌عنوان
      استفاده Agent SDK/برنامه‌نویسی تلقی می‌کند. Anthropic تغییر جداگانه اعتبار
      Agent SDK در ۱۵ ژوئن ۲۰۲۶ را متوقف کرد، بنابراین فعلاً این همچنان از محدودیت‌های
      مصرف اشتراک برداشت می‌کند. برای اطلاعیه توقف فعلی، مقاله
      [طرح Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      Anthropic را ببینید.
    - **کلیدهای API** از صورتحساب پرداخت به‌ازای هر توکن استفاده می‌کنند.

    راهنما به‌طور صریح از Anthropic Claude CLI، OpenAI Codex OAuth، و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جابه‌جایی خودکار مدل هنگام خرابی](/fa/concepts/model-failover)
