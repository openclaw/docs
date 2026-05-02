---
read_when:
    - تولید موسیقی یا صدا از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - درک پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: موسیقی را از طریق music_generate در گردش‌کارهای Google Lyria، MiniMax و ComfyUI تولید کنید
title: تولید موسیقی
x-i18n:
    generated_at: "2026-05-02T12:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` به عامل اجازه می‌دهد از طریق قابلیت مشترک تولید موسیقی با ارائه‌دهندگان پیکربندی‌شده، موسیقی یا صدا بسازد — در حال حاضر Google، MiniMax، و ComfyUI پیکربندی‌شده با گردش‌کار.

برای اجراهای عاملِ پشتیبانی‌شده با نشست، OpenClaw تولید موسیقی را به‌عنوان یک وظیفه پس‌زمینه شروع می‌کند، آن را در دفتر وظایف پیگیری می‌کند، سپس وقتی قطعه آماده شد عامل را دوباره بیدار می‌کند تا عامل بتواند صدای نهایی را به کانال اصلی برگرداند.

<Note>
ابزار مشترک داخلی فقط وقتی ظاهر می‌شود که حداقل یک ارائه‌دهنده تولید موسیقی در دسترس باشد. اگر `music_generate` را در ابزارهای عامل خود نمی‌بینید، `agents.defaults.musicGenerationModel` را پیکربندی کنید یا کلید API یک ارائه‌دهنده را تنظیم کنید.
</Note>

## شروع سریع

<Tabs>
  <Tab title="پشتیبانی‌شده با ارائه‌دهنده مشترک">
    <Steps>
      <Step title="پیکربندی احراز هویت">
        برای حداقل یک ارائه‌دهنده یک کلید API تنظیم کنید — برای نمونه
        `GEMINI_API_KEY` یا `MINIMAX_API_KEY`.
      </Step>
      <Step title="انتخاب مدل پیش‌فرض (اختیاری)">
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
      <Step title="از عامل درخواست کنید">
        _"یک قطعه سینث‌پاپ پرانرژی درباره رانندگی شبانه در یک شهر نئونی بساز."_

        عامل به‌صورت خودکار `music_generate` را فراخوانی می‌کند. نیازی به فهرست مجاز ابزار نیست.
      </Step>
    </Steps>

    برای زمینه‌های همگام مستقیم بدون اجرای عاملِ پشتیبانی‌شده با نشست، ابزار داخلی همچنان به تولید درون‌خطی بازمی‌گردد و مسیر رسانه نهایی را در نتیجه ابزار برمی‌گرداند.

  </Tab>
  <Tab title="گردش‌کار ComfyUI">
    <Steps>
      <Step title="پیکربندی گردش‌کار">
        `plugins.entries.comfy.config.music` را با JSON گردش‌کار و گره‌های اعلان/خروجی پیکربندی کنید.
      </Step>
      <Step title="احراز هویت ابری (اختیاری)">
        برای Comfy Cloud، `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` را تنظیم کنید.
      </Step>
      <Step title="فراخوانی ابزار">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

نمونه اعلان‌ها:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده | مدل پیش‌فرض          | ورودی‌های مرجع | کنترل‌های پشتیبانی‌شده                                        | احراز هویت                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | تا 1 تصویر    | موسیقی یا صدای تعریف‌شده با گردش‌کار                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | تا 10 تصویر  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | هیچ‌کدام             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` یا MiniMax OAuth     |

### ماتریس قابلیت

قرارداد حالت صریحی که `music_generate`، آزمون‌های قرارداد، و پیمایش زنده مشترک استفاده می‌کنند:

| ارائه‌دهنده | `generate` | `edit` | محدودیت ویرایش | مسیرهای زنده مشترک                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 تصویر    | در پیمایش مشترک نیست؛ با `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| Google   |     ✓      |   ✓    | 10 تصویر  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |

برای بررسی ارائه‌دهندگان و مدل‌های مشترک در دسترس در زمان اجرا، از `action: "list"` استفاده کنید:

