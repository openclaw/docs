---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - شما احراز هویت اشتراک Codex را به‌جای کلیدهای API می‌خواهید
    - شما به رفتار اجرای عامل GPT-5 سخت‌گیرانه‌تری نیاز دارید
summary: استفاده از OpenAI در OpenClaw از طریق کلیدهای API یا اشتراک Codex
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:42:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI APIهای توسعه‌دهنده را برای مدل‌های GPT ارائه می‌کند، و Codex نیز به‌عنوان یک عامل کدنویسی
طرح ChatGPT از طریق کلاینت‌های Codex متعلق به OpenAI در دسترس است. OpenClaw برای هر دو شکل احراز هویت
از یک شناسه ارائه‌دهنده، یعنی `openai`، استفاده می‌کند.

OpenClaw از `openai/*` به‌عنوان مسیر متعارف مدل OpenAI استفاده می‌کند. نوبت‌های عامل تعبیه‌شده
روی مدل‌های OpenAI به‌صورت پیش‌فرض از طریق زمان‌اجرای بومی سرور برنامه Codex اجرا می‌شوند؛
احراز هویت مستقیم با کلید API برای سطوح غیرعاملی OpenAI مانند تصاویر، تعبیه‌ها، گفتار، و بلادرنگ همچنان در دسترس است.

- **مدل‌های عامل** - مدل‌های `openai/*` از طریق زمان‌اجرای Codex؛ برای استفاده از اشتراک ChatGPT/Codex
  با احراز هویت Codex وارد شوید، یا وقتی عمدا احراز هویت با کلید API می‌خواهید،
  یک پشتیبان کلید API سازگار با Codex برای OpenAI پیکربندی کنید.
- **APIهای غیرعاملی OpenAI** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب مبتنی بر مصرف
  از طریق `OPENAI_API_KEY` یا راه‌اندازی کلید API در OpenAI.
- **پیکربندی قدیمی** - ارجاع‌های مدل قدیمی Codex توسط
  `openclaw doctor --fix` به `openai/*` به‌همراه زمان‌اجرای Codex اصلاح می‌شوند.

OpenAI به‌صراحت از استفاده OAuth اشتراکی در ابزارها و گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌کند.

