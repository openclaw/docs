---
read_when:
    - تغییر رونویسی صوتی یا مدیریت رسانه
summary: نحوهٔ دانلود، رونویسی و تزریق صدای ورودی/پیام‌های صوتی در پاسخ‌ها
title: صدا و یادداشت‌های صوتی
x-i18n:
    generated_at: "2026-05-02T23:39:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# یادداشت‌های صوتی / صوت (2026-01-17)

## آنچه کار می‌کند

- **درک رسانه (صوت)**: اگر درک صوت فعال باشد (یا به‌صورت خودکار تشخیص داده شود)، OpenClaw:
  1. نخستین پیوست صوتی (مسیر محلی یا URL) را پیدا می‌کند و در صورت نیاز آن را دانلود می‌کند.
  2. پیش از ارسال به هر ورودی مدل، `maxBytes` را اعمال می‌کند.
  3. نخستین ورودی مدل واجد شرایط را به‌ترتیب اجرا می‌کند (ارائه‌دهنده یا CLI).
  4. اگر شکست بخورد یا رد شود (اندازه/مهلت زمانی)، ورودی بعدی را امتحان می‌کند.
  5. در صورت موفقیت، `Body` را با یک بلوک `[Audio]` جایگزین می‌کند و `{{Transcript}}` را تنظیم می‌کند.
- **تجزیه فرمان**: وقتی رونویسی موفق باشد، `CommandBody`/`RawBody` روی متن رونویسی تنظیم می‌شوند تا فرمان‌های اسلش همچنان کار کنند.
- **ثبت گزارش تفصیلی**: در `--verbose`، زمانی را که رونویسی اجرا می‌شود و زمانی را که بدنه را جایگزین می‌کند ثبت می‌کنیم.
- **دیکته در رابط کنترل**: سازنده پیام Chat می‌تواند یک کلیپ میکروفون ضبط‌شده در مرورگر را به `chat.transcribeAudio` بفرستد. آن RPC در Gateway کلیپ را در یک فایل محلی موقت می‌نویسد، همین خط لوله رونویسی صوتی را اجرا می‌کند، متن پیش‌نویس را به مرورگر برمی‌گرداند و فایل موقت را حذف می‌کند. این کار به‌تنهایی اجرای عامل ایجاد نمی‌کند.

## تشخیص خودکار (پیش‌فرض)

اگر **مدل‌ها را پیکربندی نکنید** و `tools.media.audio.enabled` روی `false` تنظیم **نشده باشد**،
OpenClaw به این ترتیب به‌صورت خودکار تشخیص می‌دهد و در نخستین گزینه فعال متوقف می‌شود:

1. **مدل پاسخ فعال** وقتی ارائه‌دهنده آن از درک صوت پشتیبانی کند.
2. **CLIهای محلی** (اگر نصب شده باشند)
   - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` با encoder/decoder/joiner/tokens نیاز دارد)
   - `whisper-cli` (از `whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل کوچک همراه استفاده می‌کند)
   - `whisper` (CLI پایتون؛ مدل‌ها را به‌صورت خودکار دانلود می‌کند)
3. **Gemini CLI** (`gemini`) با استفاده از `read_many_files`
4. **احراز هویت ارائه‌دهنده**
   - ورودی‌های پیکربندی‌شده `models.providers.*` که از صوت پشتیبانی می‌کنند ابتدا امتحان می‌شوند
   - ترتیب جایگزین همراه: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

