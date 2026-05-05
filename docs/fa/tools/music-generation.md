---
read_when:
    - تولید موسیقی یا صوت از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - آشنایی با پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: موسیقی را از طریق music_generate در گردش‌کارهای Google Lyria، MiniMax و ComfyUI تولید کنید
title: تولید موسیقی
x-i18n:
    generated_at: "2026-05-05T01:53:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` به عامل امکان می‌دهد از طریق قابلیت مشترک
تولید موسیقی با ارائه‌دهنده‌های پیکربندی‌شده، موسیقی یا صدا ایجاد کند؛
امروز شامل Google، MiniMax و ComfyUI پیکربندی‌شده با گردش‌کار است.

برای اجراهای عامل مبتنی بر نشست، OpenClaw تولید موسیقی را به‌صورت یک
وظیفه پس‌زمینه شروع می‌کند، آن را در دفتر ثبت وظایف پیگیری می‌کند، سپس
وقتی ترک آماده شد عامل را دوباره بیدار می‌کند تا عامل بتواند به کاربر
اطلاع دهد و صدای نهایی را پیوست کند. در گفت‌وگوهای گروهی/کانالی که از
تحویل قابل‌مشاهده فقط از طریق ابزار پیام استفاده می‌کنند، عامل نتیجه را
از طریق ابزار پیام منتقل می‌کند.

<Note>
ابزار مشترک داخلی فقط وقتی ظاهر می‌شود که حداقل یک ارائه‌دهنده تولید
موسیقی در دسترس باشد. اگر `music_generate` را در ابزارهای عامل خود
نمی‌بینید، `agents.defaults.musicGenerationModel` را پیکربندی کنید یا
یک کلید API ارائه‌دهنده تنظیم کنید.
</Note>

## شروع سریع

<Tabs>
  <Tab title="پشتیبانی‌شده با ارائه‌دهنده مشترک">
    <Steps>
      <Step title="پیکربندی احراز هویت">
        برای حداقل یک ارائه‌دهنده یک کلید API تنظیم کنید؛ برای مثال
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
      <Step title="درخواست از عامل">
        _«یک ترک synthpop پرانرژی درباره رانندگی شبانه در یک شهر نئونی
        تولید کن.»_

        عامل به‌طور خودکار `music_generate` را فراخوانی می‌کند. نیازی به
        قرار دادن ابزار در فهرست مجاز نیست.
      </Step>
    </Steps>

    برای زمینه‌های همگام مستقیم بدون اجرای عامل مبتنی بر نشست، ابزار
    داخلی همچنان به تولید درون‌خطی بازمی‌گردد و مسیر رسانه نهایی را در
    نتیجه ابزار برمی‌گرداند.

  </Tab>
  <Tab title="گردش‌کار ComfyUI">
    <Steps>
      <Step title="پیکربندی گردش‌کار">
        `plugins.entries.comfy.config.music` را با JSON گردش‌کار و
        گره‌های prompt/output پیکربندی کنید.
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

نمونه promptها:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ارائه‌دهنده‌های پشتیبانی‌شده

| ارائه‌دهنده | مدل پیش‌فرض          | ورودی‌های مرجع | کنترل‌های پشتیبانی‌شده                                        | احراز هویت                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | حداکثر ۱ تصویر    | موسیقی یا صدای تعریف‌شده توسط گردش‌کار                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | حداکثر ۱۰ تصویر  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | هیچ‌کدام             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` یا OAuth در MiniMax     |

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که توسط `music_generate`، آزمون‌های قرارداد و پیمایش
زنده مشترک استفاده می‌شود:

| ارائه‌دهنده | `generate` | `edit` | حد ویرایش | مسیرهای زنده مشترک                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | ۱ تصویر    | در پیمایش مشترک نیست؛ توسط `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| Google   |     ✓      |   ✓    | ۱۰ تصویر  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |

برای بررسی ارائه‌دهنده‌ها و مدل‌های مشترک موجود در زمان اجرا، از
`action: "list"` استفاده کنید:

```text
/tool music_generate action=list
```

برای بررسی وظیفه موسیقی فعال مبتنی بر نشست، از `action: "status"` استفاده کنید:

```text
/tool music_generate action=status
```

