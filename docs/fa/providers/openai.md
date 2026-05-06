---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراک Codex استفاده کنید
    - شما به رفتار اجرای عامل GPT-5 سخت‌گیرانه‌تری نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT فراهم می‌کند، و Codex نیز به‌عنوان یک عامل کدنویسی مبتنی بر طرح ChatGPT از طریق کلاینت‌های Codex شرکت OpenAI در دسترس است. OpenClaw این سطوح را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از سه مسیر خانواده OpenAI پشتیبانی می‌کند. بیشتر مشترکان ChatGPT/Codex که رفتار Codex را می‌خواهند باید از زمان اجرای بومی سرور برنامه Codex استفاده کنند. پیشوند مدل، نام ارائه‌دهنده/مدل را انتخاب می‌کند؛ یک تنظیم زمان اجرای جداگانه انتخاب می‌کند چه کسی حلقه عامل جاسازی‌شده را اجرا کند:

- **کلید API** - دسترسی مستقیم OpenAI Platform با صورت‌حساب مبتنی بر مصرف (مدل‌های `openai/*`)
- **اشتراک Codex با زمان اجرای بومی Codex** - ورود به ChatGPT/Codex به‌همراه اجرای سرور برنامه Codex (مدل‌های `openai/*` به‌علاوه `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراک Codex از طریق PI** - ورود به ChatGPT/Codex با اجراکننده معمول OpenClaw PI (مدل‌های `openai-codex/*`)

OpenAI به‌صراحت از کاربرد OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان اجرا و کانال لایه‌های جداگانه‌اند. اگر این برچسب‌ها با هم مخلوط می‌شوند، پیش از تغییر پیکربندی [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده                                          | یادداشت‌ها                                                                  |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-5.5` به‌علاوه `agentRuntime.id: "codex"` | راه‌اندازی پیشنهادی Codex برای بیشتر کاربران. با احراز هویت `openai-codex` وارد شوید. |
| صورت‌حساب مستقیم با کلید API                               | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` را تنظیم کنید یا راه‌اندازی کلید API OpenAI را اجرا کنید.                    |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI           | `openai-codex/gpt-5.5`                           | فقط زمانی استفاده کنید که عمداً اجراکننده معمول PI را می‌خواهید.                |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                             | با `OPENAI_API_KEY` یا OpenAI Codex OAuth کار می‌کند.                 |
| تصاویر با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                           | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید.     |

## نقشه نام‌گذاری

نام‌ها شبیه‌اند اما قابل جایگزینی نیستند:

| نامی که می‌بینید                       | لایه             | معنا                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده   | مسیر مستقیم API OpenAI Platform.                                                                 |
| `openai-codex`                     | پیشوند ارائه‌دهنده   | مسیر OAuth/اشتراک OpenAI Codex از طریق اجراکننده معمول OpenClaw PI.                      |
| Plugin `codex`                     | Plugin            | Plugin همراه OpenClaw که زمان اجرای بومی سرور برنامه Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | زمان اجرای عامل     | اجبار به استفاده از مهارکننده بومی سرور برنامه Codex برای نوبت‌های جاسازی‌شده.                                     |
| `/codex ...`                       | مجموعه فرمان‌های گفت‌وگو  | اتصال/کنترل رشته‌های سرور برنامه Codex از داخل یک مکالمه.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر نشست ACP | مسیر پشتیبان صریح که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمداً هم `openai-codex/*` و هم Plugin `codex` را داشته باشد. زمانی معتبر است که OAuth Codex را از طریق PI می‌خواهید و همچنین می‌خواهید کنترل‌های گفت‌وگوی بومی `/codex` در دسترس باشند. `openclaw doctor` درباره این ترکیب هشدار می‌دهد تا بتوانید تأیید کنید که عمدی است؛ آن را بازنویسی نمی‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API در OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید. از `openai-codex/gpt-5.5` فقط برای OAuth Codex از طریق PI استفاده کنید، یا از `openai/gpt-5.5` بدون بازنویسی زمان اجرای Codex برای ترافیک مستقیم `OPENAI_API_KEY` استفاده کنید.
</Note>

<Note>
فعال کردن Plugin OpenAI، یا انتخاب یک مدل `openai-codex/*`، Plugin همراه سرور برنامه Codex را فعال نمی‌کند. OpenClaw آن Plugin را فقط زمانی فعال می‌کند که مهارکننده بومی Codex را با `agentRuntime.id: "codex"` صراحتاً انتخاب کنید یا از مرجع مدل قدیمی `codex/*` استفاده کنید.
اگر Plugin همراه `codex` فعال باشد اما `openai-codex/*` همچنان از طریق PI resolve شود، `openclaw doctor` هشدار می‌دهد و مسیر را بدون تغییر باقی می‌گذارد.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                           | وضعیت                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses          | ارائه‌دهنده مدل `openai/<model>`                            | بله                                                    |
| مدل‌های اشتراک Codex | `openai-codex/<model>` با OAuth `openai-codex`           | بله                                                    |
| مهارکننده سرور برنامه Codex  | `openai/<model>` با `agentRuntime.id: codex`             | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                               | بله، وقتی جست‌وجوی وب فعال باشد و ارائه‌دهنده‌ای پین نشده باشد |
| تصاویر                    | `image_generate`                                           | بله                                                    |
| ویدیوها                    | `video_generate`                                           | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                  | بله                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                  | بله                                                    |
| تبدیل گفتار به متن جریانی  | Voice Call `streaming.provider: "openai"`                  | بله                                                    |
| صدای بلادرنگ            | Voice Call `realtime.provider: "openai"` / Control UI Talk | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                  | بله                                                    |

## Embeddingهای حافظه

OpenClaw می‌تواند از OpenAI، یا یک endpoint سازگار با OpenAI برای embedding، جهت نمایه‌سازی `memory_search` و embeddingهای پرس‌وجو استفاده کند:

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

برای endpointهای سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست اختصاصی ارائه‌دهنده با نام `input_type` ارسال می‌کند: embeddingهای پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API را از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) ایجاد یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیماً ارسال کنید:

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

    | مرجع مدل              | پیکربندی زمان اجرا             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | حذف‌شده / `agentRuntime.id: "pi"`    | API مستقیم OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | مهارکننده سرور برنامه Codex    | سرور برنامه Codex |

    <Note>
    `openai/*` مسیر مستقیم کلید API OpenAI است، مگر اینکه صراحتاً مهارکننده سرور برنامه Codex را مجبور کنید. از `openai-codex/*` برای OAuth Codex از طریق اجراکننده پیش‌فرض PI استفاده کنید، یا از `openai/gpt-5.5` با `agentRuntime.id: "codex"` برای اجرای بومی سرور برنامه Codex استفاده کنید.
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
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex با اجرای بومی سرور برنامه Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیماً اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost با جریان کد دستگاه ChatGPT وارد شوید:

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
      <Step title="در دسترس بودن احراز هویت Codex را تأیید کنید">
        ```bash
        openclaw models list --provider openai-codex
        ```

        پس از اجرای gateway، `/codex status` یا `/codex models` را در گفت‌وگو ارسال کنید تا زمان اجرای بومی سرور برنامه را تأیید کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | مرجع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | مهارکننده بومی سرور برنامه Codex | ورود Codex یا پروفایل انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | حذف‌شده / `runtime: "pi"` | OAuth ChatGPT/Codex از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.4-mini` | حذف‌شده / `runtime: "pi"` | OAuth ChatGPT/Codex از طریق PI | ورود Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | همچنان PI، مگر اینکه یک Plugin صراحتاً `openai-codex` را claim کند | ورود Codex |

    <Warning>
    مراجع مدل قدیمی‌تر `openai-codex/gpt-5.1*`، `openai-codex/gpt-5.2*`، یا `openai-codex/gpt-5.3*` را پیکربندی نکنید. حساب‌های OAuth ChatGPT/Codex اکنون آن مدل‌ها را رد می‌کنند. از `openai-codex/gpt-5.5` برای مسیر OAuth از طریق PI استفاده کنید، یا از `openai/gpt-5.5` با `agentRuntime.id: "codex"` برای اجرای زمان اجرای بومی Codex استفاده کنید.
    </Warning>

    <Note>
    برای فرمان‌های احراز هویت/نمایه، همچنان از شناسه ارائه‌دهنده `openai-codex` استفاده کنید. پیشوند مدل
    `openai-codex/*` نیز مسیر صریح PI برای OAuth مربوط به Codex است.
    این گزینه harness سرور برنامه Codex همراه را انتخاب یا به‌صورت خودکار فعال نمی‌کند. برای
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

    برای نگه داشتن OAuth مربوط به Codex روی runner معمول PI به‌جای آن، از
    `openai-codex/gpt-5.5` استفاده کنید و override مربوط به runtime Codex را حذف کنید.

    <Note>
    فرایند onboarding دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان کد دستگاه بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در مخزن احراز هویت agent خودش مدیریت می‌کند.
    </Note>

    ### بررسی و بازیابی مسیریابی OAuth مربوط به Codex

    از این فرمان‌ها استفاده کنید تا ببینید agent پیش‌فرض شما از کدام مدل، runtime و مسیر احراز هویت استفاده می‌کند:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    برای یک agent مشخص، `--agent <id>` را اضافه کنید:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    اگر اجرای `doctor --fix` در نسخه 2026.5.5 یک راه‌اندازی اشتراک GPT-5.5 را از
    `openai-codex/gpt-5.5` به `openai/gpt-5.5` تغییر داده است، agent پیش‌فرض را دوباره
    به مسیر PI مربوط به OAuth مربوط به Codex برگردانید:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    اگر `models auth list --provider openai-codex` هیچ نمایه قابل استفاده‌ای نشان نمی‌دهد، دوباره وارد شوید:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` یعنی OAuth مربوط به ChatGPT/Codex از طریق PI. `openai/*` با
    `agentRuntime.id: "codex"` یعنی اجرای بومی سرور برنامه Codex.

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام runtime مدل برای نشست فعلی فعال است.
    harness پیش‌فرض PI به‌صورت `Runtime: OpenClaw Pi Default` نمایش داده می‌شود. وقتی
    harness سرور برنامه Codex همراه انتخاب شده باشد، `/status` مقدار
    `Runtime: OpenAI Codex` را نشان می‌دهد. نشست‌های موجود شناسه harness ثبت‌شده خود را نگه می‌دارند، بنابراین پس از تغییر `agentRuntime` از
    `/new` یا `/reset` استفاده کنید اگر می‌خواهید `/status` انتخاب جدید PI/Codex را بازتاب دهد.

    ### هشدار Doctor

    اگر Plugin همراه `codex` فعال باشد در حالی که یک مسیر `openai-codex/*`
    انتخاب شده است، `openclaw doctor` هشدار می‌دهد که مدل همچنان از طریق PI resolve می‌شود.
    فقط زمانی پیکربندی را بدون تغییر نگه دارید که آن مسیر احراز هویت اشتراکی PI
    عمدی باشد. وقتی اجرای بومی سرور برنامه Codex را می‌خواهید، به
    `openai/<model>` به‌همراه `agentRuntime.id: "codex"` تغییر دهید.

    ### سقف پنجره context

    OpenClaw فراداده مدل و سقف context مربوط به runtime را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai-codex/gpt-5.5` از طریق OAuth مربوط به Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime برای `contextTokens`: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های latency و کیفیت بهتری دارد. آن را با `contextTokens` override کنید:

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
    از `contextWindow` برای اعلام فراداده بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجه context مربوط به runtime استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ upstream مربوط به Codex برای `gpt-5.5`
    وجود داشته باشد، از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `openai-codex/gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجراهای Cron، sub-agent و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت سرور برنامه بومی Codex

harness سرور برنامه بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه
`agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان مبتنی بر حساب است. OpenClaw
احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک نمایه احراز هویت صریح OpenClaw برای `openai-codex` که به agent متصل شده باشد.
2. حساب موجود سرور برنامه، مانند ورود محلی Codex CLI به ChatGPT.
3. فقط برای راه‌اندازی‌های سرور برنامه stdio محلی، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی سرور برنامه هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی ورود محلی اشتراک ChatGPT/Codex فقط به این دلیل که فرایند Gateway همچنین `OPENAI_API_KEY` برای مدل‌های مستقیم OpenAI
یا embeddingها دارد، جایگزین نمی‌شود. fallback کلید API در env فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های WebSocket سرور برنامه ارسال نمی‌شود. وقتی یک نمایه Codex
با سبک اشتراکی انتخاب شده باشد، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند سرور برنامه stdio تولیدشده خارج نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود سرور برنامه ارسال می‌کند.

## تولید تصویر

Plugin همراه `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این گزینه هم تولید تصویر با کلید API OpenAI و هم تولید تصویر با OAuth مربوط به Codex را
از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                  | کلید API OpenAI                         | OAuth مربوط به Codex                   |
| ----------------------- | --------------------------------------- | -------------------------------------- |
| ارجاع مدل               | `openai/gpt-image-2`                    | `openai/gpt-image-2`                   |
| احراز هویت              | `OPENAI_API_KEY`                        | ورود OAuth مربوط به OpenAI Codex       |
| انتقال                  | API تصاویر OpenAI                       | backend پاسخ‌های Codex                 |
| بیشینه تصاویر در هر درخواست | 4                                       | 4                                      |
| حالت ویرایش             | فعال (تا 5 تصویر مرجع)                  | فعال (تا 5 تصویر مرجع)                 |
| overrideهای اندازه      | پشتیبانی می‌شود، از جمله اندازه‌های 2K/4K | پشتیبانی می‌شود، از جمله اندازه‌های 2K/4K |
| نسبت تصویر / وضوح       | به API تصاویر OpenAI ارسال نمی‌شود      | وقتی امن باشد به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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

`gpt-image-2` پیش‌فرض هم برای تولید متن‌به‌تصویر OpenAI و هم برای ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1` و `gpt-image-1-mini` همچنان به‌عنوان
overrideهای صریح مدل قابل استفاده هستند. برای خروجی PNG/WebP با پس‌زمینه شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
`background: "transparent"` را رد می‌کند.

برای یک درخواست با پس‌زمینه شفاف، agentها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی ارائه‌دهنده `openai.background`
همچنان پذیرفته می‌شود. OpenClaw همچنین از مسیرهای عمومی OpenAI و
OAuth مربوط به OpenAI Codex محافظت می‌کند، به این صورت که درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2`
را به `gpt-image-1.5` بازنویسی می‌کند؛ Azure و endpointهای سفارشی سازگار با OpenAI
نام‌های deployment/model پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجراهای headless در CLI نیز ارائه می‌شود:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همان پرچم‌های `--output-format` و `--background` را با
`openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان یک alias ویژه OpenAI در دسترس است.

برای نصب‌های OAuth مربوط به Codex، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک
نمایه OAuth برای `openai-codex` پیکربندی شده باشد، OpenClaw آن access token ذخیره‌شده OAuth را resolve می‌کند
و درخواست‌های تصویر را از طریق backend پاسخ‌های Codex ارسال می‌کند. برای آن
درخواست ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند یا بی‌صدا به یک کلید API fallback نمی‌کند.
وقتی مسیر مستقیم API تصاویر OpenAI را می‌خواهید، `models.providers.openai` را صریحا با یک کلید API،
URL پایه سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.
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

Plugin همراه `openai` تولید ویدیو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت          | مقدار                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| مدل پیش‌فرض      | `openai/sora-2`                                                                    |
| حالت‌ها          | متن‌به‌ویدیو، تصویر‌به‌ویدیو، ویرایش تک‌ویدیو                                     |
| ورودی‌های مرجع   | 1 تصویر یا 1 ویدیو                                                                 |
| overrideهای اندازه | پشتیبانی می‌شود                                                                  |
| overrideهای دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` با هشدار ابزار نادیده گرفته می‌شوند |

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

OpenClaw یک مشارکت prompt مشترک GPT-5 برای اجراهای خانواده GPT-5 در میان ارائه‌دهنده‌ها اضافه می‌کند. این مورد بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai-codex/gpt-5.5`، `openai/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5` و سایر ارجاع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x دریافت نمی‌کنند.

harness بومی Codex همراه از همان رفتار GPT-5 و overlay مربوط به Heartbeat از طریق دستورالعمل‌های developer سرور برنامه Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` مجبور شده‌اند، همان راهنمایی پیگیری و Heartbeat proactive را نگه می‌دارند، حتی اگر Codex مالک بقیه prompt harness باشد.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری persona، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌دهی ویژه کانال و پیام‌های بی‌صدا در prompt سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمایی GPT-5 همیشه برای مدل‌های منطبق فعال است. لایه سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | --------------------------------------- |
| `"friendly"` (پیش‌فرض) | لایه سبک تعامل دوستانه را فعال می‌کند |
| `"on"`                 | alias برای `"friendly"`                 |
| `"off"`                | فقط لایه سبک دوستانه را غیرفعال می‌کند |

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
`plugins.entries.openai.config.personality` قدیمی همچنان به‌عنوان جایگزین سازگاری خوانده می‌شود، وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
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
    | بدنه اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم‌نشده) |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشده OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای endpointهای سازگار با OpenAI استفاده کنید که به کلیدهای اضافی مانند `lang` نیاز دارند. کلیدهای prototype نادیده گرفته می‌شوند.

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
    برای بازنویسی URL پایه TTS بدون اثر گذاشتن بر endpoint API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin همراه `openai` گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI با مسیر `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - پشتیبانی‌شده در OpenClaw هرجا که رونویسی صوت ورودی از
      `tools.media.audio` استفاده کند، از جمله بخش‌های کانال صوتی Discord و
      پیوست‌های صوتی کانال

    برای اجبار OpenAI برای رونویسی صوت ورودی:

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

    اشاره‌های زبان و پرامپت وقتی توسط پیکربندی مشترک رسانه صوتی یا درخواست رونویسی
    هر فراخوان ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin همراه `openai` رونویسی بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | پرامپت | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهنده جریانی برای مسیر رونویسی بلادرنگ Voice Call است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin همراه `openai` صدای بلادرنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` بازمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای پل‌های بلادرنگ backend پشتیبانی می‌کند. از فراخوانی ابزار دوسویه پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    Control UI Talk از جلسه‌های بلادرنگ مرورگر OpenAI با یک راز موقت مشتری
    ضرب‌شده توسط Gateway و تبادل مستقیم SDP WebRTC مرورگر در برابر
    API بلادرنگ OpenAI استفاده می‌کند. راستی‌آزمایی زنده نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ بخش OpenAI یک راز مشتری را در Node ضرب می‌کند، یک پیشنهاد SDP مرورگر
    با رسانه میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و پاسخ SDP را
    بدون ثبت رازها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpointهای Azure OpenAI

ارائه‌دهنده همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر
هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام میزبان‌های Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار به شکل درخواست
Azure تغییر می‌کند.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و از `models.providers.openai.baseUrl` اثر نمی‌گیرد. برای تنظیمات Azure آن، آکاردئون **صدای بلادرنگ**
را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI استفاده کنید وقتی:

- از قبل اشتراک، سهمیه یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت داده منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده همراه `openai`، مقدار
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

برای درخواست‌های تولید تصویر روی میزبان Azure شناسایی‌شده، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای محدود به deployment استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- `?api-version=...` را به هر درخواست اضافه می‌کند
- برای فراخوانی‌های تولید تصویر Azure از مهلت زمانی درخواست پیش‌فرض ۶۰۰ ثانیه استفاده می‌کند.
  مقادیر `timeoutMs` در هر فراخوان همچنان این پیش‌فرض را بازنویسی می‌کنند.

سایر URLهای پایه (OpenAI عمومی، پروکسی‌های سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیرگزینی Azure برای مسیر تولید تصویر ارائه‌دهنده `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مثل endpoint عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای تصویر Azure
ناموفق خواهند شد.
</Note>

### نسخه API

برای پین کردن یک نسخه پیش‌نمایش یا GA مشخص Azure برای مسیر تولید تصویر Azure،
`AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده همراه `openai` مسیرگزینی می‌شوند، فیلد `model` در OpenClaw
باید **نام deployment در Azure** باشد که در پورتال Azure پیکربندی کرده‌اید، نه
شناسه مدل عمومی OpenAI.

اگر deploymentی به نام `gpt-image-2-prod` بسازید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده نام deployment برای فراخوانی‌های تولید تصویر مسیرگزینی‌شده از طریق
ارائه‌دهنده همراه `openai` هم اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ساختن یک deployment، فهرست منطقه‌ای فعلی Microsoft را بررسی کنید
و تأیید کنید که مدل مشخص در منطقه شما ارائه می‌شود.

### تفاوت‌های پارامتر

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی
مقادیر `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مشخص مدل
در معرض بگذارد. این تفاوت‌ها از Azure و مدل زیرین می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی ناموفق شد، مجموعه
پارامترهای پشتیبانی‌شده توسط deployment و نسخه API مشخص خود را در
پورتال Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند اما
سرآیندهای انتساب پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک چت یا Responses روی Azure (فراتر از تولید تصویر)، از
جریان onboarding یا پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/احراز هویت Azure را برنمی‌دارد. یک ارائه‌دهنده جداگانه
`azure-openai-responses/*` وجود دارد؛ آکاردئون Server-side compaction را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای هر دو `openai/*` و `openai-codex/*` از WebSocket-first با جایگزین SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست زودهنگام WebSocket را پیش از بازگشت به SSE دوباره تلاش می‌کند
    - پس از یک شکست، WebSocket را برای حدود ۶۰ ثانیه degraded علامت می‌زند و در دوره خنک‌سازی از SSE استفاده می‌کند
    - سرآیندهای پایدار هویت جلسه و نوبت را برای تلاش‌های دوباره و اتصال‌های مجدد پیوست می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را در گونه‌های انتقال نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، جایگزین SSE |
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
    - [API بلادرنگ با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های API جریانی (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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
    OpenClaw یک کلید تغییر حالت سریع مشترک را برای `openai/*` و `openai-codex/*` ارائه می‌کند:

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
    بازنویسی‌های نشست بر پیکربندی اولویت دارند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API مربوط به OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را در OpenClaw برای هر مدل تنظیم کنید:

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
    `serviceTier` فقط به endpointهای بومی OpenAI (`api.openai.com`) و endpointهای بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از این providerها را از طریق proxy مسیریابی کنید، OpenClaw مقدار `service_tier` را دست‌نخورده باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش‌دهنده جریان Pi-harness در Plugin مربوط به OpenAI، Compaction سمت سرور را به‌طور خودکار فعال می‌کند:

    - اجبار `store: true` (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - تزریق `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این مورد برای مسیر داخلی Pi harness و hookهای provider مربوط به OpenAI که توسط اجراهای embedded استفاده می‌شوند اعمال می‌شود. harness بومی app-server مربوط به Codex، زمینه خودش را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجبار می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت GPT سخت‌گیرانه agentic">
    برای اجراهای خانواده GPT-5 روی `openai/*`، OpenClaw می‌تواند از قرارداد اجرای embedded سخت‌گیرانه‌تری استفاده کند:

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
    - دیگر یک نوبت فقط شامل برنامه را وقتی اقدام ابزاری در دسترس است، پیشرفت موفق محسوب نمی‌کند
    - نوبت را با هدایت برای اقدام فوری دوباره تلاش می‌کند
    - برای کارهای قابل‌توجه، `update_plan` را به‌طور خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام برنامه‌ریزی کند، وضعیت مسدودشده صریحی را نمایش می‌دهد

    <Note>
    فقط محدود به اجراهای خانواده GPT-5 مربوط به OpenAI و Codex است. providerهای دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw با endpointهای مستقیم OpenAI، Codex، و Azure OpenAI متفاوت از proxyهای عمومی سازگار با OpenAI `/v1` رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از effort با مقدار `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا proxyهایی که `reasoning.effort: "none"` را رد می‌کنند، حذف می‌کند
    - schemaهای ابزار را به‌صورت پیش‌فرض روی حالت strict قرار می‌دهد
    - headerهای attribution پنهان را فقط روی hostهای بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مخصوص OpenAI را نگه می‌دارد (`service_tier`، `store`، reasoning-compat، hintهای prompt-cache)

    **مسیرهای proxy/سازگار:**
    - از رفتار سازگاری آسان‌گیرانه‌تر استفاده می‌کنند
    - `store` مربوط به Completions را از payloadهای غیر بومی `openai-completions` حذف می‌کنند
    - عبور مستقیم JSON پیشرفته `params.extra_body`/`params.extraBody` را برای proxyهای Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای proxyهای Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - schemaهای strict ابزار یا headerهای فقط بومی را اجبار نمی‌کنند

    Azure OpenAI از transport بومی و رفتار سازگاری استفاده می‌کند، اما headerهای attribution پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب providerها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب provider.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب provider.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از credentialها.
  </Card>
</CardGroup>
