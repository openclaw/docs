---
read_when:
    - می‌خواهید ارائه‌دهندگان جست‌وجوی حافظه یا مدل‌های تعبیه‌سازی را پیکربندی کنید
    - می‌خواهید بک‌اند QMD را راه‌اندازی کنید
    - می‌خواهید جست‌وجوی ترکیبی، MMR یا زوال زمانی را تنظیم کنید
    - می‌خواهید نمایه‌سازی حافظهٔ چندوجهی را فعال کنید
sidebarTitle: Memory config
summary: همهٔ گزینه‌های پیکربندی برای جست‌وجوی حافظه، ارائه‌دهندگان تعبیه، QMD، جست‌وجوی ترکیبی و نمایه‌سازی چندوجهی
title: مرجع پیکربندی حافظه
x-i18n:
    generated_at: "2026-04-30T16:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

این صفحه همه‌ی تنظیمات پیکربندی برای جست‌وجوی حافظه‌ی OpenClaw را فهرست می‌کند. برای مرورهای مفهومی، ببینید:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/fa/concepts/memory">
    حافظه چگونه کار می‌کند.
  </Card>
  <Card title="Builtin engine" href="/fa/concepts/memory-builtin">
    بک‌اند پیش‌فرض SQLite.
  </Card>
  <Card title="QMD engine" href="/fa/concepts/memory-qmd">
    سایدکار local-first.
  </Card>
  <Card title="Memory search" href="/fa/concepts/memory-search">
    پایپ‌لاین جست‌وجو و تنظیم آن.
  </Card>
  <Card title="Active memory" href="/fa/concepts/active-memory">
    زیرعامل حافظه برای نشست‌های تعاملی.
  </Card>
</CardGroup>

همه‌ی تنظیمات جست‌وجوی حافظه، مگر اینکه خلاف آن ذکر شده باشد، زیر `agents.defaults.memorySearch` در `openclaw.json` قرار دارند.

<Note>
اگر به دنبال کلید فعال‌سازی قابلیت **active memory** و پیکربندی زیرعامل هستید، این مورد به‌جای `memorySearch` زیر `plugins.entries.active-memory` قرار دارد.

Active memory از یک مدل دو دروازه‌ای استفاده می‌کند:

1. Plugin باید فعال باشد و شناسه‌ی عامل فعلی را هدف بگیرد
2. درخواست باید یک نشست چت پایدار تعاملی واجد شرایط باشد

برای مدل فعال‌سازی، پیکربندی تحت مالکیت Plugin، پایداری رونوشت، و الگوی rollout ایمن، [Active Memory](/fa/concepts/active-memory) را ببینید.
</Note>

---

## انتخاب ارائه‌دهنده

| کلید        | نوع      | پیش‌فرض          | توضیح                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | تشخیص خودکار    | شناسه‌ی آداپتر embedding مانند `bedrock`، `deepinfra`، `gemini`، `github-copilot`، `local`، `mistral`، `ollama`، `openai`، یا `voyage`؛ همچنین می‌تواند یک `models.providers.<id>` پیکربندی‌شده باشد که `api` آن به یکی از این آداپترها اشاره می‌کند |
| `model`    | `string`  | پیش‌فرض ارائه‌دهنده | نام مدل embedding                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | شناسه‌ی آداپتر جایگزین وقتی مورد اصلی شکست می‌خورد                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | فعال یا غیرفعال کردن جست‌وجوی حافظه                                                                                                                                                                                                    |

### ترتیب تشخیص خودکار

وقتی `provider` تنظیم نشده باشد، OpenClaw نخستین مورد در دسترس را انتخاب می‌کند:

