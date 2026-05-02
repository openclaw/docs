---
read_when:
    - می‌خواهید ارائه‌دهندگان جست‌وجوی حافظه یا مدل‌های تعبیه‌سازی را پیکربندی کنید
    - می‌خواهید بک‌اند QMD را راه‌اندازی کنید
    - می‌خواهید جست‌وجوی ترکیبی، MMR یا افت زمانی را تنظیم کنید
    - می‌خواهید نمایه‌سازی حافظهٔ چندوجهی را فعال کنید
sidebarTitle: Memory config
summary: تمام گزینه‌های پیکربندی برای جست‌وجوی حافظه، ارائه‌دهندگان تعبیه‌سازی، QMD، جست‌وجوی ترکیبی و نمایه‌سازی چندوجهی
title: مرجع پیکربندی حافظه
x-i18n:
    generated_at: "2026-05-02T22:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

این صفحه همهٔ تنظیمات قابل پیکربندی برای جستجوی حافظهٔ OpenClaw را فهرست می‌کند. برای مرورهای مفهومی، ببینید:

<CardGroup cols={2}>
  <Card title="نمای کلی حافظه" href="/fa/concepts/memory">
    حافظه چگونه کار می‌کند.
  </Card>
  <Card title="موتور داخلی" href="/fa/concepts/memory-builtin">
    backend پیش‌فرض SQLite.
  </Card>
  <Card title="موتور QMD" href="/fa/concepts/memory-qmd">
    sidecar محلی‌اول.
  </Card>
  <Card title="جستجوی حافظه" href="/fa/concepts/memory-search">
    pipeline جستجو و تنظیم آن.
  </Card>
  <Card title="Active Memory" href="/fa/concepts/active-memory">
    زیرعامل حافظه برای نشست‌های تعاملی.
  </Card>
</CardGroup>

همهٔ تنظیمات جستجوی حافظه، مگر اینکه خلافش ذکر شده باشد، زیر `agents.defaults.memorySearch` در `openclaw.json` قرار دارند.

<Note>
اگر به‌دنبال کلید روشن/خاموش ویژگی **Active Memory** و پیکربندی زیرعامل هستید، آن تنظیمات به‌جای `memorySearch` زیر `plugins.entries.active-memory` قرار دارند.

Active Memory از یک مدل دو دروازه‌ای استفاده می‌کند:

1. Plugin باید فعال باشد و شناسهٔ عامل فعلی را هدف بگیرد
2. درخواست باید یک نشست چت تعاملی پایدار واجد شرایط باشد

برای مدل فعال‌سازی، پیکربندی متعلق به Plugin، ماندگاری transcript و الگوی عرضهٔ ایمن، [Active Memory](/fa/concepts/active-memory) را ببینید.
</Note>

---

## انتخاب provider

| کلید        | نوع      | پیش‌فرض          | توضیح                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | شناسایی خودکار    | شناسهٔ adapter مربوط به embedding مانند `bedrock`، `deepinfra`، `gemini`، `github-copilot`، `local`، `mistral`، `ollama`، `openai`، یا `voyage`؛ همچنین می‌تواند یک `models.providers.<id>` پیکربندی‌شده باشد که `api` آن به یکی از این adapterها اشاره می‌کند |
| `model`    | `string`  | پیش‌فرض provider | نام مدل embedding                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | شناسهٔ adapter جایگزین وقتی مورد اصلی شکست می‌خورد                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | فعال یا غیرفعال کردن جستجوی حافظه                                                                                                                                                                                                    |

### ترتیب شناسایی خودکار

وقتی `provider` تنظیم نشده باشد، OpenClaw اولین گزینهٔ در دسترس را انتخاب می‌کند:

<Steps>
  <Step title="local">
    اگر `memorySearch.local.modelPath` پیکربندی شده باشد و فایل وجود داشته باشد، انتخاب می‌شود.
  </Step>
  <Step title="github-copilot">
    اگر token مربوط به GitHub Copilot قابل resolve باشد (متغیر محیطی یا profile احراز هویت)، انتخاب می‌شود.
  </Step>
  <Step title="openai">
    اگر کلید OpenAI قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="gemini">
    اگر کلید Gemini قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="voyage">
    اگر کلید Voyage قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="mistral">
    اگر کلید Mistral قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="deepinfra">
    اگر کلید DeepInfra قابل resolve باشد، انتخاب می‌شود.
  </Step>
  <Step title="bedrock">
    اگر زنجیرهٔ اعتبارنامهٔ AWS SDK قابل resolve باشد (نقش instance، کلیدهای دسترسی، profile، SSO، هویت وب، یا پیکربندی مشترک)، انتخاب می‌شود.
  </Step>
