---
read_when:
    - تولید موسیقی یا صوت از طریق عامل
    - پیکربندی ارائه‌دهندگان و مدل‌های تولید موسیقی
    - آشنایی با پارامترهای ابزار music_generate
sidebarTitle: Music generation
summary: موسیقی را از طریق music_generate در گردش‌کارهای Google Lyria، MiniMax و ComfyUI تولید کنید
title: تولید موسیقی
x-i18n:
    generated_at: "2026-05-05T06:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

ابزار `music_generate` به agent اجازه می‌دهد از طریق قابلیت مشترک تولید موسیقی با ارائه‌دهندگان پیکربندی‌شده، یعنی Google، MiniMax، و ComfyUI پیکربندی‌شده با workflow در حال حاضر، موسیقی یا صدا ایجاد کند.

برای اجرای agentهای دارای پشتوانه session، OpenClaw تولید موسیقی را به‌صورت یک task پس‌زمینه آغاز می‌کند، آن را در دفتر task پیگیری می‌کند، سپس وقتی track آماده شد دوباره agent را بیدار می‌کند تا agent بتواند به کاربر اطلاع دهد و صدای نهایی را پیوست کند. در چت‌های گروهی/کانالی که از تحویل قابل‌مشاهده فقط از طریق ابزار پیام استفاده می‌کنند، agent نتیجه را از طریق ابزار پیام منتقل می‌کند. اگر agent تکمیل فقط یک پاسخ نهایی خصوصی بنویسد، OpenClaw به ارسال مستقیم کانال همراه با رسانه تولیدشده برمی‌گردد. بیدارسازی تکمیل صراحتا به agent هشدار می‌دهد که پاسخ‌های نهایی عادی در آن مسیرها خصوصی هستند.

<Note>
ابزار مشترک داخلی فقط زمانی ظاهر می‌شود که دست‌کم یک ارائه‌دهنده تولید موسیقی در دسترس باشد. اگر `music_generate` را در ابزارهای agent خود نمی‌بینید، `agents.defaults.musicGenerationModel` را پیکربندی کنید یا یک کلید API ارائه‌دهنده تنظیم کنید.
</Note>

## شروع سریع

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        برای دست‌کم یک ارائه‌دهنده، یک کلید API تنظیم کنید، مثلا `GEMINI_API_KEY` یا `MINIMAX_API_KEY`.
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

        agent به‌صورت خودکار `music_generate` را فراخوانی می‌کند. نیازی به allow-list کردن ابزار نیست.
      </Step>
    </Steps>

    برای contextهای مستقیم و همگام بدون اجرای agent دارای پشتوانه session، ابزار داخلی همچنان به تولید درون‌خطی برمی‌گردد و مسیر رسانه نهایی را در نتیجه ابزار برمی‌گرداند.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        `plugins.entries.comfy.config.music` را با یک workflow JSON و nodeهای prompt/output پیکربندی کنید.
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

نمونه promptها:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده | مدل پیش‌فرض          | ورودی‌های مرجع | کنترل‌های پشتیبانی‌شده                                        | احراز هویت                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | تا 1 تصویر    | موسیقی یا صدای تعریف‌شده توسط workflow                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | تا 10 تصویر  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | هیچ‌کدام             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` یا MiniMax OAuth     |

### ماتریس قابلیت

قرارداد mode صریحی که توسط `music_generate`، testهای contract، و sweep زنده مشترک استفاده می‌شود:

| ارائه‌دهنده | `generate` | `edit` | حد ویرایش | laneهای زنده مشترک                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 تصویر    | در sweep مشترک نیست؛ توسط `extensions/comfy/comfy.live.test.ts` پوشش داده می‌شود |
| Google   |     ✓      |   ✓    | 10 تصویر  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | هیچ‌کدام       | `generate`                                                                |

برای بررسی ارائه‌دهندگان و مدل‌های مشترک در دسترس هنگام اجرا، از `action: "list"` استفاده کنید:

```text
/tool music_generate action=list
```

برای بررسی task فعال موسیقی دارای پشتوانه session، از `action: "status"` استفاده کنید:

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
  `"status"` task فعلی session را برمی‌گرداند؛ `"list"` ارائه‌دهندگان را بررسی می‌کند.
</ParamField>
<ParamField path="model" type="string">
  override ارائه‌دهنده/مدل (مثلا `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  متن ترانه اختیاری وقتی ارائه‌دهنده از ورودی صریح متن ترانه پشتیبانی می‌کند.
</ParamField>
<ParamField path="instrumental" type="boolean">
  وقتی ارائه‌دهنده پشتیبانی می‌کند، خروجی فقط instrumental درخواست کنید.
