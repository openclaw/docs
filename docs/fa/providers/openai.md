---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - شما احراز هویت اشتراک Codex را به‌جای کلیدهای API می‌خواهید
    - به رفتار اجرای عامل GPT-5 سخت‌گیرانه‌تری نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:29:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT ارائه می‌کند، و Codex نیز به‌عنوان عامل کدنویسیِ طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw برای هر دو شکل احراز هویت از یک شناسهٔ ارائه‌دهنده، `openai`، استفاده می‌کند.

OpenClaw از `openai/*` به‌عنوان مسیر رسمی مدل OpenAI استفاده می‌کند. نوبت‌های عاملِ تعبیه‌شده روی مدل‌های OpenAI به‌طور پیش‌فرض از طریق زمان‌اجرای بومی سرور برنامهٔ Codex اجرا می‌شوند؛ احراز هویت مستقیم با کلید API OpenAI همچنان برای سطوح غیرعاملی OpenAI مانند تصاویر، جاسازی‌ها، گفتار، و بلادرنگ در دسترس است.

- **مدل‌های عامل** - مدل‌های `openai/*` از طریق زمان‌اجرای Codex؛ برای استفاده از اشتراک ChatGPT/Codex با احراز هویت Codex وارد شوید، یا وقتی عمداً احراز هویت با کلید API می‌خواهید، یک پروفایل پشتیبانِ کلید API سازگار با Codex برای OpenAI پیکربندی کنید.
- **APIهای غیرعاملی OpenAI** - دسترسی مستقیم به OpenAI Platform با صورتحساب مبتنی بر مصرف از طریق `OPENAI_API_KEY` یا راه‌اندازی کلید API OpenAI.
- **پیکربندی قدیمی** - ارجاع‌های قدیمی مدل Codex توسط `openclaw doctor --fix` به `openai/*` به‌همراه زمان‌اجرای Codex اصلاح می‌شوند.