<Steps>
  <Step title="local">
    اگر `memorySearch.local.modelPath` پیکربندی شده باشد و فایل وجود داشته باشد، انتخاب می‌شود.
  </Step>
  <Step title="github-copilot">
    اگر یک توکن GitHub Copilot قابل resolve باشد (متغیر محیطی یا پروفایل auth)، انتخاب می‌شود.
  </Step>
  <Step title="openai">
    اگر یک کلید OpenAI قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="gemini">
    اگر یک کلید Gemini قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="voyage">
    اگر یک کلید Voyage قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="mistral">
    اگر یک کلید Mistral قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="deepinfra">
    اگر یک کلید DeepInfra قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="bedrock">
    اگر زنجیره‌ی اعتبارنامه‌ی AWS SDK resolve شود (نقش instance، کلیدهای دسترسی، پروفایل، SSO، هویت وب، یا پیکربندی اشتراکی)، انتخاب می‌شود.
  </Step>
</Steps>

`ollama` پشتیبانی می‌شود اما به‌صورت خودکار تشخیص داده نمی‌شود (آن را صریح تنظیم کنید).

### شناسه‌های ارائه‌دهنده‌ی سفارشی

`memorySearch.provider` می‌تواند به یک ورودی سفارشی `models.providers.<id>` اشاره کند. OpenClaw مالک `api` آن ارائه‌دهنده را برای آداپتر embedding resolve می‌کند، در حالی که شناسه‌ی ارائه‌دهنده‌ی سفارشی را برای مدیریت endpoint، auth و پیشوند مدل حفظ می‌کند. این کار به راه‌اندازی‌های چند GPU یا چند میزبان اجازه می‌دهد embeddingهای حافظه را به یک endpoint محلی مشخص اختصاص دهند:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### resolve کردن کلید API

Embeddingهای remote به یک کلید API نیاز دارند. Bedrock به‌جای آن از زنجیره‌ی اعتبارنامه‌ی پیش‌فرض AWS SDK استفاده می‌کند (نقش‌های instance، SSO، کلیدهای دسترسی).

| ارائه‌دهنده       | متغیر محیطی                                            | کلید پیکربندی                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | زنجیره‌ی اعتبارنامه‌ی AWS                               | به کلید API نیاز نیست                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | پروفایل auth از طریق ورود دستگاه       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (جای‌نگهدار)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth مربوط به Codex فقط چت/تکمیل‌ها را پوشش می‌دهد و درخواست‌های embedding را برآورده نمی‌کند.
</Note>

---

## پیکربندی endpoint remote

برای endpointهای سفارشی سازگار با OpenAI یا override کردن پیش‌فرض‌های ارائه‌دهنده:

<ParamField path="remote.baseUrl" type="string">
  URL پایه‌ی API سفارشی.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  override کردن کلید API.
