---
read_when:
    - تولید یا ویرایش تصاویر از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید تصویر
    - درک پارامترهای ابزار image_generate
sidebarTitle: Image generation
summary: تولید و ویرایش تصاویر از طریق image_generate در OpenAI، Google، fal، Microsoft Foundry، MiniMax، ComfyUI، DeepInfra، OpenRouter، LiteLLM، xAI، Vydra
title: تولید تصویر
x-i18n:
    generated_at: "2026-06-27T19:01:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

ابزار `image_generate` به عامل امکان می‌دهد با استفاده از ارائه‌دهندگان پیکربندی‌شده‌ی شما تصویر ایجاد و ویرایش کند. در نشست‌های چت، تولید تصویر به‌صورت ناهمگام اجرا می‌شود:
OpenClaw یک وظیفه‌ی پس‌زمینه ثبت می‌کند، شناسه‌ی وظیفه را بلافاصله برمی‌گرداند، و وقتی ارائه‌دهنده کار را تمام کند عامل را بیدار می‌کند. عامل تکمیل، حالت عادی نشست برای پاسخ قابل‌مشاهده را دنبال می‌کند: تحویل خودکار پاسخ نهایی وقتی پیکربندی شده باشد، یا `message(action="send")` وقتی نشست به ابزار پیام نیاز داشته باشد. اگر نشست درخواست‌کننده غیرفعال باشد یا بیدارسازی فعال آن شکست بخورد، و بعضی از تصاویر تولیدشده هنوز در پاسخ تکمیل وجود نداشته باشند، OpenClaw یک جایگزین مستقیم ایدمپوتنت ارسال می‌کند که فقط شامل تصاویر جاافتاده است.

<Note>
این ابزار فقط وقتی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده‌ی تولید تصویر
در دسترس باشد. اگر `image_generate` را در ابزارهای عامل خود نمی‌بینید،
`agents.defaults.imageGenerationModel` را پیکربندی کنید، یک کلید API ارائه‌دهنده تنظیم کنید،
یا با OpenAI ChatGPT/Codex OAuth وارد شوید.
</Note>

## شروع سریع

<Steps>
  <Step title="پیکربندی احراز هویت">
    برای دست‌کم یک ارائه‌دهنده یک کلید API تنظیم کنید (برای مثال `OPENAI_API_KEY`،
    `GEMINI_API_KEY`، `OPENROUTER_API_KEY`) یا با OpenAI Codex OAuth وارد شوید.
  </Step>
  <Step title="انتخاب یک مدل پیش‌فرض (اختیاری)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth از همان مرجع مدل `openai/gpt-image-2` استفاده می‌کند. وقتی یک
    پروفایل OAuth برای `openai` پیکربندی شده باشد، OpenClaw درخواست‌های تصویر را
    به‌جای اینکه ابتدا `OPENAI_API_KEY` را امتحان کند، از طریق همان پروفایل OAuth
    مسیریابی می‌کند. پیکربندی صریح `models.providers.openai` (کلید API،
    نشانی پایه‌ی سفارشی/Azure) دوباره مسیر مستقیم OpenAI Images API را
    فعال می‌کند.

  </Step>
  <Step title="از عامل درخواست کنید">
    _"تصویری از یک ربات نمادین دوستانه تولید کن."_

    عامل به‌صورت خودکار `image_generate` را فراخوانی می‌کند. نیازی به فهرست مجاز ابزارها
    نیست - وقتی ارائه‌دهنده‌ای در دسترس باشد، به‌طور پیش‌فرض فعال است. ابزار
    یک شناسه‌ی وظیفه‌ی پس‌زمینه برمی‌گرداند، سپس عامل تکمیل وقتی آماده شد پیوست تولیدشده
    را از طریق ابزار `message` ارسال می‌کند.

  </Step>
</Steps>

<Warning>
برای نقاط پایانی LAN سازگار با OpenAI مانند LocalAI، مقدار سفارشی
`models.providers.openai.baseUrl` را نگه دارید و به‌صورت صریح با
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` وارد شوید. نقاط پایانی تصویر خصوصی و
داخلی به‌طور پیش‌فرض همچنان مسدود می‌مانند.
</Warning>

## مسیرهای رایج

| هدف                                                 | مرجع مدل                                          | احراز هویت                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| تولید تصویر OpenAI با صورت‌حساب API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| تولید تصویر OpenAI با احراز هویت اشتراک Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP با پس‌زمینه شفاف OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` یا OpenAI Codex OAuth |
| تولید تصویر DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| تولید بیانگر/سبک‌محور fal Krea 2      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| تولید تصویر OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| تولید تصویر LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| تولید تصویر Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` یا Entra ID     |
| تولید تصویر Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`   |