OpenAI صراحتاً از استفادهٔ OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان‌اجرا، و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها با هم مخلوط می‌شوند، پیش از تغییر پیکربندی [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده                                                   | نکات                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex | `openai/gpt-5.5`                                         | راه‌اندازی پیش‌فرض عامل OpenAI. با احراز هویت Codex وارد شوید.                  |
| پیش‌نمایش محدود GPT-5.6                              | `openai/gpt-5.6-sol`, `-terra`, یا `-luna`                | به یک سازمان API تأییدشده توسط OpenAI یا فضای کاری Codex نیاز دارد.      |
| صورتحساب مستقیم کلید API برای مدل‌های عامل              | `openai/gpt-5.5` به‌همراه یک پروفایل کلید API سازگار با Codex | از `auth.order.openai` استفاده کنید تا پشتیبان پس از احراز هویت اشتراکی قرار بگیرد.  |
| صورتحساب مستقیم کلید API از طریق OpenClaw صریح     | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `openclaw`  | یک پروفایل عادی کلید API برای `openai` انتخاب کنید.                             |
| آخرین نام مستعار ChatGPT Instant API                     | `openai/chat-latest`                                     | فقط با کلید API مستقیم. نام مستعار متحرک برای آزمایش‌ها، نه پیش‌فرض.   |
| احراز هویت اشتراک ChatGPT/Codex از طریق OpenClaw     | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `openclaw`  | برای مسیر سازگاری، یک پروفایل OAuth برای `openai` انتخاب کنید.         |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                                     | با `OPENAI_API_KEY` یا OAuth مربوط به OpenAI Codex کار می‌کند.             |
| تصاویر با پس‌زمینهٔ شفاف                        | `openai/gpt-image-1.5`                                   | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید. |

## نگاشت نام‌ها

نام‌ها مشابه‌اند اما قابل‌جایگزینی با یکدیگر نیستند:

| نامی که می‌بینید                            | لایه             | معنی                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | پیشوند ارائه‌دهنده   | مسیر رسمی مدل OpenAI؛ نوبت‌های عامل از زمان‌اجرای Codex استفاده می‌کنند.                                  |
| پیشوند قدیمی OpenAI Codex              | پیشوند قدیمی     | فضای نام قدیمی‌تر مدل/پروفایل. `openclaw doctor --fix` آن را به `openai` مهاجرت می‌دهد.                   |
| Plugin `codex`                          | Plugin            | Plugin همراه OpenClaw که زمان‌اجرای بومی سرور برنامهٔ Codex و کنترل‌های گفتگوی `/codex` را فراهم می‌کند. |
| provider/model `agentRuntime.id: codex` | زمان‌اجرای عامل     | اجبار استفاده از هارنس بومی سرور برنامهٔ Codex برای نوبت‌های تعبیه‌شدهٔ منطبق.                            |
| `/codex ...`                            | مجموعه فرمان گفتگو  | اتصال/کنترل رشته‌های سرور برنامهٔ Codex از یک مکالمه.                                        |
| `runtime: "acp", agentId: "codex"`      | مسیر نشست ACP | مسیر جایگزین صریح که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

یعنی یک پیکربندی می‌تواند عمداً شامل ارجاع‌های مدل `openai/*` باشد، در حالی‌که پروفایل‌های احراز هویت به اعتبارنامه‌های کلید API یا OAuth مربوط به ChatGPT/Codex اشاره کنند. برای پیکربندی از `auth.order.openai` استفاده کنید؛ `openclaw doctor --fix` ارجاع‌های قدیمی مدل Codex، شناسه‌های قدیمی پروفایل احراز هویت Codex، و ترتیب قدیمی احراز هویت Codex را به مسیر رسمی OpenAI بازنویسی می‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم کلید API در OpenAI Platform و هم از طریق مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex، از `openai/gpt-5.5` استفاده کنید؛ اکنون نبود پیکربندی زمان‌اجرا، هارنس Codex را برای نوبت‌های عامل OpenAI انتخاب می‌کند. فقط وقتی از پروفایل‌های کلید API OpenAI استفاده کنید که احراز هویت مستقیم با کلید API را برای یک مدل عامل OpenAI می‌خواهید.
</Note>

## پیش‌نمایش محدود GPT-5.6

OpenClaw سه شناسهٔ عمومی مدل GPT-5.6 را می‌شناسد:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

هر سه در کاتالوگ فعلی سرور برنامهٔ Codex استدلال `max` را ارائه می‌کنند. اطلاعیهٔ انتشار OpenAI، Sol را سطح پرچم‌دار، Terra را سطح متوازن، و Luna را سطح سریع و کم‌هزینه‌تر توصیف می‌کند. [اطلاعیهٔ انتشار GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) و [راهنمای دسترسی به پیش‌نمایش](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) را ببینید.

دسترسی در طول پیش‌نمایش فهرست‌مجاز است و می‌تواند جداگانه برای API و Codex اعطا شود. داشتن یک طرح پولی ChatGPT به‌تنهایی دسترسی نمی‌دهد. OpenClaw همچنان `openai/gpt-5.5` را به‌عنوان پیش‌فرض نگه می‌دارد؛ انتخاب یک ارجاع GPT-5.6 بدون دسترسی، به‌جای بازگشت بی‌صدا، خطای دسترسی بالادستی را برمی‌گرداند.

<Note>
نوبت‌های مدل عامل OpenAI به Plugin همراه سرور برنامهٔ Codex نیاز دارند. پیکربندی صریح زمان‌اجرای OpenClaw همچنان به‌عنوان مسیر سازگاری اختیاری در دسترس است. وقتی OpenClaw صراحتاً با یک پروفایل OAuth برای `openai` انتخاب شود، OpenClaw ارجاع عمومی مدل را به‌صورت `openai/*` نگه می‌دارد و در داخل از طریق انتقالِ احراز هویت Codex مسیریابی می‌کند. برای اصلاح ارجاع‌های قدیمی مدل Codex، `codex-cli/*`، یا پین‌های قدیمی نشست زمان‌اجرا که از پیکربندی صریح زمان‌اجرا نمی‌آیند، `openclaw doctor --fix` را اجرا کنید.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                                                                | وضعیت                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| گفتگو / پاسخ‌ها          | ارائه‌دهندهٔ مدل `openai/<model>`                                                               | بله                                                                    |
| مدل‌های اشتراکی Codex | `openai/<model>` با OAuth مربوط به OpenAI                                                            | بله                                                                    |
| ارجاع‌های قدیمی مدل Codex   | ارجاع‌های قدیمی مدل Codex یا `codex-cli/<model>`                                                | توسط doctor به `openai/<model>` اصلاح می‌شود                                 |
| هارنس سرور برنامهٔ Codex  | `openai/<model>` با زمان‌اجرای حذف‌شده یا ارائه‌دهنده/مدل `agentRuntime.id: codex`              | بله                                                                    |
| جستجوی وب سمت سرور    | ابزار بومی OpenAI Responses                                                                  | بله، وقتی جستجوی وب فعال باشد و هیچ ارائه‌دهنده‌ای پین نشده باشد                 |
| تصاویر                    | `image_generate`                                                                              | بله                                                                    |
| ویدیوها                    | `video_generate`                                                                              | بله                                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                                                     | بله                                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                                                     | بله                                                                    |
| تبدیل گفتار به متن جریانی  | تماس صوتی `streaming.provider: "openai"`                                                     | بله                                                                    |
| صدای بلادرنگ            | تماس صوتی `realtime.provider: "openai"` / گفتگوی Control UI با `talk.realtime.provider: "openai"` | بله (به اعتبار OpenAI Platform نیاز دارد، نه اشتراک Codex/ChatGPT) |
| جاسازی‌ها                | ارائه‌دهندهٔ جاسازی حافظه                                                                     | بله                                                                    |

<Note>
  صدای بلادرنگ OpenAI (که توسط `realtime.provider: "openai"` در تماس صوتی و
  گفتگوی Control UI با `talk.realtime.provider: "openai"` استفاده می‌شود) از طریق
  **OpenAI Platform Realtime API** عمومی عبور می‌کند، که به‌جای سهمیهٔ اشتراک
  Codex/ChatGPT، از اعتبار OpenAI Platform صورتحساب می‌شود. حسابی که OAuth سالم OpenAI دارد و مدل‌های گفتگوی پشتیبانی‌شده با Codex را بدون مشکل اجرا می‌کند،
  همچنان برای صدای بلادرنگ به یک پروفایل احراز هویت کلید API برای OpenAI یا یک کلید API پلتفرم با صورتحساب دارای اعتبار Platform نیاز دارد.

اصلاح: اعتبار Platform را در
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
برای سازمان پشتیبان اعتبارنامه‌های بلادرنگ خود شارژ کنید. صدای بلادرنگ پروفایل احراز هویت کلید API برای `openai` را که توسط `openclaw onboard --auth-choice openai-api-key` ساخته شده است می‌پذیرد،
یک `OPENAI_API_KEY` پلتفرم که از طریق `talk.realtime.providers.openai.apiKey`
برای گفتگوی Control UI پیکربندی شده، `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
برای تماس صوتی، یا متغیر محیطی `OPENAI_API_KEY`. پروفایل‌های OAuth مربوط به OpenAI
همچنان می‌توانند مدل‌های گفتگوی `openai/*` پشتیبانی‌شده با Codex را در همان نصب
OpenClaw اجرا کنند، اما صدای بلادرنگ را پیکربندی نمی‌کنند.
</Note>

## جاسازی‌های حافظه

OpenClaw می‌تواند از OpenAI، یا یک نقطهٔ پایانی جاسازی سازگار با OpenAI، برای
نمایه‌سازی `memory_search` و جاسازی‌های پرس‌وجو استفاده کند:

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

برای نقاط پایانی سازگار با OpenAI که به برچسب‌های جاسازی نامتقارن نیاز دارند،
`queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw
آن‌ها را به‌عنوان فیلدهای درخواست `input_type` ویژهٔ ارائه‌دهنده ارسال می‌کند: جاسازی‌های پرس‌وجو از
`queryInputType` استفاده می‌کنند؛ قطعه‌های حافظهٔ نمایه‌شده و نمایه‌سازی دسته‌ای از
`documentInputType` استفاده می‌کنند. برای نمونهٔ کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم API و صورتحساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) یک کلید API ایجاد یا کپی کنید.
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
      <Step title="تأیید کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل              | پیکربندی زمان اجرا             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس app-server Codex | پروفایل OpenAI سازگار با Codex |
    | `openai/gpt-5.4-mini` | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس app-server Codex | پروفایل OpenAI سازگار با Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | زمان اجرای تعبیه‌شده OpenClaw      | پروفایل `openai` انتخاب‌شده |

    <Note>
    مدل‌های عامل `openai/*` از هارنس app-server Codex استفاده می‌کنند. برای استفاده از
    احراز هویت کلید API برای یک مدل عامل، یک پروفایل کلید API سازگار با Codex بسازید و
    آن را با `auth.order.openai` مرتب کنید؛ `OPENAI_API_KEY` همچنان fallback مستقیم برای
    سطح‌های API غیرعاملی OpenAI باقی می‌ماند. برای مهاجرت ورودی‌های قدیمی ترتیب احراز هویت Codex،
    `openclaw doctor --fix` را اجرا کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    برای امتحان مدل Instant فعلی ChatGPT از OpenAI API، مدل را
    روی `openai/chat-latest` تنظیم کنید:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` یک alias متحرک است. OpenAI آن را به‌عنوان جدیدترین مدل Instant
    استفاده‌شده در ChatGPT مستند کرده و `gpt-5.5` را برای استفاده تولیدی از API توصیه می‌کند، بنابراین
    `openai/gpt-5.5` را به‌عنوان پیش‌فرض پایدار نگه دارید، مگر اینکه صریحاً آن
    رفتار alias را بخواهید. این alias در حال حاضر فقط پرگویی متنی `medium` را می‌پذیرد، بنابراین
    OpenClaw بازنویسی‌های ناسازگار پرگویی متن OpenAI را برای این
    مدل نرمال‌سازی می‌کند.

    <Warning>
    OpenClaw، `gpt-5.3-codex-spark` را در مسیر مستقیم کلید API OpenAI در معرض استفاده قرار نمی‌دهد. این مدل فقط از طریق ورودی‌های کاتالوگ اشتراک Codex در دسترس است، وقتی حساب واردشده شما آن را ارائه کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی app-server Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود به ChatGPT نیاز دارد.

    <Steps>
      <Step title="اجرای OAuth برای Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        یا OAuth را مستقیم اجرا کنید:

        ```bash
        openclaw models auth login --provider openai
        ```

        برای راه‌اندازی‌های headless یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost، با جریان device-code ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="استفاده از مسیر کانونی مدل OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        برای مسیر پیش‌فرض، هیچ پیکربندی زمان اجرایی لازم نیست. نوبت‌های عامل OpenAI
        زمان اجرای بومی app-server Codex را به‌طور خودکار انتخاب می‌کنند، و OpenClaw
        وقتی این مسیر انتخاب شود، Plugin بسته‌بندی‌شده Codex را نصب یا ترمیم می‌کند.
      </Step>
      <Step title="تأیید کنید احراز هویت Codex در دسترس است">
        ```bash
        openclaw models list --provider openai
        ```

        پس از اجرای gateway، در چت `/codex status` یا `/codex models`
        را ارسال کنید تا زمان اجرای بومی app-server را تأیید کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی زمان اجرا | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | حذف‌شده / provider/model `agentRuntime.id: "codex"` | هارنس بومی app-server Codex | ورود به Codex یا پروفایل احراز هویت `openai` مرتب‌شده |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | زمان اجرای تعبیه‌شده OpenClaw با انتقال داخلی احراز هویت Codex | پروفایل OAuth انتخاب‌شده `openai` |
    | ارجاع قدیمی Codex GPT-5.5 | ترمیم‌شده توسط doctor | مسیر قدیمی بازنویسی‌شده به `openai/gpt-5.5` | پروفایل OAuth مهاجرت‌داده‌شده OpenAI |
    | `codex-cli/gpt-5.5` | ترمیم‌شده توسط doctor | مسیر قدیمی CLI بازنویسی‌شده به `openai/gpt-5.5` | احراز هویت app-server Codex |

    <Warning>
    برای پیکربندی عامل جدیدِ پشتیبانی‌شده با اشتراک، `openai/gpt-5.5` را ترجیح دهید. ارجاع‌های قدیمی‌تر
    Codex GPT مسیرهای قدیمی OpenClaw هستند، نه مسیر زمان اجرای بومی Codex؛
    وقتی می‌خواهید آن‌ها را به ارجاع‌های کانونی `openai/*` مهاجرت دهید،
    `openclaw doctor --fix` را اجرا کنید. `gpt-5.3-codex-spark` همچنان به حساب‌هایی محدود است که
    کاتالوگ اشتراک Codex آن‌ها آن مدل را تبلیغ می‌کند؛ کلید API مستقیم OpenAI و
    ارجاع‌های Azure برای آن همچنان سرکوب می‌شوند.
    </Warning>

    <Note>
    پیشوند مدل قدیمی Codex پیکربندی قدیمی است که توسط doctor ترمیم می‌شود. برای
    راه‌اندازی رایج اشتراک به‌همراه زمان اجرای بومی، با احراز هویت Codex وارد شوید
    اما ارجاع مدل را به‌صورت `openai/gpt-5.5` نگه دارید. پیکربندی جدید باید ترتیب
    احراز هویت عامل OpenAI را زیر `auth.order.openai` قرار دهد؛ doctor ورودی‌های قدیمی‌تر
    ترتیب احراز هویت Codex را مهاجرت می‌دهد.
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

    با یک کلید API پشتیبان، مدل را روی `openai/gpt-5.5` نگه دارید و
    ترتیب احراز هویت را زیر `openai` بگذارید. OpenClaw ابتدا اشتراک را امتحان می‌کند، سپس
    کلید API را، در حالی که روی هارنس Codex باقی می‌ماند:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    راه‌اندازی اولیه دیگر مواد OAuth را از `~/.codex` وارد نمی‌کند. با OAuth مرورگر (پیش‌فرض) یا جریان device-code بالا وارد شوید — OpenClaw اعتبارنامه‌های حاصل را در مخزن احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### بررسی و بازیابی مسیریابی OAuth برای Codex

    از این دستورها استفاده کنید تا ببینید عامل پیش‌فرض شما از کدام مدل، زمان اجرا و مسیر
    احراز هویت استفاده می‌کند:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    برای یک عامل مشخص، `--agent <id>` را اضافه کنید:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    اگر یک پیکربندی قدیمی هنوز ارجاع‌های قدیمی Codex GPT یا یک pin نشست زمان اجرای OpenAI
    منسوخ بدون پیکربندی صریح زمان اجرا دارد، آن را ترمیم کنید:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    اگر `models auth list --provider openai` هیچ پروفایل قابل‌استفاده‌ای نشان نمی‌دهد، دوباره
    وارد شوید:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    وقتی چند ورود OAuth برای Codex را در همان
    عامل می‌خواهید و بعداً می‌خواهید آن‌ها را از طریق ترتیب احراز هویت یا `/model ...@<profileId>` کنترل کنید، از `--profile-id` استفاده کنید:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` مسیر مدل برای نوبت‌های عامل OpenAI از طریق Codex است. برای
    مهاجرت شناسه‌های پروفایل پیشوند قدیمی OpenAI Codex و
    ورودی‌های ترتیب پیش از تکیه بر ترتیب پروفایل‌ها، `openclaw doctor --fix` را اجرا کنید.

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام زمان اجرای مدل برای نشست فعلی فعال است.
    هارنس بسته‌بندی‌شده app-server Codex برای
    نوبت‌های مدل عامل OpenAI به‌صورت `Runtime: OpenAI Codex` ظاهر می‌شود. Pinهای نشست زمان اجرای OpenAI منسوخ به Codex ترمیم می‌شوند، مگر اینکه
    پیکربندی صریحاً OpenClaw را pin کرده باشد.

    ### هشدار doctor

    اگر ارجاع‌های قدیمی مدل Codex یا pinهای زمان اجرای OpenAI منسوخ در پیکربندی یا
    وضعیت نشست باقی بمانند، `openclaw doctor --fix` آن‌ها را با زمان اجرای
    Codex به `openai/*` بازنویسی می‌کند، مگر اینکه OpenClaw صریحاً پیکربندی شده باشد.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه زمان اجرا را به‌عنوان مقادیر جداگانه در نظر می‌گیرد.

    برای `openai/gpt-5.5` از طریق کاتالوگ OAuth برای Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض `contextTokens` زمان اجرا: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های تأخیر و کیفیت بهتری دارد. آن را با `contextTokens` بازنویسی کنید:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    از `contextWindow` برای اعلام فراداده بومی مدل استفاده کنید. از `contextTokens` برای محدود کردن بودجه زمینه زمان اجرا استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ بالادست Codex برای `gpt-5.5`
    موجود باشد، از آن استفاده می‌کند. اگر کشف زنده Codex ردیف `gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجرای‌های Cron، زیرعامل، و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت بومی app-server Codex

هارنس بومی app-server Codex از ارجاع‌های مدل `openai/*` به‌همراه پیکربندی
زمان اجرای حذف‌شده یا provider/model `agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن
همچنان مبتنی بر حساب است. OpenClaw احراز هویت را به این ترتیب انتخاب می‌کند:

1. پروفایل‌های احراز هویت OpenAI مرتب‌شده برای عامل، ترجیحاً زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های پروفایل احراز هویت قدیمی
   Codex و ترتیب احراز هویت قدیمی Codex، `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود app-server، مانند ورود محلی ChatGPT در Codex CLI.
3. فقط برای راه‌اندازی‌های محلی app-server از نوع stdio، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی یک ورود محلی اشتراک ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود
که فرایند gateway برای مدل‌های مستقیم OpenAI
یا embeddings هم `OPENAI_API_KEY` دارد. Fallback کلید API محیطی فقط مسیر محلی stdio بدون حساب است؛
به اتصال‌های app-server از نوع WebSocket ارسال نمی‌شود. وقتی یک پروفایل Codex
به سبک اشتراک انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند app-server از نوع stdio که spawn شده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server ارسال می‌کند. وقتی آن پروفایل اشتراک با
محدودیت استفاده Codex مسدود شود، OpenClaw می‌تواند بدون تغییر مدل انتخاب‌شده یا خروج از هارنس
Codex، به پروفایل کلید API مرتب‌شده بعدی `openai:*` بچرخد. پس از عبور زمان ریست اشتراک، پروفایل اشتراک
دوباره واجد شرایط می‌شود.

## تولید تصویر

Plugin بسته‌بندی‌شده `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این ابزار هم از تولید تصویر با کلید API OpenAI و هم از تولید تصویر با OAuth برای Codex
از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                 | کلید API OpenAI                    | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت               | `OPENAI_API_KEY`                   | ورود با OAuth OpenAI Codex           |
| انتقال                   | API تصاویر OpenAI                  | بک‌اند پاسخ‌های Codex                |
| بیشینه تصاویر در هر درخواست | 4                                  | 4                                    |
| حالت ویرایش              | فعال (تا 5 تصویر مرجع)             | فعال (تا 5 تصویر مرجع)               |
| بازنویسی اندازه‌ها       | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K |
| نسبت تصویر / وضوح        | به API تصاویر OpenAI ارسال نمی‌شود | در صورت ایمن بودن، به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
</Note>

`gpt-image-2` پیش‌فرض هر دو مورد تولید متن به تصویر OpenAI و ویرایش
تصویر است. `gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل استفاده هستند. برای خروجی PNG/WebP با پس‌زمینه
شفاف از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
گزینه `background: "transparent"` را رد می‌کند.

برای درخواست پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی‌تر ارائه‌دهنده
`openai.background` همچنان پذیرفته می‌شود. OpenClaw همچنین مسیرهای عمومی
OpenAI و OAuth OpenAI Codex را با بازنویسی درخواست‌های شفاف پیش‌فرض
`openai/gpt-image-2` به `gpt-image-1.5` محافظت می‌کند؛ Azure و نقاط پایانی
سفارشی سازگار با OpenAI نام‌های استقرار/مدل پیکربندی‌شده خود را نگه می‌دارند.

همین تنظیم برای اجراهای CLI بدون رابط نیز ارائه شده است:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

هنگام شروع از یک فایل ورودی، همین پرچم‌های `--output-format` و
`--background` را با `openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان نام مستعار ویژه OpenAI در دسترس است.
وقتی لازم است کیفیت و هزینه تصاویر OpenAI را کنترل کنید، از
`--quality low|medium|high|auto` استفاده کنید. برای ارسال راهنمای تعدیل
ویژه ارائه‌دهنده OpenAI از `image generate` یا `image edit`، از
`--openai-moderation low|auto` استفاده کنید.

برای نصب‌های OAuth ChatGPT/Codex، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک
نمایه OAuth مربوط به `openai` پیکربندی شده باشد، OpenClaw آن توکن دسترسی
OAuth ذخیره‌شده را resolve می‌کند و درخواست‌های تصویر را از طریق بک‌اند
پاسخ‌های Codex می‌فرستد. برای آن درخواست ابتدا `OPENAI_API_KEY` را امتحان
نمی‌کند و بی‌صدا به کلید API برنمی‌گردد. وقتی مسیر مستقیم API تصاویر OpenAI
را می‌خواهید، `models.providers.openai` را صراحتا با یک کلید API، نشانی پایه
سفارشی، یا نقطه پایانی Azure پیکربندی کنید.
اگر آن نقطه پایانی تصویر سفارشی روی یک نشانی LAN/خصوصی مورد اعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw
نقاط پایانی تصویر خصوصی/داخلی سازگار با OpenAI را تا زمانی که این opt-in
وجود نداشته باشد مسدود نگه می‌دارد.

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

Plugin همراه `openai` تولید ویدیو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت          | مقدار                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض      | `openai/sora-2`                                                                   |
| حالت‌ها          | متن به ویدیو، تصویر به ویدیو، ویرایش تک‌ویدیو                                    |
| ورودی‌های مرجع   | 1 تصویر یا 1 ویدیو                                                                |
| بازنویسی اندازه‌ها | برای متن به ویدیو و تصویر به ویدیو پشتیبانی می‌شود                              |
| بازنویسی‌های دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` با هشدار ابزار نادیده گرفته می‌شوند |

درخواست‌های تصویر به ویدیوی OpenAI از `POST /v1/videos` با یک
`input_reference` تصویری استفاده می‌کنند. ویرایش‌های تک‌ویدیو از
`POST /v1/videos/edits` با ویدیوی بارگذاری‌شده در فیلد `video` استفاده
می‌کنند.

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت پرامپت GPT-5

OpenClaw یک مشارکت پرامپت مشترک GPT-5 برای اجراهای خانواده GPT-5 روی سطوح پرامپتی که OpenClaw مونتاژ می‌کند اضافه می‌کند. این بر اساس شناسه مدل اعمال می‌شود، بنابراین مسیرهای OpenClaw/ارائه‌دهنده مانند ارجاع‌های قدیمی پیش از تعمیر legacy (ارجاع legacy Codex GPT-5.5)، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5`، و سایر ارجاع‌های سازگار GPT-5 همان پوشش را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x دریافت نمی‌کنند.

هارنس native Codex همراه، این پوشش GPT-5 متعلق به OpenClaw را از طریق دستورالعمل‌های توسعه‌دهنده app-server Codex دریافت نمی‌کند. native Codex رفتار پایه، مدل، و سندهای پروژه متعلق به Codex را نگه می‌دارد، در حالی که OpenClaw شخصیت داخلی Codex را برای threadهای native غیرفعال می‌کند تا فایل‌های شخصیت فضای کاری عامل مرجع باقی بمانند. OpenClaw فقط زمینه runtime مانند تحویل کانال، ابزارهای پویا OpenClaw، تفویض ACP، زمینه فضای کاری، و Skills مربوط به OpenClaw را مشارکت می‌دهد.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای پایداری persona، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و راستی‌آزمایی روی پرامپت‌های مونتاژشده توسط OpenClaw که مطابق باشند اضافه می‌کند. رفتار پاسخ ویژه کانال و پیام خاموش در پرامپت سیستم مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. لایه سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال‌سازی لایه سبک تعامل دوستانه |
| `"on"`                 | نام مستعار برای `"friendly"`                      |
| `"off"`                | فقط لایه سبک دوستانه را غیرفعال می‌کند       |

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
مقادیر در runtime به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
`plugins.entries.openai.config.personality` قدیمی همچنان زمانی به‌عنوان fallback سازگاری خوانده می‌شود که تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin همراه `openai` سنتز گفتار را برای سطح `messages.tts` ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | صدا | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | سرعت | `messages.tts.providers.openai.speed` | (تنظیم‌نشده) |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions` | (تنظیم‌نشده، فقط `gpt-4o-mini-tts`) |
    | قالب | `messages.tts.providers.openai.responseFormat` | `opus` برای یادداشت‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API | `messages.tts.providers.openai.apiKey` | به `OPENAI_API_KEY` برمی‌گردد |
    | نشانی پایه | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | بدنه اضافی | `messages.tts.providers.openai.extraBody` / `extra_body` | (تنظیم‌نشده) |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    `extraBody` پس از فیلدهای تولیدشده توسط OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای نقاط پایانی سازگار با OpenAI که به کلیدهای اضافی مانند `lang` نیاز دارند استفاده کنید. کلیدهای prototype نادیده گرفته می‌شوند.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    برای بازنویسی نشانی پایه TTS بدون تاثیر بر نقطه پایانی API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید. TTS OpenAI و صدای Realtime هر دو از طریق یک کلید API پلتفرم OpenAI پیکربندی می‌شوند؛ نصب‌های فقط OAuth همچنان می‌توانند از مدل‌های چت پشتیبانی‌شده توسط Codex استفاده کنند، اما نه از پاسخ گفتاری زنده OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin همراه `openai` تبدیل گفتار به متن دسته‌ای را از طریق
    سطح رونویسی درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطه پایانی: REST OpenAI با مسیر `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - هر جا رونویسی صوت ورودی از `tools.media.audio` استفاده کند توسط
      OpenClaw پشتیبانی می‌شود، شامل بخش‌های کانال صوتی Discord و پیوست‌های
      صوتی کانال

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

    راهنماهای زبان و پرامپت وقتی از طرف پیکربندی رسانه صوتی مشترک یا
    درخواست رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="Realtime transcription">
    Plugin همراه `openai` رونویسی Realtime را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان | `...openai.language` | (تنظیم‌نشده) |
    | پرامپت | `...openai.prompt` | (تنظیم‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs` | `800` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | احراز هویت | `...openai.apiKey`، `OPENAI_API_KEY`، یا OAuth `openai` | کلیدهای API مستقیم وصل می‌شوند؛ OAuth یک client secret برای رونویسی Realtime صادر می‌کند |

    <Note>
    از یک اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. وقتی فقط OAuth مربوط به `openai` پیکربندی شده باشد، Gateway پیش از باز کردن WebSocket یک client secret موقت برای رونویسی Realtime صادر می‌کند. این ارائه‌دهنده streaming برای مسیر رونویسی Realtime تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin همراه `openai` صدای Realtime را برای Plugin تماس صوتی ثبت می‌کند.

    | تنظیم | مسیر پیکربندی | پیش‌فرض |
    |---------|------------|---------|
    | مدل | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | صدا | `...openai.voice` | `alloy` |
    | دما (پل استقرار Azure) | `...openai.temperature` | `0.8` |
    | آستانه VAD | `...openai.vadThreshold` | `0.5` |
    | مدت سکوت | `...openai.silenceDurationMs` | `500` |
    | فاصله‌گذاری پیشوند | `...openai.prefixPaddingMs` | `300` |
    | تلاش استدلالی | `...openai.reasoningEffort` | (تنظیم‌نشده) |
    | احراز هویت | پروفایل احراز هویت کلید API با `openai`،‏ `...openai.apiKey`، یا `OPENAI_API_KEY` | کلید API ‏OpenAI Platform لازم است؛ OAuth ‏OpenAI صدای بی‌درنگ را پیکربندی نمی‌کند |

    صداهای بی‌درنگ داخلی موجود برای `gpt-realtime-2`:‏ `alloy`،‏ `ash`،
    `ballad`،‏ `coral`،‏ `echo`،‏ `sage`،‏ `shimmer`،‏ `verse`،‏ `marin`،‏ `cedar`.
    OpenAI برای بهترین کیفیت بی‌درنگ، `marin` و `cedar` را توصیه می‌کند. این
    مجموعه‌ای جدا از صداهای تبدیل متن به گفتار بالا است؛ فرض نکنید یک صدای TTS
    مانند `fable`،‏ `nova`، یا `onyx` برای نشست‌های بی‌درنگ معتبر است.

    <Note>
    پل‌های بی‌درنگ OpenAI در بک‌اند از شکل نشست GA Realtime WebSocket استفاده می‌کنند که `session.temperature` را نمی‌پذیرد. استقرارهای Azure OpenAI همچنان از طریق `azureEndpoint` و `azureDeployment` در دسترس می‌مانند و شکل نشست سازگار با استقرار را حفظ می‌کنند. از فراخوانی ابزار دوسویه و صدای G.711 u-law پشتیبانی می‌کند.
    </Note>

    <Note>
    صدای بی‌درنگ هنگام ایجاد نشست انتخاب می‌شود. OpenAI اجازه می‌دهد بیشتر
    فیلدهای نشست بعدا تغییر کنند، اما پس از اینکه مدل در آن نشست صدا منتشر کرد،
    صدا قابل تغییر نیست. OpenClaw در حال حاضر شناسه‌های صدای بی‌درنگ داخلی را
    به صورت رشته در دسترس می‌گذارد.
    </Note>

    <Note>
    گفت‌وگوی صوتی Control UI از نشست‌های بی‌درنگ مرورگر OpenAI با یک راز موقت
    کلاینت صادرشده توسط Gateway و تبادل مستقیم WebRTC SDP مرورگر در برابر
    OpenAI Realtime API استفاده می‌کند. Gateway آن راز کلاینت را با پروفایل
    احراز هویت کلید API انتخاب‌شده `openai` یا کلید API پیکربندی‌شده OpenAI Platform
    صادر می‌کند. رله Gateway و پل‌های WebSocket بی‌درنگ بک‌اند Voice Call از همان
    مسیر احراز هویت فقط-کلید-API برای نقاط پایانی بومی OpenAI استفاده می‌کنند. راستی‌آزمایی زنده
    نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ شاخه‌های OpenAI هم پل WebSocket بک‌اند و هم تبادل WebRTC SDP مرورگر
    را بدون ثبت رازها راستی‌آزمایی می‌کنند.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط پایانی Azure OpenAI

ارائه‌دهنده همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر
هدف بگیرد. در مسیر تولید تصویر، OpenClaw نام میزبان‌های Azure را روی `models.providers.openai.baseUrl`
تشخیص می‌دهد و به‌صورت خودکار به شکل درخواست Azure تغییر می‌کند.

<Note>
صدای بی‌درنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و از `models.providers.openai.baseUrl` تاثیر نمی‌گیرد. برای تنظیمات Azure آن،
آکاردئون **صدای بی‌درنگ** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI زمانی استفاده کنید که:

- از قبل اشتراک، سهمیه، یا توافق سازمانی Azure OpenAI دارید
- به اقامت داده منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک مستاجری Azure موجود نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده همراه `openai`، مقدار
`models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را
روی کلید Azure OpenAI تنظیم کنید (نه کلید OpenAI Platform):

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
- از مسیرهای محدود به استقرار (`/openai/deployments/{deployment}/...`) استفاده می‌کند
- به هر درخواست `?api-version=...` اضافه می‌کند
- از مهلت زمانی پیش‌فرض 600 ثانیه برای فراخوانی‌های تولید تصویر Azure استفاده می‌کند.
  مقادیر `timeoutMs` در هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایه دیگر (OpenAI عمومی، پراکسی‌های سازگار با OpenAI) شکل استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهنده `openai` به
OpenClaw 2026.4.22 یا بالاتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند نقطه پایانی عمومی OpenAI در نظر می‌گیرند و در برابر
استقرارهای تصویر Azure شکست می‌خورند.
</Note>

### نسخه API

برای سنجاق کردن یک نسخه پیش‌نمایش یا GA مشخص Azure
برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها همان نام‌های استقرار هستند

Azure OpenAI مدل‌ها را به استقرارها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده همراه `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw
باید **نام استقرار Azure** باشد که در پورتال Azure پیکربندی کرده‌اید، نه
شناسه مدل عمومی OpenAI.

اگر استقراری به نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده نام استقرار برای فراخوانی‌های تولید تصویر مسیریابی‌شده از طریق
ارائه‌دهنده همراه `openai` نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`،‏ `swedencentral`،‏ `polandcentral`،‏ `westus3`،
`uaenorth`). پیش از ایجاد استقرار، فهرست منطقه‌ای فعلی Microsoft را بررسی کنید
و تایید کنید که مدل مشخص در منطقه شما ارائه می‌شود.

### تفاوت‌های پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی اجازه می‌دهد رد کند (برای مثال برخی
مقادیر `background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مدل مشخصی
ارائه کند. این تفاوت‌ها از Azure و مدل زیرین می‌آیند، نه از OpenClaw.
اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعه پارامترهای پشتیبانی‌شده
توسط استقرار و نسخه API مشخص خود را در پورتال Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند اما هدرهای انتساب
پنهان OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک گفت‌وگو یا Responses روی Azure (فراتر از تولید تصویر)، از جریان
راه‌اندازی اولیه یا یک پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید — `openai.baseUrl` به‌تنهایی
شکل API/احراز هویت Azure را برنمی‌دارد. یک ارائه‌دهنده جداگانه
`azure-openai-responses/*` وجود دارد؛ آکاردئون Compaction سمت سرور را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای `openai/*` از WebSocket-اول با بازگشت به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست زودهنگام WebSocket را پیش از بازگشت به SSE دوباره امتحان می‌کند
    - پس از شکست، WebSocket را برای حدود 60 ثانیه تضعیف‌شده علامت‌گذاری می‌کند و در زمان سردشدن از SSE استفاده می‌کند
    - هدرهای پایدار هویت نشست و نوبت را برای تلاش‌های دوباره و اتصال‌های دوباره پیوست می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را در گونه‌های انتقال نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، بازگشت به SSE |
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
          },
        },
      },
    }
    ```

    مستندات مرتبط OpenAI:
    - [Realtime API با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های Streaming API ‏(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="حالت سریع">
    OpenClaw یک کلید مشترک حالت سریع برای `openai/*` ارائه می‌کند:

    - **گفت‌وگو/UI:** `/fast status|auto|on|off`
    - **پیکربندی:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI (`service_tier = "priority"`) نگاشت می‌کند. مقادیر موجود `service_tier` حفظ می‌شوند و حالت سریع `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند. `fastMode: "auto"` فراخوانی‌های مدل جدید را تا آستانه قطع خودکار سریع شروع می‌کند، سپس فراخوانی‌های تلاش دوباره، بازگشت، نتیجه ابزار، یا ادامه بعدی را بدون حالت سریع شروع می‌کند. آستانه قطع به‌صورت پیش‌فرض 60 ثانیه است؛ برای تغییر آن، `params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    بازنویسی‌های نشست بر پیکربندی مقدم هستند. پاک کردن بازنویسی نشست در UI نشست‌ها، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API ‏OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را در OpenClaw برای هر مدل تنظیم کنید:

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

    مقادیر پشتیبانی‌شده: `auto`،‏ `default`،‏ `flex`،‏ `priority`.

    <Warning>
    `serviceTier` فقط به نقاط پایانی بومی OpenAI (`api.openai.com`) و نقاط پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از ارائه‌دهنده‌ها را از طریق پراکسی مسیریابی کنید، OpenClaw مقدار `service_tier` را دست‌نخورده می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، پوشش جریان OpenClaw متعلق به Plugin ‏OpenAI به‌صورت خودکار Compaction سمت سرور را فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر اینکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`:‏ 70٪ از `contextWindow` (یا وقتی در دسترس نباشد `80000`)

    این روی مسیر داخلی زمان اجرای OpenClaw و روی هوک‌های ارائه‌دهنده OpenAI که توسط اجراهای تعبیه‌شده استفاده می‌شوند اعمال می‌شود. هارنس بومی سرور برنامه Codex زمینه خود را از طریق Codex مدیریت می‌کند و توسط مسیر عامل پیش‌فرض OpenAI یا سیاست زمان اجرای ارائه‌دهنده/مدل پیکربندی می‌شود.

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

  <Accordion title="حالت سخت‌گیرانه عامل‌محور GPT">
    برای اجراهای خانواده GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای تعبیه‌شده سخت‌گیرانه‌تر استفاده کند:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    با `strict-agentic`، OpenClaw:
    - برای کارهای قابل‌توجه، `update_plan` را به‌صورت خودکار فعال می‌کند
    - نوبت‌های از نظر ساختاری خالی یا فقط شامل استدلال را با یک ادامه دارای پاسخ قابل‌مشاهده دوباره تلاش می‌کند
    - وقتی harness انتخاب‌شده آن‌ها را ارائه کند، از رویدادهای صریح برنامه harness استفاده می‌کند

    OpenClaw متن دستیار را برای تصمیم‌گیری درباره اینکه یک نوبت برنامه، به‌روزرسانی پیشرفت، یا پاسخ نهایی است، طبقه‌بندی نمی‌کند.

    <Note>
    فقط به اجراهای خانواده OpenAI و Codex GPT-5 محدود است. ارائه‌دهندگان دیگر و خانواده‌های مدل قدیمی‌تر رفتار پیش‌فرض را حفظ می‌کنند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw نقاط پایانی مستقیم OpenAI، Codex، و Azure OpenAI را متفاوت از پراکسی‌های عمومی `/v1` سازگار با OpenAI در نظر می‌گیرد:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که از effort مقدار `none` در OpenAI پشتیبانی می‌کنند
    - reasoning غیرفعال را برای مدل‌ها یا پراکسی‌هایی که `reasoning.effort: "none"` را رد می‌کنند، حذف می‌کند
    - طرحواره‌های ابزار را به‌طور پیش‌فرض روی حالت سخت‌گیرانه قرار می‌دهد
    - سرآیندهای انتساب پنهان را فقط روی میزبان‌های بومی تأییدشده پیوست می‌کند
    - شکل‌دهی درخواست مختص OpenAI را نگه می‌دارد (`service_tier`، `store`، سازگاری reasoning، راهنمایی‌های prompt-cache)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری آزادتر استفاده می‌کند
    - `store` مربوط به Completions را از payloadهای غیر بومی `openai-completions` حذف می‌کند
    - عبور مستقیم JSON پیشرفته `params.extra_body`/`params.extraBody` را برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرد
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI مانند vLLM می‌پذیرد
    - طرحواره‌های سخت‌گیرانه ابزار یا سرآیندهای فقط بومی را اجبار نمی‌کند

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
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