ارائه‌دهنده، مدل، زمان‌اجرا، و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها
با هم اشتباه گرفته می‌شوند، پیش از تغییر پیکربندی [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

## انتخاب سریع

| هدف                                                 | استفاده                                                      | نکته‌ها                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex | `openai/gpt-5.5`                                         | راه‌اندازی پیش‌فرض عامل OpenAI. با احراز هویت Codex وارد شوید.                  |
| صورت‌حساب مستقیم کلید API برای مدل‌های عامل              | `openai/gpt-5.5` به‌همراه پروفایل کلید API سازگار با Codex | از `auth.order.openai` برای قرار دادن پشتیبان پس از احراز هویت اشتراکی استفاده کنید.  |
| صورت‌حساب مستقیم کلید API از طریق OpenClaw صریح     | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `openclaw`  | یک پروفایل عادی کلید API با `openai` انتخاب کنید.                             |
| تازه‌ترین نام مستعار API فوری ChatGPT                     | `openai/chat-latest`                                     | فقط کلید API مستقیم. نام مستعار متحرک برای آزمایش‌ها، نه پیش‌فرض.   |
| احراز هویت اشتراک ChatGPT/Codex از طریق OpenClaw     | `openai/gpt-5.5` به‌همراه زمان‌اجرای ارائه‌دهنده/مدل `openclaw`  | یک پروفایل OAuth با `openai` برای مسیر سازگاری انتخاب کنید.         |
| تولید یا ویرایش تصویر                          | `openai/gpt-image-2`                                     | با `OPENAI_API_KEY` یا OAuth متعلق به OpenAI Codex کار می‌کند.             |
| تصاویر با پس‌زمینه شفاف                        | `openai/gpt-image-1.5`                                   | از `outputFormat=png` یا `webp` و `openai.background=transparent` استفاده کنید. |

## نقشه نام‌گذاری

نام‌ها مشابه‌اند اما قابل‌جایگزینی نیستند:

| نامی که می‌بینید                            | لایه             | معنی                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | پیشوند ارائه‌دهنده   | مسیر متعارف مدل OpenAI؛ نوبت‌های عامل از زمان‌اجرای Codex استفاده می‌کنند.                                  |
| پیشوند قدیمی OpenAI Codex              | پیشوند قدیمی     | فضای نام قدیمی‌تر مدل/پروفایل. `openclaw doctor --fix` آن را به `openai` مهاجرت می‌دهد.                   |
| Plugin با نام `codex`                          | Plugin            | Plugin همراه OpenClaw که زمان‌اجرای بومی سرور برنامه Codex و کنترل‌های چت `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex` ارائه‌دهنده/مدل | زمان‌اجرای عامل     | اجبار به استفاده از هارنس بومی سرور برنامه Codex برای نوبت‌های تعبیه‌شده منطبق.                            |
| `/codex ...`                            | مجموعه فرمان چت  | اتصال/کنترل رشته‌های سرور برنامه Codex از یک گفتگو.                                        |
| `runtime: "acp", agentId: "codex"`      | مسیر نشست ACP | مسیر جایگزین صریح که Codex را از طریق ACP/acpx اجرا می‌کند.                                          |

این یعنی یک پیکربندی می‌تواند عمدا شامل ارجاع‌های مدل `openai/*` باشد در حالی که پروفایل‌های احراز هویت
به اعتبارنامه‌های کلید API یا OAuth متعلق به ChatGPT/Codex اشاره می‌کنند. برای پیکربندی از
`auth.order.openai` استفاده کنید؛ `openclaw doctor --fix` ارجاع‌های قدیمی مدل Codex،
شناسه‌های قدیمی پروفایل احراز هویت Codex، و ترتیب قدیمی احراز هویت Codex را
به مسیر متعارف OpenAI بازنویسی می‌کند.

<Note>
GPT-5.5 هم از طریق دسترسی مستقیم کلید API به OpenAI Platform و هم از طریق
مسیرهای اشتراک/OAuth در دسترس است. برای اشتراک ChatGPT/Codex به‌همراه اجرای بومی Codex،
از `openai/gpt-5.5` استفاده کنید؛ اکنون پیکربندی زمان‌اجرای تنظیم‌نشده، هارنس Codex را
برای نوبت‌های عامل OpenAI انتخاب می‌کند. فقط وقتی پروفایل‌های کلید API متعلق به OpenAI را به‌کار ببرید که
احراز هویت مستقیم با کلید API برای یک مدل عامل OpenAI می‌خواهید.
</Note>

<Note>
نوبت‌های مدل عامل OpenAI به Plugin همراه سرور برنامه Codex نیاز دارند. پیکربندی صریح
زمان‌اجرای OpenClaw همچنان به‌عنوان یک مسیر سازگاری اختیاری در دسترس است. وقتی OpenClaw
به‌صورت صریح با یک پروفایل OAuth با `openai` انتخاب شود، OpenClaw ارجاع عمومی مدل را
به‌شکل `openai/*` نگه می‌دارد و به‌صورت داخلی از طریق انتقال احراز هویت Codex مسیردهی می‌کند.
برای اصلاح ارجاع‌های قدیمی مدل Codex، `codex-cli/*`، یا پین‌های قدیمی نشست زمان‌اجرا که از
پیکربندی صریح زمان‌اجرا نمی‌آیند، `openclaw doctor --fix` را اجرا کنید.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                                                              | وضعیت                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| چت / پاسخ‌ها          | ارائه‌دهنده مدل `openai/<model>`                                                               | بله                                                                    |
| مدل‌های اشتراک Codex | `openai/<model>` با OAuth متعلق به OpenAI                                                            | بله                                                                    |
| ارجاع‌های قدیمی مدل Codex   | ارجاع‌های قدیمی مدل Codex یا `codex-cli/<model>`                                                | توسط doctor به `openai/<model>` اصلاح می‌شود                                 |
| هارنس سرور برنامه Codex  | `openai/<model>` با زمان‌اجرای حذف‌شده یا `agentRuntime.id: codex` ارائه‌دهنده/مدل              | بله                                                                    |
| جستجوی وب سمت سرور    | ابزار بومی Responses در OpenAI                                                                  | بله، وقتی جستجوی وب فعال باشد و ارائه‌دهنده‌ای پین نشده باشد                 |
| تصاویر                    | `image_generate`                                                                              | بله                                                                    |
| ویدیوها                    | `video_generate`                                                                              | بله                                                                    |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                                                     | بله                                                                    |
| تبدیل گفتار به متن دسته‌ای      | `tools.media.audio` / درک رسانه                                                     | بله                                                                    |
| تبدیل گفتار به متن جریانی  | Voice Call `streaming.provider: "openai"`                                                     | بله                                                                    |
| صدای بلادرنگ            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | بله (به اعتبار OpenAI Platform نیاز دارد، نه اشتراک Codex/ChatGPT) |
| تعبیه‌ها                | ارائه‌دهنده تعبیه حافظه                                                                     | بله                                                                    |

<Note>
  صدای بلادرنگ OpenAI (که توسط `realtime.provider: "openai"` در Voice Call و
  Control UI Talk با `talk.realtime.provider: "openai"` استفاده می‌شود) از طریق
  **OpenAI Platform Realtime API** عمومی عبور می‌کند، که به‌جای سهمیه اشتراک Codex/ChatGPT
  بر اساس اعتبارهای OpenAI Platform صورت‌حساب می‌شود. حسابی که OAuth سالم OpenAI دارد و
  مدل‌های چت متکی بر Codex را بدون مشکل اجرا می‌کند، همچنان برای صدای بلادرنگ به یک پروفایل احراز هویت
  کلید API متعلق به OpenAI یا یک کلید API پلتفرم با صورت‌حساب دارای اعتبار Platform نیاز دارد.

راه‌حل: اعتبارهای Platform را در
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
برای سازمانی که اعتبارنامه‌های بلادرنگ شما را پشتیبانی می‌کند شارژ کنید. صدای بلادرنگ
پروفایل احراز هویت کلید API با `openai` را که توسط `openclaw onboard --auth-choice openai-api-key` ساخته شده،
یک `OPENAI_API_KEY` پلتفرم که از طریق `talk.realtime.providers.openai.apiKey`
برای Control UI Talk پیکربندی شده، `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
برای Voice Call، یا متغیر محیطی `OPENAI_API_KEY` را می‌پذیرد. پروفایل‌های OAuth متعلق به OpenAI
همچنان می‌توانند مدل‌های چت `openai/*` متکی بر Codex را در همان نصب
OpenClaw اجرا کنند، اما صدای بلادرنگ را پیکربندی نمی‌کنند.
</Note>

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

برای نقاط پایانی سازگار با OpenAI که به برچسب‌های تعبیه نامتقارن نیاز دارند،
`queryInputType` و `documentInputType` را زیر `memorySearch` تنظیم کنید. OpenClaw این‌ها را
به‌عنوان فیلدهای درخواست اختصاصی ارائه‌دهنده با نام `input_type` ارسال می‌کند: تعبیه‌های پرس‌وجو از
`queryInputType` استفاده می‌کنند؛ قطعه‌های حافظه نمایه‌شده و نمایه‌سازی دسته‌ای از
`documentInputType` استفاده می‌کنند. برای نمونه کامل، [مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config) را ببینید.

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلید API (OpenAI Platform)">
    **بهترین برای:** دسترسی مستقیم API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API را از [داشبورد OpenAI Platform](https://platform.openai.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیم پاس بدهید:

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

    | ارجاع مدل              | پیکربندی زمان‌اجرا             | مسیر                       | احراز هویت             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | حذف‌شده / ارائه‌دهنده/مدل `agentRuntime.id: "codex"` | هارنس سرور برنامه Codex | پروفایل OpenAI سازگار با Codex |
    | `openai/gpt-5.4-mini` | حذف‌شده / ارائه‌دهنده/مدل `agentRuntime.id: "codex"` | هارنس سرور برنامه Codex | پروفایل OpenAI سازگار با Codex |
    | `openai/gpt-5.5`      | ارائه‌دهنده/مدل `agentRuntime.id: "openclaw"`              | زمان‌اجرای تعبیه‌شده OpenClaw      | پروفایل انتخاب‌شده `openai` |

    <Note>
    مدل‌های عامل `openai/*` از چارچوب app-server مربوط به Codex استفاده می‌کنند. برای استفاده از احراز هویت
    کلید API برای یک مدل عامل، یک پروفایل کلید API سازگار با Codex بسازید و آن را با
    `auth.order.openai` مرتب کنید؛ `OPENAI_API_KEY` همچنان مسیر جایگزین مستقیم برای
    سطح‌های API غیرعاملی OpenAI باقی می‌ماند. برای مهاجرت ورودی‌های قدیمی‌تر ترتیب احراز هویت Codex
    قدیمی، `openclaw doctor --fix` را اجرا کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    برای آزمایش مدل Instant فعلی ChatGPT از API OpenAI، مدل را
    روی `openai/chat-latest` تنظیم کنید:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` یک نام مستعار متغیر است. OpenAI آن را به‌عنوان تازه‌ترین مدل Instant
    استفاده‌شده در ChatGPT مستند کرده و `gpt-5.5` را برای استفاده تولیدی API توصیه می‌کند، پس
    مگر اینکه مشخصا رفتار آن نام مستعار را بخواهید، `openai/gpt-5.5` را به‌عنوان پیش‌فرض پایدار نگه دارید.
    این نام مستعار در حال حاضر فقط پرگویی متنی `medium` را می‌پذیرد، بنابراین
    OpenClaw بازنویسی‌های ناسازگار پرگویی متن OpenAI را برای این
    مدل عادی‌سازی می‌کند.

    <Warning>
    OpenClaw مدل `gpt-5.3-codex-spark` را در مسیر مستقیم کلید API OpenAI در دسترس قرار نمی‌دهد. این مدل فقط از طریق ورودی‌های کاتالوگ اشتراک Codex در دسترس است، وقتی حساب واردشده شما آن را عرضه کند.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **بهترین برای:** استفاده از اشتراک ChatGPT/Codex شما با اجرای بومی app-server مربوط به Codex به‌جای یک کلید API جداگانه. ابر Codex به ورود به ChatGPT نیاز دارد.

    <Steps>
      <Step title="اجرای OAuth مربوط به Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        یا OAuth را مستقیم اجرا کنید:

        ```bash
        openclaw models auth login --provider openai
        ```

        برای راه‌اندازی‌های بدون رابط گرافیکی یا ناسازگار با callback، `--device-code` را اضافه کنید تا به‌جای callback مرورگر localhost، با جریان device-code مربوط به ChatGPT وارد شوید:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="استفاده از مسیر مدل متعارف OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        برای مسیر پیش‌فرض، هیچ پیکربندی runtime لازم نیست. نوبت‌های عامل OpenAI
        runtime بومی app-server مربوط به Codex را به‌طور خودکار انتخاب می‌کنند، و OpenClaw
        وقتی این مسیر انتخاب شود، Plugin بسته‌بندی‌شده Codex را نصب یا تعمیر می‌کند.
      </Step>
      <Step title="بررسی در دسترس بودن احراز هویت Codex">
        ```bash
        openclaw models list --provider openai
        ```

        پس از اجرای gateway، در چت `/codex status` یا `/codex models`
        را بفرستید تا runtime بومی app-server را بررسی کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل | پیکربندی runtime | مسیر | احراز هویت |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | حذف‌شده / provider/model `agentRuntime.id: "codex"` | چارچوب بومی app-server مربوط به Codex | ورود Codex یا پروفایل احراز هویت مرتب‌شده `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | runtime تعبیه‌شده OpenClaw با انتقال داخلی احراز هویت Codex | پروفایل OAuth انتخاب‌شده `openai` |
    | ارجاع قدیمی Codex GPT-5.5 | تعمیرشده توسط doctor | مسیر قدیمی بازنویسی‌شده به `openai/gpt-5.5` | پروفایل OAuth مهاجرت‌یافته OpenAI |
    | `codex-cli/gpt-5.5` | تعمیرشده توسط doctor | مسیر CLI قدیمی بازنویسی‌شده به `openai/gpt-5.5` | احراز هویت app-server مربوط به Codex |

    <Warning>
    برای پیکربندی جدید عامل با پشتوانه اشتراک، `openai/gpt-5.5` را ترجیح دهید. ارجاع‌های قدیمی‌تر Codex GPT
    مسیرهای قدیمی OpenClaw هستند، نه مسیر runtime بومی Codex؛ وقتی می‌خواهید آن‌ها را به ارجاع‌های متعارف
    `openai/*` مهاجرت دهید، `openclaw doctor --fix` را اجرا کنید. `gpt-5.3-codex-spark` همچنان به حساب‌هایی محدود است که
    کاتالوگ اشتراک Codex آن‌ها آن مدل را تبلیغ می‌کند؛ کلید API مستقیم OpenAI و
    ارجاع‌های Azure برای آن همچنان سرکوب می‌شوند.
    </Warning>

    <Note>
    پیشوند مدل قدیمی Codex پیکربندی قدیمی است که توسط doctor تعمیر می‌شود. برای
    راه‌اندازی رایج اشتراک به‌همراه runtime بومی، با احراز هویت Codex وارد شوید
    اما ارجاع مدل را `openai/gpt-5.5` نگه دارید. پیکربندی جدید باید ترتیب احراز هویت عامل OpenAI
    را زیر `auth.order.openai` قرار دهد؛ doctor ورودی‌های قدیمی‌تر ترتیب احراز هویت Codex
    قدیمی را مهاجرت می‌دهد.
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

    با یک نسخه پشتیبان کلید API، مدل را روی `openai/gpt-5.5` نگه دارید و
    ترتیب احراز هویت را زیر `openai` بگذارید. OpenClaw ابتدا اشتراک را امتحان می‌کند، سپس
    کلید API را، در حالی که روی چارچوب Codex باقی می‌ماند:

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

    ### بررسی و بازیابی مسیر‌دهی OAuth مربوط به Codex

    از این فرمان‌ها استفاده کنید تا ببینید عامل پیش‌فرض شما از کدام مدل، runtime و مسیر احراز هویت
    استفاده می‌کند:

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

    اگر یک پیکربندی قدیمی‌تر هنوز ارجاع‌های قدیمی Codex GPT یا یک سنجاق جلسه runtime منسوخ OpenAI
    بدون پیکربندی صریح runtime دارد، آن را تعمیر کنید:

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

    وقتی می‌خواهید چند ورود OAuth مربوط به Codex را در همان
    عامل داشته باشید و بعدا آن‌ها را از طریق ترتیب احراز هویت یا `/model ...@<profileId>` کنترل کنید، از `--profile-id` استفاده کنید:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` مسیر مدل برای نوبت‌های عامل OpenAI از طریق Codex است. برای مهاجرت شناسه‌های پروفایل پیشوند قدیمی OpenAI Codex و
    ورودی‌های ترتیب، پیش از تکیه بر ترتیب پروفایل‌ها، `openclaw doctor --fix` را اجرا کنید.

    ### نشانگر وضعیت

    چت `/status` نشان می‌دهد کدام runtime مدل برای جلسه فعلی فعال است.
    چارچوب app-server بسته‌بندی‌شده Codex برای نوبت‌های مدل عامل OpenAI به‌شکل `Runtime: OpenAI Codex`
    نمایش داده می‌شود. سنجاق‌های منسوخ جلسه runtime OpenAI به Codex تعمیر می‌شوند، مگر اینکه
    پیکربندی صراحتا OpenClaw را سنجاق کند.

    ### هشدار doctor

    اگر ارجاع‌های مدل قدیمی Codex یا سنجاق‌های منسوخ runtime OpenAI در پیکربندی یا
    وضعیت جلسه باقی بمانند، `openclaw doctor --fix` آن‌ها را به `openai/*` با
    runtime مربوط به Codex بازنویسی می‌کند، مگر اینکه OpenClaw صراحتا پیکربندی شده باشد.

    ### سقف پنجره زمینه

    OpenClaw با فراداده مدل و سقف زمینه runtime به‌عنوان مقدارهای جداگانه رفتار می‌کند.

    برای `openai/gpt-5.5` از طریق کاتالوگ OAuth مربوط به Codex:

    - `contextWindow` بومی: `1000000`
    - سقف پیش‌فرض runtime `contextTokens`: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های بهتری از نظر تأخیر و کیفیت دارد. آن را با `contextTokens` بازنویسی کنید:

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
    برای اعلام فراداده بومی مدل از `contextWindow` استفاده کنید. برای محدود کردن بودجه زمینه runtime از `contextTokens` استفاده کنید.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw وقتی فراداده کاتالوگ بالادستی Codex برای `gpt-5.5` وجود داشته باشد، از آن استفاده می‌کند.
    اگر کشف زنده Codex ردیف `gpt-5.5` را حذف کند در حالی که
    حساب احراز هویت شده است، OpenClaw آن ردیف مدل OAuth را می‌سازد تا
    اجرای‌های cron، زیرعامل، و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورند.

  </Tab>
</Tabs>

## احراز هویت app-server بومی Codex

چارچوب app-server بومی Codex از ارجاع‌های مدل `openai/*` به‌همراه پیکربندی
runtime حذف‌شده یا provider/model `agentRuntime.id: "codex"` استفاده می‌کند، اما احراز هویت آن
همچنان مبتنی بر حساب است. OpenClaw احراز هویت را به این ترتیب انتخاب می‌کند:

1. پروفایل‌های احراز هویت مرتب‌شده OpenAI برای عامل، ترجیحا زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های پروفایل احراز هویت قدیمی Codex و ترتیب احراز هویت قدیمی Codex،
   `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود app-server، مانند ورود ChatGPT محلی Codex CLI.
3. فقط برای اجرای‌های app-server محلی stdio، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی app-server هیچ حسابی گزارش نمی‌کند و همچنان به
   احراز هویت OpenAI نیاز دارد.

این یعنی ورود محلی اشتراک ChatGPT/Codex فقط به این دلیل جایگزین نمی‌شود که
فرایند gateway همچنین برای مدل‌های مستقیم OpenAI
یا embeddingها `OPENAI_API_KEY` دارد. مسیر جایگزین کلید API در env فقط مسیر stdio محلی بدون حساب است؛
به اتصال‌های WebSocket app-server فرستاده نمی‌شود. وقتی یک پروفایل Codex
سبک اشتراکی انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و `OPENAI_API_KEY`
را از فرزند stdio app-server ایجادشده بیرون نگه می‌دارد و اعتبارنامه‌های انتخاب‌شده را
از طریق RPC ورود app-server می‌فرستد. وقتی آن پروفایل اشتراک به‌دلیل
محدودیت مصرف Codex مسدود شود، OpenClaw می‌تواند بدون تغییر مدل انتخاب‌شده یا خارج شدن از چارچوب Codex،
به پروفایل بعدی کلید API مرتب‌شده `openai:*` بچرخد. پس از گذشت زمان بازنشانی اشتراک، پروفایل اشتراک
دوباره واجد شرایط می‌شود.

## تولید تصویر

Plugin بسته‌بندی‌شده `openai` تولید تصویر را از طریق ابزار `image_generate` ثبت می‌کند.
این هم تولید تصویر با کلید API OpenAI و هم تولید تصویر با OAuth مربوط به Codex
را از طریق همان ارجاع مدل `openai/gpt-image-2` پشتیبانی می‌کند.

| قابلیت                | کلید API OpenAI                     | OAuth مربوط به Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                      | `OPENAI_API_KEY`                   | ورود OAuth مربوط به OpenAI Codex           |
| انتقال                 | API تصاویر OpenAI                  | پشتانه Responses مربوط به Codex              |
| بیشینه تصاویر در هر درخواست    | 4                                  | 4                                    |
| حالت ویرایش                 | فعال (تا 5 تصویر مرجع) | فعال (تا 5 تصویر مرجع)   |
| بازنویسی‌های اندازه            | پشتیبانی‌شده، شامل اندازه‌های 2K/4K   | پشتیبانی‌شده، شامل اندازه‌های 2K/4K     |
| نسبت تصویر / وضوح | به API تصاویر OpenAI ارسال نمی‌شود | وقتی امن باشد به یک اندازه پشتیبانی‌شده نگاشت می‌شود |

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

`gpt-image-2` هم برای تولید متن‌به‌تصویر OpenAI و هم برای ویرایش تصویر پیش‌فرض است.
`gpt-image-1.5`، `gpt-image-1`، و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی‌های صریح مدل قابل‌استفاده می‌مانند. برای خروجی PNG/WebP با پس‌زمینه شفاف
از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`
مقدار `background: "transparent"` را رد می‌کند.

برای درخواست پس‌زمینه شفاف، عامل‌ها باید `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"`، و
`background: "transparent"` فراخوانی کنند؛ گزینه قدیمی ارائه‌دهنده
`openai.background` همچنان پذیرفته می‌شود. OpenClaw همچنین مسیرهای عمومی
OAuth مربوط به OpenAI و OpenAI Codex را با بازنویسی درخواست‌های شفاف پیش‌فرض
`openai/gpt-image-2` به `gpt-image-1.5` محافظت می‌کند؛ Azure و نقاط پایانی
سفارشیِ سازگار با OpenAI نام‌های استقرار/مدل پیکربندی‌شده خود را حفظ می‌کنند.

همین تنظیم برای اجراهای CLI بدون رابط نیز ارائه شده است:

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
`--openai-background` همچنان به‌عنوان نام مستعار اختصاصی OpenAI در دسترس است.
وقتی لازم است کیفیت و هزینه OpenAI Images را کنترل کنید، از
`--quality low|medium|high|auto` استفاده کنید. برای ارسال راهنمای تعدیل محتوای
اختصاصی ارائه‌دهنده OpenAI از `image generate` یا `image edit`، از
`--openai-moderation low|auto` استفاده کنید.

برای نصب‌های OAuth مربوط به ChatGPT/Codex، همان ارجاع `openai/gpt-image-2` را نگه دارید. وقتی یک پروفایل OAuth
`openai` پیکربندی شده باشد، OpenClaw آن توکن دسترسی OAuth ذخیره‌شده را resolve می‌کند و درخواست‌های تصویر را از طریق بک‌اند Codex Responses می‌فرستد. ابتدا
`OPENAI_API_KEY` را امتحان نمی‌کند و برای آن درخواست بی‌صدا به کلید API برنمی‌گردد.
وقتی مسیر مستقیم OpenAI Images API را می‌خواهید، `models.providers.openai` را صراحتاً با یک کلید API،
نشانی پایه سفارشی، یا نقطه پایانی Azure پیکربندی کنید.
اگر آن نقطه پایانی تصویر سفارشی روی یک آدرس LAN/خصوصی مورداعتماد است، همچنین
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید؛ OpenClaw نقاط پایانی تصویر خصوصی/داخلی سازگار با OpenAI را مسدود نگه می‌دارد مگر اینکه این opt-in
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

## تولید ویدئو

Plugin همراه `openai` تولید ویدئو را از طریق ابزار `video_generate` ثبت می‌کند.

| قابلیت | مقدار |
| ---------------- | --------------------------------------------------------------------------------- |
| مدل پیش‌فرض | `openai/sora-2` |
| حالت‌ها | متن به ویدئو، تصویر به ویدئو، ویرایش تک‌ویدئو |
| ورودی‌های مرجع | ۱ تصویر یا ۱ ویدئو |
| بازنویسی‌های اندازه | برای متن به ویدئو و تصویر به ویدئو پشتیبانی می‌شود |
| بازنویسی‌های دیگر | `aspectRatio`، `resolution`، `audio`، `watermark` با هشدار ابزار نادیده گرفته می‌شوند |

درخواست‌های تصویر به ویدئوی OpenAI از `POST /v1/videos` همراه با
`input_reference` تصویر استفاده می‌کنند. ویرایش‌های تک‌ویدئو از
`POST /v1/videos/edits` همراه با ویدئوی بارگذاری‌شده در فیلد
`video` استفاده می‌کنند.

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Note>

## مشارکت پرامپت GPT-5

OpenClaw برای اجراهای خانواده GPT-5 روی سطوح پرامپتی که OpenClaw assembled کرده است، یک مشارکت پرامپت مشترک GPT-5 اضافه می‌کند. این کار بر اساس شناسه مدل اعمال می‌شود، بنابراین مسیرهای OpenClaw/ارائه‌دهنده مانند ارجاع‌های قدیمی پیش از repair، مثل (ارجاع قدیمی Codex GPT-5.5)، `openrouter/openai/gpt-5.5`، `opencode/gpt-5.5` و دیگر ارجاع‌های سازگار GPT-5 همان overlay را دریافت می‌کنند. مدل‌های قدیمی‌تر GPT-4.x این overlay را دریافت نمی‌کنند.

هارنس Codex بومی همراه، این overlay مربوط به OpenClaw GPT-5 را از طریق دستورالعمل‌های توسعه‌دهنده app-server در Codex دریافت نمی‌کند. Codex بومی رفتارهای پایه، مدل، و اسناد پروژه متعلق به Codex را حفظ می‌کند، در حالی که OpenClaw شخصیت داخلی Codex را برای threadهای بومی غیرفعال می‌کند تا فایل‌های شخصیت فضای کاری عامل مرجع باقی بمانند. OpenClaw فقط زمینه زمان اجرا مانند تحویل کانال، ابزارهای پویای OpenClaw، واگذاری ACP، زمینه فضای کاری، و Skills مربوط به OpenClaw را مشارکت می‌دهد.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌دار برای تداوم پرسونا، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های تکمیل، و تأیید روی پرامپت‌های همسانی که OpenClaw assembled کرده است اضافه می‌کند. رفتار پاسخ اختصاصی کانال و پیام خاموش در پرامپت سیستمی مشترک OpenClaw و سیاست تحویل خروجی باقی می‌ماند. لایه سبک تعامل دوستانه جدا و قابل پیکربندی است.

| مقدار | اثر |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال‌سازی لایه سبک تعامل دوستانه |
| `"on"` | نام مستعار برای `"friendly"` |
| `"off"` | فقط لایه سبک دوستانه را غیرفعال می‌کند |

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
مقادیر در زمان اجرا به بزرگی و کوچکی حروف حساس نیستند، بنابراین `"Off"` و `"off"` هر دو لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
`plugins.entries.openai.config.personality` قدیمی همچنان به‌عنوان fallback سازگاری خوانده می‌شود، وقتی تنظیم مشترک `agents.defaults.promptOverlays.gpt5.personality` تنظیم نشده باشد.
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

    `extraBody` پس از فیلدهای تولیدشده توسط OpenClaw در JSON درخواست `/audio/speech` ادغام می‌شود، بنابراین از آن برای نقاط پایانی سازگار با OpenAI استفاده کنید که به کلیدهای اضافی مانند `lang` نیاز دارند. کلیدهای prototype نادیده گرفته می‌شوند.

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
    برای بازنویسی نشانی پایه TTS بدون تأثیر بر نقطه پایانی chat API، `OPENAI_TTS_BASE_URL` را تنظیم کنید. OpenAI TTS و صدای Realtime هر دو از طریق یک کلید OpenAI Platform API پیکربندی می‌شوند؛ نصب‌های فقط OAuth همچنان می‌توانند از مدل‌های chat مبتنی بر Codex استفاده کنند، اما نه گفت‌وگوی زنده OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin همراه `openai` تبدیل گفتار به متن batch را از طریق
    سطح رونویسی media-understanding مربوط به OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطه پایانی: OpenAI REST `/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی multipart
    - هرجا که رونویسی صوت ورودی از `tools.media.audio` استفاده کند، توسط OpenClaw پشتیبانی می‌شود، از جمله قطعه‌های کانال صوتی Discord و پیوست‌های صوتی کانال

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

    راهنماهای زبان و پرامپت، وقتی توسط پیکربندی مشترک رسانه صوتی یا درخواست رونویسی هر فراخوانی ارائه شوند، به OpenAI ارسال می‌شوند.

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
    | احراز هویت | `...openai.apiKey`، `OPENAI_API_KEY`، یا OAuth `openai` | کلیدهای API مستقیماً متصل می‌شوند؛ OAuth یک client secret برای رونویسی Realtime صادر می‌کند |

    <Note>
    از یک اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صدای G.711 u-law (`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. وقتی فقط OAuth `openai` پیکربندی شده باشد، Gateway پیش از باز کردن WebSocket یک client secret موقت برای رونویسی Realtime صادر می‌کند. این ارائه‌دهنده streaming برای مسیر رونویسی Realtime مربوط به Voice Call است؛ صدای Discord در حال حاضر قطعه‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی batch `tools.media.audio` استفاده می‌کند.
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
    | فاصله padding پیشوند | `...openai.prefixPaddingMs` | `300` |
    | تلاش استدلال | `...openai.reasoningEffort` | (تنظیم‌نشده) |
    | احراز هویت | پروفایل احراز هویت کلید API `openai`، `...openai.apiKey`، یا `OPENAI_API_KEY` | کلید OpenAI Platform API لازم است؛ OpenAI OAuth صدای Realtime را پیکربندی نمی‌کند |

    صداهای داخلی Realtime موجود برای `gpt-realtime-2`: `alloy`، `ash`،
    `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، `cedar`.
    OpenAI برای بهترین کیفیت Realtime، `marin` و `cedar` را توصیه می‌کند. این
    مجموعه‌ای جدا از صداهای Text-to-speech بالا است؛ فرض نکنید یک صدای TTS مانند
    `fable`، `nova`، یا `onyx` برای جلسه‌های Realtime معتبر است.

    <Note>
    پل‌های realtime بک‌اند OpenAI از شکل جلسه GA Realtime WebSocket استفاده می‌کنند که `session.temperature` را نمی‌پذیرد. استقرارهای Azure OpenAI از طریق `azureEndpoint` و `azureDeployment` همچنان در دسترس می‌مانند و شکل جلسه سازگار با استقرار را حفظ می‌کنند. از فراخوانی ابزار دوطرفه و صدای G.711 u-law پشتیبانی می‌کند.
    </Note>

    <Note>
    صدای Realtime هنگام ایجاد جلسه انتخاب می‌شود. OpenAI اجازه می‌دهد بیشتر
    فیلدهای جلسه بعداً تغییر کنند، اما پس از اینکه مدل در آن جلسه صدا منتشر کرد، صدا دیگر قابل تغییر نیست. OpenClaw در حال حاضر شناسه‌های صدای داخلی Realtime را به‌صورت رشته ارائه می‌کند.
    </Note>

    <Note>
    Control UI Talk از نشست‌های بی‌درنگ مرورگر OpenAI با یک client secret
    موقت که Gateway صادر کرده و تبادل مستقیم WebRTC SDP مرورگر در برابر
    OpenAI Realtime API استفاده می‌کند. Gateway آن client secret را با پروفایل
    احراز هویت API-key انتخاب‌شده‌ی `openai` یا کلید API پیکربندی‌شده‌ی OpenAI Platform
    صادر می‌کند. پل‌های WebSocket بی‌درنگ بک‌اند Gateway relay و Voice Call از همان
    مسیر احراز هویت فقط-API-key برای endpointهای بومی OpenAI استفاده می‌کنند. راستی‌آزمایی
    زنده‌ی نگه‌دارنده با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    در دسترس است؛ مسیرهای OpenAI هم پل WebSocket بک‌اند و هم تبادل
    WebRTC SDP مرورگر را بدون ثبت secrets راستی‌آزمایی می‌کنند.
    </Note>

  </Accordion>
</AccordionGroup>

## endpointهای Azure OpenAI

ارائه‌دهنده‌ی همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw
نام‌های میزبان Azure را روی `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌صورت خودکار به شکل درخواست Azure تغییر می‌کند.

<Note>
صدای بی‌درنگ از یک مسیر پیکربندی جداگانه استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، Accordion **صدای بی‌درنگ** را زیر [Voice and speech](#voice-and-speech) ببینید.
</Note>

از Azure OpenAI زمانی استفاده کنید که:

- از قبل اشتراک، quota، یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت داده‌ی منطقه‌ای یا کنترل‌های انطباقی که Azure فراهم می‌کند نیاز دارید
- می‌خواهید ترافیک را داخل یک tenancy موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده‌ی همراه `openai`،
`models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را روی کلید Azure OpenAI تنظیم کنید (نه کلید OpenAI Platform):

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
- به هر درخواست `?api-version=...` اضافه می‌کند
- برای فراخوانی‌های تولید تصویر Azure از timeout پیش‌فرض 600s استفاده می‌کند.
  مقادیر `timeoutMs` هر فراخوانی همچنان این پیش‌فرض را بازنویسی می‌کنند.

URLهای پایه‌ی دیگر (OpenAI عمومی، proxyهای سازگار با OpenAI) شکل استاندارد درخواست تصویر OpenAI را نگه می‌دارند.

<Note>
مسیر‌دهی Azure برای مسیر تولید تصویر ارائه‌دهنده‌ی `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند endpoint عمومی OpenAI در نظر می‌گیرند و در برابر deploymentهای تصویر Azure شکست می‌خورند.
</Note>

### نسخه‌ی API

برای ثابت کردن یک نسخه‌ی preview یا GA مشخص Azure برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

وقتی متغیر تنظیم نشده باشد، مقدار پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها همان نام deploymentها هستند

Azure OpenAI مدل‌ها را به deploymentها متصل می‌کند. برای درخواست‌های تولید تصویر Azure که از طریق ارائه‌دهنده‌ی همراه `openai` مسیر‌دهی می‌شوند، فیلد `model` در OpenClaw باید **نام deployment در Azure** باشد که در Azure portal پیکربندی کرده‌اید، نه شناسه‌ی مدل عمومی OpenAI.

اگر deploymentای با نام `gpt-image-2-prod` بسازید که `gpt-image-2` را ارائه می‌کند:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

همین قاعده‌ی نام deployment برای فراخوانی‌های تولید تصویر که از طریق ارائه‌دهنده‌ی همراه `openai` مسیر‌دهی می‌شوند نیز اعمال می‌شود.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ساخت deployment، فهرست فعلی مناطق Microsoft را بررسی کنید و تأیید کنید مدل مشخص در منطقه‌ی شما ارائه می‌شود.

### تفاوت‌های پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویر یکسانی را نمی‌پذیرند.
Azure ممکن است گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی مقادیر
`background` روی `gpt-image-2`) یا آن‌ها را فقط روی نسخه‌های مشخص مدل ارائه کند. این تفاوت‌ها از Azure و مدل زیربنایی می‌آیند، نه
OpenClaw. اگر یک درخواست Azure با خطای اعتبارسنجی شکست خورد، مجموعه پارامترهای پشتیبانی‌شده توسط deployment و نسخه‌ی API مشخص خود را در
Azure portal بررسی کنید.

<Note>
Azure OpenAI از transport بومی و رفتار compat استفاده می‌کند، اما هدرهای attribution پنهان OpenClaw را دریافت نمی‌کند — Accordion **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI** را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک chat یا Responses روی Azure (فراتر از تولید تصویر)، از flow راه‌اندازی اولیه یا یک پیکربندی اختصاصی ارائه‌دهنده‌ی Azure استفاده کنید — `openai.baseUrl` به‌تنهایی شکل API/احراز هویت Azure را انتخاب نمی‌کند. یک ارائه‌دهنده‌ی جداگانه‌ی
`azure-openai-responses/*` وجود دارد؛ Accordion مربوط به Compaction سمت سرور را در پایین ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Transport (WebSocket در برابر SSE)">
    OpenClaw برای `openai/*` ابتدا از WebSocket با fallback به SSE (`"auto"`) استفاده می‌کند.

    در حالت `"auto"`، OpenClaw:
    - یک شکست زودهنگام WebSocket را پیش از fallback به SSE دوباره امتحان می‌کند
    - پس از یک شکست، WebSocket را برای حدود 60 ثانیه degraded علامت‌گذاری می‌کند و در زمان cool-down از SSE استفاده می‌کند
    - هدرهای پایدار هویت نشست و turn را برای retryها و اتصال‌های دوباره ضمیمه می‌کند
    - شمارنده‌های usage (`input_tokens` / `prompt_tokens`) را در میان گونه‌های transport نرمال‌سازی می‌کند

    | مقدار | رفتار |
    |-------|----------|
    | `"auto"` (پیش‌فرض) | ابتدا WebSocket، fallback به SSE |
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
    OpenClaw یک toggle مشترک حالت سریع برای `openai/*` ارائه می‌کند:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI نگاشت می‌کند (`service_tier = "priority"`). مقادیر موجود `service_tier` حفظ می‌شوند، و حالت سریع `reasoning` یا `text.verbosity` را بازنویسی نمی‌کند. `fastMode: "auto"` فراخوانی‌های جدید مدل را تا cutoff خودکار سریع شروع می‌کند، سپس فراخوانی‌های بعدی retry، fallback، tool-result، یا continuation را بدون حالت سریع آغاز می‌کند. مقدار پیش‌فرض cutoff برابر 60 ثانیه است؛ برای تغییر آن، `params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.

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
    بازنویسی‌های نشست بر config اولویت دارند. پاک کردن بازنویسی نشست در Sessions UI، نشست را به پیش‌فرض پیکربندی‌شده برمی‌گرداند.
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
    `serviceTier` فقط به endpointهای بومی OpenAI (`api.openai.com`) و endpointهای بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود. اگر هرکدام از ارائه‌دهنده‌ها را از طریق proxy مسیر‌دهی کنید، OpenClaw `service_tier` را دست‌نخورده باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم OpenAI Responses (`openai/*` روی `api.openai.com`)، wrapper استریم OpenClaw در Plugin OpenAI، Compaction سمت سرور را به‌صورت خودکار فعال می‌کند:

    - `store: true` را اجبار می‌کند (مگر اینکه compat مدل `supportsStore: false` تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را inject می‌کند
    - `compact_threshold` پیش‌فرض: 70% از `contextWindow` (یا `80000` وقتی در دسترس نباشد)

    این برای مسیر runtime داخلی OpenClaw و hookهای ارائه‌دهنده‌ی OpenAI که توسط runهای embedded استفاده می‌شوند اعمال می‌شود. harness بومی app-server در Codex، context خودش را از طریق Codex مدیریت می‌کند و توسط route پیش‌فرض agent در OpenAI یا policy runtime ارائه‌دهنده/مدل پیکربندی می‌شود.

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
      <Tab title="آستانه‌ی سفارشی">
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
    `responsesServerCompaction` فقط inject کردن `context_management` را کنترل می‌کند. مدل‌های مستقیم OpenAI Responses همچنان `store: true` را اجبار می‌کنند، مگر اینکه compat مقدار `supportsStore: false` تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت GPT strict-agentic">
    برای runهای خانواده‌ی GPT-5 روی `openai/*`، OpenClaw می‌تواند از یک قرارداد اجرای embedded سخت‌گیرانه‌تر استفاده کند:

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
    - برای کارهای substantial، `update_plan` را خودکار فعال می‌کند
    - turnهای از نظر ساختاری خالی یا فقط-reasoning را با یک continuation دارای پاسخ قابل مشاهده دوباره امتحان می‌کند
    - وقتی harness انتخاب‌شده آن‌ها را فراهم کند، از رویدادهای plan صریح harness استفاده می‌کند

    OpenClaw نثر assistant را طبقه‌بندی نمی‌کند تا تصمیم بگیرد یک turn برنامه است، به‌روزرسانی پیشرفت است، یا پاسخ نهایی.

    <Note>
    فقط محدود به runهای خانواده‌ی GPT-5 در OpenAI و Codex است. ارائه‌دهنده‌های دیگر و خانواده‌های قدیمی‌تر مدل، رفتار پیش‌فرض را نگه می‌دارند.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw endpointهای مستقیم OpenAI، Codex، و Azure OpenAI را متفاوت از proxyهای عمومی سازگار با OpenAI `/v1` در نظر می‌گیرد:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی نگه می‌دارد که effort مقدار `none` در OpenAI را پشتیبانی می‌کنند
    - reasoning غیرفعال‌شده را برای مدل‌ها یا proxyهایی که `reasoning.effort: "none"` را رد می‌کنند حذف می‌کند
    - schemaهای tool را به‌صورت پیش‌فرض روی حالت strict می‌گذارد
    - هدرهای attribution پنهان را فقط روی میزبان‌های بومی راستی‌آزمایی‌شده ضمیمه می‌کند
    - شکل‌دهی درخواست فقط-OpenAI را نگه می‌دارد (`service_tier`، `store`، reasoning-compat، hintهای prompt-cache)

    **مسیرهای پروکسی/سازگار:**
    - از رفتار سازگاری آسان‌گیرانه‌تر استفاده کنید
    - `store` مربوط به Completions را از payloadهای غیر بومی `openai-completions` حذف کنید
    - عبور JSON پیشرفته‌ی `params.extra_body`/`params.extraBody` را برای پروکسی‌های Completions سازگار با OpenAI بپذیرید
    - `params.chat_template_kwargs` را برای پروکسی‌های Completions سازگار با OpenAI مانند vLLM بپذیرید
    - طرح‌واره‌های ابزار سخت‌گیرانه یا سرآیندهای فقط بومی را اجباری نکنید

    Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما سرآیندهای انتساب پنهان را دریافت نمی‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جابه‌جایی در خرابی.
  </Card>
  <Card title="Image generation" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده‌ی مجدد از اعتبارنامه.
  </Card>
</CardGroup>