برای غیرفعال‌کردن تشخیص خودکار، `tools.media.audio.enabled: false` را تنظیم کنید.
برای سفارشی‌سازی، `tools.media.audio.models` را تنظیم کنید.
نکته: تشخیص باینری در macOS/Linux/Windows به‌صورت بهترین تلاش است؛ مطمئن شوید CLI روی `PATH` قرار دارد (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل فرمان تنظیم کنید.

## نمونه‌های پیکربندی

### جایگزین ارائه‌دهنده + CLI (OpenAI + Whisper CLI)

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

### بازتاب متن رونویسی به گفت‌وگو (اختیاری)

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

## نکات و محدودیت‌ها

- احراز هویت ارائه‌دهنده از ترتیب استاندارد احراز هویت مدل پیروی می‌کند (پروفایل‌های احراز هویت، متغیرهای محیطی، `models.providers.*.apiKey`).
- جزئیات راه‌اندازی Groq: [Groq](/fa/providers/groq).
- وقتی از `provider: "deepgram"` استفاده شود، Deepgram از `DEEPGRAM_API_KEY` استفاده می‌کند.
- جزئیات راه‌اندازی Deepgram: [Deepgram (رونویسی صوتی)](/fa/providers/deepgram).
- جزئیات راه‌اندازی Mistral: [Mistral](/fa/providers/mistral).
- وقتی از `provider: "senseaudio"` استفاده شود، SenseAudio از `SENSEAUDIO_API_KEY` استفاده می‌کند.
- جزئیات راه‌اندازی SenseAudio: [SenseAudio](/fa/providers/senseaudio).
- ارائه‌دهندگان صوت می‌توانند `baseUrl`، `headers`، و `providerOptions` را از طریق `tools.media.audio` بازنویسی کنند.
- سقف اندازه پیش‌فرض 20MB است (`tools.media.audio.maxBytes`). صوت بزرگ‌تر از حد برای آن مدل رد می‌شود و ورودی بعدی امتحان می‌شود.
- فایل‌های صوتی بسیار کوچک/خالی کمتر از 1024 بایت پیش از رونویسی ارائه‌دهنده/CLI رد می‌شوند.
- مقدار پیش‌فرض `maxChars` برای صوت **تنظیم نشده** است (متن رونویسی کامل). برای کوتاه‌کردن خروجی، `tools.media.audio.maxChars` یا `maxChars` هر ورودی را تنظیم کنید.
- پیش‌فرض خودکار OpenAI برابر `gpt-4o-mini-transcribe` است؛ برای دقت بالاتر `model: "gpt-4o-transcribe"` را تنظیم کنید.
- برای پردازش چند یادداشت صوتی از `tools.media.audio.attachments` استفاده کنید (`mode: "all"` + `maxAttachments`).
- متن رونویسی با `{{Transcript}}` در قالب‌ها در دسترس است.
- `tools.media.audio.echoTranscript` به‌صورت پیش‌فرض خاموش است؛ آن را فعال کنید تا پیش از پردازش عامل، تأیید متن رونویسی به گفت‌وگوی مبدأ ارسال شود.
- `tools.media.audio.echoFormat` متن بازتاب را سفارشی می‌کند (placeholder: `{transcript}`).
- stdout در CLI محدود است (5MB)؛ خروجی CLI را مختصر نگه دارید.
- `args` در CLI باید از `{{MediaPath}}` برای مسیر فایل صوتی محلی استفاده کند. برای مهاجرت placeholderهای منسوخ `{input}` از پیکربندی‌های قدیمی‌تر `audio.transcription.command`، `openclaw doctor --fix` را اجرا کنید.

### پشتیبانی از محیط پروکسی

رونویسی صوتی مبتنی بر ارائه‌دهنده، متغیرهای محیطی استاندارد پروکسی خروجی را رعایت می‌کند:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پروکسی تنظیم نشده باشد، خروج مستقیم استفاده می‌شود. اگر پیکربندی پروکسی نادرست باشد، OpenClaw یک هشدار ثبت می‌کند و به دریافت مستقیم برمی‌گردد.

## تشخیص اشاره در گروه‌ها

وقتی `requireMention: true` برای یک گفت‌وگوی گروهی تنظیم شده باشد، OpenClaw اکنون صوت را **پیش از** بررسی اشاره‌ها رونویسی می‌کند. این کار اجازه می‌دهد یادداشت‌های صوتی حتی وقتی شامل اشاره‌ها هستند پردازش شوند.

**نحوه کار:**

1. اگر یک پیام صوتی بدنه متنی نداشته باشد و گروه به اشاره‌ها نیاز داشته باشد، OpenClaw یک رونویسی "preflight" انجام می‌دهد.
2. متن رونویسی برای الگوهای اشاره بررسی می‌شود (مثلاً `@BotName`، محرک‌های ایموجی).
3. اگر اشاره‌ای پیدا شود، پیام از خط لوله کامل پاسخ عبور می‌کند.
4. متن رونویسی برای تشخیص اشاره استفاده می‌شود تا یادداشت‌های صوتی بتوانند از دروازه اشاره عبور کنند.

**رفتار جایگزین:**

- اگر رونویسی هنگام preflight شکست بخورد (مهلت زمانی، خطای API، و غیره)، پیام بر اساس تشخیص اشاره فقط‌متنی پردازش می‌شود.
- این تضمین می‌کند پیام‌های ترکیبی (متن + صوت) هرگز به‌اشتباه حذف نشوند.

**انصراف برای هر گروه/موضوع Telegram:**

- برای ردکردن بررسی‌های اشاره متن رونویسی preflight برای آن گروه، `channels.telegram.groups.<chatId>.disableAudioPreflight: true` را تنظیم کنید.
- برای بازنویسی در سطح هر موضوع، `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` را تنظیم کنید (`true` برای ردکردن، `false` برای فعال‌سازی اجباری).
- پیش‌فرض `false` است (وقتی شرایط وابسته به اشاره برقرار باشد، preflight فعال است).

**مثال:** کاربری در یک گروه Telegram با `requireMention: true` یک یادداشت صوتی می‌فرستد که می‌گوید "Hey @Claude, what's the weather?". یادداشت صوتی رونویسی می‌شود، اشاره تشخیص داده می‌شود و عامل پاسخ می‌دهد.

## نکات احتیاطی

- قوانین دامنه از نخستین تطابق پیروی می‌کنند. `chatType` به `direct`، `group`، یا `room` نرمال‌سازی می‌شود.
- مطمئن شوید CLI شما با کد 0 خارج می‌شود و متن ساده چاپ می‌کند؛ JSON باید از طریق `jq -r .text` پردازش شود.
- برای `parakeet-mlx`، اگر `--output-dir` را پاس دهید، وقتی `--output-format` برابر `txt` باشد (یا حذف شده باشد)، OpenClaw فایل `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های خروجی غیر از `txt` به تجزیه stdout برمی‌گردند.
- برای جلوگیری از مسدودشدن صف پاسخ، مهلت‌های زمانی را منطقی نگه دارید (`timeoutSeconds`، پیش‌فرض 60s).
- رونویسی preflight فقط **نخستین** پیوست صوتی را برای تشخیص اشاره پردازش می‌کند. صوت‌های اضافی در مرحله اصلی درک رسانه پردازش می‌شوند.

## مرتبط

- [درک رسانه](/fa/nodes/media-understanding)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [بیدارسازی صوتی](/fa/nodes/voicewake)
