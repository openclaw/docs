---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید
    - به راهنمای نصب و پیکربندی Ollama نیاز دارید
    - شما برای درک تصویر به مدل‌های بینایی Ollama نیاز دارید
summary: OpenClaw را با Ollama اجرا کنید (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:23:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw با API بومی Ollama (`/api/chat`) برای مدل‌های ابری میزبانی‌شده و سرورهای محلی/خودمیزبان Ollama یکپارچه می‌شود. می‌توانید از Ollama در سه حالت استفاده کنید: `Cloud + Local` از طریق یک میزبان Ollama در دسترس، `Cloud only` در برابر `https://ollama.com`، یا `Local only` در برابر یک میزبان Ollama در دسترس.

OpenClaw همچنین `ollama-cloud` را به‌عنوان شناسه ارائه‌دهنده میزبانی‌شده درجه‌یک برای
استفاده مستقیم از Ollama Cloud ثبت می‌کند. وقتی
مسیریابی فقط ابری را بدون اشتراک‌گذاری شناسه ارائه‌دهنده محلی `ollama` می‌خواهید، از ارجاع‌هایی مانند `ollama-cloud/kimi-k2.5:cloud` استفاده کنید.

برای صفحه راه‌اندازی اختصاصی فقط ابری، [Ollama Cloud](/fa/providers/ollama-cloud) را ببینید.

<Warning>
**کاربران راه‌دور Ollama**: از URL سازگار با OpenAI مربوط به `/v1` (`http://host:11434/v1`) با OpenClaw استفاده نکنید. این کار فراخوانی ابزار را خراب می‌کند و مدل‌ها ممکن است JSON خام ابزار را به‌صورت متن ساده خروجی دهند. به‌جای آن از URL API بومی Ollama استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

پیکربندی ارائه‌دهنده Ollama از `baseUrl` به‌عنوان کلید canonical استفاده می‌کند. OpenClaw برای سازگاری با نمونه‌های سبک OpenAI SDK، `baseURL` را نیز می‌پذیرد، اما پیکربندی جدید باید `baseUrl` را ترجیح دهد.

## قواعد احراز هویت

<AccordionGroup>
  <Accordion title="میزبان‌های محلی و LAN">
    میزبان‌های محلی و LAN مربوط به Ollama به توکن bearer واقعی نیاز ندارند. OpenClaw نشانگر محلی `ollama-local` را فقط برای URLهای پایه Ollama از نوع loopback، شبکه خصوصی، `.local` و نام میزبان ساده استفاده می‌کند.
  </Accordion>
  <Accordion title="میزبان‌های راه‌دور و Ollama Cloud">
    میزبان‌های عمومی راه‌دور و Ollama Cloud (`https://ollama.com`) به یک اعتبار واقعی از طریق `OLLAMA_API_KEY`، یک نمایه احراز هویت، یا `apiKey` ارائه‌دهنده نیاز دارند. برای استفاده مستقیم میزبانی‌شده، ارائه‌دهنده `ollama-cloud` را ترجیح دهید.
  </Accordion>
  <Accordion title="شناسه‌های ارائه‌دهنده سفارشی">
    شناسه‌های ارائه‌دهنده سفارشی که `api: "ollama"` را تنظیم می‌کنند از همان قواعد پیروی می‌کنند. برای مثال، یک ارائه‌دهنده `ollama-remote` که به یک میزبان خصوصی LAN Ollama اشاره می‌کند می‌تواند از `apiKey: "ollama-local"` استفاده کند و زیرعامل‌ها آن نشانگر را از طریق hook ارائه‌دهنده Ollama حل می‌کنند، به‌جای آنکه آن را به‌عنوان اعتبار گم‌شده در نظر بگیرند. جستجوی حافظه همچنین می‌تواند `agents.defaults.memorySearch.provider` را روی آن شناسه ارائه‌دهنده سفارشی تنظیم کند تا embeddingها از endpoint متناظر Ollama استفاده کنند.
  </Accordion>
  <Accordion title="نمایه‌های احراز هویت">
    `auth-profiles.json` اعتبار مربوط به یک شناسه ارائه‌دهنده را ذخیره می‌کند. تنظیمات endpoint (`baseUrl`، `api`، شناسه‌های مدل، سرآیندها، timeoutها) را در `models.providers.<id>` قرار دهید. فایل‌های قدیمی نمایه احراز هویت تخت مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب runtime نیستند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها با یک پشتیبان به نمایه canonical کلید API با نام `ollama-windows:default` بازنویسی شوند. `baseUrl` در آن فایل نویز سازگاری است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="دامنه embedding حافظه">
    وقتی از Ollama برای embeddingهای حافظه استفاده می‌شود، احراز هویت bearer به میزبانی محدود می‌شود که در آن اعلام شده است:

    - کلید سطح ارائه‌دهنده فقط به میزبان Ollama همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان embedding راه‌دور خودش ارسال می‌شود.
    - مقدار env صرف `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud در نظر گرفته می‌شود و به‌صورت پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع به کار

روش و حالت راه‌اندازی ترجیحی خود را انتخاب کنید.

<Tabs>
  <Tab title="Onboarding (پیشنهادی)">
    **بهترین برای:** سریع‌ترین مسیر به یک راه‌اندازی ابری یا محلی Ollama که کار می‌کند.

    <Steps>
      <Step title="اجرای onboarding">
        ```bash
        openclaw onboard
        ```

        از فهرست ارائه‌دهنده‌ها **Ollama** را انتخاب کنید.
      </Step>
      <Step title="حالت خود را انتخاب کنید">
        - **ابر + محلی** — میزبان محلی Ollama به‌همراه مدل‌های ابری که از طریق آن میزبان مسیریابی می‌شوند
        - **فقط ابر** — مدل‌های میزبانی‌شده Ollama از طریق `https://ollama.com`
        - **فقط محلی** — فقط مدل‌های محلی

      </Step>
      <Step title="یک مدل انتخاب کنید">
        `Cloud only` برای `OLLAMA_API_KEY` درخواست می‌دهد و پیش‌فرض‌های ابر میزبانی‌شده را پیشنهاد می‌کند. `Cloud + Local` و `Local only` یک URL پایه Ollama می‌خواهند، مدل‌های موجود را کشف می‌کنند، و اگر مدل محلی انتخاب‌شده هنوز موجود نباشد، آن را به‌صورت خودکار pull می‌کنند. وقتی Ollama یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` گزارش می‌کند، راه‌اندازی آن مدل نصب‌شده را یک بار نشان می‌دهد، به‌جای آنکه هم `gemma4` و هم `gemma4:latest` را نشان دهد یا alias ساده را دوباره pull کند. `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد شده است یا نه.
      </Step>
      <Step title="مطمئن شوید مدل موجود است">
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

  <Tab title="راه‌اندازی دستی">
    **بهترین برای:** کنترل کامل روی راه‌اندازی ابری یا محلی.

    <Steps>
      <Step title="ابر یا محلی را انتخاب کنید">
        - **ابر + محلی**: Ollama را نصب کنید، با `ollama signin` وارد شوید، و درخواست‌های ابری را از طریق آن میزبان مسیریابی کنید
        - **فقط ابر**: از `https://ollama.com` با یک `OLLAMA_API_KEY` استفاده کنید
        - **فقط محلی**: Ollama را از [ollama.com/download](https://ollama.com/download) نصب کنید

      </Step>
      <Step title="یک مدل محلی pull کنید (فقط محلی)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ollama را برای OpenClaw فعال کنید">
        برای `Cloud only`، از `OLLAMA_API_KEY` واقعی خود استفاده کنید. برای راه‌اندازی‌های متکی به میزبان، هر مقدار placeholder کار می‌کند:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="مدل خود را بررسی و تنظیم کنید">
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
  <Tab title="ابر + محلی">
    `Cloud + Local` از یک میزبان Ollama در دسترس به‌عنوان نقطه کنترل برای هر دو مدل محلی و ابری استفاده می‌کند. این جریان ترکیبی ترجیحی Ollama است.

    هنگام راه‌اندازی از **ابر + محلی** استفاده کنید. OpenClaw URL پایه Ollama را درخواست می‌دهد، مدل‌های محلی را از آن میزبان کشف می‌کند، و بررسی می‌کند که آیا میزبان با `ollama signin` برای دسترسی ابری وارد شده است یا نه. وقتی میزبان وارد شده باشد، OpenClaw همچنین پیش‌فرض‌های ابر میزبانی‌شده مانند `kimi-k2.5:cloud`، `minimax-m2.7:cloud` و `glm-5.1:cloud` را پیشنهاد می‌کند.

    اگر میزبان هنوز وارد نشده باشد، OpenClaw راه‌اندازی را تا وقتی `ollama signin` را اجرا کنید فقط محلی نگه می‌دارد.

  </Tab>

  <Tab title="فقط ابر">
    `Cloud only` در برابر API میزبانی‌شده Ollama در `https://ollama.com` اجرا می‌شود.

    هنگام راه‌اندازی از **فقط ابر** استفاده کنید. OpenClaw برای `OLLAMA_API_KEY` درخواست می‌دهد، `baseUrl: "https://ollama.com"` را تنظیم می‌کند، و فهرست مدل‌های ابر میزبانی‌شده را مقداردهی اولیه می‌کند. این مسیر به سرور محلی Ollama یا `ollama signin` نیاز **ندارد**.

    فهرست مدل‌های ابری که هنگام `openclaw onboard` نشان داده می‌شود، به‌صورت زنده از `https://ollama.com/api/tags` پر می‌شود و به ۵۰۰ مدخل محدود است، بنابراین انتخابگر به‌جای یک seed ایستا، کاتالوگ میزبانی‌شده فعلی را بازتاب می‌دهد. اگر `ollama.com` در زمان راه‌اندازی در دسترس نباشد یا هیچ مدلی برنگرداند، OpenClaw به پیشنهادهای hardcoded قبلی fallback می‌کند تا onboarding همچنان کامل شود.

    همچنین می‌توانید ارائه‌دهنده ابری درجه‌یک را مستقیم پیکربندی کنید:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="فقط محلی">
    در حالت فقط محلی، OpenClaw مدل‌ها را از نمونه پیکربندی‌شده Ollama کشف می‌کند. این مسیر برای سرورهای محلی یا خودمیزبان Ollama است.

    OpenClaw در حال حاضر `gemma4` را به‌عنوان پیش‌فرض محلی پیشنهاد می‌کند.

  </Tab>
</Tabs>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) را تنظیم می‌کنید و `models.providers.ollama` یا ارائه‌دهنده راه‌دور سفارشی دیگری با `api: "ollama"` تعریف **نمی‌کنید**، OpenClaw مدل‌ها را از نمونه محلی Ollama در `http://127.0.0.1:11434` کشف می‌کند.

| رفتار               | جزئیات                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| پرس‌وجوی کاتالوگ     | از `/api/tags` پرس‌وجو می‌کند                                                                                                                                         |
| تشخیص قابلیت         | از lookupهای best-effort مربوط به `/api/show` برای خواندن `contextWindow`، پارامترهای توسعه‌یافته `num_ctx` در Modelfile، و قابلیت‌ها از جمله vision/tools استفاده می‌کند |
| مدل‌های vision       | مدل‌هایی که قابلیت `vision` آن‌ها توسط `/api/show` گزارش می‌شود، به‌عنوان دارای قابلیت تصویر علامت‌گذاری می‌شوند (`input: ["text", "image"]`)، بنابراین OpenClaw تصویرها را به‌صورت خودکار در prompt تزریق می‌کند |
| تشخیص استدلال        | وقتی موجود باشد از قابلیت‌های `/api/show`، از جمله `thinking`، استفاده می‌کند؛ وقتی Ollama قابلیت‌ها را حذف کند به یک heuristic نام مدل (`r1`، `reasoning`، `think`) fallback می‌کند |
| محدودیت‌های توکن     | `maxTokens` را روی سقف پیش‌فرض حداکثر توکن Ollama که OpenClaw استفاده می‌کند تنظیم می‌کند                                                                            |
| هزینه‌ها             | همه هزینه‌ها را روی `0` تنظیم می‌کند                                                                                                                                  |

این کار از مدخل‌های دستی مدل جلوگیری می‌کند و در عین حال کاتالوگ را با نمونه محلی Ollama همسو نگه می‌دارد. می‌توانید از یک ارجاع کامل مانند `ollama/<pulled-model>:latest` در `infer model run` محلی استفاده کنید؛ OpenClaw آن مدل نصب‌شده را از کاتالوگ زنده Ollama بدون نیاز به مدخل دستی `models.json` حل می‌کند.

برای میزبان‌های Ollama واردشده، برخی مدل‌های `:cloud` ممکن است پیش از ظاهر شدن در `/api/tags` از طریق `/api/chat`
و `/api/show` قابل استفاده باشند. وقتی صراحتا یک ارجاع کامل
`ollama/<model>:cloud` را انتخاب می‌کنید، OpenClaw همان مدل گم‌شده دقیق را با
`/api/show` اعتبارسنجی می‌کند و فقط اگر Ollama فراداده مدل را تایید کند، آن را به کاتالوگ runtime اضافه می‌کند. غلط‌های املایی همچنان به‌عنوان مدل‌های ناشناخته fail می‌شوند، نه اینکه به‌صورت خودکار ایجاد شوند.

```bash
# See what models are available
ollama list
openclaw models list
```

برای یک smoke test محدود تولید متن که از سطح کامل ابزار عامل دوری می‌کند،
از `infer model run` محلی با یک ارجاع کامل مدل Ollama استفاده کنید:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

آن مسیر همچنان از ارائه‌دهنده پیکربندی‌شده، احراز هویت، و transport بومی Ollama
در OpenClaw استفاده می‌کند، اما یک نوبت chat-agent را شروع نمی‌کند یا زمینه MCP/ابزار را بارگذاری نمی‌کند. اگر
این موفق شد اما پاسخ‌های عادی عامل fail شدند، در مرحله بعد ظرفیت prompt/ابزار عامل مدل را عیب‌یابی کنید.

برای یک smoke test محدود مدل vision در همان مسیر سبک، یک یا چند
فایل تصویر به `infer model run` اضافه کنید. این کار prompt و تصویر را مستقیم به
مدل vision انتخاب‌شده Ollama ارسال می‌کند، بدون آنکه ابزارهای chat، حافظه، یا زمینه
نشست قبلی را بارگذاری کند:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` فایل‌هایی را می‌پذیرد که به‌صورت `image/*` شناسایی شده‌اند، از جمله ورودی‌های رایج PNG، JPEG و WebP. فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند. برای بازشناسی گفتار، به‌جای آن از `openclaw infer audio transcribe` استفاده کنید.

وقتی یک گفتگو را با `/model ollama/<model>` تغییر می‌دهید، OpenClaw آن را یک انتخاب دقیق کاربر در نظر می‌گیرد. اگر `baseUrl` پیکربندی‌شده‌ی Ollama در دسترس نباشد، پاسخ بعدی با خطای ارائه‌دهنده شکست می‌خورد، نه اینکه بی‌سروصدا از یک مدل fallback پیکربندی‌شده‌ی دیگر پاسخ دهد.

کارهای Cron ایزوله پیش از شروع نوبت عامل، یک بررسی ایمنی محلی اضافه انجام می‌دهند. اگر مدل انتخاب‌شده به یک ارائه‌دهنده‌ی Ollama محلی، شبکه‌ی خصوصی، یا `.local` resolve شود و `/api/tags` در دسترس نباشد، OpenClaw آن اجرای Cron را با وضعیت `skipped` و همراه با `ollama/<model>` انتخاب‌شده در متن خطا ثبت می‌کند. پیش‌بررسی endpoint به‌مدت ۵ دقیقه cache می‌شود، بنابراین چندین کار Cron که به همان daemon متوقف‌شده‌ی Ollama اشاره می‌کنند همگی درخواست‌های مدلِ شکست‌خورنده را اجرا نمی‌کنند.

مسیر متن محلی، مسیر native stream، و embeddings را در برابر Ollama محلی با این دستور live-verify کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای smoke testهای کلید API در Ollama Cloud، تست زنده را به `https://ollama.com` اشاره دهید و یک مدل hosted از catalog فعلی انتخاب کنید:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

smoke cloud متن، native stream و جستجوی وب را اجرا می‌کند. این تست به‌صورت پیش‌فرض برای `https://ollama.com` از embeddings صرف‌نظر می‌کند، چون کلیدهای API مربوط به Ollama Cloud ممکن است مجوز `/api/embed` را نداشته باشند. وقتی صراحتا می‌خواهید تست زنده در صورتی شکست بخورد که کلید cloud پیکربندی‌شده نتواند از endpoint embed استفاده کند، `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` را تنظیم کنید.

برای افزودن یک مدل جدید، کافی است آن را با Ollama pull کنید:

```bash
ollama pull mistral
```

مدل جدید به‌صورت خودکار کشف می‌شود و برای استفاده در دسترس خواهد بود.

<Note>
اگر `models.providers.ollama` را صراحتا تنظیم کنید، یا یک ارائه‌دهنده‌ی remote سفارشی مانند `models.providers.ollama-cloud` را با `api: "ollama"` پیکربندی کنید، کشف خودکار نادیده گرفته می‌شود و باید مدل‌ها را دستی تعریف کنید. ارائه‌دهندگان سفارشی loopback مانند `http://127.0.0.2:11434` همچنان محلی در نظر گرفته می‌شوند. بخش پیکربندی صریح زیر را ببینید.
</Note>

## بینایی و توصیف تصویر

Plugin همراه Ollama، Ollama را به‌عنوان یک ارائه‌دهنده‌ی media-understanding دارای قابلیت تصویر ثبت می‌کند. این کار به OpenClaw اجازه می‌دهد درخواست‌های صریح توصیف تصویر و پیش‌فرض‌های پیکربندی‌شده‌ی مدل تصویر را از طریق مدل‌های بینایی محلی یا hosted Ollama مسیریابی کند.

برای بینایی محلی، مدلی را pull کنید که از تصاویر پشتیبانی می‌کند:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

سپس با CLI infer تأیید کنید:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` باید یک ref کامل `<provider/model>` باشد. وقتی تنظیم شده باشد، `openclaw infer image describe` ابتدا همان مدل را امتحان می‌کند، به‌جای اینکه به‌دلیل پشتیبانی مدل از native vision از توصیف صرف‌نظر کند. اگر فراخوانی مدل شکست بخورد، OpenClaw می‌تواند از طریق `agents.defaults.imageModel.fallbacks` پیکربندی‌شده ادامه دهد؛ خطاهای آماده‌سازی فایل یا URL همچنان پیش از تلاش‌های fallback شکست می‌خورند.

وقتی جریان ارائه‌دهنده‌ی image-understanding در OpenClaw، `agents.defaults.imageModel` پیکربندی‌شده، و شکل خروجی توصیف تصویر را می‌خواهید، از `infer image describe` استفاده کنید. وقتی یک probe خام مدل چندوجهی با prompt سفارشی و یک یا چند تصویر می‌خواهید، از `infer model run --file` استفاده کنید.

برای اینکه Ollama مدل پیش‌فرض image-understanding برای رسانه‌ی ورودی باشد، `agents.defaults.imageModel` را پیکربندی کنید:

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

ref کامل `ollama/<model>` را ترجیح دهید. اگر همان مدل زیر `models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهنده‌ی تصویر پیکربندی‌شده‌ی دیگری آن شناسه‌ی مدل bare را expose نکند، OpenClaw همچنین یک ref bare برای `imageModel` مانند `qwen2.5vl:7b` را به `ollama/qwen2.5vl:7b` نرمال می‌کند. اگر بیش از یک ارائه‌دهنده‌ی تصویر پیکربندی‌شده همان شناسه‌ی bare را داشته باشد، prefix ارائه‌دهنده را صراحتا استفاده کنید.

مدل‌های بینایی محلی کند ممکن است به timeout طولانی‌تری برای image-understanding نسبت به مدل‌های cloud نیاز داشته باشند. همچنین وقتی Ollama تلاش می‌کند context کاملِ بیناییِ اعلام‌شده را روی سخت‌افزار محدود allocate کند، ممکن است crash کنند یا متوقف شوند. وقتی فقط به یک نوبت عادی توصیف تصویر نیاز دارید، یک timeout قابلیت تنظیم کنید و `num_ctx` را روی entry مدل محدود کنید:

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

این timeout برای فهم تصویر ورودی و همچنین برای ابزار صریح `image` اعمال می‌شود که عامل می‌تواند در طول یک نوبت فراخوانی کند. `models.providers.ollama.timeoutSeconds` در سطح ارائه‌دهنده همچنان guard زیربنایی درخواست HTTP مربوط به Ollama را برای فراخوانی‌های عادی مدل کنترل می‌کند.

ابزار صریح تصویر را در برابر Ollama محلی با این دستور live-verify کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را دستی تعریف می‌کنید، مدل‌های بینایی را با پشتیبانی ورودی تصویر مشخص کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توصیف تصویر را برای مدل‌هایی که به‌عنوان دارای قابلیت تصویر علامت‌گذاری نشده‌اند رد می‌کند. با کشف ضمنی، OpenClaw وقتی `/api/show` یک قابلیت بینایی گزارش می‌کند، این مورد را از Ollama می‌خواند.

## پیکربندی

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ساده‌ترین مسیر فعال‌سازی فقط-محلی از طریق متغیر محیطی است:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در entry ارائه‌دهنده حذف کنید و OpenClaw آن را برای بررسی‌های availability پر می‌کند.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    وقتی setup مربوط به hosted cloud می‌خواهید، Ollama روی host/port دیگری اجرا می‌شود، می‌خواهید context windowها یا فهرست‌های مدل مشخصی را اجباری کنید، یا تعریف‌های مدل کاملا دستی می‌خواهید، از پیکربندی صریح استفاده کنید.

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
    اگر Ollama روی host یا port متفاوتی اجرا می‌شود (پیکربندی صریح کشف خودکار را غیرفعال می‌کند، پس مدل‌ها را دستی تعریف کنید):

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
    `/v1` را به URL اضافه نکنید. مسیر `/v1` از حالت سازگار با OpenAI استفاده می‌کند که در آن tool calling قابل‌اعتماد نیست. URL پایه‌ی Ollama را بدون suffix مسیر استفاده کنید.
    </Warning>

  </Tab>
</Tabs>

## دستورالعمل‌های رایج

از این‌ها به‌عنوان نقطه‌ی شروع استفاده کنید و شناسه‌های مدل را با نام‌های دقیق از `ollama list` یا `openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    وقتی Ollama روی همان دستگاه Gateway اجرا می‌شود و می‌خواهید OpenClaw مدل‌های نصب‌شده را به‌صورت خودکار کشف کند، از این استفاده کنید.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    این مسیر پیکربندی را حداقلی نگه می‌دارد. مگر اینکه بخواهید مدل‌ها را دستی تعریف کنید، بلوک `models.providers.ollama` اضافه نکنید.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    برای hostهای LAN از URLهای native Ollama استفاده کنید. `/v1` را اضافه نکنید.

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

    `contextWindow` بودجه‌ی context در سمت OpenClaw است. `params.num_ctx` برای درخواست به Ollama ارسال می‌شود. وقتی سخت‌افزار شما نمی‌تواند context کامل اعلام‌شده‌ی مدل را اجرا کند، آن‌ها را هم‌راستا نگه دارید.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    وقتی daemon محلی اجرا نمی‌کنید و مدل‌های hosted Ollama را مستقیما می‌خواهید، از این استفاده کنید.

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
    وقتی یک daemon محلی یا LAN مربوط به Ollama با `ollama signin` وارد شده و باید هم مدل‌های محلی و هم مدل‌های `:cloud` را serve کند، از این استفاده کنید.

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
    وقتی بیش از یک سرور Ollama دارید، از شناسه‌های سفارشی ارائه‌دهنده استفاده کنید. هر ارائه‌دهنده میزبان، مدل‌ها، احراز هویت، مهلت زمانی و ارجاع‌های مدل خودش را دارد.

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

    وقتی OpenClaw درخواست را می‌فرستد، پیشوند ارائه‌دهنده فعال حذف می‌شود تا `ollama-large/qwen3.5:27b` به‌صورت `qwen3.5:27b` به Ollama برسد.

  </Accordion>

  <Accordion title="Lean local model profile">
    برخی مدل‌های محلی می‌توانند به پرامپت‌های ساده پاسخ دهند، اما با سطح کامل ابزارهای عامل مشکل دارند. پیش از تغییر تنظیمات سراسری runtime، ابتدا ابزارها و زمینه را محدود کنید.

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

    فقط زمانی از `compat.supportsTools: false` استفاده کنید که مدل یا سرور روی شِمای ابزارها به‌طور قابل اتکا شکست می‌خورد. این کار قابلیت عامل را با پایداری معاوضه می‌کند.
    `localModelLean` ابزارهای مرورگر، cron و پیام را از سطح مستقیم عامل حذف می‌کند و کاتالوگ‌های بزرگ‌تر را، جز زمانی که یک اجرا باید معنای تحویل مستقیم پیام را حفظ کند، پشت کنترل‌های ساختاریافته جست‌وجوی ابزار قرار می‌دهد؛ اما زمینه runtime یا حالت تفکر Ollama را تغییر نمی‌دهد. برای مدل‌های تفکر کوچک به سبک Qwen که وارد حلقه می‌شوند یا بودجه پاسخشان را صرف استدلال پنهان می‌کنند، آن را با `params.num_ctx` صریح و `params.thinking: false` همراه کنید.

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

شناسه‌های سفارشی ارائه‌دهنده Ollama نیز پشتیبانی می‌شوند. وقتی یک ارجاع مدل از پیشوند
ارائه‌دهنده فعال استفاده می‌کند، مانند `ollama-spark/qwen3:32b`، OpenClaw فقط همان
پیشوند را پیش از فراخوانی Ollama حذف می‌کند تا سرور `qwen3:32b` را دریافت کند.

برای مدل‌های محلی کند، پیش از افزایش مهلت زمانی کل runtime عامل، تنظیم درخواست در محدوده ارائه‌دهنده را ترجیح دهید:

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
سرآیندها، جریان‌دهی بدنه و کل لغو guarded-fetch. `params.keep_alive`
در درخواست‌های بومی `/api/chat` به‌صورت `keep_alive` سطح‌بالا به Ollama ارسال می‌شود؛
وقتی زمان بارگذاری نوبت اول گلوگاه است، آن را برای هر مدل تنظیم کنید.

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

برای میزبان‌های دوردست، `127.0.0.1` را با میزبانی که در `baseUrl` استفاده شده جایگزین کنید. اگر `curl` کار می‌کند اما OpenClaw کار نمی‌کند، بررسی کنید که آیا Gateway روی ماشین، کانتینر یا حساب سرویس متفاوتی اجرا می‌شود یا نه.

## جست‌وجوی وب Ollama

OpenClaw از **جست‌وجوی وب Ollama** به‌عنوان ارائه‌دهنده همراه `web_search` پشتیبانی می‌کند.

| ویژگی | جزئیات |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان | از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند (`models.providers.ollama.baseUrl` وقتی تنظیم شده باشد، وگرنه `http://127.0.0.1:11434`)؛ `https://ollama.com` مستقیما از API میزبانی‌شده استفاده می‌کند |
| احراز هویت | برای میزبان‌های محلی Ollama که وارد حساب شده‌اند بدون کلید است؛ برای جست‌وجوی مستقیم `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت، `OLLAMA_API_KEY` یا احراز هویت ارائه‌دهنده پیکربندی‌شده لازم است |
| پیش‌نیاز | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد حساب شده باشند؛ جست‌وجوی مستقیم میزبانی‌شده به `baseUrl: "https://ollama.com"` به‌علاوه یک کلید واقعی API Ollama نیاز دارد |

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

برای daemon محلی واردشده، OpenClaw از پراکسی `/api/experimental/web_search` همان daemon استفاده می‌کند. برای `https://ollama.com`، endpoint میزبانی‌شده `/api/web_search` را مستقیما فراخوانی می‌کند.

<Note>
برای جزئیات کامل راه‌اندازی و رفتار، [جست‌وجوی وب Ollama](/fa/tools/ollama-search) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **فراخوانی ابزار در حالت سازگار با OpenAI قابل اتکا نیست.** فقط زمانی از این حالت استفاده کنید که برای یک پراکسی به قالب OpenAI نیاز دارید و به رفتار بومی فراخوانی ابزار وابسته نیستید.
    </Warning>

    اگر لازم است به‌جای آن از endpoint سازگار با OpenAI استفاده کنید (برای مثال، پشت پراکسی‌ای که فقط قالب OpenAI را پشتیبانی می‌کند)، `api: "openai-completions"` را صریحا تنظیم کنید:

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

    این حالت ممکن است از جریان‌دهی و فراخوانی ابزار به‌طور هم‌زمان پشتیبانی نکند. شاید لازم باشد در پیکربندی مدل، جریان‌دهی را با `params: { streaming: false }` غیرفعال کنید.

    وقتی `api: "openai-completions"` با Ollama استفاده می‌شود، OpenClaw به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama بی‌صدا به پنجره زمینه 4096 برنگردد. اگر پراکسی/بالادست شما فیلدهای ناشناخته `options` را رد می‌کند، این رفتار را غیرفعال کنید:

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
    برای مدل‌های کشف‌شده خودکار، OpenClaw وقتی در دسترس باشد از پنجره زمینه گزارش‌شده توسط Ollama استفاده می‌کند، از جمله مقادیر بزرگ‌تر `PARAMETER num_ctx` از Modelfileهای سفارشی. در غیر این صورت، به پنجره زمینه پیش‌فرض Ollama که OpenClaw استفاده می‌کند برمی‌گردد.

    می‌توانید پیش‌فرض‌های `contextWindow`، `contextTokens` و `maxTokens` در سطح ارائه‌دهنده را برای هر مدل زیر آن ارائه‌دهنده Ollama تنظیم کنید، سپس در صورت نیاز آن‌ها را برای هر مدل بازنویسی کنید. `contextWindow` بودجه پرامپت و Compaction در OpenClaw است. درخواست‌های بومی Ollama، `options.num_ctx` را تنظیم‌نشده باقی می‌گذارند مگر اینکه `params.num_ctx` را صریحا پیکربندی کنید، تا Ollama بتواند پیش‌فرض خودش را بر اساس مدل، `OLLAMA_CONTEXT_LENGTH` یا VRAM اعمال کند. برای محدودکردن یا اجبار زمینه runtime هر درخواست Ollama بدون بازسازی Modelfile، `params.num_ctx` را تنظیم کنید؛ مقادیر نامعتبر، صفر، منفی و غیرمتناهی نادیده گرفته می‌شوند. اگر پیکربندی قدیمی‌تری را ارتقا داده‌اید که فقط از `contextWindow` یا `maxTokens` برای اجبار زمینه درخواست بومی Ollama استفاده می‌کرد، `openclaw doctor --fix` را اجرا کنید تا آن بودجه‌های صریح ارائه‌دهنده یا مدل را در `params.num_ctx` کپی کند. آداپتر Ollama سازگار با OpenAI همچنان به‌طور پیش‌فرض `options.num_ctx` را از `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر بالادست شما `options` را رد می‌کند، آن را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی Ollama همچنین گزینه‌های رایج runtime Ollama را زیر `params` می‌پذیرند، از جمله `temperature`، `top_p`، `top_k`، `min_p`، `num_predict`، `stop`، `repeat_penalty`، `num_batch`، `num_thread` و `use_mmap`. OpenClaw فقط کلیدهای درخواست Ollama را ارسال می‌کند، بنابراین پارامترهای runtime OpenClaw مانند `streaming` به Ollama نشت نمی‌کنند. برای ارسال `think` سطح‌بالای Ollama از `params.think` یا `params.thinking` استفاده کنید؛ `false` تفکر سطح API را برای مدل‌های تفکر به سبک Qwen غیرفعال می‌کند.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` برای هر مدل هم کار می‌کند. اگر هر دو پیکربندی شده باشند، ورودی صریح مدل ارائه‌دهنده بر پیش‌فرض عامل مقدم است.

  </Accordion>

  <Accordion title="Thinking control">
    برای مدل‌های بومی Ollama، OpenClaw کنترل تفکر را همان‌طور که Ollama انتظار دارد ارسال می‌کند: `think` سطح‌بالا، نه `options.think`. مدل‌های کشف‌شده خودکار که پاسخ `/api/show` آن‌ها قابلیت `thinking` را شامل می‌شود، `/think low`، `/think medium`، `/think high` و `/think max` را ارائه می‌کنند؛ مدل‌های بدون تفکر فقط `/think off` را ارائه می‌کنند.

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

    `params.think` یا `params.thinking` برای هر مدل می‌تواند تفکر API Ollama را برای یک مدل پیکربندی‌شده مشخص غیرفعال یا اجباری کند. OpenClaw این پارامترهای صریح مدل را زمانی حفظ می‌کند که اجرای فعال فقط پیش‌فرض ضمنی `off` را داشته باشد؛ فرمان‌های runtime غیر از off مانند `/think medium` همچنان اجرای فعال را بازنویسی می‌کنند.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw مدل‌هایی با نام‌هایی مانند `deepseek-r1`، `reasoning` یا `think` را به‌طور پیش‌فرض دارای قابلیت استدلال در نظر می‌گیرد.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    به پیکربندی اضافی نیاز نیست. OpenClaw آن‌ها را خودکار علامت‌گذاری می‌کند.

  </Accordion>

  <Accordion title="هزینه‌های مدل">
    Ollama رایگان است و به‌صورت محلی اجرا می‌شود، بنابراین همهٔ هزینه‌های مدل روی $0 تنظیم شده‌اند. این موضوع هم برای مدل‌های کشف‌شده به‌صورت خودکار و هم مدل‌هایی که دستی تعریف شده‌اند اعمال می‌شود.
  </Accordion>

  <Accordion title="تعبیه‌های حافظه">
    Plugin همراه Ollama یک ارائه‌دهندهٔ تعبیهٔ حافظه برای
    [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این Plugin از URL پایهٔ پیکربندی‌شدهٔ Ollama
    و کلید API استفاده می‌کند، endpoint فعلی `/api/embed` در Ollama را فراخوانی می‌کند، و در صورت امکان
    چند قطعهٔ حافظه را در یک درخواست `input` دسته‌بندی می‌کند.

    وقتی `proxy.enabled=true` باشد، درخواست‌های تعبیهٔ حافظهٔ Ollama به مبدأ دقیق
    local loopback میزبان که از `baseUrl` پیکربندی‌شده به‌دست آمده است، به‌جای پراکسی پیش‌برندهٔ مدیریت‌شده،
    از مسیر مستقیم محافظت‌شدهٔ OpenClaw استفاده می‌کنند. نام میزبان پیکربندی‌شده باید خودش `localhost`
    یا یک IP تحت‌اللفظی loopback باشد؛ نام‌های DNS که صرفاً به loopback resolve می‌شوند همچنان از مسیر پراکسی مدیریت‌شده استفاده می‌کنند.
    میزبان‌های Ollama در LAN، tailnet، شبکهٔ خصوصی و عمومی نیز روی مسیر پراکسی مدیریت‌شده باقی می‌مانند.
    تغییرمسیرها به میزبان یا پورت دیگر، اعتماد را به ارث نمی‌برند.
    اپراتورها همچنان می‌توانند تنظیم سراسری `proxy.loopbackMode: "proxy"` را برای
    ارسال ترافیک loopback از طریق پراکسی، یا `proxy.loopbackMode: "block"` را برای
    رد کردن اتصال‌های loopback پیش از باز کردن اتصال تنظیم کنند؛ برای اثر
    سراسری این تنظیم در سطح فرایند، [پراکسی مدیریت‌شده](/fa/security/network-proxy#gateway-loopback-mode) را ببینید.

    | ویژگی      | مقدار               |
    | ------------- | ------------------- |
    | مدل پیش‌فرض | `nomic-embed-text`  |
    | دریافت خودکار     | بله — اگر مدل تعبیه به‌صورت محلی موجود نباشد، به‌طور خودکار دریافت می‌شود |

    تعبیه‌های زمان پرس‌وجو برای مدل‌هایی که به پیشوندهای بازیابی نیاز دارند یا آن‌ها را توصیه می‌کنند، از جمله `nomic-embed-text`، `qwen3-embedding` و `mxbai-embed-large`، از این پیشوندها استفاده می‌کنند. دسته‌های سند حافظه خام باقی می‌مانند تا ایندکس‌های موجود به مهاجرت قالب نیاز نداشته باشند.

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

    برای یک میزبان تعبیهٔ راه‌دور، احراز هویت را به همان میزبان محدود نگه دارید:

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
    یکپارچه‌سازی Ollama در OpenClaw به‌طور پیش‌فرض از **API بومی Ollama** (`/api/chat`) استفاده می‌کند که هم‌زمان از جریان‌دهی و فراخوانی ابزار به‌طور کامل پشتیبانی می‌کند. به پیکربندی ویژه‌ای نیاز نیست.

    برای درخواست‌های بومی `/api/chat`، OpenClaw کنترل تفکر را نیز مستقیماً به Ollama منتقل می‌کند: `/think off` و `openclaw agent --thinking off` مقدار سطح‌بالای `think: false` را ارسال می‌کنند، مگر اینکه مقدار صریح `params.think`/`params.thinking` برای مدل پیکربندی شده باشد، در حالی که `/think low|medium|high` رشتهٔ تلاش `think` سطح‌بالای متناظر را ارسال می‌کند. `/think max` به بالاترین تلاش بومی Ollama یعنی `think: "high"` نگاشت می‌شود.

    <Tip>
    اگر لازم است از endpoint سازگار با OpenAI استفاده کنید، بخش «حالت قدیمی سازگار با OpenAI» در بالا را ببینید. ممکن است جریان‌دهی و فراخوانی ابزار در آن حالت هم‌زمان کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="حلقهٔ خرابی WSL2 (راه‌اندازی‌های مجدد تکراری)">
    در WSL2 همراه با NVIDIA/CUDA، نصب‌کنندهٔ رسمی Linux برای Ollama یک واحد systemd به نام `ollama.service` با `Restart=always` ایجاد می‌کند. اگر آن سرویس به‌صورت خودکار شروع شود و هنگام boot شدن WSL2 یک مدل مبتنی بر GPU را بارگذاری کند، Ollama می‌تواند هنگام بارگذاری مدل، حافظهٔ میزبان را pin کند. بازیابی حافظهٔ Hyper-V همیشه نمی‌تواند آن صفحه‌های pin‌شده را پس بگیرد، بنابراین Windows می‌تواند VM مربوط به WSL2 را خاتمه دهد، systemd دوباره Ollama را شروع می‌کند، و این چرخه تکرار می‌شود.

    شواهد رایج:

    - راه‌اندازی مجدد یا خاتمهٔ مکرر WSL2 از سمت Windows
    - CPU بالا در `app.slice` یا `ollama.service` اندکی پس از شروع WSL2
    - SIGTERM از سوی systemd، نه رویداد OOM-killer در Linux

    OpenClaw وقتی WSL2، فعال بودن `ollama.service` با `Restart=always`، و نشانگرهای قابل‌مشاهدهٔ CUDA را تشخیص دهد، یک هشدار راه‌اندازی ثبت می‌کند.

    راهکار کاهش اثر:

    ```bash
    sudo systemctl disable ollama
    ```

    این مورد را در سمت Windows به `%USERPROFILE%\.wslconfig` اضافه کنید، سپس `wsl --shutdown` را اجرا کنید:

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

  <Accordion title="Ollama شناسایی نشد">
    مطمئن شوید Ollama در حال اجراست و `OLLAMA_API_KEY` (یا یک پروفایل احراز هویت) را تنظیم کرده‌اید، و اینکه یک ورودی صریح `models.providers.ollama` تعریف نکرده‌اید:

    ```bash
    ollama serve
    ```

    بررسی کنید که API در دسترس باشد:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    اگر مدل شما فهرست نشده است، یا مدل را به‌صورت محلی دریافت کنید یا آن را به‌طور صریح در `models.providers.ollama` تعریف کنید.

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

  <Accordion title="میزبان راه‌دور با curl کار می‌کند اما با OpenClaw نه">
    از همان ماشین و runtimeای که Gateway را اجرا می‌کند، بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    علت‌های رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند، که به‌جای Ollama بومی رفتار سازگار با OpenAI را انتخاب می‌کند.
    - میزبان راه‌دور در سمت Ollama به تغییرات firewall یا bind شدن به LAN نیاز دارد.
    - مدل روی daemon لپ‌تاپ شما موجود است اما روی daemon راه‌دور نیست.

  </Accordion>

  <Accordion title="مدل، JSON ابزار را به‌صورت متن خروجی می‌دهد">
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

    اگر یک مدل محلی کوچک همچنان روی schemaهای ابزار شکست می‌خورد، روی ورودی همان مدل `compat.supportsTools: false` را تنظیم کنید و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای مخدوش برمی‌گرداند">
    پاسخ‌های میزبانی‌شدهٔ Kimi/GLM که طولانی و شامل رشته‌های نمادین غیرزبانی هستند، به‌جای پاسخ موفق assistant، خروجی ناموفق ارائه‌دهنده در نظر گرفته می‌شوند. این کار اجازه می‌دهد retry، fallback، یا مدیریت خطای عادی بدون پایدارسازی متن خراب‌شده در session کنترل را به‌دست بگیرد.

    اگر این اتفاق تکراری رخ داد، نام خام مدل، فایل session فعلی، و اینکه اجرا از `Cloud + Local` یا `Cloud only` استفاده کرده است را ثبت کنید، سپس یک session تازه و یک مدل fallback را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="مدل محلی سرد دچار timeout می‌شود">
    مدل‌های محلی بزرگ ممکن است پیش از شروع جریان‌دهی به اولین بارگذاری طولانی نیاز داشته باشند. timeout را محدود به ارائه‌دهندهٔ Ollama نگه دارید، و به‌صورت اختیاری از Ollama بخواهید مدل را بین نوبت‌ها بارگذاری‌شده نگه دارد:

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

    اگر خود میزبان در پذیرش اتصال کند است، `timeoutSeconds` همچنین timeout اتصال محافظت‌شدهٔ Undici را برای این ارائه‌دهنده افزایش می‌دهد.

  </Accordion>

  <Accordion title="مدل با زمینهٔ بزرگ بیش از حد کند است یا حافظه‌اش تمام می‌شود">
    بسیاری از مدل‌های Ollama زمینه‌هایی را اعلام می‌کنند که بزرگ‌تر از آن‌اند که سخت‌افزار شما بتواند به‌راحتی اجرا کند. Ollama بومی از پیش‌فرض زمینهٔ runtime خود Ollama استفاده می‌کند، مگر اینکه `params.num_ctx` را تنظیم کنید. وقتی latency قابل‌پیش‌بینی برای نخستین token می‌خواهید، هم بودجهٔ OpenClaw و هم زمینهٔ درخواست Ollama را محدود کنید:

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

    اگر OpenClaw مقدار زیادی prompt ارسال می‌کند، ابتدا `contextWindow` را کاهش دهید. اگر Ollama در حال بارگذاری زمینهٔ runtimeای است که برای ماشین بیش از حد بزرگ است، `params.num_ctx` را کاهش دهید. اگر تولید خروجی بیش از حد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
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
