---
read_when:
    - می‌خواهید ارائه‌دهندگان جست‌وجوی حافظه یا مدل‌های تعبیه را پیکربندی کنید
    - می‌خواهید بک‌اند QMD را راه‌اندازی کنید
    - می‌خواهید جست‌وجوی ترکیبی، MMR یا افت زمانی را تنظیم کنید
    - می‌خواهید نمایه‌سازی حافظهٔ چندوجهی را فعال کنید
sidebarTitle: Memory config
summary: همه گزینه‌های پیکربندی برای جستجوی حافظه، ارائه‌دهندگان embedding، QMD، جستجوی ترکیبی، و نمایه‌سازی چندوجهی
title: مرجع پیکربندی حافظه
x-i18n:
    generated_at: "2026-06-28T22:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

این صفحه همهٔ گزینه‌های پیکربندی برای جست‌وجوی حافظهٔ OpenClaw را فهرست می‌کند. برای مرورهای مفهومی، ببینید:

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
    خط لولهٔ جست‌وجو و تنظیم.
  </Card>
  <Card title="Active memory" href="/fa/concepts/active-memory">
    زیربرنامهٔ عامل حافظه برای نشست‌های تعاملی.
  </Card>
</CardGroup>

همهٔ تنظیمات جست‌وجوی حافظه، مگر اینکه خلافش ذکر شده باشد، زیر `agents.defaults.memorySearch` در `openclaw.json` قرار دارند.

<Note>
اگر به دنبال کلید روشن/خاموش قابلیت **Active Memory** و پیکربندی زیربرنامهٔ عامل هستید، آن به‌جای `memorySearch` زیر `plugins.entries.active-memory` قرار دارد.

Active Memory از یک مدل دو‌دروازه‌ای استفاده می‌کند:

1. Plugin باید فعال باشد و شناسهٔ عامل فعلی را هدف بگیرد
2. درخواست باید یک نشست گفت‌وگوی تعاملی پایدار واجد شرایط باشد

برای مدل فعال‌سازی، پیکربندی متعلق به Plugin، ماندگاری رونوشت، و الگوی عرضهٔ امن، [Active Memory](/fa/concepts/active-memory) را ببینید.
</Note>

---

## انتخاب ارائه‌دهنده

| کلید        | نوع      | پیش‌فرض          | توضیح                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | شناسهٔ آداپتر embedding مانند `bedrock`، `deepinfra`، `gemini`، `github-copilot`، `local`، `mistral`، `ollama`، `openai`، `openai-compatible`، یا `voyage`؛ همچنین می‌تواند یک `models.providers.<id>` پیکربندی‌شده باشد که `api` آن به یک آداپتر embedding حافظه یا API مدل سازگار با OpenAI اشاره می‌کند |
| `model`    | `string`  | پیش‌فرض ارائه‌دهنده | نام مدل embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | شناسهٔ آداپتر جایگزین هنگامی که مورد اصلی شکست می‌خورد                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | فعال یا غیرفعال کردن جست‌وجوی حافظه                                                                                                                                                                                                                                                             |

وقتی `provider` تنظیم نشده باشد، OpenClaw از embeddingهای OpenAI استفاده می‌کند. برای استفاده از Gemini، Voyage، Mistral، DeepInfra، Bedrock، GitHub Copilot،
Ollama، یک مدل GGUF محلی، یا یک endpoint سازگار با OpenAI در `/v1/embeddings`، `provider`
را صراحتاً تنظیم کنید.
پیکربندی‌های قدیمی که هنوز `provider: "auto"` دارند به `openai` حل می‌شوند.

<Warning>
تغییر ارائه‌دهندهٔ embedding، مدل، تنظیمات ارائه‌دهنده، منابع، دامنه،
بخش‌بندی، یا tokenizer می‌تواند شاخص برداری SQLite موجود را ناسازگار کند.
OpenClaw به‌جای اینکه همه‌چیز را به‌طور خودکار دوباره embedding کند، جست‌وجوی برداری را متوقف می‌کند و هشدار هویت شاخص گزارش می‌دهد. وقتی آماده بودید با
`openclaw memory status --index --agent <id>` یا
`openclaw memory index --force --agent <id>` آن را بازسازی کنید.
</Warning>

