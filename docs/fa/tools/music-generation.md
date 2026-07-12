---
read_when:
    - تولید موسیقی یا صدا از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - درک پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: تولید موسیقی با استفاده از music_generate در گردش‌های کاری ComfyUI، fal، Google Lyria، MiniMax و OpenRouter
title: تولید موسیقی
x-i18n:
    generated_at: "2026-07-12T10:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` از طریق قابلیت مشترک تولید موسیقی، با پشتیبانی
ComfyUI، fal، Google، MiniMax و OpenRouter، موسیقی یا صدا ایجاد می‌کند.

<Note>
`music_generate` تنها زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده تولید موسیقی
در دسترس باشد: پیکربندی صریح `agents.defaults.musicGenerationModel` یا یک
ارائه‌دهنده با احراز هویت پیکربندی‌شده (برای مثال، کلید API تنظیم‌شده).
</Note>

برای اجرای عامل مبتنی بر نشست، `music_generate` به‌صورت یک وظیفه پس‌زمینه آغاز
می‌شود، پیشرفت را در دفتر وظایف پیگیری می‌کند و سپس، وقتی قطعه آماده شد، عامل
را بیدار می‌کند تا بتواند به کاربر اطلاع دهد و صدای نهایی را پیوست کند. عامل
تکمیل از قرارداد پاسخ قابل‌مشاهده نشست پیروی می‌کند: در صورت پیکربندی، پاسخ
نهایی خودکار؛ یا هنگامی که نشست به ابزار پیام نیاز دارد،
`message(action="send")`. اگر نشست درخواست‌کننده غیرفعال باشد یا بیدارسازی آن
ناموفق شود و صدای تولیدشده همچنان در پاسخ وجود نداشته باشد، OpenClaw یک
جایگزین مستقیم و تکرارپذیر فقط با صدای مفقودشده ارسال می‌کند.

## شروع سریع

<Tabs>
  <Tab title="مبتنی بر ارائه‌دهنده مشترک">
    <Steps>
      <Step title="پیکربندی احراز هویت">
        برای دست‌کم یک ارائه‌دهنده، یک کلید API تنظیم کنید — برای مثال
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
        _«یک قطعه سینث‌پاپ پرنشاط درباره رانندگی شبانه در شهری نئونی تولید کن.»_

        عامل به‌طور خودکار `music_generate` را فراخوانی می‌کند. نیازی به
        افزودن ابزار به فهرست مجاز نیست.
      </Step>
    </Steps>

    بدون اجرای عامل مبتنی بر نشست (در زمینه‌های مستقیم/محلی)، ابزار به‌صورت
    درون‌خطی اجرا می‌شود و مسیر رسانه نهایی را در همان نتیجه ابزار بازمی‌گرداند.

  </Tab>
  <Tab title="گردش‌کار ComfyUI">
    <Steps>
      <Step title="پیکربندی گردش‌کار">
        `plugins.entries.comfy.config.music` را با JSON گردش‌کار و Nodeهای
        ورودی و خروجی پیکربندی کنید.
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

نمونه درخواست‌ها:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

برای بررسی ارائه‌دهندگان/مدل‌های موجود از `action: "list"` و برای بررسی وظیفه
فعال موسیقی مبتنی بر نشست از `action: "status"` استفاده کنید:

```text
/tool music_generate action=list
/tool music_generate action=status
```

