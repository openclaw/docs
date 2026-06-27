---
read_when:
    - می‌خواهید ارائه‌دهندگان جست‌وجوی حافظه یا مدل‌های تعبیه‌سازی را پیکربندی کنید
    - می‌خواهید بک‌اند QMD را راه‌اندازی کنید
    - می‌خواهید جست‌وجوی ترکیبی، MMR، یا زوال زمانی را تنظیم کنید
    - می‌خواهید نمایه‌سازی حافظهٔ چندوجهی را فعال کنید
sidebarTitle: Memory config
summary: همهٔ گزینه‌های پیکربندی برای جست‌وجوی حافظه، ارائه‌دهندگان embedding، QMD، جست‌وجوی ترکیبی، و نمایه‌سازی چندوجهی
title: مرجع پیکربندی حافظه
x-i18n:
    generated_at: "2026-06-27T18:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

این صفحه همهٔ گزینه‌های پیکربندی جست‌وجوی حافظهٔ OpenClaw را فهرست می‌کند. برای مرورهای مفهومی، ببینید:

<CardGroup cols={2}>
  <Card title="نمای کلی حافظه" href="/fa/concepts/memory">
    حافظه چگونه کار می‌کند.
  </Card>
  <Card title="موتور توکار" href="/fa/concepts/memory-builtin">
    پشتانهٔ پیش‌فرض SQLite.
  </Card>
  <Card title="موتور QMD" href="/fa/concepts/memory-qmd">
    سایدکار محلی‌اول.
  </Card>
  <Card title="جست‌وجوی حافظه" href="/fa/concepts/memory-search">
    خط لولهٔ جست‌وجو و تنظیم.
  </Card>
  <Card title="Active Memory" href="/fa/concepts/active-memory">
    زیرعامل حافظه برای نشست‌های تعاملی.
  </Card>
</CardGroup>

همهٔ تنظیمات جست‌وجوی حافظه زیر `agents.defaults.memorySearch` در `openclaw.json` قرار دارند، مگر اینکه خلافش ذکر شده باشد.

<Note>
اگر به‌دنبال کلید فعال‌سازی ویژگی **Active Memory** و پیکربندی زیرعامل هستید، آن به‌جای `memorySearch` زیر `plugins.entries.active-memory` قرار دارد.

Active Memory از یک مدل دو-دروازه‌ای استفاده می‌کند:

1. Plugin باید فعال باشد و شناسهٔ عامل فعلی را هدف بگیرد
2. درخواست باید یک نشست گفت‌وگوی تعاملی پایدار واجد شرایط باشد

برای مدل فعال‌سازی، پیکربندی تحت مالکیت Plugin، پایداری رونوشت، و الگوی عرضهٔ امن، [Active Memory](/fa/concepts/active-memory) را ببینید.
</Note>

---

## انتخاب ارائه‌دهنده

| کلید       | نوع       | پیش‌فرض         | توضیح                                                                                                                                                                                                                                                                                       |
| ---------- | --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`      | شناسهٔ آداپتر embedding مانند `bedrock`، `deepinfra`، `gemini`، `github-copilot`، `local`، `mistral`، `ollama`، `openai`، `openai-compatible`، یا `voyage`؛ همچنین می‌تواند یک `models.providers.<id>` پیکربندی‌شده باشد که `api` آن به یک آداپتر embedding حافظه یا API مدل سازگار با OpenAI اشاره می‌کند |
| `model`    | `string`  | پیش‌فرض ارائه‌دهنده | نام مدل embedding                                                                                                                                                                                                                                                                           |
| `fallback` | `string`  | `"none"`        | شناسهٔ آداپتر جایگزین هنگام شکست مورد اصلی                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`          | فعال یا غیرفعال کردن جست‌وجوی حافظه                                                                                                                                                                                                                                                         |