وقتی `provider` تنظیم نشده باشد، `provider: "auto"` قدیمی وجود داشته باشد، یا
`provider: "none"` عمداً حالت فقط FTS را انتخاب کند، فراخوانی حافظه همچنان می‌تواند
وقتی embeddingها در دسترس نیستند از رتبه‌بندی واژگانی FTS استفاده کند.

ارائه‌دهنده‌های غیرمحلی صریح به‌صورت بسته شکست می‌خورند. اگر `memorySearch.provider` را روی
یک ارائه‌دهندهٔ مشخص مبتنی بر راه دور مانند OpenAI، Gemini، Voyage، Mistral،
Bedrock، GitHub Copilot، DeepInfra، Ollama، LM Studio، یا یک ارائه‌دهندهٔ سفارشی سازگار با OpenAI
تنظیم کنید و آن ارائه‌دهنده هنگام اجرا در دسترس نباشد، `memory_search`
به‌جای اینکه بی‌صدا از فراخوانی فقط FTS استفاده کند، نتیجهٔ در دسترس نبودن را برمی‌گرداند. پیکربندی
ارائه‌دهنده/احراز هویت را اصلاح کنید، به یک ارائه‌دهندهٔ قابل دسترس تغییر دهید، یا اگر فراخوانی فقط FTS
تعمدی می‌خواهید `provider: "none"` را تنظیم کنید.

### شناسه‌های ارائه‌دهندهٔ سفارشی

`memorySearch.provider` می‌تواند برای آداپترهای ارائه‌دهندهٔ مخصوص حافظه مانند `ollama`، یا برای APIهای مدل سازگار با OpenAI مانند `openai-responses` / `openai-completions`، به یک ورودی سفارشی `models.providers.<id>` اشاره کند. OpenClaw مالک `api` آن ارائه‌دهنده را برای آداپتر embedding حل می‌کند، درحالی‌که شناسهٔ ارائه‌دهندهٔ سفارشی را برای مدیریت endpoint، احراز هویت، و پیشوند مدل حفظ می‌کند. این به راه‌اندازی‌های چند-GPU یا چندمیزبان اجازه می‌دهد embeddingهای حافظه را به یک endpoint محلی مشخص اختصاص دهند:

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

### حل کلید API

embeddingهای راه دور به کلید API نیاز دارند. Bedrock در عوض از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS SDK استفاده می‌کند (نقش‌های نمونه، SSO، کلیدهای دسترسی).

| ارائه‌دهنده       | متغیر محیطی                                            | کلید پیکربندی                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | زنجیرهٔ اعتبارنامهٔ AWS                               | نیازی به کلید API نیست                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | پروفایل احراز هویت از طریق ورود با دستگاه       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (نگهدارندهٔ جا)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth مربوط به Codex فقط chat/completions را پوشش می‌دهد و درخواست‌های embedding را برآورده نمی‌کند.
</Note>

---

## پیکربندی endpoint راه دور

برای یک سرور عمومی سازگار با OpenAI در
`/v1/embeddings` که نباید اعتبارنامه‌های گفت‌وگوی سراسری OpenAI را به ارث ببرد، از `provider: "openai-compatible"` استفاده کنید.

<ParamField path="remote.baseUrl" type="string">
  URL پایهٔ سفارشی API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  بازنویسی کلید API.
</ParamField>
<ParamField path="remote.headers" type="object">
  هدرهای HTTP اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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

