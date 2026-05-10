---
read_when:
    - فعال‌سازی تبدیل متن به گفتار برای پاسخ‌ها
    - پیکربندی ارائه‌دهندهٔ TTS، زنجیرهٔ جایگزین، یا پرسونا
    - استفاده از فرمان‌ها یا دستورالعمل‌های /tts
sidebarTitle: Text to speech (TTS)
summary: تبدیل متن به گفتار برای پاسخ‌های خروجی — ارائه‌دهندگان، پرسوناها، دستورهای اسلش، و خروجی به‌ازای هر کانال
title: تبدیل متن به گفتار
x-i18n:
    generated_at: "2026-05-10T20:13:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9beda419aa5171c7907a238d008bcab7e67e63900a7cadbe289e58c5585a564
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw می‌تواند پاسخ‌های خروجی را با استفاده از **14 ارائه‌دهندهٔ گفتار** به صدا تبدیل کند
و پیام‌های صوتی بومی را در Feishu، Matrix، Telegram و WhatsApp،
پیوست‌های صوتی را در سایر جاها، و جریان‌های PCM/Ulaw را برای تلفنی و Talk ارسال کند.

TTS نیمهٔ خروجی گفتار در حالت `stt-tts` متعلق به Talk است. نشست‌های Talk از نوع
`realtime` بومیِ ارائه‌دهنده، گفتار را به‌جای فراخوانی این مسیر TTS، درون ارائه‌دهندهٔ realtime
تولید می‌کنند، در حالی که نشست‌های `transcription` پاسخ صوتی دستیار را تولید نمی‌کنند.

## شروع سریع

