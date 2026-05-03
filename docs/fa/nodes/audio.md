---
read_when:
    - تغییر رونویسی صوتی یا مدیریت رسانه
summary: نحوهٔ دانلود، رونویسی و درج صدا/یادداشت‌های صوتی دریافتی در پاسخ‌ها
title: صدا و یادداشت‌های صوتی
x-i18n:
    generated_at: "2026-05-03T11:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# یادداشت‌های صوتی / Voice Notes (2026-01-17)

## چه چیزهایی کار می‌کند

- **درک رسانه (صوت)**: اگر درک صوت فعال باشد (یا به‌صورت خودکار شناسایی شود)، OpenClaw:
  1. نخستین پیوست صوتی (مسیر محلی یا URL) را پیدا می‌کند و در صورت نیاز آن را دانلود می‌کند.
  2. پیش از ارسال به هر ورودی مدل، `maxBytes` را اعمال می‌کند.
  3. نخستین ورودی مدل واجد شرایط را به‌ترتیب اجرا می‌کند (ارائه‌دهنده یا CLI).
  4. اگر ناموفق شود یا رد شود (اندازه/مهلت زمانی)، ورودی بعدی را امتحان می‌کند.
  5. در صورت موفقیت، `Body` را با یک بلوک `[Audio]` جایگزین می‌کند و `{{Transcript}}` را تنظیم می‌کند.
- **تجزیه فرمان**: وقتی رونویسی موفق باشد، `CommandBody`/`RawBody` روی متن رونویسی تنظیم می‌شوند تا فرمان‌های اسلش همچنان کار کنند.
- **لاگ‌گیری پرجزئیات**: در `--verbose`، هنگام اجرای رونویسی و هنگام جایگزین کردن بدنه، لاگ ثبت می‌کنیم.

## شناسایی خودکار (پیش‌فرض)

اگر **مدل‌ها را پیکربندی نکنید** و `tools.media.audio.enabled` روی `false` تنظیم **نشده** باشد،
OpenClaw به این ترتیب شناسایی خودکار انجام می‌دهد و در نخستین گزینه کارآمد متوقف می‌شود:

1. **مدل پاسخ فعال** وقتی ارائه‌دهنده آن از درک صوت پشتیبانی می‌کند.
2. **CLIهای محلی** (اگر نصب شده باشند)
   - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` همراه با encoder/decoder/joiner/tokens نیاز دارد)
   - `whisper-cli` (از `whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
   - `whisper` (CLI پایتون؛ مدل‌ها را به‌صورت خودکار دانلود می‌کند)
3. **Gemini CLI** (`gemini`) با استفاده از `read_many_files`
4. **احراز هویت ارائه‌دهنده**
   - ابتدا ورودی‌های پیکربندی‌شده `models.providers.*` که از صوت پشتیبانی می‌کنند امتحان می‌شوند
   - ترتیب جایگزین همراه: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

