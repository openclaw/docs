---
read_when:
    - می‌خواهید ارائه‌دهندگان جست‌وجوی حافظه یا مدل‌های تعبیه‌سازی را پیکربندی کنید
    - می‌خواهید بک‌اند QMD را راه‌اندازی کنید
    - می‌خواهید جست‌وجوی ترکیبی، MMR یا افت زمانی را تنظیم کنید
    - می‌خواهید نمایه‌سازی حافظهٔ چندوجهی را فعال کنید
sidebarTitle: Memory config
summary: همهٔ گزینه‌های پیکربندی برای جست‌وجوی حافظه، ارائه‌دهندگان تعبیه، QMD، جست‌وجوی ترکیبی و نمایه‌سازی چندوجهی
title: مرجع پیکربندی حافظه
x-i18n:
    generated_at: "2026-04-29T23:32:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

این صفحه همهٔ گزینه‌های پیکربندی جست‌وجوی حافظه برای OpenClaw را فهرست می‌کند. برای مرورهای مفهومی، ببینید:

<CardGroup cols={2}>
  <Card title="نمای کلی حافظه" href="/fa/concepts/memory">
    حافظه چگونه کار می‌کند.
  </Card>
  <Card title="موتور داخلی" href="/fa/concepts/memory-builtin">
    بک‌اند پیش‌فرض SQLite.
  </Card>
  <Card title="موتور QMD" href="/fa/concepts/memory-qmd">
    سایدکار با اولویت محلی.
  </Card>
  <Card title="جست‌وجوی حافظه" href="/fa/concepts/memory-search">
    خط لولهٔ جست‌وجو و تنظیم آن.
  </Card>
  <Card title="Active Memory" href="/fa/concepts/active-memory">
    زیرعامل حافظه برای نشست‌های تعاملی.
  </Card>
</CardGroup>

همهٔ تنظیمات جست‌وجوی حافظه زیر `agents.defaults.memorySearch` در `openclaw.json` قرار دارند، مگر اینکه خلاف آن ذکر شده باشد.

<Note>
اگر به دنبال کلید فعال‌سازی قابلیت **active memory** و پیکربندی زیرعامل هستید، این مورد به‌جای `memorySearch` زیر `plugins.entries.active-memory` قرار دارد.

Active memory از یک مدل دو دروازه‌ای استفاده می‌کند:

1. Plugin باید فعال باشد و شناسهٔ عامل فعلی را هدف بگیرد
2. درخواست باید یک نشست گفت‌وگوی پایدار تعاملی واجد شرایط باشد

برای مدل فعال‌سازی، پیکربندی متعلق به Plugin، پایداری رونوشت، و الگوی عرضهٔ ایمن، [Active Memory](/fa/concepts/active-memory) را ببینید.
</Note>

---

## انتخاب ارائه‌دهنده