همان ابزار `image_generate` تولید متن‌به‌تصویر و ویرایش تصویر مرجع را مدیریت می‌کند.
برای یک مرجع از `image` و برای چند مرجع از `images` استفاده کنید.
برای مدل‌های Krea 2 روی fal، آن مراجع به‌جای ورودی‌های ویرایش، به‌عنوان مراجع سبک
ارسال می‌شوند.
راهنماهای خروجی پشتیبانی‌شده توسط ارائه‌دهنده مانند `quality`، `outputFormat`، و
`background` در صورت دسترس‌بودن ارسال می‌شوند و وقتی ارائه‌دهنده‌ای از آن‌ها
پشتیبانی نکند به‌عنوان نادیده‌گرفته‌شده گزارش می‌شوند. پشتیبانی بسته‌بندی‌شده از پس‌زمینه‌ی شفاف
مختص OpenAI است؛ ارائه‌دهندگان دیگر ممکن است همچنان آلفای PNG را حفظ کنند اگر
بک‌اند آن‌ها آن را تولید کند.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده          | مدل پیش‌فرض                           | پشتیبانی از ویرایش                       | احراز هویت                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | بله (۱ تصویر، پیکربندی‌شده با گردش‌کار) | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` برای ابر    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | بله (۱ تصویر)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | بله (محدودیت‌های وابسته به مدل)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | بله                                | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | بله (تا ۵ تصویر ورودی)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | بله (فقط مدل‌های MAI-Image-2.5)    | `AZURE_OPENAI_API_KEY` یا Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | بله (مرجع سوژه)            | `MINIMAX_API_KEY` یا MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | بله (تا ۴ تصویر)               | `OPENAI_API_KEY` یا OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | بله (تا ۵ تصویر ورودی)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | خیر                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | بله (تا ۵ تصویر)               | `XAI_API_KEY`                                         |

برای بررسی ارائه‌دهندگان و مدل‌های در دسترس در زمان اجرا از `action: "list"` استفاده کنید:

```text
/tool image_generate action=list
```

برای بررسی وظیفه‌ی فعال تولید تصویر برای نشست فعلی از `action: "status"` استفاده کنید:

```text
/tool image_generate action=status
```

## قابلیت‌های ارائه‌دهنده

| قابلیت            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| تولید (حداکثر تعداد)  | تعریف‌شده توسط گردش‌کار   | ۴         | ۴                                              | ۴              | ۱                 | ۹                     | ۴              | ۱     | ۴              |
| ویرایش / مرجع      | ۱ تصویر (گردش‌کار) | ۱ تصویر   | Flux: 1; GPT: 10; Krea style refs: 10; NB2: 14 | تا ۵ تصویر | ۱ تصویر           | ۱ تصویر (مرجع سوژه) | تا ۵ تصویر | -     | تا ۵ تصویر |
| کنترل اندازه          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | تا 4K       | -     | -              |
| نسبت تصویر          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| وضوح (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  درخواست تولید تصویر. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  برای بررسی وظیفه‌ی فعال نشست از `"status"` یا برای بررسی
  ارائه‌دهندگان و مدل‌های در دسترس در زمان اجرا از `"list"` استفاده کنید.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی ارائه‌دهنده/مدل (مثلاً `openai/gpt-image-2`). برای پس‌زمینه‌های شفاف OpenAI از
  `openai/gpt-image-1.5` استفاده کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع برای حالت ویرایش.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع برای حالت ویرایش یا مدل‌های مرجع سبک (تا ۱۰
  از طریق ابزار مشترک؛ محدودیت‌های ویژه‌ی ارائه‌دهنده همچنان اعمال می‌شوند).
</ParamField>
<ParamField path="size" type="string">
  راهنمای اندازه: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبت تصویر: `1:1`، `2:3`، `3:2`، `2.35:1`، `3:4`، `4:3`، `4:5`،
  `5:4`، `9:16`، `16:9`، `21:9`، `4:1`، `1:4`، `8:1`، `1:8`. ارائه‌دهندگان
  زیرمجموعه‌ی ویژه‌ی مدل خود را اعتبارسنجی می‌کنند.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>راهنمای وضوح.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  راهنمای کیفیت وقتی ارائه‌دهنده از آن پشتیبانی کند.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  راهنمای قالب خروجی وقتی ارائه‌دهنده از آن پشتیبانی کند.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  راهنمای پس‌زمینه وقتی ارائه‌دهنده از آن پشتیبانی کند. برای ارائه‌دهندگان دارای قابلیت شفافیت، از `transparent` همراه با
  `outputFormat: "png"` یا `"webp"` استفاده کنید.
</ParamField>
<ParamField path="count" type="number">تعداد تصاویر برای تولید (۱-۴).</ParamField>
<ParamField path="timeoutMs" type="number">
  مهلت اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه. وقتی Codex از طریق ابزارهای پویا
  `image_generate` را فراخوانی می‌کند، این مقدار در هر فراخوانی همچنان پیش‌فرض پیکربندی‌شده را بازنویسی می‌کند
  و سقف آن 600000 ms است.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="openai" type="object">
  راهنماهای فقط مخصوص OpenAI: `background`، `moderation`، `outputCompression`، و `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  کنترل خلاقیت fal Krea 2. مقدار پیش‌فرض `medium` است.