<Steps>
  <Step title="Pick a provider">
    OpenAI و ElevenLabs قابل‌اعتمادترین گزینه‌های میزبانی‌شده هستند. Microsoft و
    Local CLI بدون کلید API کار می‌کنند. برای فهرست کامل، [ماتریس ارائه‌دهندگان](#supported-providers)
    را ببینید.
  </Step>
  <Step title="Set the API key">
    متغیر محیطی ارائه‌دهندهٔ خود را export کنید (برای مثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). Microsoft و Local CLI به کلید نیاز ندارند.
  </Step>
  <Step title="Enable in config">
    `messages.tts.auto: "always"` و `messages.tts.provider` را تنظیم کنید:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Try it in chat">
    `/tts status` وضعیت فعلی را نشان می‌دهد. `/tts audio Hello from OpenClaw`
    یک پاسخ صوتی یک‌باره می‌فرستد.
  </Step>
</Steps>

<Note>
Auto-TTS به‌طور پیش‌فرض **خاموش** است. وقتی `messages.tts.provider` تنظیم نشده باشد،
OpenClaw نخستین ارائه‌دهندهٔ پیکربندی‌شده را طبق ترتیب انتخاب خودکار رجیستری انتخاب می‌کند.
ابزار agent داخلی `tts` فقط برای نیت صریح است: گفت‌وگوی عادی به‌صورت
متنی می‌ماند مگر اینکه کاربر درخواست صدا کند، از `/tts` استفاده کند، یا گفتار
Auto-TTS/دستورالعملی را فعال کند.
</Note>

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده       | احراز هویت                                                                                                       | یادداشت‌ها                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (همچنین `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | خروجی پیام صوتی بومی Ogg/Opus و تلفنی.                                                     |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS سازگار با OpenAI. پیش‌فرض `hexgrad/Kokoro-82M` است.                                     |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` یا `XI_API_KEY`                                                                             | شبیه‌سازی صدا، چندزبانه، قطعی از طریق `seed`؛ برای پخش صوتی Discord به‌صورت جریانی.        |
| **Google Gemini** | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                                                                             | TTS دسته‌ای Gemini API؛ آگاه از پرسونا از طریق `promptTemplate: "audio-profile-v1"`.        |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | خروجی پیام صوتی و تلفنی.                                                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API جریانی TTS. پیام صوتی بومی Opus و تلفنی PCM.                                           |
| **Local CLI**     | ندارد                                                                                                            | یک فرمان محلی پیکربندی‌شدهٔ TTS را اجرا می‌کند.                                            |
| **Microsoft**     | ندارد                                                                                                            | TTS عصبی عمومی Edge از طریق `node-edge-tts`. بهترین تلاش، بدون SLA.                        |
| **MiniMax**       | `MINIMAX_API_KEY` (یا Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. پیش‌فرض `speech-2.8-hd` است.                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | همچنین برای خلاصه‌سازی خودکار استفاده می‌شود؛ از `instructions` پرسونا پشتیبانی می‌کند.   |
| **OpenRouter**    | `OPENROUTER_API_KEY` (می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند)                      | مدل پیش‌فرض `hexgrad/kokoro-82m`.                                                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token قدیمی: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP متعلق به BytePlus Seed Speech.                                                     |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ارائه‌دهندهٔ مشترک تصویر، ویدئو، و گفتار.                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دسته‌ای xAI. پیام صوتی بومی Opus پشتیبانی **نمی‌شود**.                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS مربوط به MiMo از طریق تکمیل‌های گفت‌وگوی Xiaomi.                                       |

اگر چند ارائه‌دهنده پیکربندی شده باشند، ابتدا ارائه‌دهندهٔ انتخاب‌شده استفاده می‌شود و
بقیه گزینه‌های جایگزین هستند. خلاصه‌سازی خودکار از `summaryModel` (یا
`agents.defaults.model.primary`) استفاده می‌کند، بنابراین اگر خلاصه‌سازی را فعال نگه می‌دارید،
آن ارائه‌دهنده نیز باید احراز هویت شده باشد.

<Warning>
ارائه‌دهندهٔ همراه **Microsoft** از سرویس آنلاین TTS عصبی Microsoft Edge
از طریق `node-edge-tts` استفاده می‌کند. این یک سرویس وب عمومی بدون SLA
یا سهمیهٔ منتشرشده است؛ آن را بهترین تلاش در نظر بگیرید. شناسهٔ قدیمی ارائه‌دهنده `edge`
به `microsoft` نرمال‌سازی می‌شود و `openclaw doctor --fix` پیکربندی
ذخیره‌شده را بازنویسی می‌کند؛ پیکربندی‌های جدید همیشه باید از `microsoft` استفاده کنند.
</Warning>

## پیکربندی

پیکربندی TTS زیر `messages.tts` در `~/.openclaw/openclaw.json` قرار دارد. یک
preset انتخاب کنید و بلوک ارائه‌دهنده را سازگار کنید:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### بازنویسی‌های صدای هر agent

وقتی یک agent باید با ارائه‌دهنده، صدا، مدل، پرسونا، یا حالت Auto-TTS متفاوتی صحبت کند،
از `agents.list[].tts` استفاده کنید. بلوک agent به‌صورت deep-merge روی
`messages.tts` اعمال می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده می‌توانند در پیکربندی سراسری ارائه‌دهنده باقی بمانند:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

برای تثبیت یک پرسونای مخصوص هر عامل، `agents.list[].tts.persona` را در کنار پیکربندی ارائه‌دهنده تنظیم کنید؛ این مقدار `messages.tts.persona` سراسری را فقط برای همان عامل بازنویسی می‌کند.

ترتیب تقدم برای پاسخ‌های خودکار، `/tts audio`، `/tts status` و ابزار عامل `tts`:

1. `messages.tts`
2. `agents.list[].tts` فعال
3. بازنویسی کانال، وقتی کانال از `channels.<channel>.tts` پشتیبانی می‌کند
4. بازنویسی حساب، وقتی کانال `channels.<channel>.accounts.<id>.tts` را عبور می‌دهد
5. ترجیحات محلی `/tts` برای این میزبان
6. دستورهای درون‌خطی `[[tts:...]]` وقتی [لغوهای مدل](#model-driven-directives) فعال باشند

بازنویسی‌های کانال و حساب همان شکل `messages.tts` را دارند و به‌صورت عمیق روی لایه‌های قبلی ادغام می‌شوند؛ بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده می‌توانند در `messages.tts` بمانند، در حالی که یک کانال یا حساب ربات فقط صدا، مدل، پرسونا یا حالت خودکار را تغییر می‌دهد:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## پرسوناها

**پرسونا** یک هویت گفتاری پایدار است که می‌تواند به‌صورت قطعی در میان ارائه‌دهنده‌ها اعمال شود. پرسونا می‌تواند یک ارائه‌دهنده را ترجیح دهد، نیت پرامپت مستقل از ارائه‌دهنده را تعریف کند، و اتصال‌های اختصاصی هر ارائه‌دهنده برای صداها، مدل‌ها، الگوهای پرامپت، seedها و تنظیمات صدا را همراه داشته باشد.

### پرسونای حداقلی

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### پرسونای کامل (پرامپت مستقل از ارائه‌دهنده)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### تفکیک پرسونا

پرسونای فعال به‌صورت قطعی انتخاب می‌شود:

1. ترجیح محلی `/tts persona <id>`، اگر تنظیم شده باشد.
2. `messages.tts.persona`، اگر تنظیم شده باشد.
3. بدون پرسونا.

انتخاب ارائه‌دهنده با تقدم موارد صریح اجرا می‌شود:

1. بازنویسی‌های مستقیم (CLI، Gateway، Talk، دستورهای مجاز TTS).
2. ترجیح محلی `/tts provider <id>`.
3. `provider` پرسونای فعال.
4. `messages.tts.provider`.
5. انتخاب خودکار رجیستری.

برای هر تلاش ارائه‌دهنده، OpenClaw پیکربندی‌ها را با این ترتیب ادغام می‌کند:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. بازنویسی‌های مورد اعتماد درخواست
4. بازنویسی‌های مجاز دستور TTS تولیدشده توسط مدل

### ارائه‌دهنده‌ها چگونه از پرامپت‌های پرسونا استفاده می‌کنند

فیلدهای پرامپت پرسونا (`profile`، `scene`، `sampleContext`، `style`، `accent`، `pacing`، `constraints`) **مستقل از ارائه‌دهنده** هستند. هر ارائه‌دهنده تصمیم می‌گیرد چگونه از آن‌ها استفاده کند:

<AccordionGroup>
  <Accordion title="Google Gemini">
    فیلدهای پرامپت پرسونا را **فقط وقتی** پیکربندی مؤثر ارائه‌دهنده Google مقدار `promptTemplate: "audio-profile-v1"` یا `personaPrompt` را تنظیم کرده باشد، در ساختار پرامپت Gemini TTS می‌پیچد. فیلدهای قدیمی‌تر `audioProfile` و `speakerName` همچنان به‌عنوان متن پرامپت اختصاصی Google در ابتدا افزوده می‌شوند. تگ‌های صوتی درون‌خطی مانند `[whispers]` یا `[laughs]` داخل یک بلوک `[[tts:text]]` در رونوشت Gemini حفظ می‌شوند؛ OpenClaw این تگ‌ها را تولید نمی‌کند.
  </Accordion>
  <Accordion title="OpenAI">
    فیلدهای پرامپت پرسونا را **فقط وقتی** هیچ `instructions` صریحی برای OpenAI پیکربندی نشده باشد، به فیلد درخواست `instructions` نگاشت می‌کند. `instructions` صریح همیشه مقدم است.
  </Accordion>
  <Accordion title="سایر ارائه‌دهنده‌ها">
    فقط از اتصال‌های اختصاصی ارائه‌دهنده برای پرسونا در `personas.<id>.providers.<provider>` استفاده می‌کنند. فیلدهای پرامپت پرسونا نادیده گرفته می‌شوند، مگر اینکه ارائه‌دهنده نگاشت پرامپت پرسونا مخصوص خود را پیاده‌سازی کند.
  </Accordion>
</AccordionGroup>

### سیاست بازگشت

`fallbackPolicy` رفتار را وقتی یک پرسونا برای ارائه‌دهنده مورد تلاش **هیچ اتصالی ندارد** کنترل می‌کند:

| سیاست              | رفتار                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **پیش‌فرض.** فیلدهای پرامپت مستقل از ارائه‌دهنده در دسترس می‌مانند؛ ارائه‌دهنده ممکن است از آن‌ها استفاده کند یا آن‌ها را نادیده بگیرد.                                            |
| `provider-defaults` | پرسونا از آماده‌سازی پرامپت برای آن تلاش حذف می‌شود؛ ارائه‌دهنده از پیش‌فرض‌های خنثای خود استفاده می‌کند، در حالی که بازگشت به ارائه‌دهنده‌های دیگر ادامه می‌یابد. |
| `fail`              | آن تلاش ارائه‌دهنده را با `reasonCode: "not_configured"` و `personaBinding: "missing"` رد می‌کند. ارائه‌دهنده‌های بازگشتی همچنان امتحان می‌شوند.              |

کل درخواست TTS فقط وقتی ناموفق می‌شود که **همه** ارائه‌دهنده‌های امتحان‌شده رد شوند یا شکست بخورند.

انتخاب ارائه‌دهنده نشست Talk در محدوده همان نشست است. یک کارخواه Talk باید شناسه‌های ارائه‌دهنده، شناسه‌های مدل، شناسه‌های صدا و محلی‌سازی‌ها را از `talk.catalog` انتخاب کند و آن‌ها را از طریق نشست Talk یا درخواست handoff عبور دهد. باز کردن یک نشست صوتی نباید `messages.tts` یا پیش‌فرض‌های سراسری ارائه‌دهنده Talk را تغییر دهد.

## دستورهای هدایت‌شده توسط مدل

به‌صورت پیش‌فرض، دستیار **می‌تواند** دستورهای `[[tts:...]]` را برای بازنویسی صدا، مدل یا سرعت برای یک پاسخ واحد تولید کند، همراه با یک بلوک اختیاری `[[tts:text]]...[[/tts:text]]` برای نشانه‌های بیانی که باید فقط در صوت ظاهر شوند:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

وقتی `messages.tts.auto` برابر `"tagged"` باشد، برای فعال‌سازی صوت **دستورها الزامی هستند**. تحویل بلوک جریانی، دستورها را پیش از دیده شدن توسط کانال از متن قابل‌مشاهده حذف می‌کند، حتی وقتی میان بلوک‌های مجاور تقسیم شده باشند.

`provider=...` نادیده گرفته می‌شود مگر اینکه `modelOverrides.allowProvider: true` باشد. وقتی یک پاسخ `provider=...` را اعلام می‌کند، کلیدهای دیگر در آن دستور فقط توسط همان ارائه‌دهنده پردازش می‌شوند؛ کلیدهای پشتیبانی‌نشده حذف می‌شوند و به‌عنوان هشدارهای دستور TTS گزارش می‌شوند.

**کلیدهای دستور در دسترس:**

- `provider` (شناسه ارائه‌دهنده ثبت‌شده؛ نیازمند `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`، `similarityBoost`، `style`، `speed`، `useSpeakerBoost`
- `vol` / `volume` (حجم صدای MiniMax، 0–10)
- `pitch` (زیر و بمی عدد صحیح MiniMax، −12 تا 12؛ مقادیر اعشاری بریده می‌شوند)
- `emotion` (تگ احساس Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**غیرفعال کردن کامل لغوهای مدل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**اجازه دادن به جابه‌جایی ارائه‌دهنده با قابل‌پیکربندی نگه داشتن سایر تنظیمات:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## دستورهای اسلش

دستور واحد `/tts`. در Discord، OpenClaw همچنین `/voice` را ثبت می‌کند، چون `/tts` یک دستور داخلی Discord است؛ متن `/tts ...` همچنان کار می‌کند.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
دستورها به یک فرستنده مجاز نیاز دارند (قواعد allowlist/مالک اعمال می‌شود) و یا `commands.text` یا ثبت دستور بومی باید فعال باشد.
</Note>

نکات رفتاری:

- `/tts on` ترجیح محلی TTS را روی `always` می‌نویسد؛ `/tts off` آن را روی `off` می‌نویسد.
- `/tts chat on|off|default` یک بازنویسی auto-TTS در محدوده نشست برای گفت‌وگوی فعلی می‌نویسد.
- `/tts persona <id>` ترجیح محلی پرسونا را می‌نویسد؛ `/tts persona off` آن را پاک می‌کند.
- `/tts latest` آخرین پاسخ دستیار را از رونوشت نشست فعلی می‌خواند و آن را یک‌بار به‌صورت صوتی می‌فرستد. فقط یک هش از آن پاسخ را روی ورودی نشست ذخیره می‌کند تا ارسال‌های صوتی تکراری سرکوب شوند.
- `/tts audio` یک پاسخ صوتی یک‌باره تولید می‌کند (TTS را روشن نمی‌کند).
- `limit` و `summary` در **ترجیحات محلی** ذخیره می‌شوند، نه در پیکربندی اصلی.
- `/tts status` شامل عیب‌یابی بازگشت برای آخرین تلاش است: `Fallback: <primary> -> <used>`، `Attempts: ...`، و جزئیات هر تلاش (`provider:outcome(reasonCode) latency`).
- `/status` وقتی TTS فعال باشد، حالت فعال TTS به‌همراه ارائه‌دهنده، مدل، صدا و فراداده پاک‌سازی‌شده endpoint سفارشی پیکربندی‌شده را نشان می‌دهد.

## ترجیحات هر کاربر

دستورهای اسلش بازنویسی‌های محلی را در `prefsPath` می‌نویسند. مقدار پیش‌فرض `~/.openclaw/settings/tts.json` است؛ آن را با متغیر محیطی `OPENCLAW_TTS_PREFS` یا `messages.tts.prefsPath` بازنویسی کنید.

| فیلد ذخیره‌شده | اثر                                       |
| ------------ | -------------------------------------------- |
| `auto`       | بازنویسی محلی auto-TTS (`always`، `off`، …) |
| `provider`   | بازنویسی ارائه‌دهنده اصلی محلی              |
| `persona`    | بازنویسی پرسونای محلی                       |
| `maxLength`  | آستانه خلاصه‌سازی (پیش‌فرض `1500` نویسه)     |
| `summarize`  | کلید روشن/خاموش خلاصه‌سازی (پیش‌فرض `true`)              |

این موارد پیکربندی مؤثر از `messages.tts` به‌علاوه بلوک فعال `agents.list[].tts` برای آن میزبان را بازنویسی می‌کنند.

## قالب‌های خروجی (ثابت)

تحویل صدای TTS توسط قابلیت کانال هدایت می‌شود. Pluginهای کانال اعلام می‌کنند که آیا TTS به سبک پیام صوتی باید از ارائه‌دهنده‌ها هدف بومی `voice-note` را بخواهد یا سنتز عادی `audio-file` را حفظ کند و فقط خروجی سازگار را برای تحویل صوتی علامت‌گذاری کند.

- **کانال‌های دارای قابلیت یادداشت صوتی**: پاسخ‌های یادداشت صوتی Opus را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI).
  - 48kHz / 64kbps مصالحه‌ی خوبی برای پیام صوتی است.
- **Feishu / WhatsApp**: وقتی یک پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A
  یا فایل صوتی محتمل دیگری تولید شود، Plugin کانال پیش از ارسال پیام صوتی بومی،
  آن را با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌کند. WhatsApp نتیجه را
  از طریق payload صوتی Baileys با `ptt: true` و
  `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد، Feishu فایل اصلی
  را به‌عنوان پیوست دریافت می‌کند؛ ارسال WhatsApp به‌جای ارسال payload ناسازگار
  PTT ناموفق می‌شود.
- **کانال‌های دیگر**: MP3 (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI).
  - 44.1kHz / 128kbps توازن پیش‌فرض برای وضوح گفتار است.
- **MiniMax**: MP3 (مدل `speech-2.8-hd`، نرخ نمونه‌برداری 32kHz) برای پیوست‌های صوتی معمولی. برای مقصدهای یادداشت صوتی اعلام‌شده از سوی کانال، وقتی کانال تبدیل را اعلام کند، OpenClaw پیش از تحویل، MP3 تولیدشده توسط MiniMax را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **Xiaomi MiMo**: به‌طور پیش‌فرض MP3، یا در صورت پیکربندی WAV. برای مقصدهای یادداشت صوتی اعلام‌شده از سوی کانال، وقتی کانال تبدیل را اعلام کند، OpenClaw پیش از تحویل، خروجی Xiaomi را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **CLI محلی**: از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی
  به Ogg/Opus تبدیل می‌شوند و خروجی تلفنی با `ffmpeg` به PCM تک‌کاناله‌ی خام 16 kHz
  تبدیل می‌شود.
- **Google Gemini**: TTS در Gemini API، PCM خام 24kHz برمی‌گرداند. OpenClaw آن را برای پیوست‌های صوتی به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48kHz تبدیل می‌کند، و برای Talk/تلفنی مستقیماً PCM برمی‌گرداند.
- **Gradium**: WAV برای پیوست‌های صوتی، Opus برای مقصدهای یادداشت صوتی، و `ulaw_8000` با 8 kHz برای تلفنی.
- **Inworld**: MP3 برای پیوست‌های صوتی معمولی، `OGG_OPUS` بومی برای مقصدهای یادداشت صوتی، و `PCM` خام با 22050 Hz برای Talk/تلفنی.
- **xAI**: به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3`، `wav`، `pcm`، `mulaw` یا `alaw` باشد. OpenClaw از endpoint دسته‌ای REST TTS در xAI استفاده می‌کند و یک پیوست صوتی کامل برمی‌گرداند؛ WebSocket مربوط به TTS جریانی xAI در این مسیر ارائه‌دهنده استفاده نمی‌شود. قالب بومی Opus برای یادداشت صوتی در این مسیر پشتیبانی نمی‌شود.
- **Microsoft**: از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).
  - انتقال همراه، یک `outputFormat` می‌پذیرد، اما همه‌ی قالب‌ها از سرویس در دسترس نیستند.
  - مقادیر قالب خروجی از قالب‌های خروجی Microsoft Speech پیروی می‌کنند (از جمله Ogg/WebM Opus).
  - `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus
    تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید.
  - اگر قالب خروجی پیکربندی‌شده‌ی Microsoft ناموفق باشد، OpenClaw با MP3 دوباره تلاش می‌کند.

قالب‌های خروجی OpenAI/ElevenLabs برای هر کانال ثابت هستند (بالا را ببینید).

## رفتار Auto-TTS

وقتی `messages.tts.auto` فعال باشد، OpenClaw:

- اگر پاسخ از قبل شامل رسانه یا دستور `MEDIA:` باشد، TTS را رد می‌کند.
- پاسخ‌های بسیار کوتاه را رد می‌کند (کمتر از 10 نویسه).
- وقتی خلاصه‌ها فعال باشند، پاسخ‌های طولانی را با استفاده از
  `summaryModel` (یا `agents.defaults.model.primary`) خلاصه می‌کند.
- صوت تولیدشده را به پاسخ پیوست می‌کند.
- در `mode: "final"`، همچنان پس از کامل شدن جریان متن، TTS فقط‌صوتی را برای پاسخ‌های نهایی جریانی
  ارسال می‌کند؛ رسانه‌ی تولیدشده از همان عادی‌سازی رسانه‌ی کانال
  مانند پیوست‌های پاسخ معمولی عبور می‌کند.

اگر پاسخ از `maxLength` فراتر برود و خلاصه خاموش باشد (یا کلید API برای
مدل خلاصه وجود نداشته باشد)، صوت رد می‌شود و پاسخ متنی معمولی ارسال می‌شود.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## قالب‌های خروجی بر اساس کانال

  | هدف                                  | قالب                                                                                                                                      |
  | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | پاسخ‌های پیام صوتی ترجیحاً از **Opus** (`opus_48000_64` از ElevenLabs، `opus` از OpenAI) استفاده می‌کنند. 48 kHz / 64 kbps وضوح و حجم را متعادل می‌کند. |
  | کانال‌های دیگر                       | **MP3** (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI). 44.1 kHz / 128 kbps پیش‌فرض برای گفتار است.                                      |
  | Talk / تلفنی                         | **PCM** بومیِ ارائه‌دهنده (Inworld 22050 Hz، Google 24 kHz)، یا `ulaw_8000` از Gradium برای تلفنی.                                         |

  نکات هر ارائه‌دهنده:

  - **تبدیل Feishu / WhatsApp:** وقتی پاسخ پیام صوتی به‌صورت MP3/WebM/WAV/M4A وارد می‌شود، Plugin کانال آن را با `ffmpeg` به Ogg/Opus با 48 kHz تبدیل می‌کند. WhatsApp از طریق Baileys با `ptt: true` و `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد: Feishu به پیوست‌کردن فایل اصلی بازمی‌گردد؛ ارسال WhatsApp به‌جای انتشار یک بارِ PTT ناسازگار، ناموفق می‌شود.
  - **MiniMax / Xiaomi MiMo:** پیش‌فرض MP3 است (32 kHz برای MiniMax `speech-2.8-hd`)؛ برای مقصدهای پیام صوتی از طریق `ffmpeg` به Opus با 48 kHz تبدیل می‌شود.
  - **CLI محلی:** از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای پیام صوتی به Ogg/Opus و خروجی تلفنی به PCM خامِ تک‌کاناله با 16 kHz تبدیل می‌شوند.
  - **Google Gemini:** PCM خام با 24 kHz برمی‌گرداند. OpenClaw برای پیوست‌ها آن را به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای پیام صوتی به Opus با 48 kHz تبدیل می‌کند، و برای Talk/تلفنی مستقیماً PCM برمی‌گرداند.
  - **Inworld:** پیوست‌های MP3، پیام صوتی بومی `OGG_OPUS`، PCM خام `PCM` با 22050 Hz برای Talk/تلفنی.
  - **xAI:** به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3|wav|pcm|mulaw|alaw` باشد. از نقطه پایانی REST دسته‌ای xAI استفاده می‌کند - TTS جریانی WebSocket استفاده **نمی‌شود**. قالب بومی پیام صوتی Opus پشتیبانی **نمی‌شود**.
  - **Microsoft:** از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید. اگر قالب پیکربندی‌شده Microsoft ناموفق باشد، OpenClaw با MP3 دوباره تلاش می‌کند.

  قالب‌های خروجی OpenAI و ElevenLabs برای هر کانال همان‌طور که در بالا فهرست شده‌اند ثابت هستند.

  ## مرجع فیلدها

  <AccordionGroup>
  <Accordion title="messages.tts.* سطح بالا">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      حالت TTS خودکار. `inbound` فقط پس از یک پیام صوتی ورودی صدا ارسال می‌کند؛ `tagged` فقط وقتی صدا ارسال می‌کند که پاسخ شامل دستورهای `[[tts:...]]` یا یک بلوک `[[tts:text]]` باشد.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      کلید قدیمی. `openclaw doctor --fix` آن را به `auto` مهاجرت می‌دهد.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` علاوه بر پاسخ‌های نهایی، پاسخ‌های ابزار/بلوک را هم شامل می‌شود.
    </ParamField>
    <ParamField path="provider" type="string">
      شناسه ارائه‌دهنده گفتار. وقتی تنظیم نشده باشد، OpenClaw نخستین ارائه‌دهنده پیکربندی‌شده را طبق ترتیب انتخاب خودکار رجیستری استفاده می‌کند. `provider: "edge"` قدیمی توسط `openclaw doctor --fix` به `"microsoft"` بازنویسی می‌شود.
    </ParamField>
    <ParamField path="persona" type="string">
      شناسه پرسونای فعال از `personas`. به حروف کوچک نرمال‌سازی می‌شود.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هویت گفتاری پایدار. فیلدها: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. [پرسوناها](#personas) را ببینید.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      مدل ارزان برای خلاصه‌سازی خودکار؛ پیش‌فرض `agents.defaults.model.primary` است. `provider/model` یا نام مستعار مدل پیکربندی‌شده را می‌پذیرد.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      به مدل اجازه می‌دهد دستورهای TTS تولید کند. `enabled` به‌طور پیش‌فرض `true` است؛ `allowProvider` به‌طور پیش‌فرض `false` است.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      تنظیمات متعلق به ارائه‌دهنده که با شناسه ارائه‌دهنده گفتار کلیدگذاری شده‌اند. بلوک‌های مستقیم قدیمی (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`) توسط `openclaw doctor --fix` بازنویسی می‌شوند؛ فقط `messages.tts.providers.<id>` را commit کنید.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      سقف سخت برای تعداد نویسه‌های ورودی TTS. اگر از آن فراتر رود، `/tts audio` ناموفق می‌شود.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلت درخواست بر حسب میلی‌ثانیه.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      مسیر JSON تنظیمات محلی را بازنویسی می‌کند (ارائه‌دهنده/محدودیت/خلاصه). پیش‌فرض `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقه Azure Speech (مثلاً `eastus`). Env: `AZURE_SPEECH_REGION` یا `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">بازنویسی اختیاری نقطه پایانی Azure Speech (نام مستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName صدای Azure. پیش‌فرض `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">کد زبان SSML. پیش‌فرض `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` برای صدای استاندارد. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` برای خروجی پیام صوتی. پیش‌فرض `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">به `ELEVENLABS_API_KEY` یا `XI_API_KEY` بازمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل (مثلاً `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">شناسه صدای ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (هرکدام `0..1`)، `useSpeakerBoost` (`true|false`)، `speed` (`0.5..2.0`، `1.0` = عادی).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>حالت نرمال‌سازی متن.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 دوحرفی (مثلاً `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحیح `0..4294967295` برای تعین‌پذیری در حد بهترین تلاش.</ParamField>
    <ParamField path="baseUrl" type="string">URL پایه API ElevenLabs را بازنویسی می‌کند.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">به `GEMINI_API_KEY` / `GOOGLE_API_KEY` بازمی‌گردد. اگر حذف شود، TTS می‌تواند پیش از بازگشت به env، از `models.providers.google.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="model" type="string">مدل TTS Gemini. پیش‌فرض `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">نام صدای ازپیش‌ساخته Gemini. پیش‌فرض `Kore`. نام مستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">اعلان سبک به زبان طبیعی که پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="speakerName" type="string">برچسب اختیاری گوینده که وقتی اعلان شما از یک گوینده نام‌دار استفاده می‌کند، پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>برای بسته‌بندی فیلدهای اعلان پرسونای فعال در ساختار اعلان TTS تعین‌پذیر Gemini، روی `audio-profile-v1` تنظیم کنید.</ParamField>
    <ParamField path="personaPrompt" type="string">متن اعلان پرسونای اضافه ویژه Google که به Director's Notes الگو افزوده می‌شود.</ParamField>
    <ParamField path="baseUrl" type="string">فقط `https://generativelanguage.googleapis.com` پذیرفته می‌شود.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">محیط: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### اصلی Inworld

    <ParamField path="apiKey" type="string">محیط: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">پیش‌فرض `inworld-tts-1.5-max`. همچنین: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">دمای نمونه‌برداری `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI محلی (tts-local-cli)">
    <ParamField path="command" type="string">فایل اجرایی محلی یا رشته فرمان برای CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">آرگومان‌های فرمان. از جای‌نگهدارهای `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}` پشتیبانی می‌کند.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>قالب خروجی مورد انتظار CLI. پیش‌فرض `mp3` برای پیوست‌های صوتی.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلت زمانی فرمان بر حسب میلی‌ثانیه. پیش‌فرض `120000`.</ParamField>
    <ParamField path="cwd" type="string">دایرکتوری کاری اختیاری فرمان.</ParamField>
    <ParamField path="env" type="Record<string, string>">بازنویسی‌های اختیاری محیط برای فرمان.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (بدون کلید API)">
    <ParamField path="enabled" type="boolean" default="true">استفاده از گفتار Microsoft را مجاز کن.</ParamField>
    <ParamField path="voice" type="string">نام صدای عصبی Microsoft (مثلاً `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">کد زبان (مثلاً `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">قالب خروجی Microsoft. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`. همه قالب‌ها توسط انتقال همراه مبتنی بر Edge پشتیبانی نمی‌شوند.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">رشته‌های درصدی (مثلاً `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">زیرنویس‌های JSON را کنار فایل صوتی بنویس.</ParamField>
    <ParamField path="proxy" type="string">URL پراکسی برای درخواست‌های گفتار Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">بازنویسی مهلت زمانی درخواست (میلی‌ثانیه).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>نام مستعار قدیمی. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ذخیره‌شده به `providers.microsoft` بازنویسی شود.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">به `MINIMAX_API_KEY` برمی‌گردد. احراز هویت Token Plan از طریق `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، یا `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.minimax.io`. محیط: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `speech-2.8-hd`. محیط: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `English_expressive_narrator`. محیط: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحیح `-12..12`. پیش‌فرض `0`. مقدارهای کسری پیش از درخواست قطع می‌شوند.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">به `OPENAI_API_KEY` برمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل TTS در OpenAI (مثلاً `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">نام صدا (مثلاً `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">فیلد صریح `instructions` در OpenAI. وقتی تنظیم شود، فیلدهای پرامپت شخصیت به‌صورت خودکار نگاشت **نمی‌شوند**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">فیلدهای JSON اضافی که پس از فیلدهای تولیدشده OpenAI TTS در بدنه‌های درخواست `/audio/speech` ادغام می‌شوند. از این برای نقاط پایانی سازگار با OpenAI مانند Kokoro که به کلیدهای ویژه ارائه‌دهنده مثل `lang` نیاز دارند استفاده کنید؛ کلیدهای ناامن prototype نادیده گرفته می‌شوند.</ParamField>
    <ParamField path="baseUrl" type="string">
      نقطه پایانی OpenAI TTS را بازنویسی کنید. ترتیب تفکیک: پیکربندی → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. مقدارهای غیرپیش‌فرض به‌عنوان نقاط پایانی TTS سازگار با OpenAI در نظر گرفته می‌شوند، بنابراین نام‌های مدل و صدای سفارشی پذیرفته می‌شوند.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">محیط: `OPENROUTER_API_KEY`. می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://openrouter.ai/api/v1`. مقدار قدیمی `https://openrouter.ai/v1` نرمال‌سازی می‌شود.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `hexgrad/kokoro-82m`. نام مستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `af_alloy`. نام مستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">محیط: `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">پیش‌فرض `seed-tts-1.0`. محیط: `VOLCENGINE_TTS_RESOURCE_ID`. وقتی پروژه شما مجوز TTS 2.0 دارد، از `seed-tts-2.0` استفاده کنید.</ParamField>
    <ParamField path="appKey" type="string">هدر کلید برنامه. پیش‌فرض `aGjiRDfUWi`. محیط: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">نقطه پایانی HTTP برای Seed Speech TTS را بازنویسی کنید. محیط: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع صدا. پیش‌فرض `en_female_anna_mars_bigtts`. محیط: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبت سرعت بومی ارائه‌دهنده.</ParamField>
    <ParamField path="emotion" type="string">برچسب احساس بومی ارائه‌دهنده.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>فیلدهای قدیمی کنسول گفتار Volcengine. محیط: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (پیش‌فرض `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">محیط: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.x.ai/v1`. محیط: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `eve`. صداهای زنده: `ara`، `eve`، `leo`، `rex`، `sal`، `una`.</ParamField>
    <ParamField path="language" type="string">کد زبان BCP-47 یا `auto`. پیش‌فرض `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">محیط: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.xiaomimimo.com/v1`. محیط: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `mimo-v2.5-tts`. محیط: `XIAOMI_TTS_MODEL`. همچنین از `mimo-v2-tts` پشتیبانی می‌کند.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `mimo_default`. محیط: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>پیش‌فرض `mp3`. محیط: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">دستور سبک اختیاری به زبان طبیعی که به‌عنوان پیام کاربر ارسال می‌شود؛ گفته نمی‌شود.</ParamField>
  </Accordion>
</AccordionGroup>

## ابزار عامل

ابزار `tts` متن را به گفتار تبدیل می‌کند و یک پیوست صوتی برای
تحویل پاسخ برمی‌گرداند. در Feishu، Matrix، Telegram و WhatsApp، صدا
به‌جای پیوست فایل، به‌صورت پیام صوتی تحویل داده می‌شود. Feishu و
WhatsApp می‌توانند در این مسیر، وقتی `ffmpeg` در دسترس باشد، خروجی TTS غیر Opus را ترنس‌کد کنند.

WhatsApp صدا را از طریق Baileys به‌عنوان یادداشت صوتی PTT (`audio` با
`ptt: true`) ارسال می‌کند و متن قابل مشاهده را **جداگانه** از صدای PTT می‌فرستد، زیرا
کلاینت‌ها کپشن‌ها را روی یادداشت‌های صوتی به‌طور یکنواخت رندر نمی‌کنند.

این ابزار فیلدهای اختیاری `channel` و `timeoutMs` را می‌پذیرد؛ `timeoutMs` یک
مهلت زمانی درخواست ارائه‌دهنده برای هر فراخوانی، بر حسب میلی‌ثانیه است.

## RPC ‏Gateway

| روش              | هدف                                      |
| ----------------- | ---------------------------------------- |
| `tts.status`      | وضعیت فعلی TTS و آخرین تلاش را بخواند. |
| `tts.enable`      | ترجیح خودکار محلی را روی `always` تنظیم کند. |
| `tts.disable`     | ترجیح خودکار محلی را روی `off` تنظیم کند. |
| `tts.convert`     | تبدیل یک‌باره متن → صدا.                |
| `tts.setProvider` | ترجیح ارائه‌دهنده محلی را تنظیم کند.   |
| `tts.setPersona`  | ترجیح شخصیت محلی را تنظیم کند.          |
| `tts.providers`   | ارائه‌دهندگان پیکربندی‌شده و وضعیت را فهرست کند. |

## پیوندهای سرویس

- [راهنمای متن‌به‌گفتار OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع API صوتی OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [متن‌به‌گفتار REST برای Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ارائه‌دهنده Azure Speech](/fa/providers/azure-speech)
- [متن به گفتار ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [احراز هویت ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fa/providers/gradium)
- [API ‏Inworld TTS](https://docs.inworld.ai/tts/tts)
- [API ‏MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API ‏HTTP برای Volcengine TTS](/fa/providers/volcengine#text-to-speech)
- [سنتز گفتار Xiaomi MiMo](/fa/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [قالب‌های خروجی Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [متن به گفتار xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## مرتبط

- [نمای کلی رسانه](/fa/tools/media-overview)
- [تولید موسیقی](/fa/tools/music-generation)
- [تولید ویدئو](/fa/tools/video-generation)
- [دستورهای اسلش](/fa/tools/slash-commands)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
