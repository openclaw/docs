---
read_when:
    - تولید یا ویرایش تصاویر از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید تصویر
    - درک پارامترهای ابزار image_generate
sidebarTitle: Image generation
summary: تولید و ویرایش تصاویر از طریق `image_generate` در OpenAI، Google، fal، Microsoft Foundry، MiniMax، ComfyUI، DeepInfra، OpenRouter، LiteLLM، xAI و Vydra
title: تولید تصویر
x-i18n:
    generated_at: "2026-07-12T10:55:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

ابزار `image_generate` از طریق ارائه‌دهندگان پیکربندی‌شده شما تصاویر را ایجاد و ویرایش می‌کند. در نشست‌های گفت‌وگو، این ابزار به‌صورت ناهمگام اجرا می‌شود: OpenClaw یک وظیفه پس‌زمینه ثبت می‌کند، شناسه وظیفه را بلافاصله برمی‌گرداند و پس از پایان کار ارائه‌دهنده، عامل را بیدار می‌کند. عامل تکمیل از حالت معمول پاسخ قابل‌مشاهده نشست پیروی می‌کند: در صورت پیکربندی، پاسخ نهایی به‌طور خودکار تحویل داده می‌شود؛ یا اگر نشست به ابزار پیام نیاز داشته باشد، از `message(action="send")` استفاده می‌شود. اگر نشست درخواست‌کننده غیرفعال باشد یا بیدارسازی فعال آن ناموفق شود، OpenClaw یک پاسخ جایگزین مستقیم و هم‌توان با تصاویر تولیدشده ارسال می‌کند تا نتیجه از دست نرود.

<Note>
این ابزار فقط زمانی نمایش داده می‌شود که دست‌کم یک ارائه‌دهنده تولید تصویر در دسترس باشد. اگر `image_generate` را در ابزارهای عامل خود نمی‌بینید، `agents.defaults.imageGenerationModel` را پیکربندی کنید، کلید API یک ارائه‌دهنده را تنظیم کنید یا با OpenAI ChatGPT/Codex OAuth وارد شوید.
</Note>

## شروع سریع

<Steps>
  <Step title="پیکربندی احراز هویت">
    برای دست‌کم یک ارائه‌دهنده، کلید API تنظیم کنید (برای نمونه `OPENAI_API_KEY`،
    `GEMINI_API_KEY`، `OPENROUTER_API_KEY`) یا با OpenAI Codex OAuth وارد شوید.
  </Step>
  <Step title="انتخاب مدل پیش‌فرض (اختیاری)">
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

    ChatGPT/Codex OAuth از همان ارجاع مدل `openai/gpt-image-2` استفاده می‌کند. وقتی یک نمایه OAuth از نوع `openai` پیکربندی شده باشد، OpenClaw درخواست‌های تصویر را به‌جای تلاش اولیه با `OPENAI_API_KEY`، از طریق همان نمایه OAuth هدایت می‌کند. پیکربندی صریح `models.providers.openai` (کلید API یا نشانی پایه سفارشی/Azure) دوباره مسیر مستقیم OpenAI Images API را فعال می‌کند.

  </Step>
  <Step title="درخواست از عامل">
    _«تصویری از یک ربات خوش‌برخورد به‌عنوان نماد تولید کن.»_

    عامل به‌طور خودکار `image_generate` را فراخوانی می‌کند. نیازی به افزودن ابزار به فهرست مجاز نیست؛ هنگامی که ارائه‌دهنده‌ای در دسترس باشد، ابزار به‌طور پیش‌فرض فعال است. ابزار ابتدا شناسه یک وظیفه پس‌زمینه را برمی‌گرداند و سپس عامل تکمیل، پس از آماده‌شدن پیوست تولیدشده، آن را از طریق ابزار `message` ارسال می‌کند.

  </Step>
</Steps>

<Warning>
برای نقاط پایانی سازگار با OpenAI در شبکه LAN، مانند LocalAI، مقدار سفارشی `models.providers.openai.baseUrl` را حفظ کنید و با `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` صریحاً اجازه دسترسی بدهید. نقاط پایانی خصوصی و داخلی تصویر به‌طور پیش‌فرض همچنان مسدود می‌مانند.
</Warning>

