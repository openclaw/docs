---
read_when:
    - فعال‌سازی تبدیل متن به گفتار برای پاسخ‌ها
    - پیکربندی یک ارائه‌دهندهٔ TTS، زنجیرهٔ جایگزین یا پرسونا
    - استفاده از فرمان‌ها یا دستورالعمل‌های /tts
sidebarTitle: Text to speech (TTS)
summary: گفتارِ متن برای پاسخ‌های خروجی — ارائه‌دهندگان، پرسوناها، فرمان‌های اسلش، و خروجی به‌ازای هر کانال
title: تبدیل متن به گفتار
x-i18n:
    generated_at: "2026-06-27T19:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw می‌تواند پاسخ‌های خروجی را با **۱۴ ارائه‌دهنده گفتار** به صدا تبدیل کند
و پیام‌های صوتی بومی را در Feishu، Matrix، Telegram و WhatsApp،
پیوست‌های صوتی را در جاهای دیگر، و جریان‌های PCM/Ulaw را برای تلفنی و Talk تحویل دهد.

TTS نیمه خروجی گفتار در حالت `stt-tts` مربوط به Talk است. نشست‌های Talk از نوع
`realtime` بومی ارائه‌دهنده، گفتار را داخل ارائه‌دهنده realtime می‌سازند
به‌جای اینکه این مسیر TTS را فراخوانی کنند، در حالی که نشست‌های `transcription`
پاسخ صوتی دستیار را تولید نمی‌کنند.

## شروع سریع

