---
read_when:
    - طراحی یا بازآرایی درک رسانه‌ای
    - تنظیم پیش‌پردازش صوت/ویدئو/تصویر ورودی
sidebarTitle: Media understanding
summary: درک تصاویر/صدا/ویدئوی ورودی (اختیاری) با ارائه‌دهنده و مسیرهای جایگزین CLI
title: درک رسانه‌ای
x-i18n:
    generated_at: "2026-07-12T10:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw می‌تواند پیش از اجرای خط لولهٔ پاسخ، رسانهٔ ورودی (تصویر/صدا/ویدئو) را خلاصه کند تا تجزیهٔ فرمان و مسیریابی به‌جای بایت‌های خام، بر اساس متن کوتاه انجام شوند. قابلیت درک، ابزارهای محلی یا کلیدهای ارائه‌دهنده را به‌طور خودکار شناسایی می‌کند؛ همچنین می‌توانید مدل‌ها را به‌صراحت پیکربندی کنید. رسانهٔ اصلی همواره طبق روال معمول به مدل تحویل داده می‌شود؛ اگر درک ناموفق یا غیرفعال باشد، جریان پاسخ بدون تغییر ادامه می‌یابد.

Pluginهای فروشندگان، فرادادهٔ قابلیت‌ها را ثبت می‌کنند (اینکه کدام ارائه‌دهنده از کدام نوع رسانه پشتیبانی می‌کند، مدل پیش‌فرض و اولویت). هستهٔ OpenClaw مالک پیکربندی مشترک `tools.media`، ترتیب بازگشت و یکپارچه‌سازی با خط لولهٔ پاسخ است.

## نحوهٔ کار

<Steps>
  <Step title="جمع‌آوری پیوست‌ها">
    پیوست‌های ورودی (`MediaPaths`، `MediaUrls`، `MediaTypes`) را جمع‌آوری می‌کند.
  </Step>
  <Step title="انتخاب برای هر قابلیت">
    برای هر قابلیت فعال (تصویر/صدا/ویدئو)، پیوست‌ها را مطابق سیاست `attachments` انتخاب می‌کند (پیش‌فرض: فقط نخستین پیوست).
  </Step>
  <Step title="انتخاب مدل">
    نخستین ورودی مدل واجد شرایط را انتخاب می‌کند (اندازه + قابلیت + دردسترس‌بودن احراز هویت).
  </Step>
  <Step title="بازگشت در صورت شکست">
    اگر مدل خطا دهد، مهلت آن پایان یابد یا رسانه از `maxBytes` فراتر رود، ورودی بعدی را امتحان می‌کند.
  </Step>
  <Step title="اعمال در صورت موفقیت">
    `Body` به یک بلوک `[Image]`، `[Audio]` یا `[Video]` تبدیل می‌شود. صدا همچنین `{{Transcript}}` را تنظیم می‌کند؛ تجزیهٔ فرمان در صورت وجود متن زیرنویس از آن و در غیر این صورت از رونوشت استفاده می‌کند. زیرنویس‌ها به‌شکل `User text:` درون بلوک حفظ می‌شوند.
  </Step>
</Steps>

## پیکربندی

`tools.media` شامل یک فهرست مشترک مدل و بازنویسی‌های مخصوص هر قابلیت است:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

کلیدهای مخصوص هر قابلیت (`image`/`audio`/`video`):