نمونه تولید مستقیم:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  prompt تولید موسیقی. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه نشست فعلی را برمی‌گرداند؛ `"list"` ارائه‌دهنده‌ها را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی ارائه‌دهنده/مدل (مثلاً `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  شعر اختیاری وقتی ارائه‌دهنده از ورودی صریح شعر پشتیبانی می‌کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  وقتی ارائه‌دهنده پشتیبانی می‌کند، خروجی فقط بی‌کلام درخواست کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع (تا ۱۰ مورد در ارائه‌دهنده‌های پشتیبانی‌کننده).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف بر حسب ثانیه وقتی ارائه‌دهنده از راهنمایی مدت پشتیبانی می‌کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای قالب خروجی وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه. مقدارهای کمتر از 10000ms به 10000ms افزایش داده می‌شوند و در نتیجه ابزار گزارش می‌شوند.</ParamField>

<Note>
همه ارائه‌دهنده‌ها از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان
حدهای سخت مانند تعداد ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. وقتی
ارائه‌دهنده از مدت پشتیبانی می‌کند اما حداکثری کوتاه‌تر از مقدار
درخواست‌شده دارد، OpenClaw آن را به نزدیک‌ترین مدت پشتیبانی‌شده محدود
می‌کند. راهنمایی‌های اختیاری واقعاً پشتیبانی‌نشده، وقتی ارائه‌دهنده یا
مدل انتخاب‌شده نتواند آن‌ها را رعایت کند، با یک هشدار نادیده گرفته
می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛
`details.normalization` هر نگاشت درخواست‌شده‌به‌اعمال‌شده را ثبت می‌کند.
</Note>

## رفتار ناهمگام

تولید موسیقی مبتنی بر نشست به‌صورت یک وظیفه پس‌زمینه اجرا می‌شود:

- **وظیفه پس‌زمینه:** `music_generate` یک وظیفه پس‌زمینه ایجاد می‌کند،
  بلافاصله یک پاسخ شروع‌شده/وظیفه برمی‌گرداند، و ترک نهایی را بعداً در
  یک پیام پیگیری عامل ارسال می‌کند.
- **جلوگیری از تکرار:** تا زمانی که یک وظیفه در حالت `queued` یا
  `running` باشد، فراخوانی‌های بعدی `music_generate` در همان نشست به‌جای
  شروع تولید دیگر، وضعیت وظیفه را برمی‌گردانند. برای بررسی صریح از
  `action: "status"` استفاده کنید.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>`
  وضعیت‌های در صف، در حال اجرا و پایانی را بررسی می‌کند.
- **بیدارسازی پس از تکمیل:** OpenClaw یک رویداد تکمیل داخلی را دوباره به
  همان نشست تزریق می‌کند تا مدل بتواند خودش پیگیری رو به کاربر را بنویسد.
- **راهنمای prompt:** نوبت‌های بعدی کاربر/دستی در همان نشست، وقتی یک
  وظیفه موسیقی از قبل در جریان باشد، یک راهنمای کوچک زمان اجرا دریافت
  می‌کنند تا مدل کورکورانه دوباره `music_generate` را فراخوانی نکند.
- **بازگشت بدون نشست:** زمینه‌های مستقیم/محلی بدون نشست واقعی عامل به‌صورت
  درون‌خطی اجرا می‌شوند و نتیجه صوتی نهایی را در همان نوبت برمی‌گردانند.

### چرخه عمر وظیفه

| وضعیت       | معنا                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش توسط ارائه‌دهنده است.                                           |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولاً ۳۰ ثانیه تا ۳ دقیقه بسته به ارائه‌دهنده و مدت). |
| `succeeded` | ترک آماده است؛ عامل بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                                 |
| `failed`    | خطای ارائه‌دهنده یا پایان مهلت زمانی؛ عامل با جزئیات خطا بیدار می‌شود.                                 |

بررسی وضعیت از CLI:

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

OpenClaw ارائه‌دهنده‌ها را به این ترتیب امتحان می‌کند:

1. پارامتر `model` از فراخوانی ابزار (اگر عامل یکی مشخص کند).
2. `musicGenerationModel.primary` از پیکربندی.
3. `musicGenerationModel.fallbacks` به‌ترتیب.
4. تشخیص خودکار فقط با استفاده از پیش‌فرض‌های ارائه‌دهنده دارای احراز هویت:
   - ابتدا ارائه‌دهنده پیش‌فرض فعلی؛
   - سپس سایر ارائه‌دهنده‌های ثبت‌شده تولید موسیقی به ترتیب provider-id.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌طور خودکار امتحان می‌شود.
