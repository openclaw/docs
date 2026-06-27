---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های ابری یا محلی از طریق Ollama اجرا کنید
    - به راهنمای راه‌اندازی و پیکربندی Ollama نیاز دارید
    - شما مدل‌های بینایی Ollama را برای درک تصویر می‌خواهید
summary: اجرای OpenClaw با Ollama (مدل‌های ابری و محلی)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:42:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw برای مدل‌های ابری میزبانی‌شده و سرورهای Ollama محلی/خودمیزبان با API بومی Ollama (`/api/chat`) یکپارچه می‌شود. می‌توانید از Ollama در سه حالت استفاده کنید: `Cloud + Local` از طریق یک میزبان Ollama در دسترس، `Cloud only` در برابر `https://ollama.com`، یا `Local only` در برابر یک میزبان Ollama در دسترس.

OpenClaw همچنین `ollama-cloud` را به‌عنوان شناسه ارائه‌دهنده میزبانی‌شده درجه‌اول برای استفاده مستقیم از Ollama Cloud ثبت می‌کند. وقتی مسیریابی فقط ابری را بدون اشتراک‌گذاری شناسه ارائه‌دهنده محلی `ollama` می‌خواهید، از ارجاع‌هایی مانند `ollama-cloud/kimi-k2.5:cloud` استفاده کنید.

برای صفحه راه‌اندازی اختصاصی فقط ابری، [Ollama Cloud](/fa/providers/ollama-cloud) را ببینید.

<Warning>
**کاربران Ollama راه‌دور**: از URL سازگار با OpenAI با مسیر `/v1` (`http://host:11434/v1`) همراه OpenClaw استفاده نکنید. این کار فراخوانی ابزار را خراب می‌کند و مدل‌ها ممکن است JSON خام ابزار را به‌صورت متن ساده خروجی دهند. به‌جای آن از URL API بومی Ollama استفاده کنید: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

پیکربندی ارائه‌دهنده Ollama از `baseUrl` به‌عنوان کلید مرجع استفاده می‌کند. OpenClaw برای سازگاری با نمونه‌های سبک OpenAI SDK مقدار `baseURL` را نیز می‌پذیرد، اما پیکربندی جدید باید `baseUrl` را ترجیح دهد.

## قواعد احراز هویت

<AccordionGroup>
  <Accordion title="میزبان‌های محلی و LAN">
    میزبان‌های Ollama محلی و LAN به توکن bearer واقعی نیاز ندارند. OpenClaw نشانگر محلی `ollama-local` را فقط برای URLهای پایه Ollama از نوع loopback، شبکه خصوصی، `.local` و نام میزبان ساده استفاده می‌کند.
  </Accordion>
  <Accordion title="میزبان‌های راه‌دور و Ollama Cloud">
    میزبان‌های عمومی راه‌دور و Ollama Cloud (`https://ollama.com`) به اعتبارنامه واقعی از طریق `OLLAMA_API_KEY`، یک نمایه احراز هویت، یا `apiKey` ارائه‌دهنده نیاز دارند. برای استفاده مستقیم میزبانی‌شده، ارائه‌دهنده `ollama-cloud` را ترجیح دهید.
  </Accordion>
  <Accordion title="شناسه‌های ارائه‌دهنده سفارشی">
    شناسه‌های ارائه‌دهنده سفارشی که `api: "ollama"` را تنظیم می‌کنند از همان قواعد پیروی می‌کنند. برای نمونه، یک ارائه‌دهنده `ollama-remote` که به میزبان خصوصی Ollama در LAN اشاره می‌کند می‌تواند از `apiKey: "ollama-local"` استفاده کند و زیرفعال‌ها آن نشانگر را از طریق هوک ارائه‌دهنده Ollama حل می‌کنند، به‌جای اینکه آن را اعتبارنامه گمشده تلقی کنند. جست‌وجوی حافظه نیز می‌تواند `agents.defaults.memorySearch.provider` را روی همان شناسه ارائه‌دهنده سفارشی تنظیم کند تا embeddingها از endpoint متناظر Ollama استفاده کنند.
  </Accordion>
  <Accordion title="نمایه‌های احراز هویت">
    `auth-profiles.json` اعتبارنامه را برای یک شناسه ارائه‌دهنده ذخیره می‌کند. تنظیمات endpoint (`baseUrl`، `api`، شناسه‌های مدل، headerها، timeoutها) را در `models.providers.<id>` قرار دهید. فایل‌های قدیمی نمایه احراز هویت تخت مانند `{ "ollama-windows": { "apiKey": "ollama-local" } }` قالب runtime نیستند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها با پشتیبان‌گیری به نمایه کلید API مرجع `ollama-windows:default` بازنویسی شوند. `baseUrl` در آن فایل نویز سازگاری است و باید به پیکربندی ارائه‌دهنده منتقل شود.
  </Accordion>
  <Accordion title="دامنه embedding حافظه">
    وقتی Ollama برای embeddingهای حافظه استفاده می‌شود، احراز هویت bearer به میزبانی محدود می‌شود که در آن اعلام شده است:

    - کلید سطح ارائه‌دهنده فقط به میزبان Ollama همان ارائه‌دهنده ارسال می‌شود.
    - `agents.*.memorySearch.remote.apiKey` فقط به میزبان embedding راه‌دور خودش ارسال می‌شود.
    - مقدار env خالص `OLLAMA_API_KEY` به‌عنوان قرارداد Ollama Cloud تلقی می‌شود و به‌طور پیش‌فرض به میزبان‌های محلی یا خودمیزبان ارسال نمی‌شود.

  </Accordion>
</AccordionGroup>

## شروع به کار

روش و حالت راه‌اندازی دلخواه خود را انتخاب کنید.