## مسیرهای رایج

| هدف                                                  | ارجاع مدل                                          | احراز هویت                             |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| تولید تصویر OpenAI با صورت‌حساب API                  | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| تولید تصویر OpenAI با احراز هویت اشتراک Codex       | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP با پس‌زمینه شفاف در OpenAI                  | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` یا OpenAI Codex OAuth |
| تولید تصویر DeepInfra                               | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| تولید بیان‌محور/سبک‌محور fal Krea 2                 | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| تولید تصویر OpenRouter                              | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| تولید تصویر LiteLLM                                 | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| تولید تصویر Microsoft Foundry MAI                   | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` یا Entra ID     |
| تولید تصویر Google Gemini                           | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`   |

همین ابزار هم تبدیل متن به تصویر و هم ویرایش با تصویر مرجع را انجام می‌دهد. برای یک تصویر مرجع از `image` و برای چند تصویر از `images` استفاده کنید. در مدل‌های Krea 2 روی fal، این تصاویر به‌جای ورودی ویرایش، به‌عنوان مراجع سبک ارسال می‌شوند. راهنماهای خروجی پشتیبانی‌شده توسط ارائه‌دهنده، مانند `quality`، `outputFormat` و `background`، در صورت امکان منتقل می‌شوند و اگر ارائه‌دهنده پشتیبانی از آن‌ها را اعلام نکرده باشد، نادیده‌گرفته‌شدنشان گزارش می‌شود. پشتیبانی داخلی از پس‌زمینه شفاف مختص OpenAI است؛ بااین‌حال، سایر ارائه‌دهندگان نیز ممکن است در صورت تولید توسط سامانه پشتیبان خود، کانال آلفای PNG را حفظ کنند.

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده       | مدل پیش‌فرض                            | پشتیبانی از ویرایش                          | احراز هویت                                           |
| ----------------- | --------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| ComfyUI           | `workflow`                              | بله (۱ تصویر، پیکربندی‌شده در گردش کار)     | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` برای ابر    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | بله (۱ تصویر)                               | `DEEPINFRA_API_KEY`                                  |
| fal               | `fal-ai/flux/dev`                       | بله (محدودیت‌های مختص مدل)                  | `FAL_KEY`                                            |
| Google            | `gemini-3.1-flash-image-preview`        | بله (تا ۵ تصویر)                            | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | بله (تا ۵ تصویر ورودی)                      | `LITELLM_API_KEY`                                    |
| Microsoft Foundry | `<deployment-name>`                     | بله (فقط مدل‌های MAI-Image-2.5)             | `AZURE_OPENAI_API_KEY` یا Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | بله (مرجع سوژه)                             | `MINIMAX_API_KEY` یا MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | بله (تا ۵ تصویر)                            | `OPENAI_API_KEY` یا OpenAI ChatGPT/Codex OAuth       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | بله (تا ۵ تصویر ورودی)                      | `OPENROUTER_API_KEY`                                 |
| Vydra             | `grok-imagine`                          | خیر                                         | `VYDRA_API_KEY`                                      |
| xAI               | `grok-imagine-image`                    | بله (تا ۳ تصویر)                            | `XAI_API_KEY`                                        |

برای بررسی ارائه‌دهندگان و مدل‌های موجود در زمان اجرا، از `action: "list"` استفاده کنید:

```text
/tool image_generate action=list
```

برای بررسی وظیفه فعال تولید تصویر در نشست جاری، از `action: "status"` استفاده کنید:

```text
/tool image_generate action=status
```

## قابلیت‌های ارائه‌دهندگان