## پیکربندی ویژهٔ ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Gemini">
    | کلید                    | نوع     | پیش‌فرض                | توضیح                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | از `gemini-embedding-2-preview` نیز پشتیبانی می‌کند |
    | `outputDimensionality` | `number` | `3072`                 | برای Embedding 2: 768، 1536، یا 3072        |

    <Warning>
    تغییر مدل یا `outputDimensionality` هویت شاخص را تغییر می‌دهد. OpenClaw
    جست‌وجوی برداری را متوقف می‌کند تا زمانی که صراحتاً شاخص حافظه را بازسازی کنید.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    endpointهای embedding سازگار با OpenAI می‌توانند فیلدهای درخواست `input_type` ویژهٔ ارائه‌دهنده را فعال کنند. این برای مدل‌های embedding نامتقارن که برای embeddingهای پرس‌وجو و سند به برچسب‌های متفاوت نیاز دارند مفید است.

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
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    تغییر این مقادیر بر هویت کش embedding برای شاخص‌گذاری دسته‌ای ارائه‌دهنده اثر می‌گذارد و وقتی مدل بالادستی با برچسب‌ها رفتار متفاوتی دارد، باید پس از آن بازشاخص‌گذاری حافظه انجام شود.

  </Accordion>
  <Accordion title="Bedrock">
    ### پیکربندی embedding در Bedrock

    Bedrock از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS SDK استفاده می‌کند؛ به کلیدهای API نیازی نیست. اگر OpenClaw روی EC2 با نقش نمونهٔ دارای Bedrock فعال اجرا می‌شود، فقط ارائه‌دهنده و مدل را تنظیم کنید:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | هر شناسهٔ مدل embedding در Bedrock  |
    | `outputDimensionality` | `number` | پیش‌فرض مدل                  | برای Titan V2: 256، 512، یا 1024 |

    **مدل‌های پشتیبانی‌شده** (با تشخیص خانواده و پیش‌فرض‌های بُعد):

    | شناسه مدل                                   | ارائه‌دهنده   | ابعاد پیش‌فرض | ابعاد قابل پیکربندی    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    گونه‌های دارای پسوند توان عملیاتی (برای مثال، `amazon.titan-embed-text-v1:2:8k`) پیکربندی مدل پایه را به ارث می‌برند.

    **احراز هویت:** احراز هویت Bedrock از ترتیب استاندارد حل اعتبارنامه AWS SDK استفاده می‌کند:

    1. متغیرهای محیطی (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. کش توکن SSO
    3. اعتبارنامه‌های توکن هویت وب
    4. فایل‌های اعتبارنامه و پیکربندی مشترک
    5. اعتبارنامه‌های فراداده ECS یا EC2

    منطقه از `AWS_REGION`، `AWS_DEFAULT_REGION`، مقدار `baseUrl` ارائه‌دهنده `amazon-bedrock` حل می‌شود، یا به‌طور پیش‌فرض `us-east-1` در نظر گرفته می‌شود.

    **مجوزهای IAM:** نقش یا کاربر IAM به این موارد نیاز دارد:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    برای حداقل‌سازی سطح دسترسی، دامنه `InvokeModel` را به مدل مشخص محدود کنید:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | کلید                   | نوع               | پیش‌فرض                | توضیح                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | دانلود خودکار        | مسیر فایل مدل GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | پیش‌فرض node-llama-cpp | پوشه کش برای مدل‌های دانلودشده                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | اندازه پنجره زمینه برای زمینه embedding. مقدار 4096 قطعه‌های رایج (128 تا 512 توکن) را پوشش می‌دهد و در عین حال VRAM غیرمرتبط با وزن‌ها را محدود می‌کند. روی میزبان‌های محدود، آن را به 1024 تا 2048 کاهش دهید. `"auto"` از بیشینه آموزش‌دیده مدل استفاده می‌کند؛ برای مدل‌های 8B+ توصیه نمی‌شود (Qwen3-Embedding-8B: 40 960 توکن → حدود 32 GB VRAM در برابر حدود 8.8 GB در 4096). |

    ابتدا ارائه‌دهنده رسمی llama.cpp را نصب کنید: `openclaw plugins install @openclaw/llama-cpp-provider`.
    مدل پیش‌فرض: `embeddinggemma-300m-qat-Q8_0.gguf` (حدود 0.6 GB، دانلود خودکار). checkoutهای منبع همچنان به تأیید ساخت بومی نیاز دارند: `pnpm approve-builds` سپس `pnpm rebuild node-llama-cpp`.

    از CLI مستقل برای تأیید همان مسیر ارائه‌دهنده‌ای استفاده کنید که Gateway استفاده می‌کند:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    برای embeddingهای محلی GGUF مقدار `provider: "local"` را صراحتاً تنظیم کنید. ارجاع‌های مدل `hf:` و HTTP(S) برای پیکربندی‌های محلی صریح پشتیبانی می‌شوند، اما ارائه‌دهنده پیش‌فرض را تغییر نمی‌دهند.

  </Accordion>
</AccordionGroup>

### مهلت زمانی embedding درون‌خطی

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  مهلت زمانی دسته‌های embedding درون‌خطی را هنگام نمایه‌سازی حافظه بازنویسی کنید.

در صورت تنظیم‌نبودن، از پیش‌فرض ارائه‌دهنده استفاده می‌شود: 600 ثانیه برای ارائه‌دهنده‌های محلی/خودمیزبان مانند `local`، `ollama`، و `lmstudio`، و 120 ثانیه برای ارائه‌دهنده‌های میزبانی‌شده. وقتی دسته‌های embedding وابسته به CPU محلی سالم اما کند هستند، این مقدار را افزایش دهید.
</ParamField>

---

## پیکربندی جست‌وجوی ترکیبی

همه موارد زیر `memorySearch.query.hybrid` قرار دارند:

| کلید                   | نوع      | پیش‌فرض | توضیح                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | فعال‌سازی جست‌وجوی ترکیبی BM25 + برداری |
| `vectorWeight`        | `number`  | `0.7`   | وزن امتیازهای برداری (0-1)     |
| `textWeight`          | `number`  | `0.3`   | وزن امتیازهای BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | ضریب اندازه مجموعه نامزدها     |

<Tabs>
  <Tab title="MMR (diversity)">
    | کلید           | نوع      | پیش‌فرض | توضیح                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | فعال‌سازی بازرتبه‌بندی MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = بیشینه تنوع، 1 = بیشینه ارتباط |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | کلید                          | نوع      | پیش‌فرض | توضیح               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | فعال‌سازی تقویت تازگی      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | امتیاز هر N روز نصف می‌شود |

    فایل‌های همیشه‌سبز (`MEMORY.md`، فایل‌های بدون تاریخ در `memory/`) هرگز دچار افت نمی‌شوند.

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

## مسیرهای حافظهٔ اضافی

| کلید         | نوع        | توضیح                                      |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | دایرکتوری‌ها یا فایل‌های اضافی برای نمایه‌سازی |

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

مسیرها می‌توانند مطلق یا نسبی به فضای کاری باشند. دایرکتوری‌ها به‌صورت بازگشتی برای فایل‌های `.md` پویش می‌شوند. نحوهٔ مدیریت پیوندهای نمادین به backend فعال بستگی دارد: موتور داخلی پیوندهای نمادین را نادیده می‌گیرد، در حالی که QMD از رفتار پویشگر زیربنایی QMD پیروی می‌کند.

برای جست‌وجوی رونوشت میان‌عاملی با دامنهٔ عامل، به‌جای `memory.qmd.paths` از `agents.list[].memorySearch.qmd.extraCollections` استفاده کنید. این مجموعه‌های اضافی همان شکل `{ path, name, pattern? }` را دنبال می‌کنند، اما به‌ازای هر عامل ادغام می‌شوند و وقتی مسیر به بیرون از فضای کاری فعلی اشاره می‌کند، می‌توانند نام‌های مشترک صریح را حفظ کنند. اگر همان مسیر حل‌شده هم در `memory.qmd.paths` و هم در `memorySearch.qmd.extraCollections` ظاهر شود، QMD اولین ورودی را نگه می‌دارد و مورد تکراری را نادیده می‌گیرد.

---

## حافظهٔ چندوجهی (Gemini)

تصاویر و صدا را در کنار Markdown با استفاده از Gemini Embedding 2 نمایه‌سازی کنید:

| کلید                      | نوع        | پیش‌فرض    | توضیح                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | فعال‌سازی نمایه‌سازی چندوجهی           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`، `["audio"]`، یا `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | بیشینهٔ اندازهٔ فایل برای نمایه‌سازی   |

<Note>
فقط برای فایل‌های داخل `extraPaths` اعمال می‌شود. ریشه‌های پیش‌فرض حافظه فقط Markdown باقی می‌مانند. به `gemini-embedding-2-preview` نیاز دارد. `fallback` باید `"none"` باشد.
</Note>

قالب‌های پشتیبانی‌شده: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (تصاویر)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صدا).