| کلید                                            | نوع       | پیش‌فرض                                              | توضیحات                                                                                      |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | خودکار (`false` غیرفعال می‌کند)                      | برای خاموش‌کردن تشخیص خودکار این قابلیت، روی `false` تنظیم کنید                              |
| `models`                                        | آرایه     | هیچ‌کدام                                             | پیش از فهرست مشترک `tools.media.models` ترجیح داده می‌شود                                    |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ راهنمای maxChars)       | به‌طور پیش‌فرض فقط برای تصویر/ویدئو                                                          |
| `maxChars`                                      | `number`  | `500` (تصویر/ویدئو)، تنظیم‌نشده (صدا)                | اگر مدل مقدار بیشتری بازگرداند، خروجی کوتاه می‌شود                                           |
| `maxBytes`                                      | `number`  | تصویر `10485760`، صدا `20971520`، ویدئو `52428800`   | رسانهٔ بیش‌ازحد بزرگ نادیده گرفته می‌شود و مدل بعدی امتحان می‌شود                            |
| `timeoutSeconds`                                | `number`  | `60` (تصویر/صدا)، `120` (ویدئو)                      |                                                                                              |
| `language`                                      | `string`  | تنظیم‌نشده                                           | راهنمای زبان برای رونویسی صدا                                                               |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | بازنویسی‌های درخواست ارائه‌دهنده؛ [ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید |
| `attachments`                                   | شیء       | `{ mode: "first", maxAttachments: 1 }`               | [سیاست پیوست](#attachment-policy) را ببینید                                                  |
| `scope`                                         | شیء       | تنظیم‌نشده                                           | محدودسازی بر اساس channel/chatType/keyPrefix                                                |
| `echoTranscript`                                | `boolean` | `false`                                              | فقط صدا: پیش از پردازش عامل، رونوشت را به گفت‌وگو بازمی‌گرداند                               |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | فقط صدا: جای‌نگهدار `{transcript}`                                                           |

گزینه‌های مخصوص Deepgram در `providerOptions.deepgram` قرار می‌گیرند (فیلد سطح‌بالای `deepgram: { detectLanguage, punctuate, smartFormat }` منسوخ شده است، اما همچنان خوانده می‌شود).

### ورودی‌های مدل

هر ورودی `models[]` یک ورودی **ارائه‌دهنده** (پیش‌فرض) یا یک ورودی **CLI** است:

<Tabs>
  <Tab title="ورودی ارائه‌دهنده">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="ورودی CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    الگوهای CLI می‌توانند از `{{MediaDir}}` (دایرکتوری حاوی فایل رسانه)، `{{OutputDir}}` (دایرکتوری موقتی ایجادشده برای این اجرا) و `{{OutputBase}}` (مسیر پایهٔ فایل موقت، بدون پسوند) نیز استفاده کنند.

  </Tab>
</Tabs>

### اعتبارنامه‌های ارائه‌دهنده

درک رسانه توسط ارائه‌دهنده از همان سازوکار تعیین احراز هویت فراخوانی‌های عادی مدل استفاده می‌کند: نمایه‌های احراز هویت، متغیرهای محیطی و سپس `models.providers.<providerId>.apiKey`. ورودی‌های `tools.media.*.models[]` فیلد درون‌خطی `apiKey` را نمی‌پذیرند.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

برای نمایه‌ها، متغیرهای محیطی و URLهای پایهٔ سفارشی، [ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## قواعد و رفتار

- رسانه‌ای که از `maxBytes` فراتر رود، برای آن مدل نادیده گرفته می‌شود و مدل بعدی امتحان می‌شود.
- فایل‌های صوتی کوچک‌تر از ۱۰۲۴ بایت خالی/خراب در نظر گرفته می‌شوند و پیش از رونویسی نادیده گرفته می‌شوند؛ در عوض، عامل یک رونوشت جای‌نگهدار قطعی دریافت می‌کند.
- اگر مدل اصلی فعال تصویر از بینایی به‌صورت بومی پشتیبانی کند، OpenClaw بلوک خلاصهٔ `[Image]` را نادیده می‌گیرد و تصویر اصلی را مستقیماً به مدل می‌فرستد. MiniMax یک استثنا است: `minimax`، `minimax-cn`، `minimax-portal` و `minimax-portal-cn` همیشه درک تصویر را از طریق ارائه‌دهندهٔ رسانهٔ `MiniMax-VL-01` متعلق به Plugin مسیریابی می‌کنند، حتی اگر فرادادهٔ قدیمی گفت‌وگوی MiniMax M2.x ادعای پشتیبانی از ورودی تصویر داشته باشد (فقط `MiniMax-M3` و نسخه‌های بعدی دارای قابلیت بومی بینایی در نظر گرفته می‌شوند).
- اگر مدل اصلی Gateway/WebChat فقط متنی باشد، پیوست‌های تصویری به‌صورت ارجاع‌های برون‌سپاری‌شدهٔ `media://inbound/*` حفظ می‌شوند تا ابزارهای تصویر/PDF یا یک مدل تصویر پیکربندی‌شده همچنان بتوانند آن‌ها را بررسی کنند و پیوست از دست نرود.
- فرمان صریح `openclaw infer image describe --file <path> --model <provider/model>` (نام مستعار: `openclaw capability image describe`) آن ارائه‌دهنده/مدل دارای قابلیت تصویر را مستقیماً اجرا می‌کند؛ از جمله ارجاع‌های Ollama مانند `ollama/qwen2.5vl:7b`، هنگامی که یک مدل منطبق دارای قابلیت تصویر در `models.providers.ollama.models[]` پیکربندی شده باشد.
- اگر `<capability>.enabled` برابر `false` نباشد، اما هیچ مدلی پیکربندی نشده باشد، OpenClaw هنگامی که ارائه‌دهندهٔ مدل فعال پاسخ از آن قابلیت پشتیبانی کند، آن مدل را امتحان می‌کند.

### تشخیص خودکار (پیش‌فرض)

هنگامی که `tools.media.<capability>.enabled` برابر `false` نباشد و هیچ مدلی پیکربندی نشده باشد، OpenClaw گزینه‌های زیر را به‌ترتیب امتحان می‌کند و در نخستین گزینهٔ کارآمد متوقف می‌شود:

<Steps>
  <Step title="مدل تصویر پیکربندی‌شده (فقط تصویر)">
    ارجاع‌های اصلی/جایگزین `agents.defaults.imageModel`، مگر اینکه مدل فعال پاسخ از قبل به‌صورت بومی از بینایی پشتیبانی کند. ارجاع‌های `provider/model` ترجیح داده می‌شوند؛ ارجاع‌های بدون ارائه‌دهنده فقط زمانی با ورودی‌های مدل پیکربندی‌شدهٔ ارائه‌دهندهٔ دارای قابلیت تصویر تکمیل می‌شوند که تطبیق یکتا باشد.
  </Step>
  <Step title="مدل فعال پاسخ">
    مدل فعال پاسخ، هنگامی که ارائه‌دهندهٔ آن از قابلیت موردنظر پشتیبانی کند.
  </Step>
  <Step title="احراز هویت ارائه‌دهنده (فقط صدا، پیش از CLIهای محلی)">
    ورودی‌های پیکربندی‌شدهٔ `models.providers.*` که از صدا پشتیبانی می‌کنند، پیش از CLIهای محلی امتحان می‌شوند. ترتیب اولویت ارائه‌دهندگان همراه (تساوی‌ها بر اساس شناسهٔ ارائه‌دهنده به‌ترتیب الفبایی شکسته می‌شوند): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLIهای محلی (فقط صدا)">
    فایل‌های اجرایی محلی آماده به یک فهرست بازگشت مرتب‌شده تبدیل می‌شوند:
    - `whisper-cli` تنها زمانی در اولویت نخست قرار می‌گیرد که یک فراخوانی مدل پیشین در فرایند جاری، Metal یا CUDA را مشاهده کرده باشد
    - `sherpa-onnx-offline` با پیش‌فرض CPU (به `SHERPA_ONNX_MODEL_DIR` حاوی `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` نیاز دارد)
    - `whisper-cli` هنگامی که شتاب‌دهی صرفاً در زمان ساخت ممکن باشد یا هنوز مشاهده نشده باشد
    - `parakeet-mlx` روی Apple Silicon (دارای قابلیت MLX، استفاده از دستگاه مشاهده نشده است)
    - `whisper` (CLI پایتون؛ به‌طور پیش‌فرض از مدل `turbo` استفاده می‌کند و آن را خودکار بارگیری می‌کند)

    بررسی قابلیت پشتیبان ذخیرهٔ موقت می‌شود و مدلی را بارگیری نمی‌کند. قابلیت زمان ساخت، پرچم‌های پشتیبان درخواستی و پشتیبانی که در یک فراخوانی واقعی مشاهده شده است، جدا از یکدیگر باقی می‌مانند. whisper.cpp شناسایی‌شده به‌طور خودکار، گزارش‌های اجرای مدل را فعال نگه می‌دارد تا خط پشتیبان منتخب بالادستی ثبت شود. ورودی‌های صریح CLI ترتیب پیکربندی‌شده، پرچم‌های پشتیبان و پرچم‌های خروجی خود را حفظ می‌کنند.

  </Step>
  <Step title="احراز هویت ارائه‌دهنده (تصویر/ویدئو)">
    ورودی‌های پیکربندی‌شدهٔ `models.providers.*` که از قابلیت موردنظر پشتیبانی می‌کنند، پیش از ترتیب بازگشت همراه امتحان می‌شوند. ارائه‌دهندگان پیکربندی مختص تصویر که مدلی دارای قابلیت تصویر دارند، حتی اگر Plugin فروشندهٔ همراه نباشند، به‌طور خودکار برای درک رسانه ثبت می‌شوند.

    ترتیب اولویت ارائه‌دهندگان همراه (تساوی‌ها بر اساس شناسهٔ ارائه‌دهنده به‌ترتیب الفبایی شکسته می‌شوند):
    - تصویر: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - ویدئو: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI ‏Antigravity (فقط تصویر/ویدئو)">
    نخستین فایل اجرایی نصب‌شدهٔ `agy` یا `antigravity` (قابل بازنویسی با `OPENCLAW_ANTIGRAVITY_CLI`)، در محیط ایزوله‌شده نسبت به دایرکتوری رسانه.
  </Step>
</Steps>

برای غیرفعال‌کردن تشخیص خودکار یک قابلیت:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
تشخیص فایل اجرایی در macOS/Linux/Windows بر اساس تلاش معقول انجام می‌شود؛ مطمئن شوید CLI در `PATH` قرار دارد (`~` بسط داده می‌شود)، یا یک ورودی صریح مدل CLI با مسیر کامل فرمان تنظیم کنید.
</Note>

### پشتیبانی از پراکسی (فراخوانی‌های ارائه‌دهنده برای صدا/ویدئو)

درک مبتنی بر ارائه‌دهنده برای **صدا** و **ویدئو** از متغیرهای محیطی استاندارد پراکسی خروجی، از جمله قواعد عبور `NO_PROXY`/`no_proxy`، پیروی می‌کند: `HTTPS_PROXY`، `HTTP_PROXY`، `ALL_PROXY`، `https_proxy`، `http_proxy`، `all_proxy`. متغیرهای حروف کوچک بر حروف بزرگ اولویت دارند. اگر هیچ‌کدام تنظیم نشده باشند، درک رسانه از خروجی مستقیم استفاده می‌کند؛ اگر مقدار پراکسی بدساخت باشد، OpenClaw یک هشدار ثبت می‌کند و به دریافت مستقیم بازمی‌گردد. درک تصویر از این مسیر پراکسی عبور نمی‌کند.

## قابلیت‌ها

برای محدودکردن یک ورودی `models[]` به انواع مشخص رسانه، `capabilities` را روی آن تنظیم کنید. برای فهرست‌های مشترک، OpenClaw مقادیر پیش‌فرض هر ارائه‌دهندهٔ همراه را استنباط می‌کند:

| ارائه‌دهنده                                                               | قابلیت‌ها             |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | تصویر                 |
| `minimax-portal`                                                         | تصویر                 |
| `moonshot`                                                               | تصویر + ویدئو         |
| `openrouter`                                                             | تصویر + صدا           |
| `google` (رابط برنامه‌نویسی Gemini)                                      | تصویر + صدا + ویدئو   |
| `qwen`                                                                   | تصویر + ویدئو         |
| `deepinfra`                                                              | تصویر + صدا           |
| `mistral`                                                                | صدا                   |
| `zai`                                                                    | تصویر                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | صدا                   |
| هر کاتالوگ `models.providers.<id>.models[]` دارای مدلی با قابلیت تصویر   | تصویر                 |

برای ورودی‌های CLI، مقدار `capabilities` را صریحاً تنظیم کنید تا از تطبیق‌های غیرمنتظره جلوگیری شود؛ اگر حذف شود، ورودی برای تمام فهرست‌های قابلیتی که در آن‌ها ظاهر می‌شود واجد شرایط خواهد بود.

## ماتریس پشتیبانی ارائه‌دهندگان

| قابلیت | ارائه‌دهندگان                                                                                                                                               | نکات                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تصویر      | Anthropic، سرور برنامهٔ Codex، Deepinfra، Google، MiniMax، MiniMax Portal، Moonshot، OpenAI، OpenAI Codex OAuth، OpenRouter، Qwen، Z.AI، ارائه‌دهندگان پیکربندی | Pluginهای فروشندگان پشتیبانی از تصویر را ثبت می‌کنند؛ `openai/*` می‌تواند از مسیریابی کلید API یا Codex OAuth استفاده کند؛ `codex/*` از یک نوبت محدود سرور برنامهٔ Codex استفاده می‌کند؛ ارائه‌دهندگان پیکربندی دارای قابلیت تصویر به‌طور خودکار ثبت می‌شوند. |
| صدا      | Deepgram، Deepinfra، ElevenLabs، Google، Groq، Mistral، OpenAI، OpenRouter، SenseAudio، xAI                                                             | رونویسی ارائه‌دهنده (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| ویدئو      | Google، Moonshot، Qwen                                                                                                                                  | درک ویدئو توسط ارائه‌دهنده از طریق Pluginهای فروشنده؛ درک ویدئو در Qwen از نقاط پایانی استاندارد DashScope استفاده می‌کند.                                                                        |

<Note>
**نکته دربارهٔ MiniMax**: درک تصویر برای `minimax`، `minimax-cn`، `minimax-portal` و `minimax-portal-cn` همیشه از ارائه‌دهندهٔ رسانه‌ای `MiniMax-VL-01` متعلق به Plugin تأمین می‌شود، حتی اگر فرادادهٔ قدیمی گفت‌وگوی MiniMax M2.x مدعی پشتیبانی از ورودی تصویر باشد.
</Note>

## راهنمای انتخاب مدل

- هنگامی که کیفیت و ایمنی اهمیت دارد، برای هر قابلیت رسانه‌ای قوی‌ترین مدل نسل فعلی را ترجیح دهید.
- برای عامل‌های مجهز به ابزار که ورودی‌های غیرقابل‌اعتماد را پردازش می‌کنند، از مدل‌های رسانه‌ای قدیمی‌تر یا ضعیف‌تر اجتناب کنید.
- برای دسترس‌پذیری، دست‌کم یک مدل جایگزین برای هر قابلیت نگه دارید (مدل باکیفیت + مدل سریع‌تر/ارزان‌تر).
- گزینه‌های جایگزین CLI (`whisper-cli`، `whisper`، `gemini`) هنگامی مفیدند که رابط‌های برنامه‌نویسی ارائه‌دهندگان در دسترس نباشند.
- حالت‌های شناخته‌شدهٔ خروجی فایل مرجع قطعی هستند: فایل رونویسی استنباط‌شدهٔ خالی یا مفقود، به‌جای استفاده از خروجی پیشرفت CLI به‌عنوان گزینهٔ جایگزین، هیچ رونویسی تولید نمی‌کند.
- `parakeet-mlx`: از `--output-format txt` (یا `all`) همراه با `--output-dir` و الگوی خروجی پیش‌فرض `{filename}` استفاده کنید. متغیرهای محیطی بالادستی `PARAKEET_OUTPUT_FORMAT` و `PARAKEET_OUTPUT_TEMPLATE` نیز رعایت می‌شوند. OpenClaw فایل `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب پیش‌فرض `srt`، قالب‌های دیگر و الگوهای خروجی سفارشی همچنان از stdout استفاده می‌کنند.

## خط‌مشی پیوست‌ها

گزینهٔ `attachments` مختص هر قابلیت تعیین می‌کند کدام پیوست‌ها پردازش شوند:

<ParamField path="mode" type='"first" | "all"' default="first">
  فقط نخستین پیوست انتخاب‌شده یا همهٔ آن‌ها را پردازش می‌کند.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  تعداد موارد پردازش‌شده را محدود می‌کند.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  اولویت انتخاب میان پیوست‌های نامزد.
</ParamField>

هنگامی که `mode: "all"` باشد، خروجی‌ها با `[تصویر 1/2]`، `[صدا 2/2]` و مانند آن برچسب‌گذاری می‌شوند.

### استخراج پیوست فایل

- متن استخراج‌شده از فایل، پیش از افزوده‌شدن به درخواست رسانه، به‌عنوان محتوای خارجی غیرقابل‌اعتماد بسته‌بندی می‌شود و از نشانگرهای مرزی مانند `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` به‌همراه خط فرادادهٔ `Source: External` استفاده می‌کند.
- این مسیر عمداً بنر طولانی `SECURITY NOTICE:` را حذف می‌کند تا درخواست رسانه کوتاه بماند؛ نشانگرهای مرزی و فراداده همچنان اعمال می‌شوند.
- فایلی که متن قابل‌استخراجی ندارد، `[متن قابل‌استخراجی وجود ندارد]` دریافت می‌کند.
- اگر یک PDF به تصاویر رندرشدهٔ صفحه بازگردد، OpenClaw آن تصاویر را به مدل‌های پاسخ‌گوی دارای قابلیت بینایی ارسال می‌کند و جای‌نگهدار `[محتوای PDF به تصویر رندر شد]` را در بلوک فایل نگه می‌دارد.

## نمونه‌های پیکربندی

<Tabs>
  <Tab title="مدل‌های مشترک + بازنویسی‌ها">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="فقط صدا + ویدئو">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="فقط تصویر">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="یک ورودی چندرسانه‌ای">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## خروجی وضعیت

هنگامی که درک رسانه اجرا می‌شود، `/status` شامل یک خط خلاصه برای هر قابلیت است:

```
📎 رسانه: تصویر موفق (openai/gpt-5.6-sol) · صدا موفق (whisper-cli مشاهده‌شده=metal)
```

برای فهرست موجودی پیش‌بررسی، `openclaw capability audio providers` را اجرا کنید. ردیف‌های محلی، برندهٔ گزینهٔ جایگزین محلی را جدا از انتخاب سراسری ارائه‌دهنده، آمادگی، و فیلدهای مجزای پشتیبان دارای قابلیت/درخواست‌شده/مشاهده‌شده نمایش می‌دهند. همین انتخاب محلی به‌صورت یک یافتهٔ اطلاع‌رسان در doctor نیز در دسترس است:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## نکات

- درک به‌صورت بهترین تلاش انجام می‌شود. خطاها مانع پاسخ‌ها نمی‌شوند.
- حتی هنگامی که درک غیرفعال است، پیوست‌ها همچنان به مدل‌ها ارسال می‌شوند.
- از `scope` برای محدودکردن محل اجرای درک استفاده کنید (برای مثال، فقط پیام‌های مستقیم).

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