| قابلیت                    | ComfyUI                 | DeepInfra | fal                                                  | Google       | Microsoft Foundry | MiniMax              | OpenAI       | Vydra | xAI          |
| ------------------------- | ----------------------- | --------- | ---------------------------------------------------- | ------------ | ----------------- | -------------------- | ------------ | ----- | ------------ |
| تولید (حداکثر تعداد)      | ۱                       | ۴         | ۴                                                    | ۴            | ۱                 | ۹                    | ۴            | ۱     | ۴            |
| ویرایش / مرجع             | ۱ تصویر (گردش کار)      | ۱ تصویر   | Flux: ۱؛ GPT: ۱۰؛ مراجع سبک Krea: ۱۰؛ NB2: ۱۴       | تا ۵ تصویر   | ۱ تصویر           | ۱ تصویر (مرجع سوژه) | تا ۵ تصویر   | -     | تا ۳ تصویر   |
| کنترل اندازه              | -                       | ✓         | ✓                                                    | ✓            | ✓                 | -                    | تا 4K        | -     | -            |
| نسبت ابعاد                | -                       | -         | ✓                                                    | ✓            | -                 | ✓                    | -            | -     | ✓            |
| وضوح (1K/2K/4K)           | -                       | -         | ✓                                                    | ✓            | -                 | -                    | -            | -     | 1K، 2K       |

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  دستور تولید تصویر. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  برای بررسی وظیفه فعال نشست از `"status"` و برای بررسی ارائه‌دهندگان و مدل‌های موجود در زمان اجرا از `"list"` استفاده کنید.
</ParamField>
<ParamField path="model" type="string">
  جایگزینی ارائه‌دهنده/مدل (برای نمونه `openai/gpt-image-2`). برای پس‌زمینه شفاف OpenAI از `openai/gpt-image-1.5` استفاده کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا نشانی اینترنتی یک تصویر مرجع برای حالت ویرایش.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع برای حالت ویرایش یا مدل‌های مرجع سبک (حداکثر ۱۴ تصویر از طریق ابزار مشترک؛ محدودیت‌های مختص ارائه‌دهنده همچنان اعمال می‌شوند).
</ParamField>
<ParamField path="size" type="string">
  راهنمای اندازه: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبت ابعاد: `1:1`، `2:1`، `20:9`، `19.5:9`، `2:3`، `3:2`، `2.35:1`، `3:4`،
  `4:3`، `4:5`، `5:4`، `9:16`، `9:19.5`، `9:20`، `16:9`، `21:9`، `1:2`، `4:1`،
  `1:4`، `8:1`، `1:8`. ارائه‌دهندگان زیرمجموعه مختص مدل خود را اعتبارسنجی می‌کنند.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>راهنمای وضوح.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  راهنمای کیفیت، هنگامی که ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  راهنمای قالب خروجی، هنگامی که ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  راهنمای پس‌زمینه، هنگامی که ارائه‌دهنده از آن پشتیبانی می‌کند. برای ارائه‌دهندگان دارای قابلیت شفافیت، از `transparent` همراه با `outputFormat: "png"` یا `"webp"` استفاده کنید.
</ParamField>
<ParamField path="count" type="number">تعداد تصاویر برای تولید (۱ تا ۴).</ParamField>
<ParamField path="timeoutMs" type="number">
  مهلت اختیاری درخواست ارائه‌دهنده برحسب میلی‌ثانیه. وقتی Codex ابزار `image_generate` را از طریق ابزارهای پویا فراخوانی می‌کند، این مقدار مختص هر فراخوانی همچنان مقدار پیش‌فرض پیکربندی‌شده را بازنویسی می‌کند و حداکثر به ۶۰۰۰۰۰ میلی‌ثانیه محدود می‌شود.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="openai" type="object">
  راهنماهای مختص OpenAI: `background`، `moderation`، `outputCompression` و `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  کنترل خلاقیت fal Krea 2. مقدار پیش‌فرض `medium` است.
</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. اگر ارائه‌دهنده جایگزین به‌جای گزینه هندسی دقیقاً درخواست‌شده، از گزینه‌ای نزدیک پشتیبانی کند، OpenClaw پیش از ارسال، درخواست را به نزدیک‌ترین اندازه، نسبت ابعاد یا وضوح پشتیبانی‌شده نگاشت می‌کند. راهنماهای خروجی پشتیبانی‌نشده برای ارائه‌دهندگانی که پشتیبانی از آن‌ها را اعلام نکرده‌اند حذف می‌شوند و این موضوع در نتیجه ابزار گزارش می‌شود. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هرگونه تبدیل مقدار درخواستی به مقدار اعمال‌شده را ثبت می‌کند.
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

OpenClaw ارائه‌دهندگان را به‌ترتیب زیر امتحان می‌کند:

1. پارامتر **`model`** از فراخوانی ابزار (اگر عامل آن را مشخص کند).
2. مقدار **`imageGenerationModel.primary`** از پیکربندی.
3. مقادیر **`imageGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** — فقط پیش‌فرض‌های ارائه‌دهندگانی که احراز هویت آن‌ها پشتیبانی می‌شود:
   - ابتدا ارائه‌دهنده پیش‌فرض فعلی؛
   - سپس سایر ارائه‌دهندگان ثبت‌شده تولید تصویر، به‌ترتیب شناسه ارائه‌دهنده.