---

## کش تعبیه

| کلید               | نوع       | پیش‌فرض | توضیح                            |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | کش کردن تعبیه‌های قطعه‌ها در SQLite |
| `cache.maxEntries` | `number`  | `50000` | بیشینهٔ تعبیه‌های کش‌شده         |

از تعبیه‌سازی دوبارهٔ متن بدون تغییر هنگام نمایه‌سازی دوباره یا به‌روزرسانی رونوشت جلوگیری می‌کند.

---

## نمایه‌سازی دسته‌ای

| کلید                          | نوع       | پیش‌فرض | توضیح                         |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | تعبیه‌های درون‌خطی موازی       |
| `remote.batch.enabled`        | `boolean` | `false` | فعال‌سازی API تعبیهٔ دسته‌ای   |
| `remote.batch.concurrency`    | `number`  | `2`     | کارهای دسته‌ای موازی           |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار برای تکمیل دسته         |
| `remote.batch.pollIntervalMs` | `number`  | --      | فاصلهٔ نظرسنجی                 |
| `remote.batch.timeoutMinutes` | `number`  | --      | مهلت زمانی دسته                |

برای `openai`، `gemini` و `voyage` در دسترس است. دسته‌ای OpenAI معمولاً برای پرکردن‌های بزرگ سریع‌ترین و ارزان‌ترین گزینه است.