</ParamField>

<Note>
همه‌ی ارائه‌دهندگان از همه‌ی پارامترها پشتیبانی نمی‌کنند. وقتی یک ارائه‌دهنده‌ی جایگزین به‌جای گزینه‌ی هندسی دقیقاً درخواست‌شده،
از گزینه‌ی هندسی نزدیک پشتیبانی کند، OpenClaw پیش از ارسال، آن را به
نزدیک‌ترین اندازه، نسبت تصویر، یا وضوح پشتیبانی‌شده نگاشت می‌کند.
راهنماهای خروجی پشتیبانی‌نشده برای ارائه‌دهندگانی که پشتیبانی از آن‌ها را اعلام نمی‌کنند
حذف می‌شوند و در نتیجه‌ی ابزار گزارش می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛
`details.normalization` هر ترجمه‌ی درخواست‌شده‌به‌اعمال‌شده را ثبت می‌کند.
</Note>

## پیکربندی

### انتخاب مدل

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ترتیب انتخاب ارائه‌دهنده

OpenClaw ارائه‌دهندگان را به این ترتیب امتحان می‌کند:

1. **پارامتر `model`** از فراخوانی ابزار (اگر عامل یکی را مشخص کند).
2. **`imageGenerationModel.primary`** از پیکربندی.
3. **`imageGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** - فقط پیش‌فرض‌های ارائه‌دهنده‌ای که پشتوانه احراز هویت دارند:
   - ابتدا ارائه‌دهنده پیش‌فرض فعلی؛
   - سپس بقیه ارائه‌دهندگان ثبت‌شده تولید تصویر، به‌ترتیب شناسه ارائه‌دهنده.

اگر یک ارائه‌دهنده شکست بخورد (خطای احراز هویت، محدودیت نرخ، و غیره)، نامزد
پیکربندی‌شده بعدی به‌طور خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا شامل جزئیات
هر تلاش خواهد بود.

<AccordionGroup>
  <Accordion title="بازنویسی‌های مدل در هر فراخوانی دقیق هستند">
    بازنویسی `model` در هر فراخوانی فقط همان ارائه‌دهنده/مدل را امتحان می‌کند و
    به primary/fallback پیکربندی‌شده یا ارائه‌دهندگان شناسایی‌شده خودکار ادامه
    نمی‌دهد.
  </Accordion>
  <Accordion title="تشخیص خودکار از احراز هویت آگاه است">
    پیش‌فرض یک ارائه‌دهنده فقط وقتی وارد فهرست نامزدها می‌شود که OpenClaw بتواند
    واقعاً آن ارائه‌دهنده را احراز هویت کند. برای استفاده فقط از ورودی‌های صریح
    `model`، `primary` و `fallbacks` مقدار
    `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.
  </Accordion>
  <Accordion title="مهلت‌های زمانی">
    برای backendهای کند تصویر، `agents.defaults.imageGenerationModel.timeoutMs` را
    تنظیم کنید. پارامتر ابزار `timeoutMs` در هر فراخوانی، پیش‌فرض پیکربندی‌شده را
    بازنویسی می‌کند، و پیش‌فرض‌های پیکربندی‌شده پیش‌فرض‌های ارائه‌دهنده‌ای را که
    نویسنده Plugin تنظیم کرده بازنویسی می‌کنند. ارائه‌دهندگان تصویر میزبانی‌شده
    Google و OpenRouter از پیش‌فرض‌های 180 ثانیه‌ای استفاده می‌کنند؛ تولید تصویر
    Microsoft Foundry MAI، xAI و Azure OpenAI از 600 ثانیه استفاده می‌کند.
    فراخوانی‌های ابزار پویای Codex از پیش‌فرض 120 ثانیه‌ای پل `image_generate`
    استفاده می‌کنند و هنگام پیکربندی همان بودجه مهلت زمانی را رعایت می‌کنند، با
    سقف بیشینه 600000 میلی‌ثانیه‌ای پل ابزار پویای OpenClaw.
  </Accordion>
  <Accordion title="بازبینی در زمان اجرا">
    برای بازبینی ارائه‌دهندگان ثبت‌شده فعلی، مدل‌های پیش‌فرض آن‌ها، و راهنمای
    متغیرهای محیطی احراز هویت، از `action: "list"` استفاده کنید.
  </Accordion>