<Tabs>
  <Tab title="آنبوردینگ (توصیه‌شده)">
    **بهترین برای:** سریع‌ترین مسیر به راه‌اندازی Ollama ابری یا محلیِ در حال کار.

    <Steps>
      <Step title="اجرای آنبوردینگ">
        ```bash
        openclaw onboard
        ```

        از فهرست ارائه‌دهندگان **Ollama** را انتخاب کنید.
      </Step>
      <Step title="انتخاب حالت">
        - **ابری + محلی** — میزبان Ollama محلی به‌همراه مدل‌های ابری که از طریق همان میزبان مسیریابی می‌شوند
        - **فقط ابری** — مدل‌های Ollama میزبانی‌شده از طریق `https://ollama.com`
        - **فقط محلی** — فقط مدل‌های محلی

      </Step>
      <Step title="انتخاب مدل">
        `Cloud only` مقدار `OLLAMA_API_KEY` را درخواست می‌کند و پیش‌فرض‌های ابری میزبانی‌شده را پیشنهاد می‌دهد. `Cloud + Local` و `Local only` یک URL پایه Ollama می‌خواهند، مدل‌های موجود را کشف می‌کنند، و اگر مدل محلی انتخاب‌شده هنوز موجود نباشد آن را به‌صورت خودکار pull می‌کنند. وقتی Ollama یک برچسب نصب‌شده `:latest` مانند `gemma4:latest` گزارش می‌کند، راه‌اندازی آن مدل نصب‌شده را یک‌بار نشان می‌دهد، به‌جای اینکه هم `gemma4` و هم `gemma4:latest` را نشان دهد یا alias ساده را دوباره pull کند. `Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد حساب شده است یا نه.
      </Step>
      <Step title="تأیید موجود بودن مدل">
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

    در صورت نیاز یک URL پایه یا مدل سفارشی مشخص کنید:

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
      <Step title="انتخاب ابری یا محلی">
        - **ابری + محلی**: Ollama را نصب کنید، با `ollama signin` وارد شوید، و درخواست‌های ابری را از طریق همان میزبان مسیریابی کنید
        - **فقط ابری**: از `https://ollama.com` با یک `OLLAMA_API_KEY` استفاده کنید
        - **فقط محلی**: Ollama را از [ollama.com/download](https://ollama.com/download) نصب کنید

      </Step>
      <Step title="Pull کردن یک مدل محلی (فقط محلی)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="فعال‌سازی Ollama برای OpenClaw">
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
      <Step title="بررسی و تنظیم مدل">
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
  <Tab title="ابری + محلی">
    `Cloud + Local` از یک میزبان Ollama در دسترس به‌عنوان نقطه کنترل برای هر دو نوع مدل محلی و ابری استفاده می‌کند. این جریان ترکیبی ترجیحی Ollama است.

    هنگام راه‌اندازی از **ابری + محلی** استفاده کنید. OpenClaw مقدار URL پایه Ollama را درخواست می‌کند، مدل‌های محلی را از آن میزبان کشف می‌کند، و بررسی می‌کند که آیا میزبان با `ollama signin` برای دسترسی ابری وارد حساب شده است یا نه. وقتی میزبان وارد حساب شده باشد، OpenClaw پیش‌فرض‌های ابری میزبانی‌شده مانند `kimi-k2.5:cloud`، `minimax-m2.7:cloud` و `glm-5.1:cloud` را نیز پیشنهاد می‌دهد.

    اگر میزبان هنوز وارد حساب نشده باشد، OpenClaw تا زمانی که `ollama signin` را اجرا کنید راه‌اندازی را فقط محلی نگه می‌دارد.

  </Tab>

  <Tab title="فقط ابری">
    `Cloud only` در برابر API میزبانی‌شده Ollama در `https://ollama.com` اجرا می‌شود.

    هنگام راه‌اندازی از **فقط ابری** استفاده کنید. OpenClaw مقدار `OLLAMA_API_KEY` را درخواست می‌کند، `baseUrl: "https://ollama.com"` را تنظیم می‌کند، و فهرست مدل‌های ابری میزبانی‌شده را مقداردهی اولیه می‌کند. این مسیر به سرور Ollama محلی یا `ollama signin` نیاز ندارد.

    فهرست مدل‌های ابری که هنگام `openclaw onboard` نشان داده می‌شود به‌صورت زنده از `https://ollama.com/api/tags` پر می‌شود، سقف آن ۵۰۰ ورودی است، بنابراین انتخاب‌گر به‌جای یک seed ایستا، کاتالوگ میزبانی‌شده فعلی را بازتاب می‌دهد. اگر `ollama.com` در زمان راه‌اندازی در دسترس نباشد یا هیچ مدلی برنگرداند، OpenClaw به پیشنهادهای hardcoded قبلی برمی‌گردد تا آنبوردینگ همچنان کامل شود.

    می‌توانید ارائه‌دهنده ابری درجه‌اول را نیز مستقیم پیکربندی کنید:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="فقط محلی">
    در حالت فقط محلی، OpenClaw مدل‌ها را از نمونه Ollama پیکربندی‌شده کشف می‌کند. این مسیر برای سرورهای Ollama محلی یا خودمیزبان است.

    OpenClaw در حال حاضر `gemma4` را به‌عنوان پیش‌فرض محلی پیشنهاد می‌دهد.

  </Tab>
</Tabs>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `OLLAMA_API_KEY` (یا یک نمایه احراز هویت) را تنظیم می‌کنید و `models.providers.ollama` یا ارائه‌دهنده راه‌دور سفارشی دیگری با `api: "ollama"` تعریف **نمی‌کنید**، OpenClaw مدل‌ها را از نمونه Ollama محلی در `http://127.0.0.1:11434` کشف می‌کند.

| رفتار             | جزئیات                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| پرس‌وجوی کاتالوگ        | از `/api/tags` پرس‌وجو می‌کند                                                                                                                                                  |
| تشخیص قابلیت | از lookupهای best-effort به `/api/show` برای خواندن `contextWindow`، پارامترهای Modelfile گسترش‌یافته `num_ctx`، و قابلیت‌ها از جمله vision/tools استفاده می‌کند                       |
| مدل‌های بینایی        | مدل‌هایی که قابلیت `vision` توسط `/api/show` برای آن‌ها گزارش شده است به‌عنوان دارای قابلیت تصویر علامت‌گذاری می‌شوند (`input: ["text", "image"]`)، بنابراین OpenClaw تصویرها را به‌صورت خودکار به prompt تزریق می‌کند  |
| تشخیص استدلال  | در صورت موجود بودن از قابلیت‌های `/api/show`، از جمله `thinking`، استفاده می‌کند؛ وقتی Ollama قابلیت‌ها را حذف کند به heuristic نام مدل (`r1`، `reasoning`، `think`) برمی‌گردد |
| محدودیت‌های توکن         | `maxTokens` را روی سقف پیش‌فرض حداکثر توکن Ollama که OpenClaw استفاده می‌کند تنظیم می‌کند                                                                                                |
| هزینه‌ها                | همه هزینه‌ها را روی `0` تنظیم می‌کند                                                                                                                                                |

این کار از ورودی‌های دستی مدل جلوگیری می‌کند و در عین حال کاتالوگ را با نمونه Ollama محلی همسو نگه می‌دارد. می‌توانید در `infer model run` محلی از یک ارجاع کامل مانند `ollama/<pulled-model>:latest` استفاده کنید؛ OpenClaw آن مدل نصب‌شده را از کاتالوگ زنده Ollama حل می‌کند، بدون اینکه به ورودی دستی `models.json` نیاز داشته باشد.

برای میزبان‌های Ollama که وارد حساب شده‌اند، برخی مدل‌های `:cloud` ممکن است پیش از اینکه در `/api/tags` ظاهر شوند از طریق `/api/chat` و `/api/show` قابل استفاده باشند. وقتی یک ارجاع کامل `ollama/<model>:cloud` را صریح انتخاب می‌کنید، OpenClaw همان مدل گمشده را با `/api/show` اعتبارسنجی می‌کند و فقط اگر Ollama فراداده مدل را تأیید کند آن را به کاتالوگ runtime اضافه می‌کند. خطاهای تایپی همچنان به‌جای اینکه به‌صورت خودکار ساخته شوند، به‌عنوان مدل‌های ناشناخته شکست می‌خورند.

```bash
# See what models are available
ollama list
openclaw models list
```

برای یک smoke test باریک تولید متن که از سطح کامل ابزار agent دوری می‌کند، از `infer model run` محلی با یک ارجاع کامل مدل Ollama استفاده کنید:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

آن مسیر همچنان از ارائه‌دهنده پیکربندی‌شده OpenClaw، احراز هویت، و transport بومی Ollama استفاده می‌کند، اما یک نوبت chat-agent را شروع نمی‌کند و زمینه MCP/ابزار را بارگذاری نمی‌کند. اگر این موفق شود اما پاسخ‌های عادی agent شکست بخورند، در گام بعد ظرفیت prompt/ابزار agent مدل را عیب‌یابی کنید.

برای یک smoke test باریک مدل بینایی در همان مسیر سبک، یک یا چند فایل تصویر به `infer model run` اضافه کنید. این کار prompt و تصویر را مستقیم به مدل بینایی Ollama انتخاب‌شده ارسال می‌کند، بدون اینکه ابزارهای chat، حافظه، یا زمینه session قبلی را بارگذاری کند:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` فایل‌هایی را که به‌صورت `image/*` تشخیص داده شوند می‌پذیرد، از جمله ورودی‌های رایج PNG،
JPEG و WebP. فایل‌های غیرتصویری پیش از فراخوانی Ollama رد می‌شوند.
برای تشخیص گفتار، به‌جای آن از `openclaw infer audio transcribe` استفاده کنید.

وقتی یک مکالمه را با `/model ollama/<model>` تغییر می‌دهید، OpenClaw آن را
به‌عنوان انتخاب دقیق کاربر در نظر می‌گیرد. اگر `baseUrl` پیکربندی‌شده Ollama
در دسترس نباشد، پاسخ بعدی با خطای ارائه‌دهنده شکست می‌خورد، نه اینکه بی‌صدا
از یک مدل fallback پیکربندی‌شده دیگر پاسخ دهد.

کارهای cron ایزوله پیش از شروع نوبت agent یک بررسی ایمنی محلی اضافه انجام می‌دهند.
اگر مدل انتخاب‌شده به یک ارائه‌دهنده Ollama محلی، شبکه خصوصی، یا `.local`
حل شود و `/api/tags` در دسترس نباشد، OpenClaw آن اجرای cron را
به‌صورت `skipped` با `ollama/<model>` انتخاب‌شده در متن خطا ثبت می‌کند. پیش‌بررسی endpoint
به‌مدت ۵ دقیقه cache می‌شود، بنابراین چندین کار cron که به همان daemon متوقف‌شده Ollama
اشاره می‌کنند، همگی درخواست‌های مدل شکست‌خورده را اجرا نمی‌کنند.

مسیر متن محلی، مسیر stream بومی، و embeddings را در برابر Ollama محلی به‌صورت live-verify اجرا کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

برای smoke testهای کلید API Ollama Cloud، live test را به `https://ollama.com`
اشاره دهید و یک مدل میزبانی‌شده از catalog فعلی انتخاب کنید:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

smoke ابری متن، stream بومی، و جست‌وجوی وب را اجرا می‌کند. embeddings را به‌صورت
پیش‌فرض برای `https://ollama.com` رد می‌کند، چون کلیدهای API Ollama Cloud ممکن است
برای `/api/embed` مجوز نداشته باشند. وقتی صراحتا می‌خواهید
live test در صورت ناتوانی کلید ابری پیکربندی‌شده در استفاده از endpoint embed شکست بخورد،
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` را تنظیم کنید.

برای افزودن یک مدل جدید، کافی است آن را با Ollama pull کنید:

```bash
ollama pull mistral
```

مدل جدید به‌صورت خودکار کشف می‌شود و برای استفاده در دسترس خواهد بود.

<Note>
اگر `models.providers.ollama` را صراحتا تنظیم کنید، یا یک ارائه‌دهنده remote سفارشی مانند `models.providers.ollama-cloud` را با `api: "ollama"` پیکربندی کنید، auto-discovery رد می‌شود و باید مدل‌ها را دستی تعریف کنید. ارائه‌دهندگان سفارشی loopback مانند `http://127.0.0.2:11434` همچنان محلی در نظر گرفته می‌شوند. بخش پیکربندی صریح زیر را ببینید.
</Note>

## بینایی و توصیف تصویر

پلاگین bundled Ollama، Ollama را به‌عنوان یک ارائه‌دهنده درک رسانه با قابلیت تصویر ثبت می‌کند. این به OpenClaw اجازه می‌دهد درخواست‌های صریح توصیف تصویر و پیش‌فرض‌های پیکربندی‌شده مدل تصویر را از طریق مدل‌های vision محلی یا میزبانی‌شده Ollama route کند.

برای vision محلی، مدلی را pull کنید که از تصاویر پشتیبانی می‌کند:

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

`--model` باید یک ref کامل `<provider/model>` باشد. وقتی تنظیم شده باشد، `openclaw infer image describe` آن مدل را مستقیما اجرا می‌کند، به‌جای اینکه چون مدل از vision بومی پشتیبانی می‌کند، توصیف را رد کند.

وقتی جریان ارائه‌دهنده درک تصویر OpenClaw، `agents.defaults.imageModel` پیکربندی‌شده، و شکل خروجی توصیف تصویر را می‌خواهید، از `infer image describe` استفاده کنید. وقتی یک probe خام مدل multimodal با prompt سفارشی و یک یا چند تصویر می‌خواهید، از `infer model run --file` استفاده کنید.

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

ref کامل `ollama/<model>` را ترجیح دهید. اگر همان مدل زیر `models.providers.ollama.models` با `input: ["text", "image"]` فهرست شده باشد و هیچ ارائه‌دهنده تصویر پیکربندی‌شده دیگری آن شناسه مدل bare را expose نکند، OpenClaw یک ref bare برای `imageModel` مانند `qwen2.5vl:7b` را نیز به `ollama/qwen2.5vl:7b` normalize می‌کند. اگر بیش از یک ارائه‌دهنده تصویر پیکربندی‌شده همان شناسه bare را داشته باشد، prefix ارائه‌دهنده را صراحتا استفاده کنید.

مدل‌های vision محلی کند ممکن است به timeout طولانی‌تری برای درک تصویر نسبت به مدل‌های ابری نیاز داشته باشند. همچنین وقتی Ollama تلاش می‌کند context کامل vision اعلام‌شده را روی سخت‌افزار محدود allocate کند، ممکن است crash کنند یا متوقف شوند. یک timeout قابلیت تنظیم کنید، و وقتی فقط به یک نوبت عادی توصیف تصویر نیاز دارید، `num_ctx` را روی ورودی مدل cap کنید:

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

ابزار صریح تصویر را در برابر Ollama محلی به‌صورت live-verify اجرا کنید با:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

اگر `models.providers.ollama.models` را دستی تعریف می‌کنید، مدل‌های vision را با پشتیبانی ورودی تصویر مشخص کنید:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw درخواست‌های توصیف تصویر را برای مدل‌هایی که image-capable علامت‌گذاری نشده‌اند رد می‌کند. با کشف ضمنی، OpenClaw وقتی `/api/show` یک قابلیت vision گزارش می‌کند، این را از Ollama می‌خواند.

## پیکربندی

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ساده‌ترین مسیر فعال‌سازی فقط محلی از طریق متغیر محیطی است:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    اگر `OLLAMA_API_KEY` تنظیم شده باشد، می‌توانید `apiKey` را در ورودی ارائه‌دهنده حذف کنید و OpenClaw آن را برای بررسی‌های availability پر می‌کند.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    وقتی setup ابری میزبانی‌شده می‌خواهید، Ollama روی host/port دیگری اجرا می‌شود، می‌خواهید context windowها یا فهرست مدل‌های خاصی را force کنید، یا تعریف‌های کاملا دستی مدل می‌خواهید، از پیکربندی صریح استفاده کنید.

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
    اگر Ollama روی host یا port متفاوتی اجرا می‌شود (پیکربندی صریح auto-discovery را غیرفعال می‌کند، پس مدل‌ها را دستی تعریف کنید):

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
    `/v1` را به URL اضافه نکنید. مسیر `/v1` از حالت سازگار با OpenAI استفاده می‌کند، جایی که tool calling قابل اتکا نیست. از URL پایه Ollama بدون پسوند path استفاده کنید.
    </Warning>

  </Tab>
</Tabs>

## دستورهای رایج

از این‌ها به‌عنوان نقطه شروع استفاده کنید و شناسه‌های مدل را با نام‌های دقیق از `ollama list` یا `openclaw models list --provider ollama` جایگزین کنید.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    وقتی Ollama روی همان ماشین Gateway اجرا می‌شود و می‌خواهید OpenClaw مدل‌های نصب‌شده را به‌صورت خودکار کشف کند، از این استفاده کنید.

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
    برای hostهای LAN از URLهای بومی Ollama استفاده کنید. `/v1` اضافه نکنید.

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

    `contextWindow` بودجه context سمت OpenClaw است. `params.num_ctx` برای درخواست به Ollama ارسال می‌شود. وقتی سخت‌افزار شما نمی‌تواند context کامل اعلام‌شده مدل را اجرا کند، آن‌ها را هم‌راستا نگه دارید.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    وقتی daemon محلی اجرا نمی‌کنید و مدل‌های میزبانی‌شده Ollama را مستقیما می‌خواهید، از این استفاده کنید.

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
    وقتی یک daemon محلی یا LAN Ollama با `ollama signin` وارد شده و باید هم مدل‌های محلی و هم مدل‌های `:cloud` را سرو کند، از این استفاده کنید.

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
    وقتی بیش از یک سرور Ollama دارید، از شناسه‌های ارائه‌دهنده سفارشی استفاده کنید. هر ارائه‌دهنده host، مدل‌ها، auth، timeout، و refهای مدل خودش را دارد.

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

    وقتی OpenClaw درخواست را ارسال می‌کند، پیشوند ارائه‌دهندهٔ فعال حذف می‌شود تا `ollama-large/qwen3.5:27b` به‌صورت `qwen3.5:27b` به Ollama برسد.

  </Accordion>

  <Accordion title="Lean local model profile">
    بعضی مدل‌های محلی می‌توانند به پرامپت‌های ساده پاسخ دهند، اما با سطح کامل ابزارهای عامل مشکل دارند. پیش از تغییر تنظیمات سراسری زمان اجرای سیستم، ابتدا ابزارها و زمینه را محدود کنید.

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

    از `compat.supportsTools: false` فقط زمانی استفاده کنید که مدل یا سرور به‌طور قابل‌اعتماد روی شِمای ابزارها شکست می‌خورد. این گزینه قابلیت‌های عامل را با پایداری معاوضه می‌کند.
    `localModelLean` ابزارهای مرورگر، cron و پیام را از سطح مستقیم عامل حذف می‌کند و کاتالوگ‌های بزرگ‌تر را به‌طور پیش‌فرض پشت کنترل‌های ساختاریافتهٔ جست‌وجوی ابزار قرار می‌دهد، مگر زمانی که یک اجرا باید معناشناسی تحویل مستقیم پیام را حفظ کند؛ اما زمینهٔ زمان اجرای Ollama یا حالت تفکر آن را تغییر نمی‌دهد. برای مدل‌های کوچکِ متفکر به سبک Qwen که وارد حلقه می‌شوند یا بودجهٔ پاسخ خود را صرف استدلال پنهان می‌کنند، آن را با `params.num_ctx` صریح و `params.thinking: false` همراه کنید.

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

شناسه‌های سفارشی ارائه‌دهندهٔ Ollama نیز پشتیبانی می‌شوند. وقتی مرجع مدل از پیشوند
ارائه‌دهندهٔ فعال استفاده کند، مانند `ollama-spark/qwen3:32b`، OpenClaw فقط همان
پیشوند را پیش از فراخوانی Ollama حذف می‌کند تا سرور `qwen3:32b` را دریافت کند.

برای مدل‌های محلی کند، پیش از افزایش مهلت زمانی کل زمان اجرای عامل، تنظیم درخواست
در محدودهٔ ارائه‌دهنده را ترجیح دهید:

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

`timeoutSeconds` روی درخواست HTTP مدل اعمال می‌شود، از جمله راه‌اندازی اتصال،
سرآیندها، جریان‌یابی بدنه و لغو کل fetch محافظت‌شده. `params.keep_alive`
در درخواست‌های بومی `/api/chat` به‌صورت `keep_alive` در سطح بالا به Ollama ارسال می‌شود؛
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

برای میزبان‌های راه دور، `127.0.0.1` را با میزبانی جایگزین کنید که در `baseUrl` استفاده شده است. اگر `curl` کار می‌کند اما OpenClaw نه، بررسی کنید که آیا Gateway روی ماشین، کانتینر یا حساب سرویس متفاوتی اجرا می‌شود یا نه.

## جست‌وجوی وب Ollama

OpenClaw از **جست‌وجوی وب Ollama** به‌عنوان ارائه‌دهندهٔ همراه `web_search` پشتیبانی می‌کند.

| ویژگی       | جزئیات                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| میزبان      | از میزبان پیکربندی‌شدهٔ Ollama شما استفاده می‌کند (`models.providers.ollama.baseUrl` وقتی تنظیم شده باشد، وگرنه `http://127.0.0.1:11434`)؛ `https://ollama.com` مستقیماً از API میزبانی‌شده استفاده می‌کند |
| احراز هویت  | برای میزبان‌های محلی Ollama که وارد حساب شده‌اند بدون کلید است؛ برای جست‌وجوی مستقیم `https://ollama.com` یا میزبان‌های محافظت‌شده با احراز هویت، از `OLLAMA_API_KEY` یا احراز هویت ارائه‌دهندهٔ پیکربندی‌شده استفاده می‌شود |
| پیش‌نیاز    | میزبان‌های محلی/خودمیزبان باید در حال اجرا باشند و با `ollama signin` وارد حساب شده باشند؛ جست‌وجوی مستقیم میزبانی‌شده به `baseUrl: "https://ollama.com"` به‌همراه یک کلید واقعی API Ollama نیاز دارد |

در طول `openclaw onboard` یا `openclaw configure --section web`، **جست‌وجوی وب Ollama** را انتخاب کنید، یا این را تنظیم کنید:

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

برای یک daemon محلی که وارد حساب شده است، OpenClaw از پروکسی `/api/experimental/web_search` آن daemon استفاده می‌کند. برای `https://ollama.com`، نقطهٔ پایانی میزبانی‌شدهٔ `/api/web_search` را مستقیماً فراخوانی می‌کند.

<Note>
برای جزئیات کامل راه‌اندازی و رفتار، [جست‌وجوی وب Ollama](/fa/tools/ollama-search) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **فراخوانی ابزار در حالت سازگار با OpenAI قابل‌اعتماد نیست.** فقط زمانی از این حالت استفاده کنید که برای یک پروکسی به قالب OpenAI نیاز دارید و به رفتار بومی فراخوانی ابزار وابسته نیستید.
    </Warning>

    اگر لازم است به‌جای آن از نقطهٔ پایانی سازگار با OpenAI استفاده کنید (برای مثال، پشت پروکسی‌ای که فقط از قالب OpenAI پشتیبانی می‌کند)، `api: "openai-completions"` را صریحاً تنظیم کنید:

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

    این حالت ممکن است از جریان‌یابی و فراخوانی ابزار به‌طور هم‌زمان پشتیبانی نکند. شاید لازم باشد جریان‌یابی را با `params: { streaming: false }` در پیکربندی مدل غیرفعال کنید.

    وقتی `api: "openai-completions"` با Ollama استفاده شود، OpenClaw به‌طور پیش‌فرض `options.num_ctx` را تزریق می‌کند تا Ollama بی‌صدا به پنجرهٔ زمینهٔ 4096 برنگردد. اگر پروکسی/بالادست شما فیلدهای ناشناختهٔ `options` را رد می‌کند، این رفتار را غیرفعال کنید:

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
    برای مدل‌هایی که خودکار کشف شده‌اند، OpenClaw در صورت موجود بودن از پنجرهٔ زمینه‌ای استفاده می‌کند که Ollama گزارش می‌دهد، از جمله مقدارهای بزرگ‌تر `PARAMETER num_ctx` از Modelfileهای سفارشی. در غیر این صورت، به پنجرهٔ زمینهٔ پیش‌فرض Ollama که OpenClaw استفاده می‌کند برمی‌گردد.

    می‌توانید پیش‌فرض‌های `contextWindow`، `contextTokens` و `maxTokens` در سطح ارائه‌دهنده را برای هر مدل زیر آن ارائه‌دهندهٔ Ollama تنظیم کنید، سپس در صورت نیاز برای هر مدل بازنویسی کنید. `contextWindow` بودجهٔ پرامپت و Compaction در OpenClaw است. درخواست‌های بومی Ollama، `options.num_ctx` را تنظیم‌نشده باقی می‌گذارند مگر اینکه `params.num_ctx` را صریحاً پیکربندی کنید، بنابراین Ollama می‌تواند پیش‌فرض مدل، `OLLAMA_CONTEXT_LENGTH` یا پیش‌فرض مبتنی بر VRAM خودش را اعمال کند. برای محدود کردن یا اجبار زمینهٔ زمان اجرای هر درخواست Ollama بدون بازسازی Modelfile، `params.num_ctx` را تنظیم کنید؛ مقدارهای نامعتبر، صفر، منفی و نامتناهی نادیده گرفته می‌شوند. اگر یک پیکربندی قدیمی‌تر را که فقط از `contextWindow` یا `maxTokens` برای اجبار زمینهٔ درخواست بومی Ollama استفاده می‌کرد ارتقا داده‌اید، `openclaw doctor --fix` را اجرا کنید تا آن بودجه‌های صریح ارائه‌دهنده یا مدل را به `params.num_ctx` کپی کند. آداپتر Ollama سازگار با OpenAI همچنان به‌طور پیش‌فرض `options.num_ctx` را از `params.num_ctx` یا `contextWindow` پیکربندی‌شده تزریق می‌کند؛ اگر بالادست شما `options` را رد می‌کند، آن را با `injectNumCtxForOpenAICompat: false` غیرفعال کنید.

    ورودی‌های مدل بومی Ollama همچنین گزینه‌های رایج زمان اجرای Ollama را زیر `params` می‌پذیرند، از جمله `temperature`، `top_p`، `top_k`، `min_p`، `num_predict`، `stop`، `repeat_penalty`، `num_batch`، `num_thread` و `use_mmap`. OpenClaw فقط کلیدهای درخواست Ollama را ارسال می‌کند، بنابراین پارامترهای زمان اجرای OpenClaw مانند `streaming` به Ollama نشت نمی‌کنند. برای ارسال `think` سطح بالای Ollama از `params.think` یا `params.thinking` استفاده کنید؛ `false` تفکر در سطح API را برای مدل‌های متفکر به سبک Qwen غیرفعال می‌کند.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` در سطح هر مدل نیز کار می‌کند. اگر هر دو پیکربندی شده باشند، ورودی صریح مدلِ ارائه‌دهنده بر پیش‌فرض عامل مقدم است.

  </Accordion>

  <Accordion title="Thinking control">
    برای مدل‌های بومی Ollama، OpenClaw کنترل تفکر را همان‌طور که Ollama انتظار دارد ارسال می‌کند: `think` در سطح بالا، نه `options.think`. مدل‌هایی که خودکار کشف شده‌اند و پاسخ `/api/show` آن‌ها شامل قابلیت `thinking` است، `/think low`، `/think medium`، `/think high` و `/think max` را ارائه می‌کنند؛ مدل‌های غیرمتفکر فقط `/think off` را ارائه می‌کنند.

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

    `params.think` یا `params.thinking` در سطح هر مدل می‌تواند تفکر API Ollama را برای یک مدل پیکربندی‌شدهٔ خاص غیرفعال یا اجباری کند. OpenClaw این پارامترهای صریح مدل را وقتی اجرای فعال فقط پیش‌فرض ضمنی `off` را دارد حفظ می‌کند؛ دستورهای زمان اجرا که غیر از off هستند، مانند `/think medium`، همچنان اجرای فعال را بازنویسی می‌کنند.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw به‌طور پیش‌فرض مدل‌هایی با نام‌هایی مانند `deepseek-r1`، `reasoning` یا `think` را دارای قابلیت استدلال در نظر می‌گیرد.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    به پیکربندی اضافه‌ای نیاز نیست. OpenClaw آن‌ها را به‌طور خودکار علامت‌گذاری می‌کند.

  </Accordion>

  <Accordion title="Model costs">
    Ollama رایگان است و به‌صورت محلی اجرا می‌شود، بنابراین همهٔ هزینه‌های مدل روی $0 تنظیم می‌شوند. این موضوع هم برای مدل‌های خودکار کشف‌شده و هم مدل‌های تعریف‌شدهٔ دستی اعمال می‌شود.
  </Accordion>

  <Accordion title="جاسازی‌های حافظه">
    Plugin همراه Ollama یک ارائه‌دهندهٔ جاسازی حافظه را برای
    [جست‌وجوی حافظه](/fa/concepts/memory) ثبت می‌کند. این ارائه‌دهنده از نشانی پایهٔ پیکربندی‌شدهٔ Ollama
    و کلید API استفاده می‌کند، endpoint فعلی `/api/embed` در Ollama را فراخوانی می‌کند، و در صورت امکان
    چندین قطعهٔ حافظه را در یک درخواست `input` به‌صورت batch ارسال می‌کند.

    وقتی `proxy.enabled=true` باشد، درخواست‌های جاسازی حافظهٔ Ollama به مبدأ دقیق
    host-local loopback که از `baseUrl` پیکربندی‌شده به دست آمده است، به‌جای پراکسی هدایت‌شدهٔ مدیریت‌شده،
    از مسیر مستقیم محافظت‌شدهٔ OpenClaw استفاده می‌کنند. نام میزبان پیکربندی‌شده باید خودش `localhost`
    یا یک مقدار لفظی IP loopback باشد؛ نام‌های DNS که صرفاً به loopback resolve می‌شوند همچنان از مسیر
    پراکسی مدیریت‌شده استفاده می‌کنند. میزبان‌های LAN، tailnet، شبکهٔ خصوصی، و عمومی Ollama نیز روی مسیر
    پراکسی مدیریت‌شده باقی می‌مانند. تغییرمسیرها به میزبان یا پورت دیگر اعتماد را به ارث نمی‌برند.
    اپراتورها همچنان می‌توانند تنظیم سراسری `proxy.loopbackMode: "proxy"` را برای ارسال ترافیک loopback
    از طریق پراکسی، یا `proxy.loopbackMode: "block"` را برای رد کردن اتصال‌های loopback پیش از باز کردن
    اتصال تنظیم کنند؛ برای اثر سراسری این تنظیم روی فرایند، [پراکسی مدیریت‌شده](/fa/security/network-proxy#gateway-loopback-mode)
    را ببینید.

    | ویژگی      | مقدار               |
    | ------------- | ------------------- |
    | مدل پیش‌فرض | `nomic-embed-text`  |
    | دریافت خودکار     | بله — اگر مدل جاسازی به‌صورت محلی موجود نباشد، به‌طور خودکار دریافت می‌شود |

    جاسازی‌های زمان پرس‌وجو برای مدل‌هایی که به پیشوندهای بازیابی نیاز دارند یا آن‌ها را توصیه می‌کنند، از جمله `nomic-embed-text`، `qwen3-embedding`، و `mxbai-embed-large`، از این پیشوندها استفاده می‌کنند. batchهای سند حافظه خام باقی می‌مانند تا ایندکس‌های موجود به مهاجرت قالب نیاز نداشته باشند.

    برای انتخاب Ollama به‌عنوان ارائه‌دهندهٔ جاسازی جست‌وجوی حافظه:

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

  <Accordion title="پیکربندی Streaming">
    یکپارچه‌سازی Ollama در OpenClaw به‌طور پیش‌فرض از **API بومی Ollama** (`/api/chat`) استفاده می‌کند، که به‌طور کامل از streaming و فراخوانی ابزار به‌صورت هم‌زمان پشتیبانی می‌کند. به پیکربندی خاصی نیاز نیست.

    برای درخواست‌های بومی `/api/chat`، OpenClaw کنترل thinking را نیز مستقیماً به Ollama ارسال می‌کند: `/think off` و `openclaw agent --thinking off` مقدار سطح‌بالای `think: false` را ارسال می‌کنند، مگر اینکه مقدار صریح مدل `params.think`/`params.thinking` پیکربندی شده باشد؛ درحالی‌که `/think low|medium|high` رشتهٔ effort سطح‌بالای متناظر `think` را ارسال می‌کنند. `/think max` به بالاترین effort بومی Ollama، یعنی `think: "high"`، نگاشت می‌شود.

    <Tip>
    اگر لازم است از endpoint سازگار با OpenAI استفاده کنید، بخش «حالت قدیمی سازگار با OpenAI» در بالا را ببینید. ممکن است streaming و فراخوانی ابزار در آن حالت به‌صورت هم‌زمان کار نکنند.
    </Tip>

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="حلقهٔ خرابی WSL2 (راه‌اندازی‌های دوبارهٔ تکراری)">
    در WSL2 همراه با NVIDIA/CUDA، نصب‌کنندهٔ رسمی Linux برای Ollama یک unit systemd به نام `ollama.service` با `Restart=always` ایجاد می‌کند. اگر این service به‌صورت خودکار شروع شود و هنگام بوت WSL2 یک مدل مبتنی بر GPU را بارگذاری کند، Ollama می‌تواند هنگام بارگذاری مدل حافظهٔ میزبان را pin کند. بازیابی حافظهٔ Hyper-V همیشه نمی‌تواند آن صفحه‌های pin‌شده را بازپس بگیرد، بنابراین Windows می‌تواند VM مربوط به WSL2 را متوقف کند، systemd دوباره Ollama را شروع می‌کند، و این چرخه تکرار می‌شود.

    شواهد رایج:

    - راه‌اندازی‌های دوباره یا خاتمه‌های تکراری WSL2 از سمت Windows
    - مصرف بالای CPU در `app.slice` یا `ollama.service` کمی پس از شروع WSL2
    - SIGTERM از سوی systemd به‌جای رویداد Linux OOM-killer

    OpenClaw وقتی WSL2، فعال بودن `ollama.service` با `Restart=always`، و نشانه‌های قابل مشاهدهٔ CUDA را تشخیص دهد، هنگام startup یک هشدار ثبت می‌کند.

    کاهش اثر:

    ```bash
    sudo systemctl disable ollama
    ```

    این را در سمت Windows به `%USERPROFILE%\.wslconfig` اضافه کنید، سپس `wsl --shutdown` را اجرا کنید:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    در محیط service مربوط به Ollama یک keep-alive کوتاه‌تر تنظیم کنید، یا Ollama را فقط وقتی نیاز دارید به‌صورت دستی شروع کنید:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) را ببینید.

  </Accordion>

  <Accordion title="Ollama شناسایی نشد">
    مطمئن شوید Ollama در حال اجراست و `OLLAMA_API_KEY` را تنظیم کرده‌اید (یا یک پروفایل احراز هویت)، و اینکه یک entry صریح `models.providers.ollama` تعریف نکرده‌اید:

    ```bash
    ollama serve
    ```

    بررسی کنید API در دسترس است:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="هیچ مدلی در دسترس نیست">
    اگر مدل شما فهرست نشده است، مدل را به‌صورت محلی دریافت کنید یا آن را به‌طور صریح در `models.providers.ollama` تعریف کنید.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="اتصال رد شد">
    بررسی کنید Ollama روی پورت درست در حال اجراست:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="میزبان راه‌دور با curl کار می‌کند اما با OpenClaw نه">
    از همان ماشین و runtimeای که Gateway را اجرا می‌کند بررسی کنید:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    علت‌های رایج:

    - `baseUrl` به `localhost` اشاره می‌کند، اما Gateway در Docker یا روی میزبان دیگری اجرا می‌شود.
    - URL از `/v1` استفاده می‌کند، که به‌جای رفتار بومی Ollama رفتار سازگار با OpenAI را انتخاب می‌کند.
    - میزبان راه‌دور به تغییرات firewall یا binding شبکهٔ LAN در سمت Ollama نیاز دارد.
    - مدل روی daemon لپ‌تاپ شما وجود دارد اما روی daemon راه‌دور وجود ندارد.

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

    اگر یک مدل محلی کوچک همچنان روی schemaهای ابزار شکست می‌خورد، روی entry همان مدل `compat.supportsTools: false` را تنظیم کنید و دوباره آزمایش کنید.

  </Accordion>

  <Accordion title="Kimi یا GLM نمادهای ناخوانا برمی‌گرداند">
    پاسخ‌های میزبانی‌شدهٔ Kimi/GLM که طولانی و شامل دنباله‌های نمادی غیرزبانی هستند، به‌جای پاسخ موفق assistant، به‌عنوان خروجی ناموفق ارائه‌دهنده در نظر گرفته می‌شوند. این باعث می‌شود retry، fallback، یا مدیریت خطای معمول بدون ذخیره کردن متن خراب در session ادامه پیدا کند.

    اگر این اتفاق تکرار شد، نام خام مدل، فایل session فعلی، و اینکه run از `Cloud + Local` یا `Cloud only` استفاده کرده است را ثبت کنید، سپس یک session تازه و یک مدل fallback را امتحان کنید:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="مدل محلی سرد timeout می‌شود">
    مدل‌های محلی بزرگ ممکن است پیش از شروع streaming به یک بارگذاری اولیهٔ طولانی نیاز داشته باشند. timeout را محدود به ارائه‌دهندهٔ Ollama نگه دارید، و در صورت تمایل از Ollama بخواهید مدل را بین نوبت‌ها بارگذاری‌شده نگه دارد:

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

  <Accordion title="مدل با زمینهٔ بزرگ بیش از حد کند است یا حافظه کم می‌آورد">
    بسیاری از مدل‌های Ollama contextهایی را اعلام می‌کنند که بزرگ‌تر از آن هستند که سخت‌افزار شما بتواند راحت اجرا کند. Ollama بومی از پیش‌فرض context زمان اجرای خود Ollama استفاده می‌کند، مگر اینکه `params.num_ctx` را تنظیم کنید. وقتی latency قابل پیش‌بینی برای نخستین token می‌خواهید، هم بودجهٔ OpenClaw و هم context درخواست Ollama را محدود کنید:

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

    اگر OpenClaw prompt بیش از حد زیادی ارسال می‌کند، ابتدا `contextWindow` را کاهش دهید. اگر Ollama در حال بارگذاری context زمان اجرایی است که برای ماشین بیش از حد بزرگ است، `params.num_ctx` را کاهش دهید. اگر generation بیش از حد طول می‌کشد، `maxTokens` را کاهش دهید.

  </Accordion>
</AccordionGroup>

<Note>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
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
    مرجع کامل config.
  </Card>
</CardGroup>
