---
read_when:
    - تولید یا ویرایش تصاویر از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید تصویر
    - درک پارامترهای ابزار image_generate
sidebarTitle: Image generation
summary: تولید و ویرایش تصاویر از طریق image_generate در OpenAI، Google، fal، MiniMax، ComfyUI، DeepInfra، OpenRouter، LiteLLM، xAI و Vydra
title: تولید تصویر
x-i18n:
    generated_at: "2026-05-06T09:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

ابزار `image_generate` به agent امکان می‌دهد با استفاده از providerهای پیکربندی‌شده‌ی شما تصویر ایجاد و ویرایش کند. تصاویر تولیدشده به‌صورت خودکار به‌عنوان پیوست‌های رسانه‌ای در پاسخ agent تحویل داده می‌شوند.

<Note>
این ابزار فقط زمانی ظاهر می‌شود که دست‌کم یک provider تولید تصویر در دسترس باشد. اگر `image_generate` را در ابزارهای agent خود نمی‌بینید، `agents.defaults.imageGenerationModel` را پیکربندی کنید، کلید API یک provider را تنظیم کنید، یا با OpenAI Codex OAuth وارد شوید.
</Note>

## شروع سریع

<Steps>
  <Step title="پیکربندی احراز هویت">
    برای دست‌کم یک provider یک کلید API تنظیم کنید (برای مثال `OPENAI_API_KEY`،
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

    Codex OAuth از همان ارجاع مدل `openai/gpt-image-2` استفاده می‌کند. وقتی یک
    پروفایل OAuth با نام `openai-codex` پیکربندی شده باشد، OpenClaw درخواست‌های
    تصویر را به‌جای اینکه ابتدا `OPENAI_API_KEY` را امتحان کند، از طریق همان
    پروفایل OAuth مسیریابی می‌کند. پیکربندی صریح `models.providers.openai`
    (کلید API، نشانی پایه سفارشی/Azure) مسیر مستقیم OpenAI Images API را دوباره
    فعال می‌کند.

  </Step>
  <Step title="درخواست از agent">
    _"Generate an image of a friendly robot mascot."_

    agent به‌صورت خودکار `image_generate` را فراخوانی می‌کند. نیازی به مجازکردن
    ابزار در فهرست مجاز نیست - وقتی provider در دسترس باشد، به‌طور پیش‌فرض فعال است.

  </Step>
</Steps>

<Warning>
برای endpointهای LAN سازگار با OpenAI مانند LocalAI، مقدار سفارشی
`models.providers.openai.baseUrl` را نگه دارید و به‌صورت صریح با
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` آن را فعال کنید. endpointهای
تصویر خصوصی و داخلی به‌طور پیش‌فرض همچنان مسدود می‌مانند.
</Warning>

## مسیرهای رایج

| هدف                                                  | ارجاع مدل                                          | احراز هویت                             |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| تولید تصویر OpenAI با صورت‌حساب API                 | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| تولید تصویر OpenAI با احراز هویت اشتراک Codex       | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP با پس‌زمینه شفاف در OpenAI                 | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` یا OpenAI Codex OAuth |
| تولید تصویر DeepInfra                               | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| تولید تصویر OpenRouter                              | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| تولید تصویر LiteLLM                                 | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| تولید تصویر Google Gemini                           | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`   |

همان ابزار `image_generate` تولید متن‌به‌تصویر و ویرایش با تصویر مرجع را مدیریت می‌کند. برای یک مرجع از `image` و برای چند مرجع از `images` استفاده کنید. راهنمایی‌های خروجی پشتیبانی‌شده توسط provider، مانند `quality`، `outputFormat` و `background`، در صورت دسترس بودن ارسال می‌شوند و وقتی provider از آن‌ها پشتیبانی نکند، به‌عنوان نادیده‌گرفته‌شده گزارش می‌شوند. پشتیبانی همراه برای پس‌زمینه شفاف مخصوص OpenAI است؛ providerهای دیگر ممکن است همچنان alpha در PNG را حفظ کنند، اگر backend آن‌ها آن را تولید کند.

## providerهای پشتیبانی‌شده

| provider   | مدل پیش‌فرض                            | پشتیبانی از ویرایش                 | احراز هویت                                            |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | بله (۱ تصویر، پیکربندی‌شده با workflow) | `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` برای cloud   |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | بله (۱ تصویر)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | بله                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | بله                                | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | بله (تا ۵ تصویر ورودی)             | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | بله (مرجع سوژه)                    | `MINIMAX_API_KEY` یا MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | بله (تا ۴ تصویر)                   | `OPENAI_API_KEY` یا OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | بله (تا ۵ تصویر ورودی)             | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | خیر                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | بله (تا ۵ تصویر)                   | `XAI_API_KEY`                                         |

برای بررسی providerها و مدل‌های در دسترس در زمان اجرا، از `action: "list"` استفاده کنید:

```text
/tool image_generate action=list
```

## قابلیت‌های provider

| قابلیت               | ComfyUI              | DeepInfra | fal                 | Google       | MiniMax             | OpenAI       | Vydra | xAI          |
| --------------------- | -------------------- | --------- | ------------------- | ------------ | ------------------- | ------------ | ----- | ------------ |
| تولید (حداکثر تعداد) | تعریف‌شده با workflow | 4         | 4                   | 4            | 9                   | 4            | 1     | 4            |
| ویرایش / مرجع        | ۱ تصویر (workflow)    | ۱ تصویر   | ۱ تصویر             | تا ۵ تصویر   | ۱ تصویر (مرجع سوژه) | تا ۵ تصویر   | -     | تا ۵ تصویر   |
| کنترل اندازه         | -                    | ✓         | ✓                   | ✓            | -                   | تا 4K        | -     | -            |
| نسبت ابعاد           | -                    | -         | ✓ (فقط تولید)       | ✓            | ✓                   | -            | -     | ✓            |
| وضوح (1K/2K/4K)      | -                    | -         | ✓                   | ✓            | -                   | -            | -     | 1K, 2K       |

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  prompt تولید تصویر. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  برای بررسی providerها و مدل‌های در دسترس در زمان اجرا از `"list"` استفاده کنید.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی provider/model (مثلاً `openai/gpt-image-2`). برای پس‌زمینه‌های شفاف OpenAI از
  `openai/gpt-image-1.5` استفاده کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع برای حالت ویرایش.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع برای حالت ویرایش (تا ۵ مورد در providerهای پشتیبان).
</ParamField>
<ParamField path="size" type="string">
  راهنمای اندازه: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبت ابعاد: `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>راهنمای وضوح.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  راهنمای کیفیت وقتی provider از آن پشتیبانی کند.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  راهنمای قالب خروجی وقتی provider از آن پشتیبانی کند.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  راهنمای پس‌زمینه وقتی provider از آن پشتیبانی کند. برای providerهای دارای قابلیت شفافیت، از `transparent` همراه با
  `outputFormat: "png"` یا `"webp"` استفاده کنید.
</ParamField>
<ParamField path="count" type="number">تعداد تصاویر برای تولید (۱-۴).</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری درخواست provider بر حسب میلی‌ثانیه.</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="openai" type="object">
  راهنمایی‌های مخصوص OpenAI: `background`، `moderation`، `outputCompression` و `user`.
</ParamField>

<Note>
همه providerها از همه پارامترها پشتیبانی نمی‌کنند. وقتی یک provider جایگزین به‌جای گزینه دقیق درخواست‌شده از یک گزینه هندسی نزدیک پشتیبانی کند، OpenClaw پیش از ارسال، درخواست را به نزدیک‌ترین اندازه، نسبت ابعاد یا وضوح پشتیبانی‌شده نگاشت می‌کند. راهنمایی‌های خروجی پشتیبانی‌نشده برای providerهایی که پشتیبانی را اعلام نکرده‌اند حذف می‌شوند و در نتیجه ابزار گزارش می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر ترجمه از مقدار درخواست‌شده به مقدار اعمال‌شده را ثبت می‌کند.
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

### ترتیب انتخاب provider

OpenClaw providerها را به این ترتیب امتحان می‌کند:

1. **پارامتر `model`** از فراخوانی ابزار (اگر agent یکی را مشخص کند).
2. **`imageGenerationModel.primary`** از پیکربندی.
3. **`imageGenerationModel.fallbacks`** به‌ترتیب.
4. **تشخیص خودکار** - فقط پیش‌فرض‌های provider دارای احراز هویت:
   - ابتدا provider پیش‌فرض فعلی؛
   - providerهای باقی‌مانده ثبت‌شده برای تولید تصویر، به‌ترتیب شناسه provider.

اگر provider شکست بخورد (خطای احراز هویت، محدودیت نرخ و غیره)، گزینه پیکربندی‌شده بعدی به‌صورت خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا شامل جزئیات هر تلاش خواهد بود.

<AccordionGroup>
  <Accordion title="بازنویسی‌های مدل در هر فراخوانی دقیق هستند">
    یک بازنویسی `model` در هر فراخوانی فقط همان provider/model را امتحان می‌کند و به primary/fallback پیکربندی‌شده یا providerهای تشخیص‌داده‌شده خودکار ادامه نمی‌دهد.
  </Accordion>
  <Accordion title="تشخیص خودکار از احراز هویت آگاه است">
    پیش‌فرض یک provider فقط زمانی وارد فهرست گزینه‌ها می‌شود که OpenClaw واقعاً بتواند آن provider را احراز هویت کند. برای استفاده فقط از ورودی‌های صریح `model`، `primary` و `fallbacks`، مقدار
    `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.
  </Accordion>
  <Accordion title="مهلت‌های زمانی">
    برای backendهای کند تصویر، `agents.defaults.imageGenerationModel.timeoutMs` را تنظیم کنید. پارامتر ابزار `timeoutMs` در هر فراخوانی، مقدار پیش‌فرض پیکربندی‌شده را بازنویسی می‌کند.
  </Accordion>
  <Accordion title="بررسی در زمان اجرا">
    برای بررسی providerهای ثبت‌شده فعلی، مدل‌های پیش‌فرض آن‌ها و راهنمای env-varهای احراز هویت، از `action: "list"` استفاده کنید.
  </Accordion>
</AccordionGroup>

### ویرایش تصویر

OpenAI، OpenRouter، Google، DeepInfra، fal، MiniMax، ComfyUI و xAI از ویرایش تصاویر مرجع پشتیبانی می‌کنند. یک مسیر یا URL تصویر مرجع ارسال کنید:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI، OpenRouter، Google و xAI از حداکثر ۵ تصویر مرجع از طریق پارامتر `images` پشتیبانی می‌کنند. fal، MiniMax و ComfyUI از ۱ مورد پشتیبانی می‌کنند.

## بررسی‌های عمیق provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    تولید تصویر OpenAI به‌طور پیش‌فرض از `openai/gpt-image-2` استفاده می‌کند. اگر یک پروفایل OAuth برای
    `openai-codex` پیکربندی شده باشد، OpenClaw همان پروفایل
    OAuth استفاده‌شده توسط مدل‌های گفت‌وگوی اشتراکی Codex را دوباره به‌کار می‌گیرد و
    درخواست تصویر را از طریق بک‌اند Codex Responses ارسال می‌کند. URLهای پایه قدیمی Codex
    مانند `https://chatgpt.com/backend-api` برای درخواست‌های تصویر به
    `https://chatgpt.com/backend-api/codex` استانداردسازی می‌شوند. OpenClaw
    برای آن درخواست **بی‌سروصدا** به `OPENAI_API_KEY` بازنمی‌گردد -
    برای اجبار به مسیریابی مستقیم OpenAI Images API،
    `models.providers.openai` را صراحتاً با یک کلید API، URL پایه سفارشی،
    یا نقطه پایانی Azure پیکربندی کنید.

    مدل‌های `openai/gpt-image-1.5`، `openai/gpt-image-1` و
    `openai/gpt-image-1-mini` همچنان می‌توانند صراحتاً انتخاب شوند. برای خروجی
    PNG/WebP با پس‌زمینه شفاف از `gpt-image-1.5` استفاده کنید؛ API فعلی
    `gpt-image-2` مقدار `background: "transparent"` را رد می‌کند.

    `gpt-image-2` هم تولید متن‌به‌تصویر و هم ویرایش با تصویر مرجع را
    از طریق همان ابزار `image_generate` پشتیبانی می‌کند.
    OpenClaw مقدارهای `prompt`، `count`، `size`، `quality`، `outputFormat`
    و تصاویر مرجع را به OpenAI ارسال می‌کند. OpenAI مقدارهای
    `aspectRatio` یا `resolution` را مستقیماً دریافت نمی‌کند؛ هرجا ممکن باشد OpenClaw
    آن‌ها را به یک `size` پشتیبانی‌شده نگاشت می‌کند، وگرنه ابزار آن‌ها را به‌عنوان
    overrides نادیده‌گرفته‌شده گزارش می‌دهد.

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

    `openai.background` مقدارهای `transparent`، `opaque` یا `auto` را می‌پذیرد؛
    خروجی‌های شفاف به `outputFormat` برابر با `png` یا `webp` و یک
    مدل تصویر OpenAI با قابلیت شفافیت نیاز دارند. OpenClaw درخواست‌های پیش‌فرض
    `gpt-image-2` با پس‌زمینه شفاف را به `gpt-image-1.5` مسیریابی می‌کند.
    `openai.outputCompression` روی خروجی‌های JPEG/WebP اعمال می‌شود.

    راهنمای سطح بالای `background` مستقل از provider است و در حال حاضر، وقتی provider
    OpenAI انتخاب شده باشد، به همان فیلد درخواست `background` در OpenAI نگاشت می‌شود.
    providerهایی که پشتیبانی از پس‌زمینه را اعلام نمی‌کنند، به‌جای دریافت پارامتر پشتیبانی‌نشده،
    آن را در `ignoredOverrides` برمی‌گردانند.

    برای مسیریابی تولید تصویر OpenAI از طریق یک استقرار Azure OpenAI
    به‌جای `api.openai.com`، به
    [نقاط پایانی Azure OpenAI](/fa/providers/openai#azure-openai-endpoints) مراجعه کنید.

  </Accordion>
  <Accordion title="OpenRouter image models">
    تولید تصویر OpenRouter از همان `OPENROUTER_API_KEY` استفاده می‌کند و
    از طریق API تصویر تکمیل گفت‌وگوی OpenRouter مسیریابی می‌شود. مدل‌های تصویر
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

    OpenClaw مقدارهای `prompt`، `count`، تصاویر مرجع، و راهنماهای
    `aspectRatio` / `resolution` سازگار با Gemini را به OpenRouter ارسال می‌کند.
    میان‌برهای فعلی داخلی مدل‌های تصویر OpenRouter شامل
    `google/gemini-3.1-flash-image-preview`،
    `google/gemini-3-pro-image-preview` و `openai/gpt-5.4-image-2` هستند. از
    `action: "list"` استفاده کنید تا ببینید Plugin پیکربندی‌شده شما چه چیزهایی را ارائه می‌دهد.

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    تولید تصویر MiniMax از طریق هر دو مسیر احراز هویت MiniMax بسته‌بندی‌شده
    در دسترس است:

    - `minimax/image-01` برای راه‌اندازی‌های مبتنی بر کلید API
    - `minimax-portal/image-01` برای راه‌اندازی‌های مبتنی بر OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    provider بسته‌بندی‌شده xAI برای درخواست‌های فقط‌پرامپت از `/v1/images/generations`
    و وقتی `image` یا `images` وجود داشته باشد از `/v1/images/edits` استفاده می‌کند.

    - مدل‌ها: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
    - تعداد: حداکثر ۴
    - مراجع: یک `image` یا حداکثر پنج `images`
    - نسبت‌های تصویر: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - وضوح‌ها: `1K`، `2K`
    - خروجی‌ها: به‌صورت پیوست‌های تصویر مدیریت‌شده توسط OpenClaw برگردانده می‌شوند

    OpenClaw عمداً گزینه‌های بومی xAI مانند `quality`، `mask`،
    `user` یا نسبت‌های تصویر اضافی فقط‌بومی را تا زمانی که آن کنترل‌ها
    در قرارداد مشترک میان-provider `image_generate` وجود نداشته باشند، ارائه نمی‌کند.

  </Accordion>
</AccordionGroup>

## مثال‌ها

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
</Tabs>

همان پرچم‌های `--output-format` و `--background` روی
`openclaw infer image edit` نیز در دسترس هستند؛ `--openai-background` به‌عنوان
نام مستعار ویژه OpenAI باقی می‌ماند. providerهای بسته‌بندی‌شده غیر از OpenAI
امروز کنترل صریح پس‌زمینه را اعلام نمی‌کنند، بنابراین `background: "transparent"`
برای آن‌ها به‌عنوان نادیده‌گرفته‌شده گزارش می‌شود.

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای عامل در دسترس
- [ComfyUI](/fa/providers/comfy) - راه‌اندازی گردش‌کار محلی ComfyUI و Comfy Cloud
- [fal](/fa/providers/fal) - راه‌اندازی provider تصویر و ویدیوی fal
- [Google (Gemini)](/fa/providers/google) - راه‌اندازی provider تصویر Gemini
- [MiniMax](/fa/providers/minimax) - راه‌اندازی provider تصویر MiniMax
- [OpenAI](/fa/providers/openai) - راه‌اندازی provider OpenAI Images
- [Vydra](/fa/providers/vydra) - راه‌اندازی تصویر، ویدیو و گفتار Vydra
- [xAI](/fa/providers/xai) - راه‌اندازی تصویر، ویدیو، جست‌وجو، اجرای کد و TTS مربوط به Grok
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) - پیکربندی `imageGenerationModel`
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و failover