</ParamField>
<ParamField path="remote.headers" type="object">
  هدرهای HTTP اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## پیکربندی ویژه‌ی ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Gemini">
    | کلید                    | نوع     | پیش‌فرض                | توضیح                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | از `gemini-embedding-2-preview` نیز پشتیبانی می‌کند |
    | `outputDimensionality` | `number` | `3072`                 | برای Embedding 2: 768، 1536، یا 3072        |

    <Warning>
    تغییر مدل یا `outputDimensionality` باعث reindex کامل خودکار می‌شود.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    Endpointهای embedding سازگار با OpenAI می‌توانند فیلدهای درخواست `input_type` ویژه‌ی ارائه‌دهنده را فعال کنند. این برای مدل‌های embedding نامتقارن که برای embeddingهای پرس‌وجو و سند به برچسب‌های متفاوت نیاز دارند مفید است.

    | کلید                 | نوع     | پیش‌فرض | توضیح                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | تنظیم‌نشده   | `input_type` مشترک برای embeddingهای پرس‌وجو و سند   |
    | `queryInputType`    | `string` | تنظیم‌نشده   | `input_type` هنگام پرس‌وجو؛ `inputType` را override می‌کند          |
    | `documentInputType` | `string` | تنظیم‌نشده   | `input_type` شاخص/سند؛ `inputType` را override می‌کند      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    تغییر این مقادیر بر هویت کش embedding برای index کردن دسته‌ای ارائه‌دهنده اثر می‌گذارد و وقتی مدل بالادستی با برچسب‌ها رفتار متفاوتی دارد، باید پس از آن حافظه reindex شود.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock از زنجیره‌ی اعتبارنامه‌ی پیش‌فرض AWS SDK استفاده می‌کند — به کلیدهای API نیاز نیست. اگر OpenClaw روی EC2 با یک نقش instance فعال برای Bedrock اجرا می‌شود، فقط ارائه‌دهنده و مدل را تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | کلید                    | نوع     | پیش‌فرض                        | توضیح                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | هر شناسه‌ی مدل embedding در Bedrock  |
    | `outputDimensionality` | `number` | پیش‌فرض مدل                  | برای Titan V2: 256، 512، یا 1024 |

    **مدل‌های پشتیبانی‌شده** (با تشخیص خانواده و پیش‌فرض‌های بُعد):

    | شناسه‌ی مدل                                   | ارائه‌دهنده   | ابعاد پیش‌فرض | ابعاد قابل پیکربندی    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256، 512، 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256، 384، 1024، 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    گونه‌های دارای پسوند throughput (برای مثال، `amazon.titan-embed-text-v1:2:8k`) پیکربندی مدل پایه را به ارث می‌برند.

    **احراز هویت:** احراز هویت Bedrock از ترتیب استاندارد resolve کردن اعتبارنامه در AWS SDK استفاده می‌کند:

    1. متغیرهای محیطی (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. کش توکن SSO
    3. اعتبارنامه‌های توکن هویت وب
    4. فایل‌های اعتبارنامه و پیکربندی اشتراکی
    5. اعتبارنامه‌های metadata مربوط به ECS یا EC2

    Region از `AWS_REGION`، `AWS_DEFAULT_REGION`، `baseUrl` ارائه‌دهنده‌ی `amazon-bedrock` resolve می‌شود، یا به‌صورت پیش‌فرض `us-east-1` است.

    **مجوزهای IAM:** نقش یا کاربر IAM به این موارد نیاز دارد:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    برای کمترین سطح دسترسی، دامنه‌ی `InvokeModel` را به مدل مشخص محدود کنید:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | کلید                 | نوع                | پیش‌فرض                 | توضیح                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | بارگیری خودکار         | مسیر فایل مدل GGUF                                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | پیش‌فرض node-llama-cpp | دایرکتوری کش برای مدل‌های بارگیری‌شده                                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | اندازه پنجره زمینه برای زمینه embedding. مقدار 4096 قطعه‌های معمولی (128 تا 512 توکن) را پوشش می‌دهد و در عین حال VRAM غیرمرتبط با وزن‌ها را محدود می‌کند. در میزبان‌های محدود، آن را به 1024 تا 2048 کاهش دهید. `"auto"` از بیشینه آموزش‌دیده مدل استفاده می‌کند؛ برای مدل‌های 8B+ توصیه نمی‌شود (Qwen3-Embedding-8B: 40 960 توکن → حدود 32 گیگابایت VRAM در برابر حدود 8.8 گیگابایت در 4096). |

    مدل پیش‌فرض: `embeddinggemma-300m-qat-Q8_0.gguf` (حدود 0.6 گیگابایت، با بارگیری خودکار). نصب‌های بسته‌بندی‌شده، هنگام پیکربندی `provider: "local"`، runtime بومی `node-llama-cpp` را از طریق وابستگی‌های runtime مدیریت‌شده Plugin ترمیم می‌کنند. checkoutهای سورس همچنان به تأیید ساخت بومی نیاز دارند: ابتدا `pnpm approve-builds` و سپس `pnpm rebuild node-llama-cpp`.

    از CLI مستقل استفاده کنید تا همان مسیر provider را که Gateway استفاده می‌کند تأیید کنید:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    اگر `provider` برابر `auto` باشد، `local` فقط زمانی انتخاب می‌شود که `local.modelPath` به یک فایل محلی موجود اشاره کند. ارجاع‌های مدل `hf:` و HTTP(S) همچنان می‌توانند به‌صراحت با `provider: "local"` استفاده شوند، اما پیش از آنکه مدل روی دیسک در دسترس باشد باعث نمی‌شوند `auto` گزینه local را انتخاب کند.

  </Accordion>
</AccordionGroup>

### مهلت زمانی embedding درون‌خطی

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  مهلت زمانی batchهای embedding درون‌خطی را هنگام ایندکس‌سازی حافظه بازنویسی کنید.

در حالت تنظیم‌نشده از پیش‌فرض provider استفاده می‌شود: 600 ثانیه برای providerهای local/self-hosted مانند `local`، `ollama` و `lmstudio`، و 120 ثانیه برای providerهای میزبانی‌شده. وقتی batchهای embedding محلیِ وابسته به CPU سالم اما کند هستند، این مقدار را افزایش دهید.
</ParamField>

---

## پیکربندی جست‌وجوی ترکیبی

همه زیر `memorySearch.query.hybrid` قرار دارند:

| کلید                  | نوع       | پیش‌فرض | توضیح                              |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | جست‌وجوی ترکیبی BM25 + برداری را فعال می‌کند |
| `vectorWeight`        | `number`  | `0.7`   | وزن امتیازهای برداری (0-1)         |
| `textWeight`          | `number`  | `0.3`   | وزن امتیازهای BM25 (0-1)           |
| `candidateMultiplier` | `number`  | `4`     | ضریب اندازه مجموعه نامزدها         |

<Tabs>
  <Tab title="MMR (diversity)">
    | کلید          | نوع       | پیش‌فرض | توضیح                                   |
    | ------------- | --------- | ------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | بازرتبه‌بندی MMR را فعال می‌کند          |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = بیشینه تنوع، 1 = بیشینه ارتباط       |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | کلید                         | نوع       | پیش‌فرض | توضیح                           |
    | ---------------------------- | --------- | ------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تقویت تازگی را فعال می‌کند       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | امتیاز هر N روز نصف می‌شود       |

    فایل‌های همیشه‌سبز (`MEMORY.md`، فایل‌های بدون تاریخ در `memory/`) هرگز دچار افت زمانی نمی‌شوند.

  </Tab>
</Tabs>

### مثال کامل

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## مسیرهای حافظه اضافی

| کلید         | نوع        | توضیح                                  |
| ------------ | ---------- | -------------------------------------- |
| `extraPaths` | `string[]` | دایرکتوری‌ها یا فایل‌های اضافی برای ایندکس‌سازی |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

مسیرها می‌توانند مطلق یا نسبی نسبت به workspace باشند. دایرکتوری‌ها به‌صورت بازگشتی برای فایل‌های `.md` اسکن می‌شوند. نحوه رسیدگی به symlink به backend فعال بستگی دارد: موتور داخلی symlinkها را نادیده می‌گیرد، در حالی که QMD از رفتار scanner زیربنایی QMD پیروی می‌کند.

برای جست‌وجوی transcript بین agentها در محدوده agent، به‌جای `memory.qmd.paths` از `agents.list[].memorySearch.qmd.extraCollections` استفاده کنید. آن collectionهای اضافی از همان شکل `{ path, name, pattern? }` پیروی می‌کنند، اما به ازای هر agent ادغام می‌شوند و وقتی مسیر به بیرون از workspace فعلی اشاره می‌کند می‌توانند نام‌های مشترک صریح را حفظ کنند. اگر همان مسیر resolve‌شده هم در `memory.qmd.paths` و هم در `memorySearch.qmd.extraCollections` ظاهر شود، QMD نخستین ورودی را نگه می‌دارد و مورد تکراری را رد می‌کند.

---

## حافظه چندرسانه‌ای (Gemini)

تصاویر و صدا را در کنار Markdown با استفاده از Gemini Embedding 2 ایندکس کنید:

| کلید                      | نوع        | پیش‌فرض   | توضیح                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | ایندکس‌سازی چندرسانه‌ای را فعال می‌کند |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`، `["audio"]`، یا `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | بیشینه اندازه فایل برای ایندکس‌سازی   |

<Note>
فقط روی فایل‌های موجود در `extraPaths` اعمال می‌شود. ریشه‌های حافظه پیش‌فرض فقط Markdown باقی می‌مانند. به `gemini-embedding-2-preview` نیاز دارد. `fallback` باید `"none"` باشد.
</Note>

فرمت‌های پشتیبانی‌شده: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (تصاویر)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صدا).

