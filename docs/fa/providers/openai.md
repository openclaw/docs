---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراکی Codex استفاده کنید
    - به رفتار اجرای عامل GPT-5 سخت‌گیرانه‌تری نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T12:00:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI برای مدل‌های GPT APIهای توسعه‌دهنده ارائه می‌کند، و Codex نیز به‌عنوان عامل کدنویسی طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این سطوح را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. بیشتر مشترکان ChatGPT/Codex که رفتار Codex را می‌خواهند باید از زمان اجرای بومی سرور برنامه Codex استفاده کنند. پیشوند مدل نام ارائه‌دهنده/مدل را انتخاب می‌کند؛ یک تنظیم زمان اجرای جداگانه مشخص می‌کند چه کسی حلقه عامل تعبیه‌شده را اجرا می‌کند:

- **کلید API** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex با زمان اجرای بومی Codex** - ورود به ChatGPT/Codex به‌همراه اجرای سرور برنامه Codex (مدل‌های `openai/*` به‌علاوه `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراک Codex از طریق PI** - ورود به ChatGPT/Codex با اجراکننده عادی PI در OpenClaw (مدل‌های `openai-codex/*`)

OpenAI به‌صراحت استفاده از OAuth اشتراکی را در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا و کانال لایه‌های جداگانه‌اند. اگر این برچسب‌ها با هم اشتباه گرفته می‌شوند، پیش از تغییر پیکربندی [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده کنید از                                              | نکات                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-5.5` به‌همراه `agentRuntime.id: "codex"` | راه‌اندازی پیشنهادی Codex برای بیشتر کاربران. با احراز هویت `openai-codex` وارد شوید. |
| صورت‌حساب مستقیم با کلید API                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا راه‌اندازی کلید API OpenAI را اجرا کنید.                    |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI           | `openai-codex/gpt-5.5`                           | فقط زمانی استفاده کنید که عمداً اجراکننده عادی PI را می‌خواهید.                |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OAuth مربوط به OpenAI Codex کار می‌کند.                 |
| تصاویر با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید.     |

## نقشه نام‌گذاری

نام‌ها مشابه‌اند اما قابل جایگزینی با یکدیگر نیستند:

| نامی که می‌بینید                       | لایه             | معنا                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده   | مسیر مستقیم API مربوط به OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده   | مسیر OAuth/اشتراک OpenAI Codex از طریق اجراکننده عادی PI در OpenClaw.                      |
| Plugin `codex`                     | Plugin            | Plugin همراه OpenClaw که زمان اجرای بومی سرور برنامه Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل     | مهار بومی سرور برنامه Codex را برای نوبت‌های تعبیه‌شده اجباری می‌کند.                                     |
| `/codex ...`                       | مجموعه فرمان گفت‌وگو  | نخ‌های سرور برنامه Codex را از داخل یک مکالمه متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP | مسیر جایگزین صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمداً هم `openai-codex/*` و هم Plugin `codex` را داشته باشد. این زمانی معتبر است که OAuth مربوط به Codex را از طریق PI می‌خواهید و همچنین می‌خواهید کنترل‌های گفت‌وگوی بومی `/codex` در دسترس باشند. `openclaw doctor` درباره این ترکیب هشدار می‌دهد تا بتوانید تأیید کنید که عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API به OpenAI Platform و هم از مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید. از `openai-codex/gpt-5.5` فقط برای OAuth مربوط به Codex از طریق PI استفاده کنید، یا از `openai/gpt-5.5` بدون بازنویسی زمان اجرای Codex برای ترافیک مستقیم `OPENAI_API_KEY` استفاده کنید.
</Note>

<Note>
فعال‌سازی Plugin مربوط به OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin همراه سرور برنامه Codex را فعال نمی‌کند. OpenClaw فقط زمانی آن Plugin را فعال می‌کند که صراحتاً مهار بومی Codex را با `agentRuntime.id: "codex"` انتخاب کنید یا از ارجاع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin همراه `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI resolve شود، `openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر می‌گذارد.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                           | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses          | ارائه‌دهنده مدل `openai/<model>`                            | بله                                                    |
| مدل‌های اشتراک Codex | `openai-codex/<model>` با OAuth مربوط به `openai-codex`           | بله                                                    |
| مهار سرور برنامه Codex  | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                               | بله، وقتی جست‌وجوی وب فعال باشد و ارائه‌دهنده‌ای pin نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدیوها                    | `video_generate`                                           | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                  | بله                                                    |
| تبدیل گفتار به متن جریانی  | Voice Call `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ            | Voice Call `realtime.provider: "openai"` / Control UI Talk | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                  | بله                                                    |

## Embeddingهای حافظه

OpenClaw می‌تواند از OpenAI، یا یک endpoint سازگار با OpenAI برای embedding، جهت ایندکس‌گذاری `memory_search` و embeddingهای پرس‌وجو استفاده کند:

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

برای endpointهای سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست اختصاصی ارائه‌دهنده با نام `input_type` ارسال می‌کند: embeddingهای پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه ایندکس‌شده و ایندکس‌گذاری دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیم ارسال کنید:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل را تأیید کنید">
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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | مهار سرور برنامه Codex    | سرور برنامه Codex |

    <Note>
    `openai/*` مسیر مستقیم با کلید API مربوط به OpenAI است، مگر اینکه صراحتاً مهار سرور برنامه Codex را اجباری کنید. از `openai-codex/*` برای OAuth مربوط به Codex از طریق اجراکننده پیش‌فرض PI استفاده کنید، یا از `openai/gpt-5.5` با `agentRuntime.id: "codex"` برای اجرای بومی سرور برنامه Codex استفاده کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw مدل `openai/gpt-5.3-codex-spark` را ارائه نمی‌کند. درخواست‌های زنده OpenAI API آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را ارائه نمی‌کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی سرور برنامه Codex به‌جای یک کلید API جداگانه. Codex cloud به ورود ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth مربوط به Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیم اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost با جریان device-code مربوط به ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="از زمان اجرای بومی Codex استفاده کنید">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="در دسترس بودن احراز هویت Codex را تأیید کنید">
        ```bash
        openclaw models list --provider openai-codex
        ```

        پس از اجرای gateway، برای تأیید زمان اجرای بومی سرور برنامه، `/codex status` یا `/codex models` را در گفت‌وگو ارسال کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | مهار بومی سرور برنامه Codex | ورود Codex یا نمایه انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | OAuth مربوط به ChatGPT/Codex از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.4-mini` | حذف‌شده / `runtime: "pi"` | OAuth مربوط به ChatGPT/Codex از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI، مگر اینکه یک Plugin صراحتاً `openai-codex` را claim کند | ورود Codex |

    <Note>
    برای دستورهای auth/profile همچنان از شناسهٔ ارائه‌دهندهٔ `openai-codex` استفاده کنید. پیشوند مدل
    `openai-codex/*` همچنین مسیر صریح PI برای Codex OAuth است.
    این پیشوند ابزار app-server همراه Codex را انتخاب یا به‌طور خودکار فعال نمی‌کند. برای
    راه‌اندازی رایج اشتراک به‌همراه runtime بومی، با
    `openai-codex` وارد شوید اما ارجاع مدل را `openai/gpt-5.5` نگه دارید و
    `agentRuntime.id: "codex"` را تنظیم کنید.
    </Note>

    ### نمونهٔ پیکربندی

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    برای نگه‌داشتن Codex OAuth روی اجراکنندهٔ عادی PI، از
    `openai-codex/gpt-5.5` استفاده کنید و override مربوط به runtime Codex را حذف کنید.

    <Note>
    Onboarding دیگر محتوای OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان device-code بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در ذخیره‌گاه auth عامل خودش مدیریت می‌کند.
    </Note>

    ### نشانگر وضعیت

    گفت‌وگوی `/status` نشان می‌دهد کدام runtime مدل برای نشست فعلی فعال است.
    ابزار پیش‌فرض PI به‌صورت `Runtime: OpenClaw Pi Default` نمایش داده می‌شود. وقتی
    ابزار app-server همراه Codex انتخاب شده باشد، `/status` مقدار
    `Runtime: OpenAI Codex` را نشان می‌دهد. نشست‌های موجود شناسهٔ ابزار ثبت‌شدهٔ خود را نگه می‌دارند، بنابراین اگر می‌خواهید پس از تغییر `agentRuntime`، مقدار `/status`
    انتخاب جدید PI/Codex را بازتاب دهد، از
    `/new` یا `/reset` استفاده کنید.

    ### هشدار Doctor

    اگر Plugin همراه `codex` در حالی فعال باشد که مسیر `openai-codex/*`
    انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل همچنان از طریق PI resolve می‌شود.
    پیکربندی را فقط زمانی بدون تغییر نگه دارید که آن مسیر auth اشتراکی PI
    عمدی باشد. وقتی اجرای بومی app-server مربوط به Codex را می‌خواهید، به
    `openai/<model>` به‌همراه `agentRuntime.id: "codex"` تغییر دهید.

    ### سقف پنجرهٔ زمینه

    OpenClaw فرادادهٔ مدل و سقف زمینهٔ runtime را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق Codex OAuth:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime برای `contextTokens`: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های بهتری از نظر تأخیر و کیفیت دارد. آن را با `contextTokens` override کنید:

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
    از `contextWindow` برای اعلام فرادادهٔ بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجهٔ زمینهٔ runtime استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فرادادهٔ کاتالوگ بالادستی Codex برای `gpt-5.5` موجود باشد، از آن استفاده می‌کند. اگر discovery زندهٔ Codex ردیف `openai-codex/gpt-5.5` را در حالی که
    حساب احراز هویت شده است حذف کند، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجرای cron، زیرعامل و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورد.

  </Tab>
</Tabs>

## auth بومی app-server مربوط به Codex

ابزار app-server بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما auth آن همچنان مبتنی بر حساب است. OpenClaw
auth را با این ترتیب انتخاب می‌کند:

1. یک پروفایل auth صریح OpenClaw از نوع `openai-codex` که به عامل متصل است.
2. حساب موجود app-server، مانند ورود محلی Codex CLI ChatGPT.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نکند و همچنان به
   auth OpenAI نیاز داشته باشد.

این یعنی ورود محلی با اشتراک ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود که
فرایند Gateway همچنین برای مدل‌های مستقیم OpenAI یا embeddingها دارای `OPENAI_API_KEY`
است. fallback کلید API از env فقط مسیر محلی stdio بدون حساب است؛ این
به اتصال‌های app-server از نوع WebSocket ارسال نمی‌شود. وقتی یک پروفایل Codex
به سبک اشتراکی انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند app-server از نوع stdio که spawn می‌شود بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin همراه `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این هم از تولید تصویر با کلید API OpenAI و هم از تولید تصویر با Codex OAuth
از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت | کلید API OpenAI | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل | `openai/gpt-image-2` | `openai/gpt-image-2` |
| Auth | `OPENAI_API_KEY` | ورود با OpenAI Codex OAuth |
| انتقال | OpenAI Images API | backend مربوط به Codex Responses |
| بیشترین تعداد تصویر در هر درخواست | 4 | 4 |
| حالت ویرایش | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع) |
| override اندازه | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K |
| نسبت تصویر / وضوح | به OpenAI Images API فوروارد نمی‌شود | وقتی ایمن باشد به یک اندازهٔ پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض هم برای تولید متن‌به‌تصویر OpenAI و هم برای ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1` و `gpt-image-1-mini` همچنان به‌عنوان
overrideهای صریح مدل قابل استفاده‌اند. برای خروجی PNG/WebP با پس‌زمینهٔ شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
مقدار
`background: "transparent"` را رد می‌کند.

برای یک درخواست با پس‌زمینهٔ شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"` و
`background: "transparent"` فراخوانی کنند؛ گزینهٔ قدیمی‌تر ارائه‌دهندهٔ `openai.background`
همچنان پذیرفته می‌شود. OpenClaw همچنین از مسیرهای عمومی OpenAI و
OpenAI Codex OAuth با بازنویسی درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2` به
`gpt-image-1.5` محافظت می‌کند؛ Azure و endpointهای سفارشی سازگار با OpenAI
نام‌های deployment/model پیکربندی‌شدهٔ خود را نگه می‌دارند.

همین تنظیم برای اجراهای CLI بدون رابط نیز در دسترس است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همین flagهای `--output-format` و `--background` را با
`openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان alias اختصاصی OpenAI در دسترس است.

برای نصب‌های Codex OAuth، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth از نوع `openai-codex` پیکربندی شده باشد، OpenClaw آن توکن دسترسی OAuth
ذخیره‌شده را resolve می‌کند و درخواست‌های تصویر را از طریق backend مربوط به Codex Responses ارسال می‌کند. این سیستم
ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند یا بی‌صدا برای آن
درخواست به کلید API fallback نمی‌کند. وقتی مسیر مستقیم OpenAI Images API
را می‌خواهید، `models.providers.openai` را صریحاً با یک کلید API،
URL پایهٔ سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک آدرس LAN/خصوصی مورد اعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw
endpointهای تصویر خصوصی/داخلی سازگار با OpenAI را تا زمانی که این opt-in
وجود نداشته باشد، مسدود نگه می‌دارد.

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

Plugin همراه `openai` تولید ویدئو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت | مقدار |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض | `openai/sora-2` |
| حالت‌ها | متن‌به‌ویدئو، تصویر‌به‌ویدئو، ویرایش تک‌ویدئو |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدئو |
| override اندازه | پشتیبانی می‌شود |
| overrideهای دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` همراه با هشدار ابزار نادیده گرفته می‌شوند |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت prompt در GPT-5

OpenClaw برای اجراهای خانوادهٔ GPT-5 در میان ارائه‌دهندگان، یک مشارکت prompt مشترک GPT-5 اضافه می‌کند. این بر اساس شناسهٔ مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5` و سایر ارجاع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x دریافت نمی‌کنند.

ابزار بومی همراه Codex از همان رفتار GPT-5 و overlay مربوط به heartbeat از طریق دستورالعمل‌های توسعه‌دهندهٔ app-server مربوط به Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` مجبور شده‌اند، همان راهنمای follow-through و heartbeat فعال را نگه می‌دارند، هرچند Codex مالک بقیهٔ prompt ابزار است.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای تداوم persona، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌دهی اختصاصی channel و پیام خاموش در prompt سیستمی مشترک OpenClaw و policy تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های منطبق فعال است. لایهٔ سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار | اثر |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال کردن لایهٔ سبک تعامل دوستانه |
| `"on"` | alias برای `"friendly"` |
| `"off"` | فقط غیرفعال کردن لایهٔ سبک دوستانه |

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
مقادیر در runtime به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایهٔ سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
`plugins.entries.openai.config.personality` قدیمی همچنان زمانی به‌عنوان fallback سازگاری خوانده می‌شود که تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="ترکیب گفتار (TTS)">
    Plugin همراه `openai` ترکیب گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای یادداشت‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |
    | URL پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | بدنهٔ اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم‌نشده) |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشدهٔ OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای endpointهای سازگار با OpenAI که به کلیدهای اضافی مانند `lang` نیاز دارند استفاده کنید. کلیدهای Prototype نادیده گرفته می‌شوند.

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
    برای بازنویسی URL پایهٔ TTS بدون اثرگذاری بر endpoint مربوط به chat API، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `openai` تبدیل گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانهٔ OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - در هرجایی که رونویسی صوتی ورودی از `tools.media.audio` استفاده کند،
      از جمله قطعه‌های کانال صوتی Discord و پیوست‌های صوتی کانال،
      توسط OpenClaw پشتیبانی می‌شود

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

    وقتی تنظیمات مشترک رسانهٔ صوتی یا درخواست رونویسی هر فراخوانی ارائه کند،
    راهنمایی‌های زبان و prompt به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin همراه `openai` رونویسی بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | Prompt | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانهٔ VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صدای G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این provider جریانی برای مسیر رونویسی بلادرنگ Voice Call است؛ صدای Discord در حال حاضر قطعه‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin همراه `openai` صدای بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانهٔ VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای پل‌های بلادرنگ backend پشتیبانی می‌کند. از فراخوانی ابزار دوسویه پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    Control UI Talk از نشست‌های بلادرنگ مرورگر OpenAI با یک secret موقت کلاینت که Gateway صادر کرده
    و تبادل مستقیم WebRTC SDP مرورگر با OpenAI Realtime API استفاده می‌کند.
    راستی‌آزمایی زندهٔ نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ بخش OpenAI یک secret کلاینت را در Node صادر می‌کند، یک offer مرورگر SDP
    با رسانهٔ میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و answer مربوط به SDP را
    بدون ثبت secretها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## endpointهای Azure OpenAI

provider همراه `openai` می‌تواند با بازنویسی URL پایه، برای تولید تصویر
یک منبع Azure OpenAI را هدف بگیرد. در مسیر تولید تصویر، OpenClaw
نام میزبان‌های Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌صورت خودکار
به شکل درخواست Azure تغییر می‌دهد.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` قرار نمی‌گیرد. برای تنظیمات Azure آن،
Accordion **صدای بلادرنگ** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI استفاده کنید وقتی:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت دادهٔ منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق provider همراه `openai`،
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

OpenClaw این پسوندهای میزبان Azure را برای مسیر تولید تصویر Azure
تشخیص می‌دهد:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

برای درخواست‌های تولید تصویر روی میزبان Azure شناخته‌شده، OpenClaw:

- header `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای محدود به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- به هر درخواست `?api-version=...` اضافه می‌کند
- برای فراخوانی‌های تولید تصویر Azure از timeout پیش‌فرض 600 ثانیه استفاده می‌کند.
  مقدارهای `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایهٔ دیگر (OpenAI عمومی، proxyهای سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیردهی Azure برای مسیر تولید تصویر provider `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند endpoint عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای
تصویر Azure شکست می‌خورند.
</Note>

### نسخهٔ API

برای pin کردن یک نسخهٔ preview یا GA مشخص Azure
برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی این متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق provider همراه `openai` مسیردهی می‌شوند، فیلد `model` در OpenClaw
باید **نام deployment در Azure** باشد که در پرتال Azure پیکربندی کرده‌اید، نه
شناسهٔ مدل عمومی OpenAI.

اگر deploymentی با نام `gpt-image-2-prod` بسازید که `gpt-image-2` را ارائه می‌کند:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعدهٔ نام deployment برای فراخوانی‌های تولید تصویر که از طریق
provider همراه `openai` مسیردهی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از regionها در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد deployment، فهرست regionهای فعلی Microsoft را بررسی کنید
و تأیید کنید که مدل مشخص در region شما ارائه می‌شود.

### تفاوت‌های پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی
مقدارهای `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های خاص مدل
ارائه کند. این تفاوت‌ها از Azure و مدل زیرین می‌آیند، نه
OpenClaw. اگر درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعهٔ
پارامترهای پشتیبانی‌شده توسط deployment و نسخهٔ API مشخص خود را در
پرتال Azure بررسی کنید.

<Note>
Azure OpenAI از transport بومی و رفتار سازگاری استفاده می‌کند، اما headerهای attribution پنهان
OpenClaw را دریافت نمی‌کند — Accordion **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک chat یا Responses روی Azure (فراتر از تولید تصویر)، از
جریان onboarding یا پیکربندی اختصاصی provider Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/احراز هویت Azure را فعال نمی‌کند. یک provider جداگانهٔ
`azure-openai-responses/*` وجود دارد؛ Accordion مربوط به compaction سمت سرور را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Transport (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` ابتدا از WebSocket با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - پیش از fallback به SSE، یک شکست زودهنگام WebSocket را دوباره تلاش می‌کند
    - پس از شکست، WebSocket را حدود 60 ثانیه degrad شده علامت‌گذاری می‌کند و در زمان cool-down از SSE استفاده می‌کند
    - headerهای پایدار هویت نشست و turn را برای تلاش‌های دوباره و اتصال‌های مجدد ضمیمه می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را بین گونه‌های transport نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، fallback به SSE |
    | `"sse"` | فقط اجبار به SSE |
    | `"websocket"` | فقط اجبار به WebSocket |

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
    - [پاسخ‌های جریانی API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="آماده‌سازی WebSocket">
    OpenClaw برای کاهش تأخیر turn نخست، آماده‌سازی WebSocket را به‌صورت پیش‌فرض برای `openai/*` و `openai-codex/*` فعال می‌کند.

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
    OpenClaw یک toggle مشترک حالت سریع را برای `openai/*` و `openai-codex/*` ارائه می‌کند:

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
    overrideهای نشست بر پیکربندی برتری دارند. پاک کردن override نشست در Sessions UI نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API مربوط به OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را برای هر مدل در OpenClaw تنظیم کنید:

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

    مقادیر پشتیبانی‌شده: `auto`، `default`، `flex`، `priority`.

    <Warning>
    `serviceTier` فقط به endpointهای بومی OpenAI (`api.openai.com`) و endpointهای بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از providerها را از طریق proxy مسیریابی کنید، OpenClaw مقدار `service_tier` را بدون تغییر باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، wrapper جریان Pi-harness در Plugin OpenAI به‌صورت خودکار Compaction سمت سرور را فعال می‌کند:

    - `store: true` را اعمال می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow` (یا وقتی در دسترس نباشد `80000`)

    این مورد برای مسیر Pi harness داخلی و hookهای provider OpenAI که توسط اجراهای embedded استفاده می‌شوند اعمال می‌شود. harness سرور برنامه بومی Codex زمینه خودش را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

    <Tabs>
      <Tab title="فعال‌سازی صریح">
        برای endpointهای سازگار مانند Azure OpenAI Responses مفید است:

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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اعمال می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت GPT سخت‌گیرانه agentic">
    برای اجراهای خانواده GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای embedded سخت‌گیرانه‌تر استفاده کند:

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
    - وقتی یک اقدام tool در دسترس است، دیگر یک نوبت فقط شامل plan را پیشرفت موفق تلقی نمی‌کند
    - نوبت را با یک جهت‌دهی برای اقدام فوری دوباره امتحان می‌کند
    - برای کارهای قابل‌توجه، `update_plan` را خودکار فعال می‌کند
    - اگر مدل بدون اقدام کردن به برنامه‌ریزی ادامه دهد، یک وضعیت مسدودشده صریح نشان می‌دهد

    <Note>
    فقط به اجراهای خانواده GPT-5 در OpenAI و Codex محدود است. providerهای دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw با endpointهای مستقیم OpenAI، Codex و Azure OpenAI متفاوت از proxyهای عمومی سازگار با OpenAI `/v1` رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا proxyهایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای tool را به‌صورت پیش‌فرض روی حالت strict قرار می‌دهد
    - headerهای attribution پنهان را فقط روی میزبان‌های بومی تاییدشده پیوست می‌کند
    - شکل‌دهی درخواست‌های مختص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، hintهای prompt-cache)

    **مسیرهای proxy/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کنند
    - `store` مربوط به Completions را از payloadهای غیربومی `openai-completions` حذف می‌کنند
    - JSON عبوری پیشرفته `params.extra_body`/`params.extraBody` را برای proxyهای Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای proxyهای Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - schemaهای tool strict یا headerهای فقط بومی را اجباری نمی‌کنند

    Azure OpenAI از transport بومی و رفتار سازگاری استفاده می‌کند، اما headerهای attribution پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب providerها، refهای مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب provider.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب provider.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از credential.
  </Card>
</CardGroup>