</Steps>

`ollama` پشتیبانی می‌شود اما به‌صورت خودکار شناسایی نمی‌شود (آن را صریحاً تنظیم کنید).

### شناسه‌های provider سفارشی

`memorySearch.provider` می‌تواند به یک ورودی سفارشی `models.providers.<id>` اشاره کند. OpenClaw مالک `api` آن provider را برای adapter مربوط به embedding resolve می‌کند، درحالی‌که شناسهٔ provider سفارشی را برای endpoint، احراز هویت، و مدیریت پیشوند مدل حفظ می‌کند. این به راه‌اندازی‌های چند-GPU یا چند-host اجازه می‌دهد embeddingهای حافظه را به یک endpoint محلی مشخص اختصاص دهند:

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

embeddingهای راه دور به کلید API نیاز دارند. Bedrock به‌جای آن از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند (نقش‌های instance، SSO، کلیدهای دسترسی).

| Provider       | متغیر محیطی                                            | کلید پیکربندی                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | زنجیرهٔ اعتبارنامهٔ AWS                               | به کلید API نیاز ندارد                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | profile احراز هویت از طریق ورود با دستگاه       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth مربوط به Codex فقط chat/completions را پوشش می‌دهد و درخواست‌های embedding را برآورده نمی‌کند.
</Note>

---

## پیکربندی endpoint راه دور

برای endpointهای سفارشی سازگار با OpenAI یا بازنویسی پیش‌فرض‌های provider:

<ParamField path="remote.baseUrl" type="string">
  URL پایهٔ API سفارشی.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  بازنویسی کلید API.
</ParamField>
<ParamField path="remote.headers" type="object">
  headerهای HTTP اضافی (با پیش‌فرض‌های provider ادغام می‌شوند).
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

## پیکربندی ویژهٔ provider