---

## کش embedding

| کلید               | نوع       | پیش‌فرض | توضیح                              |
| ------------------ | --------- | ------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false` | embeddingهای قطعه‌ها را در SQLite کش می‌کند |
| `cache.maxEntries` | `number`  | `50000` | بیشینه embeddingهای کش‌شده         |

از embedding مجدد متن بدون تغییر هنگام reindex یا به‌روزرسانی transcript جلوگیری می‌کند.

---

## ایندکس‌سازی batch

| کلید                          | نوع       | پیش‌فرض | توضیح                            |
| ----------------------------- | --------- | ------- | -------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | embeddingهای درون‌خطی موازی       |
| `remote.batch.enabled`        | `boolean` | `false` | API embedding batch را فعال می‌کند |
| `remote.batch.concurrency`    | `number`  | `2`     | کارهای batch موازی               |
| `remote.batch.wait`           | `boolean` | `true`  | منتظر تکمیل batch می‌ماند         |
| `remote.batch.pollIntervalMs` | `number`  | --      | بازه نظرسنجی                      |
| `remote.batch.timeoutMinutes` | `number`  | --      | مهلت زمانی batch                  |

برای `openai`، `gemini` و `voyage` در دسترس است. batch در OpenAI معمولا برای backfillهای بزرگ سریع‌ترین و کم‌هزینه‌ترین گزینه است.

`remote.nonBatchConcurrency` فراخوانی‌های embedding درون‌خطی را کنترل می‌کند که providerهای local/self-hosted و providerهای میزبانی‌شده هنگامی که APIهای batch مربوط به provider فعال نیستند از آن استفاده می‌کنند. مقدار پیش‌فرض Ollama برای ایندکس‌سازی غیر batch برابر `1` است تا میزبان‌های محلی کوچک‌تر بیش از حد تحت فشار قرار نگیرند؛ روی ماشین‌های بزرگ‌تر مقدار بالاتری تنظیم کنید.

این مورد جدا از `sync.embeddingBatchTimeoutSeconds` است که مهلت زمانی فراخوانی‌های embedding درون‌خطی را کنترل می‌کند.

---

## جست‌وجوی حافظه جلسه (آزمایشی)

transcriptهای جلسه را ایندکس کنید و آن‌ها را از طریق `memory_search` ارائه دهید:

| کلید                          | نوع        | پیش‌فرض     | توضیح                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | ایندکس‌سازی جلسه را فعال می‌کند             |
| `sources`                     | `string[]` | `["memory"]` | برای شامل کردن transcriptها، `"sessions"` را اضافه کنید |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | آستانه بایت برای reindex                   |
| `sync.sessions.deltaMessages` | `number`   | `50`         | آستانه پیام برای reindex                   |

<Warning>
ایندکس‌سازی جلسه opt-in است و به‌صورت ناهمگام اجرا می‌شود. نتایج ممکن است کمی stale باشند. لاگ‌های جلسه روی دیسک قرار دارند، بنابراین دسترسی به filesystem را مرز اعتماد در نظر بگیرید.
</Warning>

---

## شتاب‌دهی برداری SQLite (sqlite-vec)

| کلید                         | نوع       | پیش‌فرض      | توضیح                              |
| ---------------------------- | --------- | ------------ | ---------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`       | از sqlite-vec برای queryهای برداری استفاده می‌کند |
| `store.vector.extensionPath` | `string`  | همراه بسته   | مسیر sqlite-vec را بازنویسی می‌کند |