اگر همه شکست بخورند، خطا شامل جزئیات هر تلاش خواهد بود.

برای استفاده فقط از ورودی‌های صریح `model`، `primary` و `fallbacks`،
`agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## یادداشت‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر گردش‌کار است و به گراف پیکربندی‌شده به‌همراه نگاشت گره‌ها
    برای فیلدهای prompt/output وابسته است. Plugin همراه `comfy` از طریق
    رجیستری ارائه‌دهنده تولید موسیقی به ابزار مشترک `music_generate` متصل می‌شود.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید دسته‌ای Lyria 3 استفاده می‌کند. جریان همراه فعلی از prompt،
    متن اختیاری شعر و تصاویر مرجع اختیاری پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از نقطه پایانی دسته‌ای `music_generation` استفاده می‌کند. از prompt،
    شعر اختیاری، حالت بی‌کلام، هدایت مدت و خروجی mp3 از طریق احراز هویت
    کلید API با `minimax` یا OAuth با `minimax-portal` پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر درست

- **پشتیبانی‌شده با ارائه‌دهنده مشترک** وقتی انتخاب مدل، جایگزینی خودکار
  ارائه‌دهنده هنگام شکست، و جریان داخلی ناهمگام وظیفه/وضعیت را می‌خواهید.
- **مسیر Plugin (ComfyUI)** وقتی به گراف گردش‌کار سفارشی یا ارائه‌دهنده‌ای
  نیاز دارید که بخشی از قابلیت مشترک موسیقی همراه نیست.

اگر رفتار مختص ComfyUI را اشکال‌زدایی می‌کنید، [ComfyUI](/fa/providers/comfy)
را ببینید. اگر رفتار ارائه‌دهنده مشترک را اشکال‌زدایی می‌کنید، با
[Google (Gemini)](/fa/providers/google) یا [MiniMax](/fa/providers/minimax) شروع کنید.

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید موسیقی از اعلان‌های حالت صریح پشتیبانی می‌کند:

- `generate` برای تولید فقط با prompt.
- `edit` وقتی درخواست شامل یک یا چند تصویر مرجع باشد.

پیاده‌سازی‌های ارائه‌دهنده جدید باید بلوک‌های حالت صریح را ترجیح دهند:

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

فیلدهای تخت قدیمی مانند `maxInputImages`، `supportsLyrics` و
`supportsFormat` برای اعلام پشتیبانی از ویرایش **کافی نیستند**.
ارائه‌دهنده‌ها باید `generate` و `edit` را به‌صراحت اعلام کنند تا
آزمون‌های زنده، آزمون‌های قرارداد و ابزار مشترک `music_generate` بتوانند
پشتیبانی از حالت را به‌صورت قطعی اعتبارسنجی کنند.

## آزمون‌های زنده

پوشش زنده اختیاری برای ارائه‌دهنده‌های همراه مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper مخزن:

```bash
pnpm test:live:media music
```

این فایل زنده env varهای ارائه‌دهنده گمشده را از `~/.profile` بارگذاری
می‌کند، به‌طور پیش‌فرض کلیدهای API زنده/env را بر نمایه‌های احراز هویت
ذخیره‌شده ترجیح می‌دهد، و وقتی ارائه‌دهنده حالت ویرایش را فعال کرده باشد،
هم پوشش `generate` و هم پوشش `edit` اعلام‌شده را اجرا می‌کند. پوشش فعلی:

- `google`: `generate` به‌همراه `edit`
- `minimax`: فقط `generate`
- `comfy`: پوشش زنده جداگانه Comfy، نه پیمایش ارائه‌دهنده مشترک

پوشش زنده اختیاری برای مسیر موسیقی ComfyUI همراه:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زندهٔ Comfy همچنین گردش‌کارهای تصویر و ویدیوی Comfy را وقتی آن بخش‌ها پیکربندی شده باشند پوشش می‌دهد.

## مرتبط

- [وظایف پس‌زمینه](/fa/automation/tasks) — ردیابی وظایف برای اجراهای جداشدهٔ `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و جابه‌جایی خودکار هنگام خطا
- [نمای کلی ابزارها](/fa/tools)
