---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید از احراز هویت اشتراکی Codex به‌جای کلیدهای API استفاده کنید
    - به رفتار اجرایی سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw استفاده کنید
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T20:04:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT فراهم می‌کند، و Codex نیز به‌عنوان عامل کدنویسیِ طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw این سطوح را جدا نگه می‌دارد تا پیکربندی قابل پیش‌بینی بماند.

OpenClaw از `openai/*` به‌عنوان مسیر متعارف مدل OpenAI استفاده می‌کند. نوبت‌های عامل تعبیه‌شده روی مدل‌های OpenAI به‌طور پیش‌فرض از طریق زمان‌اجرای بومی سرور-اپ Codex اجرا می‌شوند؛ احراز هویت مستقیم با کلید API برای سطوح غیرعاملی OpenAI مانند تصاویر، embeddings، گفتار، و realtime همچنان در دسترس است.

- **مدل‌های عامل** - مدل‌های `openai/*` از طریق زمان‌اجرای Codex؛ برای استفاده از اشتراک ChatGPT/Codex با احراز هویت `openai-codex` وارد شوید، یا وقتی عمدا احراز هویت با کلید API می‌خواهید، یک پروفایل کلید API از نوع `openai-codex` پیکربندی کنید.
- **APIهای غیرعاملی OpenAI** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف از طریق `OPENAI_API_KEY` یا راه‌اندازی کلید API OpenAI.
- **پیکربندی قدیمی** - ارجاع‌های مدل `openai-codex/*` با `openclaw doctor --fix` به `openai/*` به‌همراه زمان‌اجرای Codex اصلاح می‌شوند.

