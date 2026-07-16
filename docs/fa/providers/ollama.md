---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید
    - به راهنمای راه‌اندازی و پیکربندی Ollama نیاز دارید
    - می‌خواهید از مدل‌های بینایی Ollama برای درک تصویر استفاده کنید
summary: اجرای OpenClaw با Ollama (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T17:16:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw با API بومی Ollama (`/api/chat`) ارتباط برقرار می‌کند، نه با نقطه پایانی سازگار با OpenAI یعنی
`/v1`. سه حالت پشتیبانی می‌شود:

| حالت          | مورد استفاده                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| ابری + محلی | یک میزبان Ollama در دسترس که مدل‌های محلی و (در صورت ورود به حساب) مدل‌های `:cloud` را ارائه می‌کند |
| فقط ابری    | مستقیماً `https://ollama.com`، بدون دیمن محلی                                   |
| فقط محلی    | یک میزبان Ollama در دسترس، فقط مدل‌های محلی                                       |

برای راه‌اندازی صرفاً ابری با شناسه ارائه‌دهنده اختصاصی `ollama-cloud`، به
[Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید. هنگامی که می‌خواهید مسیریابی ابری
از ارائه‌دهنده محلی `ollama` جدا بماند، از ارجاع‌های `ollama-cloud/<model>` استفاده کنید.

<Warning>
از نشانی URL سازگار با OpenAI در `/v1` یعنی (`http://host:11434/v1`) استفاده نکنید. این نشانی فراخوانی ابزار را مختل می‌کند و ممکن است مدل‌ها JSON خام فراخوانی ابزار را به‌صورت متن ساده تولید کنند. از نشانی بومی استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

کلید پیکربندی معیار `baseUrl` است. `baseURL` نیز برای
نمونه‌های مبتنی بر سبک OpenAI SDK پذیرفته می‌شود، اما پیکربندی جدید باید از `baseUrl` استفاده کند.

## قواعد احراز هویت

<AccordionGroup>
  <Accordion title="میزبان‌های محلی و LAN">
    نشانی‌های URL مربوط به loopback، شبکه خصوصی، `.local` و نام میزبان ساده Ollama به توکن حامل واقعی نیاز ندارند. OpenClaw برای این موارد از نشانگر `ollama-local` استفاده می‌کند.
  </Accordion>
  <Accordion title="میزبان‌های راه دور و Ollama Cloud">
    میزبان‌های عمومی راه دور و `https://ollama.com` به اعتبارنامه واقعی نیاز دارند: `OLLAMA_API_KEY`، یک نمایه احراز هویت، یا `apiKey` ارائه‌دهنده. برای استفاده مستقیم میزبانی‌شده، ارائه‌دهنده `ollama-cloud` را ترجیح دهید.
  </Accordion>
  <Accordion title="شناسه‌های سفارشی ارائه‌دهنده">
    یک ارائه‌دهنده سفارشی دارای `api: "ollama"` از همین قواعد پیروی می‌کند. برای نمونه، یک ارائه‌دهنده `ollama-remote` که به میزبان خصوصی LAN اشاره دارد، می‌تواند از `apiKey: "ollama-local"` استفاده کند؛ زیرعامل‌ها این نشانگر را از طریق هوک ارائه‌دهنده Ollama برطرف می‌کنند، نه اینکه آن را اعتبارنامه‌ای مفقود تلقی کنند. `agents.defaults.memorySearch.provider` نیز می‌تواند به یک شناسه سفارشی ارائه‌دهنده اشاره کند تا تعبیه‌ها از همان نقطه پایانی Ollama استفاده کنند.
  </Accordion>
  <Accordion title="نمایه‌های احراز هویت">
    `auth-profiles.json` اعتبارنامه شناسه ارائه‌دهنده را ذخیره می‌کند؛ تنظیمات نقطه پایانی (`baseUrl`، `api`، مدل‌ها، سرآیندها و مهلت‌های زمانی) را در `models.providers.<id>` قرار دهید. فایل‌های مسطح قدیمی مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را همراه با یک نسخه پشتیبان به نمایه معیار کلید API در `ollama-windows:default` بازنویسی می‌کند. مقدار `baseUrl` در آن فایل قدیمی اطلاعات زائد است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="دامنه تعبیه حافظه">
    احراز هویت حامل برای تعبیه‌های حافظه Ollama به میزبانی محدود می‌شود که برای آن تعریف شده است:

    - کلید سطح ارائه‌دهنده فقط به میزبان همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان راه دور تعبیه خودش ارسال می‌شود.
    - مقدار محیطی صرفاً `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud تلقی می‌شود و به‌طور پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع به کار

<Tabs>
  <Tab title="راه‌اندازی اولیه (پیشنهادی)">
    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        ```

        **Ollama** را انتخاب کنید، سپس یک حالت برگزینید: **Cloud + Local**، **Cloud only** یا **Local only**.

        در یک راه‌اندازی هدایت‌شده تازه، OpenClaw ابتدا میزبان پیش‌فرض یا پیکربندی‌شده
        Ollama را بررسی می‌کند. اگر یک مدل نصب‌شده پشتیبانی از ابزار را اعلام کند، نردبان مشترک
        راه‌اندازی CLI/macOS بی‌درنگ آن را پیشنهاد می‌دهد و با یک تکمیل واقعی
        اعتبارسنجی‌اش می‌کند. این بررسی خودکار هرگز مدلی را دریافت نمی‌کند؛ اگر هیچ مدل
        نصب‌شده مناسبی وجود نداشته باشد، راه‌اندازی اولیه با انتخاب‌گر معمول Ollama ادامه می‌یابد.
      </Step>
      <Step title="انتخاب مدل">
        `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و پیش‌فرض‌های ابری میزبانی‌شده را پیشنهاد می‌دهد. `Cloud + Local` و `Local only` نشانی URL پایه Ollama را درخواست می‌کنند، مدل‌های موجود را شناسایی می‌کنند و اگر مدل محلی انتخاب‌شده موجود نباشد، آن را خودکار دریافت می‌کنند. یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` به‌جای تکرار `gemma4` فقط یک‌بار نمایش داده می‌شود. `Cloud + Local` همچنین بررسی می‌کند که آیا برای دسترسی ابری در میزبان وارد حساب شده‌اید یا نه.
      </Step>
      <Step title="اعتبارسنجی">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    غیرتعاملی:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` و `--custom-model-id` اختیاری هستند؛ با حذف آن‌ها، میزبان محلی پیش‌فرض و مدل پیشنهادی `gemma4` استفاده می‌شوند.

  </Tab>

  <Tab title="راه‌اندازی دستی">
    <Steps>
      <Step title="نصب و راه‌اندازی Ollama">
        آن را از [ollama.com/download](https://ollama.com/download) دریافت کنید، سپس یک مدل را دریافت کنید:

        ```bash
        ollama pull gemma4
        ```

        برای دسترسی ابری ترکیبی، `ollama signin` را روی همان میزبان اجرا کنید.
      </Step>
      <Step title="تنظیم اعتبارنامه">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # میزبان محلی/LAN، هر مقداری کار می‌کند
        export OLLAMA_API_KEY="your-real-key"   # فقط https://ollama.com
        ```

        یا در پیکربندی: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="انتخاب مدل">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        یا در پیکربندی:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## مدل‌های ابری از طریق میزبان محلی

`Cloud + Local` مدل‌های محلی و `:cloud` را از طریق یک میزبان در دسترس
Ollama مسیریابی می‌کند — این جریان ترکیبی Ollama و حالتی است که هنگام راه‌اندازی
برای استفاده از هر دو باید انتخاب شود.

OpenClaw نشانی URL پایه را درخواست می‌کند، مدل‌های محلی را شناسایی می‌کند و
وضعیت `ollama signin` را بررسی می‌کند. هنگام ورود به حساب، پیش‌فرض‌های میزبانی‌شده
(`kimi-k2.5:cloud`، `minimax-m2.7:cloud`، `glm-5.1:cloud`، `glm-5.2:cloud`) را پیشنهاد می‌دهد. اگر
وارد حساب نشده باشید، راه‌اندازی تا زمان اجرای `ollama signin` صرفاً محلی باقی می‌ماند.

برای دسترسی صرفاً ابری بدون دیمن محلی، از `openclaw onboard --auth-choice ollama-cloud` استفاده کنید و به [Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید — این مسیر به `ollama signin` یا سرور در حال اجرا نیاز ندارد:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

فهرست مدل‌های ابری که هنگام `openclaw onboard` نمایش داده می‌شود، به‌صورت زنده از
`https://ollama.com/api/tags` با سقف 500 ورودی پر می‌شود تا انتخاب‌گر
فهرست میزبانی‌شده کنونی را منعکس کند. اگر `ollama.com` در دسترس نباشد یا هنگام
راه‌اندازی هیچ مدلی برنگرداند، OpenClaw به فهرست پیشنهادی ثابت خود بازمی‌گردد تا
راه‌اندازی اولیه همچنان تکمیل شود.

## شناسایی مدل (ارائه‌دهنده ضمنی)

هنگامی که `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) تنظیم شده باشد و نه
`models.providers.ollama` و نه ارائه‌دهنده سفارشی دیگری با `api: "ollama"`
تعریف نشده باشد، OpenClaw مدل‌ها را از `http://127.0.0.1:11434` شناسایی می‌کند:

| رفتار             | جزئیات                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| پرس‌وجوی فهرست        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| تشخیص قابلیت | خواندن بهترین‌تلاش `/api/show` شامل `contextWindow`، پارامترهای Modelfile در `num_ctx` و قابلیت‌ها (بینایی/ابزارها/تفکر)                                                                                                                                                                       |
| مدل‌های بینایی        | قابلیت `vision` از `/api/show` مدل را دارای قابلیت پردازش تصویر (`input: ["text", "image"]`) علامت‌گذاری می‌کند                                                                                                                                                                                             |
| تشخیص استدلال  | در صورت وجود، از قابلیت `thinking` در `/api/show` استفاده می‌کند؛ هنگامی که Ollama قابلیت‌ها را حذف کند، به یک روش ابتکاری مبتنی بر نام (`r1`، `reason`، `reasoning`، `think`) بازمی‌گردد. `glm-5.2:cloud` و `deepseek-v4-flash\|pro:cloud` صرف‌نظر از قابلیت‌های گزارش‌شده همیشه استدلالی تلقی می‌شوند. |
| محدودیت توکن         | مقدار پیش‌فرض `maxTokens` سقف حداکثر توکن Ollama در OpenClaw است                                                                                                                                                                                                                                       |
| هزینه‌ها                | همه هزینه‌ها `0` هستند                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

تنظیم `models.providers.ollama` با آرایه صریح `models`، یا یک
ارائه‌دهنده سفارشی دارای `api: "ollama"` و `baseUrl` غیر-loopback،
شناسایی خودکار را غیرفعال می‌کند؛ در این صورت مدل‌ها باید به‌صورت دستی تعریف شوند (به
[پیکربندی](#configuration) مراجعه کنید). ورودی `models.providers.ollama` که به
`https://ollama.com` میزبانی‌شده اشاره می‌کند نیز شناسایی را نادیده می‌گیرد، زیرا مدل‌های Ollama Cloud
توسط ارائه‌دهنده مدیریت می‌شوند. ارائه‌دهندگان سفارشی loopback مانند
`http://127.0.0.2:11434` همچنان محلی محسوب می‌شوند و شناسایی خودکار را حفظ می‌کنند.

می‌توانید بدون ورودی دست‌نویس
`models.json` از یک ارجاع کامل مانند `ollama/<pulled-model>:latest` استفاده کنید؛ OpenClaw آن را به‌صورت زنده برطرف می‌کند. برای میزبان‌هایی که وارد حساب شده‌اند، انتخاب یک ارجاع فهرست‌نشده
`ollama/<model>:cloud` همان مدل دقیق را با `/api/show` اعتبارسنجی می‌کند و فقط در صورتی
آن را به فهرست زمان اجرا می‌افزاید که Ollama فراداده را تأیید کند — خطاهای تایپی همچنان به‌عنوان مدل ناشناخته شکست می‌خورند.

### آزمون‌های دود

برای یک بررسی محدود متنی که سطح کامل ابزار عامل را نادیده می‌گیرد:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "دقیقاً با این متن پاسخ دهید: pong" \
    --json
```

برای بررسی سبک یک مدل بینایی، `--file` را همراه با یک تصویر اضافه کنید (PNG/JPEG/WebP پذیرفته می‌شود؛
فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند — برای صوت از
`openclaw infer audio transcribe` استفاده کنید):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "این تصویر را در یک جمله توصیف کنید." \
    --file ./photo.jpg \
    --json
```

هیچ‌یک از این مسیرها ابزارهای گفتگو، حافظه یا زمینه نشست را بارگذاری نمی‌کند. اگر این مسیرها موفق شوند
اما پاسخ‌های عادی عامل شکست بخورند، احتمالاً مشکل از ظرفیت ابزار/عامل
مدل است، نه نقطه پایانی.

انتخاب مدل با `/model ollama/<model>` انتخاب دقیق کاربر است: اگر
`baseUrl` پیکربندی‌شده در دسترس نباشد، پاسخ بعدی با خطای ارائه‌دهنده
شکست می‌خورد، نه اینکه بی‌سروصدا به مدل پیکربندی‌شده دیگری بازگردد.

کارهای Cron ایزوله پیش از شروع نوبت عامل، یک بررسی ایمنی محلی اضافه انجام می‌دهند:
اگر مدل انتخاب‌شده به یک ارائه‌دهنده Ollama محلی/شبکه خصوصی/`.local`
منتهی شود و `/api/tags` در دسترس نباشد، OpenClaw آن اجرا را با وضعیت
`skipped` و با ذکر مدل در متن خطا ثبت می‌کند. این بررسی نقطه پایانی برای هر
میزبان به‌مدت 5 دقیقه کش می‌شود، بنابراین کارهای Cron تکراری در برابر یک دیمن متوقف‌شده،
همگی درخواست‌های محکوم به شکست را آغاز نمی‌کنند.

راستی‌آزمایی زنده:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای Ollama Cloud، همان آزمون زنده را به نقطه پایانی میزبانی‌شده هدایت کنید (به‌طور
پیش‌فرض از تعبیه‌ها صرف‌نظر می‌شود؛ با `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` آن را اجباری کنید، زیرا ممکن
است یک کلید ابری مجوز `/api/embed` را نداشته باشد):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای افزودن یک مدل، آن را دریافت کنید تا به‌طور خودکار کشف شود:

```bash
ollama pull mistral
```

## استنتاج محلی Node

عامل‌ها می‌توانند یک وظیفه کوتاه را به یک مدل Ollama روی دسکتاپ یا
Node سرور جفت‌شده واگذار کنند. پرامپت و پاسخ از اتصال احراز هویت‌شده موجود
Gateway/Node عبور می‌کنند؛ درخواست روی نقطه پایانی لوپ‌بک Ollama خود Node
(`http://127.0.0.1:11434`) اجرا می‌شود.

<Steps>
  <Step title="Ollama را روی Node راه‌اندازی کنید">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="میزبان Node را متصل کنید">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    دستگاه و فرمان‌های Node آن را روی میزبان Gateway تأیید کنید، سپس بررسی کنید:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    نخستین اتصال، یا ارتقایی که فرمان‌های Ollama را اضافه می‌کند، می‌تواند
    تأیید فرمان Node را فعال کند. اگر Node بدون اعلام
    `ollama.models` و `ollama.chat` متصل شد، دوباره
    `openclaw nodes pending` را بررسی کنید.

  </Step>
  <Step title="از یک عامل استفاده کنید">
    Plugin همراه Ollama ابزار `node_inference` را ارائه می‌کند. عامل‌ها ابتدا
    `action: "discover"` و سپس `action: "run"` را با یک Node و مدل از
    نتیجه آن فراخوانی می‌کنند (`run` هنگامی که دقیقاً یک Node توانمند
    متصل است می‌تواند Node را حذف کند). برای مثال: «مدل‌های Ollama روی Nodeهای من
    را کشف کن، سپس برای خلاصه‌کردن این متن از سریع‌ترین مدل بارگذاری‌شده استفاده کن.»
  </Step>
</Steps>

کشف، `/api/tags` را می‌خواند، قابلیت‌های `/api/show` را بررسی
می‌کند و در صورت وجود، از `/api/ps` استفاده می‌کند تا مدل‌های از قبل
بارگذاری‌شده را در رتبه نخست قرار دهد. فقط مدل‌های محلی‌ای برگردانده می‌شوند که Ollama
آن‌ها را دارای قابلیت گفتگو (`completion`) گزارش می‌کند — ردیف‌های Ollama Cloud
و مدل‌های صرفاً تعبیه‌ای کنار گذاشته می‌شوند. هر اجرا تفکر مدل را غیرفعال می‌کند و خروجی
به‌طور پیش‌فرض 512 توکن است (سقف قطعی 8192)، مگر اینکه فراخوانی ابزار
`maxTokens` متفاوتی درخواست کند؛ برخی مدل‌ها (برای مثال GPT-OSS) از
غیرفعال‌کردن تفکر پشتیبانی نمی‌کنند و ممکن است همچنان توکن‌های استدلال تولید کنند.

برای فعال نگه‌داشتن Ollama روی یک Node بدون در معرض عامل‌ها قراردادن آن:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node را راه‌اندازی مجدد کنید (`openclaw node restart`، یا برای یک نشست پیش‌زمینه
`openclaw node run` را متوقف و دوباره اجرا کنید). Node دیگر
`ollama.models` و `ollama.chat` را اعلام نمی‌کند؛ خود Ollama و
ارائه‌دهنده Ollama در Gateway تحت تأثیر قرار نمی‌گیرند. مقدار را دوباره روی
`true` تنظیم و برای فعال‌سازی مجدد راه‌اندازی کنید؛ سطح فرمان تغییریافته
ممکن است پس از اتصال مجدد، دوباره به تأیید `openclaw nodes pending` نیاز داشته باشد.

فرمان‌های Node را مستقیماً و بدون نوبت عامل بررسی کنید:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` مدت‌زمانی را که Node برای اجرای فرمان فرصت دارد محدود می‌کند؛
`--timeout` کل فراخوانی Gateway را محدود می‌کند و باید بزرگ‌تر باشد.

استنتاج محلی Node همیشه از نقطه پایانی لوپ‌بک خود Node استفاده می‌کند — از
`models.providers.ollama.baseUrl` راه‌دور/ابری پیکربندی‌شده دوباره استفاده نمی‌کند. فرمان‌های
Node به‌طور پیش‌فرض روی میزبان‌های Node در macOS، Linux و Windows در دسترس‌اند
و همچنان تابع خط‌مشی عادی جفت‌سازی/فرمان Node هستند.

## بینایی و توصیف تصویر

Plugin همراه Ollama، آن را به‌عنوان ارائه‌دهنده درک رسانه با قابلیت تصویر ثبت می‌کند،
بنابراین OpenClaw می‌تواند درخواست‌های صریح توصیف تصویر و پیش‌فرض‌های پیکربندی‌شده
مدل تصویر را از طریق مدل‌های بینایی محلی یا میزبانی‌شده Ollama مسیریابی کند.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` باید یک ارجاع کامل `<provider/model>` باشد؛ در صورت تنظیم،
`infer image
describe` ابتدا آن مدل را امتحان می‌کند، به‌جای اینکه برای مدل‌هایی که از قبل
از بینایی بومی پشتیبانی می‌کنند از توصیف صرف‌نظر کند. اگر فراخوانی شکست بخورد، OpenClaw
می‌تواند از طریق `agents.defaults.imageModel.fallbacks` ادامه دهد؛ خطاهای آماده‌سازی فایل/نشانی وب
پیش از تلاش برای مسیر جایگزین باعث شکست می‌شوند. برای جریان درک تصویر OpenClaw و
`imageModel` پیکربندی‌شده از `infer image describe` استفاده کنید؛ برای یک
کاوش چندوجهی خام با پرامپت سفارشی از `infer model run
--file` استفاده کنید.

برای قراردادن Ollama به‌عنوان ارائه‌دهنده پیش‌فرض درک تصویر برای رسانه ورودی:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

ارجاع کامل `ollama/<model>` را ترجیح دهید. یک ارجاع ساده
`imageModel` مانند `qwen2.5vl:7b` فقط زمانی به
`ollama/qwen2.5vl:7b` نرمال‌سازی می‌شود که همان مدل دقیق زیر
`models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهنده
تصویر پیکربندی‌شده دیگری همان شناسه ساده را ارائه نکند؛ در غیر این صورت، پیشوند
ارائه‌دهنده را صریحاً به‌کار ببرید.

مدل‌های بینایی محلی کند ممکن است نسبت به مدل‌های ابری به مهلت زمانی طولانی‌تری برای
درک تصویر نیاز داشته باشند و اگر Ollama تلاش کند کل زمینه بینایی اعلام‌شده مدل را
اختصاص دهد، ممکن است روی سخت‌افزار محدود از کار بیفتند. یک مهلت زمانی قابلیت تنظیم
کنید و `num_ctx` را محدود کنید:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

این مهلت زمانی بر درک تصویر ورودی و ابزار صریح `image` اعمال
می‌شود. `models.providers.ollama.timeoutSeconds` همچنان محافظ درخواست HTTP زیربنایی Ollama را برای
فراخوانی‌های عادی مدل کنترل می‌کند.

راستی‌آزمایی زنده:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را دستی تعریف می‌کنید، مدل‌های بینایی را صریحاً
علامت‌گذاری کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توصیف تصویر را برای مدل‌هایی که دارای قابلیت تصویر علامت‌گذاری
نشده‌اند رد می‌کند. در کشف ضمنی، این قابلیت از قابلیت بینایی
`/api/show` به‌دست می‌آید.

## پیکربندی

<Tabs>
  <Tab title="پایه (کشف ضمنی)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در ورودی ارائه‌دهنده حذف کنید؛ OpenClaw آن را برای بررسی‌های دسترس‌پذیری پر می‌کند.
    </Tip>

  </Tab>

  <Tab title="صریح (مدل‌های دستی)">
    برای راه‌اندازی ابری میزبانی‌شده، میزبان/درگاه غیراپیش‌فرض، پنجره‌های زمینه اجباری
    یا فهرست‌های مدل کاملاً دستی از پیکربندی صریح استفاده کنید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="نشانی پایه سفارشی">
    پیکربندی صریح، کشف خودکار را غیرفعال می‌کند؛ بنابراین مدل‌ها باید فهرست شوند:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // بدون /v1 - نشانی API بومی Ollama
            api: "ollama", // صریح: رفتار بومی فراخوانی ابزار را تضمین می‌کند
            timeoutSeconds: 300, // اختیاری: بودجه اتصال/جریان طولانی‌تر برای مدل‌های محلی سرد
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // اختیاری: مدل را بین نوبت‌ها بارگذاری‌شده نگه می‌دارد
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` را اضافه نکنید. آن مسیر حالت سازگار با OpenAI را انتخاب می‌کند که در آن فراخوانی ابزار قابل‌اعتماد نیست.
    </Warning>

  </Tab>
</Tabs>

## دستورالعمل‌های متداول

شناسه‌های مدل را با نام‌های دقیق از `ollama list` یا
`openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="مدل محلی با کشف خودکار">
    Ollama روی همان دستگاه Gateway که به‌طور خودکار کشف می‌شود:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    مگر اینکه به مدل‌های دستی نیاز دارید، بلوک `models.providers.ollama` اضافه نکنید.

  </Accordion>

  <Accordion title="میزبان Ollama در LAN با مدل‌های دستی">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` بودجه زمینه OpenClaw است؛ `params.num_ctx` به
    Ollama ارسال می‌شود. وقتی سخت‌افزار نمی‌تواند کل زمینه اعلام‌شده مدل را اجرا کند،
    آن‌ها را هم‌تراز نگه دارید.

  </Accordion>

  <Accordion title="فقط Ollama Cloud">
    بدون دیمن محلی، مدل‌های میزبانی‌شده به‌طور مستقیم:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    برای استفاده از شناسه ارائه‌دهنده اختصاصی `ollama-cloud` به‌جای این ساختار، به
    [Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید.

  </Accordion>

  <Accordion title="ابر و محیط محلی از طریق یک daemon واردشده">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="چند میزبان Ollama">
    هنگام اجرای بیش از یک سرور Ollama، از شناسه‌های سفارشی ارائه‌دهنده استفاده کنید؛ هرکدام
    میزبان، مدل‌ها، احراز هویت و مهلت زمانی مختص خود را دارند.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw پیش از فراخوانی Ollama، پیشوند ارائه‌دهنده فعال را حذف می‌کند (و در صورت نبود آن به پیشوند ساده
    `ollama/` برمی‌گردد)، بنابراین `ollama-large/qwen3.5:27b`
    با نام `qwen3.5:27b` به Ollama می‌رسد.

  </Accordion>

  <Accordion title="نمایه سبک مدل محلی">
    برخی مدل‌های محلی اعلان‌های ساده را مدیریت می‌کنند، اما با مجموعه کامل ابزارهای
    عامل مشکل دارند. پیش از تغییر تنظیمات سراسری زمان اجرا، ابزارها و زمینه را
    محدود کنید:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    از `compat.supportsTools: false` فقط زمانی استفاده کنید که مدل یا سرور به‌طور قابل‌اعتماد
    در طرح‌واره‌های ابزار شکست می‌خورد — این گزینه قابلیت عامل را با پایداری معاوضه می‌کند.
    `localModelLean` ابزارهای سنگین مرورگر، cron، پیام، تولید رسانه،
    صدا و PDF را، مگر آنکه صراحتاً لازم باشند، از سطح مستقیم عامل حذف می‌کند
    و کاتالوگ‌های بزرگ‌تر را پشت «جست‌وجوی ابزار» قرار می‌دهد. این گزینه زمینه زمان اجرای
    Ollama یا حالت تفکر آن را تغییر نمی‌دهد. برای مدل‌های تفکرمحور کوچک به سبک Qwen که وارد حلقه می‌شوند یا
    بودجه خود را صرف استدلال پنهان می‌کنند، آن را با `params.num_ctx` و
    `params.thinking: false` همراه کنید.

  </Accordion>
</AccordionGroup>

### انتخاب مدل

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

شناسه‌های سفارشی ارائه‌دهنده نیز به همین روش کار می‌کنند: برای ارجاعی که از پیشوند
ارائه‌دهنده فعال استفاده می‌کند، مانند `ollama-spark/qwen3:32b`، OpenClaw آن پیشوند را پیش از
فراخوانی Ollama حذف می‌کند و `qwen3:32b` را می‌فرستد.

برای مدل‌های محلی کند، پیش از افزایش مهلت زمانی کل زمان اجرای عامل، تنظیمات
محدوده ارائه‌دهنده را ترجیح دهید:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` درخواست HTTP مدل را پوشش می‌دهد: برقراری اتصال، سرآیندها،
جریان بدنه و لغو کلی واکشی محافظت‌شده. `params.keep_alive` در درخواست‌های بومی
`/api/chat` به‌صورت `keep_alive` سطح‌بالا ارسال می‌شود؛ وقتی زمان بارگذاری
نوبت نخست گلوگاه است، آن را برای هر مدل تنظیم کنید.

### بررسی سریع

```bash
# daemon Ollama برای این دستگاه قابل مشاهده است
curl http://127.0.0.1:11434/api/tags

# کاتالوگ OpenClaw و مدل انتخاب‌شده
openclaw models list --provider ollama
openclaw models status

# آزمون دود مستقیم مدل
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "دقیقاً با این عبارت پاسخ دهید: ok"
```

برای میزبان‌های راه دور، `127.0.0.1` را با میزبان `baseUrl` جایگزین کنید. اگر `curl`
کار می‌کند اما OpenClaw کار نمی‌کند، بررسی کنید که آیا Gateway روی دستگاه،
کانتینر یا حساب سرویس دیگری اجرا می‌شود.

## جست‌وجوی وب Ollama

OpenClaw، **جست‌وجوی وب Ollama** را به‌عنوان ارائه‌دهنده `web_search` همراه دارد.

| ویژگی       | جزئیات                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان      | در صورت تنظیم، `models.providers.ollama.baseUrl`؛ در غیر این صورت `http://127.0.0.1:11434`؛ `https://ollama.com` مستقیماً از API میزبانی‌شده استفاده می‌کند                          |
| احراز هویت  | بدون نیاز به کلید برای میزبان محلی واردشده؛ `OLLAMA_API_KEY` یا احراز هویت پیکربندی‌شده ارائه‌دهنده برای جست‌وجوی مستقیم `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت           |
| پیش‌نیاز    | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد شده باشند؛ جست‌وجوی مستقیم میزبانی‌شده به `baseUrl: "https://ollama.com"` به‌همراه یک کلید API واقعی نیاز دارد |

آن را هنگام `openclaw onboard` یا `openclaw configure --section web` انتخاب کنید، یا این مورد را تنظیم کنید:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

برای جست‌وجوی مستقیم میزبانی‌شده از طریق Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

برای یک میزبان خودمیزبان، OpenClaw ابتدا پراکسی محلی `/api/experimental/web_search`
را امتحان می‌کند، سپس به مسیر میزبانی‌شده `/api/web_search` روی همان میزبان برمی‌گردد؛
یک daemon محلی واردشده معمولاً از طریق پراکسی محلی پاسخ می‌دهد. فراخوانی‌های مستقیم
`https://ollama.com` همیشه از نقطه پایانی میزبانی‌شده `/api/web_search` استفاده می‌کنند.

<Note>
برای راه‌اندازی و رفتار کامل، به [جست‌وجوی وب Ollama](/fa/tools/ollama-search) مراجعه کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت قدیمی سازگار با OpenAI">
    <Warning>
    **فراخوانی ابزار در این حالت قابل‌اعتماد نیست.** فقط زمانی از آن استفاده کنید که پراکسی به قالب OpenAI نیاز دارد و به فراخوانی بومی ابزار وابسته نیستید.
    </Warning>

    برای پراکسی پشت
    `/v1/chat/completions`، مقدار `api: "openai-completions"` را صراحتاً تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // پیش‌فرض: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    این حالت ممکن است از جریان‌دهی و فراخوانی ابزار به‌طور هم‌زمان پشتیبانی نکند؛ ممکن است
    لازم باشد `params: { streaming: false }` را روی مدل تنظیم کنید.

    OpenClaw در این حالت به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama
    بی‌سروصدا به زمینه 4096 توکنی برنگردد. اگر پراکسی شما فیلدهای ناشناخته
    `options` را رد می‌کند، آن را غیرفعال کنید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="پنجره‌های زمینه">
    برای مدل‌های کشف‌شده خودکار، OpenClaw از پنجره زمینه‌ای استفاده می‌کند که `/api/show`
    گزارش می‌دهد، از جمله مقادیر بزرگ‌تر `PARAMETER num_ctx` از Modelfileهای
    سفارشی؛ در غیر این صورت به پنجره زمینه پیش‌فرض Ollama در OpenClaw برمی‌گردد.

    `contextWindow`، `contextTokens` و `maxTokens` در سطح ارائه‌دهنده،
    پیش‌فرض‌های هر مدل زیر آن ارائه‌دهنده را تعیین می‌کنند و می‌توان آن‌ها را برای هر
    مدل بازنویسی کرد. `contextWindow` بودجه اعلان/Compaction خود OpenClaw است. درخواست‌های بومی
    `/api/chat`، مگر آنکه `params.num_ctx` را صراحتاً تنظیم کنید، `options.num_ctx` را
    تنظیم‌نشده باقی می‌گذارند؛ بنابراین Ollama پیش‌فرض خود مدل،
    `OLLAMA_CONTEXT_LENGTH` یا پیش‌فرض مبتنی بر VRAM را اعمال می‌کند؛ مقادیر نامعتبر، صفر، منفی
    یا نامتناهی `params.num_ctx` نادیده گرفته می‌شوند. اگر پیکربندی قدیمی فقط از
    `contextWindow`/`maxTokens` برای اجبار زمینه درخواست بومی استفاده می‌کرد،
    `openclaw doctor --fix` را اجرا کنید تا آن مقادیر در `params.num_ctx` کپی شوند. آداپتور
    سازگار با OpenAI همچنان به‌طور پیش‌فرض `options.num_ctx` را از
    `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر بالادست
    `options` را رد می‌کند، آن را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی همچنین گزینه‌های رایج زمان اجرای Ollama را زیر
    `params` می‌پذیرند که به‌صورت `options` بومی `/api/chat` ارسال می‌شوند: `num_keep`، `seed`،
    `num_predict`، `top_k`، `top_p`، `min_p`، `typical_p`، `repeat_last_n`،
    `temperature`، `repeat_penalty`، `presence_penalty`، `frequency_penalty`،
    `stop`، `num_batch`، `num_gpu`، `main_gpu`، `use_mmap` و `num_thread`.
    چند کلید (`format`، `keep_alive`، `truncate`، `shift`) به‌جای `options` تودرتو،
    به‌عنوان فیلدهای سطح‌بالای درخواست ارسال می‌شوند. OpenClaw فقط
    این کلیدهای درخواست Ollama را ارسال می‌کند، بنابراین پارامترهای مختص زمان اجرا مانند
    `streaming` هرگز به Ollama فرستاده نمی‌شوند. برای تنظیم `think` سطح‌بالا از `params.think` (یا
    `params.thinking`) استفاده کنید؛ `false` تفکر در سطح API را
    برای مدل‌های تفکرمحور به سبک Qwen غیرفعال می‌کند.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` برای هر مدل نیز
    کار می‌کند؛ اگر هر دو تنظیم شده باشند، ورودی صریح مدل ارائه‌دهنده اولویت دارد.

  </Accordion>

  <Accordion title="کنترل تفکر">
    OpenClaw تفکر را همان‌گونه که Ollama انتظار دارد ارسال می‌کند: `think` سطح‌بالا، نه
    `options.think`. مدل‌های کشف‌شده خودکاری که `/api/show` آن‌ها قابلیت
    `thinking` را گزارش می‌دهد، `/think low`، `/think medium`، `/think high`
    و `/think max` را ارائه می‌کنند؛ مدل‌های غیرفکری فقط `/think off` را ارائه می‌کنند.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    یا یک مدل پیش‌فرض تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    تنظیمات مختص هر مدل `params.think`/`params.thinking` می‌تواند تفکر API را
    برای مدلی مشخص غیرفعال یا اجباری کند. OpenClaw هنگامی‌که اجرای فعال فقط
    پیش‌فرض ضمنی `off` را دارد، آن پیکربندی صریح را حفظ می‌کند؛ بااین‌حال، یک
    فرمان زمان اجرا که خاموش نیست، مانند `/think medium`، همچنان آن را لغو می‌کند. درخواست
    تفکرِ دارای مقدار درست هرگز به مدلی که صراحتاً با
    `reasoning: false` علامت‌گذاری شده ارسال نمی‌شود؛ درخواست `think: false` بدون توجه به این مورد همیشه ارسال می‌شود.

  </Accordion>

  <Accordion title="مدل‌های استدلالی">
    مدل‌هایی با نام `deepseek-r1`، `reasoning`، `reason` یا `think`
    به‌طور پیش‌فرض دارای قابلیت استدلال در نظر گرفته می‌شوند — به پیکربندی اضافی نیازی نیست:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="هزینه‌های مدل">
    Ollama به‌صورت محلی اجرا می‌شود و رایگان است؛ بنابراین هزینه همه مدل‌ها، چه
    مدل‌های کشف‌شده خودکار و چه مدل‌های تعریف‌شده دستی، `0` است.
  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Plugin همراه Ollama یک ارائه‌دهنده تعبیه حافظه برای
    [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این ارائه‌دهنده از URL پایه
    و کلید API پیکربندی‌شده Ollama استفاده می‌کند، `/api/embed` را فراخوانی می‌کند و در صورت امکان چند قطعه حافظه را
    در یک درخواست `input` دسته‌بندی می‌کند.

    هنگامی‌که `proxy.enabled=true` است، درخواست‌های تعبیه به مبدأ loopback
    دقیق و محلی میزبان که از `baseUrl` پیکربندی‌شده به‌دست می‌آید، به‌جای پروکسی هدایت‌شونده مدیریت‌شده از
    مسیر مستقیم محافظت‌شده OpenClaw استفاده می‌کنند. نام میزبان پیکربندی‌شده باید خودِ
    `localhost` یا یک مقدار صریح IP از نوع loopback باشد — نام‌های DNS که
    صرفاً به loopback تفکیک می‌شوند، همچنان از مسیر پروکسی مدیریت‌شده استفاده می‌کنند. میزبان‌های Ollama در LAN،
    tailnet، شبکه خصوصی و عمومی همیشه در مسیر
    پروکسی مدیریت‌شده باقی می‌مانند و تغییر مسیر به میزبان/درگاه دیگری این
    اعتماد را به ارث نمی‌برد. `proxy.loopbackMode: "proxy"` ترافیک loopback را در هر صورت از
    پروکسی عبور می‌دهد؛ `proxy.loopbackMode: "block"` پیش از اتصال آن را رد می‌کند —
    [پروکسی مدیریت‌شده](/fa/security/network-proxy#gateway-loopback-mode) را ببینید.

    | ویژگی | مقدار |
    | --- | --- |
    | مدل پیش‌فرض | `nomic-embed-text` |
    | دریافت خودکار | بله، اگر به‌صورت محلی موجود نباشد |
    | هم‌زمانی درون‌خطی پیش‌فرض | 1 (پیش‌فرض سایر ارائه‌دهندگان بیشتر است؛ اگر میزبان توان آن را دارد با `nonBatchConcurrency` افزایش دهید) |

    تعبیه‌های زمان پرس‌وجو برای مدل‌هایی که پیشوندهای بازیابی را لازم می‌دانند یا
    توصیه می‌کنند از آن‌ها استفاده می‌کنند: `nomic-embed-text`، `qwen3-embedding` و
    `mxbai-embed-large`. دسته‌های سند خام باقی می‌مانند؛ بنابراین نمایه‌های موجود به
    مهاجرت قالب نیازی ندارند.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // پیش‌فرض برای Ollama. اگر بازنمایه‌سازی بیش‌ازحد کند است، در میزبان‌های بزرگ‌تر افزایش دهید.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    برای یک میزبان تعبیه راه‌دور، احراز هویت را به همان میزبان محدود کنید:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="پیکربندی جریان‌دهی">
    Ollama به‌طور پیش‌فرض از **API بومی** (`/api/chat`) استفاده می‌کند که
    از جریان‌دهی و فراخوانی ابزار به‌صورت هم‌زمان پشتیبانی می‌کند — به پیکربندی ویژه‌ای نیازی نیست.

    برای درخواست‌های بومی، کنترل تفکر مستقیماً ارسال می‌شود: `/think off`
    و `openclaw agent --thinking off` مقدار سطح‌بالای `think: false` را ارسال می‌کنند، مگر آنکه
    `params.think`/`params.thinking` صریحی پیکربندی شده باشد؛ `/think
    low|medium|high` رشته شدت متناظر را ارسال می‌کند؛ `/think max` به
    بالاترین شدت Ollama، یعنی `think: "high"`، نگاشت می‌شود.

    <Tip>
    برای استفاده از نقطه پایانی سازگار با OpenAI، بخش «حالت قدیمی سازگار با OpenAI» در بالا را ببینید — ممکن است جریان‌دهی و فراخوانی ابزار در آنجا با هم کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="چرخه خرابی WSL2 (راه‌اندازی‌های مجدد تکراری)">
    در WSL2 با NVIDIA/CUDA، نصب‌کننده رسمی لینوکس Ollama یک
    واحد systemd به نام `ollama.service` با `Restart=always` ایجاد می‌کند. اگر آن سرویس
    به‌صورت خودکار آغاز شود و هنگام راه‌اندازی WSL2 یک مدل مبتنی بر GPU را بارگیری کند، Ollama ممکن است
    هنگام بارگیری حافظه میزبان را مقید کند؛ بازیابی حافظه Hyper-V همیشه نمی‌تواند
    آن صفحه‌ها را بازیابی کند، بنابراین ممکن است Windows ماشین مجازی WSL2 را خاتمه دهد، systemd
    Ollama را دوباره راه‌اندازی کند و این چرخه تکرار شود.

    شواهد: راه‌اندازی‌های مجدد/خاتمه‌های تکراری WSL2، مصرف بالای CPU در `app.slice` یا
    `ollama.service` بلافاصله پس از آغاز WSL2، و SIGTERM از سوی systemd به‌جای
    پایان‌دهنده OOM لینوکس.

    OpenClaw هنگامی‌که WSL2، فعال بودن `ollama.service`
    با `Restart=always` و نشانگرهای قابل‌مشاهده CUDA را تشخیص دهد، یک هشدار هنگام راه‌اندازی ثبت می‌کند.

    راهکار:

    ```bash
    sudo systemctl disable ollama
    ```

    در سمت Windows، این مورد را به `%USERPROFILE%\.wslconfig` اضافه کنید، سپس
    `wsl --shutdown` را اجرا کنید:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    یا زمان زنده‌نگه‌داشتن را کوتاه کنید / Ollama را فقط هنگام نیاز به‌صورت دستی آغاز کنید:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) را ببینید.

  </Accordion>

  <Accordion title="Ollama شناسایی نمی‌شود">
    تأیید کنید Ollama در حال اجرا است، `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) تنظیم شده
    و `models.providers.ollama` به‌طور صریح تعریف **نشده است**:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    مدل را به‌صورت محلی دریافت کنید یا آن را به‌طور صریح در
    `models.providers.ollama` تعریف کنید:

    ```bash
    ollama list  # موارد نصب‌شده را ببینید
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # یا مدلی دیگر
    ```

  </Accordion>

  <Accordion title="اتصال رد شد">
    ```bash
    # بررسی کنید آیا Ollama در حال اجرا است
    ps aux | grep ollama

    # یا Ollama را دوباره راه‌اندازی کنید
    ollama serve
    ```

  </Accordion>

  <Accordion title="میزبان راه‌دور با curl کار می‌کند، اما با OpenClaw نه">
    از همان ماشین و محیط اجرایی که Gateway را اجرا می‌کند بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    دلایل رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند و رفتار سازگار با OpenAI را به‌جای Ollama بومی انتخاب می‌کند.
    - میزبان راه‌دور به تغییرات دیواره آتش یا اتصال LAN نیاز دارد.
    - مدل روی سرویس پس‌زمینه لپ‌تاپ شما قرار دارد، اما روی سرویس راه‌دور نیست.

  </Accordion>

  <Accordion title="مدل، JSON ابزار را به‌صورت متن خروجی می‌دهد">
    معمولاً ارائه‌دهنده در حالت سازگار با OpenAI است یا مدل نمی‌تواند
    طرح‌واره‌های ابزار را مدیریت کند. حالت بومی را ترجیح دهید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    اگر یک مدل محلی کوچک همچنان در طرح‌واره‌های ابزار ناموفق است،
    `compat.supportsTools: false` را در ورودی آن مدل تنظیم و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای به‌هم‌ریخته برمی‌گرداند">
    پاسخ‌های میزبانی‌شده Kimi/GLM که شامل توالی‌های طولانی از نمادهای غیرزبانی هستند،
    به‌جای پاسخی موفق، فراخوانی ناموفق ارائه‌دهنده تلقی می‌شوند تا
    سازوکار عادی تلاش مجدد/جایگزینی/مدیریت خطا کنترل را به‌دست گیرد و متن
    خراب در نشست ماندگار نشود.

    اگر دوباره رخ داد، نام مدل، فایل نشست فعلی و
    اینکه اجرا از `Cloud + Local` یا `Cloud only` استفاده کرده است را ثبت کنید، سپس یک
    نشست تازه و یک مدل جایگزین را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="مهلت مدل محلی سرد پایان می‌یابد">
    مدل‌های محلی بزرگ ممکن است برای نخستین بارگذاری به زمان زیادی نیاز داشته باشند. مهلت زمانی را به
    ارائه‌دهنده Ollama محدود کنید و در صورت تمایل مدل را بین نوبت‌ها بارگذاری‌شده نگه دارید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    اگر خود میزبان نیز اتصال‌ها را کند می‌پذیرد، `timeoutSeconds`
    مهلت اتصال محافظت‌شده این ارائه‌دهنده را نیز افزایش می‌دهد.

  </Accordion>

  <Accordion title="مدل با زمینه بزرگ بیش‌ازحد کند است یا حافظه‌اش تمام می‌شود">
    بسیاری از مدل‌ها اندازه زمینه‌ای بیشتر از توان اجرای راحت سخت‌افزار شما
    اعلام می‌کنند. Ollama بومی از پیش‌فرض محیط اجرایی خود استفاده می‌کند، مگر آنکه
    `params.num_ctx` تنظیم شده باشد. برای دستیابی به تأخیر قابل‌پیش‌بینی توکن نخست، هم بودجه OpenClaw و هم زمینه
    درخواست Ollama را محدود کنید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    اگر OpenClaw اعلان بیش‌ازحد بزرگی ارسال می‌کند، `contextWindow` را کاهش دهید. اگر
    زمینه محیط اجرایی Ollama برای ماشین بیش‌ازحد بزرگ است، `params.num_ctx` را کاهش دهید.
    اگر تولید بیش‌ازحد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/fa/providers/ollama-cloud" icon="cloud">
    راه‌اندازی فقط ابری با ارائه‌دهنده اختصاصی `ollama-cloud`.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    نحوه انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="جست‌وجوی وب Ollama" href="/fa/tools/ollama-search" icon="magnifying-glass">
    جزئیات کامل راه‌اندازی و رفتار جست‌وجوی وب مبتنی بر Ollama.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
