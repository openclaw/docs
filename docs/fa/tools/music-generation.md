---
read_when:
    - تولید موسیقی یا صدا از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - درک پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: تولید موسیقی از طریق music_generate در گردش‌کارهای ComfyUI، fal، Google Lyria، MiniMax و OpenRouter
title: تولید موسیقی
x-i18n:
    generated_at: "2026-06-27T19:02:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` به عامل اجازه می‌دهد از طریق قابلیت مشترک تولید موسیقی، با ارائه‌دهندگان پیکربندی‌شده، موسیقی یا صدا بسازد — در حال حاضر ComfyUI، fal، Google، MiniMax و OpenRouter.

برای اجراهای عامل مبتنی بر نشست، OpenClaw تولید موسیقی را به‌عنوان یک وظیفه پس‌زمینه آغاز می‌کند، آن را در دفتر وظایف پیگیری می‌کند، سپس وقتی قطعه آماده شد دوباره عامل را بیدار می‌کند تا عامل بتواند به کاربر اطلاع دهد و صدای نهایی را پیوست کند. عامل تکمیل از حالت معمول پاسخ مرئی نشست پیروی می‌کند: تحویل خودکار پاسخ نهایی وقتی پیکربندی شده باشد، یا `message(action="send")` وقتی نشست به ابزار پیام نیاز دارد. اگر نشست درخواست‌کننده غیرفعال باشد یا بیدارسازی فعال آن شکست بخورد، و هنوز بخشی از صدای تولیدشده در پاسخ تکمیل وجود نداشته باشد، OpenClaw یک جایگزین مستقیم و idempotent را فقط با صدای گمشده ارسال می‌کند.

<Note>
ابزار مشترک داخلی فقط وقتی ظاهر می‌شود که حداقل یک ارائه‌دهنده تولید موسیقی در دسترس باشد. اگر `music_generate` را در ابزارهای عامل خود نمی‌بینید، `agents.defaults.musicGenerationModel` را پیکربندی کنید یا کلید API یک ارائه‌دهنده را تنظیم کنید.
</Note>

## شروع سریع

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        برای حداقل یک ارائه‌دهنده یک کلید API تنظیم کنید — برای مثال
        `GEMINI_API_KEY` یا `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        عامل به‌صورت خودکار `music_generate` را فراخوانی می‌کند. نیازی به فهرست مجاز ابزار نیست.
      </Step>
    </Steps>

    برای زمینه‌های مستقیم همگام بدون اجرای عامل مبتنی بر نشست، ابزار داخلی همچنان به تولید درون‌خطی بازمی‌گردد و مسیر رسانه نهایی را در نتیجه ابزار برمی‌گرداند.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        `plugins.entries.comfy.config.music` را با JSON گردش‌کار و گره‌های پرامپت/خروجی پیکربندی کنید.
      </Step>
      <Step title="Cloud auth (optional)">
        برای Comfy Cloud، `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` را تنظیم کنید.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

نمونه پرامپت‌ها:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده | مدل پیش‌فرض | ورودی‌های مرجع | کنترل‌های پشتیبانی‌شده | احراز هویت |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | تا 1 تصویر    | موسیقی یا صدای تعریف‌شده توسط گردش‌کار                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | هیچ‌کدام             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` یا `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | تا 10 تصویر  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | هیچ‌کدام             | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` یا MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | تا 1 تصویر    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### ماتریس قابلیت‌ها

قرارداد حالت صریح که توسط `music_generate`، آزمون‌های قرارداد، و جاروب زنده مشترک استفاده می‌شود:

| ارائه‌دهنده | `generate` | `edit` | حد ویرایش | مسیرهای زنده مشترک                                                         |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 تصویر    | در جاروب مشترک نیست؛ توسط `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| fal        |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 تصویر  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 تصویر    | `generate`, `edit`                                                        |

از `action: "list"` برای بررسی ارائه‌دهندگان و مدل‌های مشترک موجود در زمان اجرا استفاده کنید:

```text
/tool music_generate action=list
```

از `action: "status"` برای بررسی وظیفه فعال موسیقی مبتنی بر نشست استفاده کنید:

```text
/tool music_generate action=status
```

نمونه تولید مستقیم:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  پرامپت تولید موسیقی. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی ارائه‌دهنده/مدل (مثلا `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  متن شعر اختیاری وقتی ارائه‌دهنده از ورودی صریح شعر پشتیبانی می‌کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  درخواست خروجی فقط سازی وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع (تا 10 مورد در ارائه‌دهندگان پشتیبان).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف به ثانیه وقتی ارائه‌دهنده از راهنمایی مدت پشتیبانی می‌کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای قالب خروجی وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان محدودیت‌های سخت مانند تعداد ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. وقتی یک ارائه‌دهنده از مدت پشتیبانی می‌کند اما حداکثر کوتاه‌تری نسبت به مقدار درخواستی دارد، OpenClaw آن را به نزدیک‌ترین مدت پشتیبانی‌شده محدود می‌کند. راهنمایی‌های اختیاری که واقعا پشتیبانی نمی‌شوند، وقتی ارائه‌دهنده یا مدل انتخاب‌شده نتواند آن‌ها را رعایت کند، با یک هشدار نادیده گرفته می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر نگاشت درخواست‌شده به اعمال‌شده را ثبت می‌کند.
</Note>