`remote.nonBatchConcurrency` فراخوانی‌های تعبیهٔ درون‌خطی را کنترل می‌کند که توسط ارائه‌دهندگان محلی/خودمیزبان و ارائه‌دهندگان میزبانی‌شده، وقتی APIهای دسته‌ای ارائه‌دهنده فعال نیستند، استفاده می‌شوند. مقدار پیش‌فرض Ollama برای نمایه‌سازی غیردسته‌ای `1` است تا از فشار بیش از حد به میزبان‌های محلی کوچک‌تر جلوگیری شود؛ روی ماشین‌های بزرگ‌تر مقدار بالاتری تنظیم کنید.

این گزینه جدا از `sync.embeddingBatchTimeoutSeconds` است که مهلت زمانی فراخوانی‌های تعبیهٔ درون‌خطی را کنترل می‌کند.

---

## جست‌وجوی حافظهٔ نشست (آزمایشی)

رونوشت‌های نشست را نمایه‌سازی کنید و آن‌ها را از طریق `memory_search` نمایش دهید:

| کلید                          | نوع        | پیش‌فرض     | توضیح                              |
| ----------------------------- | ---------- | ----------- | ---------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | فعال‌سازی نمایه‌سازی نشست          |
| `sources`                     | `string[]` | `["memory"]` | افزودن `"sessions"` برای شامل کردن رونوشت‌ها |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | آستانهٔ بایت برای نمایه‌سازی دوباره |
| `sync.sessions.deltaMessages` | `number`   | `50`        | آستانهٔ پیام برای نمایه‌سازی دوباره |

