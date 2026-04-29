---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراک Codex استفاده کنید
    - به رفتار اجرای سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw استفاده کنید
title: OpenAI
x-i18n:
    generated_at: "2026-04-29T23:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT فراهم می‌کند، و Codex نیز به‌عنوان یک عامل کدنویسی مبتنی بر طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این سطوح را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. پیشوند مدل مسیر ارائه‌دهنده/احراز هویت را انتخاب می‌کند؛ یک تنظیم جداگانه زمان اجرا انتخاب می‌کند چه کسی حلقه عامل تعبیه‌شده را اجرا کند:

- **کلید API** — دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex از طریق PI** — ورود ChatGPT/Codex با دسترسی اشتراکی (مدل‌های `openai-codex/*`)
- **سازوکار app-server در Codex** — اجرای بومی app-server در Codex (مدل‌های `openai/*` به‌همراه `agents.defaults.agentRuntime.id: "codex"`)

OpenAI به‌صراحت از استفاده OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا، و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم مخلوط می‌شوند، پیش از تغییر پیکربندی [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                          | استفاده کنید                                              | نکات                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| صورت‌حساب مستقیم با کلید API                        | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا راه‌اندازی کلید API برای OpenAI را اجرا کنید.                       |
| GPT-5.5 با احراز هویت اشتراک ChatGPT/Codex  | `openai-codex/gpt-5.5`                           | مسیر پیش‌فرض PI برای OAuth در Codex. بهترین انتخاب اولیه برای راه‌اندازی‌های اشتراکی. |
| GPT-5.5 با رفتار بومی app-server در Codex | `openai/gpt-5.5` به‌همراه `agentRuntime.id: "codex"` | سازوکار app-server در Codex را برای آن ارجاع مدل اجباری می‌کند.                      |
| تولید یا ویرایش تصویر                   | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OAuth مربوط به OpenAI Codex کار می‌کند.                    |
| تصاویر با پس‌زمینه شفاف                 | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید.        |

## نقشه نام‌گذاری

نام‌ها مشابه‌اند اما قابل جایگزینی با یکدیگر نیستند:

| نامی که می‌بینید                       | لایه             | معنا                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده   | مسیر مستقیم API در OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده   | مسیر OAuth/اشتراک OpenAI Codex از طریق اجراکننده عادی PI در OpenClaw.                      |
| Plugin مربوط به `codex`                     | Plugin            | Plugin همراه OpenClaw که زمان اجرای بومی app-server در Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل     | سازوکار بومی app-server در Codex را برای نوبت‌های تعبیه‌شده اجباری می‌کند.                                     |
| `/codex ...`                       | مجموعه فرمان‌های گفت‌وگو  | رشته‌های app-server در Codex را از داخل یک مکالمه متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP | مسیر پشتیبان صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمدا هم `openai-codex/*` و هم Plugin مربوط به `codex` را داشته باشد. وقتی هم OAuth مربوط به Codex را از طریق PI می‌خواهید و هم می‌خواهید کنترل‌های گفت‌وگوی بومی `/codex` در دسترس باشند، این معتبر است. `openclaw doctor` درباره آن ترکیب هشدار می‌دهد تا تأیید کنید عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API به OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای ترافیک مستقیم `OPENAI_API_KEY` از `openai/gpt-5.5`، برای OAuth مربوط به Codex از طریق PI از `openai-codex/gpt-5.5`، یا برای سازوکار بومی app-server در Codex از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید.
</Note>

<Note>
فعال کردن Plugin مربوط به OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin همراه app-server در Codex را فعال نمی‌کند. OpenClaw آن Plugin را فقط زمانی فعال می‌کند که سازوکار بومی Codex را با `agentRuntime.id: "codex"` صریحا انتخاب کنید یا از یک ارجاع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin همراه `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI resolve شود، `openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر باقی می‌گذارد.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                           | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses          | ارائه‌دهنده مدل `openai/<model>`                            | بله                                                    |
| مدل‌های اشتراک Codex | `openai-codex/<model>` با OAuth مربوط به `openai-codex`           | بله                                                    |
| سازوکار app-server در Codex  | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                               | بله، وقتی جست‌وجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای pin نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدئوها                    | `video_generate`                                           | بله                                                    |
| متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                  | بله                                                    |
| گفتار به متن جریانی  | Voice Call `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ            | Voice Call `realtime.provider: "openai"` / گفت‌وگوی Control UI | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                  | بله                                                    |

## Embeddingهای حافظه

OpenClaw می‌تواند از OpenAI، یا یک endpoint سازگار با OpenAI برای embedding، جهت indexing و embeddingهای پرس‌وجوی `memory_search` استفاده کند:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

برای endpointهای سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست `input_type` مخصوص ارائه‌دهنده ارسال می‌کند: embeddingهای پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه indexشده و indexing دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت دلخواهتان را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API را از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیما ارسال کنید:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل              | پیکربندی زمان اجرا             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | سازوکار app-server در Codex    | app-server در Codex |

    <Note>
    `openai/*` مسیر مستقیم کلید API برای OpenAI است مگر اینکه سازوکار app-server در Codex را صریحا اجباری کنید. برای OAuth مربوط به Codex از طریق اجراکننده پیش‌فرض PI از `openai-codex/*` استفاده کنید، یا برای اجرای بومی app-server در Codex از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw مدل `openai/gpt-5.3-codex-spark` را در معرض استفاده قرار نمی‌دهد. درخواست‌های زنده OpenAI API آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را در معرض استفاده قرار نمی‌دهد.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex شما به‌جای یک کلید API جداگانه. ابر Codex به ورود ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth مربوط به Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیما اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost، با جریان کد دستگاه ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="مدل پیش‌فرض را تنظیم کنید">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | OAuth مربوط به ChatGPT/Codex از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI، مگر اینکه یک Plugin صریحا مالک `openai-codex` شود | ورود Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | سازوکار app-server در Codex | احراز هویت app-server در Codex |

    <Note>
    برای فرمان‌های احراز هویت/پروفایل، به استفاده از شناسه ارائه‌دهنده `openai-codex` ادامه دهید. پیشوند مدل `openai-codex/*` نیز مسیر صریح PI برای OAuth مربوط به Codex است. این پیشوند سازوکار همراه app-server در Codex را انتخاب یا خودکار فعال نمی‌کند.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` یک مسیر پشتیبانی‌شده OAuth برای Codex نیست. از `openai/gpt-5.4-mini` با یک کلید API مربوط به OpenAI استفاده کنید، یا از `openai-codex/gpt-5.5` با OAuth مربوط به Codex استفاده کنید.
    </Warning>

    ### نمونه پیکربندی

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    راه‌اندازی دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان کد دستگاه بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در مخزن احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام زمان‌اجرای مدل برای نشست فعلی فعال است.
    هارنس پیش‌فرض Pi به صورت `Runtime: OpenClaw Pi Default` ظاهر می‌شود. وقتی هارنس app-server همراهِ Codex انتخاب شده باشد، `/status` این را نشان می‌دهد:
    `Runtime: OpenAI Codex`. نشست‌های موجود شناسه هارنس ثبت‌شده خود را نگه می‌دارند، بنابراین اگر می‌خواهید پس از تغییر `agentRuntime`، خروجی `/status` انتخاب جدید Pi/Codex را بازتاب دهد، از
    `/new` یا `/reset` استفاده کنید.

    ### هشدار Doctor

    اگر Plugin همراهِ `codex` در حالی فعال باشد که مسیر
    `openai-codex/*` این زبانه انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل
    همچنان از طریق Pi حل می‌شود. وقتی این مسیر احراز هویت اشتراکی همان چیزی است که قصد دارید، پیکربندی را بدون تغییر نگه دارید. فقط وقتی به اجرای بومی app-server در Codex نیاز دارید، به `openai/<model>` به‌همراه
    `agentRuntime.id: "codex"` تغییر دهید.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه زمان‌اجرا را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق OAuth در Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض `contextTokens` زمان‌اجرا: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های بهتری از نظر تأخیر و کیفیت دارد. آن را با `contextTokens` بازنویسی کنید:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    از `contextWindow` برای اعلان فراداده بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجه زمینه زمان‌اجرا استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ بالادستی Codex برای `gpt-5.5` موجود باشد، از آن استفاده می‌کند. اگر کشف زنده Codex در حالی که حساب احراز هویت شده است، ردیف `openai-codex/gpt-5.5` را حذف کند، OpenClaw آن ردیف مدل OAuth را می‌سازد تا اجرای cron، عامل فرعی، و مدل پیش‌فرض پیکربندی‌شده با خطای
    `Unknown model` شکست نخورد.

  </Tab>
</Tabs>

## احراز هویت app-server بومی Codex

هارنس app-server بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان مبتنی بر حساب است. OpenClaw احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح OpenClaw برای `openai-codex` که به عامل متصل است.
2. حساب موجود app-server، مانند ورود محلی Codex CLI با ChatGPT.
3. فقط برای راه‌اندازی‌های app-server محلی از نوع stdio، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و هنوز به احراز هویت
   OpenAI نیاز دارد.

این یعنی ورود اشتراکی محلی ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود که فرایند Gateway برای مدل‌های مستقیم OpenAI یا جاسازی‌ها نیز `OPENAI_API_KEY` دارد. جایگزین کلید API از محیط فقط مسیر محلی stdio بدون حساب است؛ به اتصال‌های app-server مبتنی بر WebSocket ارسال نمی‌شود. وقتی یک پروفایل Codex از نوع اشتراکی انتخاب شده باشد، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرزند app-server نوع stdio که ایجاد می‌شود بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin همراهِ `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این Plugin هم از تولید تصویر با کلید API در OpenAI و هم از تولید تصویر با OAuth در Codex از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                | کلید API در OpenAI                     | OAuth در Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                      | `OPENAI_API_KEY`                   | ورود OAuth برای OpenAI Codex           |
| انتقال                 | API تصاویر OpenAI                  | پشتانه Responses در Codex              |
| بیشینه تصاویر در هر درخواست    | 4                                  | 4                                    |
| حالت ویرایش                 | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع)   |
| بازنویسی‌های اندازه            | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K   | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K     |
| نسبت تصویر / وضوح | به API تصاویر OpenAI ارسال نمی‌شود | وقتی ایمن باشد به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار جایگزینی در زمان خطا، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض برای تولید متن‌به‌تصویر OpenAI و ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان بازنویسی‌های صریح مدل قابل استفاده هستند. برای خروجی PNG/WebP با پس‌زمینه شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2` مقدار
`background: "transparent"` را رد می‌کند.

برای درخواست پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی ارائه‌دهنده `openai.background` همچنان پذیرفته می‌شود. OpenClaw همچنین با بازنویسی درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2` به `gpt-image-1.5` از مسیرهای عمومی OpenAI و
OAuth در OpenAI Codex محافظت می‌کند؛ نقطه‌پایان‌های Azure و سازگار با OpenAI سفارشی، نام‌های deployment/model پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجرای‌های CLI بدون رابط نیز در دسترس است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همین پرچم‌های `--output-format` و `--background` را با
`openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان نام مستعار ویژه OpenAI در دسترس است.

برای نصب‌های OAuth در Codex، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک پروفایل OAuth برای `openai-codex` پیکربندی شده باشد، OpenClaw آن توکن دسترسی OAuth ذخیره‌شده را حل می‌کند و درخواست‌های تصویر را از طریق پشتانه Responses در Codex ارسال می‌کند. برای آن درخواست، ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند و بی‌صدا به یک کلید API برنمی‌گردد. وقتی مسیر مستقیم API تصاویر OpenAI را می‌خواهید، `models.providers.openai` را به‌طور صریح با یک کلید API، نشانی پایه سفارشی، یا نقطه‌پایان Azure پیکربندی کنید.
اگر آن نقطه‌پایان تصویر سفارشی روی یک نشانی LAN/خصوصی مورد اعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw نقطه‌پایان‌های تصویر خصوصی/داخلی سازگار با OpenAI را مسدود نگه می‌دارد مگر اینکه این انتخاب صریح وجود داشته باشد.

تولید:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تولید PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

ویرایش:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## تولید ویدئو

Plugin همراهِ `openai` تولید ویدئو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت       | مقدار                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض    | `openai/sora-2`                                                                   |
| حالت‌ها            | متن‌به‌ویدئو، تصویر‌به‌ویدئو، ویرایش تک‌ویدئو                                  |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدئو                                                                |
| بازنویسی‌های اندازه   | پشتیبانی می‌شود                                                                         |
| بازنویسی‌های دیگر  | `aspectRatio`، `resolution`، `audio`، `watermark` با هشدار ابزار نادیده گرفته می‌شوند |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار جایگزینی در زمان خطا، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت prompt در GPT-5

OpenClaw برای اجراهای خانواده GPT-5 در میان ارائه‌دهنده‌ها یک مشارکت prompt مشترک GPT-5 اضافه می‌کند. این مشارکت بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و دیگر ارجاع‌های سازگار GPT-5 همان پوشش را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x آن را دریافت نمی‌کنند.

هارنس بومی Codex همراه، همان رفتار GPT-5 و پوشش Heartbeat را از طریق دستورالعمل‌های توسعه‌دهنده app-server در Codex به‌کار می‌گیرد، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` اجبار شده‌اند، همان راهنمایی پیگیری و Heartbeat پیش‌دستانه را نگه می‌دارند، حتی با اینکه بقیه prompt هارنس در مالکیت Codex است.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری پرسونا، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ مخصوص کانال و پیام بی‌صدا در prompt سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمایی GPT-5 برای مدل‌های منطبق همیشه فعال است. لایه سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال کردن لایه سبک تعامل دوستانه |
| `"on"`                 | نام مستعار برای `"friendly"`                      |
| `"off"`                | فقط لایه سبک دوستانه را غیرفعال می‌کند       |

<Tabs>
  <Tab title="پیکربندی">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
مقادیر در زمان اجرا به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد، مقدار قدیمی `plugins.entries.openai.config.personality` همچنان به‌عنوان جایگزین سازگاری خوانده می‌شود.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="سنتز گفتار (TTS)">
    Plugin همراهِ `openai` سنتز گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای پیام‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |
    | نشانی پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    مدل‌های در دسترس: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای در دسترس: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    برای بازنویسی نشانی پایه TTS بدون اثر گذاشتن بر نقطه‌پایان API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin همراهِ `openai` گفتار‌به‌متن دسته‌ای را از طریق سطح رونویسی درک رسانه‌ای OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطه‌پایان: REST در OpenAI با `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - در OpenClaw هر جا رونویسی صوت ورودی از
      `tools.media.audio` استفاده کند پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار استفاده از OpenAI برای رونویسی صوتی ورودی:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    راهنمایی‌های زبان و پرامپت، وقتی توسط پیکربندی مشترک رسانه صوتی
    یا درخواست رونویسی جداگانه در هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin همراه `openai`، رونویسی بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | پرامپت | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهنده استریم برای مسیر رونویسی بلادرنگ Voice Call است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin همراه `openai`، صدای بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای پل‌های بلادرنگ backend پشتیبانی می‌کند. از فراخوانی دوطرفه ابزار پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    Talk در Control UI از نشست‌های بلادرنگ مرورگر OpenAI با یک secret موقت سمت کلاینت که توسط Gateway صادر شده
    و تبادل مستقیم WebRTC SDP مرورگر در برابر
    OpenAI Realtime API استفاده می‌کند. راستی‌آزمایی زنده نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ مسیر OpenAI در Node یک client secret صادر می‌کند، یک پیشنهاد SDP مرورگر
    با رسانه میکروفون جعلی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و پاسخ SDP را
    بدون ثبت secretها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط پایانی Azure OpenAI

ارائه‌دهنده همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر
هدف بگیرد. در مسیر تولید تصویر، OpenClaw
نام میزبان‌های Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار به
شکل درخواست Azure تغییر می‌کند.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای بلادرنگ**
زیر [صدا و گفتار](#voice-and-speech) را ببینید.
</Note>

از Azure OpenAI زمانی استفاده کنید که:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت داده منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده همراه `openai`،
`models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را روی
کلید Azure OpenAI تنظیم کنید (نه کلید OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw این پسوندهای میزبان Azure را برای مسیر تولید تصویر Azure می‌شناسد:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

برای درخواست‌های تولید تصویر روی میزبان Azure شناخته‌شده، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` می‌فرستد
- از مسیرهای scoped به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- به هر درخواست `?api-version=...` اضافه می‌کند
- از timeout پیش‌فرض ۶۰۰ ثانیه‌ای برای فراخوانی‌های تولید تصویر Azure استفاده می‌کند.
  مقدارهای `timeoutMs` در هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایه دیگر (OpenAI عمومی، پراکسی‌های سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیردهی Azure برای مسیر تولید تصویر ارائه‌دهنده `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مثل نقطه پایانی عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای تصویر Azure
ناموفق می‌شوند.
</Note>

### نسخه API

برای ثابت کردن یک نسخه پیش‌نمایش یا GA مشخص Azure برای مسیر تولید تصویر Azure،
`AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها همان نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده همراه `openai` مسیردهی می‌شوند، فیلد `model` در OpenClaw
باید **نام deployment در Azure** باشد که در پورتال Azure پیکربندی کرده‌اید، نه
شناسه مدل عمومی OpenAI.

اگر deploymentی به نام `gpt-image-2-prod` بسازید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده نام deployment برای فراخوانی‌های تولید تصویر که از طریق
ارائه‌دهنده همراه `openai` مسیردهی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از منطقه‌ها در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد deployment، فهرست منطقه‌های فعلی Microsoft را بررسی کنید
و تأیید کنید که مدل مشخص در منطقه شما ارائه می‌شود.

### تفاوت‌های پارامتر

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال بعضی
مقدارهای `background` روی `gpt-image-2`) یا آن‌ها را فقط در نسخه‌های مشخص مدل
ارائه دهد. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی ناموفق شد، مجموعه
پارامترهای پشتیبانی‌شده توسط deployment و نسخه API مشخص خود را در
پورتال Azure بررسی کنید.

<Note>
Azure OpenAI از transport بومی و رفتار سازگار استفاده می‌کند اما سرآیندهای انتساب پنهان
OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI**
زیر [پیکربندی پیشرفته](#advanced-configuration) را ببینید.

برای ترافیک chat یا Responses روی Azure (فراتر از تولید تصویر)، از
جریان onboarding یا یک پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/auth Azure را انتخاب نمی‌کند. یک ارائه‌دهنده جداگانه
`azure-openai-responses/*` وجود دارد؛ آکاردئون Compaction سمت سرور را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Transport (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` از WebSocket-first با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست اولیه WebSocket را پیش از fallback به SSE یک بار دوباره تلاش می‌کند
    - پس از شکست، WebSocket را حدود ۶۰ ثانیه degraded علامت‌گذاری می‌کند و در دوره cool-down از SSE استفاده می‌کند
    - سرآیندهای پایدار هویت نشست و turn را برای تلاش‌های دوباره و اتصال‌های مجدد ضمیمه می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را در گونه‌های transport نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، fallback به SSE |
    | `"sse"` | اجبار به فقط SSE |
    | `"websocket"` | اجبار به فقط WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    مستندات مرتبط OpenAI:
    - [Realtime API با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="گرم‌سازی WebSocket">
    OpenClaw برای کاهش تأخیر turn نخست، گرم‌سازی WebSocket را به‌طور پیش‌فرض برای `openai/*` و `openai-codex/*` فعال می‌کند.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="حالت سریع">
    OpenClaw یک کلید مشترک حالت سریع را برای `openai/*` و `openai-codex/*` ارائه می‌کند:

    - **Chat/UI:** `/fast status|on|off`
    - **پیکربندی:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI نگاشت می‌کند (`service_tier = "priority"`). مقدارهای موجود `service_tier` حفظ می‌شوند، و حالت سریع `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    بازنویسی‌های نشست بر پیکربندی مقدم‌اند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API متعلق به OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را در OpenClaw برای هر مدل تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    مقدارهای پشتیبانی‌شده: `auto`، `default`، `flex`، `priority`.

    <Warning>
    `serviceTier` فقط به نقاط پایانی بومی OpenAI (`api.openai.com`) و نقاط پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هر یک از ارائه‌دهنده‌ها را از طریق پراکسی مسیردهی کنید، OpenClaw مقدار `service_tier` را دست‌نخورده می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، wrapper استریم Pi-harness متعلق به Plugin OpenAI به‌طور خودکار Compaction سمت سرور را فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - `compact_threshold` پیش‌فرض: ۷۰٪ از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این برای مسیر Pi harness داخلی و برای hookهای ارائه‌دهنده OpenAI که توسط اجراهای embedded استفاده می‌شوند اعمال می‌شود. harness بومی app-server متعلق به Codex، context خودش را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

    <Tabs>
      <Tab title="فعال‌سازی صریح">
        برای نقاط پایانی سازگار مانند Azure OpenAI Responses مفید است:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="آستانه سفارشی">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="غیرفعال‌سازی">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجباری می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت سخت‌گیرانه agentic برای GPT">
    برای اجراهای خانواده GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای تعبیه‌شده سخت‌گیرانه‌تر استفاده کند:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    با `strict-agentic`، OpenClaw:
    - دیگر وقتی یک اقدام ابزار در دسترس است، نوبت فقط-برنامه را پیشرفت موفق محسوب نمی‌کند
    - نوبت را با هدایت برای اقدام فوری دوباره امتحان می‌کند
    - برای کارهای قابل توجه، `update_plan` را به‌صورت خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام برنامه‌ریزی کند، وضعیت مسدودشده صریحی را نشان می‌دهد

    <Note>
    فقط به اجراهای OpenAI و Codex از خانواده GPT-5 محدود است. ارائه‌دهندگان دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را نگه می‌دارند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw نقاط پایانی مستقیم OpenAI، Codex و Azure OpenAI را متفاوت از پراکسی‌های عمومی سازگار با OpenAI در `/v1` در نظر می‌گیرد:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا پراکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - طرح‌واره‌های ابزار را به‌طور پیش‌فرض روی حالت سخت‌گیرانه می‌گذارد
    - سرآیندهای انتساب پنهان را فقط روی میزبان‌های بومی تأییدشده اضافه می‌کند
    - شکل‌دهی درخواست مخصوص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، راهنمایی‌های prompt-cache)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کند
    - `store` مربوط به Completions را از payloadهای غیر بومی `openai-completions` حذف می‌کند
    - عبور JSON پیشرفته `params.extra_body`/`params.extraBody` را برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرد
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرد
    - طرح‌واره‌های سخت‌گیرانه ابزار یا سرآیندهای فقط-بومی را اجباری نمی‌کند

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما سرآیندهای انتساب پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده دوباره از اعتبارنامه‌ها.
  </Card>
</CardGroup>