وقتی sqlite-vec در دسترس نباشد، OpenClaw به‌صورت خودکار به شباهت کسینوسی درون‌پردازشی برمی‌گردد.

---

## ذخیره‌سازی ایندکس

| کلید                  | نوع      | پیش‌فرض                              | توضیح                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | مکان ایندکس (از توکن `{agentId}` پشتیبانی می‌کند) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | tokenizer مربوط به FTS5 (`unicode61` یا `trigram`) |

---

## پیکربندی backend QMD

برای فعال‌سازی، `memory.backend = "qmd"` را تنظیم کنید. همه تنظیمات QMD زیر `memory.qmd` قرار دارند:

| کلید                     | نوع       | پیش‌فرض | توضیح                                                                                 |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسیر اجرایی QMD؛ وقتی `PATH` سرویس با پوسته شما متفاوت است، یک مسیر مطلق تنظیم کنید |
| `searchMode`             | `string`  | `search` | فرمان جستجو: `search`، `vsearch`، `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` را به‌صورت خودکار نمایه‌سازی کن                                             |
| `paths[]`                | `array`   | --       | مسیرهای اضافی: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | رونوشت‌های نشست را نمایه‌سازی کن                                                             |
| `sessions.retentionDays` | `number`  | --       | نگهداری رونوشت                                                                  |
| `sessions.exportDir`     | `string`  | --       | دایرکتوری خروجی                                                                      |

