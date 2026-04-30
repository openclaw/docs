---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراک Codex استفاده کنید
    - به رفتار اجرایی سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT ارائه می‌کند، و Codex نیز به‌عنوان یک عامل کدنویسیِ طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این
سطح‌ها را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. پیشوند مدل، مسیر
ارائه‌دهنده/احراز هویت را انتخاب می‌کند؛ یک تنظیم زمان اجرای جداگانه انتخاب می‌کند چه کسی حلقه
عامل تعبیه‌شده را اجرا کند:

- **کلید API** — دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex از طریق PI** — ورود ChatGPT/Codex با دسترسی اشتراکی (مدل‌های `openai-codex/*`)
- **مهار app-server متعلق به Codex** — اجرای بومی app-server متعلق به Codex (مدل‌های `openai/*` به‌همراه `agents.defaults.agentRuntime.id: "codex"`)

OpenAI صراحتا استفاده از OAuth اشتراکی را در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا، و کانال لایه‌های جداگانه‌اند. اگر این برچسب‌ها با هم
قاطی می‌شوند، پیش از تغییر پیکربندی [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                          | استفاده کنید از                                  | یادداشت‌ها                                                                    |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| صورت‌حساب مستقیم با کلید API                 | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا راه‌اندازی کلید API متعلق به OpenAI را اجرا کنید. |
| GPT-5.5 با احراز هویت اشتراک ChatGPT/Codex   | `openai-codex/gpt-5.5`                           | مسیر پیش‌فرض PI برای OAuth متعلق به Codex. بهترین انتخاب اولیه برای راه‌اندازی‌های اشتراکی. |
| GPT-5.5 با رفتار بومی app-server متعلق به Codex | `openai/gpt-5.5` به‌همراه `agentRuntime.id: "codex"` | مهار app-server متعلق به Codex را برای آن ارجاع مدل اجبار می‌کند. |
| تولید یا ویرایش تصویر                        | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OpenAI Codex OAuth کار می‌کند.                    |
| تصاویر با پس‌زمینه شفاف                      | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید. |

## نقشه نام‌گذاری

نام‌ها شبیه‌اند اما قابل جایگزینی نیستند:

| نامی که می‌بینید                    | لایه             | معنی                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده | مسیر مستقیم API متعلق به OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده | مسیر OpenAI Codex OAuth/اشتراک از طریق اجراکننده معمول PI در OpenClaw.                      |
| Plugin متعلق به `codex`            | Plugin            | Plugin بسته‌شده OpenClaw که زمان اجرای بومی app-server متعلق به Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل   | مهار بومی app-server متعلق به Codex را برای نوبت‌های تعبیه‌شده اجبار می‌کند.                                     |
| `/codex ...`                       | مجموعه فرمان گفت‌وگو | رشته‌های app-server متعلق به Codex را از یک مکالمه متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP     | مسیر جایگزین صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمدا هم `openai-codex/*` و هم Plugin
`codex` را داشته باشد. وقتی OAuth متعلق به Codex را از طریق PI می‌خواهید و همچنین می‌خواهید
کنترل‌های گفت‌وگوی بومی `/codex` در دسترس باشند، این معتبر است. `openclaw doctor` درباره آن
ترکیب هشدار می‌دهد تا بتوانید تایید کنید که عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API متعلق به OpenAI Platform و هم
مسیرهای اشتراک/OAuth در دسترس است. از `openai/gpt-5.5` برای ترافیک مستقیم
`OPENAI_API_KEY`، از `openai-codex/gpt-5.5` برای OAuth متعلق به Codex از طریق PI، یا
از `openai/gpt-5.5` همراه با `agentRuntime.id: "codex"` برای مهار بومی app-server
متعلق به Codex استفاده کنید.
</Note>

<Note>
فعال کردن Plugin متعلق به OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin بسته‌شده
app-server متعلق به Codex را فعال نمی‌کند. OpenClaw آن Plugin را فقط زمانی فعال می‌کند
که مهار بومی Codex را با
`agentRuntime.id: "codex"` صراحتا انتخاب کنید یا از یک ارجاع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin بسته‌شده `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI حل شود،
`openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر می‌گذارد.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI             | سطح OpenClaw                                               | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses       | ارائه‌دهنده مدل `openai/<model>`                          | بله                                                    |
| مدل‌های اشتراک Codex      | `openai-codex/<model>` با OAuth متعلق به `openai-codex`    | بله                                                    |
| مهار app-server متعلق به Codex | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جست‌وجوی وب سمت سرور      | ابزار بومی OpenAI Responses                               | بله، وقتی جست‌وجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای سنجاق نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدئوها                   | `video_generate`                                           | بله                                                    |
| متن به گفتار              | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                            | بله                                                    |
| گفتار به متن جریانی       | Voice Call `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ              | Voice Call `realtime.provider: "openai"` / گفت‌وگوی Control UI | بله                                                    |
| تعبیه‌ها                  | ارائه‌دهنده تعبیه حافظه                                   | بله                                                    |

## تعبیه‌های حافظه

OpenClaw می‌تواند از OpenAI، یا یک نقطه پایانی تعبیه سازگار با OpenAI، برای
نمایه‌سازی `memory_search` و تعبیه‌های پرس‌وجو استفاده کند:

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

برای نقطه‌های پایانی سازگار با OpenAI که به برچسب‌های تعبیه نامتقارن نیاز دارند،
`queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw
آن‌ها را به‌عنوان فیلدهای درخواست `input_type` ویژه ارائه‌دهنده ارسال می‌کند: تعبیه‌های پرس‌وجو از
`queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از
`documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

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

        یا کلید را مستقیما پاس بدهید:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل را بررسی کنید">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل             | پیکربندی زمان اجرا                    | مسیر                       | احراز هویت       |
    | ---------------------- | ------------------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | مهار app-server متعلق به Codex | app-server متعلق به Codex |

    <Note>
    `openai/*` مسیر مستقیم کلید API متعلق به OpenAI است، مگر اینکه مهار
    app-server متعلق به Codex را صراحتا اجبار کنید. از `openai-codex/*` برای OAuth متعلق به Codex از طریق
    اجراکننده پیش‌فرض PI استفاده کنید، یا از `openai/gpt-5.5` همراه با
    `agentRuntime.id: "codex"` برای اجرای بومی app-server متعلق به Codex استفاده کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw مدل `openai/gpt-5.3-codex-spark` را در معرض استفاده قرار نمی‌دهد. درخواست‌های زنده OpenAI API آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را ارائه نمی‌کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex خود به‌جای یک کلید API جداگانه. Codex cloud به ورود ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth متعلق به Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیما اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های بدون رابط یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost با جریان device-code متعلق به ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="مدل پیش‌فرض را تنظیم کنید">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="در دسترس بودن مدل را بررسی کنید">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.4-mini` | حذف‌شده / `runtime: "pi"` | ChatGPT/Codex OAuth از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI، مگر اینکه یک Plugin صراحتا مالکیت `openai-codex` را ادعا کند | ورود Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | مهار app-server متعلق به Codex | احراز هویت app-server متعلق به Codex |

    <Note>
    برای فرمان‌های احراز هویت/پروفایل، همچنان از شناسه ارائه‌دهنده `openai-codex` استفاده کنید. پیشوند مدل
    `openai-codex/*` نیز مسیر صریح PI برای OAuth متعلق به Codex است.
    این پیشوند مهار بسته‌شده app-server متعلق به Codex را انتخاب یا خودکار فعال نمی‌کند.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    راه‌اندازی دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان device-code بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در فروشگاه احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### نشانگر وضعیت

    گفت‌وگوی `/status` نشان می‌دهد کدام زمان اجرای مدل برای نشست فعلی فعال است.
    چارچوب اجرایی پیش‌فرض PI به‌صورت `Runtime: OpenClaw Pi Default` نمایش داده می‌شود. وقتی
    چارچوب اجرایی app-server بسته‌شده Codex انتخاب شده باشد، `/status` مقدار
    `Runtime: OpenAI Codex` را نشان می‌دهد. نشست‌های موجود شناسه چارچوب اجرایی ثبت‌شده خود را نگه می‌دارند، بنابراین اگر می‌خواهید پس از تغییر `agentRuntime`، `/status`
    انتخاب جدید PI/Codex را نشان دهد، از `/new` یا `/reset` استفاده کنید.

    ### هشدار Doctor

    اگر Plugin بسته‌شده `codex` در حالی فعال باشد که مسیر
    `openai-codex/*` این زبانه انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل
    همچنان از طریق PI resolve می‌شود. وقتی این همان مسیر احراز هویت اشتراکی مورد نظر است، پیکربندی را بدون تغییر نگه دارید. فقط زمانی به `openai/<model>` به‌همراه
    `agentRuntime.id: "codex"` جابه‌جا شوید که اجرای app-server بومی Codex را می‌خواهید.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه زمان اجرا را به‌عنوان مقدارهای جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق Codex OAuth:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض `contextTokens` زمان اجرا: `272000`

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
    برای اعلام فراداده بومی مدل از `contextWindow` استفاده کنید. برای محدود کردن بودجه زمینه زمان اجرا از `contextTokens` استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ upstream Codex برای `gpt-5.5` وجود داشته باشد، از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `openai-codex/gpt-5.5` را در حالی حذف کند که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا اجراهای
    cron، زیرعامل و مدل پیش‌فرض پیکربندی‌شده با خطای
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت app-server بومی Codex

چارچوب اجرایی app-server بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان مبتنی بر حساب است. OpenClaw
احراز هویت را با این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح `openai-codex` در OpenClaw که به عامل متصل شده باشد.
2. حساب موجود app-server، مانند ورود محلی Codex CLI ChatGPT.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی ورود اشتراکی محلی ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود که فرایند Gateway برای مدل‌های مستقیم OpenAI
یا embeddings نیز `OPENAI_API_KEY` دارد. بازگشت به کلید API از env فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های app-server از نوع WebSocket ارسال نمی‌شود. وقتی یک پروفایل Codex
به سبک اشتراکی انتخاب شده باشد، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند app-server stdio ایجادشده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin بسته‌شده `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این Plugin هم تولید تصویر با کلید API OpenAI و هم تولید تصویر با Codex OAuth را
از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت | کلید API OpenAI | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل | `openai/gpt-image-2` | `openai/gpt-image-2` |
| احراز هویت | `OPENAI_API_KEY` | ورود OpenAI Codex OAuth |
| انتقال | OpenAI Images API | backend پاسخ‌های Codex |
| بیشینه تصاویر در هر درخواست | 4 | 4 |
| حالت ویرایش | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع) |
| بازنویسی‌های اندازه | پشتیبانی می‌شود، از جمله اندازه‌های 2K/4K | پشتیبانی می‌شود، از جمله اندازه‌های 2K/4K |
| نسبت تصویر / وضوح | به OpenAI Images API ارسال نمی‌شود | در صورت امن بودن به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب provider و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض هم برای تولید متن‌به‌تصویر OpenAI و هم برای
ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1` و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده‌اند. برای خروجی PNG/WebP با پس‌زمینه شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
گزینه `background: "transparent"` را رد می‌کند.

برای یک درخواست با پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"` و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی provider یعنی `openai.background`
همچنان پذیرفته می‌شود. OpenClaw همچنین مسیرهای عمومی OpenAI و
OpenAI Codex OAuth را با بازنویسی درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2`
به `gpt-image-1.5` محافظت می‌کند؛ endpointهای Azure و سفارشی سازگار با OpenAI
نام‌های deployment/مدل پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجراهای CLI بدون رابط نیز در دسترس است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

وقتی از یک فایل ورودی شروع می‌کنید، همین پرچم‌های `--output-format` و `--background` را با
`openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان یک alias مخصوص OpenAI در دسترس است.

برای نصب‌های Codex OAuth، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth از نوع `openai-codex` پیکربندی شده باشد، OpenClaw آن access token ذخیره‌شده OAuth را resolve می‌کند و درخواست‌های تصویر را از طریق backend پاسخ‌های Codex ارسال می‌کند. برای آن
درخواست ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند یا بی‌صدا به یک کلید API برنمی‌گردد. وقتی مسیر مستقیم OpenAI Images API
را می‌خواهید، `models.providers.openai` را صریحا با یک کلید API،
URL پایه سفارشی یا endpoint Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک نشانی LAN/خصوصی مورد اعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw
endpointهای تصویر خصوصی/داخلی سازگار با OpenAI را مسدود نگه می‌دارد مگر اینکه این opt-in
وجود داشته باشد.

تولید:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تولید یک PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

ویرایش:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## تولید ویدیو

Plugin بسته‌شده `openai` تولید ویدیو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت | مقدار |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض | `openai/sora-2` |
| حالت‌ها | متن‌به‌ویدیو، تصویر‌به‌ویدیو، ویرایش تک‌ویدیو |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدیو |
| بازنویسی‌های اندازه | پشتیبانی می‌شود |
| بازنویسی‌های دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` با یک هشدار ابزار نادیده گرفته می‌شوند |

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
برای پارامترهای مشترک ابزار، انتخاب provider و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت پرامپت GPT-5

OpenClaw یک مشارکت پرامپت مشترک GPT-5 برای اجراهای خانواده GPT-5 در providerهای مختلف اضافه می‌کند. این بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5` و سایر ارجاع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x این را دریافت نمی‌کنند.

چارچوب اجرایی بومی Codex بسته‌شده از همان رفتار GPT-5 و overlay مربوط به Heartbeat از طریق دستورالعمل‌های توسعه‌دهنده app-server در Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که با `agentRuntime.id: "codex"` از مسیر Codex عبور داده شده‌اند، همان راهنمایی پیگیری و Heartbeat پیش‌دستانه را نگه می‌دارند، هرچند Codex مالک بقیه پرامپت چارچوب اجرایی است.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای تداوم پرسونا، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌گویی مخصوص کانال و پیام‌های خاموش در پرامپت سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های منطبق فعال است. لایه سبک تعامل دوستانه جداگانه و قابل پیکربندی است.

| مقدار | اثر |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | لایه سبک تعامل دوستانه را فعال می‌کند |
| `"on"` | Alias برای `"friendly"` |
| `"off"` | فقط لایه سبک دوستانه را غیرفعال می‌کند |

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
مقدارها در زمان اجرا به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
گزینه قدیمی `plugins.entries.openai.config.personality` همچنان به‌عنوان fallback سازگاری خوانده می‌شود، وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="ترکیب گفتار (TTS)">
    Plugin بسته‌شده `openai` ترکیب گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای یادداشت‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` fallback می‌کند |
    | URL پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    برای بازنویسی URL پایه TTS بدون تأثیر بر endpoint چت API، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin بسته‌شده `openai` گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - endpoint: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - هرجا که رونویسی صوتی ورودی از `tools.media.audio` استفاده می‌کند، توسط OpenClaw پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار OpenAI برای رونویسی صدای ورودی:

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

    وقتی راهنماهای زبان و پرامپت از سوی پیکربندی رسانه‌ی صوتی مشترک یا درخواست
    رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin بسته‌بندی‌شده‌ی `openai` رونویسی بلادرنگ را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | پرامپت | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه‌ی VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |

    <Note>
    از یک اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صدای G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهنده‌ی جریانی برای مسیر رونویسی بلادرنگ تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin بسته‌بندی‌شده‌ی `openai` صدای بلادرنگ را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانه‌ی VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای پل‌های بلادرنگ سمت بک‌اند پشتیبانی می‌کند. از فراخوانی ابزار دوسویه پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    گفت‌وگوی UI کنترل از نشست‌های بلادرنگ مرورگر OpenAI با راز موقت کلاینت
    صادرشده توسط Gateway و تبادل مستقیم WebRTC SDP مرورگر با OpenAI Realtime API
    استفاده می‌کند. راستی‌آزمایی زنده‌ی نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ بخش OpenAI یک راز کلاینت را در Node صادر می‌کند، یک پیشنهاد SDP مرورگر
    با رسانه‌ی میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند و پاسخ SDP را
    بدون ثبت اسرار اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## نقطه‌های پایانی Azure OpenAI

ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای
تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام‌های میزبان Azure را در
`models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار به شکل درخواست
Azure تغییر می‌کند.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای بلادرنگ**
را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI زمانی استفاده کنید که:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت داده‌ی منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai`،
`models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را به
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

OpenClaw این پسوندهای میزبان Azure را برای مسیر تولید تصویر Azure تشخیص می‌دهد:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

برای درخواست‌های تولید تصویر روی میزبان Azure شناخته‌شده، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای محدود به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- به هر درخواست `?api-version=...` اضافه می‌کند
- برای فراخوانی‌های تولید تصویر Azure از مهلت زمانی پیش‌فرض درخواست ۶۰۰ ثانیه استفاده می‌کند.
  مقدارهای `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایه‌ی دیگر (OpenAI عمومی، پراکسی‌های سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را نگه می‌دارند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهنده‌ی `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند نقطه‌ی پایانی عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای
تصویر Azure شکست می‌خورند.
</Note>

### نسخه‌ی API

برای ثابت‌کردن یک نسخه‌ی preview یا GA مشخص Azure برای مسیر تولید تصویر Azure،
`AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها همان نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw
باید **نام deployment در Azure** باشد که در پورتال Azure پیکربندی کرده‌اید، نه
شناسه‌ی مدل عمومی OpenAI.

اگر deploymentای به نام `gpt-image-2-prod` بسازید که `gpt-image-2` را ارائه می‌کند:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده‌ی نام deployment برای فراخوانی‌های تولید تصویر که از طریق
ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` مسیریابی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد deployment، فهرست فعلی مناطق Microsoft را بررسی کنید
و تأیید کنید که مدل مشخص در منطقه‌ی شما ارائه می‌شود.

### تفاوت‌های پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی اجازه می‌دهد رد کند (برای مثال برخی
مقدارهای `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مشخص مدل
ارائه کند. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعه‌ی پارامترهای
پشتیبانی‌شده توسط deployment و نسخه‌ی API مشخص خود را در پورتال
Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما
سرآیندهای انتساب پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک chat یا Responses روی Azure (فراتر از تولید تصویر)، از
جریان onboarding یا پیکربندی ارائه‌دهنده‌ی اختصاصی Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/auth Azure را انتخاب نمی‌کند. یک ارائه‌دهنده‌ی جداگانه‌ی
`azure-openai-responses/*` وجود دارد؛ آکاردئون compaction سمت سرور را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` از WebSocket-first با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست زودهنگام WebSocket را پیش از fallback به SSE دوباره تلاش می‌کند
    - پس از شکست، WebSocket را برای حدود ۶۰ ثانیه degraded علامت‌گذاری می‌کند و طی زمان cool-down از SSE استفاده می‌کند
    - برای تلاش‌های دوباره و اتصال‌های مجدد، سرآیندهای پایدار هویت نشست و نوبت را پیوست می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را میان گونه‌های انتقال نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، fallback به SSE |
    | `"sse"` | فقط SSE را اجباری می‌کند |
    | `"websocket"` | فقط WebSocket را اجباری می‌کند |

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
    OpenClaw گرم‌سازی WebSocket را به‌طور پیش‌فرض برای `openai/*` و `openai-codex/*` فعال می‌کند تا تأخیر نوبت اول را کاهش دهد.

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
    OpenClaw یک سوییچ مشترک حالت سریع برای `openai/*` و `openai-codex/*` ارائه می‌کند:

    - **Chat/UI:** `/fast status|on|off`
    - **پیکربندی:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI نگاشت می‌کند (`service_tier = "priority"`). مقدارهای موجود `service_tier` حفظ می‌شوند و حالت سریع `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند.

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
    بازنویسی‌های نشست بر پیکربندی مقدم‌اند. پاک‌کردن بازنویسی نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را برای هر مدل در OpenClaw تنظیم کنید:

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
    `serviceTier` فقط به نقطه‌های پایانی بومی OpenAI (`api.openai.com`) و نقطه‌های پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از ارائه‌دهنده‌ها را از طریق پراکسی مسیریابی کنید، OpenClaw `service_tier` را دست‌نخورده می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش‌دهنده‌ی جریان Pi-harness مربوط به Plugin OpenAI به‌طور خودکار compaction سمت سرور را فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - `compact_threshold` پیش‌فرض: ۷۰٪ از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این برای مسیر Pi harness داخلی و برای hookهای ارائه‌دهنده‌ی OpenAI که توسط اجراهای embedded استفاده می‌شوند اعمال می‌شود. harness بومی سرور اپ Codex زمینه‌ی خودش را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

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
      <Tab title="آستانهٔ سفارشی">
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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجبار می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت strict-agentic در GPT">
    برای اجراهای خانوادهٔ GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای تعبیه‌شدهٔ سخت‌گیرانه‌تر استفاده کند:

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
    - وقتی یک اقدام ابزاری در دسترس است، دیگر یک نوبت فقط شامل طرح را پیشرفت موفق تلقی نمی‌کند
    - نوبت را با یک هدایت برای اقدام فوری دوباره تلاش می‌کند
    - برای کارهای قابل‌توجه `update_plan` را به‌طور خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام فقط برنامه‌ریزی کند، یک وضعیت مسدودشدهٔ صریح را نمایش می‌دهد

    <Note>
    فقط به اجراهای OpenAI و Codex از خانوادهٔ GPT-5 محدود است. ارائه‌دهندگان دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw نقاط پایانی مستقیم OpenAI، Codex، و Azure OpenAI را متفاوت از پراکسی‌های عمومی سازگار با OpenAI در `/v1` در نظر می‌گیرد:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - استدلال غیرفعال را برای مدل‌ها یا پراکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - طرح‌واره‌های ابزار را به‌طور پیش‌فرض روی حالت سخت‌گیرانه می‌گذارد
    - سرآیندهای انتساب پنهان را فقط روی میزبان‌های بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مختص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری استدلال، راهنمایی‌های کش اعلان)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کنند
    - `store` در Completions را از payloadهای غیربومی `openai-completions` حذف می‌کنند
    - عبور JSON پیشرفتهٔ `params.extra_body`/`params.extraBody` را برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - طرح‌واره‌های ابزار سخت‌گیرانه یا سرآیندهای فقط بومی را اجبار نمی‌کنند

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما سرآیندهای انتساب پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ دوباره از اعتبارنامه.
  </Card>
</CardGroup>