</AccordionGroup>

### ویرایش تصویر

OpenAI، OpenRouter، Google، DeepInfra، fal، Microsoft Foundry، MiniMax،
ComfyUI و xAI از ویرایش تصاویر مرجع پشتیبانی می‌کنند. مدل‌های Krea 2 روی fal از
همان فیلدهای `image` / `images` به‌عنوان مرجع سبک استفاده می‌کنند، نه ورودی
ویرایش. یک مسیر یا URL تصویر مرجع بدهید:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI، OpenRouter، Google و xAI از حداکثر 5 تصویر مرجع از طریق پارامتر
`images` پشتیبانی می‌کنند. fal برای Flux image-to-image از 1 تصویر مرجع، برای
ویرایش‌های GPT Image 2 تا 10 تصویر، برای مرجع‌های سبک Krea 2 تا 10 تصویر، و
برای ویرایش‌های Nano Banana 2 تا 14 تصویر پشتیبانی می‌کند. Microsoft Foundry،
MiniMax و ComfyUI از 1 تصویر پشتیبانی می‌کنند.

## بررسی‌های عمیق ارائه‌دهنده

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (و gpt-image-1.5)">
    تولید تصویر OpenAI به‌طور پیش‌فرض از `openai/gpt-image-2` استفاده می‌کند. اگر
    یک پروفایل OAuth برای `openai` پیکربندی شده باشد، OpenClaw همان پروفایل
    OAuth استفاده‌شده توسط مدل‌های گفت‌وگوی اشتراکی Codex را دوباره استفاده می‌کند
    و درخواست تصویر را از طریق backend پاسخ‌های Codex می‌فرستد. URLهای پایه
    قدیمی Codex مانند `https://chatgpt.com/backend-api` برای درخواست‌های تصویر به
    `https://chatgpt.com/backend-api/codex` استانداردسازی می‌شوند. OpenClaw برای
    آن درخواست بی‌صدا به `OPENAI_API_KEY` fallback نمی‌کند - برای اجبار مسیریابی
    مستقیم OpenAI Images API، `models.providers.openai` را صراحتاً با یک کلید API،
    URL پایه سفارشی، یا endpoint مربوط به Azure پیکربندی کنید.

    مدل‌های `openai/gpt-image-1.5`، `openai/gpt-image-1` و
    `openai/gpt-image-1-mini` همچنان می‌توانند صراحتاً انتخاب شوند. برای خروجی
    PNG/WebP با پس‌زمینه شفاف از `gpt-image-1.5` استفاده کنید؛ API فعلی
    `gpt-image-2` مقدار `background: "transparent"` را رد می‌کند.

    `gpt-image-2` هم از تولید متن‌به‌تصویر و هم از ویرایش تصویر مرجع از طریق
    همان ابزار `image_generate` پشتیبانی می‌کند. OpenClaw مقادیر `prompt`،
    `count`، `size`، `quality`، `outputFormat` و تصاویر مرجع را به OpenAI ارسال
    می‌کند. OpenAI مقدار `aspectRatio` یا `resolution` را مستقیماً دریافت
    نمی‌کند؛ وقتی ممکن باشد OpenClaw آن‌ها را به یک `size` پشتیبانی‌شده نگاشت
    می‌کند، وگرنه ابزار آن‌ها را به‌عنوان بازنویسی‌های نادیده‌گرفته‌شده گزارش
    می‌کند.

    گزینه‌های اختصاصی OpenAI زیر شیء `openai` قرار می‌گیرند:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` مقادیر `transparent`، `opaque` یا `auto` را می‌پذیرد؛
    خروجی‌های شفاف به `outputFormat` با مقدار `png` یا `webp` و یک مدل تصویر
    OpenAI با قابلیت شفافیت نیاز دارند. OpenClaw درخواست‌های پیش‌فرض
    `gpt-image-2` با پس‌زمینه شفاف را به `gpt-image-1.5` مسیریابی می‌کند.
    `openai.outputCompression` روی خروجی‌های JPEG/WebP اعمال می‌شود و برای خروجی‌های
    PNG نادیده گرفته می‌شود.

    راهنمای سطح بالای `background` نسبت به ارائه‌دهنده خنثی است و در حال حاضر
    وقتی ارائه‌دهنده OpenAI انتخاب شود به همان فیلد درخواست `background` در
    OpenAI نگاشت می‌شود. ارائه‌دهندگانی که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند،
    به‌جای دریافت پارامتر پشتیبانی‌نشده، آن را در `ignoredOverrides` برمی‌گردانند.

    برای مسیریابی تولید تصویر OpenAI از طریق یک deployment در Azure OpenAI به‌جای
    `api.openai.com`، به
    [endpointهای Azure OpenAI](/fa/providers/openai#azure-openai-endpoints) مراجعه کنید.

  </Accordion>
  <Accordion title="مدل‌های تصویر Microsoft Foundry MAI">
    تولید تصویر Microsoft Foundry از نام‌های deployment تصویر MAI مستقرشده زیر
    پیشوند ارائه‌دهنده `microsoft-foundry/` استفاده می‌کند. مدل پیش‌فرض در سطح
    ارائه‌دهنده وجود ندارد، چون MAI API نام deployment شما را در فیلد `model`
    انتظار دارد:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    این ارائه‌دهنده از MAI API مربوط به Microsoft Foundry استفاده می‌کند، نه
    OpenAI Images API:

    - endpoint تولید: `/mai/v1/images/generations`
    - endpoint ویرایش: `/mai/v1/images/edits`
    - احراز هویت: `AZURE_OPENAI_API_KEY` / کلید API ارائه‌دهنده، یا Entra ID از طریق `az login`
    - خروجی: یک تصویر PNG
    - اندازه: پیش‌فرض `1024x1024`؛ عرض و ارتفاع هرکدام باید دست‌کم 768 px باشند،
      و کل پیکسل‌ها باید حداکثر 1,048,576 باشد
    - ویرایش‌ها: یک تصویر مرجع PNG یا JPEG، که فقط توسط deploymentهای
      `MAI-Image-2.5-Flash` و `MAI-Image-2.5` پشتیبانی می‌شود

    تولید فقط با prompt می‌تواند با یک نام deployment سفارشی و فقط با endpoint
    پیکربندی‌شده Foundry استفاده شود. ویرایش با نام‌های deployment سفارشی به
    metadata راه‌اندازی/مدل نیاز دارد تا OpenClaw بتواند تأیید کند deployment
    توسط `MAI-Image-2.5-Flash` یا `MAI-Image-2.5` پشتیبانی می‌شود.

    مدل‌های تصویر فعلی MAI عبارت‌اند از `MAI-Image-2.5-Flash`،
    `MAI-Image-2.5`، `MAI-Image-2e` و `MAI-Image-2`. برای راه‌اندازی و رفتار
    مدل گفت‌وگو، [Plugin مربوط به Microsoft Foundry](/fa/plugins/reference/microsoft-foundry)
    را ببینید.

  </Accordion>
  <Accordion title="مدل‌های تصویر OpenRouter">
    تولید تصویر OpenRouter از همان `OPENROUTER_API_KEY` استفاده می‌کند و از طریق
    API تصویر chat completions مربوط به OpenRouter مسیریابی می‌شود. مدل‌های تصویر
    OpenRouter را با پیشوند `openrouter/` انتخاب کنید:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw مقادیر `prompt`، `count`، تصاویر مرجع، و راهنماهای سازگار با Gemini
    برای `aspectRatio` / `resolution` را به OpenRouter ارسال می‌کند. میان‌برهای
    داخلی فعلی مدل تصویر OpenRouter شامل
    `google/gemini-3.1-flash-image-preview`،
    `google/gemini-3-pro-image-preview` و `openai/gpt-5.4-image-2` هستند. برای
    دیدن آنچه Plugin پیکربندی‌شده شما در معرض استفاده قرار می‌دهد، از
    `action: "list"` استفاده کنید.

  </Accordion>
  <Accordion title="fal Krea 2">
    مدل‌های Krea 2 روی fal به‌جای schema عمومی `image_size` که Flux استفاده
    می‌کند، از schema بومی Krea در fal استفاده می‌کنند. OpenClaw موارد زیر را
    ارسال می‌کند:

    - `aspect_ratio` برای راهنماهای نسبت تصویر
    - `creativity`، با مقدار پیش‌فرض `medium`
    - `image_style_references` وقتی `image` یا `images` ارائه شده باشد

    Krea 2 Medium را برای تصویرسازی بیانگر سریع‌تر و Krea 2 Large را برای ظاهرهای
    فوتورئال و بافت‌دار کندتر اما پرجزئیات‌تر انتخاب کنید:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 در حال حاضر در هر درخواست یک تصویر برمی‌گرداند. برای Krea بهتر است از
    `aspectRatio` استفاده کنید؛ OpenClaw مقدار `size` را به نزدیک‌ترین نسبت تصویر
    پشتیبانی‌شده Krea نگاشت می‌کند و برای Krea به‌جای حذف کردن `resolution`، آن
    را رد می‌کند. وقتی سطح خلاقیت بومی Krea را می‌خواهید، از `fal.creativity`
    استفاده کنید:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="احراز هویت دوگانه MiniMax">
    تولید تصویر MiniMax از طریق هر دو مسیر احراز هویت MiniMax بسته‌بندی‌شده در
    دسترس است:

    - `minimax/image-01` برای راه‌اندازی‌های مبتنی بر کلید API
    - `minimax-portal/image-01` برای راه‌اندازی‌های مبتنی بر OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ارائه‌دهنده xAI بسته‌بندی‌شده برای درخواست‌های فقط prompt از
    `/v1/images/generations` و وقتی `image` یا `images` وجود داشته باشد از
    `/v1/images/edits` استفاده می‌کند.

    - مدل‌ها: `xai/grok-imagine-image`، `xai/grok-imagine-image-quality`
    - تعداد: تا 4
    - مرجع‌ها: یک `image` یا تا پنج `images`
    - نسبت‌های تصویر: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - وضوح‌ها: `1K`، `2K`
    - خروجی‌ها: به‌عنوان پیوست‌های تصویر مدیریت‌شده توسط OpenClaw برگردانده می‌شوند

    OpenClaw عمداً `quality`، `mask`، `user` بومی xAI یا نسبت‌های تصویر اضافی
    فقط‌بومی را تا زمانی که این کنترل‌ها در قرارداد مشترک و چندارائه‌دهنده‌ای
    `image_generate` وجود نداشته باشند، در معرض استفاده قرار نمی‌دهد.

  </Accordion>
</AccordionGroup>

## نمونه‌ها

<Tabs>
  <Tab title="تولید (منظره 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="تولید (PNG شفاف)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI معادل:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="تولید (کیفیت پایین OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI معادل:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

همان پرچم‌های `--output-format`، `--background`، `--quality` و
`--openai-moderation` در `openclaw infer image edit` نیز در دسترس هستند؛
`--openai-background` همچنان به‌عنوان نام مستعار اختصاصی OpenAI باقی می‌ماند. ارائه‌دهندگان همراه
به‌جز OpenAI امروز کنترل صریح پس‌زمینه را اعلام نمی‌کنند، بنابراین
`background: "transparent"` برای آن‌ها نادیده‌گرفته‌شده گزارش می‌شود.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای عامل موجود
- [ComfyUI](/fa/providers/comfy) - راه‌اندازی گردش‌کار محلی ComfyUI و Comfy Cloud
- [fal](/fa/providers/fal) - راه‌اندازی ارائه‌دهنده تصویر و ویدیوی fal
- [Google (Gemini)](/fa/providers/google) - راه‌اندازی ارائه‌دهنده تصویر Gemini
- [Plugin Microsoft Foundry](/fa/plugins/reference/microsoft-foundry) - راه‌اندازی چت Microsoft Foundry و تصویر MAI
- [MiniMax](/fa/providers/minimax) - راه‌اندازی ارائه‌دهنده تصویر MiniMax
- [OpenAI](/fa/providers/openai) - راه‌اندازی ارائه‌دهنده OpenAI Images
- [Vydra](/fa/providers/vydra) - راه‌اندازی تصویر، ویدیو و گفتار Vydra
- [xAI](/fa/providers/xai) - راه‌اندازی تصویر، ویدیو، جست‌وجو، اجرای کد و TTS در Grok
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) - پیکربندی `imageGenerationModel`
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و failover
