---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید.
    - به راهنمای راه‌اندازی و پیکربندی Ollama نیاز دارید
    - شما برای درک تصویر به مدل‌های بینایی Ollama نیاز دارید
summary: اجرای OpenClaw با Ollama (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:49:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw با API بومی Ollama (`/api/chat`) برای مدل‌های ابری میزبانی‌شده و سرورهای محلی/خودمیزبان Ollama یکپارچه می‌شود. می‌توانید از Ollama در سه حالت استفاده کنید: `Cloud + Local` از طریق یک میزبان Ollama قابل دسترس، `Cloud only` در برابر `https://ollama.com`، یا `Local only` در برابر یک میزبان Ollama قابل دسترس.

OpenClaw همچنین `ollama-cloud` را به‌عنوان شناسه ارائه‌دهنده میزبانی‌شده درجه‌اول برای
استفاده مستقیم از Ollama Cloud ثبت می‌کند. وقتی مسیریابی فقط ابری می‌خواهید
بدون اینکه شناسه ارائه‌دهنده محلی `ollama` را به اشتراک بگذارید، از ارجاع‌هایی مانند `ollama-cloud/kimi-k2.5:cloud` استفاده کنید.

برای صفحه راه‌اندازی اختصاصی فقط ابری، [Ollama Cloud](/fa/providers/ollama-cloud) را ببینید.

<Warning>
**کاربران Ollama راه دور**: از URL سازگار با OpenAI مربوط به `/v1` (`http://host:11434/v1`) با OpenClaw استفاده نکنید. این کار فراخوانی ابزار را خراب می‌کند و مدل‌ها ممکن است JSON خام ابزار را به‌صورت متن ساده خروجی بدهند. به‌جای آن از URL API بومی Ollama استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

پیکربندی ارائه‌دهنده Ollama از `baseUrl` به‌عنوان کلید معیار استفاده می‌کند. OpenClaw برای سازگاری با نمونه‌های سبک OpenAI SDK، `baseURL` را نیز می‌پذیرد، اما پیکربندی جدید باید `baseUrl` را ترجیح دهد.

## قواعد احراز هویت

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    میزبان‌های محلی و LAN مربوط به Ollama به توکن bearer واقعی نیاز ندارند. OpenClaw نشانگر محلی `ollama-local` را فقط برای loopback، شبکه خصوصی، `.local`، و URLهای پایه Ollama با نام میزبان ساده استفاده می‌کند.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    میزبان‌های عمومی راه دور و Ollama Cloud (`https://ollama.com`) از طریق `OLLAMA_API_KEY`، یک نمایه احراز هویت، یا `apiKey` ارائه‌دهنده به یک اعتبارنامه واقعی نیاز دارند. برای استفاده میزبانی‌شده مستقیم، ارائه‌دهنده `ollama-cloud` را ترجیح دهید.
  </Accordion>
  <Accordion title="Custom provider ids">
    شناسه‌های ارائه‌دهنده سفارشی که `api: "ollama"` را تنظیم می‌کنند، از همان قواعد پیروی می‌کنند. برای نمونه، یک ارائه‌دهنده `ollama-remote` که به یک میزبان Ollama در LAN خصوصی اشاره می‌کند، می‌تواند از `apiKey: "ollama-local"` استفاده کند و زیرفرستاده‌ها آن نشانگر را از طریق هوک ارائه‌دهنده Ollama حل می‌کنند، به‌جای اینکه آن را اعتبارنامه گم‌شده تلقی کنند. جست‌وجوی حافظه نیز می‌تواند `agents.defaults.memorySearch.provider` را روی آن شناسه ارائه‌دهنده سفارشی تنظیم کند تا embeddingها از نقطه پایانی Ollama متناظر استفاده کنند.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` اعتبارنامه را برای یک شناسه ارائه‌دهنده ذخیره می‌کند. تنظیمات نقطه پایانی (`baseUrl`، `api`، شناسه‌های مدل، سرآیندها، زمان‌انتظارها) را در `models.providers.<id>` قرار دهید. فایل‌های قدیمی نمایه احراز هویت تخت مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها با تهیه نسخه پشتیبان، به نمایه کلید API معیار `ollama-windows:default` بازنویسی شوند. `baseUrl` در آن فایل نویز سازگاری است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="Memory embedding scope">
    وقتی Ollama برای embeddingهای حافظه استفاده می‌شود، احراز هویت bearer به میزبانی محدود می‌شود که در آن اعلام شده است:

    - یک کلید در سطح ارائه‌دهنده فقط به میزبان Ollama همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان embedding راه دور خودش ارسال می‌شود.
    - مقدار env خالص `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud در نظر گرفته می‌شود و به‌طور پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع به کار

روش و حالت راه‌اندازی موردنظر خود را انتخاب کنید.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **بهترین برای:** سریع‌ترین مسیر به یک راه‌اندازی ابری یا محلی کارآمد Ollama.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        از فهرست ارائه‌دهنده‌ها **Ollama** را انتخاب کنید.
      </Step>
      <Step title="Choose your mode">
        - **ابری + محلی** — میزبان محلی Ollama به‌همراه مدل‌های ابری که از طریق آن میزبان مسیریابی می‌شوند
        - **فقط ابری** — مدل‌های میزبانی‌شده Ollama از طریق `https://ollama.com`
        - **فقط محلی** — فقط مدل‌های محلی

      </Step>
      <Step title="Select a model">
        `Cloud only` برای `OLLAMA_API_KEY` درخواست می‌دهد و پیش‌فرض‌های ابری میزبانی‌شده را پیشنهاد می‌کند. `Cloud + Local` و `Local only` یک URL پایه Ollama می‌خواهند، مدل‌های موجود را کشف می‌کنند، و اگر مدل محلی انتخاب‌شده هنوز موجود نباشد آن را به‌صورت خودکار pull می‌کنند. وقتی Ollama یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` گزارش می‌کند، راه‌اندازی آن مدل نصب‌شده را یک‌بار نشان می‌دهد، به‌جای اینکه هم `gemma4` و هم `gemma4:latest` را نشان دهد یا alias ساده را دوباره pull کند. `Cloud + Local` همچنین بررسی می‌کند آیا آن میزبان Ollama برای دسترسی ابری وارد حساب شده است یا نه.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### حالت غیرتعاملی

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    در صورت تمایل یک URL پایه یا مدل سفارشی مشخص کنید:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **بهترین برای:** کنترل کامل روی راه‌اندازی ابری یا محلی.

    <Steps>
      <Step title="Choose cloud or local">
        - **ابری + محلی**: Ollama را نصب کنید، با `ollama signin` وارد شوید، و درخواست‌های ابری را از طریق آن میزبان مسیریابی کنید
        - **فقط ابری**: از `https://ollama.com` با یک `OLLAMA_API_KEY` استفاده کنید
        - **فقط محلی**: Ollama را از [ollama.com/download](https://ollama.com/download) نصب کنید

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        برای `Cloud only` از `OLLAMA_API_KEY` واقعی خود استفاده کنید. برای راه‌اندازی‌های متکی به میزبان، هر مقدار placeholder کار می‌کند:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        یا پیش‌فرض را در پیکربندی تنظیم کنید:

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

## مدل‌های ابری

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` از یک میزبان Ollama قابل دسترس به‌عنوان نقطه کنترل برای مدل‌های محلی و ابری استفاده می‌کند. این جریان ترکیبی ترجیحی Ollama است.

    در هنگام راه‌اندازی از **ابری + محلی** استفاده کنید. OpenClaw برای URL پایه Ollama درخواست می‌دهد، مدل‌های محلی را از آن میزبان کشف می‌کند، و بررسی می‌کند آیا میزبان با `ollama signin` برای دسترسی ابری وارد حساب شده است یا نه. وقتی میزبان وارد حساب شده باشد، OpenClaw همچنین پیش‌فرض‌های ابری میزبانی‌شده مانند `kimi-k2.5:cloud`، `minimax-m2.7:cloud`، و `glm-5.1:cloud` را پیشنهاد می‌کند.

    اگر میزبان هنوز وارد حساب نشده باشد، OpenClaw راه‌اندازی را تا زمانی که `ollama signin` را اجرا کنید فقط محلی نگه می‌دارد.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` در برابر API میزبانی‌شده Ollama در `https://ollama.com` اجرا می‌شود.

    در هنگام راه‌اندازی از **فقط ابری** استفاده کنید. OpenClaw برای `OLLAMA_API_KEY` درخواست می‌دهد، `baseUrl: "https://ollama.com"` را تنظیم می‌کند، و فهرست مدل‌های ابری میزبانی‌شده را seed می‌کند. این مسیر به سرور محلی Ollama یا `ollama signin` نیاز ندارد.

    فهرست مدل‌های ابری که هنگام `openclaw onboard` نشان داده می‌شود، به‌صورت زنده از `https://ollama.com/api/tags` پر می‌شود و به ۵۰۰ ورودی محدود است؛ بنابراین انتخابگر به‌جای یک seed ایستا، کاتالوگ میزبانی‌شده فعلی را بازتاب می‌دهد. اگر `ollama.com` در زمان راه‌اندازی در دسترس نباشد یا هیچ مدلی برنگرداند، OpenClaw به پیشنهادهای hardcoded قبلی برمی‌گردد تا onboarding همچنان کامل شود.

    همچنین می‌توانید ارائه‌دهنده ابری درجه‌اول را مستقیم پیکربندی کنید:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    در حالت فقط محلی، OpenClaw مدل‌ها را از نمونه پیکربندی‌شده Ollama کشف می‌کند. این مسیر برای سرورهای محلی یا خودمیزبان Ollama است.

    OpenClaw در حال حاضر `gemma4` را به‌عنوان پیش‌فرض محلی پیشنهاد می‌کند.

  </Tab>
</Tabs>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) را تنظیم می‌کنید و `models.providers.ollama` یا ارائه‌دهنده راه دور سفارشی دیگری با `api: "ollama"` تعریف نمی‌کنید، OpenClaw مدل‌ها را از نمونه محلی Ollama در `http://127.0.0.1:11434` کشف می‌کند.

| رفتار             | جزئیات                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| پرس‌وجوی کاتالوگ        | از `/api/tags` پرس‌وجو می‌کند                                                                                                                                                  |
| تشخیص قابلیت | از lookupهای best-effort مربوط به `/api/show` برای خواندن `contextWindow`، پارامترهای Modelfile گسترش‌یافته `num_ctx`، و قابلیت‌هایی از جمله vision/tools استفاده می‌کند                       |
| مدل‌های بینایی        | مدل‌هایی با قابلیت `vision` گزارش‌شده توسط `/api/show` به‌عنوان دارای قابلیت تصویر علامت‌گذاری می‌شوند (`input: ["text", "image"]`)، بنابراین OpenClaw تصاویر را به‌صورت خودکار در prompt تزریق می‌کند  |
| تشخیص استدلال  | وقتی موجود باشد از قابلیت‌های `/api/show`، از جمله `thinking`، استفاده می‌کند؛ وقتی Ollama قابلیت‌ها را حذف کند، به یک heuristic مبتنی بر نام مدل (`r1`، `reasoning`، `think`) برمی‌گردد |
| محدودیت‌های توکن         | `maxTokens` را روی سقف پیش‌فرض حداکثر توکن Ollama که OpenClaw استفاده می‌کند تنظیم می‌کند                                                                                                |
| هزینه‌ها                | همه هزینه‌ها را روی `0` تنظیم می‌کند                                                                                                                                                |

این کار از ورودی‌های دستی مدل جلوگیری می‌کند، درحالی‌که کاتالوگ را با نمونه محلی Ollama همسو نگه می‌دارد. می‌توانید در `infer model run` محلی از یک ارجاع کامل مانند `ollama/<pulled-model>:latest` استفاده کنید؛ OpenClaw آن مدل نصب‌شده را از کاتالوگ زنده Ollama حل می‌کند، بدون اینکه به ورودی دستی `models.json` نیاز داشته باشد.

برای میزبان‌های Ollama واردشده به حساب، برخی مدل‌های `:cloud` ممکن است از طریق `/api/chat`
و `/api/show` قابل استفاده باشند، پیش از آنکه در `/api/tags` ظاهر شوند. وقتی به‌صراحت یک
ارجاع کامل `ollama/<model>:cloud` را انتخاب می‌کنید، OpenClaw همان مدل گم‌شده دقیق را با
`/api/show` اعتبارسنجی می‌کند و فقط اگر Ollama فراداده مدل را تأیید کند، آن را به کاتالوگ زمان اجرا
اضافه می‌کند. خطاهای تایپی همچنان به‌عنوان مدل‌های ناشناخته شکست می‌خورند، نه اینکه به‌صورت خودکار ساخته شوند.

```bash
# See what models are available
ollama list
openclaw models list
```

برای یک smoke test محدود تولید متن که از سطح کامل ابزار فرستاده پرهیز می‌کند،
از `infer model run` محلی با یک ارجاع کامل مدل Ollama استفاده کنید:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

آن مسیر همچنان از ارائه‌دهنده، احراز هویت، و انتقال بومی Ollama پیکربندی‌شده OpenClaw
استفاده می‌کند، اما یک نوبت chat-agent را شروع نمی‌کند یا زمینه MCP/ابزار را بارگذاری نمی‌کند. اگر
این موفق شود اما پاسخ‌های عادی فرستاده شکست بخورند، در گام بعد ظرفیت prompt/ابزار فرستاده مدل را
عیب‌یابی کنید.

برای یک smoke test محدود مدل بینایی روی همان مسیر سبک، یک یا چند
فایل تصویر به `infer model run` اضافه کنید. این کار prompt و تصویر را مستقیم به
مدل بینایی Ollama انتخاب‌شده می‌فرستد، بدون اینکه ابزارهای چت، حافظه، یا زمینه
جلسه قبلی را بارگذاری کند:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` فایل‌هایی را که به‌صورت `image/*` شناسایی می‌شوند، از جمله ورودی‌های رایج PNG،
JPEG، و WebP می‌پذیرد. فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند.
برای تشخیص گفتار، به‌جای آن از `openclaw infer audio transcribe` استفاده کنید.

وقتی یک گفت‌وگو را با `/model ollama/<model>` تغییر می‌دهید، OpenClaw آن را
به‌عنوان انتخاب دقیق کاربر در نظر می‌گیرد. اگر `baseUrl` پیکربندی‌شده Ollama
در دسترس نباشد، پاسخ بعدی با خطای ارائه‌دهنده شکست می‌خورد، به‌جای اینکه بی‌صدا
از یک مدل fallback پیکربندی‌شده دیگر پاسخ دهد.

کارهای cron ایزوله پیش از شروع نوبت agent یک بررسی ایمنی محلی اضافی انجام می‌دهند.
اگر مدل انتخاب‌شده به یک ارائه‌دهنده Ollama محلی، شبکه خصوصی، یا `.local`
resolve شود و `/api/tags` در دسترس نباشد، OpenClaw آن اجرای cron را با وضعیت
`skipped` و همراه با `ollama/<model>` انتخاب‌شده در متن خطا ثبت می‌کند. پیش‌بررسی
endpoint به‌مدت ۵ دقیقه cache می‌شود، بنابراین چندین کار cron که به همان daemon
متوقف‌شده Ollama اشاره می‌کنند همگی درخواست‌های مدل ناموفق را اجرا نمی‌کنند.

مسیر متن محلی، مسیر stream بومی، و embeddings را در برابر Ollama محلی به‌صورت زنده تأیید کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای smoke testهای کلید API در Ollama Cloud، آزمون زنده را به `https://ollama.com`
اشاره دهید و یک مدل hosted از کاتالوگ فعلی انتخاب کنید:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

smoke ابری متن، stream بومی، و جست‌وجوی وب را اجرا می‌کند. به‌صورت پیش‌فرض برای
`https://ollama.com` از embeddings صرف‌نظر می‌کند، چون کلیدهای API در Ollama Cloud ممکن است
مجوز استفاده از `/api/embed` را نداشته باشند. وقتی صریحاً می‌خواهید آزمون زنده
در صورت ناتوانی کلید ابری پیکربندی‌شده از استفاده از endpoint embed شکست بخورد،
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` را تنظیم کنید.

برای افزودن یک مدل جدید، کافی است آن را با Ollama pull کنید:

```bash
ollama pull mistral
```

مدل جدید به‌صورت خودکار کشف می‌شود و برای استفاده در دسترس خواهد بود.

<Note>
اگر `models.providers.ollama` را صریحاً تنظیم کنید، یا یک ارائه‌دهنده remote سفارشی مانند `models.providers.ollama-cloud` را با `api: "ollama"` پیکربندی کنید، کشف خودکار نادیده گرفته می‌شود و باید مدل‌ها را دستی تعریف کنید. ارائه‌دهنده‌های سفارشی loopback مانند `http://127.0.0.2:11434` همچنان محلی در نظر گرفته می‌شوند. بخش پیکربندی صریح زیر را ببینید.
</Note>

## استنتاج محلی در Node

Agentها می‌توانند یک کار کوتاه را به یک مدل Ollama نصب‌شده روی یک desktop یا server node
جفت‌شده واگذار کنند. prompt و پاسخ از اتصال احراز هویت‌شده موجود Gateway/node عبور می‌کنند؛
درخواست مدل روی node انتخاب‌شده و در برابر endpoint استاندارد loopback آن برای Ollama
(`http://127.0.0.1:11434`) اجرا می‌شود.

<Steps>
  <Step title="Ollama را روی node شروع کنید">
    دست‌کم یک مدل chat را pull کنید و Ollama را در حال اجرا نگه دارید:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="میزبان node را متصل کنید">
    روی همان ماشینی که Ollama اجرا می‌شود، یک میزبان node را به Gateway متصل کنید:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    دستگاه جدید و فرمان‌های node اعلام‌شده آن را روی میزبان Gateway تأیید کنید،
    سپس node را بررسی کنید:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    هم اتصال نخست و هم ارتقایی که فرمان‌های Ollama را اضافه می‌کند می‌توانند
    تأیید فرمان node را trigger کنند. اگر node بدون اعلام
    `ollama.models` و `ollama.chat` متصل شد، دوباره `openclaw nodes pending` را بررسی کنید.

  </Step>
  <Step title="از یک agent بخواهید از استنتاج محلی استفاده کند">
    Plugin همراه Ollama ابزار `node_inference` را ارائه می‌کند. Agentها ابتدا
    از `action: "discover"` استفاده می‌کنند، سپس با یک node و مدل بازگردانده‌شده
    از `action: "run"` استفاده می‌کنند. اگر دقیقاً یک node توانمند متصل باشد، `run` می‌تواند node را حذف کند.

    برای مثال: «مدل‌های Ollama روی nodeهای من را کشف کن، سپس از سریع‌ترین
    مدل بارگذاری‌شده برای خلاصه کردن این متن استفاده کن.»

  </Step>
</Steps>

کشف، `/api/tags` را می‌خواند، قابلیت‌های `/api/show` را بررسی می‌کند، و در صورت
دسترس بودن از `/api/ps` استفاده می‌کند تا مدل‌های ازپیش‌بارگذاری‌شده را اولویت دهد.
فقط مدل‌های chat-capable محلی را برمی‌گرداند: ردیف‌های Ollama Cloud و مدل‌های فقط embedding
حذف می‌شوند. هر اجرا از Ollama می‌خواهد thinking مدل را غیرفعال کند و خروجی را به ۵۱۲ token
محدود می‌کند، مگر اینکه فراخوانی ابزار مقدار متفاوتی برای `maxTokens` درخواست کند. برخی مدل‌ها،
مانند GPT-OSS، از غیرفعال کردن thinking پشتیبانی نمی‌کنند و ممکن است همچنان از reasoning tokens استفاده کنند.

برای اینکه Ollama روی یک node در حال اجرا بماند بدون اینکه برای agentها در دسترس باشد، مورد زیر را
در config مورد استفاده آن میزبان node تنظیم کنید:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

اگر node از فرمان foreground `openclaw node run` در setup بالا استفاده می‌کند،
آن فرایند را متوقف کنید و فرمان را دوباره اجرا کنید. اگر از یک سرویس node نصب‌شده استفاده می‌کند،
`openclaw node restart` را اجرا کنید.

node دیگر `ollama.models` و `ollama.chat` را اعلام نمی‌کند؛ خود Ollama و
ارائه‌دهنده Ollama در Gateway بدون تغییر می‌مانند. مقدار را به `true` تنظیم کنید و
node را restart کنید تا استنتاج محلی دوباره اعلام شود. سطح فرمان تغییرکرده
ممکن است پس از اتصال دوباره نیاز به تأیید از طریق `openclaw nodes pending` داشته باشد.

می‌توانید همان فرمان‌های node را بدون نوبت agent بررسی کنید:

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

استنتاج محلی در Node عمداً از `models.providers.ollama.baseUrl` remote یا ابری
دوباره استفاده نمی‌کند. Ollama را روی endpoint استاندارد loopback node شروع کنید.
فرمان‌های node به‌صورت پیش‌فرض روی میزبان‌های node در macOS، Linux، و
Windows در دسترس هستند و همچنان مشمول سیاست عادی جفت‌سازی node و فرمان می‌مانند.

## بینایی و توضیح تصویر

Plugin همراه Ollama، Ollama را به‌عنوان یک ارائه‌دهنده درک رسانه با قابلیت تصویر ثبت می‌کند. این امکان را به OpenClaw می‌دهد که درخواست‌های صریح توضیح تصویر و پیش‌فرض‌های image-model پیکربندی‌شده را از طریق مدل‌های vision محلی یا hosted در Ollama مسیریابی کند.

برای vision محلی، مدلی را pull کنید که از تصویر پشتیبانی می‌کند:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

سپس با infer CLI تأیید کنید:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` باید یک ref کامل `<provider/model>` باشد. وقتی تنظیم شده باشد، `openclaw infer image describe` ابتدا آن مدل را امتحان می‌کند، به‌جای اینکه به‌دلیل پشتیبانی مدل از vision بومی از توضیح صرف‌نظر کند. اگر فراخوانی مدل شکست بخورد، OpenClaw می‌تواند از طریق `agents.defaults.imageModel.fallbacks` پیکربندی‌شده ادامه دهد؛ خطاهای آماده‌سازی فایل یا URL همچنان پیش از تلاش‌های fallback شکست می‌خورند.

وقتی جریان ارائه‌دهنده درک تصویر OpenClaw، `agents.defaults.imageModel` پیکربندی‌شده، و شکل خروجی توضیح تصویر را می‌خواهید، از `infer image describe` استفاده کنید. وقتی یک probe خام مدل چندوجهی با prompt سفارشی و یک یا چند تصویر می‌خواهید، از `infer model run --file` استفاده کنید.

برای اینکه Ollama مدل پیش‌فرض درک تصویر برای رسانه ورودی باشد، `agents.defaults.imageModel` را پیکربندی کنید:

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

ref کامل `ollama/<model>` را ترجیح دهید. اگر همان مدل زیر `models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهنده تصویر پیکربندی‌شده دیگری آن شناسه مدل bare را ارائه نکند، OpenClaw یک ref bare در `imageModel` مانند `qwen2.5vl:7b` را نیز به `ollama/qwen2.5vl:7b` normalize می‌کند. اگر بیش از یک ارائه‌دهنده تصویر پیکربندی‌شده همان bare ID را داشته باشد، پیشوند ارائه‌دهنده را صریحاً استفاده کنید.

مدل‌های vision محلی کند ممکن است به timeout طولانی‌تری برای درک تصویر نسبت به مدل‌های ابری نیاز داشته باشند. همچنین ممکن است وقتی Ollama تلاش می‌کند context کامل vision اعلام‌شده را روی سخت‌افزار محدود تخصیص دهد crash کنند یا متوقف شوند. یک capability timeout تنظیم کنید و وقتی فقط یک نوبت عادی توضیح تصویر نیاز دارید، `num_ctx` را روی entry مدل محدود کنید:

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

این timeout برای درک تصویر ورودی و ابزار صریح `image` که agent می‌تواند در طول یک نوبت فراخوانی کند اعمال می‌شود. `models.providers.ollama.timeoutSeconds` در سطح ارائه‌دهنده همچنان guard درخواست HTTP زیرین Ollama را برای فراخوانی‌های عادی مدل کنترل می‌کند.

ابزار تصویر صریح را در برابر Ollama محلی به‌صورت زنده تأیید کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را دستی تعریف می‌کنید، مدل‌های vision را با پشتیبانی ورودی تصویر علامت‌گذاری کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توضیح تصویر را برای مدل‌هایی که image-capable علامت‌گذاری نشده‌اند رد می‌کند. با کشف ضمنی، OpenClaw این را زمانی از Ollama می‌خواند که `/api/show` قابلیت vision را گزارش کند.

## پیکربندی

<Tabs>
  <Tab title="پایه (کشف ضمنی)">
    ساده‌ترین مسیر فعال‌سازی فقط محلی از طریق متغیر محیطی است:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در entry ارائه‌دهنده حذف کنید و OpenClaw آن را برای بررسی‌های availability پر می‌کند.
    </Tip>

  </Tab>

  <Tab title="صریح (مدل‌های دستی)">
    وقتی setup ابری hosted می‌خواهید، Ollama روی host/port دیگری اجرا می‌شود، می‌خواهید context windowها یا فهرست مدل‌های خاصی را اجبار کنید، یا تعریف مدل‌های کاملاً دستی می‌خواهید، از config صریح استفاده کنید.

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

  <Tab title="URL پایه سفارشی">
    اگر Ollama روی host یا port متفاوتی اجرا می‌شود (config صریح کشف خودکار را غیرفعال می‌کند، بنابراین مدل‌ها را دستی تعریف کنید):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    `/v1` را به URL اضافه نکنید. مسیر `/v1` از حالت سازگار با OpenAI استفاده می‌کند، جایی که tool calling قابل‌اعتماد نیست. از URL پایه Ollama بدون پسوند مسیر استفاده کنید.
    </Warning>

  </Tab>
</Tabs>

## دستورکارهای رایج

از این‌ها به‌عنوان نقطه شروع استفاده کنید و شناسه‌های مدل را با نام‌های دقیق خروجی `ollama list` یا `openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="مدل محلی با کشف خودکار">
    زمانی از این استفاده کنید که Ollama روی همان ماشینی اجرا می‌شود که Gateway روی آن است و می‌خواهید OpenClaw مدل‌های نصب‌شده را به‌طور خودکار کشف کند.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    این مسیر پیکربندی را حداقلی نگه می‌دارد. مگر اینکه بخواهید مدل‌ها را دستی تعریف کنید، بلوک `models.providers.ollama` اضافه نکنید.

  </Accordion>

  <Accordion title="میزبان Ollama روی LAN با مدل‌های دستی">
    برای میزبان‌های LAN از URLهای بومی Ollama استفاده کنید. `/v1` اضافه نکنید.

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

    `contextWindow` بودجه زمینه در سمت OpenClaw است. `params.num_ctx` برای درخواست به Ollama فرستاده می‌شود. وقتی سخت‌افزار شما نمی‌تواند زمینه کامل اعلام‌شده مدل را اجرا کند، این دو را هم‌راستا نگه دارید.

  </Accordion>

  <Accordion title="فقط Ollama Cloud">
    وقتی daemon محلی اجرا نمی‌کنید و مدل‌های میزبانی‌شده Ollama را مستقیماً می‌خواهید، از این استفاده کنید.

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

  </Accordion>

  <Accordion title="ابر به‌همراه محلی از طریق daemon واردشده">
    وقتی یک daemon محلی یا LAN مربوط به Ollama با `ollama signin` وارد شده است و باید هم مدل‌های محلی و هم مدل‌های `:cloud` را سرو کند، از این استفاده کنید.

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
    وقتی بیش از یک سرور Ollama دارید، از شناسه‌های provider سفارشی استفاده کنید. هر provider میزبان، مدل‌ها، احراز هویت، timeout و ارجاع‌های مدل خودش را دارد.

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

    وقتی OpenClaw درخواست را می‌فرستد، پیشوند provider فعال حذف می‌شود تا `ollama-large/qwen3.5:27b` به‌شکل `qwen3.5:27b` به Ollama برسد.

  </Accordion>

  <Accordion title="پروفایل مدل محلی سبک">
    برخی مدل‌های محلی می‌توانند به promptهای ساده پاسخ دهند، اما با سطح کامل ابزارهای agent مشکل دارند. پیش از تغییر تنظیمات سراسری runtime، ابتدا ابزارها و زمینه را محدود کنید.

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

    فقط زمانی از `compat.supportsTools: false` استفاده کنید که مدل یا سرور به‌طور قابل اتکا روی schemaهای ابزار شکست می‌خورد. این کار قابلیت agent را با پایداری معاوضه می‌کند.
    `localModelLean` ابزارهای مرورگر، cron و پیام را از سطح مستقیم agent حذف می‌کند و catalogهای بزرگ‌تر را به‌جز زمانی که یک اجرا باید معناشناسی تحویل مستقیم پیام را حفظ کند، پشت کنترل‌های ساختاریافته Tool Search پیش‌فرض می‌برد؛ اما زمینه runtime یا حالت thinking مربوط به Ollama را تغییر نمی‌دهد. برای مدل‌های thinking کوچک به سبک Qwen که در loop می‌افتند یا بودجه پاسخ خود را صرف reasoning پنهان می‌کنند، آن را با `params.num_ctx` صریح و `params.thinking: false` همراه کنید.

  </Accordion>
</AccordionGroup>

### انتخاب مدل

پس از پیکربندی، همه مدل‌های Ollama شما در دسترس هستند:

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

شناسه‌های provider سفارشی Ollama نیز پشتیبانی می‌شوند. وقتی یک ارجاع مدل از
پیشوند provider فعال استفاده می‌کند، مانند `ollama-spark/qwen3:32b`، OpenClaw فقط همان
پیشوند را پیش از فراخوانی Ollama حذف می‌کند تا سرور `qwen3:32b` را دریافت کند.

برای مدل‌های محلی کند، پیش از افزایش timeout کل runtime مربوط به agent،
تنظیم درخواست در محدوده provider را ترجیح دهید:

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

`timeoutSeconds` روی درخواست HTTP مدل اعمال می‌شود، شامل راه‌اندازی اتصال،
headerها، streaming بدنه، و کل abort مربوط به guarded-fetch. `params.keep_alive`
در درخواست‌های بومی `/api/chat` به‌عنوان `keep_alive` سطح بالا به Ollama فرستاده می‌شود؛
وقتی زمان بارگذاری نوبت اول گلوگاه است، آن را برای هر مدل تنظیم کنید.

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

برای میزبان‌های راه‌دور، `127.0.0.1` را با میزبان استفاده‌شده در `baseUrl` جایگزین کنید. اگر `curl` کار می‌کند اما OpenClaw نه، بررسی کنید که آیا Gateway روی ماشین، container یا حساب سرویس دیگری اجرا می‌شود یا نه.

## Ollama Web Search

OpenClaw از **Ollama Web Search** به‌عنوان provider همراه `web_search` پشتیبانی می‌کند.

| ویژگی | جزئیات |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان | از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند (`models.providers.ollama.baseUrl` وقتی تنظیم شده باشد، وگرنه `http://127.0.0.1:11434`)؛ `https://ollama.com` مستقیماً از API میزبانی‌شده استفاده می‌کند |
| احراز هویت | برای میزبان‌های محلی Ollama که وارد شده‌اند بدون کلید است؛ برای جست‌وجوی مستقیم `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت، `OLLAMA_API_KEY` یا احراز هویت provider پیکربندی‌شده استفاده می‌شود |
| الزام | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد شده باشند؛ جست‌وجوی میزبانی‌شده مستقیم به `baseUrl: "https://ollama.com"` به‌همراه یک کلید API واقعی Ollama نیاز دارد |

در طول `openclaw onboard` یا `openclaw configure --section web`، **Ollama Web Search** را انتخاب کنید، یا تنظیم کنید:

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

برای جست‌وجوی میزبانی‌شده مستقیم از طریق Ollama Cloud:

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

برای daemon محلی واردشده، OpenClaw از proxy مربوط به `/api/experimental/web_search` همان daemon استفاده می‌کند. برای `https://ollama.com`، endpoint میزبانی‌شده `/api/web_search` را مستقیماً فراخوانی می‌کند.

<Note>
برای جزئیات کامل راه‌اندازی و رفتار، [Ollama Web Search](/fa/tools/ollama-search) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت قدیمی سازگار با OpenAI">
    <Warning>
    **فراخوانی ابزار در حالت سازگار با OpenAI قابل اتکا نیست.** فقط زمانی از این حالت استفاده کنید که برای یک proxy به قالب OpenAI نیاز دارید و به رفتار بومی فراخوانی ابزار وابسته نیستید.
    </Warning>

    اگر لازم است به‌جای آن از endpoint سازگار با OpenAI استفاده کنید (برای مثال پشت proxy که فقط از قالب OpenAI پشتیبانی می‌کند)، `api: "openai-completions"` را صریحاً تنظیم کنید:

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

    این حالت ممکن است هم‌زمان از streaming و فراخوانی ابزار پشتیبانی نکند. شاید لازم باشد streaming را با `params: { streaming: false }` در پیکربندی مدل غیرفعال کنید.

    وقتی `api: "openai-completions"` با Ollama استفاده می‌شود، OpenClaw به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama بی‌سروصدا به پنجره زمینه 4096 برنگردد. اگر proxy/upstream شما فیلدهای ناشناخته `options` را رد می‌کند، این رفتار را غیرفعال کنید:

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
    برای مدل‌های کشف‌شده به‌صورت خودکار، OpenClaw در صورت موجود بودن از پنجره زمینه گزارش‌شده توسط Ollama استفاده می‌کند، از جمله مقادیر بزرگ‌تر `PARAMETER num_ctx` از Modelfileهای سفارشی. در غیر این صورت به پنجره زمینه پیش‌فرض Ollama که OpenClaw استفاده می‌کند برمی‌گردد.

    می‌توانید پیش‌فرض‌های سطح ارائه‌دهنده‌ی `contextWindow`، `contextTokens` و `maxTokens` را برای هر مدل زیر آن ارائه‌دهنده‌ی Ollama تنظیم کنید، سپس در صورت نیاز آن‌ها را برای هر مدل بازنویسی کنید. `contextWindow` بودجه‌ی پرامپت و Compaction در OpenClaw است. درخواست‌های بومی Ollama، `options.num_ctx` را تنظیم‌نشده می‌گذارند مگر اینکه `params.num_ctx` را صراحتاً پیکربندی کنید، تا Ollama بتواند پیش‌فرض خودش را بر اساس مدل، `OLLAMA_CONTEXT_LENGTH` یا VRAM اعمال کند. برای محدود کردن یا اجبار زمینه‌ی زمان اجرای هر درخواست Ollama بدون بازسازی Modelfile، `params.num_ctx` را تنظیم کنید؛ مقادیر نامعتبر، صفر، منفی و غیرمتناهی نادیده گرفته می‌شوند. اگر یک پیکربندی قدیمی‌تر را ارتقا داده‌اید که فقط از `contextWindow` یا `maxTokens` برای اجبار زمینه‌ی درخواست بومی Ollama استفاده می‌کرد، `openclaw doctor --fix` را اجرا کنید تا آن بودجه‌های صریح ارائه‌دهنده یا مدل را در `params.num_ctx` کپی کند. آداپتر سازگار با OpenAI برای Ollama همچنان به‌طور پیش‌فرض `options.num_ctx` را از `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر بالادستی شما `options` را رد می‌کند، این رفتار را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی Ollama همچنین گزینه‌های رایج زمان اجرای Ollama را زیر `params` می‌پذیرند، از جمله `temperature`، `top_p`، `top_k`، `min_p`، `num_predict`، `stop`، `repeat_penalty`، `num_batch`، `num_thread` و `use_mmap`. OpenClaw فقط کلیدهای درخواست Ollama را ارسال می‌کند، بنابراین پارامترهای زمان اجرای OpenClaw مانند `streaming` به Ollama نشت نمی‌کنند. برای ارسال `think` سطح‌بالای Ollama از `params.think` یا `params.thinking` استفاده کنید؛ `false` تفکر در سطح API را برای مدل‌های تفکرمحور سبک Qwen غیرفعال می‌کند.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` در سطح هر مدل نیز کار می‌کند. اگر هر دو پیکربندی شده باشند، ورودی صریح مدلِ ارائه‌دهنده بر پیش‌فرض agent برتری دارد.

  </Accordion>

  <Accordion title="کنترل تفکر">
    برای مدل‌های بومی Ollama، OpenClaw کنترل تفکر را همان‌طور که Ollama انتظار دارد ارسال می‌کند: `think` در سطح بالا، نه `options.think`. مدل‌های کشف‌شده‌ی خودکار که پاسخ `/api/show` آن‌ها قابلیت `thinking` را شامل می‌شود، `/think low`، `/think medium`، `/think high` و `/think max` را ارائه می‌کنند؛ مدل‌های بدون تفکر فقط `/think off` را ارائه می‌کنند.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    همچنین می‌توانید یک پیش‌فرض مدل تنظیم کنید:

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

    `params.think` یا `params.thinking` در سطح هر مدل می‌تواند تفکر API در Ollama را برای یک مدل پیکربندی‌شده‌ی مشخص غیرفعال یا اجباری کند. OpenClaw این پارامترهای صریح مدل را هنگامی که اجرای فعال فقط پیش‌فرض ضمنی `off` را دارد حفظ می‌کند؛ فرمان‌های زمان اجرا که `off` نیستند، مانند `/think medium`، همچنان اجرای فعال را بازنویسی می‌کنند.

  </Accordion>

  <Accordion title="مدل‌های استدلالی">
    OpenClaw مدل‌هایی با نام‌هایی مانند `deepseek-r1`، `reasoning` یا `think` را به‌طور پیش‌فرض دارای قابلیت استدلال در نظر می‌گیرد.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    به پیکربندی اضافه‌ای نیاز نیست. OpenClaw آن‌ها را به‌صورت خودکار علامت‌گذاری می‌کند.

  </Accordion>

  <Accordion title="هزینه‌های مدل">
    Ollama رایگان است و به‌صورت محلی اجرا می‌شود، بنابراین همه‌ی هزینه‌های مدل روی ۰ دلار تنظیم می‌شوند. این موضوع هم برای مدل‌های کشف‌شده‌ی خودکار و هم برای مدل‌های تعریف‌شده‌ی دستی صدق می‌کند.
  </Accordion>

  <Accordion title="جاسازی‌های حافظه">
    Plugin همراه Ollama یک ارائه‌دهنده‌ی جاسازی حافظه برای
    [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این ارائه‌دهنده از URL پایه‌ی Ollama
    و کلید API پیکربندی‌شده استفاده می‌کند، endpoint فعلی `/api/embed` در Ollama را فراخوانی می‌کند و در صورت امکان
    چندین قطعه‌ی حافظه را در یک درخواست `input` دسته‌بندی می‌کند.

    وقتی `proxy.enabled=true` باشد، درخواست‌های جاسازی حافظه‌ی Ollama به مبدأ دقیق
    host-local loopback که از `baseUrl` پیکربندی‌شده مشتق شده است، به‌جای پراکسی هدایت‌شده‌ی مدیریت‌شده، از
    مسیر مستقیم محافظت‌شده‌ی OpenClaw استفاده می‌کنند. نام میزبان پیکربندی‌شده باید خودش `localhost` یا یک literal آدرس IP loopback باشد؛
    نام‌های DNS که صرفاً به loopback resolve می‌شوند همچنان از مسیر پراکسی مدیریت‌شده استفاده می‌کنند.
    میزبان‌های LAN، tailnet، شبکه‌ی خصوصی و عمومی Ollama نیز در
    مسیر پراکسی مدیریت‌شده باقی می‌مانند. تغییرمسیرها به میزبان یا درگاه دیگر اعتماد را به ارث نمی‌برند.
    اپراتورها همچنان می‌توانند تنظیم سراسری `proxy.loopbackMode: "proxy"` را برای
    ارسال ترافیک loopback از طریق پراکسی، یا `proxy.loopbackMode: "block"` را
    برای رد کردن اتصال‌های loopback پیش از باز کردن اتصال تنظیم کنند؛ برای اثر
    سراسری این تنظیم در سطح فرایند، [پراکسی مدیریت‌شده](/fa/security/network-proxy#gateway-loopback-mode) را ببینید.

    | ویژگی      | مقدار               |
    | ------------- | ------------------- |
    | مدل پیش‌فرض | `nomic-embed-text`  |
    | دریافت خودکار     | بله — اگر مدل جاسازی به‌صورت محلی موجود نباشد، به‌طور خودکار دریافت می‌شود |

    جاسازی‌های زمان پرس‌وجو برای مدل‌هایی که به پیشوندهای بازیابی نیاز دارند یا آن‌ها را توصیه می‌کنند، از این پیشوندها استفاده می‌کنند، از جمله `nomic-embed-text`، `qwen3-embedding` و `mxbai-embed-large`. دسته‌های سند حافظه خام باقی می‌مانند تا نمایه‌های موجود به مهاجرت قالب نیاز نداشته باشند.

    برای انتخاب Ollama به‌عنوان ارائه‌دهنده‌ی جاسازی جست‌وجوی حافظه:

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

    برای یک میزبان جاسازی راه‌دور، احراز هویت را محدود به همان میزبان نگه دارید:

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

  <Accordion title="پیکربندی استریم">
    یکپارچه‌سازی Ollama در OpenClaw به‌طور پیش‌فرض از **API بومی Ollama** (`/api/chat`) استفاده می‌کند که به‌طور کامل از استریم و فراخوانی ابزار به‌صورت هم‌زمان پشتیبانی می‌کند. به پیکربندی ویژه‌ای نیاز نیست.

    برای درخواست‌های بومی `/api/chat`، OpenClaw همچنین کنترل تفکر را مستقیماً به Ollama ارسال می‌کند: `/think off` و `openclaw agent --thinking off`، مگر اینکه مقدار صریح مدل `params.think`/`params.thinking` پیکربندی شده باشد، `think: false` را در سطح بالا ارسال می‌کنند، در حالی که `/think low|medium|high` رشته‌ی تلاش `think` متناظر را در سطح بالا ارسال می‌کند. `/think max` به بالاترین تلاش بومی Ollama، یعنی `think: "high"`، نگاشت می‌شود.

    <Tip>
    اگر لازم است از endpoint سازگار با OpenAI استفاده کنید، بخش «حالت قدیمی سازگار با OpenAI» را در بالا ببینید. ممکن است استریم و فراخوانی ابزار در آن حالت به‌صورت هم‌زمان کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="حلقه‌ی خرابی WSL2 (راه‌اندازی‌های مجدد تکراری)">
    در WSL2 همراه با NVIDIA/CUDA، نصب‌کننده‌ی رسمی لینوکس Ollama یک واحد systemd با نام `ollama.service` و `Restart=always` ایجاد می‌کند. اگر این سرویس به‌صورت خودکار شروع شود و هنگام بوت WSL2 یک مدل متکی به GPU را بارگذاری کند، Ollama می‌تواند هنگام بارگذاری مدل، حافظه‌ی میزبان را pin کند. بازیابی حافظه‌ی Hyper-V همیشه نمی‌تواند آن صفحه‌های pin‌شده را بازپس بگیرد، بنابراین Windows می‌تواند VM مربوط به WSL2 را خاتمه دهد، systemd دوباره Ollama را شروع می‌کند و حلقه تکرار می‌شود.

    شواهد رایج:

    - راه‌اندازی‌های مجدد یا خاتمه‌های تکراری WSL2 از سمت Windows
    - CPU بالا در `app.slice` یا `ollama.service` کمی پس از شروع WSL2
    - SIGTERM از systemd به‌جای رویداد OOM-killer در Linux

    OpenClaw وقتی WSL2، فعال بودن `ollama.service` با `Restart=always` و نشانگرهای قابل‌مشاهده‌ی CUDA را تشخیص دهد، هنگام شروع یک هشدار ثبت می‌کند.

    راهکار کاهش اثر:

    ```bash
    sudo systemctl disable ollama
    ```

    این را در سمت Windows به `%USERPROFILE%\.wslconfig` اضافه کنید، سپس `wsl --shutdown` را اجرا کنید:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    در محیط سرویس Ollama یک keep-alive کوتاه‌تر تنظیم کنید، یا Ollama را فقط وقتی به آن نیاز دارید به‌صورت دستی شروع کنید:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) را ببینید.

  </Accordion>

  <Accordion title="Ollama تشخیص داده نمی‌شود">
    مطمئن شوید Ollama در حال اجراست و `OLLAMA_API_KEY` را تنظیم کرده‌اید (یا یک نمایه‌ی احراز هویت دارید)، و اینکه یک ورودی صریح `models.providers.ollama` تعریف نکرده‌اید:

    ```bash
    ollama serve
    ```

    بررسی کنید API در دسترس است:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    اگر مدل شما فهرست نشده است، یا مدل را به‌صورت محلی دریافت کنید یا آن را صراحتاً در `models.providers.ollama` تعریف کنید.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="اتصال رد شد">
    بررسی کنید Ollama روی درگاه درست در حال اجراست:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="میزبان راه‌دور با curl کار می‌کند اما با OpenClaw نه">
    از همان ماشین و زمان اجرایی که Gateway را اجرا می‌کند بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    علت‌های رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند که به‌جای رفتار بومی Ollama، رفتار سازگار با OpenAI را انتخاب می‌کند.
    - میزبان راه‌دور در سمت Ollama به تغییرات firewall یا binding شبکه‌ی LAN نیاز دارد.
    - مدل روی daemon لپ‌تاپ شما موجود است اما روی daemon راه‌دور موجود نیست.

  </Accordion>

  <Accordion title="مدل JSON ابزار را به‌صورت متن خروجی می‌دهد">
    این معمولاً یعنی ارائه‌دهنده از حالت سازگار با OpenAI استفاده می‌کند یا مدل نمی‌تواند schemaهای ابزار را مدیریت کند.

    حالت بومی Ollama را ترجیح دهید:

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

    اگر یک مدل محلی کوچک همچنان روی schemaهای ابزار شکست می‌خورد، روی ورودی آن مدل `compat.supportsTools: false` را تنظیم کنید و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای درهم‌ریخته برمی‌گرداند">
    پاسخ‌های میزبانی‌شده‌ی Kimi/GLM که طولانی و شامل دنباله‌های نمادین غیرزبانی هستند، به‌جای یک پاسخ موفق assistant، به‌عنوان خروجی ناموفق ارائه‌دهنده در نظر گرفته می‌شوند. این اجازه می‌دهد retry، fallback یا مدیریت خطای معمول بدون ماندگار کردن متن خراب در session وارد عمل شود.

    اگر این اتفاق تکرار شد، نام خام مدل، فایل session فعلی و اینکه اجرا از `Cloud + Local` یا `Cloud only` استفاده کرده است را ثبت کنید، سپس یک session تازه و یک مدل fallback را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="مدل محلی سرد timeout می‌شود">
    مدل‌های محلی بزرگ ممکن است پیش از شروع استریم به یک بارگذاری اولیه‌ی طولانی نیاز داشته باشند. timeout را محدود به ارائه‌دهنده‌ی Ollama نگه دارید و در صورت تمایل از Ollama بخواهید مدل را بین نوبت‌ها بارگذاری‌شده نگه دارد:

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

    اگر خود میزبان در پذیرش اتصال‌ها کند باشد، `timeoutSeconds` همچنین مهلت اتصال محافظت‌شده Undici را برای این ارائه‌دهنده افزایش می‌دهد.

  </Accordion>

  <Accordion title="مدل با زمینه بزرگ بیش از حد کند است یا حافظه کم می‌آورد">
    بسیاری از مدل‌های Ollama زمینه‌هایی را اعلام می‌کنند که بزرگ‌تر از آن‌اند که سخت‌افزار شما بتواند به‌راحتی اجرا کند. Ollama بومی از پیش‌فرض زمینه زمان اجرای خود Ollama استفاده می‌کند، مگر اینکه `params.num_ctx` را تنظیم کنید. وقتی تأخیر قابل پیش‌بینی برای نخستین توکن می‌خواهید، هم بودجه OpenClaw و هم زمینه درخواست Ollama را محدود کنید:

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

    اگر OpenClaw اعلان بیش از حدی ارسال می‌کند، ابتدا `contextWindow` را کاهش دهید. اگر Ollama در حال بارگذاری زمینه زمان اجرایی است که برای دستگاه بیش از حد بزرگ است، `params.num_ctx` را کاهش دهید. اگر تولید بیش از حد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    چگونگی انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="جست‌وجوی وب Ollama" href="/fa/tools/ollama-search" icon="magnifying-glass">
    جزئیات کامل راه‌اندازی و رفتار برای جست‌وجوی وب مبتنی بر Ollama.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
