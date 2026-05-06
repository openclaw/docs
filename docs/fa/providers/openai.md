---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید از احراز هویت با اشتراک Codex به‌جای کلیدهای API استفاده کنید
    - به رفتار اجرای سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: استفاده از OpenAI با کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT ارائه می‌کند، و Codex نیز به‌عنوان یک عامل کدنویسیِ طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این سطح‌ها را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. بیشتر مشترکان ChatGPT/Codex که رفتار Codex را می‌خواهند، باید از زمان اجرای بومی سرور برنامه Codex استفاده کنند. پیشوند مدل، نام ارائه‌دهنده/مدل را انتخاب می‌کند؛ یک تنظیم جداگانه زمان اجرا مشخص می‌کند چه کسی حلقه عامل تعبیه‌شده را اجرا می‌کند:

- **کلید API** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex با زمان اجرای بومی Codex** - ورود با ChatGPT/Codex به‌همراه اجرای سرور برنامه Codex (مدل‌های `openai/*` به‌علاوه `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراک Codex از طریق PI** - ورود با ChatGPT/Codex با اجراکننده عادی OpenClaw PI (مدل‌های `openai-codex/*`)

OpenAI به‌صراحت از استفاده OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم قاطی می‌شوند، قبل از تغییر پیکربندی [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده کنید                                      | یادداشت‌ها                                                               |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-5.5` به‌علاوه `agentRuntime.id: "codex"` | تنظیم پیشنهادی Codex برای بیشتر کاربران. با احراز هویت `openai-codex` وارد شوید. |
| صورت‌حساب مستقیم با کلید API                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا آماده‌سازی کلید API مربوط به OpenAI را اجرا کنید. |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI           | `openai-codex/gpt-5.5`                           | فقط زمانی استفاده کنید که عمداً اجراکننده عادی PI را می‌خواهید.                |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OpenAI Codex OAuth کار می‌کند.                 |
| تصویرهای با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید.     |

## نقشه نام‌گذاری

نام‌ها شبیه‌اند، اما قابل‌جابه‌جایی نیستند:

| نامی که می‌بینید                       | لایه             | معنا                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده   | مسیر مستقیم API در OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده   | مسیر OpenAI Codex OAuth/اشتراک از طریق اجراکننده عادی OpenClaw PI.                      |
| Plugin ‏`codex`                     | Plugin            | Plugin همراه OpenClaw که زمان اجرای بومی سرور برنامه Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل     | اجبار به استفاده از مهار بومی سرور برنامه Codex برای نوبت‌های تعبیه‌شده.                                     |
| `/codex ...`                       | مجموعه فرمان گفت‌وگو  | اتصال/کنترل رشته‌های سرور برنامه Codex از یک مکالمه.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP | مسیر جایگزین صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

یعنی یک پیکربندی می‌تواند عمداً هم `openai-codex/*` و هم Plugin ‏`codex` را داشته باشد. این زمانی معتبر است که Codex OAuth را از طریق PI می‌خواهید و همچنین می‌خواهید کنترل‌های گفت‌وگوی بومی `/codex` در دسترس باشند. `openclaw doctor` درباره این ترکیب هشدار می‌دهد تا بتوانید تأیید کنید که عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API در OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌علاوه اجرای بومی Codex، از `openai/gpt-5.5` همراه با `agentRuntime.id: "codex"` استفاده کنید. از `openai-codex/gpt-5.5` فقط برای Codex OAuth از طریق PI استفاده کنید، یا از `openai/gpt-5.5` بدون بازنویسی زمان اجرای Codex برای ترافیک مستقیم `OPENAI_API_KEY` استفاده کنید.
</Note>

<Note>
فعال‌سازی Plugin مربوط به OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin همراه سرور برنامه Codex را فعال نمی‌کند. OpenClaw آن Plugin را فقط زمانی فعال می‌کند که مهار بومی Codex را با `agentRuntime.id: "codex"` صراحتاً انتخاب کنید یا از یک ارجاع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin همراه `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI resolve شود، `openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر باقی می‌گذارد.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                           | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses          | ارائه‌دهنده مدل `openai/<model>`                            | بله                                                    |
| مدل‌های اشتراک Codex | `openai-codex/<model>` با OAuth ‏`openai-codex`           | بله                                                    |
| مهار سرور برنامه Codex  | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                               | بله، وقتی جست‌وجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای سنجاق نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدیوها                    | `video_generate`                                           | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / فهم رسانه                  | بله                                                    |
| تبدیل گفتار به متن جریانی  | تماس صوتی `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ            | تماس صوتی `realtime.provider: "openai"` / گفت‌وگوی Control UI | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                  | بله                                                    |

## Embeddingهای حافظه

OpenClaw می‌تواند از OpenAI، یا یک نقطه پایانی سازگار با OpenAI برای embeddingها، جهت نمایه‌سازی `memory_search` و embeddingهای پرس‌وجو استفاده کند:

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

برای نقطه‌های پایانی سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست `input_type` ویژه ارائه‌دهنده ارسال می‌کند: embeddingهای پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم به API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="آماده‌سازی را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیماً پاس دهید:

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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | مهار سرور برنامه Codex    | سرور برنامه Codex |

    <Note>
    `openai/*` مسیر مستقیم کلید API مربوط به OpenAI است، مگر اینکه صراحتاً مهار سرور برنامه Codex را اجبار کنید. از `openai-codex/*` برای Codex OAuth از طریق اجراکننده پیش‌فرض PI استفاده کنید، یا برای اجرای بومی سرور برنامه Codex از `openai/gpt-5.5` همراه با `agentRuntime.id: "codex"` استفاده کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw ‏`openai/gpt-5.3-codex-spark` را در معرض استفاده قرار نمی‌دهد. درخواست‌های زنده OpenAI API آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را ارائه نمی‌کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی سرور برنامه Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود با ChatGPT نیاز دارد.

    <Steps>
      <Step title="Codex OAuth را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیماً اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های بدون رابط گرافیکی یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost، با جریان device-code مربوط به ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="از زمان اجرای بومی Codex استفاده کنید">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="بررسی کنید احراز هویت Codex در دسترس است">
        ```bash
        openclaw models list --provider openai-codex
        ```

        پس از اینکه Gateway اجرا شد، `/codex status` یا `/codex models` را در گفت‌وگو ارسال کنید تا زمان اجرای بومی سرور برنامه را بررسی کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | مهار بومی سرور برنامه Codex | ورود Codex یا پروفایل انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.4-mini` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI است مگر اینکه یک Plugin صراحتاً `openai-codex` را claim کند | ورود Codex |

    <Warning>
    ارجاع‌های مدل قدیمی‌تر `openai-codex/gpt-5.1*`، `openai-codex/gpt-5.2*` یا `openai-codex/gpt-5.3*` را پیکربندی نکنید. حساب‌های ChatGPT/Codex OAuth اکنون آن مدل‌ها را رد می‌کنند. برای مسیر PI OAuth از `openai-codex/gpt-5.5` استفاده کنید، یا برای اجرای زمان اجرای بومی Codex از `openai/gpt-5.5` همراه با `agentRuntime.id: "codex"` استفاده کنید.
    </Warning>

    <Note>
    برای فرمان‌های احراز هویت/پروفایل، همچنان از شناسه ارائه‌دهنده `openai-codex` استفاده کنید. پیشوند مدل
    `openai-codex/*` همچنین مسیر صریح PI برای Codex OAuth است.
    این پیشوند هارنس app-server بسته‌بندی‌شده Codex را انتخاب یا به‌صورت خودکار فعال نمی‌کند. برای
    راه‌اندازی رایج اشتراک به‌همراه runtime بومی، با
    `openai-codex` وارد شوید اما ارجاع مدل را `openai/gpt-5.5` نگه دارید و
    `agentRuntime.id: "codex"` را تنظیم کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    برای نگه‌داشتن Codex OAuth روی اجراکننده عادی PI به‌جای آن، از
    `openai-codex/gpt-5.5` استفاده کنید و بازنویسی runtime مربوط به Codex را حذف کنید.

    <Note>
    راه‌اندازی اولیه دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان device-code بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در مخزن احراز هویت agent خودش مدیریت می‌کند.
    </Note>

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام runtime مدل برای نشست فعلی فعال است.
    هارنس پیش‌فرض PI به‌صورت `Runtime: OpenClaw Pi Default` ظاهر می‌شود. وقتی
    هارنس app-server بسته‌بندی‌شده Codex انتخاب شده باشد، `/status` مقدار
    `Runtime: OpenAI Codex` را نشان می‌دهد. نشست‌های موجود شناسه هارنس ثبت‌شده خود را نگه می‌دارند، بنابراین اگر می‌خواهید پس از تغییر `agentRuntime`، `/status`
    انتخاب جدید PI/Codex را منعکس کند، از
    `/new` یا `/reset` استفاده کنید.

    ### هشدار Doctor

    اگر Plugin بسته‌بندی‌شده `codex` فعال باشد در حالی که مسیر `openai-codex/*`
    انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل همچنان از طریق PI حل می‌شود.
    فقط وقتی این مسیر احراز هویت اشتراکی PI عمدی است، پیکربندی را بدون تغییر نگه دارید. وقتی
    اجرای بومی app-server مربوط به Codex را می‌خواهید، به `openai/<model>` به‌همراه `agentRuntime.id: "codex"` تغییر دهید.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه runtime را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق Codex OAuth:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime برای `contextTokens`: `272000`

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
    از `contextWindow` برای اعلام فراداده مدل بومی استفاده کنید. از `contextTokens` برای محدود کردن بودجه زمینه runtime استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ بالادستی Codex برای `gpt-5.5` وجود داشته باشد، از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `openai-codex/gpt-5.5` را در حالی که
    حساب احراز هویت شده است حذف کند، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجراهای cron، sub-agent و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت app-server بومی Codex

هارنس app-server بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان مبتنی بر حساب است. OpenClaw
احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح OpenClaw با نام `openai-codex` که به agent متصل است.
2. حساب موجود app-server، مانند ورود محلی Codex CLI با ChatGPT.
3. فقط برای اجرای محلی app-server از نوع stdio، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به احراز هویت
   OpenAI نیاز دارد.

یعنی ورود محلی با اشتراک ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود
که فرایند Gateway همچنین برای مدل‌های مستقیم OpenAI
یا embeddings مقدار `OPENAI_API_KEY` دارد. fallback کلید API محیطی فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های app-server از نوع WebSocket ارسال نمی‌شود. وقتی پروفایل Codex
به سبک اشتراکی انتخاب شده باشد، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند app-server نوع stdio که اجرا می‌شود بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin بسته‌بندی‌شده `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این Plugin هم تولید تصویر با کلید API مربوط به OpenAI و هم تولید تصویر با Codex OAuth
را از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت | کلید API مربوط به OpenAI | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل | `openai/gpt-image-2` | `openai/gpt-image-2` |
| احراز هویت | `OPENAI_API_KEY` | ورود OpenAI Codex OAuth |
| انتقال | OpenAI Images API | بک‌اند Codex Responses |
| بیشینه تصاویر در هر درخواست | 4 | 4 |
| حالت ویرایش | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع) |
| بازنویسی اندازه | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K |
| نسبت تصویر / وضوح | به OpenAI Images API ارسال نمی‌شود | وقتی امن باشد به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض برای تولید تصویر از متن با OpenAI و همچنین
ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده هستند. برای خروجی PNG/WebP با پس‌زمینه شفاف
از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
مقدار `background: "transparent"` را رد می‌کند.

برای درخواست پس‌زمینه شفاف، agentها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی ارائه‌دهنده `openai.background`
هنوز پذیرفته می‌شود. OpenClaw همچنین مسیرهای عمومی OpenAI و
OpenAI Codex OAuth را با بازنویسی درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2`
به `gpt-image-1.5` محافظت می‌کند؛ Azure و endpointهای سفارشی سازگار با OpenAI
نام‌های deployment/مدل پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجراهای headless از CLI نیز در دسترس است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همین فلگ‌های `--output-format` و `--background` را با
`openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان نام مستعار اختصاصی OpenAI در دسترس است.

برای نصب‌های Codex OAuth، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth با نام `openai-codex` پیکربندی شده باشد، OpenClaw توکن دسترسی OAuth
ذخیره‌شده را حل می‌کند و درخواست‌های تصویر را از طریق بک‌اند Codex Responses ارسال می‌کند. این
درخواست ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند و بی‌صدا به کلید API برای همان
درخواست fallback نمی‌کند. وقتی مسیر مستقیم OpenAI Images API
را می‌خواهید، `models.providers.openai` را صراحتا با یک کلید API،
URL پایه سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک آدرس LAN/خصوصی مورد اعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw
endpointهای تصویر خصوصی/داخلی سازگار با OpenAI را مسدود نگه می‌دارد مگر اینکه این opt-in
وجود داشته باشد.

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

## تولید ویدیو

Plugin بسته‌بندی‌شده `openai` تولید ویدیو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت | مقدار |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض | `openai/sora-2` |
| حالت‌ها | متن به ویدیو، تصویر به ویدیو، ویرایش تک‌ویدیو |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدیو |
| بازنویسی اندازه | پشتیبانی می‌شود |
| بازنویسی‌های دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` با هشدار ابزار نادیده گرفته می‌شوند |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت prompt مربوط به GPT-5

OpenClaw یک مشارکت prompt مشترک GPT-5 را برای اجراهای خانواده GPT-5 در میان ارائه‌دهندگان اضافه می‌کند. این مشارکت بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و دیگر ارجاع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x این overlay را دریافت نمی‌کنند.

هارنس بومی بسته‌بندی‌شده Codex همان رفتار GPT-5 و overlay مربوط به Heartbeat را از طریق دستورهای توسعه‌دهنده app-server مربوط به Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` اجبار شده‌اند همان راهنمای پیگیری و Heartbeat پیش‌دستانه را نگه می‌دارند، هرچند Codex مالک بقیه prompt هارنس است.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری پرسونا، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌دهی وابسته به کانال و پیام خاموش در prompt سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های منطبق فعال است. لایه سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار | اثر |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال کردن لایه سبک تعامل دوستانه |
| `"on"` | نام مستعار برای `"friendly"` |
| `"off"` | فقط غیرفعال کردن لایه سبک دوستانه |

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
مقادیر در runtime به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد، مقدار قدیمی `plugins.entries.openai.config.personality` همچنان به‌عنوان fallback سازگاری خوانده می‌شود.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="ترکیب گفتار (TTS)">
    Plugin بسته‌بندی‌شده `openai` ترکیب گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای پیام‌های صوتی، `mp3` برای فایل‌ها |
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
    برای بازنویسی URL پایهٔ TTS بدون اثرگذاری بر endpoint API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin همراه `openai` گفتار به متن دسته‌ای را از طریق سطح رونویسی درک رسانهٔ OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - در هر جایی از OpenClaw که رونویسی صوت ورودی از `tools.media.audio` استفاده می‌کند پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار استفاده از OpenAI برای رونویسی صوت ورودی:

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

    وقتی پیکربندی مشترک رسانهٔ صوتی یا درخواست رونویسی هر فراخوانی ارائه کند، راهنمایی‌های زبان و prompt به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin همراه `openai` رونویسی بلادرنگ را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | Prompt | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانهٔ VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از یک اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهندهٔ streaming برای مسیر رونویسی بلادرنگ تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin همراه `openai` صدای بلادرنگ را برای Plugin تماس صوتی ثبت می‌کند.

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
    Control UI Talk از نشست‌های بلادرنگ مرورگر OpenAI با یک راز موقت client ساخته‌شده توسط Gateway و تبادل مستقیم WebRTC SDP مرورگر با OpenAI Realtime API استفاده می‌کند. راستی‌آزمایی زندهٔ نگه‌دارنده با `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` در دسترس است؛ بخش OpenAI یک راز client را در Node می‌سازد، یک پیشنهاد SDP مرورگر با رسانهٔ میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و پاسخ SDP را بدون ثبت رازها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpointهای Azure OpenAI

ارائه‌دهندهٔ همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام میزبان‌های Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌صورت خودکار به شکل درخواست Azure تغییر می‌کند.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) استفاده می‌کند و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، به آکاردئون **صدای بلادرنگ** زیر [صدا و گفتار](#voice-and-speech) مراجعه کنید.
</Note>

از Azure OpenAI استفاده کنید وقتی:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به محل نگهداری دادهٔ منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهندهٔ همراه `openai`، `models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را روی کلید Azure OpenAI تنظیم کنید (نه کلید OpenAI Platform):

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

OpenClaw این پسوندهای میزبان Azure را برای مسیر تولید تصویر Azure تشخیص می‌دهد:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

برای درخواست‌های تولید تصویر روی میزبان Azure شناخته‌شده، OpenClaw:

- هدر `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای scoped به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- `?api-version=...` را به هر درخواست اضافه می‌کند
- از timeout پیش‌فرض ۶۰۰ ثانیه برای فراخوانی‌های تولید تصویر Azure استفاده می‌کند.
  مقادیر `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایهٔ دیگر (OpenAI عمومی، proxyهای سازگار با OpenAI) شکل استاندارد درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهندهٔ `openai` به OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر `openai.baseUrl` سفارشی را مانند endpoint عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای تصویر Azure شکست می‌خورند.
</Note>

### نسخهٔ API

برای pin کردن یک نسخهٔ preview یا GA مشخص Azure برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها نام‌های deployment هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure که از طریق ارائه‌دهندهٔ همراه `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw باید **نام deployment Azure** باشد که در پرتال Azure پیکربندی کرده‌اید، نه شناسهٔ مدل عمومی OpenAI.

اگر deploymentی به نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعدهٔ نام deployment برای فراخوانی‌های تولید تصویر که از طریق ارائه‌دهندهٔ همراه `openai` مسیریابی می‌شوند نیز اعمال می‌شود.

### دسترسی منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است (برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`، `uaenorth`). پیش از ایجاد deployment، فهرست فعلی مناطق Microsoft را بررسی کنید و تأیید کنید که مدل مشخص در منطقهٔ شما ارائه می‌شود.

### تفاوت‌های پارامتر

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند. Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی مقادیر `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مشخص مدل ارائه دهد. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعهٔ پارامترهایی را که deployment و نسخهٔ API مشخص شما در پرتال Azure پشتیبانی می‌کند بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند اما هدرهای attribution پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر سازگار با OpenAI** را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک چت یا Responses روی Azure (فراتر از تولید تصویر)، از جریان onboarding یا یک پیکربندی اختصاصی ارائه‌دهندهٔ Azure استفاده کنید — `openai.baseUrl` به‌تنهایی شکل API/auth مربوط به Azure را به کار نمی‌گیرد. یک ارائه‌دهندهٔ جداگانهٔ `azure-openai-responses/*` وجود دارد؛ آکاردئون Server-side compaction را در ادامه ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` از WebSocket-first با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست اولیهٔ WebSocket را پیش از fallback به SSE دوباره تلاش می‌کند
    - پس از یک شکست، WebSocket را حدود ۶۰ ثانیه degraded علامت می‌زند و در زمان cool-down از SSE استفاده می‌کند
    - هدرهای پایدار هویت نشست و turn را برای retryها و اتصال‌های مجدد ضمیمه می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را در گونه‌های مختلف انتقال نرمال‌سازی می‌کند

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

    اسناد مرتبط OpenAI:
    - [Realtime API با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="گرم‌سازی WebSocket">
    OpenClaw برای کاهش تأخیر نخستین turn، گرم‌سازی WebSocket را به‌صورت پیش‌فرض برای `openai/*` و `openai-codex/*` فعال می‌کند.

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

    - **چت/UI:** `/fast status|on|off`
    - **پیکربندی:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI نگاشت می‌کند (`service_tier = "priority"`). مقادیر موجود `service_tier` حفظ می‌شوند، و حالت سریع `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند.

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
    بازنویسی‌های نشست بر پیکربندی تقدم دارند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را در OpenClaw برای هر مدل تنظیم کنید:

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

  <Accordion title="Server-side compaction (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، wrapper جریان Pi-harness در Plugin OpenAI به‌صورت خودکار Compaction سمت سرور را فعال می‌کند:

    - مقدار `store: true` را اجباری می‌کند، مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کرده باشد
    - مقدار `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow`، یا در صورت در دسترس نبودن `80000`

    این مورد هم برای مسیر داخلی Pi harness اعمال می‌شود و هم برای hookهای provider OpenAI که توسط اجراهای embedded استفاده می‌شوند. harness بومی app-server مربوط به Codex زمینهٔ خود را از طریق Codex مدیریت می‌کند و به‌صورت جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجباری می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کرده باشد.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    برای اجراهای خانوادهٔ GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای embedded سخت‌گیرانه‌تر استفاده کند:

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
    - دیگر یک نوبت فقط شامل برنامه را وقتی اقدام ابزاری در دسترس است به‌عنوان پیشرفت موفق در نظر نمی‌گیرد
    - نوبت را با هدایت برای اقدام فوری دوباره تلاش می‌کند
    - برای کارهای قابل‌توجه، `update_plan` را به‌صورت خودکار فعال می‌کند
    - اگر مدل بدون اقدام همچنان برنامه‌ریزی کند، وضعیت مسدودشدهٔ صریحی را نمایش می‌دهد

    <Note>
    فقط به اجراهای خانوادهٔ GPT-5 مربوط به OpenAI و Codex محدود است. سایر providerها و خانواده‌های قدیمی‌تر مدل رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw با endpointهای مستقیم OpenAI، Codex و Azure OpenAI متفاوت از proxyهای عمومی `/v1` سازگار با OpenAI رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - مقدار `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - استدلال غیرفعال را برای مدل‌ها یا proxyهایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای ابزار را به‌صورت پیش‌فرض روی حالت سخت‌گیرانه می‌گذارد
    - headerهای attribution پنهان را فقط روی hostهای بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مخصوص OpenAI را نگه می‌دارد (`service_tier`، `store`، reasoning-compat، hintهای prompt-cache)

    **مسیرهای proxy/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کنند
    - مقدار Completions `store` را از payloadهای غیر بومی `openai-completions` حذف می‌کنند
    - عبور مستقیم JSON پیشرفتهٔ `params.extra_body`/`params.extraBody` را برای proxyهای Completions سازگار با OpenAI می‌پذیرند
    - مقدار `params.chat_template_kwargs` را برای proxyهای Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - schemaهای سخت‌گیرانهٔ ابزار یا headerهای فقط بومی را اجباری نمی‌کنند

    Azure OpenAI از transport بومی و رفتار سازگاری استفاده می‌کند، اما headerهای attribution پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب providerها، refهای مدل، و رفتار failover.
  </Card>
  <Card title="Image generation" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب provider.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب provider.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات auth و قواعد استفادهٔ دوباره از credential.
  </Card>
</CardGroup>