`searchMode: "search"` فقط واژگانی/BM25 است. OpenClaw برای این حالت، از جمله هنگام `memory status --deep`، کاوشگرهای آمادگی بردار معنایی یا نگهداری تعبیه‌های QMD را اجرا نمی‌کند؛ `vsearch` و `query` همچنان به آمادگی برداری QMD و تعبیه‌ها نیاز دارند.

OpenClaw شکل‌های فعلی مجموعه QMD و پرس‌وجوی MCP را ترجیح می‌دهد، اما با امتحان کردن پرچم‌های سازگار الگوی مجموعه و نام‌های قدیمی‌تر ابزار MCP در صورت نیاز، نسخه‌های قدیمی‌تر QMD را نیز فعال نگه می‌دارد. وقتی QMD پشتیبانی از چند فیلتر مجموعه را اعلام می‌کند، مجموعه‌های هم‌منبع با یک فرایند QMD جستجو می‌شوند؛ ساخت‌های قدیمی‌تر QMD مسیر سازگاری به‌ازای هر مجموعه را حفظ می‌کنند. هم‌منبع یعنی مجموعه‌های حافظه پایدار با هم گروه‌بندی می‌شوند، در حالی که مجموعه‌های رونوشت نشست به‌صورت یک گروه جدا باقی می‌مانند تا تنوع منبع همچنان هر دو ورودی را داشته باشد.

<Note>
بازنویسی‌های مدل QMD در سمت QMD می‌مانند، نه در پیکربندی OpenClaw. اگر لازم است مدل‌های QMD را به‌صورت سراسری بازنویسی کنید، متغیرهای محیطی مانند `QMD_EMBED_MODEL`، `QMD_RERANK_MODEL` و `QMD_GENERATE_MODEL` را در محیط اجرای gateway تنظیم کنید.
</Note>

