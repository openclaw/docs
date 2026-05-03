---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراکی Codex استفاده کنید
    - به رفتار اجرایی سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T11:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI برای مدل‌های GPT، APIهای توسعه‌دهنده ارائه می‌کند، و Codex نیز از طریق کلاینت‌های Codex شرکت OpenAI به‌عنوان عامل کدنویسی در طرح‌های ChatGPT در دسترس است. OpenClaw این سطح‌ها را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. بیشتر مشترکان ChatGPT/Codex که رفتار Codex را می‌خواهند باید از زمان اجرای بومی app-server مربوط به Codex استفاده کنند. پیشوند مدل، نام ارائه‌دهنده/مدل را انتخاب می‌کند؛ یک تنظیم زمان اجرای جداگانه تعیین می‌کند چه کسی حلقه عامل تعبیه‌شده را اجرا کند:

- **کلید API** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex با زمان اجرای بومی Codex** - ورود با ChatGPT/Codex به‌همراه اجرای app-server مربوط به Codex (مدل‌های `openai/*` به‌علاوه `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراک Codex از طریق PI** - ورود با ChatGPT/Codex با اجراکننده معمول OpenClaw PI (مدل‌های `openai-codex/*`)

OpenAI به‌طور صریح از استفاده OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم قاطی می‌شوند، پیش از تغییر پیکربندی، [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده کنید                                              | نکته‌ها                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-5.5` به‌علاوه `agentRuntime.id: "codex"` | پیکربندی پیشنهادی Codex برای بیشتر کاربران. با احراز هویت `openai-codex` وارد شوید. |
| صورت‌حساب مستقیم با کلید API                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا راه‌اندازی اولیه کلید API مربوط به OpenAI را اجرا کنید.                    |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI           | `openai-codex/gpt-5.5`                           | فقط وقتی استفاده کنید که عمدا اجراکننده معمول PI را می‌خواهید.                |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OpenAI Codex OAuth کار می‌کند.                 |
| تصاویر با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید.     |

## نقشه نام‌گذاری

نام‌ها مشابه‌اند اما قابل جایگزینی با یکدیگر نیستند:

| نامی که می‌بینید                       | لایه             | معنی                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده   | مسیر مستقیم API در OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده   | مسیر OpenAI Codex OAuth/اشتراک از طریق اجراکننده معمول OpenClaw PI.                      |
| Plugin `codex`                     | Plugin            | Plugin همراه OpenClaw که زمان اجرای بومی app-server مربوط به Codex و کنترل‌های چت `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل     | هارنس app-server بومی Codex را برای نوبت‌های تعبیه‌شده اجبار می‌کند.                                     |
| `/codex ...`                       | مجموعه فرمان‌های چت  | نخ‌های app-server مربوط به Codex را از داخل گفتگو متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP | مسیر پشتیبان صریح که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمدا هم `openai-codex/*` و هم Plugin `codex` را داشته باشد. وقتی می‌خواهید Codex OAuth از طریق PI باشد و همچنین کنترل‌های چت بومی `/codex` در دسترس باشند، این حالت معتبر است. `openclaw doctor` درباره این ترکیب هشدار می‌دهد تا بتوانید تأیید کنید که عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API در OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید. از `openai-codex/gpt-5.5` فقط برای Codex OAuth از طریق PI استفاده کنید، یا از `openai/gpt-5.5` بدون بازنویسی زمان اجرای Codex برای ترافیک مستقیم `OPENAI_API_KEY` استفاده کنید.
</Note>

<Note>
فعال‌سازی Plugin مربوط به OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin همراه app-server مربوط به Codex را فعال نمی‌کند. OpenClaw آن Plugin را فقط وقتی فعال می‌کند که هارنس بومی Codex را با `agentRuntime.id: "codex"` صراحتا انتخاب کنید یا از یک ارجاع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin همراه `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI حل شود، `openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر باقی می‌گذارد.
</Note>

## پوشش ویژگی‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                           | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| چت / Responses          | ارائه‌دهنده مدل `openai/<model>`                            | بله                                                    |
| مدل‌های اشتراک Codex | `openai-codex/<model>` با OAuth مربوط به `openai-codex`           | بله                                                    |
| هارنس app-server مربوط به Codex  | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جستجوی وب سمت سرور    | ابزار بومی OpenAI Responses                               | بله، وقتی جستجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای پین نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدیوها                    | `video_generate`                                           | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                  | بله                                                    |
| تبدیل گفتار به متن جریانی  | تماس صوتی `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ            | تماس صوتی `realtime.provider: "openai"` / گفتگوی Control UI | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                  | بله                                                    |

## Embeddings حافظه

OpenClaw می‌تواند از OpenAI، یا یک نقطه پایانی embedding سازگار با OpenAI، برای نمایه‌سازی `memory_search` و embeddings پرس‌وجو استفاده کند:

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

برای نقاط پایانی سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست ویژه ارائه‌دهنده با نام `input_type` ارسال می‌کند: embeddings پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین گزینه برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API را از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیم ارسال کنید:

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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | هارنس app-server مربوط به Codex    | app-server مربوط به Codex |

    <Note>
    `openai/*` مسیر مستقیم با کلید API مربوط به OpenAI است مگر این‌که صراحتا هارنس app-server مربوط به Codex را اجبار کنید. برای Codex OAuth از طریق اجراکننده پیش‌فرض PI از `openai-codex/*` استفاده کنید، یا برای اجرای بومی app-server مربوط به Codex از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید.
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
    **بهترین گزینه برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی app-server مربوط به Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود ChatGPT نیاز دارد.

    <Steps>
      <Step title="Codex OAuth را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیم اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های بدون head یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost، با جریان device-code مربوط به ChatGPT وارد شوید:

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

        پس از اجرای Gateway، برای بررسی زمان اجرای بومی app-server، در چت `/codex status` یا `/codex models` را ارسال کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | هارنس بومی app-server مربوط به Codex | ورود Codex یا پروفایل انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.4-mini` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI مگر این‌که یک Plugin صراحتا `openai-codex` را claim کند | ورود Codex |

    <Note>
    برای فرمان‌های احراز هویت/پروفایل، همچنان از شناسهٔ ارائه‌دهندهٔ `openai-codex` استفاده کنید. پیشوند مدل
    `openai-codex/*` نیز مسیر صریح PI برای Codex OAuth است.
    این پیشوند هارنس app-server بسته‌بندی‌شدهٔ Codex را انتخاب یا به‌طور خودکار فعال نمی‌کند. برای
    راه‌اندازی رایج اشتراک به‌همراه runtime بومی، با
    `openai-codex` وارد شوید اما مرجع مدل را `openai/gpt-5.5` نگه دارید و
    `agentRuntime.id: "codex"` را تنظیم کنید.
    </Note>

    ### نمونهٔ پیکربندی

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

    برای اینکه Codex OAuth به‌جای آن روی اجراکنندهٔ عادی PI بماند، از
    `openai-codex/gpt-5.5` استفاده کنید و بازنویسی runtime مربوط به Codex را حذف کنید.

    <Note>
    راه‌اندازی اولیه دیگر داده‌های OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان کد دستگاه در بالا وارد شوید؛ OpenClaw اعتبارنامه‌های حاصل را در مخزن احراز هویت agent خودش مدیریت می‌کند.
    </Note>

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام runtime مدل برای نشست فعلی فعال است.
    هارنس پیش‌فرض PI به‌صورت `Runtime: OpenClaw Pi Default` نمایش داده می‌شود. وقتی
    هارنس app-server بسته‌بندی‌شدهٔ Codex انتخاب شده باشد، `/status`
    `Runtime: OpenAI Codex` را نشان می‌دهد. نشست‌های موجود شناسهٔ هارنس ثبت‌شدهٔ خود را نگه می‌دارند، پس اگر می‌خواهید `/status`
    پس از تغییر `agentRuntime` انتخاب جدید PI/Codex را منعکس کند، از
    `/new` یا `/reset` استفاده کنید.

    ### هشدار doctor

    اگر Plugin بسته‌بندی‌شدهٔ `codex` فعال باشد در حالی که مسیر `openai-codex/*`
    انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل همچنان از طریق PI resolve می‌شود.
    فقط زمانی پیکربندی را بدون تغییر نگه دارید که آن مسیر احراز هویت اشتراکی PI
    عمدی باشد. وقتی اجرای بومی app-server مربوط به Codex را می‌خواهید، به
    `openai/<model>` به‌همراه `agentRuntime.id: "codex"` تغییر دهید.

    ### سقف پنجرهٔ زمینه

    OpenClaw فرادادهٔ مدل و سقف زمینهٔ runtime را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق Codex OAuth:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime برای `contextTokens`: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های بهتری از نظر تأخیر و کیفیت دارد. با `contextTokens` آن را بازنویسی کنید:

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

    OpenClaw وقتی فرادادهٔ کاتالوگ upstream مربوط به Codex برای `gpt-5.5`
    موجود باشد از آن استفاده می‌کند. اگر کشف زندهٔ Codex ردیف `openai-codex/gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجراهای cron، sub-agent و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت app-server بومی Codex

هارنس app-server بومی Codex از مراجع مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان مبتنی بر حساب است. OpenClaw
احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح OpenClaw `openai-codex` که به agent متصل شده است.
2. حساب موجود app-server، مانند ورود محلی Codex CLI ChatGPT.
3. فقط برای اجرای app-server محلی stdio، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

یعنی یک ورود اشتراکی محلی ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود
که فرایند Gateway نیز برای مدل‌های مستقیم OpenAI
یا embeddings دارای `OPENAI_API_KEY` است. fallback کلید API محیط فقط مسیر محلی stdio بدون حساب است؛ این کلید
به اتصال‌های WebSocket app-server ارسال نمی‌شود. وقتی یک پروفایل Codex
به‌سبک اشتراک انتخاب شده باشد، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند stdio app-server ایجادشده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin بسته‌بندی‌شدهٔ `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این ابزار هم تولید تصویر با کلید API OpenAI و هم تولید تصویر با Codex OAuth
را از طریق همان مرجع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                | کلید API OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                      | `OPENAI_API_KEY`                   | ورود OpenAI Codex OAuth           |
| انتقال                 | OpenAI Images API                  | backend مربوط به Codex Responses              |
| حداکثر تصویر در هر درخواست    | 4                                  | 4                                    |
| حالت ویرایش                 | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع)   |
| بازنویسی اندازه            | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K   | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K     |
| نسبت تصویر / وضوح | به OpenAI Images API ارسال نمی‌شود | در صورت ایمن بودن، به اندازهٔ پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover به [تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
</Note>

`gpt-image-2` پیش‌فرض هم برای تولید متن‌به‌تصویر OpenAI و هم برای
ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده هستند. برای خروجی PNG/WebP
با پس‌زمینهٔ شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
`background: "transparent"` را رد می‌کند.

برای درخواست پس‌زمینهٔ شفاف، agentها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینهٔ قدیمی ارائه‌دهندهٔ `openai.background`
هنوز پذیرفته می‌شود. OpenClaw همچنین از مسیرهای عمومی OpenAI و
OpenAI Codex OAuth محافظت می‌کند، به این شکل که درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2`
را به `gpt-image-1.5` بازنویسی می‌کند؛ endpointهای Azure و سفارشی سازگار با OpenAI
نام‌های deployment/model پیکربندی‌شدهٔ خود را نگه می‌دارند.

همین تنظیم برای اجرای CLI بدون رابط نیز ارائه شده است:

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
`--openai-background` همچنان به‌عنوان alias مخصوص OpenAI در دسترس است.

برای نصب‌های Codex OAuth، همان مرجع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth با `openai-codex` پیکربندی شده باشد، OpenClaw توکن دسترسی OAuth
ذخیره‌شده را resolve می‌کند و درخواست‌های تصویر را از طریق backend مربوط به Codex Responses ارسال می‌کند. ابتدا
`OPENAI_API_KEY` را امتحان نمی‌کند و برای آن
درخواست بی‌صدا به کلید API fallback نمی‌کند. وقتی مسیر مستقیم OpenAI Images API
را می‌خواهید، `models.providers.openai` را صراحتاً با یک کلید API،
base URL سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک آدرس LAN/private مورد اعتماد است، همچنین
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

## تولید ویدئو

Plugin بسته‌بندی‌شدهٔ `openai` تولید ویدئو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت       | مقدار                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض    | `openai/sora-2`                                                                   |
| حالت‌ها            | متن‌به‌ویدئو، تصویر‌به‌ویدئو، ویرایش تک‌ویدئو                                  |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدئو                                                                |
| بازنویسی اندازه   | پشتیبانی می‌شود                                                                         |
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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

## مشارکت prompt برای GPT-5

OpenClaw یک مشارکت prompt مشترک برای اجراهای خانوادهٔ GPT-5 در میان ارائه‌دهنده‌ها اضافه می‌کند. این مشارکت بر اساس شناسهٔ مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و دیگر مراجع سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x دریافت نمی‌کنند.

هارنس بومی بسته‌بندی‌شدهٔ Codex همان رفتار GPT-5 و overlay مربوط به Heartbeat را از طریق دستورالعمل‌های توسعه‌دهندهٔ app-server مربوط به Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` اجبار شده‌اند، همان راهنمایی پیگیری و Heartbeat فعالانه را نگه می‌دارند، حتی با اینکه Codex مالک باقی prompt هارنس است.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری persona، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و verification اضافه می‌کند. رفتار پاسخ مخصوص کانال و پیام بی‌صدا در prompt سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های مطابق فعال است. لایهٔ سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال کردن لایهٔ سبک تعامل دوستانه |
| `"on"`                 | Alias برای `"friendly"`                      |
| `"off"`                | فقط لایهٔ سبک دوستانه را غیرفعال می‌کند       |

<Tabs>
  <Tab title="Config">
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
`plugins.entries.openai.config.personality` قدیمی همچنان وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد، به‌عنوان fallback سازگاری خوانده می‌شود.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin بسته‌بندی‌شدهٔ `openai` سنتز گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای پیام‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |
    | URL پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | بدنه اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم نشده) |

    مدل‌های در دسترس: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای در دسترس: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشده توسط OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای endpointهای سازگار با OpenAI که به کلیدهای اضافی مانند `lang` نیاز دارند استفاده کنید. کلیدهای prototype نادیده گرفته می‌شوند.

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
    برای override کردن URL پایه TTS بدون اثرگذاری بر endpoint API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin همراه `openai`، گفتار به متن دسته‌ای را از طریق سطح رونویسی درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - endpoint: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - هرجا رونویسی صوتی ورودی از `tools.media.audio` استفاده کند، توسط OpenClaw پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای واداشتن OpenAI به استفاده در رونویسی صوتی ورودی:

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

    راهنمایی‌های زبان و prompt، وقتی توسط پیکربندی رسانه صوتی مشترک یا درخواست رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بی‌درنگ">
    Plugin همراه `openai` رونویسی بی‌درنگ را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم نشده) |
    | Prompt | `...openai.prompt` | (تنظیم نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صدای G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهنده streaming برای مسیر رونویسی بی‌درنگ تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بی‌درنگ">
    Plugin همراه `openai` صدای بی‌درنگ را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای bridgeهای بی‌درنگ backend پشتیبانی می‌کند. از فراخوانی دوطرفه ابزار پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    گفت‌وگوی Control UI از نشست‌های بی‌درنگ مرورگر OpenAI با یک client secret موقتی minted توسط Gateway و تبادل مستقیم WebRTC SDP مرورگر در برابر OpenAI Realtime API استفاده می‌کند. راستی‌آزمایی زنده نگه‌دارنده با `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` در دسترس است؛ بخش OpenAI یک client secret را در Node minted می‌کند، یک پیشنهاد SDP مرورگر با رسانه میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و پاسخ SDP را بدون ثبت secretها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## endpointهای Azure OpenAI

ارائه‌دهنده همراه `openai` می‌تواند با override کردن URL پایه، یک منبع Azure OpenAI را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام میزبان‌های Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار به شکل درخواست Azure تغییر می‌کند.

<Note>
صدای بی‌درنگ از یک مسیر پیکربندی جداگانه استفاده می‌کند (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) و تحت تاثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای بی‌درنگ** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

وقتی از Azure OpenAI استفاده کنید که:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به کنترل‌های اقامت داده منطقه‌ای یا انطباق که Azure ارائه می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده همراه `openai`، `models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را روی کلید Azure OpenAI تنظیم کنید (نه کلید OpenAI Platform):

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

برای درخواست‌های تولید تصویر روی یک میزبان Azure شناخته‌شده، OpenClaw:

- به‌جای `Authorization: Bearer` سرآیند `api-key` را ارسال می‌کند
- از مسیرهای scoped به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- به هر درخواست `?api-version=...` اضافه می‌کند
- برای فراخوانی‌های تولید تصویر Azure از timeout درخواست پیش‌فرض 600 ثانیه استفاده می‌کند.
  مقدارهای `timeoutMs` در هر فراخوانی همچنان این پیش‌فرض را override می‌کنند.

URLهای پایه دیگر (OpenAI عمومی، proxyهای سازگار با OpenAI) شکل استاندارد درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهنده `openai` به OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر `openai.baseUrl` سفارشی را مانند endpoint عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای تصویر Azure شکست می‌خورند.
</Note>

### نسخه API

برای pin کردن یک نسخه preview یا GA خاص Azure برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها bind می‌کند. برای درخواست‌های تولید تصویر Azure که از طریق ارائه‌دهنده همراه `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw باید **نام deployment Azure** باشد که در Azure portal پیکربندی کرده‌اید، نه شناسه مدل عمومی OpenAI.

اگر deploymentای به نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را سرو می‌کند:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده نام deployment برای فراخوانی‌های تولید تصویر که از طریق ارائه‌دهنده همراه `openai` مسیریابی می‌شوند نیز اعمال می‌شود.

### دسترسی منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از منطقه‌ها در دسترس است (برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`، `uaenorth`). پیش از ایجاد deployment، فهرست فعلی منطقه‌های Microsoft را بررسی کنید و تایید کنید که مدل مشخص در منطقه شما ارائه می‌شود.

### تفاوت‌های پارامتر

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند. Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی مقدارهای `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مدل خاصی در دسترس بگذارد. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه از OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعه پارامترهای پشتیبانی‌شده توسط deployment و نسخه API مشخص خود را در Azure portal بررسی کنید.

<Note>
Azure OpenAI از transport بومی و رفتار compat استفاده می‌کند اما سرآیندهای انتساب پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر سازگار با OpenAI** را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک چت یا Responses روی Azure (فراتر از تولید تصویر)، از جریان onboarding یا یک پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید — `openai.baseUrl` به‌تنهایی شکل API/auth مربوط به Azure را فعال نمی‌کند. یک ارائه‌دهنده جداگانه `azure-openai-responses/*` وجود دارد؛ آکاردئون Server-side compaction را در ادامه ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Transport (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` از رویکرد WebSocket-first با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست زودهنگام WebSocket را پیش از fallback به SSE دوباره تلاش می‌کند
    - پس از یک شکست، WebSocket را حدود 60 ثانیه degraded علامت‌گذاری می‌کند و در طول cool-down از SSE استفاده می‌کند
    - سرآیندهای پایدار هویت نشست و turn را برای retryها و reconnectها ضمیمه می‌کند
    - شمارنده‌های usage (`input_tokens` / `prompt_tokens`) را در variantهای transport نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، fallback به SSE |
    | `"sse"` | فقط SSE را اجباری کن |
    | `"websocket"` | فقط WebSocket را اجباری کن |

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
    OpenClaw برای کاهش latency اولین turn، گرم‌سازی WebSocket را به‌طور پیش‌فرض برای `openai/*` و `openai-codex/*` فعال می‌کند.

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
    OpenClaw یک toggle حالت سریع مشترک را برای `openai/*` و `openai-codex/*` ارائه می‌کند:

    - **چت/UI:** `/fast status|on|off`
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
    overrideهای نشست بر پیکربندی اولویت دارند. پاک کردن override نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده بازمی‌گرداند.
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
    `serviceTier` فقط به نقطه‌های پایانی بومی OpenAI (`api.openai.com`) و نقطه‌های پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از ارائه‌دهندگان را از طریق پروکسی مسیریابی کنید، OpenClaw مقدار `service_tier` را بدون تغییر باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش‌دهنده استریم Pi-harness در Plugin OpenAI به‌صورت خودکار Compaction سمت سرور را فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این مورد برای مسیر داخلی Pi harness و برای hookهای ارائه‌دهنده OpenAI که توسط اجراهای جاسازی‌شده استفاده می‌شوند اعمال می‌شود. harness بومی سرور برنامه Codex زمینه خود را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

    <Tabs>
      <Tab title="فعال‌سازی صریح">
        برای نقطه‌های پایانی سازگار مانند Azure OpenAI Responses مفید است:

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

  <Accordion title="حالت GPT سخت‌گیرانه-عاملی">
    برای اجراهای خانواده GPT-5 روی `openai/*`، OpenClaw می‌تواند از قرارداد اجرای جاسازی‌شده سخت‌گیرانه‌تری استفاده کند:

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
    - دیگر یک نوبت فقط شامل برنامه را، وقتی اقدام ابزاری در دسترس است، پیشرفت موفق تلقی نمی‌کند
    - نوبت را با هدایت برای اقدام فوری دوباره تلاش می‌کند
    - `update_plan` را برای کارهای قابل‌توجه به‌صورت خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام فقط برنامه‌ریزی کند، وضعیت مسدودشده صریحی را نمایش می‌دهد

    <Note>
    فقط به اجراهای خانواده GPT-5 در OpenAI و Codex محدود است. سایر ارائه‌دهندگان و خانواده‌های قدیمی‌تر مدل رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw با نقطه‌های پایانی مستقیم OpenAI، Codex و Azure OpenAI متفاوت از پروکسی‌های عمومی `/v1` سازگار با OpenAI رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا پروکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای ابزار را به‌صورت پیش‌فرض روی حالت سخت‌گیرانه تنظیم می‌کند
    - headerهای attribution پنهان را فقط روی میزبان‌های بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مخصوص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، راهنمایی‌های prompt-cache)

    **مسیرهای پروکسی/سازگار:**
    - از رفتار سازگاری آسان‌گیرانه‌تری استفاده می‌کند
    - `store` مربوط به Completions را از payloadهای غیربومی `openai-completions` حذف می‌کند
    - عبور مستقیم JSON پیشرفته `params.extra_body`/`params.extraBody` را برای پروکسی‌های Completions سازگار با OpenAI می‌پذیرد
    - `params.chat_template_kwargs` را برای پروکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرد
    - schemaهای سخت‌گیرانه ابزار یا headerهای فقط بومی را اجباری نمی‌کند

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما headerهای attribution پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قوانین استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