<Steps>
  <Step title="انتخاب یک ارائه‌دهنده">
    OpenAI و ElevenLabs مطمئن‌ترین گزینه‌های میزبانی‌شده هستند. Microsoft و
    Local CLI بدون کلید API کار می‌کنند. برای فهرست کامل، [ماتریس ارائه‌دهندگان](#supported-providers)
    را ببینید.
  </Step>
  <Step title="تنظیم کلید API">
    متغیر محیطی ارائه‌دهنده خود را export کنید (برای مثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). Microsoft و Local CLI به کلید نیاز ندارند.
  </Step>
  <Step title="فعال‌سازی در پیکربندی">
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
  <Step title="امتحان در چت">
    `/tts status` وضعیت فعلی را نشان می‌دهد. `/tts audio Hello from OpenClaw`
    یک پاسخ صوتی یک‌باره ارسال می‌کند.
  </Step>
</Steps>

<Note>
Auto-TTS به‌صورت پیش‌فرض **خاموش** است. وقتی `messages.tts.provider` تنظیم نشده باشد،
OpenClaw نخستین ارائه‌دهنده پیکربندی‌شده را طبق ترتیب انتخاب خودکار رجیستری انتخاب می‌کند.
ابزار عامل داخلی `tts` فقط برای قصد صریح است: چت معمولی متنی می‌ماند
مگر اینکه کاربر درخواست صدا بدهد، از `/tts` استفاده کند، یا گفتار Auto-TTS/directive
را فعال کند.
</Note>

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده       | احراز هویت                                                                                                      | نکات                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (همچنین `AZURE_SPEECH_API_KEY`، `SPEECH_KEY`، `SPEECH_REGION`)          | خروجی یادداشت صوتی بومی Ogg/Opus و تلفنی.                                                  |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS سازگار با OpenAI. پیش‌فرض آن `hexgrad/Kokoro-82M` است.                                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` یا `XI_API_KEY`                                                                             | شبیه‌سازی صدا، چندزبانه، قطعی از طریق `seed`؛ برای پخش صوتی Discord به‌صورت جریانی.       |
| **Google Gemini** | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                                                                             | TTS دسته‌ای Gemini API؛ آگاه از پرسونـا از طریق `promptTemplate: "audio-profile-v1"`.       |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | خروجی یادداشت صوتی و تلفنی.                                                               |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API جریانی TTS. یادداشت صوتی بومی Opus و تلفنی PCM.                                       |
| **Local CLI**     | هیچ‌کدام                                                                                                         | یک فرمان TTS محلی پیکربندی‌شده را اجرا می‌کند.                                            |
| **Microsoft**     | هیچ‌کدام                                                                                                         | TTS عصبی عمومی Edge از طریق `node-edge-tts`. بهترین تلاش، بدون SLA.                       |
| **MiniMax**       | `MINIMAX_API_KEY` (یا Token Plan: `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`)      | API نسخه T2A v2. پیش‌فرض آن `speech-2.8-hd` است.                                           |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | برای خلاصه‌سازی خودکار نیز استفاده می‌شود؛ از `instructions` پرسونـا پشتیبانی می‌کند.      |
| **OpenRouter**    | `OPENROUTER_API_KEY` (می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند)                       | مدل پیش‌فرض `hexgrad/kokoro-82m`.                                                          |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token قدیمی: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                                             |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ارائه‌دهنده مشترک تصویر، ویدئو و گفتار.                                                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دسته‌ای xAI. یادداشت صوتی بومی Opus پشتیبانی **نمی‌شود**.                             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS مربوط به MiMo از طریق تکمیل‌های چت Xiaomi.                                             |

اگر چند ارائه‌دهنده پیکربندی شده باشند، مورد انتخاب‌شده ابتدا استفاده می‌شود و
بقیه گزینه‌های پشتیبان هستند. خلاصه‌سازی خودکار از `summaryModel` (یا
`agents.defaults.model.primary`) استفاده می‌کند، بنابراین اگر خلاصه‌ها را فعال نگه می‌دارید
آن ارائه‌دهنده نیز باید احراز هویت شده باشد.

<Warning>
ارائه‌دهنده داخلی **Microsoft** از سرویس آنلاین TTS عصبی Microsoft Edge
از طریق `node-edge-tts` استفاده می‌کند. این یک سرویس وب عمومی بدون SLA
یا سهمیه منتشرشده است؛ آن را بهترین تلاش در نظر بگیرید. شناسه ارائه‌دهنده قدیمی `edge`
به `microsoft` نرمال‌سازی می‌شود و `openclaw doctor --fix` پیکربندی ذخیره‌شده را بازنویسی
می‌کند؛ پیکربندی‌های جدید همیشه باید از `microsoft` استفاده کنند.
</Warning>

## پیکربندی

پیکربندی TTS زیر `messages.tts` در `~/.openclaw/openclaw.json` قرار دارد. یک
پیش‌تنظیم انتخاب کنید و بلوک ارائه‌دهنده را تطبیق دهید:

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
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
  <Tab title="Microsoft (بدون کلید)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

برای Xiaomi `mimo-v2.5-tts-voicedesign`، `speakerVoice` را حذف کنید و `style` را
روی پرامپت طراحی صدا تنظیم کنید. OpenClaw آن پرامپت را به‌عنوان پیام `user` در TTS
می‌فرستد و برای مدل voicedesign مقدار `audio.voice` را ارسال نمی‌کند.

### بازنویسی‌های صدای هر عامل

از `agents.list[].tts` زمانی استفاده کنید که یک عامل باید با ارائه‌دهنده،
صدا، مدل، پرسونا یا حالت auto-TTS متفاوتی صحبت کند. بلوک عامل روی
`messages.tts` به‌صورت deep-merge اعمال می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده می‌توانند در پیکربندی سراسری ارائه‌دهنده بمانند:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

برای ثابت‌کردن یک پرسونا برای هر عامل، `agents.list[].tts.persona` را در کنار پیکربندی ارائه‌دهنده تنظیم کنید؛ این مقدار `messages.tts.persona` سراسری را فقط برای همان عامل بازنویسی می‌کند.

ترتیب اولویت برای پاسخ‌های خودکار، `/tts audio`، `/tts status` و ابزار عامل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` فعال
3. بازنویسی کانال، وقتی کانال از `channels.<channel>.tts` پشتیبانی می‌کند
4. بازنویسی حساب، وقتی کانال `channels.<channel>.accounts.<id>.tts` را ارسال می‌کند
5. ترجیحات محلی `/tts` برای این میزبان
6. دستورالعمل‌های درون‌خطی `[[tts:...]]` وقتی [بازنویسی‌های مدل](#model-driven-directives) فعال باشند

بازنویسی‌های کانال و حساب همان شکل `messages.tts` را دارند و
به‌صورت deep-merge روی لایه‌های قبلی اعمال می‌شوند، بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده می‌توانند در
`messages.tts` بمانند، در حالی‌که یک کانال یا حساب ربات فقط صدای گوینده، مدل، پرسونا
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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## پرسوناها

یک **پرسونا** هویت گفتاری پایداری است که می‌تواند به‌صورت قطعی
در میان ارائه‌دهنده‌ها اعمال شود. می‌تواند یک ارائه‌دهنده را ترجیح دهد، نیت پرامپت
بی‌طرف نسبت به ارائه‌دهنده را تعریف کند، و اتصال‌های اختصاصی ارائه‌دهنده برای صداها، مدل‌ها، قالب‌های پرامپت،
seedها و تنظیمات صدا را حمل کند.

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### پرسونای کامل (پرامپت بی‌طرف نسبت به ارائه‌دهنده)

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
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### حل‌کردن پرسونا

پرسونای فعال به‌صورت قطعی انتخاب می‌شود:

1. ترجیح محلی `/tts persona <id>`، اگر تنظیم شده باشد.
2. `messages.tts.persona`، اگر تنظیم شده باشد.
3. بدون پرسونا.

انتخاب ارائه‌دهنده با اولویت صریح اجرا می‌شود:

1. بازنویسی‌های مستقیم (CLI، Gateway، Talk، دستورالعمل‌های مجاز TTS).
2. ترجیح محلی `/tts provider <id>`.
3. `provider` پرسونای فعال.
4. `messages.tts.provider`.
5. انتخاب خودکار رجیستری.

برای هر تلاش ارائه‌دهنده، OpenClaw پیکربندی‌ها را به این ترتیب ادغام می‌کند:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. بازنویسی‌های درخواست قابل اعتماد
4. بازنویسی‌های دستورالعمل TTS صادرشده توسط مدل و مجاز

### ارائه‌دهنده‌ها چگونه از پرامپت‌های پرسونا استفاده می‌کنند

فیلدهای پرامپت پرسونا (`profile`، `scene`، `sampleContext`، `style`، `accent`،
`pacing`، `constraints`) **بی‌طرف نسبت به ارائه‌دهنده** هستند. هر ارائه‌دهنده تصمیم می‌گیرد
چگونه از آن‌ها استفاده کند:

<AccordionGroup>
  <Accordion title="Google Gemini">
    فیلدهای پرامپت پرسونا را **فقط وقتی** در ساختار پرامپت Gemini TTS می‌پیچد
    که پیکربندی مؤثر ارائه‌دهنده Google مقدار `promptTemplate: "audio-profile-v1"`
    یا `personaPrompt` را تنظیم کرده باشد. فیلدهای قدیمی‌تر `audioProfile` و `speakerName`
    همچنان به‌عنوان متن پرامپت اختصاصی Google در ابتدا افزوده می‌شوند. تگ‌های صوتی درون‌خطی مانند
    `[whispers]` یا `[laughs]` داخل یک بلوک `[[tts:text]]` در
    رونویسی Gemini حفظ می‌شوند؛ OpenClaw این تگ‌ها را تولید نمی‌کند.
  </Accordion>
  <Accordion title="OpenAI">
    فیلدهای پرامپت پرسونا را **فقط وقتی** به فیلد `instructions` درخواست نگاشت می‌کند
    که هیچ `instructions` صریحی برای OpenAI پیکربندی نشده باشد. `instructions` صریح
    همیشه برنده است.
  </Accordion>
  <Accordion title="Other providers">
    فقط از اتصال‌های اختصاصی ارائه‌دهنده برای پرسونا زیر
    `personas.<id>.providers.<provider>` استفاده می‌کنند. فیلدهای پرامپت پرسونا نادیده گرفته می‌شوند
    مگر اینکه ارائه‌دهنده نگاشت پرامپت پرسونا خودش را پیاده‌سازی کند.
  </Accordion>
</AccordionGroup>

### سیاست جایگزینی

`fallbackPolicy` رفتار را زمانی کنترل می‌کند که یک پرسونا برای ارائه‌دهنده
مورد تلاش **هیچ اتصالی** نداشته باشد:

| سیاست              | رفتار                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **پیش‌فرض.** فیلدهای پرامپت بی‌طرف نسبت به ارائه‌دهنده در دسترس می‌مانند؛ ارائه‌دهنده ممکن است از آن‌ها استفاده کند یا نادیده‌شان بگیرد.                                            |
| `provider-defaults` | پرسونا برای آن تلاش از آماده‌سازی پرامپت حذف می‌شود؛ ارائه‌دهنده از پیش‌فرض‌های خنثای خود استفاده می‌کند، در حالی‌که جایگزینی به ارائه‌دهنده‌های دیگر ادامه می‌یابد. |
| `fail`              | آن تلاش ارائه‌دهنده را با `reasonCode: "not_configured"` و `personaBinding: "missing"` رد می‌کند. ارائه‌دهنده‌های جایگزین همچنان امتحان می‌شوند.              |

کل درخواست TTS فقط زمانی شکست می‌خورد که **همه** ارائه‌دهنده‌های امتحان‌شده رد شوند
یا شکست بخورند.

انتخاب ارائه‌دهنده جلسه Talk در محدوده جلسه است. یک کلاینت Talk باید شناسه‌های
ارائه‌دهنده، شناسه‌های مدل، شناسه‌های صدا و localeها را از `talk.catalog` انتخاب کند و آن‌ها را
از طریق جلسه Talk یا درخواست handoff ارسال کند. بازکردن یک جلسه صوتی نباید
`messages.tts` یا پیش‌فرض‌های سراسری ارائه‌دهنده Talk را تغییر دهد.

## دستورالعمل‌های هدایت‌شده با مدل

به‌صورت پیش‌فرض، دستیار **می‌تواند** دستورالعمل‌های `[[tts:...]]` را برای بازنویسی
صدا، مدل یا سرعت برای یک پاسخ واحد صادر کند، به‌همراه یک بلوک اختیاری
`[[tts:text]]...[[/tts:text]]` برای نشانه‌های بیانی که باید فقط در
صوت ظاهر شوند:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

وقتی `messages.tts.auto` برابر `"tagged"` باشد، برای فعال‌کردن
صوت **دستورالعمل‌ها لازم هستند**. تحویل بلوک استریم‌شده، دستورالعمل‌ها را پیش از آنکه
کانال آن‌ها را ببیند از متن قابل مشاهده حذف می‌کند، حتی وقتی بین بلوک‌های مجاور تقسیم شده باشند.

`provider=...` نادیده گرفته می‌شود مگر اینکه `modelOverrides.allowProvider: true` باشد. وقتی یک
پاسخ `provider=...` را اعلام می‌کند، کلیدهای دیگر آن دستورالعمل
فقط توسط همان ارائه‌دهنده تحلیل می‌شوند؛ کلیدهای پشتیبانی‌نشده حذف شده و به‌عنوان هشدارهای دستورالعمل
TTS گزارش می‌شوند.

**کلیدهای دستورالعمل موجود:**

- `provider` (شناسه ارائه‌دهنده ثبت‌شده؛ نیازمند `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (نام‌های مستعار قدیمی: `voice`، `voiceName`، `voice_name`، `google_voice`، `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم صدای MiniMax، 0–10)
- `pitch` (زیر و بمی عدد صحیح MiniMax، −12 تا 12؛ مقادیر اعشاری بریده می‌شوند)
- `emotion` (تگ احساس Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**غیرفعال‌کردن کامل بازنویسی‌های مدل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**اجازه‌دادن به تغییر ارائه‌دهنده در حالی‌که سایر کنترل‌ها قابل پیکربندی می‌مانند:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## فرمان‌های اسلش

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
فرمان‌ها به یک فرستنده مجاز نیاز دارند (قوانین allowlist/owner اعمال می‌شوند) و یا
`commands.text` یا ثبت فرمان بومی باید فعال باشد.
</Note>

نکات رفتاری:

- `/tts on` ترجیح محلی TTS را روی `always` می‌نویسد؛ `/tts off` آن را روی `off` می‌نویسد.
- `/tts chat on|off|default` یک بازنویسی auto-TTS در محدوده جلسه برای چت فعلی می‌نویسد.
- `/tts persona <id>` ترجیح محلی پرسونا را می‌نویسد؛ `/tts persona off` آن را پاک می‌کند.
- `/tts latest` آخرین پاسخ دستیار را از رونویسی جلسه فعلی می‌خواند و آن را یک‌بار به‌صورت صوتی ارسال می‌کند. فقط یک هش از آن پاسخ را در ورودی جلسه ذخیره می‌کند تا ارسال‌های صوتی تکراری را سرکوب کند.
- `/tts audio` یک پاسخ صوتی یک‌باره تولید می‌کند (TTS را روشن نمی‌کند).
- `limit` و `summary` در **ترجیحات محلی** ذخیره می‌شوند، نه پیکربندی اصلی.
- `/tts status` شامل عیب‌یابی جایگزینی برای آخرین تلاش است — `Fallback: <primary> -> <used>`، `Attempts: ...` و جزئیات هر تلاش (`provider:outcome(reasonCode) latency`).
- `/status` حالت فعال TTS به‌همراه ارائه‌دهنده، مدل، صدا و فراداده پاک‌سازی‌شده endpoint سفارشی پیکربندی‌شده را وقتی TTS فعال است نشان می‌دهد.

## ترجیحات هر کاربر

فرمان‌های اسلش بازنویسی‌های محلی را در `prefsPath` می‌نویسند. مقدار پیش‌فرض
`~/.openclaw/settings/tts.json` است؛ با متغیر محیطی `OPENCLAW_TTS_PREFS`
یا `messages.tts.prefsPath` آن را بازنویسی کنید.

| فیلد ذخیره‌شده | اثر                                       |
| ------------ | -------------------------------------------- |
| `auto`       | بازنویسی محلی auto-TTS (`always`، `off`، …) |
| `provider`   | بازنویسی ارائه‌دهنده اصلی محلی              |
| `persona`    | بازنویسی پرسونای محلی                       |
| `maxLength`  | آستانه خلاصه‌سازی (پیش‌فرض `1500` نویسه)     |
| `summarize`  | تغییر وضعیت خلاصه‌سازی (پیش‌فرض `true`)              |

این‌ها پیکربندی مؤثر از `messages.tts` به‌همراه بلوک فعال
`agents.list[].tts` را برای آن میزبان بازنویسی می‌کنند.

## قالب‌های خروجی (ثابت)

تحویل صدای TTS بر اساس قابلیت کانال هدایت می‌شود. Pluginهای کانال اعلام می‌کنند
که آیا TTS سبک voice باید از ارائه‌دهنده‌ها هدف بومی `voice-note` بخواهد یا
سنتز معمول `audio-file` را حفظ کند و فقط خروجی سازگار را برای تحویل صوتی
علامت‌گذاری کند.

- **کانال‌های دارای قابلیت یادداشت صوتی**: پاسخ‌های یادداشت صوتی Opus را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI).
  - 48kHz / 64kbps توازن خوبی برای پیام صوتی است.
- **Feishu / WhatsApp**: وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A
  یا یک فایل صوتی محتمل دیگر تولید می‌شود، Plugin کانال پیش از ارسال پیام صوتی بومی، آن را با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌کند. WhatsApp
  نتیجه را از طریق payload‏ `audio` در Baileys با `ptt: true` و
  `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد، Feishu فایل اصلی را
  به‌عنوان پیوست دریافت می‌کند؛ ارسال WhatsApp به‌جای ارسال یک payload ناسازگار
  PTT ناموفق می‌شود.
- **کانال‌های دیگر**: MP3 (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI).
  - 44.1kHz / 128kbps توازن پیش‌فرض برای وضوح گفتار است.
- **MiniMax**: MP3 (مدل `speech-2.8-hd`، نرخ نمونه‌برداری 32kHz) برای پیوست‌های صوتی عادی. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام می‌کند، OpenClaw پیش از تحویل، MP3 MiniMax را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **Xiaomi MiMo**: به‌طور پیش‌فرض MP3، یا در صورت پیکربندی WAV. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام می‌کند، OpenClaw پیش از تحویل، خروجی Xiaomi را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **CLI محلی**: از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی
  به Ogg/Opus تبدیل می‌شوند و خروجی تلفنی با `ffmpeg` به PCM خام مونو 16 kHz
  تبدیل می‌شود.
- **Google Gemini**: TTS در Gemini API‏ PCM خام 24kHz برمی‌گرداند. OpenClaw آن را برای پیوست‌های صوتی به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48kHz تبدیل می‌کند، و برای Talk/تلفنی مستقیما PCM برمی‌گرداند.
- **Gradium**: WAV برای پیوست‌های صوتی، Opus برای مقصدهای یادداشت صوتی، و `ulaw_8000` با 8 kHz برای تلفنی.
- **Inworld**: MP3 برای پیوست‌های صوتی عادی، `OGG_OPUS` بومی برای مقصدهای یادداشت صوتی، و `PCM` خام با 22050 Hz برای Talk/تلفنی.
- **xAI**: به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3`، `wav`، `pcm`، `mulaw`، یا `alaw` باشد. OpenClaw از endpoint دسته‌ای REST TTS در xAI استفاده می‌کند و یک پیوست صوتی کامل برمی‌گرداند؛ WebSocket استریمینگ TTS در xAI در این مسیر ارائه‌دهنده استفاده نمی‌شود. قالب بومی Opus برای یادداشت صوتی در این مسیر پشتیبانی نمی‌شود.
- **Microsoft**: از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).
  - انتقال بسته‌بندی‌شده یک `outputFormat` می‌پذیرد، اما همه قالب‌ها از سرویس در دسترس نیستند.
  - مقادیر قالب خروجی از قالب‌های خروجی Microsoft Speech پیروی می‌کنند (از جمله Ogg/WebM Opus).
  - `sendVoice` در Telegram‏ OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus
    تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید.
  - اگر قالب خروجی پیکربندی‌شده Microsoft ناموفق باشد، OpenClaw با MP3 دوباره تلاش می‌کند.

قالب‌های خروجی OpenAI/ElevenLabs برای هر کانال ثابت هستند (بالا را ببینید).

## رفتار Auto-TTS

وقتی `messages.tts.auto` فعال باشد، OpenClaw:

- اگر پاسخ از قبل رسانه ساختاریافته داشته باشد، TTS را رد می‌کند.
- پاسخ‌های بسیار کوتاه را رد می‌کند (کمتر از 10 نویسه).
- وقتی خلاصه‌ها فعال باشند، پاسخ‌های بلند را با استفاده از
  `summaryModel` (یا `agents.defaults.model.primary`) خلاصه می‌کند.
- صوت تولیدشده را به پاسخ پیوست می‌کند.
- در `mode: "final"`، پس از کامل شدن جریان متن، همچنان برای پاسخ‌های نهایی استریم‌شده TTS فقط صوتی ارسال می‌کند؛ رسانه تولیدشده همان نرمال‌سازی رسانه کانال را طی می‌کند که پیوست‌های پاسخ عادی طی می‌کنند.

اگر پاسخ از `maxLength` بیشتر باشد و خلاصه خاموش باشد (یا کلید API برای
مدل خلاصه وجود نداشته باشد)، صوت رد می‌شود و پاسخ متنی عادی ارسال می‌شود.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## قالب‌های خروجی بر اساس کانال

  | هدف                                  | قالب                                                                                                                                                          |
  | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | پاسخ‌های یادداشت صوتی **Opus** را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI). 48 kHz / 64 kbps شفافیت و اندازه را متعادل می‌کند. |
  | کانال‌های دیگر                       | **MP3** (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI). 44.1 kHz / 128 kbps پیش‌فرض برای گفتار است.                                                        |
  | گفت‌وگو / تلفن                       | **PCM** بومی ارائه‌دهنده (Inworld 22050 Hz، Google 24 kHz)، یا `ulaw_8000` از Gradium برای تلفن.                                                             |

  یادداشت‌های هر ارائه‌دهنده:

  - **تبدیل کدک Feishu / WhatsApp:** وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A برسد، Plugin کانال با `ffmpeg` آن را به 48 kHz Ogg/Opus تبدیل می‌کند. WhatsApp از طریق Baileys با `ptt: true` و `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل شکست بخورد: Feishu به پیوست‌کردن فایل اصلی بازمی‌گردد؛ ارسال WhatsApp به‌جای انتشار یک payload ناسازگار PTT شکست می‌خورد.
  - **MiniMax / Xiaomi MiMo:** MP3 پیش‌فرض (32 kHz برای MiniMax `speech-2.8-hd`)؛ برای هدف‌های یادداشت صوتی از طریق `ffmpeg` به 48 kHz Opus تبدیل می‌شود.
  - **CLI محلی:** از `outputFormat` پیکربندی‌شده استفاده می‌کند. هدف‌های یادداشت صوتی به Ogg/Opus و خروجی تلفن به PCM خام 16 kHz مونو تبدیل می‌شوند.
  - **Google Gemini:** PCM خام 24 kHz برمی‌گرداند. OpenClaw برای پیوست‌ها آن را به‌صورت WAV بسته‌بندی می‌کند، برای هدف‌های یادداشت صوتی به 48 kHz Opus تبدیل می‌کند، و برای گفت‌وگو/تلفن PCM را مستقیم برمی‌گرداند.
  - **Inworld:** پیوست‌های MP3، یادداشت صوتی بومی `OGG_OPUS`، `PCM` خام 22050 Hz برای گفت‌وگو/تلفن.
  - **xAI:** به‌صورت پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3|wav|pcm|mulaw|alaw` باشد. از endpoint دسته‌ای REST متعلق به xAI استفاده می‌کند — TTS جریانی WebSocket استفاده **نمی‌شود**. قالب بومی Opus برای یادداشت صوتی پشتیبانی **نمی‌شود**.
  - **Microsoft:** از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید از OpenAI/ElevenLabs استفاده کنید. اگر قالب پیکربندی‌شده Microsoft شکست بخورد، OpenClaw با MP3 دوباره تلاش می‌کند.

  قالب‌های خروجی OpenAI و ElevenLabs برای هر کانال مطابق فهرست بالا ثابت هستند.

  ## مرجع فیلدها

  <AccordionGroup>
  <Accordion title="پیام‌های سطح بالای messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      حالت Auto-TTS. `inbound` فقط پس از یک پیام صوتی ورودی، صدا ارسال می‌کند؛ `tagged` فقط وقتی صدا ارسال می‌کند که پاسخ شامل دستورهای `[[tts:...]]` یا یک بلوک `[[tts:text]]` باشد.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      تغییر وضعیت قدیمی. `openclaw doctor --fix` این را به `auto` مهاجرت می‌دهد.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` علاوه بر پاسخ‌های نهایی، پاسخ‌های ابزار/بلوک را نیز شامل می‌شود.
    </ParamField>
    <ParamField path="provider" type="string">
      شناسه ارائه‌دهنده گفتار. وقتی تنظیم نشده باشد، OpenClaw نخستین ارائه‌دهنده پیکربندی‌شده را در ترتیب انتخاب خودکار رجیستری استفاده می‌کند. `provider: "edge"` قدیمی توسط `openclaw doctor --fix` به `"microsoft"` بازنویسی می‌شود.
    </ParamField>
    <ParamField path="persona" type="string">
      شناسه پرسونای فعال از `personas`. به حروف کوچک نرمال‌سازی می‌شود.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هویت گفتاری پایدار. فیلدها: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. [پرسوناها](#personas) را ببینید.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      مدل ارزان برای خلاصه‌سازی خودکار؛ پیش‌فرض `agents.defaults.model.primary` است. `provider/model` یا یک alias مدل پیکربندی‌شده را می‌پذیرد.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      اجازه می‌دهد مدل دستورهای TTS تولید کند. `enabled` پیش‌فرض `true` دارد؛ `allowProvider` پیش‌فرض `false` دارد.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      تنظیمات متعلق به ارائه‌دهنده که با شناسه ارائه‌دهنده گفتار کلیدگذاری شده‌اند. بلوک‌های مستقیم قدیمی (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`) توسط `openclaw doctor --fix` بازنویسی می‌شوند؛ فقط `messages.tts.providers.<id>` را commit کنید.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      سقف سخت برای تعداد نویسه‌های ورودی TTS. اگر از آن فراتر رود، `/tts audio` شکست می‌خورد.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      timeout درخواست بر حسب میلی‌ثانیه.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      مسیر JSON ترجیحات محلی را override می‌کند (ارائه‌دهنده/محدودیت/خلاصه). پیش‌فرض `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقه Azure Speech (مثلاً `eastus`). Env: `AZURE_SPEECH_REGION` یا `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">override اختیاری endpoint در Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName صدای Azure. پیش‌فرض `en-US-JennyNeural`. alias قدیمی: `voice`.</ParamField>
    <ParamField path="lang" type="string">کد زبان SSML. پیش‌فرض `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` مربوط به Azure برای صدای استاندارد. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` مربوط به Azure برای خروجی یادداشت صوتی. پیش‌فرض `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">به `ELEVENLABS_API_KEY` یا `XI_API_KEY` بازمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل (مثلاً `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">شناسه صدای ElevenLabs. alias قدیمی: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (هرکدام `0..1`)، `useSpeakerBoost` (`true|false`)، `speed` (`0.5..2.0`، `1.0` = عادی).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>حالت نرمال‌سازی متن.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 دوحرفی (مثلاً `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحیح `0..4294967295` برای قطعیت به‌شکل best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">URL پایه API مربوط به ElevenLabs را override می‌کند.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">به `GEMINI_API_KEY` / `GOOGLE_API_KEY` بازمی‌گردد. اگر حذف شود، TTS می‌تواند پیش از fallback به env، از `models.providers.google.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="model" type="string">مدل TTS در Gemini. پیش‌فرض `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">نام صدای آماده Gemini. پیش‌فرض `Kore`. aliasهای قدیمی: `voiceName`، `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">prompt سبک به زبان طبیعی که پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="speakerName" type="string">برچسب اختیاری گوینده که وقتی prompt شما از گوینده نام‌دار استفاده می‌کند، پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>برای بسته‌بندی فیلدهای prompt پرسونای فعال در ساختار prompt قطعی Gemini TTS، روی `audio-profile-v1` تنظیم کنید.</ParamField>
    <ParamField path="personaPrompt" type="string">متن prompt پرسونای اضافی ویژه Google که به یادداشت‌های کارگردان در template افزوده می‌شود.</ParamField>
    <ParamField path="baseUrl" type="string">فقط `https://generativelanguage.googleapis.com` پذیرفته می‌شود.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغیر محیطی: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">پیش‌فرض Emma (`YTpq7expH9539ERJ`). نام مستعار قدیمی: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld اصلی

    <ParamField path="apiKey" type="string">متغیر محیطی: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">پیش‌فرض `inworld-tts-1.5-max`. همچنین: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">پیش‌فرض `Sarah`. نام مستعار قدیمی: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">دمای نمونه‌گیری `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI محلی (tts-local-cli)">
    <ParamField path="command" type="string">فایل اجرایی محلی یا رشته فرمان برای TTS از طریق CLI.</ParamField>
    <ParamField path="args" type="string[]">آرگومان‌های فرمان. از جایگزین‌های `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}` پشتیبانی می‌کند.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>قالب خروجی مورد انتظار CLI. پیش‌فرض `mp3` برای پیوست‌های صوتی.</ParamField>
    <ParamField path="timeoutMs" type="number">زمان انقضای فرمان بر حسب میلی‌ثانیه. پیش‌فرض `120000`.</ParamField>
    <ParamField path="cwd" type="string">دایرکتوری کاری اختیاری فرمان.</ParamField>
    <ParamField path="env" type="Record<string, string>">بازنویسی‌های اختیاری محیط برای فرمان.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (بدون کلید API)">
    <ParamField path="enabled" type="boolean" default="true">اجازه استفاده از گفتار Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">نام صدای عصبی Microsoft (مثلاً `en-US-MichelleNeural`). نام مستعار قدیمی: `voice`.</ParamField>
    <ParamField path="lang" type="string">کد زبان (مثلاً `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">قالب خروجی Microsoft. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`. همه قالب‌ها توسط انتقال همراه مبتنی بر Edge پشتیبانی نمی‌شوند.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">رشته‌های درصدی (مثلاً `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">زیرنویس‌های JSON را کنار فایل صوتی بنویس.</ParamField>
    <ParamField path="proxy" type="string">URL پراکسی برای درخواست‌های گفتار Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">بازنویسی زمان انقضای درخواست (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>نام مستعار قدیمی. `openclaw doctor --fix` را اجرا کنید تا پیکربندی پایدارشده به `providers.microsoft` بازنویسی شود.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">در صورت نبود، از `MINIMAX_API_KEY` استفاده می‌کند. احراز هویت Token Plan از طریق `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، یا `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.minimax.io`. متغیر محیطی: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `speech-2.8-hd`. متغیر محیطی: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">پیش‌فرض `English_expressive_narrator`. متغیر محیطی: `MINIMAX_TTS_VOICE_ID`. نام مستعار قدیمی: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحیح `-12..12`. پیش‌فرض `0`. مقدارهای اعشاری پیش از درخواست کوتاه می‌شوند.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">در صورت نبود، از `OPENAI_API_KEY` استفاده می‌کند.</ParamField>
    <ParamField path="model" type="string">شناسه مدل TTS متعلق به OpenAI (مثلاً `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">نام صدا (مثلاً `alloy`، `cedar`). نام مستعار قدیمی: `voice`.</ParamField>
    <ParamField path="instructions" type="string">فیلد صریح `instructions` متعلق به OpenAI. وقتی تنظیم شود، فیلدهای پرامپت پرسونا به‌طور خودکار نگاشت **نمی‌شوند**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">فیلدهای JSON اضافی که پس از فیلدهای تولیدشده TTS متعلق به OpenAI در بدنه‌های درخواست `/audio/speech` ادغام می‌شوند. از این گزینه برای نقاط پایانی سازگار با OpenAI مانند Kokoro که به کلیدهای ویژه ارائه‌دهنده مانند `lang` نیاز دارند استفاده کنید؛ کلیدهای ناامن prototype نادیده گرفته می‌شوند.</ParamField>
    <ParamField path="baseUrl" type="string">
      نقطه پایانی TTS متعلق به OpenAI را بازنویسی کنید. ترتیب حل: پیکربندی ← `OPENAI_TTS_BASE_URL` ← `https://api.openai.com/v1`. مقدارهای غیرپیش‌فرض به‌عنوان نقاط پایانی TTS سازگار با OpenAI در نظر گرفته می‌شوند، بنابراین نام‌های سفارشی مدل و صدا پذیرفته می‌شوند.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغیر محیطی: `OPENROUTER_API_KEY`. می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://openrouter.ai/api/v1`. مقدار قدیمی `https://openrouter.ai/v1` نرمال‌سازی می‌شود.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `hexgrad/kokoro-82m`. نام مستعار: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">پیش‌فرض `af_alloy`. نام‌های مستعار قدیمی: `voice`، `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغیر محیطی: `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">پیش‌فرض `seed-tts-1.0`. متغیر محیطی: `VOLCENGINE_TTS_RESOURCE_ID`. وقتی پروژه شما مجوز TTS 2.0 دارد، از `seed-tts-2.0` استفاده کنید.</ParamField>
    <ParamField path="appKey" type="string">سرآیند کلید برنامه. پیش‌فرض `aGjiRDfUWi`. متغیر محیطی: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">نقطه پایانی HTTP متعلق به Seed Speech TTS را بازنویسی کنید. متغیر محیطی: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">نوع صدا. پیش‌فرض `en_female_anna_mars_bigtts`. متغیر محیطی: `VOLCENGINE_TTS_VOICE`. نام مستعار قدیمی: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبت سرعت بومی ارائه‌دهنده.</ParamField>
    <ParamField path="emotion" type="string">برچسب احساس بومی ارائه‌دهنده.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>فیلدهای قدیمی Volcengine Speech Console. متغیرهای محیطی: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (پیش‌فرض `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغیر محیطی: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.x.ai/v1`. متغیر محیطی: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">پیش‌فرض `eve`. صداهای زنده: `ara`، `eve`، `leo`، `rex`، `sal`، `una`. نام مستعار قدیمی: `voiceId`.</ParamField>
    <ParamField path="language" type="string">کد زبان BCP-47 یا `auto`. پیش‌فرض `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغیر محیطی: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.xiaomimimo.com/v1`. متغیر محیطی: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `mimo-v2.5-tts`. متغیر محیطی: `XIAOMI_TTS_MODEL`. همچنین از `mimo-v2-tts` و `mimo-v2.5-tts-voicedesign` پشتیبانی می‌کند.</ParamField>
    <ParamField path="speakerVoice" type="string">پیش‌فرض `mimo_default` برای مدل‌های صدای ازپیش‌تنظیم‌شده. متغیر محیطی: `XIAOMI_TTS_VOICE`. نام مستعار قدیمی: `voice`. برای `mimo-v2.5-tts-voicedesign` ارسال نمی‌شود.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>پیش‌فرض `mp3`. متغیر محیطی: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">دستور سبک اختیاری به زبان طبیعی که به‌عنوان پیام کاربر ارسال می‌شود؛ خوانده نمی‌شود. برای `mimo-v2.5-tts-voicedesign`، این همان پرامپت طراحی صدا است؛ OpenClaw وقتی حذف شود یک پیش‌فرض فراهم می‌کند.</ParamField>
  </Accordion>
</AccordionGroup>

## ابزار عامل

ابزار `tts` متن را به گفتار تبدیل می‌کند و یک پیوست صوتی برای تحویل پاسخ برمی‌گرداند. در Feishu، Matrix، Telegram و WhatsApp، صدا به‌جای پیوست فایل، به‌صورت پیام صوتی تحویل داده می‌شود. Feishu و WhatsApp وقتی `ffmpeg` در دسترس باشد می‌توانند خروجی TTS غیر Opus را در این مسیر ترنسکد کنند.

WhatsApp صدا را از طریق Baileys به‌صورت یادداشت صوتی PTT (`audio` با `ptt: true`) می‌فرستد و متن قابل مشاهده را **جداگانه** از صدای PTT ارسال می‌کند، چون کلاینت‌ها کپشن‌ها را روی یادداشت‌های صوتی به‌صورت یکنواخت نمایش نمی‌دهند.

این ابزار فیلدهای اختیاری `channel` و `timeoutMs` را می‌پذیرد؛ `timeoutMs` زمان انقضای درخواست ارائه‌دهنده برای هر فراخوانی بر حسب میلی‌ثانیه است. مقدارهای هر فراخوانی، `messages.tts.timeoutMs` را بازنویسی می‌کنند؛ زمان‌های انقضای پیکربندی‌شده TTS هر پیش‌فرض ارائه‌دهنده‌ای را که توسط Plugin نوشته شده باشد بازنویسی می‌کنند.

## RPC Gateway

| روش            | هدف                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | وضعیت فعلی TTS و آخرین تلاش را بخوان. |
| `tts.enable`      | ترجیح خودکار محلی را روی `always` تنظیم کن.   |
| `tts.disable`     | ترجیح خودکار محلی را روی `off` تنظیم کن.      |
| `tts.convert`     | تبدیل یک‌باره متن ← صدا.                    |
| `tts.setProvider` | ترجیح ارائه‌دهنده محلی را تنظیم کن.           |
| `tts.setPersona`  | ترجیح پرسونای محلی را تنظیم کن.            |
| `tts.providers`   | ارائه‌دهندگان پیکربندی‌شده و وضعیت را فهرست کن.    |

## پیوندهای سرویس

- [راهنمای تبدیل متن به گفتار OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع Audio API متعلق به OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تبدیل متن به گفتار Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ارائه‌دهنده Azure Speech](/fa/providers/azure-speech)
- [تبدیل متن به گفتار ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [احراز هویت ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fa/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/fa/providers/volcengine#text-to-speech)
- [ترکیب گفتار Xiaomi MiMo](/fa/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [قالب‌های خروجی Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تبدیل متن به گفتار xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## مرتبط

- [نمای کلی رسانه](/fa/tools/media-overview)
- [تولید موسیقی](/fa/tools/music-generation)
- [تولید ویدیو](/fa/tools/video-generation)
- [دستورهای اسلش](/fa/tools/slash-commands)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
