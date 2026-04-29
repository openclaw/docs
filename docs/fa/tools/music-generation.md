---
read_when:
    - تولید موسیقی یا صوت از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - آشنایی با پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: تولید موسیقی از طریق music_generate در گردش‌کارهای Google Lyria، MiniMax و ComfyUI
title: تولید موسیقی
x-i18n:
    generated_at: "2026-04-29T23:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` به عامل امکان می‌دهد از طریق قابلیت مشترک تولید موسیقی با ارائه‌دهندگان پیکربندی‌شده، موسیقی یا صدا بسازد؛ در حال حاضر Google، MiniMax، و ComfyUI پیکربندی‌شده با گردش‌کار.

برای اجراهای عامل مبتنی بر جلسه، OpenClaw تولید موسیقی را به‌عنوان یک وظیفهٔ پس‌زمینه آغاز می‌کند، آن را در دفتر ثبت وظایف پیگیری می‌کند، سپس وقتی قطعه آماده شد دوباره عامل را بیدار می‌کند تا عامل بتواند صدای نهایی را به کانال اصلی ارسال کند.

<Note>
ابزار مشترک داخلی فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهندهٔ تولید موسیقی در دسترس باشد. اگر `music_generate` را در ابزارهای عامل خود نمی‌بینید، `agents.defaults.musicGenerationModel` را پیکربندی کنید یا یک کلید API ارائه‌دهنده تنظیم کنید.
</Note>

## شروع سریع

<Tabs>
  <Tab title="با پشتوانهٔ ارائه‌دهندهٔ مشترک">
    <Steps>
      <Step title="پیکربندی احراز هویت">
        برای دست‌کم یک ارائه‌دهنده، یک کلید API تنظیم کنید؛ برای نمونه
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
        _"یک قطعهٔ synthpop پرانرژی دربارهٔ رانندگی شبانه در یک شهر
        نئونی بساز."_

        عامل به‌طور خودکار `music_generate` را فراخوانی می‌کند. نیازی به
        فهرست مجاز ابزار نیست.
      </Step>
    </Steps>

    برای زمینه‌های همگام مستقیم بدون اجرای عامل مبتنی بر جلسه،
    ابزار داخلی همچنان به تولید درون‌خطی برمی‌گردد و مسیر رسانهٔ نهایی
    را در نتیجهٔ ابزار بازمی‌گرداند.

  </Tab>
  <Tab title="گردش‌کار ComfyUI">
    <Steps>
      <Step title="پیکربندی گردش‌کار">
        `plugins.entries.comfy.config.music` را با JSON گردش‌کار
        و گره‌های اعلان/خروجی پیکربندی کنید.
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
| ComfyUI  | `workflow`             | تا 1 تصویر    | موسیقی یا صدای تعریف‌شده توسط گردش‌کار                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | تا 10 تصویر  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | هیچ‌کدام             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` یا MiniMax OAuth     |

### ماتریس قابلیت‌ها

قرارداد حالت صریحی که `music_generate`، آزمون‌های قرارداد، و پیمایش زندهٔ مشترک استفاده می‌کنند:

| ارائه‌دهنده | `generate` | `edit` | محدودیت ویرایش | مسیرهای زندهٔ مشترک                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 تصویر    | در پیمایش مشترک نیست؛ با `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| Google   |     ✓      |   ✓    | 10 تصویر  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |

برای بررسی ارائه‌دهندگان و مدل‌های مشترک موجود در زمان اجرا، از `action: "list"` استفاده کنید:

```text
/tool music_generate action=list
```

برای بررسی وظیفهٔ موسیقی فعال مبتنی بر جلسه، از `action: "status"` استفاده کنید:

```text
/tool music_generate action=status
```

نمونهٔ تولید مستقیم:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## پارامترهای ابزار

<ParamField path="prompt" type="string" required>
  اعلان تولید موسیقی. برای `action: "generate"` الزامی است.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` وظیفهٔ فعلی جلسه را بازمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی ارائه‌دهنده/مدل (مانند `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  متن ترانهٔ اختیاری، وقتی ارائه‌دهنده از ورودی صریح متن ترانه پشتیبانی می‌کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  وقتی ارائه‌دهنده پشتیبانی می‌کند، خروجی فقط بی‌کلام درخواست کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع واحد.