</ParamField>
<ParamField path="image" type="string">
  مسیر یا URL یک تصویر مرجع.
</ParamField>
<ParamField path="images" type="string[]">
  چند تصویر مرجع (تا 10 عدد در ارائه‌دهندگان پشتیبانی‌کننده).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدت هدف برحسب ثانیه، وقتی ارائه‌دهنده از راهنمایی‌های مدت پشتیبانی می‌کند.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  راهنمای format خروجی، وقتی ارائه‌دهنده از آن پشتیبانی می‌کند.
</ParamField>
<ParamField path="filename" type="string">راهنمای نام فایل خروجی.</ParamField>
<ParamField path="timeoutMs" type="number">timeout اختیاری درخواست ارائه‌دهنده برحسب میلی‌ثانیه. مقادیر کمتر از 10000ms به 10000ms افزایش داده می‌شوند و در نتیجه ابزار گزارش می‌شوند.</ParamField>

<Note>
همه ارائه‌دهندگان از همه پارامترها پشتیبانی نمی‌کنند. OpenClaw همچنان محدودیت‌های سخت مانند تعداد ورودی‌ها را پیش از ارسال اعتبارسنجی می‌کند. وقتی ارائه‌دهنده از مدت پشتیبانی می‌کند اما حداکثر کوتاه‌تری از مقدار درخواست‌شده دارد، OpenClaw آن را به نزدیک‌ترین مدت پشتیبانی‌شده clamp می‌کند. راهنمایی‌های اختیاری واقعا پشتیبانی‌نشده، وقتی ارائه‌دهنده یا مدل انتخاب‌شده نمی‌تواند آن‌ها را رعایت کند، با هشدار نادیده گرفته می‌شوند. نتایج ابزار تنظیمات اعمال‌شده را گزارش می‌کنند؛ `details.normalization` هر نگاشت درخواست‌شده به اعمال‌شده را ثبت می‌کند.
</Note>

## رفتار async

تولید موسیقی دارای پشتوانه session به‌صورت task پس‌زمینه اجرا می‌شود:

- **task پس‌زمینه:** `music_generate` یک task پس‌زمینه ایجاد می‌کند، بلافاصله پاسخ started/task را برمی‌گرداند، و track نهایی را بعدا در یک پیام follow-up از agent ارسال می‌کند.
- **جلوگیری از تکرار:** وقتی یک task در وضعیت `queued` یا `running` است، فراخوانی‌های بعدی `music_generate` در همان session به‌جای شروع یک تولید دیگر، وضعیت task را برمی‌گردانند. برای بررسی صریح، از `action: "status"` استفاده کنید.
- **جست‌وجوی وضعیت:** `openclaw tasks list` یا `openclaw tasks show <taskId>` وضعیت‌های queued، running، و terminal را بررسی می‌کند.
- **بیدارسازی تکمیل:** OpenClaw یک رویداد تکمیل داخلی را دوباره به همان session تزریق می‌کند تا مدل بتواند خودش follow-up کاربرمحور را بنویسد.
- **راهنمای prompt:** turnهای بعدی کاربر/دستی در همان session وقتی یک task موسیقی در جریان است، یک راهنمای کوچک runtime دریافت می‌کنند تا مدل کورکورانه دوباره `music_generate` را فراخوانی نکند.
- **fallback بدون session:** contextهای مستقیم/محلی بدون session واقعی agent به‌صورت درون‌خطی اجرا می‌شوند و نتیجه نهایی صدا را در همان turn برمی‌گردانند.

### چرخه حیات task

| وضعیت       | معنی                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | task ایجاد شده و منتظر است ارائه‌دهنده آن را بپذیرد.                                           |
| `running`   | ارائه‌دهنده در حال پردازش است (معمولا 30 ثانیه تا 3 دقیقه، بسته به ارائه‌دهنده و مدت). |
| `succeeded` | track آماده است؛ agent بیدار می‌شود و آن را در گفت‌وگو ارسال می‌کند.                                 |
| `failed`    | خطای ارائه‌دهنده یا timeout؛ agent با جزئیات خطا بیدار می‌شود.                                 |

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

1. پارامتر `model` از فراخوانی ابزار (اگر agent یکی را مشخص کند).
2. `musicGenerationModel.primary` از config.
3. `musicGenerationModel.fallbacks` به‌ترتیب.
4. تشخیص خودکار فقط با استفاده از پیش‌فرض‌های ارائه‌دهنده دارای پشتوانه احراز هویت:
   - ابتدا ارائه‌دهنده پیش‌فرض فعلی؛
   - سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید موسیقی به‌ترتیب provider-id.

