---
read_when:
    - می‌خواهید از مدل‌های OpenAI در OpenClaw استفاده کنید
    - می‌خواهید به‌جای کلیدهای API از احراز هویت اشتراک Codex استفاده کنید
    - به رفتار اجرایی سخت‌گیرانه‌تری برای عامل GPT-5 نیاز دارید
summary: استفاده از OpenAI از طریق کلیدهای API یا اشتراک Codex در OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T17:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw از یک شناسه ارائه‌دهنده، `openai`، هم برای احراز هویت مستقیم با کلید API و هم برای
احراز هویت اشتراک ChatGPT/Codex استفاده می‌کند. `openai/*` مسیر متعارف مدل است.
برای نوبت‌های عامل تعبیه‌شده که سیاست زمان اجرا تنظیم نشده یا `auto` است، واقعیت‌های مسیر
OpenAI تعیین می‌کنند که آیا OpenClaw می‌تواند زمان اجرای همراهِ سرور برنامه Codex را
به‌طور ضمنی انتخاب کند. پیشوند `openai/*` به‌تنهایی زمان اجرا را انتخاب نمی‌کند.

- **مدل‌های عامل** - `openai/*` از طریق زمان اجرایی که پیکربندی صریح
  `agentRuntime` یا سیاست ضمنی مسیر OpenAI انتخاب کرده است. برای استفاده از اشتراک
  ChatGPT/Codex با احراز هویت Codex وارد شوید، یا هنگامی که صورت‌حساب مبتنی بر کلید می‌خواهید،
  یک نمایه احراز هویت با کلید API پیکربندی کنید.
- **APIهای غیرعاملی OpenAI** - دسترسی مستقیم به OpenAI Platform با صورت‌حساب به‌ازای مصرف،
  از طریق `OPENAI_API_KEY` یا یک نمایه احراز هویت با کلید API از نوع `openai`.
- **پیکربندی قدیمی** - ارجاع‌های `codex/*` و `openai-codex/*` به
  `openai/*` به‌همراه `agentRuntime.id: "codex"` محدود به مدل، توسط
  `openclaw doctor --fix` اصلاح می‌شوند.

OpenAI صراحتاً از استفاده از OAuth اشتراک در ابزارهای خارجی و
گردش‌کارهایی مانند OpenClaw پشتیبانی می‌کند.

## ردیابی مصرف و هزینه

OpenClaw سهمیه اشتراک و صورت‌حساب API پلتفرم را جدا نگه می‌دارد:

- OAuth مربوط به ChatGPT/Codex، طرح اشتراک، بازه‌های سهمیه و موجودی اعتبار را نمایش می‌دهد.
- `OPENAI_ADMIN_KEY`، 30 روز از هزینه سازمان و میزان استفاده از تکمیل‌ها را که ارائه‌دهنده گزارش کرده است، در بخش **مصرف** رابط کنترل نشان می‌دهد؛ از جمله هزینه روزانه، مجموع درخواست‌ها/توکن‌ها، مدل‌های پرمصرف و دسته‌های هزینه.
- `OPENAI_PROJECT_ID` در صورت تمایل، سابقه Admin API را به یک پروژه محدود می‌کند.
- OpenClaw هرگز `OPENAI_API_KEY` یا یک نمایه استنتاج `openai` را به APIهای سازمان ارسال نمی‌کند؛ ممکن است این اعتبارنامه‌ها متعلق به نقاط پایانی سفارشی، Azure یا محلیِ عامل باشند.

کلید صریح Admin بر OAuth اولویت دارد. سابقه گزارش‌شده توسط ارائه‌دهنده با هزینه تخمینی OpenClaw که از نشست‌ها استخراج شده ادغام نمی‌شود؛ این سابقه ممکن است فعالیت API از سایر کارخواه‌ها و تعدیلات صورت‌حساب سمت ارائه‌دهنده را نیز شامل شود.