مهلت‌های زمانی درخواست ارائه‌دهنده فقط پیکربندی اپراتور هستند. OpenClaw وقتی `agents.defaults.musicGenerationModel.timeoutMs` پیکربندی شده باشد از آن استفاده می‌کند، مقادیر کمتر از 120000ms را به 120000ms افزایش می‌دهد، و در غیر این صورت درخواست‌های ارائه‌دهنده را به‌صورت پیش‌فرض روی 300000ms قرار می‌دهد.

## رفتار ناهمگام

تولید موسیقی مبتنی بر نشست به‌عنوان یک وظیفه پس‌زمینه اجرا می‌شود:

- **وظیفه پس‌زمینه:** `music_generate` یک وظیفه پس‌زمینه ایجاد می‌کند، بلافاصله یک پاسخ شروع‌شده/وظیفه برمی‌گرداند، و قطعه نهایی را بعدا در یک پیام پیگیری عامل ارسال می‌کند.
- **جلوگیری از تکرار:** تا وقتی یک وظیفه `queued` یا `running` است، فراخوانی‌های بعدی `music_generate` در همان نشست به‌جای شروع تولید دیگر، وضعیت وظیفه را برمی‌گردانند. برای بررسی صریح از `action: "status"` استفاده کنید.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>` وضعیت‌های در صف، در حال اجرا، و پایانی را بررسی می‌کند.
- **بیدارسازی تکمیل:** OpenClaw یک رویداد تکمیل داخلی را دوباره به همان نشست تزریق می‌کند تا مدل خودش بتواند پیام پیگیری روبه‌روی کاربر را بنویسد.
- **راهنمایی پرامپت:** نوبت‌های بعدی کاربر/دستی در همان نشست، وقتی یک وظیفه موسیقی از قبل در جریان است، یک راهنمایی کوچک زمان اجرا دریافت می‌کنند تا مدل کورکورانه دوباره `music_generate` را فراخوانی نکند.
- **جایگزین بدون نشست:** زمینه‌های مستقیم/محلی بدون یک نشست واقعی عامل به‌صورت درون‌خطی اجرا می‌شوند و نتیجه صوتی نهایی را در همان نوبت برمی‌گردانند.

### چرخه عمر وظیفه

| وضعیت       | معنی                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | وظیفه ایجاد شده و منتظر است ارائه‌دهنده آن را بپذیرد.                                           |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا 30 ثانیه تا 3 دقیقه، بسته به ارائه‌دهنده و مدت). |
| `succeeded` | قطعه آماده است؛ عامل بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                                 |
| `failed`    | خطای ارائه‌دهنده یا اتمام مهلت؛ عامل با جزئیات خطا بیدار می‌شود.                                 |

وضعیت را از CLI بررسی کنید:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## پیکربندی

### انتخاب مدل

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### ترتیب انتخاب ارائه‌دهنده

OpenClaw ارائه‌دهندگان را به این ترتیب امتحان می‌کند:

1. پارامتر `model` از فراخوانی ابزار (اگر عامل یکی را مشخص کند).
2. `musicGenerationModel.primary` از پیکربندی.
3. `musicGenerationModel.fallbacks` به‌ترتیب.
4. تشخیص خودکار فقط با استفاده از پیش‌فرض‌های ارائه‌دهنده دارای احراز هویت:
   - ابتدا ارائه‌دهنده پیش‌فرض فعلی؛
   - ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید موسیقی به‌ترتیب شناسه ارائه‌دهنده.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌صورت خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا شامل جزئیات هر تلاش است.

برای استفاده فقط از ورودی‌های صریح `model`، `primary` و `fallbacks`، `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## یادداشت‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر گردش‌کار است و به گراف پیکربندی‌شده به‌همراه نگاشت گره‌ها برای فیلدهای پرامپت/خروجی وابسته است. Plugin همراه `comfy` از طریق رجیستری ارائه‌دهنده تولید موسیقی به ابزار مشترک `music_generate` متصل می‌شود.
  </Accordion>
  <Accordion title="fal">
    از endpointهای مدل fal از طریق مسیر احراز هویت ارائه‌دهنده مشترک استفاده می‌کند. ارائه‌دهنده همراه به‌صورت پیش‌فرض از `fal-ai/minimax-music/v2.6` استفاده می‌کند و همچنین `fal-ai/ace-step/prompt-to-audio` و
    `fal-ai/stable-audio-25/text-to-audio` را برای درخواست‌های پرامپت به صدا ارائه می‌دهد.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید دسته‌ای Lyria 3 استفاده می‌کند. جریان همراه فعلی از پرامپت، متن شعر اختیاری، و تصاویر مرجع اختیاری پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از endpoint دسته‌ای `music_generation` استفاده می‌کند. از پرامپت، شعر اختیاری، حالت سازی، و خروجی mp3 از طریق احراز هویت کلید API `minimax` یا OAuth `minimax-portal` پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="OpenRouter">
    از خروجی صوتی تکمیل‌های چت OpenRouter با streaming فعال استفاده می‌کند. ارائه‌دهنده همراه به‌صورت پیش‌فرض از `google/lyria-3-pro-preview` استفاده می‌کند و همچنین
    `openrouter/google/lyria-3-clip-preview` را ارائه می‌دهد.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر درست