</ParamField>
<ParamField path="images" type="string[]">
  چندین تصویر مرجع (تا 10 مورد در ارائه‌دهندگان پشتیبانی‌کننده).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف بر حسب ثانیه، وقتی ارائه‌دهنده از راهنمایی‌های مدت پشتیبانی می‌کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای قالب خروجی، وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">مهلت زمانی اختیاری درخواست ارائه‌دهنده بر حسب میلی‌ثانیه.</ParamField>

<Note>
همهٔ ارائه‌دهندگان از همهٔ پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان محدودیت‌های سخت مانند تعداد ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. وقتی ارائه‌دهنده‌ای از مدت پشتیبانی می‌کند اما حداکثر کوتاه‌تری از مقدار درخواست‌شده دارد، OpenClaw آن را به نزدیک‌ترین مدت پشتیبانی‌شده محدود می‌کند. راهنمایی‌های اختیاری واقعاً پشتیبانی‌نشده، وقتی ارائه‌دهنده یا مدل انتخاب‌شده نتواند آن‌ها را رعایت کند، با یک هشدار نادیده گرفته می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization`
هر نگاشتِ درخواست‌شده به اعمال‌شده را ثبت می‌کند.
</Note>

## رفتار ناهمگام

تولید موسیقی مبتنی بر جلسه به‌عنوان یک وظیفهٔ پس‌زمینه اجرا می‌شود:

- **وظیفهٔ پس‌زمینه:** `music_generate` یک وظیفهٔ پس‌زمینه ایجاد می‌کند، بلافاصله پاسخ شروع‌شده/وظیفه را بازمی‌گرداند، و قطعهٔ نهایی را بعداً در یک پیام پیگیری عامل ارسال می‌کند.
- **جلوگیری از تکرار:** وقتی وظیفه‌ای `queued` یا `running` است، فراخوانی‌های بعدی `music_generate` در همان جلسه به‌جای شروع تولید دیگر، وضعیت وظیفه را بازمی‌گردانند. برای بررسی صریح، از `action: "status"` استفاده کنید.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>` وضعیت در صف، در حال اجرا، و پایانی را بررسی می‌کند.
- **بیدارسازی تکمیل:** OpenClaw یک رویداد تکمیل داخلی را دوباره به همان جلسه تزریق می‌کند تا مدل بتواند خودش پیام پیگیری کاربرپسند را بنویسد.
- **راهنمای اعلان:** نوبت‌های بعدی کاربر/دستی در همان جلسه، وقتی یک وظیفهٔ موسیقی از قبل در جریان است، یک راهنمای کوچک زمان اجرا دریافت می‌کنند تا مدل کورکورانه دوباره `music_generate` را فراخوانی نکند.
- **بازگشت بدون جلسه:** زمینه‌های مستقیم/محلی بدون جلسهٔ واقعی عامل، درون‌خطی اجرا می‌شوند و نتیجهٔ نهایی صدا را در همان نوبت بازمی‌گردانند.

### چرخهٔ عمر وظیفه

| وضعیت       | معنی                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | وظیفه ایجاد شده و منتظر است ارائه‌دهنده آن را بپذیرد.                                           |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولاً 30 ثانیه تا 3 دقیقه، بسته به ارائه‌دهنده و مدت). |
| `succeeded` | قطعه آماده است؛ عامل بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                                 |
| `failed`    | خطای ارائه‌دهنده یا مهلت زمانی؛ عامل با جزئیات خطا بیدار می‌شود.                                 |

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

OpenClaw ارائه‌دهندگان را به این ترتیب امتحان می‌کند:

1. پارامتر `model` از فراخوانی ابزار (اگر عامل یکی مشخص کند).
2. `musicGenerationModel.primary` از پیکربندی.
3. `musicGenerationModel.fallbacks` به‌ترتیب.
4. تشخیص خودکار فقط با استفاده از پیش‌فرض‌های ارائه‌دهندهٔ دارای احراز هویت:
   - ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی؛
   - ارائه‌دهندگان ثبت‌شدهٔ باقی‌ماندهٔ تولید موسیقی به‌ترتیب شناسهٔ ارائه‌دهنده.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌طور خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا جزئیات هر تلاش را شامل می‌شود.