وقتی `provider` تنظیم نشده باشد، OpenClaw از embeddingهای OpenAI استفاده می‌کند. برای استفاده از Gemini، Voyage، Mistral، DeepInfra، Bedrock، GitHub Copilot،
Ollama، یک مدل GGUF محلی، یا یک نقطهٔ پایانی `/v1/embeddings` سازگار با OpenAI،
`provider` را صراحتاً تنظیم کنید. پیکربندی‌های قدیمی که هنوز `provider: "auto"` دارند، به `openai` حل می‌شوند.

<Warning>
تغییر ارائه‌دهندهٔ embedding، مدل، تنظیمات ارائه‌دهنده، منابع، دامنه،
قطعه‌بندی، یا tokenizer می‌تواند شاخص برداری SQLite موجود را ناسازگار کند.
OpenClaw به‌جای embedding دوبارهٔ خودکار همه‌چیز، جست‌وجوی برداری را متوقف می‌کند و هشدار هویت شاخص گزارش می‌دهد. هر وقت آماده بودید، با
`openclaw memory status --index --agent <id>` یا
`openclaw memory index --force --agent <id>` دوباره بسازید.
</Warning>

وقتی `provider` تنظیم نشده باشد، `provider: "auto"` قدیمی وجود داشته باشد، یا
`provider: "none"` عمداً حالت فقط FTS را انتخاب کند، فراخوانی حافظه همچنان می‌تواند
وقتی embeddingها در دسترس نیستند از رتبه‌بندی واژگانی FTS استفاده کند.

ارائه‌دهنده‌های غیرمحلی صریح در صورت شکست بسته می‌شوند. اگر `memorySearch.provider` را روی
یک ارائه‌دهندهٔ مشخص با پشتانهٔ راه‌دور مانند OpenAI، Gemini، Voyage، Mistral،
Bedrock، GitHub Copilot، DeepInfra، Ollama، LM Studio، یا یک ارائه‌دهندهٔ سفارشی سازگار با OpenAI
تنظیم کنید و آن ارائه‌دهنده هنگام اجرا در دسترس نباشد، `memory_search`
به‌جای استفادهٔ بی‌صدا از فراخوانی فقط FTS، نتیجهٔ unavailable برمی‌گرداند. پیکربندی
ارائه‌دهنده/احراز هویت را اصلاح کنید، به یک ارائه‌دهندهٔ قابل‌دسترسی تغییر دهید، یا اگر فراخوانی فقط FTS عمدی می‌خواهید
`provider: "none"` را تنظیم کنید.

### شناسه‌های ارائه‌دهندهٔ سفارشی

`memorySearch.provider` می‌تواند برای آداپترهای ارائه‌دهندهٔ ویژهٔ حافظه مانند `ollama`، یا برای APIهای مدل سازگار با OpenAI مانند `openai-responses` / `openai-completions`، به یک ورودی سفارشی `models.providers.<id>` اشاره کند. OpenClaw مالک `api` آن ارائه‌دهنده را برای آداپتر embedding حل می‌کند و هم‌زمان شناسهٔ ارائه‌دهندهٔ سفارشی را برای مدیریت نقطهٔ پایانی، احراز هویت، و پیشوند مدل حفظ می‌کند. این امکان می‌دهد راه‌اندازی‌های چند-GPU یا چند-میزبان، embeddingهای حافظه را به یک نقطهٔ پایانی محلی مشخص اختصاص دهند:

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

embeddingهای راه‌دور به یک کلید API نیاز دارند. Bedrock در عوض از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند (نقش‌های نمونه، SSO، کلیدهای دسترسی).

| ارائه‌دهنده    | متغیر محیطی                                      | کلید پیکربندی                     |
| --------------- | ------------------------------------------------ | --------------------------------- |
| Bedrock         | زنجیرهٔ اعتبارنامهٔ AWS                          | نیازی به کلید API نیست            |
| DeepInfra       | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini          | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`  |
| GitHub Copilot  | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | پروفایل احراز هویت از طریق ورود دستگاه |
| Mistral         | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey` |
| Ollama          | `OLLAMA_API_KEY` (جای‌نگهدار)                    | --                                |
| OpenAI          | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`  |
| Voyage          | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`  |