- **مبتنی بر ارائه‌دهنده مشترک** وقتی انتخاب مدل، failover ارائه‌دهنده، و جریان داخلی وظیفه/وضعیت ناهمگام را می‌خواهید.
- **مسیر Plugin (ComfyUI)** وقتی به یک گراف گردش‌کار سفارشی یا ارائه‌دهنده‌ای نیاز دارید که بخشی از قابلیت مشترک موسیقی همراه نیست.

اگر در حال اشکال‌زدایی رفتارهای مختص ComfyUI هستید، [ComfyUI](/fa/providers/comfy) را ببینید. اگر در حال اشکال‌زدایی رفتار مشترک ارائه‌دهنده هستید، از [fal](/fa/providers/fal)، [Google (Gemini)](/fa/providers/google)، [MiniMax](/fa/providers/minimax)، یا [OpenRouter](/fa/providers/openrouter) شروع کنید.

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید موسیقی از اعلان‌های صریح حالت پشتیبانی می‌کند:

- `generate` برای تولید فقط بر اساس پرامپت.
- `edit` زمانی که درخواست شامل یک یا چند تصویر مرجع باشد.

پیاده‌سازی‌های جدید ارائه‌دهنده باید بلوک‌های حالت صریح را ترجیح دهند:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

فیلدهای تخت قدیمی مانند `maxInputImages`، `supportsLyrics`، و
`supportsFormat` برای اعلام پشتیبانی از ویرایش **کافی نیستند**. ارائه‌دهندگان
باید `generate` و `edit` را به‌صورت صریح اعلام کنند تا آزمون‌های زنده، آزمون‌های
قرارداد، و ابزار مشترک `music_generate` بتوانند پشتیبانی حالت را به‌صورت
قطعی اعتبارسنجی کنند.

## آزمون‌های زنده

پوشش زنده اختیاری برای ارائه‌دهندگان مشترک همراه:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper مخزن:

```bash
pnpm test:live:media music
```

این فایل زنده به‌صورت پیش‌فرض از متغیرهای محیطی ارائه‌دهنده که از پیش صادر شده‌اند
پیش از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، و زمانی که ارائه‌دهنده
حالت ویرایش را فعال کرده باشد، پوشش هر دو حالت `generate` و `edit` اعلام‌شده را
اجرا می‌کند. پوشش امروز:

- `google`: `generate` به‌علاوه `edit`
- `fal`: فقط `generate`
- `minimax`: فقط `generate`
- `openrouter`: `generate` به‌علاوه `edit`
- `comfy`: پوشش زنده جداگانه Comfy، نه جاروب مشترک ارائه‌دهنده

پوشش زنده اختیاری برای مسیر موسیقی ComfyUI همراه:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زنده Comfy همچنین workflowهای تصویر و ویدئوی comfy را زمانی که آن بخش‌ها
پیکربندی شده باشند پوشش می‌دهد.

## مرتبط

- [وظایف پس‌زمینه](/fa/automation/tasks) — ردیابی وظیفه برای اجراهای جداشده `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و failover
- [نمای کلی ابزارها](/fa/tools)