برای غیرفعال کردن شناسایی خودکار، `tools.media.audio.enabled: false` را تنظیم کنید.
برای سفارشی‌سازی، `tools.media.audio.models` را تنظیم کنید.
نکته: شناسایی باینری در macOS/Linux/Windows به‌صورت بهترین تلاش انجام می‌شود؛ مطمئن شوید CLI در `PATH` است (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل فرمان تنظیم کنید.

## نمونه‌های پیکربندی

### ارائه‌دهنده + جایگزین CLI (OpenAI + Whisper CLI)

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

### فقط ارائه‌دهنده با کنترل محدوده

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

### بازتاب متن رونویسی به چت (با انتخاب صریح)

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
- وقتی `provider: "deepgram"` استفاده شود، Deepgram مقدار `DEEPGRAM_API_KEY` را دریافت می‌کند.
- جزئیات راه‌اندازی Deepgram: [Deepgram (رونویسی صوتی)](/fa/providers/deepgram).
- جزئیات راه‌اندازی Mistral: [Mistral](/fa/providers/mistral).
- وقتی `provider: "senseaudio"` استفاده شود، SenseAudio مقدار `SENSEAUDIO_API_KEY` را دریافت می‌کند.
- جزئیات راه‌اندازی SenseAudio: [SenseAudio](/fa/providers/senseaudio).
- ارائه‌دهندگان صوت می‌توانند `baseUrl`، `headers`، و `providerOptions` را از طریق `tools.media.audio` بازنویسی کنند.
- سقف اندازه پیش‌فرض 20MB است (`tools.media.audio.maxBytes`). صوت بزرگ‌تر از حد برای آن مدل رد می‌شود و ورودی بعدی امتحان می‌شود.
- فایل‌های صوتی کوچک/خالی کمتر از 1024 بایت پیش از رونویسی ارائه‌دهنده/CLI رد می‌شوند.
- مقدار پیش‌فرض `maxChars` برای صوت **تنظیم نشده** است (متن رونویسی کامل). برای کوتاه کردن خروجی، `tools.media.audio.maxChars` یا `maxChars` مخصوص هر ورودی را تنظیم کنید.
- پیش‌فرض خودکار OpenAI برابر `gpt-4o-mini-transcribe` است؛ برای دقت بالاتر `model: "gpt-4o-transcribe"` را تنظیم کنید.
- برای پردازش چند یادداشت صوتی از `tools.media.audio.attachments` استفاده کنید (`mode: "all"` + `maxAttachments`).
- متن رونویسی با `{{Transcript}}` در قالب‌ها در دسترس است.
- `tools.media.audio.echoTranscript` به‌صورت پیش‌فرض خاموش است؛ آن را فعال کنید تا پیش از پردازش عامل، تأیید متن رونویسی به چت مبدأ ارسال شود.
- `tools.media.audio.echoFormat` متن بازتاب را سفارشی می‌کند (جای‌نگهدار: `{transcript}`).
- stdout مربوط به CLI سقف دارد (5MB)؛ خروجی CLI را مختصر نگه دارید.
- `args` مربوط به CLI باید برای مسیر فایل صوتی محلی از `{{MediaPath}}` استفاده کند. برای مهاجرت جای‌نگهدارهای منسوخ `{input}` از پیکربندی‌های قدیمی‌تر `audio.transcription.command`، `openclaw doctor --fix` را اجرا کنید.

### پشتیبانی از محیط پراکسی

رونویسی صوتی مبتنی بر ارائه‌دهنده، متغیرهای محیطی استاندارد پراکسی خروجی را رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پراکسی تنظیم نشده باشد، خروج مستقیم استفاده می‌شود. اگر پیکربندی پراکسی ناقص باشد، OpenClaw یک هشدار لاگ می‌کند و به دریافت مستقیم برمی‌گردد.

## شناسایی منشن در گروه‌ها

وقتی `requireMention: true` برای یک چت گروهی تنظیم شده باشد، OpenClaw اکنون صوت را **پیش از** بررسی منشن‌ها رونویسی می‌کند. این کار اجازه می‌دهد یادداشت‌های صوتی حتی وقتی حاوی منشن هستند پردازش شوند.

**نحوه کار:**

1. اگر یک پیام صوتی بدنه متنی نداشته باشد و گروه به منشن نیاز داشته باشد، OpenClaw یک رونویسی "پیش‌پرواز" انجام می‌دهد.
2. متن رونویسی برای الگوهای منشن بررسی می‌شود (برای مثال، `@BotName`، محرک‌های ایموجی).
3. اگر منشن پیدا شود، پیام از مسیر کامل پاسخ عبور می‌کند.
4. متن رونویسی برای شناسایی منشن استفاده می‌شود تا یادداشت‌های صوتی بتوانند از دروازه منشن عبور کنند.

**رفتار جایگزین:**

- اگر رونویسی در پیش‌پرواز ناموفق شود (مهلت زمانی، خطای API، و غیره)، پیام بر اساس شناسایی منشن فقط متنی پردازش می‌شود.
- این تضمین می‌کند پیام‌های ترکیبی (متن + صوت) هرگز به‌اشتباه حذف نشوند.

**انصراف برای هر گروه/موضوع Telegram:**

- برای رد کردن بررسی‌های منشنِ متن رونویسی پیش‌پرواز برای آن گروه، `channels.telegram.groups.<chatId>.disableAudioPreflight: true` را تنظیم کنید.
- برای بازنویسی بر اساس موضوع، `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` را تنظیم کنید (`true` برای رد کردن، `false` برای فعال‌سازی اجباری).
- پیش‌فرض `false` است (وقتی شرایط نیازمند منشن مطابقت داشته باشند، پیش‌پرواز فعال است).

**مثال:** کاربری در یک گروه Telegram با `requireMention: true` یک یادداشت صوتی می‌فرستد که می‌گوید "Hey @Claude, what's the weather?". یادداشت صوتی رونویسی می‌شود، منشن شناسایی می‌شود، و عامل پاسخ می‌دهد.

## نکات احتیاطی

- قوانین محدوده از قاعده نخستین تطابق برنده است استفاده می‌کنند. `chatType` به `direct`، `group`، یا `room` نرمال‌سازی می‌شود.
- مطمئن شوید CLI شما با کد 0 خارج می‌شود و متن ساده چاپ می‌کند؛ JSON باید از طریق `jq -r .text` آماده‌سازی شود.
- برای `parakeet-mlx`، اگر `--output-dir` را پاس بدهید، وقتی `--output-format` برابر `txt` باشد (یا حذف شده باشد)، OpenClaw مقدار `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های خروجی غیر از `txt` به تجزیه stdout برمی‌گردند.
- مهلت‌های زمانی را معقول نگه دارید (`timeoutSeconds`، پیش‌فرض 60s) تا صف پاسخ مسدود نشود.
- رونویسی پیش‌پرواز برای شناسایی منشن فقط **نخستین** پیوست صوتی را پردازش می‌کند. صوت‌های اضافی در مرحله اصلی درک رسانه پردازش می‌شوند.

## مرتبط

- [درک رسانه](/fa/nodes/media-understanding)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [بیدارباش صوتی](/fa/nodes/voicewake)
