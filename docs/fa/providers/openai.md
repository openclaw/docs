---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراک Codex استفاده کنید
    - به رفتار سخت‌گیرانه‌تری برای اجرای عامل GPT-5 نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT ارائه می‌کند، و Codex نیز به‌عنوان عامل کدنویسیِ طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این سطح‌ها را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از `openai/*` به‌عنوان مسیر متعارف مدل OpenAI استفاده می‌کند. نوبت‌های عامل تعبیه‌شده روی مدل‌های OpenAI به‌طور پیش‌فرض از طریق runtime بومی app-server در Codex اجرا می‌شوند؛ احراز هویت مستقیم با کلید API برای سطح‌های غیرعاملی OpenAI مانند تصویرها، embeddings، گفتار، و realtime همچنان در دسترس است.

- **مدل‌های عامل** - مدل‌های `openai/*` از طریق runtime در Codex؛ برای استفاده از اشتراک ChatGPT/Codex با احراز هویت `openai-codex` وارد شوید، یا وقتی عمداً احراز هویت با کلید API می‌خواهید، یک پروفایل کلید API برای `openai-codex` پیکربندی کنید.
- **APIهای غیرعاملی OpenAI** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف از طریق `OPENAI_API_KEY` یا راه‌اندازی کلید API در OpenAI.
- **پیکربندی قدیمی** - ارجاع‌های مدل `openai-codex/*` توسط `openclaw doctor --fix` به `openai/*` به‌همراه runtime در Codex ترمیم می‌شوند.

