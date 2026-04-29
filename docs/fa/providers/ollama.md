---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید
    - به راهنمای راه‌اندازی و پیکربندی Ollama نیاز دارید
    - شما مدل‌های بینایی Ollama را برای درک تصویر می‌خواهید
summary: اجرای OpenClaw با Ollama (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-04-29T23:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw با API بومی Ollama (`/api/chat`) برای مدل‌های ابری میزبانی‌شده و سرورهای Ollama محلی/خودمیزبان یکپارچه می‌شود. می‌توانید از Ollama در سه حالت استفاده کنید: `Cloud + Local` از طریق یک میزبان Ollama در دسترس، `Cloud only` در برابر `https://ollama.com`، یا `Local only` در برابر یک میزبان Ollama در دسترس.

<Warning>
**کاربران Ollama از راه دور**: از URL سازگار با OpenAI با مسیر `/v1` (`http://host:11434/v1`) همراه با OpenClaw استفاده نکنید. این کار فراخوانی ابزار را خراب می‌کند و مدل‌ها ممکن است JSON خام ابزار را به‌صورت متن ساده خروجی دهند. به‌جای آن از URL API بومی Ollama استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

پیکربندی ارائه‌دهنده Ollama از `baseUrl` به‌عنوان کلید اصلی استفاده می‌کند. OpenClaw برای سازگاری با نمونه‌های سبک OpenAI SDK، `baseURL` را هم می‌پذیرد، اما پیکربندی جدید باید `baseUrl` را ترجیح دهد.

## قوانین احراز هویت

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    میزبان‌های Ollama محلی و LAN به توکن bearer واقعی نیاز ندارند. OpenClaw نشانگر محلی `ollama-local` را فقط برای URLهای پایه Ollama مربوط به loopback، شبکه خصوصی، `.local`، و نام میزبان ساده به‌کار می‌برد.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    میزبان‌های عمومی از راه دور و Ollama Cloud (`https://ollama.com`) به اعتبارنامه واقعی از طریق `OLLAMA_API_KEY`، یک نمایه احراز هویت، یا `apiKey` ارائه‌دهنده نیاز دارند.
  </Accordion>
  <Accordion title="Custom provider ids">
    شناسه‌های ارائه‌دهنده سفارشی که `api: "ollama"` را تنظیم می‌کنند، از همان قوانین پیروی می‌کنند. برای مثال، یک ارائه‌دهنده `ollama-remote` که به یک میزبان Ollama در LAN خصوصی اشاره می‌کند، می‌تواند از `apiKey: "ollama-local"` استفاده کند و زیرعامل‌ها آن نشانگر را از طریق hook ارائه‌دهنده Ollama resolve می‌کنند، نه اینکه آن را به‌عنوان اعتبارنامه گمشده در نظر بگیرند. جست‌وجوی حافظه همچنین می‌تواند `agents.defaults.memorySearch.provider` را روی همان شناسه ارائه‌دهنده سفارشی تنظیم کند تا embeddingها از endpoint متناظر Ollama استفاده کنند.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` اعتبارنامه را برای یک شناسه ارائه‌دهنده ذخیره می‌کند. تنظیمات endpoint (`baseUrl`، `api`، شناسه‌های مدل، headerها، timeoutها) را در `models.providers.<id>` قرار دهید. فایل‌های قدیمی نمایه احراز هویت تخت مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب runtime نیستند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها با تهیه backup به نمایه کلید API استاندارد `ollama-windows:default` بازنویسی شوند. `baseUrl` در آن فایل نویز سازگاری است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="Memory embedding scope">
    وقتی Ollama برای embeddingهای حافظه استفاده می‌شود، احراز هویت bearer به میزبانی محدود می‌شود که در آن تعریف شده است:

    - کلید سطح ارائه‌دهنده فقط به میزبان Ollama همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان embedding از راه دور خودش ارسال می‌شود.
    - مقدار env صرف `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud در نظر گرفته می‌شود و به‌طور پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع به کار

روش راه‌اندازی و حالت دلخواهتان را انتخاب کنید.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **مناسب برای:** سریع‌ترین مسیر برای داشتن یک راه‌اندازی ابری یا محلی Ollama که کار می‌کند.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        **Ollama** را از فهرست ارائه‌دهنده‌ها انتخاب کنید.
      </Step>
      <Step title="Choose your mode">
        - **ابری + محلی** — میزبان Ollama محلی به‌همراه مدل‌های ابری که از طریق همان میزبان مسیریابی می‌شوند
        - **فقط ابری** — مدل‌های میزبانی‌شده Ollama از طریق `https://ollama.com`
        - **فقط محلی** — فقط مدل‌های محلی

      </Step>
      <Step title="Select a model">
        `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و پیش‌فرض‌های ابری میزبانی‌شده را پیشنهاد می‌دهد. `Cloud + Local` و `Local only` یک URL پایه Ollama می‌خواهند، مدل‌های موجود را کشف می‌کنند، و اگر مدل محلی انتخاب‌شده هنوز موجود نباشد، آن را به‌صورت خودکار pull می‌کنند. وقتی Ollama یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` گزارش می‌کند، راه‌اندازی همان مدل نصب‌شده را یک‌بار نشان می‌دهد، به‌جای اینکه هم `gemma4` و هم `gemma4:latest` را نشان دهد یا دوباره alias ساده را pull کند. `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد حساب شده است یا نه.
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

    در صورت تمایل، یک URL پایه یا مدل سفارشی مشخص کنید:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **مناسب برای:** کنترل کامل روی راه‌اندازی ابری یا محلی.

    <Steps>
      <Step title="Choose cloud or local">
        - **ابری + محلی**: Ollama را نصب کنید، با `ollama signin` وارد شوید، و درخواست‌های ابری را از طریق همان میزبان مسیریابی کنید
        - **فقط ابری**: از `https://ollama.com` همراه با `OLLAMA_API_KEY` استفاده کنید
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
        برای `Cloud only`، از `OLLAMA_API_KEY` واقعی خود استفاده کنید. برای راه‌اندازی‌های پشتیبانی‌شده با میزبان، هر مقدار placeholder کار می‌کند:

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
    `Cloud + Local` از یک میزبان Ollama در دسترس به‌عنوان نقطه کنترل برای هر دو نوع مدل محلی و ابری استفاده می‌کند. این جریان ترکیبی ترجیحی Ollama است.

    هنگام راه‌اندازی از **ابری + محلی** استفاده کنید. OpenClaw URL پایه Ollama را درخواست می‌کند، مدل‌های محلی را از آن میزبان کشف می‌کند، و بررسی می‌کند که آیا میزبان با `ollama signin` برای دسترسی ابری وارد حساب شده است یا نه. وقتی میزبان وارد حساب شده باشد، OpenClaw پیش‌فرض‌های ابری میزبانی‌شده مانند `kimi-k2.5:cloud`، `minimax-m2.7:cloud`، و `glm-5.1:cloud` را نیز پیشنهاد می‌دهد.

    اگر میزبان هنوز وارد حساب نشده باشد، OpenClaw تا زمانی که `ollama signin` را اجرا کنید، راه‌اندازی را فقط محلی نگه می‌دارد.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` در برابر API میزبانی‌شده Ollama در `https://ollama.com` اجرا می‌شود.

    هنگام راه‌اندازی از **فقط ابری** استفاده کنید. OpenClaw مقدار `OLLAMA_API_KEY` را درخواست می‌کند، `baseUrl: "https://ollama.com"` را تنظیم می‌کند، و فهرست مدل‌های ابری میزبانی‌شده را seed می‌کند. این مسیر به سرور Ollama محلی یا `ollama signin` نیاز ندارد.

    فهرست مدل‌های ابری که هنگام `openclaw onboard` نشان داده می‌شود، به‌صورت زنده از `https://ollama.com/api/tags` پر می‌شود و سقف آن ۵۰۰ مورد است، بنابراین انتخابگر به‌جای یک seed ایستا، کاتالوگ میزبانی‌شده فعلی را بازتاب می‌دهد. اگر `ollama.com` در زمان راه‌اندازی در دسترس نباشد یا هیچ مدلی برنگرداند، OpenClaw به پیشنهادهای hardcoded قبلی fallback می‌کند تا onboarding همچنان کامل شود.

  </Tab>

  <Tab title="Local only">
    در حالت فقط محلی، OpenClaw مدل‌ها را از نمونه پیکربندی‌شده Ollama کشف می‌کند. این مسیر برای سرورهای Ollama محلی یا خودمیزبان است.

    OpenClaw در حال حاضر `gemma4` را به‌عنوان پیش‌فرض محلی پیشنهاد می‌دهد.

  </Tab>
</Tabs>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) را تنظیم می‌کنید و `models.providers.ollama` یا ارائه‌دهنده سفارشی از راه دور دیگری با `api: "ollama"` تعریف **نمی‌کنید**، OpenClaw مدل‌ها را از نمونه Ollama محلی در `http://127.0.0.1:11434` کشف می‌کند.