```text
/tool music_generate action=list
```

برای بررسی وظیفه موسیقی فعالِ پشتیبانی‌شده با نشست، از `action: "status"` استفاده کنید:

```text
/tool music_generate action=status
```

نمونه تولید مستقیم:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  اعلان تولید موسیقی. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه نشست فعلی را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی ارائه‌دهنده/مدل (مانند `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  متن ترانه اختیاری وقتی ارائه‌دهنده از ورودی صریح متن ترانه پشتیبانی می‌کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  وقتی ارائه‌دهنده پشتیبانی می‌کند، خروجی فقط‌سازی را درخواست کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع (تا 10 تصویر در ارائه‌دهندگان پشتیبان).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت زمان هدف بر حسب ثانیه وقتی ارائه‌دهنده از راهنمای مدت زمان پشتیبانی می‌کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای قالب خروجی وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه. مقدارهای کمتر از 10000ms به 10000ms افزایش داده می‌شوند و در نتیجه ابزار گزارش می‌شوند.</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان محدودیت‌های سخت مانند شمار ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. وقتی ارائه‌دهنده از مدت زمان پشتیبانی می‌کند اما بیشینه‌ای کوتاه‌تر از مقدار درخواستی دارد، OpenClaw مقدار را به نزدیک‌ترین مدت زمان پشتیبانی‌شده محدود می‌کند. راهنمایی‌های اختیاری واقعا پشتیبانی‌نشده، وقتی ارائه‌دهنده یا مدل انتخاب‌شده نتواند آن‌ها را رعایت کند، با یک هشدار نادیده گرفته می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر نگاشت از درخواستی به اعمال‌شده را ثبت می‌کند.
</Note>

## رفتار ناهمگام

تولید موسیقی پشتیبانی‌شده با نشست به‌عنوان یک وظیفه پس‌زمینه اجرا می‌شود:

- **وظیفه پس‌زمینه:** `music_generate` یک وظیفه پس‌زمینه ایجاد می‌کند، بلافاصله یک پاسخ شروع‌شده/وظیفه برمی‌گرداند، و قطعه نهایی را بعدا در یک پیام پیگیری عامل ارسال می‌کند.
- **پیشگیری از تکرار:** وقتی یک وظیفه `queued` یا `running` است، فراخوانی‌های بعدی `music_generate` در همان نشست به‌جای شروع یک تولید دیگر، وضعیت وظیفه را برمی‌گردانند. برای بررسی صریح از `action: "status"` استفاده کنید.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>` وضعیت‌های در صف، در حال اجرا، و پایانی را بررسی می‌کند.
- **بیدارسازی تکمیل:** OpenClaw یک رویداد تکمیل داخلی را به همان نشست تزریق می‌کند تا مدل بتواند خودش پیام پیگیری کاربرمحور را بنویسد.
- **راهنمای اعلان:** نوبت‌های کاربر/دستی بعدی در همان نشست، وقتی یک وظیفه موسیقی از قبل در جریان است، یک راهنمای کوچک زمان اجرا دریافت می‌کنند تا مدل کورکورانه دوباره `music_generate` را فراخوانی نکند.
- **بازگشت بدون نشست:** زمینه‌های مستقیم/محلی بدون نشست واقعی عامل، درون‌خطی اجرا می‌شوند و نتیجه صدای نهایی را در همان نوبت برمی‌گردانند.

### چرخه عمر وظیفه

| وضعیت       | معنی                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش از سوی ارائه‌دهنده است.                                           |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا 30 ثانیه تا 3 دقیقه بسته به ارائه‌دهنده و مدت زمان). |
| `succeeded` | قطعه آماده است؛ عامل بیدار می‌شود و آن را به گفت‌وگو ارسال می‌کند.                                 |
| `failed`    | خطای ارائه‌دهنده یا اتمام مهلت زمانی؛ عامل با جزئیات خطا بیدار می‌شود.                                 |

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
        fallbacks: ["minimax/music-2.6"],
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
   - سپس سایر ارائه‌دهندگان ثبت‌شده تولید موسیقی به‌ترتیب شناسه ارائه‌دهنده.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌صورت خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا شامل جزئیات هر تلاش خواهد بود.