<Note>
OAuth متعلق به Codex فقط chat/completions را پوشش می‌دهد و درخواست‌های embedding را برآورده نمی‌کند.
</Note>

---

## پیکربندی نقطهٔ پایانی راه‌دور

برای یک سرور عمومی `/v1/embeddings` سازگار با OpenAI که نباید اعتبارنامه‌های گفت‌وگوی سراسری OpenAI را به ارث ببرد، از `provider: "openai-compatible"` استفاده کنید.

<ParamField path="remote.baseUrl" type="string">
  نشانی پایهٔ سفارشی API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  بازنویسی کلید API.
</ParamField>
<ParamField path="remote.headers" type="object">
  سرآیندهای HTTP اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند).
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
    | کلید                   | نوع      | پیش‌فرض               | توضیح                                      |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | از `gemini-embedding-2-preview` نیز پشتیبانی می‌کند |
    | `outputDimensionality` | `number` | `3072`                | برای Embedding 2: 768، 1536، یا 3072       |

    <Warning>
    تغییر مدل یا `outputDimensionality` هویت شاخص را تغییر می‌دهد. OpenClaw
    جست‌وجوی برداری را متوقف می‌کند تا زمانی که صراحتاً شاخص حافظه را دوباره بسازید.
    </Warning>

  </Accordion>
  <Accordion title="انواع ورودی سازگار با OpenAI">
    نقاط پایانی embedding سازگار با OpenAI می‌توانند فیلدهای درخواست `input_type` ویژهٔ ارائه‌دهنده را فعال کنند. این برای مدل‌های embedding نامتقارن که به برچسب‌های متفاوتی برای embeddingهای پرس‌وجو و سند نیاز دارند مفید است.

    | کلید                | نوع      | پیش‌فرض       | توضیح                                             |
    | ------------------- | -------- | ------------- | ------------------------------------------------- |
    | `inputType`         | `string` | تنظیم‌نشده    | `input_type` مشترک برای embeddingهای پرس‌وجو و سند |
    | `queryInputType`    | `string` | تنظیم‌نشده    | `input_type` هنگام پرس‌وجو؛ `inputType` را بازنویسی می‌کند |
    | `documentInputType` | `string` | تنظیم‌نشده    | `input_type` شاخص/سند؛ `inputType` را بازنویسی می‌کند |

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

    تغییر این مقادیر بر هویت کش embedding برای شاخص‌گذاری دسته‌ای ارائه‌دهنده اثر می‌گذارد و وقتی مدل بالادستی با برچسب‌ها رفتار متفاوتی دارد، باید پس از آن شاخص‌گذاری دوبارهٔ حافظه انجام شود.

  </Accordion>
  <Accordion title="Bedrock">
    ### پیکربندی embedding در Bedrock

    Bedrock از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند؛ نیازی به کلیدهای API نیست. اگر OpenClaw روی EC2 با یک نقش نمونهٔ فعال برای Bedrock اجرا می‌شود، فقط ارائه‌دهنده و مدل را تنظیم کنید:

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

    | کلید                   | نوع      | پیش‌فرض                       | توضیح                           |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | هر شناسهٔ مدل embedding در Bedrock |
    | `outputDimensionality` | `number` | پیش‌فرض مدل                   | برای Titan V2: 256، 512، یا 1024 |

    **مدل‌های پشتیبانی‌شده** (با تشخیص خانواده و پیش‌فرض‌های بُعد):

    | شناسه مدل                                  | ارائه‌دهنده | ابعاد پیش‌فرض | ابعاد قابل پیکربندی |
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

    گونه‌های دارای پسوند throughput (برای مثال، `amazon.titan-embed-text-v1:2:8k`) پیکربندی مدل پایه را به ارث می‌برند.

    **احراز هویت:** احراز هویت Bedrock از ترتیب استاندارد حل اعتبارنامه در AWS SDK استفاده می‌کند:

    1. متغیرهای محیطی (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. کش توکن SSO
    3. اعتبارنامه‌های توکن هویت وب
    4. فایل‌های اعتبارنامه و پیکربندی مشترک
    5. اعتبارنامه‌های متادیتای ECS یا EC2

    Region از `AWS_REGION`،‏ `AWS_DEFAULT_REGION`،‏ `baseUrl` ارائه‌دهنده `amazon-bedrock` حل می‌شود، یا به‌صورت پیش‌فرض `us-east-1` است.

    **مجوزهای IAM:** نقش یا کاربر IAM به این موارد نیاز دارد:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    برای حداقل‌سازی دسترسی، دامنه `InvokeModel` را به مدل مشخص محدود کنید:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | کلید                  | نوع                | پیش‌فرض               | توضیح                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | دانلود خودکار          | مسیر فایل مدل GGUF                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | پیش‌فرض node-llama-cpp | دایرکتوری کش برای مدل‌های دانلودشده                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | اندازه پنجره زمینه برای زمینه embedding. مقدار 4096 تکه‌های معمول (128 تا 512 توکن) را پوشش می‌دهد و هم‌زمان VRAM غیرمربوط به وزن‌ها را محدود نگه می‌دارد. روی میزبان‌های محدود، آن را به 1024 تا 2048 کاهش دهید. `"auto"` از بیشینه آموزش‌دیده مدل استفاده می‌کند — برای مدل‌های 8B+ توصیه نمی‌شود (Qwen3-Embedding-8B: 40 960 توکن → حدود 32 گیگابایت VRAM در برابر حدود 8.8 گیگابایت در 4096). |

    ابتدا ارائه‌دهنده رسمی llama.cpp را نصب کنید: `openclaw plugins install @openclaw/llama-cpp-provider`.
    مدل پیش‌فرض: `embeddinggemma-300m-qat-Q8_0.gguf` (حدود 0.6 گیگابایت، دانلود خودکار). checkoutهای منبع همچنان به تأیید ساخت بومی نیاز دارند: ابتدا `pnpm approve-builds` و سپس `pnpm rebuild node-llama-cpp`.

    برای راستی‌آزمایی همان مسیر ارائه‌دهنده‌ای که Gateway استفاده می‌کند، از CLI مستقل استفاده کنید:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    برای embeddingهای محلی GGUF، مقدار `provider: "local"` را صریحاً تنظیم کنید. ارجاع‌های مدل `hf:` و HTTP(S) برای پیکربندی‌های محلی صریح پشتیبانی می‌شوند، اما ارائه‌دهنده پیش‌فرض را تغییر نمی‌دهند.

  </Accordion>
</AccordionGroup>

### مهلت زمانی embedding درون‌خطی

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  مهلت زمانی batchهای embedding درون‌خطی هنگام نمایه‌سازی حافظه را بازنویسی کنید.

در حالت تنظیم‌نشده، از پیش‌فرض ارائه‌دهنده استفاده می‌شود: 600 ثانیه برای ارائه‌دهندگان محلی/خودمیزبان مانند `local`،‏ `ollama` و `lmstudio`، و 120 ثانیه برای ارائه‌دهندگان میزبانی‌شده. وقتی batchهای embedding محلی وابسته به CPU سالم اما کند هستند، این مقدار را افزایش دهید.
</ParamField>

---

## پیکربندی جست‌وجوی هیبرید

همه زیر `memorySearch.query.hybrid` قرار دارند:

| کلید                  | نوع       | پیش‌فرض | توضیح                                  |
| --------------------- | --------- | ------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`  | فعال‌سازی جست‌وجوی هیبرید BM25 + برداری |
| `vectorWeight`        | `number`  | `0.7`   | وزن امتیازهای برداری (0-1)             |
| `textWeight`          | `number`  | `0.3`   | وزن امتیازهای BM25 (0-1)               |
| `candidateMultiplier` | `number`  | `4`     | ضریب اندازه مجموعه نامزدها             |

<Tabs>
  <Tab title="MMR (diversity)">
    | کلید          | نوع       | پیش‌فرض | توضیح                                      |
    | ------------- | --------- | ------- | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | فعال‌سازی رتبه‌بندی مجدد MMR               |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = بیشینه تنوع، 1 = بیشینه ارتباط         |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | کلید                         | نوع       | پیش‌فرض | توضیح                         |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | فعال‌سازی تقویت تازگی         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | امتیاز هر N روز نصف می‌شود    |

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

## مسیرهای حافظهٔ اضافی

| کلید          | نوع       | توضیح                              |
| ------------ | ---------- | ---------------------------------------- |
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

مسیرها می‌توانند مطلق یا نسبی به workspace باشند. دایرکتوری‌ها به‌صورت بازگشتی برای فایل‌های `.md` اسکن می‌شوند. نحوهٔ مدیریت symlink به backend فعال بستگی دارد: موتور داخلی symlinkها را نادیده می‌گیرد، درحالی‌که QMD از رفتار scanner زیربنایی QMD پیروی می‌کند.

برای جست‌وجوی transcript میان‌عامل در محدودهٔ agent، به‌جای `memory.qmd.paths` از `agents.list[].memorySearch.qmd.extraCollections` استفاده کنید. آن مجموعه‌های اضافی همان شکل `{ path, name, pattern? }` را دنبال می‌کنند، اما برای هر agent ادغام می‌شوند و وقتی مسیر به بیرون از workspace فعلی اشاره دارد، می‌توانند نام‌های اشتراکی صریح را حفظ کنند. اگر همان مسیر resolveشده هم در `memory.qmd.paths` و هم در `memorySearch.qmd.extraCollections` ظاهر شود، QMD نخستین ورودی را نگه می‌دارد و مورد تکراری را رد می‌کند.

---

## حافظهٔ چندوجهی (Gemini)

تصاویر و صدا را در کنار Markdown با استفاده از Gemini Embedding 2 نمایه‌سازی کنید:

| کلید                       | نوع       | پیش‌فرض    | توضیح                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | فعال‌سازی نمایه‌سازی چندوجهی             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`، `["audio"]`، یا `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | حداکثر اندازهٔ فایل برای نمایه‌سازی             |

<Note>
فقط برای فایل‌های موجود در `extraPaths` اعمال می‌شود. ریشه‌های پیش‌فرض حافظه فقط Markdown باقی می‌مانند. به `gemini-embedding-2-preview` نیاز دارد. `fallback` باید `"none"` باشد.
</Note>

قالب‌های پشتیبانی‌شده: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (تصاویر)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صدا).

---

## کش embedding

| کلید                | نوع      | پیش‌فرض | توضیح                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | کش کردن embeddingهای chunk در SQLite |
| `cache.maxEntries` | `number`  | `50000` | حداکثر embeddingهای کش‌شده            |

از embedding دوبارهٔ متنِ بدون تغییر هنگام نمایه‌سازی دوباره یا به‌روزرسانی transcript جلوگیری می‌کند.

---

## نمایه‌سازی دسته‌ای

| کلید                           | نوع      | پیش‌فرض | توضیح                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | embeddingهای inline موازی |
| `remote.batch.enabled`        | `boolean` | `false` | فعال‌سازی API embedding دسته‌ای |
| `remote.batch.concurrency`    | `number`  | `2`     | jobهای دسته‌ای موازی        |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار برای تکمیل دسته  |
| `remote.batch.pollIntervalMs` | `number`  | --      | بازهٔ polling              |
| `remote.batch.timeoutMinutes` | `number`  | --      | timeout دسته              |

برای `openai`، `gemini` و `voyage` در دسترس است. دسته‌ایِ OpenAI معمولاً برای backfillهای بزرگ سریع‌تر و ارزان‌تر است.

`remote.nonBatchConcurrency` فراخوانی‌های embedding inline را کنترل می‌کند که توسط ارائه‌دهندگان محلی/self-hosted و ارائه‌دهندگان hosted هنگام فعال نبودن APIهای batch ارائه‌دهنده استفاده می‌شوند. مقدار پیش‌فرض Ollama برای نمایه‌سازی غیردسته‌ای `1` است تا از تحت فشار قرار گرفتن hostهای محلی کوچک‌تر جلوگیری شود؛ روی ماشین‌های بزرگ‌تر مقدار بالاتری تنظیم کنید.

این از `sync.embeddingBatchTimeoutSeconds` جداست، که timeout فراخوانی‌های embedding inline را کنترل می‌کند.

---

## جست‌وجوی حافظهٔ session (آزمایشی)

transcriptهای session را نمایه‌سازی کنید و آن‌ها را از طریق `memory_search` نمایش دهید:

| کلید                           | نوع       | پیش‌فرض      | توضیح                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | فعال‌سازی نمایه‌سازی session                 |
| `sources`                     | `string[]` | `["memory"]` | افزودن `"sessions"` برای شامل کردن transcriptها |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | آستانهٔ بایت برای نمایه‌سازی دوباره              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | آستانهٔ پیام برای نمایه‌سازی دوباره           |

<Warning>
نمایه‌سازی session اختیاری است و به‌صورت ناهمگام اجرا می‌شود. نتایج ممکن است کمی stale باشند. لاگ‌های session روی دیسک قرار دارند، بنابراین دسترسی به filesystem را به‌عنوان مرز اعتماد در نظر بگیرید.
</Warning>

---

## شتاب‌دهی برداری SQLite (sqlite-vec)

| کلید                         | نوع       | پیش‌فرض   | توضیح                                   |
| ---------------------------- | --------- | --------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | استفاده از sqlite-vec برای کوئری‌های برداری |
| `store.vector.extensionPath` | `string`  | باندل‌شده | بازنویسی مسیر sqlite-vec                |

وقتی sqlite-vec در دسترس نباشد، OpenClaw به‌صورت خودکار به شباهت کسینوسی درون‌پردازشی برمی‌گردد.

---

## ذخیره‌سازی نمایه

نمایه‌های حافظه داخلی در پایگاه داده OpenClaw SQLite هر عامل در این مسیر قرار دارند:
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| کلید                  | نوع      | پیش‌فرض    | توضیح                                      |
| --------------------- | -------- | ---------- | ------------------------------------------ |
| `store.fts.tokenizer` | `string` | `unicode61` | توکنایزر FTS5 (`unicode61` یا `trigram`) |

---

## پیکربندی بک‌اند QMD

برای فعال‌سازی، `memory.backend = "qmd"` را تنظیم کنید. همه تنظیمات QMD زیر `memory.qmd` قرار دارند:

| کلید                     | نوع       | پیش‌فرض | توضیح                                                                                 |
| ------------------------ | --------- | ------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`   | مسیر فایل اجرایی QMD؛ وقتی `PATH` سرویس با پوسته شما فرق دارد، یک مسیر مطلق تنظیم کنید |
| `searchMode`             | `string`  | `search` | فرمان جست‌وجو: `search`، `vsearch`، `query`                                           |
| `rerank`                 | `boolean` | --      | با `searchMode: "query"` و QMD 2.1+ روی `false` تنظیم کنید تا بازرتبه‌بندی QMD رد شود |
| `includeDefaultMemory`   | `boolean` | `true`  | نمایه‌سازی خودکار `MEMORY.md` + `memory/**/*.md`                                      |
| `paths[]`                | `array`   | --      | مسیرهای اضافی: `{ name, path, pattern? }`                                             |
| `sessions.enabled`       | `boolean` | `false` | نمایه‌سازی رونوشت‌های نشست                                                            |
| `sessions.retentionDays` | `number`  | --      | نگهداری رونوشت                                                                        |
| `sessions.exportDir`     | `string`  | --      | دایرکتوری خروجی                                                                       |

`searchMode: "search"` فقط واژگانی/BM25 است. OpenClaw برای این حالت، از جمله هنگام `memory status --deep`، پروب‌های آمادگی برداری معنایی یا نگهداری embedding در QMD را اجرا نمی‌کند؛ `vsearch` و `query` همچنان به آمادگی برداری و embeddingهای QMD نیاز دارند.

`rerank: false` فقط حالت `query` در QMD را تغییر می‌دهد و به QMD 2.1 یا جدیدتر نیاز دارد. در حالت CLI مستقیم، OpenClaw گزینه `--no-rerank` را پاس می‌دهد؛ در حالت MCP مبتنی بر mcporter، مقدار `rerank: false` را به ابزار کوئری یکپارچه QMD پاس می‌دهد. برای استفاده از رفتار پیش‌فرض بازرتبه‌بندی کوئری در QMD، آن را تنظیم‌نشده بگذارید.

OpenClaw شکل‌های فعلی collection و کوئری MCP در QMD را ترجیح می‌دهد، اما با امتحان کردن فلگ‌های الگوی collection سازگار و نام‌های قدیمی‌تر ابزار MCP در صورت نیاز، نسخه‌های قدیمی‌تر QMD را هم فعال نگه می‌دارد. وقتی QMD پشتیبانی از چند فیلتر collection را اعلام کند، collectionهای هم‌منبع با یک پردازش QMD جست‌وجو می‌شوند؛ بیلدهای قدیمی‌تر QMD مسیر سازگاری جداگانه برای هر collection را حفظ می‌کنند. هم‌منبع یعنی collectionهای حافظه پایدار با هم گروه‌بندی می‌شوند، در حالی که collectionهای رونوشت نشست در گروه جداگانه‌ای می‌مانند تا تنوع منبع همچنان هر دو ورودی را داشته باشد.

<Note>
بازنویسی‌های مدل QMD در سمت QMD باقی می‌مانند، نه در پیکربندی OpenClaw. اگر لازم است مدل‌های QMD را به‌صورت سراسری بازنویسی کنید، متغیرهای محیطی مانند `QMD_EMBED_MODEL`، `QMD_RERANK_MODEL` و `QMD_GENERATE_MODEL` را در محیط اجرای Gateway تنظیم کنید.
</Note>

<AccordionGroup>
  <Accordion title="زمان‌بندی به‌روزرسانی">
    | کلید                      | نوع       | پیش‌فرض | توضیح                                                              |
    | ------------------------- | --------- | ------- | ------------------------------------------------------------------ |
    | `update.interval`         | `string`  | `5m`    | بازه نوسازی                                                        |
    | `update.debounceMs`       | `number`  | `15000` | debounce کردن تغییرات فایل                                         |
    | `update.onBoot`           | `boolean` | `true`  | هنگام باز شدن مدیر بلندمدت QMD نوسازی شود؛ برای رد کردن به‌روزرسانی فوری راه‌اندازی، false تنظیم کنید |
    | `update.startup`          | `string`  | `off`   | مقداردهی اولیه اختیاری QMD هنگام شروع Gateway: `off`، `idle`، یا `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تأخیر پیش از اجرای نوسازی `startup: "idle"`                        |
    | `update.waitForBootSync`  | `boolean` | `false` | باز شدن مدیر را تا تکمیل نوسازی اولیه آن مسدود کن                  |
    | `update.embedInterval`    | `string`  | --      | cadence جداگانه embedding                                          |
    | `update.commandTimeoutMs` | `number`  | --      | timeout برای فرمان‌های QMD                                         |
    | `update.updateTimeoutMs`  | `number`  | --      | timeout برای عملیات به‌روزرسانی QMD                                |
    | `update.embedTimeoutMs`   | `number`  | --      | timeout برای عملیات embedding در QMD                               |
  </Accordion>
  <Accordion title="محدودیت‌ها">
    | کلید                      | نوع      | پیش‌فرض | توضیح                            |
    | ------------------------- | -------- | ------- | -------------------------------- |
    | `limits.maxResults`       | `number` | `6`     | حداکثر نتایج جست‌وجو             |
    | `limits.maxSnippetChars`  | `number` | --      | محدود کردن طول snippet           |
    | `limits.maxInjectedChars` | `number` | --      | محدود کردن کل نویسه‌های تزریق‌شده |
    | `limits.timeoutMs`        | `number` | `4000`  | timeout جست‌وجو                  |
  </Accordion>
  <Accordion title="دامنه">
    کنترل می‌کند کدام نشست‌ها می‌توانند نتایج جست‌وجوی QMD را دریافت کنند. همان schema مثل [`session.sendPolicy`](/fa/gateway/config-agents#session):

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

    پیش‌فرض ارسال‌شده نشست‌های مستقیم و کانال را مجاز می‌کند، در حالی که همچنان گروه‌ها را رد می‌کند.

    پیش‌فرض فقط DM است. `match.keyPrefix` با کلید نشست نرمال‌شده مطابقت می‌دهد؛ `match.rawKeyPrefix` با کلید خام شامل `agent:<id>:` مطابقت می‌دهد.

  </Accordion>
  <Accordion title="ارجاع‌ها">
    `memory.citations` برای همه بک‌اندها اعمال می‌شود:

    | مقدار           | رفتار                                                   |
    | ---------------- | ------------------------------------------------------- |
    | `auto` (پیش‌فرض) | پابرگ `Source: <path#line>` را در snippetها قرار می‌دهد |
    | `on`             | همیشه پابرگ را قرار می‌دهد                              |
    | `off`            | پابرگ را حذف می‌کند (مسیر همچنان به‌صورت داخلی به عامل پاس داده می‌شود) |

  </Accordion>
</AccordionGroup>

وقتی مقداردهی اولیه QMD هنگام شروع Gateway فعال باشد، OpenClaw فقط برای عامل‌های واجد شرایط QMD را شروع می‌کند. اگر `update.onBoot` برابر true باشد و هیچ نگهداری interval/embed پیکربندی نشده باشد، startup برای نوسازی boot از یک مدیر یک‌باره استفاده می‌کند و آن را می‌بندد. اگر بازه update یا embed پیکربندی شده باشد، startup مدیر بلندمدت QMD را باز می‌کند تا مالک watcher و تایمرهای interval باشد؛ `update.onBoot: false` فقط نوسازی فوری boot را رد می‌کند.

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

Dreaming به‌صورت یک sweep زمان‌بندی‌شده اجرا می‌شود و از فازهای داخلی light/deep/REM به‌عنوان جزئیات پیاده‌سازی استفاده می‌کند.

برای رفتار مفهومی و فرمان‌های slash، [Dreaming](/fa/concepts/dreaming) را ببینید.

### تنظیمات کاربر

| کلید                                   | نوع       | پیش‌فرض      | توضیح                                                                                                                      |
| -------------------------------------- | --------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`      | Dreaming را به‌طور کامل فعال یا غیرفعال می‌کند                                                                             |
| `frequency`                            | `string`  | `0 3 * * *`  | cadence اختیاری cron برای sweep کامل Dreaming                                                                              |
| `model`                                | `string`  | مدل پیش‌فرض  | بازنویسی اختیاری مدل زیرعامل Dream Diary                                                                                   |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`        | حداکثر توکن‌های تخمینی نگه‌داری‌شده از هر snippet یادآوری کوتاه‌مدت که به `MEMORY.md` ارتقا داده می‌شود؛ فراداده provenance قابل مشاهده می‌ماند |

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
- Dreaming خروجی روایی قابل خواندن برای انسان را در `DREAMS.md` (یا `dreams.md` موجود) می‌نویسد.
- `dreaming.model` از دروازه اعتماد زیرعامل Plugin موجود استفاده می‌کند؛ پیش از فعال کردن آن، `plugins.entries.memory-core.subagent.allowModelOverride: true` را تنظیم کنید.
- Dream Diary وقتی مدل پیکربندی‌شده در دسترس نباشد، یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌کند. خطاهای اعتماد یا allowlist لاگ می‌شوند و بی‌صدا دوباره تلاش نمی‌شوند.
- سیاست و آستانه‌های فاز light/deep/REM رفتار داخلی هستند، نه پیکربندی قابل مشاهده برای کاربر.

</Note>

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمای کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