نمونه تولید مستقیم:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده | مدل پیش‌فرض                  | ورودی‌های مرجع | کنترل‌های پشتیبانی‌شده                                | احراز هویت                             |
| ------------ | ---------------------------- | -------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI      | `workflow`                   | حداکثر ۱ تصویر | موسیقی یا صدای تعریف‌شده در گردش‌کار                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal          | `fal-ai/minimax-music/v2.6`  | ندارد          | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` یا `FAL_API_KEY`             |
| Google       | `lyria-3-clip-preview`       | حداکثر ۱۰ تصویر | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax      | `music-2.6`                  | ندارد          | `lyrics`, `instrumental`, `format` (فقط mp3)          | `MINIMAX_API_KEY` یا OAuth ‏MiniMax    |
| OpenRouter   | `google/lyria-3-pro-preview` | حداکثر ۱ تصویر | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax دو شناسه ارائه‌دهنده را ثبت می‌کند که مدل‌های یکسانی دارند: `minimax`
برای احراز هویت با کلید API و `minimax-portal` برای OAuth. ارجاع‌های مدل از مسیر
احراز هویت پیروی می‌کنند (`minimax/music-2.6` در برابر
`minimax-portal/music-2.6`)؛ به
[MiniMax](/fa/providers/minimax#music-generation) مراجعه کنید.

fal علاوه بر مدل پیش‌فرض مبتنی بر MiniMax، مدل‌های
`fal-ai/ace-step/prompt-to-audio` (wav، بدون متن ترانه و بدون کلید تغییر حالت
بی‌کلام) و `fal-ai/stable-audio-25/text-to-audio` (wav، فقط درخواست) را نیز
ارائه می‌دهد. مدل پیش‌فرض Google یعنی `lyria-3-clip-preview` فقط mp3 خروجی
می‌دهد؛ `lyria-3-pro-preview` از wav نیز پشتیبانی می‌کند. MiniMax همچنین
`music-2.6-free`، `music-cover` و `music-cover-free` را ارائه می‌دهد.
OpenRouter نیز `google/lyria-3-clip-preview` را ارائه می‌دهد.

### ماتریس قابلیت‌ها

قرارداد صریح حالت که `music_generate`، آزمون‌های قرارداد و پیمایش زنده مشترک
از آن استفاده می‌کنند:

| ارائه‌دهنده | `generate` | `edit` | محدودیت ویرایش | مسیرهای زنده مشترک                                                       |
| ------------ | :--------: | :----: | -------------- | ------------------------------------------------------------------------- |
| ComfyUI      |     ✓      |   ✓    | ۱ تصویر        | در پیمایش مشترک نیست؛ توسط `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| fal          |     ✓      |   —    | ندارد          | `generate`                                                                |
| Google       |     ✓      |   ✓    | ۱۰ تصویر       | `generate`، `edit`                                                        |
| MiniMax      |     ✓      |   —    | ندارد          | `generate`                                                                |
| OpenRouter   |     ✓      |   ✓    | ۱ تصویر        | `generate`، `edit`                                                        |

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  درخواست تولید موسیقی. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفه فعلی نشست را بازمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  جایگزینی ارائه‌دهنده/مدل (برای مثال `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  متن ترانه اختیاری، هنگامی که ارائه‌دهنده از ورودی صریح متن ترانه پشتیبانی کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  درخواست خروجی فقط بی‌کلام، هنگامی که ارائه‌دهنده از آن پشتیبانی کند.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا نشانی وب یک تصویر مرجع.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع (در ارائه‌دهندگان پشتیبان، حداکثر ۱۰ تصویر).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف برحسب ثانیه، هنگامی که ارائه‌دهنده از راهنمای مدت پشتیبانی کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای قالب خروجی، هنگامی که ارائه‌دهنده از آن پشتیبانی کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان محدودیت‌های
سخت، مانند تعداد ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. هنگامی که
ارائه‌دهنده از مدت پشتیبانی می‌کند اما حداکثر کوتاه‌تری نسبت به مقدار
درخواست‌شده دارد، OpenClaw آن را به نزدیک‌ترین مدت پشتیبانی‌شده محدود می‌کند.
راهنماهای اختیاری واقعاً پشتیبانی‌نشده، هنگامی که ارائه‌دهنده یا مدل انتخاب‌شده
نتواند آن‌ها را رعایت کند، همراه با یک هشدار نادیده گرفته می‌شوند. نتایج ابزار
تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هرگونه نگاشت مقدار
درخواست‌شده به مقدار اعمال‌شده را ثبت می‌کند.
</Note>

مهلت زمانی درخواست ارائه‌دهنده فقط در پیکربندی اپراتور تعیین می‌شود. OpenClaw
در صورت پیکربندی از `agents.defaults.musicGenerationModel.timeoutMs` استفاده
می‌کند، مقادیر کمتر از 120000ms را به 120000ms افزایش می‌دهد و در غیر این صورت،
مهلت پیش‌فرض درخواست‌های ارائه‌دهنده را 300000ms قرار می‌دهد.

## رفتار ناهمگام

تولید موسیقی مبتنی بر نشست به‌صورت یک وظیفه پس‌زمینه اجرا می‌شود:

- **وظیفه پس‌زمینه:** `music_generate` یک وظیفه پس‌زمینه ایجاد می‌کند، پاسخ
  آغازشده/وظیفه را بی‌درنگ بازمی‌گرداند و قطعه نهایی را بعداً در یک پیام پیگیری
  عامل ارسال می‌کند.
- **جلوگیری از تکرار:** تا زمانی که وظیفه‌ای در حالت `queued` یا `running`
  باشد، فراخوانی‌های بعدی `music_generate` در همان نشست، به‌جای آغاز تولیدی
  دیگر، وضعیت وظیفه را بازمی‌گردانند. برای بررسی صریح از `action: "status"`
  استفاده کنید. درخواست منطبق و به‌تازگی تکمیل‌شده نیز تا ۲ دقیقه تکرارزدایی
  می‌شود.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>`
  وضعیت‌های در صف، در حال اجرا و پایانی را بررسی می‌کند.
- **بیدارسازی پس از تکمیل:** OpenClaw یک رویداد تکمیل داخلی را دوباره به همان
  نشست تزریق می‌کند تا مدل بتواند خودش پیام پیگیری قابل‌مشاهده برای کاربر را
  بنویسد.
- **راهنمای درخواست:** نوبت‌های بعدی کاربر/دستی در همان نشست، هنگامی که وظیفه
  موسیقی از قبل در حال اجراست، یک راهنمای کوچک زمان اجرا دریافت می‌کنند تا مدل
  دوباره کورکورانه `music_generate` را فراخوانی نکند.
- **جایگزین بدون نشست:** زمینه‌های مستقیم/محلی بدون نشست واقعی عامل، به‌صورت
  درون‌خطی اجرا می‌شوند و نتیجه نهایی صدا را در همان نوبت بازمی‌گردانند.

### چرخه حیات وظیفه

وظیفه موسیقی همان حالت‌های رجیستری عمومی وظایف را ارائه می‌کند (برای ماشین
حالت کامل، شامل `timed_out`، `cancelled` و `lost`، به
[وظایف پس‌زمینه](/fa/automation/tasks#task-lifecycle) مراجعه کنید). بیشتر اجراهای
موسیقی از حالت‌های زیر عبور می‌کنند:

| حالت        | معنا                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | وظیفه ایجاد شده و منتظر پذیرش از سوی ارائه‌دهنده است.                                         |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولاً ۳۰ ثانیه تا ۳ دقیقه، بسته به ارائه‌دهنده و مدت).       |
| `succeeded` | قطعه آماده است؛ عامل بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                            |
| `failed`    | خطا یا پایان مهلت ارائه‌دهنده؛ عامل با جزئیات خطا بیدار می‌شود.                               |

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

1. پارامتر `model` از فراخوانی ابزار (اگر عامل آن را مشخص کند).
2. `musicGenerationModel.primary` از پیکربندی.
3. ورودی‌های `musicGenerationModel.fallbacks` به‌ترتیب.
4. تشخیص خودکار، فقط با استفاده از پیش‌فرض‌های ارائه‌دهنده مبتنی بر احراز هویت:
   - ابتدا ارائه‌دهنده فعلی مدل متنی، اگر تولید موسیقی را نیز ارائه دهد؛
   - سپس سایر ارائه‌دهندگان ثبت‌شده تولید موسیقی، به‌ترتیب الفبایی شناسه
     ارائه‌دهنده.

اگر ارائه‌دهنده‌ای ناموفق باشد، نامزد بعدی به‌طور خودکار امتحان می‌شود. اگر همه
ناموفق باشند، خطا جزئیات هر تلاش را شامل می‌شود.

برای استفاده صرفاً از ورودی‌های صریح `model`، `primary` و `fallbacks`،
`agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## نکات ارائه‌دهندگان

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر گردش‌کار است و به گراف پیکربندی‌شده و همچنین نگاشت Nodeها
    برای فیلدهای ورودی و خروجی بستگی دارد. Plugin همراه `comfy` از طریق
    رجیستری ارائه‌دهندگان تولید موسیقی به ابزار مشترک `music_generate`
    متصل می‌شود.
  </Accordion>
  <Accordion title="fal">
    از نقاط پایانی مدل fal از طریق مسیر مشترک احراز هویت ارائه‌دهنده استفاده
    می‌کند. ارائه‌دهنده همراه به‌طور پیش‌فرض از `fal-ai/minimax-music/v2.6`
    استفاده می‌کند و برای درخواست‌های تبدیل پرامپت به صدا،
    `fal-ai/ace-step/prompt-to-audio` و
    `fal-ai/stable-audio-25/text-to-audio` را نیز ارائه می‌دهد.
    حالت اشعار و بی‌کلام فقط مخصوص مدل MiniMax است؛ دو مدل دیگر
    فقط از پرامپت پشتیبانی می‌کنند.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید دسته‌ای Lyria 3 استفاده می‌کند. جریان همراه فعلی از
    پرامپت، متن اختیاری اشعار و تصاویر مرجع اختیاری پشتیبانی می‌کند.
    مدل پیش‌فرض `lyria-3-clip-preview` فقط خروجی mp3 تولید می‌کند؛ مدل
    `lyria-3-pro-preview` از wav نیز پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از نقطه پایانی دسته‌ای `music_generation` استفاده می‌کند. از پرامپت،
    اشعار اختیاری، حالت بی‌کلام و خروجی mp3 از طریق احراز هویت کلید API
    با `minimax` یا OAuth با `minimax-portal` پشتیبانی می‌کند. همچنین مدل‌های
    `music-2.6-free`، `music-cover` و `music-cover-free` را ارائه می‌دهد.
  </Accordion>
  <Accordion title="OpenRouter">
    از خروجی صوتی تکمیل‌های گفت‌وگوی OpenRouter با پخش جریانی فعال استفاده
    می‌کند. ارائه‌دهنده همراه به‌طور پیش‌فرض از
    `google/lyria-3-pro-preview` استفاده می‌کند و
    `openrouter/google/lyria-3-clip-preview` را نیز ارائه می‌دهد.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر مناسب

- **مبتنی بر ارائه‌دهنده مشترک** هنگامی که انتخاب مدل، جایگزینی خودکار
  ارائه‌دهنده و جریان داخلی ناهمگام وظیفه/وضعیت را می‌خواهید.
- **مسیر Plugin ‏(ComfyUI)** هنگامی که به یک گراف گردش‌کار سفارشی یا
  ارائه‌دهنده‌ای نیاز دارید که بخشی از قابلیت مشترک و همراه موسیقی نیست.

اگر در حال اشکال‌زدایی رفتار مختص ComfyUI هستید، به
[ComfyUI](/fa/providers/comfy) مراجعه کنید. اگر در حال اشکال‌زدایی رفتار
ارائه‌دهنده مشترک هستید، با [fal](/fa/providers/fal)،
[Google (Gemini)](/fa/providers/google)، [MiniMax](/fa/providers/minimax) یا
[OpenRouter](/fa/providers/openrouter) شروع کنید.

## حالت‌های قابلیت ارائه‌دهنده

قرارداد مشترک تولید موسیقی از اعلان صریح حالت‌ها پشتیبانی می‌کند:

- `generate` برای تولید صرفاً بر اساس پرامپت.
- `edit` هنگامی که درخواست شامل یک یا چند تصویر مرجع است.

پیاده‌سازی‌های جدید ارائه‌دهنده باید بلوک‌های صریح حالت را ترجیح دهند:

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
`supportsFormat` برای اعلام پشتیبانی از ویرایش **کافی نیستند**. ارائه‌دهندگان
باید `generate` و `edit` را صریحاً اعلام کنند تا آزمون‌های زنده، آزمون‌های
قرارداد و ابزار مشترک `music_generate` بتوانند پشتیبانی از حالت‌ها را
به‌صورت قطعی اعتبارسنجی کنند.

## آزمون‌های زنده

پوشش زنده اختیاری برای ارائه‌دهندگان مشترک همراه (fal، Google، MiniMax،
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

پوشش‌دهنده معادل مخزن که همان فایل آزمون را اجرا می‌کند:

```bash
pnpm test:live:media:music
```

این فایل زنده به‌طور پیش‌فرض از متغیرهای محیطی ازپیش‌صادرشده ارائه‌دهنده،
پیش از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند و هنگامی که
ارائه‌دهنده حالت ویرایش را فعال کرده باشد، پوشش `generate` و `edit`
اعلام‌شده را اجرا می‌کند. پوشش فعلی:

- `google`: ‏`generate` به‌همراه `edit`
- `fal`: فقط `generate`
- `minimax`: فقط `generate`
- `openrouter`: ‏`generate` به‌همراه `edit`
- `comfy`: پوشش زنده جداگانه Comfy، نه پیمایش مشترک ارائه‌دهندگان

پوشش زنده اختیاری برای مسیر همراه موسیقی ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زنده Comfy هنگامی که بخش‌های مربوطه پیکربندی شده باشند، گردش‌کارهای
تصویر و ویدیوی comfy را نیز پوشش می‌دهد.

## مرتبط

- [وظایف پس‌زمینه](/fa/automation/tasks) — ردیابی وظیفه برای اجراهای جداشده `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و جایگزینی خودکار
- [نمای کلی ابزارها](/fa/tools)