برای استفاده فقط از ورودی‌های صریح `model`، `primary`، و `fallbacks`، مقدار `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## یادداشت‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر گردش‌کار است و به گراف پیکربندی‌شده به‌همراه نگاشت گره برای فیلدهای اعلان/خروجی وابسته است. Plugin همراه `comfy` از طریق رجیستری ارائه‌دهندهٔ تولید موسیقی به ابزار مشترک `music_generate` وصل می‌شود.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید دسته‌ای Lyria 3 استفاده می‌کند. جریان همراه فعلی از اعلان، متن ترانهٔ اختیاری، و تصاویر مرجع اختیاری پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از نقطهٔ پایانی دسته‌ای `music_generation` استفاده می‌کند. از اعلان، متن ترانهٔ اختیاری، حالت بی‌کلام، هدایت مدت، و خروجی mp3 از طریق احراز هویت کلید API `minimax` یا OAuth `minimax-portal` پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر درست

- **با پشتوانهٔ ارائه‌دهندهٔ مشترک** وقتی انتخاب مدل، جایگزینی ارائه‌دهنده در صورت خرابی، و جریان داخلی ناهمگام وظیفه/وضعیت را می‌خواهید.
- **مسیر Plugin (ComfyUI)** وقتی به یک گراف گردش‌کار سفارشی یا ارائه‌دهنده‌ای نیاز دارید که بخشی از قابلیت موسیقی مشترک همراه نیست.

اگر رفتار اختصاصی ComfyUI را اشکال‌زدایی می‌کنید، [ComfyUI](/fa/providers/comfy) را ببینید. اگر رفتار ارائه‌دهندهٔ مشترک را اشکال‌زدایی می‌کنید، با [Google (Gemini)](/fa/providers/google) یا [MiniMax](/fa/providers/minimax) شروع کنید.

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

فیلدهای تخت قدیمی مانند `maxInputImages`، `supportsLyrics`، و
`supportsFormat` برای اعلام پشتیبانی از ویرایش **کافی نیستند**. ارائه‌دهندگان باید `generate` و `edit` را صریحاً اعلام کنند تا آزمون‌های زنده، آزمون‌های قرارداد، و ابزار مشترک `music_generate` بتوانند پشتیبانی حالت را به‌صورت قطعی اعتبارسنجی کنند.

## آزمون‌های زنده

پوشش زندهٔ اختیاری برای ارائه‌دهندگان همراه مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

پوشش‌دهندهٔ مخزن:

```bash
pnpm test:live:media music
```

این فایل زنده متغیرهای محیطی ارائه‌دهندهٔ گم‌شده را از `~/.profile` بارگذاری می‌کند، به‌طور پیش‌فرض کلیدهای API زنده/محیطی را پیش از پروفایل‌های احراز هویت ذخیره‌شده ترجیح می‌دهد، و وقتی ارائه‌دهنده حالت ویرایش را فعال کرده باشد، هم پوشش `generate` و هم پوشش اعلام‌شدهٔ `edit` را اجرا می‌کند. پوشش امروز:

- `google`: `generate` به‌همراه `edit`
- `minimax`: فقط `generate`
- `comfy`: پوشش زندهٔ جداگانهٔ Comfy، نه پیمایش ارائه‌دهندهٔ مشترک

پوشش زندهٔ اختیاری برای مسیر موسیقی ComfyUI همراه:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زندهٔ Comfy همچنین وقتی آن بخش‌ها پیکربندی شده باشند، گردش‌کارهای تصویر و ویدئوی comfy را پوشش می‌دهد.

## مرتبط

- [وظایف پس‌زمینه](/fa/automation/tasks) — ردیابی وظایف برای اجراهای جداشدهٔ `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و جابه‌جایی خودکار در خرابی
- [نمای کلی ابزارها](/fa/tools)