| رفتار                | جزئیات                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| پرس‌وجوی کاتالوگ     | `/api/tags` را پرس‌وجو می‌کند                                                                                                                                       |
| تشخیص قابلیت         | از lookupهای best-effort در `/api/show` برای خواندن `contextWindow`، پارامترهای گسترش‌یافته `num_ctx` در Modelfile، و قابلیت‌هایی از جمله vision/tools استفاده می‌کند |
| مدل‌های vision       | مدل‌هایی که قابلیت `vision` آن‌ها توسط `/api/show` گزارش می‌شود، به‌عنوان دارای قابلیت تصویر (`input: ["text", "image"]`) علامت‌گذاری می‌شوند، بنابراین OpenClaw تصویرها را به‌صورت خودکار به prompt تزریق می‌کند |
| تشخیص استدلال        | وقتی موجود باشد از قابلیت‌های `/api/show`، از جمله `thinking`، استفاده می‌کند؛ وقتی Ollama قابلیت‌ها را حذف کند، به heuristic نام مدل (`r1`، `reasoning`، `think`) fallback می‌کند |
| محدودیت‌های توکن     | `maxTokens` را روی سقف پیش‌فرض بیشینه توکن Ollama که OpenClaw استفاده می‌کند تنظیم می‌کند                                                                          |
| هزینه‌ها             | همه هزینه‌ها را روی `0` تنظیم می‌کند                                                                                                                                |