OpenAI صراحتا از استفاده OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان‌اجرا، و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم مخلوط شده‌اند، پیش از تغییر پیکربندی، [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده کنید                                                     | یادداشت‌ها                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex | `openai/gpt-5.5`                                        | تنظیم پیش‌فرض عامل OpenAI. با احراز هویت `openai-codex` وارد شوید.         |
| صورت‌حساب مستقیم با کلید API برای مدل‌های عامل              | `openai/gpt-5.5` به‌همراه یک پروفایل کلید API از نوع `openai-codex` | برای ترجیح دادن آن پروفایل از `auth.order.openai-codex` استفاده کنید.                 |
| صورت‌حساب مستقیم با کلید API از طریق PI صریح           | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `pi`       | یک پروفایل معمول کلید API از نوع `openai` انتخاب کنید.                             |
| آخرین alias برای ChatGPT Instant API                     | `openai/chat-latest`                                    | فقط کلید API مستقیم. alias متحرک برای آزمایش‌ها، نه پیش‌فرض.   |
| احراز هویت اشتراک ChatGPT/Codex از طریق PI صریح  | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `pi`       | یک پروفایل احراز هویت `openai-codex` برای مسیر سازگاری انتخاب کنید.    |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                                    | با `OPENAI_API_KEY` یا OAuth متعلق به OpenAI Codex کار می‌کند.             |
| تصاویر با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                                  | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید. |

## نقشه نام‌گذاری

نام‌ها مشابه‌اند اما قابل جایگزینی نیستند:

| نامی که می‌بینید                            | لایه               | معنی                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | پیشوند ارائه‌دهنده     | مسیر متعارف مدل OpenAI؛ نوبت‌های عامل از زمان‌اجرای Codex استفاده می‌کنند.                                  |
| `openai-codex`                          | پیشوند احراز هویت/پروفایل | ارائه‌دهنده پروفایل احراز هویت OAuth/اشتراک OpenAI Codex.                                            |
| Plugin `codex`                          | Plugin              | Plugin بسته‌بندی‌شده OpenClaw که زمان‌اجرای بومی سرور-اپ Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| provider/model `agentRuntime.id: codex` | زمان‌اجرای عامل       | هارنس بومی سرور-اپ Codex را برای نوبت‌های تعبیه‌شده منطبق اجباری می‌کند.                            |
| `/codex ...`                            | مجموعه فرمان گفت‌وگو    | رشته‌های سرور-اپ Codex را از یک مکالمه متصل/کنترل می‌کند.                                        |
| `runtime: "acp", agentId: "codex"`      | مسیر نشست ACP   | مسیر fallback صریح که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمدا هم ارجاع‌های مدل `openai/*` و هم پروفایل‌های احراز هویت `openai-codex` داشته باشد. `openclaw doctor --fix` ارجاع‌های مدل قدیمی `openai-codex/*` را به مسیر متعارف مدل OpenAI بازنویسی می‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم با کلید API در OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` استفاده کنید؛ پیکربندی زمان‌اجرای تنظیم‌نشده اکنون هارنس Codex را برای نوبت‌های عامل OpenAI انتخاب می‌کند. فقط زمانی از پروفایل‌های کلید API متعلق به OpenAI استفاده کنید که احراز هویت مستقیم با کلید API را برای یک مدل عامل OpenAI می‌خواهید.
</Note>

<Note>
نوبت‌های مدل عامل OpenAI به Plugin بسته‌بندی‌شده سرور-اپ Codex نیاز دارند. پیکربندی زمان‌اجرای PI صریح همچنان به‌عنوان مسیر سازگاری اختیاری در دسترس است. وقتی PI به‌صورت صریح با یک پروفایل احراز هویت `openai-codex` انتخاب شود، OpenClaw ارجاع مدل عمومی را به‌شکل `openai/*` نگه می‌دارد و PI را به‌صورت داخلی از طریق انتقال قدیمی احراز هویت Codex مسیریابی می‌کند. برای اصلاح ارجاع‌های مدل کهنه `openai-codex/*` یا pinهای نشست PI قدیمی که از پیکربندی زمان‌اجرای صریح نمی‌آیند، `openclaw doctor --fix` را اجرا کنید.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                                                 | وضعیت                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | ارائه‌دهنده مدل `openai/<model>`                                                  | بله                                                    |
| مدل‌های اشتراک Codex | `openai/<model>` با OAuth `openai-codex`                                       | بله                                                    |
| ارجاع‌های مدل قدیمی Codex   | `openai-codex/<model>`                                                           | توسط doctor به `openai/<model>` اصلاح می‌شود                 |
| هارنس سرور-اپ Codex  | `openai/<model>` با زمان‌اجرای حذف‌شده یا provider/model `agentRuntime.id: codex` | بله                                                    |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                                                     | بله، وقتی جست‌وجوی وب فعال باشد و ارائه‌دهنده‌ای pin نشده باشد |
| تصاویر                    | `image_generate`                                                                 | بله                                                    |
| ویدئوها                    | `video_generate`                                                                 | بله                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                                        | بله                                                    |
| تبدیل دسته‌ای گفتار به متن      | `tools.media.audio` / درک رسانه                                        | بله                                                    |
| تبدیل جریانی گفتار به متن  | Voice Call `streaming.provider: "openai"`                                        | بله                                                    |
| صدای realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | بله                                                    |
| Embeddings                | ارائه‌دهنده embedding حافظه                                                        | بله                                                    |

## Embeddingهای حافظه

OpenClaw می‌تواند از OpenAI، یا یک endpoint embedding سازگار با OpenAI، برای نمایه‌سازی و embeddingهای پرس‌وجوی `memory_search` استفاده کند:

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

برای endpointهای سازگار با OpenAI که به برچسب‌های embedding نامتقارن نیاز دارند، `queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw آن‌ها را به‌عنوان فیلدهای درخواست اختصاصی ارائه‌دهنده `input_type` ارسال می‌کند: embeddingهای پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از `documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **مناسب برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="Get your API key">
        یک کلید API را از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) ایجاد یا کپی کنید.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیم پاس بدهید:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل              | پیکربندی زمان‌اجرا             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس سرور-اپ Codex | پروفایل `openai-codex` |
    | `openai/gpt-5.4-mini` | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس سرور-اپ Codex | پروفایل `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | زمان‌اجرای تعبیه‌شده PI      | پروفایل `openai` یا پروفایل `openai-codex` انتخاب‌شده |

    <Note>
    مدل‌های عامل `openai/*` از هارنس سرور-اپ Codex استفاده می‌کنند. برای استفاده از احراز هویت کلید API برای یک مدل عامل، یک پروفایل کلید API از نوع `openai-codex` بسازید و آن را با `auth.order.openai-codex` مرتب کنید؛ `OPENAI_API_KEY` همچنان fallback مستقیم برای سطوح API غیرعاملی OpenAI است.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    برای امتحان کردن مدل Instant فعلی ChatGPT از OpenAI API، مدل را روی `openai/chat-latest` تنظیم کنید:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` یک alias متحرک است. OpenAI آن را به‌عنوان آخرین مدل Instant استفاده‌شده در ChatGPT مستند کرده و `gpt-5.5` را برای استفاده تولیدی API توصیه می‌کند، بنابراین مگر اینکه صراحتا رفتار آن alias را بخواهید، `openai/gpt-5.5` را به‌عنوان پیش‌فرض پایدار نگه دارید. این alias در حال حاضر فقط verbosity متن `medium` را می‌پذیرد، بنابراین OpenClaw بازنویسی‌های ناسازگار verbosity متن OpenAI را برای این مدل عادی‌سازی می‌کند.

    <Warning>
    OpenClaw مدل `openai/gpt-5.3-codex-spark` را **ارائه نمی‌کند**. درخواست‌های زنده OpenAI API آن مدل را رد می‌کنند، و کاتالوگ فعلی Codex نیز آن را ارائه نمی‌کند.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **مناسب برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی سرور-اپ Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود با ChatGPT نیاز دارد.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        یا OAuth را مستقیم اجرا کنید:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost با جریان کد دستگاه ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="از مسیر مدل رسمی OpenAI استفاده کنید">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        برای مسیر پیش‌فرض، هیچ پیکربندی محیط اجرایی لازم نیست. نوبت‌های عامل OpenAI
        محیط اجرای بومی app-server مربوط به Codex را به‌طور خودکار انتخاب می‌کنند، و OpenClaw
        وقتی این مسیر انتخاب شود Plugin همراه Codex را نصب یا تعمیر می‌کند.
      </Step>
      <Step title="بررسی کنید احراز هویت Codex در دسترس است">
        ```bash
        openclaw models list --provider openai-codex
        ```

        پس از اجرای Gateway، برای بررسی محیط اجرای بومی app-server، در گفت‌وگو
        `/codex status` یا `/codex models` را بفرستید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | مرجع مدل | پیکربندی محیط اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس بومی app-server مربوط به Codex | ورود به Codex یا پروفایل انتخاب‌شده `openai-codex` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | محیط اجرای تعبیه‌شده PI با انتقال داخلی احراز هویت Codex | پروفایل انتخاب‌شده `openai-codex` |
    | `openai-codex/gpt-5.5` | تعمیرشده توسط doctor | مسیر قدیمی بازنویسی‌شده به `openai/gpt-5.5` | پروفایل موجود `openai-codex` |

    <Warning>
    مراجع مدل قدیمی‌تر `openai-codex/gpt-5.1*`، `openai-codex/gpt-5.2*`، یا
    `openai-codex/gpt-5.3*` را پیکربندی نکنید. حساب‌های OAuth مربوط به ChatGPT/Codex اکنون
    آن مدل‌ها را رد می‌کنند. از `openai/gpt-5.5` استفاده کنید؛ نوبت‌های عامل OpenAI اکنون به‌طور
    پیش‌فرض محیط اجرای Codex را انتخاب می‌کنند.
    </Warning>

    <Note>
    برای فرمان‌های احراز هویت/پروفایل همچنان از شناسه provider یعنی `openai-codex` استفاده کنید.
    پیشوند مدل `openai-codex/*` پیکربندی قدیمی است که doctor آن را تعمیر می‌کند. برای راه‌اندازی
    رایج اشتراک به‌همراه محیط اجرای بومی، با `openai-codex` وارد شوید
    اما مرجع مدل را `openai/gpt-5.5` نگه دارید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    راه‌اندازی اولیه دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان device-code بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در انبار احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### بررسی و بازیابی مسیریابی OAuth مربوط به Codex

    از این فرمان‌ها استفاده کنید تا ببینید عامل پیش‌فرض شما از کدام مدل، محیط اجرا،
    و مسیر احراز هویت استفاده می‌کند:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    برای یک عامل مشخص، `--agent <id>` را اضافه کنید:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    اگر یک پیکربندی قدیمی هنوز `openai-codex/gpt-*` یا یک pin نشست قدیمی OpenAI PI
    بدون پیکربندی صریح محیط اجرا دارد، آن را تعمیر کنید:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    اگر `models auth list --provider openai-codex` هیچ پروفایل قابل استفاده‌ای نشان نمی‌دهد،
    دوباره وارد شوید:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` همچنان شناسه provider احراز هویت/پروفایل است. `openai/*`
    مسیر مدل برای نوبت‌های عامل OpenAI از طریق Codex است.

    ### نشانگر وضعیت

    گفت‌وگوی `/status` نشان می‌دهد کدام محیط اجرای مدل برای نشست فعلی فعال است.
    هارنس همراه app-server مربوط به Codex برای نوبت‌های مدل عامل OpenAI به‌صورت
    `Runtime: OpenAI Codex` ظاهر می‌شود. pinهای نشست قدیمی PI به Codex تعمیر می‌شوند مگر اینکه
    پیکربندی به‌طور صریح PI را pin کرده باشد.

    ### هشدار doctor

    اگر مسیرهای `openai-codex/*` یا pinهای قدیمی OpenAI PI در پیکربندی یا
    وضعیت نشست باقی بمانند، `openclaw doctor --fix` آن‌ها را به `openai/*` با
    محیط اجرای Codex بازنویسی می‌کند، مگر اینکه PI به‌طور صریح پیکربندی شده باشد.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه محیط اجرا را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai/gpt-5.5` از طریق کاتالوگ OAuth مربوط به Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض `contextTokens` محیط اجرا: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های تاخیر و کیفیت بهتری دارد. آن را با `contextTokens` بازنویسی کنید:

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
    از `contextWindow` برای اعلام فراداده بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجه زمینه محیط اجرا استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ upstream مربوط به Codex برای `gpt-5.5` موجود باشد،
    از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجرای cron، عامل فرعی، و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت بومی app-server مربوط به Codex

هارنس بومی app-server مربوط به Codex از مراجع مدل `openai/*` به‌همراه پیکربندی
محیط اجرای حذف‌شده یا provider/model `agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن همچنان
مبتنی بر حساب است. OpenClaw
احراز هویت را به این ترتیب انتخاب می‌کند:

1. یک پروفایل احراز هویت صریح OpenClaw `openai-codex` که به عامل متصل است.
2. حساب موجود app-server، مانند ورود محلی ChatGPT در Codex CLI.
3. فقط برای اجرای محلی app-server از طریق stdio، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌دهد و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی ورود محلی اشتراک ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود که
فرایند Gateway همچنین برای مدل‌های مستقیم OpenAI یا embeddingها `OPENAI_API_KEY`
دارد. fallback کلید API در env فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های WebSocket app-server فرستاده نمی‌شود. وقتی یک پروفایل Codex
به سبک اشتراکی انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند stdio app-server ایجادشده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server می‌فرستد.

## تولید تصویر

Plugin همراه `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این ابزار هم تولید تصویر با کلید API مربوط به OpenAI و هم تولید تصویر با OAuth مربوط به Codex
را از طریق همان مرجع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                | کلید API مربوط به OpenAI                     | OAuth مربوط به Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                      | `OPENAI_API_KEY`                   | ورود OAuth مربوط به OpenAI Codex           |
| انتقال                 | OpenAI Images API                  | backend مربوط به Codex Responses              |
| بیشینه تصاویر در هر درخواست    | 4                                  | 4                                    |
| حالت ویرایش                 | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع)   |
| بازنویسی اندازه            | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K   | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K     |
| نسبت ابعاد / وضوح | به OpenAI Images API ارسال نمی‌شود | در صورت امن بودن به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب provider، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض هم برای تولید متن به تصویر OpenAI و هم برای ویرایش تصویر
است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده‌اند. برای خروجی PNG/WebP با پس‌زمینه شفاف
از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
`background: "transparent"` را رد می‌کند.

برای یک درخواست با پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی provider یعنی `openai.background`
همچنان پذیرفته می‌شود. OpenClaw همچنین مسیرهای عمومی OpenAI و
OAuth مربوط به OpenAI Codex را با بازنویسی درخواست‌های شفاف پیش‌فرض
`openai/gpt-image-2` به `gpt-image-1.5` محافظت می‌کند؛ Azure و endpointهای سفارشی
سازگار با OpenAI نام‌های deployment/model پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجرای headless در CLI نیز در دسترس است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همین پرچم‌های `--output-format` و `--background`
را با `openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان یک alias مخصوص OpenAI در دسترس است.

برای نصب‌های OAuth مربوط به Codex، همان مرجع `openai/gpt-image-2` را نگه دارید. وقتی یک
پروفایل OAuth با `openai-codex` پیکربندی شده باشد، OpenClaw آن token دسترسی OAuth ذخیره‌شده
را resolve می‌کند و درخواست‌های تصویر را از طریق backend مربوط به Codex Responses می‌فرستد. ابتدا
`OPENAI_API_KEY` را امتحان نمی‌کند و برای آن درخواست بی‌صدا به کلید API fallback
نمی‌کند. وقتی مسیر مستقیم OpenAI Images API را می‌خواهید،
`models.providers.openai` را به‌طور صریح با یک کلید API،
base URL سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.
اگر آن endpoint تصویر سفارشی روی یک نشانی LAN/خصوصی قابل اعتماد است، همچنین
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

Plugin همراه `openai` تولید ویدئو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت       | مقدار                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض    | `openai/sora-2`                                                                   |
| حالت‌ها            | متن به ویدئو، تصویر به ویدئو، ویرایش تک‌ویدئو                                  |
| ورودی‌های مرجع | 1 تصویر یا 1 ویدئو                                                                |
| بازنویسی اندازه   | پشتیبانی می‌شود                                                                         |
| سایر بازنویسی‌ها  | `aspectRatio`، `resolution`، `audio`، `watermark` با یک هشدار ابزار نادیده گرفته می‌شوند |

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
برای پارامترهای مشترک ابزار، انتخاب provider، و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت prompt در GPT-5

OpenClaw برای اجراهای خانواده GPT-5 در سراسر providerها یک مشارکت prompt مشترک GPT-5 اضافه می‌کند. این بر اساس شناسه مدل اعمال می‌شود، بنابراین `openai/gpt-5.5`، مراجع قدیمی پیش از تعمیر مانند `openai-codex/gpt-5.5`، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و دیگر مراجع سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x این را دریافت نمی‌کنند.

هارنس بومی همراه Codex همان رفتار GPT-5 و overlay مربوط به Heartbeat را از طریق دستورالعمل‌های توسعه‌دهنده app-server مربوط به Codex استفاده می‌کند، بنابراین نشست‌های `openai/gpt-5.x` که از طریق Codex مسیریابی شده‌اند همان راهنمایی follow-through و Heartbeat کنش‌گرانه را حفظ می‌کنند، حتی با اینکه Codex مالک بقیه prompt هارنس است.

افزوده‌ی GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری پرسونا، ایمنی اجرا، نظم ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی اضافه می‌کند. رفتار پاسخ‌دهی مختص کانال و پیام‌های بی‌صدا در اعلان سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. راهنمای GPT-5 همیشه برای مدل‌های منطبق فعال است. لایه‌ی سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | لایه‌ی سبک تعامل دوستانه را فعال می‌کند |
| `"on"`                 | نام مستعار برای `"friendly"`                      |
| `"off"`                | فقط لایه‌ی سبک دوستانه را غیرفعال می‌کند       |

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
مقادیر هنگام اجرا به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه‌ی سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
`plugins.entries.openai.config.personality` قدیمی همچنان به‌عنوان پشتیبان سازگاری خوانده می‌شود، وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin بسته‌بندی‌شده‌ی `openai` تبدیل متن به گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.voice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای یادداشت‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |
    | نشانی پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | بدنه‌ی اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم‌نشده) |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشده‌ی OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای نقاط پایانی سازگار با OpenAI استفاده کنید که به کلیدهای اضافی مانند `lang` نیاز دارند. کلیدهای نمونه‌ی اولیه نادیده گرفته می‌شوند.

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
    برای بازنویسی نشانی پایه‌ی TTS بدون اثرگذاری بر نقطه‌ی پایانی API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید. TTS در OpenAI همچنان از طریق کلید API پیکربندی می‌شود؛ برای پاسخ‌گویی گفتاری زنده‌ی فقط OAuth، به‌جای گفتار STT -> TTS در حالت agent، از مسیر صدای Realtime استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin بسته‌بندی‌شده‌ی `openai` تبدیل گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانه‌ی OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطه‌ی پایانی: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - در هر جایی از OpenClaw که رونویسی صوت ورودی از
      `tools.media.audio` استفاده می‌کند پشتیبانی می‌شود، از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

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

    راهنمایی‌های زبان و اعلان، وقتی از سوی پیکربندی مشترک رسانه‌ی صوتی یا درخواست رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="Realtime transcription">
    Plugin بسته‌بندی‌شده‌ی `openai` رونویسی Realtime را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | اعلان | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه‌ی VAD | `...openai.vadThreshold` | `0.5` |
    | احراز هویت | `...openai.apiKey`، `OPENAI_API_KEY`، یا OAuth مربوط به `openai-codex` | کلیدهای API مستقیم وصل می‌شوند؛ OAuth یک راز مشتری رونویسی Realtime صادر می‌کند |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. وقتی فقط OAuth مربوط به `openai-codex` پیکربندی شده باشد، Gateway پیش از باز کردن WebSocket یک راز موقت مشتری رونویسی Realtime صادر می‌کند. این ارائه‌دهنده‌ی استریم برای مسیر رونویسی Realtime تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin بسته‌بندی‌شده‌ی `openai` صدای Realtime را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | صدا | `...openai.voice` | `alloy` |
    | دما (پل استقرار Azure) | `...openai.temperature` | `0.8` |
    | آستانه‌ی VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | فاصله‌گذاری پیشوند | `...openai.prefixPaddingMs` | `300` |
    | تلاش استدلال | `...openai.reasoningEffort` | (تنظیم‌نشده) |
    | احراز هویت | `...openai.apiKey`، `OPENAI_API_KEY`، یا OAuth مربوط به `openai-codex` | Browser Talk و پل‌های پشتیبان غیر Azure می‌توانند از OAuth مربوط به Codex استفاده کنند |

    صداهای داخلی Realtime موجود برای `gpt-realtime-2`: `alloy`، `ash`،
    `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، `cedar`.
    OpenAI برای بهترین کیفیت Realtime، `marin` و `cedar` را توصیه می‌کند. این
    مجموعه‌ای جدا از صداهای تبدیل متن به گفتار بالاست؛ فرض نکنید یک صدای TTS
    مانند `fable`، `nova`، یا `onyx` برای نشست‌های Realtime معتبر است.

    <Note>
    پل‌های Realtime پشتیبان OpenAI از شکل نشست WebSocket مربوط به GA Realtime استفاده می‌کنند که `session.temperature` را نمی‌پذیرد. استقرارهای Azure OpenAI همچنان از طریق `azureEndpoint` و `azureDeployment` در دسترس می‌مانند و شکل نشست سازگار با استقرار را حفظ می‌کنند. از فراخوانی ابزار دوسویه و صوت G.711 u-law پشتیبانی می‌کند.
    </Note>

    <Note>
    صدای Realtime هنگام ایجاد نشست انتخاب می‌شود. OpenAI اجازه می‌دهد بیشتر
    فیلدهای نشست بعدا تغییر کنند، اما پس از اینکه مدل در آن نشست صوت منتشر کرد،
    صدا قابل تغییر نیست. OpenClaw در حال حاضر شناسه‌های صدای داخلی Realtime را
    به‌صورت رشته ارائه می‌کند.
    </Note>

    <Note>
    Control UI Talk از نشست‌های Realtime مرورگر OpenAI با یک راز موقت مشتری
    صادرشده توسط Gateway و یک تبادل مستقیم WebRTC SDP مرورگر در برابر API
    Realtime OpenAI استفاده می‌کند. وقتی هیچ کلید API مستقیم OpenAI پیکربندی نشده باشد،
    Gateway می‌تواند آن راز مشتری را با پروفایل OAuth انتخاب‌شده‌ی `openai-codex`
    صادر کند. رله‌ی Gateway و پل‌های WebSocket پشتیبان Realtime تماس صوتی از
    همان پشتیبان OAuth برای نقاط پایانی بومی OpenAI استفاده می‌کنند. راستی‌آزمایی زنده‌ی نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ شاخه‌های OpenAI هم پل WebSocket پشتیبان و هم تبادل
    WebRTC SDP مرورگر را بدون ثبت رازها راستی‌آزمایی می‌کنند.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط پایانی Azure OpenAI

ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` می‌تواند با بازنویسی نشانی پایه، یک منبع Azure OpenAI را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام‌های میزبان Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار به شکل درخواست Azure جابه‌جا می‌شود.

<Note>
صدای Realtime از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تاثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای Realtime** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI استفاده کنید وقتی:

- از قبل اشتراک، سهمیه، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت داده‌ی منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک مستاجری Azure موجود نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai`،
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

برای درخواست‌های تولید تصویر روی یک میزبان Azure شناخته‌شده، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` می‌فرستد
- از مسیرهای محدود به استقرار (`/openai/deployments/{deployment}/...`) استفاده می‌کند
- `?api-version=...` را به هر درخواست اضافه می‌کند
- از زمان‌پایان پیش‌فرض 600 ثانیه برای فراخوانی‌های تولید تصویر Azure استفاده می‌کند.
  مقادیر `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

نشانی‌های پایه‌ی دیگر (OpenAI عمومی، پروکسی‌های سازگار با OpenAI) شکل استاندارد درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهنده‌ی `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند نقطه‌ی پایانی عمومی OpenAI در نظر می‌گیرند و در برابر استقرارهای تصویر Azure شکست می‌خورند.
</Note>

### نسخه‌ی API

برای ثابت کردن یک نسخه‌ی Azure پیش‌نمایش یا GA مشخص
برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام‌های مدل، نام‌های استقرار هستند

Azure OpenAI مدل‌ها را به استقرارها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw
باید **نام استقرار Azure** باشد که در پرتال Azure پیکربندی کرده‌اید، نه
شناسه‌ی مدل عمومی OpenAI.

اگر استقراری به نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را سرو می‌کند:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده‌ی نام استقرار برای فراخوانی‌های تولید تصویر که از طریق
ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `openai` مسیریابی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد یک استقرار، فهرست مناطق فعلی Microsoft را بررسی کنید
و تایید کنید که مدل مشخص در منطقه‌ی شما ارائه می‌شود.

### تفاوت‌های پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی اجازه می‌دهد رد کند (برای مثال برخی
مقادیر `background` روی `gpt-image-2`) یا آنها را فقط روی نسخه‌های مشخص مدل
ارائه کند. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعه‌ی
پارامترهای پشتیبانی‌شده توسط استقرار مشخص و نسخه‌ی API خود را در
پرتال Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما هدرهای پنهان نسبت‌دهی OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI** را در [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک چت یا Responses روی Azure (فراتر از تولید تصویر)، از جریان راه‌اندازی اولیه یا یک پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید — `openai.baseUrl` به‌تنهایی شکل API/احراز هویت Azure را اعمال نمی‌کند. یک ارائه‌دهنده جداگانه `azure-openai-responses/*` وجود دارد؛ آکاردئون Compaction سمت سرور را در ادامه ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای `openai/*` ابتدا از WebSocket استفاده می‌کند و SSE را به‌عنوان گزینه جایگزین (`"auto"`) دارد.

    در حالت `"auto"`، OpenClaw:
    - پیش از بازگشت به SSE، یک شکست زودهنگام WebSocket را دوباره امتحان می‌کند
    - پس از یک شکست، WebSocket را حدود ۶۰ ثانیه تنزل‌یافته علامت‌گذاری می‌کند و در دوره خنک‌سازی از SSE استفاده می‌کند
    - هدرهای پایدار هویت نشست و نوبت را برای تلاش‌های دوباره و اتصال‌های دوباره پیوست می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را در گونه‌های مختلف انتقال عادی‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، سپس جایگزین SSE |
    | `"sse"` | فقط SSE را اجبار کن |
    | `"websocket"` | فقط WebSocket را اجبار کن |

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

    مستندات مرتبط OpenAI:
    - [Realtime API با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="حالت سریع">
    OpenClaw یک کلید مشترک حالت سریع را برای `openai/*` ارائه می‌کند:

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
    بازنویسی‌های نشست بر پیکربندی اولویت دارند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به مقدار پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API شرکت OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را در OpenClaw برای هر مدل تنظیم کنید:

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
    `serviceTier` فقط به endpointهای بومی OpenAI (`api.openai.com`) و endpointهای بومی Codex (`chatgpt.com/backend-api`) فرستاده می‌شود. اگر هرکدام از ارائه‌دهنده‌ها را از طریق پراکسی مسیریابی کنید، OpenClaw مقدار `service_tier` را دست‌نخورده باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش‌دهنده جریان Pi-harness در Plugin مربوط به OpenAI، Compaction سمت سرور را به‌طور خودکار فعال می‌کند:

    - `store: true` را اجبار می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ۷۰٪ از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این برای مسیر Pi harness داخلی و hookهای ارائه‌دهنده OpenAI که در اجراهای تعبیه‌شده استفاده می‌شوند اعمال می‌شود. harness سرور برنامه بومی Codex زمینه خودش را از طریق Codex مدیریت می‌کند و توسط مسیر عامل پیش‌فرض OpenAI یا سیاست زمان اجرای ارائه‌دهنده/مدل پیکربندی می‌شود.

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
    - دیگر وقتی یک کنش ابزار در دسترس است، یک نوبت فقط شامل برنامه را پیشرفت موفق تلقی نمی‌کند
    - نوبت را با هدایت «اکنون اقدام کن» دوباره امتحان می‌کند
    - برای کارهای قابل‌توجه `update_plan` را به‌طور خودکار فعال می‌کند
    - اگر مدل همچنان بدون اقدام فقط برنامه‌ریزی کند، یک وضعیت مسدود صریح نشان می‌دهد

    <Note>
    فقط به اجراهای خانواده GPT-5 در OpenAI و Codex محدود است. ارائه‌دهنده‌های دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw endpointهای مستقیم OpenAI، Codex و Azure OpenAI را متفاوت از پراکسی‌های عمومی سازگار با OpenAI روی `/v1` در نظر می‌گیرد:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از تلاش `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا پراکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای ابزار را به‌طور پیش‌فرض در حالت strict قرار می‌دهد
    - هدرهای پنهان نسبت‌دهی را فقط روی میزبان‌های بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست ویژه OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، اشاره‌های prompt-cache)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کنند
    - `store` مربوط به Completions را از payloadهای غیربومی `openai-completions` حذف می‌کنند
    - گذردهی JSON پیشرفته `params.extra_body`/`params.extraBody` را برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرند
    - schemaهای ابزار strict یا هدرهای فقط بومی را اجبار نمی‌کنند

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما هدرهای پنهان نسبت‌دهی را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