اگر یک ارائه‌دهنده شکست بخورد، نامزد بعدی به‌صورت خودکار امتحان می‌شود. اگر همه شکست بخورند، خطا شامل جزئیات هر تلاش است.

برای استفاده فقط از مدخل‌های صریح `model`، `primary`، و `fallbacks`، `agents.defaults.mediaGenerationAutoProviderFallback: false` را تنظیم کنید.

## نکات ارائه‌دهنده

<AccordionGroup>
  <Accordion title="ComfyUI">
    مبتنی بر workflow است و به graph پیکربندی‌شده به‌همراه نگاشت node برای فیلدهای prompt/output وابسته است. Plugin داخلی `comfy` از طریق رجیستری ارائه‌دهنده تولید موسیقی به ابزار مشترک `music_generate` وصل می‌شود.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    از تولید batch در Lyria 3 استفاده می‌کند. جریان داخلی فعلی از prompt، متن ترانه اختیاری، و تصاویر مرجع اختیاری پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MiniMax">
    از endpoint دسته‌ای `music_generation` استفاده می‌کند. از prompt، متن ترانه اختیاری، حالت instrumental، هدایت مدت، و خروجی mp3 از طریق احراز هویت کلید API `minimax` یا OAuth مربوط به `minimax-portal` پشتیبانی می‌کند.
  </Accordion>
</AccordionGroup>

## انتخاب مسیر مناسب

- **دارای پشتوانه ارائه‌دهنده مشترک** وقتی انتخاب مدل، failover ارائه‌دهنده، و جریان async داخلی task/status را می‌خواهید.
- **مسیر Plugin (ComfyUI)** وقتی به یک graph سفارشی workflow یا ارائه‌دهنده‌ای نیاز دارید که بخشی از قابلیت موسیقی مشترک داخلی نیست.

اگر در حال debug رفتار مخصوص ComfyUI هستید، [ComfyUI](/fa/providers/comfy) را ببینید. اگر در حال debug رفتار ارائه‌دهنده مشترک هستید، از [Google (Gemini)](/fa/providers/google) یا [MiniMax](/fa/providers/minimax) شروع کنید.

## modeهای قابلیت ارائه‌دهنده

قرارداد مشترک تولید موسیقی از اعلان‌های صریح mode پشتیبانی می‌کند:

- `generate` برای تولید فقط با prompt.
- `edit` وقتی درخواست شامل یک یا چند تصویر مرجع است.

پیاده‌سازی‌های جدید ارائه‌دهنده بهتر است blockهای صریح mode را ترجیح دهند:

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

فیلدهای flat قدیمی مانند `maxInputImages`، `supportsLyrics`، و `supportsFormat` برای اعلام پشتیبانی از edit **کافی نیستند**. ارائه‌دهندگان باید `generate` و `edit` را صریحا اعلان کنند تا testهای زنده، testهای contract، و ابزار مشترک `music_generate` بتوانند پشتیبانی mode را به‌صورت deterministic اعتبارسنجی کنند.

## testهای زنده

پوشش زنده opt-in برای ارائه‌دهندگان داخلی مشترک:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper ریپو:

```bash
pnpm test:live:media music
```

این فایل زنده env varهای ارائه‌دهنده گمشده را از `~/.profile` بارگذاری می‌کند، به‌صورت پیش‌فرض کلیدهای API live/env را پیش از profileهای احراز هویت ذخیره‌شده ترجیح می‌دهد، و وقتی ارائه‌دهنده mode ویرایش را فعال می‌کند، هم پوشش `generate` و هم پوشش `edit` اعلان‌شده را اجرا می‌کند. پوشش امروز:

- `google`: `generate` به‌علاوه `edit`
- `minimax`: فقط `generate`
- `comfy`: پوشش زندهٔ جداگانهٔ Comfy، نه پیمایش مشترک ارائه‌دهنده‌ها

پوشش زندهٔ اختیاری برای مسیر موسیقی بسته‌بندی‌شدهٔ ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

فایل زندهٔ Comfy همچنین جریان‌های کاری تصویر و ویدیوی comfy را هنگامی که آن
بخش‌ها پیکربندی شده باشند پوشش می‌دهد.

## مرتبط

- [وظایف پس‌زمینه](/fa/automation/tasks) — پیگیری وظیفه برای اجراهای جداشدهٔ `music_generate`
- [ComfyUI](/fa/providers/comfy)
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — پیکربندی `musicGenerationModel`
- [Google (Gemini)](/fa/providers/google)
- [MiniMax](/fa/providers/minimax)
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و جایگزینی هنگام خطا
- [نمای کلی ابزارها](/fa/tools)
