---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید
    - به راهنمای راه‌اندازی و پیکربندی Ollama نیاز دارید
    - می‌خواهید از مدل‌های بینایی Ollama برای درک تصاویر استفاده کنید
summary: اجرای OpenClaw با Ollama (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T10:40:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw با API بومی Ollama (`/api/chat`) ارتباط برقرار می‌کند، نه نقطه پایانی سازگار با OpenAI یعنی
`/v1`. سه حالت پشتیبانی می‌شود:

| حالت                 | مورد استفاده                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| ابری + محلی          | یک میزبان Ollama در دسترس که مدل‌های محلی و، در صورت ورود، مدل‌های `:cloud` را ارائه می‌دهد |
| فقط ابری             | استفاده مستقیم از `https://ollama.com`، بدون سرویس محلی                         |
| فقط محلی             | یک میزبان Ollama در دسترس، فقط برای مدل‌های محلی                                |

برای راه‌اندازی صرفاً ابری با شناسه ارائه‌دهنده اختصاصی `ollama-cloud`، به
[Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید. زمانی که می‌خواهید مسیریابی ابری
از ارائه‌دهنده محلی `ollama` جدا بماند، از ارجاع‌های `ollama-cloud/<model>` استفاده کنید.

<Warning>
از نشانی سازگار با OpenAI یعنی `/v1` (`http://host:11434/v1`) استفاده نکنید. این نشانی فراخوانی ابزار را مختل می‌کند و ممکن است مدل‌ها JSON خام فراخوانی ابزار را به‌صورت متن ساده تولید کنند. از نشانی بومی استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

کلید پیکربندی متعارف `baseUrl` است. برای نمونه‌های هم‌سبک با OpenAI SDK،
`baseURL` نیز پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `baseUrl` استفاده کنند.

## قواعد احراز هویت

<AccordionGroup>
  <Accordion title="میزبان‌های محلی و LAN">
    نشانی‌های Ollama مربوط به local loopback، شبکه خصوصی، `.local` و نام میزبان بدون دامنه به توکن bearer واقعی نیاز ندارند. OpenClaw برای این موارد از نشانگر `ollama-local` استفاده می‌کند.
  </Accordion>
  <Accordion title="میزبان‌های راه دور و Ollama Cloud">
    میزبان‌های عمومی راه دور و `https://ollama.com` به اعتبارنامه واقعی نیاز دارند: `OLLAMA_API_KEY`، یک نمایه احراز هویت یا `apiKey` ارائه‌دهنده. برای استفاده مستقیم از سرویس میزبانی‌شده، ارائه‌دهنده `ollama-cloud` را ترجیح دهید.
  </Accordion>
  <Accordion title="شناسه‌های سفارشی ارائه‌دهنده">
    یک ارائه‌دهنده سفارشی با `api: "ollama"` از همین قواعد پیروی می‌کند. برای نمونه، ارائه‌دهنده‌ای با نام `ollama-remote` که به یک میزبان خصوصی LAN اشاره می‌کند، می‌تواند از `apiKey: "ollama-local"` استفاده کند؛ زیرعامل‌ها این نشانگر را از طریق هوک ارائه‌دهنده Ollama حل می‌کنند، نه اینکه آن را اعتبارنامه مفقود تلقی کنند. `agents.defaults.memorySearch.provider` نیز می‌تواند به شناسه یک ارائه‌دهنده سفارشی اشاره کند تا تعبیه‌ها از آن نقطه پایانی Ollama استفاده کنند.
  </Accordion>
  <Accordion title="نمایه‌های احراز هویت">
    `auth-profiles.json` اعتبارنامه مربوط به شناسه ارائه‌دهنده را ذخیره می‌کند؛ تنظیمات نقطه پایانی (`baseUrl`، `api`، مدل‌ها، سرآیندها و مهلت‌های زمانی) را در `models.providers.<id>` قرار دهید. فایل‌های مسطح قدیمی مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را همراه با تهیه نسخه پشتیبان، به نمایه متعارف کلید API با نام `ollama-windows:default` بازنویسی می‌کند. مقدار `baseUrl` در آن فایل قدیمی داده‌ای زائد است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="دامنه تعبیه حافظه">
    احراز هویت bearer برای تعبیه‌های حافظه Ollama به میزبانی محدود است که برای آن تعریف شده است:

    - کلید سطح ارائه‌دهنده فقط به میزبان همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان راه دور تعبیه مربوط به خود ارسال می‌شود.
    - مقدار صرفاً محیطی `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud در نظر گرفته می‌شود و به‌طور پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع کار

<Tabs>
  <Tab title="راه‌اندازی اولیه (پیشنهادشده)">
    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        ```

        **Ollama** را انتخاب کنید، سپس یکی از حالت‌های **ابری + محلی**، **فقط ابری** یا **فقط محلی** را برگزینید.
      </Step>
      <Step title="انتخاب مدل">
        حالت `فقط ابری` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و پیش‌فرض‌های پیشنهادی سرویس ابری میزبانی‌شده را ارائه می‌دهد. حالت‌های `ابری + محلی` و `فقط محلی` نشانی پایه Ollama را درخواست می‌کنند، مدل‌های موجود را شناسایی می‌کنند و اگر مدل محلی انتخاب‌شده موجود نباشد، آن را به‌طور خودکار دریافت می‌کنند. یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` به‌جای تکرار `gemma4` فقط یک‌بار نمایش داده می‌شود. حالت `ابری + محلی` همچنین بررسی می‌کند که آیا میزبان برای دسترسی ابری وارد حساب شده است.
      </Step>
      <Step title="بررسی">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    حالت غیرتعاملی:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` و `--custom-model-id` اختیاری هستند؛ با حذف آن‌ها از میزبان محلی پیش‌فرض و مدل پیشنهادی `gemma4` استفاده می‌شود.

  </Tab>

  <Tab title="راه‌اندازی دستی">
    <Steps>
      <Step title="نصب و اجرای Ollama">
        آن را از [ollama.com/download](https://ollama.com/download) دریافت کنید، سپس یک مدل را دریافت کنید:

        ```bash
        ollama pull gemma4
        ```

        برای دسترسی ابری ترکیبی، `ollama signin` را روی همان میزبان اجرا کنید.
      </Step>
      <Step title="تنظیم اعتبارنامه">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # میزبان محلی/LAN، هر مقداری قابل استفاده است
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

حالت `ابری + محلی` مدل‌های محلی و `:cloud` را از طریق یک میزبان Ollama
در دسترس مسیریابی می‌کند؛ این جریان ترکیبی Ollama است و هنگام راه‌اندازی،
اگر هر دو نوع مدل را می‌خواهید، باید این حالت را انتخاب کنید.

OpenClaw نشانی پایه را درخواست می‌کند، مدل‌های محلی را شناسایی می‌کند و وضعیت
`ollama signin` را بررسی می‌کند. در صورت ورود، پیش‌فرض‌های میزبانی‌شده
(`kimi-k2.5:cloud`، `minimax-m2.7:cloud`، `glm-5.1:cloud`، `glm-5.2:cloud`) را پیشنهاد می‌دهد. اگر
وارد نشده باشید، راه‌اندازی تا زمان اجرای `ollama signin` صرفاً محلی باقی می‌ماند.

برای دسترسی صرفاً ابری بدون سرویس محلی، از `openclaw onboard --auth-choice ollama-cloud` استفاده کنید و به [Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید؛ این مسیر به `ollama signin` یا سرور در حال اجرا نیاز ندارد:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

فهرست مدل‌های ابری که هنگام اجرای `openclaw onboard` نمایش داده می‌شود، به‌صورت زنده از
`https://ollama.com/api/tags` با سقف ۵۰۰ ورودی دریافت می‌شود تا انتخاب‌گر
فهرست جاری سرویس میزبانی‌شده را نشان دهد. اگر هنگام راه‌اندازی `ollama.com`
در دسترس نباشد یا هیچ مدلی برنگرداند، OpenClaw به فهرست پیشنهادی ثابت خود
بازمی‌گردد تا راه‌اندازی اولیه همچنان تکمیل شود.

## شناسایی مدل (ارائه‌دهنده ضمنی)

وقتی `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) تنظیم شده باشد و نه
`models.providers.ollama` و نه ارائه‌دهنده سفارشی دیگری با `api: "ollama"`
تعریف نشده باشد، OpenClaw مدل‌ها را از `http://127.0.0.1:11434` شناسایی می‌کند:

| رفتار                | جزئیات                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| واکشی فهرست          | `/api/tags`                                                                                                                                                                                                                                                                                   |
| تشخیص قابلیت         | خواندن بهترین‌تلاش `/api/show` برای `contextWindow`، پارامترهای `num_ctx` در Modelfile و قابلیت‌ها (بینایی/ابزارها/تفکر)                                                                                                                                                                      |
| مدل‌های بینایی       | قابلیت `vision` از `/api/show` مدل را دارای توانایی پردازش تصویر علامت‌گذاری می‌کند (`input: ["text", "image"]`)                                                                                                                                                                             |
| تشخیص استدلال        | در صورت وجود، از قابلیت `thinking` در `/api/show` استفاده می‌کند؛ اگر Ollama قابلیت‌ها را ارائه نکند، به روش ابتکاری مبتنی بر نام (`r1`، `reason`، `reasoning`، `think`) بازمی‌گردد. `glm-5.2:cloud` و `deepseek-v4-flash\|pro:cloud` بدون توجه به قابلیت‌های گزارش‌شده، همیشه استدلالی در نظر گرفته می‌شوند. |
| محدودیت توکن         | مقدار پیش‌فرض `maxTokens` برابر سقف بیشینه توکن Ollama در OpenClaw است                                                                                                                                                                                                                        |
| هزینه‌ها             | همه هزینه‌ها `0` هستند                                                                                                                                                                                                                                                                       |

```bash
ollama list
openclaw models list
```

تنظیم `models.providers.ollama` با آرایه صریح `models`، یا یک
ارائه‌دهنده سفارشی با `api: "ollama"` و `baseUrl` غیر local loopback،
شناسایی خودکار را غیرفعال می‌کند؛ در این صورت مدل‌ها باید به‌صورت دستی تعریف شوند
([پیکربندی](#configuration) را ببینید). ورودی `models.providers.ollama` که به
`https://ollama.com` میزبانی‌شده اشاره می‌کند نیز از شناسایی صرف‌نظر می‌کند، زیرا مدل‌های
Ollama Cloud توسط ارائه‌دهنده مدیریت می‌شوند. ارائه‌دهندگان سفارشی local loopback مانند
`http://127.0.0.2:11434` همچنان محلی محسوب می‌شوند و شناسایی خودکار را حفظ می‌کنند.

می‌توانید بدون نوشتن دستی ورودی در `models.json`، از ارجاع کاملی مانند
`ollama/<pulled-model>:latest` استفاده کنید؛ OpenClaw آن را به‌صورت زنده حل می‌کند. برای
میزبان‌های واردشده، انتخاب ارجاع فهرست‌نشده `ollama/<model>:cloud` همان مدل دقیق
را با `/api/show` اعتبارسنجی می‌کند و تنها در صورتی آن را به فهرست زمان اجرا
می‌افزاید که Ollama فراداده را تأیید کند؛ خطاهای تایپی همچنان به‌عنوان مدل ناشناخته رد می‌شوند.

### آزمون‌های دود

برای یک بررسی محدود متنی که کل سطح ابزارهای عامل را کنار می‌گذارد:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

برای بررسی سبک یک مدل بینایی، `--file` را همراه با یک تصویر اضافه کنید (PNG/JPEG/WebP پذیرفته می‌شود؛
فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند؛ برای صوت از
`openclaw infer audio transcribe` استفاده کنید):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

هیچ‌یک از این مسیرها ابزارهای گفت‌وگو، حافظه یا زمینه نشست را بارگذاری نمی‌کنند. اگر این مسیر
موفق شود اما پاسخ‌های عادی عامل ناموفق باشند، احتمالاً مشکل از ظرفیت ابزار/عامل
مدل است، نه نقطه پایانی.

انتخاب مدل با `/model ollama/<model>` انتخاب دقیق کاربر است: اگر
`baseUrl` پیکربندی‌شده در دسترس نباشد، پاسخ بعدی به‌جای بازگشت خاموش
به مدل پیکربندی‌شده دیگری، با خطای ارائه‌دهنده ناموفق می‌شود.

کارهای Cron ایزوله پیش از آغاز نوبت عامل یک بررسی ایمنی محلی انجام می‌دهند:
اگر مدل انتخاب‌شده به یک ارائه‌دهنده Ollama محلی، شبکه خصوصی یا `.local`
حل شود و `/api/tags` در دسترس نباشد، OpenClaw اجرای مربوطه را با وضعیت
`skipped` و نام مدل در متن خطا ثبت می‌کند. نتیجه بررسی این نقطه پایانی برای
هر میزبان ۵ دقیقه ذخیره می‌شود تا کارهای مکرر Cron در برابر یک سرویس متوقف‌شده،
همگی درخواست‌های ناموفق را آغاز نکنند.

اعتبارسنجی زنده:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای Ollama Cloud، همان آزمون زنده را به نقطهٔ پایانی میزبانی‌شده هدایت کنید (به‌طور پیش‌فرض embeddingها را رد می‌کند؛ چون ممکن است کلید ابری مجوز `/api/embed` را نداشته باشد، با `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` آن را اجباری کنید):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای افزودن یک مدل، آن را دریافت کنید تا به‌طور خودکار شناسایی شود:

```bash
ollama pull mistral
```

## استنتاج محلی در Node

عامل‌ها می‌توانند یک وظیفهٔ کوتاه را به یک مدل Ollama روی دسکتاپ یا Node سرور جفت‌شده واگذار کنند. پرامپت و پاسخ از اتصال احراز هویت‌شدهٔ موجود میان Gateway و Node عبور می‌کنند؛ درخواست روی نقطهٔ پایانی local loopback مربوط به Ollama خود Node (`http://127.0.0.1:11434`) اجرا می‌شود.

<Steps>
  <Step title="Start Ollama on the node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connect the node host">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    دستگاه و فرمان‌های Node آن را روی میزبان Gateway تأیید کنید، سپس صحت اتصال را بررسی کنید:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    نخستین اتصال، یا ارتقایی که فرمان‌های Ollama را اضافه می‌کند، ممکن است تأیید فرمان Node را فعال کند. اگر Node بدون اعلام `ollama.models` و `ollama.chat` متصل شد، دوباره `openclaw nodes pending` را بررسی کنید.

  </Step>
  <Step title="Use it from an agent">
    Plugin همراه Ollama ابزار `node_inference` را ارائه می‌کند. عامل‌ها ابتدا `action: "discover"` و سپس `action: "run"` را با یک Node و مدل از نتیجهٔ آن فراخوانی می‌کنند (`run` می‌تواند وقتی دقیقاً یک Node دارای قابلیت متصل است، Node را مشخص نکند). برای نمونه: «مدل‌های Ollama را روی Nodeهای من پیدا کن، سپس برای خلاصه‌سازی این متن از سریع‌ترین مدل بارگذاری‌شده استفاده کن.»
  </Step>
</Steps>

فرایند شناسایی، `/api/tags` را می‌خواند، قابلیت‌های `/api/show` را بررسی می‌کند و در صورت دسترس‌بودن از `/api/ps` استفاده می‌کند تا مدل‌های از قبل بارگذاری‌شده را در رتبه‌های نخست قرار دهد. فقط مدل‌های محلی را برمی‌گرداند که Ollama آن‌ها را دارای قابلیت گفت‌وگو (`completion` capability) گزارش می‌کند؛ ردیف‌های Ollama Cloud و مدل‌های مختص embedding کنار گذاشته می‌شوند. هر اجرا قابلیت تفکر مدل را غیرفعال می‌کند و به‌طور پیش‌فرض خروجی را به ۵۱۲ توکن محدود می‌کند (سقف قطعی ۸۱۹۲)، مگر اینکه فراخوانی ابزار مقدار دیگری برای `maxTokens` درخواست کند؛ برخی مدل‌ها (برای مثال GPT-OSS) از غیرفعال‌کردن تفکر پشتیبانی نمی‌کنند و ممکن است همچنان توکن‌های استدلال تولید کنند.

برای اینکه Ollama روی یک Node در حال اجرا بماند، بدون اینکه در اختیار عامل‌ها قرار گیرد:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node را راه‌اندازی مجدد کنید (`openclaw node restart`، یا برای یک نشست پیش‌زمینه `openclaw node run` را متوقف و دوباره اجرا کنید). Node دیگر `ollama.models` و `ollama.chat` را اعلام نمی‌کند؛ خود Ollama و ارائه‌دهندهٔ Ollama در Gateway تحت تأثیر قرار نمی‌گیرند. برای فعال‌سازی مجدد، مقدار را به `true` برگردانید و Node را راه‌اندازی مجدد کنید؛ تغییر سطح فرمان‌ها ممکن است پس از اتصال دوباره، بار دیگر به تأیید `openclaw nodes pending` نیاز داشته باشد.

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

`--invoke-timeout` مدت‌زمانی را که Node برای اجرای فرمان در اختیار دارد محدود می‌کند؛ `--timeout` کل فراخوانی Gateway را محدود می‌کند و باید بزرگ‌تر باشد.

استنتاج محلی در Node همیشه از نقطهٔ پایانی local loopback خود Node استفاده می‌کند و از `models.providers.ollama.baseUrl` راه‌دور یا ابری پیکربندی‌شده استفادهٔ مجدد نمی‌کند. فرمان‌های Node به‌طور پیش‌فرض روی میزبان‌های Node در macOS، Linux و Windows در دسترس‌اند و همچنان تابع سیاست عادی جفت‌سازی و فرمان Node هستند.

## بینایی و توصیف تصویر

Plugin همراه Ollama، آن را به‌عنوان یک ارائه‌دهندهٔ درک رسانه با قابلیت پردازش تصویر ثبت می‌کند؛ بنابراین OpenClaw می‌تواند درخواست‌های صریح توصیف تصویر و پیش‌فرض‌های پیکربندی‌شدهٔ مدل تصویر را از طریق مدل‌های بینایی محلی یا میزبانی‌شدهٔ Ollama مسیریابی کند.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` باید یک ارجاع کامل `<provider/model>` باشد؛ وقتی تنظیم شود، `infer image describe` ابتدا آن مدل را امتحان می‌کند، به‌جای اینکه برای مدل‌هایی که از قبل از بینایی بومی پشتیبانی می‌کنند از توصیف صرف‌نظر کند. اگر فراخوانی ناموفق باشد، OpenClaw می‌تواند مسیر را از طریق `agents.defaults.imageModel.fallbacks` ادامه دهد؛ خطاهای آماده‌سازی فایل یا URL پیش از تلاش برای مسیر جایگزین باعث شکست می‌شوند. برای جریان درک تصویر OpenClaw و `imageModel` پیکربندی‌شده از `infer image describe` استفاده کنید؛ برای یک بررسی خام چندوجهی با پرامپت سفارشی از `infer model run --file` استفاده کنید.

برای تبدیل Ollama به ارائه‌دهندهٔ پیش‌فرض درک تصویر برای رسانهٔ ورودی:

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

ارجاع کامل `ollama/<model>` را ترجیح دهید. یک ارجاع بدون پیشوند `imageModel` مانند `qwen2.5vl:7b` فقط زمانی به `ollama/qwen2.5vl:7b` نرمال‌سازی می‌شود که همان مدل دقیقاً زیر `models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهندهٔ تصویر پیکربندی‌شدهٔ دیگری همان شناسهٔ بدون پیشوند را ارائه نکند؛ در غیر این صورت، پیشوند ارائه‌دهنده را صریحاً به کار ببرید.

مدل‌های بینایی محلی کند ممکن است نسبت به مدل‌های ابری به مهلت زمانی طولانی‌تری برای درک تصویر نیاز داشته باشند و اگر Ollama تلاش کند کل زمینهٔ بینایی اعلام‌شدهٔ مدل را تخصیص دهد، ممکن است روی سخت‌افزار محدود از کار بیفتند. یک مهلت زمانی قابلیت تنظیم و `num_ctx` را محدود کنید:

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

این مهلت زمانی برای درک تصاویر ورودی و ابزار صریح `image` اعمال می‌شود. `models.providers.ollama.timeoutSeconds` همچنان محافظ درخواست HTTP زیربنایی Ollama را برای فراخوانی‌های عادی مدل کنترل می‌کند.

اعتبارسنجی زنده:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را به‌صورت دستی تعریف می‌کنید، مدل‌های بینایی را صریحاً مشخص کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توصیف تصویر را برای مدل‌هایی که به‌عنوان دارای قابلیت تصویر مشخص نشده‌اند رد می‌کند. در شناسایی ضمنی، این اطلاعات از قابلیت بینایی `/api/show` به دست می‌آید.

## پیکربندی

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در ورودی ارائه‌دهنده حذف کنید؛ OpenClaw آن را برای بررسی‌های دسترس‌پذیری وارد می‌کند.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    برای راه‌اندازی ابری میزبانی‌شده، میزبان یا درگاه غیراستاندارد، پنجره‌های زمینهٔ اجباری، یا فهرست کاملاً دستی مدل‌ها از پیکربندی صریح استفاده کنید:

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

  <Tab title="Custom base URL">
    پیکربندی صریح، شناسایی خودکار را غیرفعال می‌کند؛ بنابراین مدل‌ها باید فهرست شوند:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` را اضافه نکنید. این مسیر حالت سازگار با OpenAI را انتخاب می‌کند که در آن فراخوانی ابزار قابل اتکا نیست.
    </Warning>

  </Tab>
</Tabs>

## دستورالعمل‌های رایج

شناسه‌های مدل را با نام‌های دقیق خروجی `ollama list` یا `openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama روی همان دستگاه Gateway که به‌طور خودکار شناسایی می‌شود:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    مگر اینکه به مدل‌های دستی نیاز داشته باشید، بلوک `models.providers.ollama` را اضافه نکنید.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` بودجهٔ زمینهٔ OpenClaw است؛ `params.num_ctx` به Ollama ارسال می‌شود. وقتی سخت‌افزار نمی‌تواند کل زمینهٔ اعلام‌شدهٔ مدل را اجرا کند، این دو را هم‌تراز نگه دارید.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    بدون سرویس محلی و با استفادهٔ مستقیم از مدل‌های میزبانی‌شده:

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

    برای استفاده از شناسهٔ اختصاصی ارائه‌دهندهٔ `ollama-cloud` به‌جای این ساختار، به [Ollama Cloud](/fa/providers/ollama-cloud) مراجعه کنید.

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
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

  <Accordion title="Multiple Ollama hosts">
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

    OpenClaw پیشوند ارائه‌دهندهٔ فعال را پیش از فراخوانی Ollama حذف می‌کند (و در صورت نیاز به
    پیشوند سادهٔ `ollama/` برمی‌گردد)، بنابراین `ollama-large/qwen3.5:27b`
    به‌صورت `qwen3.5:27b` به Ollama می‌رسد.

  </Accordion>

  <Accordion title="Lean local model profile">
    برخی مدل‌های محلی از عهدهٔ اعلان‌های ساده برمی‌آیند، اما با مجموعهٔ کامل ابزارهای عامل
    مشکل دارند. پیش از تغییر تنظیمات سراسری زمان اجرا، ابزارها و زمینه را محدود کنید:

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

    فقط زمانی از `compat.supportsTools: false` استفاده کنید که مدل یا سرور در کار با
    طرح‌واره‌های ابزار به‌طور قابل‌اعتماد شکست می‌خورد؛ این گزینه قابلیت‌های عامل را با
    پایداری معاوضه می‌کند.
    `localModelLean` ابزارهای سنگین مرورگر، Cron، پیام، تولید رسانه،
    صدا و PDF را از سطح مستقیم عامل حذف می‌کند، مگر آنکه صریحاً لازم باشند،
    و فهرست‌های بزرگ‌تر را پشت «جست‌وجوی ابزار» قرار می‌دهد. این گزینه زمینهٔ زمان اجرای
    Ollama یا حالت تفکر آن را تغییر نمی‌دهد. برای مدل‌های کوچک متفکر به سبک Qwen که وارد
    حلقه می‌شوند یا بودجهٔ خود را صرف استدلال پنهان می‌کنند، آن را همراه با
    `params.num_ctx` و `params.thinking: false` به‌کار ببرید.

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

شناسه‌های سفارشی ارائه‌دهنده نیز به همین شکل کار می‌کنند: برای ارجاعی که از پیشوند
ارائه‌دهندهٔ فعال استفاده می‌کند، مانند `ollama-spark/qwen3:32b`، OpenClaw آن پیشوند را
پیش از فراخوانی Ollama حذف می‌کند و `qwen3:32b` را می‌فرستد.

برای مدل‌های محلی کند، پیش از افزایش مهلت زمانی کل زمان اجرای عامل، تنظیمات محدود به
ارائه‌دهنده را ترجیح دهید:

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
جریان بدنه و مجموع زمان تا لغو واکشی محافظت‌شده. `params.keep_alive` در درخواست‌های
بومی `/api/chat` به‌صورت `keep_alive` در سطح بالای درخواست ارسال می‌شود؛ اگر زمان
بارگذاری نوبت نخست گلوگاه است، آن را برای هر مدل جداگانه تنظیم کنید.

### تأیید سریع

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

برای میزبان‌های راه‌دور، `127.0.0.1` را با میزبان `baseUrl` جایگزین کنید. اگر `curl`
کار می‌کند اما OpenClaw کار نمی‌کند، بررسی کنید آیا Gateway روی دستگاه، کانتینر یا
حساب سرویس دیگری اجرا می‌شود.

## جست‌وجوی وب Ollama

OpenClaw، **جست‌وجوی وب Ollama** را به‌عنوان ارائه‌دهندهٔ `web_search` همراه خود دارد.

| ویژگی       | جزئیات                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان      | در صورت تنظیم، `models.providers.ollama.baseUrl`؛ در غیر این صورت `http://127.0.0.1:11434`؛ نشانی `https://ollama.com` مستقیماً از API میزبانی‌شده استفاده می‌کند |
| احراز هویت  | برای میزبان محلی واردشده بدون کلید؛ `OLLAMA_API_KEY` یا احراز هویت پیکربندی‌شدهٔ ارائه‌دهنده برای جست‌وجوی مستقیم در `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت |
| الزام       | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد شده باشند؛ جست‌وجوی مستقیم میزبانی‌شده به `baseUrl: "https://ollama.com"` همراه با یک کلید API واقعی نیاز دارد |

آن را هنگام اجرای `openclaw onboard` یا `openclaw configure --section web` انتخاب کنید، یا تنظیم کنید:

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
را امتحان می‌کند و سپس به مسیر میزبانی‌شدهٔ `/api/web_search` روی همان میزبان برمی‌گردد؛
یک سرویس محلی واردشده معمولاً از طریق پراکسی محلی پاسخ می‌دهد. فراخوانی‌های مستقیم
`https://ollama.com` همیشه از نقطهٔ پایانی میزبانی‌شدهٔ `/api/web_search` استفاده می‌کنند.

<Note>
برای راه‌اندازی و رفتار کامل، به [جست‌وجوی وب Ollama](/fa/tools/ollama-search) مراجعه کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **فراخوانی ابزار در این حالت قابل‌اعتماد نیست.** فقط زمانی از آن استفاده کنید که یک پراکسی به قالب OpenAI نیاز دارد و به فراخوانی بومی ابزار وابسته نیستید.
    </Warning>

    برای پراکسی پشت `/v1/chat/completions`، مقدار `api: "openai-completions"` را
    صریحاً تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    این حالت ممکن است از جریان‌دهی و فراخوانی ابزار به‌طور هم‌زمان پشتیبانی نکند؛ شاید
    لازم باشد `params: { streaming: false }` را روی مدل تنظیم کنید.

    OpenClaw در این حالت به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama
    بی‌سروصدا به زمینهٔ ۴۰۹۶ توکنی برنگردد. اگر پراکسی شما فیلدهای ناشناختهٔ
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

  <Accordion title="Context windows">
    برای مدل‌های شناسایی‌شده به‌صورت خودکار، OpenClaw از پنجرهٔ زمینه‌ای استفاده می‌کند که
    `/api/show` گزارش می‌دهد؛ از جمله مقادیر بزرگ‌تر `PARAMETER num_ctx` در
    Modelfileهای سفارشی. در غیر این صورت، به پنجرهٔ زمینهٔ پیش‌فرض Ollama در OpenClaw
    برمی‌گردد.

    مقادیر `contextWindow`، `contextTokens` و `maxTokens` در سطح ارائه‌دهنده،
    پیش‌فرض‌های همهٔ مدل‌های زیر آن ارائه‌دهنده را تعیین می‌کنند و می‌توان آن‌ها را برای
    هر مدل بازنویسی کرد. `contextWindow` بودجهٔ اعلان/Compaction خود OpenClaw است.
    درخواست‌های بومی `/api/chat`، `options.num_ctx` را تنظیم‌نشده باقی می‌گذارند، مگر
    اینکه `params.num_ctx` را صریحاً تنظیم کنید؛ بنابراین Ollama پیش‌فرض خود مدل،
    `OLLAMA_CONTEXT_LENGTH` یا پیش‌فرض مبتنی بر VRAM را اعمال می‌کند. مقادیر نامعتبر،
    صفر، منفی یا نامتناهی `params.num_ctx` نادیده گرفته می‌شوند. اگر پیکربندی قدیمی فقط
    از `contextWindow`/`maxTokens` برای تحمیل زمینهٔ درخواست بومی استفاده می‌کرد،
    `openclaw doctor --fix` را اجرا کنید تا آن مقادیر در `params.num_ctx` کپی شوند.
    سازگارکنندهٔ سازگار با OpenAI همچنان به‌طور پیش‌فرض `options.num_ctx` را از
    `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر سامانهٔ بالادستی
    `options` را رد می‌کند، آن را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی همچنین گزینه‌های رایج زمان اجرای Ollama را زیر `params`
    می‌پذیرند که به‌عنوان `options` بومی `/api/chat` ارسال می‌شوند: `num_keep`، `seed`،
    `num_predict`، `top_k`، `top_p`، `min_p`، `typical_p`، `repeat_last_n`،
    `temperature`، `repeat_penalty`، `presence_penalty`، `frequency_penalty`،
    `stop`، `num_batch`، `num_gpu`، `main_gpu`، `use_mmap` و `num_thread`.
    چند کلید (`format`، `keep_alive`، `truncate`، `shift`) به‌جای `options` تو‌در‌تو،
    به‌عنوان فیلدهای سطح بالای درخواست ارسال می‌شوند. OpenClaw فقط این کلیدهای درخواست
    Ollama را ارسال می‌کند، بنابراین پارامترهای مختص زمان اجرا مانند `streaming` هرگز
    به Ollama فرستاده نمی‌شوند. برای تنظیم `think` در سطح بالا از `params.think`
    (یا `params.thinking`) استفاده کنید؛ مقدار `false` تفکر در سطح API را برای مدل‌های
    متفکر به سبک Qwen غیرفعال می‌کند.

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

    مقدار `agents.defaults.models["ollama/<model>"].params.num_ctx` برای هر مدل نیز
    کار می‌کند؛ اگر هر دو تنظیم شده باشند، ورودی صریح مدل در ارائه‌دهنده اولویت دارد.

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw تفکر را همان‌طور که Ollama انتظار دارد ارسال می‌کند: `think` در سطح بالا،
    نه `options.think`. مدل‌های شناسایی‌شده به‌صورت خودکار که `/api/show` برای آن‌ها
    قابلیت `thinking` را گزارش می‌دهد، گزینه‌های `/think low`، `/think medium`،
    `/think high` و `/think max` را ارائه می‌کنند؛ مدل‌های بدون قابلیت تفکر فقط
    `/think off` را ارائه می‌کنند.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    یا یک پیش‌فرض برای مدل تنظیم کنید:

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

    تنظیمات مختص هر مدل در `params.think`/`params.thinking` می‌تواند تفکر API را برای مدلی مشخص غیرفعال یا اجباری کند. OpenClaw هنگامی که اجرای فعال فقط مقدار پیش‌فرض ضمنی `off` را دارد، آن پیکربندی صریح را حفظ می‌کند؛ بااین‌حال، یک فرمان زمان اجرا با مقداری غیر از `off`، مانند `/think medium`، همچنان آن را لغو می‌کند. درخواست تفکری با مقدار درست هرگز به مدلی که صریحاً با `reasoning: false` علامت‌گذاری شده است ارسال نمی‌شود؛ درخواست `think: false` همیشه، صرف‌نظر از این تنظیم، ارسال می‌شود.

  </Accordion>

  <Accordion title="مدل‌های استدلالی">
    مدل‌هایی با نام `deepseek-r1`، `reasoning`، `reason` یا `think` به‌طور پیش‌فرض دارای قابلیت استدلال در نظر گرفته می‌شوند — نیازی به پیکربندی اضافی نیست:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="هزینه مدل‌ها">
    Ollama به‌صورت محلی اجرا می‌شود و رایگان است؛ بنابراین هزینه همه مدل‌ها، چه مدل‌های خودکار شناسایی‌شده و چه مدل‌های تعریف‌شده به‌صورت دستی، `0` است.
  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Plugin همراه Ollama، یک ارائه‌دهنده تعبیه حافظه را برای [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این ارائه‌دهنده از URL پایه و کلید API پیکربندی‌شده Ollama استفاده می‌کند، `/api/embed` را فراخوانی می‌کند و در صورت امکان چند قطعه حافظه را در یک درخواست `input` دسته‌بندی می‌کند.

    هنگامی که `proxy.enabled=true` باشد، درخواست‌های تعبیه به مبدأ دقیق local loopback میزبان که از `baseUrl` پیکربندی‌شده به دست آمده است، به‌جای پراکسی هدایت مدیریت‌شده از مسیر مستقیم محافظت‌شده OpenClaw استفاده می‌کنند. نام میزبان پیکربندی‌شده باید خودِ `localhost` یا یک نشانی IP صریح loopback باشد — نام‌های DNS که صرفاً به loopback تفکیک می‌شوند همچنان از مسیر پراکسی مدیریت‌شده استفاده می‌کنند. میزبان‌های Ollama در LAN، tailnet، شبکه خصوصی و عمومی همیشه در مسیر پراکسی مدیریت‌شده باقی می‌مانند و تغییر مسیر به میزبان/درگاهی دیگر، اعتماد را به ارث نمی‌برد. `proxy.loopbackMode: "proxy"` ترافیک loopback را در هر صورت از پراکسی عبور می‌دهد؛ `proxy.loopbackMode: "block"` پیش از اتصال آن را رد می‌کند — به [پراکسی مدیریت‌شده](/fa/security/network-proxy#gateway-loopback-mode) مراجعه کنید.

    | ویژگی | مقدار |
    | --- | --- |
    | مدل پیش‌فرض | `nomic-embed-text` |
    | دریافت خودکار | بله، اگر به‌صورت محلی موجود نباشد |
    | هم‌روندی درون‌خطی پیش‌فرض | ۱ (مقدار پیش‌فرض سایر ارائه‌دهندگان بیشتر است؛ اگر میزبان توان آن را دارد، با `nonBatchConcurrency` افزایش دهید) |

    تعبیه‌های زمان پرس‌وجو برای مدل‌هایی که پیشوندهای بازیابی را لازم می‌دانند یا توصیه می‌کنند، از این پیشوندها استفاده می‌کنند: `nomic-embed-text`، `qwen3-embedding` و `mxbai-embed-large`. دسته‌های سند بدون تغییر باقی می‌مانند؛ بنابراین نمایه‌های موجود به مهاجرت قالب نیاز ندارند.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    برای یک میزبان تعبیه راه‌دور، احراز هویت را به همان میزبان محدود نگه دارید:

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

  <Accordion title="پیکربندی پخش جریانی">
    Ollama به‌طور پیش‌فرض از **API بومی** (`/api/chat`) استفاده می‌کند که پخش جریانی و فراخوانی ابزار را هم‌زمان پشتیبانی می‌کند — نیازی به پیکربندی ویژه نیست.

    برای درخواست‌های بومی، کنترل تفکر مستقیماً ارسال می‌شود: `/think off` و `openclaw agent --thinking off` مقدار سطح بالای `think: false` را ارسال می‌کنند، مگر اینکه `params.think`/`params.thinking` به‌صراحت پیکربندی شده باشد؛ `/think low|medium|high` رشته میزان تلاش متناظر را ارسال می‌کند؛ `/think max` به بیشترین میزان تلاش Ollama، یعنی `think: "high"`، نگاشت می‌شود.

    <Tip>
    برای استفاده از نقطه پایانی سازگار با OpenAI، بخش «حالت قدیمی سازگار با OpenAI» در بالا را ببینید — ممکن است پخش جریانی و فراخوانی ابزار در آنجا هم‌زمان کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="چرخه خرابی WSL2 (راه‌اندازی‌های مجدد تکراری)">
    در WSL2 همراه با NVIDIA/CUDA، نصب‌کننده رسمی لینوکس Ollama یک واحد systemd با نام `ollama.service` و تنظیم `Restart=always` ایجاد می‌کند. اگر آن سرویس به‌صورت خودکار آغاز شود و هنگام راه‌اندازی WSL2 مدلی مبتنی بر GPU را بارگذاری کند، Ollama می‌تواند هنگام بارگذاری حافظه میزبان را درگیر نگه دارد؛ بازیابی حافظه Hyper-V همیشه نمی‌تواند آن صفحه‌ها را پس بگیرد، در نتیجه Windows ممکن است ماشین مجازی WSL2 را خاتمه دهد، systemd دوباره Ollama را راه‌اندازی کند و این چرخه تکرار شود.

    شواهد: راه‌اندازی مجدد/خاتمه مکرر WSL2، مصرف بالای CPU در `app.slice` یا `ollama.service` بلافاصله پس از آغاز WSL2 و دریافت SIGTERM از systemd به‌جای کشنده OOM لینوکس.

    هنگامی که OpenClaw وجود WSL2، فعال بودن `ollama.service` با `Restart=always` و نشانگرهای قابل‌مشاهده CUDA را تشخیص دهد، هنگام راه‌اندازی یک هشدار ثبت می‌کند.

    راهکار کاهش مشکل:

    ```bash
    sudo systemctl disable ollama
    ```

    در سمت Windows، این مورد را به `%USERPROFILE%\.wslconfig` اضافه کنید و سپس `wsl --shutdown` را اجرا کنید:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    یا زمان زنده‌ماندن را کوتاه کنید / Ollama را فقط هنگام نیاز به‌صورت دستی آغاز کنید:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    به [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) مراجعه کنید.

  </Accordion>

  <Accordion title="Ollama شناسایی نمی‌شود">
    تأیید کنید که Ollama در حال اجرا است، `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) تنظیم شده است و `models.providers.ollama` به‌صراحت تعریف **نشده** است:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    مدل را به‌صورت محلی دریافت کنید یا آن را به‌صراحت در `models.providers.ollama` تعریف کنید:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="اتصال رد شد">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="میزبان راه‌دور با curl کار می‌کند اما با OpenClaw نه">
    از همان ماشین و محیط اجرایی که Gateway را اجرا می‌کند، بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    علت‌های رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند و به‌جای رفتار بومی Ollama، رفتار سازگار با OpenAI را انتخاب می‌کند.
    - میزبان راه‌دور به تغییرات دیواره آتش یا اتصال LAN نیاز دارد.
    - مدل در سرویس پس‌زمینه لپ‌تاپ شما قرار دارد، نه در سرویس راه‌دور.

  </Accordion>

  <Accordion title="مدل، JSON ابزار را به‌شکل متن خروجی می‌دهد">
    معمولاً ارائه‌دهنده در حالت سازگار با OpenAI است یا مدل نمی‌تواند طرح‌واره‌های ابزار را پردازش کند. حالت بومی را ترجیح دهید:

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

    اگر یک مدل محلی کوچک همچنان در پردازش طرح‌واره‌های ابزار ناموفق است، برای ورودی آن مدل `compat.supportsTools: false` را تنظیم و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای ناخوانا برمی‌گرداند">
    پاسخ‌های میزبانی‌شده Kimi/GLM که شامل رشته‌های طولانی از نمادهای غیرزبانی هستند، به‌جای پاسخ موفق، فراخوانی ناموفق ارائه‌دهنده تلقی می‌شوند؛ در نتیجه، به‌جای ذخیره‌سازی متن خراب در نشست، روند عادی تلاش مجدد/جایگزینی/مدیریت خطا فعال می‌شود.

    اگر مشکل تکرار شد، نام مدل، فایل نشست فعلی و اینکه اجرا از `Cloud + Local` یا `Cloud only` استفاده کرده است ثبت کنید؛ سپس یک نشست تازه و یک مدل جایگزین را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="زمان مدل محلی سرد به پایان می‌رسد">
    مدل‌های محلی بزرگ ممکن است برای نخستین بارگذاری به زمان زیادی نیاز داشته باشند. مهلت زمانی را به ارائه‌دهنده Ollama محدود کنید و در صورت تمایل، مدل را بین نوبت‌ها در حالت بارگذاری‌شده نگه دارید:

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

    اگر خود میزبان نیز اتصال‌ها را به‌کندی می‌پذیرد، `timeoutSeconds` مهلت زمانی محافظت‌شده اتصال را نیز برای این ارائه‌دهنده افزایش می‌دهد.

  </Accordion>

  <Accordion title="مدل با بافت بزرگ بیش‌ازحد کند است یا با کمبود حافظه مواجه می‌شود">
    بسیاری از مدل‌ها اندازه بافتی بزرگ‌تر از آنچه سخت‌افزار شما می‌تواند به‌راحتی اجرا کند اعلام می‌کنند. Ollama بومی از مقدار پیش‌فرض محیط اجرایی خود استفاده می‌کند، مگر اینکه `params.num_ctx` تنظیم شده باشد. برای دستیابی به تأخیر قابل‌پیش‌بینی تا نخستین توکن، هم بودجه OpenClaw و هم بافت درخواست Ollama را محدود کنید:

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

    اگر OpenClaw پرامپت بیش‌ازحد بزرگی ارسال می‌کند، `contextWindow` را کاهش دهید. اگر بافت محیط اجرایی Ollama برای ماشین بیش‌ازحد بزرگ است، `params.num_ctx` را کاهش دهید. اگر تولید خروجی بیش‌ازحد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/fa/providers/ollama-cloud" icon="cloud">
    راه‌اندازی صرفاً ابری با ارائه‌دهنده اختصاصی `ollama-cloud`.
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
