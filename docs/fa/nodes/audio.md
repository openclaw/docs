---
read_when:
    - تغییر رونویسی صوتی یا مدیریت رسانه
summary: نحوهٔ دانلود، رونویسی و تزریق یادداشت‌های صوتی/صدایی ورودی به پاسخ‌ها
title: صدا و یادداشت‌های صوتی
x-i18n:
    generated_at: "2026-06-27T18:02:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
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
- **تجزیه فرمان**: وقتی رونویسی موفق باشد، `CommandBody`/`RawBody` روی متن رونویسی‌شده تنظیم می‌شوند تا فرمان‌های اسلش همچنان کار کنند.
- **ثبت گزارش تفصیلی**: در `--verbose`، هنگام اجرای رونویسی و هنگام جایگزین شدن بدنه، آن را ثبت می‌کنیم.

## شناسایی خودکار (پیش‌فرض)

اگر **مدل‌ها را پیکربندی نکنید** و `tools.media.audio.enabled` روی `false` تنظیم **نشده باشد**،
OpenClaw به این ترتیب شناسایی خودکار انجام می‌دهد و در نخستین گزینه قابل استفاده متوقف می‌شود:

1. **مدل پاسخ فعال** وقتی ارائه‌دهنده آن از درک صوت پشتیبانی کند.
2. **CLIهای محلی** (اگر نصب باشند)
   - `sherpa-onnx-offline` (به `SHERPA_ONNX_MODEL_DIR` همراه با encoder/decoder/joiner/tokens نیاز دارد)
   - `whisper-cli` (از `whisper-cpp`؛ از `WHISPER_CPP_MODEL` یا مدل tiny همراه استفاده می‌کند)
   - `whisper` (CLI پایتون؛ مدل‌ها را به‌صورت خودکار دانلود می‌کند)
3. **احراز هویت ارائه‌دهنده**
   - ورودی‌های پیکربندی‌شده `models.providers.*` که از صوت پشتیبانی می‌کنند، ابتدا امتحان می‌شوند
   - ترتیب جایگزینی ارائه‌دهنده: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

از 2026-05-22، شناسایی خودکار Gemini CLI دیگر برای درک رسانه پشتیبانی نمی‌شود. Google کاربران Gemini CLI را به Antigravity CLI منتقل می‌کند؛ صوت باید از رونویسی محلی یا ارائه‌دهنده استفاده کند، در حالی که جایگزین CLI برای تصویر/ویدیو باید به Antigravity CLI (`agy`) منتقل شود.

برای غیرفعال کردن شناسایی خودکار، `tools.media.audio.enabled: false` را تنظیم کنید.
برای سفارشی‌سازی، `tools.media.audio.models` را تنظیم کنید.
نکته: شناسایی باینری در macOS/Linux/Windows به‌صورت best-effort است؛ مطمئن شوید CLI در `PATH` قرار دارد (ما `~` را گسترش می‌دهیم)، یا یک مدل CLI صریح با مسیر کامل فرمان تنظیم کنید.

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

### فقط ارائه‌دهنده با کنترل دامنه

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

### بازتاب متن رونویسی‌شده به چت (اختیاری)

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
- وقتی `provider: "deepgram"` استفاده شود، Deepgram مقدار `DEEPGRAM_API_KEY` را دریافت می‌کند.
- جزئیات راه‌اندازی Deepgram: [Deepgram (رونویسی صوت)](/fa/providers/deepgram).
- جزئیات راه‌اندازی Mistral: [Mistral](/fa/providers/mistral).
- وقتی `provider: "senseaudio"` استفاده شود، SenseAudio مقدار `SENSEAUDIO_API_KEY` را دریافت می‌کند.
- جزئیات راه‌اندازی SenseAudio: [SenseAudio](/fa/providers/senseaudio).
- ارائه‌دهندگان صوت می‌توانند `baseUrl`، `headers` و `providerOptions` را از طریق `tools.media.audio` بازنویسی کنند.
- سقف اندازه پیش‌فرض 20MB است (`tools.media.audio.maxBytes`). صوت بزرگ‌تر از سقف برای آن مدل رد می‌شود و ورودی بعدی امتحان می‌شود.
- فایل‌های صوتی بسیار کوچک/خالی کمتر از 1024 بایت پیش از رونویسی ارائه‌دهنده/CLI رد می‌شوند.
- مقدار پیش‌فرض `maxChars` برای صوت **تنظیم نشده است** (متن کامل رونویسی). برای کوتاه کردن خروجی، `tools.media.audio.maxChars` یا `maxChars` در هر ورودی را تنظیم کنید.
- پیش‌فرض خودکار OpenAI برابر `gpt-4o-mini-transcribe` است؛ برای دقت بالاتر، `model: "gpt-4o-transcribe"` را تنظیم کنید.
- برای پردازش چند یادداشت صوتی از `tools.media.audio.attachments` استفاده کنید (`mode: "all"` + `maxAttachments`).
- متن رونویسی‌شده در قالب‌ها به‌صورت `{{Transcript}}` در دسترس است.
- `tools.media.audio.echoTranscript` به‌صورت پیش‌فرض خاموش است؛ آن را فعال کنید تا پیش از پردازش عامل، تأیید متن رونویسی‌شده به چت مبدأ ارسال شود.
- `tools.media.audio.echoFormat` متن بازتاب را سفارشی می‌کند (جای‌نگهدار: `{transcript}`).
- stdout در CLI محدود است (5MB)؛ خروجی CLI را مختصر نگه دارید.
- `args` در CLI باید از `{{MediaPath}}` برای مسیر فایل صوتی محلی استفاده کند. برای مهاجرت جای‌نگهدارهای منسوخ `{input}` از پیکربندی‌های قدیمی‌تر `audio.transcription.command`، `openclaw doctor --fix` را اجرا کنید.