مستندات [داشبورد مصرف API](https://help.openai.com/en/articles/10478918) از OpenAI، الزامات مالک سازمان و مجوز صریح Usage Dashboard برای داده‌های مصرف را شرح می‌دهد.

ارائه‌دهنده، مدل، زمان اجرا و کانال لایه‌های جداگانه‌ای هستند. اگر این برچسب‌ها
با یکدیگر اشتباه گرفته می‌شوند، پیش از تغییر پیکربندی، [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) را
بخوانید.

## انتخاب سریع

| هدف                                              | استفاده                                                                | نکات                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| اشتراک ChatGPT/Codex، زمان اجرای بومی Codex  | `openai/gpt-5.6-sol`                                               | راه‌اندازی تازه اشتراک؛ با احراز هویت Codex وارد شوید.                  |
| صورت‌حساب مستقیم با کلید API برای نوبت‌های عامل            | `openai/gpt-5.6` به‌همراه یک نمایه مرتب‌شده احراز هویت با کلید API              | راه‌اندازی تازه کلید API؛ شناسه مستقیم و بدون پسوند API به Sol تفکیک می‌شود.        |
| انتخاب یک سطح دقیق GPT-5.6                      | `openai/gpt-5.6-sol`، `-terra`، یا `-luna`                         | برای سطح‌های در دسترس این حساب، `models list` را بررسی کنید.        |
| حساب بدون دسترسی GPT-5.6                    | `openai/gpt-5.5`                                                   | انتخاب صریح بازیابی؛ OpenClaw بی‌سروصدا به نسخه پایین‌تر تنزل نمی‌دهد.     |
| صورت‌حساب مستقیم با کلید API، زمان اجرای صریح OpenClaw | `openai/gpt-5.6` به‌همراه `agentRuntime.id: "openclaw"` ارائه‌دهنده/مدل | یک نمایه عادی کلید API از نوع `openai` انتخاب کنید.                           |
| جدیدترین نام مستعار مدل ChatGPT Instant                | `openai/chat-latest`                                               | فقط کلید API مستقیم؛ نام مستعار متغیر است، نه پیش‌فرض پایدار.          |
| تولید یا ویرایش تصویر                       | `openai/gpt-image-2`                                               | با `OPENAI_API_KEY` یا OAuth مربوط به Codex کار می‌کند.                         |
| تصاویر با پس‌زمینه شفاف                     | `openai/gpt-image-1.5`                                             | `outputFormat` را روی `png` یا `webp` و `background=transparent` تنظیم کنید. |

## نگاشت نام‌ها

| نامی که می‌بینید                            | لایه             | معنا                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | پیشوند ارائه‌دهنده   | مسیر متعارف مدل OpenAI؛ واقعیت‌های مسیر، زمان اجرای ضمنی را تعیین می‌کنند.                |
| Plugin مربوط به `codex`                          | Plugin            | Plugin همراهی که زمان اجرای بومی سرور برنامه Codex و کنترل‌های گفت‌وگوی `/codex` را فراهم می‌کند. |
| `agentRuntime.id: codex` ارائه‌دهنده/مدل | زمان اجرای عامل     | سامانه بومی سرور برنامه Codex را برای نوبت‌های تعبیه‌شده منطبق اجباری می‌کند.                   |
| `/codex ...`                            | مجموعه فرمان گفت‌وگو  | رشته‌های سرور برنامه Codex را از درون یک مکالمه متصل/کنترل می‌کند.                               |
| `runtime: "acp", agentId: "codex"`      | مسیر نشست ACP | مسیر جایگزین صریحی که Codex را از طریق ACP/acpx اجرا می‌کند.                                 |

## زمان اجرای ضمنی عامل

هنگامی که سیاست `agentRuntime` ارائه‌دهنده/مدل تنظیم نشده یا `auto` است، سیاست مسیر
تحت مالکیت ارائه‌دهنده OpenAI، زمان اجرای ضمنی را بر اساس نقطه پایانی و مبدل
مؤثر انتخاب می‌کند:

| واقعیت‌های مسیر مؤثر                                                                                                                                                  | زمان اجرای ضمنی      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| نقطه پایانی دقیق و رسمی HTTPS پلتفرم با `openai-responses`، یا نقطه پایانی دقیق و رسمی HTTPS مربوط به ChatGPT با `openai-chatgpt-responses`؛ بدون بازنویسی تألیفی درخواست | ممکن است Codex انتخاب شود |
| مبدل تألیفی `openai-completions`                                                                                                                                  | OpenClaw              |
| نقطه پایانی سفارشی                                                                                                                                                        | OpenClaw              |
| نقطه پایانی رسمی و دقیق که صراحتاً از HTTP استفاده می‌کند                                                                                                                            | رد می‌شود              |
| مسیری با بازنویسی تألیفی درخواست ارائه‌دهنده/مدل                                                                                                                 | OpenClaw              |

یک `agentRuntime.id` صریح و غیرپیش‌فرض برای ارائه‌دهنده/مدل همچنان مرجع نهایی است.
برای نمونه، `agentRuntime.id: "openclaw"` مسیری را که در حالت دیگر واجد شرایط Codex است
روی OpenClaw نگه می‌دارد، درحالی‌که `agentRuntime.id: "codex"` استفاده از Codex را الزامی می‌کند و
اگر مسیر مؤثر سازگار با Codex اعلام نشده باشد، با حالت بسته شکست می‌خورد.
انتخاب زمان اجرا نوع اعتبارنامه یا صورت‌حساب را تغییر نمی‌دهد: احراز هویت با کلید API
پلتفرم و احراز هویت اشتراک ChatGPT/Codex همچنان مجزا می‌مانند.

`openclaw doctor --fix` ارجاع‌های مدل قدیمی `codex/*` و `openai-codex/*`،
شناسه‌های قدیمی نمایه احراز هویت Codex و ورودی‌های قدیمی ترتیب احراز هویت Codex را به
مسیر متعارف `openai` مهاجرت می‌دهد. ارجاع‌های مدل مهاجرت‌یافته، `agentRuntime.id: "codex"`
محدود به مدل دریافت می‌کنند؛ برای پیکربندی جدید ترتیب احراز هویت از `auth.order.openai` استفاده کنید.

<Note>
راه‌اندازی تازه OpenAI تنها هنگامی یک مدل اصلی GPT-5.6 اعمال می‌کند که هیچ مدل اصلی
پیکربندی نشده باشد. افزودن یا تازه‌سازی احراز هویت OpenAI، انتخاب صریح موجود را
حفظ می‌کند، از جمله `openai/gpt-5.5`، مگر اینکه صراحتاً از
`models auth login --set-default` یا `models set` استفاده کنید. فقط هنگامی از نمایه احراز هویت
با کلید API استفاده کنید که برای یک مدل عامل، احراز هویت با کلید API می‌خواهید.
</Note>

## پیش‌نمایش محدود GPT-5.6

OpenClaw شناسه‌های دقیق مدل `openai/gpt-5.6-sol`،
`openai/gpt-5.6-terra` و `openai/gpt-5.6-luna` را می‌شناسد. هر سه در کاتالوگ فعلی
استدلال `xhigh` و `max` را ارائه می‌کنند. OpenAI از Sol به‌عنوان
سطح پرچم‌دار، از Terra به‌عنوان سطح متعادل و از Luna به‌عنوان سطح سریع و
کم‌هزینه‌تر یاد می‌کند. به
[اعلامیه عرضه GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
و [راهنمای دسترسی](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) مراجعه کنید.

با احراز هویت مستقیم کلید API مربوط به OpenAI، شناسه بدون پسوند `openai/gpt-5.6` نام مستعار
Sol و پیش‌فرض راه‌اندازی تازه است. کاتالوگ بومی Codex آن نام مستعار API مستقیم را
در سمت کارخواه اعمال نمی‌کند؛ بسته به دسترسی فضای کاری، ممکن است شناسه‌های دقیق
Sol، Terra و Luna را نشان دهد. بنابراین راه‌اندازی تازه OAuth مربوط به ChatGPT/Codex
از `openai/gpt-5.6-sol` استفاده می‌کند. حساب کنونی را با این فرمان بررسی کنید:

```bash
openclaw models list --provider openai
```

دسترسی سازمان API و فضای کاری Codex می‌تواند متفاوت باشد. اگر GPT-5.6
در دسترس نیست، GPT-5.5 را صراحتاً انتخاب کنید:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw خطای دسترسی بالادستی را نمایش می‌دهد و انتخاب
GPT-5.6 را بی‌سروصدا با GPT-5.5 جایگزین نمی‌کند.

<Note>
مسیرهای دقیق و رسمی HTTPS که واجد شرایط هستند، هنگامی که سیاست زمان اجرا تنظیم نشده یا
`auto` است، ممکن است Plugin همراهِ سرور برنامه Codex را انتخاب کنند؛ مسیرهای تألیفی Completions،
نقاط پایانی سفارشی و بازنویسی‌های انتقال درخواست روی OpenClaw باقی می‌مانند. نقاط پایانی رسمی
HTTP با متن ساده رد می‌شوند. پیکربندی صریح زمان اجرای ارائه‌دهنده/مدل همچنان
مرجع نهایی است. برای اصلاح ارجاع‌های قدیمی و منسوخ مدل Codex،
ارجاع‌های `codex-cli/*` یا پین‌های قدیمی نشست زمان اجرا که توسط
پیکربندی صریح زمان اجرا تنظیم نشده‌اند، `openclaw doctor --fix` را اجرا کنید.
</Note>

## پوشش قابلیت‌های OpenClaw

| قابلیت OpenAI         | سطح OpenClaw                                                                              | وضعیت                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| گفت‌وگو / پاسخ‌ها          | ارائه‌دهنده مدل `openai/<model>`                                                               | بله                                                             |
| مدل‌های اشتراک Codex | `openai/<model>` با OAuth ‏OpenAI                                                            | بله                                                             |
| ارجاع‌های قدیمی مدل Codex   | ارجاع‌های قدیمی مدل Codex، `codex-cli/<model>`                                                     | به‌وسیله doctor به `openai/<model>` اصلاح می‌شود                          |
| چارچوب app-server ‏Codex  | مسیر HTTPS سازگار با Codex با runtime تنظیم‌نشده/`auto`، یا `agentRuntime.id: codex` صریح  | بله                                                             |
| جست‌وجوی وب سمت سرور    | ابزار بومی OpenAI Responses                                                                  | بله، وقتی جست‌وجوی وب فعال باشد و ارائه‌دهنده دیگری پین نشده باشد |
| تصاویر                    | `image_generate`                                                                              | بله                                                             |
| ویدئوها                    | `video_generate`                                                                              | بله                                                             |
| تبدیل متن به گفتار            | `messages.tts.provider: "openai"` / `tts`                                                     | بله                                                             |
| تبدیل دسته‌ای گفتار به متن      | `tools.media.audio` / درک رسانه                                                     | بله                                                             |
| تبدیل جریانی گفتار به متن  | Voice Call ‏`streaming.provider: "openai"`                                                     | بله                                                             |
| صدای بلادرنگ            | Voice Call ‏`realtime.provider: "openai"` / گفت‌وگوی Control UI ‏`talk.realtime.provider: "openai"` | بله (کلید API پلتفرم OpenAI)                                   |
| جاسازی‌ها                | ارائه‌دهنده جاسازی حافظه                                                                     | بله                                                             |

<Note>
صدای بلادرنگ OpenAI از **API بلادرنگ عمومی پلتفرم OpenAI**
عبور می‌کند و به کلید API پلتفرم نیاز دارد. در مقابل، توکن‌های OAuth ‏Codex برای احراز هویت
در بک‌اند ChatGPT Codex هستند؛ این توکن‌ها با کلیدهای API پلتفرم برای
نقاط پایانی عمومی Realtime قابل‌جایگزینی نیستند.

اگر احراز هویت با کلید API نبود اعتبار صورت‌حساب را گزارش می‌کند، هنگام استفاده از احراز هویت
با کلید API، اعتبار پلتفرم را در
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
برای سازمان پشتیبان اعتبارنامه‌های بلادرنگ خود افزایش دهید.
صدای بلادرنگ پروفایل احراز هویت کلید API ‏`openai` ساخته‌شده توسط
`openclaw onboard --auth-choice openai-api-key`، کلید API پلتفرم تنظیم‌شده از طریق
`talk.realtime.providers.openai.apiKey` برای گفت‌وگوی Control UI، یا
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` برای Voice
Call، یا متغیر محیطی `OPENAI_API_KEY` را می‌پذیرد.
</Note>

## جاسازی‌های حافظه

OpenClaw می‌تواند از OpenAI یا یک نقطه پایانی جاسازی سازگار با OpenAI برای
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
این موارد را به‌عنوان فیلدهای درخواست `input_type` مختص ارائه‌دهنده ارسال می‌کند: جاسازی‌های
پرس‌وجو از `queryInputType` استفاده می‌کنند؛ قطعه‌های نمایه‌شده حافظه و نمایه‌سازی دسته‌ای از
`documentInputType` استفاده می‌کنند. برای نمونه کامل،
[مرجع پیکربندی حافظه](/fa/reference/memory-config#provider-specific-config)
را ببینید.

## شروع به کار

<Tabs>
  <Tab title="کلید API (پلتفرم OpenAI)">
    **مناسب برای:** دسترسی مستقیم به API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API را از [داشبورد پلتفرم OpenAI](https://platform.openai.com/api-keys) ایجاد یا کپی کنید.
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        یا کلید را مستقیماً ارسال کنید:

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

    | ارجاع مدل        | خط‌مشی runtime یا مشخصات مسیر                                 | مسیر                     | احراز هویت                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | تنظیم‌نشده/`auto`، مسیر بومی HTTPS رسمی و دقیق، بدون بازنویسی درخواست | ممکن است Codex انتخاب شود     | پروفایل مرتب‌شده احراز هویت کلید API      |
    | `openai/gpt-5.6` | ارائه‌دهنده/مدل `agentRuntime.id: "openclaw"`                  | runtime تعبیه‌شده OpenClaw | پروفایل انتخاب‌شده کلید API ‏`openai` |
    | `openai/gpt-5.5` | ارائه‌دهنده/مدل صریح `agentRuntime.id`                     | runtime انتخاب‌شده عامل    | پروفایل انتخاب‌شده کلید API ‏OpenAI   |
    | `openai/*`       | Completions تألیفی، سفارشی، یا بازنویسی درخواست | runtime تعبیه‌شده OpenClaw | نوع اعتبارنامه بدون تغییر می‌ماند |
    | `openai/*`       | نقطه پایانی رسمی HTTP با متن ساده                  | رد می‌شود                 | اعتبارنامه ارسال نمی‌شود             |

    <Note>
    وقتی runtime تنظیم‌نشده یا `auto` است، فقط یک مسیر بومی HTTPS رسمی، دقیق و واجد شرایط
    می‌تواند چارچوب app-server ‏Codex را به‌طور ضمنی انتخاب کند. برای احراز هویت
    با کلید API روی یک مدل عامل، یک پروفایل احراز هویت کلید API ‏`openai` ایجاد کنید و آن را با
    `auth.order.openai` مرتب کنید؛ `OPENAI_API_KEY` همچنان گزینه پشتیبان مستقیم برای
    سطوح API غیرعاملی OpenAI است. برای مهاجرت ورودی‌های قدیمی
    ترتیب احراز هویت Codex، ‏`openclaw doctor --fix` را اجرا کنید.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    شناسه مستقیم API و بدون پسوند `gpt-5.6` به سطح Sol نگاشت می‌شود. اگر این سازمان
    API ‏GPT-5.6 را ارائه نمی‌کند، مدل اصلی را صریحاً روی
    `openai/gpt-5.5` تنظیم کنید.

    برای امتحان مدل فعلی Instant ‏ChatGPT از API ‏OpenAI، مدل
    را روی `openai/chat-latest` تنظیم کنید:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` یک نام مستعار متغیر است. راه‌اندازی جدید کلید API ‏OpenAI در عوض از
    `openai/gpt-5.6` استفاده می‌کند که شناسه مستقیم API و بدون پسوند آن به Sol نگاشت می‌شود. مدل‌های اصلی
    صریح موجود، از جمله `openai/gpt-5.5`، بدون تغییر باقی می‌مانند. نام مستعار
    `chat-latest` فقط تفصیل متن `medium` را می‌پذیرد؛ OpenClaw هر
    تفصیل درخواستی دیگری را برای این مدل به `medium` تغییر می‌دهد.

    <Warning>
    OpenClaw، ‏`gpt-5.3-codex-spark` را در مسیر مستقیم کلید API
    ‏OpenAI ارائه **نمی‌کند**. این مدل فقط از طریق ورودی‌های کاتالوگ اشتراک Codex،
    زمانی که حساب واردشده شما آن را ارائه کند، در دسترس است.
    </Warning>

  </Tab>

  <Tab title="اشتراک Codex">
    **مناسب برای:** استفاده از اشتراک ChatGPT/Codex با اجرای بومی app-server ‏Codex
    به‌جای یک کلید API جداگانه. ابر Codex به ورود به ChatGPT نیاز دارد.

    <Steps>
      <Step title="OAuth ‏Codex را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        یا OAuth را مستقیماً اجرا کنید:

        ```bash
        openclaw models auth login --provider openai
        ```

        برای راه‌اندازی‌های بدون رابط یا ناسازگار با callback، ‏`--device-code` را اضافه کنید تا
        به‌جای callback مرورگر localhost، با جریان کد دستگاه ChatGPT
        وارد شوید:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="از مسیر متعارف مدل OpenAI استفاده کنید">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        برای این مسیر بومی HTTPS رسمی و دقیق، هیچ پیکربندی runtime لازم نیست.
        ممکن است runtime مربوط به app-server ‏Codex به‌طور خودکار انتخاب شود و
        OpenClaw هنگام انتخاب آن runtime، Plugin همراه Codex را نصب یا اصلاح می‌کند.
      </Step>
      <Step title="در دسترس بودن احراز هویت Codex را بررسی کنید">
        ```bash
        openclaw models list --provider openai
        ```

        پس از اجرای Gateway، ‏`/codex status` یا `/codex models` را
        در گفت‌وگو ارسال کنید تا runtime بومی app-server را بررسی کنید.
      </Step>
    </Steps>

    ### خلاصه مسیر

    | ارجاع مدل                | خط‌مشی runtime یا مشخصات مسیر                                 | مسیر                                                    | احراز هویت                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | تنظیم‌نشده/`auto`، مسیر بومی HTTPS رسمی و دقیق، بدون بازنویسی درخواست | ممکن است Codex انتخاب شود                                    | ورود به Codex یا پروفایل مرتب‌شده احراز هویت `openai` |
    | `openai/gpt-5.6-terra`   | تنظیم‌نشده/`auto`، مسیر بومی HTTPS رسمی و دقیق، بدون بازنویسی درخواست | ممکن است Codex انتخاب شود                                    | ورود به Codex، وقتی کاتالوگ Terra را ارائه می‌کند       |
    | `openai/gpt-5.6-luna`    | تنظیم‌نشده/`auto`، مسیر بومی HTTPS رسمی و دقیق، بدون بازنویسی درخواست | ممکن است Codex انتخاب شود                                    | ورود به Codex، وقتی کاتالوگ Luna را ارائه می‌کند        |
    | `openai/gpt-5.6-sol`     | ارائه‌دهنده/مدل `agentRuntime.id: "openclaw"`                  | runtime تعبیه‌شده OpenClaw، انتقال داخلی احراز هویت Codex | پروفایل انتخاب‌شده OAuth ‏`openai`                    |
    | `openai/gpt-5.5`         | ارائه‌دهنده/مدل صریح `agentRuntime.id`                     | runtime انتخاب‌شده عامل                                   | پروفایل انتخاب‌شده احراز هویت OpenAI                       |
    | `openai/*`               | Completions تألیفی، سفارشی، یا بازنویسی درخواست | runtime تعبیه‌شده OpenClaw                                | نیازمندی اعتبارنامه همچنان مختص مسیر می‌ماند      |
    | `openai/*`               | نقطه پایانی رسمی HTTP با متن ساده                  | رد می‌شود                                                 | اعتبارنامه ارسال نمی‌شود                              |
    | ارجاع قدیمی Codex ‏GPT-5.5 | به‌وسیله doctor اصلاح می‌شود                                            | به `openai/gpt-5.5` بازنویسی می‌شود                            | پروفایل OAuth ‏OpenAI مهاجرت‌یافته                      |
    | `codex-cli/gpt-5.5`      | به‌وسیله doctor اصلاح می‌شود                                            | به `openai/gpt-5.5` بازنویسی می‌شود                            | احراز هویت app-server ‏Codex                              |

    <Warning>
    راه‌اندازی جدید مبتنی بر اشتراک از `openai/gpt-5.6-sol` دقیق استفاده می‌کند؛
    کاتالوگ بومی Codex ممکن است ارجاع‌های دقیق Terra یا Luna را نیز ارائه کند. اگر
    حساب GPT-5.6 را ارائه نمی‌کند، `openai/gpt-5.5` را صراحتاً انتخاب کنید. ارجاع‌های
    قدیمی‌تر Codex GPT مسیرهای قدیمی OpenClaw هستند، نه مسیر زمان اجرای بومی Codex؛
    برای مهاجرت آن‌ها بدون ارتقای یک انتخاب صریح GPT-5.5 موجود،
    `openclaw doctor --fix` را اجرا کنید. `gpt-5.3-codex-spark` همچنان محدود به
    حساب‌هایی است که کاتالوگ اشتراک Codex آن‌ها این مورد را اعلام می‌کند؛ ارجاع‌های مستقیم
    کلید API ‏OpenAI و Azure برای آن همچنان پنهان می‌مانند.
    </Warning>

    <Note>
    پیکربندی جدید باید ترتیب احراز هویت عامل OpenAI را زیر `auth.order.openai` قرار دهد؛
    doctor ورودی‌های قدیمی ترتیب احراز هویت Codex را مهاجرت می‌دهد.
    </Note>

    ### نمونه پیکربندی

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    با یک کلید API پشتیبان، مدل انتخاب‌شده را زیر `openai/*` نگه دارید و
    ترتیب احراز هویت را زیر `openai` قرار دهید. OpenClaw ابتدا اشتراک و سپس
    کلید API را امتحان می‌کند و در تمام این مدت روی چارچوب Codex باقی می‌ماند:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    فرایند آغاز به کار دیگر داده‌های OAuth را از `~/.codex` وارد نمی‌کند. با
    OAuth مرورگر (پیش‌فرض) یا جریان کد دستگاه در بالا وارد شوید؛ OpenClaw
    اعتبارنامه‌های حاصل را در مخزن احراز هویت عامل خودش مدیریت می‌کند.
    </Note>

    ### بررسی و بازیابی مسیریابی OAuth در Codex

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

    اگر یک پیکربندی قدیمی هنوز ارجاع‌های قدیمی Codex GPT یا یک سنجاق نشست زمان اجرای
    منسوخ OpenAI بدون پیکربندی صریح زمان اجرا دارد، آن را ترمیم کنید:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    اگر `models auth list --provider openai` هیچ نمایه قابل‌استفاده‌ای نشان نمی‌دهد، دوباره
    وارد شوید:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    برای چند ورود OAuth در Codex در همان عامل از `--profile-id` استفاده کنید، سپس
    آن‌ها را از طریق ترتیب احراز هویت یا `/model ...@<profileId>` کنترل کنید:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    پیش از تکیه بر ترتیب نمایه‌ها، `openclaw doctor --fix` را اجرا کنید تا
    شناسه‌های نمایه با پیشوند قدیمی OpenAI Codex و ورودی‌های ترتیب مهاجرت داده شوند.

    ### نشانگر وضعیت

    فرمان گفت‌وگوی `/status` نشان می‌دهد کدام زمان اجرای مدل برای نشست فعلی
    فعال است. چارچوب همراه app-server در Codex هنگامی به‌شکل
    `Runtime: OpenAI Codex` ظاهر می‌شود که یک مسیر ضمنی واجد شرایط یا سیاست صریح
    زمان اجرای ارائه‌دهنده/مدل آن را انتخاب کند.

    ### هشدار Doctor

    اگر ارجاع‌های قدیمی مدل Codex یا سنجاق‌های منسوخ زمان اجرای OpenAI در پیکربندی
    یا وضعیت نشست باقی مانده باشند، `openclaw doctor --fix` آن‌ها را با زمان اجرای Codex
    به `openai/*` بازنویسی می‌کند، مگر اینکه OpenClaw صراحتاً پیکربندی شده باشد.

    ### سقف پنجره زمینه

    OpenClaw فراداده مدل و سقف زمینه زمان اجرا را مقادیر جداگانه‌ای
    در نظر می‌گیرد. برای `openai/gpt-5.5` از طریق کاتالوگ OAuth در Codex:

    - `contextWindow` بومی: `400000`
    - سقف پیش‌فرض `contextTokens` زمان اجرا: `272000`

    سقف پیش‌فرض کوچک‌تر در عمل ویژگی‌های نهفتگی و کیفیت بهتری دارد.
    آن را با `contextTokens` بازنویسی کنید:

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
    برای اعلام فراداده بومی مدل از `contextWindow` استفاده کنید. برای محدود کردن
    بودجه زمینه زمان اجرا از `contextTokens` استفاده کنید. مسیر مستقیم کلید API ‏OpenAI
    یک `contextWindow` بومی بزرگ‌تر (`1000000`) را برای `gpt-5.5`
    گزارش می‌کند؛ این دو مسیر جداگانه ردیابی می‌شوند، زیرا کاتالوگ‌های بالادستی متفاوت‌اند.
    </Note>

    ### بازیابی کاتالوگ

    OpenClaw در صورت وجود، از فراداده کاتالوگ بالادستی Codex برای
    `gpt-5.5` استفاده می‌کند. اگر کشف زنده Codex درحالی‌که حساب
    احراز هویت شده است ردیف `gpt-5.5` را حذف کند، OpenClaw آن ردیف مدل OAuth
    را ایجاد می‌کند تا اجرای cron، زیرعامل و مدل پیش‌فرض پیکربندی‌شده با
    `Unknown model` شکست نخورد.

  </Tab>
</Tabs>

## احراز هویت بومی app-server در Codex

چارچوب بومی app-server در Codex هنگامی از ارجاع‌های مدل `openai/*` استفاده می‌کند که یک
مسیر رسمی دقیق و واجد شرایط HTTPS آن را به‌طور ضمنی انتخاب کند، یا زمانی که
`agentRuntime.id: "codex"` ارائه‌دهنده/مدل آن را صراحتاً انتخاب کند. احراز هویت آن همچنان
مبتنی بر حساب است. OpenClaw احراز هویت را به این ترتیب انتخاب می‌کند:

1. نمایه‌های مرتب‌شده احراز هویت OpenAI برای عامل، ترجیحاً زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های قدیمی نمایه احراز هویت Codex
   و ترتیب احراز هویت، `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود app-server، مانند ورود محلی ChatGPT در Codex CLI.
   برای خانه ایزوله پیش‌فرض عامل، OpenClaw آن حساب بومی CLI را از طریق RPC ورودش
   به app-server متصل می‌کند؛ پیکربندی، Pluginها یا مخزن رشته‌های CLI را
   به اشتراک نمی‌گذارد.
3. فقط برای اجرای محلی app-server از طریق stdio و تنها زمانی که app-server
   هیچ حسابی گزارش نمی‌کند: `CODEX_API_KEY`، سپس `OPENAI_API_KEY`.

ورود اشتراک محلی ChatGPT/Codex فقط به این دلیل که فرایند Gateway همچنین
`OPENAI_API_KEY` را برای مدل‌های مستقیم OpenAI یا تعبیه‌ها دارد، جایگزین نمی‌شود.
بازگشت به کلید API محیطی فقط برای مسیر محلی stdio بدون حساب اعمال می‌شود؛ این کلید
هرگز از طریق اتصال‌های WebSocket به app-server ارسال نمی‌شود. وقتی یک نمایه Codex
از نوع اشتراک انتخاب شود، OpenClaw همچنین `CODEX_API_KEY` و
`OPENAI_API_KEY` را از فرزند app-server در stdio که ایجاد می‌شود، دور نگه می‌دارد
و در عوض اعتبارنامه‌های انتخاب‌شده را از طریق RPC ورود app-server ارسال می‌کند.

وقتی آن نمایه اشتراک به‌دلیل محدودیت استفاده Codex مسدود شود، OpenClaw
نمایه را تا زمان بازنشانی اعلام‌شده Codex مسدود علامت‌گذاری می‌کند و اجازه می‌دهد
ترتیب احراز هویت بدون تغییر مدل انتخاب‌شده یا خروج از چارچوب Codex، به نمایه
`openai:*` بعدی بچرخد. پس از سپری‌شدن زمان بازنشانی، نمایه اشتراک
دوباره واجد شرایط می‌شود.

## تولید تصویر

Plugin همراه `openai` تولید تصویر را از طریق ابزار
`image_generate` ثبت می‌کند. این Plugin هم تولید تصویر با کلید API ‏OpenAI و هم
تولید تصویر با OAuth در Codex را از طریق همان ارجاع مدل `openai/gpt-image-2`
پشتیبانی می‌کند.

| قابلیت                    | کلید API ‏OpenAI                    | OAuth در Codex                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| ارجاع مدل                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| احراز هویت                | `OPENAI_API_KEY`                   | ورود OAuth ‏OpenAI در Codex           |
| انتقال                    | API تصاویر OpenAI                  | بک‌اند پاسخ‌های Codex                 |
| حداکثر تصاویر در هر درخواست | 4                                  | 4                                    |
| حالت ویرایش               | فعال (تا 5 تصویر مرجع)              | فعال (تا 5 تصویر مرجع)                |
| بازنویسی اندازه           | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K | پشتیبانی می‌شود، شامل اندازه‌های 2K/4K |
| نسبت ابعاد / وضوح         | به API تصاویر OpenAI ارسال نمی‌شود | در صورت ایمن‌بودن به اندازه‌ای پشتیبانی‌شده نگاشت می‌شود |

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی، به
[تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
</Note>

`gpt-image-2` پیش‌فرض OpenAI برای تولید تصویر از متن و ویرایش تصویر است.
`gpt-image-1.5`، `gpt-image-1` و `gpt-image-1-mini` همچنان به‌عنوان
بازنویسی صریح مدل قابل‌استفاده‌اند. برای خروجی PNG/WebP با پس‌زمینه شفاف
از `openai/gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2`،
`background: "transparent"` را رد می‌کند.

برای یک درخواست با پس‌زمینه شفاف، `image_generate` را با
`model: "openai/gpt-image-1.5"`، `outputFormat: "png"` یا `"webp"` و
`background: "transparent"` فراخوانی کنید؛ گزینه قدیمی‌تر ارائه‌دهنده
`openai.background` همچنان پذیرفته می‌شود. OpenClaw همچنین با بازنویسی
درخواست‌های شفاف پیش‌فرض `openai/gpt-image-2` به `gpt-image-1.5`، از مسیرهای
عمومی OpenAI و OAuth ‏OpenAI در Codex محافظت می‌کند؛ نقطه‌های پایانی Azure
و سازگار سفارشی با OpenAI نام‌های پیکربندی‌شده استقرار/مدل خود را حفظ می‌کنند.

همین تنظیم برای اجراهای بدون رابط CLI نیز ارائه می‌شود:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "یک برچسب دایره قرمز ساده روی پس‌زمینه شفاف" \
  --json
```

هنگام شروع از یک فایل ورودی، همان پرچم‌های `--output-format` و
`--background` را با `openclaw infer image edit` استفاده کنید.
`--openai-background` همچنان به‌عنوان یک نام مستعار ویژه OpenAI در دسترس است.
برای کنترل کیفیت و هزینه تصاویر OpenAI از `--quality low|medium|high|auto` استفاده کنید.
برای ارسال راهنمای تعدیل محتوای OpenAI از `image generate` یا
`image edit`، از `--openai-moderation low|auto` استفاده کنید.

برای نصب‌های OAuth ‏ChatGPT/Codex، همان ارجاع `openai/gpt-image-2` را نگه دارید.
وقتی یک نمایه OAuth ‏`openai` پیکربندی شده باشد، OpenClaw توکن دسترسی
OAuth ذخیره‌شده را حل می‌کند و درخواست‌های تصویر را از طریق بک‌اند پاسخ‌های Codex
می‌فرستد؛ ابتدا `OPENAI_API_KEY` را امتحان نمی‌کند و بی‌سروصدا به کلید API
بازنمی‌گردد. هنگامی که به‌جای آن مسیر مستقیم API تصاویر OpenAI را می‌خواهید،
`models.providers.openai` را صراحتاً با یک کلید API، نشانی پایه سفارشی یا نقطه پایانی
Azure پیکربندی کنید. اگر آن نقطه پایانی سفارشی تصویر در یک نشانی مورداعتماد
LAN/خصوصی قرار دارد، `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را نیز تنظیم کنید؛ OpenClaw
نقطه‌های پایانی خصوصی/داخلی تصویر سازگار با OpenAI را تا زمانی که این
پذیرش صریح وجود نداشته باشد، مسدود نگه می‌دارد.

تولید:

```
/tool image_generate model=openai/gpt-image-2 prompt="یک پوستر حرفه‌ای عرضه OpenClaw در macOS" size=3840x2160 count=1
```

تولید یک PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="یک برچسب دایره قرمز ساده روی پس‌زمینه شفاف" outputFormat=png background=transparent
```

ویرایش:

```
/tool image_generate model=openai/gpt-image-2 prompt="شکل شیء را حفظ کن و جنس آن را به شیشه نیمه‌شفاف تغییر بده" image=/path/to/reference.png size=1024x1536
```

## تولید ویدئو

Plugin همراه `openai` تولید ویدئو را از طریق ابزار
`video_generate` ثبت می‌کند.

| قابلیت           | مقدار                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| مدل پیش‌فرض      | `openai/sora-2`                                                                    |
| حالت‌ها          | متن‌به‌ویدئو، تصویر‌به‌ویدئو، ویرایش یک ویدئو                                      |
| ورودی‌های مرجع   | 1 تصویر یا 1 ویدئو                                                                 |
| بازنویسی اندازه  | برای متن‌به‌ویدئو و تصویر‌به‌ویدئو پشتیبانی می‌شود                                 |
| نسبت ابعاد       | به نزدیک‌ترین اندازه پشتیبانی‌شده تبدیل می‌شود و به‌شکل خام ارسال نمی‌شود          |
| بازنویسی‌های دیگر | `resolution`، `audio`، `watermark` پشتیبانی نمی‌شوند و همراه با هشدار ابزار حذف می‌شوند |

درخواست‌های تبدیل تصویر به ویدئوی OpenAI از `POST /v1/videos` همراه با یک تصویر
`input_reference` استفاده می‌کنند. ویرایش‌های تک‌ویدئویی از `POST /v1/videos/edits` همراه با
ویدئوی بارگذاری‌شده در فیلد `video` استفاده می‌کنند.

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
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.

ارائه‌دهنده OpenAI، ‏`supportsSize` را اعلام می‌کند، اما `supportsAspectRatio` یا
`supportsResolution` را اعلام نمی‌کند. لایه نرمال‌سازی مشترک OpenClaw، یک
`aspectRatio` درخواستی را پیش از رسیدن درخواست به ارائه‌دهنده، به نزدیک‌ترین `size` متناظر OpenAI تبدیل می‌کند؛ بنابراین درخواست‌های نسبت تصویر معمولاً همچنان کار می‌کنند.
`resolution` هیچ جایگزینی برای اندازه ندارد و حذف می‌شود و این موضوع به‌صورت
`Ignored unsupported overrides for openai/<model>: resolution=<value>` به فراخواننده اعلام می‌شود.
</Note>

## مشارکت در پرامپت GPT-5

OpenClaw برای مدل‌های خانواده GPT-5 روی ارائه‌دهنده
`openai` یک مشارکت مشترک در پرامپت GPT-5 اضافه می‌کند (از جمله ارجاع‌های قدیمی Codex پیش از ترمیم که به
`openai/*` نرمال می‌شوند). ارائه‌دهندگان دیگری که شناسه‌های مدل خانواده GPT-5 را نیز عرضه می‌کنند، مانند
OpenRouter یا مسیرهای opencode، این هم‌پوشان را دریافت نمی‌کنند؛ این قابلیت بر اساس
شناسه ارائه‌دهنده `openai` محدود می‌شود، نه صرفاً شناسه مدل. مدل‌های قدیمی‌تر GPT-4.x هرگز
آن را دریافت نمی‌کنند.

مهار بومی app-server در Codex، قرارداد رفتاری شخصیت/انضباط ابزار
یا هم‌پوشان سبک تعامل دوستانه را از طریق دستورالعمل‌های
توسعه‌دهنده دریافت نمی‌کند؛ Codex بومی رفتار پایه، مدل و
اسناد پروژه متعلق به Codex را حفظ می‌کند و OpenClaw شخصیت داخلی Codex را برای
رشته‌های بومی غیرفعال می‌کند تا فایل‌های شخصیت فضای کاری عامل همچنان مرجع اصلی باشند.
OpenClaw فقط زمینه زمان اجرا را به رشته‌های بومی Codex می‌افزاید: تحویل
کانال، ابزارهای پویای OpenClaw، واگذاری ACP، زمینه فضای کاری و
Skills متعلق به OpenClaw. متن راهنمای Heartbeat از همین مشارکت، تنها
استثنا است: نوبت‌های Heartbeat در Codex بومی آن را دریافت می‌کنند و این متن به‌صورت
دستورالعمل‌های اختصاصی همکاری تزریق می‌شود، نه از طریق قلاب مشترک مشارکت در
پرامپت.

مشارکت GPT-5 یک قرارداد رفتاری برچسب‌گذاری‌شده برای ماندگاری
شخصیت، ایمنی اجرا، انضباط ابزار، شکل خروجی، بررسی‌های
تکمیل و راستی‌آزمایی به پرامپت‌های منطبقِ ساخته‌شده توسط OpenClaw اضافه می‌کند. رفتار پاسخ‌دهی ویژه
کانال و پیام خاموش در پرامپت سیستمی مشترک OpenClaw
و خط‌مشی تحویل خروجی باقی می‌ماند. لایه سبک تعامل دوستانه
جدا و قابل‌پیکربندی است.

| مقدار                  | اثر                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (پیش‌فرض) | فعال‌کردن لایه سبک تعامل دوستانه |
| `"on"`                 | نام مستعار `"friendly"`                      |
| `"off"`                | فقط غیرفعال‌کردن لایه سبک دوستانه       |

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
مقادیر در زمان اجرا به بزرگی و کوچکی حروف حساس نیستند؛ بنابراین `"Off"` و `"off"` هر دو
لایه سبک دوستانه را غیرفعال می‌کنند.
</Tip>

<Note>
هنگامی که تنظیم مشترک
`agents.defaults.promptOverlays.gpt5.personality` تعیین نشده باشد، `plugins.entries.openai.config.personality` قدیمی همچنان به‌عنوان
جایگزین سازگاری خوانده می‌شود.
</Note>

## صدا و گفتار

<AccordionGroup>
  <Accordion title="ترکیب گفتار (TTS)">
    Plugin همراه `openai`، ترکیب گفتار را برای
    سطح `messages.tts` ثبت می‌کند.

    | تنظیم      | مسیر پیکربندی                                            | پیش‌فرض                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | مدل        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | صدا        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | سرعت        | `messages.tts.providers.openai.speed`                  | (تعیین‌نشده)                          |
    | دستورالعمل‌ها | `messages.tts.providers.openai.instructions`           | (تعیین‌نشده، فقط `gpt-4o-mini-tts`)  |
    | قالب       | `messages.tts.providers.openai.responseFormat`         | `opus` برای پیام‌های صوتی، `mp3` برای فایل‌ها |
    | کلید API      | `messages.tts.providers.openai.apiKey`                 | در صورت نبود، از `OPENAI_API_KEY` استفاده می‌کند   |
    | نشانی پایه     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | بدنه اضافی   | `messages.tts.providers.openai.extraBody` / `extra_body` | (تعیین‌نشده)                        |

    مدل‌های موجود: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. صداهای موجود:
    `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`،
    `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    ‏`extraBody` پس از فیلدهای تولیدشده OpenClaw با JSON درخواست `/audio/speech` ادغام می‌شود؛ بنابراین از آن برای نقطه‌های پایانی سازگار با OpenAI که به
    کلیدهای اضافی مانند `lang` نیاز دارند استفاده کنید. کلیدهای prototype نادیده گرفته می‌شوند.

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
    برای بازنویسی نشانی پایه TTS بدون تأثیر بر
    نقطه پایانی API چت، `OPENAI_TTS_BASE_URL` را تنظیم کنید. TTS و صدای Realtime متعلق به OpenAI هر دو
    از طریق یک کلید API پلتفرم OpenAI پیکربندی می‌شوند؛ نصب‌های صرفاً مبتنی بر OAuth همچنان می‌توانند از
    مدل‌های چت مبتنی بر Codex استفاده کنند، اما نمی‌توانند از گفت‌وگوی زنده پاسخ‌گو در OpenAI استفاده کنند.
    </Note>

  </Accordion>

  <Accordion title="تبدیل گفتار به متن">
    Plugin همراه `openai`، تبدیل دسته‌ای گفتار به متن را از طریق
    سطح رونویسی درک رسانه OpenClaw ثبت می‌کند.

    - مدل پیش‌فرض: `gpt-4o-transcribe`
    - نقطه پایانی: REST متعلق به OpenAI، ‏`/v1/audio/transcriptions`
    - مسیر ورودی: بارگذاری فایل صوتی چندبخشی
    - در هر جایی که رونویسی صدای ورودی، `tools.media.audio` را می‌خواند استفاده می‌شود،
      از جمله بخش‌های کانال صوتی Discord و پیوست‌های صوتی کانال

    برای اجبار استفاده از OpenAI برای رونویسی صدای ورودی:

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

    در صورت ارائه زبان و راهنمای پرامپت در
    پیکربندی مشترک رسانه صوتی یا درخواست رونویسی هر فراخوانی، آن‌ها به OpenAI ارسال می‌شوند.

  </Accordion>

  <Accordion title="رونویسی بلادرنگ">
    Plugin همراه `openai`، رونویسی بلادرنگ را برای
    Plugin تماس صوتی ثبت می‌کند.

    | تنظیم          | مسیر پیکربندی                                                          | پیش‌فرض |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | مدل            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | زبان         | `...openai.language`                                                 | (تعیین‌نشده) |
    | پرامپت           | `...openai.prompt`                                                   | (تعیین‌نشده) |
    | مدت سکوت | `...openai.silenceDurationMs`                                        | `800`   |
    | آستانه VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | احراز هویت             | نمایه کلید API ‏`...openai.apiKey`، ‏`OPENAI_API_KEY` یا `openai`    | کلید API پلتفرم الزامی است |

    <Note>
    از اتصال WebSocket به `wss://api.openai.com/v1/realtime` با صدای
    G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`) استفاده می‌کند. برای یک نمایه کلید API
    ‏`openai`، ‏Gateway پیش از بازکردن WebSocket، یک
    رمز کلاینت موقت برای رونویسی Realtime صادر می‌کند. این ارائه‌دهنده جریانی برای مسیر رونویسی بلادرنگ
    تماس صوتی است؛ صدای Discord در حال حاضر بخش‌های کوتاه را ضبط می‌کند و به‌جای آن از مسیر رونویسی دسته‌ای
    `tools.media.audio` استفاده می‌کند.
    </Note>

  </Accordion>

  <Accordion title="صدای بلادرنگ">
    Plugin همراه `openai`، صدای بلادرنگ را برای Plugin تماس صوتی
    ثبت می‌کند.

    | تنظیم                               | مسیر پیکربندی                                                              | پیش‌فرض             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | مدل                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | صدا                                  | `...openai.voice`                                                       | `alloy`             |
    | دما (پل استقرار Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | آستانه VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | مدت سکوت                       | `...openai.silenceDurationMs`                                           | `500`                |
    | فاصله‌گذاری پیشوند                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | میزان استدلال                       | `...openai.reasoningEffort`                                             | (تعیین‌نشده)              |
    | احراز هویت                                   | نمایه کلید API ‏`openai`، ‏`...openai.apiKey` یا `OPENAI_API_KEY` | کلید API پلتفرم OpenAI الزامی است |

    صداهای داخلی Realtime موجود برای `gpt-realtime-2.1`: ‏`alloy`، ‏`ash`،
    `ballad`، ‏`coral`، ‏`echo`، ‏`sage`، ‏`shimmer`، ‏`verse`، ‏`marin`، ‏`cedar`.
    OpenAI برای بهترین کیفیت Realtime، ‏`marin` و `cedar` را توصیه می‌کند. این
    مجموعه از صداهای تبدیل متن به گفتار بالا جدا است؛ صدایی که فقط مخصوص TTS است،
    مانند `fable`، ‏`nova` یا `onyx`، برای نشست‌های Realtime معتبر نیست.
    اگر نوع کوچک‌تر و کم‌هزینه‌تر Realtime 2.1 را ترجیح می‌دهید، مدل را صراحتاً روی
    `gpt-realtime-2.1-mini` تنظیم کنید.

    <Note>
    **GPT-Live (به‌زودی).** مدل‌های تمام‌دوطرفه `gpt-live-1` و
    `gpt-live-1-mini` متعلق به OpenAI در ژوئیه 2026 جایگزین حالت صوتی ChatGPT شدند؛
    API توسعه‌دهنده در حال عرضه برای سازمان‌های دارای دسترسی زودهنگام است. OpenClaw
    خانواده مدل را تشخیص می‌دهد، اما هنوز آن را اجرا نمی‌کند: نشست‌های GPT-Live
    فقط مبتنی بر WebRTC هستند، مدیریت نوبت خود را بر عهده دارند (بدون VAD) و کار عامل را
    از طریق پروتکل رویداد واگذاری تفویض می‌کنند که انتقال‌دهنده‌های بلادرنگ OpenClaw هنوز
    پیاده‌سازی نکرده‌اند. پیکربندی یک مدل `gpt-live-*` به‌صورت بسته شکست می‌خورد و
    به‌جای اتصال بی‌صدای صوت بدون دسترسی عامل، برای پل WebSocket و نشست‌های مرورگر Talk
    راهنمایی ارائه می‌دهد. دسترسی API نیز در دوره دسترسی زودهنگام
    برای هر سازمان OpenAI محدود می‌شود. تا زمان اضافه‌شدن پشتیبانی GPT-Live، ‏`gpt-realtime-2.1`
    (پیش‌فرض) را حفظ کنید.
    </Note>

    <Note>
    پل‌های بلادرنگ OpenAI در سمت پشتی از شکل نشست WebSocket عمومی Realtime
    استفاده می‌کنند که `session.temperature` را نمی‌پذیرد. استقرارهای Azure OpenAI
    همچنان از طریق `azureEndpoint` و `azureDeployment` در دسترس‌اند و
    شکل نشست سازگار با استقرار را حفظ می‌کنند (از جمله `temperature`).
    از فراخوانی دوطرفه ابزار و صدای G.711 u-law پشتیبانی می‌کند.
    </Note>

    <Note>
    صدای بلادرنگ هنگام ایجاد نشست انتخاب می‌شود. OpenAI اجازه می‌دهد بیشتر
    فیلدهای نشست بعداً تغییر کنند، اما پس از آنکه مدل در آن نشست صدا
    تولید کرد، دیگر نمی‌توان صدا را تغییر داد. OpenClaw در حال حاضر شناسه‌های
    صدای داخلی بلادرنگ را به‌شکل رشته ارائه می‌کند.
    </Note>

    <Note>
    Talk در رابط کنترل از نشست‌های بلادرنگ مرورگر OpenAI با یک رمز موقت
    کلاینت که Gateway صادر می‌کند و تبادل مستقیم SDP در WebRTC مرورگر
    با API بلادرنگ OpenAI استفاده می‌کند. Gateway آن رمز کلاینت را با
    اعتبارنامه انتخاب‌شده `openai` صادر می‌کند. کلیدهای پیکربندی‌شده، پروفایل‌های کلید API و
    `OPENAI_API_KEY` اولویت دارند؛ پروفایل OAuth متعلق به `openai` یا ورود خارجی
    Codex گزینه جایگزین است. رله Gateway و پل‌های WebSocket بلادرنگِ بخش پشتی تماس صوتی
    برای نقاط پایانی بومی OpenAI از همان ترتیب اعتبارنامه استفاده می‌کنند.
    راستی‌آزمایی زنده برای نگه‌دارندگان با
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` در دسترس است؛
    بخش‌های OpenAI هم پل WebSocket بخش پشتی و هم تبادل SDP در WebRTC
    مرورگر را بدون ثبت رمزها راستی‌آزمایی می‌کنند.
    برای اجرای آن دو بخش بدون اعتبارنامه‌های Google، `--openai-only` را ارسال کنید.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط پایانی Azure OpenAI

ارائه‌دهنده همراه `openai` می‌تواند با بازنویسی URL پایه، یک منبع Azure OpenAI
را برای تولید تصویر هدف بگیرد. در مسیر تولید تصویر، OpenClaw
نام‌های میزبان Azure را در `models.providers.openai.baseUrl` تشخیص می‌دهد و به‌طور خودکار
از قالب درخواست Azure استفاده می‌کند.

<Note>
صدای بلادرنگ از مسیر پیکربندی جداگانه‌ای استفاده می‌کند
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
و تحت تأثیر `models.providers.openai.baseUrl` نیست. برای تنظیمات Azure آن، آکاردئون **صدای
بلادرنگ** را زیر [صدا و گفتار](#voice-and-speech) ببینید.
</Note>

در موارد زیر از Azure OpenAI استفاده کنید:

- از قبل اشتراک، سهمیه یا قرارداد سازمانی Azure OpenAI دارید
- به اقامت منطقه‌ای داده یا کنترل‌های انطباقی ارائه‌شده توسط Azure نیاز دارید
- می‌خواهید ترافیک را در یک محیط اجاره‌ای موجود Azure نگه دارید

### پیکربندی

برای تولید تصویر Azure از طریق ارائه‌دهنده همراه `openai`،
`models.providers.openai.baseUrl` را به منبع Azure خود اشاره دهید و `apiKey` را روی
کلید Azure OpenAI تنظیم کنید (نه کلید پلتفرم OpenAI):

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

برای درخواست‌های تولید تصویر روی میزبان شناخته‌شده Azure، OpenClaw:

- سرآیند `api-key` را به‌جای `Authorization: Bearer` ارسال می‌کند
- از مسیرهای مختص استقرار استفاده می‌کند (`/openai/deployments/{deployment}/...`)
- `?api-version=...` را به هر درخواست می‌افزاید
- برای فراخوانی‌های تولید تصویر Azure از مهلت پیش‌فرض درخواست 600s استفاده می‌کند.
  مقادیر هر فراخوانیِ `timeoutMs` همچنان این پیش‌فرض را بازنویسی می‌کنند.

سایر URLهای پایه (OpenAI عمومی و پراکسی‌های سازگار با OpenAI) قالب استاندارد
درخواست تصویر OpenAI را حفظ می‌کنند.

<Note>
مسیریابی Azure برای مسیر تولید تصویر ارائه‌دهنده `openai` به
OpenClaw 2026.4.22 یا جدیدتر نیاز دارد. نسخه‌های قدیمی‌تر هر
`openai.baseUrl` سفارشی را مانند نقطه پایانی عمومی OpenAI در نظر می‌گیرند و در برابر
استقرارهای تصویر Azure شکست می‌خورند.
</Note>

### نسخه API

برای تثبیت یک نسخه پیش‌نمایش یا GA مشخص Azure
برای مسیر تولید تصویر Azure، `AZURE_OPENAI_API_VERSION` را تنظیم کنید:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

هنگامی که متغیر تنظیم نشده باشد، مقدار پیش‌فرض `2024-12-01-preview` است.

### نام مدل‌ها همان نام استقرارها هستند

Azure OpenAI مدل‌ها را به استقرارها متصل می‌کند. برای درخواست‌های تولید تصویر Azure
که از طریق ارائه‌دهنده همراه `openai` مسیریابی می‌شوند، فیلد `model` در OpenClaw
باید **نام استقرار Azure** باشد که در پرتال Azure پیکربندی کرده‌اید، نه
شناسه مدل عمومی OpenAI.

اگر استقراری با نام `gpt-image-2-prod` ایجاد کنید که `gpt-image-2` را ارائه می‌دهد:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="یک پوستر ساده" size=1024x1024 count=1
```

همین قاعده نام استقرار برای هر فراخوانی تولید تصویری که
از طریق ارائه‌دهنده همراه `openai` مسیریابی می‌شود نیز صدق می‌کند.

### دسترس‌پذیری منطقه‌ای

تولید تصویر Azure در حال حاضر فقط در زیرمجموعه‌ای از مناطق در دسترس است
(برای مثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). پیش از ایجاد استقرار، فهرست فعلی مناطق Microsoft را بررسی کنید
و مطمئن شوید مدل مشخص در منطقه شما ارائه می‌شود.

### تفاوت پارامترها

Azure OpenAI و OpenAI عمومی همیشه پارامترهای تصویری یکسانی را نمی‌پذیرند.
ممکن است Azure گزینه‌هایی را که OpenAI عمومی مجاز می‌داند رد کند (برای مثال برخی
مقادیر `background` در `gpt-image-2`) یا آن‌ها را فقط در نسخه‌های خاصی از مدل
ارائه دهد. این تفاوت‌ها از Azure و مدل زیربنایی ناشی می‌شوند، نه
OpenClaw. اگر درخواست Azure با خطای اعتبارسنجی شکست خورد،
مجموعه پارامترهای پشتیبانی‌شده توسط استقرار و نسخه API مشخص خود را در
پرتال Azure بررسی کنید.

<Note>
Azure OpenAI از انتقال بومی و رفتار سازگاری استفاده می‌کند، اما سرآیندهای پنهان
انتساب OpenClaw را دریافت نمی‌کند — آکاردئون **مسیرهای بومی در برابر مسیرهای سازگار با OpenAI**
را زیر [پیکربندی پیشرفته](#advanced-configuration) ببینید.

برای ترافیک گفت‌وگو یا Responses در Azure (فراتر از تولید تصویر)، از
فرایند راه‌اندازی اولیه یا پیکربندی اختصاصی ارائه‌دهنده Azure استفاده کنید؛ `openai.baseUrl` به‌تنهایی
قالب API/احراز هویت Azure را اعمال نمی‌کند. ارائه‌دهنده جداگانه
`azure-openai-responses/*` نیز وجود دارد؛ آکاردئون Compaction سمت سرور
در ادامه را ببینید.
</Note>

## پیکربندی پیشرفته

نمونه‌های هر مدلِ `params` در ادامه، درخواست ارائه‌دهنده تعبیه‌شده OpenClaw را
شکل می‌دهند. پیکربندی آن‌ها رفتاری صریح برای درخواست ایجاد می‌کند، بنابراین یک مسیر واجد شرایط
`auto` به‌جای انتخاب ضمنی Codex، در OpenClaw باقی می‌ماند. چارچوب بومی
app-server در Codex انتقال و تنظیمات درخواست خودش را مدیریت می‌کند؛
`agentRuntime.id: "codex"` صریح، وقتی مسیر مؤثر سازگار با Codex اعلام نشده باشد، به‌شکل بسته شکست می‌خورد.

<AccordionGroup>
  <Accordion title="انتقال (WebSocket در برابر SSE)">
    OpenClaw برای `openai/*` ابتدا از WebSocket و سپس از SSE به‌عنوان جایگزین استفاده می‌کند (`"auto"`).

    در حالت `"auto"`، OpenClaw:
    - پیش از جایگزینی با SSE، یک شکست زودهنگام WebSocket را دوباره امتحان می‌کند
    - پس از شکست، WebSocket را به‌مدت 60 ثانیه تضعیف‌شده علامت می‌زند و
      در دوره توقف از SSE استفاده می‌کند
    - برای تلاش‌های مجدد و اتصال‌های دوباره، سرآیندهای پایدار هویت نشست و نوبت
      را پیوست می‌کند
    - شمارنده‌های مصرف (`input_tokens` / `prompt_tokens`) را میان
      گونه‌های انتقال یکسان‌سازی می‌کند

    | مقدار                | رفتار                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (پیش‌فرض)   | ابتدا WebSocket، سپس SSE به‌عنوان جایگزین     |
    | `"sse"`              | اجبار به استفاده صرفاً از SSE                    |
    | `"websocket"`        | اجبار به استفاده صرفاً از WebSocket              |

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
    - [API بلادرنگ با WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [پاسخ‌های جریانی API ‏(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="حالت سریع">
    OpenClaw یک کلید مشترک حالت سریع برای `openai/*` ارائه می‌کند:

    - **گفت‌وگو/رابط کاربری:** `/fast status|auto|on|off`
    - **پیکربندی:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    وقتی فعال باشد، OpenClaw حالت سریع را به پردازش اولویت‌دار OpenAI
    (`service_tier = "priority"`) نگاشت می‌کند. مقادیر موجود `service_tier`
    حفظ می‌شوند و حالت سریع `reasoning` یا
    `text.verbosity` را بازنویسی نمی‌کند. `fastMode: "auto"` فراخوانی‌های جدید مدل را تا
    آستانه قطع خودکار به‌صورت سریع آغاز می‌کند، سپس تلاش مجدد، جایگزین، نتیجه ابزار یا
    فراخوانی‌های ادامه‌ای بعدی را بدون حالت سریع آغاز می‌کند. آستانه قطع به‌طور پیش‌فرض 60 ثانیه است؛
    برای تغییر آن، `params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.

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
    بازنویسی‌های نشست بر پیکربندی اولویت دارند. پاک‌کردن بازنویسی نشست در
    رابط کاربری Sessions، نشست را به پیش‌فرض پیکربندی‌شده بازمی‌گرداند.
    </Note>

  </Accordion>

  <Accordion title="پردازش اولویت‌دار (service_tier)">
    API متعلق به OpenAI پردازش اولویت‌دار را از طریق `service_tier` ارائه می‌کند. آن را برای هر
    مدل در OpenClaw تنظیم کنید:

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
    `serviceTier` فقط به نقاط پایانی بومی OpenAI
    (`api.openai.com`) و نقاط پایانی بومی Codex (`chatgpt.com/backend-api`) ارسال می‌شود.
    اگر هرکدام از ارائه‌دهندگان را از طریق پراکسی مسیریابی کنید، OpenClaw
    `service_tier` را بدون تغییر باقی می‌گذارد.
    </Warning>

  </Accordion>

  <Accordion title="Compaction سمت سرور (Responses API)">
    برای مدل‌های مستقیم Responses در OpenAI ‏(`openai/*` در `api.openai.com`)،
    پوشش‌دهنده جریان OpenClaw در Plugin مربوط به OpenAI به‌طور خودکار
    Compaction سمت سرور را فعال می‌کند:

    - `store: true` را اجباری می‌کند (مگر آنکه سازگاری مدل `supportsStore: false` را تنظیم کند)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` را تزریق می‌کند
    - مقدار پیش‌فرض `compact_threshold`: ‏70% از `contextWindow` (یا `80000` در صورت
      در دسترس نبودن)

    این مورد برای مسیر زمان اجرای داخلی OpenClaw و هوک‌های ارائه‌دهنده OpenAI
    که اجراهای تعبیه‌شده استفاده می‌کنند اعمال می‌شود. چارچوب بومی app-server در Codex
    زمینه خود را از طریق Codex مدیریت می‌کند و تحت تأثیر این تنظیم نیست.

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
    `responsesServerCompaction` فقط تزریق `context_management` را کنترل می‌کند.
    مدل‌های مستقیم Responses در OpenAI همچنان `store: true` را اجباری می‌کنند، مگر آنکه سازگاری
    `supportsStore: false` را تنظیم کند.
    </Note>

  </Accordion>

  <Accordion title="حالت سخت‌گیرانه عامل‌محور GPT">
    برای مدل‌های خانواده GPT-5 در ارائه‌دهنده `openai` که از طریق زمان اجرای تعبیه‌شده
    OpenClaw اجرا می‌شوند، OpenClaw از قبل به‌طور پیش‌فرض از قرارداد اجرایی سخت‌گیرانه‌تری با نام
    `strict-agentic` استفاده می‌کند. هرگاه ارائه‌دهنده حل‌شده
    `openai` باشد و شناسه مدل با خانواده GPT-5 مطابقت داشته باشد، این حالت به‌طور خودکار
    فعال می‌شود، مگر آنکه پیکربندی صریحاً آن را غیرفعال کند:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    تنظیم صریح `"strict-agentic"` در یک مسیر پشتیبانی‌شده هیچ اثری ندارد (این
    گزینه از قبل پیش‌فرض است) و در جفت‌های ارائه‌دهنده/مدل پشتیبانی‌نشده غیرفعال است.

    با فعال‌بودن `strict-agentic`، OpenClaw:
    - `update_plan` را برای کارهای قابل‌توجه به‌طور خودکار فعال می‌کند
    - نوبت‌های از نظر ساختاری خالی یا صرفاً استدلالی را با یک ادامه برای ارائهٔ
      پاسخ قابل‌مشاهده دوباره امتحان می‌کند
    - وقتی هارنس انتخاب‌شده آن‌ها را فراهم کند، از رویدادهای صریح برنامهٔ هارنس
      استفاده می‌کند

    OpenClaw نثر دستیار را برای تشخیص اینکه یک نوبت برنامه، به‌روزرسانی پیشرفت
    یا پاسخ نهایی است، طبقه‌بندی نمی‌کند.

    <Note>
    این قرارداد کاملاً در اجراکنندهٔ عامل تعبیه‌شدهٔ OpenClaw قرار دارد. این
    قرارداد برای هارنس بومی app-server در Codex اعمال نمی‌شود؛ این هارنس رفتار
    نوبت و برنامهٔ خود را مدیریت می‌کند. برای اجراهای بومی Codex، انتخاب هارنس
    از تنظیم قرارداد اجرا اهمیت بیشتری دارد.
    </Note>

  </Accordion>

  <Accordion title="مسیرهای بومی در برابر مسیرهای سازگار با OpenAI">
    OpenClaw با نقاط پایانی مستقیم OpenAI، Codex و Azure OpenAI متفاوت از
    پراکسی‌های عمومی `/v1` سازگار با OpenAI رفتار می‌کند:

    **مسیرهای بومی** (`openai/*`، Azure OpenAI):
    - `reasoning: { effort: "none" }` را فقط برای مدل‌هایی حفظ می‌کند که از تلاش
      `none` در OpenAI پشتیبانی می‌کنند
    - استدلال غیرفعال را برای مدل‌ها یا پراکسی‌هایی که
      `reasoning.effort: "none"` را رد می‌کنند، حذف می‌کند
    - حالت سخت‌گیرانه را به‌عنوان پیش‌فرض طرح‌واره‌های ابزار تعیین می‌کند
    - سرآیندهای انتساب پنهان را فقط به میزبان‌های بومی تأییدشده پیوست می‌کند (Azure
      OpenAI با وجود بومی‌بودن مسیر، این سرآیندها را دریافت نمی‌کند)
    - شکل‌دهی درخواست مخصوص OpenAI را حفظ می‌کند (`service_tier`، `store`،
      سازگاری استدلال، راهنمایی‌های کش پرامپت)

    **مسیرهای پراکسی/سازگار:**
    - از رفتار سازگاری منعطف‌تری استفاده می‌کنند
    - `store` مربوط به Completions را از محموله‌های غیربومی `openai-completions` حذف می‌کنند
    - JSON عبوری پیشرفتهٔ `params.extra_body`/`params.extraBody` را
      برای پراکسی‌های Completions سازگار با OpenAI می‌پذیرند
    - `params.chat_template_kwargs` را برای پراکسی‌های Completions سازگار با OpenAI
      مانند vLLM می‌پذیرند
    - طرح‌واره‌های سخت‌گیرانهٔ ابزار یا سرآیندهای مختص مسیر بومی را تحمیل نمی‌کنند

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اعتبارنامه‌ها.
  </Card>
</CardGroup>