<AccordionGroup>
  <Accordion title="زمان‌بندی به‌روزرسانی">
    | کلید                      | نوع       | پیش‌فرض | توضیح                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصله نوسازی                      |
    | `update.debounceMs`       | `number`  | `15000` | تغییرات فایل را debounce کن                 |
    | `update.onBoot`           | `boolean` | `true`  | هنگام باز شدن مدیر QMD بلندعمر نوسازی کن؛ نوسازی راه‌اندازی اختیاری را نیز کنترل می‌کند |
    | `update.startup`          | `string`  | `off`   | نوسازی اختیاری هنگام شروع gateway: `off`، `idle`، یا `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تاخیر پیش از اجرای نوسازی `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | باز شدن مدیر را تا کامل شدن نوسازی اولیه آن مسدود کن |
    | `update.embedInterval`    | `string`  | --      | آهنگ جداگانه تعبیه                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلت زمانی برای فرمان‌های QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلت زمانی برای عملیات به‌روزرسانی QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلت زمانی برای عملیات تعبیه QMD      |
  </Accordion>
  <Accordion title="محدودیت‌ها">
    | کلید                      | نوع      | پیش‌فرض | توضیح                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | بیشینه نتایج جستجو         |
    | `limits.maxSnippetChars`  | `number` | --      | طول قطعه را محدود کن       |
    | `limits.maxInjectedChars` | `number` | --      | مجموع نویسه‌های تزریق‌شده را محدود کن |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلت زمانی جستجو             |
  </Accordion>
  <Accordion title="دامنه">
    کنترل می‌کند کدام نشست‌ها می‌توانند نتایج جستجوی QMD را دریافت کنند. همان طرح‌واره [`session.sendPolicy`](/fa/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    پیش‌فرض ارائه‌شده، نشست‌های مستقیم و کانالی را مجاز می‌کند، در حالی که همچنان گروه‌ها را رد می‌کند.

    پیش‌فرض فقط DM است. `match.keyPrefix` با کلید نشست نرمال‌سازی‌شده مطابقت می‌دهد؛ `match.rawKeyPrefix` با کلید خام شامل `agent:<id>:` مطابقت می‌دهد.

  </Accordion>
  <Accordion title="ارجاع‌ها">
    `memory.citations` برای همه پشتانه‌ها اعمال می‌شود:

    | مقدار           | رفتار                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (پیش‌فرض) | پابرگ `Source: <path#line>` را در قطعه‌ها درج کن    |
    | `on`             | همیشه پابرگ را درج کن                               |
    | `off`            | پابرگ را حذف کن (مسیر همچنان در داخل به عامل داده می‌شود) |

  </Accordion>
</AccordionGroup>

نوسازی‌های راه‌اندازی QMD هنگام شروع gateway از یک مسیر زیرفرایند تک‌مرحله‌ای استفاده می‌کنند. مدیر QMD بلندعمر همچنان وقتی جستجوی حافظه برای استفاده تعاملی باز می‌شود، مالک ناظر معمول فایل و تایمرهای بازه‌ای است.

### نمونه کامل QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming زیر `plugins.entries.memory-core.config.dreaming` پیکربندی می‌شود، نه زیر `agents.defaults.memorySearch`.

Dreaming به‌صورت یک پیمایش زمان‌بندی‌شده اجرا می‌شود و از فازهای داخلی سبک/عمیق/REM به‌عنوان جزئیات پیاده‌سازی استفاده می‌کند.

برای رفتار مفهومی و فرمان‌های اسلش، [Dreaming](/fa/concepts/dreaming) را ببینید.

### تنظیمات کاربر

| کلید        | نوع       | پیش‌فرض      | توضیح                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming را کاملا فعال یا غیرفعال کن               |
| `frequency` | `string`  | `0 3 * * *`   | آهنگ Cron اختیاری برای پیمایش کامل Dreaming |
| `model`     | `string`  | مدل پیش‌فرض | بازنویسی اختیاری مدل زیرعامل Dream Diary      |

### نمونه

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming وضعیت ماشین را در `memory/.dreams/` می‌نویسد.
- Dreaming خروجی روایی خوانا برای انسان را در `DREAMS.md` (یا `dreams.md` موجود) می‌نویسد.
- `dreaming.model` از دروازه اعتماد زیرعامل Plugin موجود استفاده می‌کند؛ پیش از فعال کردن آن، `plugins.entries.memory-core.subagent.allowModelOverride: true` را تنظیم کنید.
- وقتی مدل پیکربندی‌شده در دسترس نباشد، Dream Diary یک‌بار با مدل پیش‌فرض نشست دوباره تلاش می‌کند. شکست‌های اعتماد یا allowlist ثبت می‌شوند و بی‌صدا دوباره تلاش نمی‌شوند.
- سیاست فاز سبک/عمیق/REM و آستانه‌ها رفتار داخلی هستند، نه پیکربندی روبه‌کاربر.

</Note>

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمای کلی حافظه](/fa/concepts/memory)
- [جستجوی حافظه](/fa/concepts/memory-search)