اگر ارائه‌دهنده‌ای ناموفق باشد (خطای احراز هویت، محدودیت نرخ و غیره)، نامزد پیکربندی‌شده بعدی به‌طور خودکار امتحان می‌شود. اگر همه ناموفق باشند، خطا شامل جزئیات هر تلاش خواهد بود.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    بازنویسی `model` برای هر فراخوانی، فقط همان ارائه‌دهنده/مدل را امتحان می‌کند و به ارائه‌دهندگان اصلی/جایگزین پیکربندی‌شده یا ارائه‌دهندگان شناسایی‌شده خودکار ادامه نمی‌دهد.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    پیش‌فرض یک ارائه‌دهنده تنها زمانی وارد فهرست نامزدها می‌شود که OpenClaw واقعاً بتواند آن ارائه‌دهنده را احراز هویت کند. برای استفاده صرفاً از ورودی‌های صریح `model`،‏ `primary` و `fallbacks`، مقدار `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.
  </Accordion>
  <Accordion title="Timeouts">
    برای سامانه‌های پشتیبان کند تولید تصویر، `agents.defaults.imageGenerationModel.timeoutMs` را تنظیم کنید. پارامتر ابزار `timeoutMs` در هر فراخوانی، پیش‌فرض پیکربندی‌شده را بازنویسی می‌کند و پیش‌فرض‌های پیکربندی‌شده نیز بر پیش‌فرض‌های ارائه‌دهنده‌ای که Plugin تعیین کرده است اولویت دارند. ارائه‌دهندگان میزبانی‌شده تصویر Google و OpenRouter از پیش‌فرض ۱۸۰ ثانیه‌ای استفاده می‌کنند؛ تولید تصویر Microsoft Foundry MAI،‏ xAI و Azure OpenAI از ۶۰۰ ثانیه استفاده می‌کند. فراخوانی‌های ابزار پویا در Codex از پیش‌فرض ۱۲۰ ثانیه‌ای پل `image_generate` استفاده می‌کنند و در صورت پیکربندی، همان بودجه زمانی را رعایت می‌کنند؛ این زمان به حداکثر ۶۰۰۰۰۰ میلی‌ثانیه‌ای پل ابزار پویای OpenClaw محدود است.
  </Accordion>
  <Accordion title="Inspect at runtime">
    برای بررسی ارائه‌دهندگان ثبت‌شده فعلی، مدل‌های پیش‌فرض آن‌ها و راهنمای متغیرهای محیطی احراز هویت، از `action: "list"` استفاده کنید.
  </Accordion>
</AccordionGroup>

### ویرایش تصویر

OpenAI،‏ OpenRouter،‏ Google،‏ DeepInfra،‏ fal،‏ Microsoft Foundry،‏ MiniMax،‏ ComfyUI و xAI از ویرایش تصاویر مرجع پشتیبانی می‌کنند. مدل‌های Krea 2 در fal به‌جای ورودی ویرایش، از همان فیلدهای `image` / `images` به‌عنوان مراجع سبک استفاده می‌کنند. مسیر یا نشانی اینترنتی یک تصویر مرجع را ارسال کنید:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI،‏ OpenRouter و Google از طریق پارامتر `images` حداکثر از ۵ تصویر مرجع پشتیبانی می‌کنند؛ xAI حداکثر از ۳ تصویر پشتیبانی می‌کند. fal برای تبدیل تصویر به تصویر Flux از ۱ تصویر مرجع، برای ویرایش‌های GPT Image 2 حداکثر از ۱۰ تصویر، برای Krea 2 حداکثر از ۱۰ مرجع سبک و برای ویرایش‌های Nano Banana 2 حداکثر از ۱۴ تصویر پشتیبانی می‌کند. Microsoft Foundry،‏ MiniMax و ComfyUI از ۱ تصویر پشتیبانی می‌کنند.

## بررسی عمیق ارائه‌دهندگان

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    تولید تصویر OpenAI به‌طور پیش‌فرض از `openai/gpt-image-2` استفاده می‌کند. اگر نمایه OAuth مربوط به `openai` پیکربندی شده باشد، OpenClaw همان نمایه OAuth مورد استفاده مدل‌های گفت‌وگوی اشتراکی Codex را دوباره استفاده می‌کند و درخواست تصویر را از طریق سامانه پشتیبان Codex Responses می‌فرستد. نشانی‌های پایه قدیمی Codex مانند `https://chatgpt.com/backend-api` برای درخواست‌های تصویر به `https://chatgpt.com/backend-api/codex` استانداردسازی می‌شوند. OpenClaw برای آن درخواست **به‌طور ضمنی** به `OPENAI_API_KEY` بازنمی‌گردد — برای اجبار به مسیریابی مستقیم از طریق OpenAI Images API،‏ `models.providers.openai` را به‌طور صریح با کلید API، نشانی پایه سفارشی یا نقطه پایانی Azure پیکربندی کنید.

    مدل‌های `openai/gpt-image-1.5`،‏ `openai/gpt-image-1` و `openai/gpt-image-1-mini` همچنان می‌توانند به‌طور صریح انتخاب شوند. برای خروجی PNG/WebP با پس‌زمینه شفاف از `gpt-image-1.5` استفاده کنید؛ API فعلی `gpt-image-2` مقدار `background: "transparent"` را رد می‌کند.

    `gpt-image-2` از تولید متن‌به‌تصویر و ویرایش تصویر مرجع، هر دو از طریق ابزار یکسان `image_generate`، پشتیبانی می‌کند. OpenClaw مقادیر `prompt`،‏ `count`،‏ `size`،‏ `quality`،‏ `outputFormat` و تصاویر مرجع را به OpenAI ارسال می‌کند. OpenAI مقادیر `aspectRatio` یا `resolution` را مستقیماً دریافت **نمی‌کند**؛ OpenClaw در صورت امکان آن‌ها را به یک `size` پشتیبانی‌شده نگاشت می‌کند، وگرنه ابزار آن‌ها را به‌عنوان بازنویسی‌های نادیده‌گرفته‌شده گزارش می‌دهد.

    گزینه‌های ویژه OpenAI زیر شیء `openai` قرار می‌گیرند:

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

    `openai.background` مقادیر `transparent`،‏ `opaque` یا `auto` را می‌پذیرد؛ خروجی‌های شفاف به `outputFormat` برابر با `png` یا `webp` و یک مدل تصویر OpenAI با قابلیت شفافیت نیاز دارند. OpenClaw درخواست‌های پس‌زمینه شفاف مدل پیش‌فرض `gpt-image-2` را به `gpt-image-1.5` هدایت می‌کند. `openai.outputCompression` برای خروجی‌های JPEG/WebP اعمال می‌شود و در خروجی‌های PNG نادیده گرفته می‌شود.

    راهنمای سطح بالای `background` مستقل از ارائه‌دهنده است و در حال حاضر، هنگام انتخاب ارائه‌دهنده OpenAI، به همان فیلد درخواست `background` در OpenAI نگاشت می‌شود. ارائه‌دهندگانی که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند، به‌جای دریافت پارامتر پشتیبانی‌نشده، آن را در `ignoredOverrides` بازمی‌گردانند.

    برای هدایت تولید تصویر OpenAI از طریق یک استقرار Azure OpenAI به‌جای `api.openai.com`، به [نقاط پایانی Azure OpenAI](/fa/providers/openai#azure-openai-endpoints) مراجعه کنید.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    تولید تصویر Microsoft Foundry از نام‌های استقرار تصویر MAI تحت پیشوند ارائه‌دهنده `microsoft-foundry/` استفاده می‌کند. مدل پیش‌فرضی در سطح ارائه‌دهنده وجود ندارد، زیرا API مربوط به MAI انتظار دارد نام استقرار شما در فیلد `model` قرار گیرد:

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

    این ارائه‌دهنده از API مربوط به MAI در Microsoft Foundry استفاده می‌کند، نه OpenAI Images API:

    - نقطه پایانی تولید: `/mai/v1/images/generations`
    - نقطه پایانی ویرایش: `/mai/v1/images/edits`
    - احراز هویت: `AZURE_OPENAI_API_KEY` / کلید API ارائه‌دهنده، یا Entra ID از طریق `az login`
    - خروجی: یک تصویر PNG
    - اندازه: مقدار پیش‌فرض `1024x1024`؛ عرض و ارتفاع باید هرکدام حداقل ۷۶۸ پیکسل باشند و مجموع پیکسل‌ها نباید از ۱٬۰۴۸٬۵۷۶ بیشتر شود
    - ویرایش‌ها: یک تصویر مرجع PNG یا JPEG، که فقط در استقرارهای `MAI-Image-2.5-Flash` و `MAI-Image-2.5` پشتیبانی می‌شود

    تولید صرفاً مبتنی بر پرامپت می‌تواند با پیکربندی فقط نقطه پایانی Foundry، از یک نام استقرار سفارشی استفاده کند. ویرایش با نام‌های استقرار سفارشی به فراداده راه‌اندازی اولیه/مدل نیاز دارد تا OpenClaw بتواند تأیید کند که استقرار از `MAI-Image-2.5-Flash` یا `MAI-Image-2.5` پشتیبانی می‌شود.

    مدل‌های تصویر فعلی MAI عبارت‌اند از `MAI-Image-2.5-Flash`،‏ `MAI-Image-2.5`،‏ `MAI-Image-2e` و `MAI-Image-2`. برای راه‌اندازی و رفتار مدل گفت‌وگو، به [Plugin مربوط به Microsoft Foundry](/fa/plugins/reference/microsoft-foundry) مراجعه کنید.

  </Accordion>
  <Accordion title="OpenRouter image models">
    تولید تصویر OpenRouter از همان `OPENROUTER_API_KEY` استفاده می‌کند و از طریق API تصویر تکمیل گفت‌وگوی OpenRouter مسیریابی می‌شود. مدل‌های تصویر OpenRouter را با پیشوند `openrouter/` انتخاب کنید:

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

    OpenClaw مقادیر `prompt`،‏ `count`، تصاویر مرجع و راهنماهای سازگار با Gemini برای `aspectRatio` / `resolution` را به OpenRouter ارسال می‌کند. میان‌برهای داخلی فعلی مدل تصویر OpenRouter شامل `google/gemini-3.1-flash-image-preview`،‏ `google/gemini-3-pro-image-preview` و `openai/gpt-5.4-image-2` هستند. برای مشاهده مواردی که Plugin پیکربندی‌شده شما ارائه می‌کند، از `action: "list"` استفاده کنید.

  </Accordion>
  <Accordion title="fal Krea 2">
    مدل‌های Krea 2 در fal به‌جای طرح‌واره عمومی `image_size` که Flux استفاده می‌کند، از طرح‌واره بومی Krea در fal استفاده می‌کنند. OpenClaw موارد زیر را ارسال می‌کند:

    - `aspect_ratio` برای راهنماهای نسبت ابعاد
    - `creativity` با مقدار پیش‌فرض `medium`
    - `image_style_references` هنگامی که `image` یا `images` ارائه شده باشد

    برای تصویرسازی سریع‌تر و پرحالت‌تر، Krea 2 Medium و برای ظاهرهای واقع‌گرایانه و بافت‌دارِ کندتر اما پرجزئیات‌تر، Krea 2 Large را انتخاب کنید:

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

    Krea 2 در حال حاضر در هر درخواست یک تصویر بازمی‌گرداند. برای Krea استفاده از `aspectRatio` ترجیح دارد؛ OpenClaw مقدار `size` را به نزدیک‌ترین نسبت ابعاد پشتیبانی‌شده Krea نگاشت می‌کند و به‌جای حذف `resolution`، آن را برای Krea رد می‌کند. هنگامی که سطح خلاقیت بومی Krea را می‌خواهید، از `fal.creativity` استفاده کنید:

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
  <Accordion title="MiniMax dual-auth">
    تولید تصویر MiniMax از طریق هر دو مسیر احراز هویت همراه MiniMax در دسترس است:

    - `minimax/image-01` برای راه‌اندازی‌های مبتنی بر کلید API
    - `minimax-portal/image-01` برای راه‌اندازی‌های مبتنی بر OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    ارائه‌دهنده همراه xAI برای درخواست‌های صرفاً مبتنی بر پرامپت از `/v1/images/generations` و هنگام وجود `image` یا `images` از `/v1/images/edits` استفاده می‌کند.

    - مدل‌ها: `xai/grok-imagine-image`،‏ `xai/grok-imagine-image-quality`
    - تعداد: حداکثر ۴
    - مراجع: یک `image` یا حداکثر سه `images`
    - نسبت‌های ابعاد: `1:1`،‏ `16:9`،‏ `9:16`،‏ `4:3`،‏ `3:4`،‏ `3:2`،‏ `2:3`،‏ `2:1`،‏ `1:2`،‏ `19.5:9`،‏ `9:19.5`،‏ `20:9`،‏ `9:20`
    - وضوح‌ها: `1K`،‏ `2K`
    - خروجی‌ها: به‌صورت پیوست‌های تصویری مدیریت‌شده توسط OpenClaw بازگردانده می‌شوند

    OpenClaw عمداً گزینه‌های بومی xAI شامل `quality`،‏ `mask`،‏ `user` یا نسبت ابعاد `auto` را تا زمانی که این کنترل‌ها در قرارداد مشترک میان‌ارائه‌دهنده‌ای `image_generate` وجود نداشته باشند، در دسترس قرار نمی‌دهد.

  </Accordion>
</AccordionGroup>

## نمونه‌ها

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
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
  <Tab title="تولید (دو تصویر مربعی)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="ویرایش (یک مرجع)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="ویرایش (چند مرجع)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="مراجع سبک Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

همان پرچم‌های `--output-format`،‏ `--background`،‏ `--quality` و
`--openai-moderation` در `openclaw infer image edit` نیز در دسترس هستند؛
`--openai-background` همچنان به‌عنوان نام مستعار ویژهٔ OpenAI باقی می‌ماند. ارائه‌دهندگان همراه
به‌جز OpenAI در حال حاضر کنترل صریح پس‌زمینه را اعلام نمی‌کنند؛ بنابراین
`background: "transparent"` برای آن‌ها نادیده‌گرفته‌شده گزارش می‌شود.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای عامل موجود
- [ComfyUI](/fa/providers/comfy) - راه‌اندازی گردش‌کار ComfyUI محلی و Comfy Cloud
- [fal](/fa/providers/fal) - راه‌اندازی ارائه‌دهندهٔ تصویر و ویدئوی fal
- [Google (Gemini)](/fa/providers/google) - راه‌اندازی ارائه‌دهندهٔ تصویر Gemini
- [Plugin Microsoft Foundry](/fa/plugins/reference/microsoft-foundry) - راه‌اندازی گفت‌وگوی Microsoft Foundry و تصویر MAI
- [MiniMax](/fa/providers/minimax) - راه‌اندازی ارائه‌دهندهٔ تصویر MiniMax
- [OpenAI](/fa/providers/openai) - راه‌اندازی ارائه‌دهندهٔ OpenAI Images
- [Vydra](/fa/providers/vydra) - راه‌اندازی تصویر، ویدئو و گفتار Vydra
- [xAI](/fa/providers/xai) - راه‌اندازی تصویر، ویدئو، جست‌وجو، اجرای کد و TTS در Grok
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) - پیکربندی `imageGenerationModel`
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و انتقال خودکار هنگام خرابی
