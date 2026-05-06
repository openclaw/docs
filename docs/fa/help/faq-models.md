---
read_when:
    - انتخاب یا تغییر مدل‌ها، پیکربندی نام‌های مستعار
    - اشکال‌زدایی از جایگزینی هنگام خرابی مدل / "همهٔ مدل‌ها ناموفق بودند"
    - درک پروفایل‌های احراز هویت و نحوه مدیریت آن‌ها
sidebarTitle: Models FAQ
summary: 'پرسش‌های متداول: پیش‌فرض‌های مدل، انتخاب، نام‌های مستعار، تعویض، جابه‌جایی هنگام خرابی، و نمایه‌های احراز هویت'
title: 'پرسش‌های متداول: مدل‌ها و احراز هویت'
x-i18n:
    generated_at: "2026-05-06T09:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  پرسش‌وپاسخ درباره مدل و پروفایل احراز هویت. برای راه‌اندازی، نشست‌ها، Gateway، کانال‌ها و
  عیب‌یابی، FAQ اصلی را ببینید: [FAQ](/fa/help/faq).

  ## مدل‌ها: پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تغییر مدل

  <AccordionGroup>
  <Accordion title='«مدل پیش‌فرض» چیست؟'>
    مدل پیش‌فرض OpenClaw همان چیزی است که به‌عنوان مقدار زیر تنظیم می‌کنید:

    ```
    agents.defaults.model.primary
    ```

    مدل‌ها به‌صورت `provider/model` ارجاع داده می‌شوند (مثال: `openai/gpt-5.5` یا `openai-codex/gpt-5.5`). اگر provider را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطبیق یکتای provider پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط بعد از آن به‌عنوان مسیر سازگاری منسوخ‌شده به provider پیش‌فرض پیکربندی‌شده برمی‌گردد. اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض stale از provider حذف‌شده، به اولین provider/model پیکربندی‌شده برمی‌گردد. با این حال همچنان باید `provider/model` را **صریح** تنظیم کنید.

  </Accordion>

  <Accordion title="چه مدلی را پیشنهاد می‌کنید؟">
    **پیش‌فرض پیشنهادی:** از قوی‌ترین مدل نسل جدید موجود در مجموعه provider خود استفاده کنید.
    **برای عامل‌های دارای ابزار یا ورودی نامطمئن:** قدرت مدل را بر هزینه اولویت دهید.
    **برای گفت‌وگوی روزمره/کم‌ریسک:** از مدل‌های جایگزین ارزان‌تر استفاده کنید و بر اساس نقش عامل مسیریابی کنید.

    MiniMax مستندات خودش را دارد: [MiniMax](/fa/providers/minimax) و
    [مدل‌های محلی](/fa/gateway/local-models).

    قاعده سرانگشتی: برای کارهای پرریسک از **بهترین مدلی که توان پرداختش را دارید** استفاده کنید، و برای گفت‌وگوی روزمره یا خلاصه‌سازی از مدلی ارزان‌تر. می‌توانید مدل‌ها را به‌ازای هر عامل مسیریابی کنید و برای موازی‌سازی کارهای طولانی از زیرعامل‌ها استفاده کنید (هر زیرعامل توکن مصرف می‌کند). [مدل‌ها](/fa/concepts/models) و
    [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

    هشدار جدی: مدل‌های ضعیف‌تر/بیش‌ازحد کوانتیزه‌شده در برابر تزریق پرامپت
    و رفتار ناامن آسیب‌پذیرترند. [امنیت](/fa/gateway/security) را ببینید.

    زمینه بیشتر: [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="چطور بدون پاک کردن config مدل‌ها را عوض کنم؟">
    از **دستورهای مدل** استفاده کنید یا فقط فیلدهای **model** را ویرایش کنید. از جایگزینی کامل config پرهیز کنید.

    گزینه‌های امن:

    - `/model` در چت (سریع، به‌ازای هر نشست)
    - `openclaw models set ...` (فقط config مدل را به‌روزرسانی می‌کند)
    - `openclaw configure --section model` (تعاملی)
    - ویرایش `agents.defaults.model` در `~/.openclaw/openclaw.json`

    از `config.apply` با یک آبجکت جزئی پرهیز کنید، مگر اینکه قصد جایگزینی کل config را داشته باشید.
    برای ویرایش‌های RPC، ابتدا با `config.schema.lookup` بررسی کنید و ترجیحا از `config.patch` استفاده کنید. payload جست‌وجو مسیر نرمال‌شده، مستندات/محدودیت‌های سطحی schema، و خلاصه‌های فرزندهای بلافصل را در اختیارتان می‌گذارد.
    برای به‌روزرسانی‌های جزئی.
    اگر config را بازنویسی کردید، از نسخه پشتیبان بازیابی کنید یا برای تعمیر دوباره `openclaw doctor` را اجرا کنید.

    مستندات: [مدل‌ها](/fa/concepts/models)، [پیکربندی](/fa/cli/configure)، [Config](/fa/cli/config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های خودمیزبان (llama.cpp، vLLM، Ollama) استفاده کنم؟">
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
    آسیب‌پذیرترند. برای هر رباتی که می‌تواند از ابزارها استفاده کند، **مدل‌های بزرگ** را اکیدا توصیه می‌کنیم.
    اگر همچنان مدل‌های کوچک می‌خواهید، sandboxing و فهرست‌های مجاز سخت‌گیرانه ابزار را فعال کنید.

    مستندات: [Ollama](/fa/providers/ollama)، [مدل‌های محلی](/fa/gateway/local-models)،
    [providerهای مدل](/fa/concepts/model-providers)، [امنیت](/fa/gateway/security)،
    [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw، Flawd و Krill برای مدل‌ها از چه چیزی استفاده می‌کنند؟">
    - این استقرارها می‌توانند متفاوت باشند و ممکن است در طول زمان تغییر کنند؛ توصیه ثابتی برای provider وجود ندارد.
    - تنظیم runtime فعلی را روی هر gateway با `openclaw models status` بررسی کنید.
    - برای عامل‌های حساس از نظر امنیتی/دارای ابزار، از قوی‌ترین مدل نسل جدید موجود استفاده کنید.

  </Accordion>

  <Accordion title="چطور مدل‌ها را در لحظه تغییر بدهم (بدون restart)؟">
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

    همچنین می‌توانید یک پروفایل احراز هویت خاص را برای provider اجباری کنید (به‌ازای هر نشست):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نکته: `/model status` نشان می‌دهد کدام عامل فعال است، کدام فایل `auth-profiles.json` در حال استفاده است، و کدام پروفایل احراز هویت بعدی امتحان خواهد شد.
    همچنین endpoint پیکربندی‌شده provider (`baseUrl`) و حالت API (`api`) را در صورت وجود نشان می‌دهد.

    **چطور پروفایلی را که با @profile ثابت کرده‌ام بردارم؟**

    `/model` را **بدون** پسوند `@profile` دوباره اجرا کنید:

    ```
    /model anthropic/claude-opus-4-6
    ```

    اگر می‌خواهید به پیش‌فرض برگردید، آن را از `/model` انتخاب کنید (یا `/model <default provider/model>` را ارسال کنید).
    برای تأیید پروفایل احراز هویت فعال، از `/model status` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای روزانه از GPT 5.5 و برای کدنویسی از Codex 5.5 استفاده کنم؟">
    بله. انتخاب مدل و انتخاب runtime را جداگانه در نظر بگیرید:

    - **عامل کدنویسی Native Codex:** مقدار `agents.defaults.model.primary` را روی `openai/gpt-5.5` و مقدار `agents.defaults.agentRuntime.id` را روی `"codex"` تنظیم کنید. وقتی احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با `openclaw models auth login --provider openai-codex` وارد شوید.
    - **کارهای مستقیم OpenAI API از طریق PI:** از `/model openai/gpt-5.5` بدون بازنویسی runtime مربوط به Codex استفاده کنید و `OPENAI_API_KEY` را پیکربندی کنید.
    - **Codex OAuth از طریق PI:** فقط وقتی عمدا runner معمولی PI را با Codex OAuth می‌خواهید، از `/model openai-codex/gpt-5.5` استفاده کنید.
    - **زیرعامل‌ها:** کارهای کدنویسی را به عاملی فقط مخصوص Codex با مدل و پیش‌فرض `agentRuntime` خودش مسیریابی کنید.

    [مدل‌ها](/fa/concepts/models) و [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="چطور fast mode را برای GPT 5.5 پیکربندی کنم؟">
    یا از یک تغییر وضعیت نشست استفاده کنید یا از یک پیش‌فرض config:

    - **به‌ازای هر نشست:** وقتی نشست از `openai/gpt-5.5` یا `openai-codex/gpt-5.5` استفاده می‌کند، `/fast on` را ارسال کنید.
    - **پیش‌فرض به‌ازای هر مدل:** مقدار `agents.defaults.models["openai/gpt-5.5"].params.fastMode` یا `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` را روی `true` تنظیم کنید.

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

    برای OpenAI، fast mode روی درخواست‌های native Responses پشتیبانی‌شده به `service_tier = "priority"` نگاشت می‌شود. بازنویسی‌های نشست `/fast` بر پیش‌فرض‌های config مقدم هستند.

    [Thinking و fast mode](/fa/tools/thinking) و [fast mode در OpenAI](/fa/providers/openai#fast-mode) را ببینید.

  </Accordion>

  <Accordion title='چرا "Model ... is not allowed" را می‌بینم و بعد پاسخی دریافت نمی‌کنم؟'>
    اگر `agents.defaults.models` تنظیم شده باشد، به **allowlist** برای `/model` و هرگونه
    بازنویسی نشست تبدیل می‌شود. انتخاب مدلی که در آن فهرست نیست این را برمی‌گرداند:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    آن خطا **به‌جای** پاسخ عادی برگردانده می‌شود. راه‌حل: مدل را به
    `agents.defaults.models` اضافه کنید، allowlist را حذف کنید، یا مدلی را از `/model list` انتخاب کنید.
    اگر دستور شامل `--runtime codex` هم بود، ابتدا مدل را اضافه کنید و سپس همان دستور
    `/model provider/model --runtime codex` را دوباره امتحان کنید.

  </Accordion>

  <Accordion title='چرا "Unknown model: minimax/MiniMax-M2.7" را می‌بینم؟'>
    یعنی **provider پیکربندی نشده است** (هیچ config یا پروفایل احراز هویت MiniMax
    پیدا نشد)، بنابراین مدل قابل resolve نیست.

    چک‌لیست رفع مشکل:

    1. به نسخه فعلی OpenClaw ارتقا دهید (یا از `main` منبع اجرا کنید)، سپس gateway را restart کنید.
    2. مطمئن شوید MiniMax پیکربندی شده است (wizard یا JSON)، یا احراز هویت MiniMax
       در env/auth profiles وجود دارد تا provider مطابق بتواند تزریق شود
       (`MINIMAX_API_KEY` برای `minimax`، `MINIMAX_OAUTH_TOKEN` یا MiniMax
       OAuth ذخیره‌شده برای `minimax-portal`).
    3. از شناسه دقیق مدل (حساس به بزرگی و کوچکی حروف) برای مسیر احراز هویت خود استفاده کنید:
       `minimax/MiniMax-M2.7` یا `minimax/MiniMax-M2.7-highspeed` برای راه‌اندازی
       با API-key، یا `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` برای راه‌اندازی OAuth.
    4. اجرا کنید:

       ```bash
       openclaw models list
       ```

       و از فهرست انتخاب کنید (یا در چت `/model list` را بزنید).

    [MiniMax](/fa/providers/minimax) و [مدل‌ها](/fa/concepts/models) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم MiniMax را پیش‌فرض بگذارم و برای کارهای پیچیده از OpenAI استفاده کنم؟">
    بله. از **MiniMax به‌عنوان پیش‌فرض** استفاده کنید و هنگام نیاز مدل‌ها را **به‌ازای هر نشست** تغییر دهید.
    fallbackها برای **خطاها** هستند، نه «کارهای سخت»، پس از `/model` یا یک عامل جداگانه استفاده کنید.

    **گزینه A: تغییر به‌ازای هر نشست**

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

  <Accordion title="آیا opus / sonnet / gpt میانبرهای داخلی هستند؟">
    بله. OpenClaw چند shorthand پیش‌فرض همراه دارد (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` وجود داشته باشد):

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

    سپس `/model sonnet` (یا `/<alias>` در صورت پشتیبانی) به آن شناسه مدل resolve می‌شود.

  </Accordion>

  <Accordion title="چطور مدل‌هایی از providerهای دیگر مثل OpenRouter یا Z.AI اضافه کنم؟">
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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    اگر به یک ارائه‌دهنده/مدل ارجاع دهید اما کلید لازم آن ارائه‌دهنده وجود نداشته باشد، یک خطای احراز هویت زمان اجرا دریافت می‌کنید (مثلاً `No API key found for provider "zai"`).

    **پس از افزودن عامل جدید، کلید API برای ارائه‌دهنده پیدا نشد**

    این معمولاً یعنی **عامل جدید** یک مخزن احراز هویت خالی دارد. احراز هویت برای هر عامل جداست و
    در اینجا ذخیره می‌شود:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    گزینه‌های رفع مشکل:

    - `openclaw agents add <id>` را اجرا کنید و احراز هویت را هنگام اجرای راهنما پیکربندی کنید.
    - یا فقط پروفایل‌های ایستای قابل‌حمل `api_key` / `token` را از مخزن احراز هویت عامل اصلی به مخزن احراز هویت عامل جدید کپی کنید.
    - برای پروفایل‌های OAuth، وقتی عامل جدید به حساب خودش نیاز دارد از همان عامل جدید وارد شوید؛ در غیر این صورت OpenClaw می‌تواند بدون شبیه‌سازی توکن‌های تازه‌سازی، از عامل پیش‌فرض/اصلی بخواند.

    `agentDir` را بین عامل‌ها بازاستفاده **نکنید**؛ این کار باعث تداخل احراز هویت/نشست می‌شود.

  </Accordion>
</AccordionGroup>

## جایگزینی خودکار مدل و «همه مدل‌ها ناموفق بودند»

<AccordionGroup>
  <Accordion title="جایگزینی خودکار چگونه کار می‌کند؟">
    جایگزینی خودکار در دو مرحله انجام می‌شود:

    1. **چرخش پروفایل احراز هویت** در همان ارائه‌دهنده.
    2. **مدل جایگزین** به مدل بعدی در `agents.defaults.model.fallbacks`.

    دوره‌های انتظار برای پروفایل‌های ناموفق اعمال می‌شوند (عقب‌نشینی نمایی)، بنابراین OpenClaw حتی وقتی یک ارائه‌دهنده محدودیت نرخ دارد یا موقتاً دچار خطاست، می‌تواند به پاسخ‌گویی ادامه دهد.

    سطل محدودیت نرخ بیش از پاسخ‌های ساده `429` را شامل می‌شود. OpenClaw
    همچنین پیام‌هایی مثل `Too many concurrent requests`،
    `ThrottlingException`، `concurrency limit reached`،
    `workers_ai ... quota limit exceeded`، `resource exhausted` و محدودیت‌های
    دوره‌ای پنجره مصرف (`weekly/monthly limit reached`) را به‌عنوان محدودیت‌های
    نرخ شایسته جایگزینی خودکار در نظر می‌گیرد.

    بعضی پاسخ‌هایی که شبیه صورتحساب هستند `402` نیستند، و بعضی پاسخ‌های HTTP `402`
    نیز در همان سطل گذرا باقی می‌مانند. اگر ارائه‌دهنده‌ای متن صریح صورتحساب را در `401` یا `403` برگرداند، OpenClaw همچنان می‌تواند آن را
    در مسیر صورتحساب نگه دارد، اما تطبیق‌دهنده‌های متن مختص ارائه‌دهنده در محدوده
    ارائه‌دهنده مالک خود باقی می‌مانند (برای مثال OpenRouter `Key limit exceeded`). اگر یک پیام `402`
    در عوض شبیه یک پنجره مصرف قابل‌تلاش‌مجدد یا
    سقف هزینه سازمان/فضای کاری باشد (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، OpenClaw آن را
    `rate_limit` در نظر می‌گیرد، نه یک غیرفعال‌سازی طولانی صورتحساب.

    خطاهای سرریز زمینه متفاوت‌اند: امضاهایی مانند
    `request_too_large`، `input exceeds the maximum number of tokens`،
    `input token count exceeds the maximum number of input tokens`،
    `input is too long for the model`، یا `ollama error: context length
    exceeded` به‌جای پیش‌بردن جایگزینی مدل،
    در مسیر Compaction/تلاش مجدد باقی می‌مانند.

    متن عمومی خطای سرور عمداً محدودتر از «هر چیزی که unknown/error در آن باشد»
    است. OpenClaw شکل‌های گذرای محدود به ارائه‌دهنده را به‌عنوان
    سیگنال‌های وقفه/بار بیش‌ازحد شایسته جایگزینی خودکار در نظر می‌گیرد، مثل
    Anthropic خام `An unknown error occurred`، OpenRouter خام
    `Provider returned error`، خطاهای دلیل توقف مثل `Unhandled stop reason:
    error`، بدنه‌های JSON `api_error` با متن گذرای سرور
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`) و خطاهای مشغول‌بودن ارائه‌دهنده مثل `ModelNotReadyException`، زمانی که زمینه ارائه‌دهنده
    مطابقت داشته باشد.
    متن عمومی جایگزینی داخلی مثل `LLM request failed with an unknown
    error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی جایگزینی مدل را فعال نمی‌کند.

  </Accordion>

  <Accordion title='«No credentials found for profile anthropic:default» یعنی چه؟'>
    یعنی سیستم تلاش کرده از شناسه پروفایل احراز هویت `anthropic:default` استفاده کند، اما نتوانسته اعتبارنامه‌های آن را در مخزن احراز هویت مورد انتظار پیدا کند.

    **چک‌لیست رفع مشکل:**

    - **تأیید کنید پروفایل‌های احراز هویت کجا نگهداری می‌شوند** (مسیرهای جدید در برابر قدیمی)
      - فعلی: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - قدیمی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود)
    - **تأیید کنید متغیر محیطی شما توسط Gateway بارگذاری شده است**
      - اگر `ANTHROPIC_API_KEY` را در پوسته خود تنظیم کرده‌اید اما Gateway را از طریق systemd/launchd اجرا می‌کنید، ممکن است آن را به ارث نبرد. آن را در `~/.openclaw/.env` قرار دهید یا `env.shellEnv` را فعال کنید.
    - **مطمئن شوید عامل درست را ویرایش می‌کنید**
      - راه‌اندازی‌های چندعاملی یعنی ممکن است چند فایل `auth-profiles.json` وجود داشته باشد.
    - **وضعیت مدل/احراز هویت را بررسی اولیه کنید**
      - از `openclaw models status` استفاده کنید تا مدل‌های پیکربندی‌شده و احراز هویت ارائه‌دهنده‌ها را ببینید.

    **چک‌لیست رفع مشکل برای «No credentials found for profile anthropic»**

    این یعنی اجرا به یک پروفایل احراز هویت Anthropic سنجاق شده است، اما Gateway
    نمی‌تواند آن را در مخزن احراز هویت خودش پیدا کند.

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

  <Accordion title="چرا Google Gemini را هم امتحان کرد و شکست خورد؟">
    اگر پیکربندی مدل شما Google Gemini را به‌عنوان جایگزین شامل کند (یا به یک کوتاه‌نویسی Gemini تغییر داده باشید)، OpenClaw آن را هنگام جایگزینی مدل امتحان می‌کند. اگر اعتبارنامه‌های Google را پیکربندی نکرده باشید، `No API key found for provider "google"` را خواهید دید.

    رفع مشکل: یا احراز هویت Google را فراهم کنید، یا مدل‌های Google را از `agents.defaults.model.fallbacks` / نام‌های مستعار حذف/اجتناب کنید تا جایگزینی به آنجا هدایت نشود.

    **درخواست LLM رد شد: امضای thinking لازم است (Google Antigravity)**

    علت: تاریخچه نشست شامل **بلوک‌های thinking بدون امضا** است (اغلب از
    یک جریان قطع‌شده/ناقص). Google Antigravity برای بلوک‌های thinking به امضا نیاز دارد.

    رفع مشکل: OpenClaw اکنون بلوک‌های thinking بدون امضا را برای Google Antigravity Claude حذف می‌کند. اگر همچنان ظاهر می‌شود، یک **نشست جدید** شروع کنید یا `/thinking off` را برای آن عامل تنظیم کنید.

  </Accordion>
</AccordionGroup>

## پروفایل‌های احراز هویت: چیستی و نحوه مدیریت

مرتبط: [/concepts/oauth](/fa/concepts/oauth) (جریان‌های OAuth، ذخیره‌سازی توکن، الگوهای چندحسابی)

<AccordionGroup>
  <Accordion title="پروفایل احراز هویت چیست؟">
    پروفایل احراز هویت یک رکورد اعتبارنامه نام‌گذاری‌شده (OAuth یا کلید API) است که به یک ارائه‌دهنده گره خورده است. پروفایل‌ها در اینجا قرار دارند:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    برای بررسی پروفایل‌های ذخیره‌شده بدون نمایش رازها، `openclaw models auth list` را اجرا کنید (در صورت نیاز با `--provider <id>` یا `--json`). برای جزئیات، [CLI مدل‌ها](/fa/cli/models#auth-profiles) را ببینید.

  </Accordion>

  <Accordion title="شناسه‌های رایج پروفایل چه هستند؟">
    OpenClaw از شناسه‌های پیشونددار با ارائه‌دهنده استفاده می‌کند، مانند:

    - `anthropic:default` (وقتی هویت ایمیلی وجود ندارد رایج است)
    - `anthropic:<email>` برای هویت‌های OAuth
    - شناسه‌های سفارشی که انتخاب می‌کنید (مثلاً `anthropic:work`)

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل کنم کدام پروفایل احراز هویت اول امتحان شود؟">
    بله. پیکربندی از فراداده اختیاری برای پروفایل‌ها و ترتیب برای هر ارائه‌دهنده (`auth.order.<provider>`) پشتیبانی می‌کند. این **رازها** را ذخیره نمی‌کند؛ شناسه‌ها را به ارائه‌دهنده/حالت نگاشت می‌کند و ترتیب چرخش را تنظیم می‌کند.

    OpenClaw ممکن است اگر یک پروفایل در یک **دوره انتظار** کوتاه (محدودیت‌های نرخ/وقفه‌ها/شکست‌های احراز هویت) یا یک وضعیت **غیرفعال** طولانی‌تر (صورتحساب/اعتبار ناکافی) باشد، آن را موقتاً رد کند. برای بررسی این موضوع، `openclaw models status --json` را اجرا کنید و `auth.unusableProfiles` را بررسی کنید. تنظیمات: `auth.cooldowns.billingBackoffHours*`.

    دوره‌های انتظار محدودیت نرخ می‌توانند محدود به مدل باشند. پروفایلی که
    برای یک مدل در حال انتظار است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد،
    در حالی که پنجره‌های صورتحساب/غیرفعال همچنان کل پروفایل را مسدود می‌کنند.

    همچنین می‌توانید با CLI یک بازنویسی ترتیب **برای هر عامل** تنظیم کنید (ذخیره‌شده در `auth-state.json` همان عامل):

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

    برای بررسی اینکه واقعاً چه چیزی امتحان خواهد شد، استفاده کنید از:

    ```bash
    openclaw models status --probe
    ```

    اگر یک پروفایل ذخیره‌شده از ترتیب صریح حذف شود، probe برای آن پروفایل
    به‌جای تلاش بی‌صدا، `excluded_by_auth_order` را گزارش می‌کند.

  </Accordion>

  <Accordion title="OAuth در برابر کلید API - تفاوت چیست؟">
    OpenClaw از هر دو پشتیبانی می‌کند:

    - **OAuth** اغلب از دسترسی اشتراکی استفاده می‌کند (در موارد قابل اعمال).
    - **کلیدهای API** از صورتحساب پرداخت به‌ازای هر توکن استفاده می‌کنند.

    راهنما به‌صراحت از Anthropic Claude CLI، OpenAI Codex OAuth و کلیدهای API پشتیبانی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی
- [پرسش‌های متداول — شروع سریع و راه‌اندازی اجرای نخست](/fa/help/faq-first-run)
- [انتخاب مدل](/fa/concepts/model-providers)
- [جایگزینی خودکار مدل](/fa/concepts/model-failover)