OpenAI صراحتاً از استفاده از OAuth اشتراکی در ابزارها و workflowهای بیرونی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، runtime، و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم مخلوط می‌شوند، پیش از تغییر پیکربندی، [runtimeهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده کنید                                                     | نکته‌ها                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex | `openai/gpt-5.5`                                        | راه‌اندازی پیش‌فرض عامل OpenAI. با احراز هویت `openai-codex` وارد شوید.         |
| صورت‌حساب مستقیم با کلید API برای مدل‌های عامل              | `openai/gpt-5.5` به‌همراه یک پروفایل کلید API برای `openai-codex` | از `auth.order.openai-codex` برای ترجیح دادن آن پروفایل استفاده کنید.                 |
| صورت‌حساب مستقیم با کلید API از طریق PI صریح           | `openai/gpt-5.5` به‌همراه `agentRuntime.id: "pi"`           | یک پروفایل عادی کلید API با `openai` انتخاب کنید.                             |
| تازه‌ترین alias API برای ChatGPT Instant                     | `openai/chat-latest`                                    | فقط کلید API مستقیم. alias متغیر برای آزمایش‌ها، نه پیش‌فرض.   |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI صریح  | `openai/gpt-5.5` به‌همراه `agentRuntime.id: "pi"`           | یک پروفایل احراز هویت `openai-codex` برای مسیر سازگاری انتخاب کنید.    |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                                    | با `OPENAI_API_KEY` یا OAuth در OpenAI Codex کار می‌کند.             |
| تصویرهای پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                                  | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید. |

## نقشه نام‌گذاری

نام‌ها شبیه‌اند اما قابل جایگزینی با هم نیستند:

| نامی که می‌بینید                       | لایه               | معنی                                                                                           |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | پیشوند ارائه‌دهنده     | مسیر متعارف مدل OpenAI؛ نوبت‌های عامل از runtime در Codex استفاده می‌کنند.                                  |
| `openai-codex`                     | پیشوند احراز هویت/پروفایل | ارائه‌دهنده پروفایل احراز هویت OAuth/اشتراک OpenAI Codex.                                            |
| Plugin `codex`                     | Plugin              | Plugin همراه OpenClaw که runtime بومی app-server در Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex`           | runtime عامل       | harness بومی app-server در Codex را برای نوبت‌های تعبیه‌شده اجبار می‌کند.                                     |
| `/codex ...`                       | مجموعه فرمان گفت‌وگو    | threadهای app-server در Codex را از داخل یک مکالمه متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"` | مسیر جلسه ACP   | مسیر fallback صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمداً هم ارجاع‌های مدل `openai/*` و هم پروفایل‌های احراز هویت `openai-codex` داشته باشد. `openclaw doctor --fix` ارجاع‌های مدل قدیمی `openai-codex/*` را به مسیر متعارف مدل OpenAI بازنویسی می‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم کلید API در OpenAI Platform و هم مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` استفاده کنید؛ پیکربندی runtime تنظیم‌نشده اکنون harness در Codex را برای نوبت‌های عامل OpenAI انتخاب می‌کند. فقط زمانی از پروفایل‌های کلید API در OpenAI استفاده کنید که احراز هویت مستقیم با کلید API برای یک مدل عامل OpenAI می‌خواهید.
</Note>

<Note>
نوبت‌های مدل عامل OpenAI به Plugin همراه app-server در Codex نیاز دارند. پیکربندی runtime صریح PI همچنان به‌عنوان مسیر سازگاری opt-in در دسترس است. وقتی PI به‌طور صریح با یک پروفایل احراز هویت `openai-codex` انتخاب شود، OpenClaw ارجاع مدل عمومی را به‌صورت `openai/*` نگه می‌دارد و PI را به‌صورت داخلی از طریق انتقال قدیمی احراز هویت Codex مسیریابی می‌کند. برای ترمیم ارجاع‌های مدل کهنه `openai-codex/*` یا pinهای قدیمی جلسه PI که از پیکربندی runtime صریح نیامده‌اند، `openclaw doctor --fix` را اجرا کنید.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                                  | وضعیت                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| گفت‌وگو / Responses          | ارائه‌دهنده مدل `openai/<model>`                                   | بله                                                    |
| مدل‌های اشتراکی Codex | `openai/<model>` با OAuth در `openai-codex`                        | بله                                                    |
| ارجاع‌های قدیمی مدل Codex   | `openai-codex/<model>`                                            | توسط doctor به `openai/<model>` ترمیم می‌شود                 |
| harness app-server در Codex  | `openai/<model>` با runtime حذف‌شده یا `agentRuntime.id: codex` | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                                      | بله، وقتی جست‌وجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای pin نشده باشد |
| تصویرها                    | `image_generate`                                                  | بله                                                    |
| ویدیوها                    | `video_generate`                                                  | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                         | بله                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                         | بله                                                    |
| تبدیل گفتار به متن streaming  | Voice Call `streaming.provider: "openai"`                         | بله                                                    |
| صدای realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk        | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                         | بله                                                    |

## Embeddings حافظه

OpenClaw می‌تواند از OpenAI، یا یک endpoint سازگار با OpenAI برای embedding، جهت indexing و embeddings پرس‌وجو در `memory_search` استفاده کند:

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

برای endpointهای سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw این‌ها را به‌عنوان فیلدهای درخواست مخصوص ارائه‌دهنده با نام `input_type` ارسال می‌کند: embeddings پرس‌وجو از `queryInputType` استفاده می‌کنند؛ chunkهای حافظه index‌شده و indexing دسته‌ای از `documentInputType` استفاده می‌کنند. برای مثال کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم به API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) یک کلید API بسازید یا کپی کنید.
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
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل              | پیکربندی runtime             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | حذف‌شده / `agentRuntime.id: "codex"` | harness app-server در Codex | پروفایل `openai-codex` |
    | `openai/gpt-5.4-mini` | حذف‌شده / `agentRuntime.id: "codex"` | harness app-server در Codex | پروفایل `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | runtime تعبیه‌شده PI      | پروفایل `openai` یا پروفایل انتخاب‌شده `openai-codex` |

    <Note>
    مدل‌های عامل `openai/*` از harness app-server در Codex استفاده می‌کنند. برای استفاده از احراز هویت کلید API برای یک مدل عامل، یک پروفایل کلید API برای `openai-codex` بسازید و آن را با `auth.order.openai-codex` مرتب کنید؛ `OPENAI_API_KEY` همچنان fallback مستقیم برای سطح‌های API غیرعاملی OpenAI باقی می‌ماند.
    </Note>

    ### مثال پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    برای آزمایش مدل فعلی Instant در ChatGPT از API در OpenAI، مدل را روی `openai/chat-latest` تنظیم کنید:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` یک alias متغیر است. OpenAI آن را به‌عنوان تازه‌ترین مدل Instant استفاده‌شده در ChatGPT مستند کرده و `gpt-5.5` را برای استفاده تولیدی API توصیه می‌کند، بنابراین مگر اینکه صراحتاً آن رفتار alias را بخواهید، `openai/gpt-5.5` را به‌عنوان پیش‌فرض پایدار نگه دارید. این alias در حال حاضر فقط `medium` را برای پرگویی متن می‌پذیرد، بنابراین OpenClaw overrideهای ناسازگار پرگویی متن OpenAI را برای این مدل نرمال‌سازی می‌کند.

    <Warning>
    OpenClaw، `openai/gpt-5.3-codex-spark` را ارائه نمی‌کند. درخواست‌های زنده API در OpenAI آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را ارائه نمی‌کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex خود با اجرای بومی app-server در Codex به‌جای یک کلید API جداگانه. Codex cloud به ورود به ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth در Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیماً اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost با flow کد دستگاه ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="از مسیر متعارف مدل OpenAI استفاده کنید">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        هیچ پیکربندی runtime برای مسیر پیش‌فرض لازم نیست. نوبت‌های عامل OpenAI
        runtime بومی app-server Codex را به‌طور خودکار انتخاب می‌کنند، و OpenClaw
        وقتی این مسیر انتخاب شود Plugin همراه Codex را نصب یا تعمیر می‌کند.
      </Step>
      <Step title="بررسی کنید احراز هویت Codex در دسترس باشد">
        ```bash
        openclaw models list --provider openai-codex
        ```

        پس از اجرای gateway، برای بررسی runtime بومی app-server
        در گفتگو `/codex status` یا `/codex models` را ارسال کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | مرجع مدل | پیکربندی runtime | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | حذف‌شده / `agentRuntime.id: "codex"` | مهار بومی app-server Codex | ورود به Codex یا پروفایل انتخاب‌شده `openai-codex` |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | runtime تعبیه‌شده PI با انتقال داخلی احراز هویت Codex | پروفایل انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | تعمیرشده توسط doctor | مسیر قدیمی بازنویسی‌شده به `openai/gpt-5.5` | پروفایل موجود `openai-codex` |

    <Warning>
    مرجع‌های مدل قدیمی‌تر `openai-codex/gpt-5.1*`، `openai-codex/gpt-5.2*`، یا
    `openai-codex/gpt-5.3*` را پیکربندی نکنید. حساب‌های OAuth ChatGPT/Codex اکنون
    آن مدل‌ها را رد می‌کنند. از `openai/gpt-5.5` استفاده کنید؛ نوبت‌های عامل OpenAI اکنون به‌طور پیش‌فرض runtime
    Codex را انتخاب می‌کنند.
    </Warning>

    <Note>
    همچنان از شناسه ارائه‌دهنده `openai-codex` برای فرمان‌های احراز هویت/پروفایل استفاده کنید. پیشوند مدل
    `openai-codex/*` پیکربندی قدیمی است که توسط doctor تعمیر می‌شود. برای
    راه‌اندازی رایج اشتراک به‌همراه runtime بومی، با `openai-codex`
    وارد شوید اما مرجع مدل را `openai/gpt-5.5` نگه دارید.
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

    <Note>
    Onboarding دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان کد دستگاه بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در ذخیره احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### بررسی و بازیابی مسیریابی OAuth Codex

    از این فرمان‌ها استفاده کنید تا ببینید عامل پیش‌فرض شما از کدام مدل، runtime، و مسیر احراز هویت
    استفاده می‌کند:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    برای یک عامل مشخص، `--agent <id>` را اضافه کنید:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    اگر یک پیکربندی قدیمی هنوز `openai-codex/gpt-*` یا یک پین نشست OpenAI PI
    منسوخ بدون پیکربندی صریح runtime دارد، آن را تعمیر کنید:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    اگر `models auth list --provider openai-codex` هیچ پروفایل قابل استفاده‌ای نشان نمی‌دهد، دوباره
    وارد شوید:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` همچنان شناسه ارائه‌دهنده احراز هویت/پروفایل است. `openai/*`
    مسیر مدل برای نوبت‌های عامل OpenAI از طریق Codex است.

    ### نشانگر وضعیت

    گفتگوی `/status` نشان می‌دهد کدام runtime مدل برای نشست فعلی فعال است.
    مهار app-server همراه Codex به‌صورت `Runtime: OpenAI Codex` برای
    نوبت‌های مدل عامل OpenAI ظاهر می‌شود. پین‌های نشست PI منسوخ به Codex تعمیر می‌شوند مگر اینکه
    پیکربندی به‌طور صریح PI را پین کند.

    ### هشدار Doctor

    اگر مسیرهای `openai-codex/*` یا پین‌های منسوخ OpenAI PI در پیکربندی یا
    وضعیت نشست باقی بمانند، `openclaw doctor --fix` آن‌ها را به `openai/*` با
    runtime Codex بازنویسی می‌کند مگر اینکه PI به‌طور صریح پیکربندی شده باشد.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه runtime را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai/gpt-5.5` از طریق کاتالوگ OAuth Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime `contextTokens`: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های تأخیر و کیفیت بهتری دارد. آن را با `contextTokens` بازنویسی کنید:

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
    از `contextWindow` برای اعلام فراداده بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجه زمینه runtime استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ بالادستی Codex برای `gpt-5.5`
    موجود باشد، از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجرای cron، زیرعامل، و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورد.

  </Tab>
</Tabs>

## احراز هویت بومی app-server Codex

مهار بومی app-server Codex از مرجع‌های مدل `openai/*` به‌همراه پیکربندی
runtime حذف‌شده یا `agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان
مبتنی بر حساب است. OpenClaw
احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح OpenClaw `openai-codex` که به عامل متصل است.
2. حساب موجود app-server، مانند ورود محلی ChatGPT در Codex CLI.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی ورود اشتراک محلی ChatGPT/Codex فقط به این دلیل که
فرایند gateway همچنین برای مدل‌های مستقیم OpenAI یا embeddingها `OPENAI_API_KEY` دارد
جایگزین نمی‌شود. fallback کلید API محیطی فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های WebSocket app-server ارسال نمی‌شود. وقتی یک پروفایل Codex
از نوع اشتراکی انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند stdio app-server ایجادشده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند.

## تولید تصویر

Plugin همراه `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این هم تولید تصویر با کلید API OpenAI و هم تولید تصویر OAuth Codex
را از طریق همان مرجع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                | کلید API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                      | `OPENAI_API_KEY`                   | ورود OAuth OpenAI Codex           |
| انتقال                 | OpenAI Images API                  | پشتانه Codex Responses              |
| بیشینه تصاویر در هر درخواست    | 4                                  | 4                                    |
| حالت ویرایش                 | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع)   |
| بازنویسی اندازه‌ها            | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K   | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K     |
| نسبت تصویر / وضوح | به OpenAI Images API ارسال نمی‌شود | وقتی امن باشد به اندازه پشتیبانی‌شده نگاشت می‌شود |

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

`gpt-image-2` پیش‌فرض هم برای تولید متن‌به‌تصویر OpenAI و هم برای
ویرایش تصویر است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده‌اند. از `openai/gpt-image-1.5` برای خروجی
PNG/WebP با پس‌زمینه شفاف استفاده کنید؛ API فعلی `gpt-image-2`
`background: "transparent"` را رد می‌کند.

برای یک درخواست پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی ارائه‌دهنده `openai.background`
هنوز پذیرفته می‌شود. OpenClaw همچنین از مسیرهای عمومی OpenAI و
OAuth OpenAI Codex محافظت می‌کند و درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2`
را به `gpt-image-1.5` بازنویسی می‌کند؛ Azure و endpointهای سفارشی سازگار با OpenAI
نام‌های deployment/model پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجراهای CLI بدون رابط نیز ارائه شده است:

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
`--openai-background` همچنان به‌عنوان نام مستعار ویژه OpenAI در دسترس است.

برای نصب‌های OAuth Codex، همان مرجع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth `openai-codex` پیکربندی شده باشد، OpenClaw آن توکن دسترسی OAuth ذخیره‌شده
را resolve می‌کند و درخواست‌های تصویر را از طریق پشتانه Codex Responses ارسال می‌کند. ابتدا
`OPENAI_API_KEY` را امتحان نمی‌کند یا برای آن
درخواست بی‌صدا به یک کلید API fallback نمی‌کند. وقتی مسیر مستقیم OpenAI Images API
را می‌خواهید، `models.providers.openai` را به‌طور صریح با یک کلید API،
URL پایه سفارشی، یا endpoint Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک LAN/نشانی خصوصی مورد اعتماد است، همچنین
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

| قابلیت       | مقدار                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض    | `openai/sora-2`                                                                   |
| حالت‌ها            | متن‌به‌ویدیو، تصویر‌به‌ویدیو، ویرایش تک‌ویدیو                                  |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدیو                                                                |
| بازنویسی اندازه‌ها   | پشتیبانی می‌شود                                                                         |
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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت پرامپت GPT-5

OpenClaw یک مشارکت پرامپت مشترک GPT-5 برای اجراهای خانواده GPT-5 در میان ارائه‌دهنده‌ها اضافه می‌کند. این بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai/gpt-5.5`، مرجع‌های قدیمی پیش از تعمیر مانند `openai-codex/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و دیگر مرجع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x دریافت نمی‌کنند.

مهار بومی همراه Codex همان رفتار GPT-5 و overlay Heartbeat را از طریق دستورالعمل‌های توسعه‌دهنده app-server Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق `agentRuntime.id: "codex"` اجبار شده‌اند همان راهنمایی پیگیری و Heartbeat پیش‌دستانه را حفظ می‌کنند، حتی اگر Codex مالک بقیه پرامپت مهار باشد.

راهنمای GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری پرسونا، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌دهی مختص کانال و پیام بی‌صدا در پرامپت سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های منطبق فعال است. لایهٔ سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | لایهٔ سبک تعامل دوستانه را فعال می‌کند |
| `"on"`                 | نام مستعار برای `"friendly"`                      |
| `"off"`                | فقط لایهٔ سبک دوستانه را غیرفعال می‌کند       |

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
مقادیر در زمان اجرا به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایهٔ سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
`plugins.entries.openai.config.personality` قدیمی همچنان وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد، به‌عنوان گزینهٔ جایگزین سازگاری خوانده می‌شود.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="تولید گفتار (TTS)">
    Plugin همراه `openai` تولید گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای یادداشت‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |
    | URL پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | بدنهٔ اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم‌نشده) |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشدهٔ OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای نقاط پایانی سازگار با OpenAI که به کلیدهای اضافی مانند `lang` نیاز دارند استفاده کنید. کلیدهای نمونهٔ اولیه نادیده گرفته می‌شوند.

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
    برای بازنویسی URL پایهٔ TTS بدون اثر گذاشتن بر نقطهٔ پایانی API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="گفتار به متن">
    Plugin همراه `openai` گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانهٔ OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطهٔ پایانی: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - هر جا که رونویسی صوت ورودی از `tools.media.audio` استفاده کند،
      توسط OpenClaw پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های
      صوتی کانال

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

    راهنمایی‌های زبان و پرامپت وقتی توسط پیکربندی رسانهٔ صوتی مشترک
    یا درخواست رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بی‌درنگ">
    Plugin همراه `openai` رونویسی بی‌درنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | پرامپت | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانهٔ VAD | `...openai.vadThreshold` | `0.5` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |

    <Note>
    از یک اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. این ارائه‌دهندهٔ جریانی برای مسیر رونویسی بی‌درنگ Voice Call است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بی‌درنگ">
    Plugin همراه `openai` صدای بی‌درنگ را برای Plugin Voice Call ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | صدا | `...openai.voice` | `alloy` |
    | دما | `...openai.temperature` | `0.8` |
    | آستانهٔ VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | کلید API | `...openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |

    <Note>
    از Azure OpenAI از طریق کلیدهای پیکربندی `azureEndpoint` و `azureDeployment` برای پل‌های بی‌درنگ بک‌اند پشتیبانی می‌کند. از فراخوانی ابزار دوسویه پشتیبانی می‌کند. از قالب صوتی G.711 u-law استفاده می‌کند.
    </Note>

    <Note>
    Control UI Talk از نشست‌های بی‌درنگ مرورگری OpenAI با یک راز موقت کلاینت که توسط Gateway صادر می‌شود و تبادل مستقیم WebRTC SDP مرورگر در برابر
    OpenAI Realtime API استفاده می‌کند. راستی‌آزمایی زندهٔ نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ شاخهٔ OpenAI یک راز کلاینت را در Node صادر می‌کند، یک پیشنهاد SDP مرورگر
    با رسانهٔ میکروفون ساختگی تولید می‌کند، آن را به OpenAI ارسال می‌کند، و پاسخ SDP را
    بدون ثبت رازها اعمال می‌کند.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط پایانی Azure OpenAI

ارائه‌دهندهٔ همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw
نام‌های میزبان Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌صورت خودکار به شکل درخواست Azure تغییر می‌دهد.

<Note>
صدای بی‌درنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای بی‌درنگ** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI استفاده کنید وقتی:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت دادهٔ منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهندهٔ همراه `openai`،
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

برای درخواست‌های تولید تصویر روی میزبان Azure تشخیص‌داده‌شده، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای محدود به استقرار (`/openai/deployments/{deployment}/...`) استفاده می‌کند
- `?api-version=...` را به هر درخواست اضافه می‌کند
- از مهلت زمانی پیش‌فرض ۶۰۰ ثانیه برای فراخوانی‌های تولید تصویر Azure استفاده می‌کند.
  مقادیر `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایهٔ دیگر (OpenAI عمومی، پروکسی‌های سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهندهٔ `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند نقطهٔ پایانی OpenAI عمومی در نظر می‌گیرند و در برابر استقرارهای تصویر Azure شکست می‌خورند.
</Note>

### نسخهٔ API

برای ثابت کردن یک نسخهٔ پیش‌نمایش یا GA مشخص Azure برای مسیر تولید تصویر Azure،
`AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها نام استقرارها هستند

Azure OpenAI مدل‌ها را به استقرارها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهندهٔ همراه `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw
باید **نام استقرار Azure** باشد که در پرتال Azure پیکربندی کرده‌اید، نه
شناسهٔ مدل عمومی OpenAI.

اگر استقراری با نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همان قانون نام استقرار برای فراخوانی‌های تولید تصویر که از طریق
ارائه‌دهندهٔ همراه `openai` مسیریابی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد یک استقرار، فهرست منطقه‌ای فعلی Microsoft را بررسی کنید و تأیید کنید مدل مشخص در منطقهٔ شما ارائه می‌شود.

### تفاوت‌های پارامتر

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی
مقادیر `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مشخص مدل
ارائه دهد. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعهٔ
پارامترهای پشتیبانی‌شده توسط استقرار و نسخهٔ API مشخص خود را در
پرتال Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند اما
سرآیندهای انتساب پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک چت یا Responses روی Azure (فراتر از تولید تصویر)، از جریان راه‌اندازی
یا یک پیکربندی اختصاصی ارائه‌دهندهٔ Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/احراز هویت Azure را انتخاب نمی‌کند. یک ارائه‌دهندهٔ جداگانهٔ
`azure-openai-responses/*` وجود دارد؛ آکاردئون Compaction سمت سرور را در ادامه ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای `openai/*` از WebSocket-اول با جایگزین SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست اولیهٔ WebSocket را پیش از بازگشت به SSE دوباره تلاش می‌کند
    - پس از یک شکست، WebSocket را حدود ۶۰ ثانیه تنزل‌یافته علامت‌گذاری می‌کند و در زمان خنک‌شدن از SSE استفاده می‌کند
    - برای تلاش‌های دوباره و اتصال‌های مجدد، سرآیندهای پایدار هویت نشست و نوبت را پیوست می‌کند
    - شمارنده‌های استفاده (`input_tokens` / `prompt_tokens`) را در گونه‌های انتقال یکسان‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، جایگزین SSE |
    | `"sse"` | فقط SSE را اجبار می‌کند |
    | `"websocket"` | فقط WebSocket را اجبار می‌کند |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    اسناد مرتبط OpenAI:
    - [Realtime API با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های API جریانی (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="گرم‌سازی WebSocket">
    OpenClaw گرم‌سازی WebSocket را به‌صورت پیش‌فرض برای `openai/*` فعال می‌کند تا تأخیر نوبت اول کاهش یابد.

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
    OpenClaw یک کلید مشترک برای حالت سریع در `openai/*` ارائه می‌کند:

    - **گپ/UI:** `/fast status|on|off`
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
    بازنویسی‌های نشست بر پیکربندی اولویت دارند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به مقدار پیش‌فرض پیکربندی‌شده برمی‌گرداند.
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

    مقادیر پشتیبانی‌شده: `auto`، `default`، `flex`، `priority`.

    <Warning>
    `serviceTier` فقط به نقطه‌های پایانی بومی OpenAI (`api.openai.com`) و نقطه‌های پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از این ارائه‌دهندگان را از طریق پراکسی مسیریابی کنید، OpenClaw مقدار `service_tier` را دست‌نخورده باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش‌دهنده جریان Pi-harness مربوط به Plugin OpenAI، Compaction سمت سرور را به‌صورت خودکار فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کرده باشد)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow` (یا وقتی در دسترس نباشد، `80000`)

    این مورد برای مسیر داخلی Pi harness و برای hookهای ارائه‌دهنده OpenAI که توسط اجراهای تعبیه‌شده استفاده می‌شوند اعمال می‌شود. harness بومی سرور برنامه Codex زمینه خودش را از طریق Codex مدیریت می‌کند و جداگانه با `agents.defaults.agentRuntime.id` پیکربندی می‌شود.

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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجباری می‌کنند، مگر اینکه سازگاری `supportsStore: false` را تنظیم کرده باشد.
    </Note>

  </Accordion>

  <Accordion title="حالت GPT عامل‌محور سخت‌گیرانه">
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
    - دیگر یک نوبت صرفاً شامل طرح را، وقتی اقدام ابزاری در دسترس است، پیشرفت موفق محسوب نمی‌کند
    - نوبت را با هدایت برای اقدام فوری دوباره امتحان می‌کند
    - برای کارهای قابل‌توجه `update_plan` را به‌صورت خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام برنامه‌ریزی کند، وضعیت مسدودشدگی صریح را نشان می‌دهد

    <Note>
    فقط به اجراهای خانواده GPT-5 در OpenAI و Codex محدود است. سایر ارائه‌دهندگان و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw با نقطه‌های پایانی مستقیم OpenAI، Codex و Azure OpenAI متفاوت از پراکسی‌های عمومی سازگار با OpenAI `/v1` رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که effort `none` در OpenAI را پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا پراکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای ابزار را به‌صورت پیش‌فرض روی حالت سخت‌گیرانه می‌گذارد
    - headerهای انتساب پنهان را فقط روی میزبان‌های بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مخصوص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، راهنمایی‌های prompt-cache)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کنند
    - `store` مربوط به Completions را از payloadهای غیر بومی `openai-completions` حذف می‌کنند
    - عبور مستقیم JSON پیشرفته `params.extra_body`/`params.extraBody` را برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - schemaهای سخت‌گیرانه ابزار یا headerهای فقط بومی را اجباری نمی‌کنند

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما headerهای انتساب پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
