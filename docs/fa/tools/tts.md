---
read_when:
    - فعال‌سازی تبدیل متن به گفتار برای پاسخ‌ها
    - پیکربندی یک ارائه‌دهندهٔ TTS، زنجیرهٔ جایگزینی یا شخصیت
    - استفاده از فرمان‌ها یا دستورالعمل‌های /tts
sidebarTitle: Text to speech (TTS)
summary: تبدیل متن به گفتار برای پاسخ‌های خروجی — ارائه‌دهندگان، پرسوناها، فرمان‌های اسلش و خروجی برای هر کانال
title: تبدیل متن به گفتار
x-i18n:
    generated_at: "2026-04-29T23:47:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw می‌تواند پاسخ‌های خروجی را از طریق **14 ارائه‌دهنده گفتار** به صوت تبدیل کند
و پیام‌های صوتی بومی را در Feishu، Matrix، Telegram و WhatsApp،
پیوست‌های صوتی را در سایر جاها، و جریان‌های PCM/Ulaw را برای تلفن و Talk تحویل دهد.

## شروع سریع

<Steps>
  <Step title="Pick a provider">
    OpenAI و ElevenLabs مطمئن‌ترین گزینه‌های میزبانی‌شده هستند. Microsoft و
    Local CLI بدون کلید API کار می‌کنند. برای فهرست کامل، [ماتریس ارائه‌دهندگان](#supported-providers)
    را ببینید.
  </Step>
  <Step title="Set the API key">
    متغیر محیطی ارائه‌دهنده خود را صادر کنید، برای مثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`. Microsoft و Local CLI به کلید نیاز ندارند.
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
    یک پاسخ صوتی یک‌باره ارسال می‌کند.
  </Step>
</Steps>

<Note>
Auto-TTS به‌صورت پیش‌فرض **خاموش** است. وقتی `messages.tts.provider` تنظیم نشده باشد،
OpenClaw نخستین ارائه‌دهنده پیکربندی‌شده را به‌ترتیب انتخاب خودکار رجیستری انتخاب می‌کند.
</Note>

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده       | احراز هویت                                                                                                      | یادداشت‌ها                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (همچنین `AZURE_SPEECH_API_KEY`، `SPEECH_KEY`، `SPEECH_REGION`)        | خروجی یادداشت صوتی Ogg/Opus بومی و تلفن.                                |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS سازگار با OpenAI. به‌صورت پیش‌فرض از `hexgrad/Kokoro-82M` استفاده می‌کند. |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` یا `XI_API_KEY`                                                                             | شبیه‌سازی صدا، چندزبانه، قطعی از طریق `seed`.                           |
| **Google Gemini** | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                                                                             | TTS API در Gemini؛ آگاه از پرسونا از طریق `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | خروجی یادداشت صوتی و تلفن.                                              |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | TTS API جریانی. یادداشت صوتی Opus بومی و تلفن PCM.                      |
| **Local CLI**     | هیچ‌کدام                                                                                                         | یک فرمان محلی TTS پیکربندی‌شده را اجرا می‌کند.                          |
| **Microsoft**     | هیچ‌کدام                                                                                                         | TTS عصبی عمومی Edge از طریق `node-edge-tts`. با بهترین تلاش، بدون SLA.  |
| **MiniMax**       | `MINIMAX_API_KEY` (یا طرح توکن: `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`)       | T2A v2 API. به‌صورت پیش‌فرض از `speech-2.8-hd` استفاده می‌کند.          |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | برای خلاصه‌سازی خودکار نیز استفاده می‌شود؛ از `instructions` پرسونا پشتیبانی می‌کند. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند)                      | مدل پیش‌فرض `hexgrad/kokoro-82m`.                                       |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token قدیمی: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ارائه‌دهنده مشترک تصویر، ویدئو و گفتار.                                 |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دسته‌ای xAI. یادداشت صوتی Opus بومی پشتیبانی **نمی‌شود**.           |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo از طریق تکمیل‌های چت Xiaomi.                                   |

اگر چند ارائه‌دهنده پیکربندی شده باشند، ابتدا مورد انتخاب‌شده استفاده می‌شود و
موارد دیگر گزینه‌های جایگزین هستند. خلاصه‌سازی خودکار از `summaryModel` (یا
`agents.defaults.model.primary`) استفاده می‌کند، بنابراین اگر خلاصه‌ها را فعال نگه می‌دارید،
آن ارائه‌دهنده نیز باید احراز هویت شده باشد.

<Warning>
ارائه‌دهندهٔ همراه **Microsoft** از سرویس TTS عصبی آنلاین Microsoft Edge
از طریق `node-edge-tts` استفاده می‌کند. این یک سرویس وب عمومی بدون SLA
یا سهمیهٔ منتشرشده است؛ آن را best-effort در نظر بگیرید. شناسهٔ قدیمی ارائه‌دهنده `edge`
به `microsoft` نرمال‌سازی می‌شود و `openclaw doctor --fix` پیکربندی ماندگارشده را بازنویسی می‌کند؛ پیکربندی‌های جدید باید همیشه از `microsoft` استفاده کنند.
</Warning>

## پیکربندی

پیکربندی TTS زیر `messages.tts` در `~/.openclaw/openclaw.json` قرار دارد. یک
preset انتخاب کنید و بلوک ارائه‌دهنده را تطبیق دهید:

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

### بازنویسی‌های صدا برای هر عامل

وقتی یک عامل باید با ارائه‌دهنده، صدا، مدل، persona یا حالت auto-TTS متفاوتی صحبت کند، از `agents.list[].tts` استفاده کنید. بلوک عامل روی
`messages.tts` به‌صورت deep-merge ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده می‌توانند در پیکربندی سراسری ارائه‌دهنده باقی بمانند:

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

برای pin کردن persona برای هر عامل، `agents.list[].tts.persona` را در کنار پیکربندی ارائه‌دهنده تنظیم کنید؛ این فقط برای همان عامل، `messages.tts.persona` سراسری را بازنویسی می‌کند.

ترتیب اولویت برای پاسخ‌های خودکار، `/tts audio`، `/tts status` و ابزار عامل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` فعال
3. بازنویسی کانال، وقتی کانال از `channels.<channel>.tts` پشتیبانی می‌کند
4. بازنویسی حساب، وقتی کانال `channels.<channel>.accounts.<id>.tts` را ارسال می‌کند
5. ترجیحات محلی `/tts` برای این میزبان
6. دستورهای درون‌خطی `[[tts:...]]` وقتی [بازنویسی‌های مدل‌محور](#model-driven-directives) فعال هستند

کانال و بازنویسی‌های حساب از همان شکلی استفاده می‌کنند که `messages.tts` دارد و
روی لایه‌های قبلی به‌صورت deep-merge اعمال می‌شوند، بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده می‌توانند در
`messages.tts` بمانند، در حالی که یک کانال یا حساب bot فقط صدا، مدل، persona،
یا حالت خودکار را تغییر می‌دهد:

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

یک **persona** هویت گفتاری پایداری است که می‌تواند به‌شکل قطعی
در میان ارائه‌دهندگان اعمال شود. می‌تواند یک ارائه‌دهنده را ترجیح دهد، نیت prompt
بی‌طرف نسبت به ارائه‌دهنده را تعریف کند، و bindingهای اختصاصی ارائه‌دهنده را برای صداها، مدل‌ها، قالب‌های prompt،
seedها و تنظیمات صدا همراه داشته باشد.

### حداقل persona

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

### persona کامل (prompt بی‌طرف نسبت به ارائه‌دهنده)

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

### تشخیص persona

persona فعال به‌شکل قطعی انتخاب می‌شود:

1. ترجیح محلی `/tts persona <id>`، اگر تنظیم شده باشد.
2. `messages.tts.persona`، اگر تنظیم شده باشد.
3. بدون persona.

انتخاب ارائه‌دهنده با اولویت موارد صریح انجام می‌شود:

1. بازنویسی‌های مستقیم (CLI، Gateway، Talk، دستورهای مجاز TTS).
2. ترجیح محلی `/tts provider <id>`.
3. `provider` مربوط به persona فعال.
4. `messages.tts.provider`.
5. انتخاب خودکار registry.

برای هر تلاش ارائه‌دهنده، OpenClaw پیکربندی‌ها را به این ترتیب merge می‌کند:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. بازنویسی‌های درخواست مورد اعتماد
4. بازنویسی‌های مجاز دستور TTS صادرشده توسط مدل

### ارائه‌دهندگان چگونه از promptهای persona استفاده می‌کنند

فیلدهای prompt مربوط به persona (`profile`، `scene`، `sampleContext`، `style`، `accent`،
`pacing`، `constraints`) **بی‌طرف نسبت به ارائه‌دهنده** هستند. هر ارائه‌دهنده تصمیم می‌گیرد
چگونه از آن‌ها استفاده کند:

<AccordionGroup>
  <Accordion title="Google Gemini">
    فیلدهای prompt مربوط به persona را فقط **زمانی که** پیکربندی مؤثر ارائه‌دهنده Google
    مقدار `promptTemplate: "audio-profile-v1"` یا `personaPrompt` را تنظیم کرده باشد،
    در ساختار prompt تبدیل متن به گفتار Gemini می‌پیچد. فیلدهای قدیمی‌تر `audioProfile` و `speakerName`
    همچنان به‌عنوان متن prompt اختصاصی Google در ابتدا افزوده می‌شوند. برچسب‌های صوتی inline مانند
    `[whispers]` یا `[laughs]` داخل یک بلوک `[[tts:text]]` در transcript Gemini حفظ می‌شوند؛
    OpenClaw این برچسب‌ها را تولید نمی‌کند.
  </Accordion>
  <Accordion title="OpenAI">
    فیلدهای prompt مربوط به persona را فقط **زمانی که** هیچ `instructions` صریح OpenAI
    پیکربندی نشده باشد، به فیلد `instructions` درخواست map می‌کند. `instructions` صریح
    همیشه اولویت دارد.
  </Accordion>
  <Accordion title="Other providers">
    فقط bindingهای اختصاصی ارائه‌دهنده زیر
    `personas.<id>.providers.<provider>` را استفاده می‌کنند. فیلدهای prompt مربوط به persona نادیده گرفته می‌شوند
    مگر اینکه ارائه‌دهنده mapping اختصاصی prompt مربوط به persona خودش را پیاده‌سازی کند.
  </Accordion>
</AccordionGroup>

### سیاست fallback

`fallbackPolicy` رفتار را زمانی کنترل می‌کند که یک persona برای
ارائه‌دهنده تلاش‌شده **هیچ binding** نداشته باشد:

| سیاست              | رفتار                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **پیش‌فرض.** فیلدهای prompt بی‌طرف نسبت به ارائه‌دهنده در دسترس می‌مانند؛ ارائه‌دهنده ممکن است از آن‌ها استفاده کند یا نادیده‌شان بگیرد.                                            |
| `provider-defaults` | persona از آماده‌سازی prompt برای آن تلاش حذف می‌شود؛ ارائه‌دهنده از پیش‌فرض‌های خنثای خود استفاده می‌کند، در حالی که fallback به ارائه‌دهندگان دیگر ادامه می‌یابد. |
| `fail`              | آن تلاش ارائه‌دهنده را با `reasonCode: "not_configured"` و `personaBinding: "missing"` رد می‌کند. ارائه‌دهندگان fallback همچنان امتحان می‌شوند.              |

کل درخواست TTS فقط زمانی شکست می‌خورد که **همه** ارائه‌دهندگان تلاش‌شده رد شوند
یا شکست بخورند.

## دستورهای هدایت‌شده توسط مدل

به‌صورت پیش‌فرض، دستیار **می‌تواند** دستورهای `[[tts:...]]` را برای بازنویسی
صدا، مدل، یا سرعت برای یک پاسخ واحد صادر کند، به‌همراه یک بلوک اختیاری
`[[tts:text]]...[[/tts:text]]` برای نشانه‌های بیانی که فقط باید در
صدا ظاهر شوند:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

وقتی `messages.tts.auto` برابر `"tagged"` باشد، **دستورها الزامی هستند** تا
صدا فعال شود. تحویل بلوک streaming، دستورها را پیش از اینکه کانال آن‌ها را ببیند
از متن قابل مشاهده حذف می‌کند، حتی وقتی میان بلوک‌های مجاور split شده باشند.

`provider=...` نادیده گرفته می‌شود مگر اینکه `modelOverrides.allowProvider: true` باشد. وقتی یک
پاسخ `provider=...` را اعلام می‌کند، کلیدهای دیگر در آن دستور
فقط توسط همان ارائه‌دهنده parse می‌شوند؛ کلیدهای پشتیبانی‌نشده حذف می‌شوند و به‌عنوان هشدارهای دستور TTS
گزارش می‌شوند.

**کلیدهای دستور در دسترس:**

- `provider` (شناسه ارائه‌دهنده ثبت‌شده؛ به `allowProvider: true` نیاز دارد)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم صدای MiniMax، 0 تا 10)
- `pitch` (pitch عدد صحیح MiniMax، −12 تا 12؛ مقادیر اعشاری truncate می‌شوند)
- `emotion` (برچسب emotion در Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**غیرفعال کردن کامل بازنویسی‌های مدل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**اجازه دادن به تعویض ارائه‌دهنده در حالی که knobهای دیگر قابل پیکربندی می‌مانند:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## فرمان‌های slash

فرمان واحد `/tts`. در Discord، OpenClaw همچنین `/voice` را ثبت می‌کند، چون
`/tts` یک فرمان داخلی Discord است — متن `/tts ...` همچنان کار می‌کند.

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
فرمان‌ها به یک فرستنده مجاز نیاز دارند (قواعد allowlist/owner اعمال می‌شوند) و یا
`commands.text` یا ثبت فرمان native باید فعال باشد.
</Note>

نکات رفتاری:

- `/tts on` ترجیح محلی TTS را روی `always` می‌نویسد؛ `/tts off` آن را روی `off` می‌نویسد.
- `/tts chat on|off|default` یک بازنویسی auto-TTS با scope نشست را برای گفت‌وگوی جاری می‌نویسد.
- `/tts persona <id>` ترجیح محلی persona را می‌نویسد؛ `/tts persona off` آن را پاک می‌کند.
- `/tts latest` آخرین پاسخ دستیار را از transcript نشست جاری می‌خواند و آن را یک‌بار به‌صورت صدا ارسال می‌کند. فقط hash آن پاسخ را در entry نشست ذخیره می‌کند تا ارسال‌های صوتی تکراری را سرکوب کند.
- `/tts audio` یک پاسخ صوتی یک‌باره تولید می‌کند (TTS را روشن **نمی‌کند**).
- `limit` و `summary` در **ترجیحات محلی** ذخیره می‌شوند، نه پیکربندی اصلی.
- `/tts status` شامل diagnostics مربوط به fallback برای آخرین تلاش است — `Fallback: <primary> -> <used>`، `Attempts: ...`، و جزئیات هر تلاش (`provider:outcome(reasonCode) latency`).
- `/status` وقتی TTS فعال باشد، حالت فعال TTS به‌همراه ارائه‌دهنده، مدل، صدا، و metadata پاک‌سازی‌شده endpoint سفارشی پیکربندی‌شده را نشان می‌دهد.

## ترجیحات هر کاربر

فرمان‌های slash بازنویسی‌های محلی را در `prefsPath` می‌نویسند. مقدار پیش‌فرض
`~/.openclaw/settings/tts.json` است؛ با متغیر env به نام `OPENCLAW_TTS_PREFS`
یا `messages.tts.prefsPath` آن را بازنویسی کنید.

| فیلد ذخیره‌شده | اثر                                       |
| ------------ | -------------------------------------------- |
| `auto`       | بازنویسی محلی auto-TTS (`always`, `off`, …) |
| `provider`   | بازنویسی ارائه‌دهنده اصلی محلی              |
| `persona`    | بازنویسی persona محلی                       |
| `maxLength`  | آستانه summary (پیش‌فرض `1500` کاراکتر)     |
| `summarize`  | کلید summary (پیش‌فرض `true`)              |

این‌ها پیکربندی مؤثر از `messages.tts` به‌علاوه بلوک فعال
`agents.list[].tts` برای آن host را بازنویسی می‌کنند.

## قالب‌های خروجی (ثابت)

تحویل صدای TTS بر اساس قابلیت کانال هدایت می‌شود. Pluginهای کانال اعلام می‌کنند
که آیا TTS به سبک پیام صوتی باید از ارائه‌دهندگان یک هدف native با عنوان `voice-note` بخواهد یا
synthesis معمول `audio-file` را نگه دارد و فقط خروجی سازگار را برای تحویل صوتی
علامت‌گذاری کند.

- **کانال‌های پشتیبان یادداشت صوتی**: پاسخ‌های یادداشت صوتی Opus را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI).
  - 48kHz / 64kbps مصالحه‌ی خوبی برای پیام صوتی است.
- **Feishu / WhatsApp**: وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A
  یا یک فایل صوتی محتمل دیگر تولید شود، Plugin کانال پیش از ارسال پیام صوتی بومی، آن را با `ffmpeg` به Ogg/Opus با 48kHz
  تبدیل می‌کند. WhatsApp نتیجه را از طریق payload صوتی Baileys با `ptt: true` و
  `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد، Feishu فایل اصلی را
  به‌عنوان پیوست دریافت می‌کند؛ ارسال WhatsApp به‌جای انتشار payload ناسازگار
  PTT ناموفق می‌شود.
- **BlueBubbles**: سنتز ارائه‌دهنده را روی مسیر معمول فایل صوتی نگه می‌دارد؛ خروجی‌های MP3
  و CAF برای تحویل یادداشت صوتی iMessage علامت‌گذاری می‌شوند.
- **کانال‌های دیگر**: MP3 (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI).
  - 44.1kHz / 128kbps توازن پیش‌فرض برای وضوح گفتار است.
- **MiniMax**: MP3 (مدل `speech-2.8-hd`، نرخ نمونه‌برداری 32kHz) برای پیوست‌های صوتی معمولی. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، OpenClaw وقتی کانال تبدیل را اعلام کرده باشد، MP3 MiniMax را پیش از تحویل با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **Xiaomi MiMo**: به‌صورت پیش‌فرض MP3، یا در صورت پیکربندی WAV. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، OpenClaw وقتی کانال تبدیل را اعلام کرده باشد، خروجی Xiaomi را پیش از تحویل با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **CLI محلی**: از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی به
  Ogg/Opus تبدیل می‌شوند و خروجی تلفنی با `ffmpeg` به PCM خام تک‌کاناله 16 kHz
  تبدیل می‌شود.
- **Google Gemini**: TTS در Gemini API، PCM خام 24kHz برمی‌گرداند. OpenClaw آن را برای پیوست‌های صوتی به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48kHz تبدیل می‌کند، و برای Talk/تلفنی PCM را مستقیما برمی‌گرداند.
- **Gradium**: WAV برای پیوست‌های صوتی، Opus برای مقصدهای یادداشت صوتی، و `ulaw_8000` در 8 kHz برای تلفنی.
- **Inworld**: MP3 برای پیوست‌های صوتی معمولی، `OGG_OPUS` بومی برای مقصدهای یادداشت صوتی، و `PCM` خام در 22050 Hz برای Talk/تلفنی.
- **xAI**: به‌صورت پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3`، `wav`، `pcm`، `mulaw`، یا `alaw` باشد. OpenClaw از endpoint دسته‌ای REST TTS در xAI استفاده می‌کند و یک پیوست صوتی کامل برمی‌گرداند؛ WebSocket استریم TTS در xAI توسط این مسیر ارائه‌دهنده استفاده نمی‌شود. قالب بومی یادداشت صوتی Opus توسط این مسیر پشتیبانی نمی‌شود.
- **Microsoft**: از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).
  - انتقال‌دهنده‌ی همراه، `outputFormat` را می‌پذیرد، اما همه‌ی قالب‌ها از سرویس در دسترس نیستند.
  - مقادیر قالب خروجی از قالب‌های خروجی Microsoft Speech پیروی می‌کنند (از جمله Ogg/WebM Opus).
  - `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus
    تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید.
  - اگر قالب خروجی پیکربندی‌شده‌ی Microsoft ناموفق باشد، OpenClaw دوباره با MP3 تلاش می‌کند.

قالب‌های خروجی OpenAI/ElevenLabs برای هر کانال ثابت هستند (بالا را ببینید).

## رفتار Auto-TTS

وقتی `messages.tts.auto` فعال باشد، OpenClaw:

- اگر پاسخ از قبل شامل رسانه یا دستور `MEDIA:` باشد، TTS را رد می‌کند.
- پاسخ‌های بسیار کوتاه را رد می‌کند (کمتر از 10 نویسه).
- وقتی خلاصه‌ها فعال باشند، پاسخ‌های طولانی را با استفاده از
  `summaryModel` (یا `agents.defaults.model.primary`) خلاصه می‌کند.
- صدای تولیدشده را به پاسخ پیوست می‌کند.
- در `mode: "final"`، همچنان برای پاسخ‌های نهایی استریم‌شده پس از کامل شدن استریم متن،
  TTS فقط-صوتی ارسال می‌کند؛ رسانه‌ی تولیدشده از همان عادی‌سازی رسانه‌ی کانال
  مانند پیوست‌های پاسخ معمولی عبور می‌کند.

اگر پاسخ از `maxLength` بیشتر باشد و خلاصه خاموش باشد (یا برای مدل خلاصه
کلید API وجود نداشته باشد)، صدا رد می‌شود و پاسخ متنی معمولی ارسال می‌شود.

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
  | Feishu / Matrix / Telegram / WhatsApp | پاسخ‌های یادداشت صوتی **Opus** را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI). 48 kHz / 64 kbps وضوح و اندازه را متعادل می‌کند. |
  | کانال‌های دیگر                       | **MP3** (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI). پیش‌فرض 44.1 kHz / 128 kbps برای گفتار.                                      |
  | Talk / تلفن                          | **PCM** بومی ارائه‌دهنده (Inworld 22050 Hz، Google 24 kHz)، یا `ulaw_8000` از Gradium برای تلفن.                                      |

  نکات مربوط به هر ارائه‌دهنده:

  - **تبدیل کدگذاری Feishu / WhatsApp:** وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A برسد، Plugin کانال آن را با `ffmpeg` به 48 kHz Ogg/Opus تبدیل کدگذاری می‌کند. WhatsApp از طریق Baileys با `ptt: true` و `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد: Feishu به پیوست‌کردن فایل اصلی برمی‌گردد؛ ارسال WhatsApp به‌جای ارسال بار PTT ناسازگار، ناموفق می‌شود.
  - **MiniMax / Xiaomi MiMo:** MP3 پیش‌فرض (32 kHz برای MiniMax `speech-2.8-hd`)؛ برای هدف‌های یادداشت صوتی از طریق `ffmpeg` به 48 kHz Opus تبدیل کدگذاری می‌شود.
  - **CLI محلی:** از `outputFormat` پیکربندی‌شده استفاده می‌کند. هدف‌های یادداشت صوتی به Ogg/Opus و خروجی تلفن به PCM خام مونو 16 kHz تبدیل می‌شوند.
  - **Google Gemini:** PCM خام 24 kHz برمی‌گرداند. OpenClaw برای پیوست‌ها آن را به WAV می‌پیچد، برای هدف‌های یادداشت صوتی به 48 kHz Opus تبدیل کدگذاری می‌کند، و برای Talk/تلفن مستقیماً PCM برمی‌گرداند.
  - **Inworld:** پیوست‌های MP3، یادداشت صوتی بومی `OGG_OPUS`، و `PCM` خام 22050 Hz برای Talk/تلفن.
  - **xAI:** به‌صورت پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3|wav|pcm|mulaw|alaw` باشد. از نقطه پایانی REST دسته‌ای xAI استفاده می‌کند — TTS جریانی WebSocket استفاده **نمی‌شود**. قالب یادداشت صوتی Opus بومی پشتیبانی **نمی‌شود**.
  - **Microsoft:** از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید از OpenAI/ElevenLabs استفاده کنید. اگر قالب پیکربندی‌شده Microsoft ناموفق باشد، OpenClaw دوباره با MP3 تلاش می‌کند.

  قالب‌های خروجی OpenAI و ElevenLabs برای هر کانال مطابق فهرست بالا ثابت هستند.

  ## مرجع فیلد

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      حالت TTS خودکار. `inbound` فقط پس از یک پیام صوتی ورودی، صدا ارسال می‌کند؛ `tagged` فقط وقتی صدا ارسال می‌کند که پاسخ شامل دستورهای `[[tts:...]]` یا یک بلوک `[[tts:text]]` باشد.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      تغییر وضعیت قدیمی. `openclaw doctor --fix` این را به `auto` منتقل می‌کند.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` علاوه بر پاسخ‌های نهایی، پاسخ‌های ابزار/بلوک را هم شامل می‌شود.
    </ParamField>
    <ParamField path="provider" type="string">
      شناسه ارائه‌دهنده گفتار. وقتی تنظیم نشده باشد، OpenClaw از نخستین ارائه‌دهنده پیکربندی‌شده در ترتیب انتخاب خودکار رجیستری استفاده می‌کند. `provider: "edge"` قدیمی توسط `openclaw doctor --fix` به `"microsoft"` بازنویسی می‌شود.
    </ParamField>
    <ParamField path="persona" type="string">
      شناسه پرسونا فعال از `personas`. به حروف کوچک نرمال‌سازی می‌شود.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هویت گفتاری پایدار. فیلدها: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. [پرسوناها](#personas) را ببینید.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      مدل ارزان برای خلاصه‌سازی خودکار؛ پیش‌فرض `agents.defaults.model.primary` است. `provider/model` یا یک نام مستعار مدل پیکربندی‌شده را می‌پذیرد.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      اجازه می‌دهد مدل دستورهای TTS را تولید کند. پیش‌فرض `enabled` برابر `true` است؛ پیش‌فرض `allowProvider` برابر `false` است.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      تنظیمات تحت مالکیت ارائه‌دهنده که با شناسه ارائه‌دهنده گفتار کلیدگذاری شده‌اند. بلوک‌های مستقیم قدیمی (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`) توسط `openclaw doctor --fix` بازنویسی می‌شوند؛ فقط `messages.tts.providers.<id>` را کامیت کنید.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      سقف سخت برای نویسه‌های ورودی TTS. اگر از آن فراتر برود، `/tts audio` ناموفق می‌شود.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلت زمانی درخواست بر حسب میلی‌ثانیه.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      مسیر محلی JSON ترجیحات (ارائه‌دهنده/محدودیت/خلاصه) را بازنویسی کنید. پیش‌فرض `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقه Azure Speech (مثلاً `eastus`). Env: `AZURE_SPEECH_REGION` یا `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">بازنویسی اختیاری نقطه پایانی Azure Speech (نام مستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName صدای Azure. پیش‌فرض `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">کد زبان SSML. پیش‌فرض `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` در Azure برای صدای استاندارد. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` در Azure برای خروجی یادداشت صوتی. پیش‌فرض `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">به `ELEVENLABS_API_KEY` یا `XI_API_KEY` برمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل (مثلاً `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">شناسه صدای ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (هرکدام `0..1`)، `useSpeakerBoost` (`true|false`)، `speed` (`0.5..2.0`، `1.0` = عادی).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>حالت نرمال‌سازی متن.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 دوحرفی (مثلاً `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحیح `0..4294967295` برای قطعیت‌پذیری در حد بهترین تلاش.</ParamField>
    <ParamField path="baseUrl" type="string">بازنویسی نشانی پایه API در ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">به `GEMINI_API_KEY` / `GOOGLE_API_KEY` برمی‌گردد. اگر حذف شود، TTS می‌تواند پیش از برگشت به env از `models.providers.google.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="model" type="string">مدل TTS در Gemini. پیش‌فرض `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">نام صدای پیش‌ساخته Gemini. پیش‌فرض `Kore`. نام مستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">پرامپت سبک به زبان طبیعی که پیش از متن گفتاری اضافه می‌شود.</ParamField>
    <ParamField path="speakerName" type="string">برچسب اختیاری گوینده که وقتی پرامپت شما از گوینده نام‌دار استفاده می‌کند، پیش از متن گفتاری اضافه می‌شود.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>برای پیچیدن فیلدهای پرامپت پرسونای فعال در ساختار پرامپت قطعی Gemini TTS، روی `audio-profile-v1` تنظیم کنید.</ParamField>
    <ParamField path="personaPrompt" type="string">متن پرامپت پرسونای اضافی مخصوص Google که به یادداشت‌های کارگردان در الگو افزوده می‌شود.</ParamField>
    <ParamField path="baseUrl" type="string">فقط `https://generativelanguage.googleapis.com` پذیرفته می‌شود.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغیر محیطی: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">متغیر محیطی: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">پیش‌فرض `inworld-tts-1.5-max`. همچنین: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">دمای نمونه‌برداری `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">فایل اجرایی محلی یا رشتهٔ فرمان برای TTS در CLI.</ParamField>
    <ParamField path="args" type="string[]">آرگومان‌های فرمان. از جای‌نگهدارهای `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}` پشتیبانی می‌کند.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>قالب خروجی موردانتظار CLI. پیش‌فرض `mp3` برای پیوست‌های صوتی.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلت اجرای فرمان بر حسب میلی‌ثانیه. پیش‌فرض `120000`.</ParamField>
    <ParamField path="cwd" type="string">دایرکتوری کاری اختیاری فرمان.</ParamField>
    <ParamField path="env" type="Record<string, string>">بازنویسی‌های اختیاری محیط برای فرمان.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">اجازهٔ استفاده از گفتار Microsoft.</ParamField>
    <ParamField path="voice" type="string">نام صدای عصبی Microsoft (مثلاً `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">کد زبان (مثلاً `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">قالب خروجی Microsoft. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`. همهٔ قالب‌ها توسط انتقال همراه مبتنی بر Edge پشتیبانی نمی‌شوند.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">رشته‌های درصدی (مثلاً `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">زیرنویس‌های JSON را کنار فایل صوتی بنویس.</ParamField>
    <ParamField path="proxy" type="string">URL پروکسی برای درخواست‌های گفتار Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">بازنویسی مهلت درخواست (میلی‌ثانیه).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>نام مستعار قدیمی. `openclaw doctor --fix` را اجرا کنید تا پیکربندی پایدارشده به `providers.microsoft` بازنویسی شود.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">در صورت نبود، از `MINIMAX_API_KEY` استفاده می‌کند. احراز هویت Token Plan از طریق `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، یا `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.minimax.io`. متغیر محیطی: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `speech-2.8-hd`. متغیر محیطی: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `English_expressive_narrator`. متغیر محیطی: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحیح `-12..12`. پیش‌فرض `0`. مقدارهای اعشاری پیش از درخواست کوتاه می‌شوند.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">در صورت نبود، از `OPENAI_API_KEY` استفاده می‌کند.</ParamField>
    <ParamField path="model" type="string">شناسهٔ مدل TTS در OpenAI (مثلاً `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">نام صدا (مثلاً `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">فیلد صریح `instructions` در OpenAI. وقتی تنظیم شود، فیلدهای پرامپت پرسونا به‌صورت خودکار نگاشت نمی‌شوند.</ParamField>
    <ParamField path="baseUrl" type="string">
      نقطهٔ پایانی TTS در OpenAI را بازنویسی کنید. ترتیب حل: پیکربندی → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. مقدارهای غیربیش‌فرض به‌عنوان نقطه‌های پایانی TTS سازگار با OpenAI در نظر گرفته می‌شوند، بنابراین نام‌های سفارشی مدل و صدا پذیرفته می‌شوند.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغیر محیطی: `OPENROUTER_API_KEY`. می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://openrouter.ai/api/v1`. مقدار قدیمی `https://openrouter.ai/v1` نرمال‌سازی می‌شود.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `hexgrad/kokoro-82m`. نام مستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `af_alloy`. نام مستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغیر محیطی: `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">پیش‌فرض `seed-tts-1.0`. متغیر محیطی: `VOLCENGINE_TTS_RESOURCE_ID`. وقتی پروژهٔ شما مجوز TTS 2.0 دارد، از `seed-tts-2.0` استفاده کنید.</ParamField>
    <ParamField path="appKey" type="string">سرآیند کلید برنامه. پیش‌فرض `aGjiRDfUWi`. متغیر محیطی: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">نقطهٔ پایانی HTTP برای Seed Speech TTS را بازنویسی کنید. متغیر محیطی: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع صدا. پیش‌فرض `en_female_anna_mars_bigtts`. متغیر محیطی: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبت سرعت بومی ارائه‌دهنده.</ParamField>
    <ParamField path="emotion" type="string">برچسب احساس بومی ارائه‌دهنده.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>فیلدهای قدیمی Volcengine Speech Console. متغیرهای محیطی: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (پیش‌فرض `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغیر محیطی: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.x.ai/v1`. متغیر محیطی: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `eve`. صداهای زنده: `ara`، `eve`، `leo`، `rex`، `sal`، `una`.</ParamField>
    <ParamField path="language" type="string">کد زبان BCP-47 یا `auto`. پیش‌فرض `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغیر محیطی: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.xiaomimimo.com/v1`. متغیر محیطی: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `mimo-v2.5-tts`. متغیر محیطی: `XIAOMI_TTS_MODEL`. از `mimo-v2-tts` نیز پشتیبانی می‌کند.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `mimo_default`. متغیر محیطی: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>پیش‌فرض `mp3`. متغیر محیطی: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">دستور سبک اختیاری به زبان طبیعی که به‌عنوان پیام کاربر ارسال می‌شود؛ خوانده نمی‌شود.</ParamField>
  </Accordion>
</AccordionGroup>

## ابزار عامل

ابزار `tts` متن را به گفتار تبدیل می‌کند و برای تحویل پاسخ یک پیوست صوتی برمی‌گرداند. در Feishu، Matrix، Telegram و WhatsApp، صدا به‌جای پیوست فایل به‌صورت پیام صوتی تحویل داده می‌شود. Feishu و WhatsApp می‌توانند در این مسیر، وقتی `ffmpeg` در دسترس باشد، خروجی TTS غیر Opus را ترنسکد کنند.

WhatsApp صدا را از طریق Baileys به‌صورت یادداشت صوتی PTT (`audio` با `ptt: true`) ارسال می‌کند و متن قابل‌مشاهده را **جداگانه** از صدای PTT می‌فرستد، زیرا کلاینت‌ها کپشن‌ها را روی یادداشت‌های صوتی به‌صورت سازگار نمایش نمی‌دهند.

این ابزار فیلدهای اختیاری `channel` و `timeoutMs` را می‌پذیرد؛ `timeoutMs` مهلت درخواست ارائه‌دهنده برای هر فراخوانی بر حسب میلی‌ثانیه است.

## Gateway RPC

| روش              | هدف                                      |
| ----------------- | ---------------------------------------- |
| `tts.status`      | خواندن وضعیت فعلی TTS و آخرین تلاش. |
| `tts.enable`      | تنظیم ترجیح خودکار محلی روی `always`.   |
| `tts.disable`     | تنظیم ترجیح خودکار محلی روی `off`.      |
| `tts.convert`     | تبدیل یک‌بارهٔ متن → صدا.                    |
| `tts.setProvider` | تنظیم ترجیح ارائه‌دهندهٔ محلی.           |
| `tts.setPersona`  | تنظیم ترجیح پرسونای محلی.            |
| `tts.providers`   | فهرست ارائه‌دهندگان پیکربندی‌شده و وضعیت.    |

## پیوندهای سرویس

- [راهنمای تبدیل متن به گفتار OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع API صوتی OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تبدیل متن به گفتار Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ارائه‌دهندهٔ Azure Speech](/fa/providers/azure-speech)
- [تبدیل متن به گفتار ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [احراز هویت ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fa/providers/gradium)
- [API TTS در Inworld](https://docs.inworld.ai/tts/tts)
- [API T2A v2 در MiniMax](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP برای TTS در Volcengine](/fa/providers/volcengine#text-to-speech)
- [ترکیب گفتار Xiaomi MiMo](/fa/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [قالب‌های خروجی Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تبدیل متن به گفتار xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## مرتبط

- [نمای کلی رسانه](/fa/tools/media-overview)
- [تولید موسیقی](/fa/tools/music-generation)
- [تولید ویدئو](/fa/tools/video-generation)
- [دستورهای اسلش](/fa/tools/slash-commands)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