<AccordionGroup>
  <Accordion title="Gemini">
    | کلید                    | نوع     | پیش‌فرض                | توضیح                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | از `gemini-embedding-2-preview` هم پشتیبانی می‌کند |
    | `outputDimensionality` | `number` | `3072`                 | برای Embedding 2: 768، 1536، یا 3072        |

    <Warning>
    تغییر مدل یا `outputDimensionality` باعث reindex کامل خودکار می‌شود.
    </Warning>

  </Accordion>
  <Accordion title="نوع‌های ورودی سازگار با OpenAI">
    endpointهای embedding سازگار با OpenAI می‌توانند فیلدهای درخواست `input_type` ویژهٔ provider را فعال کنند. این برای مدل‌های embedding نامتقارن مفید است که برای embeddingهای پرس‌وجو و سند به برچسب‌های متفاوت نیاز دارند.

    | کلید                 | نوع     | پیش‌فرض | توضیح                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | تنظیم‌نشده   | `input_type` مشترک برای embeddingهای پرس‌وجو و سند   |
    | `queryInputType`    | `string` | تنظیم‌نشده   | `input_type` زمان پرس‌وجو؛ `inputType` را بازنویسی می‌کند          |
    | `documentInputType` | `string` | تنظیم‌نشده   | `input_type` شاخص/سند؛ `inputType` را بازنویسی می‌کند      |

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

    تغییر این مقدارها بر هویت cache مربوط به embedding برای indexing دسته‌ای provider اثر می‌گذارد و وقتی مدل بالادستی با برچسب‌ها رفتار متفاوتی دارد، باید پس از آن reindex حافظه انجام شود.

  </Accordion>
  <Accordion title="Bedrock">
    ### پیکربندی embedding در Bedrock

    Bedrock از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند، بنابراین به کلید API نیازی نیست. اگر OpenClaw روی EC2 با یک نقش instance فعال‌شده برای Bedrock اجرا می‌شود، فقط provider و مدل را تنظیم کنید:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | هر شناسهٔ مدل embedding مربوط به Bedrock  |
    | `outputDimensionality` | `number` | پیش‌فرض مدل                  | برای Titan V2: 256، 512، یا 1024 |

    **مدل‌های پشتیبانی‌شده** (با تشخیص خانواده و پیش‌فرض‌های بُعد):

    | شناسهٔ مدل                                   | Provider   | ابعاد پیش‌فرض | ابعاد قابل پیکربندی    |
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

    variantهای دارای پسوند throughput (مثلاً `amazon.titan-embed-text-v1:2:8k`) پیکربندی مدل پایه را به ارث می‌برند.

    **احراز هویت:** احراز هویت Bedrock از ترتیب استاندارد resolve اعتبارنامهٔ AWS SDK استفاده می‌کند:

    1. متغیرهای محیطی (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. cache توکن SSO
    3. اعتبارنامه‌های توکن هویت وب
    4. فایل‌های اعتبارنامه و پیکربندی مشترک
    5. اعتبارنامه‌های metadata مربوط به ECS یا EC2

    Region از `AWS_REGION`، `AWS_DEFAULT_REGION`، مقدار `baseUrl` مربوط به provider `amazon-bedrock` resolve می‌شود، یا به‌صورت پیش‌فرض `us-east-1` است.

    **مجوزهای IAM:** نقش یا کاربر IAM به این موارد نیاز دارد:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    برای حداقل سطح دسترسی، `InvokeModel` را به مدل مشخص محدود کنید:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلی (GGUF + node-llama-cpp)">
    | کلید                 | نوع                | پیش‌فرض                 | توضیح                                                                                                                                                                                                                                                                                                                         |
    | --------------------- | ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | دانلود خودکار           | مسیر فایل مدل GGUF                                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | پیش‌فرض node-llama-cpp  | پوشه کش برای مدل‌های دانلودشده                                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | اندازه پنجره زمینه برای زمینه embedding. مقدار 4096 قطعه‌های معمول (128–512 توکن) را پوشش می‌دهد و هم‌زمان VRAM غیرمرتبط با وزن‌ها را محدود می‌کند. روی میزبان‌های محدودتر آن را به 1024–2048 کاهش دهید. `"auto"` از بیشینه آموزش‌دیده مدل استفاده می‌کند — برای مدل‌های 8B+ توصیه نمی‌شود (Qwen3-Embedding-8B: 40 960 توکن → حدود 32 GB VRAM در برابر حدود 8.8 GB در 4096). |

    مدل پیش‌فرض: `embeddinggemma-300m-qat-Q8_0.gguf` (حدود 0.6 GB، دانلود خودکار). checkoutهای سورس همچنان به تأیید build بومی نیاز دارند: `pnpm approve-builds` سپس `pnpm rebuild node-llama-cpp`.

    برای بررسی همان مسیر ارائه‌دهنده‌ای که Gateway استفاده می‌کند، از CLI مستقل استفاده کنید:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    اگر `provider` برابر `auto` باشد، `local` فقط زمانی انتخاب می‌شود که `local.modelPath` به یک فایل محلی موجود اشاره کند. ارجاع‌های مدل `hf:` و HTTP(S) همچنان می‌توانند صریحا با `provider: "local"` استفاده شوند، اما باعث نمی‌شوند `auto` پیش از در دسترس بودن مدل روی دیسک، local را انتخاب کند.

  </Accordion>
</AccordionGroup>

### مهلت زمانی embedding درون‌خطی

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  مهلت زمانی batchهای embedding درون‌خطی را هنگام نمایه‌سازی حافظه بازنویسی کنید.

در صورت تنظیم نبودن، از پیش‌فرض ارائه‌دهنده استفاده می‌شود: 600 ثانیه برای ارائه‌دهنده‌های محلی/خودمیزبان مانند `local`، `ollama` و `lmstudio`، و 120 ثانیه برای ارائه‌دهنده‌های میزبانی‌شده. وقتی batchهای embedding محلی متکی به CPU سالم اما کند هستند، این مقدار را افزایش دهید.
</ParamField>

---

## پیکربندی جست‌وجوی ترکیبی

همه زیر `memorySearch.query.hybrid`:

| کلید                  | نوع       | پیش‌فرض | توضیح                               |
| --------------------- | --------- | ------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`  | فعال‌سازی جست‌وجوی ترکیبی BM25 + برداری |
| `vectorWeight`        | `number`  | `0.7`   | وزن امتیازهای برداری (0-1)         |
| `textWeight`          | `number`  | `0.3`   | وزن امتیازهای BM25 (0-1)           |
| `candidateMultiplier` | `number`  | `4`     | ضریب اندازه مجموعه نامزدها         |

<Tabs>
  <Tab title="MMR (تنوع)">
    | کلید          | نوع       | پیش‌فرض | توضیح                                  |
    | ------------- | --------- | ------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | فعال‌سازی رتبه‌بندی دوباره MMR         |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = بیشینه تنوع، 1 = بیشینه ارتباط    |
  </Tab>
  <Tab title="افت زمانی (تازگی)">
    | کلید                         | نوع       | پیش‌فرض | توضیح                         |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | فعال‌سازی تقویت تازگی         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | امتیاز هر N روز نصف می‌شود    |

    فایل‌های همیشه‌سبز (`MEMORY.md`، فایل‌های بدون تاریخ در `memory/`) هرگز دچار افت نمی‌شوند.

  </Tab>
</Tabs>

### نمونه کامل

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

| کلید         | نوع        | توضیح                                      |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | پوشه‌ها یا فایل‌های اضافی برای نمایه‌سازی |

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

مسیرها می‌توانند مطلق یا نسبی به workspace باشند. پوشه‌ها به‌صورت بازگشتی برای فایل‌های `.md` پویش می‌شوند. نحوه مدیریت symlink به backend فعال بستگی دارد: موتور داخلی symlinkها را نادیده می‌گیرد، در حالی که QMD از رفتار scanner زیربنایی QMD پیروی می‌کند.

برای جست‌وجوی transcript میان-agent با محدوده agent، به‌جای `memory.qmd.paths` از `agents.list[].memorySearch.qmd.extraCollections` استفاده کنید. آن collectionهای اضافی همان شکل `{ path, name, pattern? }` را دنبال می‌کنند، اما به‌ازای هر agent ادغام می‌شوند و وقتی مسیر به خارج از workspace فعلی اشاره می‌کند، می‌توانند نام‌های مشترک صریح را حفظ کنند. اگر همان مسیر resolve‌شده هم در `memory.qmd.paths` و هم در `memorySearch.qmd.extraCollections` ظاهر شود، QMD ورودی اول را نگه می‌دارد و مورد تکراری را رد می‌کند.

---

## حافظه چندوجهی (Gemini)

تصاویر و صدا را در کنار Markdown با استفاده از Gemini Embedding 2 نمایه‌سازی کنید:

| کلید                      | نوع        | پیش‌فرض    | توضیح                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | فعال‌سازی نمایه‌سازی چندوجهی           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`، `["audio"]`، یا `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | بیشینه اندازه فایل برای نمایه‌سازی     |

<Note>
فقط برای فایل‌های داخل `extraPaths` اعمال می‌شود. ریشه‌های حافظهٔ پیش‌فرض همچنان فقط Markdown هستند. به `gemini-embedding-2-preview` نیاز دارد. `fallback` باید `"none"` باشد.
</Note>

قالب‌های پشتیبانی‌شده: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (تصاویر)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## حافظهٔ نهان تعبیه

| کلید               | نوع       | پیش‌فرض | توضیح                                  |
| ------------------ | --------- | ------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | تعبیه‌های قطعه‌ها را در SQLite cache کن |
| `cache.maxEntries` | `number`  | `50000` | حداکثر تعبیه‌های cacheشده             |

از تعبیهٔ دوبارهٔ متنِ بدون تغییر هنگام نمایه‌سازی دوباره یا به‌روزرسانی transcript جلوگیری می‌کند.

---

## نمایه‌سازی دسته‌ای

| کلید                          | نوع       | پیش‌فرض | توضیح                         |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | تعبیه‌های درون‌خطی موازی      |
| `remote.batch.enabled`        | `boolean` | `false` | API تعبیهٔ دسته‌ای را فعال کن |
| `remote.batch.concurrency`    | `number`  | `2`     | کارهای دسته‌ای موازی          |
| `remote.batch.wait`           | `boolean` | `true`  | منتظر تکمیل دسته بمان         |
| `remote.batch.pollIntervalMs` | `number`  | --      | بازهٔ poll                    |
| `remote.batch.timeoutMinutes` | `number`  | --      | timeout دسته                  |

برای `openai`، `gemini` و `voyage` در دسترس است. دسته‌ای OpenAI معمولا برای backfillهای بزرگ سریع‌ترین و کم‌هزینه‌ترین گزینه است.

`remote.nonBatchConcurrency` فراخوانی‌های تعبیهٔ درون‌خطی را کنترل می‌کند که providerهای محلی/self-hosted و providerهای میزبانی‌شده زمانی استفاده می‌کنند که APIهای دسته‌ای provider فعال نیستند. مقدار پیش‌فرض Ollama برای نمایه‌سازی غیردسته‌ای `1` است تا از overload شدن میزبان‌های محلی کوچک‌تر جلوگیری شود؛ روی ماشین‌های بزرگ‌تر مقدار بالاتری تنظیم کنید.

این جدا از `sync.embeddingBatchTimeoutSeconds` است که timeout فراخوانی‌های تعبیهٔ درون‌خطی را کنترل می‌کند.

---

## جست‌وجوی حافظهٔ نشست (آزمایشی)

transcriptهای نشست را نمایه‌سازی کنید و آن‌ها را از طریق `memory_search` ارائه دهید:

| کلید                          | نوع        | پیش‌فرض     | توضیح                                      |
| ----------------------------- | ---------- | ----------- | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`     | نمایه‌سازی نشست را فعال کن                 |
| `sources`                     | `string[]` | `["memory"]` | برای شامل کردن transcriptها `"sessions"` را اضافه کن |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | آستانهٔ بایت برای نمایه‌سازی دوباره         |
| `sync.sessions.deltaMessages` | `number`   | `50`        | آستانهٔ پیام برای نمایه‌سازی دوباره         |

<Warning>
نمایه‌سازی نشست opt-in است و به‌صورت ناهمگام اجرا می‌شود. نتایج می‌توانند کمی stale باشند. logهای نشست روی دیسک قرار دارند، بنابراین دسترسی filesystem را به‌عنوان مرز اعتماد در نظر بگیرید.
</Warning>

---

## شتاب‌دهی برداری SQLite (sqlite-vec)

| کلید                         | نوع       | پیش‌فرض | توضیح                               |
| ---------------------------- | --------- | ------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | از sqlite-vec برای queryهای برداری استفاده کن |
| `store.vector.extensionPath` | `string`  | bundled | مسیر sqlite-vec را override کن      |

وقتی sqlite-vec در دسترس نباشد، OpenClaw به‌طور خودکار به شباهت کسینوسی درون‌فرآیندی fallback می‌کند.

---

## ذخیره‌سازی نمایه

| کلید                  | نوع      | پیش‌فرض                              | توضیح                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | مکان نمایه (از token `{agentId}` پشتیبانی می‌کند) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | tokenizer مربوط به FTS5 (`unicode61` یا `trigram`) |

---

## پیکربندی backend مربوط به QMD

برای فعال‌سازی، `memory.backend = "qmd"` را تنظیم کنید. همهٔ تنظیمات QMD زیر `memory.qmd` قرار دارند:

| کلید                     | نوع       | پیش‌فرض | توضیح                                                                 |
| ------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`   | مسیر executable مربوط به QMD؛ وقتی `PATH` سرویس با shell شما متفاوت است، یک مسیر مطلق تنظیم کنید |
| `searchMode`             | `string`  | `search` | فرمان جست‌وجو: `search`، `vsearch`، `query`                           |
| `includeDefaultMemory`   | `boolean` | `true`  | `MEMORY.md` + `memory/**/*.md` را خودکار نمایه‌سازی کن                 |
| `paths[]`                | `array`   | --      | مسیرهای اضافی: `{ name, path, pattern? }`                             |
| `sessions.enabled`       | `boolean` | `false` | transcriptهای نشست را نمایه‌سازی کن                                   |
| `sessions.retentionDays` | `number`  | --      | نگه‌داری transcript                                                   |
| `sessions.exportDir`     | `string`  | --      | دایرکتوری export                                                       |

`searchMode: "search"` فقط واژگانی/BM25 است. OpenClaw برای این حالت، از جمله هنگام اجرای `memory status --deep`، کاوشگرهای آمادگی بردار معنایی یا نگهداری embedding در QMD را اجرا نمی‌کند؛ `vsearch` و `query` همچنان به آمادگی بردار و embeddingهای QMD نیاز دارند.

OpenClaw شکل‌های فعلی مجموعه QMD و پرس‌وجوی MCP را ترجیح می‌دهد، اما با آزمودن پرچم‌های الگوی مجموعه سازگار و نام‌های قدیمی‌تر ابزار MCP در صورت نیاز، نسخه‌های قدیمی‌تر QMD را هم فعال نگه می‌دارد. وقتی QMD پشتیبانی از چند فیلتر مجموعه را اعلام می‌کند، مجموعه‌های هم‌منبع با یک فرایند QMD جست‌وجو می‌شوند؛ ساخت‌های قدیمی‌تر QMD مسیر سازگاری به‌ازای هر مجموعه را نگه می‌دارند. هم‌منبع یعنی مجموعه‌های حافظه پایدار با هم گروه‌بندی می‌شوند، در حالی که مجموعه‌های رونوشت نشست در گروهی جدا می‌مانند تا تنوع منبع همچنان هر دو ورودی را داشته باشد.

<Note>
بازنویسی‌های مدل QMD در سمت QMD می‌مانند، نه در پیکربندی OpenClaw. اگر لازم است مدل‌های QMD را به‌صورت سراسری بازنویسی کنید، متغیرهای محیطی مانند `QMD_EMBED_MODEL`، `QMD_RERANK_MODEL` و `QMD_GENERATE_MODEL` را در محیط اجرای Gateway تنظیم کنید.
</Note>

<AccordionGroup>
  <Accordion title="زمان‌بندی به‌روزرسانی">
    | کلید                       | نوع      | پیش‌فرض | توضیح                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | بازه بازآوری                      |
    | `update.debounceMs`       | `number`  | `15000` | مهار تغییرات فایل                 |
    | `update.onBoot`           | `boolean` | `true`  | هنگام باز شدن مدیر بلندمدت QMD بازآوری کن؛ همچنین بازآوری اختیاری هنگام راه‌اندازی را کنترل می‌کند |
    | `update.startup`          | `string`  | `off`   | بازآوری اختیاری در شروع Gateway: `off`، `idle`، یا `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تأخیر پیش از اجرای بازآوری `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | باز شدن مدیر را تا پایان بازآوری اولیه آن مسدود کن |
    | `update.embedInterval`    | `string`  | --      | آهنگ جداگانه embedding                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلت زمانی برای فرمان‌های QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلت زمانی برای عملیات به‌روزرسانی QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلت زمانی برای عملیات embedding در QMD      |
  </Accordion>
  <Accordion title="محدودیت‌ها">
    | کلید                       | نوع     | پیش‌فرض | توضیح                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | بیشینه نتایج جست‌وجو         |
    | `limits.maxSnippetChars`  | `number` | --      | محدود کردن طول قطعه       |
    | `limits.maxInjectedChars` | `number` | --      | محدود کردن مجموع نویسه‌های تزریق‌شده |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلت زمانی جست‌وجو             |
  </Accordion>
  <Accordion title="دامنه">
    کنترل می‌کند کدام نشست‌ها می‌توانند نتایج جست‌وجوی QMD را دریافت کنند. طرح‌واره همانند [`session.sendPolicy`](/fa/gateway/config-agents#session) است:

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

    پیش‌فرض ارائه‌شده نشست‌های مستقیم و کانال را مجاز می‌کند، در حالی که گروه‌ها همچنان رد می‌شوند.

    پیش‌فرض فقط DM است. `match.keyPrefix` با کلید نشست نرمال‌شده مطابقت می‌دهد؛ `match.rawKeyPrefix` با کلید خام شامل `agent:<id>:` مطابقت می‌دهد.

  </Accordion>
  <Accordion title="استنادها">
    `memory.citations` روی همه backendها اعمال می‌شود:

    | مقدار            | رفتار                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (پیش‌فرض) | پانوشت `Source: <path#line>` را در قطعه‌ها اضافه کن    |
    | `on`             | همیشه پانوشت را اضافه کن                               |
    | `off`            | پانوشت را حذف کن (مسیر همچنان به‌صورت داخلی به عامل فرستاده می‌شود) |

  </Accordion>
</AccordionGroup>

بازآوری‌های راه‌اندازی QMD هنگام شروع Gateway از یک مسیر زیرفرایند تک‌مرحله‌ای استفاده می‌کنند. وقتی جست‌وجوی حافظه برای استفاده تعاملی باز می‌شود، مدیر بلندمدت QMD همچنان مالک ناظر فایل عادی و زمان‌سنج‌های بازه‌ای است.

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

| کلید         | نوع      | پیش‌فرض       | توضیح                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming را به‌طور کامل فعال یا غیرفعال کن               |
| `frequency` | `string`  | `0 3 * * *`   | آهنگ اختیاری cron برای پیمایش کامل Dreaming |
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
- وقتی مدل پیکربندی‌شده در دسترس نیست، Dream Diary یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌کند. خطاهای اعتماد یا فهرست مجاز ثبت می‌شوند و بی‌صدا دوباره تلاش نمی‌شوند.
- خط‌مشی و آستانه‌های فاز سبک/عمیق/REM رفتار داخلی هستند، نه پیکربندی روبه‌کاربر.

</Note>

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمای کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