<Warning>
نمایه‌سازی نشست اختیاری است و به‌صورت ناهمگام اجرا می‌شود. نتایج می‌توانند کمی قدیمی باشند. گزارش‌های نشست روی دیسک قرار دارند، بنابراین دسترسی به فایل‌سیستم را مرز اعتماد در نظر بگیرید.
</Warning>

برخوردهای رونوشت نشست نیز از
[`tools.sessions.visibility`](/fa/gateway/config-tools#toolssessions) پیروی می‌کنند. قابلیت دید پیش‌فرض
`tree` فقط نشست فعلی و نشست‌هایی را که از آن ایجاد شده‌اند آشکار می‌کند. برای
یادآوری یک نشست نامرتبطِ همان عامل که از طریق Gateway اعزام شده و از نشستی دیگر،
مانند یک DM، آمده است، قابلیت دید را عمداً به `agent` گسترش دهید (یا فقط زمانی
که یادآوری بین‌عاملی نیز لازم است و سیاست عامل‌به‌عامل اجازه می‌دهد، به `all`).

نمونه‌های زیر این تنظیمات را زیر `agents.defaults` قرار می‌دهند. همچنین می‌توانید
تنظیمات معادل `memorySearch` را در یک بازنویسی ویژهٔ هر عامل اعمال کنید، زمانی که فقط یک
عامل باید رونوشت‌های نشست را نمایه‌سازی و جست‌وجو کند.

برای یادآوری Gateway به DM در همان عامل:

<Tabs>
  <Tab title="Builtin backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

هنگام استفاده از QMD، `agents.defaults.memorySearch.experimental.sessionMemory` و
`sources: ["sessions"]` به‌تنهایی رونوشت‌ها را به QMD صادر نمی‌کنند. همچنین
`memory.qmd.sessions.enabled: true` را تنظیم کنید.

---

## شتاب‌دهی برداری SQLite (sqlite-vec)

| کلید                         | نوع       | پیش‌فرض | توضیح                                 |
| ---------------------------- | --------- | ------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استفاده از sqlite-vec برای پرس‌وجوهای برداری |
| `store.vector.extensionPath` | `string`  | همراه   | بازنویسی مسیر sqlite-vec              |

وقتی sqlite-vec در دسترس نباشد، OpenClaw به‌طور خودکار به شباهت کسینوسی درون‌فرایندی بازمی‌گردد.

---

## ذخیره‌سازی نمایه

نمایه‌های حافظهٔ داخلی در پایگاه دادهٔ SQLite هر عامل در OpenClaw در مسیر
`agents/<agentId>/agent/openclaw-agent.sqlite` قرار دارند.

| کلید                  | نوع      | پیش‌فرض    | توضیح                                  |
| --------------------- | -------- | ----------- | -------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | توکنایزر FTS5 (`unicode61` یا `trigram`) |

---

## پیکربندی backend در QMD

برای فعال‌سازی، `memory.backend = "qmd"` را تنظیم کنید. همهٔ تنظیمات QMD زیر `memory.qmd` قرار دارند:

| کلید                     | نوع       | پیش‌فرض | توضیح                                                                 |
| ------------------------ | --------- | -------- | --------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسیر فایل اجرایی QMD؛ وقتی `PATH` سرویس با پوستهٔ شما متفاوت است، یک مسیر مطلق تنظیم کنید |
| `searchMode`             | `string`  | `search` | فرمان جست‌وجو: `search`، `vsearch`، `query`                           |
| `rerank`                 | `boolean` | --       | با `searchMode: "query"` و QMD 2.1+ روی `false` تنظیم کنید تا بازرتبه‌بندی QMD رد شود |
| `includeDefaultMemory`   | `boolean` | `true`   | نمایه‌سازی خودکار `MEMORY.md` + `memory/**/*.md`                      |
| `paths[]`                | `array`   | --       | مسیرهای اضافی: `{ name, path, pattern? }`                             |
| `sessions.enabled`       | `boolean` | `false`  | صدور رونوشت‌های نشست به QMD                                           |
| `sessions.retentionDays` | `number`  | --       | نگهداری رونوشت                                                        |
| `sessions.exportDir`     | `string`  | --       | پوشهٔ صدور                                                             |

`searchMode: "search"` فقط واژگانی/BM25 است. OpenClaw برای این حالت، از جمله هنگام `memory status --deep`، کاوشگرهای آمادگی برداری معنایی یا نگهداری embedding در QMD را اجرا نمی‌کند؛ `vsearch` و `query` همچنان به آمادگی برداری QMD و embeddingها نیاز دارند.

`rerank: false` فقط حالت `query` در QMD را تغییر می‌دهد و به QMD 2.1 یا جدیدتر نیاز دارد. در حالت CLI مستقیم، OpenClaw گزینهٔ `--no-rerank` را ارسال می‌کند؛ در حالت MCP مبتنی بر mcporter، مقدار `rerank: false` را به ابزار پرس‌وجوی یکپارچهٔ QMD ارسال می‌کند. برای استفاده از رفتار پیش‌فرض QMD در بازرتبه‌بندی پرس‌وجو، آن را تنظیم‌نشده رها کنید.

OpenClaw شکل‌های فعلی مجموعه و پرس‌وجوی MCP در QMD را ترجیح می‌دهد، اما با آزمودن پرچم‌های سازگارِ الگوی مجموعه و نام‌های قدیمی‌تر ابزار MCP در صورت نیاز، نسخه‌های قدیمی‌تر QMD را همچنان قابل استفاده نگه می‌دارد. وقتی QMD پشتیبانی از چند فیلتر مجموعه را اعلام کند، مجموعه‌های هم‌منبع با یک فرایند QMD جست‌وجو می‌شوند؛ ساخت‌های قدیمی‌تر QMD مسیر سازگاری به‌ازای هر مجموعه را نگه می‌دارند. هم‌منبع یعنی مجموعه‌های حافظهٔ پایدار با هم گروه‌بندی می‌شوند، در حالی که مجموعه‌های رونوشت نشست یک گروه جدا می‌مانند تا تنوع‌بخشی منبع همچنان هر دو ورودی را داشته باشد.

<Note>
بازنویسی‌های مدل QMD در سمت QMD می‌مانند، نه در پیکربندی OpenClaw. اگر لازم است مدل‌های QMD را به‌صورت سراسری بازنویسی کنید، متغیرهای محیطی مانند `QMD_EMBED_MODEL`، `QMD_RERANK_MODEL` و `QMD_GENERATE_MODEL` را در محیط اجرای Gateway تنظیم کنید.
</Note>

<AccordionGroup>
  <Accordion title="زمان‌بندی به‌روزرسانی">
    | کلید                       | نوع      | پیش‌فرض | توضیح                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | بازه بازخوانی                      |
    | `update.debounceMs`       | `number`  | `15000` | تغییرات فایل را debounce می‌کند                 |
    | `update.onBoot`           | `boolean` | `true`  | هنگام باز شدن مدیر QMD بلندمدت بازخوانی می‌کند؛ برای رد کردن به‌روزرسانی فوری هنگام راه‌اندازی، روی false بگذارید |
    | `update.startup`          | `string`  | `off`   | مقداردهی اولیه اختیاری QMD هنگام شروع Gateway: `off`، `idle`، یا `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تاخیر پیش از اجرای بازخوانی `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | باز شدن مدیر را تا کامل شدن بازخوانی اولیه آن مسدود می‌کند |
    | `update.embedInterval`    | `string`  | --      | آهنگ جداگانه embed                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلت زمانی برای دستورهای QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلت زمانی برای عملیات به‌روزرسانی QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلت زمانی برای عملیات embed در QMD      |
  </Accordion>
  <Accordion title="محدودیت‌ها">
    | کلید                       | نوع     | پیش‌فرض | توضیح                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | حداکثر نتایج جست‌وجو         |
    | `limits.maxSnippetChars`  | `number` | --      | طول snippet را محدود می‌کند       |
    | `limits.maxInjectedChars` | `number` | --      | کل نویسه‌های تزریق‌شده را محدود می‌کند |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلت زمانی جست‌وجو             |
  </Accordion>
  <Accordion title="دامنه">
    کنترل می‌کند کدام نشست‌ها می‌توانند نتایج جست‌وجوی QMD را دریافت کنند. همان schema مانند [`session.sendPolicy`](/fa/gateway/config-agents#session) است:

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

    پیش‌فرض ارسال‌شده، نشست‌های مستقیم و کانال را مجاز می‌کند، در حالی که همچنان گروه‌ها را رد می‌کند.

    پیش‌فرض فقط DM است. `match.keyPrefix` با کلید نشست نرمال‌سازی‌شده مطابقت می‌دهد؛ `match.rawKeyPrefix` با کلید خام شامل `agent:<id>:` مطابقت می‌دهد.

  </Accordion>
  <Accordion title="ارجاع‌ها">
    `memory.citations` روی همه backendها اعمال می‌شود:

    | مقدار            | رفتار                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (پیش‌فرض) | پاصفحه `Source: <path#line>` را در snippetها درج می‌کند    |
    | `on`             | همیشه پاصفحه را درج می‌کند                               |
    | `off`            | پاصفحه را حذف می‌کند (مسیر همچنان به‌صورت داخلی به عامل داده می‌شود) |

  </Accordion>
</AccordionGroup>

وقتی مقداردهی اولیه QMD هنگام شروع Gateway فعال باشد، OpenClaw فقط برای عامل‌های واجد شرایط QMD را شروع می‌کند. اگر `update.onBoot` برابر true باشد و نگه‌داری interval/embed پیکربندی نشده باشد، startup از یک مدیر یک‌باره برای بازخوانی هنگام راه‌اندازی استفاده می‌کند و سپس آن را می‌بندد. اگر یک بازه به‌روزرسانی یا embed پیکربندی شده باشد، startup مدیر QMD بلندمدت را باز می‌کند تا مالک watcher و تایمرهای interval باشد؛ `update.onBoot: false` فقط بازخوانی فوری هنگام راه‌اندازی را رد می‌کند.

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

Dreaming به‌صورت یک sweep زمان‌بندی‌شده اجرا می‌شود و از فازهای داخلی سبک/عمیق/REM به‌عنوان جزئیات پیاده‌سازی استفاده می‌کند.

برای رفتار مفهومی و دستورهای اسلش، [Dreaming](/fa/concepts/dreaming) را ببینید.

### تنظیمات کاربر

| کلید                                    | نوع      | پیش‌فرض       | توضیح                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming را به‌طور کامل فعال یا غیرفعال می‌کند                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | ریتم اختیاری Cron برای sweep کامل Dreaming                                                                                |
| `model`                                | `string`  | مدل پیش‌فرض | بازنویسی اختیاری مدل زیرعامل دفترچه رویا                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | حداکثر tokenهای تخمینی نگه‌داشته‌شده از هر snippet فراخوانی کوتاه‌مدت که به `MEMORY.md` ارتقا یافته است؛ metadata منشأ همچنان قابل مشاهده می‌ماند |

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
- `dreaming.model` از gate اعتماد زیرعامل Plugin موجود استفاده می‌کند؛ پیش از فعال کردن آن، `plugins.entries.memory-core.subagent.allowModelOverride: true` را تنظیم کنید.
- وقتی مدل پیکربندی‌شده در دسترس نباشد، دفترچه رویا یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌کند. خطاهای اعتماد یا allowlist ثبت می‌شوند و بی‌صدا دوباره تلاش نمی‌شوند.
- سیاست و آستانه‌های فاز سبک/عمیق/REM رفتار داخلی هستند، نه پیکربندی روبه‌روی کاربر.

</Note>

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [مرور کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