این کار از ورودی‌های دستی مدل جلوگیری می‌کند و در عین حال کاتالوگ را با نمونه Ollama محلی هم‌راستا نگه می‌دارد. می‌توانید از یک ref کامل مانند `ollama/<pulled-model>:latest` در `infer model run` محلی استفاده کنید؛ OpenClaw آن مدل نصب‌شده را از کاتالوگ زنده Ollama resolve می‌کند، بدون اینکه به یک ورودی دستی در `models.json` نیاز داشته باشد.

برای میزبان‌های Ollama که وارد حساب شده‌اند، برخی مدل‌های `:cloud` ممکن است از طریق `/api/chat`
و `/api/show` قابل استفاده باشند، پیش از آنکه در `/api/tags` ظاهر شوند. وقتی یک
ref کامل `ollama/<model>:cloud` را صراحتا انتخاب می‌کنید، OpenClaw همان مدل
گمشده دقیق را با `/api/show` اعتبارسنجی می‌کند و فقط اگر Ollama فراداده مدل را
تایید کند، آن را به کاتالوگ runtime اضافه می‌کند. غلط‌های املایی همچنان به‌عنوان مدل‌های ناشناخته شکست می‌خورند، نه اینکه خودکار ساخته شوند.

```bash
# See what models are available
ollama list
openclaw models list
```

برای یک smoke test محدود تولید متن که از سطح کامل ابزار agent دوری می‌کند،
از `infer model run` محلی با یک ref کامل مدل Ollama استفاده کنید:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

آن مسیر همچنان از ارائه‌دهنده، احراز هویت، و transport بومی Ollama که در OpenClaw
پیکربندی شده‌اند استفاده می‌کند، اما یک نوبت chat-agent را شروع نمی‌کند یا context مربوط به MCP/tool را بارگذاری نمی‌کند. اگر
این موفق شود اما پاسخ‌های عادی agent شکست بخورند، در گام بعد ظرفیت prompt/tool مدل برای agent را عیب‌یابی کنید.