| کلید       | نوع       | پیش‌فرض             | توضیح                                                                                                                                                                                                                             |
| ---------- | --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | تشخیص خودکار        | شناسهٔ آداپتور embedding مانند `bedrock`، `deepinfra`، `gemini`، `github-copilot`، `local`، `mistral`، `ollama`، `openai`، یا `voyage`؛ همچنین می‌تواند یک `models.providers.<id>` پیکربندی‌شده باشد که `api` آن به یکی از این آداپتورها اشاره می‌کند |
| `model`    | `string`  | پیش‌فرض ارائه‌دهنده | نام مدل embedding                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`            | شناسهٔ آداپتور جایگزین وقتی گزینهٔ اصلی شکست می‌خورد                                                                                                                                                                             |
| `enabled`  | `boolean` | `true`              | فعال یا غیرفعال کردن جست‌وجوی حافظه                                                                                                                                                                                              |

### ترتیب تشخیص خودکار

وقتی `provider` تنظیم نشده باشد، OpenClaw نخستین مورد در دسترس را انتخاب می‌کند:

<Steps>
  <Step title="local">
    اگر `memorySearch.local.modelPath` پیکربندی شده باشد و فایل وجود داشته باشد، انتخاب می‌شود.
  </Step>
  <Step title="github-copilot">
    اگر توکن GitHub Copilot قابل حل باشد (متغیر محیطی یا پروفایل احراز هویت)، انتخاب می‌شود.
  </Step>
  <Step title="openai">
    اگر کلید OpenAI قابل حل باشد، انتخاب می‌شود.
  </Step>
  <Step title="gemini">
    اگر کلید Gemini قابل حل باشد، انتخاب می‌شود.
  </Step>
  <Step title="voyage">
    اگر کلید Voyage قابل حل باشد، انتخاب می‌شود.
  </Step>
  <Step title="mistral">
    اگر کلید Mistral قابل حل باشد، انتخاب می‌شود.
  </Step>
  <Step title="deepinfra">
    اگر کلید DeepInfra قابل حل باشد، انتخاب می‌شود.
  </Step>
  <Step title="bedrock">
    اگر زنجیرهٔ اعتبارنامهٔ AWS SDK قابل حل باشد (نقش نمونه، کلیدهای دسترسی، پروفایل، SSO، هویت وب، یا پیکربندی مشترک)، انتخاب می‌شود.
  </Step>
</Steps>

`ollama` پشتیبانی می‌شود اما به‌صورت خودکار تشخیص داده نمی‌شود (آن را صریح تنظیم کنید).

### شناسه‌های سفارشی ارائه‌دهنده

`memorySearch.provider` می‌تواند به یک ورودی سفارشی `models.providers.<id>` اشاره کند. OpenClaw مالک `api` آن ارائه‌دهنده را برای آداپتور embedding حل می‌کند، در حالی که شناسهٔ سفارشی ارائه‌دهنده را برای endpoint، احراز هویت، و مدیریت پیشوند مدل حفظ می‌کند. این کار به چیدمان‌های چند GPU یا چند میزبان اجازه می‌دهد embeddingهای حافظه را به یک endpoint محلی مشخص اختصاص دهند:

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

### حل API key

embeddingهای راه‌دور به API key نیاز دارند. Bedrock به‌جای آن از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند (نقش‌های نمونه، SSO، کلیدهای دسترسی).

| ارائه‌دهنده   | متغیر محیطی                                       | کلید پیکربندی                      |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | زنجیرهٔ اعتبارنامهٔ AWS                           | به API key نیاز نیست                |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | پروفایل احراز هویت از طریق ورود دستگاه |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth مربوط به Codex فقط چت/تکمیل‌ها را پوشش می‌دهد و درخواست‌های embedding را برآورده نمی‌کند.
</Note>

---

## پیکربندی endpoint راه‌دور

برای endpointهای سفارشی سازگار با OpenAI یا بازنویسی پیش‌فرض‌های ارائه‌دهنده:

<ParamField path="remote.baseUrl" type="string">
  URL پایهٔ API سفارشی.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  بازنویسی API key.
</ParamField>
<ParamField path="remote.headers" type="object">
  سرآیندهای HTTP اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند).
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

## پیکربندی ویژهٔ ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Gemini">
    | کلید                   | نوع      | پیش‌فرض                | توضیح                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | از `gemini-embedding-2-preview` نیز پشتیبانی می‌کند |
    | `outputDimensionality` | `number` | `3072`                 | برای Embedding 2: 768، 1536، یا 3072      |

    <Warning>
    تغییر مدل یا `outputDimensionality` باعث اجرای خودکار بازنمایه‌سازی کامل می‌شود.
    </Warning>

  </Accordion>
  <Accordion title="انواع ورودی سازگار با OpenAI">
    endpointهای embedding سازگار با OpenAI می‌توانند از فیلدهای درخواست `input_type` ویژهٔ ارائه‌دهنده استفاده کنند. این برای مدل‌های embedding نامتقارن که برای embeddingهای پرس‌وجو و سند به برچسب‌های متفاوت نیاز دارند، مفید است.

    | کلید                | نوع      | پیش‌فرض      | توضیح                                                |
    | ------------------- | -------- | ------------ | ---------------------------------------------------- |
    | `inputType`         | `string` | تنظیم‌نشده   | `input_type` مشترک برای embeddingهای پرس‌وجو و سند  |
    | `queryInputType`    | `string` | تنظیم‌نشده   | `input_type` هنگام پرس‌وجو؛ `inputType` را بازنویسی می‌کند |
    | `documentInputType` | `string` | تنظیم‌نشده   | `input_type` نمایه/سند؛ `inputType` را بازنویسی می‌کند |

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

    تغییر این مقادیر بر هویت کش embedding برای نمایه‌سازی دسته‌ای ارائه‌دهنده اثر می‌گذارد و وقتی مدل بالادستی با برچسب‌ها رفتار متفاوتی دارد، باید پس از آن بازنمایه‌سازی حافظه انجام شود.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS SDK استفاده می‌کند؛ نیازی به API key نیست. اگر OpenClaw روی EC2 با نقش نمونهٔ دارای Bedrock اجرا می‌شود، فقط ارائه‌دهنده و مدل را تنظیم کنید:

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

    | کلید                   | نوع      | پیش‌فرض                       | توضیح                         |
    | ---------------------- | -------- | ----------------------------- | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | هر شناسهٔ مدل embedding در Bedrock |
    | `outputDimensionality` | `number` | پیش‌فرض مدل                   | برای Titan V2: 256، 512، یا 1024 |

    **مدل‌های پشتیبانی‌شده** (با تشخیص خانواده و پیش‌فرض‌های بُعد):

    | شناسهٔ مدل                                  | ارائه‌دهنده | ابعاد پیش‌فرض | ابعاد قابل پیکربندی |
    | ------------------------------------------- | ------------ | ------------- | ------------------- |
    | `amazon.titan-embed-text-v2:0`              | Amazon       | 1024          | 256، 512، 1024      |
    | `amazon.titan-embed-text-v1`                | Amazon       | 1536          | --                  |
    | `amazon.titan-embed-g1-text-02`             | Amazon       | 1536          | --                  |
    | `amazon.titan-embed-image-v1`               | Amazon       | 1024          | --                  |
    | `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon       | 1024          | 256، 384، 1024، 3072 |
    | `cohere.embed-english-v3`                   | Cohere       | 1024          | --                  |
    | `cohere.embed-multilingual-v3`              | Cohere       | 1024          | --                  |
    | `cohere.embed-v4:0`                         | Cohere       | 1536          | 256-1536            |
    | `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs   | 512           | --                  |
    | `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs   | 1024          | --                  |

    گونه‌های دارای پسوند توان عملیاتی (برای مثال، `amazon.titan-embed-text-v1:2:8k`) پیکربندی مدل پایه را به ارث می‌برند.

    **احراز هویت:** احراز هویت Bedrock از ترتیب استاندارد حل اعتبارنامهٔ AWS SDK استفاده می‌کند:

    1. متغیرهای محیطی (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. کش توکن SSO
    3. اعتبارنامه‌های توکن هویت وب
    4. فایل‌های اعتبارنامه و پیکربندی مشترک
    5. اعتبارنامه‌های فرادادهٔ ECS یا EC2

    Region از `AWS_REGION`، `AWS_DEFAULT_REGION`، `baseUrl` ارائه‌دهندهٔ `amazon-bedrock` حل می‌شود، یا به‌صورت پیش‌فرض `us-east-1` است.

    **مجوزهای IAM:** نقش یا کاربر IAM به این موارد نیاز دارد:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    برای اصل حداقل امتیاز، دامنهٔ `InvokeModel` را به مدل مشخص محدود کنید:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلی (GGUF + node-llama-cpp)">
    | کلید                  | نوع                | پیش‌فرض                     | توضیح                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | دانلود خودکار               | مسیر فایل مدل GGUF                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | پیش‌فرض node-llama-cpp      | دایرکتوری کش برای مدل‌های دانلودشده                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                      | اندازه پنجره زمینه برای زمینه embedding. مقدار 4096 قطعه‌های معمولی (128 تا 512 توکن) را پوشش می‌دهد و هم‌زمان VRAM غیرمرتبط با وزن‌ها را محدود نگه می‌دارد. روی میزبان‌های محدود، آن را به 1024 تا 2048 کاهش دهید. `"auto"` از حداکثر آموزش‌دیده مدل استفاده می‌کند - برای مدل‌های 8B+ توصیه نمی‌شود (Qwen3-Embedding-8B: 40 960 توکن → حدود 32 گیگابایت VRAM در برابر حدود 8.8 گیگابایت در 4096). |

    مدل پیش‌فرض: `embeddinggemma-300m-qat-Q8_0.gguf` (حدود 0.6 گیگابایت، دانلود خودکار). به بیلد بومی نیاز دارد: ابتدا `pnpm approve-builds` و سپس `pnpm rebuild node-llama-cpp`.

    از CLI مستقل استفاده کنید تا همان مسیر provider را که Gateway استفاده می‌کند بررسی کنید:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    اگر `provider` برابر `auto` باشد، `local` فقط زمانی انتخاب می‌شود که `local.modelPath` به یک فایل محلی موجود اشاره کند. ارجاع‌های مدل `hf:` و HTTP(S) همچنان می‌توانند به‌طور صریح با `provider: "local"` استفاده شوند، اما باعث نمی‌شوند `auto` پیش از در دسترس بودن مدل روی دیسک، local را انتخاب کند.

  </Accordion>
</AccordionGroup>

### مهلت زمانی embedding درون‌خطی

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  مهلت زمانی دسته‌های embedding درون‌خطی هنگام نمایه‌سازی حافظه را بازنویسی کنید.

در صورت تنظیم نشدن، از پیش‌فرض provider استفاده می‌شود: 600 ثانیه برای providerهای محلی/خودمیزبان مانند `local`، `ollama` و `lmstudio`، و 120 ثانیه برای providerهای میزبانی‌شده. وقتی دسته‌های embedding محلی وابسته به CPU سالم اما کند هستند، این مقدار را افزایش دهید.
</ParamField>

---

## پیکربندی جست‌وجوی ترکیبی

همه موارد زیر `memorySearch.query.hybrid` قرار دارند:

| کلید                  | نوع       | پیش‌فرض | توضیح                                 |
| --------------------- | --------- | ------- | ------------------------------------- |
| `enabled`             | `boolean` | `true`  | فعال‌سازی جست‌وجوی ترکیبی BM25 + برداری |
| `vectorWeight`        | `number`  | `0.7`   | وزن امتیازهای برداری (0-1)            |
| `textWeight`          | `number`  | `0.3`   | وزن امتیازهای BM25 (0-1)              |
| `candidateMultiplier` | `number`  | `4`     | ضریب اندازه مجموعه نامزدها            |

<Tabs>
  <Tab title="MMR (تنوع)">
    | کلید          | نوع       | پیش‌فرض | توضیح                                  |
    | ------------- | --------- | ------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | فعال‌سازی رتبه‌بندی دوباره MMR         |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = بیشترین تنوع، 1 = بیشترین ارتباط  |
  </Tab>
  <Tab title="کاهش زمانی (تازگی)">
    | کلید                         | نوع       | پیش‌فرض | توضیح                         |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | فعال‌سازی تقویت تازگی         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | امتیاز هر N روز نصف می‌شود    |

    فایل‌های همیشه‌سبز (`MEMORY.md`، فایل‌های بدون تاریخ در `memory/`) هرگز دچار کاهش نمی‌شوند.

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

مسیرها می‌توانند مطلق یا نسبی به workspace باشند. دایرکتوری‌ها به‌صورت بازگشتی برای فایل‌های `.md` پویش می‌شوند. نحوه مدیریت symlink به backend فعال بستگی دارد: موتور داخلی symlinkها را نادیده می‌گیرد، در حالی که QMD از رفتار اسکنر QMD زیربنایی پیروی می‌کند.

برای جست‌وجوی transcript میان‌عامل با دامنه عامل، به‌جای `memory.qmd.paths` از `agents.list[].memorySearch.qmd.extraCollections` استفاده کنید. آن مجموعه‌های اضافی همان شکل `{ path, name, pattern? }` را دنبال می‌کنند، اما برای هر عامل ادغام می‌شوند و وقتی مسیر به بیرون از workspace فعلی اشاره کند، می‌توانند نام‌های مشترک صریح را حفظ کنند. اگر همان مسیر resolve‌شده هم در `memory.qmd.paths` و هم در `memorySearch.qmd.extraCollections` ظاهر شود، QMD اولین ورودی را نگه می‌دارد و مورد تکراری را رد می‌کند.

---

## حافظه چندوجهی (Gemini)

تصویرها و صدا را همراه با Markdown با استفاده از Gemini Embedding 2 نمایه‌سازی کنید:

| کلید                      | نوع        | پیش‌فرض    | توضیح                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | فعال‌سازی نمایه‌سازی چندوجهی           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`، `["audio"]`، یا `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | حداکثر اندازه فایل برای نمایه‌سازی     |

<Note>
فقط برای فایل‌های موجود در `extraPaths` اعمال می‌شود. ریشه‌های حافظهٔ پیش‌فرض فقط Markdown باقی می‌مانند. به `gemini-embedding-2-preview` نیاز دارد. `fallback` باید `"none"` باشد.
</Note>

قالب‌های پشتیبانی‌شده: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (تصاویر)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## کش embedding

| کلید               | نوع       | پیش‌فرض | توضیح                                   |
| ------------------ | --------- | ------- | ---------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | کش کردن embeddingهای قطعه‌ها در SQLite |
| `cache.maxEntries` | `number`  | `50000` | بیشینهٔ embeddingهای کش‌شده            |

از embedding دوبارهٔ متن تغییرنکرده هنگام reindex یا به‌روزرسانی‌های transcript جلوگیری می‌کند.

---

## نمایه‌سازی دسته‌ای

| کلید                          | نوع       | پیش‌فرض | توضیح                    |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | embeddingهای درون‌خطی موازی |
| `remote.batch.enabled`        | `boolean` | `false` | فعال‌سازی API embedding دسته‌ای |
| `remote.batch.concurrency`    | `number`  | `2`     | کارهای دسته‌ای موازی     |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار برای تکمیل دسته   |
| `remote.batch.pollIntervalMs` | `number`  | --      | بازهٔ polling            |
| `remote.batch.timeoutMinutes` | `number`  | --      | مهلت زمانی دسته          |

برای `openai`، `gemini` و `voyage` در دسترس است. دسته‌ای OpenAI معمولاً برای backfillهای بزرگ سریع‌ترین و ارزان‌ترین گزینه است.

`remote.nonBatchConcurrency` فراخوانی‌های embedding درون‌خطی را کنترل می‌کند که ارائه‌دهندگان محلی/خودمیزبان و ارائه‌دهندگان میزبانی‌شده وقتی APIهای دسته‌ای ارائه‌دهنده فعال نیستند از آن‌ها استفاده می‌کنند. مقدار پیش‌فرض Ollama برای نمایه‌سازی غیردسته‌ای `1` است تا از فشار بیش از حد به میزبان‌های محلی کوچک‌تر جلوگیری شود؛ روی ماشین‌های بزرگ‌تر مقدار بالاتری تنظیم کنید.

این جدا از `sync.embeddingBatchTimeoutSeconds` است که مهلت زمانی فراخوانی‌های embedding درون‌خطی را کنترل می‌کند.

---

## جست‌وجوی حافظهٔ نشست (آزمایشی)

transcriptهای نشست را نمایه‌سازی کنید و از طریق `memory_search` نمایش دهید:

| کلید                          | نوع        | پیش‌فرض     | توضیح                                  |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | فعال‌سازی نمایه‌سازی نشست             |
| `sources`                     | `string[]` | `["memory"]` | برای شامل کردن transcriptها، `"sessions"` را اضافه کنید |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | آستانهٔ بایت برای reindex             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | آستانهٔ پیام برای reindex             |

<Warning>
نمایه‌سازی نشست اختیاری است و به‌صورت ناهمگام اجرا می‌شود. نتایج ممکن است کمی قدیمی باشند. گزارش‌های نشست روی دیسک قرار دارند، بنابراین دسترسی به فایل‌سیستم را مرز اعتماد در نظر بگیرید.
</Warning>

---

## شتاب‌دهی برداری SQLite (sqlite-vec)

| کلید                         | نوع       | پیش‌فرض | توضیح                                |
| ---------------------------- | --------- | ------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | استفاده از sqlite-vec برای پرس‌وجوهای برداری |
| `store.vector.extensionPath` | `string`  | همراه بسته | بازنویسی مسیر sqlite-vec           |

وقتی sqlite-vec در دسترس نباشد، OpenClaw به‌طور خودکار به شباهت کسینوسی درون‌پردازشی fallback می‌کند.

---

## ذخیره‌سازی نمایه

| کلید                  | نوع      | پیش‌فرض                              | توضیح                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | مکان نمایه (از توکن `{agentId}` پشتیبانی می‌کند) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | tokenizer مربوط به FTS5 (`unicode61` یا `trigram`) |

---

## پیکربندی backend مربوط به QMD

برای فعال‌سازی، `memory.backend = "qmd"` را تنظیم کنید. همهٔ تنظیمات QMD زیر `memory.qmd` قرار دارند:

| کلید                     | نوع       | پیش‌فرض | توضیح                                                                                  |
| ------------------------ | --------- | ------- | -------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`   | مسیر فایل اجرایی QMD؛ وقتی `PATH` سرویس با shell شما متفاوت است، یک مسیر مطلق تنظیم کنید |
| `searchMode`             | `string`  | `search` | فرمان جست‌وجو: `search`، `vsearch`، `query`                                           |
| `includeDefaultMemory`   | `boolean` | `true`  | نمایه‌سازی خودکار `MEMORY.md` + `memory/**/*.md`                                      |
| `paths[]`                | `array`   | --      | مسیرهای اضافه: `{ name, path, pattern? }`                                             |
| `sessions.enabled`       | `boolean` | `false` | نمایه‌سازی transcriptهای نشست                                                        |
| `sessions.retentionDays` | `number`  | --      | نگه‌داری transcript                                                                    |
| `sessions.exportDir`     | `string`  | --      | دایرکتوری export                                                                       |

`searchMode: "search"` فقط واژگانی/BM25 است. OpenClaw برای این حالت، از جمله هنگام `memory status --deep`، کاوشگرهای آمادگی بردار معنایی یا نگهداری embedding در QMD را اجرا نمی‌کند؛ `vsearch` و `query` همچنان به آمادگی بردار QMD و embeddingها نیاز دارند.

OpenClaw شکل‌های فعلی مجموعه QMD و پرس‌وجوی MCP را ترجیح می‌دهد، اما با تلاش برای پرچم‌های الگوی مجموعه سازگار و نام‌های قدیمی‌تر ابزار MCP در صورت نیاز، نسخه‌های قدیمی‌تر QMD را همچنان قابل استفاده نگه می‌دارد. وقتی QMD پشتیبانی از چند فیلتر مجموعه را اعلام می‌کند، مجموعه‌های هم‌منبع با یک فرایند QMD جست‌وجو می‌شوند؛ ساخت‌های قدیمی‌تر QMD مسیر سازگاری برای هر مجموعه را حفظ می‌کنند. هم‌منبع یعنی مجموعه‌های حافظه پایدار با هم گروه‌بندی می‌شوند، در حالی که مجموعه‌های رونوشت نشست در گروهی جدا می‌مانند تا تنوع منبع همچنان هر دو ورودی را داشته باشد.

<Note>
بازنویسی‌های مدل QMD در سمت QMD می‌مانند، نه در پیکربندی OpenClaw. اگر لازم است مدل‌های QMD را به‌صورت سراسری بازنویسی کنید، متغیرهای محیطی مانند `QMD_EMBED_MODEL`، `QMD_RERANK_MODEL` و `QMD_GENERATE_MODEL` را در محیط زمان اجرای Gateway تنظیم کنید.
</Note>

<AccordionGroup>
  <Accordion title="زمان‌بندی به‌روزرسانی">
    | کلید                       | نوع      | پیش‌فرض | توضیح                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | بازه تازه‌سازی                      |
    | `update.debounceMs`       | `number`  | `15000` | Debounce برای تغییرات فایل                 |
    | `update.onBoot`           | `boolean` | `true`  | هنگام باز شدن مدیر بلندمدت QMD تازه‌سازی می‌کند؛ همچنین تازه‌سازی اختیاری هنگام راه‌اندازی را کنترل می‌کند |
    | `update.startup`          | `string`  | `off`   | تازه‌سازی اختیاری هنگام شروع Gateway: `off`، `idle` یا `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تاخیر پیش از اجرای تازه‌سازی `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | باز شدن مدیر را تا تکمیل تازه‌سازی اولیه آن مسدود می‌کند |
    | `update.embedInterval`    | `string`  | --      | آهنگ جداگانه embed                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلت زمانی برای فرمان‌های QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلت زمانی برای عملیات به‌روزرسانی QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلت زمانی برای عملیات embed در QMD      |
  </Accordion>
  <Accordion title="محدودیت‌ها">
    | کلید                       | نوع     | پیش‌فرض | توضیح                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | بیشینه نتایج جست‌وجو         |
    | `limits.maxSnippetChars`  | `number` | --      | محدود کردن طول قطعه متن       |
    | `limits.maxInjectedChars` | `number` | --      | محدود کردن مجموع نویسه‌های تزریق‌شده |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلت زمانی جست‌وجو             |
  </Accordion>
  <Accordion title="دامنه">
    کنترل می‌کند کدام نشست‌ها می‌توانند نتایج جست‌وجوی QMD را دریافت کنند. همان schema مربوط به [`session.sendPolicy`](/fa/gateway/config-agents#session):

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

    پیش‌فرض ارسال‌شده نشست‌های مستقیم و کانالی را مجاز می‌کند، در حالی که گروه‌ها را همچنان رد می‌کند.

    پیش‌فرض فقط DM است. `match.keyPrefix` با کلید نشست نرمال‌سازی‌شده مطابقت می‌دهد؛ `match.rawKeyPrefix` با کلید خام شامل `agent:<id>:` مطابقت می‌دهد.

  </Accordion>
  <Accordion title="ارجاع‌ها">
    `memory.citations` برای همه backendها اعمال می‌شود:

    | مقدار            | رفتار                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (پیش‌فرض) | فوتر `Source: <path#line>` را در قطعه‌های متن وارد می‌کند    |
    | `on`             | همیشه فوتر را وارد می‌کند                               |
    | `off`            | فوتر را حذف می‌کند (مسیر همچنان به‌صورت داخلی به عامل داده می‌شود) |

  </Accordion>
</AccordionGroup>

تازه‌سازی‌های بوت QMD هنگام راه‌اندازی Gateway از مسیر زیرفرایند یک‌باره استفاده می‌کنند. مدیر بلندمدت QMD همچنان وقتی جست‌وجوی حافظه برای استفاده تعاملی باز می‌شود، مالک ناظر معمول فایل و تایمرهای بازه‌ای است.

### مثال کامل QMD

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
| `enabled`   | `boolean` | `false`       | فعال یا غیرفعال کردن کامل dreaming               |
| `frequency` | `string`  | `0 3 * * *`   | آهنگ Cron اختیاری برای پیمایش کامل dreaming |
| `model`     | `string`  | مدل پیش‌فرض | بازنویسی اختیاری مدل زیرعامل Dream Diary      |

### مثال

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
- Dreaming وضعیت ماشینی را در `memory/.dreams/` می‌نویسد.
- Dreaming خروجی روایی خوانا برای انسان را در `DREAMS.md` (یا `dreams.md` موجود) می‌نویسد.
- `dreaming.model` از دروازه اعتماد موجود برای زیرعامل Plugin استفاده می‌کند؛ پیش از فعال کردن آن، `plugins.entries.memory-core.subagent.allowModelOverride: true` را تنظیم کنید.
- Dream Diary وقتی مدل پیکربندی‌شده در دسترس نباشد، یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌کند. شکست‌های اعتماد یا allowlist ثبت می‌شوند و بی‌صدا دوباره تلاش نمی‌شوند.
- سیاست فاز سبک/عمیق/REM و آستانه‌ها رفتار داخلی هستند، نه پیکربندی کاربرمحور.

</Note>

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمای کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