### پشتیبانی از محیط پروکسی

رونویسی صوت مبتنی بر ارائه‌دهنده به متغیرهای محیطی استاندارد پروکسی خروجی احترام می‌گذارد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

اگر هیچ متغیر محیطی پروکسی تنظیم نشده باشد، خروج مستقیم استفاده می‌شود. اگر پیکربندی پروکسی نادرست باشد، OpenClaw یک هشدار ثبت می‌کند و به دریافت مستقیم برمی‌گردد.

## شناسایی منشن در گروه‌ها

وقتی `requireMention: true` برای یک چت گروهی تنظیم شده باشد، OpenClaw اکنون صوت را **پیش از** بررسی منشن‌ها رونویسی می‌کند. این اجازه می‌دهد یادداشت‌های صوتی حتی وقتی شامل منشن هستند پردازش شوند.

**نحوه کار:**

1. اگر یک پیام صوتی بدنه متنی نداشته باشد و گروه به منشن نیاز داشته باشد، OpenClaw یک رونویسی "preflight" انجام می‌دهد.
2. متن رونویسی‌شده برای الگوهای منشن بررسی می‌شود (مثلاً `@BotName`، محرک‌های ایموجی).
3. اگر منشن پیدا شود، پیام وارد پایپ‌لاین کامل پاسخ می‌شود.
4. متن رونویسی‌شده برای شناسایی منشن استفاده می‌شود تا یادداشت‌های صوتی بتوانند از گیت منشن عبور کنند.

**رفتار جایگزین:**

- اگر رونویسی در طول preflight شکست بخورد (مهلت زمانی، خطای API و غیره)، پیام بر اساس شناسایی منشن فقط‌متنی پردازش می‌شود.
- این تضمین می‌کند پیام‌های ترکیبی (متن + صوت) هرگز به‌اشتباه کنار گذاشته نشوند.

**انصراف برای هر گروه/موضوع Telegram:**

- برای رد کردن بررسی‌های منشن متن رونویسی‌شده در preflight برای آن گروه، `channels.telegram.groups.<chatId>.disableAudioPreflight: true` را تنظیم کنید.
- برای بازنویسی در سطح موضوع، `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` را تنظیم کنید (`true` برای رد کردن، `false` برای اجبار به فعال‌سازی).
- مقدار پیش‌فرض `false` است (وقتی شرایط وابسته به گیت منشن برقرار باشد، preflight فعال است).

**مثال:** کاربری در یک گروه Telegram با `requireMention: true` یک یادداشت صوتی می‌فرستد که می‌گوید "Hey @Claude, what's the weather?". یادداشت صوتی رونویسی می‌شود، منشن شناسایی می‌شود، و عامل پاسخ می‌دهد.

## نکات مهم

- قواعد دامنه از نخستین تطابق برنده استفاده می‌کنند. `chatType` به `direct`، `group` یا `room` نرمال‌سازی می‌شود.
- مطمئن شوید CLI شما با کد 0 خارج می‌شود و متن ساده چاپ می‌کند؛ JSON باید از طریق `jq -r .text` پردازش شود.
- برای `parakeet-mlx`، اگر `--output-dir` را پاس دهید، وقتی `--output-format` برابر `txt` باشد (یا حذف شده باشد)، OpenClaw مقدار `<output-dir>/<media-basename>.txt` را می‌خواند؛ قالب‌های خروجی غیر از `txt` به تجزیه stdout برمی‌گردند.
- مهلت‌های زمانی را منطقی نگه دارید (`timeoutSeconds`، پیش‌فرض 60s) تا از مسدود شدن صف پاسخ جلوگیری شود.
- رونویسی preflight فقط **نخستین** پیوست صوتی را برای شناسایی منشن پردازش می‌کند. صوت‌های اضافی در مرحله اصلی درک رسانه پردازش می‌شوند.

## مرتبط

- [درک رسانه](/fa/nodes/media-understanding)
- [حالت گفتگو](/fa/nodes/talk)
- [بیدارباش صوتی](/fa/nodes/voicewake)