برای استفاده فقط از ورودی‌های صریح `model`، `primary`، و `fallbacks`، `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## یادداشت‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر گردش‌کار است و به گراف پیکربندی‌شده به‌همراه نگاشت گره‌ها برای فیلدهای اعلان/خروجی وابسته است. Plugin داخلی `comfy` از طریق رجیستری ارائه‌دهنده تولید موسیقی به ابزار مشترک `music_generate` متصل می‌شود.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید دسته‌ای Lyria 3 استفاده می‌کند. جریان داخلی فعلی از اعلان، متن ترانه اختیاری، و تصاویر مرجع اختیاری پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از endpoint دسته‌ای `music_generation` استفاده می‌کند. از اعلان، متن ترانه اختیاری، حالت سازی، هدایت مدت زمان، و خروجی mp3 از طریق احراز هویت کلید API با `minimax` یا OAuth با `minimax-portal` پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر مناسب

- **پشتیبانی‌شده با ارائه‌دهنده مشترک** وقتی انتخاب مدل، جایگزینی ارائه‌دهنده در صورت شکست، و جریان داخلی ناهمگام وظیفه/وضعیت را می‌خواهید.
- **مسیر Plugin (ComfyUI)** وقتی به یک گراف گردش‌کار سفارشی یا ارائه‌دهنده‌ای نیاز دارید که بخشی از قابلیت موسیقی مشترک داخلی نیست.

اگر در حال اشکال‌زدایی رفتار ویژه ComfyUI هستید، [ComfyUI](/fa/providers/comfy) را ببینید. اگر در حال اشکال‌زدایی رفتار ارائه‌دهنده مشترک هستید، از [Google (Gemini)](/fa/providers/google) یا [MiniMax](/fa/providers/minimax) شروع کنید.

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید موسیقی از اعلان‌های حالت صریح پشتیبانی می‌کند:

- `generate` برای تولید فقط با اعلان.
- `edit` وقتی درخواست شامل یک یا چند تصویر مرجع است.

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

فیلدهای تخت قدیمی مانند `maxInputImages`، `supportsLyrics`، و `supportsFormat` برای اعلام پشتیبانی ویرایش **کافی نیستند**. ارائه‌دهندگان باید `generate` و `edit` را صریح اعلام کنند تا آزمون‌های زنده، آزمون‌های قرارداد، و ابزار مشترک `music_generate` بتوانند پشتیبانی حالت را به‌صورت قطعی اعتبارسنجی کنند.

## آزمون‌های زنده

پوشش زنده اختیاری برای ارائه‌دهندگان داخلی مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

پوشش repo:

```bash
pnpm test:live:media music
```

این فایل زنده متغیرهای محیطی ارائه‌دهنده مفقود را از `~/.profile` بارگذاری می‌کند، به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را بر پروفایل‌های احراز هویت ذخیره‌شده ترجیح می‌دهد، و وقتی ارائه‌دهنده حالت ویرایش را فعال می‌کند، هم پوشش `generate` و هم پوشش اعلام‌شده `edit` را اجرا می‌کند. پوشش امروز:

- `google`: `generate` به‌همراه `edit`
- `minimax`: فقط `generate`
- `comfy`: پوشش زنده جداگانه Comfy، نه پیمایش ارائه‌دهنده مشترک

پوشش زنده اختیاری برای مسیر موسیقی داخلی ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زندهٔ Comfy همچنین گردش‌کارهای تصویر و ویدئوی Comfy را پوشش می‌دهد، وقتی آن
بخش‌ها پیکربندی شده باشند.

## مرتبط

- [کارهای پس‌زمینه](/fa/automation/tasks) — رهگیری کار برای اجراهای جداشدهٔ `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و جابه‌جایی هنگام خرابی
- [نمای کلی ابزارها](/fa/tools)