برای یک smoke test محدود مدل vision روی همان مسیر سبک، یک یا چند فایل
تصویر را به `infer model run` اضافه کنید. این کار prompt و تصویر را مستقیما به
مدل vision انتخاب‌شده Ollama می‌فرستد، بدون اینکه ابزارهای chat، حافظه، یا context
نشست قبلی بارگذاری شوند:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` فایل‌هایی را که به‌عنوان `image/*` تشخیص داده می‌شوند می‌پذیرد، از جمله ورودی‌های رایج PNG،
JPEG، و WebP. فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند.
برای تشخیص گفتار، به‌جای آن از `openclaw infer audio transcribe` استفاده کنید.

وقتی یک مکالمه را با `/model ollama/<model>` تغییر می‌دهید، OpenClaw آن را
به‌عنوان انتخاب دقیق کاربر در نظر می‌گیرد. اگر `baseUrl` پیکربندی‌شده Ollama
در دسترس نباشد، پاسخ بعدی با خطای ارائه‌دهنده شکست می‌خورد، نه اینکه بی‌سروصدا
از مدل fallback پیکربندی‌شده دیگری پاسخ دهد.

کارهای Cron ایزوله پیش از آغاز نوبت عامل، یک بررسی ایمنی محلی اضافه انجام می‌دهند. اگر مدل انتخاب‌شده به یک ارائه‌دهنده‌ی Ollama محلی، شبکه‌ی خصوصی، یا `.local` resolve شود و `/api/tags` در دسترس نباشد، OpenClaw آن اجرای Cron را با وضعیت `skipped` ثبت می‌کند و `ollama/<model>` انتخاب‌شده را در متن خطا می‌آورد. پیش‌بررسی endpoint به مدت ۵ دقیقه cache می‌شود، بنابراین چندین کار Cron که به همان daemon متوقف‌شده‌ی Ollama اشاره دارند، همگی درخواست‌های مدل ناموفق را اجرا نمی‌کنند.

مسیر متن محلی، مسیر stream بومی، و embeddings را در برابر Ollama محلی به‌صورت زنده راستی‌آزمایی کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای افزودن یک مدل جدید، کافی است آن را با Ollama pull کنید:

```bash
ollama pull mistral
```

مدل جدید به‌صورت خودکار کشف می‌شود و برای استفاده در دسترس خواهد بود.

<Note>
اگر `models.providers.ollama` را به‌طور صریح تنظیم کنید، یا یک ارائه‌دهنده‌ی راه‌دور سفارشی مانند `models.providers.ollama-cloud` را با `api: "ollama"` پیکربندی کنید، کشف خودکار نادیده گرفته می‌شود و باید مدل‌ها را دستی تعریف کنید. ارائه‌دهندگان سفارشی loopback مانند `http://127.0.0.2:11434` همچنان محلی در نظر گرفته می‌شوند. بخش پیکربندی صریح زیر را ببینید.
</Note>

## بینایی و توصیف تصویر

Plugin همراه Ollama،‏ Ollama را به‌عنوان یک ارائه‌دهنده‌ی درک رسانه با قابلیت تصویر ثبت می‌کند. این به OpenClaw امکان می‌دهد درخواست‌های صریح توصیف تصویر و پیش‌فرض‌های پیکربندی‌شده‌ی مدل تصویر را از طریق مدل‌های بینایی Ollama محلی یا میزبانی‌شده مسیریابی کند.

برای بینایی محلی، مدلی را pull کنید که از تصویر پشتیبانی می‌کند:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

سپس با infer CLI راستی‌آزمایی کنید:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` باید یک ارجاع کامل `<provider/model>` باشد. وقتی تنظیم شود، `openclaw infer image describe` آن مدل را مستقیما اجرا می‌کند، به‌جای اینکه به دلیل پشتیبانی مدل از بینایی بومی، توصیف را رد کند.

وقتی جریان ارائه‌دهنده‌ی درک تصویر OpenClaw،‏ `agents.defaults.imageModel` پیکربندی‌شده، و شکل خروجی توصیف تصویر را می‌خواهید، از `infer image describe` استفاده کنید. وقتی یک probe خام مدل چندوجهی با prompt سفارشی و یک یا چند تصویر می‌خواهید، از `infer model run --file` استفاده کنید.

برای اینکه Ollama مدل پیش‌فرض درک تصویر برای رسانه‌ی ورودی باشد، `agents.defaults.imageModel` را پیکربندی کنید:

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

ارجاع کامل `ollama/<model>` را ترجیح دهید. اگر همان مدل زیر `models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهنده‌ی تصویر پیکربندی‌شده‌ی دیگری آن شناسه‌ی مدل بدون پیشوند را expose نکند، OpenClaw همچنین یک ارجاع `imageModel` بدون پیشوند مانند `qwen2.5vl:7b` را به `ollama/qwen2.5vl:7b` نرمال‌سازی می‌کند. اگر بیش از یک ارائه‌دهنده‌ی تصویر پیکربندی‌شده همان شناسه‌ی بدون پیشوند را داشته باشد، پیشوند ارائه‌دهنده را صریحا استفاده کنید.

مدل‌های بینایی محلی کند ممکن است نسبت به مدل‌های cloud به timeout طولانی‌تری برای درک تصویر نیاز داشته باشند. همچنین وقتی Ollama تلاش می‌کند کل context بینایی اعلام‌شده را روی سخت‌افزار محدود allocate کند، ممکن است crash کنند یا متوقف شوند. وقتی فقط به یک نوبت عادی توصیف تصویر نیاز دارید، یک timeout قابلیت تنظیم کنید و `num_ctx` را روی ورودی مدل محدود کنید:

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

این timeout برای درک تصویر ورودی و برای ابزار صریح `image` اعمال می‌شود که عامل می‌تواند در طول یک نوبت فراخوانی کند. `models.providers.ollama.timeoutSeconds` در سطح ارائه‌دهنده همچنان guard درخواست HTTP زیربنایی Ollama را برای فراخوانی‌های عادی مدل کنترل می‌کند.

ابزار صریح تصویر را در برابر Ollama محلی به‌صورت زنده راستی‌آزمایی کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را دستی تعریف می‌کنید، مدل‌های بینایی را با پشتیبانی ورودی تصویر علامت‌گذاری کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توصیف تصویر را برای مدل‌هایی که به‌عنوان دارای قابلیت تصویر علامت‌گذاری نشده‌اند رد می‌کند. با کشف ضمنی، وقتی `/api/show` یک قابلیت بینایی گزارش کند، OpenClaw این مورد را از Ollama می‌خواند.

## پیکربندی

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ساده‌ترین مسیر فعال‌سازی فقط محلی از طریق متغیر محیطی است:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در ورودی ارائه‌دهنده حذف کنید و OpenClaw آن را برای بررسی‌های دسترس‌پذیری پر می‌کند.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    وقتی راه‌اندازی cloud میزبانی‌شده می‌خواهید، Ollama روی host/port دیگری اجرا می‌شود، می‌خواهید پنجره‌های context یا فهرست‌های مدل مشخصی را اجبار کنید، یا تعریف‌های کاملا دستی مدل می‌خواهید، از پیکربندی صریح استفاده کنید.

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
    اگر Ollama روی host یا port دیگری اجرا می‌شود (پیکربندی صریح کشف خودکار را غیرفعال می‌کند، پس مدل‌ها را دستی تعریف کنید):

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
    `/v1` را به URL اضافه نکنید. مسیر `/v1` از حالت سازگار با OpenAI استفاده می‌کند، که در آن فراخوانی ابزار قابل اتکا نیست. از URL پایه‌ی Ollama بدون پسوند مسیر استفاده کنید.
    </Warning>

  </Tab>
</Tabs>

## دستورالعمل‌های رایج

از این‌ها به‌عنوان نقطه‌ی شروع استفاده کنید و شناسه‌های مدل را با نام‌های دقیق از `ollama list` یا `openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    وقتی Ollama روی همان ماشینی اجرا می‌شود که Gateway اجرا می‌شود و می‌خواهید OpenClaw مدل‌های نصب‌شده را خودکار کشف کند، از این استفاده کنید.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    این مسیر پیکربندی را حداقلی نگه می‌دارد. مگر اینکه بخواهید مدل‌ها را دستی تعریف کنید، یک بلوک `models.providers.ollama` اضافه نکنید.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    برای hostهای LAN از URLهای بومی Ollama استفاده کنید. `/v1` را اضافه نکنید.

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

    `contextWindow` بودجه‌ی context سمت OpenClaw است. `params.num_ctx` برای درخواست به Ollama ارسال می‌شود. وقتی سخت‌افزار شما نمی‌تواند context کامل اعلام‌شده‌ی مدل را اجرا کند، آن‌ها را هم‌راستا نگه دارید.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    وقتی daemon محلی اجرا نمی‌کنید و مدل‌های Ollama میزبانی‌شده را مستقیما می‌خواهید، از این استفاده کنید.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    وقتی یک daemon محلی یا LAN Ollama با `ollama signin` وارد شده و باید هم مدل‌های محلی و هم مدل‌های `:cloud` را ارائه کند، از این استفاده کنید.

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
    وقتی بیش از یک سرور Ollama دارید، از شناسه‌های ارائه‌دهنده‌ی سفارشی استفاده کنید. هر ارائه‌دهنده host، مدل‌ها، auth،‏ timeout و ارجاع‌های مدل خودش را می‌گیرد.

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

    وقتی OpenClaw درخواست را ارسال می‌کند، پیشوند ارائه‌دهنده‌ی فعال حذف می‌شود تا `ollama-large/qwen3.5:27b` به‌صورت `qwen3.5:27b` به Ollama برسد.

  </Accordion>

  <Accordion title="Lean local model profile">
    برخی مدل‌های محلی می‌توانند به promptهای ساده پاسخ دهند اما با سطح کامل ابزارهای عامل مشکل دارند. پیش از تغییر تنظیمات global runtime، ابتدا ابزارها و context را محدود کنید.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    از `compat.supportsTools: false` فقط زمانی استفاده کنید که مدل یا سرور به‌طور قابل اعتماد روی طرح‌واره‌های ابزار شکست می‌خورد. این کار قابلیت عامل را با پایداری معاوضه می‌کند.
    `localModelLean` مرورگر، Cron، و ابزارهای پیام را از سطح عامل حذف می‌کند، اما زمینهٔ زمان اجرای Ollama یا حالت تفکر آن را تغییر نمی‌دهد. برای مدل‌های تفکر کوچک به سبک Qwen که در حلقه می‌افتند یا بودجهٔ پاسخ خود را صرف استدلال پنهان می‌کنند، آن را با `params.num_ctx` صریح و `params.thinking: false` همراه کنید.

  </Accordion>
</AccordionGroup>

### انتخاب مدل

پس از پیکربندی، همهٔ مدل‌های Ollama شما در دسترس هستند:

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

شناسه‌های ارائه‌دهندهٔ سفارشی Ollama نیز پشتیبانی می‌شوند. وقتی یک ارجاع مدل از پیشوند ارائه‌دهندهٔ فعال استفاده می‌کند، مانند `ollama-spark/qwen3:32b`، OpenClaw فقط همان پیشوند را پیش از فراخوانی Ollama حذف می‌کند تا سرور `qwen3:32b` را دریافت کند.

برای مدل‌های محلی کند، پیش از افزایش مهلت زمانی کل زمان اجرای عامل، تنظیم درخواست در محدودهٔ ارائه‌دهنده را ترجیح دهید:

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

`timeoutSeconds` روی درخواست HTTP مدل اعمال می‌شود، از جمله راه‌اندازی اتصال، سرآیندها، جریان‌دهی بدنه، و لغو کلی دریافت محافظت‌شده. `params.keep_alive` در درخواست‌های بومی `/api/chat` به‌عنوان `keep_alive` سطح بالا به Ollama ارسال می‌شود؛ وقتی زمان بارگذاری نوبت اول گلوگاه است، آن را برای هر مدل تنظیم کنید.

### راستی‌آزمایی سریع

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

برای میزبان‌های راه دور، `127.0.0.1` را با میزبانی که در `baseUrl` استفاده شده جایگزین کنید. اگر `curl` کار می‌کند اما OpenClaw نه، بررسی کنید که آیا Gateway روی دستگاه، کانتینر، یا حساب سرویس متفاوتی اجرا می‌شود یا نه.

## جست‌وجوی وب Ollama

OpenClaw از **جست‌وجوی وب Ollama** به‌عنوان یک ارائه‌دهندهٔ همراه `web_search` پشتیبانی می‌کند.

| ویژگی | جزئیات |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان | از میزبان Ollama پیکربندی‌شدهٔ شما استفاده می‌کند (`models.providers.ollama.baseUrl` وقتی تنظیم شده باشد، وگرنه `http://127.0.0.1:11434`)؛ `https://ollama.com` مستقیماً از API میزبانی‌شده استفاده می‌کند |
| احراز هویت | برای میزبان‌های محلی Ollama که وارد حساب شده‌اند، بدون کلید است؛ `OLLAMA_API_KEY` یا احراز هویت ارائه‌دهندهٔ پیکربندی‌شده برای جست‌وجوی مستقیم `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت |
| نیازمندی | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد حساب شده باشند؛ جست‌وجوی مستقیم میزبانی‌شده به `baseUrl: "https://ollama.com"` به‌علاوهٔ یک کلید واقعی API از Ollama نیاز دارد |

در طول `openclaw onboard` یا `openclaw configure --section web`، **جست‌وجوی وب Ollama** را انتخاب کنید، یا تنظیم کنید:

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

برای یک daemon محلی که وارد حساب شده است، OpenClaw از پراکسی `/api/experimental/web_search` همان daemon استفاده می‌کند. برای `https://ollama.com`، نقطهٔ پایانی میزبانی‌شدهٔ `/api/web_search` را مستقیماً فراخوانی می‌کند.

<Note>
برای راه‌اندازی کامل و جزئیات رفتار، [جست‌وجوی وب Ollama](/fa/tools/ollama-search) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت سازگار با OpenAI قدیمی">
    <Warning>
    **فراخوانی ابزار در حالت سازگار با OpenAI قابل اعتماد نیست.** از این حالت فقط زمانی استفاده کنید که برای یک پراکسی به قالب OpenAI نیاز دارید و به رفتار فراخوانی ابزار بومی وابسته نیستید.
    </Warning>

    اگر لازم است به‌جای آن از نقطهٔ پایانی سازگار با OpenAI استفاده کنید (برای مثال، پشت پراکسی‌ای که فقط از قالب OpenAI پشتیبانی می‌کند)، `api: "openai-completions"` را به‌صراحت تنظیم کنید:

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

    این حالت ممکن است از جریان‌دهی و فراخوانی ابزار به‌طور هم‌زمان پشتیبانی نکند. ممکن است لازم باشد با `params: { streaming: false }` در پیکربندی مدل، جریان‌دهی را غیرفعال کنید.

    وقتی `api: "openai-completions"` با Ollama استفاده می‌شود، OpenClaw به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama بی‌صدا به پنجرهٔ زمینهٔ ۴۰۹۶ برنگردد. اگر پراکسی/بالادست شما فیلدهای ناشناختهٔ `options` را رد می‌کند، این رفتار را غیرفعال کنید:

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
    برای مدل‌های کشف‌شده به‌صورت خودکار، OpenClaw وقتی در دسترس باشد از پنجرهٔ زمینه‌ای استفاده می‌کند که Ollama گزارش می‌دهد، از جمله مقادیر بزرگ‌تر `PARAMETER num_ctx` از Modelfileهای سفارشی. در غیر این صورت به پنجرهٔ زمینهٔ پیش‌فرض Ollama که OpenClaw استفاده می‌کند برمی‌گردد.

    می‌توانید پیش‌فرض‌های سطح ارائه‌دهندهٔ `contextWindow`، `contextTokens`، و `maxTokens` را برای هر مدل زیر آن ارائه‌دهندهٔ Ollama تنظیم کنید، سپس در صورت نیاز آن‌ها را برای هر مدل بازنویسی کنید. `contextWindow` بودجهٔ اعلان و Compaction در OpenClaw است. درخواست‌های بومی Ollama، `options.num_ctx` را تنظیم‌نشده می‌گذارند مگر اینکه `params.num_ctx` را صراحتاً پیکربندی کنید، تا Ollama بتواند پیش‌فرض خودش را بر اساس مدل، `OLLAMA_CONTEXT_LENGTH`، یا VRAM اعمال کند. برای محدود کردن یا اجبار زمینهٔ زمان اجرای هر درخواست Ollama بدون بازسازی یک Modelfile، `params.num_ctx` را تنظیم کنید؛ مقادیر نامعتبر، صفر، منفی، و غیرمتناهی نادیده گرفته می‌شوند. آداپتور سازگار با OpenAI برای Ollama همچنان به‌طور پیش‌فرض `options.num_ctx` را از `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر بالادست شما `options` را رد می‌کند، آن را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی Ollama همچنین گزینه‌های رایج زمان اجرای Ollama را زیر `params` می‌پذیرند، از جمله `temperature`، `top_p`، `top_k`، `min_p`، `num_predict`، `stop`، `repeat_penalty`، `num_batch`، `num_thread`، و `use_mmap`. OpenClaw فقط کلیدهای درخواست Ollama را ارسال می‌کند، بنابراین پارامترهای زمان اجرای OpenClaw مانند `streaming` به Ollama نشت نمی‌کنند. برای ارسال `think` سطح بالای Ollama از `params.think` یا `params.thinking` استفاده کنید؛ `false` تفکر سطح API را برای مدل‌های تفکر به سبک Qwen غیرفعال می‌کند.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` برای هر مدل نیز کار می‌کند. اگر هر دو پیکربندی شده باشند، ورودی صریح مدل ارائه‌دهنده بر پیش‌فرض عامل اولویت دارد.

  </Accordion>

  <Accordion title="کنترل تفکر">
    برای مدل‌های بومی Ollama، OpenClaw کنترل تفکر را همان‌طور که Ollama انتظار دارد ارسال می‌کند: `think` سطح بالا، نه `options.think`. مدل‌های کشف‌شده به‌صورت خودکار که پاسخ `/api/show` آن‌ها قابلیت `thinking` را شامل می‌شود، `/think low`، `/think medium`، `/think high`، و `/think max` را ارائه می‌کنند؛ مدل‌های بدون تفکر فقط `/think off` را ارائه می‌کنند.

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

    `params.think` یا `params.thinking` برای هر مدل می‌تواند تفکر API در Ollama را برای یک مدل پیکربندی‌شدهٔ خاص غیرفعال یا اجباری کند. OpenClaw این پارامترهای صریح مدل را وقتی اجرای فعال فقط پیش‌فرض ضمنی `off` را دارد حفظ می‌کند؛ فرمان‌های زمان اجرا که `off` نیستند، مانند `/think medium`، همچنان اجرای فعال را بازنویسی می‌کنند.

  </Accordion>

  <Accordion title="مدل‌های استدلال">
    OpenClaw مدل‌هایی با نام‌هایی مانند `deepseek-r1`، `reasoning`، یا `think` را به‌طور پیش‌فرض دارای قابلیت استدلال در نظر می‌گیرد.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    هیچ پیکربندی اضافه‌ای لازم نیست. OpenClaw آن‌ها را به‌طور خودکار علامت‌گذاری می‌کند.

  </Accordion>

  <Accordion title="هزینه‌های مدل">
    Ollama رایگان است و به‌صورت محلی اجرا می‌شود، بنابراین همهٔ هزینه‌های مدل روی $0 تنظیم شده‌اند. این هم برای مدل‌های کشف‌شده به‌صورت خودکار و هم برای مدل‌های تعریف‌شده به‌صورت دستی اعمال می‌شود.
  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Plugin همراه Ollama یک ارائه‌دهندهٔ تعبیهٔ حافظه برای
    [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این ارائه‌دهنده از URL پایهٔ Ollama
    و کلید API پیکربندی‌شده استفاده می‌کند، نقطهٔ پایانی فعلی `/api/embed` در Ollama را فراخوانی می‌کند، و در صورت امکان
    چندین قطعهٔ حافظه را در یک درخواست `input` دسته‌بندی می‌کند.

    | ویژگی | مقدار |
    | ------------- | ------------------- |
    | مدل پیش‌فرض | `nomic-embed-text` |
    | واکشی خودکار | بله — اگر مدل تعبیه به‌صورت محلی وجود نداشته باشد، به‌طور خودکار واکشی می‌شود |

    تعبیه‌های زمان پرس‌وجو برای مدل‌هایی که به آن‌ها نیاز دارند یا آن‌ها را توصیه می‌کنند، از پیشوندهای بازیابی استفاده می‌کنند، از جمله `nomic-embed-text`، `qwen3-embedding`، و `mxbai-embed-large`. دسته‌های سند حافظه خام می‌مانند تا شاخص‌های موجود به مهاجرت قالب نیاز نداشته باشند.

    برای انتخاب Ollama به‌عنوان ارائه‌دهندهٔ تعبیهٔ جست‌وجوی حافظه:

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

    برای یک میزبان تعبیهٔ راه دور، احراز هویت را محدود به همان میزبان نگه دارید:

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
    یکپارچه‌سازی Ollama در OpenClaw به‌طور پیش‌فرض از **API بومی Ollama** (`/api/chat`) استفاده می‌کند، که هم‌زمان از جریان‌دهی و فراخوانی ابزار به‌طور کامل پشتیبانی می‌کند. به پیکربندی خاصی نیاز نیست.

    برای درخواست‌های بومی `/api/chat`، OpenClaw کنترل فکر کردن را نیز مستقیماً به Ollama منتقل می‌کند: `/think off` و `openclaw agent --thinking off` مقدار سطح‌بالای `think: false` را می‌فرستند، مگر اینکه مقدار صریح `params.think`/`params.thinking` برای مدل پیکربندی شده باشد، در حالی که `/think low|medium|high` رشتهٔ تلاش سطح‌بالای `think` متناظر را می‌فرستند. `/think max` به بالاترین تلاش بومی Ollama، یعنی `think: "high"`، نگاشت می‌شود.

    <Tip>
    اگر لازم است از نقطهٔ پایانی سازگار با OpenAI استفاده کنید، بخش «حالت قدیمی سازگار با OpenAI» را در بالا ببینید. ممکن است جریان‌دهی و فراخوانی ابزار در آن حالت هم‌زمان کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="حلقهٔ خرابی WSL2 (راه‌اندازی‌های مجدد تکراری)">
    در WSL2 با NVIDIA/CUDA، نصب‌کنندهٔ رسمی Linux برای Ollama یک واحد systemd با نام `ollama.service` و `Restart=always` ایجاد می‌کند. اگر آن سرویس به‌طور خودکار شروع شود و هنگام راه‌اندازی WSL2 یک مدل متکی به GPU را بارگذاری کند، Ollama می‌تواند هنگام بارگذاری مدل حافظهٔ میزبان را پین کند. بازپس‌گیری حافظهٔ Hyper-V همیشه نمی‌تواند آن صفحه‌های پین‌شده را بازپس بگیرد، بنابراین Windows می‌تواند VM مربوط به WSL2 را خاتمه دهد، systemd دوباره Ollama را شروع می‌کند، و حلقه تکرار می‌شود.

    شواهد رایج:

    - راه‌اندازی‌های مجدد یا خاتمه‌های تکراری WSL2 از سمت Windows
    - CPU بالا در `app.slice` یا `ollama.service` کمی پس از شروع WSL2
    - SIGTERM از systemd به‌جای رویداد OOM-killer در Linux

    OpenClaw وقتی WSL2، فعال بودن `ollama.service` با `Restart=always`، و نشانگرهای قابل‌مشاهدهٔ CUDA را تشخیص دهد، هنگام شروع یک هشدار ثبت می‌کند.

    کاهش اثر:

    ```bash
    sudo systemctl disable ollama
    ```

    این را در سمت Windows به `%USERPROFILE%\.wslconfig` اضافه کنید، سپس `wsl --shutdown` را اجرا کنید:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    یک keep-alive کوتاه‌تر در محیط سرویس Ollama تنظیم کنید، یا Ollama را فقط وقتی به آن نیاز دارید دستی شروع کنید:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) را ببینید.

  </Accordion>

  <Accordion title="Ollama شناسایی نشد">
    مطمئن شوید Ollama در حال اجراست و `OLLAMA_API_KEY` (یا یک نمایهٔ احراز هویت) را تنظیم کرده‌اید، و همچنین مطمئن شوید یک ورودی صریح `models.providers.ollama` تعریف **نکرده‌اید**:

    ```bash
    ollama serve
    ```

    بررسی کنید که API در دسترس باشد:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    اگر مدل شما فهرست نشده است، یا مدل را به‌صورت محلی pull کنید یا آن را صریحاً در `models.providers.ollama` تعریف کنید.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="اتصال رد شد">
    بررسی کنید Ollama روی پورت درست در حال اجرا باشد:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="میزبان راه دور با curl کار می‌کند اما با OpenClaw نه">
    از همان ماشین و runtime که Gateway را اجرا می‌کند بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    علت‌های رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند، که به‌جای Ollama بومی رفتار سازگار با OpenAI را انتخاب می‌کند.
    - میزبان راه دور به تغییرات firewall یا اتصال LAN در سمت Ollama نیاز دارد.
    - مدل روی daemon لپ‌تاپ شما وجود دارد اما روی daemon راه دور وجود ندارد.

  </Accordion>

  <Accordion title="مدل JSON ابزار را به‌صورت متن خروجی می‌دهد">
    این معمولاً یعنی provider از حالت سازگار با OpenAI استفاده می‌کند یا مدل نمی‌تواند schemaهای ابزار را مدیریت کند.

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

    اگر یک مدل محلی کوچک همچنان روی schemaهای ابزار شکست می‌خورد، روی ورودی آن مدل `compat.supportsTools: false` تنظیم کنید و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای درهم‌ریخته برمی‌گرداند">
    پاسخ‌های میزبانی‌شدهٔ Kimi/GLM که طولانی و شامل اجراهای نمادی غیرزبانی هستند، به‌جای پاسخ موفق assistant، به‌عنوان خروجی ناموفق provider در نظر گرفته می‌شوند. این باعث می‌شود تلاش دوباره، fallback، یا مدیریت خطای عادی بدون ماندگار کردن متن خراب در session وارد عمل شود.

    اگر این اتفاق تکرار شد، نام خام مدل، فایل session فعلی، و اینکه اجرا از `Cloud + Local` یا `Cloud only` استفاده کرده است را ثبت کنید، سپس یک session تازه و یک مدل fallback را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="مدل محلی سرد timeout می‌شود">
    مدل‌های محلی بزرگ می‌توانند پیش از شروع جریان‌دهی به بارگذاری اولیهٔ طولانی نیاز داشته باشند. timeout را محدود به provider مربوط به Ollama نگه دارید، و به‌صورت اختیاری از Ollama بخواهید مدل را بین نوبت‌ها بارگذاری‌شده نگه دارد:

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

    اگر خود میزبان در پذیرش اتصال‌ها کند است، `timeoutSeconds` همچنین timeout محافظت‌شدهٔ اتصال Undici را برای این provider افزایش می‌دهد.

  </Accordion>

  <Accordion title="مدل با context بزرگ بیش از حد کند است یا حافظه کم می‌آورد">
    بسیاری از مدل‌های Ollama contextهایی را اعلام می‌کنند که بزرگ‌تر از آن‌اند که سخت‌افزار شما بتواند با آسودگی اجرا کند. Ollama بومی از پیش‌فرض context مربوط به runtime خود Ollama استفاده می‌کند، مگر اینکه `params.num_ctx` را تنظیم کنید. وقتی latency قابل‌پیش‌بینی برای توکن اول می‌خواهید، هم بودجهٔ OpenClaw و هم context درخواست Ollama را محدود کنید:

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

    اگر OpenClaw prompt بیش از حدی ارسال می‌کند، ابتدا `contextWindow` را کاهش دهید. اگر Ollama یک context مربوط به runtime را بارگذاری می‌کند که برای ماشین بیش از حد بزرگ است، `params.num_ctx` را کاهش دهید. اگر تولید بیش از حد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Providerهای مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ providerها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    نحوهٔ انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="جست‌وجوی وب Ollama" href="/fa/tools/ollama-search" icon="magnifying-glass">
    جزئیات کامل راه‌اندازی و رفتار برای جست‌وجوی وب مبتنی بر Ollama.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
