---
read_when:
    - تغییر رونویسی صوتی یا مدیریت رسانه
summary: چگونگی دانلود، رونویسی و تزریق صدا/یادداشت‌های صوتی ورودی در پاسخ‌ها
title: صدا و یادداشت‌های صوتی
x-i18n:
    generated_at: "2026-05-06T17:59:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## چه چیزهایی کار می‌کند

- **درک رسانه (صوت)**: اگر درک صوت فعال باشد (یا به‌صورت خودکار شناسایی شود)، OpenClaw:
  1. نخستین پیوست صوتی (مسیر محلی یا URL) را پیدا می‌کند و در صورت نیاز آن را دانلود می‌کند.
  2. پیش از ارسال به هر ورودی مدل، `maxBytes` را اعمال می‌کند.
  3. نخستین ورودی مدل واجد شرایط را به‌ترتیب اجرا می‌کند (ارائه‌دهنده یا CLI).
  4. اگر شکست بخورد یا رد شود (اندازه/مهلت زمانی)، ورودی بعدی را امتحان می‌کند.
  5. در صورت موفقیت، `Body` را با یک بلوک `[Audio]` جایگزین می‌کند و `{{Transcript}}` را تنظیم می‌کند.
- **تجزیه فرمان**: وقتی رونویسی موفق باشد، `CommandBody`/`RawBody` روی رونوشت تنظیم می‌شوند تا فرمان‌های اسلش همچنان کار کنند.
- **ثبت گزارش مفصل**: در `--verbose`، زمانی را ثبت می‌کنیم که رونویسی اجرا می‌شود و زمانی را که بدنه را جایگزین می‌کند.

## شناسایی خودکار (پیش‌فرض)

اگر **مدل‌ها را پیکربندی نکنید** و `tools.media.audio.enabled` روی `false` تنظیم **نشده باشد**،
OpenClaw به این ترتیب شناسایی خودکار را انجام می‌دهد و در نخستین گزینه کارآمد متوقف می‌شود:

1. **مدل پاسخ فعال** وقتی ارائه‌دهنده آن از درک صوت پشتیبانی می‌کند.
2. **CLIهای محلی** (اگر نصب شده باشند)
   - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` با encoder/decoder/joiner/tokens نیاز دارد)
   - `whisper-cli` (از `whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
   - `whisper` (CLI پایتون؛ مدل‌ها را به‌صورت خودکار دانلود می‌کند)
3. **Gemini CLI** (`gemini`) با استفاده از `read_many_files`
4. **احراز هویت ارائه‌دهنده**
   - ورودی‌های پیکربندی‌شده `models.providers.*` که از صوت پشتیبانی می‌کنند ابتدا امتحان می‌شوند
   - ترتیب پشتیبان همراه: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

برای غیرفعال کردن شناسایی خودکار، `tools.media.audio.enabled: false` را تنظیم کنید.
برای سفارشی‌سازی، `tools.media.audio.models` را تنظیم کنید.
نکته: شناسایی باینری در macOS/Linux/Windows به‌صورت بهترین تلاش انجام می‌شود؛ مطمئن شوید CLI روی `PATH` قرار دارد (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل فرمان تنظیم کنید.

## نمونه‌های پیکربندی

### پشتیبان ارائه‌دهنده + CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### فقط ارائه‌دهنده با محدودسازی دامنه

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### فقط ارائه‌دهنده (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### فقط ارائه‌دهنده (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### فقط ارائه‌دهنده (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### بازتاب رونوشت به گپ (اختیاری)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## نکته‌ها و محدودیت‌ها

- احراز هویت ارائه‌دهنده از ترتیب استاندارد احراز هویت مدل پیروی می‌کند (پروفایل‌های احراز هویت، متغیرهای محیطی، `models.providers.*.apiKey`).
- جزئیات راه‌اندازی Groq: [Groq](/fa/providers/groq).
- وقتی `provider: "deepgram"` استفاده شود، Deepgram از `DEEPGRAM_API_KEY` استفاده می‌کند.
- جزئیات راه‌اندازی Deepgram: [Deepgram (رونویسی صوت)](/fa/providers/deepgram).
- جزئیات راه‌اندازی Mistral: [Mistral](/fa/providers/mistral).
- وقتی `provider: "senseaudio"` استفاده شود، SenseAudio از `SENSEAUDIO_API_KEY` استفاده می‌کند.
- جزئیات راه‌اندازی SenseAudio: [SenseAudio](/fa/providers/senseaudio).
- ارائه‌دهندگان صوت می‌توانند `baseUrl`، `headers`، و `providerOptions` را از طریق `tools.media.audio` بازنویسی کنند.
- سقف اندازه پیش‌فرض 20MB است (`tools.media.audio.maxBytes`). صوت بیش از اندازه برای آن مدل رد می‌شود و ورودی بعدی امتحان می‌شود.
- فایل‌های صوتی بسیار کوچک/خالی زیر 1024 بایت پیش از رونویسی ارائه‌دهنده/CLI رد می‌شوند.
- مقدار پیش‌فرض `maxChars` برای صوت **تنظیم نشده است** (رونوشت کامل). برای کوتاه کردن خروجی، `tools.media.audio.maxChars` یا `maxChars` را برای هر ورودی تنظیم کنید.
- پیش‌فرض خودکار OpenAI برابر `gpt-4o-mini-transcribe` است؛ برای دقت بالاتر `model: "gpt-4o-transcribe"` را تنظیم کنید.
- برای پردازش چند یادداشت صوتی از `tools.media.audio.attachments` استفاده کنید (`mode: "all"` + `maxAttachments`).
- رونوشت به‌صورت `{{Transcript}}` در دسترس الگوها قرار دارد.
- `tools.media.audio.echoTranscript` به‌صورت پیش‌فرض خاموش است؛ آن را فعال کنید تا پیش از پردازش عامل، تأییدیه رونوشت به گپ مبدأ ارسال شود.
- `tools.media.audio.echoFormat` متن بازتاب را سفارشی می‌کند (جای‌نگهدار: `{transcript}`).
- stdout مربوط به CLI محدود شده است (5MB)؛ خروجی CLI را مختصر نگه دارید.
- `args` مربوط به CLI باید از `{{MediaPath}}` برای مسیر فایل صوتی محلی استفاده کند. برای مهاجرت جای‌نگهدارهای منسوخ `{input}` از پیکربندی‌های قدیمی‌تر `audio.transcription.command`، `openclaw doctor --fix` را اجرا کنید.

### پشتیبانی از محیط پروکسی

رونویسی صوت مبتنی بر ارائه‌دهنده، متغیرهای محیطی استاندارد پروکسی خروجی را رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پروکسی تنظیم نشده باشد، خروج مستقیم استفاده می‌شود. اگر پیکربندی پروکسی بدشکل باشد، OpenClaw هشدار ثبت می‌کند و به دریافت مستقیم برمی‌گردد.

## شناسایی اشاره در گروه‌ها

وقتی `requireMention: true` برای یک گپ گروهی تنظیم شده باشد، OpenClaw اکنون صوت را **پیش از** بررسی اشاره‌ها رونویسی می‌کند. این امکان می‌دهد یادداشت‌های صوتی حتی وقتی شامل اشاره هستند پردازش شوند.

**نحوه کار:**

1. اگر یک پیام صوتی بدنه متنی نداشته باشد و گروه به اشاره نیاز داشته باشد، OpenClaw یک رونویسی "پیش‌پرواز" انجام می‌دهد.
2. رونوشت برای الگوهای اشاره بررسی می‌شود (برای مثال، `@BotName`، محرک‌های ایموجی).
3. اگر اشاره‌ای پیدا شود، پیام از خط لوله کامل پاسخ عبور می‌کند.
4. رونوشت برای شناسایی اشاره استفاده می‌شود تا یادداشت‌های صوتی بتوانند از دروازه اشاره عبور کنند.

**رفتار پشتیبان:**

- اگر رونویسی هنگام پیش‌پرواز شکست بخورد (مهلت زمانی، خطای API و غیره)، پیام بر اساس شناسایی اشاره فقط متنی پردازش می‌شود.
- این تضمین می‌کند که پیام‌های ترکیبی (متن + صوت) هرگز به‌اشتباه کنار گذاشته نشوند.

**انصراف برای هر گروه/موضوع Telegram:**

- برای رد کردن بررسی‌های اشاره در رونوشت پیش‌پرواز برای آن گروه، `channels.telegram.groups.<chatId>.disableAudioPreflight: true` را تنظیم کنید.
- برای بازنویسی در سطح موضوع، `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` را تنظیم کنید (`true` برای رد کردن، `false` برای اجبار به فعال‌سازی).
- پیش‌فرض `false` است (وقتی شرایط وابسته به اشاره برقرار باشد، پیش‌پرواز فعال است).

**مثال:** کاربری در یک گروه Telegram با `requireMention: true` یک یادداشت صوتی می‌فرستد و می‌گوید "Hey @Claude, what's the weather?". یادداشت صوتی رونویسی می‌شود، اشاره شناسایی می‌شود، و عامل پاسخ می‌دهد.

## نکات قابل توجه

- قوانین دامنه از قاعده نخستین تطابق برنده است استفاده می‌کنند. `chatType` به `direct`، `group`، یا `room` نرمال‌سازی می‌شود.
- مطمئن شوید CLI شما با کد 0 خارج می‌شود و متن ساده چاپ می‌کند؛ JSON باید از طریق `jq -r .text` آماده‌سازی شود.
- برای `parakeet-mlx`، اگر `--output-dir` را پاس بدهید، وقتی `--output-format` برابر `txt` باشد (یا حذف شده باشد)، OpenClaw از `<output-dir>/<media-basename>.txt` می‌خواند؛ قالب‌های خروجی غیر از `txt` به تجزیه stdout برمی‌گردند.
- مهلت‌های زمانی را منطقی نگه دارید (`timeoutSeconds`، پیش‌فرض 60s) تا از مسدود شدن صف پاسخ جلوگیری شود.
- رونویسی پیش‌پرواز فقط **اولین** پیوست صوتی را برای شناسایی اشاره پردازش می‌کند. صوت‌های اضافی در مرحله اصلی درک رسانه پردازش می‌شوند.

## مرتبط

- [درک رسانه](/fa/nodes/media-understanding)
- [حالت گفتگو](/fa/nodes/talk)
- [بیدارباش صوتی](/fa/nodes/voicewake)
